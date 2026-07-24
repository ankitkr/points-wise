import NextAuth from 'next-auth'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import authConfig from './auth.config'
import { getDb } from '@/db/client'
import { provisionUser } from '@/db/provision'
import type { Tier } from '@/db/schema'
import { checkGuildMembership } from '@/lib/discord'

// The raw Discord OAuth profile fields we use. Typed locally so we don't depend
// on the exact exported provider shape.
type DiscordProfileLike = {
  id: string
  username?: string
  global_name?: string | null
  avatar?: string | null
  email?: string | null
  verified?: boolean
}

function discordAvatarUrl(p: DiscordProfileLike): string | null {
  return p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : null
}

function discordName(p: DiscordProfileLike): string | null {
  return p.global_name ?? p.username ?? null
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    // Login gate: only members of our Discord guild may sign in. Not-in-guild
    // (404) and every non-ok status (outage/rate-limit/unauthorized) are denied.
    async signIn({ account }) {
      const token = account?.access_token
      if (!token) return false
      const { env } = await getCloudflareContext({ async: true })
      const check = await checkGuildMembership(token, env)
      return check.ok
    },

    // Provision + sync tier at sign-in (when account/profile are present).
    // Stores the server-only ULID + tier + household on the token.
    async jwt({ token, account, profile }) {
      if (account?.access_token && profile) {
        const { env } = await getCloudflareContext({ async: true })
        const check = await checkGuildMembership(account.access_token, env)
        if (!check.ok) return token // gate handled by signIn; never provision on failure/outage

        const p = profile as DiscordProfileLike
        const db = await getDb()
        const identity = await provisionUser(db, {
          discordId: p.id,
          email: p.email ?? null,
          emailVerified: p.email && p.verified ? Date.now() : null,
          displayName: discordName(p),
          avatarUrl: discordAvatarUrl(p),
          tier: check.tier,
        })

        token.ulid = identity.ulid
        token.householdId = identity.householdId
        token.tier = identity.tier
        token.discordId = p.id
        token.name = discordName(p) ?? token.name
        token.email = p.email ?? token.email
        token.picture = discordAvatarUrl(p) ?? token.picture
      }
      return token
    },

    // Expose ONLY non-sensitive fields to the client. Never `token.ulid`.
    async session({ session, token }) {
      const t = token as { tier?: Tier; householdId?: string; discordId?: string }
      session.user.tier = t.tier ?? 'readonly'
      session.user.householdId = t.householdId ?? ''
      session.user.discordId = t.discordId ?? ''
      return session
    },
  },
})
