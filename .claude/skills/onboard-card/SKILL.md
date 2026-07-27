---
name: onboard-card
description: >-
  Onboard a new bank or credit card into the PointsWise knowledge base
  (data/kb): research earn rules + surcharges from authoritative sources, encode
  them in the Zod-validated seed, then validate, reseed, and test. Use whenever
  adding or updating a card/bank/category in the KB, or refreshing rates after a
  bank revises its T&C.
---

# Onboarding a bank / card into the PointsWise KB

The KB is a **typed, Zod-validated seed** under `data/kb/`, compiled to idempotent
upsert SQL and applied to Cloudflare D1. Every row is parsed against
`src/lib/kb/schema.ts` before it can be stored — malformed data cannot enter.
This skill is the end-to-end procedure for adding a card (and, if needed, its
bank and categories) correctly the first time.

## Where things live

| File | Holds | Keyed by |
|------|-------|----------|
| `data/kb/banks.ts` | `BANKS: Bank[]` | `slug` |
| `data/kb/categories.ts` | `CATEGORIES: Category[]` | `slug` |
| `data/kb/cards.ts` | `CARDS: SeedCard[]` + shared `*_EXCL` MCC constants | `card.slug` |
| `src/lib/kb/schema.ts` | Zod schemas = single source of truth | — |
| `scripts/seed-kb.ts` | validates all seed, emits `.seed-kb.sql` | — |

`SeedCard = { card: Card; rules: EarnRuleInput[] }` — the *input* shape (fields
with Zod defaults are optional when authoring; the parsed `EarnRule` has them
required). A card **must** carry ≥1 rule. Earn rules are stored in D1 as a JSON
blob (`kb_earn_rules.rule_json`), so adding fields to `EarnRule` needs **no
migration** — just update the Zod schema.

## Procedure

### 1. Research first, from authoritative sources
Gather the numbers **before** touching code. Prefer, in order:
1. Bank's **MITC** ("Most Important Terms & Conditions") / card T&C PDF.
2. **Schedule of Charges** / "Fees & Charges" / "Revision in Charges" notices.
3. Rewards-portal T&C (SmartBuy, Travel Edge, iShop, etc.) for accelerators.
4. Secondary (CardExpert, TechnoFino, Live From A Lounge) **only** to locate the
   official fact — never as the sole basis for `verified: true`.

Capture, per card:
- **Base earn** — points per ₹ (and the currency divisor `per`).
- **Accelerators** — platform/category, multiplier over base, monthly *point* cap.
- **Spend tiers** — any rate that changes past a monthly ₹ spend threshold.
- **Exclusions** — categories that earn nothing + bank-published excluded MCCs.
- **Surcharges** — rent %, utility fee + threshold, fuel surcharge + waiver band,
  education/wallet/government/insurance fees, forex markup, per-txn fee cap, GST.
- **Point value** and **effective date** of the current rule.

> Bulk onboarding (many cards/banks at once): fan out **parallel research agents
> grouped by bank** (Agent tool). Fee-schedule lookup is factual web research —
> `sonnet` is the right-sized model (cheaper, and less likely to exhaust session
> limits than a fleet of `opus` agents). Have each agent return ready-to-paste
> literals + a source URL + confidence per fact; do the folding yourself so the
> schema stays consistent. Grouping ~2 banks per agent keeps each one bounded.

### 2. Ensure the bank exists (`data/kb/banks.ts`)
If new, add `{ slug, name, beancountName }`. `beancountName` is **CapitalCamelCase**
(`/^[A-Z][A-Za-z0-9]*$/`) — it becomes the ledger account segment
(`Liabilities:CreditCards:<Bank>:<Card>` and `Assets:Rewards:<Bank>`).

### 3. Ensure categories exist (`data/kb/categories.ts`)
Every `category` referenced by an accelerator, exclusion, or surcharge **must**
already be a category slug, or `pnpm kb:sql` throws. To add one:
`{ slug, name, root, leaf?, sort }` where `root` is one of `EXPENSE_ROOTS`
(Housing, Food, Transport, Health, Shopping, Entertainment, Personal, Financial,
Travel, Misc). `leaf` is CapitalCamelCase.

### 4. Reuse / extend the bank's excluded-MCC constant (`data/kb/cards.ts`)
Excluded MCCs are shared per bank via a top-of-file constant (`HDFC_EXCL`,
`AXIS_EXCL`, …). Reuse the existing one; add MCCs there if the bank publishes
more. New bank → add a new `<BANK>_EXCL` constant.

### 5. Write the `SeedCard` entry
Add to `CARDS` under the bank's section. Full shape (optional fields may be
omitted; defaults shown):

```ts
{
  card: {
    slug: 'bank-cardname',            // kebab-case, unique
    bankSlug: 'bank',                 // must match a BANKS slug
    name: 'Human Name',
    beancountName: 'CardName',        // CapitalCamelCase
    network: 'visa',                  // visa|mastercard|amex|rupay|diners (optional)
    pool: { ticker: 'BANK_RP', programme: 'Bank Reward Points' },
    active: true,                     // false = discontinued/wound-down
  },
  rules: [{
    effectiveFrom: '2026-07-01',      // YYYY-MM-DD; current rule
    base: { points: 5, per: 150 },    // 5 pts per ₹150 (floor)
    accelerators: [
      { category: 'travel-portal', label: 'Portal 5x', multiplier: 5,
        monthlyCapPoints: 15000, notes: 'cap on ACCELERATED pts/mo' },
      // OR MCC-triggered: { mccs: ['5411'], label: 'Grocery', multiplier: 2 }
    ],
    spendTiers: [                      // marginal earn past a ₹ monthly-spend threshold
      { fromMonthlySpend: 150000, points: 35, per: 200,
        label: 'Incremental spend over ₹1.5L/mo' },
    ],
    exclusions: ['fuel', 'rent', 'wallet'],   // category slugs that earn NOTHING
    excludedMccs: BANK_EXCL,                   // shared constant
    surcharges: [ /* see §6 */ ],
    verified: true,                    // true ONLY if from an official source
    notes: 'Source + anything the shape cannot yet express (milestones, intl, tiers).',
  }],
}
```

### 6. Encode surcharges (the "extra paid" — erodes real earn rate)
Surcharges are **mostly bank-wide**, so they live in **`data/kb/surcharges.ts`**,
not inline in `cards.ts`: `BANK_SURCHARGES[bankSlug]` (fees identical across a
bank's cards) + `CARD_SURCHARGES[cardSlug]` (per-card fuel waiver, forex markup,
exceptions). `scripts/seed-kb.ts` merges both into each rule's `surcharges[]`
before validation, so they land in `rule_json`. The `EarnRule.surcharges` field
still exists for admin/proposal writes; the seed just populates it via the merge.
`exclusions` (earns nothing) is **distinct** from a surcharge (costs a fee) — a
category is often **both** (rent: 0 earn + 1% fee). Reusable `forex(...)` and
`fuelWaiver(...)` builders in that file keep entries DRY.

### 6b. Milestones + fees (`data/kb/milestones.ts`)
Spend-milestone benefits and card fees live in **`data/kb/milestones.ts`**,
keyed by card slug (`CARD_MILESTONES`, `CARD_FEES`) and merged into the rule at
seed time — same mechanism/rationale as surcharges (per-card, so a keyed file
beats ~90 inline edits). A `milestones[]` entry is `{ spendThreshold? (omit for
activation welcomes), period, kind (points/voucher/fee-waiver/free-night/lounge),
points?/valueInr?, label?, repeatable?, verified }`. Model an **annual-fee waiver
on spend** as `kind:'fee-waiver'` with `valueInr` = the annual fee reversed.
`fees: {joiningInr, annualInr}` rides `rule_json` (no kb_cards migration). The
seed validates every map key resolves to a real card slug.

```ts
surcharges: [
  // Rent — flat % from the first rupee:
  { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1,
    thresholdBasis: 'monthly', applies: 'full', plusGst: true,
    effectiveFrom: '2024-08-01', verified: true, notes: 'src' },

  // Utility — 1% only on the amount ABOVE ₹50k/cycle, capped ₹3000/txn:
  { kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000,
    thresholdBasis: 'monthly', applies: 'above-threshold', perTxnCap: 3000,
    plusGst: true, verified: true, notes: 'src' },

  // Fuel — 1% surcharge WAIVED up to ₹500/cycle for txns ₹400–₹5000:
  { kind: 'fuel', category: 'fuel', percent: 1, waiverCapPerCycle: 500,
    txnMin: 400, txnMax: 5000, plusGst: true, verified: true, notes: 'src' },

  // Forex markup (no category):
  { kind: 'international', percent: 3.5, applies: 'full', plusGst: true,
    verified: true, notes: 'src' },
]
```

Field meanings: `percent` and/or `flat` (≥1 required) · `threshold` +
`thresholdBasis` (`monthly` | `per-transaction`) · `applies` (`above-threshold`
= % hits only the excess; `full` = % hits whole spend once crossed) · `perTxnCap`
· fuel-style `waiverCapPerCycle`/`txnMin`/`txnMax` · `plusGst` (default true,
18%) · `effectiveFrom` (only if the fee started on a different date than the
rule) · `verified`.

### 7. Validate, reseed, test
```bash
pnpm kb:sql        # validates every row; writes .seed-kb.sql (git-ignored)
pnpm test          # or: pnpm vitest run src/lib/kb/seed.test.ts
pnpm typecheck && pnpm lint
```
`kb:sql` fails loudly on: unknown category referenced by accelerator/exclusion/
surcharge, bad account shape, a card with zero rules. Fix until it prints the
counts line. Apply with `pnpm kb:seed:local` (dev) / `pnpm kb:seed:remote` (prod).

### 8. Commit
PR-only workflow — never push to `main` directly. Commit message ends with the
body and **no `Co-Authored-By` trailer** (contributor is `ankitkr` only).

## Validation traps (schema enforces these — get them right up front)
- **slug**: kebab-case, `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
- **beancountName / category leaf**: CapitalCamelCase, `/^[A-Z][A-Za-z0-9]*$/`.
- **pool.ticker**: `UPPERCASE_WITH_UNDERSCORES`, and **must not** be a 3-letter
  fiat-shaped code (`USD`, `INR`) — the ledger validator treats those as fiat.
  Use `HDFC_RP`, `EDGE_MILES`, etc.
- **mcc**: exactly 4 digits (string).
- **accelerator**: needs a `category` **or** at least one `mcc`.
- **surcharge**: needs a `percent` **or** a `flat`.
- **category referenced anywhere must exist** in `categories.ts` first.

## Domain lessons (baked-in mistakes to avoid)
- **One rewards pool account per issuer** (`Assets:Rewards:<Bank>`), but different
  programmes on the same issuer use **different tickers** (same account, distinct
  commodities). Axis: Magnus/Burgundy/Privilege earn `EDGE_RP` (~₹0.20); only
  **Atlas** earns `EDGE_MILES` (~₹1). Do not conflate similarly-named programmes.
- **Devaluation = a new rule version**, appended to `rules[]` with a later
  `effectiveFrom` — never edit history. Seed carries the **current** rule; note
  the prior structure in `notes`.
- **`verified: true` is a promise** it came from an official bank source. Secondary
  or partial → `verified: false` + cite the source in `notes` so an admin can
  confirm in `/admin/kb`.
- **Wound-down cards** → `active: false` (e.g. co-brands being retired), keep the
  rule for historical reconciliation.
- **What the rule shape still cannot express** — milestone/annual-fee-waiver
  bonuses, international earn multipliers, tiered/status earn, day-of-week boosts,
  and spend-value caps expressed in ₹-of-spend (as opposed to `monthlyCapPoints`).
  Record these in `notes` for the M3 earn engine. (`spendTiers` now covers
  marginal ₹-spend thresholds; `surcharges` covers fees.)

## Done-when checklist
- [ ] Bank in `banks.ts`; every referenced category in `categories.ts`.
- [ ] Card has base + accelerators + (spendTiers) + exclusions + excludedMccs +
      surcharges, each with a source in `notes`.
- [ ] `verified` set honestly per official-source availability.
- [ ] `pnpm kb:sql` prints the counts line; `pnpm test` green; typecheck + lint clean.
- [ ] Committed on a branch, PR opened, no `Co-Authored-By` trailer.
