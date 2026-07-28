import { describe, expect, it } from 'vitest'
import { earnRuleSchema, type EarnRuleInput } from './schema'
import { effectiveVerified, mapKey, ruleEntities, valuationEntity, verificationInputSchema } from './verify'

const rule = (over: Partial<EarnRuleInput>) =>
  earnRuleSchema.parse({ effectiveFrom: '2026-01-01', base: { points: 1, per: 100 }, ...over })

const keyOf = (r: ReturnType<typeof rule>, type: string, i = 0) =>
  ruleEntities('c', '2026-01-01', r).filter((e) => e.entityType === type)[i]?.entityKey

describe('content-hash entity keys', () => {
  it('gives two same-`kind` surcharges DISTINCT keys (the live IDFC dual-fuel case)', () => {
    const r = rule({
      surcharges: [
        { kind: 'fuel', percent: 1, waiverCapPerCycle: 400 },
        { kind: 'fuel', percent: 1, threshold: 30000, applies: 'above-threshold' },
      ],
    })
    const subs = ruleEntities('c', '2026-01-01', r).filter((e) => e.entityType === 'surcharge')
    expect(subs).toHaveLength(2)
    expect(subs[0].entityKey).not.toBe(subs[1].entityKey) // no collision
  })

  it('is reorder-safe: a milestone key follows its contents, not its array index', () => {
    const m1 = { kind: 'points' as const, points: 1000, spendThreshold: 100000 }
    const m2 = { kind: 'voucher' as const, valueInr: 1500, spendThreshold: 150000 }
    const a = ruleEntities('c', '2026-01-01', rule({ milestones: [m1, m2] })).filter((e) => e.entityType === 'milestone')
    const b = ruleEntities('c', '2026-01-01', rule({ milestones: [m2, m1] })).filter((e) => e.entityType === 'milestone')
    expect(new Set(a.map((e) => e.entityKey))).toEqual(new Set(b.map((e) => e.entityKey)))
  })

  it('changes the key when contents materially change (stale verification auto-clears)', () => {
    const k1 = keyOf(rule({ surcharges: [{ kind: 'rent', percent: 1 }] }), 'surcharge')
    const k2 = keyOf(rule({ surcharges: [{ kind: 'rent', percent: 2 }] }), 'surcharge')
    expect(k1).not.toBe(k2)
  })

  it('rule key ignores notes but tracks the rate AND the accelerated cap', () => {
    const base = keyOf(rule({ notes: 'x' }), 'rule')
    expect(keyOf(rule({ notes: 'totally different note' }), 'rule')).toBe(base) // notes don't matter
    expect(keyOf(rule({ base: { points: 5, per: 200 } }), 'rule')).not.toBe(base) // rate does
    expect(keyOf(rule({ acceleratedMonthlyCapPoints: 5000 }), 'rule')).not.toBe(base) // cap is material
  })

  it('identity ignores the bootstrap `verified` flag (a reseed flip must NOT detach an override)', () => {
    const a = keyOf(rule({ surcharges: [{ kind: 'rent', percent: 1 }] }), 'surcharge')
    const b = keyOf(rule({ surcharges: [{ kind: 'rent', percent: 1, verified: true }] }), 'surcharge')
    const c = keyOf(rule({ surcharges: [{ kind: 'rent', percent: 1, notes: 'cosmetic' }] }), 'surcharge')
    expect(a).toBe(b) // verified flip → same key
    expect(a).toBe(c) // notes edit → same key
  })

  it('treats unordered arrays as sets (reordering exclusions/MCCs keeps identity)', () => {
    const x = keyOf(rule({ exclusions: ['fuel', 'rent'], excludedMccs: ['5541', '6513'] }), 'rule')
    const y = keyOf(rule({ exclusions: ['rent', 'fuel'], excludedMccs: ['6513', '5541'] }), 'rule')
    expect(x).toBe(y)
  })
})

describe('effectiveVerified', () => {
  const k = keyOf(rule({}), 'rule')!
  it('falls back to the seed flag with no override', () => {
    expect(effectiveVerified(new Map(), 'rule', k, true)).toBe(true)
    expect(effectiveVerified(new Map(), 'rule', k, false)).toBe(false)
  })
  it('lets an admin override win — both directions', () => {
    expect(effectiveVerified(new Map([[mapKey('rule', k), true]]), 'rule', k, false)).toBe(true)
    expect(effectiveVerified(new Map([[mapKey('rule', k), false]]), 'rule', k, true)).toBe(false)
  })
})

describe('valuationEntity', () => {
  it('takes seedVerified from the D1 row and defaults false when unseeded', () => {
    const seeded = valuationEntity('HDFC_RP', { floorInr: 0.2, realisticInr: 0.5, bestInr: 1, source: 'community', verified: 1 })
    expect(seeded.seedVerified).toBe(true)
    expect(valuationEntity('HDFC_RP', null).seedVerified).toBe(false)
  })
  it('changes key when the valuation numbers change', () => {
    const a = valuationEntity('X', { floorInr: 0.2, realisticInr: 0.5, bestInr: 1, source: 'community', verified: 0 })
    const b = valuationEntity('X', { floorInr: 0.2, realisticInr: 0.6, bestInr: 1, source: 'community', verified: 0 })
    expect(a.entityKey).not.toBe(b.entityKey)
  })
})

describe('verificationInputSchema', () => {
  it('accepts valid input, rejects unknown type / empty key', () => {
    expect(verificationInputSchema.safeParse({ entityType: 'rule', entityKey: 'c@2026-01-01:abc', verified: true }).success).toBe(true)
    expect(verificationInputSchema.safeParse({ entityType: 'bogus', entityKey: 'x', verified: true }).success).toBe(false)
    expect(verificationInputSchema.safeParse({ entityType: 'rule', entityKey: '', verified: true }).success).toBe(false)
  })
})
