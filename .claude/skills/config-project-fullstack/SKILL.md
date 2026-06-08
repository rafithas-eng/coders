name: config-project-fullstack
description: Scaffolds a complete fullstack monorepo from scratch using Turborepo, Next.js (frontend on port 3000) and NestJS (backend on port 3005). Use this skill whenever the user wants to create a new fullstack project, set up a monorepo, configure Next.js with NestJS, bootstrap a Turborepo project, or scaffold a project with frontend and backend. Also triggers when the user mentions "projeto fullstack", "criar projeto", "config-project-fullstack", or passes a namespace like @my-org. Executes deterministically via a JavaScript setup script — never improvise steps manually.

---

# config-project-fullstack

Scaffolds a production-ready Turborepo monorepo with:
- **Frontend**: Next.js (port 3000) with `src/` directory layout
- **Backend**: NestJS (port 3005) with CORS, `@nestjs/config`, `.env` support
- **Namespace support**: pass `@namespace` to rename the project scope across all files

---

## How to use this skill

1. Read `references/steps.md` for the full deterministic step list
2. Run `scripts/setup.js` via Node.js — it executes every step programmatically
3. If the user passed a `@namespace`, apply it via `scripts/apply-namespace.js` after setup

### Syntax

```
/config-project-fullstack [project-name] [@namespace]
```

Examples:
```
/config-project-fullstack my-app
/config-project-fullstack my-app @acme
```

- `project-name` defaults to `projeto-exemplo` if omitted
- `@namespace` is optional; when provided it renames the npm scope across `package.json` files

---

## Execution steps (summary)

Claude must run the setup script, not reproduce steps manually:

```bash
node scripts/setup.js <project-name> [namespace]
```

After completion, verify with:

```bash
node scripts/verify.js <project-dir>
```

---

## Namespace behaviour

When `@namespace` is provided:
- `package.json` `name` fields become `@namespace/frontend` and `@namespace/backend`
- `turbo.json` pipeline references are updated
- `NEXT_PUBLIC_API_URL` and cross-app references are preserved unchanged

See `scripts/apply-namespace.js` for implementation details.

---

## Important notes

- The backend `.env` is copied from `.env.example` automatically
- Frontend `.env.example` contains `NEXT_PUBLIC_API_URL=http://localhost:3005`
- Backend `.env.example` contains `PORT=3005`
- Never change ports from the values above unless the user explicitly requests it
- If any `npm install` step fails due to network, inform the user and stop

---

## Reference files

- `references/steps.md` — Full narrative of every step with rationale
- `scripts/setup.js` — Main deterministic setup script (Node.js)
- `scripts/apply-namespace.js` — Namespace renaming utility
- `scripts/verify.js` — Post-setup verification checks
