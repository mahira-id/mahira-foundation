# Requirements Traceability Matrix

**ID:** ENG-TRACE-001 · **Status:** Initial mapping · **Version:** 0.1.0

## 1. Purpose

Memetakan kebutuhan PRD/SRS ke spesifikasi, implementasi, dan test. Mapping berikut adalah kerangka awal berbasis requirement yang terlihat pada dokumen baseline; owner, commit, test IDs, dan release mapping perlu diisi selama development.

## 2. Traceability table

| Source requirement | Summary | Spec / decision | Implementation domain | Verification | Release |
|---|---|---|---|---|---|
| PRD §6.1 / SRS FR-001 | Locale routes ID/EN | IA-ROUTING-I18N; ADR-0004/0005 | Next routing, Payload localization | LOC-01.. | MVP gate |
| SRS FR-002 | Homepage | PAGE-SPEC homepage; PDD; DECISIONS §2.7 (M3-04), §2.11 P10 (M3-05) | site/home (`app/(site)/page.tsx`, `lib/cms/homepage-query.ts`, `lib/home/homepage-view.ts`, `lib/cms/public-content.ts` `getHomepageData`; tautan detail: `components/home/publication-lead.tsx`, `components/home/latest-publications.tsx`) | `tests/unit/homepage.test.ts` H1–H8; `tests/build/env-gate-http.test.ts` G1/G7/G8; `tests/integration/homepage.test.ts` HP1–HP7 (M3-04), HP8–HP9 (urutan inisialisasi Payload, TEST-PLAN §12.5), HP10 (tautan detail, M3-05); Learning Hub entry point M3-12 | MVP |
| SRS FR-003 | Publication listing | CONTENT-ARCH, DATA-MODEL, PAGE-SPEC §3; IA-ROUTING-I18N §7; DECISIONS §2.11 P1–P4, P15 (M3-05) | publications (`app/[locale]/publications/page.tsx`, `lib/publications/index-params.ts`, `lib/publications/index-view.ts`, `lib/cms/publication-index-query.ts`, `lib/cms/public-content.ts` `getPublicationIndex`, `components/publication/publication-list.tsx`, `components/publication/index-pagination.tsx`); search M3-06 | `tests/unit/publication-index.test.ts` IXU1–IXU12; `tests/integration/publication-index.test.ts` IX1–IX10; `tests/integration/locale.test.ts` L1–L2, Q1–Q3; `tests/integration/workflow.test.ts` W1–W8; gerbang G5.1/G5.2, G6 (M3-05) | MVP |
| SRS FR-004 | Publication detail | PAGE-SPEC §4, SEO-SPEC; DECISIONS §2.11 P7, P8, P15 + amandemen (M3-05) | publications (`app/[locale]/publications/[slug]/page.tsx`, `app/[locale]/publications/[slug]/error.tsx`, `lib/publications/detail-view.ts`, `lib/cms/publication-detail-query.ts`, `lib/cms/public-content.ts` `getPublicationDetail`, `components/publication/publication-detail.tsx`, `components/publication/publication-error-state.tsx`, `components/site/locale-header.tsx`; halaman not-found Mahira M3-05b `app/[locale]/not-found.tsx`); canonical/hreflang/OG M3-07; panel unduhan M3-08 | `tests/unit/publication-detail.test.ts` DTU1–DTU5; `tests/integration/publication-detail.test.ts` DT1–DT10; `tests/integration/locale.test.ts` R1.6; gerbang G5.3/G5.4, G6.3/G6.4 (M3-05); not-found Mahira (M3-05b): DT2, DT7, R1.6, PV6, G6.3/G6.4 lewat `notFoundPageProblems` | MVP |
| SRS FR-005 | Taxonomy | CONTENT-ARCH, DATA-MODEL; DECISIONS §2.11 P1, P5, P6 (M3-05: filter Jenis/Bidang kerja/Tahun; route jenis/topik ditunda) | taxonomy (`components/publication/index-filters.tsx`, `lib/publications/index-view.ts` `buildFacets`/`resolveFilters`) | `tests/unit/publication-index.test.ts` IXU5–IXU8; `tests/integration/publication-index.test.ts` IX3–IX5 | MVP |
| SRS FR-006 | Search | ADR-0007, API-SPEC | search | SEARCH-01.. | MVP |
| SRS FR-007 | SEO metadata | SEO-SPEC, IA | seo/routes | SEO-01.. | MVP |
| SRS FR-008 | Public download | ACCESS-POLICY, INTEGRATION-CONTRACTS | storage/download | FILE-PUB-01.. | MVP |
| SRS FR-009 | Access enforcement | ACCESS-POLICY, ADR-0006 | access/download | ACL-01.. | Pra-launch M5 (`registered`) / Phase 2 M7 (subscriber) |
| SRS FR-010/011 | Registration/sign-in/out | ADR-0003, API-SPEC | auth/account | AUTH-01.. | Pra-launch M5 (DECISIONS §2.8 Q1 A) |
| SRS FR-012 | Account area | PAGE-SPEC, API-SPEC | account | ACCOUNT-01.. | Pra-launch M5 |
| SRS FR-013 | Manual entitlement admin | ACCESS-POLICY, EDITORIAL/ops workflow | entitlement | ENT-01.. | Phase 2 M7 |
| SRS FR-014/015 | Editorial CRUD/workflow | CONTENT-ARCH, EDITORIAL-WORKFLOW §9; DEC-015, DECISIONS §2.6, §2.11 P11 (preview) | Payload (`payload/collections/Publications.ts`, `payload/hooks/live-on-site.ts`, `payload/hooks/refuse-implicit-status-over-pending-draft.ts`); preview M3-05 (`app/api/preview/route.ts`, `app/api/preview/exit/route.ts`, `lib/cms/staff-preview.ts`, `lib/publications/preview.ts`, `components/publication/preview-banner.tsx`; tujuan keluar M3-05b: `previewExitTarget`, `findPublicRef` di `lib/cms/publication-detail-query.ts`) | `tests/integration/workflow.test.ts` W1–W13; `tests/unit/publication-workflow.test.ts` (M3-03); preview M3-05: `tests/unit/preview.test.ts` PVU1–PVU7, `tests/unit/publication-detail.test.ts` DTU6, `tests/unit/roles.test.ts` `staffRoleOfUser`, `tests/integration/preview.test.ts` PV1–PV10, gerbang G3.6/G3.7/G4.4; M3-05b: PVU8–PVU10, PV11–PV12 | MVP |
| SRS FR-016 | Author/topic management | DATA-MODEL | Payload collections | CMS-REL-01.. | MVP |
| SRS FR-017 | Media/file upload | ACCESS-POLICY, INTEGRATION-CONTRACTS | Payload/storage | FILE-UP-01.. | MVP |
| SRS FR-018/019 | Learning catalog/embed | PAGE-SPEC §9, CONTENT-ARCH; DEC-014, DECISIONS §2.8 | learning | LEARN-01.. | Launch, M3-11–M3-13 |
| SRS FR-020 | Static pages | CONTENT-ARCH, EDITORIAL-WORKFLOW | Payload pages | PAGE-CMS-01.. | P1 |
| SRS FR-021 | Event content | Decision register | event | EVENT-01.. | Pasca-launch M6 (DECISIONS §2.8 Q3 A) |
| SRS FR-022–024 | Subscription lifecycle | SUBSCRIPTION-BOUNDARY (later full spec) | billing/entitlement | PAY-01.. | Phase 2 M7 |
| SRS FR-025 | Email | ENVIRONMENTS/API-SPEC | notification | EMAIL-01.. | Pra-launch M5-02 (verifikasi/reset, DEC-019) / Phase 2 (notifikasi transaksi) |
| SRS FR-026 | Download audit | ACCESS-POLICY, privacy inventory | audit | AUDIT-01.. | P1/TBD |
| SRS FR-027 | Bookmark/history | PRD/SRS, DATA-MODEL | account | ENGAGE-01.. | P2 |
| SRS FR-028 | Newsletter | PRD, legal/privacy | integration | NEWS-01.. | Pasca-launch M6 (DECISIONS §2.8 Q3 A) |
| SRS FR-029 | Learning Hub guide and toolkit | PAGE-SPEC §9, DATA-MODEL §4.5; DEC-014, DECISIONS §2.8 | learning, storage/download (toolkit storage OPEN, M3-11) | LEARN-01.. | Launch, M3-11–M3-13 |
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
