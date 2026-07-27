// Deployable Worker that owns the per-user ledger Durable Object.
//
// The web app (points-wise) binds this class via `script_name` and reaches it
// through getLedger() (src/lib/ledger.ts). Splitting it out keeps the DO
// implementation and its beancount dependencies OUT of the OpenNext web
// bundle, so each Worker keeps its own 3 MB-gzip Free-plan budget and we no
// longer post-process the OpenNext output (scripts/inject-do.mjs is gone).
export { LedgerDO } from '@/durable/ledger-do'

// A DO-only Worker still needs a default handler to deploy. It is never on the
// hot path — all ledger access is via the DO binding from the web Worker — so
// it exposes no route (workers_dev is off) and refuses direct HTTP.
const handler = {
  fetch(): Response {
    return new Response('Not found', { status: 404 })
  },
}
export default handler
