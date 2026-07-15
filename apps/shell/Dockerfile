# apps/shell — multi-stage build (deps -> builder -> runner) producing a
# minimal, non-root runtime image via Next.js `output: "standalone"`.
# Pattern per design.md "Tech Decisions" and the local Next.js docs
# (node_modules/next/dist/docs/01-app/02-guides/self-hosting.md, output.md).
#
# Build context is the monorepo ROOT (npm workspaces — the lockfile and the
# other workspaces must be visible to `npm ci`):
#   docker build -f apps/shell/Dockerfile -t bytebank-shell .

# ---- deps: install the full npm workspace once, from the lockfile ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci

# ---- builder: build only the shell workspace ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
# next.config.ts's rewrites() runs during `next build` (it's serialized into
# .next/routes-manifest.json, not re-evaluated by `next start`/server.js) —
# so the zone origins must be available as build args, not just as runtime
# `environment:` on the container. See docker-compose.yml.
ARG MF_DASHBOARD_ORIGIN
ARG MF_TRANSACTIONS_ORIGIN
ENV MF_DASHBOARD_ORIGIN=${MF_DASHBOARD_ORIGIN}
ENV MF_TRANSACTIONS_ORIGIN=${MF_TRANSACTIONS_ORIGIN}
RUN npm run build -w apps/shell
# apps/shell has no public/ assets yet — the runner stage's COPY expects the
# directory to exist regardless (per the local docs' standalone-output note).
RUN mkdir -p apps/shell/public

# ---- runner: minimal non-root runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

# `output: "standalone"` copies only the traced files needed to run the
# server, but not `public/` or `.next/static` — those are copied manually
# per the local docs.
COPY --from=builder --chown=nextjs:nodejs /app/apps/shell/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/shell/.next/static ./apps/shell/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/shell/public ./apps/shell/public

USER nextjs

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "apps/shell/server.js"]
