# Module Status

Every module below has a real Prisma schema and a working REST API mounted under `/api/v1`. "Frontend" column reflects whether a SvelteKit page exists yet.

| # | Module | Mount path | Tier | Frontend | Notes |
|---|---|---|---|---|---|
| 1 | Auth | `/auth` | Deep | ✅ login/forgot/reset pages | JWT + rotating refresh, RBAC token, password reset |
| 2 | Org/RBAC | `/org` | Deep | ✅ Departments, Roles & Permissions | Department/Designation/Branch/Team/Shift/Holiday/Company + Role/Permission admin |
| 3 | Employee | `/employees` | Deep | ✅ list + detail | Full profile, documents, emergency contacts, education, experience, skills, certifications, notes, org chart |
| 4 | Attendance | `/attendance` | Deep | ✅ | Check-in/out, breaks, late-detection against shift rules, correction-request workflow |
| 5 | Leave | `/leave` | Deep | ✅ | Types/policies, balance-aware apply/approve/cancel workflow |
| 6 | Payroll | `/payroll` | Deep | ✅ | Salary structures, payroll run generation, PDF payslips, reimbursements, deductions |
| 7 | Announcements | `/announcements` | Deep | ✅ | Audience-scoped visibility, pinning, attachments |
| 8 | Dashboard | `/dashboard` (web only) | Deep | ✅ | Composes real data from leave/attendance/announcements — no dedicated backend module |
| 9 | Performance | `/performance` | Scaffolded | — | Goals + KeyResults, PerformanceReview with 360-style ReviewerAssignment/ReviewFeedback |
| 10 | Timesheet | `/timesheets` | Scaffolded | — | Client/Project/ProjectAssignment, weekly timesheet submit/approve |
| 11 | Assets | `/assets` | Scaffolded | — | Vendor/Asset catalog, assign/return with condition tracking, maintenance log |
| 12 | Exit Management | `/exit` | Scaffolded | — | Resignation approval auto-generates an ExitChecklist, exit interview |
| 13 | Recruitment | `/recruitment` | Scaffolded | — | JobOpening → Candidate → Interview (panel feedback) → Offer pipeline |
| 14 | Onboarding | `/onboarding` | Scaffolded | — | Checklist + tasks, auto-completes when all tasks are done |
| 15 | Helpdesk | `/helpdesk` | Scaffolded | — | Auto-numbered tickets, internal-comment visibility filtering |
| 16 | Learning | `/learning` | Scaffolded | — | Course catalog, enrollment + progress, assessments |
| 17 | Expense | `/expenses` | Scaffolded | — | Multi-item claims, submit/approve workflow |
| 18 | Travel | `/travel` | Scaffolded | — | Simple request/approve workflow |
| 19 | Documents | `/documents` | Scaffolded | — | Generic versioned vault (polymorphic `entityType`/`entityId`), confidentiality flag |
| 20 | Notifications | `/notifications` | Scaffolded | — | Self-service inbox; `createNotification()` helper ready for other modules to call, not yet wired in |

## What "scaffolded" means concretely

Every scaffolded module has: a normalized Prisma schema, Zod-validated create/update/list endpoints, permission-gated admin routes plus self-service routes where relevant (e.g. `/expenses/claims/me`), audit logging on mutations, and pagination/search/sort on list endpoints. What it does **not** yet have is a SvelteKit page — building one follows the exact pattern already established for Employees/Leave/Attendance (see `apps/web/src/routes/(app)/leave/+page.svelte` as the reference implementation: `DataTable` + `Modal` + a `features/<module>/api.ts` client).

## Full API reference

Swagger/OpenAPI docs are served live at `/api/docs` once the API is running (see `apps/api/src/docs/swagger.ts`, sourced from JSDoc `@openapi` blocks — currently annotated on the `auth` module as the reference example; extending the same annotations across the other 18 modules is straightforward follow-up work using the same JSDoc block shape). The full endpoint list is enumerated in each module's `<name>.routes.ts` file, grouped by resource with inline comments.
