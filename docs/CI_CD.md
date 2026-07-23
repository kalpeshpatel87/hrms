# CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push/PR to `main`, two jobs:

## `lint-typecheck-test`

Spins up a real `postgres:16-alpine` service container (not mocked — this project deliberately tests against a real database rather than mocks, see the migration/seed steps below), then:

1. `pnpm install --frozen-lockfile`
2. `prisma generate`
3. Lint both apps
4. Typecheck both apps
5. `prisma migrate deploy` against the CI Postgres
6. `pnpm --filter api test` (Vitest — unit tests don't need the DB, the integration tests in `test/integration/` are DB-independent by design so they run the same in CI as locally)
7. Build both apps (`PUBLIC_API_URL` pointed at the CI-local API address)

## `docker-build`

Runs after the first job passes. Builds both Dockerfiles (`docker build -f apps/api/Dockerfile .` / `apps/web/Dockerfile`) as a smoke test that the multi-stage builds still work — doesn't push anywhere or run `docker compose up`.

## Secrets

The JWT/cookie/CSRF secrets used in CI are hardcoded test-only placeholders in the workflow file itself (clearly labeled, ≥32 chars to satisfy the env schema, access/refresh distinct) — never real secrets, and never used outside the ephemeral CI runner.

## Extending this pipeline

Natural next additions, not yet built:
- Push built Docker images to a registry (GHCR/ECR/etc.) on merge to `main`, tagged with the commit SHA.
- A deploy job triggering your hosting platform's rollout (depends entirely on where you deploy — not assumed here).
- Playwright e2e job (currently only run manually — see `apps/web/e2e/`) wired into CI once a stable seeded-DB fixture exists for it to log in against.
- Dependabot/Renovate for dependency updates.
