import { describe, expect, it } from 'vitest'
import { BANKS } from '../../../data/kb/banks'
import { CARDS } from '../../../data/kb/cards'
import { CATEGORIES } from '../../../data/kb/categories'
import { surchargesFor, unknownSurchargeKeys } from '../../../data/kb/surcharges'
import { feesFor, milestonesFor, unknownMilestoneKeys } from '../../../data/kb/milestones'
import { redemptionFor, unknownRedemptionKeys } from '../../../data/kb/redemptions'
import { COMMODITY_VALUES, unpricedTickers, orphanValuationTickers } from '../../../data/kb/valuations'
import { taxTreatmentFor, unknownTaxTreatmentKeys } from '../../../data/kb/tax-treatment'
import {
  bankSchema,
  cardSchema,
  categorySchema,
  commodityValueSchema,
  earnRuleSchema,
  categoryAccount,
  cardAccount,
  poolAccount,
  CARD_ACCOUNT_RE,
  REWARDS_ACCOUNT_RE,
} from './schema'

// CI gate for the KB seed dataset: everything must parse against the schemas
// and be referentially consistent, or the build fails — malformed reference
// data can never ship.

describe('KB seed data', () => {
  it('banks are valid and unique', () => {
    for (const b of BANKS) expect(() => bankSchema.parse(b)).not.toThrow()
    expect(new Set(BANKS.map((b) => b.slug)).size).toBe(BANKS.length)
  })

  it('categories are valid, unique, and derive legal expense accounts', () => {
    for (const c of CATEGORIES) {
      expect(() => categorySchema.parse(c)).not.toThrow()
      expect(categoryAccount(c)).toMatch(/^Expenses:[A-Z][A-Za-z0-9]*(:[A-Z][A-Za-z0-9]*)?$/)
    }
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length)
  })

  it('cards + rules are valid, referentially consistent, with canonical accounts', () => {
    const bankBySlug = new Map(BANKS.map((b) => [b.slug, b]))
    const catSlugs = new Set(CATEGORIES.map((c) => c.slug))
    const cardSlugs = new Set<string>()

    for (const { card, rules } of CARDS) {
      expect(() => cardSchema.parse(card)).not.toThrow()
      expect(cardSlugs.has(card.slug)).toBe(false)
      cardSlugs.add(card.slug)

      const bank = bankBySlug.get(card.bankSlug)
      expect(bank, `bank ${card.bankSlug} for ${card.slug}`).toBeDefined()
      expect(cardAccount(bank!, card)).toMatch(CARD_ACCOUNT_RE)
      expect(poolAccount(bank!, card.beancountName, card.pool.ticker)).toMatch(REWARDS_ACCOUNT_RE)

      expect(rules.length).toBeGreaterThan(0)
      const froms = new Set<string>()
      for (const raw of rules) {
        // Compose surcharges exactly as scripts/seed-kb.ts does, then parse:
        // seed rules are input-shaped (defaulted fields optional), and the
        // real surcharges live in the bank/card maps, not inline — so this is
        // the only place the shipped surcharge data is actually validated.
        const composed = {
          ...raw,
          surcharges: [...(raw.surcharges ?? []), ...surchargesFor(card.bankSlug, card.slug)],
          milestones: [...(raw.milestones ?? []), ...milestonesFor(card.slug)],
          fees: { ...raw.fees, ...feesFor(card.slug) },
          redemption: redemptionFor(card.slug) ?? raw.redemption,
          taxPayments: taxTreatmentFor(card.slug) ?? raw.taxPayments,
        }
        const r = earnRuleSchema.parse(composed)
        expect(froms.has(r.effectiveFrom)).toBe(false) // one rule per date
        froms.add(r.effectiveFrom)
        for (const a of r.accelerators) {
          if (a.category) expect(catSlugs.has(a.category), `category ${a.category}`).toBe(true)
        }
        for (const x of r.exclusions) {
          expect(catSlugs.has(x), `exclusion ${x}`).toBe(true)
        }
        for (const s of r.surcharges) {
          if (s.category) expect(catSlugs.has(s.category), `surcharge category ${s.category}`).toBe(true)
        }
      }
    }
  })

  it('every surcharge map key resolves to a real bank/card slug', () => {
    const bankSlugs = new Set(BANKS.map((b) => b.slug))
    const cardSlugs = new Set(CARDS.map(({ card }) => card.slug))
    // A typo in BANK_SURCHARGES/CARD_SURCHARGES would otherwise silently orphan
    // the fees (never merged, never caught) — this is the guard against that.
    expect(unknownSurchargeKeys(bankSlugs, cardSlugs)).toEqual([])
    expect(unknownMilestoneKeys(cardSlugs)).toEqual([])
    expect(unknownRedemptionKeys(cardSlugs)).toEqual([])
    expect(unknownTaxTreatmentKeys(cardSlugs)).toEqual([])

    // Sanity: the earn/milestone axes are independent — a business card earns AND
    // milestones on tax; Axis counts toward neither.
    expect(taxTreatmentFor('hdfc-bizblack')).toMatchObject({ earns: true, countsToMilestone: true })
    expect(taxTreatmentFor('axis-atlas')).toMatchObject({ earns: false, countsToMilestone: false })

    // Sanity: composition actually attaches fees (e.g. HSBC's rent surcharge).
    const hsbcRent = surchargesFor('hsbc', 'hsbc-live-plus').find((s) => s.kind === 'rent')
    expect(hsbcRent?.percent).toBe(1)
    // Sanity: a fee-waiver milestone carries the annual fee it reverses.
    const eliteWaiver = milestonesFor('sbi-elite').find((m) => m.kind === 'fee-waiver')
    expect(eliteWaiver?.valueInr).toBe(4999)
  })

  it('every reward ticker is priced, every valuation is valid and floor≤realistic≤best', () => {
    const cardTickers = new Set(CARDS.map(({ card }) => card.pool.ticker))
    // Bijection: each card's currency has a ₹ valuation, and no valuation is stale.
    expect(unpricedTickers(cardTickers)).toEqual([])
    expect(orphanValuationTickers(cardTickers)).toEqual([])
    for (const [ticker, v] of Object.entries(COMMODITY_VALUES)) {
      expect(() => commodityValueSchema.parse(v), ticker).not.toThrow()
    }
    // Sanity: a cashback currency is a fixed ₹1, an official value.
    expect(COMMODITY_VALUES.AMZN_CB).toMatchObject({ realisticInr: 1, source: 'official' })
  })
})
