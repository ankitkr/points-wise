/// <reference types="@cloudflare/vitest-pool-workers" />
import type { D1Migration } from '@cloudflare/vitest-pool-workers/config'

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    D1: D1Database
    LEDGER_DO: DurableObjectNamespace<import('../src/durable/ledger-do').LedgerDO>
    TEST_MIGRATIONS: D1Migration[]
    DISCORD_GUILD_ID: string
    DISCORD_FAMILY_ROLE_ID: string
    DISCORD_STANDALONE_ROLE_ID: string
    DISCORD_ADMIN_ROLE_ID: string
  }
}
