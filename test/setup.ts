import { applyD1Migrations, env, fetchMock } from 'cloudflare:test'
import { afterEach, beforeAll } from 'vitest'

beforeAll(async () => {
  // Seed the schema (persists across isolated per-test storage).
  await applyD1Migrations(env.D1, env.TEST_MIGRATIONS)
  // Intercept all outbound fetch; fail on any un-mocked network call.
  fetchMock.activate()
  fetchMock.disableNetConnect()
})

afterEach(() => {
  fetchMock.assertNoPendingInterceptors()
})
