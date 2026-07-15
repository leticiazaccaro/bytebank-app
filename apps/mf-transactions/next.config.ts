import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @repo/ui and @repo/shared ship raw TypeScript source (no pre-build step)
  // — Next must transpile them itself, same pattern as apps/shell and
  // apps/mf-dashboard.
  transpilePackages: ['@repo/ui', '@repo/shared'],
  // Multi-Zones: this zone is rewritten to from the shell for
  // "/transactions/*" (design.md "apps/mf-transactions"). assetPrefix keeps
  // this zone's _next/... static assets from colliding with the other zones
  // on the same domain — see local Next docs
  // (node_modules/next/dist/docs/01-app/02-guides/multi-zones.md).
  assetPrefix: '/transactions-static',
}

export default nextConfig
