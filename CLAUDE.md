# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`novo-projeto` (npm scope `@poupig`) is an npm-workspaces + Turborepo monorepo:

- `apps/frontend` — Next.js 16 (App Router, React 19, Tailwind v4), dev port 3000.
- `apps/backend` — NestJS 11 + Prisma 7 (Postgres via `@prisma/adapter-pg`), dev port 4000.
- `modules/*` — framework-free domain modules (entities, repository interfaces, use cases). Published as workspace packages (`@poupig/auth`, `@poupig/reports`, `@poupig/transactions`) and consumed by both apps.
- `packages/shared` (`@poupig/shared`) — base `Entity`/`EntityState`, `CrudRepository`/`PageResult` contracts, `UseCase` interface, `DomainError` hierarchy, and a large hand-rolled validation-rule library (`Validator.validate([...])`).
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — shared UI stubs and lint/tsconfig bases.

Domain logic never imports NestJS or Prisma. `apps/backend` is the only place that wires domain contracts to infrastructure (Prisma) and HTTP (Nest controllers). `apps/frontend` renders per-module pages/components that import types/use cases straight from the `modules/*` packages.

## Commands

Run everything from the repo root unless noted. Root scripts fan out via Turbo across all workspaces:

```bash
npm run build          # turbo run build
npm run dev             # turbo run dev (frontend :3000, backend :4000, watch builds for modules)
npm run lint             # turbo run lint
npm run check-types      # turbo run check-types
npm run format            # prettier --write over the whole repo
```

Scope any of the above to one workspace with Turborepo filters, e.g. `npx turbo run build --filter=@poupig/auth` or `npx turbo run dev --filter=frontend`.

### Backend (`apps/backend`)

```bash
npm run dev --workspace apps/backend          # nest start --watch
npm run build --workspace apps/backend
npm run test --workspace apps/backend          # jest unit tests (*.spec.ts, rootDir: src)
npm run test:e2e --workspace apps/backend       # jest -c test/jest-e2e.json
npm run test --workspace apps/backend -- user.controller.spec.ts   # single file
npm run lint --workspace apps/backend

npm run db:start --workspace apps/backend        # docker compose up -d postgres
npm run db:stop --workspace apps/backend
npm run prisma:generate --workspace apps/backend
npm run prisma:migrate:dev --workspace apps/backend -- --name <migration-name>
npm run prisma:studio --workspace apps/backend
```

Postgres runs in Docker (`apps/backend/docker-compose.yml`), driven by `DATABASE_URL`/`DB_*` in `apps/backend/.env` (see `.env.example`).

### Frontend (`apps/frontend`)

```bash
npm run dev --workspace apps/frontend     # next dev, port 3000
npm run build --workspace apps/frontend
npm run lint --workspace apps/frontend
```

### Domain modules (`modules/auth`, `modules/reports`, `modules/transactions`)

Each is an isolated TS package with its own `tsc` build and Jest config (tests live in `test/*.test.ts`, ts-jest preset):

```bash
npm run build --workspace @poupig/auth
npm run test --workspace @poupig/auth
```

## Architecture: adding a feature

New business modules are meant to be scaffolded, not hand-rolled — see `.agents/skills/config-new-module/` (`node .agents/skills/config-new-module/scripts/create-module.js --module <name> --namespace @poupig`). It creates the `modules/<name>` package, a matching `apps/backend/src/modules/<name>` Nest module/controller (registered in `app.module.ts`), and `apps/frontend` route/page/component stubs, then wires up workspace deps. Only run it when a module name is explicitly requested.

The layered pattern to follow when extending a module by hand:

1. **Domain (`modules/<name>/src`)** — plain TS, no framework imports.
   - Entities extend `Entity<TState>` from `@poupig/shared` (`modules/auth/src/user/model/user.entity.ts` is the reference example). `EntityState` supplies `id`/`createdAt`/`updatedAt`/`deletedAt`; entities are immutable (`Object.freeze`) with a `clone()` helper and a mandatory `validate()` using `Validator.validate([...])` + rules from `@poupig/shared`.
   - Repository interfaces live under `<domain>/provider/` and extend `CrudRepository<TCreate, TUpdate, TEntity, TPageParams>` from `@poupig/shared`.
   - Use cases live under `<domain>/usecase/`, implement `UseCase<TInput, TOutput>`, and depend only on domain interfaces (providers/repositories), never on concrete infra.
   - Everything is re-exported through `modules/<name>/src/index.ts`.

2. **Backend infra (`apps/backend/src/modules/<name>`)**:
   - Prisma repository implementations are named `<Entity>.prisma.ts`, class `Prisma<Interface>` (e.g. `PrismaUserRepository implements UserRepository`), injecting `PrismaService` from `apps/backend/src/db/prisma.service.ts`. See `apps/backend/src/modules/auth/user.prisma.ts`.
   - The Nest module imports `DbModule` (`apps/backend/src/db/db.module.ts`) and registers/exports the concrete Prisma class directly as a provider — no DI token/interface indirection.
   - Controllers instantiate use cases by hand (`new RegisterUser(this.cryptoProvider, this.userRepository)`) and translate `DomainError`/`ValidationException` (from `@poupig/shared`) into `HttpException`s. See `apps/backend/src/modules/auth/auth.controller.ts` for the pattern.
   - New Prisma schema for a module goes in its own `apps/backend/prisma/models/<name>.model.prisma` file (modular schema, `schema.prisma` just declares the generator/datasource); table names are mapped to snake_case plural via `@@map(...)`. Generate migrations scoped per module.

3. **Frontend (`apps/frontend/src`)**:
   - Route entry at `app/(private)/<name>/page.tsx` (or `(public)/...`) just renders `modules/<name>/pages/<name>.page.tsx`, which in turn renders `modules/<name>/components/<name>.component.tsx`. Keep routing, page, and presentational component separate even for stubs.
   - `(private)` and `(public)` are route groups with distinct layouts (`apps/frontend/src/app/(private)/layout.tsx`, `.../(public)/layout.tsx`) — there is no auth guard wired up yet, the split is structural only.

Validation in this codebase is done via the custom `Validator`/`*Rule` system in `packages/shared/src/validation`, not a schema library like Zod — reuse existing rules (`RequiredRule`, `EmailRule`, `StrongPasswordRule`, `BcryptHashRule`, etc.) before writing new ones.

## Known repo quirks

- `modules/transaction` (singular, npm name `@novo-projeto/transaction`) is a stale, unused leftover from before the `@poupig` namespace was adopted. The live module is `modules/transactions` (plural, `@poupig/transactions`), which is what `apps/backend`/`apps/frontend` actually depend on. Don't confuse the two; treat `modules/transaction` as dead weight rather than a second source of truth.
- `packages/transaction` is an empty leftover directory.
- `.agents/skills/` and `.claude/skills/` are kept as mirrors of the same 5 scaffolding skills (`config-new-module`, `config-project-fullstack`, `config-prisma`, `backend-prisma-repository`, `backend-prisma-sync-module`) — `.agents/skills` is the Codex-compatible source (each has an `agents/openai.yaml`), `.claude/skills` is what Claude Code actually loads. When editing a skill, update both copies so they don't drift again.
