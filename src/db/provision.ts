import { ulid } from 'ulid'
import type { Db } from './client'
import { households, memberships, users, type Tier } from './schema'

export type ProvisionInput = {
  discordId: string
  email: string | null
  emailVerified: number | null
  displayName: string | null
  avatarUrl: string | null
  tier: Tier
}

export type Identity = {
  ulid: string
  householdId: string
  tier: Tier
}

// Idempotent, race-safe provisioning run on every login.
//
// Each step is a single atomic upsert guarded by a unique constraint, so
// concurrent first-logins for the same Discord id cannot mint competing rows:
//   1. get-or-mint the user (ULID minted once, kept stable); refresh attributes.
//   2. get-or-create the user's self-owned household; re-sync tier.
//   3. ensure the owner membership.
// Steps aren't wrapped in one transaction because step 2/3 depend on step 1's
// returned id — but every step is self-healing on the next login, so a mid-way
// failure recovers automatically.
export async function provisionUser(db: Db, input: ProvisionInput): Promise<Identity> {
  const now = Date.now()

  const [userRow] = await db
    .insert(users)
    .values({
      id: ulid(),
      discordId: input.discordId,
      email: input.email,
      emailVerified: input.emailVerified,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: users.discordId,
      set: {
        email: input.email,
        emailVerified: input.emailVerified,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      },
    })
    .returning({ id: users.id })
  const userId = userRow.id

  const [householdRow] = await db
    .insert(households)
    .values({
      id: ulid(),
      ownerUserId: userId,
      tier: input.tier,
      tierSyncedAt: now,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: households.ownerUserId,
      set: { tier: input.tier, tierSyncedAt: now },
    })
    .returning({ id: households.id })
  const householdId = householdRow.id

  await db
    .insert(memberships)
    .values({
      id: ulid(),
      householdId,
      userId,
      role: 'owner',
      status: 'active',
      createdAt: now,
    })
    .onConflictDoNothing({ target: [memberships.householdId, memberships.userId] })

  return { ulid: userId, householdId, tier: input.tier }
}
