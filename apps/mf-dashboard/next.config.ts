import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker: self-hosting.md / output.md (local Next docs) — emits
  // .next/standalone with only the files needed to run `node server.js`,
  // used by apps/mf-dashboard/Dockerfile's `runner` stage (design.md Tech
  // Decisions).
  output: 'standalone',
  // @repo/ui and @repo/shared ship raw TypeScript source (no pre-build step)
  // — Next must transpile them itself, same pattern as apps/shell.
  transpilePackages: ['@repo/ui', '@repo/shared'],
  // Multi-Zones: this zone is rewritten to from the shell for "/" and
  // "/dashboard/*" (design.md "apps/mf-dashboard"). assetPrefix keeps this
  // zone's _next/... static assets from colliding with the other zones on
  // the same domain — see local Next docs
  // (node_modules/next/dist/docs/01-app/02-guides/multi-zones.md).
  assetPrefix: '/dashboard-static',
}

export default nextConfig
