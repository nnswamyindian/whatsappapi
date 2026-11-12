# ==============================================================================
# MetaGreenWave Multi-Stage Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Vite Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci || npm install

COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Node.js TypeScript Backend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci || npm install

COPY server/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Minimal Runtime Image
# ------------------------------------------------------------------------------
FROM node:20-alpine AS production-runner

# Install tini for PID 1 signal reaping and security
RUN apk add --no-cache tini curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root & server package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN cd server && npm ci --omit=dev

# Copy compiled server code
COPY --from=server-builder /app/server/dist ./server/dist

# Copy compiled frontend assets to be served by Express
COPY --from=client-builder /app/client/dist ./client/dist

# Copy operational scripts and healthcheck probe
COPY scripts/ ./scripts/

# Set appropriate directory ownership for non-root execution
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Health check probe against API endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node scripts/healthcheck.js || exit 1

EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/dist/index.js"]

