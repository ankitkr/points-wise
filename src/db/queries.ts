import { eq } from 'drizzle-orm'
import type { Db } from './client'
import { memberships, users } from './schema'

// A household member as shown in the UI. NOTE: intentionally omits `users.id`
// (the server-only ULID) — only the opaque `membershipId` handle is exposed.
export type MemberView = {
  membershipId: string
  name: string | null
  email: string | null
  discordId: string
  role: 'owner' | 'member'
  status: 'active' | 'invited'
}

export async function listHouseholdMembers(db: Db, householdId: string): Promise<MemberView[]> {
  return db
    .select({
      membershipId: memberships.id,
      name: users.displayName,
      email: users.email,
      discordId: users.discordId,
      role: memberships.role,
      status: memberships.status,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.householdId, householdId))
}
