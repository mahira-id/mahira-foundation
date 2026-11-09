---
inclusion: always
---
# Mahira — Repository Structure and Code Boundaries

## Current repository structure

```text
app/                 # Next.js App Router; current homepage and global styles
components/          # shared brand, home, site, and UI components
lib/                 # current landing content and future domain utilities
public/              # static assets, including logo variants
docs/CORE/           # PRD, PDD, SRS, and core documentation index
AGENTS.md            # Next.js-generated agent instruction block
package.json
bun.lock
```

The current codebase is a homepage foundation, not yet the complete publication platform. Do not treat proposed future folders as existing implementation.

## Current files to preserve and understand

- `app/page.tsx` is the current root homepage entry point.
- `app/layout.tsx` and `app/globals.css` own the current root layout and global design tokens/styles.
- `components/brand/mahira.tsx` contains the Mahira mark component.
- `components/site/header.tsx` and `components/site/footer.tsx` provide the site shell.
- `components/home/` contains homepage presentation components.
- `lib/landing-content.ts` is a current hardcoded landing-content source; do not silently represent it as CMS-backed data.
- `public/logo/` contains multiple logo variants; choose variants according to the brand guide when accepted.

## Proposed future boundaries

These boundaries are architectural intentions, not permission to create all folders immediately:

- `app/` — route composition, layouts, loading/error states, route handlers.
- `components/` — reusable presentation components grouped by domain and shared UI.
- `lib/` — server-only integrations, domain services, validation, access evaluator, repositories.
- `docs/` — product, architecture, specification, engineering, content, and legal documents.
- `.kiro/` — Kiro workspace steering, skills, hooks, and feature specs.

When architecture decisions are accepted, align folder names with `docs/engineering/PROJECT-STRUCTURE.md`. Do not create speculative abstractions for future subscription/payment features.

## Naming and dependency boundaries

- Use descriptive kebab-case for route segments and filenames where it matches existing conventions.
- Use PascalCase for React component names and TypeScript types.
- Keep UI components free from direct privileged database/storage access.
- Keep external provider SDKs behind server-side service/adaptor modules.
- Avoid circular imports and broad barrel exports that hide dependency direction.
- Co-locate tests with the feature or follow the test convention once selected.

## Root AGENTS.md is managed by Next.js

The current root `AGENTS.md` contains a generated Next.js rule block. Preserve the generated block. Put Mahira-specific persistent rules in `.kiro/steering/` rather than replacing or deleting the Next.js block.

## File references

#[[file:AGENTS.md]]
#[[file:app/page.tsx]]
#[[file:app/layout.tsx]]
#[[file:app/globals.css]]
#[[file:lib/landing-content.ts]]
#[[folder:components]]
#[[folder:public/logo]]
