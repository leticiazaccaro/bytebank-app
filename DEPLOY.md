# Deploy — Vercel (multi-project Multi-Zones)

Each app in this monorepo (`apps/shell`, `apps/mf-dashboard`, `apps/mf-transactions`)
is deployed as its **own separate Vercel Project**, all pointing at this same
Git repository with a different **Root Directory**. `shell` is the entry
point users hit; it rewrites requests to the other two projects server-side
(see `.specs/features/fase-02/design.md` "Architecture Overview").

No `vercel.json` is required for any of the three projects: the rewrites are
plain Next.js `rewrites()` in each app's `next.config.ts`, which Vercel's
Next.js build honors natively, and the remaining per-project configuration
(Root Directory, env vars, Deployment Protection) is done in the Vercel
dashboard, not in code.

## Deploy order (must be followed — see "Build-time env vars" below)

Deploy the two remote zones **first**, then the shell. The shell's rewrite
targets are baked into its build output, so it needs the remotes' production
URLs to exist before it is built.

### 1. `mf-dashboard` project

- **Root Directory**: `apps/mf-dashboard`
- **Framework Preset**: Next.js (auto-detected)
- **Environment Variables**:
  | Name | Value |
  | --- | --- |
  | `API_BASE_URL` | production URL of the real `tech-challenge-2` API |
- Deploy. Note the resulting production domain, e.g. `https://bytebank-mf-dashboard.vercel.app`.

### 2. `mf-transactions` project

- **Root Directory**: `apps/mf-transactions`
- **Framework Preset**: Next.js (auto-detected)
- **Environment Variables**:
  | Name | Value |
  | --- | --- |
  | `API_BASE_URL` | production URL of the real `tech-challenge-2` API |
- Deploy. Note the resulting production domain, e.g. `https://bytebank-mf-transactions.vercel.app`.

### 3. `shell` project

- **Root Directory**: `apps/shell`
- **Framework Preset**: Next.js (auto-detected)
- **Environment Variables**:
  | Name | Value |
  | --- | --- |
  | `API_BASE_URL` | production URL of the real `tech-challenge-2` API |
  | `MF_DASHBOARD_ORIGIN` | production domain from step 1 (e.g. `https://bytebank-mf-dashboard.vercel.app`) |
  | `MF_TRANSACTIONS_ORIGIN` | production domain from step 2 (e.g. `https://bytebank-mf-transactions.vercel.app`) |
- Deploy.

## Build-time env vars (important — same gotcha found in the Docker Compose setup)

`apps/shell/next.config.ts`'s `rewrites()` reads `MF_DASHBOARD_ORIGIN` /
`MF_TRANSACTIONS_ORIGIN` and returns `[]` if either is unset. Next.js
evaluates `rewrites()` during `next build`, not at request time — the result
is serialized into the build output. This means:

- If `shell` is deployed once **before** these env vars are set, the deploy
  will have no rewrites even after you add the variables afterward — you
  must trigger a **new deployment** (Redeploy) of `shell` after setting them,
  not just save the env var.
- Any time `MF_DASHBOARD_ORIGIN`/`MF_TRANSACTIONS_ORIGIN` change (e.g. a
  remote project's domain changes), `shell` must be redeployed.

## Deployment Protection caveat (design.md "Risks & Concerns")

By default, new Vercel Projects have Deployment Protection ("Standard
Protection" / Vercel Authentication) enabled, which challenges unauthenticated
requests with an interactive auth page. `shell`'s rewrite is a server-to-server
request — it cannot complete that interactive challenge, so the rewritten
response would be Vercel's auth-challenge page instead of the zone's actual
content.

**On the `mf-dashboard` and `mf-transactions` projects only**, go to
**Project Settings → Deployment Protection** and either:

- disable **Vercel Authentication** ("Standard Protection") for Production, or
- configure **Trusted Sources** / **Protection Bypass for Automation** to
  allow `shell`'s server-side requests through.

`shell` itself can keep Deployment Protection on (it's the one users hit
directly through their browser).

## Local reference

For local, non-Vercel deployment (Docker Compose), see `docker-compose.yml`
and `.env.example` at the repo root — same env vars, same build-time-baking
caveat, verified end-to-end there.
