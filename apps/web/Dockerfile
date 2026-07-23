# syntax=docker/dockerfile:1
# Build context MUST be the repo root — see apps/api/Dockerfile for why.
#   docker build -f apps/web/Dockerfile --build-arg PUBLIC_API_URL=https://api.example.com/api/v1 -t atyantik-ems-web .
#
# PUBLIC_API_URL is a build ARG, not a runtime env var: SvelteKit inlines
# $env/static/public values into the client bundle at build time, so it must
# be known when `vite build` runs, not just when the container starts.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter web... --filter shared-types --filter config

FROM deps AS build
ARG PUBLIC_API_URL=http://localhost:8080/api/v1
ENV PUBLIC_API_URL=${PUBLIC_API_URL}
COPY packages/shared-types packages/shared-types
COPY packages/config packages/config
COPY apps/web apps/web
RUN pnpm --filter web build

FROM node:20-alpine AS runtime
RUN addgroup -S atyantik && adduser -S atyantik -G atyantik
WORKDIR /repo/apps/web

ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /repo/node_modules ../../node_modules
COPY --from=build /repo/apps/web/node_modules ./node_modules
COPY --from=build /repo/apps/web/build ./build
COPY --from=build /repo/apps/web/package.json ./package.json
RUN chown -R atyantik:atyantik /repo

USER atyantik
EXPOSE 3000
CMD ["node", "build"]
