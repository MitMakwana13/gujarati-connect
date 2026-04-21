# ===========================================================
# Worker service Dockerfile — multi-stage build
# ===========================================================
# Build from repo root: docker build -f services/worker/Dockerfile -t gg-worker .
# ===========================================================

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY services/worker/package.json ./services/worker/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json turbo.json ./
COPY services/worker/ ./services/worker/
RUN pnpm --filter @gujarati-global/worker build

FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY services/worker/package.json ./services/worker/
RUN pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/dist ./services/worker/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/package.json ./services/worker/

USER nodejs
WORKDIR /app/services/worker

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/worker.js"]
