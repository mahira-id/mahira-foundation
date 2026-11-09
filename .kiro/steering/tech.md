---
inclusion: always
---
# Mahira — Technology Stack and Technical Constraints

## Verified current repository baseline (2026-11-06)

- Next.js `16.4.4` (App Router), React `19.3.0`, React DOM `19.3.0`.
- TypeScript `^5`.
- Tailwind CSS `4`, ESLint `9` and `eslint-config-next` `16.4.4`.
- `package.json` declares `packageManager: "bun@1.3.14"`; treat this as the package-manager declaration, not proof that Bun is the production JavaScript runtime.
- Current scripts: `dev`, `build`, `start`, `lint`.
- Current dependencies do not include Payload CMS, Supabase SDKs, authentication packages, a database client, storage adapter, or a test framework.
- Existing landing page is implemented under `app/page.tsx`, with shared components under `components/` and hardcoded landing content in `lib/landing-content.ts`.

## Candidate target architecture — not yet validated

The product documents discuss the following as a proposed architecture:

- Next.js App Router + TypeScript as the application framework.
- Payload CMS 3 for editorial content and staff administration.
- Supabase PostgreSQL, Supabase Auth for public users, and Supabase Storage.
- A server-side authorization/entitlement layer for protected publication assets.
- PostgreSQL full-text search initially; external search only if evidence justifies it.
- Vercel as a proposed application host; DNS/domain may remain with the registrar.

These are **target candidates**, not currently installed code. Do not install or configure them until the relevant ADRs are accepted and the technical spikes pass.

## Technical rules

1. Use the dependency versions already declared in `package.json` and `bun.lock`; do not casually upgrade frameworks or major versions.
2. Before changing Next.js APIs or conventions, inspect the installed package documentation in `node_modules/next/dist/docs/` as directed by the root `AGENTS.md`. Do not rely on memory for Next.js 16 APIs.
3. Use Bun for package-management commands in this repository unless the owner changes the package-manager decision. Do not use npm/yarn/pnpm to mutate the lockfile.
4. Do not assume Node.js and Bun are interchangeable runtimes. Runtime and deployment compatibility remain separate decisions.
5. Preserve the current App Router architecture. Do not introduce Vite or a second frontend application without an accepted architecture decision.
6. Prefer server components by default; add client components only for genuine browser interaction.
7. Keep secrets out of `NEXT_PUBLIC_*`, client components, source files, logs, test fixtures, and generated docs.
8. Store durable uploaded files outside ephemeral application filesystems.
9. Keep external integrations behind clear adapters and server-side boundaries.
10. Do not add a dependency, database, cloud resource, or service provider solely because a sample or skill mentions it.

## Current baseline and package references

#[[file:package.json]]
#[[file:bun.lock]]
#[[file:next.config.ts]]
#[[file:AGENTS.md]]

## Decision gate

Before implementing CMS, database, authentication, storage, search, or deployment integrations, read `docs/decisions/DECISIONS.md`, the relevant accepted ADR, and the matching technical spike report. If any required artifact is missing or unresolved, stop at design/research and report the blocker rather than inventing an implementation.
