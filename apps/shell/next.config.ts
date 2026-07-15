import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker: self-hosting.md / output.md (local Next docs) — emits
  // .next/standalone with only the files needed to run `node server.js`,
  // used by apps/shell/Dockerfile's `runner` stage (design.md Tech Decisions).
  output: 'standalone',
  // @repo/ui ships raw TypeScript source (no pre-build step) — Next must
  // transpile it itself, per the local transpilePackages docs.
  transpilePackages: ['@repo/ui', '@repo/shared'],
  // Multi-Zones rewrites to mf-dashboard/mf-transactions (design.md "apps/shell"
  // -> next.config.ts `rewrites()`). Origins come from env vars (never
  // hardcoded, per AC INFRA-03) — mf-dashboard/mf-transactions don't exist
  // yet in this batch, so this gracefully no-ops until they're deployed and
  // the env vars are set.
  async rewrites() {
    const dashboardOrigin = process.env.MF_DASHBOARD_ORIGIN
    const transactionsOrigin = process.env.MF_TRANSACTIONS_ORIGIN

    if (!dashboardOrigin || !transactionsOrigin) return []

    return [
      { source: '/', destination: `${dashboardOrigin}/` },
      { source: '/dashboard/:path*', destination: `${dashboardOrigin}/dashboard/:path*` },
      { source: '/transactions/:path*', destination: `${transactionsOrigin}/transactions/:path*` },
    ]
  },
}

export default nextConfig
