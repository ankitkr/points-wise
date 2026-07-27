/// <reference types="@cloudflare/workers-types" />

// Cloudflare bindings + vars/secrets available via `getCloudflareContext().env`.
// `wrangler types` regenerates a `cloudflare-env.d.ts` that merges with this at
// build time; this hand-written copy keeps the repo type-checkable before that
// runs.
interface CloudflareEnv {
  // Bindings
  D1: D1Database
  ASSETS: Fetcher

  // Secrets (.dev.vars locally; `wrangler secret put` in prod)
  AUTH_SECRET: string
  AUTH_DISCORD_ID: string
  AUTH_DISCORD_SECRET: string
  DISCORD_GUILD_ID: string
  DISCORD_FAMILY_ROLE_ID: string
  DISCORD_STANDALONE_ROLE_ID: string
  DISCORD_ADMIN_ROLE_ID: string
}
