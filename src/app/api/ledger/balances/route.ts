import { NextResponse } from 'next/server'
import { getLedger } from '@/lib/ledger'
import { requireServerIdentity } from '@/lib/server-identity'
import { withLedgerErrors } from '../route-utils'

export async function GET(req: Request) {
  return withLedgerErrors(async () => {
    const { ulid } = await requireServerIdentity(req)
    const ledger = await getLedger(ulid)
    return NextResponse.json({ balances: await ledger.balances() })
  })
}
