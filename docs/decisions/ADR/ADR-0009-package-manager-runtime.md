# ADR-0009 — Package Manager and JavaScript Runtime

- **Status:** Proposed
- **Related decisions:** DEC-018
- **Decision owner / approver:** Engineering — TBD

## Context

Repository tree contains `bun.lock`, which is evidence that Bun has been used for dependency locking. It does not prove that production runs on the Bun runtime. The project requires reproducible local setup, CI, build, and deployment.

## Decision to make

Choose separately:

1. Package manager and lockfile format.
2. Local development runtime.
3. CI build runtime.
4. Production runtime supported by hosting provider.

## Proposed policy

- Use exactly one canonical package manager and commit its lockfile.
- Pin a supported runtime version in repository/tooling configuration.
- Do not mix `npm install`, `pnpm install`, and `bun install` opportunistically.
- CI uses frozen/immutable lockfile installation.
- Production runtime is selected based on official support by Next.js, Payload, selected adapters, and host—not merely because the local machine uses Bun.
- If Bun is package manager only, Node.js may still be the production runtime. This must be explicit in README and CI.

## Validation

Run clean install, lint, typecheck, unit/integration test, Next.js build, Payload admin boot, and deploy smoke test from a clean checkout using the selected runtime/toolchain. Record exact versions and output in a spike report.
