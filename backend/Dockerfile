# syntax=docker/dockerfile:1
# =============================================================================
# CivicShare backend (Node.js + Express + Sequelize/PostgreSQL)
# Multi-stage build: the final image has production dependencies only,
# runs as a non-root user and is small and reproducible.
# =============================================================================

# Stage 1: install production dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy only the manifests first so Docker caches this layer until dependencies actually change (faster rebuilds).
COPY package*.json ./

# `npm ci` gives reproducible installs when a lockfile exists;
# fall back to `npm install` if the project has no lockfile.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; \
    else npm install --omit=dev; fi

# Stage 2: runtime image
FROM node:22-alpine AS runtime
WORKDIR /app

# NODE_ENV=production enables production behaviour in Express and libraries.
# PORT is the port the API listens on (Cloud Run injects its own PORT, which matches the --port flag in cloudbuild-backend.yaml).
ENV NODE_ENV=production \
    PORT=4000

# Bring in installed dependencies, then the application source.
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# Never run the app as root for security. The `node` user ships with the image.
USER node

# The port the API listens on.
EXPOSE 4000

# Used by `docker run` / docker-compose. (Cloud Run uses its own probes.)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

# Run Node directly (not via npm) so it receives SIGTERM and shuts down cleanly.
CMD ["node", "src/server.js"]
