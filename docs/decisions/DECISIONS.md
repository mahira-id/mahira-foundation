# Decision Register

**Status:** Register in use. Eight decisions are Accepted (DEC-001, DEC-002, DEC-003 structure only, DEC-004, DEC-005, DEC-015, DEC-016, DEC-021), approved by Haidar (Product Owner) on 2026-11-08; their records are in §2.1. DEC-009 and DEC-018 were Accepted on 2026-11-09; DEC-006, DEC-007, and DEC-013 on 2026-11-10 (§2.1). DEC-014 was Accepted on 2026-11-12 for the launch scope; its remaining details were decided on 2026-11-17 (§2.1, §2.16). DEC-011 was Accepted on 2026-11-16 (§2.1, §2.14). DEC-024 was Accepted on 2026-11-17 (§2.1, §2.15). Every other row keeps its earlier status.  
**Canonical IDs:** `DEC-NNN`. Historical PRD `D-xx` and SRS `T-xx` are retained for traceability.  
**Last updated:** 2026-11-19 (Owner answers for M3-13 recorded in §2.17 with the M3-12b close-out; DEC-012 stays Proposed, with a note on the toolkit files; the DEC-014 evidence line points to M3-13; a toolkit upgrade review trigger is added to DEC-006). Earlier: 2026-11-17 (Owner answers for M3-11 and M3-12 recorded in §2.16 with the M3-09 close-out; the DEC-014 row and §2.1 record now say the remaining details are decided; DEC-012 stays Proposed). Earlier the same day: 2026-11-17 (Owner answers for M3-09 recorded in §2.15 with the M3-08 close-out evidence; DEC-024 Accepted (register row and §2.1 record; the Design/Frontend Lead role is not appointed, so the Owner approved as Product Owner); DEC-012 stays Proposed). Earlier: 2026-11-16 (Owner answers for M3-08 recorded in §2.14; DEC-011 Accepted (register row and §2.1 record); DEC-012 stays Proposed with a note on what M3-08 proves). Earlier: 2026-11-15 (Owner answers for M3-07 recorded in §2.13 with the outcome of decisions 8 and 9 (both adopted); the DEC-021 record points to §2.13; no status change). Earlier: 2026-11-15 (Owner answers for M3-06 recorded in §2.12; DEC-013 row and §2.1 record point to §2.12 and ADR-0007, Accepted 2026-11-15; no status change). Earlier: 2026-11-14 (M3-05 close-out: the DEC-005 record points to the detail not-found status of §2.11, amendment P7 A; the §2.11 code line lists every M3-05 commit and points to MILESTONES/CHANGELOG [M3-05]; no status change). Earlier: 2026-11-13 (Owner answers for M3-05 recorded in §2.11, including the amendment of P7 A/P15 A and the temporary deviation from PRD §8 until M5; pointers in §2.4 P6, §2.6 P2, §2.7 P4c/P5 and the DEC-005 record; no status change). Earlier the same day: 2026-11-13 (Owner answers for item 1c, admin login loop, recorded in §2.10 with the proven explanation in §2.4 P2 A; DEC-006 fourth upgrade review trigger for the hand-edited admin `page.tsx` and the `proxy.ts` login assumptions; no status change). Earlier the same day: 2026-11-13 (Owner answers for item 1b, Preview database connections, recorded in §2.9; DEC-006 third upgrade review trigger for the `db.init` wrapper in `payload/payload.config.ts`; no status change). Earlier the same day: 2026-11-13 (DEC-006 upgrade review trigger: `serverExternalPackages: ["payload"]` in `next.config.ts`, Owner-approved 2026-11-12; no status change). Earlier: 2026-11-12 (Owner direction: Learning Hub and public accounts before launch, recorded in §2.8; DEC-014 Accepted for the launch scope only; DEC-002 status unchanged). Earlier the same day: 2026-11-12 (Owner answers for M3-04 recorded in §2.7; no status change). Earlier the same day: 2026-11-12 (Owner answers for M3-03 recorded in §2.6; no status change). Earlier the same day: 2026-11-12 (§2.5 folder check dated 2026-11-12; dates aligned with M3-10 review finding 4; no status change). Earlier: 2026-11-11 (Owner answers for M3-10 recorded in §2.5; no status change). Earlier the same day: 2026-11-11 (review M3-02 fixes: DEC-005 "Still open" pointer to §2.4 P4c; DEC-006 upgrade review trigger; no status change). Earlier: 2026-11-10 (Owner answers for M3-02/M3-01 recorded in §2.4; no status change). Earlier the same day: DEC-006, DEC-007, DEC-013 Accepted; DEC-004/005 evidence and DEC-018 Node pin recorded (§2.1); M2 spike evidence proposal §2.3. Earlier: 2026-11-08 (columns Approver and Decided added, PUB-DU-14 of spec `01-publication-platform-foundation`; Owner decisions recorded from the 2026-11-08 session, see `.kiro/specs/03-architecture-technical-validation/PROTOTYPE-PLAN.md` §1–§2).

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
| DEC-008 | Public and staff identity boundary | PRD §6.4; SRS T-06 | Supabase Auth for public users; Payload staff auth for staff; no implicit role promotion or shared session assumption. | Accepted (M5-01; bukti SPIKE-002, ADR-0003 Accepted; see §2.1, §2.19) | Auth, account, admin, access policy | Security owner + PO | Haidar (Product Owner) | 2026-11-24 |
| DEC-009 | Staff access to exclusive publications | SRS access matrix / T-06 | Deny-by-default; define whether staff use separate public account or an audited staff grant. | Accepted (roles: Public user, Editor, Admin; see §2.1) | Access evaluator, audit, tests | PO + Security owner | Haidar (Product Owner) | 2026-11-09 |
| DEC-010 | Authorization and entitlement model | PRD D-06; SRS §4 | Server-side authorization; explicit entitlement; RLS for app-user data; Payload access control for CMS. | Proposed (diajukan Accepted untuk bagian `registered`, menunggu persetujuan Owner; evaluator M5-03 di `lib/access/evaluator.ts`, bukti §2.20; bagian subscriber tetap M7-02) | Access policy, APIs, storage, tests | Security owner | — | — |
| DEC-011 | Publication-level vs asset-level access | PRD §8; SRS Publication model | Preserve publication `access_level`; evaluate per-asset override with effective access as the stricter of inherited and asset rules. | Accepted (effective access is the stricter of publication and file; `accessLevel` on each file is required and stores all three levels; see §2.1, §2.14) | Asset schema, CMS, storage, access tests | PO + Engineering | Haidar (Product Owner) | 2026-11-16 |
| DEC-012 | File storage and private delivery | SRS T-03 | Object storage; public files only in public locations; exclusive files private and served after server authorization. Validate Payload adapter. | Proposed (M3-08 proves private bucket + server check + 60 s signed download for `public` files, §2.14; M3-13 adds the public toolkit PDFs in the same bucket under `toolkits/`, §2.17; `registered` delivery built in M5-04 and diajukan Accepted untuk bagian `registered`, menunggu persetujuan Owner (§2.20); `subscriber` waits for M7-03) | Upload, download, backup, provider cost | Engineering + Security | — | — |
| DEC-013 | Search scope and engine | PRD §9; SRS T-04 | Start with PostgreSQL FTS; `pg_trgm` only where tests justify; PDF full text remains out until extraction spike. | Accepted (start with PostgreSQL FTS; see §2.1; M3-06: §2.12, ADR-0007 Accepted) | Search schema, indexing, UX | Engineering + PO | Haidar (Product Owner) | 2026-11-10 |
| DEC-014 | Learning Hub MVP scope | PRD D-04 | Catalog + external embeds as baseline; no LMS progress, certificates, or assessments unless approved. | Accepted (launch scope 2026-11-12; details decided 2026-11-17: resource types, Topic as theme, field-localized bilingual model, routes, YouTube facade, toolkit storage, catalog structure; see §2.1, §2.16) | Scope, schema, page specs | PO / Learning Lead | Haidar (Product Owner) | 2026-11-12 |
| DEC-015 | Editorial workflow | PRD D-05 | Define draft, review, approval, schedule, publish, unpublish, revise, archive and responsibility. | Accepted (minimum workflow; see §2.1) | Payload workflow, role, content guide | Editorial Lead | Haidar (Product Owner) | 2026-11-08 |
| DEC-016 | Staff roles and operational admin scope | PRD D-07; SRS T-07 | Minimum Admin and Editor; Reviewer/Finance only if workflow justifies. Separate editorial and entitlement permissions. | Accepted (Admin and Editor; both may publish; see §2.1) | CMS access, dashboard routes | PO + Security owner | Haidar (Product Owner) | 2026-11-08 |
| DEC-017 | Hosting platform and database region | PRD D-10; SRS T-08 | Vercel + Supabase is the baseline proposal; confirm region, commercial plan, cost, backup, and runtime compatibility. | Proposed | Deployment, latency, budget, operations | PO + Engineering | — | — |
| DEC-018 | Package manager and runtime | Repository has `bun.lock`; Claude discussion | Determine whether Bun is package manager only or runtime too; pin versions and validate CI/deploy compatibility. | Accepted (Bun = package manager, Node.js = runtime; see §2.1) | Local setup, CI, deployment | Engineering | Haidar (Product Owner) | 2026-11-09 |
| DEC-019 | Email delivery | SRS T-09 | Select transactional email provider after sender-domain and deliverability requirements are known. | Accepted for Supabase Auth email (Resend as custom SMTP, sender domain `mahira.id`; DMARC, Production send limits, and privacy text in M4; see §2.1, §2.19) | Auth verification, reset, notifications | Engineering + Operations | Haidar (Product Owner) | 2026-11-24 |
| DEC-020 | Privacy, retention, and legal basis | PRD risk §11; SRS T-10 | Inventory personal data and processing purposes now; legal interpretation requires qualified review. | Open — high | Signup, logs, analytics, legal copy | Organization + legal advisor | — | — |
| DEC-021 | SEO and publication discoverability policy | SRS FR-007 / NFR-001 | Public metadata is indexable; account/admin noindex; decide treatment of gated body and structured data per page type. | Accepted (see §2.1) | Routing, pages, canonical, sitemap | SEO owner + PO | Haidar (Product Owner) | 2026-11-08 |
| DEC-022 | Observability and analytics | SRS NFR-010 / PRD KPI | Separate operational telemetry from product analytics; minimize personal data. | Open | Monitoring, event schema, privacy | Engineering + PO | — | — |
| DEC-023 | Backup, recovery, and retention targets | SRS NFR-011 | Define RPO/RTO and restore evidence before production; provider defaults are not acceptance criteria. | Open | Ops, cost, launch gate | Engineering + PO | — | — |
| DEC-024 | Design-token source of truth | PDD §14 | `app/globals.css` is proposed runtime canonical if confirmed by implementation; docs describe, not duplicate runtime values. | Accepted (`app/globals.css` is the single runtime token source; `lib/design/tokens.ts` holds the five values code cannot read from CSS; see §2.1, §2.15) | UI implementation, PDD updates | Design/Frontend Lead | Haidar (Product Owner; the role is not appointed, B-03) | 2026-11-17 |

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
- **Still open (not decided by this record):** the default locale as a named setting (jawaban Owner: §2.4 P4c), the search URL pattern (DEC-013), taxonomy and other route segments (topics, publication types, account; learning hub decided 2026-11-17, §2.16 decision 7; about decided in §2.15), and query-string canonicalization beyond the `noindex` rule of DEC-021. ADR-0005 lists them.
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
- **Implementation (M3-07, 2026-11-15; no status change):** Owner answers 1–10 are in §2.13 (canonical `https://mahira.id` also on Preview, `?page=n` indexable without filters, hreflang only for public pairs, dynamic sitemap and robots, OG/Twitter with generated image, no JSON-LD, 308 for old slugs, `htmlLimitedBots` and global 404 adopted, no type/topic routes). Spec 01 PUB-OQ-39 (structured data) stays open. Evidence: TEST-PLAN §12.2, CHANGELOG [M3-07].

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

- **DEC-006 — CMS selection and application topology.** Payload CMS 3 (3.93.0 tested) embedded in the single Next.js 16.4.4 application. *Not decided:* how to handle the `cacheComponents` log noise in the admin (SPIKE-001 §8); resolve in M3-02 (jawaban Owner: §2.4 P2). *Upgrade review trigger (recorded 2026-11-11, review M3-02 finding 4; not a status change):* the DEC-004 row lock in `payload/db/lock-translation-group.ts` reads an internal structure of `@payloadcms/drizzle` (`adapter.sessions[transactionID].db`). On every Payload upgrade the race check must be rerun and pass (ENG-ENV-001 §3.1). *Second upgrade review trigger (recorded 2026-11-13; Owner approved the config change 2026-11-12, "kerjakan butir 1"; not a status change):* `next.config.ts` sets `serverExternalPackages: ["payload"]` so pages, `/admin`, and the REST routes share one copy of `payload` in production builds; `withPayload` 3.93.0 externalizes `payload` only in dev. On every Payload or Next upgrade, re-check whether the setting is still needed or needs more packages, and rerun HP8/HP9 (`bun run test:integration --only homepage`) until they pass (ENG-ENV-001 §3.1, TEST-PLAN §12.5, §12.7). *Third upgrade review trigger (recorded 2026-11-13; Owner answer 3 a for item 1b, §2.9; not a status change):* `payload/payload.config.ts` wraps the adapter's `db.init` (`handleInitFailure`, commit `311683f`) and attaches a handler to the internal `initializing` promise of `@payloadcms/db-postgres` 3.93.0, which the adapter rejects when the connect in `payload.init` fails and which nothing else awaits during init. On every Payload upgrade, check in `node_modules/@payloadcms/db-postgres/dist/connect.js` and `dist/index.js` that `initializing` still exists and is still rejected on a failed connect, and rerun `bun run test` until DB1/DB2 in `tests/unit/db-connection.test.ts` pass (ENG-ENV-001 §3.1, TEST-PLAN §12.7). *Fourth upgrade review trigger (recorded 2026-11-13; Owner answer 1 A for item 1c and the orchestrator addition, §2.10; not a status change):* (1) `app/(payload)/admin/[[...segments]]/page.tsx` is generated by Payload and marked "DO NOT MODIFY"; it now awaits `connection()` before `RootPage` (commit `a5321de`). If the file is regenerated or replaced on a Payload upgrade, re-apply the edit. (2) `proxy.ts` assumes Payload's auth cookie is `payload-token` (`cookiePrefix` default `payload`; `payload/payload.config.ts` does not set it) and repeats Payload's public admin route list (`isPublicAdminRoute` in `@payloadcms/next/dist/utilities/isPublicAdminRoute.js`, default `admin.routes`). On every Payload upgrade, check both; on every Payload or Next upgrade, rerun `bun run test` (PX1–PX6 in `tests/unit/proxy.test.ts`) and `bun run test:integration --only admin` (AD1–AD7) until they pass, and repeat the browser login check (ENG-ENV-001 §3.1, TEST-PLAN §12.7). On a Next upgrade, also check whether [vercel/next.js#92767](https://github.com/vercel/next.js/issues/92767) is fixed. *M3-13 upgrade review trigger (recorded 2026-11-19; DECISIONS §2.17; not a status change):* (1) `lib/cms/publication-file-storage.ts` signs `toolkits/<filename>` itself, so it repeats the key layout of the second `s3Storage` instance (`prefix: "toolkits"` for `toolkit-files` in `payload/payload.config.ts`). On every Payload or `@payloadcms/storage-s3` upgrade, confirm that the adapter still stores an upload at `<prefix>/<filename>` (TK4 and TK7 fail otherwise). (2) Two `s3Storage` instances (`publication-files`, `toolkit-files`) share one `clientUploads` setup and the endpoint `POST /api/storage-s3-generate-signed-url`; re-check that the presign stays staff-only and that the stored prefix stays `toolkits` (TK9). (3) The publish rule (`requireReadyToolkitFile`) and the live-file guards rely on Payload 3.93.0 writing the main table only when a save is not a draft (`@payloadcms/drizzle` update path) and on a draft save being forced to `_status: draft` before `beforeChange` hooks run; re-run TK2, TK3, TK8, TKU2 and `bun run test:integration --only toolkits,downloads` until they pass. (4) `files` is a non-localized `upload` with `hasMany` on a versioned, field-localized collection and creates `lh_resources_rels` and `_lh_resources_v_rels`; `bun run payload migrate:create --skip-empty` must still write no file after an upgrade (TEST-PLAN §12.7).
- **DEC-007 — Database schema ownership and migration.** Separate Supabase projects: `mahira-cms` holds only Payload's Postgres schema; `mahira.id` holds Auth, Storage, and app tables (§2.2). The CMS schema changes only through committed Payload migrations (`push: false`); every `up()` enables RLS on new tables; every `down()` is reviewed; CI checks `migrate:status`; `migrate:reset` and `migrate:fresh` are never run against shared or production databases. App-schema migration tooling for `mahira.id` is decided when M5 adds app tables. *Consequence:* ADR-0002's single-database text is superseded by this record.
- **DEC-013 — Search scope and engine.** Start with PostgreSQL full-text search using the `indonesian` text-search configuration (present on Supabase; stemming works, stop words do not). `pg_trgm` only where tests justify it. Relevance is tested in M3-06. M3-06 (Owner answers 2026-11-15): §2.12; ADR-0007 Accepted 2026-11-15; implementation notes in ADR-0007 "Implementasi M3-06".
- **DEC-004 and DEC-005 — validation evidence added.** DEC-004: checks 1–3 and 5–7 PASS, check 4 PARTIAL (a client can force fallback with `?fallback-locale=` on REST; fix in M3) (REST anonim ditutup: §2.4 P1). DEC-005: per-locale slug uniqueness proven by index `locale_slug_idx`; route rules (308, 404, trailing slash, `/id`/`/en`) are tested in M3-01/M3-07. Both stay Accepted.
- **DEC-012** is unchanged (Proposed): the public part is proven; private delivery waits for M5-04. *Update 2026-11-16:* M3-08 now also proves, for `public` files, the private bucket `publication-files`, the server-side check, and the 60 s signed download (§2.14); the status stays Proposed because `registered` and `subscriber` delivery (M5-04, M7-03), per-environment keys, and the Preview measurements are still open. *Update 2026-11-19:* M3-13 adds a third use of the same private bucket: the upload collection `toolkit-files` (prefix `toolkits/`, PDF only, no access level because all Learning Hub material is public, 60 s signed attachment URL, shared `clientUploads`), served through `GET /api/learning-hub/files/{id}/download?locale=` (§2.17). The status stays Proposed for the same open reasons: `registered` and `subscriber` delivery (M5-04, M7-03), per-environment keys and the production region (M4), and the Owner Preview check of M3-13.

#### DEC-011 — Publication-level vs asset-level access (2026-11-16)

- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-16, Owner chat session ("Setuju dengan semua saran", §2.14 decision 3, A + 3b(ii)).
- **Decision:** every publication file stores its own `accessLevel` (`public`, `registered`, `subscriber`). The field is required and has no default. Effective access is the stricter of the publication level and the file level; a looser file level has no effect. Files of level `registered` or `subscriber` may be uploaded to the private bucket but are hidden on the public site until M5; their download belongs to M5 (`registered`) and M7 (`subscriber`).
- **Recorded deviation:** DEC-002 says restricted assets of public publications are shown locked, without a URL. Until M5 they are not shown at all, consistent with §2.11 P7 A. **Dicabut untuk level `registered` oleh M5-03/M5-04 (§2.20, 2026-11-24):** file `registered` kini tampil terkunci; `subscriber` tetap tersembunyi sampai M7.
- **Affected documents:** ACCESS-POLICY §4.2, DATA-MODEL §4.2/§10, ERD, API-SPECIFICATION §5.1, SRS FR-008, TEST-PLAN §12.
- **Review trigger:** M5 starts showing locked files, or a file level looser than its publication needs to be honored.

#### DEC-014 — Learning Hub launch scope (2026-11-12)

- **Status:** Accepted. Launch scope decided 2026-11-12; the remaining details decided 2026-11-17 (§2.16). **Approver:** Haidar (Product Owner). **Decided:** 2026-11-12, Owner chat session, relayed by the orchestrator (Q2 A in §2.8); details 2026-11-17 (§2.16, "Setuju semua, kecuali butir 3 ... aku setuju dengan 3A").
- **Decision (Q2 A):** the Learning Hub is required at launch. Launch scope: a catalog grouped by theme, embedded YouTube videos and playlists, guides, and toolkits that anyone can download. No login, progress tracking, quizzes, or certificates.
- **Decided 2026-11-17 (§2.16; formerly "Still open"):** four resource types (`video`, `playlist`, `guide`, `toolkit`); a guide is a structured text page (the About section model); the theme is the existing Topic ("Bidang kerja"), one primary theme per resource; one record per resource, field-localized ID/EN with fallback off, plus a "Versi EN siap tayang" checkbox and a "Bahasa materi" label (this differs from the linked-record model of publications, DEC-004); video and playlist play in the catalog, guide and toolkit have detail pages; routes `/{locale}/learning-hub` and `/{locale}/learning-hub/{slug}` (the "learning hub" item of DEC-005 "Still open" is closed); YouTube embed through a click-to-load facade on `youtube-nocookie.com`; toolkit storage in the private bucket `publication-files` (separate collection and prefix, built in M3-13). DEC-012 stays Proposed.
- **Reference:** https://www.cips-indonesia.org/cips-learning-hub, for structure only. Its identity and assets are not copied.
- **Affected documents:** PRD §6.2, §7, §10, §12 D-04, §13 AC 9; SRS FR-018, FR-019, FR-029, §5.1, §13, §14; CONTENT-ARCHITECTURE; DATA-MODEL §4.5; PAGE-SPECIFICATIONS §9; IA-ROUTING-I18N §3.1; TEST-PLAN §3; TRACEABILITY-MATRIX; RELEASE-CHECKLIST §1; MILESTONES M3-11 to M3-13; ERD; EDITORIAL-WORKFLOW; SEO-SPECIFICATION; IA-ROUTING-I18N; ENVIRONMENTS §3.1.
- **Validation evidence:** scope decision needs none. M3-11/M3-12 implement and test the decided details (CHANGELOG [M3-11], [M3-12]; TEST-PLAN §12); M3-13 implements and tests the toolkit downloads (CHANGELOG [M3-13]; DECISIONS §2.17; TEST-PLAN §12.2; PRD §13 AC 9). The Owner Preview check of M3-13 (ENVIRONMENTS §3.1 "Toolkit Learning Hub (M3-13)") is still pending.
- **Review trigger:** a Learning Lead is named, a request appears for login, progress tracking, quizzes, or certificates, or the Owner widens the toolkit formats beyond PDF (needs a new decision, §2.16 decision 9).

#### DEC-024 — Design-token source of truth (2026-11-17)

- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-17, Owner chat session (§2.15 decision 9, "1A, 2A, 3A, 4A, 5A, 6A, 7B, 8A, 9A, 10A, 11A, dan 12"). **Catatan approver:** approver yang tercantum di register adalah "Design/Frontend Lead"; peran itu belum diangkat (B-03), jadi Owner memutuskan sebagai Product Owner.
- **Decision:** `app/globals.css` adalah satu-satunya sumber token runtime (`@theme` Tailwind 4 dan properti CSS kustom). Aturan CSS hanya memakai `var(--…)`; nilai hex hanya muncul di definisi token. Lima nilai warna yang tidak dapat membaca CSS (`themeColor` di tiga root layout dan gambar OG) ada di `lib/design/tokens.ts`, dan `tests/unit/design-tokens.test.ts` gagal bila nilainya berbeda dari CSS atau bila hex muncul di tempat lain. PDD §14 dan `docs/design/DESIGN-TOKENS.md` menjelaskan nama dan makna token, tidak menyalin nilai runtime.
- **Evidence:** perbandingan computed style sebelum/sesudah pada homepage, indeks, detail, 404, dan tiga gambar OG: 0 perbedaan (CHANGELOG [M3-09]).
- **Affected documents:** PDD §14, DESIGN-TOKENS.md, `.kiro/steering/structure.md`, TEST-PLAN §12.
- **Review trigger:** Design/Frontend Lead diangkat dan menolak pemisahan `lib/design/tokens.ts`, atau warna baru/mode gelap disetujui.

#### DEC-008 — Public and staff identity boundary (2026-11-24)
- **Status:** Accepted. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-24, Owner chat session (§2.19 keputusan 1, "setuju"). **Catatan approver:** register menyebut "Security owner + PO"; Security owner belum diangkat (B-03), jadi Owner memutuskan sebagai PO (§2.18 keputusan 16).
- **Decision:** pengguna publik memakai Supabase Auth (project APP `mahira.id`); staf (Editor, Admin) memakai Payload Auth. Tanpa federasi, sesi bersama, atau pemetaan role berdasarkan email; registrasi publik tidak pernah membuat atau menaikkan role staf; setiap operasi sensitif memverifikasi penyedia identitasnya sendiri di server. ADR-0003 Accepted bersamaan.
- **Evidence:** SPIKE-002 "Hasil M5-01" (integrasi `auth` 10/10, `auth-boundary` 5/5, `account-pages` 8/8, admin AD1–AD7, rusak-sengaja) dan cek Owner di Preview A–K 2026-11-24, termasuk F (login → akun tanpa bounce) dan I (admin staf tetap berfungsi saat ada sesi publik).
- **Affected documents:** ADR-0003, SPIKE-002, ACCESS-POLICY §3.1, API-SPECIFICATION §4.1, ENVIRONMENTS §3.1.
- **Review trigger:** kebutuhan SSO/identitas terpusat, staf yang memerlukan akses file terbatas lewat sesi staf, atau upgrade `@supabase/ssr`/Payload yang mengubah cookie atau sesi.

#### DEC-019 — Email delivery (2026-11-24, scope: Supabase Auth email)
- **Status:** Accepted untuk email Supabase Auth. **Approver:** Haidar (Product Owner). **Decided:** 2026-11-24, Owner chat session (§2.19 keputusan 2). **Catatan:** Owner mengonfigurasi Resend sebelum M4, mendahului rencana §2.18 keputusan 6.
- **Decision:** email konfirmasi dan reset password Supabase Auth (project APP `mahira.id`) dikirim lewat Resend sebagai custom SMTP yang diatur di dashboard Supabase, dengan domain pengirim `mahira.id`. Aplikasi tidak mengirim email sendiri, jadi `RESEND_API_KEY` tidak dibaca kode dan tidak ada di Vercel; email staf Payload tetap ditulis ke log server (tanpa adapter email).
- **Evidence (dicek 2026-11-24, read-only):** domain `mahira.id` berstatus `verified` di Resend (sending aktif, receiving mati, open/click tracking mati, region `ap-northeast-1`); DNS di Cloudflare (`doug`/`katelyn.ns.cloudflare.com`) memuat MX dan SPF untuk `send.mahira.id` serta DKIM `resend._domainkey.mahira.id`; `_dmarc.mahira.id` belum ada. Cek Owner di Preview A–K lulus dengan email terkirim.
- **Sisa untuk M4:** record DMARC; batas kirim Supabase Auth untuk Production (Authentication → Rate Limits); kebijakan privasi menyebut Resend sebagai pemroses alamat email dan region pengirimannya (DEC-020); adapter email Payload untuk staf bila dibutuhkan (keputusan baru).
- **Review trigger:** aplikasi perlu mengirim email sendiri (newsletter M6, notifikasi), keluhan deliverability, atau perubahan provider.

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
- **Learning Hub — OPEN, diputuskan 2026-11-17 (§2.16):**
  - model konten dan jenis materi;
  - relasi ke Topic/"Bidang kerja";
  - model bilingual;
  - route (butir "learning hub" di DEC-005 "Still open");
  - penyimpanan file toolkit (bagian publik DEC-012);
  - halaman detail per materi vs embed langsung di katalog.
- **Struktur milestone.** ID lama tidak di-renumber. Urutan eksekusi: M0 → M1 → M2 → M3 → M5 → M4 (launch) → M6 / M7.
  - M3 menjadi "MVP — Platform publikasi + Learning Hub", dengan task baru (M3-11 dan M3-12 akhirnya dikerjakan dalam satu run, §2.16 keputusan 1; M3-13 tetap terpisah):
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
- **P7 detail dan akses — A (diamandemen, lihat bawah; dicabut untuk level `registered` oleh §2.18 keputusan 11 dan §2.20: detail `registered` kini punya halaman, `subscriber` tetap tidak):** hanya publikasi published + `public` di locale itu yang punya halaman. Isi: breadcrumb, jenis, bidang kerja (utama dulu), tanggal terbit bila ada, bahasa, H1, ringkasan penuh per paragraf, penulis, badge akses, `coverImage` bila ada (alt dari Media) atau cover tipografis. Tanpa panel unduhan (M3-08), publikasi terkait, isi, sitasi, bagikan. `<title>` = judul, description = ringkasan; canonical/hreflang/OG di M3-07. Route detail blocking.
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
- **P7 A, bagian status (sejak M5-03 `registered` layak dan punya halaman bila akun publik hidup, §2.20):** slug tidak dikenal atau tidak layak (draft, `registered`, `subscriber`, locale lain, huruf besar, pola tidak valid) → `notFound()`: HTTP 200 + `<meta name="robots" content="noindex">` + halaman not-found. Bukan "HTTP 404 sungguhan".
- **P15 A, bagian detail:** gagal baca → halaman merender state galat berbahasa locale di server (`data-publication-error`, tautan muat ulang), HTTP 200 + `noindex, follow`; HTML tidak memuat host DB. Bukan "HTTP 500". `error.tsx` tetap untuk galat tak terduga.
- **Item terbuka M3-07 (SEO):** evaluasi `htmlLimitedBots` terbatas untuk user agent crawler (mis. Googlebot, Bingbot) agar crawler mendapat 404/500 sungguhan sementara pengunjung tetap streaming. Belum diuji; perlu perubahan `next.config.ts` dan wajib mengulang cek DEC-006 dan §2.10. `next.config.ts` dan `proxy.ts` tidak diubah di M3-05.

- **Kode dan bukti:** branch `feat/m3-05-publication-index-detail` (basis `origin/master` `77990f9`): indeks `c4d5385` + tes `fe52d14`; detail `ded3b57` + tes `a77c0f6`; pratinjau `4292bdf` + tes `54291c5`, `5e2ef08`; dokumen `b1dd298`; `generateMetadata` indeks menunggu `connection()` `b3966c3`; dokumen penutup (MILESTONES, CHANGELOG) sesudahnya. SHA ini tetap sesudah `git fetch` 2026-11-14, karena `origin/master` masih `77990f9` dan rebase tidak mengubah apa pun. File utama: `app/[locale]/publications/page.tsx`, `app/[locale]/publications/[slug]/page.tsx`, `app/api/preview/route.ts`, `app/api/preview/exit/route.ts`, `lib/cms/public-content.ts` (`getPublicationIndex`, `getPublicationDetail`), `lib/cms/staff-preview.ts` (satu-satunya bacaan draf), `lib/publications/{index-params,index-view,detail-view,preview,dates}.ts`. Hasil cek: TEST-PLAN §12.2 (per fitur) dan CHANGELOG [M3-05] (run penuh pada tree final); status: MILESTONES M3-05.

### 2.12 Jawaban Owner 2026-11-15 untuk M3-06 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-15 atas pertanyaan planner untuk M3-06 (search dasar PostgreSQL FTS, DEC-013), diteruskan orchestrator, verbatim: "Setuju semua, dan ya saya setuju dengan update ADR-0007 yang harusnya sudah accepted." = P1 sampai P11 di bawah. Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1 (DEC-013 sudah Accepted 2026-11-10). Rincian: ADR-0007 (bagian "Implementasi M3-06"), PAGE-SPECIFICATIONS §3 ("Implementasi M3-06"), TEST-PLAN §12.

- **P1 kolom yang dicari:** judul, ringkasan, nama penulis, nama Jenis (publication type) dan nama Bidang kerja (topic). Tanpa isi (body). Isi PDF tetap di luar (DEC-013).
- **P2 bahasa:** hanya versi di locale route. `/id` memakai konfigurasi teks Postgres `indonesian` (stemming jalan, stop word tidak); `/en` memakai `english`.
- **P3 gabungan dengan filter:** `q` digabung dengan filter Jenis/Bidang kerja/Tahun secara AND dalam satu form GET yang jalan tanpa JavaScript. Urutan URL `?q=&type=&topic=&year=&page=`; nilai kosong dihilangkan; menerapkan pencarian atau filter kembali ke halaman 1.
- **P4 urutan:** tanpa kontrol urutan dan tanpa parameter `sort`. Dengan `q`: urut relevansi (bobot judul > ringkasan > taksonomi/penulis) dengan pemecah seri deterministik. Tanpa `q`: urutan M3-05 yang ada (§2.11 P4 A).
- **P5 pencocokan:** kata utuh dengan stemming, ditambah prefiks pada kata terakhir ("ekon" cocok dengan "ekonomi"). `pg_trgm` hanya bila tes relevansi membuktikan perlu (DEC-013).
- **P6 penyimpanan indeks:** planner memilih dari bukti antara (A) kolom `tsvector` + indeks GIN lewat migrasi Payload yang di-commit, dan (B) `to_tsvector` saat query tanpa migrasi. Bila A, Owner sudah MENYETUJUI migrasi itu ditulis dan diterapkan ke database bersama `mahira-cms` pada run ini, dengan RLS aktif di `up()` (aturan repo). Pilihan dan alasannya dicatat di dokumen. Akun staf Owner tidak pernah diubah. **Fakta pilihan planner (bukan jawaban Owner): 6B; tidak ada migrasi yang ditulis dan tidak ada yang diterapkan ke `mahira-cms`.** Bukti dan pemicu evaluasi ulang 6A: ADR-0007 "Implementasi M3-06".
- **P7 baris hasil:** sama dengan baris indeks M3-05, tanpa penyorotan (highlight).
- **P8 input dan pesan:** nilai `q` ditampilkan lagi di kolom pencarian. Pesan tanpa hasil "Tidak ada publikasi yang cocok dengan pencarian ini." (plus padanan EN), tanpa mengutip kata pencarian. Panjang maksimum `q` 100 karakter.
- **P9 lokasi kotak pencarian:** tidak ada kotak pencarian di header atau homepage pada M3-06; hanya di indeks.
- **P10 tes relevansi:** memakai fixture sintetik ID/EN berawalan `fixture-test-` dengan hasil teratas yang diharapkan; Owner menguji konten nyata di Preview sesudahnya.
- **P11 ADR-0007:** status Accepted, merujuk DEC-013 (Accepted 2026-11-10, Haidar, Product Owner) dan jawaban M3-06 ini; kolom approver/owner diisi sesuai.

**Usulan planner (bukan keputusan Owner; tidak ada masukan Owner yang diharapkan):** perilaku `q` lebih dari 100 karakter, `q` tanpa token yang bisa dicari, cara query FTS tetap berada dalam jaminan lapisan baca publik, varian `data-index-state`, dan runner integrasi per file (`--only`) didokumentasikan sebagai usulan di ADR-0007 "Implementasi M3-06" dan PAGE-SPECIFICATIONS §3 "Implementasi M3-06".

- **Kode dan bukti:** branch `feat/m3-06-search` (basis `origin/master` `3480eb4`): backend `e370c05`, tes `91f3489`, dokumen ADR/TEST-PLAN `a83bca7`, field pencarian `f2f4e0f`, tes UI `194f003`, dokumen halaman `8a30d15`, lalu commit dokumen penutup (MILESTONES, CHANGELOG, DECISIONS). File utama: `app/[locale]/publications/page.tsx`, `components/publication/index-filters.tsx`, `lib/cms/publication-search-query.ts`, `lib/cms/public-content.ts` (`getPublicationIndex`), `lib/publications/{index-params,index-view,search-terms}.ts`. Hasil cek: TEST-PLAN §12.2 dan CHANGELOG [M3-06]; status: MILESTONES M3-06.

### 2.13 Jawaban Owner 2026-11-15 untuk M3-07 (catatan, bukan perubahan status)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-15 atas sepuluh pertanyaan planner untuk M3-07 (SEO, DEC-021), diteruskan orchestrator, verbatim: "saya setuju dengan saran" = keputusan 1 sampai 10 di bawah. Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1 (DEC-021 sudah Accepted 2026-11-08). Rincian: PAGE-SPECIFICATIONS §2–§4, IA-ROUTING-I18N §4–§8, SEO-SPECIFICATION §11, ADR-0005, DATA-MODEL §4.8, EDITORIAL-WORKFLOW §9, ENVIRONMENTS §3.1, TEST-PLAN §12.

1. Domain canonical selalu `https://mahira.id`, juga di Preview. Preview tetap `noindex` dan di balik Vercel Authentication.
2. Canonical ke dirinya sendiri di setiap halaman yang dapat diindeks. Halaman 1 tanpa `?page`; `?page=n` tanpa filter dapat diindeks (§2.11 P3 A). URL dengan `q` atau filter apa pun tetap `noindex, follow` dan tanpa canonical.
3. hreflang: `/id/publications` ↔ `/en/publications`. Halaman detail hanya mengeluarkan hreflang bila versi bahasa lain published + `public` (DEC-021). Homepage `/` tidak punya padanan EN. Tanpa x-default.
4. `app/sitemap.ts` dinamis lewat lapisan baca publik: `/`, kedua indeks, dan setiap halaman detail published + `public`. Dengan CMS mati (Production saat ini) isinya hanya `/`. Robots: Production mengizinkan crawling dan mencantumkan sitemap; non-Production menjawab `Disallow: /`.
5. Open Graph + Twitter per halaman: judul, deskripsi, URL, locale; tipe `article` di detail. Gambar: cover bila ada, bila tidak gambar OG tipografis yang dibuat otomatis (judul + logo Mahira) tanpa dependency baru.
6. Tanpa data terstruktur JSON-LD di M3-07 (spec 01 PUB-OQ-39 tetap terbuka).
7. Redirect 308 untuk slug publikasi lama: riwayat slug disimpan per locale, yang mengubah skema. Owner MENYETUJUI migrasi Payload yang di-commit ditulis dan diterapkan ke database bersama `mahira-cms` pada run ini, dengan RLS aktif di `up()` (aturan repo). Akun staf Owner tidak pernah diubah.
8. `htmlLimitedBots`: dicoba di run ini (perlu perubahan `next.config.ts`, disetujui). Diadopsi hanya bila user agent crawler benar-benar menerima HTTP 404 untuk slug detail tidak dikenal atau tidak layak dan cek DEC-006 serta §2.10 lulus; bila tidak, hasil dicatat dan perubahan konfigurasi dikembalikan.
9. `app/global-not-found.tsx` dengan `experimental.globalNotFound`: halaman 404 Mahira dwibahasa ID/EN untuk URL yang tidak cocok dengan route (`/foo`, `/id`, `/en`, `/id/foo`, `/xx/publications`). Syarat sama dengan keputusan 8 (diadopsi hanya bila berfungsi dan cek DEC-006/§2.10 lulus; bila tidak, dicatat dan dikembalikan).
10. Tanpa route jenis/topik di M3-07 (§2.11 P6 A) sampai taksonomi final (B-04).

**Hasil keputusan 8 dan 9 (2026-11-15): keduanya DIADOPSI (commit kode `a71e4d6`, dokumen `5da439d`).**

- **Keputusan 8:** `next.config.ts` memuat `htmlLimitedBots = lib/seo/html-limited-bots.ts`, yaitu daftar bawaan Next 16.4.4 ditambah `|Googlebot` (Googlebot adalah bot "dom" di luar daftar bawaan, jadi sebelumnya mendapat static shell HTTP 200). Probe `next start` dengan env lengkap, sebelum → sesudah: Googlebot untuk slug tidak dikenal, `registered`, dan huruf besar 200 → **404**; slug lama 200 → **308** ke slug baru; Bingbot sudah 404/308; Chrome dan tanpa user agent tetap 200 (amandemen §2.11 P7 A tetap berlaku untuk pengunjung). Biaya: setiap crawler di daftar mendapat render dinamis penuh (baca CMS per request) untuk semua halaman Cache Components, bukan static shell.
- **Keputusan 9:** `experimental.globalNotFound: true` + `app/global-not-found.tsx`. `/foo`, `/id`, `/en`, `/id/foo` menjawab 404 + `noindex` dengan halaman Mahira dwibahasa (sebelumnya halaman bawaan Next berteks Inggris); tautan ke indeks hanya saat CMS hidup. **Celah yang dicatat (PP11):** `/xx/publications` (`notFound()` dari layout `[locale]`) tetap halaman 404 bawaan Next dengan HTTP 404. Turbopack Next 16.4.4 memakai file itu walau flag `false`; flag tetap `true` (API terdokumentasi, loader webpack menghormatinya; tes HB3).
- **Cek DEC-006 / ENVIRONMENTS §3.1 / §2.10 sesudah perubahan `next.config.ts`: LULUS.** `bun run lint` 0 galat; `tsc --noEmit` 0; unit 168/168 (PX1–PX6, DB1/DB2, HB1–HB3); integrasi `--skip-build --only homepage,admin,locale,detail,redirect` di build tree akhir: locale 42/42, homepage 10/10 (HP8, HP9), admin 7/7 (AD1–AD7), detail 13/13, redirect 9/9; `.nft.json` halaman `/`, route `/api/[...slug]`, halaman admin, dan kedua halaman publikasi tetap memuat `node_modules/payload`; langkah login admin §2.10 2–5 lewat Playwright MCP dengan Editor fixture sementara (dihapus; akun Owner tidak disentuh): lulus, tidak ada kembali ke `/admin/login` sesudah submit; build-matrix `absent` lulus. Gerbang akhir mengulang matriks penuh (absent, prodsim, partial, full) dan integrasi 203/203.
- **Uji rusak-sengaja:** daftar tanpa `|Googlebot` + `globalNotFound: false` → HB1–HB3, DT11, DT13, RD9 gagal (GNF1 tetap lulus karena Turbopack); file `global-not-found.tsx` dihapus → GNF1.1–GNF1.4 gagal; tautan indeks selalu dirender → G10.1/G10.2 gagal. File dipulihkan dengan SHA-256 sama. Bukti: TEST-PLAN §12.2 (hasil M3-07 keputusan 8 dan 9), CHANGELOG [M3-07].

**Migrasi keputusan 7:** `payload/migrations/20261115_054138_m3_07_publication_slugs` (tabel `publication_slugs`, enum locale, indeks unik `(locale, slug)`, FK ke `publications`, kolom `payload_locked_documents_rels`, backfill 16 baris dari record published + `public`, `enableRlsOnPayloadTables` terakhir di `up()`). **Diterapkan ke `mahira-cms` (batch 4)** atas persetujuan Owner; `migrate:status` sebelum: 4 migrasi Ran, sesudah: 5/5; `db-invariants` I1 users = 1 (akun Owner utuh). Cek `up()`/`down()` dalam transaksi yang di-rollback lulus, uji rusak-sengaja "tanpa RLS" dan "tanpa DROP" gagal sesuai harapan (TEST-PLAN §12.2).

**Risiko operasional yang harus diketahui (review akhir, LOW):** migrasi sudah diterapkan ke `mahira-cms` bersama, sedangkan kode hook `beforeDelete` baru masuk ke `master` saat branch ini merge. Sampai itu, deployment CMS-hidup dari kode lama (Preview `master`, `master` lokal) tidak menghapus baris `publication_slugs` lebih dulu. Admin yang menghapus publikasi published + `public` di sana gagal dengan pelanggaran not-null pada `publication_id` (FK `ON DELETE set null`); transaksi di-rollback, tidak ada data hilang. Dengan branch ini hook menghapus baris lebih dulu (RD7). Migrasi tidak diedit karena sudah diterapkan.

**Usulan planner (bukan keputusan Owner; tidak ada masukan Owner yang diharapkan):** PP1–PP11 di rencana tugas M3-07 (penyimpanan `publication-slugs`, rantai slug satu hop, sitemap per request tanpa cache, gambar OG lewat `next/og` dengan font Hanken Grotesk OFL, Preview tanpa header noindex dari aplikasi, `og:locale` `id_ID`/`en_GB`, aturan adopsi keputusan 9) didokumentasikan di dokumen yang disebut di atas, bukan sebagai keputusan.

**Tidak dilakukan (sesuai keputusan):** JSON-LD (6), route jenis/topik (10), x-default (3), hreflang di homepage (3).

- **Kode dan bukti:** branch `feat/m3-07-seo` (basis `origin/master` `6fd5e16`, merge PR #19): slug lama `3bde69d` (kode) + `4f1d1a0` (dokumen); SEO `3ec4aa8` + `34c532b`; keputusan 8 dan 9 `a71e4d6` + `5da439d`; lalu commit dokumen penutup (MILESTONES, CHANGELOG, DECISIONS). File utama: `payload/collections/PublicationSlugs.ts`, `payload/hooks/publication-slugs.ts`, `lib/cms/public-content.ts` (`getPublicationRedirect`, `getSitemapPublications`, `getPublicPublicationTitle`), `lib/seo/{site,metadata,og-image,html-limited-bots}.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/og/**`, `app/global-not-found.tsx`, `next.config.ts`. Hasil cek: TEST-PLAN §12.2 dan CHANGELOG [M3-07]; status: MILESTONES M3-07.

### 2.14 Jawaban Owner 2026-11-16 untuk M3-08 (DEC-011 menjadi Accepted; DEC-012 tetap Proposed)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-16 atas pertanyaan planner untuk M3-08 (unduhan file publik; `access_level` tersimpan sejak awal), diteruskan orchestrator, verbatim: "Setuju dengan semua saran, aku juga telah membuat bucket private dengan ketentuan ukuran file 50MB dan MIME `application/pdf` dengan nama `publication-files`." = keputusan 1 sampai 12 di bawah. Bagian ini mengubah status DEC-011 menjadi Accepted (baris di §2 dan record di §2.1, diputuskan 2026-11-16). DEC-012 tetap Proposed. Rincian: SRS FR-008 dan §8, API-SPECIFICATION §5.1, ACCESS-POLICY §4.2, DATA-MODEL §4.2/§10, ERD, PAGE-SPECIFICATIONS §4, EDITORIAL-WORKFLOW §9.4, SPIKE-003 §8/§11, ENVIRONMENTS §3.1, TEST-PLAN §12.

1. **A, model file.** Koleksi upload Payload baru `publication-files`, terpisah dari `media`. Setiap file milik tepat satu record publikasi (satu bahasa); setiap Publication punya daftar file berurutan. Field file: label, jenis (enum DATA-MODEL §4.2 tanpa `cover`: preview, full_document, appendix, dataset, supplementary, other), bahasa dokumen, `accessLevel`, dan status yang diisi sistem. Payload memegang metadata aset, sehingga menjawab DATA-MODEL §10 Q3. File bukan field bersama DEC-004.
2. **A, penyimpanan dan pengiriman.** File disimpan di private bucket `publication-files`. Tautan unduhan menuju route aplikasi, yang memeriksa di server bahwa publikasi published + `public` di locale itu, file berstatus siap, dan akses efektif `public`. Bila semua lolos, route menjawab 307 ke signed URL dengan TTL 60 detik. File draf tidak dapat dibuka, dan unpublish berlaku dalam TTL. Staf membuka file lewat admin di bawah access control Payload. Pilih `signedDownloads`/presigner bawaan adapter (ada di storage-s3 3.93.0). **Penyimpangan tercatat:** kalimat SRS "file unduhan publik disimpan pada lokasi storage yang memang dapat diakses publik" diamandemen; sebagian M5-04 (mekanisme signed URL + TTL, tanpa login) maju ke M3-08. Cover tetap di bucket publik, sehingga known issue §2.6 P8 tetap berlaku hanya untuk cover.
3. **A + 3b(ii), akses per file (3b(ii) dicabut untuk level `registered` oleh §2.18 keputusan 11 dan §2.20; `subscriber` tetap tersembunyi).** `accessLevel` pada setiap file wajib, tanpa default, dan menyimpan ketiga opsi (`public`/`registered`/`subscriber`) sejak awal. Akses efektif adalah yang lebih ketat antara publikasi dan file; override file yang lebih longgar tidak berpengaruh. **DEC-011 menjadi Accepted.** File `registered`/`subscriber` boleh diunggah ke private bucket tetapi disembunyikan di situs publik sampai M5. **Penyimpangan tercatat** dari DEC-002 ("aset terbatas pada publikasi publik ditampilkan terkunci, tanpa URL"); konsisten dengan §2.11 P7 A. Unduhannya milik M5/M7.
4. **A, upload.** `clientUploads` (browser → bucket lewat PUT bertanda tangan), karena batas body request Vercel Function 4,5 MB (vercel.com/docs/functions/limitations). Kebutuhan CORS diverifikasi di rencana. Hanya PDF, dengan pemeriksaan isi file (`%PDF-`), bukan hanya MIME. Batas ukuran sama dengan bucket (Owner menetapkan 50 MB).
5. **A, bucket dan env.** `spike-m2-public` + prefiks `spike-m2` tetap untuk `media` sampai M4 (DEC-017/020). Preview, lokal, dan tes memakai bersama bucket `publication-files`. Objek tes bernama `fixture-test-` dan dibersihkan. Kunci S3 per environment adalah item M4.
6. **A, route.** `GET /api/files/{fileId}/download`, **penyimpangan tercatat** dari POST di API-SPECIFICATION §5, supaya tautan berfungsi tanpa JS. Setiap penolakan (ID tidak dikenal/tidak valid, draf, unpublished, tidak publik) menjawab 404; kegagalan storage menjawab 503. Header: `Cache-Control: no-store`, `X-Robots-Tag: noindex`. Nama unduhan adalah nama asli yang disanitasi, bila Supabase mendukung `response-content-disposition`. PDF tidak diindeks; halaman detail tetap halaman yang diindeks (DEC-021).
7. **A, UI.** Panel hanya di halaman detail. Setiap file menampilkan label, jenis, bahasa dokumen, "PDF · ukuran", dan tombol "Unduh PDF" / "Download PDF". Tanpa file tidak ada panel. Indeks dan homepage tidak berubah. Pada pratinjau draf staf, file tampil tanpa tautan, dengan catatan bahwa unduhan aktif setelah publikasi.
8. **B, perubahan file pada publikasi tayang.** Mengganti isi file dan menghapus file ditolak selama file terpasang di versi tayang (published). Untuk mengganti, editor mengunggah file baru di draf lalu menerbitkan. Edit label/jenis/`accessLevel` berlaku segera. Didokumentasikan di EDITORIAL-WORKFLOW §9.4.
9. **A.** Tanpa audit, hitungan unduhan, atau rate limit untuk unduhan publik di M3-08. FR-026 mencakup file terbatas (M5). Rate limiting dicatat sebagai item M4. Log server hanya memuat nama galat, tidak pernah URL atau signed URL.
10. **A.** `/api/media/file/*` (sebelumnya HTTP 500, SPIKE-003 §8) menjawab 404, dengan tes.
11. **A, sisa M3-07, hanya dokumen.** Dicatat OPEN di MILESTONES: (a) redirect slug lama untuk browser biasa adalah HTTP 200 + redirect JS di klien, sehingga pengunjung tanpa JS tidak dipindahkan; hanya crawler `htmlLimitedBots` (termasuk Googlebot) mendapat 308 sungguhan. (b) `/xx/publications` masih menampilkan 404 bawaan Next. Bukti penutupan M3-07 dimasukkan ke MILESTONES/CHANGELOG, dan kata "belum di-push / belum cek Preview" dihapus dari M3-07.
12. **Pengaturan run disetujui** (model per langkah, loop review maksimal 2 iterasi, migrasi additive + RLS yang lulus cek `up()`/`down()` dalam transaksi yang di-rollback boleh diterapkan ke `mahira-cms` tanpa jeda).

**Fakta bukan jawaban Owner (hasil implementasi, 2026-11-16):**

- **Bucket diperiksa read-only** oleh planner: `publication-files` ada, privat, batas 50 MB, MIME `application/pdf` (project APP `mahira.id`, ref `dmtbieetvgkvncadbkmd`).
- **Migrasi** `payload/migrations/20261115_181459_m3_08_publication_files`: additive (4 enum, tabel `publication_files`, kolom nullable `publication_files_id` di 3 tabel rels), RLS aktif di `up()`, `IF EXISTS` di `down()`. Cek `up()`/`down()` dalam transaksi yang di-rollback lulus (U1–U12, D1–D4, R1–R2); `migrate:status` sebelum 5 Ran + M3-08 belum, sesudah batch 5. Diterapkan ke `mahira-cms` di bawah persetujuan awal keputusan 12; akun staf Owner tidak diubah.
- **Penandatanganan** lewat `staticHandler` adapter: tanpa dependency baru dan tanpa perubahan lima variabel env CMS (`payload/env.ts`). `proxy.ts` hanya berubah komentar. `next.config.ts` tidak berubah. Catatan DEC-006: handler adapter dipakai dari luar kontrak publik, jadi dicek ulang saat upgrade Payload (ENVIRONMENTS §3.1).
- **Terukur lokal (SPIKE-003 §11):** signed URL ditolak sesudah 61 detik (Range dengan URL kedaluwarsa → 400); unduhan 10 MB yang dimulai dalam TTL selesai utuh 818 detik sesudah penandatanganan; Supabase menghormati `response-content-disposition`; PUT `text/plain` ditolak bucket (415).
- **Belum terukur (hanya di Preview):** PUT dari browser nyata (CORS; preflight saat perencanaan menjawab `Access-Control-Allow-Origin: *`, tanpa tindakan Owner), waktu simpan file 10–50 MB di Vercel, nama file yang disimpan browser, dan unduhan lambat yang melewati TTL di Vercel + Supabase.
- **OPEN, keputusan Owner (review akhir L1):** route belum mengirim `response-content-disposition`, karena adapter menandatangani Bucket + Key saja dan menambah parameter itu butuh dependency langsung `@aws-sdk/s3-request-presigner` (butuh persetujuan Owner). Nama simpan tetap sama dengan nama asli yang disanitasi, tetapi browser dapat membuka PDF inline alih-alih mengunduh. Dicatat di API-SPECIFICATION §5.1.
- **Catatan 2026-11-16: item OPEN `response-content-disposition` di atas ditutup (jawaban Owner).** Jawaban Haidar (Product Owner) 2026-11-16, diteruskan orchestrator, verbatim: "Lalu untuk menanggapi soal route yang belum mengirim apapun di supabase yang sudah mendukung `response-content-disposition`, aku ingin agar pendekatannya tetap menggunakan bawaan dari Supabase. [...] Jadi, jika memang `@aws-sdk/s3-request-presigner` tetap dibutuhkan agar fungsi yang diinginkan bisa diimplementasikan dengan baik, maka aku confirm dan approve dependency ini", lalu atas saran orchestrator: "Untuk saran terkait Content-Disposition aku setuju dengan saran." Saran yang disetujui: route unduhan publik menandatangani GET dengan `@aws-sdk/s3-request-presigner` + `GetObjectCommand` ke endpoint S3 milik Supabase Storage sendiri (kredensial `APP_SUPABASE_URL`/`APP_SUPABASE_S3_*` serta endpoint, `forcePathStyle`, dan region yang sama dengan adapter), dengan `ResponseContentDisposition: attachment` dan nama tersimpan yang disanitasi, sehingga browser mengunduh PDF alih-alih membukanya inline. Alternatif yang ditolak: `createSignedUrl({ download: true })` dari `@supabase/supabase-js`, karena butuh SDK baru dan service-role key sebagai variabel env keenam (cakupan M5). Implementasi commit `5d768ac`: `@aws-sdk/s3-request-presigner` menjadi dependency langsung exact `3.1164.0` (versi di lockfile, disetujui Owner); `@aws-sdk/client-s3` exact `3.1164.0` juga dideklarasikan langsung karena kode mengimpor `GetObjectCommand`/`S3Client` (diberitahukan kepada Owner oleh orchestrator). TTL tetap 60 detik; pemeriksaan sebelum penandatanganan, 404 untuk setiap penolakan, 503, dan kedua header tidak berubah; lima variabel env CMS (`payload/env.ts`) tidak berubah. Kalimat "tanpa dependency baru" dan penandatanganan lewat `staticHandler` di butir **Penandatanganan** di atas berlaku untuk kode sampai `8ae0689`; `staticHandler` kini hanya dipakai route staf. Rincian: API-SPECIFICATION §5.1, SPIKE-003 §11, ENVIRONMENTS §3.1.
- **Batas yang diketahui:** (L2) `X-Robots-Tag: noindex` hanya ada di 307; respons 200 dari storage tidak membawa `noindex`, dan robots Production `Allow: /` (tidak terjadi sekarang karena Production CMS mati; item M4). (L6) bila record client upload ditolak, objeknya tertinggal di bucket privat karena Payload 3.93.0 tidak membersihkannya; objek yatim tidak direferensikan dan privat (SPIKE-003 §11, EDITORIAL-WORKFLOW §9.4).

- **Kode dan bukti:** branch `feat/m3-08-public-downloads` (basis `origin/master` `6e9e916`): backend `d38d292`, dokumen `4d8a190`, panel UI `e5bbede`, dokumen halaman dan tes `08428ae`, perbaikan langkah Preview `52c9766`, perbaikan review L3 `ecacd6d`, lalu commit dokumen penutup (MILESTONES, CHANGELOG, DECISIONS). File utama: `payload/collections/PublicationFiles.ts`, `payload/payload.config.ts`, `app/api/files/[fileId]/download/`, `lib/publications/file-download.ts`, `lib/cms/public-content.ts`, `components/publication/publication-files.tsx`. Hasil cek: TEST-PLAN §12 dan CHANGELOG [M3-08]; status: MILESTONES M3-08.

### 2.15 Jawaban Owner 2026-11-17 untuk M3-09 (DEC-024 menjadi Accepted; DEC-012 tetap Proposed)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-17 atas pertanyaan planner untuk M3-09 (halaman About; satu sumber token desain), diteruskan orchestrator, verbatim: "Aku setuju dengan semua saran anda sebelumnya, yaitu "1A, 2A, 3A, 4A, 5A, 6A, 7B, 8A, 9A, 10A, 11A, dan 12", dan untuk 4b aku pilih tutup risiko dengan menyetujui butir (iii)." Untuk pertanyaan lanjutan 13 sampai 17: "Setuju semua". Tentang unduhan file (catatan M3-08): "Ya, aku setuju untuk mempertahankan konsep fitur unduhan file yang sekarang. Tapi bisa dimasukkan sebagai rencana implementasi post-launch atau ketika akan ekspansi nanti. Aku akan berdiskusi dulu dengan tim terkait fitur preview atau assign signed URL baru setiap buka preview file, bukan URL storage mentah. Jadi bisa dimasukkan ke lingkup Milestone post-launch." Bagian ini mengubah status DEC-024 menjadi Accepted (baris di §2 dan record di §2.1, diputuskan 2026-11-17). DEC-012 tetap Proposed. Isi halaman bersumber dari dokumen Owner 2026-11-17. Rincian: PAGE-SPECIFICATIONS, IA-ROUTING-I18N, SEO-SPECIFICATION, EDITORIAL-WORKFLOW, CONTENT-ARCHITECTURE, DATA-MODEL, ERD, DESIGN-TOKENS, PDD §14, TEST-PLAN §12, TRACEABILITY-MATRIX FR-020, ENVIRONMENTS §3.1.

1. **A, About sebagai global Payload.** Global `about` dengan field berlokalisasi ID/EN (tanpa fallback), versi dan draf (draf → publish), sehingga perubahan tayang tanpa deploy (SRS FR-020). Satu migrasi additive dengan RLS aktif di `up()`. Pembacaan publik hanya lewat `lib/cms/public-content.ts`: published saja, `overrideAccess: false`, tanpa fallback locale. REST/GraphQL anonim tetap ditolak, sama seperti koleksi lain. Saat CMS mati (tanpa env, atau `VERCEL_ENV=production`), `/{locale}/about` menjawab 404 seperti halaman publikasi; Production tetap mematikan CMS sampai M4.
2. **A, sebagaimana direvisi oleh 13A.** Field terstruktur, tanpa editor rich-text dan tanpa dependency baru. Hero: eyebrow, H1, paragraf pembuka, sampai 2 tautan CTA. Seksi: label, judul, paragraf (dipisah baris kosong), daftar butir opsional (judul + teks; bernomor atau berpoin), kutipan sorot opsional. Field judul SEO dan deskripsi meta. Email kontak opsional. Tata letak dikendalikan kode; blok tim, mitra, dan statistik di luar cakupan. Model harus mewakili setiap elemen dokumen Owner §2.1–§2.13 tanpa mengubah kata (model field: DATA-MODEL §4.6.1). Cetak miring dan tebal di dalam paragraf menjadi teks biasa (batas yang diketahui dari 13A); lead-in tebal menjadi judul butir. **Penambahan kecil di luar daftar keputusan 2:** CTA tingkat seksi (`ctas` di seksi), karena CTA §2.13 diletakkan di seksi penutup (keputusan 14).
3. **A, About per locale ada hanya bila versinya published.** Bila tidak, halaman menjawab 404 Mahira dan tidak muncul di navigasi maupun sitemap. Agen tidak menulis klaim organisasi: tes memakai teks `[FIXTURE]`. Satu-satunya pengecualian adalah keputusan 15.
4. **A + 4b(iii).** Route `/{locale}/about` untuk kedua bahasa (ADR-0005, IA-ROUTING-I18N), bukan `/id/tentang`. Satu status publish untuk ID dan EN, ditambah kotak centang khusus staf "Versi EN siap tayang" (`enReady`). Halaman EN ada hanya bila kotak itu dicentang dan field EN yang wajib terisi; ini mencegah teks EN setengah jadi tayang saat Publish.
5. **A, navigasi.** Header halaman `/{locale}/…` mendapat tautan "Tentang"/"About", tampil hanya bila About locale itu ada. Seksi `#tentang` di homepage tetap, dan mendapat tautan "Selengkapnya tentang Mahira" ke `/id/about`, tampil hanya bila About ID ada.
6. **A.** Editor dan Admin boleh mengubah dan menerbitkan (DEC-016).
7. **B, pratinjau draf About** lewat mekanisme pratinjau staf yang ada: `/api/preview` + Draft Mode, banner, tujuan keluar, hanya sesi staf (M3-05/M3-05b). Ini memenuhi PDD §9 dan tidak boleh mengganggu pratinjau publikasi (tes PV). Peka akses.
8. **A, SEO.** Canonical `https://mahira.id/{locale}/about`; hreflang hanya bila kedua locale ada; masuk sitemap bila ada; gambar OG `/og/site`; `<title>` dan deskripsi dari field SEO.
9. **A, DEC-024 menjadi Accepted.** `app/(site)/globals.css` dipindah ke `app/globals.css` (sesuai DEC-024 dan DESIGN-TOKENS); diimpor oleh `app/(site)/layout.tsx`, `app/[locale]/layout.tsx`, dan `app/global-not-found.tsx`. Berkas itu menjadi satu-satunya sumber token runtime (properti CSS kustom / `@theme` Tailwind 4); aturan hanya memakai token, nilai hex hanya di definisi token. Nilai warna yang tidak bisa membaca CSS (`themeColor` di tiga layout dan gambar OG) dipindah ke satu modul TS kecil, `lib/design/tokens.ts`, dengan tes unit yang menegaskan nilainya sama dengan token CSS (TKU1–TKU3). PDD §14 dan DESIGN-TOKENS.md hanya menjelaskan nama dan makna token. Nol perubahan visual, dibuktikan dengan perbandingan computed style. `.kiro/steering/structure.md` diperbarui. **Catatan approver:** approver di register adalah "Design/Frontend Lead"; peran itu belum diangkat (B-03), jadi Owner memutuskan sebagai Product Owner.
10. **A.** Tanpa warna baru, tanpa mode gelap, tanpa redesain. Halaman About memakai komponen dan register editorial yang ada.
11. **A, dimasukkan ke MILESTONES/CHANGELOG PR ini:** bukti penutupan M3-08 (lihat di bawah); unduhan tetap sebagai attachment (keputusan Owner 2026-11-17 di atas); **M6-02 "Baca di browser"** ditambahkan ke MILESTONES M6. **Catatan M6-02:** gagasan pasca-launch, menunggu diskusi tim Owner: URL `mahira.id` yang stabil dan menerbitkan signed URL baru setiap dibuka, tidak pernah URL storage mentah. Tidak ada kode untuk ini di M3-09.
12. **Pengaturan run disetujui** (model per langkah, loop review maksimal 2 iterasi, migrasi additive + RLS yang lulus cek `up()`/`down()` dalam transaksi yang di-rollback boleh diterapkan ke `mahira-cms` tanpa jeda).
13. **A.** Lihat keputusan 2 (field terstruktur tanpa rich-text).
14. **A, cakupan konten** = dokumen Owner §2.1–§2.13, berurutan seperti tabel §6-nya (baris 1–9 dan 11; baris 10 hanya tiga pilar, §2.12). CTA: "Kenali Cara Kami Bekerja" → anchor ke seksi "Cara Kami Bekerja"; "Jelajahi Publikasi" → `/{locale}/publications`; "Hubungi Mahira" → `mailto:` email kontak. Tanpa "Bangun Kolaborasi" (form masuk M6). Dikecualikan: daftar personel, data legal, NPWP/rekening, dan kanal kontak selain email. **"Tim Kami" dicatat sebagai item OPEN di MILESTONES** karena butuh persetujuan tiap orang.
15. **B, benih konten sebagai aksi terakhir run.** Dijalankan sesudah gerbang akhir, review, dan semua run tes. Skrip sekali pakai yang tidak dilacak git memuat teks §2 dokumen Owner apa adanya ke About ID sebagai **draf** (tidak published, EN kosong, kotak EN mati). Judul SEO dan deskripsi meta dari dokumen §7; email kontak dari dokumen §4.3. Benih mengikuti struktur §2.1 (eyebrow + headline sebagai H1); dokumen §7 menyarankan H1 lain, dan selisih itu dilaporkan kepada Owner untuk diputuskan saat pratinjau. Tidak ada kata yang diubah. Owner memratinjau, menyunting, dan menerbitkan sendiri.
16. **A, dokumen Owner tidak di-commit.** Repo GitHub bersifat PUBLIC. Dokumen dibaca di tempatnya dan tidak pernah di-`git add`; nama personel, nomor telepon, alamat, nomor legal, dan catatan verifikasi dokumen itu tidak disalin ke berkas repo, tes, fixture, atau pesan commit. MILESTONES hanya menyebut "sumber: dokumen Owner 2026-11-17". Owner memindahkan dokumen keluar dari repo sesudah run.
17. **A.** Catatan verifikasi dokumen Owner dicatat sebagai daftar periksa pra-publikasi di bawah M4-05 (MILESTONES): tugas organisasi, bukan kode. Lima topiknya: nama legal dan status pendirian; domain dan akun media sosial; kontak yang aktif; kata "dirancang" untuk program; asal-usul nama dipertahankan sebagai filosofi Mahira.

**Penutupan M3-08 (diverifikasi 2026-11-17, dilipat ke PR ini oleh keputusan 11):**

- PR #21 merge 2026-11-17T01:45:33Z, merge commit `0bae191`, head `e985985`.
- CI `check` sukses di PR (run `43997334587`) dan di push ke `master` (run `43997994627`); status commit Vercel sukses (deployment `2AYH8mZpxHjh9fPWkGj4mWyTCzat`).
- Production: `/` 200; `/admin`, `/api/files/1/download`, `/api/media/file/x`, `/id/publications` 404.
- Cek akhir Owner di Preview pada head `e985985`: "Unduh PDF" menyimpan file sebagai attachment bernama `mahira-fixture-m3-08-10mb.pdf`. Lulus.
- Kata "belum di-push / menunggu PR" dihapus dari M3-08.

**Fakta bukan jawaban Owner (hasil implementasi, 2026-11-17):**

- **Migrasi** `payload/migrations/20261117_055203_m3_09_about`: additive (14 tabel dan 9 enum), RLS aktif di `up()`, `IF EXISTS` di `down()`. Cek `up()`/`down()`/`up()` dalam transaksi yang di-rollback lulus (U1–U8, D1–D3, R1–R8, X1–X2). Diterapkan ke `mahira-cms` di bawah persetujuan awal keputusan 12; akun staf Owner tidak diubah.
- **`proxy.ts` berubah**: matcher bertambah `/id/about/:path*` dan `/en/about/:path*` (CMS mati → 404 + noindex + no-store). Cek DEC-006 / §2.10 diulang: unit PX1–PX6 dan tes matcher, `--only admin` AD1–AD7, build-matrix keempat mode (G5.5/G5.6). Lima variabel env CMS (`payload/env.ts`), `next.config.ts`, dan `package.json` tidak berubah; tanpa dependency baru.
- **Pratinjau:** `/api/preview` menerima tepat satu dari `id` (publikasi) atau `about` (locale); keduanya atau tidak satu pun → 404. Pemeriksaan sesi staf tetap sebelum Draft Mode.
- **Pembacaan global:** `findGlobal` membaca `fallbackLocale` dari request sebelum hook `beforeOperation`; karena itu `denyPublicFallbackForGlobal` menolak pembacaan anonim yang meminta locale fallback (kembaran `denyPublicFallback`).
- **Bukti:** gerbang akhir dan uji rusak-sengaja FA1–FA8 dan FB1–FB4 di CHANGELOG [M3-09] dan TEST-PLAN §12; perbandingan computed style 0 perbedaan (7 halaman × 2 viewport, 1544 elemen) dan tiga gambar OG identik byte per byte.
- **Batas yang diketahui:** lead-in dan cetak miring inline menjadi teks biasa (keputusan 2); About adalah singleton bersama di `mahira-cms`, sehingga tes memulihkan isinya dan membuktikannya dengan perbandingan sebelum/sesudah (riwayat versi boleh bertambah).

- **Kode dan bukti:** branch `feat/m3-09-about-tokens` (basis `origin/master` `0bae191`): global, lapisan baca, pratinjau, gerbang CMS dan SEO `1b7b86d` (FEAT-A); satu sumber token, UI About, tautan header dan homepage `02765ba` (FEAT-B); lalu commit dokumen. File utama: `payload/globals/About.ts`, `lib/about/about-view.ts`, `lib/cms/{about-query,public-content,staff-preview}.ts`, `app/[locale]/about/page.tsx`, `app/api/preview/`, `proxy.ts`, `app/globals.css`, `lib/design/tokens.ts`. Hasil cek: TEST-PLAN §12 dan CHANGELOG [M3-09]; status: MILESTONES M3-09.

### 2.16 Jawaban Owner 2026-11-17 untuk M3-11 dan M3-12 (detail DEC-014 diputuskan; DEC-012 tetap Proposed)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-17 atas pertanyaan planner untuk M3-11 dan M3-12 (detail Learning Hub), diteruskan orchestrator, verbatim: "Setuju semua, kecuali butir 3 untuk bentuk panduan, aku setuju dengan 3A. Lalu untuk aset-aset seperti video, panduan hingga toolkit belum ada semuanya." Jadi setiap opsi yang direkomendasikan di bawah disetujui, termasuk 3A, dan belum ada konten Learning Hub yang nyata. Bagian ini menutup butir OPEN DEC-014 di §2.8: record DEC-014 di §2.1 dan barisnya di §2 diperbarui ("detail diputuskan 2026-11-17"). DEC-012 tetap Proposed. Pengaturan run (model per langkah, loop review maksimal 2 iterasi, migrasi additive + RLS yang lulus cek `up()`/`down()` dalam transaksi yang di-rollback boleh diterapkan ke `mahira-cms` tanpa jeda) disetujui. Rincian: DATA-MODEL §4.5, CONTENT-ARCHITECTURE, ERD, IA-ROUTING-I18N, PAGE-SPECIFICATIONS §9 dan §2, SEO-SPECIFICATION, EDITORIAL-WORKFLOW, SRS FR-018/019/029, TEST-PLAN §12, TRACEABILITY-MATRIX, ENVIRONMENTS §3.1.

1. **A, M3-11 dan M3-12 digabung dalam satu run; M3-13 tetap terpisah.** MILESTONES sebelumnya menyebut "workflow terpisah" untuk M3-11 dan M3-12; kalimat itu diperbaiki. Run ini hanya mendefinisikan model toolkit (keputusan 9).
2. **A, jenis materi:** `video` (satu video YouTube), `playlist` (satu playlist YouTube), `guide` (panduan), `toolkit` (file unduhan + deskripsi).
3. **A, panduan = halaman teks terstruktur.** Memakai ulang model seksi About dari M3-09 (`payload/globals/About.ts`, `lib/about/`, DATA-MODEL §4.6.1): judul, paragraf, daftar, kutipan. Tanpa gambar, tanpa rich-text, tanpa dependency baru.
4. **A, tema = Topic yang ada ("Bidang kerja").** Memakai nama dan deskripsi Topic berlokalisasi; hanya Topic aktif; satu tema utama per materi; tanpa taksonomi baru (DEC-003). Nilai Topic tetap fixture sampai M4-05.
5. **A, satu record per materi, field berlokalisasi ID/EN (fallback mati)**, seperti About dan Topic.
   - Suatu locale menampilkan materi hanya bila field wajib locale itu terisi. EN juga butuh kotak centang khusus staf "Versi EN siap tayang" (pola yang sama dengan About §2.15 keputusan 4b(iii)).
   - Field "Bahasa materi" (ID/EN) tampil sebagai label. Video berbahasa Indonesia dapat tampil di katalog EN dengan judul EN dan label "In Indonesian".
   - **Ini berbeda dari model publikasi (DEC-004: record terpisah yang saling terhubung).** Perbedaan dicatat di DATA-MODEL §4.5 dan CONTENT-ARCHITECTURE.
6. **A, video dan playlist diputar di katalog, tanpa halaman detail.** Panduan dan toolkit punya halaman detail.
7. **A, route** `/{locale}/learning-hub` dan `/{locale}/learning-hub/{slug}` untuk kedua locale (segmen berbahasa Inggris, seperti `publications` dan `about`).
   - Slug unik per locale.
   - Belum ada riwayat slug di run ini. EDITORIAL-WORKFLOW mencatat: slug materi yang sudah terbit tidak boleh diubah.
   - Saat CMS mati (tanpa env, atau `VERCEL_ENV=production`) kedua route menjawab 404, seperti halaman CMS lain.
   - Butir "learning hub" di DEC-005 "Still open" dan di ADR-0005 ditutup.
8. **A, embed YouTube dengan facade klik-untuk-muat.**
   - Katalog menampilkan thumbnail dan judul. Iframe `youtube-nocookie.com` baru dimuat setelah tombol putar diklik. Ada juga tautan "Tonton di YouTube". Iframe punya judul yang dapat dibaca teknologi bantu.
   - Editor menempel URL YouTube. Server hanya menerima host YouTube (allowlist) dan hanya menyimpan ID video atau playlist. Validasi di batas simpan; URL mentah editor tidak pernah dirender ke iframe.
   - Tanpa YouTube API: tanpa API key, tanpa durasi otomatis.
   - Thumbnail video dari server gambar YouTube. Playlist memakai gambar unggahan editor (`media` yang ada) atau sampul tipografi.
   - **Catatan untuk M4-02 (kebijakan privasi):** thumbnail menghubungi server Google (IP terlihat, tanpa cookie) dan YouTube harus disebut namanya.
9. **A, penyimpanan toolkit (diputuskan sekarang, dibangun di M3-13).**
   - Bucket privat yang sama, `publication-files`, di koleksi unggahan dan prefix terpisah.
   - Unduhan attachment dengan signed URL 60 detik, seperti M3-08.
   - Hanya PDF saat launch. Format lain butuh Owner melebarkan daftar MIME bucket dan keputusan baru.
   - Tanpa access level, karena semua materi Learning Hub publik (DEC-014).
   - Di run ini toolkit dapat dibuat di admin tetapi tidak pernah tampil di situs publik: dikecualikan dari katalog, route detail, sitemap, dan homepage sampai M3-13. Koleksi file toolkit ditunda ke M3-13 (lihat "Keputusan planner" di bawah).
10. **A, struktur halaman katalog.**
    - H1 dan pengantar dari global CMS kecil (ID/EN, plus field SEO). Owner mengisinya; agen tidak menulis teks pengantar.
    - Seksi "Toolkit" tetap kosong dan tersembunyi sampai M3-13.
    - Satu seksi per tema: nama Topic, deskripsi Topic, dan kartu materi.
    - Urutan: field urutan manual, lalu terbaru dulu.
    - Belum ada filter dan paginasi.
11. **A, katalog suatu locale ada hanya bila ada minimal satu materi yang tampil.** Bila tidak, halaman menjawab 404 Mahira dan tidak muncul di navigasi maupun sitemap.
    - Menu "Learning Hub" di header/footer dan blok Learning Hub di homepage tampil hanya saat itu. Blok homepage menampilkan sampai 3 materi terbaru dan menautkan ke katalog.
    - Gerbang G1 disesuaikan. Sejak M3-04 G1 menegaskan teks "Learning Hub" tidak ada di `/` (TEST-PLAN §12.2). Kini: dengan CMS mati atau di Production teks dan tautannya tidak pernah tampil; dengan CMS hidup blok dan item menu tampil bersama atau tidak sama sekali. §2.7 P2 A (Learning Hub disembunyikan sampai M3-12) diperiksa ulang dan terpenuhi.
12. **A, alur editorial.**
    - Draf → publish/unpublish (DEC-015). Editor dan Admin boleh menerbitkan (DEC-016).
    - Pratinjau draf staf lewat mekanisme `/api/preview` yang ada (M3-05/M3-09) untuk halaman detail panduan dan toolkit. Tidak boleh mengganggu pratinjau publikasi maupun About.
    - Video dan playlist diperiksa setelah terbit: penyimpangan sebagian yang dicatat dari PDD §9, risiko rendah.
13. **A, SEO.**
    - Canonical untuk katalog dan halaman detail.
    - hreflang id/en hanya bila kedua versi ada.
    - Entri sitemap untuk katalog dan halaman detail.
    - Gambar OG `/og/site`.
    - Tanpa JSON-LD (`VideoObject`), konsisten dengan PUB-OQ-39.
14. **A, tanpa relasi publikasi terkait di M3.**
15. **Penutupan M3-09 dilipat ke MILESTONES/CHANGELOG PR ini (diverifikasi 2026-11-17):**
    - PR #22 merge 2026-11-17T16:49:27Z, merge commit `5768c58`, head `e56fe81`.
    - CI `check` sukses di PR (run `44100703624`) dan di push ke `master` (run `44130137979`).
    - Status commit Vercel sukses (deployment `HvSwa62C2rC9VWwffsT5e2nDvr4X`).
    - Production: `/` 200; `/id/about`, `/en/about`, `/admin`, `/id/publications`, `/api/preview?about=id` 404.
    - Cek Owner di Preview (ENVIRONMENTS §3.1 "Halaman About (M3-09)", langkah A–L): semuanya lulus.
    - Owner lalu mengubah H1 About menjadi "Tentang Mahira Indonesia Development" dan menyesuaikan eyebrow di admin.
    - Kata "belum di-push / menunggu PR" dihapus dari M3-09.

**Keputusan planner untuk butir terbuka (usulan planner yang tercakup oleh "Setuju semua"; bukan kutipan Owner):**

- **Model seksi panduan dipakai bersama tanpa mengubah data About.** Field `sections` About dipindah tanpa perubahan ke `payload/fields/structured-sections.ts` (`structuredSectionsField`; nama, urutan, deskripsi, dan validasi sama; CTA tetap terakhir). Aturan tampilan pindah ke `lib/content/structured-sections.ts`, komponen ke `components/content/structured-sections.tsx` dengan prop `marker` (About tetap `data-about-*`, panduan `data-lh-*`). Bukti: migrasi M3-11 tidak memuat pernyataan `about`, tipe `About` tidak berubah, markup About tidak berubah (visual 0 perbedaan).
- **Thumbnail playlist tanpa YouTube API.** Tidak ada URL gambar playlist tanpa API key. Playlist memakai `coverImage` opsional (`media`) atau sampul tipografi; video memakai `https://i.ytimg.com/vi/<id>/hqdefault.jpg` yang dibangun dari ID tervalidasi lewat `next/image` `unoptimized` (`next.config.ts` tidak berubah). Browser menghubungi Google langsung; dicatat untuk M4-02 (keputusan 8).
- **`proxy.ts` berubah, hanya matcher:** `/id/learning-hub/:path*` dan `/en/learning-hub/:path*` (6 → 8 entri). Cek DEC-006 / §2.10 diulang (lihat Fakta di bawah).
- **Koleksi file toolkit ditunda ke M3-13.** Ia butuh koleksi `s3Storage` ketiga di `publication-files` (prefix `toolkits/`), kolom unggahan, hook PDF M3-08 dan tes penyimpanannya, dan belum ada yang memakainya. Run ini mendefinisikan `type: "toolkit"` (judul, ringkasan, slug, seksi) dan mengecualikannya di filter baca publik. M3-13 menambah `toolkit-files` (PDF, signed URL 60 detik attachment, tanpa access level) dan field `file`, lalu melebarkan filter. Pratinjau toolkit juga di M3-13.
- **Tanpa dependency baru dan tanpa perubahan lima variabel env CMS**, jadi tidak ada jeda ke Owner.
- **Pembacaan planner:** `slug` berlokalisasi + `unique` = unik `(slug, _locale)`, wajib hanya untuk panduan dan toolkit; hapus hanya Admin; `summary` wajib (juga meta description); global tidak punya kotak EN, H1 kosong → "Learning Hub", tanpa teks pengantar; Topic tidak aktif → materi tersembunyi; tabel koleksi bernama `lh_resources` (`dbName`) karena nama bawaan menghasilkan nama indeks 64 karakter (batas Postgres 63).

**Fakta bukan jawaban Owner (hasil implementasi, 2026-11-17):**

- **Migrasi** `payload/migrations/20261117_182752_m3_11_learning_hub`: additive (14 tabel dan 12 enum; satu-satunya perubahan pada tabel yang ada adalah kolom nullable `payload_locked_documents_rels.lh_resources_id` + FK), RLS aktif di `up()` (50/50 tabel `public`), `IF EXISTS` di `down()`. Cek `up()`/`down()`/`up()` dalam transaksi yang selalu di-rollback lulus (33 cek: tanpa pernyataan `about`, tanpa DROP/ALTER COLUMN, indeks unik `(slug, _locale)`, kolom lama tidak berubah). Diterapkan ke `mahira-cms` di bawah persetujuan awal; akun staf Owner dan data About/publikasi tidak diubah (snapshot sebelum/sesudah identik).
- **`proxy.ts` berubah (matcher saja)**; lima variabel env (`payload/env.ts`), `next.config.ts`, dan `package.json` tidak berubah. Cek DEC-006 / §2.10 diulang: unit PX1–PX6 dan tes matcher (8 entri), `--only admin` AD1–AD7, build-matrix keempat mode (G5.7–G5.10); langkah "Login admin" ada di ENVIRONMENTS §3.1.
- **Pratinjau:** `/api/preview` menerima tepat satu dari `id` (publikasi), `about` (locale), atau `resource` + `locale` (panduan); selain itu 404. Pemeriksaan sesi staf tetap sebelum Draft Mode. Normalisasi URL YouTube berjalan di setiap simpan, draf juga, karena Payload melewati `validate` pada simpan draf.
- **Bukti:** gerbang akhir dan uji rusak-sengaja FA1–FA10 dan FB1–FB6 di CHANGELOG [M3-11]/[M3-12] dan TEST-PLAN §12; perbandingan computed style halaman yang ada 0 perbedaan (18 pasang halaman × viewport, 2470 elemen) dan tiga gambar OG identik byte per byte.
- **Batas yang diketahui:** playlist tanpa gambar unggahan memakai sampul tipografi; video dan playlist tidak punya pratinjau draf (diperiksa setelah terbit, keputusan 12); belum ada riwayat slug; global Learning Hub tidak punya pratinjau; tes workflow terpengaruh kelambatan pooler pada hari gerbang akhir (CHANGELOG [M3-12]).

- **Kode dan bukti:** branch `feat/m3-11-12-learning-hub` (basis `origin/master` `5768c58`): `d15ec95` (model seksi dipakai bersama), `a1bd35c` (koleksi, global, validasi ID YouTube, migrasi; M3-11), `db68df4` (lapisan baca, route, pratinjau, gerbang CMS, SEO, tes; FEAT-A), `49df0e3`, `f4d063f`, `954c7f4` (komponen bersama, katalog dan panduan, facade YouTube, menu dan blok homepage, G1; FEAT-B), lalu commit dokumen. Hasil cek: TEST-PLAN §12 dan CHANGELOG [M3-11]/[M3-12]; status: MILESTONES M3-11 dan M3-12.

### 2.17 Jawaban Owner 2026-11-18 untuk M3-13 (toolkit Learning Hub yang dapat diunduh publik; DEC-012 tetap Proposed)

Dicatat dari jawaban Haidar (Product Owner) 2026-11-18 atas pertanyaan planner untuk M3-13 (toolkit Learning Hub yang dapat diunduh publik; penutup M3), diteruskan orchestrator, verbatim: "Setuju semua". Jawaban itu mencakup keputusan 1A–9A dan keputusan 10 di bawah, jadi setiap opsi yang direkomendasikan disetujui. Bagian ini melaksanakan §2.16 keputusan 9 (penyimpanan toolkit) dan keputusan 10 (seksi Toolkit di katalog). Tidak ada status DEC yang berubah: DEC-012 tetap Proposed (catatan di bawah). M3-13 adalah task terakhir M3, tetapi **M3 belum DONE** (keputusan 9).

1. **A, banyak file per toolkit.**
   - Satu toolkit punya satu atau lebih file berurutan, masing-masing dengan label.
   - Satu file hanya milik satu toolkit, aturan yang sama dengan `one-publication-per-file` untuk file publikasi.
2. **A, terbit butuh file ready.**
   - Menerbitkan toolkit ditolak bila tidak ada minimal satu file berstatus ready.
   - Lapisan kedua: situs publik menyembunyikan toolkit tanpa file ready (gagal tertutup).
3. **A, satu daftar file untuk kedua bahasa.**
   - Daftar file dipakai bersama ID dan EN.
   - Setiap file punya label berlokalisasi (ID/EN) dan nilai "Bahasa dokumen".
   - PDF berbahasa Indonesia tetap tampil di versi EN dengan penanda "In Indonesian", sama seperti video (§2.16 keputusan 5).
4. **A, file tayang dilindungi, seperti M3-08 keputusan 8B.**
   - Mengganti isi file atau menghapus file ditolak selama file dipakai versi tayang (published) sebuah toolkit.
   - Untuk mengganti file, editor mengunggah file baru di draf lalu menerbitkan.
5. **A, route `GET /api/learning-hub/files/{id}/download`.**
   - Semua penolakan menjawab 404: id tidak dikenal atau tidak valid, toolkit draf, toolkit di-unpublish, toolkit tidak tampil di locale itu, Topic tidak aktif, atau file belum ready.
   - Galat storage atau database menjawab 503.
   - Setiap respons membawa `Cache-Control: no-store` dan `X-Robots-Tag: noindex`.
   - Request yang diizinkan menjawab 307 ke signed URL attachment 60 detik.
   - Server memeriksa: toolkit published dan tampil di locale yang diminta, Topic aktif, file ready.
   - Planner wajib membuktikan path ini tidak bertabrakan dengan Payload REST (`/api/[...slug]`) maupun `/api/files/{id}/download`, dan gerbang CMS mati menutupnya.
6. **A, unduhan hanya di halaman detail.**
   - Kartu seksi "Toolkit" di katalog menampilkan judul, ringkasan, Bahasa materi, dan "PDF · N file", dan menaut ke halaman detail.
   - Halaman detail memakai panel file yang sama dengan publikasi.
   - Di pratinjau draf staf, file tampil tanpa tautan dengan catatan "Unduhan aktif setelah diterbitkan".
   - Seksi Toolkit tampil di bagian atas katalog (§2.16 keputusan 10) begitu minimal satu toolkit tampil.
7. **A, homepage dan sitemap.**
   - Toolkit yang tampil ikut blok "3 terbaru" di homepage dan menaut ke halaman detailnya.
   - Halaman detail toolkit masuk sitemap; PDF tidak.
8. **A, pengingat locale admin (dari M3-12b).**
   - Deskripsi singkat "Periksa Locale di pojok kanan atas sebelum mengetik" ditambahkan ke form global About, global Learning Hub, dan koleksi "Materi Learning Hub", dengan teks deskripsi yang sudah ada (tanpa komponen UI baru).
   - Tanpa perubahan data atau skema; diverifikasi tidak ada diff migrasi.
9. **A, daftar periksa keluar M3.**
   - MILESTONES memuat daftar periksa keluar M3 yang memetakan PRD §13 AC 1–4, 7, dan 9 ke buktinya (entri CHANGELOG/TEST-PLAN dan cek Owner di Preview). "Staging" berarti Vercel Preview.
   - M3 **tidak** ditandai DONE di run ini. M3 menjadi DONE hanya setelah cek Owner di Preview untuk M3-13 lulus, dicatat di PR berikutnya.
   - Milestone berikutnya adalah M5 (akses pengguna publik).
10. **Disetujui, penutupan M3-12b dan pengaturan run.**
    - Penutupan M3-12b (diverifikasi 2026-11-18) dimasukkan ke MILESTONES dan CHANGELOG PR ini:
      - PR #24 merge 2026-11-18T13:25:04Z, merge commit `6907c04`, head `cd143e5`.
      - CI `check` sukses di PR (run `44313127073`) dan push `master` (run `44313503199`).
      - Status commit Vercel sukses (deployment `Fo1zubsvpbWeMc2jSNrutDCVPqVD`).
      - Production: `/` 200; `/id/learning-hub`, `/id/about`, `/admin` 404.
      - Cek ulang Owner di Preview (ENVIRONMENTS §3.1 "Global Learning Hub (M3-12b)", A–F): semuanya lulus.
      - Kata "belum di-push / menunggu PR" dihapus dari M3-12b.
    - Pengaturan run: model per langkah mengikuti skema biaya Owner (planner, backend, UI, review akhir, dokumen); loop review maksimal 2 iterasi; migrasi additive + RLS yang lulus cek `up()`/`down()` dalam transaksi yang selalu di-rollback boleh diterapkan ke `mahira-cms` tanpa jeda; yang destruktif menunggu Owner; akun staf Owner, About, global Learning Hub, publikasi, file publikasi, Topic, dan materi yang ada tidak boleh berubah (dibuktikan dengan snapshot sebelum/sesudah); tes hanya memakai record `fixture-test-` dan teks `[FIXTURE]`; Owner sendiri yang mem-push.

**Keputusan planner untuk butir terbuka (usulan planner yang tercakup oleh "Setuju semua"; bukan kutipan Owner):**

- **Kode M3-08 dipakai ulang tanpa mengubah perilaku publikasi.** Dipakai apa adanya: `signedFileUrl` (sudah mendukung `prefix`), `parseFileId`, `attachmentDisposition`, `downloadResponse`, `setFileStatus`, `refuseOversizedFile`. Guard file tayang dan hook satu-record menjadi factory; ekspor, pesan, dan argumen query untuk publikasi tidak berubah (FU1–FU11, DL1–DL13, DLU1–DLU5 tetap lulus). Panel file menerima prop opsional `previewNote` dan `languageLabel`; pemanggil publikasi tidak mengirimnya.
- **Relasi pada koleksi berlokalisasi dan berversi.** `files` adalah `upload` `hasMany` yang **tidak** berlokalisasi (tabel `lh_resources_rels` dan `_lh_resources_v_rels`), dan `_status` berlaku per record. Karena itu query M3-08 berlaku tanpa locale: file tayang = jumlah baris tabel utama dengan `files` berisi id itu dan `_status` published; satu-file-satu-toolkit = baris tabel utama ditambah `countVersions` dengan `latest: true`, tidak menghitung record itu sendiri. Payload menulis tabel utama hanya pada simpan non-draf (DEC-006, butir peninjauan M3-13).
- **Tidak ada tabrakan route.** Route statis `app/api/learning-hub/files/[fileId]/download/route.ts` lebih spesifik daripada `app/(payload)/api/[...slug]`, seperti `app/api/files/[fileId]/download`. Payload REST tidak punya koleksi `learning-hub` (global-nya di `/api/globals/learning-hub`); koleksi baru di `/api/toolkit-files`. `/api/files/...` beda segmen pertama.
- **Gerbang CMS mati.** Matcher `/api/:path*` di `proxy.ts` sudah mencakup route, jadi `proxy.ts` tidak berubah; route mengulang `isCmsEnabled()` sebagai lapisan kedua (entri gerbang G5.11 untuk mode off dan prod, G4.8/G4.9 untuk mode on).
- **Locale lewat query.** Path tetap, jadi locale adalah query wajib `?locale=id|en`; tautan panel membawa locale halaman. Query hilang atau tidak dikenal menjawab 404 yang sama.
- **Toolkit hanya di seksi Toolkit.** Toolkit tidak pernah muncul di seksi tema; tema hanya memuat video, playlist, dan panduan. Toolkit tampil di suatu locale bila published, Topic aktif dan bernama, EN juga "Versi EN siap tayang", slug valid, dan minimal satu file ready (PDF) dengan label di locale itu.
- **Tanpa dependency baru dan tanpa perubahan lima variabel env CMS**, jadi tidak ada jeda ke Owner. `payload`, `@payloadcms/*`, dan paket AWS SDK tetap pada versi pin.

**Fakta bukan jawaban Owner (hasil implementasi, 2026-11-19):**

- **Migrasi** `payload/migrations/20261118_143352_m3_13_toolkit_files`: additive (2 enum, 4 tabel `toolkit_files`, `toolkit_files_locales`, `lh_resources_rels`, `_lh_resources_v_rels`, dan kolom nullable `payload_locked_documents_rels.toolkit_files_id` + FK), RLS aktif di `up()`, `IF EXISTS` di `down()`. Cek `up()`/`down()`/`up()` dalam transaksi yang selalu di-rollback lulus (32 cek); diterapkan ke `mahira-cms` di bawah persetujuan awal run. Snapshot sebelum/sesudah: global Learning Hub 0 path berbeda, 40 tabel yang ada identik (jumlah baris dan SHA-256), 4 tabel baru 0 baris, satu-satunya baris tambahan adalah catatan migrasi itu sendiri di `payload_migrations`; akun staf Owner tidak disentuh.
- **Bucket:** `publication-files`, prefix `toolkits/`; sesudah semua run 0 objek `fixture-test-` dan 3 objek lain (tidak berubah).
- **`proxy.ts`, `next.config.ts`, `payload/env.ts`, `package.json`, dan `bun.lock` tidak berubah.**
- **Review akhir (pass 2) APPROVED**, tanpa temuan HIGH atau MEDIUM. Pass 1 menemukan F1 (MEDIUM, UI): label bahasa halaman pada baris file toolkit membawa atribut `lang` yang salah (WCAG 2.2 SC 3.1.2); diperbaiki di `151f5f4`. Satu temuan LOW (L1): TKUI5 tidak punya uji rusak-sengaja sendiri; dicatat di TEST-PLAN §12.
- **Bukti:** gerbang akhir, uji rusak-sengaja FA1–FA12 + FA5b dan FB1–FB7, cek visual (0 perbedaan), dan snapshot data di CHANGELOG [M3-13] dan TEST-PLAN §12.
- **Batas yang diketahui:** hanya PDF (format lain butuh Owner melebarkan daftar MIME bucket dan keputusan baru); tanpa pratinjau file toolkit di browser ("Baca di browser" tetap M6-02); tanpa rate limit unduhan publik (butir M4 dari M3-08); file toolkit tidak berversi, jadi label dan "Bahasa dokumen" berubah langsung tanpa draf.

**Catatan DEC-012 (tetap Proposed):** M3-13 menambah penggunaan ketiga bucket privat `publication-files`: koleksi unggahan `toolkit-files` (prefix `toolkits/`, PDF publik tanpa access level, signed URL attachment 60 detik, `clientUploads` bersama dua instance `s3Storage`) dan route `GET /api/learning-hub/files/{id}/download?locale=`. Yang tetap terbuka: pengiriman file `registered` (M5-04) dan `subscriber` (M7-03), key S3 per environment dan region produksi (M4), dan cek Owner di Preview untuk M3-13.

- **Kode dan bukti:** branch `feat/m3-13-toolkit-downloads` (basis `origin/master` `6907c04`): `28e735e` (koleksi `toolkit-files`, route unduhan, filter baca yang dilebarkan, migrasi; FEAT-A), `e65ef92` (seksi dan kartu Toolkit, halaman detail dengan panel file, homepage, sitemap, deskripsi admin; FEAT-B), `151f5f4` (perbaikan review F1), lalu commit dokumen. Hasil cek: TEST-PLAN §12 dan CHANGELOG [M3-13]; status: MILESTONES M3-13 dan daftar periksa keluar M3.

### 2.18 Jawaban Owner 2026-11-20 untuk M5 (catatan, bukan perubahan status)
Dicatat dari jawaban Haidar (Product Owner) 2026-11-20 atas 16 pertanyaan orchestrator untuk M5 (akses pengguna publik, pra-launch), verbatim: "Setuju semua". Setiap opsi yang direkomendasikan disetujui. Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1; DEC-008, DEC-010, DEC-012 tetap Proposed, DEC-019 dan DEC-020 tetap Open.
**Catatan orchestrator (disampaikan ke Owner sebelum ia menjawab):** keputusan 1, 6, 8, 10, 15b, dan 16 menyimpang dari rencana atau dokumen sebelumnya; keputusan 3 menambah dependency; keputusan 4 menambah env var.
1. **SPIKE-002 (M5-01) — A.** Dikerjakan di branch fitur yang dapat di-merge (`feat/m5-01-02-auth`), bukan `spike/*` (branch `spike/*` tidak mendapat Preview Vercel, padahal SPIKE-002 meminta bukti di domain Preview). Bukti (nama, scope, dan path cookie; versi helper; tes negatif; perilaku di Preview) dicatat di SPIKE-002; kodenya menjadi fondasi M5-02. Menyimpang dari pola spike M2 (branch arsip yang tidak di-merge).
2. **Pembagian PR — A.** PR-1 = M5-01 + M5-02 (batas auth, registrasi, login, logout, reset, verifikasi email, area akun). PR-2 = M5-03 + M5-04 (evaluator akses, file `registered`). Masing-masing satu workflow dan satu cek Owner di Preview.
3. **Library auth — A.** `@supabase/ssr` + `@supabase/supabase-js`, dipin exact (dependency baru, disetujui). Hanya dipakai di server: form → Server Action atau route handler, plus `proxy.ts`. Tanpa client Supabase di browser, tanpa `NEXT_PUBLIC_*`; form bekerja tanpa JavaScript. Ditolak: memanggil REST Supabase Auth dengan `fetch` sendiri; akun publik sebagai koleksi auth Payload (menyimpang dari PRD §6.4, FR-010, DEC-008).
4. **Env dan project — setuju.** Satu variabel baru `APP_SUPABASE_PUBLISHABLE_KEY` (server-only), ditambah `APP_SUPABASE_URL` yang sudah ada. Auth punya gerbang env sendiri seperti `payload/env.ts`: tanpa variabel, fitur akun mati dan route akun 404. Tidak ada secret atau service-role key di Vercel. Auth di project APP `mahira.id` (eu-central-1); akun di Preview adalah data uji dan tidak dipindahkan bila M4 memilih region lain (DEC-017, B-05).
5. **Production sebelum M4 — A.** Akun hanya hidup di Preview dan lokal. Di Production (`VERCEL_ENV=production`) route akun dan auth menjawab 404, seperti CMS (Opsi A). Dibuka di M4.
6. **Email (DEC-019 tetap Open) — A.** M5 memakai SMTP bawaan Supabase hanya untuk uji Preview: hanya terkirim ke email anggota tim org Supabase "Mahira Dev", sekitar 2 email per jam, tanpa SLA (docs Supabase "Send emails with custom SMTP", dibaca 2026-11-20). Pemilihan provider dan domain pengirim `mahira.id` (SPF/DKIM/DMARC) menjadi gerbang M4; tanpa dependency npm. Menyimpang dari M5-02 "email transaksional": AC 10 di staging dibuktikan dengan email anggota tim. Email staf Payload tetap ditulis ke log server.
7. **Pengaturan Supabase Auth — setuju.** Email + password saja (tanpa OAuth, magic link, telepon); "Confirm email" ON (akun belum terverifikasi tidak bisa login); password minimal 8 karakter tanpa aturan komposisi; "Secure email change" ON; leaked password protection bila tersedia di plan; redirect allow-list `http://localhost:3000/**` dan pola Preview `https://mahira-foundation-*-mahiraindodev-2070.vercel.app/**` (`https://mahira.id/**` di M4); satu template email berisi teks ID lalu EN dengan tautan ke route konfirmasi di server; JWT signing key asimetris dicek. Agen menyiapkan nilai persis sebagai langkah berhuruf; Owner menerapkannya sendiri di dashboard Supabase dan Vercel.
8. **Data profil (DEC-020) — A.** Tanpa tabel aplikasi di M5: akun = email dan status verifikasi dari Supabase Auth. Tanpa migrasi atau RLS di project APP. Menyimpang dari usulan DATA-MODEL §5.1 `public_user_profiles` (masih proposal).
9. **Teks privasi dan hapus akun — setuju.** Form registrasi memuat catatan singkat (data yang dikumpulkan: email; tujuan: akun dan unduhan) berlabel draf yang belum ditinjau hukum. Tanpa hapus akun mandiri; Admin menghapus manual atas permintaan. Kebijakan privasi final dan tinjauan hukum menjadi gerbang M4 (DEC-020, M4-02).
10. **Audit unduhan (FR-026) — A.** Tanpa audit di M5; log hanya nama galat seperti M3-08. FR-026 pindah ke M4 sesudah DEC-020. Menyimpang dari API-SPECIFICATION §5.1 ("FR-026 untuk file terbatas (M5)").
11. **Visibilitas `registered` — A.** Publikasi `registered` tampil di detail, indeks, pencarian, sitemap, dan homepage dengan badge "Terdaftar"; file `registered` tampil di panel berlabel "Masuk untuk mengunduh". HTML sama untuk semua pengunjung (tanpa personalisasi, aman untuk cache); keputusan akses ada di route unduhan. Level `subscriber` tetap tersembunyi sampai M7. Saat PR-2 dibangun, ini mencabut §2.11 P7 A dan §2.14 keputusan 3b(ii) untuk level `registered` dan kembali ke PRD §8 dan DEC-002.
12. **Route unduhan — setuju.** `GET /api/files/{fileId}/download` diperluas: tanpa sesi valid → 303 ke halaman login dengan tujuan kembali yang hanya boleh path internal; sesi valid + email terverifikasi → 307 ke signed URL 60 detik (attachment); sesi staf Payload diabaikan dan diperlakukan anonim (DEC-009); penolakan lain tetap 404 yang sama.
13. **Route akun (ADR-0005 "Still open") dan header — setuju.** Segmen Inggris seperti route lain: `/{locale}/login`, `/{locale}/register`, `/{locale}/forgot-password`, `/{locale}/reset-password`, `/{locale}/account`, plus route handler konfirmasi email; semuanya `noindex` dan tidak masuk sitemap. Header: satu tautan netral "Akun"/"Account" tanpa status login. Halaman akun: email, status verifikasi, status akses, ganti password, keluar. `proxy.ts` me-refresh sesi hanya di route akun dan route unduhan.
14. **Keamanan — setuju.** (a) Hanya rate limit bawaan Supabase Auth; pesan galat generik yang tidak membocorkan apakah email terdaftar; CAPTCHA diputuskan di M4. (b) Staf yang perlu file `registered` mendaftar akun publik biasa, tanpa penautan ke akun staf (DEC-009). MFA staf menjadi butir M4 (belum dicek apakah Payload 3.93.0 punya MFA bawaan). Tanpa dashboard internal custom.
15. **Pengujian — (a) ya, (b) tunda.** (a) Tes integrasi membuat akun uji `fixture-test-…` yang sudah terverifikasi lewat Admin API Supabase dengan secret key APP di `.env.local` (`APP_SUPABASE_SECRET_KEY`, pertama kali dipakai; hanya di helper tes lokal, tidak di Vercel atau CI); akun uji dihapus di akhir run. (b) E2E Playwright ditunda ke M4; bukti alur lewat tes HTTP, matriks SRS §12.1 kolom Visitor/Registered/Editor/Admin, dan cek Owner di Preview. Menyimpang dari §2.11 P12 B (E2E di M5).
16. **Persetujuan keputusan — setuju.** Akhir PR-1: DEC-008 dan ADR-0003 diajukan Accepted. Akhir PR-2: DEC-010 dan DEC-012 diajukan Accepted untuk bagian `registered` (bagian subscriber tetap M7). Owner menyetujui sebagai PO karena Security owner belum ada (B-03); menyimpang dari approver "PO + Security owner" di DEC-008 dan ADR-0003.
- **Butir yang pindah ke M4** (MILESTONES M4): provider email dan domain pengirim (6), kebijakan privasi final, tinjauan hukum, dan aturan hapus akun (9), FR-026 (10), CAPTCHA (14a), MFA staf (14b), E2E Playwright (15b), `https://mahira.id/**` di redirect allow-list dan akun di Production (5, 7).

### 2.19 Jawaban Owner 2026-11-24 sesudah PR-1 M5 (DEC-008 dan DEC-019 menjadi Accepted)
Dicatat dari jawaban Haidar (Product Owner) 2026-11-24 atas 5 pertanyaan orchestrator sesudah PR #27 (M5-01 + M5-02) merge.
1. **DEC-008 dan ADR-0003 — setuju.** Keduanya Accepted 2026-11-24 (record di §2.1). Bukti: SPIKE-002 dan cek Owner di Preview A–K.
2. **DEC-019 — Accepted untuk email Supabase Auth.** Owner: domain pengirim `mahira.id` (registrar Hostinger, DNS di Cloudflare); semua record di Cloudflare dan di Resend sudah terverifikasi. Orchestrator mengecek read-only status domain di Resend dan record DNS publik (record di §2.1). Ini mengubah §2.18 keputusan 6: provider tidak lagi menunggu M4, dan batas SMTP bawaan Supabase (hanya anggota tim, ±2 email per jam) tidak berlaku lagi.
3. **Pencatatan — ya.** Bukti PR #27, cek A–K, dan keputusan 1–2 dicatat di commit pertama branch PR-2 `feat/m5-03-04-registered-files` (pola PR #26).
4. **Label file `registered` — sesuai rekomendasi.** Karena HTML sama untuk semua pengunjung (§2.18 keputusan 11), label tidak bergantung status login: "Unduh PDF (perlu akun)" / "Download PDF (account required)", ditambah badge "Terdaftar"/"Registered". Perilaku route tetap §2.18 keputusan 12. Mengganti teks "Masuk untuk mengunduh" di §2.18 keputusan 11.
5. **Workflow PR-2 (M5-03 + M5-04) — ya.** Skema model dan tes sama dengan PR-1; tanpa env var atau dependency baru.
- **Variabel Vercel (dicek read-only 2026-11-24):** enam variabel, semuanya hanya target Preview: lima variabel CMS + `APP_SUPABASE_PUBLISHABLE_KEY`; Production tidak punya variabel.

### 2.20 Pelaksanaan M5-03 + M5-04 (PR-2): keputusan teknis, pencabutan P7 A / 3b(ii) untuk `registered`, pengajuan DEC-010 dan DEC-012
Dicatat 2026-11-24 dari rencana dan hasil workflow PR-2 (branch `feat/m5-03-04-registered-files`, basis `eeaaa38`). Bagian ini tidak mengubah kolom Status di §2 maupun record di §2.1: **DEC-010 dan DEC-012 diajukan Accepted untuk bagian `registered`, menunggu persetujuan Owner** (§2.18 keputusan 16). Bagian subscriber tetap M7 (M7-02, M7-03).
- **Pencabutan:** §2.11 P7 A dan §2.14 keputusan 3b(ii) dicabut untuk level `registered` saja (§2.18 keputusan 11; label §2.19 keputusan 4: "Unduh PDF (perlu akun)" / "Download PDF (account required)" + badge "Terdaftar"/"Registered"). Publikasi dan file `subscriber` tetap tersembunyi di HTML, pencarian, sitemap, homepage, REST, dan GraphQL anonim sampai M7.
- **Keputusan teknis (titik terbuka rencana):**
  1. **Sumber visibilitas = filter baca anonim Payload Local API** (`payload/access/public-read.ts`, `publicAccessLevels()`). REST dan GraphQL anonim tetap ditolak karena `isAnonymousLocalRead` mensyaratkan `payloadAPI === "local"`, jadi tidak ada yang melebar di sana; SQL pencarian memakai level yang sama sebagai parameter.
  2. **Tujuan setelah login = halaman detail publikasi**, bukan route unduhan (303 dari POST login ke unduhan berakhir pada attachment dan membiarkan browser di form login). Hanya `/{id|en}/publications/<slug>` yang diterima sebagai `next` (`readReturnPath`).
  3. **CMS hidup, akun mati:** `registered` tetap tersembunyi seperti sebelumnya (`publicAccessLevels()` = `public` saja) dan route menolak `registered` dengan 404, agar tidak ada tautan "perlu akun" yang selalu 404.
  4. **`proxy.ts` tidak diubah.** Route unduhan me-refresh sesi sendiri (`getUser()` lewat cookie jar) dan menulis cookie Supabase serta `Cache-Control: private, no-store` pada jawabannya. Keputusan 13 §2.18 mengizinkan tetapi tidak mewajibkan refresh di proxy; risiko §2.10 tetap nol.
- **Pembacaan §2.18 keputusan 12:** sesi kedaluwarsa/tidak valid = tidak ada sesi valid → 303; sesi valid dengan email belum terverifikasi = "penolakan lain" → 404. Staf (cookie atau header Payload) = anonim (DEC-009).
- **Tanpa perubahan skema:** `bun run payload migrate:create m5_03_schema_check --skip-empty` tidak menghasilkan file (19 file migrasi sebelum dan sesudah). Tanpa dependency, env var, tabel, atau RLS baru.
- **Bukti (commit di branch):** `ede5a35` (evaluator, visibilitas, route unduhan, return path), `316c2fd` (area integrasi `registered` RF1–RF9, area lain diperbarui, bukti break B1–B8), `82ab673` (baris file terkunci dan badge), `abb0837` (gate akhir). Unit 258/258, lint 0 error, tsc 0, build matrix 6 mode PASS; integrasi penuh dijalankan sekali dengan build lalu rerun area gagal saja (3 run; kegagalan: timeout pooler, AB5, dan db-invariants I6 akibat global learning-hub kotor di Preview yang sudah dibersihkan Owner), semua area lulus. Review akhir Opus xhigh: APPROVED (`.agents/tasks/m5-03-04-registered-files/review.md`).
- **Temuan di luar PR (tidak diperbaiki di sini):** global learning-hub ID berisi "[FIXTURE]" di Preview karena run learning-hub terputus sebelum restore; snapshot "asli" run berikutnya ikut kotor. Guard yang mungkin: hook `before` learning-hub/about menolak mulai bila snapshot sudah memuat "[FIXTURE]".
- **Yang diminta dari Owner:** menyetujui DEC-010 dan DEC-012 (bagian `registered`) setelah cek Preview ENVIRONMENTS §3.1 "Akses `registered` dan unduhan (M5-03/M5-04)" lulus.

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
| 2026-11-15 | Jawaban Owner 2026-11-15 untuk M3-06 (P1–P11: kolom, locale, AND dengan filter, urutan relevansi tanpa `sort`, prefiks, penyimpanan indeks, baris hasil, `q` ≤ 100, tanpa kotak di header/homepage, tes fixture, ADR-0007 Accepted) dicatat di §2.12; usulan planner diberi label terpisah. Pointer di baris dan record DEC-013; tidak ada status yang berubah. |
| 2026-11-15 | Jawaban Owner 2026-11-15 untuk M3-07 (keputusan 1–10: canonical `https://mahira.id`, canonical `?page=n`, hreflang, sitemap dan robots, OG/Twitter, tanpa JSON-LD, redirect 308 slug lama dengan migrasi `20261115_054138_m3_07_publication_slugs` diterapkan ke `mahira-cms`, `htmlLimitedBots` dan halaman 404 global diadopsi, tanpa route jenis/topik) dicatat di §2.13 bersama hasil keputusan 8 dan 9; pointer di record DEC-021; tidak ada status yang berubah. |
| 2026-11-16 | Jawaban Owner 2026-11-16 untuk M3-08 (keputusan 1–12: koleksi `publication-files`, private bucket + route `GET /api/files/{fileId}/download` dengan signed URL 60 detik, `accessLevel` per file, `clientUploads`, bucket dan env, 404/503, panel UI, aturan perubahan file tayang, tanpa audit/rate limit, `/api/media/file/*` 404, sisa M3-07 sebagai OPEN) dicatat di §2.14 dengan penyimpangan dari SRS, API-SPECIFICATION §5, DEC-002, dan M5-04. **DEC-011 Accepted** (baris register dan record §2.1). DEC-012 tetap Proposed dengan catatan bukti M3-08. |
| 2026-11-17 | Jawaban Owner 2026-11-17 untuk M3-09 (keputusan 1–17: About sebagai global Payload `about` dengan field terstruktur dan tanpa rich-text, route `/{locale}/about`, kotak "Versi EN siap tayang", tautan header dan homepage, pratinjau draf lewat `/api/preview?about=`, SEO, DEC-024 Accepted, M6-02 "Baca di browser", benih draf, cakupan konten, dokumen Owner tidak di-commit, daftar periksa pra-publikasi M4-05) dicatat di §2.15 bersama bukti penutupan M3-08. DEC-024 Accepted (baris register dan record §2.1; approver Haidar sebagai Product Owner karena peran Design/Frontend Lead belum diangkat, B-03). DEC-012 tidak berubah. |
| 2026-11-17 | Jawaban Owner 2026-11-17 untuk M3-11 dan M3-12 (keputusan 1–15: run digabung dan M3-13 terpisah, empat jenis materi, panduan = halaman teks terstruktur model About, tema = Topic, satu record per materi berlokalisasi field dengan kotak "Versi EN siap tayang" dan label "Bahasa materi" (berbeda dari DEC-004), video/playlist diputar di katalog, route `/{locale}/learning-hub[/{slug}]`, facade YouTube klik-untuk-muat dengan allowlist host dan hanya ID disimpan, penyimpanan toolkit di bucket privat `publication-files` dibangun di M3-13, struktur katalog, katalog ada hanya dengan materi, alur editorial, SEO, tanpa relasi publikasi, penutupan M3-09) dicatat di §2.16. Baris register dan record DEC-014 menyatakan detail diputuskan; butir "learning hub" DEC-005 "Still open" ditutup. DEC-012 tidak berubah. |
| 2026-11-19 | Jawaban Owner 2026-11-18 untuk M3-13 (keputusan 1–10: banyak file per toolkit dan satu file satu toolkit, terbit butuh file ready, satu daftar file untuk ID dan EN dengan label berlokalisasi dan "Bahasa dokumen", file tayang dilindungi, route `GET /api/learning-hub/files/{id}/download?locale=`, unduhan hanya di halaman detail, homepage dan sitemap, pengingat locale admin, daftar periksa keluar M3 tanpa menandai M3 DONE, penutupan M3-12b) dicatat di §2.17, dengan kutipan "Setuju semua". DEC-012 tetap Proposed dengan catatan toolkit di baris, record, dan §2.17; bukti DEC-014 menunjuk M3-13; pemicu review upgrade M3-13 ditambahkan ke DEC-006. Tidak ada status yang berubah. |
| 2026-11-20 | Jawaban Owner 2026-11-20 untuk M5 (keputusan 1–16, "Setuju semua") dicatat di §2.18: SPIKE-002 di branch fitur yang dapat di-merge, dua PR, `@supabase/ssr` + `@supabase/supabase-js` server-only, env var `APP_SUPABASE_PUBLISHABLE_KEY`, akun hanya di Preview sampai M4, SMTP bawaan Supabase untuk uji Preview (provider DEC-019 di M4), tanpa tabel aplikasi, FR-026 ke M4, publikasi dan file `registered` tampil terkunci, route akun berbahasa Inggris, Playwright ke M4. Tidak ada status yang berubah. |
| 2026-11-24 | Jawaban Owner 2026-11-24 sesudah PR #27 dicatat di §2.19: **DEC-008 → Accepted** (ADR-0003 Accepted; record di §2.1); **DEC-019 → Accepted** untuk email Supabase Auth lewat Resend (domain `mahira.id` terverifikasi; DMARC, batas kirim Production, dan teks privasi di M4; record di §2.1); label file `registered` "Unduh PDF (perlu akun)". |
| 2026-11-24 | Pelaksanaan M5-03 + M5-04 dicatat di §2.20: §2.11 P7 A dan §2.14 3b(ii) dicabut untuk level `registered` (`subscriber` tetap tersembunyi); empat keputusan teknis (filter baca Local API, tujuan login = detail, akun mati = `registered` tersembunyi, `proxy.ts` tidak diubah); **DEC-010 dan DEC-012 (bagian `registered`) diajukan Accepted, menunggu persetujuan Owner**; status di §2 tidak berubah. |
