# CardMax - Project Conventions

## Overview
Credit card optimization platform. See `MASTER_PLAN.md` for full architecture and roadmap.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Chakra UI v3
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Auth**: Clerk
- **Cache**: Redis (Upstash)
- **Chrome Extension**: React + Vite (Manifest V3)
- **Hosting**: Vercel + Neon

## Project Structure
- Monorepo: `apps/web` (Next.js), `apps/extension` (Chrome ext), `packages/shared`, `packages/card-data`
- Database schema lives in `apps/web/src/server/db/schema/`
- API routes use Next.js App Router route handlers in `apps/web/src/app/api/`
- Server-side business logic in `apps/web/src/server/services/`

## Coding Conventions
- TypeScript strict mode everywhere
- Use Drizzle for all database queries — no raw SQL unless absolutely necessary
- Prefer server components; use `"use client"` only when needed
- API routes return consistent shape: `{ data, error, meta }`
- Use zod for request validation
- File naming: kebab-case for files, PascalCase for components
- Exports: named exports preferred over default exports

## Database
- All tables use UUID primary keys
- Timestamps: `created_at` (always), `updated_at` (when mutable)
- Enums defined in Drizzle schema, not as Postgres enums (easier migrations)
- Migrations via `drizzle-kit`
- Local dev DB: `postgresql://localhost:5432/cardmax`
- `pnpm db:push` requires `DATABASE_URL` — for local dev, run: `DATABASE_URL="postgresql://localhost:5432/cardmax" pnpm db:push`

## Git
- Branch naming: `ws{number}/{feature-name}` (e.g., `ws1/card-schema`)
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- PR per feature, squash merge to main

## Environment Variables
- `.env.local` for local dev (never committed)
- Required: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Optional: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`

## Testing
- Vitest for unit tests
- Playwright for E2E (future)
- Test files co-located: `foo.test.ts` next to `foo.ts`

## Key Commands
- `pnpm dev` — Start dev server
- `pnpm db:push` — Push schema to database
- `pnpm db:migrate` — Run migrations
- `pnpm db:seed` — Seed card data
- `pnpm db:studio` — Open Drizzle Studio
- `pnpm build` — Production build
- `pnpm test` — Run tests
