# Integrating This Documentation Pack into `mahira-foundation`

## 1. What this package contains

This package adds working documentation under `docs/`, a proposed root-agent instruction insert, and this integration guide. It does **not** replace or rewrite your existing source files: `PRD.md`, `PDD.md`, `SRS.md`, `README.md`, `AGENTS.md`, or `CHAT_WITH_CLAUDE.md`.

All additional ADRs/specifications are proposed baselines. They are not automatically accepted decisions. Review the status and open questions before implementation.

## 2. Safe copy procedure

1. Commit or create a backup of the current repository.
2. Copy the `docs/` directory from this package into the repository. If `docs/CORE/` already contains PRD/PDD/SRS, do not overwrite them with this package; this package intentionally includes only `docs/CORE/README.md` as an integration note.
3. Preserve current `docs/CORE/PRD.md`, `PDD.md`, and `SRS.md`. The top-level docs index should point to those actual paths.
4. Keep `CHAT_WITH_CLAUDE.md` as a non-normative archive. Optionally move it to `docs/references/` after confirming no tooling relies on its current path.
5. Review `docs/AGENTS-PROPOSED.md` alongside the existing root `AGENTS.md`; merge relevant rules rather than replacing the existing file wholesale.
6. Inspect actual `app/globals.css`, `package.json`, `bun.lock`, Payload configuration (if already introduced), and Supabase configuration before accepting implementation conventions.
7. Update `docs/STATUS.md` after the first review with actual owners, decisions, and blockers.

## 3. First review sequence

1. Reconcile the MVP conflict between PRD §7, PRD §13, SRS P0 FR-009–FR-013, and SRS §14.
2. Review DEC-001 through DEC-024 and assign decision owners.
3. Decide content taxonomy and publication asset behavior with editorial stakeholders.
4. Resolve locale model and route/slug policy before creating production content.
5. Resolve database schema ownership and identity boundary.
6. Validate the Payload/Postgres, Auth, and Storage spikes.
7. Accept or amend ADRs based on evidence.

## 4. Source-of-truth rule

The current CORE documents remain the approved/baseline requirements only to the extent their status indicates. A later accepted ADR may clarify an implementation choice, but it must not silently change a product requirement. If an accepted ADR conflicts with PRD/PDD/SRS, update the affected baseline document or add a clearly referenced amendment. Keep a change history.

## 5. Important implementation caveats

- The package does not assert that Payload + Supabase Storage adapter compatibility has been tested.
- The package does not set production environment variables, cloud projects, DNS, secrets, bucket policies, or billing.
- It does not select final package manager/runtime solely because `bun.lock` exists.
- It does not set final brand/logo usage without inspecting the SVG assets and obtaining brand approval.
- It does not provide legal advice or declare compliance with Indonesian law.
- It does not select a payment provider or define subscription pricing/terms.

## 6. Suggested first pull request

A documentation-only PR may add the `docs/` tree, retain existing core files, merge reviewed AGENTS instructions, and link the root README to `docs/README.md`. The PR should note that the specs are proposed and list the first unresolved decisions.
