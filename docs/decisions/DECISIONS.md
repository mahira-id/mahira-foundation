# Decision Register

**Status:** Register in use. Eight decisions are Accepted (DEC-001, DEC-002, DEC-003 structure only, DEC-004, DEC-005, DEC-015, DEC-016, DEC-021), approved by Haidar (Product Owner) on 2026-11-08; their records are in §2.1. Every other row keeps its earlier status.  
**Canonical IDs:** `DEC-NNN`. Historical PRD `D-xx` and SRS `T-xx` are retained for traceability.  
**Last updated:** 2026-11-08 (columns Approver and Decided added, PUB-DU-14 of spec `01-publication-platform-foundation`; Owner decisions recorded from the 2026-11-08 session, see `.kiro/specs/03-architecture-technical-validation/PROTOTYPE-PLAN.md` §1–§2).

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
| DEC-004 | Localization storage model | PRD D-03; SRS T-02 | Compare Payload field localization vs linked translation records using editorial and URL requirements. | Accepted (Option C hybrid; validation evidence pending Spike A prototype; see §2.1) | Publication, author/topic schema, search, routing | PO + Engineering | Haidar (Product Owner) | 2026-11-08 |
| DEC-005 | Public URL and slug policy | SRS T-02 | Use locale-prefixed routes; define locale-specific slug uniqueness and redirects before content migration. | Accepted (validation evidence pending Spike A prototype; see §2.1) | IA, SEO, migrations | Engineering + SEO owner | Haidar (Product Owner) | 2026-11-08 |
| DEC-006 | CMS selection and application topology | PRD D-09; SRS T-01 | Payload CMS 3 embedded in the Next.js application remains the baseline candidate; prove via spike. | Proposed | Admin, collection design, deployment | Engineering + PO | — | — |
| DEC-007 | Database schema ownership and migration | SRS T-01 | Payload owns CMS collections; application schema owner/migration process must be explicit; no shared ad-hoc migrations. | Open — critical | All schema, backup, access, deployment | Engineering | — | — |
| DEC-008 | Public and staff identity boundary | PRD §6.4; SRS T-06 | Supabase Auth for public users; Payload staff auth for staff; no implicit role promotion or shared session assumption. | Proposed | Auth, account, admin, access policy | Security owner + PO | — | — |
| DEC-009 | Staff access to exclusive publications | SRS access matrix / T-06 | Deny-by-default; define whether staff use separate public account or an audited staff grant. | Open — critical | Access evaluator, audit, tests | PO + Security owner | — | — |
| DEC-010 | Authorization and entitlement model | PRD D-06; SRS §4 | Server-side authorization; explicit entitlement; RLS for app-user data; Payload access control for CMS. | Proposed | Access policy, APIs, storage, tests | Security owner | — | — |
| DEC-011 | Publication-level vs asset-level access | PRD §8; SRS Publication model | Preserve publication `access_level`; evaluate per-asset override with effective access as the stricter of inherited and asset rules. | Proposed — needs approval | Asset schema, CMS, storage, access tests | PO + Engineering | — | — |
| DEC-012 | File storage and private delivery | SRS T-03 | Object storage; public files only in public locations; exclusive files private and served after server authorization. Validate Payload adapter. | Proposed | Upload, download, backup, provider cost | Engineering + Security | — | — |
| DEC-013 | Search scope and engine | PRD §9; SRS T-04 | Start with PostgreSQL FTS; `pg_trgm` only where tests justify; PDF full text remains out until extraction spike. | Proposed | Search schema, indexing, UX | Engineering + PO | — | — |
| DEC-014 | Learning Hub MVP scope | PRD D-04 | Catalog + external embeds as baseline; no LMS progress, certificates, or assessments unless approved. | Proposed | Scope, schema, page specs | PO / Learning Lead | — | — |
| DEC-015 | Editorial workflow | PRD D-05 | Define draft, review, approval, schedule, publish, unpublish, revise, archive and responsibility. | Accepted (minimum workflow; see §2.1) | Payload workflow, role, content guide | Editorial Lead | Haidar (Product Owner) | 2026-11-08 |
| DEC-016 | Staff roles and operational admin scope | PRD D-07; SRS T-07 | Minimum Admin and Editor; Reviewer/Finance only if workflow justifies. Separate editorial and entitlement permissions. | Accepted (Admin and Editor; both may publish; see §2.1) | CMS access, dashboard routes | PO + Security owner | Haidar (Product Owner) | 2026-11-08 |
| DEC-017 | Hosting platform and database region | PRD D-10; SRS T-08 | Vercel + Supabase is the baseline proposal; confirm region, commercial plan, cost, backup, and runtime compatibility. | Proposed | Deployment, latency, budget, operations | PO + Engineering | — | — |
| DEC-018 | Package manager and runtime | Repository has `bun.lock`; Claude discussion | Determine whether Bun is package manager only or runtime too; pin versions and validate CI/deploy compatibility. | Open | Local setup, CI, deployment | Engineering | — | — |
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
