'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getDb } from '@/db/client'
import { kbBanks, kbCards } from '@/db/schema'
import { cardAccount, poolAccount, slugSchema } from '@/lib/kb/schema'
import { getLedger, requireEditableTier } from '@/lib/ledger'
import { requireServerIdentityFromContext } from '@/lib/server-identity'

const openCardForm = z.object({
  kbSlug: slugSchema,
  nickname: z.string().max(60).optional(),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  statementDay: z.coerce.number().int().min(1).max(31).optional(),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function openCardAction(formData: FormData) {
  try {
    const identity = await requireServerIdentityFromContext()
    await requireEditableTier(identity.ulid)

    const input = openCardForm.parse({
      kbSlug: String(formData.get('kbSlug') ?? ''),
      nickname: String(formData.get('nickname') ?? '').trim() || undefined,
      last4: String(formData.get('last4') ?? '').trim(),
      statementDay: formData.get('statementDay') ? Number(formData.get('statementDay')) : undefined,
      openedDate: String(formData.get('openedDate') ?? '').trim() || undefined,
    })

    const db = await getDb()
    const card = await db.query.kbCards.findFirst({ where: eq(kbCards.slug, input.kbSlug) })
    if (!card) throw new Error(`unknown card: ${input.kbSlug}`)
    // The picker lists only active cards; enforce server-side too (Codex
    // review: a forged form post must not open a KB-inactive card).
    if (card.active !== 1) throw new Error(`card is not active in the KB: ${input.kbSlug}`)
    const bank = await db.query.kbBanks.findFirst({ where: eq(kbBanks.slug, card.bankSlug) })
    if (!bank) throw new Error(`unknown bank for card: ${input.kbSlug}`)

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
        poolAccount: poolAccount(bank, card.beancountName, card.poolTicker),
        poolTicker: card.poolTicker,
      },
    })
    if (!result.ok) throw new Error(result.errors.join('; '))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    redirect(`/cards/new?error=${encodeURIComponent(msg.slice(0, 300))}`)
  }
  revalidatePath('/cards')
  redirect('/cards')
}
