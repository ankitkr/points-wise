import { z } from 'zod'

// Knowledge Base schemas — the single source of truth for what a bank, card,
// earn rule, category, offer, or proposal may look like. Everything entering
// the KB (repo seed, admin UI writes, approved proposals, the future
// auto-updater) is parsed with these schemas first; malformed data cannot be
// stored. Types are inferred from the schemas.

// ---------------------------------------------------------------------------
// Shared primitives

// kebab-case identifier, e.g. "axis-magnus"
export const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case')

// A single beancount account segment: starts with a capital, no spaces/colons.
// Used as the <Issuer> / <Card> leaf inside canonical account paths.
export const beancountSegmentSchema = z
  .string()
  .regex(/^[A-Z][A-Za-z0-9]*$/, 'must be a beancount segment (CapitalCamelCase)')

// Reward commodity ticker, e.g. "EDGE_MILES", "HDFC_RP". Must NOT look like a
// 3-letter fiat ISO code — the ledger validator treats those as fiat.
export const tickerSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]{1,15}$/, 'must be an UPPERCASE ticker')
  .refine((t) => !/^[A-Z]{3}$/.test(t), 'must not look like a fiat ISO code (3 letters)')

// ISO-ish calendar date.
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')

// 4-digit merchant category code.
export const mccSchema = z.string().regex(/^\d{4}$/, 'must be a 4-digit MCC')

// ---------------------------------------------------------------------------
// Categories — the ten canonical expense roots (beancount primer) + leaves.

export const EXPENSE_ROOTS = [
  'Housing',
  'Food',
  'Transport',
  'Health',
  'Shopping',
  'Entertainment',
  'Personal',
  'Financial',
  'Travel',
  'Misc',
] as const

export const categorySchema = z.object({
  slug: slugSchema, // e.g. "groceries"
  name: z.string().min(1), // "Groceries"
  root: z.enum(EXPENSE_ROOTS),
  // Optional second level under the root, e.g. Groceries under Food.
  leaf: beancountSegmentSchema.optional(),
  sort: z.number().int().default(0),
})
export type Category = z.infer<typeof categorySchema>

export function categoryAccount(c: Pick<Category, 'root' | 'leaf'>): string {
  return c.leaf ? `Expenses:${c.root}:${c.leaf}` : `Expenses:${c.root}`
}

// ---------------------------------------------------------------------------
// Banks

export const bankSchema = z.object({
  slug: slugSchema, // "axis"
  name: z.string().min(1), // "Axis Bank"
  beancountName: beancountSegmentSchema, // "Axis"
})
export type Bank = z.infer<typeof bankSchema>

// ---------------------------------------------------------------------------
// Earn rules — versioned, append-only per card (effectiveFrom ordering).

export const acceleratorSchema = z
  .object({
    // What triggers the acceleration: a category slug and/or explicit MCCs.
    category: slugSchema.optional(),
    mccs: z.array(mccSchema).optional(),
    label: z.string().min(1), // "SmartBuy portal", "Online shopping"
    multiplier: z.number().positive(), // x over base (5 = 5x)
    // Cap on ACCELERATED points per calendar month (base keeps accruing).
    monthlyCapPoints: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  .refine((a) => a.category !== undefined || (a.mccs?.length ?? 0) > 0, {
    message: 'accelerator needs a category or at least one MCC',
  })
export type Accelerator = z.infer<typeof acceleratorSchema>

// ---------------------------------------------------------------------------
// Spend tiers — marginal earn that changes once cumulative *eligible* spend in
// a statement cycle crosses a rupee threshold. Axis Magnus: base 12 RP/₹200 up
// to ₹1.5L/mo, then 35 RP/₹200 on the incremental spend beyond it. Distinct
// from an accelerator (category-triggered, not spend-volume-triggered).

export const spendTierSchema = z
  .object({
    // ₹ of cumulative eligible spend in the cycle at which this tier begins.
    fromMonthlySpend: z.number().positive(),
    // Upper ₹ ceiling; absent = unbounded. (Magnus Burgundy caps at
    // credit limit + ₹1.5L, which is per-customer — left unbounded, see notes.)
    // M3: eligible-spend exclusions and credit-limit-relative ceilings are not
    // yet machine-encoded — recorded in `notes` for the earn engine.
    toMonthlySpend: z.number().positive().optional(),
    // Marginal earn on spend that falls inside this tier.
    points: z.number().nonnegative(),
    per: z.number().positive(),
    label: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((t) => t.toMonthlySpend === undefined || t.toMonthlySpend > t.fromMonthlySpend, {
    message: 'spend tier toMonthlySpend must be greater than fromMonthlySpend',
  })
export type SpendTier = z.infer<typeof spendTierSchema>

// ---------------------------------------------------------------------------
// Surcharges / fees — the "extra paid" that erodes the real earn rate. Indian
// issuers now levy ~1% on rent, and on utility/fuel/education/wallet/gaming
// spends above a monthly threshold, usually with a per-txn cap and 18% GST.
// Fuel carries a surcharge that is WAIVED up to a cycle cap within a txn band.
// A surcharge is versioned with the earn rule it sits on (the rule's
// effectiveFrom is authoritative unless the fee has its own effectiveFrom).

export const FEE_KINDS = [
  'rent',
  'utilities',
  'fuel',
  'education',
  'wallet',
  'government',
  'insurance',
  'international', // forex markup on FOREIGN-currency transactions
  'dcc', // Dynamic Currency Conversion markup — charged when a foreign merchant/site bills in INR (separate from, and often stacked with, the forex markup)
  'gaming',
  'other',
] as const

export const surchargeSchema = z
  .object({
    kind: z.enum(FEE_KINDS),
    // Optional links so the engine can match a transaction to this fee.
    category: slugSchema.optional(),
    mccs: z.array(mccSchema).optional(),
    // The levy: a percent of spend and/or a flat ₹ per txn. At least one.
    // If BOTH are set, `combine` says how (e.g. IDFC rent = max(₹249, 1%)).
    percent: z.number().nonnegative().optional(), // 1 = 1%
    flat: z.number().nonnegative().optional(), // ₹ per transaction
    combine: z.enum(['max', 'sum']).optional(),
    // Only charged once spend crosses this ₹ threshold; absent = from ₹1.
    threshold: z.number().positive().optional(),
    // Is `threshold` measured over the statement cycle or per transaction?
    thresholdBasis: z.enum(['monthly', 'per-transaction']).default('monthly'),
    // Charge base once the threshold is crossed. 'above-threshold' = only the
    // amount over `threshold`; 'full' = the whole triggering transaction.
    // NOTE (M3): a few issuers (SBI utility) charge 1% of the WHOLE cycle's
    // bucket spend retroactively — captured in `notes` today; the earn engine
    // will add an explicit cycle-total base rather than overload 'full'.
    applies: z.enum(['above-threshold', 'full']).default('above-threshold'),
    // Ceiling on the surcharge per transaction (₹).
    perTxnCap: z.number().positive().optional(),
    // Fuel-style waiver: surcharge levied then reversed up to this ₹ per
    // `waiverPeriod`, for transactions within [txnMin, txnMax].
    waiverCapPerCycle: z.number().nonnegative().optional(),
    waiverPeriod: z.enum(['cycle', 'quarter', 'year']).default('cycle'),
    txnMin: z.number().nonnegative().optional(),
    txnMax: z.number().positive().optional(),
    // 18% GST applies on top of the surcharge (true for essentially all).
    plusGst: z.boolean().default(true),
    // Overrides rule.effectiveFrom only if this fee began on a different date.
    effectiveFrom: dateSchema.optional(),
    // False until an admin confirms against an authoritative source.
    verified: z.boolean().default(false),
    notes: z.string().optional(),
  })
  .superRefine((s, ctx) => {
    if (s.percent === undefined && s.flat === undefined)
      ctx.addIssue({ code: 'custom', message: 'surcharge needs a percent or a flat amount' })
    if (s.percent !== undefined && s.flat !== undefined && s.combine === undefined)
      ctx.addIssue({ code: 'custom', message: 'set combine (max|sum) when both percent and flat are present' })
    if (s.txnMin !== undefined && s.txnMax !== undefined && s.txnMax < s.txnMin)
      ctx.addIssue({ code: 'custom', message: 'surcharge txnMax must be ≥ txnMin' })
  })
export type Surcharge = z.infer<typeof surchargeSchema>
// Pre-parse shape for authoring surcharge seed data (data/kb/surcharges.ts):
// defaulted fields (thresholdBasis, applies, plusGst, verified, waiverPeriod)
// are optional here, required on the parsed Surcharge.
export type SurchargeInput = z.input<typeof surchargeSchema>

// ---------------------------------------------------------------------------
// Milestones — a benefit unlocked by cumulative spend over a period. Covers
// bonus points ("₹4L/yr → 10,000 miles"), vouchers ("₹1.5L → ₹10k Taj"),
// Free Night Awards, and — importantly for real earn rate — annual-fee waivers
// ("spend ₹3L/yr → fee reversed"). Distinct from spendTiers (which change the
// marginal EARN RATE) — a milestone is a one-off (or repeatable) reward.

export const MILESTONE_KINDS = ['points', 'voucher', 'fee-waiver', 'free-night', 'lounge', 'other'] as const

export const milestoneSchema = z
  .object({
    // Cumulative eligible spend (₹) over `period` that unlocks the benefit.
    // Absent = no spend gate (e.g. a welcome benefit on activation / first txn).
    spendThreshold: z.number().positive().optional(),
    period: z
      .enum(['welcome', 'statement-cycle', 'quarter', 'anniversary-year', 'calendar-year'])
      .default('anniversary-year'),
    kind: z.enum(MILESTONE_KINDS),
    // Bonus points/miles awarded (kind 'points'); `ticker` defaults to the card pool.
    points: z.number().int().positive().optional(),
    ticker: tickerSchema.optional(),
    // ₹ value of a voucher / free-night / the annual fee waived (kind 'fee-waiver').
    valueInr: z.number().positive().optional(),
    label: z.string().optional(), // "₹10k Taj voucher", "annual fee waiver", "FNA <=15k pts"
    // True when the benefit repeats each threshold (e.g. a voucher per ₹1L), not once.
    repeatable: z.boolean().default(false),
    verified: z.boolean().default(false),
    notes: z.string().optional(),
  })
  .refine((m) => m.points !== undefined || m.valueInr !== undefined || m.kind === 'lounge' || m.kind === 'other', {
    message: 'milestone needs points or valueInr (except lounge/other)',
  })
export type Milestone = z.infer<typeof milestoneSchema>
export type MilestoneInput = z.input<typeof milestoneSchema>

// ---------------------------------------------------------------------------
// Redemption — how a card's points turn into value, and the caps/mechanics that
// gate it. This is what makes the "actual earn rate" real (a point is only worth
// its best realistic redemption). Programme-level methods + card-level caps.

export const REDEMPTION_METHODS = [
  'smartbuy', // HDFC SmartBuy flights/hotels
  'travel-portal', // iShop / Travel EDGE / other bank portals
  'airmiles-transfer', // convert to airline miles
  'hotel-transfer', // convert to hotel points
  'cashback', // points → statement cashback
  'statement-credit',
  'catalog', // gift catalog / merchandise
  'gift-voucher',
  'pay-with-points', // at checkout
  'other',
] as const

export const transferPartnerSchema = z.object({
  partner: z.string().min(1), // "Marriott Bonvoy", "Singapore KrisFlyer"
  kind: z.enum(['airline', 'hotel', 'other']).default('airline'),
  ratio: z.string().optional(), // "5:2" = 5 card points → 2 partner miles
  valuePerPoint: z.number().nonnegative().optional(), // ₹ per CARD point via this partner
  notes: z.string().optional(),
})

export const redemptionMethodSchema = z.object({
  method: z.enum(REDEMPTION_METHODS),
  valuePerPoint: z.number().nonnegative(), // ₹ per point via this method
  notes: z.string().optional(),
})

// Data provenance for figures that often can't be officially published (community
// consensus vs an issuer-published number). Shared by redemption + valuations so
// the UI can show "community estimate" instead of an alarming "unverified".
export const VALUE_SOURCES = ['official', 'community'] as const

export const redemptionSchema = z.object({
  methods: z.array(redemptionMethodSchema).default([]),
  transferPartners: z.array(transferPartnerSchema).default([]),
  // Caps / mechanics that gate redemption:
  // points may cover at most this % of a portal purchase (e.g. SmartBuy 70%).
  portalUtilizationPct: z.number().min(0).max(100).optional(),
  monthlyTransferCapPoints: z.number().int().positive().optional(), // e.g. 75,000 (BizBlack)
  monthlyTransferMaxTxns: z.number().int().positive().optional(), // e.g. 5
  annualTransferCapPoints: z.number().int().positive().optional(),
  pointExpiryMonths: z.number().int().positive().optional(),
  // Provenance: 'community' (the ₹/point values are consensus estimates — the usual
  // case, since no bank publishes point values) or 'official' (issuer-published,
  // e.g. a fixed 1:1 portal or a cashback rate).
  source: z.enum(VALUE_SOURCES).default('community'),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
})
export type Redemption = z.infer<typeof redemptionSchema>
export type RedemptionInput = z.input<typeof redemptionSchema>

// ---------------------------------------------------------------------------
// Commodity valuations — what ONE unit of a reward currency is worth in ₹.
// This is milesvault's "pricing index" (it prices 150+ programmes): each
// programme is priced at three qualities so a portfolio can be valued as a
// net-worth figure AND a card's REAL earn rate computed (a point is only worth
// its realistic redemption). Keyed by ticker in data/kb/valuations.ts — a
// SHARED pool (AMEX_MR, EDGE_RP) is priced once, not per card. Values are
// community consensus unless an issuer publishes a fixed rate (cashback/1:1
// portal) → 'official'. NOT merged into earn rules (it is per-currency, not
// per-card); the earn engine (M3) and the net-worth view read it directly.
// (VALUE_SOURCES is defined above, shared with redemptionSchema.)

export const commodityValueSchema = z
  .object({
    // ₹ per point at three redemption qualities (must be floor ≤ realistic ≤ best):
    floorInr: z.number().nonnegative(), // cash / statement-credit equivalent (worst)
    realisticInr: z.number().nonnegative(), // typical portal / voucher / economy transfer
    bestInr: z.number().nonnegative(), // optimised premium-cabin / sweet-spot award
    source: z.enum(VALUE_SOURCES).default('community'),
    verified: z.boolean().default(false),
    notes: z.string().optional(),
  })
  .refine((v) => v.floorInr <= v.realisticInr && v.realisticInr <= v.bestInr, {
    message: 'valuation must satisfy floorInr ≤ realisticInr ≤ bestInr',
  })
export type CommodityValue = z.infer<typeof commodityValueSchema>
export type CommodityValueInput = z.input<typeof commodityValueSchema>

// ---------------------------------------------------------------------------
// Direct tax / GST payment treatment (MCC 9311 tax, 9399 government) — a frequent
// India question with a subtle answer: EARNING and MILESTONE-COUNTING are separate
// axes. On many personal cards tax earns nothing yet still counts toward spend
// milestones (HDFC/ICICI/SBI, per community); on Axis it counts toward NEITHER; on
// business cards (HDFC Biz, AU CA Metal, IDFC Business) it does BOTH. `excludedMccs`
// already zeroes base earn — this records the milestone side (and confirms the earn
// side) that the M3 earn/milestone engine can't otherwise infer.
export const taxPaymentsSchema = z.object({
  earns: z.boolean(), // do tax/GST payments earn base/accelerated points?
  countsToMilestone: z.boolean(), // does the spend count toward spend milestones even if it earns 0?
  verified: z.boolean().default(false),
  notes: z.string().optional(),
})
export type TaxPayments = z.infer<typeof taxPaymentsSchema>
export type TaxPaymentsInput = z.input<typeof taxPaymentsSchema>

export const earnRuleSchema = z.object({
  effectiveFrom: dateSchema,
  // Base earn: `points` per `per` units of the billing currency (floor()).
  // e.g. Infinia: 5 points per ₹150.
  base: z.object({
    points: z.number().nonnegative(),
    per: z.number().positive(),
  }),
  accelerators: z.array(acceleratorSchema).default([]),
  // Overall monthly cap on ACCELERATED (bonus-over-base) points across ALL
  // accelerators — the "umbrella" cap (e.g. HDFC Infinia SmartBuy). Per-
  // accelerator/per-platform sub-caps still live on each accelerator's
  // `monthlyCapPoints` (e.g. SmartBuy gift vouchers ≤3,000 RP/mo within it).
  acceleratedMonthlyCapPoints: z.number().int().positive().optional(),
  // Volume-based marginal earn tiers (e.g. Magnus >₹1.5L/mo).
  spendTiers: z.array(spendTierSchema).default([]),
  // Fees that erode the real earn rate (rent, utility-over-threshold, fuel…).
  surcharges: z.array(surchargeSchema).default([]),
  // Spend-milestone benefits: bonus points, vouchers, free nights, fee waivers.
  milestones: z.array(milestoneSchema).default([]),
  // Card fees (₹): joining + annual. Card-level, but stored on the versioned
  // rule (rides rule_json) to avoid a kb_cards migration; a fee-waiver milestone
  // says what annual spend reverses the annual fee.
  fees: z
    .object({
      joiningInr: z.number().nonnegative().optional(),
      annualInr: z.number().nonnegative().optional(),
    })
    .optional(),
  // How points redeem/transfer, rough ₹/point per method, and the caps that
  // gate it (SmartBuy 70% utilization, monthly transfer limits, expiry).
  redemption: redemptionSchema.optional(),
  // How direct income-tax / GST payments earn and count toward milestones.
  taxPayments: taxPaymentsSchema.optional(),
  // Category slugs that earn NOTHING on this card (rent, fuel, wallet…).
  exclusions: z.array(slugSchema).default([]),
  // Bank-published excluded MCCs (earn nothing regardless of category
  // mapping) — e.g. 6513 rent, 5541/5983 fuel, 6540 wallet loads, 9399 govt.
  excludedMccs: z.array(mccSchema).default([]),
  // False until an admin confirms the numbers against an authoritative source.
  verified: z.boolean().default(false),
  notes: z.string().optional(),
})
export type EarnRule = z.infer<typeof earnRuleSchema>
// Pre-parse shape for authoring seed rules: fields with a Zod default
// (accelerators, spendTiers, surcharges, exclusions, excludedMccs, verified)
// are optional here, required on the parsed EarnRule.
export type EarnRuleInput = z.input<typeof earnRuleSchema>

// ---------------------------------------------------------------------------
// Cards

export const NETWORKS = ['visa', 'mastercard', 'amex', 'rupay', 'diners'] as const

export const cardSchema = z.object({
  slug: slugSchema, // "hdfc-infinia"
  bankSlug: slugSchema,
  name: z.string().min(1), // "HDFC Infinia"
  beancountName: beancountSegmentSchema, // "Infinia"
  network: z.enum(NETWORKS).optional(),
  pool: z.object({
    ticker: tickerSchema, // "HDFC_RP"
    programme: z.string().min(1), // "HDFC Reward Points"
  }),
  active: z.boolean().default(true),
})
export type Card = z.infer<typeof cardSchema>

// Partial update shape for admin edit-card — the ONLY fields updateCardFields
// may touch, schema-enforced (Codex review: casts are not validation).
export const cardPatchSchema = cardSchema
  .pick({ name: true, network: true, active: true })
  .partial()
  .extend({ poolProgramme: z.string().min(1).optional() })
export type CardPatch = z.infer<typeof cardPatchSchema>

// Canonical account paths, derived — never hand-assembled elsewhere.
export function cardAccount(bank: Pick<Bank, 'beancountName'>, card: Pick<Card, 'beancountName'>): string {
  return `Liabilities:CreditCards:${bank.beancountName}:${card.beancountName}`
}
// Reward balances are tracked PER CARD by default — HDFC/ICICI/SBI/… each card
// accrues and redeems its own Reward Points, so two cards never share a balance.
// A few PROGRAMMES pool across an issuer's cards into ONE balance; that is a
// property of the programme (bank + ticker), not the card. Keyed "bank:ticker":
//   - Amex Membership Rewards: all MR cards → one pool.
//   - Axis EDGE Reward Points: pooled (Atlas's EDGE Miles stay per-card).
//     (EDGE RP could split per-card later — just remove the entry.)
export const SHARED_POOLS: Record<string, string> = {
  'amex:AMEX_MR': 'MembershipRewards',
  'axis:EDGE_RP': 'EdgeRewards',
}
// Rewards pool account: Assets:Rewards:<Bank>:<Card> (per-card) or
// Assets:Rewards:<Bank>:<SharedPool> for pooled programmes.
export function poolAccount(
  bank: Pick<Bank, 'slug' | 'beancountName'>,
  cardBeancountName: string,
  ticker: string,
): string {
  const segment = SHARED_POOLS[`${bank.slug}:${ticker}`] ?? cardBeancountName
  return `Assets:Rewards:${bank.beancountName}:${segment}`
}

// The strict shape the ledger validator enforces; KB-derived paths must match.
export const CARD_ACCOUNT_RE = /^Liabilities:CreditCards:[A-Z][A-Za-z0-9]*:[A-Z][A-Za-z0-9]*(:[A-Za-z0-9]+)?$/
export const REWARDS_ACCOUNT_RE = /^Assets:Rewards:[A-Z][A-Za-z0-9]*:[A-Z][A-Za-z0-9]*$/

// ---------------------------------------------------------------------------
// Offers — schema now, serving table later (M3/M7).

export const offerSchema = z.object({
  slug: slugSchema,
  cardSlug: slugSchema.optional(), // absent = bank/portal-wide
  bankSlug: slugSchema.optional(),
  title: z.string().min(1),
  validFrom: dateSchema,
  validTo: dateSchema,
  multiplier: z.number().positive().optional(),
  flatPoints: z.number().int().positive().optional(),
  notes: z.string().optional(),
})
export type Offer = z.infer<typeof offerSchema>

// ---------------------------------------------------------------------------
// Proposals — everything that wants to change the KB but isn't an admin edit:
// member suggestions now, the auto-updater later. Approving applies the
// (re-validated) payload to the kb_* tables.

export const proposalPayloadSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('new-card'),
      bank: bankSchema, // upserted if missing
      card: cardSchema,
      rule: earnRuleSchema,
    }),
    z.object({
      kind: z.literal('new-rule'),
      cardSlug: slugSchema,
      rule: earnRuleSchema,
    }),
    z.object({
      kind: z.literal('edit-card'),
      cardSlug: slugSchema,
      patch: cardPatchSchema,
    }),
    z.object({
      kind: z.literal('correction'),
      cardSlug: slugSchema.optional(),
      note: z.string().min(3).max(2000),
    }),
  ])
  // A new-card proposal must be internally consistent: the card belongs to the
  // bank it ships with (otherwise approval could upsert one bank and file the
  // card under another).
  .superRefine((p, ctx) => {
    if (p.kind === 'new-card' && p.card.bankSlug !== p.bank.slug) {
      ctx.addIssue({
        code: 'custom',
        message: `card.bankSlug (${p.card.bankSlug}) must match bank.slug (${p.bank.slug})`,
      })
    }
  })
export type ProposalPayload = z.infer<typeof proposalPayloadSchema>

export const PROPOSAL_KINDS = ['new-card', 'new-rule', 'edit-card', 'correction'] as const
export const PROPOSAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]
