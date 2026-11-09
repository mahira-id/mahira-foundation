# Engineering Conventions

**ID:** ENG-CONV-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Purpose and authority

Menetapkan cara kerja teknis yang konsisten. Ketentuan ini menjadi default engineering convention setelah disetujui; aturan spesifik framework harus diperbarui mengikuti versi dependency yang dipin dan dokumentasi resmi versi tersebut.

## 2. Core principles

- TypeScript strictness remains enabled; avoid `any`, unsafe casts, and suppression without an adjacent explanation.
- Prefer small, cohesive modules aligned to product domains.
- Keep business rules independent from React components and framework transport where practical.
- Server-side by default for data access and secrets; add client components only for real browser interaction.
- One source of truth for data schema, validation, access decisions, and design tokens.
- No privileged operation without explicit server-side authorization.
- No production schema edits by hand outside version-controlled migration workflow.
- Avoid speculative abstractions; introduce shared abstractions after repeated, stable patterns emerge.

## 3. Server/client boundary

### Server responsibilities
- Database queries and mutations.
- Supabase service-role operations (only when justified and after authorization).
- Payload local API access and staff-only operations.
- Secrets, webhook verification, signed URL generation, audit writes.
- Authorization and trusted content-state resolution.

### Client responsibilities
- Input interaction, local state, optimistic presentation only when safe.
- Search input and URL navigation.
- Accessible controls and feedback.
- Rendering of data already authorized for the current user.

Never import server-only modules into client component dependency graphs. Add explicit server-only guards where supported. Do not expose secrets via `NEXT_PUBLIC_` variables.

## 4. Domain boundaries

Recommended initial domains: `publications`, `taxonomy`, `authors`, `learning`, `accounts`, `access`, `storage`, `editorial`, `localization`, `search`, and `observability`. Domain modules should own relevant validation and policies. Avoid cross-domain SQL or queries scattered inside UI components.

## 5. Naming and code style

- Files/folders: kebab-case unless framework conventions require otherwise.
- React components: PascalCase exports; filenames remain consistent with repository style.
- Functions/variables: camelCase; constants: descriptive names, not unexplained abbreviations.
- Types/interfaces: PascalCase; discriminated unions for states/results.
- Database fields: one consistent convention (recommended snake_case in SQL; map at application boundary if needed).
- Environment variables: uppercase snake case; exact list lives in ENVIRONMENTS.md.
- Avoid abbreviations except established domain terms (ID, EN, URL, SEO, RLS).
- Use named exports for ordinary modules unless framework/library convention requires default export.

## 6. Validation and errors

- Validate external inputs at boundaries: route params, query strings, form submissions, webhook body, uploaded files.
- Reuse schemas when server and client need the same constraints, but never rely on client validation for security.
- Use typed error categories; map to safe user-facing messages at UI/API boundary.
- Do not swallow errors. Log safely with correlation IDs and rethrow/return typed failures.
- Do not log secrets, access tokens, passwords, signed URLs, or private document contents.

## 7. Data and migrations

- Every table/collection has a named owner and migration authority in DATA-MODEL.md.
- Payload migrations manage Payload-owned tables; Supabase CLI/SQL migrations manage app-owned tables, unless ADR changes the boundary.
- Migration must be repeatable and committed with application code.
- Destructive migration requires backup/restore plan, compatibility analysis, and explicit review.
- Production schema changes follow expand-migrate-contract when zero-downtime is relevant.
- Seed data must be deterministic and must not include production personal data.

## 8. Dependency and package management

- Pin package manager version in `package.json` `packageManager` field after decision.
- Commit exactly one authoritative lockfile.
- CI uses frozen/immutable lockfile install.
- Do not mix Bun/npm/pnpm/yarn lockfiles.
- Node.js runtime version and package manager version are separate decisions.
- Dependency upgrades should be grouped by risk and verified with build, lint, tests, and migration checks.

## 9. Git and pull request workflow

Suggested branch pattern: `feat/<domain>-<short-name>`, `fix/...`, `docs/...`, `chore/...`. Keep PRs focused. PR description includes purpose, linked requirement/decision, schema changes, security impact, screenshots or API examples, test evidence, and rollback notes. Require review for access policy, migration, secrets, and production config changes.

## 10. Definition of Done

A slice is done only when:
- requirement and acceptance criteria are linked;
- UI states and responsive behavior are implemented;
- server-side authorization is present for sensitive operations;
- schema/migration and seed changes are committed;
- unit/integration/E2E tests appropriate to risk pass;
- accessibility and SEO requirements are met where applicable;
- logs/monitoring are safe and useful;
- staging deployment is demonstrable;
- docs and STATUS.md are updated;
- known limitations and deferred decisions are recorded.

## 11. Anti-patterns

Do not: query privileged tables from browser; trust hidden UI as authorization; place private files under `public/`; use ad-hoc hardcoded content where CMS ownership is intended; duplicate token values; create unowned database tables; bypass migration history; make AI-generated assumptions into accepted policy; overbuild a generic framework before product needs are proven.
