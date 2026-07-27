# PointsWise — High-Level Architecture

Deliberately small: **three small Workers, one Durable Object class, shared libraries,
one D1.** We split by *data ownership and trust boundary*, not by feature. A component
becomes a separate service only when a platform constraint forces it (an email handler,
a webhook, a cron) — never for organizational neatness.

## The four product components

| # | Component (product view)                                        | Implementation |
|---|-----------------------------------------------------------------|----------------|
| 1 | **Authentication** — users, roles/tiers                         | Module inside the app Worker (next-auth + Discord role→tier) + the D1 directory. Not a separate deployable. **Built (M1).** |
| 2 | **Knowledge Base** — card data, offers, accelerated RPs, MCCs, categories · **+ KB updater** | KB = schemas library + repo seed data → D1 serving tables. Updater = cron Worker that scans X / asks an LLM for card news and **proposes** review-gated changes — never writes serving data directly. |
| 3 | **Ledger DO** — card expenses, reward points, per-txn MCC/description/category | One `LedgerDO` per user (ULID-keyed). Postings hold the money/points; MCC, description, category ride as entry metadata. |
| 4 | **Input Workers** — Telegram / Email                            | ONE ingest Worker with two channel adapters (email handler + telegram webhook). |

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

  KB freshness (scout, not writer — later):
                  ┌──────────────────────────┐         schema-validated PR
   cron ──────────▶  points-wise-kb-updater  │──────▶  against data/banks/*
                  │  scan X / ask LLM for    │         → CI validates (Zod)
                  │  rate changes, offers,   │         → human merges
                  │  devaluations → DRAFT    │         → deploy loads D1
                  └──────────────────────────┘
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

### 4. `points-wise-kb-updater` — KB freshness Worker (later)

A cron-triggered Worker that keeps the Knowledge Base current: scans X / asks an LLM
(e.g. Grok) for credit-card news — rate changes, devaluations, new cards, time-bound
offers — and drafts KB updates.

**Design rule: the updater is a scout, never a writer.** The deterministic earn engine
is only as correct as the KB, so scraped/LLM-sourced data must not flow into serving
tables directly. The updater emits **schema-validated proposals as PRs against
`data/banks/*`** (or a proposals table reviewed in-app); CI validates against the Zod
schemas; a human merges; the deploy loads D1. Freshness without corrupting earn math.

### 5. Shared libraries (same repo — seams, not services)

| Library           | Responsibility                                                              |
| ----------------- | --------------------------------------------------------------------------- |
| `beancount-core`  | Entry/posting model, serialization, validators (zero-sum per commodity, account shapes, commodity constraints) |
| `earn-engine`     | Pure function: (txn, card rules, period state) → points/cashback legs + surcharge split. Deterministic, fully unit-tested |
| `kb` (catalog)    | Zod schemas (`Card`, `RewardPool`, `EarnRule` — versioned `effectiveFrom` — plus `Offer` with validity windows, and the MCC→category taxonomy) + repo seed data (`data/banks/*`) + loader into D1; CI-validated |
| `db`              | Drizzle schema/queries for the directory (exists today)                     |

### 6. Platform pieces

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
| `catalog_*` (KB) reference tables      | seed loader (via deploy) — kb-updater only via reviewed PRs | app, ingest |
| Ledger (txns/postings/balances)        | that user's LedgerDO     | app (self + authorized family)   |
| Captures inbox                         | that user's LedgerDO     | app (review UI)                  |
| Statement artifacts (R2)               | ingest/app on upload     | that user's flows                |

## Milestone → component map

- **M1 (done)**: app Worker + D1 directory + Discord auth/tiers.
- **M2**: `LedgerDO` + `beancount-core` + `kb` (schemas, seed, loader) + manual entry UI.
- **M3**: `earn-engine` in the DO write path (accelerators, caps, surcharge, actual-rate).
- **M4**: `points-wise-ingest` Worker (email + telegram → captures).
- **M5**: R2 + statement reconciliation in the DO (balance assertions; pad = discrepancy).
- **M6**: family invite/accept + assume-role reads (app Worker paths; DO untouched).
- **M7**: `points-wise-kb-updater` cron Worker (X/LLM scan → review-gated KB proposals).

## Explicit non-goals (keeping it simple)

- **No microservice per feature** — earn engine, validators, catalog are libraries.
- **No queues yet** — the captures inbox in the DO is the buffer; email/telegram both
  retry delivery. Add Cloudflare Queues only if ingest volume ever demands it.
- **No separate KB/catalog service** (milesvault has one; we don't) — the KB is
  versioned data in this repo, loaded into D1. The kb-updater proposes; it never
  publishes: no scraped/LLM data reaches serving tables without schema validation
  and human review.
- **No two ingest Workers** — email and telegram are two adapters in one Worker.
- **No cross-user/global DO singletons** — anything shared lives in D1.
- **No second datastore** — no KV/Postgres until a concrete need appears.

Rule of thumb: if a new capability can be a **library behind an interface**, it is one.
It graduates to a Worker/DO only when it needs its own lifecycle, entrypoint
(email/webhook/cron), or isolation.
