# Fullstack Project Setup — Step-by-step Reference

This document is the authoritative narrative of every step executed by `scripts/setup.js`.
Read this to understand what the script does and why.

---

## 1. Create Turborepo monorepo

```bash
npx create-turbo@latest <project-name> -m npm
```

Creates the monorepo root with `turbo.json`, root `package.json`, and `apps/` directory.

---

## 2. Clear default apps

```bash
rm -rf apps/*
```

Turborepo ships with example apps we don't need. Clean slate.

---

## 3. Create Next.js frontend

```bash
cd apps
npx create-next-app@latest --yes --src-dir
```

Flags:
- `--yes` accepts all defaults (TypeScript, ESLint, Tailwind, App Router)
- `--src-dir` puts source under `src/`

The app is created as `apps/my-app` (Next.js uses the directory name). The script renames it to `apps/frontend` afterward.

---

## 4. Install NestJS CLI globally

```bash
npm i -g @nestjs/cli
```

Required to run `nest new`.

---

## 5. Create NestJS backend

```bash
cd apps
nest new backend -g -p npm
```

Flags:
- `-g` skips git init (Turborepo root already has git)
- `-p npm` uses npm as package manager

Creates `apps/backend` with a working NestJS app.

---

## 6. Install @nestjs/config

```bash
cd apps/backend
npm install @nestjs/config
```

Enables `.env` file loading via `ConfigModule`.

---

## 7. Patch apps/backend/src/app.module.ts

Replace content with:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Makes `ConfigModule` global so all modules can use `ConfigService` without re-importing.

---

## 8. Patch apps/backend/src/main.ts

Replace content with:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3005);
}
bootstrap();
```

Changes:
- Port from 3000 → 3005 (avoids conflict with Next.js default port 3000)
- CORS enabled for local frontend-backend communication

---

## 9. Add `dev` script to apps/backend/package.json

Add to `scripts`:

```json
"dev": "nest start --watch"
```

Enables `npm run dev` in the backend, consistent with the frontend convention.

---

## 10. Create apps/frontend/.env.example

```
NEXT_PUBLIC_API_URL=http://localhost:3005
```

Documents the required env var for the frontend.

---

## 11. Create apps/backend/.env.example

```
PORT=3005
```

Documents configurable env vars for the backend.

---

## 12. Copy apps/backend/.env.example → apps/backend/.env

```bash
cp apps/backend/.env.example apps/backend/.env
```
