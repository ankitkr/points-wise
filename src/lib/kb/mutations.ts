import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import type { Db } from '@/db/client'
import { kbBanks, kbCards, kbEarnRules, kbVerifications } from '@/db/schema'
import { verificationInputSchema, type VerificationInput } from './verify'
import {
  bankSchema,
  cardSchema,
  cardPatchSchema,
  earnRuleSchema,
  cardAccount,
  poolAccount,
  CARD_ACCOUNT_RE,
  REWARDS_ACCOUNT_RE,
  type Bank,
  type Card,
  type CardPatch,
  type EarnRule,
  type ProposalPayload,
} from './schema'

// All KB mutations funnel through here — admin server actions AND proposal
// approval. Every write re-validates with the Zod schemas and the canonical
// account-path regexes, so a malformed card cannot enter the KB regardless of
// the path that proposed it.

export async function upsertBank(db: Db, input: Bank): Promise<void> {
  const bank = bankSchema.parse(input)
  await db
    .insert(kbBanks)
    .values({ ...toBankRow(bank), updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: kbBanks.slug,
      set: { name: bank.name, beancountName: bank.beancountName, updatedAt: Date.now() },
    })
}

export async function insertCardWithRule(db: Db, cardInput: Card, ruleInput: EarnRule): Promise<void> {
  const card = cardSchema.parse(cardInput)
  const rule = earnRuleSchema.parse(ruleInput)

  const bank = await db.query.kbBanks.findFirst({ where: eq(kbBanks.slug, card.bankSlug) })
  if (!bank) throw new Error(`unknown bank: ${card.bankSlug}`)
  assertCanonicalPaths({ slug: bank.slug, beancountName: bank.beancountName }, card)

  const existing = await db.query.kbCards.findFirst({ where: eq(kbCards.slug, card.slug) })
  if (existing) throw new Error(`card already exists: ${card.slug}`)

  // Atomic: a card can never exist without its initial earn rule.
  await db.batch([
    db.insert(kbCards).values(toCardRow(card)),
    db.insert(kbEarnRules).values(toRuleRow(card.slug, rule)),
  ])
}

export async function updateCardFields(db: Db, slug: string, patchInput: CardPatch): Promise<void> {
  // Schema-validate the patch — casts are not validation (Codex review).
  const patch = cardPatchSchema.parse(patchInput)
  const existing = await db.query.kbCards.findFirst({ where: eq(kbCards.slug, slug) })
  if (!existing) throw new Error(`unknown card: ${slug}`)
  await db
    .update(kbCards)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.network !== undefined ? { network: patch.network } : {}),
      ...(patch.active !== undefined ? { active: patch.active ? 1 : 0 } : {}),
      ...(patch.poolProgramme !== undefined ? { poolProgramme: patch.poolProgramme } : {}),
      updatedAt: Date.now(),
    })
    .where(eq(kbCards.slug, slug))
}

export async function addRuleVersion(db: Db, cardSlug: string, ruleInput: EarnRule): Promise<void> {
  const rule = earnRuleSchema.parse(ruleInput)
  const card = await db.query.kbCards.findFirst({ where: eq(kbCards.slug, cardSlug) })
  if (!card) throw new Error(`unknown card: ${cardSlug}`)
  // Append-only versioning: same effective_from = correction of that version.
  await db
    .insert(kbEarnRules)
    .values(toRuleRow(cardSlug, rule))
    .onConflictDoUpdate({
      target: [kbEarnRules.cardSlug, kbEarnRules.effectiveFrom],
      set: { ruleJson: JSON.stringify(rule) },
    })
}

// Applies an approved proposal. `correction` proposals carry free text — there
// is nothing mechanical to apply; approving acknowledges them (the admin makes
// the actual edit via the card pages).
export async function applyProposal(db: Db, payload: ProposalPayload): Promise<void> {
  switch (payload.kind) {
    case 'new-card':
      await upsertBank(db, payload.bank)
      await insertCardWithRule(db, payload.card, payload.rule)
      return
    case 'new-rule':
      await addRuleVersion(db, payload.cardSlug, payload.rule)
      return
    case 'edit-card':
      await updateCardFields(db, payload.cardSlug, payload.patch)
      return
    case 'correction':
      return
  }
}

// Set (or clear) an admin verification override for one KB entity. Writes ONLY
// to kb_verifications, never to rule_json — so a reseed can't revert it. Idempotent
// upsert on the composite (entity_type, entity_key) key.
export async function setVerification(db: Db, adminUserId: string, input: VerificationInput): Promise<void> {
  const v = verificationInputSchema.parse(input)
  const now = Date.now()
  await db
    .insert(kbVerifications)
    .values({
      entityType: v.entityType,
      entityKey: v.entityKey,
      verified: v.verified ? 1 : 0,
      verifiedBy: adminUserId,
      verifiedAt: now,
      note: v.note ?? null,
    })
    .onConflictDoUpdate({
      target: [kbVerifications.entityType, kbVerifications.entityKey],
      set: { verified: v.verified ? 1 : 0, verifiedBy: adminUserId, verifiedAt: now, note: v.note ?? null },
    })
}

function assertCanonicalPaths(bank: Pick<Bank, 'slug' | 'beancountName'>, card: Card): void {
  const acct = cardAccount(bank, card)
  if (!CARD_ACCOUNT_RE.test(acct)) throw new Error(`invalid card account path: ${acct}`)
  const pool = poolAccount(bank, card.beancountName, card.pool.ticker)
  if (!REWARDS_ACCOUNT_RE.test(pool)) throw new Error(`invalid pool account path: ${pool}`)
}

function toBankRow(b: Bank) {
  return { slug: b.slug, name: b.name, beancountName: b.beancountName }
}

function toCardRow(c: Card) {
  return {
    slug: c.slug,
    bankSlug: c.bankSlug,
    name: c.name,
    beancountName: c.beancountName,
    network: c.network ?? null,
    poolTicker: c.pool.ticker,
    poolProgramme: c.pool.programme,
    active: c.active ? 1 : 0,
    updatedAt: Date.now(),
  }
}

function toRuleRow(cardSlug: string, r: EarnRule) {
  return {
    id: ulid(),
    cardSlug,
    effectiveFrom: r.effectiveFrom,
    ruleJson: JSON.stringify(r),
    createdAt: Date.now(),
  }
}
