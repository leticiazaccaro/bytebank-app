import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
