import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { beforeEach, describe, expect, it } from 'vitest'
import { households, memberships, users } from './schema'
import * as schema from './schema'
import { provisionUser } from './provision'

const db = drizzle(env.D1, { schema })

const base = {
  email: 'a@example.com' as string | null,
  emailVerified: null,
  displayName: 'Ankit',
  avatarUrl: null,
}

// Isolated storage rolls back between tests, but clear defensively too.
beforeEach(async () => {
  await db.delete(memberships)
  await db.delete(households)
  await db.delete(users)
})

describe('provisionUser', () => {
  it('mints a user + self-owned household + owner membership on first login', async () => {
    const id = await provisionUser(db, { discordId: 'd1', tier: 'standalone', ...base })
    expect(id.ulid).toBeTruthy()
    expect(id.tier).toBe('standalone')

    expect(await db.select().from(users)).toHaveLength(1)
    const hh = await db.select().from(households)
    expect(hh).toHaveLength(1)
    expect(hh[0].tier).toBe('standalone')
    const ms = await db.select().from(memberships)
    expect(ms).toHaveLength(1)
    expect(ms[0].role).toBe('owner')
    expect(ms[0].status).toBe('active')
  })

  it('is idempotent across re-logins: stable ULID, no duplicate rows, tier re-synced', async () => {
    const first = await provisionUser(db, { discordId: 'd1', tier: 'standalone', ...base })
    const second = await provisionUser(db, { discordId: 'd1', tier: 'family', ...base })

    expect(second.ulid).toBe(first.ulid) // ULID minted once
    expect(await db.select().from(users)).toHaveLength(1)
    expect(await db.select().from(memberships)).toHaveLength(1)
    const hh = await db.select().from(households)
    expect(hh).toHaveLength(1)
    expect(hh[0].tier).toBe('family') // tier re-synced from Discord
  })

  it('enforces one household per owner', async () => {
    const id = await provisionUser(db, { discordId: 'd1', tier: 'standalone', ...base })
    await expect(
      db.insert(households).values({
        id: 'h-dup',
        ownerUserId: id.ulid,
        tier: 'standalone',
        tierSyncedAt: Date.now(),
        createdAt: Date.now(),
      }),
    ).rejects.toThrow()
  })

  it('enforces one active household per person', async () => {
    const me = await provisionUser(db, { discordId: 'd1', tier: 'family', ...base })
    const other = await provisionUser(db, {
      ...base,
      discordId: 'd2',
      tier: 'family',
      email: 'other@example.com',
    })

    // Adding me as an ACTIVE member of another household violates the partial unique index.
    await expect(
      db.insert(memberships).values({
        id: 'm-dup',
        householdId: other.householdId,
        userId: me.ulid,
        role: 'member',
        status: 'active',
        createdAt: Date.now(),
      }),
    ).rejects.toThrow()
  })

  it('allows a pending (invited) membership alongside the active one', async () => {
    const me = await provisionUser(db, { discordId: 'd1', tier: 'family', ...base })
    const other = await provisionUser(db, {
      ...base,
      discordId: 'd2',
      tier: 'family',
      email: 'other@example.com',
    })

    // An 'invited' row is not blocked by the active-only partial unique index.
    await expect(
      db.insert(memberships).values({
        id: 'm-invite',
        householdId: other.householdId,
        userId: me.ulid,
        role: 'member',
        status: 'invited',
        createdAt: Date.now(),
      }),
    ).resolves.toBeDefined()
  })
})
