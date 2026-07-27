import { NextResponse } from 'next/server'
import { getLedger, requireEditableTier } from '@/lib/ledger'
import { requireServerIdentity } from '@/lib/server-identity'
import { withLedgerErrors } from '../../route-utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  return withLedgerErrors(async () => {
    const { ulid } = await requireServerIdentity(req)
    const { id } = await params
    const ledger = await getLedger(ulid)
    const entry = await ledger.getEntry(id)
    if (!entry) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ entry })
  })
}

export async function DELETE(req: Request, { params }: Params) {
  return withLedgerErrors(async () => {
    const identity = await requireServerIdentity(req)
    await requireEditableTier(identity.ulid)
    const { id } = await params
    const ledger = await getLedger(identity.ulid)
    const result = await ledger.deleteEntry(id)
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 404 })
    return NextResponse.json({ ok: true })
  })
}
