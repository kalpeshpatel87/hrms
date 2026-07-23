# Atyantik EMS

Enterprise Employee Management System for **Atyantik Technologies Pvt. Ltd.**
(501, Privilege Avenue, Atlantis Lane, Dr. Vikram Sarabhai Marg, Vadodara,
Gujarat 390023).

A Keka/Zoho People/BambooHR-class HRMS: SvelteKit + Bootstrap 5 frontend,
Express + Prisma + PostgreSQL backend, JWT/RBAC security, Docker deployment.

**Documentation**: see [`docs/README.md`](./docs/README.md) for the full index —
architecture, ER diagrams, API guide, deployment, environment variables,
coding standards, contributing, CI/CD, backup/restore, and disaster recovery.

## Quick start

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# fill in real secrets — see docs/ENV_VARS.md

pnpm docker:up                    # Postgres (via docker-compose.yml)
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
pnpm dev                           # both apps in parallel
```

API: `http://localhost:4000` (Swagger UI at `/api/docs`). Web: `http://localhost:5173`.

Super Admin login is seeded to `kalpeshpatel@atyantik.com` — only this
account can perform administrative actions (employee/department/payroll/
leave-policy/permission management). All other accounts are scoped to
employee self-service. See [`docs/MODULES.md`](./docs/MODULES.md) for what's
fully built ("deep") versus scaffolded, and
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#known-limitations) for what's
explicitly out of scope in this pass.
