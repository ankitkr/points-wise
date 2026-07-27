'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ulid } from 'ulid'
import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { households, kbProposals, users } from '@/db/schema'
import { canEdit } from '@/lib/authz'
import { proposalPayloadSchema } from '@/lib/kb/schema'

// Member-tier users suggest KB corrections; admins review them in
// /admin/kb/proposals. Tier is re-read from D1 (readonly cannot submit).
export async function submitSuggestion(formData: FormData) {
  try {
    const session = await auth()
    if (!session) throw new Error('unauthenticated')
    const db = await getDb()

    const me = await db.query.users.findFirst({
      where: eq(users.discordId, session.user.discordId),
    })
    if (!me) throw new Error('unknown user')
    const household = await db.query.households.findFirst({
      where: eq(households.id, session.user.householdId),
    })
    if (!canEdit(household?.tier)) {
      throw new Error('A Standalone or Family membership is required to suggest KB changes.')
    }

    const cardSlug = String(formData.get('cardSlug') ?? '').trim() || undefined
    const note = String(formData.get('note') ?? '').trim()
    const payload = proposalPayloadSchema.parse({ kind: 'correction', cardSlug, note })

    await db.insert(kbProposals).values({
      id: ulid(),
      kind: 'correction',
      targetSlug: cardSlug ?? null,
      payloadJson: JSON.stringify(payload),
      note,
      submittedBy: me.id,
      status: 'pending',
      createdAt: Date.now(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    redirect(`/kb/suggest?error=${encodeURIComponent(msg.slice(0, 300))}`)
  }
  redirect('/kb/suggest?sent=1')
}
