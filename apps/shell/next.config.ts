import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @repo/ui ships raw TypeScript source (no pre-build step) — Next must
  // transpile it itself, per the local transpilePackages docs.
  transpilePackages: ['@repo/ui'],
  // Multi-Zones rewrites to mf-dashboard/mf-transactions are added in T18
  // (design.md "apps/shell" -> next.config.ts `rewrites()`).
  async rewrites() {
    return []
  },
}

export default nextConfig
