# ===========================================================
# API service Dockerfile — simplified two-stage build
# ===========================================================
# Stage 1: install all deps + build TypeScript
# Stage 2: production runtime (copies only built dist)
# ===========================================================

# ---- Stage 1: build -----------------------------------------
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json turbo.json ./
COPY packages/ ./packages/
COPY services/api/ ./services/api/

# Install ALL deps (dev included) — pnpm wires up workspace symlinks correctly
RUN pnpm install --frozen-lockfile

# Build the API service
RUN pnpm --filter @gujarati-global/api build

# ---- Stage 2: production runtime ----------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy the full node_modules (workspace-aware) + built dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/api/dist ./services/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/api/node_modules ./services/api/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/api/package.json ./services/api/

USER nodejs
WORKDIR /app/services/api

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
