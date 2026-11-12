# syntax=docker/dockerfile:1.7

# ── Build ───────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --no-audit --no-fund
COPY shared shared
COPY server server
COPY client client
RUN npm run build

# ── Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace @cms/server --include-workspace-root=false --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist
ENV CLIENT_DIST=/app/client/dist \
    LOCAL_UPLOAD_DIR=/app/uploads \
    PORT=4000
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
WORKDIR /app/server
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "dist/index.js"]
