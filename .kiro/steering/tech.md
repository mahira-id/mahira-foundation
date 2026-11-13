---
inclusion: always
---
# Mahira — Technology Stack and Technical Constraints

## Verified current repository baseline (2026-11-13)

- Next.js `16.4.4` (App Router), React `19.3.0`, React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `4`, ESLint `9` with `eslint-config-next` `16.4.4`.
- `next.config.ts` sets `cacheComponents: true`, `partialPrefetching: true`, and `serverExternalPackages: ["payload"]` (one Payload copy for pages, admin, and REST; DECISIONS DEC-006 upgrade triggers).
- Bun `1.3.14` is the package manager; Node.js `26.x` is the runtime (`engines.node`, DEC-018). Do not run the app or tests under Bun.
- Payload CMS `3.93.0` is embedded in the same Next.js app (DEC-006): admin at `/admin`, REST at `/api`, code in `payload/`. `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/db-postgres`, and `@payloadcms/storage-s3` are pinned to the same exact version.
- Database: Supabase Postgres project `mahira-cms` for the CMS, separate from the APP project (DEC-007). Schema changes go only through committed Payload migrations with RLS enabled in each `up()`. The pg pool is bounded (`max` 5 per process) and a failed DB connect fails only that request (DECISIONS §2.9).
- Storage: Supabase Storage through `@payloadcms/storage-s3` for public files only (DEC-012 stays Proposed; the private part is M5).
- CMS environment gate: `payload/env.ts` reads the five CMS env vars as one set. With no vars, or with `VERCEL_ENV=production`, the CMS is off and `proxy.ts` answers 404 for `/admin`, `/api`, and `/{locale}/publications`. Vercel Production runs with the CMS off; Vercel Preview runs with it on (ENVIRONMENTS §3.1).
- Tests: `node:test` with `tsx` (DECISIONS §2.5). Scripts: `test` (unit), `test:integration` (shared `mahira-cms` with `fixture-test-` isolation), `test:build-matrix`. CI: `.github/workflows/ci.yml`, job `check`, no secrets. Playwright is not installed (TEST-PLAN schedules it for M3-05/M5).
- Not installed: Supabase Auth or Supabase SDKs for public users, an email adapter (DEC-019), payment integrations.

## Target architecture still to validate

- Supabase Auth for public users and a server-side access evaluator (M5; SPIKE-002 is still Planned).
- Private bucket and signed URLs for `registered` files (M5, DEC-012).
- CMS in Production, its pooler mode, and the production region (M4; DEC-017, DEC-020).
- PostgreSQL full-text search (DEC-013 Accepted; implementation in M3-06); external search only if evidence justifies it.

Do not install or configure these until the relevant decision is accepted and the matching spike passes.

## Technical rules

1. Use the dependency versions already declared in `package.json` and `bun.lock`; do not casually upgrade frameworks or major versions. A Payload or Next upgrade must rerun the checks listed under DEC-006 and ENVIRONMENTS §3.1.
2. Before changing Next.js APIs or conventions, inspect the installed package documentation in `node_modules/next/dist/docs/` as directed by the root `AGENTS.md`. Do not rely on memory for Next.js 16 APIs.
3. Use Bun for package-management commands in this repository unless the owner changes the package-manager decision. Do not use npm/yarn/pnpm to mutate the lockfile.
4. Do not assume Node.js and Bun are interchangeable runtimes. Runtime and deployment compatibility remain separate decisions.
5. Preserve the current App Router architecture. Do not introduce Vite or a second frontend application without an accepted architecture decision.
6. Prefer server components by default; add client components only for genuine browser interaction.
7. Keep secrets out of `NEXT_PUBLIC_*`, client components, source files, logs, test fixtures, and generated docs.
8. Store durable uploaded files outside ephemeral application filesystems.
9. Keep external integrations behind clear adapters and server-side boundaries.
10. Do not add a dependency, database, cloud resource, or service provider solely because a sample or skill mentions it.
11. Never apply a migration to the shared `mahira-cms` database, and never modify the Owner's staff account, without explicit Owner approval.

## Current baseline and package references

#[[file:package.json]]
#[[file:next.config.ts]]
#[[file:AGENTS.md]]

## Decision gate

Before implementing CMS, database, authentication, storage, search, or deployment integrations, read `docs/decisions/DECISIONS.md`, the relevant accepted ADR, and the matching technical spike report. If any required artifact is missing or unresolved, stop at design/research and report the blocker rather than inventing an implementation.
