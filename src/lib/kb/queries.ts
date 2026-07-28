import { desc, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { kbBanks, kbCards, kbCategories, kbEarnRules, kbProposals } from '@/db/schema'
import { earnRuleSchema, type EarnRule } from './schema'

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

  const latest = new Map<string, { effectiveFrom: string; verified: boolean }>()
  for (const r of rules) {
    if (!latest.has(r.cardSlug)) {
      const parsed = safeRule(r.ruleJson)
      latest.set(r.cardSlug, { effectiveFrom: r.effectiveFrom, verified: parsed?.verified ?? false })
    }
  }
  return cards.map((c) => ({ ...c, active: c.active === 1, latestRule: latest.get(c.slug) ?? null }))
}

export type CardDetail = {
  card: typeof kbCards.$inferSelect
  bank: typeof kbBanks.$inferSelect
  rules: Array<{ id: string; effectiveFrom: string; rule: EarnRule | null; raw: string }>
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
