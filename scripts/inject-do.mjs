// OpenNext generates .open-next/worker.js without our Durable Object classes.
// wrangler's `durable_objects` bindings need `LedgerDO` exported from the
// worker's entry module, so this post-build step appends the export (wrangler
// bundles the TS import at deploy). Same mechanism as milesvault, minus the
// fetch wrapper — our API routes reach the DO through env bindings, so the
// OpenNext handler stays untouched.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const workerPath = path.resolve('.open-next/worker.js')
const marker = '// POINTSWISE_DO_INJECTED'

const original = await readFile(workerPath, 'utf8')
if (original.includes(marker)) {
  console.log('[inject-do] already injected, skipping')
  process.exit(0)
}

await writeFile(
  workerPath,
  `${original}\n${marker}\nexport { LedgerDO } from "../src/durable/ledger-do.ts"\n`,
)
console.log('[inject-do] exported LedgerDO from', workerPath)
