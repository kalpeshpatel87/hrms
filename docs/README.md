# Documentation Index

| Doc | What's in it |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, backend module contract, soft-delete/audit conventions, auth/RBAC model, frontend structure, known limitations |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Full directory tree with what lives where |
| [ER_DIAGRAM.md](./ER_DIAGRAM.md) | Mermaid ER diagrams, grouped by domain |
| [MODULES.md](./MODULES.md) | Every module's status (deep vs scaffolded), mount path, frontend availability |
| [API.md](./API.md) | REST API conventions — auth, pagination, permissions, file uploads, response envelope |
| [ENV_VARS.md](./ENV_VARS.md) | Every environment variable, required vs optional, what it does |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Docker Compose and PM2 deployment instructions, post-deploy checklist |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Conventions enforced across the codebase, backend and frontend |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Local setup, branch/commit conventions, how to add a module or page |
| [CI_CD.md](./CI_CD.md) | What the GitHub Actions pipeline does and how to extend it |
| [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) | Database and file-storage backup/restore procedures |
| [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) | RPO/RTO targets, failure-scenario playbooks |

Start with **ARCHITECTURE.md** if you're new to the codebase; start with **CONTRIBUTING.md** if you just want to get it running locally.
