import { NextResponse } from 'next/server'
import { ForbiddenError } from '@/lib/ledger'
import { UnauthenticatedError } from '@/lib/server-identity'

// Uniform error mapping for /api/ledger handlers.
export async function withLedgerErrors(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
