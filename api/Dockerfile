ARG NODE_VERSION=22

# ---- base: Node plus pnpm ----
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION=latest
ENV CI=true
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# ---- deps: all dependencies, for building ----
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile

# ---- build: compile TypeScript ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ---- prod-deps: runtime dependencies only ----
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile --prod

# ---- runtime: small, non-root image ----
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# tini reaps zombie processes and forwards SIGTERM so shutdown is clean
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server.js"]