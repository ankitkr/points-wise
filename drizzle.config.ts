import { defineConfig } from 'drizzle-kit'

// `drizzle-kit generate` emits SQL migrations into ./drizzle. wrangler's
// `migrations_dir` (see wrangler.jsonc) points at the same folder, so
// `wrangler d1 migrations apply` runs exactly these files. drizzle's meta/*
// journal files are ignored by wrangler (it only applies *.sql).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
})
