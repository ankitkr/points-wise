import { describe, expect, it } from 'vitest'
import { canEdit, canInvite } from './authz'

describe('canEdit', () => {
  it('allows member tiers, denies readonly/none', () => {
    expect(canEdit('standalone')).toBe(true)
    expect(canEdit('family')).toBe(true)
    expect(canEdit('readonly')).toBe(false)
    expect(canEdit(null)).toBe(false)
    expect(canEdit(undefined)).toBe(false)
  })
})

describe('canInvite', () => {
  it('only family may invite', () => {
    expect(canInvite('family')).toBe(true)
    expect(canInvite('standalone')).toBe(false)
    expect(canInvite('readonly')).toBe(false)
    expect(canInvite(null)).toBe(false)
  })
})
