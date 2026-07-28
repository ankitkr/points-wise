---
name: refresh-offers
description: >-
  Refresh the network-tier and card offers/benefits in the PointsWise offers
  staging file (data/kb/offers.ts) — airport lounge, movie (BookMyShow BOGO),
  golf, dining programmes, loyalty/hotel status, concierge, meet-and-greet,
  insurance. Use when adding/updating what a card gets from its NETWORK+tier
  (Visa Infinite/Signature, Mastercard World/World Elite, RuPay Select, Diners
  Black) or its standing card-specific offers. This is a staging file, kept
  UNCOMMITTED until promoted into the KB.
---

# Refreshing network + card offers

`data/kb/offers.ts` is a **staging file**: self-contained types, NOT wired into
the seed, and deliberately left **uncommitted** until the shape is promoted into
the KB. It holds two maps:

- **`NETWORK_BENEFITS: Record<NetworkTier, Benefit[]>`** — what a card gets from
  its network + tier, across issuers. Tiers: `visa-infinite`, `visa-signature`,
  `mastercard-world-elite`, `mastercard-world`, `rupay-select`, `diners-black`,
  `amex`.
- **`CARD_OFFERS: Record<string, Benefit[]>`** — card-specific standing offers /
  perks / complimentary memberships, keyed by card slug (distinct from
  milestones, which are *spend-triggered* rewards in the KB proper).

A `Benefit` = `{ category, title, detail?, quantity?, cardCondition?, verified?,
source? }`. `category` ∈ lounge-domestic / lounge-international / movie / golf /
dining / concierge / meet-and-greet / loyalty-status / insurance / wellness /
other.

## The one thing that matters most: WHO sets the quantity

The whole point of splitting network benefits out is that the *quantity* is set
at different layers, and getting this wrong makes the data misleading:

- **Visa Infinite / Signature** — Visa guarantees only concierge + global
  assistance + an insurance *framework*. Lounge counts, Priority Pass allocation,
  golf rounds, movie BOGO are **all issuer-configured** → use
  `quantity: 'issuer-dependent'`, `verified: false`, and note it.
- **Mastercard World Elite / World** — golf rounds/lessons, Culinary Club, and
  hotel-status (GHA Discovery, Wyndham) are **network-MANDATED** with hard
  numbers (World Elite: 12 rounds + 4 guest + 12 lessons/yr) → `verified: true`
  from the Mastercard programme/bank-microsite page. Lounge count is issuer-set.
- **RuPay Select** — **NPCI mandates exact quantities** (circular, effective
  1-Apr-2025): 1 domestic lounge/qtr, 2 intl/yr, 1 golf/qtr, quarterly gym /
  health / spa, ₹100 cab/qtr, 1 OTT/yr, ₹10L accident cover. Most standardised
  tier — `verified: true`.
- **Diners Black** — India = HDFC-only issuer, so network≈issuer; the network
  layer contributes unlimited Diners lounge access.

So: only mark `verified: true` where a **network / NPCI / official issuer** page
confirmed the number. Everything issuer-dependent stays `verified: false`.

## Procedure

1. **Research** (guardrailed, like the KB skill): fan out `sonnet` agents —
   typically one per network tier (or one agent covering all tiers). **Guardrail
   every prompt**: "use ONLY direct WebSearch/WebFetch; do NOT invoke any
   workflow / skill / deep-research / sub-agent." Prefer official network pages
   (visa.co.in, Mastercard priceless/microsites, NPCI circular, dinersclub) +
   reputable secondary (cardinsider, technofino) to locate facts. For each tier
   ask for: lounge (domestic + international), golf, movie, dining, concierge,
   meet-and-greet, loyalty/status, insurance, wellness — with the quantity **and
   whether it's network-mandated or issuer-set**.
   - **Grok in Chrome** (`/chrome` → browser tools) is useful here: X community
     accounts track network-benefit changes; cross-check against the sweep.
2. **Fold** the results into `NETWORK_BENEFITS` (and `CARD_OFFERS` for card
   specifics). Keep `detail` terse; put the source in `source`; set `verified`
   per the layer rule above; mark issuer-varying counts `quantity:
   'issuer-dependent'`.
3. **Typecheck** — `offers.ts` is self-contained, so `pnpm typecheck` is the only
   gate (it is NOT part of the seed, so `kb:sql`/tests don't cover it).
4. **Do NOT commit** `offers.ts` (leave it untracked) unless the user explicitly
   asks to promote it into the KB.

## Promoting to the KB (later, only when asked)

When the shape settles and offers should ship: add a `benefits`/`offers` schema
to `src/lib/kb/schema.ts`, either as a network-tier lookup applied by
`card.network` + tier or a keyed `CARD_OFFERS` merged at seed time (mirror the
surcharges/milestones keyed-merge in `scripts/seed-kb.ts` with a key-guard), then
follow the `onboard-card` validate/commit steps. Until then this file is a
research artifact only.

## Done-when checklist
- [ ] Each tier's benefits reflect the correct layer (network-mandated vs
      issuer-dependent); `quantity` set accordingly.
- [ ] `verified: true` only where a network/NPCI/official issuer source confirmed
      the number; `source` on every entry.
- [ ] `pnpm typecheck` clean.
- [ ] `offers.ts` left **uncommitted** (untracked) unless promotion was requested.
