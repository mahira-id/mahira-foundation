# Decision Register

**Status:** Register in use. Eight decisions are Accepted (DEC-001, DEC-002, DEC-003 structure only, DEC-004, DEC-005, DEC-015, DEC-016, DEC-021), approved by Haidar (Product Owner) on 2026-11-08; their records are in §2.1. DEC-009 and DEC-018 were Accepted on 2026-11-09; DEC-006, DEC-007, and DEC-013 on 2026-11-10 (§2.1). DEC-014 was Accepted on 2026-11-12 for the launch scope only; its details stay Open (§2.1, §2.8). Every other row keeps its earlier status.  
**Canonical IDs:** `DEC-NNN`. Historical PRD `D-xx` and SRS `T-xx` are retained for traceability.  
**Last updated:** 2026-11-14 (M3-05 close-out: the DEC-005 record points to the detail not-found status of §2.11, amendment P7 A; the §2.11 code line lists every M3-05 commit and points to MILESTONES/CHANGELOG [M3-05]; no status change). Earlier: 2026-11-13 (Owner answers for M3-05 recorded in §2.11, including the amendment of P7 A/P15 A and the temporary deviation from PRD §8 until M5; pointers in §2.4 P6, §2.6 P2, §2.7 P4c/P5 and the DEC-005 record; no status change). Earlier the same day: 2026-11-13 (Owner answers for item 1c, admin login loop, recorded in §2.10 with the proven explanation in §2.4 P2 A; DEC-006 fourth upgrade review trigger for the hand-edited admin `page.tsx` and the `proxy.ts` login assumptions; no status change). Earlier the same day: 2026-11-13 (Owner answers for item 1b, Preview database connections, recorded in §2.9; DEC-006 third upgrade review trigger for the `db.init` wrapper in `payload/payload.config.ts`; no status change). Earlier the same day: 2026-11-13 (DEC-006 upgrade review trigger: `serverExternalPackages: ["payload"]` in `next.config.ts`, Owner-approved 2026-11-12; no status change). Earlier: 2026-11-12 (Owner direction: Learning Hub and public accounts before launch, recorded in §2.8; DEC-014 Accepted for the launch scope only; DEC-002 status unchanged). Earlier the same day: 2026-11-12 (Owner answers for M3-04 recorded in §2.7; no status change). Earlier the same day: 2026-11-12 (Owner answers for M3-03 recorded in §2.6; no status change). Earlier the same day: 2026-11-12 (§2.5 folder check dated 2026-11-12; dates aligned with M3-10 review finding 4; no status change). Earlier: 2026-11-11 (Owner answers for M3-10 recorded in §2.5; no status change). Earlier the same day: 2026-11-11 (review M3-02 fixes: DEC-005 "Still open" pointer to §2.4 P4c; DEC-006 upgrade review trigger; no status change). Earlier: 2026-11-10 (Owner answers for M3-02/M3-01 recorded in §2.4; no status change). Earlier the same day: DEC-006, DEC-007, DEC-013 Accepted; DEC-004/005 evidence and DEC-018 Node pin recorded (§2.1); M2 spike evidence proposal §2.3. Earlier: 2026-11-08 (columns Approver and Decided added, PUB-DU-14 of spec `01-publication-platform-foundation`; Owner decisions recorded from the 2026-11-08 session, see `.kiro/specs/03-architecture-technical-validation/PROTOTYPE-PLAN.md` §1–§2).

## 1. How to use this register

- Register every decision that constrains architecture, product scope, security, data, operations, or user experience.
- `Open` means no decision exists. `Proposed` means a recommended direction exists but requires approval or evidence. `Accepted` means the named owner has approved it. `Superseded` means a newer decision replaces it.
- Each decision must state owner, approver, date, options, rationale, trade-offs, impacts, and verification/evidence.
- Use ADR for cross-cutting technical decisions with meaningful long-term consequences. Small implementation choices can be recorded here or in engineering conventions.
- Never use an accepted technical ADR to silently change business scope. Update PRD/SRS with the Product Owner.
- The "Initial position" column keeps the position held before a decision. For an Accepted row, the decided value is in its §2.1 record, not in that column.

## 2. Decision register

| ID | Decision area | Related legacy IDs | Initial position | Status | Blocks / affected artifacts | Owner / approver | Approver | Decided |
|---|---|---|---|---|---|---|---|---|
| DEC-001 | Organization, product, repository and domain naming | PRD D-01 | Confirm separate legal name, public brand, working title, repo slug, primary domain. | Accepted (public brand name and canonical host; see §2.1) | Branding, SEO, legal pages, metadata | PO / organization lead | Haidar (Product Owner) | 2026-11-08 |
| DEC-002 | MVP boundary and release acceptance | PRD §7/§13; SRS FR priorities / §14 | Resolve publication-only vs publication + public auth + manual entitlement. | Accepted (publication-only MVP; see §2.1) | Roadmap, FR priorities, estimates, QA | PO | Haidar (Product Owner) | 2026-11-08 |
| DEC-003 | Research taxonomy | PRD D-02 | Model Desk, Topic, Publication Type, Tag as distinct concepts until editorial validation. | Accepted (structure only; taxonomy values stay Open; see §2.1) | Content architecture, data model, IA, filters | Editorial Lead / PO | Haidar (Product Owner) | 2026-11-08 |
| DEC-004 | Localization storage model | PRD D-03; SRS T-02 | Compare Payload field localization vs linked translation records using editorial and URL requirements. | Accepted (Option C hybrid; validated by M2 spike, check 4 partial; see §2.1) | Publication, author/topic schema, search, routing | PO + Engineering | Haidar (Product Owner) | 2026-11-08 |
| DEC-005 | Public URL and slug policy | SRS T-02 | Use locale-prefixed routes; define locale-specific slug uniqueness and redirects before content migration. | Accepted (slug per locale validated by M2 spike; route rules tested in M3; see §2.1) | IA, SEO, migrations | Engineering + SEO owner | Haidar (Product Owner) | 2026-11-08 |
| DEC-006 | CMS selection and application topology | PRD D-09; SRS T-01 | Payload CMS 3 embedded in the Next.js application remains the baseline candidate; prove via spike. | Accepted (Payload 3 embedded, one Next.js app; see §2.1) | Admin, collection design, deployment | Engineering + PO | Haidar (Product Owner) | 2026-11-10 |
| DEC-007 | Database schema ownership and migration | SRS T-01 | Payload owns CMS collections; application schema owner/migration process must be explicit; no shared ad-hoc migrations. | Accepted (separate CMS project, committed Payload migrations; see §2.1) | All schema, backup, access, deployment | Engineering | Haidar (Product Owner) | 2026-11-10 |
| DEC-008 | Public and staff identity boundary | PRD §6.4; SRS T-06 | Supabase Auth for public users; Payload staff auth for staff; no implicit role promotion or shared session assumption. | Proposed | Auth, account, admin, access policy | Security owner + PO | — | — |
| DEC-009 | Staff access to exclusive publications | SRS access matrix / T-06 | Deny-by-default; define whether staff use separate public account or an audited staff grant. | Accepted (roles: Public user, Editor, Admin; see §2.1) | Access evaluator, audit, tests | PO + Security owner | Haidar (Product Owner) | 2026-11-09 |
| DEC-010 | Authorization and entitlement model | PRD D-06; SRS §4 | Server-side authorization; explicit entitlement; RLS for app-user data; Payload access control for CMS. | Proposed | Access policy, APIs, storage, tests | Security owner | — | — |
| DEC-011 | Publication-level vs asset-level access | PRD §8; SRS Publication model | Preserve publication `access_level`; evaluate per-asset override with effective access as the stricter of inherited and asset rules. | Proposed — needs approval | Asset schema, CMS, storage, access tests | PO + Engineering | — | — |
| DEC-012 | File storage and private delivery | SRS T-03 | Object storage; public files only in public locations; exclusive files private and served after server authorization. Validate Payload adapter. | Proposed | Upload, download, backup, provider cost | Engineering + Security | — | — |
| DEC-013 | Search scope and engine | PRD §9; SRS T-04 | Start with PostgreSQL FTS; `pg_trgm` only where tests justify; PDF full text remains out until extraction spike. | Accepted (start with PostgreSQL FTS; see §2.1) | Search schema, indexing, UX | Engineering + PO | Haidar (Product Owner) | 2026-11-10 |
| DEC-014 | Learning Hub MVP scope | PRD D-04 | Catalog + external embeds as baseline; no LMS progress, certificates, or assessments unless approved. | Accepted (launch scope only; content model, routes, toolkit storage stay Open; see §2.1) | Scope, schema, page specs | PO / Learning Lead | Haidar (Product Owner) | 2026-11-12 |
| DEC-015 | Editorial workflow | PRD D-05 | Define draft, review, approval, schedule, publish, unpublish, revise, archive and responsibility. | Accepted (minimum workflow; see §2.1) | Payload workflow, role, content guide | Editorial Lead | Haidar (Product Owner) | 2026-11-08 |
| DEC-016 | Staff roles and operational admin scope | PRD D-07; SRS T-07 | Minimum Admin and Editor; Reviewer/Finance only if workflow justifies. Separate editorial and entitlement permissions. | Accepted (Admin and Editor; both may publish; see §2.1) | CMS access, dashboard routes | PO + Security owner | Haidar (Product Owner) | 2026-11-08 |
| DEC-017 | Hosting platform and database region | PRD D-10; SRS T-08 | Vercel + Supabase is the baseline proposal; confirm region, commercial plan, cost, backup, and runtime compatibility. | Proposed | Deployment, latency, budget, operations | PO + Engineering | — | — |
| DEC-018 | Package manager and runtime | Repository has `bun.lock`; Claude discussion | Determine whether Bun is package manager only or runtime too; pin versions and validate CI/deploy compatibility. | Accepted (Bun = package manager, Node.js = runtime; see §2.1) | Local setup, CI, deployment | Engineering | Haidar (Product Owner) | 2026-11-09 |
| DEC-019 | Email delivery | SRS T-09 | Select transactional email provider after sender-domain and deliverability requirements are known. | Open | Auth verification, reset, notifications | Engineering + Operations | — | — |
| DEC-020 | Privacy, retention, and legal basis | PRD risk §11; SRS T-10 | Inventory personal data and processing purposes now; legal interpretation requires qualified review. | Open — high | Signup, logs, analytics, legal copy | Organization + legal advisor | — | — |
| DEC-021 | SEO and publication discoverability policy | SRS FR-007 / NFR-001 | Public metadata is indexable; account/admin noindex; decide treatment of gated body and structured data per page type. | Accepted (see §2.1) | Routing, pages, canonical, sitemap | SEO owner + PO | Haidar (Product Owner) | 2026-11-08 |
| DEC-022 | Observability and analytics | SRS NFR-010 / PRD KPI | Separate operational telemetry from product analytics; minimize personal data. | Open | Monitoring, event schema, privacy | Engineering + PO | — | — |
| DEC-023 | Backup, recovery, and retention targets | SRS NFR-011 | Define RPO/RTO and restore evidence before production; provider defaults are not acceptance criteria. | Open | Ops, cost, launch gate | Engineering + PO | — | — |
| DEC-024 | Design-token source of truth | PDD §14 | `app/globals.css` is proposed runtime canonical if confirmed by implementation; docs describe, not duplicate runtime values. | Proposed | UI implementation, PDD updates | Design/Frontend Lead | — | — |

### 2.1 Records of Accepted decisions

Common fields for every record below:

- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Created / decided:** 2026-11-08, Owner chat session (answers recorded in `.kiro/specs/03-architecture-technical-validation/PROTOTYPE-PLAN.md` §1–§2; spec 03 stage S0 records them again in its `evidence/OWNER-GATES.md`). The session agent first proposed the date 2026-11-07; the session date 2026-11-08 is used. The Owner may correct it.
- **Decision owner:** Product Owner. The "Owner / approver" column in §2 still names the owners proposed earlier (Editorial Lead, SEO owner, Security owner); none of those roles is named yet, so the Product Owner approved in their place.
- **Context, options, and rationale:** see the related ADR (ADR-0004, ADR-0005) and the spec 01 and spec 03 documents named per record. This register does not copy them.
- **Out of scope of these records:** DEC-006, DEC-007, DEC-018 and every other row stay as they are. Production implementation still waits for DEC-006, DEC-007, and DEC-018 (spec 01 Implementation_Gates).

#### DEC-001 — Organization, product, repository and domain naming

- **Decision:** Canonical host `https://mahira.id`. The name "Mahira Indonesia Development" is used in page titles and in `og:site_name`.
- **Not decided by this record:** the legal organization name, and whether the repository slug `mahira-foundation` changes.
- **Affected documents:** spec 01 requirements (Canonical_Host, metadata criteria); PRD document control and title block ("nama kerja, perlu konfirmasi").
- **Validation evidence:** not needed (naming decision).
- **Review trigger:** a change of legal name, public brand, or primary domain.

#### DEC-002 — MVP boundary and release acceptance

- **Decision:** Publication-only MVP. Publications whose Access_Level is `registered` or `subscriber` are held until MVP+; no metadata-only pages are published for them. Restricted assets of public publications are shown locked, without a URL. Public registration, sign-in, account area, manual entitlement, and registered or subscriber downloads move to MVP+. Payment stays in Phase 2.
- **Consequences:** PRD §13 AC 5–6 and SRS FR-009 to FR-013 conflict with this decision until they are reconciled. The reconciliation is proposed in `.kiro/specs/01-publication-platform-foundation/PUB-DU-02-PROPOSAL.md` and is not applied.
- **Affected documents:** PRD §7, §13; SRS FR-009 to FR-013 and §14; `docs/architecture/` subscription-boundary text; homepage copy that promises account or subscription access (spec 00 Sample_Content_Decision).
- **Validation evidence:** not needed (scope decision).
- **Review trigger:** the Owner changes MVP scope, or the MVP+ gate (public auth, entitlement) is planned.
- **Dampak arahan 2026-11-12:** §2.8 (MVP+ → M5 untuk `registered`, M7 untuk `subscriber`; status tidak berubah).

#### DEC-003 — Research taxonomy (structure only)

- **Decision:** Two axes. Publication_Type: exactly one per publication, required. Topic: one or more, ordered; the first is primary. Desk, Tag, and Category are not in MVP; each needs its own decision with evidence.
- **Not decided:** the taxonomy values. They stay Open until an Editorial Lead exists and tests them against real publications. Only labelled fixture values may be used in development and spike work.
- **Affected documents:** CONTENT-ARCHITECTURE, DATA-MODEL §4.4, ERD (they still model four axes); spec 01 PUB-004.
- **Validation evidence:** not needed for the structure; the values need the editorial workshop.
- **Review trigger:** an Editorial Lead is named, the value workshop runs, or a request for Desk, Tag, or Category appears.

#### DEC-004 — Localization storage model

- **Decision:** Option C hybrid. One publication record per language, linked by a Translation_Group. No content fallback: a missing translation means no page in that language. Shared fields (Access_Level, Publication_Type, Topics, Authors) are enforced on the server on every save and publish path. Taxonomy terms and Authors use field localization with fallback off. Content rules of Part 1 (locales `id` and `en`, independent publication dates, translators as per-language contributors, no unreviewed machine translation) are part of this decision.
- **Validation evidence:** pending the Spike A prototype of spec `03-architecture-technical-validation` (design Revision 3 §22). Until that evidence exists, this acceptance rests on the Owner's decision only.
- **Affected documents:** ADR-0004 (Accepted on the same date); spec 01 PUB-009, PUB-010, PUB-011; DATA-MODEL; search design (DEC-013).
- **Review trigger:** the Spike A prototype result. If any localization check fails, the Owner reviews this decision before production schema work.

#### DEC-005 — Public URL and slug policy

- **Decision:** Locale prefixes `/id` and `/en`. `/` stays the homepage with no redirect. Publication slugs are unique per locale. Old slugs redirect with HTTP 308 in one hop. URLs have no trailing slash; the trailing-slash variant redirects with 308. Upper-case variants return 404. Bare `/id` and `/en` return 404. Without an eligible counterpart, the language switcher leads to the other locale's publication index. The publication routes are `/{locale}/publications` and `/{locale}/publications/{slug}`.
- **Still open (not decided by this record):** the default locale as a named setting (jawaban Owner: §2.4 P4c), the search URL pattern (DEC-013), taxonomy and other route segments (topics, publication types, learning hub, about, account), and query-string canonicalization beyond the `noindex` rule of DEC-021. ADR-0005 lists them.
- **Validation evidence:** pending the Spike A prototype of spec `03-architecture-technical-validation` (design Revision 3 §22). 308 slug lama: M3-07 (§2.11 P9). Detail slugs since M3-05: upper-case, unknown, and ineligible slugs get `notFound()` = HTTP 200 + `noindex`, not 404 (§2.11, amandemen P7 A); a real 404 for crawlers is an open M3-07 item.
- **Affected documents:** ADR-0005 (Accepted on the same date); spec 01 PUB-009, PUB-010, PUB-017; IA and routing documents under `docs/`.
- **Review trigger:** the Spike A prototype result, or the information-architecture review of the remaining route segments.

#### DEC-015 — Editorial workflow

- **Decision:** Minimum workflow draft → published → unpublished. Archived and withdrawn states are non-public. No review step and no scheduling in MVP.
- **Affected documents:** spec 01 PUB-014; Payload workflow design.
- **Validation evidence:** not needed (process decision); the prototype exercises the workflow.
- **Review trigger:** an Editorial Lead is named, or a review step or scheduling is requested.

#### DEC-016 — Staff roles and operational admin scope

- **Decision:** Roles Admin and Editor; both may publish. One role per staff user. Taxonomy terms are managed by Admin only. Access_Level and asset classification may be changed by Admin and Editor. Deleting a language version that was ever published is Admin only. Contribution roles: Penulis/Author, Penyunting/Editor, Kontributor/Contributor; no institutional authors.
- **Affected documents:** spec 01 PUB-011, PUB-013; ADR-0003 (staff side).
- **Validation evidence:** Spike B staff-side checks of spec 03 (not yet run).
- **Review trigger:** a Reviewer or Finance role is requested, or DEC-009 is decided.

#### DEC-021 — SEO and publication discoverability policy

- **Decision:** Self-referencing canonical. `hreflang` is emitted only when the language counterpart is eligible for public display. Search and filter pages are `noindex`.
- **Affected documents:** spec 01 PUB-006, PUB-017; ADR-0005.
- **Validation evidence:** not needed (policy decision); the prototype exercises it.
- **Review trigger:** a structured-data decision (spec 01 PUB-OQ-39), or MVP+ restricted publications (since §2.8: `registered` in M5, `subscriber` in M7).

#### DEC-005 addendum — Search and type routes (2026-11-09)

- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-09, Owner chat session.
- **Decision:** search uses query state on the publication index, `/{locale}/publications?q=...` (`noindex`, DEC-021). Publication type pages use `/{locale}/publications/type/{slug}`. `/{locale}/search`, `/{locale}/publication-types/{slug}`, and Desk routes are not used.
- **Affected documents:** ADR-0005, IA-ROUTING-I18N, PAGE-SPECIFICATIONS §5, API-SPECIFICATION §6 (updated 2026-11-09).

#### DEC-009 — Staff access to exclusive publications

- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-09, Owner chat session.
- **Decision (Owner's words, summarized):** only three roles are needed: Public user, Editor, Admin. No separate "staff" role, staff grant, Reviewer, or Finance role. In the documents, "staf" only means Editor and Admin together.
- **Recorded interpretation (Owner may correct):** an Editor or Admin CMS session gives no bypass on the public download endpoint; that endpoint checks only the public user's entitlement (ACCESS-POLICY §6, deny by default). Editor and Admin handle assets inside the CMS under Payload access control; details in M5 (DEC-010, DEC-011). This replaces the SRS §4.1/§12.1 rule that let Admin download with an expired entitlement.
- **Affected documents:** SRS §3 actors (updated), §4.1, §12.1; TEST-PLAN §4; ACCESS-POLICY §6.
- **Review trigger:** a need for staff preview of exclusive files on the public site.

#### DEC-018 — Package manager and runtime

- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-09, Owner chat session ("sesuai rekomendasi dan best-practices").
- **Decision:** Bun (`packageManager: bun@1.3.14`, `bun.lock`) is the package manager only. Node.js is the runtime for build, CI, and production. Bun is not used as the production runtime.
- **Evidence:** `next.config.ts` enables `cacheComponents`; the installed Next.js doc `cacheComponents.md` states it requires the Node.js runtime.
- **Node.js pin (approved 2026-11-10):** `engines.node` `26.x` (spike commit `17fdf0c`, SPIKE-001 §7.7). The Owner reports the Vercel Node.js Version is set to match; no Vercel build evidence yet (first M3 PR preview).
- **Review trigger:** Next.js or the host officially supports Bun as runtime for the features in use, and the Owner wants to switch.

#### Records approved 2026-11-10 (M2 spike results)

Common fields: **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-10, Owner chat session, approving the recommendations in §2.3. Evidence is in `docs/spikes/SPIKE-001-PAYLOAD-POSTGRES.md` and `SPIKE-003-STORAGE-GATING.md`; code lives on the archived branch `spike/m2-payload-postgres` (pushed, not merged).

- **DEC-006 — CMS selection and application topology.** Payload CMS 3 (3.93.0 tested) embedded in the single Next.js 16.4.4 application. *Not decided:* how to handle the `cacheComponents` log noise in the admin (SPIKE-001 §8); resolve in M3-02 (jawaban Owner: §2.4 P2). *Upgrade review trigger (recorded 2026-11-11, review M3-02 finding 4; not a status change):* the DEC-004 row lock in `payload/db/lock-translation-group.ts` reads an internal structure of `@payloadcms/drizzle` (`adapter.sessions[transactionID].db`). On every Payload upgrade the race check must be rerun and pass (ENG-ENV-001 §3.1). *Second upgrade review trigger (recorded 2026-11-13; Owner approved the config change 2026-11-12, "kerjakan butir 1"; not a status change):* `next.config.ts` sets `serverExternalPackages: ["payload"]` so pages, `/admin`, and the REST routes share one copy of `payload` in production builds; `withPayload` 3.93.0 externalizes `payload` only in dev. On every Payload or Next upgrade, re-check whether the setting is still needed or needs more packages, and rerun HP8/HP9 (`bun run test:integration --only homepage`) until they pass (ENG-ENV-001 §3.1, TEST-PLAN §12.5, §12.7). *Third upgrade review trigger (recorded 2026-11-13; Owner answer 3 a for item 1b, §2.9; not a status change):* `payload/payload.config.ts` wraps the adapter's `db.init` (`handleInitFailure`, commit `311683f`) and attaches a handler to the internal `initializing` promise of `@payloadcms/db-postgres` 3.93.0, which the adapter rejects when the connect in `payload.init` fails and which nothing else awaits during init. On every Payload upgrade, check in `node_modules/@payloadcms/db-postgres/dist/connect.js` and `dist/index.js` that `initializing` still exists and is still rejected on a failed connect, and rerun `bun run test` until DB1/DB2 in `tests/unit/db-connection.test.ts` pass (ENG-ENV-001 §3.1, TEST-PLAN §12.7). *Fourth upgrade review trigger (recorded 2026-11-13; Owner answer 1 A for item 1c and the orchestrator addition, §2.10; not a status change):* (1) `app/(payload)/admin/[[...segments]]/page.tsx` is generated by Payload and marked "DO NOT MODIFY"; it now awaits `connection()` before `RootPage` (commit `a5321de`). If the file is regenerated or replaced on a Payload upgrade, re-apply the edit. (2) `proxy.ts` assumes Payload's auth cookie is `payload-token` (`cookiePrefix` default `payload`; `payload/payload.config.ts` does not set it) and repeats Payload's public admin route list (`isPublicAdminRoute` in `@payloadcms/next/dist/utilities/isPublicAdminRoute.js`, default `admin.routes`). On every Payload upgrade, check both; on every Payload or Next upgrade, rerun `bun run test` (PX1–PX6 in `tests/unit/proxy.test.ts`) and `bun run test:integration --only admin` (AD1–AD7) until they pass, and repeat the browser login check (ENG-ENV-001 §3.1, TEST-PLAN §12.7). On a Next upgrade, also check whether [vercel/next.js#92767](https://github.com/vercel/next.js/issues/92767) is fixed.
- **DEC-007 — Database schema ownership and migration.** Separate Supabase projects: `mahira-cms` holds only Payload's Postgres schema; `mahira.id` holds Auth, Storage, and app tables (§2.2). The CMS schema changes only through committed Payload migrations (`push: false`); every `up()` enables RLS on new tables; every `down()` is reviewed; CI checks `migrate:status`; `migrate:reset` and `migrate:fresh` are never run against shared or production databases. App-schema migration tooling for `mahira.id` is decided when M5 adds app tables. *Consequence:* ADR-0002's single-database text is superseded by this record.
- **DEC-013 — Search scope and engine.** Start with PostgreSQL full-text search using the `indonesian` text-search configuration (present on Supabase; stemming works, stop words do not). `pg_trgm` only where tests justify it. Relevance is tested in M3-06.
- **DEC-004 and DEC-005 — validation evidence added.** DEC-004: checks 1–3 and 5–7 PASS, check 4 PARTIAL (a client can force fallback with `?fallback-locale=` on REST; fix in M3) (REST anonim ditutup: §2.4 P1). DEC-005: per-locale slug uniqueness proven by index `locale_slug_idx`; route rules (308, 404, trailing slash, `/id`/`/en`) are tested in M3-01/M3-07. Both stay Accepted.
- **DEC-012** is unchanged (Proposed): the public part is proven; private delivery waits for M5-04.

#### DEC-014 — Learning Hub launch scope (2026-11-12)

- **Status:** Accepted for the launch scope only. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-12, Owner chat session, relayed by the orchestrator (Q2 A in §2.8).
- **Decision (Q2 A):** the Learning Hub is required at launch. Launch scope: a catalog grouped by theme, embedded YouTube videos and playlists, guides, and toolkits that anyone can download. No login, progress tracking, quizzes, or certificates.
- **Still open (not decided by this record; decided at the start of M3-11):** the content model and resource types; the relation to Topic ("Bidang kerja"); the bilingual model; the routes (the "learning hub" item in DEC-005 "Still open"); toolkit file storage (public part of DEC-012); and whether resources get a detail page or are embedded directly in the catalog.
- **Reference:** https://www.cips-indonesia.org/cips-learning-hub, for structure only. Its identity and assets are not copied.
- **Affected documents:** PRD §6.2, §7, §10, §12 D-04, §13 AC 9; SRS FR-018, FR-019, FR-029, §5.1, §13, §14; CONTENT-ARCHITECTURE; DATA-MODEL §4.5; PAGE-SPECIFICATIONS §9; IA-ROUTING-I18N §3.1; TEST-PLAN §3; TRACEABILITY-MATRIX; RELEASE-CHECKLIST §1; MILESTONES M3-11 to M3-13.
- **Validation evidence:** not needed (scope decision); M3-12 and M3-13 test the launch scope (PRD §13 AC 9).
- **Review trigger:** a Learning Lead is named, or a request appears for login, progress tracking, quizzes, or certificates.

### 2.2 Spike environment for DEC-007 (not a decision)

Recorded 2026-11-09 from the Owner; project facts read through the Supabase Management API (Composio account alias `mahira-id`, organization "Mahira Dev"). DEC-007 stays Open until Spike A (SPIKE-001) gives evidence.

| Role | Project name | Ref | Region | Postgres |
|---|---|---|---|---|
| CMS (Payload Postgres only) | `mahira-cms` | `qnfzzymrceoubowfknvl` | `eu-west-1` | 17 |
| APP (Auth, Storage, app tables) | `mahira.id` | `dmtbieetvgkvncadbkmd` | `eu-central-1` | 17 |

- The Owner named the APP project "mahira-id"; the API name is `mahira.id`.
- Plan tier was not returned by the API: unknown.
- Both regions are in Europe and differ from each other. Region for production is part of DEC-017 (latency for Indonesian readers) and DEC-020 (data location). These projects are for the spike and may be replaced.

### 2.3 Bukti spike M2 dan rekomendasi (usulan, bukan keputusan)

Dicatat 2026-11-10 dari spike M2 di branch `spike/m2-payload-postgres` (commit `17fdf0c`, `3b1ff83`, `c8b783b`, `c19a774`). Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1. Perubahan status hanya terjadi setelah Haidar (Product Owner) menyetujuinya. **Update 2026-11-10:** Owner menyetujui rekomendasi DEC-004, 005, 006, 007, 013, 018; hasilnya dicatat di §2.1 ("Records approved 2026-11-10"). Tabel di bawah dipertahankan sebagai histori.

| DEC | Status saat ini (tidak berubah) | Bukti | Rekomendasi | Tindakan Owner |
|---|---|---|---|---|
| DEC-004 | Accepted | `spikes/SPIKE-001-PAYLOAD-POSTGRES.md` §7.6 (check 1–3, 5–7 PASS; check 4 PARTIAL) | Tetap Accepted; bukti validasi kini ada. Temuan C4c (`?fallback-locale=` di REST) ditangani di M3 | Setujui pencatatan bukti ke record §2.1; tetapkan bahwa kode publik tidak memakai `fallbackLocale` dan putuskan pembatasan REST publik untuk koleksi terlokalisasi |
| DEC-005 | Accepted | SPIKE-001 §7.3 (index `locale_slug_idx`), §7.6 check 1 dan 5 | Tetap Accepted; slug per locale terbukti. Aturan route (308, 404, trailing slash, `/id`/`/en`) belum diuji → M3-01/M3-07 | Setujui pencatatan bukti; terima bahwa validasi route pindah ke M3 |
| DEC-006 | Proposed | SPIKE-001 §7.1, §7.4, §8 (cacheComponents) | Proposed → siap Accepted bila Owner setuju: Payload 3.93.0 embedded di Next.js 16.4.4, satu aplikasi | Setujui atau tolak; pilih penanganan log `cacheComponents` di admin (biarkan + filter, tunggu fix, atau matikan) |
| DEC-007 | Open — critical | SPIKE-001 §7.2, §7.3, §8 | Usulan: project CMS terpisah; skema `public` CMS hanya lewat migrasi Payload yang di-commit (`push: false`); RLS di setiap `up()`; `down()` direview; CI cek `migrate:status`; tanpa `migrate:reset`/`migrate:fresh`. Siap diputuskan setelah teks ADR-0002 diselaraskan (poin d) | Putuskan model kepemilikan (Opsi 3, DB terpisah, atau lainnya) dan setujui aturan migrasi |
| DEC-012 | Proposed | `spikes/SPIKE-003-STORAGE-GATING.md` §7.2–§7.5 | Tetap Proposed: bagian publik (Supabase Storage via `@payloadcms/storage-s3`, URL publik, tanpa filesystem aplikasi) terbukti; bagian privat (signed URL) menunggu M5-04 | Opsional: catat bagian publik sebagai tervalidasi; putuskan nasib bucket `spike-m2-public` |
| DEC-013 | Proposed | SPIKE-001 §7.6 check 8 | Proposed → siap Accepted untuk arah "mulai dengan PostgreSQL FTS" bila Owner setuju; config `indonesian` ada (stemming jalan, stop word tetap); relevansi diuji di M3-06 | Setujui arah; `pg_trgm` tetap hanya bila tes membenarkan |
| DEC-018 | Accepted | SPIKE-001 §4, §7.4, §7.7 | Tetap Accepted; runtime `node` terbukti lokal; usulan pin `engines.node` `26.x` dan Node lokal ≥ 26.12.1. Bukti di Vercel belum ada (poin a) | Setujui pin `26.x`; set Vercel Project → Settings → Build and Deployment → Node.js Version 26.x |

Poin terbuka untuk Owner:

- (a) **Bukti deploy M2-04:** branch `spike/*` dilewati Ignored Build Step Vercel, jadi tidak ada deploy preview, redeploy, atau versi Node di Vercel. Owner memilih cara memperoleh bukti deploy (mis. izinkan preview untuk satu branch spike, atau buktikan di branch implementasi M3).
- (b) **Region database produksi** (DEC-017/DEC-020): kedua project spike ada di Eropa (`eu-west-1`, `eu-central-1`); latensi spike dari Indonesia tidak mewakili produksi.
- (c) **OG-09 dan sumber spec:** OG-09 tidak pernah dikonfirmasi, dan `.kiro/specs/03-architecture-technical-validation/` tidak ada di repo, padahal register ini, ADR-0004, dan ADR-0005 merujuknya. Delapan pemeriksaan M2-02 diambil dari brief workshop 2026-11-06.
- (d) **ADR-0002:** teks "Proposed decision" menyebut satu database Supabase, sedangkan catatan Owner memilih Opsi 3 (database terpisah) dan lingkungan spike memakai dua project. Teks ADR belum diubah.

### 2.4 Jawaban Owner 2026-11-10 untuk M3-02 dan M3-01 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-10 atas pertanyaan planner untuk M3-02 dan M3-01: "P1 A, P2 A, P3 B (i), P4a B, P4b (i), P4c (i), P4d setuju, P5 A, P6 A (i), P7 C". Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1.

- **P1 REST/GraphQL publik — A:** REST anonim ditolak (403) di semua koleksi; halaman publik membaca lewat Local API di server, dan Local API tanpa login hanya melihat Publication `_status: published` + `accessLevel: public`; GraphQL tetap mati; login staf lewat `/api/users/login` tetap jalan. Menjawab poin DEC-004 di §2.3 ("putuskan pembatasan REST publik").
- **P2 log `cacheComponents` di admin — A:** tanpa perubahan kode; dicatat sebagai known issue yang ditinjau ulang saat upgrade Payload/Next; Owner menyaring log di Vercel (ENG-ENV-001 §3.1). Menjawab sub-poin DEC-006. *Pembaruan 2026-11-13 (butir 1c, §2.10 jawaban 2 (i); jawaban P2 A tidak berubah):* asal log kini terbukti. `jwtVerify` jose 5.10.0 di strategi JWT Payload memanggil `new Date()`, hanya bila request membawa token. Next menandainya karena `partialPrefetching` menyala, lalu memindahkan sisa render ke tahap Dynamic, sehingga user tetap terautentikasi. Log ini bukan penyebab loop login admin (§2.10).
- **P3 `publishedAt` — B (i):** bila kosong saat dokumen disimpan sebagai published, server mengisinya dengan waktu saat itu (UTC); editor boleh mengubahnya; record lama yang kosong terisi saat disimpan ulang sebagai published.
- **P4a route M3-01 — B:** infrastruktur locale (`id`/`en`, lainnya 404; `/id` dan `/en` 404; huruf besar 404; trailing slash 308; kamus UI; switcher; baca publik tanpa fallback) plus kerangka `/{locale}/publications` (judul published + public di locale itu, tanpa filter, pagination, atau tautan detail; 404 saat CMS mati).
- **P4b switcher di `/` — (i):** `/` tidak berubah (tetap "EN segera" tanpa tautan).
- **P4c default locale — (i):** konstanta `DEFAULT_LOCALE = "id"` hanya untuk `/` dan `defaultLocale` Payload, tanpa redirect. Menjawab butir "Still open" default locale di DEC-005 (ADR-0005, IA-01).
- **P4d segmen lain — setuju:** topics, learning-hub, about, dan account tidak dibuat di M3-01.
- **P5 role akun yang ada — A:** migrasi menjadikan satu-satunya user yang ada Admin; bila ada lebih dari satu user, migrasi berhenti dan Owner ditanya; user baru default Editor; user pertama di database kosong otomatis Admin.
- **P6 field koleksi — A (i):** tambah hanya `role` (Users), `everPublished` (penanda sistem "pernah terbit" untuk aturan hapus DEC-016, tidak bisa diedit), dan `isActive` (Topic, Publication Type; default nonaktif; aktif hanya bila nama ID dan EN terisi; artinya di halaman publik diputuskan di M3-05; arti publik: §2.11 P5). Field DATA-MODEL lain menunggu milestone pemakainya.
- **P7 Data API `mahira-cms` — C:** Owner mematikan Data API di dashboard `mahira-cms`; agen hanya menulis langkahnya (ENG-ENV-001 §3.1); tanpa migrasi `REVOKE`.

### 2.5 Jawaban Owner 2026-11-11 untuk M3-10 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-11 atas pertanyaan planner untuk M3-10 (test framework + tes kritikal): "P1a A, P1b (i), P1c (i), P2 A, P3 B, P4 A, folder (a)". Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1. Rincian tes yang dihasilkan: TEST-PLAN §12.

- **P1a runner unit + integrasi — A:** `node:test` bawaan Node 26 dengan loader `tsx` exact `4.23.15` (versi yang sudah ada di `bun.lock` lewat Payload); ini satu-satunya dev dependency baru. Tanpa Vitest, Jest, atau `bun test`. Tes jalan di Node, sesuai DEC-018; Bun tetap hanya package manager.
- **P1b E2E browser — (i) nanti:** Playwright tidak dipasang di M3-10. Ditambahkan saat ada interaksi browser (M3-05 filter/pagination/URL state, atau M5 login). Sampai saat itu cek dilakukan di level HTTP.
- **P1c Node lokal — (i) upgrade:** Node lokal v26.13.0; `engines.node` tetap `26.x`. Exit code libuv (SPIKE-001 §8) diuji ulang di v26.13.0: semua run unit, matriks build, dan integrasi M3-10 mengembalikan exit code aslinya (0 lulus, 1 gagal), tanpa assertion libuv dan tanpa exit 9.
- **P2 database tes — A:** `mahira-cms` bersama dengan isolasi fixture: (1) guard target: tes menolak jalan bila `VERCEL_ENV` terisi, bila set env CMS tidak lengkap, atau bila `CMS_SUPABASE_DATABASE_URI` bukan project `mahira-cms` (ref `qnfzzymrceoubowfknvl`), tanpa mencetak nilai; (2) guard Owner: `users` = 1 dan satu-satunya user (bukan fixture) ber-role Admin, sebelum dan sesudah setiap file tes; (3) fixture berprefix `fixture-test-<area>-`, email `@example.invalid`, dihapus di awal dan akhir, hanya fixture buatan tes; (4) akun Owner hanya disentuh di dalam transaksi yang selalu di-rollback; uji rusak-sengaja guard Admin terakhir hanya lewat unit test tanpa DB; (5) file integrasi berurutan, satu per satu; tidak boleh dua run bersamaan. DB tes terpisah belum ada.
- **P3 CI — B:** GitHub Actions tanpa secret (`.github/workflows/ci.yml`): `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, dan matriks build tanpa DB (tanpa env, `VERCEL_ENV=production`, set parsial harus gagal dengan nama saja) + cek HTTP gerbang. Node 26.x dan Bun 1.3.14 di-pin; action di-pin ke commit SHA; `permissions: contents: read`. Tidak ada secret di GitHub. CI tidak menjalankan `migrate:status`; tes lokal `db-invariants` memeriksa bahwa semua migrasi repo sudah jalan. DEC-007 tidak berubah.
- **P4 cakupan — A:** semua cek yang masih berlaku menjadi tes sekarang: unit (`payload/env.ts`, `proxy.ts`, `lib/i18n/locales.ts`, `payload/access/roles.ts` + akses koleksi, `setPublicationLifecycleFields`, `denyPublicFallback`, `keepOneAdmin*`, `firstUserIsAdmin`); integrasi (akses, perbaikan review, locale, race, invarian RLS + migrasi); matriks build 4 mode + cek HTTP gerbang + secret-scan `.next`. `m3-02-user-count.ts` menjadi guard bersama; cek sekali-pakai `m3-02-migration-verify` tidak dijadikan tes.
- **Folder `tests/` — (a):** layout memakai `tests/` (`unit/`, `integration/`, `build/`, `helpers/`). Pemindahan file `tests/api-publications.json` (output API fixture, untracked) keluar dari `tests/` adalah tugas Owner; agen tidak memindahkan, menghapus, atau meng-commit file itu. Cek 2026-11-12: file itu sudah tidak ada di `tests/` checkout utama.

### 2.6 Jawaban Owner 2026-11-12 untuk M3-03 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-12 atas pertanyaan planner untuk M3-03 (workflow editorial minimum, DEC-015): "Setuju dengan saran" — P1 A, P2 A, P3 A, P4 B, P5 A, P6 A, P7 A, P8 A, P9 A. Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1. Model state hasil M3-03: EDITORIAL-WORKFLOW §9; rincian tes: TEST-PLAN §12.

- **P1 cakupan DEC-015 — A:** M3-03 mencakup draft → terbit → unpublish, ditambah revisi setelah terbit (draft di atas versi yang tayang; bawaan Payload drafts/versions), semuanya diuji. Review/approval dan penjadwalan tetap di luar MVP (DEC-015). Archive dan withdraw tidak dibuat sebagai state tersendiri; di MVP efek publiknya sama dengan unpublish. Konflik SRS FR-014 ("mengarsipkan") dicatat: untuk MVP dipenuhi oleh unpublish; state archive/withdraw menunggu pemicu review DEC-015.
- **P2 preview draft — A:** ditunda ke M3-05 bersama halaman detail (Draft Mode, hanya sesi staf, `noindex`). PRD §13 AC 3 (bagian preview) baru lengkap di M3-05 (diterapkan: §2.11 P11).
- **P3 cache halaman publik — A:** halaman publik berbasis CMS tetap dibaca saat request (`connection()`, tanpa `"use cache"`); M3-03 tidak menambah hook revalidasi. Tes integrasi membuktikan terbit, revisi, unpublish, dan terbit ulang terlihat pada request berikutnya. Aturan untuk milestone berikutnya: bacaan publik yang memakai `"use cache"` (M3-04, M3-05, sitemap M3-07) wajib memberi `cacheTag`, dan perubahan publikasi memanggil `revalidateTag(tag, { expire: 0 })` setelah commit database (EDITORIAL-WORKFLOW §4.4); mekanismenya didesain di milestone pemakainya. `updateTag` tidak dipakai karena hanya berlaku di Server Action (dokumen Next.js 16.4.4 terpasang: `revalidateTag.md`, `updateTag.md`).
- **P4 status di daftar admin — B:** kolom default daftar Publication: judul, bahasa, Status, Tayang di situs, pernah terbit, tanggal terbit, diubah. "Tayang di situs" (Ya/Tidak) adalah field virtual `liveOnSite`: tidak disimpan, tanpa kolom database, tanpa migrasi, hanya terbaca oleh staf. *Tafsiran yang dicatat (Owner boleh mengoreksi):* nilainya "Ya" bila record utama (versi yang tayang) memenuhi aturan baca publik yang sama dengan halaman publik, yaitu `_status: published` dan `accessLevel: public` (DEC-002); publikasi `registered`/`subscriber` yang sudah terbit tetap "Tidak". "Changed" + Ya = tayang dengan revisi tertunda; "Draft"/"Changed" + Tidak = belum atau tidak lagi tayang. Bila daftar kolom pernah diatur sendiri di admin, kolom baru ditambahkan lewat menu Columns.
- **P5 simpan tanpa `_status` di atas draft tertunda — A:** pada publikasi yang tayang dan punya draft tertunda, simpan non-draft yang tidak mengirim `_status` ditolak (400) oleh hook server `refuseImplicitStatusOverPendingDraft` (dibantu `markStatusNotSent`, yang mencatat di `beforeOperation` apakah `_status` dikirim), dengan pesan yang meminta editor memilih menerbitkan perubahan atau menyimpan sebagai draf. Tanpa hook ini Payload 3.93.0 memakai versi terbaru (draft) sebagai dasar simpan, sehingga record turun dari situs dan isi draft menggantikannya. `updateSharedFields()` ikut ditolak untuk grup yang punya sibling seperti itu, dan seluruh transaksinya di-rollback. Admin UI tidak terdampak (Save Draft, Publish, dan Unpublish selalu mengirim `_status`). Celah ini dibuktikan tes integrasi sebelum hook dipasang (bukti: CHANGELOG [M3-03]).
- **P6 publish `registered`/`subscriber` — A:** tetap boleh; record tidak tampil publik sampai MVP+ (DEC-002).
- **P7 jejak audit — A:** ditunda ke M4-02 (DEC-020). Riwayat versi Payload (maksimal 25 per record, tanpa aktor; unpublish menimpa versi terakhir) adalah batasan, bukan log audit.
- **P8 file Media dari draft — A:** ditunda ke M3-08 (DEC-011, DEC-012). Known issue: file di bucket publik bisa dibuka lewat URL-nya walaupun publikasinya masih draft; jangan unggah file yang belum boleh publik.
- **P9 bahasa admin — A:** admin tetap berbahasa Inggris; tanpa dependency baru. Label aksi Payload ("Save Draft", "Publish changes", "Unpublish") sudah sesuai PDD §9.

### 2.7 Jawaban Owner 2026-11-12 untuk M3-04 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-12 atas pertanyaan planner untuk M3-04 (homepage dari data CMS), diteruskan orchestrator, verbatim: "Setuju dengan saran" = P1 A, P2 A + P2b (i), P3 A, P4 A + P4b (i) + P4c (i), P5 A, P6 A, P7 A, P8 A, P9 A, P10 A, P11 A. Koreksi Owner untuk P2 A, verbatim: "blok + menu Learning Hub disembunyikan sampai task Learning Hub pra-launch yang baru (lihat bawah), bukan "sampai M6"". Task itu adalah M3-12 (arah Owner 2026-11-12, §2.8). Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1. Rincian halaman: PAGE-SPECIFICATIONS §2; rincian tes: TEST-PLAN §12.

- **P1 isi `/` saat CMS mati — A:** satu kode untuk semua mode. Saat CMS mati (tanpa env, atau `VERCEL_ENV=production`), `/` menjawab 200 dengan hero, Tentang + prinsip, CTA penutup, header, dan footer. Blok Publikasi berisi catatan "Belum ada publikasi yang terbit. Publikasi akan tampil di sini setelah diterbitkan."; blok Indeks, Bidang kerja, dan Learning Hub tidak tampil. Tidak ada publikasi, penulis, topik, atau materi sampel. `payload/env.ts` dan `proxy.ts` tidak berubah.
- **P2 blok CMS vs statis — A (dikoreksi Owner):** lead, indeks publikasi, dan Bidang kerja dibaca dari CMS. Blok Learning Hub dan item menu "Learning Hub" (header, footer) disembunyikan sampai task Learning Hub pra-launch M3-12, bukan M6. Hero, Tentang, prinsip, dan CTA penutup tetap statis di kode sebagai "konfigurasi yang disepakati" (SRS FR-002). Kolom "Topik" di footer dihapus. Entry point Learning Hub di FR-002 menunggu M3-12.
- **P2b cover hero — (i):** cover tipografis publikasi lead (judul, jenis, topik utama, tahun). Tanpa lead, cover hero adalah cover merek tanpa judul publikasi.
- **P3 kosong / gagal baca — A:** tanpa publikasi: catatan P1 di blok Publikasi, Indeks tidak tampil. Satu publikasi: lead saja. Tanpa topik aktif: Bidang kerja tidak tampil. Bila baca CMS gagal: blok Publikasi berisi "Publikasi belum dapat dimuat. Coba muat ulang halaman beberapa saat lagi.", Bidang kerja tidak tampil, log server hanya mencatat nama galat (tanpa pesan, host, user, atau URI), dan halaman tetap 200.
- **P4a memilih lead — A:** lead = publikasi ID terbaru menurut `publishedAt`; indeks = 4 publikasi berikutnya, tanpa mengulang lead. Tanpa perubahan skema.
- **P4b tanpa `publishedAt` — (i):** publikasi tanpa `publishedAt` tetap tampil, di belakang yang bertanggal, diurutkan menurut `createdAt` terbaru. Tanggalnya tidak ditampilkan karena `createdAt` bukan tanggal terbit.
- **P4c urutan `/{locale}/publications` — (i):** urutan NULL di kerangka indeks diperbaiki di M3-05 (§2.11 P4).
- **P5 tautan — A:** judul tidak ditautkan sampai M3-05 (§2.11 P10). Baris indeks tetap berupa `<details>` yang bisa dibuka. Tombol "Lihat semua publikasi" → `/id/publications` hanya dirender saat CMS hidup. Anchor dalam halaman tetap.
- **P6 bahasa — A:** homepage hanya ada di `/` (Indonesia) dan hanya menampilkan publikasi `locale: id`. Header dan footer tetap "EN segera" (§2.4 P4b (i)); `/id` dan `/en` tetap 404. Route Home di PAGE-SPECIFICATIONS §2 dan IA-ROUTING-I18N §3.1 dikoreksi dari `/{locale}` menjadi `/` (DEC-005). Homepage Inggris: **OPEN**.
- **P7 fixture / akses — A:** record tampil apa adanya, termasuk awalan "[FIXTURE]", tanpa banner. Badge akses diambil dari `accessLevel` ("Akses publik"). Apa yang tampil hanya ditentukan lapisan baca publik (published + public, DEC-002).
- **P8 teks sampel — A:** delapan perubahan: (1) deskripsi indeks menjadi "Publikasi terbaru dalam Bahasa Indonesia. Buka baris untuk membaca ringkasannya."; (2) "Bidang kerja yang menjadi pintu masuk untuk membaca publikasi.", tanpa angka; (3) "Katalog 2026" di hero dihapus; (4) tahun "Publikasi terbaru" dari lead; (5) teks cover dekoratif "Mahira · Publikasi"; (6) prinsip 02 "Judul, ringkasan, dan metadata publikasi yang terbit dapat dibaca siapa saja."; (7) CTA penutup "Temukan publikasi terbaru atau kenali cara kami bekerja."; (8) nomor urut eyebrow dihapus, label tetap. *Tafsiran butir 4 yang dicatat (Owner boleh mengoreksi):* keterangan "Publikasi terbaru · {tahun}" di bawah cover hero hanya tampil bila ada lead dan lead punya `publishedAt`.
- **P9 cover dan tanggal — A:** cover tipografis dibangun dari data (jenis, topik utama, judul, tahun terbit), tanpa nomor edisi dan tanpa gambar; `coverImage` mulai dipakai di M3-05. Tanggal berformat "28 Okt 2026" (`id-ID`, `day: "2-digit"`, `month: "short"`, `year: "numeric"`) dengan zona `Asia/Jakarta`; tahun juga dihitung dalam WIB.
- **P10 arti `isActive` — A:** Bidang kerja = Topic dengan `isActive: true` dan nama ID tidak kosong, diurutkan menurut nama (`Intl.Collator("id")`), dengan deskripsi ID bila ada, tanpa tautan. Label jenis/topik pada publikasi tetap tampil walau term-nya nonaktif (bila nama ID ada). Kedua topik fixture nonaktif, jadi blok ini tidak tampil di Preview sampai Owner mengaktifkan satu topik (Admin; nama ID dan EN wajib).
- **P11 baseline lint — A:** `".agents/**"` ditambahkan ke `globalIgnores` di `eslint.config.mjs`.
- **Temuan "Published At" (cek read-only `mahira-cms` 2026-11-12):** `publishedAt` kosong di 18/18 record publikasi, termasuk 13 yang published (ID public 7, ID registered 2, EN public 4, EN registered 2). Pengamatan Owner benar: record dibuat 2026-11-09, sebelum hook `setPublicationLifecycleFields` (§2.4 P3 B), dan hook itu hanya mengisi tanggal saat record disimpan ulang sebagai published. `@payloadcms/drizzle` 3.93.0 menerjemahkan `sort: "-publishedAt"` menjadi `published_at DESC, created_at DESC` tanpa `NULLS LAST`, dan Postgres menaruh NULL di depan pada urutan DESC; karena itu homepage memakai dua query (bertanggal, lalu tanpa tanggal). Selama record belum disimpan ulang sebagai published, lead dan indeks homepage di Preview diisi fixture lama tanpa tanggal, urut `createdAt` terbaru (P4b (i)). Topic dan Publication Type fixture semuanya `isActive: false`, tanpa deskripsi; Media 0 record.

### 2.8 Arahan Owner 2026-11-12: Learning Hub dan akun publik sebelum launch (catatan; DEC-014 Accepted hanya untuk cakupan launch)

Dicatat dari arahan Haidar (Product Owner) 2026-11-12, diteruskan orchestrator. Satu-satunya perubahan status adalah DEC-014 (Accepted, hanya cakupan launch; record di §2.1). DEC-002 tetap Accepted. Bagian ini tidak menambah kebutuhan di luar Q1–Q3.

**Arahan Owner, verbatim:**

> - Learning Hub wajib tersedia saat launch, diprioritaskan sebelum launch. Hanya Subscription yang post-launch.
> - Q1 A: akun publik (M5: SPIKE-002 batas auth, registrasi/login/reset, email DEC-019, unduhan file "registered" lewat private bucket + cek server) sebelum launch; entitlement subscriber + pembayaran setelah launch bersama Subscription (M7).
> - Q2 A (DEC-014): Learning Hub saat launch seperti referensi https://www.cips-indonesia.org/cips-learning-hub (hanya referensi struktur, jangan salin identitas/aset): katalog per tema, embed video/playlist YouTube, panduan, toolkit yang bisa diunduh publik; tanpa login, progress, kuis, sertifikat.
> - Q3 A: event, newsletter, form jaringan dosen tetap post-launch (M6, sesuai kebutuhan nyata).

Struktur milestone diusulkan orchestrator ("boleh kamu perhalus") dan dihaluskan planner M3-04; hasilnya di bawah.

- **Learning Hub wajib saat launch.** Hanya Subscription yang pasca-launch.
- **Q1 — A.** Pra-launch (M5): SPIKE-002; registrasi, login, logout, reset, dan verifikasi email (DEC-019); area akun minimal; evaluator akses server-side untuk level `registered`; unduhan file `registered` lewat private bucket + cek sesi di server + signed URL. Pasca-launch bersama M7: entitlement manual subscriber, evaluator level `subscriber`, file subscriber, dan pembayaran.
- **Q2 — A (DEC-014 → Accepted, hanya cakupan launch).** Katalog per tema, embed video/playlist YouTube, panduan, dan toolkit yang bisa diunduh publik; tanpa login, progress, kuis, atau sertifikat. Referensi struktur: https://www.cips-indonesia.org/cips-learning-hub (identitas dan aset tidak disalin).
- **Q3 — A.** Event, newsletter, dan form jaringan dosen tetap pasca-launch (M6), sesuai kebutuhan nyata.
- **Learning Hub — OPEN, diputuskan di awal M3-11:**
  - model konten dan jenis materi;
  - relasi ke Topic/"Bidang kerja";
  - model bilingual;
  - route (butir "learning hub" di DEC-005 "Still open");
  - penyimpanan file toolkit (bagian publik DEC-012);
  - halaman detail per materi vs embed langsung di katalog.
- **Struktur milestone.** ID lama tidak di-renumber. Urutan eksekusi: M0 → M1 → M2 → M3 → M5 → M4 (launch) → M6 / M7.
  - M3 menjadi "MVP — Platform publikasi + Learning Hub", dengan task baru yang dikerjakan di workflow terpisah:
    - **M3-11:** keputusan detail Learning Hub (butir OPEN di atas) + koleksi CMS.
    - **M3-12:** halaman publik Learning Hub (katalog per tema, embed YouTube, panduan) + membuka kembali blok dan menu Learning Hub di homepage (§2.7 P2 A).
    - **M3-13:** toolkit unduhan publik (bergantung M3-08).
  - M5 "Akses pengguna publik (pra-launch)":
    - M5-01 SPIKE-002.
    - M5-02 registrasi/login/reset/verifikasi + email DEC-019 + area akun minimal.
    - M5-03 evaluator akses server-side level `registered`; bagian entitlement manual subscriber pindah ke M7-02.
    - M5-04 file `registered` lewat private bucket + signed URL, dengan matriks SRS §12.1 kolom Visitor/Registered/Editor/Admin; kolom subscriber pindah ke M7-03.
  - M4 diblokir M3 + M5.
  - M6 "Expansion pasca-launch": event, newsletter, form jaringan dosen.
  - M7 "Phase 2 — Subscription (pasca-launch)":
    - M7-01 payment gateway, webhook idempoten, siklus langganan.
    - M7-02 entitlement manual subscriber + evaluator level subscriber (dari M5-03).
    - M7-03 file subscriber + kolom subscriber di matriks (dari M5-04).
- **Dampak DEC-002 (status tetap Accepted).** "Sampai MVP+" kini berarti sampai M5 (pra-launch) untuk `registered`, dan sampai M7 (Phase 2) untuk `subscriber`. Pekerjaan M3 tetap publication-only: publikasi `registered`/`subscriber` tidak tampil publik selama M3. Record DEC-002 mendapat pointer ke bagian ini, tanpa perubahan status.
- **Dokumen yang diubah (satu commit dokumen di branch `feat/m3-04-homepage-cms`):**
  - `docs/decisions/DECISIONS.md` (bagian ini, baris dan record DEC-014, pointer DEC-002);
  - `docs/CORE/PRD.md` (§4, §6.2, §6.3, §7, §10, §12 D-04/D-06, §13 AC 5/6/9/10, glosarium);
  - `docs/CORE/SRS.md` (§3, label FR-009–FR-013, FR-018/019, FR-021–FR-025, FR-028, FR-029 baru, §5.1, §13, §14);
  - `docs/MILESTONES.md` (urutan eksekusi, tabel ringkasan, M3-11–M3-13, M5 sebelum M4, M6-01, M7-02/M7-03);
  - `docs/CHANGELOG.md` ([Unreleased]);
  - `docs/architecture/CONTENT-ARCHITECTURE.md`, `DATA-MODEL.md` (§4.5, §5.2), `ACCESS-POLICY.md`;
  - `docs/specifications/PAGE-SPECIFICATIONS.md` (§7, §9), `IA-ROUTING-I18N.md` (§3.1, §3.2), `SUBSCRIPTION-BOUNDARY.md` (§2, §3, §6);
  - `docs/engineering/TEST-PLAN.md` (§3, §4), `TRACEABILITY-MATRIX.md`, `RELEASE-CHECKLIST.md` (§1);
  - `docs/content/GLOSSARY.md`.
- **Steering dan skills (tidak diubah; dilaporkan untuk ditinjau Owner):**

  | Baris | Isi | Status |
  |---|---|---|
  | `.kiro/steering/product.md:19` | "Learning Hub — catalog of learning resources and external media embeds; a full LMS is not assumed for MVP." | Istilah "MVP": Learning Hub kini cakupan launch (DEC-014), ditambah panduan dan toolkit. Isinya tidak bertentangan, tetapi istilahnya perlu diselaraskan |
  | `.kiro/steering/tech.md:13` | "Current dependencies do not include Payload CMS, … or a test framework." | Usang: Payload, `tsx`, dan `node:test` sudah terpasang (tercatat sejak M3-10) |
  | `.kiro/steering/tech.md:14` | "landing page is implemented under `app/page.tsx` … `lib/landing-content.ts`" | Usang: halaman ada di `app/(site)/page.tsx`; sesudah M3-04, `lib/landing-content.ts` hanya berisi teks statis |
  | `.kiro/steering/tech.md:16`, `:27` | "Candidate target architecture — not yet validated" / "not currently installed code" | Usang: DEC-006 dan DEC-007 Accepted; Payload terpasang |
  | `.kiro/steering/structure.md:19` | "The current codebase is a homepage foundation …" | Usang |
  | `.kiro/steering/structure.md:28` | "`lib/landing-content.ts` is a current hardcoded landing-content source" | Sesudah M3-04, file itu hanya berisi teks statis homepage (navigasi, prinsip); publikasi dan topik dari CMS |
  | `.kiro/skills/feature-spec-authoring/SKILL.md:23` | "Do not add payment gateway, full LMS, analytics, or other Phase 2 scope by implication." | Konsisten |

### 2.9 Jawaban Owner 2026-11-12 untuk butir 1b: koneksi database di Preview (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-12 UTC atas daftar pertanyaan butir 1b, diteruskan orchestrator: "1 a" (sudah dikerjakan Owner) dan, verbatim, "2-7 disetujui dengan saran" (2 a, 3 a, 4 b, 5 b, 6 a, 7 a). Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1.

**Masalah.** Di Preview, reload `/admin` gagal dengan "This page couldn't load" (digest 498284311). Penyebab dari investigasi lokal 2026-11-12 terhadap `mahira-cms`: session pooler Supavisor (port 5432) menolak klien baru setelah 15 koneksi (`EMAXCONNSESSION`, `pool_size` 15) dan masih menahan koneksi beberapa menit setelah klien pergi. Payload membuka sampai 10 koneksi per instance (default `pg-pool`) di 2 function Vercel yang memakai DB. Saat koneksi di `payload.init` ditolak, adapter menolak promise internal `initializing` tanpa ada yang menanganinya, sehingga muncul `unhandledRejection` dan proses Vercel berhenti (exit 128). PR #13 (`serverExternalPackages`) bukan penyebabnya.

- **1 pooler Preview — A (dikerjakan Owner):** `CMS_SUPABASE_DATABASE_URI` untuk Preview di Vercel diganti dari port 5432 (session pooler) ke 6543 (transaction pooler); host, user, password, dan nama DB tetap. Owner melaporkan perubahan sudah dibuat; hanya build Preview baru yang memakainya. `.env.local` dan tes integrasi tetap 5432, karena migrasi dan `SET` sesi di `tests/helpers/payload.ts` memerlukan session mode.
- **2 batas pool — A:** `payload/payload.config.ts` memberi pool `max: 5`, `idleTimeoutMillis: 5000`, dan `connectionTimeoutMillis: 10000`. Bila pool penuh, request gagal setelah 10 detik, tidak menunggu sampai batas waktu function 300 detik. Berlaku di semua lingkungan, termasuk tes lokal.
- **3 init DB gagal — A:** promise `initializing` milik adapter ditangani lewat wrapper kecil `db.init` di config, tanpa dependency baru. Kegagalan connect hanya menggagalkan request itu (REST 500; `/` tetap 200 dengan status error); proses tetap hidup dan request berikutnya mencoba init lagi. Wrapper ini bergantung pada field internal `initializing` (`@payloadcms/db-postgres` 3.93.0); pemicu review upgrade ketiga untuk wrapper ini dicatat di record DEC-006 (§2.1), di commit dokumen sesudah commit kode `311683f`.
- **4 `attachDatabasePool` (`@vercel/functions`) — B:** tidak dipasang sekarang; ditinjau di M4.
- **5 Pool Size Supabase — B:** tetap 15 di `mahira-cms`.
- **6 `serverExternalPackages: ["payload"]` — A:** dipertahankan (pemicu review kedua DEC-006 tetap berlaku).
- **7 Production — A:** Production tidak diubah sekarang. Pooler dan pool Production diputuskan saat CMS dinyalakan di Production (M4). Selama CMS mati di Production, perubahan 2 dan 3 tidak aktif di sana.
- **Verifikasi Owner (dilaporkan lulus 2026-11-13 sesudah merge PR #14, MILESTONES M3-04):** setelah build Preview baru dari branch `fix/db-connection-limits`, Owner membuka `/admin`, mengaktifkan Topic "[FIXTURE] Topik Hanya ID" (pesan error harus muncul), lalu me-reload `/admin` tiga kali tanpa "This page couldn't load". Langkahnya: ENG-ENV-001 §3.1.
- **Kode dan bukti:** branch `fix/db-connection-limits` (basis `origin/master` `8540424`, merge PR #13), commit `311683f` (jawaban 2 dan 3, tes unit DB1/DB2); hasil cek di CHANGELOG [M3-04] (Fixed) dan MILESTONES M3-04.

### 2.10 Jawaban Owner 2026-11-13 untuk butir 1c: loop login admin (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-13 atas daftar pertanyaan butir 1c, diteruskan orchestrator, verbatim: "Setuju dengan saran" (1 A, 2 (i), 3 (a)). Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1.

**Masalah.** Di Preview (`dpl_2T1NC5dUchqDfFNBQJh4Hcw8hR4R`, branch `fix/db-connection-limits`, 2026-11-13), sesudah login di `/admin/login`, URL bolak-balik cepat antara `/admin` dan `/admin/login`. Hard reload (Ctrl+Shift+R) memulihkan dashboard; clear site data tidak. Log Vercel 2026-11-13 berisi 25 `GET /admin/login` sekitar tiap 0,8 detik tanpa `GET /admin` di antaranya. Pola yang sama sudah ada 2026-11-12, sebelum PR #13 dan PR #14.

**Penyebab (terbukti lewat reproduksi lokal di build produksi dengan browser).** Loop terjadi di browser; server mengenali user yang login di setiap request. Dua perilaku Next.js 16.4.4 yang dinyalakan di `next.config.ts` bekerja bersama:

1. **`partialPrefetching`.** Saat `/admin` dibuka tanpa login, `RootPage` Payload memanggil `redirect('/admin/login')` langsung sesudah `headers()`. Next mengirim redirect itu sebagai data runtime yang dapat di-prefetch, dan router browser menyimpannya sebagai halaman `/admin` yang lengkap. Login Payload lewat REST (`POST /api/users/login`) tidak mengosongkan cache itu, jadi `router.push('/admin')` sesudah login menampilkan redirect yang tersimpan tanpa bertanya ke server.
2. **`cacheComponents`.** Next menyimpan route `/admin` lama di `<Activity>` tersembunyi, dan redirect boundary-nya masih memegang redirect ke `/admin/login`. Redirect itu dijalankan lagi setiap kali route itu tampil. Ini bug Next yang diketahui ([vercel/next.js#92767](https://github.com/vercel/next.js/issues/92767)); 16.4.4 belum memperbaikinya.

Server lalu melihat cookie yang sah dan mengirim `/admin/login` kembali ke `/admin`, dan siklus berulang. Reload membuang cache router di memori. `proxy.ts`, batas pool butir 1b (§2.9), dan PR #13 tidak terlibat. Bukti: CHANGELOG [M3-04] (Fixed), MILESTONES M3-04.

- **1 perbaikan — A:**
  - (a) `proxy.ts`, hanya saat CMS hidup: `GET` ke halaman admin yang dilindungi tanpa cookie `payload-token` dijawab 307 ke `/admin/login`. `?redirect=` dibuat seperti `handleAuthRedirect` Payload: tanpa parameter untuk `/admin`, selain itu path + query tanpa `_rsc`. Diteruskan tanpa redirect: route admin publik Payload (`login`, `forgot`, `reset`, `create-first-user`, `logout*`, `unauthorized`, `<koleksi auth>/verify/<token>`), request non-`GET` (Server Function `POST /admin`), dan `/api/*`. Ini hanya cek bahwa cookie ada; Payload tetap memverifikasi token dan memutuskan setiap request.
  - (b) `await connection()` sebelum `RootPage` di `app/(payload)/admin/[[...segments]]/page.tsx` (file buatan Payload, ditandai "DO NOT MODIFY"), sehingga redirect anonim tidak lagi dikirim sebagai data runtime yang disimpan browser.
  - Production tidak berubah: saat CMS mati (tanpa env atau `VERCEL_ENV=production`), gerbang tetap menjawab 404 sebelum cek cookie.
  - Sisa yang diketahui: bila browser membawa cookie yang ditolak Payload (sesi dicabut, `PAYLOAD_SECRET` berganti, user dihapus), login memantul sekali lalu masuk dashboard, karena bug Next di poin 2. Tidak ada loop.
- **2 log `new Date()` di admin — (i):** tetap known issue (§2.4 P2 A), kini dengan penjelasan yang terbukti: log berasal dari `jwtVerify` jose 5.10.0 di strategi JWT Payload, hanya saat ada token; Next menandainya hanya karena `partialPrefetching` menyala; Next lalu memindahkan render ke tahap Dynamic, jadi user tetap terautentikasi; log ini bukan penyebab loop. Ditinjau ulang pada setiap upgrade Payload/Next.
- **3 tes regresi — (a):** tes integrasi HTTP `tests/integration/admin.test.ts` (AD1–AD7) dan unit aturan proxy di `tests/unit/proxy.test.ts` (PX1–PX6). Bagian browser (cache router, route `<Activity>` tersembunyi) tidak punya tes otomatis; buktinya run Playwright MCP di folder tugas dan langkah Owner di Preview (ENG-ENV-001 §3.1). Tanpa dependency baru (`@playwright/test` tidak dipasang).
- **Tambahan orchestrator (diteruskan bersama jawaban):** `page.tsx` yang diedit tangan dan asumsi `proxy.ts` (nama cookie `payload-token` dari `cookiePrefix` default `payload`, daftar route admin publik yang disalin) masuk daftar review upgrade: pemicu keempat di record DEC-006 (§2.1) dan ENG-ENV-001 §3.1.
- **Verifikasi Owner (tertunda):** langkah login di Preview: ENG-ENV-001 §3.1.
- **Kode dan bukti:** branch `fix/admin-login-loop` (basis `origin/master` `dd7a806`, merge PR #14), commit `a5321de` (kode dan tes); hasil cek di CHANGELOG [M3-04] (Fixed) dan MILESTONES M3-04; investigasi dan run browser di `.agents/tasks/mahira-foundation-fix-admin-login-loop-2026-11-13/` (tidak dilacak git).

### 2.11 Jawaban Owner 2026-11-13 untuk M3-05 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-13 atas pertanyaan planner untuk M3-05 (indeks dan detail publikasi), diteruskan orchestrator, verbatim: "Setuju dengan saran" = P1 A, P2 A, P3 A, P4 A, P5 A, P6 A, P7 A, P8 A, P9 A, P10 A, P11 A, P12 B, P13 A, P14 A, P15 A. Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1. Rincian halaman: PAGE-SPECIFICATIONS §3–§4; route: IA-ROUTING-I18N; tes: TEST-PLAN §12.

**Catatan orchestrator (disampaikan ke Owner sebelum ia menjawab):** P7 A menahan metadata publikasi `registered`/`subscriber` dari situs publik sampai M5. P11 A menambah endpoint `/api/preview` (404 di Production).

**Penyimpangan sementara dari PRD §8 sampai M5:** PRD §8 membuat metadata publik untuk semua level akses. Selama M3 sampai M5, publikasi `registered`/`subscriber` tidak punya halaman publik dan tidak tampil di indeks; yang berlaku adalah DEC-002 dan §2.8. PRD §8 memuat pointer ke bagian ini.

- **P1 filter — A:** filter Jenis (`type`), Bidang kerja (`topic`), Tahun (`year`); satu nilai per filter, digabung AND. `topic` cocok di posisi mana pun. Tahun = tahun `publishedAt` dalam WIB; tanpa `publishedAt` tidak ikut saat `year` aktif. Pilihan hanya nilai yang punya ≥ 1 publikasi tampil di locale itu. Tanpa filter bahasa dan akses.
- **P2 URL state — A:** `?type=<slug>&topic=<slug>&year=<yyyy>&page=<n>` (slug term sama di ID dan EN); form GET `next/form` dengan tiga `<select>`, "Terapkan", "Hapus filter", jalan tanpa JavaScript; menerapkan filter kembali ke halaman 1; nilai kosong = tidak ada; 12 per halaman; pagination "Sebelumnya", nomor, "Berikutnya", "Halaman x dari y"; tanpa kontrol urutan (`q`/`sort` di M3-06); switcher di indeks ke indeks locale lain tanpa parameter.
- **P3 parameter tidak valid — A:** parameter tak dikenal diabaikan; nilai filter tak dikenal → state "filter tidak dikenal"; `page` tidak valid atau lewat halaman terakhir → state "halaman tidak ada" + tautan ke halaman 1; HTTP 200; URL dengan filter berisi atau state itu → `noindex, follow` (DEC-021); `?page=n` tanpa filter boleh diindeks.
- **P4 urutan — A:** bertanggal (`publishedAt` terbaru) lalu tanpa tanggal (`createdAt` terbaru), pemecah seri `id` terbaru. Menutup §2.7 P4c (i).
- **P5 arti `isActive` — A:** term nonaktif bukan pilihan filter dan dianggap filter tak dikenal; labelnya tetap tampil di daftar dan detail bila punya nama di locale halaman (tanpa fallback). Menutup §2.4 P6 A (i).
- **P6 route jenis dan topik — A:** `/{locale}/publications/type/{slug}` dan `/{locale}/topics/{slug}` tidak dibuat di M3-05; diputuskan saat nilai taksonomi final (B-04, M4-05) atau di M3-07.
- **P7 detail dan akses — A (diamandemen, lihat bawah):** hanya publikasi published + `public` di locale itu yang punya halaman. Isi: breadcrumb, jenis, bidang kerja (utama dulu), tanggal terbit bila ada, bahasa, H1, ringkasan penuh per paragraf, penulis, badge akses, `coverImage` bila ada (alt dari Media) atau cover tipografis. Tanpa panel unduhan (M3-08), publikasi terkait, isi, sitasi, bagikan. `<title>` = judul, description = ringkasan; canonical/hreflang/OG di M3-07. Route detail blocking.
- **P8 switcher di detail — A:** pasangan = record Translation Group yang sama, locale lain, published + public → tautan ke detail pasangan (`hrefLang`); tanpa pasangan → indeks locale lain dengan `title` "Belum tersedia dalam English" / "Not available in Bahasa Indonesia". Logo di halaman EN ke `/` dengan `hrefLang="id"`.
- **P9 308 slug lama — A:** tidak di M3-05, pindah ke M3-07; slug lama → not-found. Editor jangan mengganti slug publikasi yang sudah terbit sampai M3-07 (EDITORIAL-WORKFLOW §9). Tanpa skema dan migrasi.
- **P10 tautan homepage — A:** judul lead ke `/id/publications/{slug}`; panel baris indeks mendapat tautan "Baca publikasi" di luar `<summary>`; saat CMS mati tidak ada tautan. Menutup §2.7 P5 A.
- **P11 pratinjau draf staf — A:** `admin.preview` Publication → `/api/preview?id=<id>`. Handler memverifikasi sesi staf (Editor/Admin); tanpa sesi staf 404 tanpa cookie; dengan sesi staf Draft Mode aktif lalu 307 ke `/{locale}/publications/{slug}` dari data draf. Halaman detail dalam Draft Mode memverifikasi sesi staf lagi setiap request dan membaca versi terbaru dengan user staf dan `overrideAccess: false`; tanpa sesi staf yang sah cookie Draft Mode diabaikan. Banner "Pratinjau draf: belum tentu terlihat pengunjung." + "Keluar dari pratinjau" (POST mematikan Draft Mode). `noindex`, `Cache-Control` berisi `no-store`. Hanya halaman detail; indeks dan homepage tidak pernah menampilkan draf. Melengkapi PRD §13 AC 3 (preview) dan §2.6 P2 A.
- **P12 `@playwright/test` — B:** tidak dipasang; **tidak ada dependency baru**. Tes HTTP (unit + integrasi); bagian browser dicek manual lewat Playwright MCP dengan tangkapan layar di folder tugas. E2E pindah ke M5.
- **P13 migrasi `mahira-cms` — A:** **tanpa migrasi; tidak ada migrasi yang diterapkan.** Bukti: `bun run payload migrate:create m3_05_schema_check --skip-empty` tidak membuat file.
- **P14 Production dengan CMS mati — A:** tidak berubah; `proxy.ts` tetap 404 (`noindex`, `no-store`) untuk `/{locale}/publications`, `/{locale}/publications/{slug}`, dan `/api/preview*`; homepage tetap tanpa tautan publikasi. Cek gerbang `test:build-matrix` ditambah untuk URL detail dan `/api/preview`.
- **P15 tata letak, teks, gagal baca — A (diamandemen, lihat bawah):** daftar berupa baris editorial seperti indeks homepage, tanpa cover dan lead; teks ID/EN dari usulan planner; tanggal "28 Okt 2026" (`id-ID`) dan "28 Oct 2026" (`en-GB`), WIB. Gagal baca indeks → pesan di halaman, HTTP 200, `noindex`, log hanya nama galat.

**Amandemen 2026-11-13 atas P7 A dan P15 A (jawaban Owner "option A", diteruskan orchestrator, sesudah blokir implementasi detail):**

- **Penyebab:** Next.js 16.4.4 dengan `cacheComponents` + `partialPrefetching` membuat static shell per locale untuk `/{locale}/publications/[slug]`, karena `app/[locale]/layout.tsx` punya `generateStaticParams` untuk `locale`. Shell itu dikirim dengan status 200 sebelum halaman jalan, sehingga `notFound()` dan galat sesudahnya hanya bisa menambah `noindex` atau UI galat (`node_modules/next/dist/docs/01-app/02-guides/streaming.md` "The HTTP contract"; `export const instant = false` hanya mematikan validasi).
- **P7 A, bagian status:** slug tidak dikenal atau tidak layak (draft, `registered`, `subscriber`, locale lain, huruf besar, pola tidak valid) → `notFound()`: HTTP 200 + `<meta name="robots" content="noindex">` + halaman not-found. Bukan "HTTP 404 sungguhan".
- **P15 A, bagian detail:** gagal baca → halaman merender state galat berbahasa locale di server (`data-publication-error`, tautan muat ulang), HTTP 200 + `noindex, follow`; HTML tidak memuat host DB. Bukan "HTTP 500". `error.tsx` tetap untuk galat tak terduga.
- **Item terbuka M3-07 (SEO):** evaluasi `htmlLimitedBots` terbatas untuk user agent crawler (mis. Googlebot, Bingbot) agar crawler mendapat 404/500 sungguhan sementara pengunjung tetap streaming. Belum diuji; perlu perubahan `next.config.ts` dan wajib mengulang cek DEC-006 dan §2.10. `next.config.ts` dan `proxy.ts` tidak diubah di M3-05.

- **Kode dan bukti:** branch `feat/m3-05-publication-index-detail` (basis `origin/master` `77990f9`): indeks `c4d5385` + tes `fe52d14`; detail `ded3b57` + tes `a77c0f6`; pratinjau `4292bdf` + tes `54291c5`, `5e2ef08`; dokumen `b1dd298`; `generateMetadata` indeks menunggu `connection()` `b3966c3`; dokumen penutup (MILESTONES, CHANGELOG) sesudahnya. SHA ini tetap sesudah `git fetch` 2026-11-14, karena `origin/master` masih `77990f9` dan rebase tidak mengubah apa pun. File utama: `app/[locale]/publications/page.tsx`, `app/[locale]/publications/[slug]/page.tsx`, `app/api/preview/route.ts`, `app/api/preview/exit/route.ts`, `lib/cms/public-content.ts` (`getPublicationIndex`, `getPublicationDetail`), `lib/cms/staff-preview.ts` (satu-satunya bacaan draf), `lib/publications/{index-params,index-view,detail-view,preview,dates}.ts`. Hasil cek: TEST-PLAN §12.2 (per fitur) dan CHANGELOG [M3-05] (run penuh pada tree final); status: MILESTONES M3-05.

## 3. Legacy ID mapping

| Legacy reference | Canonical register item |
|---|---|
| PRD D-01 | DEC-001 |
| PRD D-02 | DEC-003 |
| PRD D-03 | DEC-004 |
| PRD D-04 | DEC-014 |
| PRD D-05 | DEC-015 |
| PRD D-06 | DEC-010 / DEC-011 |
| PRD D-07 | DEC-016 |
| PRD D-08 | Future subscription specification; DEC-010 and Phase 2 boundary |
| PRD D-09 | DEC-006 |
| PRD D-10 | DEC-017 |
| SRS T-01 | DEC-006 / DEC-007 |
| SRS T-02 | DEC-004 / DEC-005 |
| SRS T-03 | DEC-012 |
| SRS T-04 | DEC-013 |
| SRS T-05 | Future subscription specification; DEC-010 |
| SRS T-06 | DEC-008 / DEC-009 |
| SRS T-07 | DEC-016 |
| SRS T-08 | DEC-017 |
| SRS T-09 | DEC-019 |
| SRS T-10 | DEC-020 |

## 4. Decision record template

```text
ID:
Title:
Status: Open | Proposed | Accepted | Rejected | Superseded
Category:
Decision owner:
Approver:
Created / decided / review date:
Context and problem:
Options considered:
Decision:
Rationale:
Consequences (positive / negative / neutral):
Security / privacy impact:
Cost / operational impact:
Affected documents / code / migrations:
Validation evidence:
Review trigger:
Related ADR / issue:
```

## 5. Change control

A decision is only `Accepted` after the approver is known and the decision has a date. Update relevant requirements and specifications in the same change set where practical. If implementation proves the decision invalid, create a superseding record rather than deleting history.

## 6. Change history

| Date | Change |
|---|---|
| 2026-11-05 | Initial proposed register. |
| 2026-11-08 | Columns Approver and Decided added (spec 01 PUB-DU-14). DEC-001, DEC-002, DEC-003 (structure only), DEC-004, DEC-005, DEC-015, DEC-016, DEC-021 set to Accepted with approver Haidar (Product Owner) and date 2026-11-08; records in §2.1. No other row changed. |
| 2026-11-09 | DEC-018 Accepted (Bun package manager, Node.js runtime). DEC-007 spike environment recorded in §2.2; DEC-007 stays Open. |
| 2026-11-09 | DEC-009 Accepted (roles: Public user, Editor, Admin; no staff bypass on public downloads). |
| 2026-11-09 | DEC-005 addendum Accepted (search via `/{locale}/publications?q=`, type pages `/{locale}/publications/type/{slug}`). |
| 2026-11-10 | M2 spike evidence and recommendations added as proposal (§2.3); no status changed. |
| 2026-11-10 | DEC-006, DEC-007, DEC-013 Accepted from M2 spike evidence; DEC-004/005 evidence and DEC-018 `engines.node` 26.x recorded; DEC-009 row approver/date filled. |
| 2026-11-10 | Jawaban Owner untuk M3-02 dan M3-01 (P1–P7) dicatat di §2.4, dengan pointer di DEC-006 dan bukti DEC-004 (§2.1); tidak ada status yang berubah. |
| 2026-11-11 | Perbaikan review M3-02: pointer "(jawaban Owner: §2.4 P4c)" di butir "Still open" DEC-005; pemicu review upgrade Payload (row lock bergantung pada internal `@payloadcms/drizzle`, cek race wajib diulang) di DEC-006; tidak ada status yang berubah. |
| 2026-11-11 | Jawaban Owner untuk M3-10 (P1a–P4, folder `tests/`) dicatat di §2.5; tidak ada status yang berubah. |
| 2026-11-12 | §2.5 butir folder `tests/`: cek 2026-11-12 (file `tests/api-publications.json` tidak ada lagi di checkout utama); tanggal `Last updated` dan riwayat diselaraskan (temuan review M3-10 nomor 4); tidak ada status yang berubah. |
| 2026-11-12 | Jawaban Owner untuk M3-03 (P1–P9) dicatat di §2.6; tidak ada status yang berubah. |
| 2026-11-12 | Jawaban Owner untuk M3-04 (P1–P11, termasuk koreksi P2 A: Learning Hub disembunyikan sampai M3-12) dan temuan `publishedAt` dicatat di §2.7; tidak ada status yang berubah. |
| 2026-11-12 | Arahan Owner 2026-11-12 (Learning Hub dan akun publik sebelum launch; Q1 A, Q2 A, Q3 A) dicatat di §2.8. DEC-014 Accepted hanya untuk cakupan launch (record di §2.1; detail tetap Open). DEC-002 tetap Accepted; dampaknya dicatat sebagai pointer di record-nya. |
| 2026-11-13 | Pemicu review upgrade kedua di DEC-006: `serverExternalPackages: ["payload"]` di `next.config.ts` (perbaikan urutan inisialisasi Payload, disetujui Owner 2026-11-12) wajib dicek ulang dan HP8/HP9 diulang pada setiap upgrade Payload/Next; tidak ada status yang berubah. Teks jawaban Owner §2.7 P3 tidak diubah; batas jaminan log dicatat di TEST-PLAN §12.5 (review M3-04 R2). |
| 2026-11-13 | Jawaban Owner 2026-11-12 untuk butir 1b (koneksi database Preview: transaction pooler port 6543 untuk Preview, batas pool, penanganan init gagal; Production menunggu M4) dicatat di §2.9. Pemicu review upgrade ketiga di DEC-006: wrapper `db.init` di `payload/payload.config.ts` bergantung pada promise internal `initializing` `@payloadcms/db-postgres` 3.93.0, dicek ulang dan DB1/DB2 diulang pada setiap upgrade Payload; tidak ada status yang berubah. |
| 2026-11-13 | Jawaban Owner 2026-11-13 untuk butir 1c (loop login admin: cek cookie di `proxy.ts` + `connection()` di halaman admin; log `new Date()` tetap known issue; tes HTTP + unit) dicatat di §2.10, dengan penjelasan terbukti di §2.4 P2 A. Pemicu review upgrade keempat di DEC-006: edit tangan `app/(payload)/admin/[[...segments]]/page.tsx` dan asumsi `proxy.ts` (cookie `payload-token`, daftar route admin publik); tidak ada status yang berubah. |
| 2026-11-13 | Jawaban Owner 2026-11-13 untuk M3-05 (P1–P15; P12 B tanpa dependency baru, P13 A tanpa migrasi) dan amandemen P7 A/P15 A (not-found dan gagal baca detail = HTTP 200 + `noindex`; item terbuka M3-07 `htmlLimitedBots`) dicatat di §2.11, termasuk penyimpangan sementara dari PRD §8 sampai M5. Pointer di §2.4 P6 A, §2.6 P2 A, §2.7 P4c (i) dan P5 A, serta bukti validasi DEC-005; tidak ada status yang berubah. |
| 2026-11-14 | Penutupan M3-05 (temuan review minor R1, R2): bukti validasi DEC-005 kini menyebut status not-found slug detail (HTTP 200 + `noindex`, §2.11 amandemen P7 A; 404 untuk crawler di M3-07); baris "Kode dan bukti" §2.11 memuat semua commit M3-05 termasuk `b1dd298` dan `b3966c3` dan merujuk CHANGELOG/MILESTONES [M3-05]; tidak ada status yang berubah. |
