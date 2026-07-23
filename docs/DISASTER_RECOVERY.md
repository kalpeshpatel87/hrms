# Disaster Recovery Plan

This is a starting-point DR plan for a system this size (single-company HRMS, one Postgres instance, local-or-S3 file storage). Adjust the numeric targets to whatever your organization actually commits to — the ones below are reasonable defaults, not measured guarantees.

## Recovery objectives

- **RPO (Recovery Point Objective): 24 hours.** Daily backups (see [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)) mean worst-case data loss is one day's transactions. Tighten this by backing up more frequently (hourly WAL archiving / continuous replication) if payroll/attendance data loss tolerance is lower than that in practice.
- **RTO (Recovery Time Objective): 4 hours.** Time to stand up a fresh stack from backups and confirm it's serving traffic correctly, assuming backups are intact and accessible.

## Failure scenarios

### 1. Application container/process crash

**Impact**: brief downtime, no data loss (Postgres is a separate service). **Response**: Docker Compose's `restart: unless-stopped` (or PM2's automatic restart) brings it back automatically. If it crash-loops, check `docker compose logs api` / `pm2 logs atyantik-api` for the actual error before doing anything destructive.

### 2. Database corruption or accidental destructive query

**Impact**: potential data loss up to the last backup. **Response**: stop write traffic (take the API down), restore the most recent `pg_dump` per [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) into a fresh database, verify with spot-checks, then bring the API back up pointed at the restored database.

### 3. Full host/infrastructure loss

**Impact**: total outage until a new host is provisioned. **Response**:
1. Provision a new host (or region, if using managed cloud infra) with Docker installed.
2. Clone the repo, restore `.env` files from your secrets manager (never from the repo — they're gitignored and shouldn't be committed).
3. `docker compose up -d --build` against fresh volumes.
4. Restore the database and uploads from the most recent off-host backup.
5. Point DNS at the new host.
6. Verify: login, dashboard loads, a payslip downloads correctly, an announcement is visible.

### 4. Leaked/compromised secret (JWT secret, DB password, etc.)

**Impact**: potential unauthorized access until rotated. **Response**:
1. Rotate the affected secret immediately (new `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` invalidates every outstanding token instantly on restart — everyone is forced to log in again, which is the desired containment behavior).
2. Rotate the database password and any cloud credentials (`AWS_SECRET_ACCESS_KEY` if S3 is in use) that were exposed alongside it.
3. Review `AuditLog` for the affected time window for anything anomalous (see the `audit_log:read`-gated admin view).
4. Force-expire all sessions: bumping every user's `tokenVersion` (a one-off script/migration) achieves this without a full secret rotation if you need a lighter-weight response.

## Testing this plan

A DR plan nobody has run is a guess, not a plan. At minimum, once per quarter: restore the latest backup into a throwaway environment and confirm the app actually comes up and logs in correctly. This repo doesn't yet automate that drill — worth scripting once the Docker stack itself is verified working end-to-end (see the caveat in [DEPLOYMENT.md](./DEPLOYMENT.md)).

## Contacts / escalation

Not populated here — fill in your actual on-call rotation, hosting provider support channel, and who holds the secrets-manager access before relying on this document in a real incident.
