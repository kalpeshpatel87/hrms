# Backup & Restore

## What needs backing up

1. **PostgreSQL database** — everything: employee records, payroll history, documents metadata, audit logs.
2. **Uploaded files** — the `api_uploads` Docker volume (or `apps/api/uploads/` on a PM2 host) — payslip PDFs, announcement attachments, employee documents. These are referenced by URL from the database, so losing them without the DB (or vice versa) leaves dangling references.

## Backup

### Database (Docker)

```bash
docker compose exec postgres pg_dump -U "${POSTGRES_USER:-atyantik}" -Fc "${POSTGRES_DB:-atyantik_ems}" > backup-$(date +%Y%m%d-%H%M%S).dump
```

`-Fc` (custom format) is compressed and supports selective restore — prefer it over plain SQL dumps.

### Database (PM2 / bare Postgres)

```bash
pg_dump -h <host> -U <user> -Fc <database> > backup-$(date +%Y%m%d-%H%M%S).dump
```

### Uploaded files

```bash
# Docker
docker run --rm -v atyantik-ems_api_uploads:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/uploads-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# PM2 / bare host
tar czf uploads-$(date +%Y%m%d-%H%M%S).tar.gz -C apps/api/uploads .
```

### Automating it

Schedule both commands (a cron job calling a small wrapper script, or your platform's managed-Postgres automatic backups if you're not running Postgres in a container yourself) and ship the resulting files to storage that isn't the same host/volume — a backup that lives next to what it's backing up doesn't survive a disk failure.

## Restore

### Database

```bash
# Docker — restore into a running (freshly created) postgres container
docker compose exec -T postgres pg_restore -U "${POSTGRES_USER:-atyantik}" -d "${POSTGRES_DB:-atyantik_ems}" --clean --if-exists < backup-20260101-000000.dump

# Bare Postgres
pg_restore -h <host> -U <user> -d <database> --clean --if-exists backup-20260101-000000.dump
```

`--clean --if-exists` drops existing objects before recreating them — this is destructive to whatever's currently in the target database. Restore into a fresh/empty database when possible instead of over an in-use one, and always confirm you're pointed at the intended target before running it.

### Uploaded files

```bash
# Docker
docker run --rm -v atyantik-ems_api_uploads:/data -v "$(pwd)":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/uploads-20260101-000000.tar.gz -C /data"

# PM2 / bare host
rm -rf apps/api/uploads/* && tar xzf uploads-20260101-000000.tar.gz -C apps/api/uploads
```

### After restoring

1. Run `prisma migrate deploy` in case the restored dump predates a schema migration that's since shipped.
2. Spot-check: log in as the Super Admin, open a random employee record, download a payslip.
3. Confirm audit logs from the restore point look continuous (no unexplained gap) — a gap usually means the dump/uploads pair are out of sync.

## Retention

Not automated in this repo — decide a retention policy (e.g. daily for 2 weeks, weekly for 3 months, monthly for a year) appropriate to your compliance requirements and wire it into whatever cron/scheduler you use for the backup step above.
