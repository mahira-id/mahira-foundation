---
inclusion: always
---
# Mahira — Product Context

## Product identity

Mahira is being developed as a research, publication, and learning platform. The working project/repository name is `mahira-foundation`; the legal organization name and final brand/legal naming must not be inferred from the repository slug.

## Product thesis

Publication is the primary product value. The platform should help the public discover, understand, and access organizational research. Learning resources broaden the knowledge offering. User accounts and future subscription capabilities deepen the relationship with readers while publication metadata remains discoverable according to the approved access policy.

## Product domains

1. **Public publication experience** — home, publication index, publication detail, discovery/search, topics (public Indonesian label "Bidang Kerja"; Desk and Tag are not in MVP, DEC-003), about, SEO and social sharing.
2. **Editorial management** — staff-operated content creation, metadata, authors, taxonomy, assets, localization, and the minimum draft → publish/unpublish workflow (DEC-015). Staff roles are Editor and Admin only (DEC-009, DEC-016).
3. **Public user account and access** — public identity, profile, access state, and entitlement. Registration, login, reset, email verification, and access to `registered` files are required before launch (M5); subscriber entitlement and payment are post-launch (M7) (DECISIONS §2.8).
4. **Learning Hub** — required at launch (DEC-014, launch scope only): catalog by theme, YouTube video/playlist embeds, guides, and publicly downloadable toolkits; no login, progress tracking, quizzes, or certificates. Content model, routes, and toolkit storage stay OPEN until M3-11.

## Audience and access principles

- Anonymous visitors can discover public metadata and content.
- Registration is not equivalent to subscription.
- A successful login does not grant unrestricted access.
- A subscriber's access depends on valid, applicable entitlement.
- Staff identity and public-user identity are distinct unless an accepted ADR explicitly changes that boundary.
- Metadata visibility and downloadable asset access are separate decisions.

## Product design principles

- Publication-first; content is the primary visual evidence of value.
- Editorial/institutional public experience; task-oriented product interface for account and internal operations.
- Bilingual readiness (Indonesian and English) is a baseline requirement; the storage and fallback model must follow accepted decisions.
- Do not invent organizational statistics, publications, authors, affiliations, or claims.
- Use the existing Mahira identity and assets; do not copy CIPS or CELIOS brand assets or visual identity.

## Source of truth

Read the core context before proposing product behavior:

#[[file:docs/CORE/PRD.md]]
#[[file:docs/CORE/PDD.md]]
#[[file:docs/CORE/SRS.md]]

For current phase, status, and blockers read `docs/MILESTONES.md`; for finished work and its evidence read `docs/CHANGELOG.md`. For detailed architecture, decisions, and implementation specs, consult the corresponding `docs/` files when present. AI chat exports, brainstorming boards, and external references provide context, not approved requirements by themselves.

## Scope discipline

- Do not silently decide MVP boundaries, subscription terms, taxonomy, review workflow, localization model, or staff access policy.
- Mark unknowns as `OPEN` or `TBD`; propose options and affected decisions.
- Keep subscription entitlement and payment integration out of the launch scope (post-launch, M7) unless the Product Owner explicitly changes scope and updates PRD/SRS.
- A feature is not complete merely because the code compiles; it must satisfy approved acceptance criteria and the relevant tests.
