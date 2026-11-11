---
inclusion: fileMatch
fileMatchPattern: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**/*", "playwright.config.*", "vitest.config.*", "jest.config.*"]
---
# Mahira — Test and Quality Standards

## Current test baseline

The runner is Node's built-in `node:test` with the `tsx` 4.23.15 loader (Owner decision 2026-11-11, DECISIONS §2.5); tests run under Node (DEC-018). Scripts: `bun run test` (unit tests in `tests/unit/`, no database, no env), `bun run test:integration` (build, `next start` on port 3100, DB tests in `tests/integration/` one file at a time) and `bun run test:build-matrix` (four env build modes, HTTP gate test, secret scan of `.next`). Vitest, Jest and Playwright are not installed; Playwright is planned with M3-05/M5. Integration tests use the shared `mahira-cms` database only through the target guard, Owner guard and `fixture-test-` prefixes in `tests/helpers/`; never break the last-Admin, first-user or Users access rules for a DB run. See TEST-PLAN §12. Adding another runner or dependency needs an Owner decision.

## Testing approach

- Unit test deterministic domain logic and validation.
- Integration test database, CMS, auth, storage, and server-route boundaries with isolated test resources.
- E2E test user-visible journeys, role boundaries, locale behavior, and download gating.
- Security test direct endpoints and storage access, not merely the rendered button state.
- Regression-test the existing homepage before and after cross-cutting route, layout, CSS, or content changes.
- Avoid real production credentials or personal data in tests.

## Acceptance quality

A task is done only when:

1. the acceptance criteria are met;
2. lint and production build pass, or a specific existing blocker is documented;
3. relevant tests pass;
4. new behavior has accessible loading/empty/error/denied states where applicable;
5. documentation, ADRs, and traceability are updated where behavior or decisions changed;
6. no secrets, generated files, or unrelated formatting churn are introduced.

## Report truthfully

State which commands were actually run, their exit status, what was not run, and any environment limitation. Never claim a test passed if it was not executed.

## References

#[[file:docs/engineering/TEST-PLAN.md]]
#[[file:docs/engineering/TRACEABILITY-MATRIX.md]]
