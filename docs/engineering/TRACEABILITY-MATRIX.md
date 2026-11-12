# Requirements Traceability Matrix

**ID:** ENG-TRACE-001 · **Status:** Initial mapping · **Version:** 0.1.0

## 1. Purpose

Memetakan kebutuhan PRD/SRS ke spesifikasi, implementasi, dan test. Mapping berikut adalah kerangka awal berbasis requirement yang terlihat pada dokumen baseline; owner, commit, test IDs, dan release mapping perlu diisi selama development.

## 2. Traceability table

| Source requirement | Summary | Spec / decision | Implementation domain | Verification | Release |
|---|---|---|---|---|---|
| PRD §6.1 / SRS FR-001 | Locale routes ID/EN | IA-ROUTING-I18N; ADR-0004/0005 | Next routing, Payload localization | LOC-01.. | MVP gate |
| SRS FR-002 | Homepage | PAGE-SPEC homepage; PDD; DECISIONS §2.7 (M3-04) | site/home (`app/(site)/page.tsx`, `lib/cms/homepage-query.ts`, `lib/home/homepage-view.ts`, `lib/cms/public-content.ts` `getHomepageData`) | `tests/unit/homepage.test.ts` H1–H8; `tests/build/env-gate-http.test.ts` G1/G7/G8; `tests/integration/homepage.test.ts` HP1–HP7 (M3-04); Learning Hub entry point M3-12 | MVP |
| SRS FR-003 | Publication listing | CONTENT-ARCH, DATA-MODEL, PAGE-SPEC | publications/search | PUB-01.. | MVP |
| SRS FR-004 | Publication detail | PAGE-SPEC, SEO-SPEC | publications | PUB-DETAIL-01.. | MVP |
| SRS FR-005 | Taxonomy | CONTENT-ARCH, DATA-MODEL | taxonomy | TAX-01.. | MVP |
| SRS FR-006 | Search | ADR-0007, API-SPEC | search | SEARCH-01.. | MVP |
| SRS FR-007 | SEO metadata | SEO-SPEC, IA | seo/routes | SEO-01.. | MVP |
| SRS FR-008 | Public download | ACCESS-POLICY, INTEGRATION-CONTRACTS | storage/download | FILE-PUB-01.. | MVP |
| SRS FR-009 | Access enforcement | ACCESS-POLICY, ADR-0006 | access/download | ACL-01.. | MVP decision-dependent |
| SRS FR-010/011 | Registration/sign-in/out | ADR-0003, API-SPEC | auth/account | AUTH-01.. | MVP or next slice, resolve PRD conflict |
| SRS FR-012 | Account area | PAGE-SPEC, API-SPEC | account | ACCOUNT-01.. | MVP or next slice |
| SRS FR-013 | Manual entitlement admin | ACCESS-POLICY, EDITORIAL/ops workflow | entitlement | ENT-01.. | MVP or next slice |
| SRS FR-014/015 | Editorial CRUD/workflow | CONTENT-ARCH, EDITORIAL-WORKFLOW §9; DEC-015, DECISIONS §2.6 | Payload (`payload/collections/Publications.ts`, `payload/hooks/live-on-site.ts`, `payload/hooks/refuse-implicit-status-over-pending-draft.ts`) | `tests/integration/workflow.test.ts` W1–W13; `tests/unit/publication-workflow.test.ts` (M3-03); preview M3-05 | MVP |
| SRS FR-016 | Author/topic management | DATA-MODEL | Payload collections | CMS-REL-01.. | MVP |
| SRS FR-017 | Media/file upload | ACCESS-POLICY, INTEGRATION-CONTRACTS | Payload/storage | FILE-UP-01.. | MVP |
| SRS FR-018/019 | Learning catalog/embed | PAGE-SPEC, CONTENT-ARCH | learning | LEARN-01.. | P1 |
| SRS FR-020 | Static pages | CONTENT-ARCH, EDITORIAL-WORKFLOW | Payload pages | PAGE-CMS-01.. | P1 |
| SRS FR-021 | Event content | Decision register | event | EVENT-01.. | P2/TBD |
| SRS FR-022–024 | Subscription lifecycle | SUBSCRIPTION-BOUNDARY (later full spec) | billing/entitlement | PAY-01.. | Phase 2 |
| SRS FR-025 | Email | ENVIRONMENTS/API-SPEC | notification | EMAIL-01.. | Phase TBD |
| SRS FR-026 | Download audit | ACCESS-POLICY, privacy inventory | audit | AUDIT-01.. | P1/TBD |
| SRS FR-027 | Bookmark/history | PRD/SRS, DATA-MODEL | account | ENGAGE-01.. | P2 |
| SRS FR-028 | Newsletter | PRD, legal/privacy | integration | NEWS-01.. | P2 |
| SRS NFR-001..014 | Quality attributes | TEST-PLAN, ENVIRONMENTS, SEO, DESIGN | cross-cutting | NFR-01.. | Release gates |

## 3. ID convention for test cases

Recommended prefixes: `PUB`, `TAX`, `SEARCH`, `SEO`, `LOC`, `AUTH`, `ACL`, `ENT`, `FILE`, `CMS`, `LEARN`, `ACCOUNT`, `OPS`, `A11Y`, `PERF`, `REC`. Example: `ACL-004` = subscriber entitlement expired, access denied.

## 4. Change impact procedure

When a requirement changes:
1. Update source document or create a decision/change record.
2. Identify linked ADR and architecture specs.
3. Identify affected data fields, migrations, route/API contracts, UI page specs, and tests.
4. Classify migration/security/SEO impact.
5. Update this matrix and STATUS.md.
6. Implement change with focused PR and regression evidence.

## 5. Completion fields to add during delivery

For each row or issue, add: owner, phase/sprint, implementation path, pull request, test IDs, result, date, and deferred rationale. Do not mark a requirement complete based only on code existing; it must pass acceptance criteria in target environment.
