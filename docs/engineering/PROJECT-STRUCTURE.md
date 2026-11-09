# Project Structure Specification

**ID:** ENG-STRUCT-001 · **Status:** Proposed target structure · **Version:** 0.1.0

## 1. Current baseline

Repository tree currently has `app/`, `components/`, `lib/`, `public/`, `docs/CORE/`, `AGENTS.md`, and a Bun lockfile. It is an early scaffold with a small number of pages/components. The target structure below is a migration direction, not a demand to create empty directories immediately.

## 2. Proposed target structure

```text
app/
  (site)/
    [locale]/
      layout.tsx
      page.tsx
      publications/
        page.tsx
        [slug]/page.tsx
      desks/[slug]/page.tsx
      topics/[slug]/page.tsx
      learning-hub/
      about/
  (account)/
    [locale]/account/
      layout.tsx
      page.tsx
      profile/page.tsx
      library/page.tsx
  (internal)/
    internal/                 # only if custom staff views are required
  api/
    files/[assetId]/download/route.ts
    webhooks/[provider]/route.ts
  admin/                      # Payload route; exact integration layout TBD
  globals.css
  layout.tsx

components/
  brand/
  site/
  publication/
  learning/
  account/
  editorial/
  ui/

lib/
  access/
  auth/
  database/
  publications/
  taxonomy/
  learning/
  storage/
  localization/
  search/
  seo/
  validation/
  observability/

payload/
  collections/
  globals/
  access/
  hooks/
  migrations/
  payload.config.ts

supabase/
  migrations/
  seed.sql
  tests/                      # SQL/RLS tests where supported

tests/
  unit/
  integration/
  e2e/
  fixtures/

public/
  logo/
  fonts/                      # only if self-hosting licensed font files
```

This is conceptual. Payload 3 integration may place config/admin route files in different locations according to the chosen starter/version. Follow current official integration structure and keep Payload-specific artifacts together where feasible.

## 3. App Router conventions

- Route groups such as `(site)` and `(account)` organize layouts without adding URL segments.
- `[locale]` must be positioned consistently with approved IA.
- Do not put all route business logic in `page.tsx`; page composes domain queries and components.
- Route handlers are for real HTTP boundaries, not a mandatory proxy for every server query.
- Layouts should not assume all descendants share the same authorization policy.
- A layout-level gate is UX/defense-in-depth; sensitive mutations still authorize independently.

## 4. Component organization

- `components/ui`: generic, reusable primitives; no organization-specific business logic.
- `components/publication`: publication-specific presentation and states.
- `components/site`: masthead, footer, navigation, global public shell.
- `components/account`: account and entitlement presentation; never owns policy decision.
- `components/editorial`: custom staff surfaces only; Payload admin remains Payload-owned.
- `components/brand`: logo and wordmark wrappers.

## 5. Domain module responsibilities

A domain module may expose validated queries, command functions, schemas, and types. Avoid importing DB clients from UI. Access evaluator lives in a server-only domain module and receives trusted facts; it should be unit-testable without a live Supabase connection.

## 6. Migration approach

Move code by domain when a real slice needs it. Preserve existing landing components while extracting shared pieces. Avoid renaming or moving everything in one giant refactor before requirements and tests exist. Each structural change should keep build and existing behavior passing.
