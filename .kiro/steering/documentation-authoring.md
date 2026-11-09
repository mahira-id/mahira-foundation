---
inclusion: fileMatch
fileMatchPattern: ["docs/**/*.md", ".kiro/specs/**/*.md", ".kiro/steering/**/*.md"]
---
# Mahira — Documentation Authoring Rules

- Preserve Indonesian as the default explanatory language; keep exact technical identifiers and code terms where precision benefits.
- Every normative statement must be traceable to an accepted baseline, ADR, stakeholder decision, or approved spec.
- Explicitly label proposed choices and unknowns. Do not fabricate an approver, owner, date, metric, legal interpretation, provider capability, or implementation status.
- Use stable IDs for requirements (`FR`, `NFR`, `AC`, or feature-prefixed IDs), decisions (`DEC-NNN`), and ADRs (`ADR-NNNN`). Avoid reusing retired IDs.
- Prefer concise cross-references over duplicate copies of the same policy.
- When updating a requirement, review linked Kiro specs, architecture docs, test plan, and traceability matrix.
- When a source conflict exists, record the conflict and its impact before changing code.
- Keep documentation navigable: purpose, status, scope, dependencies, decisions, acceptance/verification, and change history.
