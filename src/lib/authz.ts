import type { Tier } from '@/db/schema'

// The single source of the add/edit rule: only members (standalone/family) may
// write. Used by the UI to hide affordances; server write handlers (Milestone 2)
// must call this against the FRESH D1 tier, never the session tier.
export function canEdit(tier: Tier | null | undefined): boolean {
  return tier === 'standalone' || tier === 'family'
}

export function canInvite(tier: Tier | null | undefined): boolean {
  return tier === 'family'
}
