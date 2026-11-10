# Decision Register

**Status:** Register in use. Eight decisions are Accepted (DEC-001, DEC-002, DEC-003 structure only, DEC-004, DEC-005, DEC-015, DEC-016, DEC-021), approved by Haidar (Product Owner) on 2026-11-08; their records are in §2.1. DEC-009 and DEC-018 were Accepted on 2026-11-09; DEC-006, DEC-007, and DEC-013 on 2026-11-10 (§2.1). Every other row keeps its earlier status.  
**Canonical IDs:** `DEC-NNN`. Historical PRD `D-xx` and SRS `T-xx` are retained for traceability.  
**Last updated:** 2026-11-10 (DEC-006, DEC-007, DEC-013 Accepted; DEC-004/005 evidence and DEC-018 Node pin recorded; §2.1). Earlier the same day: M2 spike evidence proposal §2.3. Earlier: 2026-11-08 (columns Approver and Decided added, PUB-DU-14 of spec `01-publication-platform-foundation`; Owner decisions recorded from the 2026-11-08 session, see `.kiro/specs/03-architecture-technical-validation/PROTOTYPE-PLAN.md` §1–§2).

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
| DEC-014 | Learning Hub MVP scope | PRD D-04 | Catalog + external embeds as baseline; no LMS progress, certificates, or assessments unless approved. | Proposed | Scope, schema, page specs | PO / Learning Lead | — | — |
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
- **Still open (not decided by this record):** the default locale as a named setting, the search URL pattern (DEC-013), taxonomy and other route segments (topics, publication types, learning hub, about, account), and query-string canonicalization beyond the `noindex` rule of DEC-021. ADR-0005 lists them.
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
- **Review trigger:** a structured-data decision (spec 01 PUB-OQ-39), or MVP+ restricted publications.

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

- **DEC-006 — CMS selection and application topology.** Payload CMS 3 (3.93.0 tested) embedded in the single Next.js 16.4.4 application. *Not decided:* how to handle the `cacheComponents` log noise in the admin (SPIKE-001 §8); resolve in M3-02.
- **DEC-007 — Database schema ownership and migration.** Separate Supabase projects: `mahira-cms` holds only Payload's Postgres schema; `mahira.id` holds Auth, Storage, and app tables (§2.2). The CMS schema changes only through committed Payload migrations (`push: false`); every `up()` enables RLS on new tables; every `down()` is reviewed; CI checks `migrate:status`; `migrate:reset` and `migrate:fresh` are never run against shared or production databases. App-schema migration tooling for `mahira.id` is decided when M5 adds app tables. *Consequence:* ADR-0002's single-database text is superseded by this record.
- **DEC-013 — Search scope and engine.** Start with PostgreSQL full-text search using the `indonesian` text-search configuration (present on Supabase; stemming works, stop words do not). `pg_trgm` only where tests justify it. Relevance is tested in M3-06.
- **DEC-004 and DEC-005 — validation evidence added.** DEC-004: checks 1–3 and 5–7 PASS, check 4 PARTIAL (a client can force fallback with `?fallback-locale=` on REST; fix in M3). DEC-005: per-locale slug uniqueness proven by index `locale_slug_idx`; route rules (308, 404, trailing slash, `/id`/`/en`) are tested in M3-01/M3-07. Both stay Accepted.
- **DEC-012** is unchanged (Proposed): the public part is proven; private delivery waits for M5-04.

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
