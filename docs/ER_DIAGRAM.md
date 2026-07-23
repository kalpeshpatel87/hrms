# Entity-Relationship Diagrams

The full, authoritative schema is `apps/api/prisma/schema.prisma` (~50 models). These diagrams group it by domain for readability — relationships only, not every field. Generate an up-to-date version anytime with `pnpm --filter api exec prisma-erd-generator` style tooling if you add one, or just read the schema file directly; it's organized with the same domain-section comments used here.

## Core: Auth / RBAC / Audit

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : has
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : has
    USER ||--o{ REFRESH_TOKEN : has
    USER ||--o{ SESSION : has
    REFRESH_TOKEN ||--o{ SESSION : "backs"
    USER ||--o| EMPLOYEE : "is"
    USER ||--o{ AUDIT_LOG : "acts as"
```

## Org Structure

```mermaid
erDiagram
    COMPANY ||--o{ BRANCH : has
    COMPANY ||--o{ DEPARTMENT : has
    DEPARTMENT ||--o{ DEPARTMENT : "sub-departments"
    DEPARTMENT ||--o{ DESIGNATION : has
    DEPARTMENT ||--o{ TEAM : has
    COMPANY ||--o{ SHIFT : has
    COMPANY ||--o{ HOLIDAY : has
    BRANCH ||--o{ HOLIDAY : "scopes"
    COMPANY ||--o{ COMPANY_SETTING : has
    EMPLOYEE ||--o| DEPARTMENT : heads
    EMPLOYEE ||--o| TEAM : leads
```

## Employee

```mermaid
erDiagram
    EMPLOYEE ||--|| USER : "linked to"
    EMPLOYEE }o--|| COMPANY : "belongs to"
    EMPLOYEE }o--o| BRANCH : "at"
    EMPLOYEE }o--o| DEPARTMENT : "in"
    EMPLOYEE }o--o| DESIGNATION : holds
    EMPLOYEE }o--o| TEAM : "member of"
    EMPLOYEE }o--o| SHIFT : assigned
    EMPLOYEE }o--o| EMPLOYEE : "reports to"
    EMPLOYEE ||--o{ EMPLOYEE_DOCUMENT : has
    EMPLOYEE ||--o{ EMERGENCY_CONTACT : has
    EMPLOYEE ||--o{ EDUCATION_RECORD : has
    EMPLOYEE ||--o{ EXPERIENCE_RECORD : has
    EMPLOYEE ||--o{ EMPLOYEE_SKILL : has
    SKILL ||--o{ EMPLOYEE_SKILL : "catalog entry for"
    EMPLOYEE ||--o{ CERTIFICATION : has
    EMPLOYEE ||--o{ EMPLOYEE_NOTE : has
```

## Attendance

```mermaid
erDiagram
    EMPLOYEE ||--o{ ATTENDANCE_RECORD : has
    ATTENDANCE_RECORD ||--o{ ATTENDANCE_BREAK : has
    ATTENDANCE_RECORD ||--o{ ATTENDANCE_CORRECTION_REQUEST : has
```

## Leave

```mermaid
erDiagram
    COMPANY ||--o{ LEAVE_TYPE : defines
    LEAVE_TYPE ||--o{ LEAVE_POLICY : has
    LEAVE_TYPE ||--o{ LEAVE_BALANCE : tracks
    LEAVE_TYPE ||--o{ LEAVE_REQUEST : "type of"
    EMPLOYEE ||--o{ LEAVE_BALANCE : has
    EMPLOYEE ||--o{ LEAVE_REQUEST : submits
    LEAVE_REQUEST ||--o{ LEAVE_APPROVAL : "routed through"
```

## Payroll

```mermaid
erDiagram
    COMPANY ||--o{ SALARY_COMPONENT : defines
    EMPLOYEE ||--o{ SALARY_STRUCTURE : has
    SALARY_STRUCTURE ||--o{ SALARY_STRUCTURE_COMPONENT : has
    SALARY_COMPONENT ||--o{ SALARY_STRUCTURE_COMPONENT : "instance of"
    SALARY_STRUCTURE ||--o{ SALARY_REVISION : has
    COMPANY ||--o{ PAYROLL_RUN : runs
    PAYROLL_RUN ||--o{ PAYSLIP : generates
    EMPLOYEE ||--o{ PAYSLIP : receives
    EMPLOYEE ||--o{ REIMBURSEMENT : claims
    EMPLOYEE ||--o{ DEDUCTION : has
```

## Performance

```mermaid
erDiagram
    EMPLOYEE ||--o{ GOAL : has
    GOAL ||--o{ KEY_RESULT : has
    EMPLOYEE ||--o{ PERFORMANCE_REVIEW : "is subject of"
    PERFORMANCE_REVIEW ||--o{ GOAL : covers
    PERFORMANCE_REVIEW ||--o{ REVIEWER_ASSIGNMENT : has
    USER ||--o{ REVIEWER_ASSIGNMENT : "assigned as reviewer"
    REVIEWER_ASSIGNMENT ||--o{ REVIEW_FEEDBACK : produces
```

## Timesheet / Projects

```mermaid
erDiagram
    COMPANY ||--o{ CLIENT : has
    CLIENT ||--o{ PROJECT : has
    COMPANY ||--o{ PROJECT : has
    PROJECT ||--o{ PROJECT_ASSIGNMENT : has
    EMPLOYEE ||--o{ PROJECT_ASSIGNMENT : "assigned to"
    EMPLOYEE ||--o{ TIMESHEET : submits
    TIMESHEET ||--o{ TIMESHEET_ENTRY : has
    PROJECT ||--o{ TIMESHEET_ENTRY : "logged against"
```

## Assets

```mermaid
erDiagram
    COMPANY ||--o{ VENDOR : has
    ASSET }o--o| VENDOR : "purchased from"
    ASSET ||--o{ ASSET_ASSIGNMENT : has
    EMPLOYEE ||--o{ ASSET_ASSIGNMENT : "assigned"
    ASSET ||--o{ ASSET_MAINTENANCE : has
```

## Exit Management

```mermaid
erDiagram
    EMPLOYEE ||--o{ RESIGNATION : submits
    RESIGNATION ||--o| EXIT_CHECKLIST : generates
    EXIT_CHECKLIST ||--o{ EXIT_CHECKLIST_TASK : has
    RESIGNATION ||--o| EXIT_INTERVIEW : has
```

## Recruitment

```mermaid
erDiagram
    COMPANY ||--o{ JOB_OPENING : posts
    DEPARTMENT ||--o{ JOB_OPENING : "for"
    JOB_OPENING ||--o{ CANDIDATE : receives
    CANDIDATE ||--o{ INTERVIEW : has
    INTERVIEW ||--o{ INTERVIEW_PANELIST : has
    CANDIDATE ||--o| OFFER : gets
    DESIGNATION ||--o{ OFFER : "offered as"
```

## Onboarding

```mermaid
erDiagram
    EMPLOYEE ||--o| ONBOARDING_CHECKLIST : has
    ONBOARDING_CHECKLIST ||--o{ ONBOARDING_TASK : has
```

## Helpdesk

```mermaid
erDiagram
    EMPLOYEE ||--o{ TICKET : raises
    USER ||--o{ TICKET : "assigned to"
    TICKET ||--o{ TICKET_COMMENT : has
```

## Learning

```mermaid
erDiagram
    COMPANY ||--o{ COURSE : offers
    EMPLOYEE ||--o{ ENROLLMENT : has
    COURSE ||--o{ ENROLLMENT : "enrolled in"
    ENROLLMENT ||--o{ ASSESSMENT : has
```

## Expense / Travel

```mermaid
erDiagram
    EMPLOYEE ||--o{ EXPENSE_CLAIM : submits
    EXPENSE_CLAIM ||--o{ EXPENSE_ITEM : has
    EXPENSE_CLAIM }o--o| PAYROLL_RUN : "reimbursed via"
    EMPLOYEE ||--o{ TRAVEL_REQUEST : submits
```

## Documents / Notifications

```mermaid
erDiagram
    EMPLOYEE ||--o{ DOCUMENT : owns
    DOCUMENT ||--o{ DOCUMENT_VERSION : has
    DOCUMENT ||--o| DOCUMENT_VERSION : "current version"
    USER ||--o{ NOTIFICATION : receives
```
