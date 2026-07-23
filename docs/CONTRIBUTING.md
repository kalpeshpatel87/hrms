# Contributing

## Setup

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# fill in real secrets — see docs/ENV_VARS.md

pnpm docker:up                 # starts Postgres only (see docker-compose.yml)
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
pnpm dev                        # runs both apps in parallel
```

API: `http://localhost:4000` (Swagger: `/api/docs`). Web: `http://localhost:5173` in dev (Vite), or `http://localhost:3000` from a production build.

## Before opening a PR

```bash
pnpm --filter api lint && pnpm --filter api typecheck && pnpm --filter api test
pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test:unit -- --run
```

All four must be clean. If you touched frontend UI, also run the app and click through the flow you changed — a green typecheck confirms the code compiles, not that the feature works (see the root project's testing philosophy — automated checks and manual verification are both required, not either/or).

## Branch & commit conventions

- Branch names: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.
- Commit messages: imperative mood, `<type>(<scope>): <summary>` where scope is the app/module touched, e.g. `feat(api): add leave encashment endpoint`. Add a body explaining *why* when the change isn't self-evident from the diff.
- Keep PRs scoped to one module/concern where possible — this codebase's module boundaries (see [ARCHITECTURE.md](./ARCHITECTURE.md)) are designed so most changes touch exactly one `apps/api/src/modules/<name>/` or `apps/web/src/routes/(app)/<name>/` directory.

## Adding a new backend module

1. Add the Prisma model(s) to `apps/api/prisma/schema.prisma` following the existing conventions (cuid id, audit fields, `deletedAt` unless it's a genuine append-only/join table — see the schema's header comment for the documented exceptions).
2. `pnpm --filter api prisma:migrate` to create the migration.
3. Create `apps/api/src/modules/<name>/{<name>.validation.ts,<name>.service.ts,<name>.controller.ts,<name>.routes.ts}` — copy `modules/leave/` as the reference implementation.
4. Add the module's permission keys to `PERMISSION_MATRIX` in `apps/api/prisma/seed.ts` and re-run the seed.
5. Mount the router in `apps/api/src/routes.ts`.
6. Add at least one Vitest test if there's real business logic (a pure calculation, a validation edge case) — see `apps/api/test/unit/` for the pattern.

## Adding a new frontend page

1. Create `apps/web/src/lib/features/<name>/{api.ts,types.ts}` mirroring the backend module's response shapes.
2. Create `apps/web/src/routes/(app)/<name>/+page.svelte` using `DataTable` for lists and `Modal` for create/edit — copy `routes/(app)/leave/+page.svelte` as the reference.
3. Add a `NavItem` to `apps/web/src/lib/navigation.ts` (with a `permission` key if it should be hidden from employees without access).
4. `pnpm --filter web typecheck && pnpm --filter web lint`, then actually run the dev server and click through it.

## Reporting issues / requesting features

Use your organization's issue tracker (not configured in this repo) — link it here once set up. Include: what you expected, what happened, and repro steps; for bugs, the relevant module's name so it's easy to find the right code.
