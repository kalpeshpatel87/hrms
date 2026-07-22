# Atyantik EMS

Enterprise Employee Management System for **Atyantik Technologies Pvt. Ltd.**
(501, Privilege Avenue, Atlantis Lane, Dr. Vikram Sarabhai Marg, Vadodara,
Gujarat 390023).

A Keka/Zoho People/BambooHR-class HRMS: SvelteKit + Bootstrap 5 frontend,
Express + Prisma + PostgreSQL backend, JWT/RBAC security, Docker deployment.

See `docs/` for architecture, setup, and deployment guides (added in later
phases of this build). Quick start once `apps/api` and `apps/web` exist:

```bash
pnpm install
cp .env.example .env
pnpm docker:up          # postgres (+ api/web/nginx once containerized)
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

Super Admin login is seeded to `kalpeshpatel@atyantik.com` — only this
account can perform administrative actions (employee/department/payroll/
leave-policy/permission management). All other accounts are scoped to
employee self-service.
