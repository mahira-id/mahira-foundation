---
name: feature-spec-authoring
description: Create, refine, or review Kiro feature specifications for Mahira. Use when planning a new feature, writing requirements.md, design.md, tasks.md, acceptance criteria, or implementation gates.
---
# Feature Spec Authoring

## Goal
Create a reviewable Kiro spec that translates an approved product/system requirement into testable feature scope and executable tasks.

## Workflow
1. Read `docs/CORE/PRD.md`, `docs/CORE/SRS.md`, and the relevant PDD sections.
2. Find matching FR/NFR IDs and entries in `docs/decisions/DECISIONS.md`.
3. Identify current implementation facts from the repository; do not assume target architecture is installed.
4. Write user stories and acceptance criteria in observable language. Use EARS-style statements where suitable: `WHEN ... THE SYSTEM SHALL ...`.
5. Separate baseline requirements, proposed design choices, assumptions, and open questions.
6. Write `design.md` only after requirements are coherent. Reference accepted ADRs; mark unresolved architecture as a decision gate.
7. Decompose `tasks.md` into small, verifiable tasks with dependencies, test expectations, and explicit blocked gates.
8. Review scope exclusions and failure/edge cases.

## Mandatory rules
- Never promote an OPEN/PROPOSED decision to accepted.
- Never ask Kiro to install Payload/Supabase or generate migrations before the corresponding architecture/spike gate is accepted.
- Do not add payment gateway, full LMS, analytics, or other Phase 2 scope by implication.
- Keep tasks vertically sliceable and demonstrable.
- A task must describe expected output and how to verify it.
- Do not write tasks such as "finish backend" or "make everything work".

## Output checklist
- Requirements have stable IDs and acceptance criteria.
- Roles and permissions are stated for relevant behavior.
- Empty, loading, failure, denied, and boundary cases are captured.
- Data, routes, SEO, accessibility, and tests are considered where relevant.
- Dependencies and unresolved decisions are explicit.
- `tasks.md` begins with pre-flight gates and contains a final verification task.
