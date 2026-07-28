import { describe, expect, it } from 'vitest'
import {
  effectiveVerified,
  mapKey,
  milestoneKey,
  redemptionKey,
  ruleKey,
  surchargeKey,
  taxKey,
  valuationKey,
  verificationInputSchema,
} from './verify'

describe('verification keys', () => {
  it('build stable, distinct keys per entity', () => {
    expect(ruleKey('hdfc-infinia', '2026-01-01')).toBe('hdfc-infinia@2026-01-01')
    expect(surchargeKey('hdfc-infinia', '2026-01-01', 'rent')).toBe('hdfc-infinia@2026-01-01#rent')
    expect(milestoneKey('hdfc-infinia', '2026-01-01', 2)).toBe('hdfc-infinia@2026-01-01#2')
    expect(valuationKey('HDFC_RP')).toBe('HDFC_RP')
  })

  it('namespaces by type so rule and redemption on the same version never collide', () => {
    const from = '2026-01-01'
    expect(redemptionKey('c', from)).toBe(taxKey('c', from)) // same raw key…
    expect(mapKey('redemption', redemptionKey('c', from))).not.toBe(mapKey('tax', taxKey('c', from))) // …distinct map keys
  })
})

describe('effectiveVerified', () => {
  const from = '2026-01-01'
  const key = ruleKey('c', from)

  it('falls back to the seed flag when there is no override', () => {
    const empty = new Map<string, boolean>()
    expect(effectiveVerified(empty, 'rule', key, true)).toBe(true)
    expect(effectiveVerified(empty, 'rule', key, false)).toBe(false)
  })

  it('lets an admin override win over the seed flag — both directions', () => {
    const verify = new Map([[mapKey('rule', key), true]])
    expect(effectiveVerified(verify, 'rule', key, false)).toBe(true) // promote a seed-false
    const unverify = new Map([[mapKey('rule', key), false]])
    expect(effectiveVerified(unverify, 'rule', key, true)).toBe(false) // demote a seed-true
  })

  it('does not leak an override across entity types sharing a raw key', () => {
    const overrides = new Map([[mapKey('redemption', redemptionKey('c', from)), true]])
    // tax shares the raw key but must stay on its own seed value
    expect(effectiveVerified(overrides, 'tax', taxKey('c', from), false)).toBe(false)
  })
})

describe('verificationInputSchema', () => {
  it('accepts a valid input and rejects an unknown entity type', () => {
    expect(verificationInputSchema.safeParse({ entityType: 'rule', entityKey: 'c@2026-01-01', verified: true }).success).toBe(true)
    expect(verificationInputSchema.safeParse({ entityType: 'bogus', entityKey: 'x', verified: true }).success).toBe(false)
    expect(verificationInputSchema.safeParse({ entityType: 'rule', entityKey: '', verified: true }).success).toBe(false)
  })
})
