import { defineConfig } from 'playwright/test'

// Root-level e2e suite drives the shell + both remotes together (T54/T55).
// See .specs/features/fase-02/tasks.md Test Coverage Matrix.
//
// The real tech-challenge-2 API isn't reachable from this environment, so
// `webServer` below also boots a minimal stub fixture (e2e/fixtures/stub-api-server.mjs)
// that replicates its exact contract, and points all 3 apps' API_BASE_URL at
// it — the stub is a test-only fixture, never imported by app code.
const STUB_API_PORT = 4310
const STUB_API_URL = `http://localhost:${STUB_API_PORT}`
const MF_DASHBOARD_ORIGIN = 'http://localhost:3001'
const MF_TRANSACTIONS_ORIGIN = 'http://localhost:3002'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: [
    {
      command: 'node e2e/fixtures/stub-api-server.mjs',
      port: STUB_API_PORT,
      env: { PORT: String(STUB_API_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: 'npm run dev -w apps/mf-dashboard',
      port: 3001,
      env: { API_BASE_URL: STUB_API_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -w apps/mf-transactions',
      port: 3002,
      env: { API_BASE_URL: STUB_API_URL },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -w apps/shell',
      port: 3000,
      env: {
        API_BASE_URL: STUB_API_URL,
        MF_DASHBOARD_ORIGIN,
        MF_TRANSACTIONS_ORIGIN,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
