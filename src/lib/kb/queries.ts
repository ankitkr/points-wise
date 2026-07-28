import { desc, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { kbBanks, kbCards, kbCategories, kbEarnRules, kbProposals, kbValuations, kbVerifications } from '@/db/schema'
import type { KbValuation } from '@/db/schema'
import { earnRuleSchema, type EarnRule } from './schema'
import { effectiveVerified, mapKey, ruleEntities, type VerifyEntityType } from './verify'

// All admin verification overrides as a lookup: `${entityType}:${entityKey}` →
// verified. The table is small (one row per verified entity), so a full read is
// cheap and simpler than per-entity joins.
export async function getVerificationMap(db: Db): Promise<Map<string, boolean>> {
  const rows = await db.select().from(kbVerifications)
  const m = new Map<string, boolean>()
  for (const r of rows) m.set(mapKey(r.entityType as VerifyEntityType, r.entityKey), r.verified === 1)
  return m
}

export type CardListRow = {
  slug: string
  name: string
  bankName: string
  network: string | null
  poolTicker: string
  active: boolean
  latestRule: { effectiveFrom: string; verified: boolean } | null
}

export async function listBanks(db: Db) {
  return db.select().from(kbBanks).orderBy(kbBanks.name)
}

export async function listCategories(db: Db) {
  return db.select().from(kbCategories).orderBy(kbCategories.sort)
}

export async function listCards(db: Db): Promise<CardListRow[]> {
  const cards = await db
    .select({
      slug: kbCards.slug,
      name: kbCards.name,
      bankName: kbBanks.name,
      network: kbCards.network,
      poolTicker: kbCards.poolTicker,
      active: kbCards.active,
    })
    .from(kbCards)
    .innerJoin(kbBanks, eq(kbCards.bankSlug, kbBanks.slug))
    .orderBy(kbBanks.name, kbCards.name)

  const rules = await db
    .select({
      cardSlug: kbEarnRules.cardSlug,
      effectiveFrom: kbEarnRules.effectiveFrom,
      ruleJson: kbEarnRules.ruleJson,
    })
    .from(kbEarnRules)
    .orderBy(desc(kbEarnRules.effectiveFrom))

  // Badge reflects the EFFECTIVE verified state (admin override wins over seed).
  const overrides = await getVerificationMap(db)
  const latest = new Map<string, { effectiveFrom: string; verified: boolean }>()
  for (const r of rules) {
    if (!latest.has(r.cardSlug)) {
      const parsed = safeRule(r.ruleJson)
      // The rule-level entity is the first entry ruleEntities() returns.
      const ruleEntity = parsed ? ruleEntities(r.cardSlug, r.effectiveFrom, parsed)[0] : null
      const verified = ruleEntity
        ? effectiveVerified(overrides, 'rule', ruleEntity.entityKey, ruleEntity.seedVerified)
        : false
      latest.set(r.cardSlug, { effectiveFrom: r.effectiveFrom, verified })
    }
  }
  return cards.map((c) => ({ ...c, active: c.active === 1, latestRule: latest.get(c.slug) ?? null }))
}

export type CardDetail = {
  card: typeof kbCards.$inferSelect
  bank: typeof kbBanks.$inferSelect
  rules: Array<{ id: string; effectiveFrom: string; rule: EarnRule | null; raw: string }>
  // Admin verification overrides (`${entityType}:${entityKey}` → verified) so the
  // page can compute effective-verified per rule / surcharge / milestone / etc.
  overrides: Map<string, boolean>
  // The card's pool-ticker valuation row (null if not seeded), for its verify toggle.
  valuation: KbValuation | null
}

export async function getCardDetail(db: Db, slug: string): Promise<CardDetail | null> {
  const card = await db.query.kbCards.findFirst({ where: eq(kbCards.slug, slug) })
  if (!card) return null
  const bank = await db.query.kbBanks.findFirst({ where: eq(kbBanks.slug, card.bankSlug) })
  if (!bank) return null
  const rows = await db
    .select()
    .from(kbEarnRules)
    .where(eq(kbEarnRules.cardSlug, slug))
    .orderBy(desc(kbEarnRules.effectiveFrom))
  return {
    card,
    bank,
    rules: rows.map((r) => ({
      id: r.id,
      effectiveFrom: r.effectiveFrom,
      rule: safeRule(r.ruleJson),
      raw: r.ruleJson,
    })),
    overrides: await getVerificationMap(db),
    valuation: (await db.query.kbValuations.findFirst({ where: eq(kbValuations.ticker, card.poolTicker) })) ?? null,
  }
}

export async function listProposals(db: Db, status: 'pending' | 'approved' | 'rejected') {
  return db
    .select()
    .from(kbProposals)
    .where(eq(kbProposals.status, status))
    .orderBy(desc(kbProposals.createdAt))
}

export async function pendingProposalCount(db: Db): Promise<number> {
  const rows = await db
    .select({ id: kbProposals.id })
    .from(kbProposals)
    .where(eq(kbProposals.status, 'pending'))
  return rows.length
}

function safeRule(json: string): EarnRule | null {
  try {
    return earnRuleSchema.parse(JSON.parse(json))
  } catch {
    return null
  }
}
