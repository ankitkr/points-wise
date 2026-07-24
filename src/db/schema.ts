import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const TIERS = ['readonly', 'standalone', 'family'] as const
export type Tier = (typeof TIERS)[number]

// The D1 directory + authorization store. No ledger data lives here — that
// belongs in the per-user Durable Object keyed by `users.id` (Milestone 2).

export const users = sqliteTable(
  'users',
  {
    // ULID — the canonical identity and the future per-user DO key. Server-only:
    // never exposed to the client or any API.
    id: text('id').primaryKey(),
    // Stable Discord account id — the upsert key (identity survives email change).
    discordId: text('discord_id').notNull(),
    // Attributes (mutable). email is nullable: Discord may not return one.
    email: text('email'),
    emailVerified: integer('email_verified'), // epoch ms; set only when provider reports verified
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('users_discord_id_unq').on(t.discordId),
    // One account per email so a later Google login links to the same user.
    uniqueIndex('users_email_unq')
      .on(t.email)
      .where(sql`${t.email} is not null`),
  ],
)

export const households = sqliteTable(
  'households',
  {
    id: text('id').primaryKey(), // ULID
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => users.id),
    tier: text('tier', { enum: TIERS }).notNull(),
    tierSyncedAt: integer('tier_synced_at'), // epoch ms; when tier last read from Discord
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    // A user owns at most one household.
    uniqueIndex('households_owner_unq').on(t.ownerUserId),
  ],
)

export const memberships = sqliteTable(
  'memberships',
  {
    id: text('id').primaryKey(), // ULID — safe to expose as an opaque handle
    householdId: text('household_id')
      .notNull()
      .references(() => households.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role', { enum: ['owner', 'member'] }).notNull(),
    status: text('status', { enum: ['active', 'invited'] }).notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('memberships_household_user_unq').on(t.householdId, t.userId),
    // Enforces ONE active household per person (partial unique index).
    uniqueIndex('memberships_active_user_unq')
      .on(t.userId)
      .where(sql`${t.status} = 'active'`),
  ],
)

export type User = typeof users.$inferSelect
export type Household = typeof households.$inferSelect
export type Membership = typeof memberships.$inferSelect
