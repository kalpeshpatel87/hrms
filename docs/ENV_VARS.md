# Environment Variables

Two `.env` files: root (`docker-compose.yml` only) and `apps/api/.env` (the actual app config). `apps/web/.env` holds the one frontend variable. Copy each `.env.example` to `.env` and fill in real values before running anything.

## `apps/api/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `4000` | |
| `DATABASE_URL` | **yes** | — | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_ACCESS_SECRET` | **yes** | — | ≥32 chars. Generate with `openssl rand -hex 32`. Must differ from `JWT_REFRESH_SECRET` (enforced at startup). |
| `JWT_REFRESH_SECRET` | **yes** | — | ≥32 chars, distinct from the access secret. |
| `JWT_ACCESS_EXPIRY` | no | `15m` | Any `jsonwebtoken`-compatible duration string. |
| `JWT_REFRESH_EXPIRY` | no | `30d` | |
| `COOKIE_SECRET` | **yes** | — | ≥32 chars. Used by `cookie-parser`. |
| `CSRF_SECRET` | **yes** | — | ≥32 chars. Reserved for future signed-CSRF-token use; the current double-submit-cookie check doesn't need it directly, but keep it set and distinct. |
| `WEB_APP_URL` | no | `http://localhost:3000` | CORS origin allow-list — must match exactly where the frontend is served from. |
| `STORAGE_DRIVER` | no | `local` | `local` \| `s3` (S3 provider is a documented stub, not implemented — see `src/lib/storage/S3StorageProvider.ts`). |
| `UPLOAD_DIR` | no | `./uploads` | Only used when `STORAGE_DRIVER=local`. |
| `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | no | — | Only needed once the S3 provider is implemented. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | no | — | Not wired to a real mailer yet — `forgotPassword()` logs the reset link via the app logger instead of emailing. Set these once `src/lib/mailer.ts` is built. |
| `SMTP_FROM` | no | `Atyantik EMS <no-reply@atyantik.com>` | |
| `SUPER_ADMIN_EMAIL` | no | `kalpeshpatel@atyantik.com` | Used by `prisma/seed.ts` to create the Super Admin account. |
| `SUPER_ADMIN_INITIAL_PASSWORD` | no | `ChangeMe@12345` | **Change this in any real deployment** — the seeded account has `mustChangePassword: true`, but don't rely on that alone. |

## `apps/web/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PUBLIC_API_URL` | **yes** | `http://localhost:4000/api/v1` | Baked into the client bundle at **build time** (SvelteKit `$env/static/public`), not read at runtime — rebuild the image/app if this changes. |

## Root `.env` (docker-compose only)

| Variable | Default | Notes |
|---|---|---|
| `POSTGRES_USER` | `atyantik` | |
| `POSTGRES_PASSWORD` | `change_me_in_prod` | **Change this.** |
| `POSTGRES_DB` | `atyantik_ems` | |
| `POSTGRES_PORT` | `5432` | Host-side port mapping. |
| `API_PORT` | `4000` | |
| `WEB_PORT` | `3000` | |
| `NGINX_PORT` | `8080` | The port you actually browse to — Nginx fronts both api and web. |

docker-compose also forwards `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `CSRF_SECRET`, `WEB_APP_URL`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_INITIAL_PASSWORD`, and `PUBLIC_API_URL` straight through from the root `.env` — set them there once rather than duplicating into `apps/api/.env` for a Docker-based run.
