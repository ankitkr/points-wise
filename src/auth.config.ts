import Discord from 'next-auth/providers/discord'
import type { NextAuthConfig } from 'next-auth'

// Edge-safe config (no DB, no Node APIs) — shared by middleware and the main
// auth instance. `guilds.members.read` lets the sign-in gate read the signer's
// roles in our guild. Cookie security is left at Auth.js defaults on purpose
// (do NOT force `secure: false`): the session cookie is a bearer credential.
export default {
  trustHost: true,
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: { params: { scope: 'identify email guilds.members.read' } },
    }),
  ],
  pages: { signIn: '/login' },
} satisfies NextAuthConfig
