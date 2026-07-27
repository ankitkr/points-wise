import { eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { users, type Tier } from '@/db/schema'

// The single source of the add/edit rule: only members (standalone/family) may
// write. Used by the UI to hide affordances; server write handlers (Milestone 2)
// must call this against the FRESH D1 tier, never the session tier.
export function canEdit(tier: Tier | null | undefined): boolean {
  return tier === 'standalone' || tier === 'family'
}

export function canInvite(tier: Tier | null | undefined): boolean {
  return tier === 'family'
}

// Admin authority check for Knowledge Base writes. NEVER trust the session's
// isAdmin (display-only) — this re-reads users.is_admin from D1, same
// authority rule as tier. Throws on non-admins; returns the admin's user id.
export async function requireAdmin(db: Db, discordId: string): Promise<string> {
  const row = await db.query.users.findFirst({ where: eq(users.discordId, discordId) })
  if (!row || row.isAdmin !== 1) throw new Error('forbidden: admin role required')
  return row.id
}

// Non-throwing variant for READ gates (admin layout).
export async function isAdminFresh(db: Db, discordId: string): Promise<boolean> {
  const row = await db.query.users.findFirst({ where: eq(users.discordId, discordId) })
  return row?.isAdmin === 1
}
