# SPIKE-001 — Payload CMS with Supabase PostgreSQL

**Status:** Planned · **Decision links:** DEC-004, DEC-005, DEC-006, DEC-007, DEC-018 · **ADR:** 0002 · **Owner:** TBD

## Question
Can the pinned Payload CMS 3 integration and selected PostgreSQL adapter run reliably against the intended Supabase database configuration, with isolated schema ownership and repeatable migrations, in local development and the proposed deployment environment?

## Hypothesis
A single Next.js application can host Payload while Payload owns its collections/tables and Supabase application SQL owns separate user/access tables. Runtime and migration connections may need different connection settings. This is a hypothesis, not a verified fact for the current repository.

## Scope
- Add Payload to an isolated spike branch or throwaway app.
- Connect to non-production Supabase Postgres project.
- Create one simple Publication collection and one related Author.
- Run Payload migrations from a clean database and upgrade an existing database.
- Verify CRUD, draft/publish behavior needed by the baseline, and server build.
- Verify deployment start/runtime under candidate host if hosting decision depends on it.

## Non-scope
Full localization, complete schema, production content migration, billing, production credentials, and polished admin UX.

## Procedure (to be completed)
1. Pin compatible versions from official release documentation.
2. Create isolated DB project and least-privileged credentials suitable for Payload's connection model.
3. Configure Payload adapter and Next integration according to pinned docs.
4. Run initial migration and CRUD smoke test.
5. Restart application and verify data persistence.
6. Add an app-owned test table through separate migration authority and verify no naming/schema collision.
7. Test pooler/runtime connection mode and direct migration mode if applicable.
8. Run concurrent reads/writes and inspect connection failure behavior.
9. Deploy to a non-production preview environment and repeat smoke test.

## Exit criteria
- Clean install and migration work from repository state.
- Existing database migration path is repeatable and documented.
- CRUD works after process restart and redeploy.
- App-owned migration does not alter Payload-owned objects.
- Runtime connection behavior is stable under representative concurrency.
- No credentials appear in client bundle or logs.
- Backup/restore and migration rollback/forward strategy is understood.
- Exact version and provider limitations are recorded.

## Evidence to record
`package.json`, lockfile, migration output, schema inventory, build logs, runtime logs with secrets redacted, connection mode, latency/concurrency observations, deployment URL (non-sensitive), and failed tests.

## Open questions
- Which Payload/Postgres adapter version is selected?
- Does the chosen Supabase pooler mode support the adapter's runtime expectations?
- How will migrations be run safely in CI and production?
- Does the proposed hosting platform support all required Payload/Next runtime behavior?
