# Architecture

## Overview

Atyantik EMS is a two-app pnpm monorepo:

- **`apps/web`** — SvelteKit (TypeScript, `adapter-node`), Bootstrap 5 + SCSS design system. Server-rendered shell, client-driven data fetching against the API.
- **`apps/api`** — Express + TypeScript + Prisma ORM + PostgreSQL. REST API, versioned at `/api/v1`.

Shared code lives in `packages/`:

- **`packages/shared-types`** — Zod schemas and TS types used by both apps (currently pagination/API-envelope shapes; each app also keeps feature-specific types local rather than forcing everything through this package, since frontend and backend DTOs legitimately diverge — see [CODING_STANDARDS.md](./CODING_STANDARDS.md)).
- **`packages/config`** — shared ESLint flat-config base and `tsconfig.base.json`.

Why this split instead of one big framework or a full BFF layer: the API is a real, independent REST service (versioned, Swagger-documented) so a future mobile app (Flutter/React Native, per the brief) or a service extracted into its own microservice can talk to it without going through SvelteKit at all.

## Backend module contract

Every backend feature lives under `apps/api/src/modules/<name>/` with four files:

```
<name>.routes.ts       HTTP verbs → controller, permission gates, validation middleware
<name>.controller.ts   parses req, calls service, shapes the response (thin — no business logic)
<name>.service.ts      business logic, all Prisma calls, throws ApiError
<name>.validation.ts   Zod schemas for request bodies/queries/params
```

This is a strict layering rule: controllers never call Prisma directly, and services never touch `req`/`res`. It keeps every module independently testable and makes the soft-delete/audit conventions (below) impossible to accidentally bypass from a controller.

Cross-cutting pieces controllers/services depend on:

| File | Purpose |
|---|---|
| `src/db/prisma.ts` | The one `PrismaClient` to import. Wraps a Prisma Client Extension enforcing soft-delete and audit-stamping (see below). |
| `src/lib/ApiError.ts` | Typed HTTP errors (`ApiError.notFound()`, `.forbidden()`, etc.) — the only way a module should signal failure. |
| `src/lib/response.ts` | `sendSuccess`/`sendCreated`/`sendPaginated` — the only way a module should shape a response. |
| `src/lib/asyncHandler.ts` | Wraps async controller functions so rejected promises reach the error handler (Express 4 doesn't do this natively). |
| `src/lib/auditLog.ts` | `recordAuditLog(...)` — call this on every create/update/delete/approve/reject mutation. |
| `src/middlewares/requireAuth.ts` | `requireAuth('module:action')` returns the `[authenticate, auditContext, authorize]` middleware chain. `requireAuth()` with no args means "any authenticated user" (self-service routes ownership-check in the service layer instead). |
| `src/middlewares/validate.ts` | `validate(zodSchema, 'body' \| 'query' \| 'params')`. |

## Soft delete & audit stamping

Every domain model has `deletedAt`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy` (see the header comment in `apps/api/prisma/schema.prisma` for the few deliberate exceptions — `AuditLog`, `RefreshToken`, `Session`, and pure join tables, where those fields would be meaningless).

Enforcement lives in **one place**: a Prisma Client Extension in `src/db/prisma.ts`, computed from the schema's DMMF at startup (not hardcoded per-model, so a new model automatically gets the right behavior the moment it declares `deletedAt`):

- `findMany`/`findFirst`/`count`/`aggregate` auto-inject `deletedAt: null` unless the caller explicitly filters on `deletedAt` (so an admin "show deleted" view can still opt in).
- `findUnique`/`findUniqueOrThrow` post-filter: a soft-deleted row behaves as if it doesn't exist.
- `delete`/`deleteMany` **throw** on any model with `deletedAt` — this is intentional. Call the exported `softDelete(modelName, id)` / `softDeleteMany(modelName, where)` helpers instead. Loud failure beats a silently-wrong hard delete.
- `create`/`update`/`updateMany` auto-stamp `createdBy`/`updatedBy` from the current request's actor, sourced from an `AsyncLocalStorage` context set by `auditContext` middleware — no service ever threads a userId through manually for this.

A second, unextended client (`prismaRaw`) exists only for genuine hard deletes (GDPR erasure, retention jobs) and is restricted by convention to `src/jobs/**`.

## Auth & RBAC

- **Access tokens**: short-lived JWTs (15m default) carrying `{ sub, email, tokenVersion, roles, permissions }`. The permission list is the union of every `RolePermission.key` across the user's roles, computed at login/refresh — so authorization checks never hit the database mid-request beyond the one `authenticate` lookup.
- **Refresh tokens**: rotating, family-tracked JWTs in an httpOnly cookie scoped to `/api/v1/auth`. Presenting an already-rotated (or expired) token revokes the entire family — a strong signal of token theft.
- **RBAC data model**: `User` ↔ `Role` is many-to-many via `UserRole` (not a single `roleId` column) specifically so a user can hold multiple roles without a breaking migration later. `Role` ↔ `Permission` is many-to-many via `RolePermission`. Permission keys are `module:action` strings (`employee:read`, `leave:approve`, ...), seeded in `apps/api/prisma/seed.ts`.
- **Two seeded roles**: `super_admin` (every permission — the only account that can perform admin actions, per the brief) and `employee` (self-service permissions only). New roles (e.g. "HR Manager", "Payroll Approver") can be added purely via the Roles & Permissions admin UI — no code change needed.
- **Instant revocation**: `User.tokenVersion` is bumped on password change/reset; `authenticate` middleware compares it against the token's embedded version on every request, so changing a password immediately invalidates every other outstanding access token.

## Frontend structure

```
apps/web/src/
├── routes/
│   ├── (auth)/            route group: login, forgot-password, reset-password — no sidebar shell
│   └── (app)/              route group: authenticated shell (Sidebar + Topbar), one folder per module
└── lib/
    ├── features/<module>/  api.ts (typed HTTP calls) + types.ts, mirrors the backend module names
    ├── components/ui/       reusable primitives: DataTable, Modal, StatusBadge, EmptyState, ApexChart, ToastContainer
    ├── components/layout/   Sidebar, Topbar, CommandPalette
    ├── stores/               auth, theme, sidebar, toast — cross-cutting app state
    ├── services/api-client.ts   axios instance: attaches the in-memory access token, auto-refreshes on 401
    └── styles/               SCSS design system (Bootstrap variable overrides + theme + shell chrome)
```

- **Access token storage**: module-level memory only, never `localStorage` — a stored XSS payload can't exfiltrate it. Only the httpOnly refresh cookie survives a reload; `resumeSession()` re-mints an access token from it on app boot.
- **Auth guard**: the `(app)` route group's `+layout.svelte` calls `resumeSession()` on mount and redirects to `/login` if it fails. This is a client-side guard, not an SSR one — see [Known Limitations](#known-limitations) below.
- **Theming**: a custom `data-theme` attribute drives our own CSS variables (light/dark/RTL); Bootstrap's own component styling (form controls, cards) is wired via `data-bs-theme` set alongside it, since Bootstrap 5.3's dark mode doesn't otherwise know about our custom attribute.

## Module maturity: "deep" vs "scaffolded"

The build was explicitly scoped in two tiers (see the approved plan) rather than pretending every module is equally finished:

**Deep** (full business logic, both API and UI): Auth/Security, Admin/RBAC, Employee Management, Attendance, Leave, Payroll, Announcements, Dashboard.

**Scaffolded** (real Prisma models + working CRUD API; UI exists for a subset — Departments/Roles admin pages are built, the rest are API-only pending frontend work): Performance, Timesheet, Assets, Exit Management, Recruitment, Onboarding, Helpdesk, Learning, Expense, Travel, Documents, Notifications.

See [MODULES.md](./MODULES.md) for the exact endpoint-by-endpoint breakdown.

## Known limitations (documented, not hidden)

- **No SSR-aware auth** — the `(app)` layout guard runs client-side; a logged-out user briefly sees a loading spinner before the redirect rather than never receiving the page at all. A `hooks.server.ts` reading the session server-side would close this gap; not implemented in this pass.
- **Real-time chat, live video-meeting integration** — out of scope; these need a separate realtime system (websockets, presence, message persistence).
- **AI features** — only a report-summary/HR-assistant hook point exists; the rest of the AI bullets in the brief are a roadmap item, not implemented against a trained model.
- **Multi-language i18n** — the `Settings > Language` field is stored and switchable, but only English content exists; no translation catalog.
- **FORMULA-type salary components** — payroll falls back to the component's flat `amount` rather than evaluating a formula string; no formula parser was built (documented in `payroll.service.ts`).
- **SPECIFIC_EMPLOYEES announcement audience** — there's no join table wiring an announcement to individual employees yet, so rows with this audience are shown to everyone rather than hidden (documented in `announcement.service.ts`).
