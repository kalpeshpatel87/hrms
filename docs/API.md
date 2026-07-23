# API Guide

Base URL: `/api/v1`. Interactive Swagger UI: `/api/docs` (served by `swagger-ui-express`, spec generated from JSDoc `@openapi` comments — see `apps/api/src/docs/swagger.ts`).

## Response envelope

Every endpoint returns one of two shapes:

```jsonc
// success
{ "success": true, "data": { /* ... */ }, "message": "optional human-readable message" }

// paginated list
{ "success": true, "data": { "items": [ /* ... */ ], "total": 42, "page": 1, "pageSize": 20, "totalPages": 3 } }

// error
{ "success": false, "message": "human-readable error", "code": "MACHINE_READABLE_CODE", "errors": { "field": ["validation message"] } }
```

`code` is one of: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `DUPLICATE`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`, or a module-specific one thrown via `ApiError`.

## Authentication

```
POST /api/v1/auth/login          { email, password } -> { accessToken, user }  (+ httpOnly refresh cookie, CSRF cookie)
POST /api/v1/auth/refresh        (cookie-based, needs X-CSRF-Token header)     -> { accessToken }
POST /api/v1/auth/logout         (cookie-based, needs X-CSRF-Token header)
GET  /api/v1/auth/me             requires Authorization: Bearer <accessToken>
POST /api/v1/auth/change-password
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Send the access token as `Authorization: Bearer <token>` on every other request. When it expires (401), call `/auth/refresh` (the web app's axios interceptor does this automatically) to mint a new one from the refresh cookie.

**CSRF**: only `/auth/refresh` and `/auth/logout` require the `X-CSRF-Token` header (read from the non-httpOnly `csrf_token` cookie set at login/refresh) — every other authenticated route uses the `Authorization` header, which a cross-site request can't forge, so CSRF doesn't apply there.

## Pagination, filtering, sorting

List endpoints share a common query contract (see `packages/shared-types/src/common.ts`):

```
GET /api/v1/employees?page=1&pageSize=20&search=jane&sortBy=firstName&sortDir=asc&status=ACTIVE
```

- `page` (default 1), `pageSize` (default 20, max 100)
- `search` — free-text, matched against the module's relevant text fields
- `sortBy`/`sortDir` — each module whitelists which fields are sortable (unrecognized values fall back to a sensible default, they never error)
- Module-specific filters (`status`, `departmentId`, `dateFrom`/`dateTo`, etc.) are documented per-route in that module's `<name>.validation.ts`

## Permission model

Every protected route requires one of two things:
1. A specific permission key (`employee:read`, `leave:approve`, ...) — enforced by `requireAuth('key')`, checked against the JWT's embedded permission list.
2. Just being authenticated (`requireAuth()`) for self-service routes — the service layer then scopes the query/mutation to the caller's own `Employee`/`User` row, never trusting a client-supplied id for ownership.

See [MODULES.md](./MODULES.md) for the full endpoint-by-module list, and [ARCHITECTURE.md](./ARCHITECTURE.md#auth--rbac) for how the permission list is computed.

## File uploads

Endpoints accepting files (`POST /announcements/:id/attachments`, `POST /documents`, `POST /documents/:id/versions`) use `multipart/form-data` with the file under the `file` field name, validated against a per-module mime-type allow-list and size cap (10MB for announcements, 20MB for documents) before being handed to the `StorageProvider` abstraction (local disk by default; S3 is a documented drop-in, see `src/lib/storage/S3StorageProvider.ts`).

## Extending the API

New module = four files following the existing contract (`ARCHITECTURE.md` → "Backend module contract"), mounted in `src/routes.ts`. Copy `apps/api/src/modules/leave/` as the reference — it exercises validation, self-service ownership scoping, admin permission gating, and a multi-step approval workflow all in one module.
