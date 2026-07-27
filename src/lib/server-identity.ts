import { headers } from 'next/headers'
import { getToken } from 'next-auth/jwt'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export type ServerIdentity = { ulid: string; discordId: string }

// For server components / server actions (no Request in scope): rebuild one
// from the incoming request headers so getToken can read the session cookie.
export async function requireServerIdentityFromContext(): Promise<ServerIdentity> {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host') ?? 'localhost'
  return requireServerIdentity(new Request(`${proto}://${host}/`, { headers: h }))
}

// The ONLY way server code learns the caller's ULID. Decrypts the next-auth
// JWT server-side (the `session` callback never copies the ULID into the
// client-facing session). Never accept an identity from request input.
export async function requireServerIdentity(req: Request): Promise<ServerIdentity> {
  const { env } = await getCloudflareContext({ async: true })
  const secure = new URL(req.url).protocol === 'https:'
  const token = await getToken({
    req,
    secret: env.AUTH_SECRET,
    secureCookie: secure,
    cookieName: secure ? '__Secure-authjs.session-token' : 'authjs.session-token',
  })
  const ulid = (token as { ulid?: string } | null)?.ulid
  const discordId = (token as { discordId?: string } | null)?.discordId
  if (!ulid || !discordId) throw new UnauthenticatedError()
  return { ulid, discordId }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('unauthenticated')
  }
}
