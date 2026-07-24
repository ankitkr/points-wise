import next from 'eslint-config-next'

// eslint-config-next 16 ships a flat config array directly (core-web-vitals +
// typescript), so no FlatCompat shim is needed.
export default [
  ...next,
  {
    ignores: ['.next/**', '.open-next/**', '.wrangler/**', 'drizzle/**', 'node_modules/**'],
  },
]
