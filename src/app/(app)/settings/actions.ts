'use server'

import { and, eq, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { ulid } from 'ulid'
import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { households, memberships, users } from '@/db/schema'

// Authorizes the caller as the family-tier owner of their household. Tier is
// re-read from D1 (never trusted from the session), per the tier-authority rule.
async function requireFamilyOwner() {
  const session = await auth()
  if (!session) throw new Error('unauthenticated')
  const db = await getDb()
  const me = await db.query.users.findFirst({
    where: eq(users.discordId, session.user.discordId),
  })
  const household = await db.query.households.findFirst({
    where: eq(households.id, session.user.householdId),
  })
  if (!me || !household || household.ownerUserId !== me.id) throw new Error('forbidden')
  if (household.tier !== 'family') throw new Error('A Family membership is required to manage members.')
  return { db, me, household }
}

// Invite a registered user into the household. Acceptance (invited -> active,
// with the one-active-household-per-user transition) lands in Milestone 6.
export async function inviteMember(formData: FormData) {
  const identifier = String(formData.get('identifier') ?? '').trim()
  if (!identifier) return
  const { db, me, household } = await requireFamilyOwner()

  const target = await db.query.users.findFirst({
    where: identifier.includes('@')
      ? eq(users.email, identifier)
      : eq(users.discordId, identifier),
  })
  if (!target) {
    throw new Error('That person must sign in to PointsWise once before you can invite them.')
  }
  if (target.id === me.id) throw new Error("You can't invite yourself.")

  await db
    .insert(memberships)
    .values({
      id: ulid(),
      householdId: household.id,
      userId: target.id,
      role: 'member',
      status: 'invited',
      createdAt: Date.now(),
    })
    .onConflictDoNothing({ target: [memberships.householdId, memberships.userId] })

  revalidatePath('/settings')
}

// Remove a member or cancel a pending invite — anything in this household except
// the owner row.
export async function removeMember(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '')
  if (!membershipId) return
  const { db, household } = await requireFamilyOwner()

  await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.householdId, household.id),
        ne(memberships.role, 'owner'),
      ),
    )

  revalidatePath('/settings')
}
