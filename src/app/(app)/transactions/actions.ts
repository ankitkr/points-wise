'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDb } from '@/db/client'
import { kbCategories } from '@/db/schema'
import { buildManualEntry } from '@/lib/ledger-entries'
import { getLedger, requireEditableTier } from '@/lib/ledger'
import { requireServerIdentityFromContext } from '@/lib/server-identity'

export async function addEntryAction(formData: FormData) {
  try {
    const identity = await requireServerIdentityFromContext()
    await requireEditableTier(identity.ulid)

    const type = String(formData.get('type') ?? 'purchase') as 'purchase' | 'refund' | 'payment'
    // Payments carry no category — the form's defaulted select must not leak
    // one onto a payment (buildManualEntry also drops it; belt and braces).
    const categorySlug =
      type === 'payment' ? undefined : String(formData.get('categorySlug') ?? '').trim() || undefined

    let categoryAccount: string | undefined
    if (type !== 'payment') {
      if (!categorySlug) throw new Error('category is required')
      const db = await getDb()
      const cat = await db.query.kbCategories.findFirst({
        where: eq(kbCategories.slug, categorySlug),
      })
      if (!cat) throw new Error(`unknown category: ${categorySlug}`)
      categoryAccount = cat.account
    }

    const entry = buildManualEntry({
      type,
      date: String(formData.get('date') ?? ''),
      cardAccount: String(formData.get('cardAccount') ?? ''),
      payee: String(formData.get('payee') ?? ''),
      narration: String(formData.get('narration') ?? '').trim() || undefined,
      categoryAccount,
      categorySlug,
      mcc: String(formData.get('mcc') ?? '').trim() || undefined,
      amount: String(formData.get('amount') ?? ''),
    })

    const ledger = await getLedger(identity.ulid)
    const result = await ledger.postEntry(entry)
    if (!result.ok) throw new Error(result.errors.join('; '))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    redirect(`/transactions?error=${encodeURIComponent(msg.slice(0, 300))}`)
  }
  revalidatePath('/transactions')
  redirect('/transactions')
}

export async function deleteEntryAction(formData: FormData) {
  try {
    const identity = await requireServerIdentityFromContext()
    await requireEditableTier(identity.ulid)
    const id = String(formData.get('id') ?? '')
    const ledger = await getLedger(identity.ulid)
    const result = await ledger.deleteEntry(id)
    if (!result.ok) throw new Error(result.errors.join('; '))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    redirect(`/transactions?error=${encodeURIComponent(msg.slice(0, 300))}`)
  }
  revalidatePath('/transactions')
}
