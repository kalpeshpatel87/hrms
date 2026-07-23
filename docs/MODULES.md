# Module Status

Every module below has a real Prisma schema, a working REST API mounted under `/api/v1`, and a SvelteKit frontend page.

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
| 9 | Performance | `/performance` | Scaffolded | ✅ | Goals + KeyResults, PerformanceReview with 360-style ReviewerAssignment/ReviewFeedback |
| 10 | Timesheet | `/timesheets` | Scaffolded | ✅ | Client/Project/ProjectAssignment, weekly timesheet submit/approve |
| 11 | Assets | `/assets` | Scaffolded | ✅ | Vendor/Asset catalog, assign/return with condition tracking, maintenance log |
| 12 | Exit Management | `/exit` | Scaffolded | ✅ | Self-service — resignation submission; approval auto-generates an ExitChecklist, exit interview |
| 13 | Recruitment | `/recruitment` | Scaffolded | ✅ list + candidates | Admin-only (`recruitment:read`) — JobOpening → Candidate → Interview (panel feedback) → Offer pipeline |
| 14 | Onboarding | `/onboarding` | Scaffolded | ✅ | Self-service checklist view, auto-completes when all tasks are done |
| 15 | Helpdesk | `/helpdesk` | Scaffolded | ✅ list + detail | Auto-numbered tickets, internal-comment visibility filtering |
| 16 | Learning | `/learning` | Scaffolded | ✅ | Course catalog, enrollment + progress, assessments |
| 17 | Expense | `/expenses` | Scaffolded | ✅ | Multi-item claims, submit/approve workflow |
| 18 | Travel | `/travel` | Scaffolded | ✅ | Simple request/approve workflow |
| 19 | Documents | `/documents` | Scaffolded | ✅ | Generic versioned vault (polymorphic `entityType`/`entityId`), confidentiality flag |
| 20 | Notifications | `/notifications` | Scaffolded | ✅ | Self-service inbox; `createNotification()` helper ready for other modules to call, not yet wired in |
| 21 | Reports | `/reports` | Scaffolded (basic) | ✅ | Admin-only (`report:read`) — headcount-by-department, attendance/leave/payroll summaries via Prisma `groupBy`, charted with ApexCharts. A custom report *builder* (ad-hoc filters/columns/saved reports) is out of scope for this pass |

Onboarding and Exit Management routes are self-service (`requireAuth()` with no permission argument — any employee views/acts on their own record), so their sidebar nav entries are intentionally ungated. Recruitment and Reports are genuinely admin-only, gated behind `recruitment:read`/`report:read` respectively (not granted to the `EMPLOYEE` role).

## What "scaffolded" means concretely

Every scaffolded module has: a normalized Prisma schema, Zod-validated create/update/list endpoints, permission-gated admin routes plus self-service routes where relevant (e.g. `/expenses/claims/me`), audit logging on mutations, and pagination/search/sort on list endpoints, plus a working SvelteKit page (`DataTable` + `Modal` + a `features/<module>/api.ts` client, following the pattern in `apps/web/src/routes/(app)/leave/+page.svelte`). Business-logic depth (e.g. a full custom report builder, richer approval chains) is deferred relative to the "Deep" tier.

## Full API reference

Swagger/OpenAPI docs are served live at `/api/docs` once the API is running (see `apps/api/src/docs/swagger.ts`, sourced from JSDoc `@openapi` blocks — currently annotated on the `auth` module as the reference example; extending the same annotations across the other 18 modules is straightforward follow-up work using the same JSDoc block shape). The full endpoint list is enumerated in each module's `<name>.routes.ts` file, grouped by resource with inline comments.
