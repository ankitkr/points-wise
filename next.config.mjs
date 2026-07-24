import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the tracing root to this project (a stray lockfile in $HOME otherwise
  // makes Next infer the wrong workspace root, bloating the deploy bundle).
  outputFileTracingRoot: __dirname,
  // `jose` (used by next-auth for JWT/JWE) must stay external so workerd
  // resolves it at runtime rather than webpack trying to bundle it.
  serverExternalPackages: ['jose'],
}

// Makes `getCloudflareContext()` (env bindings: D1, vars, secrets) work in
// `next dev`.
initOpenNextCloudflareForDev()

export default nextConfig
