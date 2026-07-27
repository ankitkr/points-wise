/// <reference types="@cloudflare/workers-types/experimental" />

// Cloudflare bindings + vars/secrets available via `getCloudflareContext().env`.
// `wrangler types` regenerates a `cloudflare-env.d.ts` that merges with this at
// build time; this hand-written copy keeps the repo type-checkable before that
// runs. (The `experimental` entrypoint also declares the `cloudflare:workers`
// module — the DurableObject base class the LedgerDO extends.)
interface CloudflareEnv {
  // Bindings
  D1: D1Database
  ASSETS: Fetcher
  LEDGER_DO: DurableObjectNamespace<import('../durable/ledger-do').LedgerDO>

  // Secrets (.dev.vars locally; `wrangler secret put` in prod)
  AUTH_SECRET: string
  AUTH_DISCORD_ID: string
  AUTH_DISCORD_SECRET: string
  DISCORD_GUILD_ID: string
  DISCORD_FAMILY_ROLE_ID: string
  DISCORD_STANDALONE_ROLE_ID: string
  DISCORD_ADMIN_ROLE_ID: string
}
