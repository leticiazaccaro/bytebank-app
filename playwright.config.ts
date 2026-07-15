import { defineConfig } from 'playwright/test'

// Root-level e2e suite (populated in Phase 10) drives the shell + remotes together.
// See .specs/features/fase-02/tasks.md Test Coverage Matrix.
export default defineConfig({
  testDir: 'e2e',
})
