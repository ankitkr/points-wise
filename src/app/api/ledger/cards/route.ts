import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/db/client'
import { kbBanks, kbCards } from '@/db/schema'
import { cardAccount, poolAccount, slugSchema } from '@/lib/kb/schema'
import { getLedger, requireEditableTier } from '@/lib/ledger'
import { requireServerIdentity } from '@/lib/server-identity'
import { withLedgerErrors } from '../route-utils'

export async function GET(req: Request) {
  return withLedgerErrors(async () => {
    const { ulid } = await requireServerIdentity(req)
    const ledger = await getLedger(ulid)
    return NextResponse.json({ cards: await ledger.listCards() })
  })
}

const openCardSchema = z.object({
  kbSlug: slugSchema,
  nickname: z.string().max(60).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  statementDay: z.number().int().min(1).max(31).optional(),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(req: Request) {
  return withLedgerErrors(async () => {
    const identity = await requireServerIdentity(req)
    await requireEditableTier(identity.ulid)

    const input = openCardSchema.parse(await req.json())
    const db = await getDb()
    const card = await db.query.kbCards.findFirst({ where: eq(kbCards.slug, input.kbSlug) })
    if (!card) throw new Error(`unknown card: ${input.kbSlug}`)
    const bank = await db.query.kbBanks.findFirst({ where: eq(kbBanks.slug, card.bankSlug) })
    if (!bank) throw new Error(`unknown bank for card: ${input.kbSlug}`)

    // Canonical paths come from the KB — never assembled client-side.
    const account = input.last4
      ? `${cardAccount(bank, card)}:${input.last4}`
      : cardAccount(bank, card)

    const ledger = await getLedger(identity.ulid)
    const result = await ledger.openCard({
      account,
      openedDate: input.openedDate ?? new Date().toISOString().slice(0, 10),
      meta: {
        kbSlug: card.slug,
        nickname: input.nickname,
        last4: input.last4,
        statementDay: input.statementDay,
        poolAccount: poolAccount(bank),
        poolTicker: card.poolTicker,
      },
    })
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 })
    return NextResponse.json({ id: result.id, account }, { status: 201 })
  })
}
