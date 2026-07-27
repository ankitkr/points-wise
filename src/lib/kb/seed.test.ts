import { describe, expect, it } from 'vitest'
import { BANKS } from '../../../data/kb/banks'
import { CARDS } from '../../../data/kb/cards'
import { CATEGORIES } from '../../../data/kb/categories'
import {
  bankSchema,
  cardSchema,
  categorySchema,
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
      expect(poolAccount(bank!)).toMatch(REWARDS_ACCOUNT_RE)

      expect(rules.length).toBeGreaterThan(0)
      const froms = new Set<string>()
      for (const r of rules) {
        expect(() => earnRuleSchema.parse(r)).not.toThrow()
        expect(froms.has(r.effectiveFrom)).toBe(false) // one rule per date
        froms.add(r.effectiveFrom)
        for (const a of r.accelerators) {
          if (a.category) expect(catSlugs.has(a.category), `category ${a.category}`).toBe(true)
        }
        for (const x of r.exclusions) {
          expect(catSlugs.has(x), `exclusion ${x}`).toBe(true)
        }
      }
    }
  })
})
