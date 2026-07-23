# Deployment Guide

## Option A — Docker Compose (recommended)

Prerequisites: Docker + Docker Compose, and your user in the `docker` group (or run these with `sudo`).

```bash
cp .env.example .env                     # fill in real secrets — see docs/ENV_VARS.md
cp apps/api/.env.example apps/api/.env    # not read directly by compose, but keep in sync for local (non-Docker) runs
cp apps/web/.env.example apps/web/.env

docker compose up -d --build
```

This brings up, in order: `postgres` (with a healthcheck gate), `api` (runs `prisma migrate deploy` via `docker-entrypoint.sh` before starting), `web`, and `nginx` fronting both at `http://localhost:${NGINX_PORT:-8080}`.

Seed the Super Admin (kalpeshpatel@atyantik.com) once the API container is healthy:

```bash
docker compose exec api node_modules/.bin/tsx prisma/seed.ts
```

Tear down: `docker compose down` (add `-v` to also drop the `postgres_data`/`api_uploads` volumes — this is destructive, confirm before doing that on anything with real data).

> **Status note**: the Dockerfiles/compose stack were authored and carefully reasoned through (see the caveat in the DevOps commit) but have not yet been exercised with a real `docker build`/`docker compose up` in this environment — verify end-to-end before relying on this in production.

## Option B — PM2 (no Docker)

Requires a host with Node 20+, pnpm, and a reachable PostgreSQL instance already running.

```bash
pnpm install
pnpm --filter api prisma:generate
pnpm --filter api prisma:deploy      # applies migrations
pnpm --filter api build
pnpm --filter web build
pnpm --filter api prisma:seed        # first run only

npm i -g pm2                          # or use corepack/pnpm dlx
pm2 start ecosystem.config.js --env production
pm2 save
```

`ecosystem.config.js` runs the API in cluster mode (one worker per CPU core) and the web app in fork mode (SvelteKit's Node adapter doesn't benefit from clustering the same way). Put Nginx (or any reverse proxy) in front the same way `docker/nginx/nginx.conf` does — proxy `/api` and `/uploads` to the API port, everything else to the web port.

## Reverse proxy / TLS

Neither the Docker Nginx config nor PM2 setup terminates TLS — put a TLS-terminating load balancer or Nginx config with a real certificate (Let's Encrypt via certbot, or your cloud provider's LB) in front of port 8080 (Docker) or your Nginx (PM2) for any real deployment. Update `WEB_APP_URL` and `PUBLIC_API_URL` to the real HTTPS origin once you do.

## Database migrations in production

Never run `prisma migrate dev` against production — it can prompt for destructive resets. Always use `prisma migrate deploy` (what `docker-entrypoint.sh` and the PM2 instructions above both do), which only applies pending migrations non-interactively.

## Post-deploy checklist

- [ ] Changed `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `CSRF_SECRET`, `SUPER_ADMIN_INITIAL_PASSWORD` from their `.env.example` placeholders
- [ ] `WEB_APP_URL` / `PUBLIC_API_URL` point at the real deployed origin (not `localhost`)
- [ ] TLS is terminated somewhere in front of the stack
- [ ] Logged in as the Super Admin and changed the seeded password
- [ ] Confirmed `docs/BACKUP_RESTORE.md`'s backup job is actually scheduled
