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

export const earnRuleSchema = z.object({
  effectiveFrom: dateSchema,
  // Base earn: `points` per `per` units of the billing currency (floor()).
  // e.g. Infinia: 5 points per ₹150.
  base: z.object({
    points: z.number().nonnegative(),
    per: z.number().positive(),
  }),
  accelerators: z.array(acceleratorSchema).default([]),
  // Category slugs that earn NOTHING on this card (rent, fuel, wallet…).
  exclusions: z.array(slugSchema).default([]),
  // False until an admin confirms the numbers against an authoritative source.
  verified: z.boolean().default(false),
  notes: z.string().optional(),
})
export type EarnRule = z.infer<typeof earnRuleSchema>

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

// Canonical account paths, derived — never hand-assembled elsewhere.
export function cardAccount(bank: Pick<Bank, 'beancountName'>, card: Pick<Card, 'beancountName'>): string {
  return `Liabilities:CreditCards:${bank.beancountName}:${card.beancountName}`
}
// One rewards wallet per issuer (milesvault convention); ticker says which
// programme the points are.
export function poolAccount(bank: Pick<Bank, 'beancountName'>): string {
  return `Assets:Rewards:${bank.beancountName}`
}

// The strict shape the ledger validator enforces; KB-derived paths must match.
export const CARD_ACCOUNT_RE = /^Liabilities:CreditCards:[A-Z][A-Za-z0-9]*:[A-Z][A-Za-z0-9]*(:[A-Za-z0-9]+)?$/
export const REWARDS_ACCOUNT_RE = /^Assets:Rewards:[A-Z][A-Za-z0-9]*$/

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

export const proposalPayloadSchema = z.discriminatedUnion('kind', [
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
    patch: cardSchema
      .pick({ name: true, network: true, active: true })
      .partial()
      .extend({ poolProgramme: z.string().min(1).optional() }),
  }),
  z.object({
    kind: z.literal('correction'),
    cardSlug: slugSchema.optional(),
    note: z.string().min(3).max(2000),
  }),
])
export type ProposalPayload = z.infer<typeof proposalPayloadSchema>

export const PROPOSAL_KINDS = ['new-card', 'new-rule', 'edit-card', 'correction'] as const
export const PROPOSAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]
