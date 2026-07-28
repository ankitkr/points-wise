// Test worker entry: exposes the Durable Object classes to the vitest pool
// (miniflare needs the class exported from the worker's main module).
export { LedgerDO } from '../src/durable/ledger-do'

export default {
  fetch(): Response {
    return new Response('test worker')
  },
}
