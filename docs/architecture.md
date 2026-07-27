# PointsWise — High-Level Architecture

Deliberately small: **two Workers, one Durable Object class, shared libraries, one D1.**
We split by *data ownership and trust boundary*, not by feature. A component becomes a
separate service only when a platform constraint forces it (e.g. inbound email must land
on an Email Worker) — never for organizational neatness.

## Components

```
                        ┌─────────────────────────────────────────────┐
                        │  points-wise (Worker — Next.js via OpenNext)│
  Browser ──────────────▶  UI + API routes                            │
                        │  • next-auth (Discord) — login gate         │
                        │  • AUTHZ: every request authorized HERE     │
                        │    (session → ULID; tier re-read from D1)   │
                        │  • directory + catalog reads (D1)           │
                        │  • hosts the LedgerDO class                 │
                        └───────┬──────────────────────────┬──────────┘
                                │ RPC (per-user, by ULID)  │ SQL
                                ▼                          ▼
                  ┌──────────────────────────┐   ┌───────────────────────┐
                  │  LedgerDO (one per user) │   │  D1 (shared, small)   │
                  │  id = users.id (ULID)    │   │  • users / households │
                  │  • beancount ledger:     │   │    / memberships      │
                  │    txns, postings,       │   │    (directory+authz)  │
                  │    balances, captures    │   │  • catalog_* (banks,  │
                  │  • runs earn-engine +    │   │    cards, pools, earn │
                  │    validators on EVERY   │   │    rules — reference) │
                  │    write (fail-closed)   │   └───────────────────────┘
                  │  • reconciliation state  │
                  └──────────▲───────────────┘   ┌───────────────────────┐
                             │ RPC (capture)     │  R2 (M5+)             │
                  ┌──────────┴───────────────┐   │  statement PDFs /     │
                  │  points-wise-ingest      │   │  raw artifacts        │
                  │  (Worker — M4+)          │   └───────────────────────┘
   email ─────────▶  • Email Routing handler │
   telegram ──────▶  • Telegram webhook      │   Workers AI (via Gateway):
                  │  • channel identity →    │   extraction ONLY (messy
                  │    ULID lookup (D1)      │   email/PDF → fields); its
                  │  • normalize → Capture   │   output always re-validated
                  └──────────────────────────┘   by the deterministic engine
```

### 1. `points-wise` — the app Worker (exists today)

Next.js on Cloudflare via OpenNext. The front door and the **only trust boundary**:

- Auth (next-auth + Discord role→tier) and provisioning (D1).
- **All authorization decisions live here** — session → server-only ULID, tier re-read
  from D1 for writes, family relationship checks. DOs never authorize
  (a DO cannot authenticate its caller; anything reaching a DO is already authorized).
- Serves UI + API; reads directory + catalog from D1; talks to per-user DOs over RPC.
- Hosts the `LedgerDO` class definition (OpenNext worker with the DO class injected
  post-build, as milesvault does).

### 2. `LedgerDO` — one Durable Object per user (M2)

Keyed by the user's ULID (`idFromName(ulid)`). Owns **that user's ledger** in DO-embedded
SQLite: opened accounts, beancount-shaped transactions/postings (multi-commodity:
INR + points tickers), running balances, the ingestion captures inbox, and
reconciliation results.

Why a DO: single-writer serialization per user (no write races), strong consistency,
per-user isolation for free, and horizontal scale by construction.

**The DO is the single choke point for writes.** Every path — manual entry, email,
telegram, statement import — converges on the same RPC (`ingest / postEntry`), and the
DO runs the **earn engine + beancount validators** (libraries, in-process) before
persisting. Callers pass the resolved catalog rules in; invalid entries bounce with
reasons. Nothing malformed can be stored, regardless of source.

Cross-member ("assume role") reads: app Worker checks D1 (is caller the family owner of
this member?) → resolves opaque `membershipId` → member ULID server-side → **read-only**
RPC to that member's DO. The ULID never crosses the wire.

### 3. `points-wise-ingest` — the channels Worker (M4)

Exists because inbound email *must* terminate on a Worker with an `email` handler
(OpenNext controls the app Worker's entrypoint, so channels get their own tiny Worker).
Stateless adapters only — **no business logic**:

- **Email**: Cloudflare Email Routing → per-user forwarding alias
  (`u-<token>@in.<domain>`) → parse (postal-mime) → resolve token→ULID (D1) →
  normalized Capture → RPC to that user's LedgerDO.
- **Telegram**: bot webhook → verify secret → chat-id→ULID pairing (D1, paired once
  from the app UI) → same Capture path.
- Extraction may use Workers AI for messy payloads; the LLM only proposes *fields* —
  the deterministic engine + validators in the DO remain the gate.

Captures land in the user's inbox (in their DO) as drafts; the user reviews/approves in
the app; approval posts them through the same validated write path.

### 4. Shared libraries (same repo — seams, not services)

| Library           | Responsibility                                                              |
| ----------------- | --------------------------------------------------------------------------- |
| `beancount-core`  | Entry/posting model, serialization, validators (zero-sum per commodity, account shapes, commodity constraints) |
| `earn-engine`     | Pure function: (txn, card rules, period state) → points/cashback legs + surcharge split. Deterministic, fully unit-tested |
| `catalog`         | Zod schemas (`Card`, `RewardPool`, `EarnRule` — versioned `effectiveFrom`) + repo seed data (`data/banks/*`) + loader into D1; CI-validated |
| `db`              | Drizzle schema/queries for the directory (exists today)                     |

### 5. Platform pieces

| Piece        | Use                                                            | When |
| ------------ | -------------------------------------------------------------- | ---- |
| D1           | Directory (users/households/memberships) + catalog reference   | now  |
| DO storage   | Per-user ledger (SQLite in the DO)                             | M2   |
| R2           | Statement PDFs / raw ingestion artifacts                       | M5   |
| Workers AI   | Extraction of messy inputs only — never the earn math          | M4   |
| Cron trigger | Later: points-expiry reminders, catalog freshness checks       | later|

## Data ownership (who writes what)

| Data                                   | Owner (sole writer)      | Readers                          |
| -------------------------------------- | ------------------------ | -------------------------------- |
| `users` / `households` / `memberships` | app Worker               | app, ingest (identity lookup)    |
| `catalog_*` reference tables           | seed loader (via deploy) | app, ingest                      |
| Ledger (txns/postings/balances)        | that user's LedgerDO     | app (self + authorized family)   |
| Captures inbox                         | that user's LedgerDO     | app (review UI)                  |
| Statement artifacts (R2)               | ingest/app on upload     | that user's flows                |

## Milestone → component map

- **M1 (done)**: app Worker + D1 directory + Discord auth/tiers.
- **M2**: `LedgerDO` + `beancount-core` + `catalog` (schemas, seed, loader) + manual entry UI.
- **M3**: `earn-engine` in the DO write path (accelerators, caps, surcharge, actual-rate).
- **M4**: `points-wise-ingest` Worker (email + telegram → captures).
- **M5**: R2 + statement reconciliation in the DO (balance assertions; pad = discrepancy).
- **M6**: family invite/accept + assume-role reads (app Worker paths; DO untouched).

## Explicit non-goals (keeping it simple)

- **No microservice per feature** — earn engine, validators, catalog are libraries.
- **No queues yet** — the captures inbox in the DO is the buffer; email/telegram both
  retry delivery. Add Cloudflare Queues only if ingest volume ever demands it.
- **No separate KB/catalog service** (milesvault has one; we don't) — catalog is
  versioned data in this repo, loaded into D1.
- **No cross-user/global DO singletons** — anything shared lives in D1.
- **No second datastore** — no KV/Postgres until a concrete need appears.

Rule of thumb: if a new capability can be a **library behind an interface**, it is one.
It graduates to a Worker/DO only when it needs its own lifecycle, entrypoint
(email/webhook/cron), or isolation.
