import { sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

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
    // Capability flag from the Discord @admin role (re-synced each login).
    // Display comes from the session; every admin WRITE re-reads this column.
    isAdmin: integer('is_admin').notNull().default(0),
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

// ---------------------------------------------------------------------------
// Knowledge Base — shared reference data (banks, cards, earn rules,
// categories) + the proposals approval queue. Authoritative store is D1;
// repo seed files bootstrap it; ONLY admin-gated, Zod-validated writes may
// change it (src/lib/kb/schema.ts holds the shapes).

export const kbBanks = sqliteTable('kb_banks', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  beancountName: text('beancount_name').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const kbCards = sqliteTable('kb_cards', {
  slug: text('slug').primaryKey(),
  bankSlug: text('bank_slug')
    .notNull()
    .references(() => kbBanks.slug),
  name: text('name').notNull(),
  beancountName: text('beancount_name').notNull(),
  network: text('network'),
  poolTicker: text('pool_ticker').notNull(),
  poolProgramme: text('pool_programme').notNull(),
  active: integer('active').notNull().default(1),
  updatedAt: integer('updated_at').notNull(),
})

export const kbEarnRules = sqliteTable(
  'kb_earn_rules',
  {
    id: text('id').primaryKey(), // ULID
    cardSlug: text('card_slug')
      .notNull()
      .references(() => kbCards.slug),
    effectiveFrom: text('effective_from').notNull(), // YYYY-MM-DD
    ruleJson: text('rule_json').notNull(), // Zod-validated EarnRule
    createdAt: integer('created_at').notNull(),
  },
  (t) => [uniqueIndex('kb_earn_rules_card_from_unq').on(t.cardSlug, t.effectiveFrom)],
)

export const kbCategories = sqliteTable('kb_categories', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  root: text('root').notNull(), // one of the ten canonical expense roots
  leaf: text('leaf'),
  account: text('account').notNull(), // derived Expenses:… path, stored for reads
  sort: integer('sort').notNull().default(0),
})

export const kbProposals = sqliteTable('kb_proposals', {
  id: text('id').primaryKey(), // ULID
  kind: text('kind', { enum: ['new-card', 'new-rule', 'edit-card', 'correction'] }).notNull(),
  targetSlug: text('target_slug'),
  payloadJson: text('payload_json').notNull(), // Zod-validated ProposalPayload
  note: text('note'),
  submittedBy: text('submitted_by')
    .notNull()
    .references(() => users.id),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: integer('created_at').notNull(),
})

// Admin verification OVERRIDES. Each KB entity that carries a `verified` flag
// (an earn rule, and the surcharges/milestones/redemption/tax/valuation merged
// into rule_json) can be verified/un-verified from the admin UI. The seed only
// ever writes rule_json — it NEVER touches this table — so a `kb:seed:*` reseed
// cannot clobber an admin's decision. Effective verified = this override if a
// row exists, else the seed's flag. Keyed by (entity_type, stable entity_key).
export const kbVerifications = sqliteTable(
  'kb_verifications',
  {
    entityType: text('entity_type', {
      enum: ['rule', 'surcharge', 'milestone', 'redemption', 'tax', 'valuation'],
    }).notNull(),
    entityKey: text('entity_key').notNull(),
    verified: integer('verified').notNull().default(0),
    verifiedBy: text('verified_by').references(() => users.id),
    verifiedAt: integer('verified_at'),
    note: text('note'),
  },
  (t) => [primaryKey({ columns: [t.entityType, t.entityKey] })],
)

export type KbBank = typeof kbBanks.$inferSelect
export type KbCard = typeof kbCards.$inferSelect
export type KbEarnRule = typeof kbEarnRules.$inferSelect
export type KbCategory = typeof kbCategories.$inferSelect
export type KbProposal = typeof kbProposals.$inferSelect
export type KbVerification = typeof kbVerifications.$inferSelect
