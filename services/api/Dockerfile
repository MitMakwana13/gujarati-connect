# ===========================================================
# API service Dockerfile — two-stage build
# ===========================================================
# IMPORTANT: Build context must be the repo root.
# railway.json sets dockerfilePath to services/api/Dockerfile.
# ===========================================================

# ---- Stage 1: install + build all workspace packages ------
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/validators/package.json ./packages/validators/
COPY services/api/package.json ./services/api/

# Install ALL deps (dev included) — pnpm correctly wires workspace symlinks
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY tsconfig.base.json tsconfig.json turbo.json ./
COPY packages/ ./packages/
COPY services/api/ ./services/api/

# Build shared packages first (types, validators), then API
# turbo respects the dependency graph declared in each package.json
RUN pnpm --filter @gujarati-global/types build
RUN pnpm --filter @gujarati-global/validators build
RUN pnpm --filter @gujarati-global/api build

# ---- Stage 2: production runtime ---------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy workspace node_modules + built packages + API dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/package.json ./packages/types/
COPY --from=builder --chown=nodejs:nodejs /app/packages/validators/dist ./packages/validators/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/validators/package.json ./packages/validators/
COPY --from=builder --chown=nodejs:nodejs /app/services/api/dist ./services/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/api/node_modules ./services/api/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/api/package.json ./services/api/

USER nodejs
WORKDIR /app/services/api

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
