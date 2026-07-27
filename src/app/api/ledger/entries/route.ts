import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/db/client'
import { kbCategories } from '@/db/schema'
import { buildManualEntry } from '@/lib/ledger-entries'
import { getLedger, requireEditableTier } from '@/lib/ledger'
import { requireServerIdentity } from '@/lib/server-identity'
import { withLedgerErrors } from '../route-utils'

export async function GET(req: Request) {
  return withLedgerErrors(async () => {
    const { ulid } = await requireServerIdentity(req)
    const url = new URL(req.url)
    const ledger = await getLedger(ulid)
    const result = await ledger.listEntries({
      account: url.searchParams.get('account') ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    })
    return NextResponse.json(result)
  })
}

const createEntrySchema = z.object({
  type: z.enum(['purchase', 'refund', 'payment']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cardAccount: z.string().min(1),
  payee: z.string().min(1).max(120),
  narration: z.string().max(300).optional(),
  categorySlug: z.string().optional(),
  mcc: z.string().regex(/^\d{4}$/).optional(),
  amount: z.string().min(1),
})

export async function POST(req: Request) {
  return withLedgerErrors(async () => {
    const identity = await requireServerIdentity(req)
    await requireEditableTier(identity.ulid)

    const input = createEntrySchema.parse(await req.json())

    // Category slug → canonical Expenses:… account, from the KB.
    let categoryAccount: string | undefined
    if (input.type !== 'payment') {
      if (!input.categorySlug) throw new Error('category is required')
      const db = await getDb()
      const cat = await db.query.kbCategories.findFirst({
        where: eq(kbCategories.slug, input.categorySlug),
      })
      if (!cat) throw new Error(`unknown category: ${input.categorySlug}`)
      categoryAccount = cat.account
    }

    const entry = buildManualEntry({ ...input, categoryAccount })
    const ledger = await getLedger(identity.ulid)
    const result = await ledger.postEntry(entry)
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 })
    return NextResponse.json({ id: result.id }, { status: 201 })
  })
}
