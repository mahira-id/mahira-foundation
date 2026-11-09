---
inclusion: auto
name: documentation-governance
description: Use when reading, creating, updating, reconciling, or reviewing Mahira project documentation, requirements, architecture decisions, ADRs, specs, or brainstorming outputs.
---
# Mahira — Documentation Governance

## Hierarchy

1. Applicable legal/regulatory obligations and signed provider/organizational agreements.
2. Accepted ADRs for the exact architecture decision they govern.
3. Approved domain/technical specifications.
4. SRS for system behavior and verification requirements.
5. PRD for product purpose, users, scope, and priorities.
6. PDD for design principles and user experience.
7. Engineering conventions and accepted repository instructions.
8. Spikes, brainstorming diagrams, issue discussions, AI conversations, and external references as evidence/context only.

A technical ADR cannot silently change a business requirement. If sources conflict, do not resolve the conflict implicitly: record it in `docs/decisions/DECISIONS.md`, identify the decision owner, and update the affected source documents after approval.

## Status vocabulary

- `BASELINE`: explicitly stated in an approved/current project source.
- `PROPOSED`: recommended but not accepted.
- `OPEN` / `TBD`: insufficient information or no decision.
- `ACCEPTED`: formally approved by the owner and recorded.
- `BLOCKED`: work cannot proceed until a dependency/decision is resolved.
- `IMPLEMENTED`: code exists and evidence/commit/test is recorded.
- `SUPERSEDED`: replaced by a newer decision/spec; preserve history.

## Writing rules

- Start with purpose, status, owner, last updated date, scope, and related requirements/decisions.
- Give requirements stable IDs; use unambiguous `shall` statements and testable acceptance criteria.
- Separate baseline facts, recommendations, assumptions, and open decisions.
- State out-of-scope behavior explicitly.
- Prefer one source of truth per fact; cross-link instead of copying.
- Include change history for materially changed architecture/spec files.
- Do not mark a decision `Accepted` or a feature `Implemented` without evidence.
- Keep examples clearly marked as examples; never invent production values, organization claims, personal data, or credentials.

## Kiro spec synchronization

Kiro's `requirements.md`, `design.md`, and `tasks.md` are implementation artifacts. They must trace back to the project's PRD/SRS and accepted architecture documents. If Kiro discovers missing requirements or contradictory sources, it must ask for a decision or mark the spec `BLOCKED`; it must not silently fill the gap.
