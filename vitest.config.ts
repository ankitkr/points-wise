import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineWorkersConfig(async () => {
  // Read the Drizzle-generated SQL so tests run against the real schema.
  const migrations = await readD1Migrations(path.join(dirname, 'drizzle'))

  return {
    resolve: {
      alias: { '@': path.join(dirname, 'src') },
    },
    test: {
      setupFiles: ['./test/setup.ts'],
      poolOptions: {
        workers: {
          singleWorker: true,
          // Exposes LedgerDO to the runtime so DO tests can bind it.
          main: './test/do-worker.ts',
          miniflare: {
            // The bundled test runtime lags the app's wrangler date; use a date
            // it supports to avoid a fallback warning.
            compatibilityDate: '2025-09-06',
            compatibilityFlags: ['nodejs_compat'],
            d1Databases: { D1: 'points-wise-test' },
            durableObjects: {
              LEDGER_DO: { className: 'LedgerDO', useSQLite: true },
            },
            bindings: {
              TEST_MIGRATIONS: migrations,
              DISCORD_GUILD_ID: 'guild-1',
              DISCORD_FAMILY_ROLE_ID: 'role-family',
              DISCORD_STANDALONE_ROLE_ID: 'role-standalone',
              DISCORD_ADMIN_ROLE_ID: 'role-admin',
            },
          },
        },
      },
    },
  }
})
