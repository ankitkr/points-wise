import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// Drizzle client bound to the request's D1 binding. Async because the
// Cloudflare context is resolved per-request.
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true })
  return drizzle(env.D1, { schema })
}

export type Db = Awaited<ReturnType<typeof getDb>>
