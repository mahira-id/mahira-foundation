# Decision Register

**Status:** Register in use. Eight decisions are Accepted (DEC-001, DEC-002, DEC-003 structure only, DEC-004, DEC-005, DEC-015, DEC-016, DEC-021), approved by Haidar (Product Owner) on 2026-11-08; their records are in §2.1. DEC-009 and DEC-018 were Accepted on 2026-11-09; DEC-006, DEC-007, and DEC-013 on 2026-11-10 (§2.1). DEC-014 was Accepted on 2026-11-12 for the launch scope only; its details stay Open (§2.1, §2.8). Every other row keeps its earlier status.  
**Canonical IDs:** `DEC-NNN`. Historical PRD `D-xx` and SRS `T-xx` are retained for traceability.  
**Last updated:** 2026-11-12 (Owner direction: Learning Hub and public accounts before launch, recorded in §2.8; DEC-014 Accepted for the launch scope only; DEC-002 status unchanged). Earlier the same day: 2026-11-12 (Owner answers for M3-04 recorded in §2.7; no status change). Earlier the same day: 2026-11-12 (Owner answers for M3-03 recorded in §2.6; no status change). Earlier the same day: 2026-11-12 (§2.5 folder check dated 2026-11-12; dates aligned with M3-10 review finding 4; no status change). Earlier: 2026-11-11 (Owner answers for M3-10 recorded in §2.5; no status change). Earlier the same day: 2026-11-11 (review M3-02 fixes: DEC-005 "Still open" pointer to §2.4 P4c; DEC-006 upgrade review trigger; no status change). Earlier: 2026-11-10 (Owner answers for M3-02/M3-01 recorded in §2.4; no status change). Earlier the same day: DEC-006, DEC-007, DEC-013 Accepted; DEC-004/005 evidence and DEC-018 Node pin recorded (§2.1); M2 spike evidence proposal §2.3. Earlier: 2026-11-08 (columns Approver and Decided added, PUB-DU-14 of spec `01-publication-platform-foundation`; Owner decisions recorded from the 2026-11-08 session, see `.kiro/specs/03-architecture-technical-validation/PROTOTYPE-PLAN.md` §1–§2).

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
- **Validation evidence:** pending the Spike A prototype of spec `03-architecture-technical-validation` (design Revision 3 §22).
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

- **DEC-006 — CMS selection and application topology.** Payload CMS 3 (3.93.0 tested) embedded in the single Next.js 16.4.4 application. *Not decided:* how to handle the `cacheComponents` log noise in the admin (SPIKE-001 §8); resolve in M3-02 (jawaban Owner: §2.4 P2). *Upgrade review trigger (recorded 2026-11-11, review M3-02 finding 4; not a status change):* the DEC-004 row lock in `payload/db/lock-translation-group.ts` reads an internal structure of `@payloadcms/drizzle` (`adapter.sessions[transactionID].db`). On every Payload upgrade the race check must be rerun and pass (ENG-ENV-001 §3.1).
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
- **P2 log `cacheComponents` di admin — A:** tanpa perubahan kode; dicatat sebagai known issue yang ditinjau ulang saat upgrade Payload/Next; Owner menyaring log di Vercel (ENG-ENV-001 §3.1). Menjawab sub-poin DEC-006.
- **P3 `publishedAt` — B (i):** bila kosong saat dokumen disimpan sebagai published, server mengisinya dengan waktu saat itu (UTC); editor boleh mengubahnya; record lama yang kosong terisi saat disimpan ulang sebagai published.
- **P4a route M3-01 — B:** infrastruktur locale (`id`/`en`, lainnya 404; `/id` dan `/en` 404; huruf besar 404; trailing slash 308; kamus UI; switcher; baca publik tanpa fallback) plus kerangka `/{locale}/publications` (judul published + public di locale itu, tanpa filter, pagination, atau tautan detail; 404 saat CMS mati).
- **P4b switcher di `/` — (i):** `/` tidak berubah (tetap "EN segera" tanpa tautan).
- **P4c default locale — (i):** konstanta `DEFAULT_LOCALE = "id"` hanya untuk `/` dan `defaultLocale` Payload, tanpa redirect. Menjawab butir "Still open" default locale di DEC-005 (ADR-0005, IA-01).
- **P4d segmen lain — setuju:** topics, learning-hub, about, dan account tidak dibuat di M3-01.
- **P5 role akun yang ada — A:** migrasi menjadikan satu-satunya user yang ada Admin; bila ada lebih dari satu user, migrasi berhenti dan Owner ditanya; user baru default Editor; user pertama di database kosong otomatis Admin.
- **P6 field koleksi — A (i):** tambah hanya `role` (Users), `everPublished` (penanda sistem "pernah terbit" untuk aturan hapus DEC-016, tidak bisa diedit), dan `isActive` (Topic, Publication Type; default nonaktif; aktif hanya bila nama ID dan EN terisi; artinya di halaman publik diputuskan di M3-05). Field DATA-MODEL lain menunggu milestone pemakainya.
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
- **P2 preview draft — A:** ditunda ke M3-05 bersama halaman detail (Draft Mode, hanya sesi staf, `noindex`). PRD §13 AC 3 (bagian preview) baru lengkap di M3-05.
- **P3 cache halaman publik — A:** halaman publik berbasis CMS tetap dibaca saat request (`connection()`, tanpa `"use cache"`); M3-03 tidak menambah hook revalidasi. Tes integrasi membuktikan terbit, revisi, unpublish, dan terbit ulang terlihat pada request berikutnya. Aturan untuk milestone berikutnya: bacaan publik yang memakai `"use cache"` (M3-04, M3-05, sitemap M3-07) wajib memberi `cacheTag`, dan perubahan publikasi memanggil `revalidateTag(tag, { expire: 0 })` setelah commit database (EDITORIAL-WORKFLOW §4.4); mekanismenya didesain di milestone pemakainya. `updateTag` tidak dipakai karena hanya berlaku di Server Action (dokumen Next.js 16.4.4 terpasang: `revalidateTag.md`, `updateTag.md`).
- **P4 status di daftar admin — B:** kolom default daftar Publication: judul, bahasa, Status, Tayang di situs, pernah terbit, tanggal terbit, diubah. "Tayang di situs" (Ya/Tidak) adalah field virtual `liveOnSite`: tidak disimpan, tanpa kolom database, tanpa migrasi, hanya terbaca oleh staf. *Tafsiran yang dicatat (Owner boleh mengoreksi):* nilainya "Ya" bila record utama (versi yang tayang) memenuhi aturan baca publik yang sama dengan halaman publik, yaitu `_status: published` dan `accessLevel: public` (DEC-002); publikasi `registered`/`subscriber` yang sudah terbit tetap "Tidak". "Changed" + Ya = tayang dengan revisi tertunda; "Draft"/"Changed" + Tidak = belum atau tidak lagi tayang. Bila daftar kolom pernah diatur sendiri di admin, kolom baru ditambahkan lewat menu Columns.
- **P5 simpan tanpa `_status` di atas draft tertunda — A:** pada publikasi yang tayang dan punya draft tertunda, simpan non-draft yang tidak mengirim `_status` ditolak (400) oleh hook server `refuseImplicitStatusOverPendingDraft` (dibantu `markStatusNotSent`, yang mencatat di `beforeOperation` apakah `_status` dikirim), dengan pesan yang meminta editor memilih menerbitkan perubahan atau menyimpan sebagai draf. Tanpa hook ini Payload 3.93.0 memakai versi terbaru (draft) sebagai dasar simpan, sehingga record turun dari situs dan isi draft menggantikannya. `updateSharedFields()` ikut ditolak untuk grup yang punya sibling seperti itu, dan seluruh transaksinya di-rollback. Admin UI tidak terdampak (Save Draft, Publish, dan Unpublish selalu mengirim `_status`). Celah ini dibuktikan tes integrasi sebelum hook dipasang (bukti: CHANGELOG [M3-03]).
- **P6 publish `registered`/`subscriber` — A:** tetap boleh; record tidak tampil publik sampai MVP+ (DEC-002).
- **P7 jejak audit — A:** ditunda ke M4-02 (DEC-020). Riwayat versi Payload (maksimal 25 per record, tanpa aktor; unpublish menimpa versi terakhir) adalah batasan, bukan log audit.
- **P8 file Media dari draft — A:** ditunda ke M3-08 (DEC-011, DEC-012). Known issue: file di bucket publik bisa dibuka lewat URL-nya walaupun publikasinya masih draft; jangan unggah file yang belum boleh publik.
- **P9 bahasa admin — A:** admin tetap berbahasa Inggris; tanpa dependency baru. Label aksi Payload ("Save Draft", "Publish changes", "Unpublish") sudah sesuai PDD §9.

### 2.7 Jawaban Owner 2026-11-12 untuk M3-04 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-12 atas pertanyaan planner untuk M3-04 (homepage dari data CMS), diteruskan orchestrator, verbatim: "Setuju dengan saran" = P1 A, P2 A + P2b (i), P3 A, P4 A + P4b (i) + P4c (i), P5 A, P6 A, P7 A, P8 A, P9 A, P10 A, P11 A. Koreksi Owner untuk P2 A, verbatim: "blok + menu Learning Hub disembunyikan sampai task Learning Hub pra-launch yang baru (lihat bawah), bukan "sampai M6"". Task itu adalah M3-12 (arah Owner 2026-11-12, dicatat terpisah). Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1. Rincian halaman: PAGE-SPECIFICATIONS §2; rincian tes: TEST-PLAN §12.

- **P1 isi `/` saat CMS mati — A:** satu kode untuk semua mode. Saat CMS mati (tanpa env, atau `VERCEL_ENV=production`), `/` menjawab 200 dengan hero, Tentang + prinsip, CTA penutup, header, dan footer. Blok Publikasi berisi catatan "Belum ada publikasi yang terbit. Publikasi akan tampil di sini setelah diterbitkan."; blok Indeks, Bidang kerja, dan Learning Hub tidak tampil. Tidak ada publikasi, penulis, topik, atau materi sampel. `payload/env.ts` dan `proxy.ts` tidak berubah.
- **P2 blok CMS vs statis — A (dikoreksi Owner):** lead, indeks publikasi, dan Bidang kerja dibaca dari CMS. Blok Learning Hub dan item menu "Learning Hub" (header, footer) disembunyikan sampai task Learning Hub pra-launch M3-12, bukan M6. Hero, Tentang, prinsip, dan CTA penutup tetap statis di kode sebagai "konfigurasi yang disepakati" (SRS FR-002). Kolom "Topik" di footer dihapus. Entry point Learning Hub di FR-002 menunggu M3-12.
- **P2b cover hero — (i):** cover tipografis publikasi lead (judul, jenis, topik utama, tahun). Tanpa lead, cover hero adalah cover merek tanpa judul publikasi.
- **P3 kosong / gagal baca — A:** tanpa publikasi: catatan P1 di blok Publikasi, Indeks tidak tampil. Satu publikasi: lead saja. Tanpa topik aktif: Bidang kerja tidak tampil. Bila baca CMS gagal: blok Publikasi berisi "Publikasi belum dapat dimuat. Coba muat ulang halaman beberapa saat lagi.", Bidang kerja tidak tampil, log server hanya mencatat nama galat (tanpa pesan, host, user, atau URI), dan halaman tetap 200.
- **P4a memilih lead — A:** lead = publikasi ID terbaru menurut `publishedAt`; indeks = 4 publikasi berikutnya, tanpa mengulang lead. Tanpa perubahan skema.
- **P4b tanpa `publishedAt` — (i):** publikasi tanpa `publishedAt` tetap tampil, di belakang yang bertanggal, diurutkan menurut `createdAt` terbaru. Tanggalnya tidak ditampilkan karena `createdAt` bukan tanggal terbit.
- **P4c urutan `/{locale}/publications` — (i):** urutan NULL di kerangka indeks diperbaiki di M3-05.
- **P5 tautan — A:** judul tidak ditautkan sampai M3-05. Baris indeks tetap berupa `<details>` yang bisa dibuka. Tombol "Lihat semua publikasi" → `/id/publications` hanya dirender saat CMS hidup. Anchor dalam halaman tetap.
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
