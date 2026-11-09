---
name: implementation-review
description: Review Mahira code changes, Kiro-generated implementations, pull requests, bug fixes, or feature completion for requirement alignment, architecture, security, accessibility, tests, and maintainability.
---
# Mahira Implementation Review

## Review order
1. Requirement and scope alignment: identify PRD/SRS IDs and accepted spec criteria.
2. Architecture alignment: check relevant accepted ADRs, domain boundaries, and ownership.
3. Security: inspect server-side authorization, trust boundaries, secret exposure, RLS/storage policy, and input validation.
4. Data correctness: inspect relationships, migrations, locale/slug uniqueness, state transitions, and backward compatibility.
5. UX/a11y: inspect semantic markup, keyboard/focus, loading/error/empty/locked states, responsive behavior, and reduced motion.
6. Quality: inspect TypeScript correctness, error handling, logging, caching, performance, and tests.
7. Operations: inspect environment variables, migrations, deployment side effects, rollback, and documentation.

## Review output

Report findings ordered by severity:
- `Blocker`: data loss, privilege escalation, private document exposure, leaked secret, broken critical flow.
- `High`: major requirement violation, incorrect access boundary, broken migration/locale, no regression protection for core behavior.
- `Medium`: maintainability, incomplete edge handling, accessibility gap, performance concern.
- `Low`: clarity, naming, small consistency issue.

For every finding include file/line, impact, reproduction or reasoning, and concrete remediation. Do not invent findings. If no findings, state what was reviewed and what was not tested.

## Completion check

Do not declare complete unless acceptance criteria are traceable and commands/tests actually ran. Report skipped tests and environment constraints honestly.
