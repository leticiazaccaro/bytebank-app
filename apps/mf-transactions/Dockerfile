# apps/mf-transactions — multi-stage build (deps -> builder -> runner)
# producing a minimal, non-root runtime image via Next.js
# `output: "standalone"`. Same pattern as apps/shell/Dockerfile — see it for
# the full rationale (design.md "Tech Decisions"; local Next.js docs:
# self-hosting.md, output.md).
#
# Build context is the monorepo ROOT (npm workspaces):
#   docker build -f apps/mf-transactions/Dockerfile -t bytebank-mf-transactions .

# ---- deps: install the full npm workspace once, from the lockfile ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci

# ---- builder: build only the mf-transactions workspace ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
RUN npm run build -w apps/mf-transactions
# apps/mf-transactions has no public/ assets yet — the runner stage's COPY
# expects the directory to exist regardless.
RUN mkdir -p apps/mf-transactions/public

# ---- runner: minimal non-root runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/apps/mf-transactions/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/mf-transactions/.next/static ./apps/mf-transactions/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/mf-transactions/public ./apps/mf-transactions/public

USER nextjs

ENV PORT=3002
ENV HOSTNAME=0.0.0.0
EXPOSE 3002

CMD ["node", "apps/mf-transactions/server.js"]
