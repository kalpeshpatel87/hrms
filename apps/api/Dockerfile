# syntax=docker/dockerfile:1
# Build context MUST be the repo root (not apps/api) so pnpm can resolve the
# packages/shared-types and packages/config workspace dependencies, e.g.:
#   docker build -f apps/api/Dockerfile -t atyantik-ems-api .
# (docker-compose.yml at the repo root already sets this up correctly.)
#
# Note: this intentionally ships devDependencies in the runtime image rather
# than fighting a separate prod-only install stage. Prisma's generated
# client is produced by `prisma generate`, which needs the `prisma` CLI (a
# devDependency) — regenerating it against a `--prod`-only node_modules is
# possible but fiddly to get reliably right, and the size tradeoff isn't
# worth the risk of silently shipping a stale/mismatched client.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# --- deps: install full workspace deps --------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter api... --filter shared-types --filter config

# --- build: shared-types (compiled — apps/api imports its dist, not raw TS)
# then prisma generate + tsc -------------------------------------------------
FROM deps AS build
COPY packages/shared-types packages/shared-types
COPY packages/config packages/config
COPY apps/api apps/api
RUN pnpm --filter shared-types build
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

# --- runtime -----------------------------------------------------------------
FROM node:20-alpine AS runtime
RUN addgroup -S atyantik && adduser -S atyantik -G atyantik
WORKDIR /repo

ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh \
  && mkdir -p /repo/apps/api/uploads \
  && chown -R atyantik:atyantik /repo

WORKDIR /repo/apps/api
USER atyantik

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
