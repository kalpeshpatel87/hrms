# Folder Structure

```
atyantik-ems/
├── apps/
│   ├── api/                              Express + Prisma backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma             the schema — ~50 models, see docs/ER_DIAGRAM.md
│   │   │   ├── migrations/
│   │   │   └── seed.ts                   Super Admin, roles/permissions, leave types, holidays, salary components
│   │   ├── src/
│   │   │   ├── server.ts                 process entrypoint
│   │   │   ├── app.ts                     express() wiring: helmet, cors, cookies, rate-limit, routes, error handler
│   │   │   ├── routes.ts                  mounts every module router under /api/v1
│   │   │   ├── config/env.ts              Zod-validated environment config
│   │   │   ├── db/prisma.ts               the extended PrismaClient (soft-delete + audit-stamping), softDelete()/softDeleteMany()
│   │   │   ├── docs/swagger.ts            OpenAPI spec generation
│   │   │   ├── lib/                       ApiError, response envelope helpers, asyncHandler, logger, jwt, auditLog, requestContext, storage/
│   │   │   ├── middlewares/                authenticate, authorize, requireAuth, validate, csrf, rateLimit, errorHandler, requestLogger, auditContext
│   │   │   ├── types/express.d.ts          req.user augmentation
│   │   │   └── modules/<name>/             one folder per feature — see below
│   │   ├── test/
│   │   │   ├── unit/                      Vitest, pure-logic tests
│   │   │   └── integration/                Vitest + Supertest against the real Express app
│   │   ├── uploads/                        local file storage (STORAGE_DRIVER=local)
│   │   ├── Dockerfile
│   │   └── docker-entrypoint.sh            runs `prisma migrate deploy` before starting
│   │
│   └── web/                              SvelteKit frontend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── (auth)/                login, forgot-password, reset-password — no app shell
│       │   │   └── (app)/                  authenticated shell (Sidebar + Topbar), one folder per module page
│       │   │       ├── dashboard/
│       │   │       ├── employees/[id]/
│       │   │       ├── attendance/, leave/, payroll/, announcements/
│       │   │       └── admin/{departments,roles}/
│       │   └── lib/
│       │       ├── features/<name>/{api.ts,types.ts}   typed HTTP clients, mirrors backend module names
│       │       ├── components/ui/          DataTable, Modal, StatusBadge, EmptyState, ApexChart, StatCard, ToastContainer
│       │       ├── components/layout/       Sidebar, Topbar, CommandPalette
│       │       ├── stores/                   auth, theme, sidebar, toast
│       │       ├── services/api-client.ts    axios instance + refresh interceptor
│       │       ├── navigation.ts              sidebar nav config (permission-gated)
│       │       └── styles/                    SCSS design system
│       ├── e2e/                            Playwright specs (*.e2e.ts)
│       └── Dockerfile
│
├── packages/
│   ├── shared-types/                     Zod schemas/types shared by both apps (pagination, API envelope)
│   └── config/                            shared eslint.base.js + tsconfig.base.json
│
├── docs/                                  you are here
├── docker/nginx/nginx.conf                reverse proxy config used by docker-compose
├── docker-compose.yml
├── ecosystem.config.js                    PM2 alternative to Docker
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
└── package.json                           root scripts (pnpm -r wrappers)
```

## Per-module file contract (backend)

```
apps/api/src/modules/<name>/
├── <name>.routes.ts       Router — HTTP verbs, permission gates, validation middleware
├── <name>.controller.ts   parses req, calls service, shapes response (thin, no business logic)
├── <name>.service.ts       business logic + every Prisma call for this module
└── <name>.validation.ts    Zod schemas for bodies/queries/params
```

## Per-module file contract (frontend)

```
apps/web/src/lib/features/<name>/
├── api.ts      typed functions calling apiClient, returning the unwrapped `data`
└── types.ts    TS interfaces matching the backend's response shapes

apps/web/src/routes/(app)/<name>/+page.svelte    the page itself, using DataTable/Modal
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the reasoning behind this layout and [CONTRIBUTING.md](./CONTRIBUTING.md) for the step-by-step of adding a new module.
