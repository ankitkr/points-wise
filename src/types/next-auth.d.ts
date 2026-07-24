import type { DefaultSession } from 'next-auth'
import type { Tier } from '@/db/schema'

declare module 'next-auth' {
  interface Session {
    // Client-facing shape. NOTE: no `ulid` here — the ULID is server-only and
    // must never reach the client. `tier` is display-only (write authz re-reads D1).
    user: DefaultSession['user'] & {
      tier: Tier
      householdId: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    // Server-only. Present in the encrypted cookie, stripped from the session.
    ulid?: string
    tier?: Tier
    householdId?: string
  }
}
