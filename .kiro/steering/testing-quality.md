---
inclusion: fileMatch
fileMatchPattern: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**/*", "playwright.config.*", "vitest.config.*", "jest.config.*"]
---
# Mahira — Test and Quality Standards

## Current test baseline

The inspected `package.json` currently defines `lint` and `build`, but no `test` script or test runner. Do not assume Vitest, Jest, or Playwright is installed. Before adding a runner, propose a minimal choice, explain the scope, and wait for the dependency/tooling decision where required.

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
