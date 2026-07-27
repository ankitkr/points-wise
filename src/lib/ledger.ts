import { and, eq } from 'drizzle-orm'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { LedgerDO } from '@/durable/ledger-do'
import { getDb } from '@/db/client'
import { households, memberships } from '@/db/schema'
import { canEdit } from '@/lib/authz'

// Stub factory: the ONLY place a LedgerDO is addressed. Callers must have
// authorized the ULID first (requireServerIdentity for self; the family
// assume-role path adds a D1 relationship check in M6).
export async function getLedger(ulid: string): Promise<DurableObjectStub<LedgerDO>> {
  const { env } = await getCloudflareContext({ async: true })
  const ns = env.LEDGER_DO
  if (!ns) throw new Error('LEDGER_DO binding missing')
  return ns.get(ns.idFromName(ulid))
}

// Write-authority check: the caller's ACTIVE household tier, re-read from D1
// (never from the session). Readonly users can view but not write.
export async function requireEditableTier(userId: string): Promise<void> {
  const db = await getDb()
  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.status, 'active')),
  })
  const household = membership
    ? await db.query.households.findFirst({ where: eq(households.id, membership.householdId) })
    : undefined
  if (!canEdit(household?.tier)) {
    throw new ForbiddenError('A Standalone or Family membership is required to add or edit data.')
  }
}

export class ForbiddenError extends Error {}
