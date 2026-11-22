# syntax=docker/dockerfile:1
# =============================================================================
# CivicShare frontend (React + Vite) served by nginx
# Stage 1 compiles the static site, Stage 2 ships only the compiled files, so Node and node_modules are not part of the final image.
# =============================================================================

# Stage 1: build the static site
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so the dependency layer is cached between builds.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Vite inlines VITE_* variables at BUILD time, so the backend URL must be supplied as a build argument.
# These lines must come BEFORE `npm run build`.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine AS runtime

# SPA-aware config (React Router fallback, gzip, caching headers).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled output from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# nginx listens on port 80.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
