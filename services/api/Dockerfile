# ===========================================================
# API service Dockerfile — multi-stage build
# ===========================================================
# Build from repo root: docker build -f services/api/Dockerfile -t gg-api .
# Railway auto-detects this file if set in railway.json.
# ===========================================================

# ---- Stage 1: base image with pnpm --------------------------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# ---- Stage 2: install ALL deps (inc. dev) -------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile

# ---- Stage 3: build TypeScript ------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json turbo.json ./
COPY services/api/ ./services/api/
RUN pnpm --filter @gujarati-global/api build

# ---- Stage 4: production deps only --------------------------
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile --prod

# ---- Stage 5: final runtime image ---------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for proper signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/api/dist ./services/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/api/package.json ./services/api/
COPY --chown=nodejs:nodejs scripts/ ./scripts/

USER nodejs
WORKDIR /app/services/api

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Health check hits /health which pings DB + Redis
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
