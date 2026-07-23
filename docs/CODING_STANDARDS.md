# Coding Standards

## Backend (`apps/api`)

- **Module contract is not optional**: `routes.ts` → `controller.ts` → `service.ts` → `validation.ts`. Controllers never import Prisma; services never import `express` types. See [ARCHITECTURE.md](./ARCHITECTURE.md#backend-module-contract).
- **Never call `.delete()`/`.deleteMany()`** on a model with `deletedAt` — the Prisma extension throws on purpose. Use `softDelete()`/`softDeleteMany()` from `src/db/prisma.ts`.
- **Never set `createdBy`/`updatedBy` manually** — the extension auto-stamps them from request context.
- **Every mutation gets an audit log entry** via `recordAuditLog({ action, entityType, entityId, before?, after? })`. `action` is one of `CREATE | UPDATE | DELETE | APPROVE | REJECT | LOGIN | LOGOUT | DOWNLOAD | EXPORT`.
- **Every route needs an explicit auth decision**: `requireAuth('module:action')` for permission-gated routes, `requireAuth()` for self-service (and the service must then scope by the caller's own id — never trust a client-supplied id for ownership).
- **Every POST/PUT/PATCH body gets a Zod schema** via `validate(schema, 'body')`, even a `z.object({})` if genuinely empty — this keeps mass-assignment impossible by construction (a field not in the schema never reaches `req.body`).
- **Errors are always `ApiError`** (`ApiError.notFound()`, `.badRequest()`, `.conflict()`, etc.) — never a raw `throw new Error()` from a service, and never a hand-rolled `res.status(...).json(...)` from a controller (use `sendSuccess`/`sendCreated`/`sendPaginated`).
- **Money is always `Decimal`**, never `number`/`Float`, at the schema level; convert with `Number(decimal)` only at the point of arithmetic, and be deliberate about it (see `payroll.service.ts` for the pattern).
- **IDs are `cuid()` strings everywhere** — no auto-increment integers, so nothing about record count/order leaks through an endpoint.
- **`req.params.xxx` needs an `as string` cast** — the shared `tsconfig.base.json` sets `noUncheckedIndexedAccess: true`, so `ParamsDictionary` access is `string | undefined` by default; casting is safe because Express only invokes the handler when the route pattern matched.
- **`$transaction` callbacks are typed `PrismaTransaction`** (exported from `src/db/prisma.ts`), not `Prisma.TransactionClient` — the extension changes the client's type shape, so the plain Prisma-generated type won't match.

## Frontend (`apps/web`)

- **Svelte 5 runes only** — `$state`, `$derived`, `$props`, `$effect`. No `export let`, no `$:` reactive statements (this is a runes-mode project).
- **Feature API clients mirror the backend module names** (`lib/features/<module>/{api.ts,types.ts}`) and always return the unwrapped `data` from the `{success, data}` envelope — components never touch `res.data.data` directly.
- **Never store the access token in `localStorage`** — it's module-level memory in `lib/stores/auth.ts` only. Only the httpOnly refresh cookie persists across reloads.
- **Route paths are plain strings**, not SvelteKit's generated typed-route helpers — `svelte/no-navigation-without-resolve` is deliberately disabled project-wide (see `eslint.config.js`) rather than wrapping ~20 modules' worth of links in `resolve()` for marginal benefit.
- **Reactive `Map`/`Set` use `SvelteMap`/`SvelteSet`** from `svelte/reactivity`, declared as a plain `let` (not `$state`-wrapped — they're already fine-grained reactive; wrapping them trips `svelte/no-unnecessary-state-wrap`) and mutated in place rather than reassigned to a new instance.
- **Every list page uses `DataTable`**, every create/edit form uses `Modal` — don't hand-roll pagination or a bespoke dialog; extend those components if they're missing something.
- **SCSS, not Tailwind** — component-scoped `<style lang="scss">` blocks for one-off styling, shared tokens live in `lib/styles/`.

## Both apps

- **Prettier + ESLint are the source of truth for formatting** — run `pnpm --filter <app> format` before committing if lint flags style issues; don't hand-format around what the tools want.
- **`pnpm --filter <app> typecheck` and `lint` must be clean** (warnings in `prisma/seed.ts`'s console statements and a few `employee.service.ts` destructure-to-omit unused vars are pre-existing/expected — everything else should be zero).
- **Comments explain *why*, not *what***: a hidden constraint, a workaround, a non-obvious tradeoff. Well-named code doesn't need a comment restating it.
