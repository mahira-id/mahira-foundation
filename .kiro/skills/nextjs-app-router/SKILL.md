---
name: nextjs-app-router
description: Implement or review Next.js App Router pages, layouts, Server Components, Client Components, route handlers, metadata, caching, and navigation in the Mahira repository.
---
# Next.js App Router Implementation

## Start with the installed version

1. Read the current `package.json` and `AGENTS.md`.
2. This repository currently declares Next.js `16.4.4`. Before writing or changing Next.js APIs, inspect the relevant installed guide in `node_modules/next/dist/docs/` as instructed by `AGENTS.md`.
3. Do not copy conventions from older Next.js tutorials without checking the local version.

## Implementation rules

- Preserve App Router unless an accepted ADR changes it.
- Prefer Server Components; add `'use client'` only for browser state, event handlers, or browser-only APIs.
- Keep data access and secrets on the server.
- Use route handlers for HTTP contracts and server actions only for appropriate form/mutation workflows; apply server-side authorization to every sensitive operation.
- Define loading, error, not-found, and empty states deliberately.
- Choose static, revalidated, or dynamic rendering from the page's data/security requirements; do not add cache invalidation assumptions without an explicit strategy.
- Implement metadata on the server and preserve canonical/locale correctness once routing decisions are accepted.
- Avoid unnecessary client-side fetches for content that can be rendered on the server.
- Use `next/image` and `next/font` patterns supported by the installed version.
- Keep existing homepage composition and components intact unless the approved spec authorizes a change.

## Before finishing

Run the repository's available lint/build commands where feasible. State any test runner that is not installed rather than pretending tests ran.
