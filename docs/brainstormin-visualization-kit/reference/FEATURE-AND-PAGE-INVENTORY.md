# Feature & Page Inventory — Brainstorming Baseline

> This inventory is a structured decomposition for workshop use. It is not a final release commitment. Status labels: **BASELINE** = explicitly present in PRD/PDD/SRS; **PROPOSED** = useful detail inferred for implementation; **TBD** = decision needed; **OPTIONAL** = explicitly optional or dependent on a real use case; **PHASE 2** = subscription/payment expansion.

## 1. Product root

**Mahira — Digital Publication & Knowledge Platform**

### 1.1 Public Publication Platform [BASELINE]

- Homepage
  - Organization identity / masthead / main navigation [BASELINE]
  - Hero thesis / organization positioning [BASELINE]
  - Featured publication [BASELINE]
  - Latest publications [BASELINE]
  - Research desks / topics entry [BASELINE]
  - Learning Hub entry [BASELINE]
  - About / contact / collaboration [BASELINE]
  - Footer, social links, legal links [PROPOSED]
- Publication discovery
  - Publication index [BASELINE]
  - Search by keyword [BASELINE]
  - Filters by type, topic/desk, locale, year [BASELINE / data-dependent]
  - Sort by newest / relevance [PROPOSED; ranking needs validation]
  - Pagination or progressive loading [BASELINE]
  - URL-persisted query/filter state [PDD recommendation]
  - Empty, loading, no-result, error states [BASELINE UX expectation]
- Publication detail
  - Title, abstract/summary, author, publication date, locale [BASELINE]
  - Publication type, desk/topic, access label [BASELINE]
  - Asset/attachment listing and download controls [BASELINE]
  - Related publications [PDD / PROPOSED]
  - SEO/social metadata [BASELINE]
  - Citation / rights / license details [PROPOSED; editorial/legal policy]
- Discovery taxonomy
  - Research desk index [PROPOSED page; desk taxonomy exists in baseline]
  - Research desk detail [TBD]
  - Topic index/detail [PROPOSED / TBD]
  - Publication-type navigation [PROPOSED]
  - Tag navigation [OPTIONAL]
- Institutional pages
  - About / organization profile [BASELINE]
  - Focus / mission / impact [BASELINE]
  - Team / contributor profiles [PRD says team; page scope TBD]
  - Collaboration / partners [BASELINE concept]
  - Contact [BASELINE concept]
  - Privacy / Terms / Copyright [legal review required]

### 1.2 Editorial Management System [BASELINE]

- Publication management
  - Create, edit, duplicate, archive [BASELINE / duplicate PROPOSED]
  - Required-field validation [BASELINE]
  - Metadata and relationships [BASELINE]
  - Locale variants / translation links [BASELINE concept; storage TBD]
  - Draft, preview, publish [BASELINE]
  - Review, approval, scheduling [TBD: PRD D-05]
  - Unpublish and post-publication revision [PROPOSED / policy needed]
- Taxonomy management
  - Authors [BASELINE]
  - Publication Type [BASELINE concept]
  - Research Desk [BASELINE concept]
  - Topic [BASELINE concept]
  - Tags [OPTIONAL]
  - Category only if distinct from the above [TBD; avoid generic catch-all]
- Media and assets
  - Cover image [BASELINE]
  - Public PDF / external document [BASELINE]
  - Private PDF [BASELINE for gated future/current scope conflict]
  - Preview / excerpt [PROPOSED]
  - Appendix / dataset / supplemental resources [PROPOSED]
  - Upload validation and processing state [BASELINE requirement]
  - Asset-level access override [TBD]
- Learning content operations
  - Learning resource CRUD [BASELINE/P1]
  - Video/external URL and embed [BASELINE/P1]
  - Thumbnail and metadata [PROPOSED]
  - Relationships to topic/desk/publication [PROPOSED]
- Staff operations
  - Admin and Editor roles [BASELINE]
  - Reviewer role [OPTIONAL/TBD]
  - Finance role [OPTIONAL/Phase 2]
  - Staff MFA [SRS recommendation]

### 1.3 Public User Account & Access [BASELINE REQUIREMENT; RELEASE PHASE CONFLICT]

- Authentication
  - Register, login, logout [SRS P0]
  - Email verification [PRD/SRS policy-dependent]
  - Forgot/reset password [SRS P0]
  - Session expiry and recovery [SRS NFR]
- Account dashboard
  - Account overview [BASELINE]
  - Profile [BASELINE]
  - Locale preference [PROPOSED]
  - Access / entitlement status [BASELINE]
  - Available documents/library [PROPOSED]
  - Download history [OPTIONAL / SRS P1 audit differs from user-facing history]
  - Bookmarks [OPTIONAL / P2]
- Entitlement operations
  - Manual grant / revoke [PRD/SRS baseline before payment, release phase conflict]
  - Validity window [BASELINE concept]
  - Scope: publication / plan / collection [TBD]
  - Actor / reason audit [PROPOSED security requirement]
- Secure document access
  - Server-side policy evaluation [BASELINE]
  - Private object storage [BASELINE]
  - Short-lived signed URL [BASELINE concept; TTL TBD]
  - Asset readiness and failure state [PROPOSED]
  - Minimal download event [SRS P1 / privacy policy]
- Subscription [PHASE 2]
  - Plans / price / product rules [TBD business]
  - Checkout and payment methods [provider TBD]
  - Verified webhook and idempotency [BASELINE Phase 2 requirement]
  - Active / pending / failed / canceled / expired states [TBD provider model]
  - Renewal, cancellation, refund, grace period [TBD]
  - Invoice / receipt view [TBD]

### 1.4 Learning Hub [BASELINE P1 / initial scope needs confirmation]

- Learning Hub landing/catalog [BASELINE]
- Resource index [BASELINE]
- Resource detail [PROPOSED]
- Resource types: video, playlist, reading, external link [PROPOSED]
- External video embed [BASELINE/P1]
- Topic/desk/publication relationships [PROPOSED]
- Search and filters [TBD]
- Progress tracking, quiz, certificate, LMS [NON-GOAL unless separately approved]

### 1.5 Shared platform foundations [BASELINE / PROPOSED]

- Locale routing: `/id`, `/en` [BASELINE]
- Translation model and fallback [TBD]
- Search: PostgreSQL FTS + `pg_trgm` candidate [BASELINE recommendation]
- SEO: metadata, canonical, sitemap, robots, Open Graph, hreflang [BASELINE]
- Access: Payload access control + Supabase RLS [BASELINE architecture proposal]
- Storage: public and private buckets [BASELINE]
- Environments: development, staging, production [BASELINE]
- Migration ownership and backup/restore [BASELINE]
- Monitoring and error reporting [BASELINE proposal]
- Accessibility target WCAG 2.2 AA [SRS/PDD]
- Privacy, consent, retention, deletion [BASELINE requirement; legal review]

## 2. Page inventory by route family

Routes below are a proposed IA map, not a final slug contract. Locale prefix is shown as `[locale]`, intended to resolve to `id` or `en`.

### Public (`/[locale]`)

| Route | Page | Status | Primary purpose |
|---|---|---|---|
| `/[locale]` | Home | BASELINE | Positioning and curated entry points |
| `/[locale]/publications` | Publication index | BASELINE | Browse, search, filter, paginate |
| `/[locale]/publications/[slug]` | Publication detail | BASELINE | Read metadata/summary and access files |
| `/[locale]/search` | Search results | PROPOSED | Dedicated search results and URL state |
| `/[locale]/desks` | Desk index | PROPOSED | Browse research programs |
| `/[locale]/desks/[slug]` | Desk detail | TBD | Desk description + related publications |
| `/[locale]/topics` | Topic index | PROPOSED | Browse subjects |
| `/[locale]/topics/[slug]` | Topic detail | TBD | Topic page + related content |
| `/[locale]/learning-hub` | Learning catalog | BASELINE/P1 | Browse learning resources |
| `/[locale]/learning-hub/[slug]` | Learning resource detail | PROPOSED | Present an individual resource |
| `/[locale]/about` | About | BASELINE | Organization information |
| `/[locale]/contact` | Contact | PROPOSED | Contact route if separate from About |
| `/[locale]/privacy` | Privacy | LEGAL | Privacy notice |
| `/[locale]/terms` | Terms | LEGAL | Terms of use |
| `/[locale]/copyright` | Copyright / use policy | LEGAL | Rights and reuse information |

### Public account (`/[locale]`)

| Route | Page | Status | Primary purpose |
|---|---|---|---|
| `/[locale]/register` | Register | BASELINE SRS P0; release TBD | Create public user account |
| `/[locale]/login` | Login | BASELINE SRS P0; release TBD | Authenticate public user |
| `/[locale]/verify-email` | Email verification | POLICY TBD | Verify email if required |
| `/[locale]/forgot-password` | Forgot password | BASELINE SRS P0 | Start recovery |
| `/[locale]/reset-password` | Reset password | BASELINE SRS P0 | Complete recovery |
| `/[locale]/account` | Account overview | BASELINE SRS P0; release TBD | Show profile and access state |
| `/[locale]/account/profile` | Profile | BASELINE | Manage profile basics |
| `/[locale]/account/library` | My library / access | PROPOSED | List accessible restricted items |
| `/[locale]/account/downloads` | Download history | OPTIONAL | User-facing history if approved |
| `/[locale]/account/bookmarks` | Bookmarks | OPTIONAL/P2 | Saved publications |
| `/[locale]/account/subscription` | Subscription | PHASE 2 | Show plan and lifecycle |
| `/[locale]/account/billing` | Billing/invoices | PHASE 2 | Billing history / receipts |

### Staff admin and operations

| Route | Page | Status | Primary purpose |
|---|---|---|---|
| `/admin` | Payload admin | BASELINE | Staff login and editorial workspace |
| `/admin` collections | Publications, authors, taxonomy, learning, pages, media | BASELINE | Manage editorial records |
| `/admin` custom views | Entitlements / audit / user operations | TBD | Admin operations; decide Payload custom view vs internal route |
| `/internal/users` | Public user lookup | TBD | Restricted operational view |
| `/internal/entitlements` | Grant/revoke access | BASELINE capability; UI location TBD | Manual entitlement operations |
| `/internal/audit` | Audit trail | PROPOSED | Review sensitive actions |
| `/internal/analytics` | Analytics | OPTIONAL/P2 | Operational insights |
| `/internal/subscriptions` | Subscription operations | PHASE 2 | Payment/customer operations |
| `/internal/finance` | Finance view | OPTIONAL/Phase 2 | Highly restricted financial access |

Admin and account surfaces must be protected server-side and noindex. Actual path grouping can change without changing the domain boundary.

## 3. Actor / capability matrix (draft)

| Capability | Visitor | Registered | Subscriber | Editor | Reviewer | Admin | Finance |
|---|---|---|---|---|---|---|---|
| Read public metadata / summary | Allow | Allow | Allow | Allow | Allow | Allow | Allow if public |
| Download public asset | Allow | Allow | Allow | Policy-based | Policy-based | Allow | Policy-based |
| Download registered-only asset | Deny | Allow | Allow | Explicit staff policy TBD | Explicit staff policy TBD | Explicit staff policy TBD | Deny by default |
| Download subscriber-only asset | Deny | Deny | Allow only with active entitlement | Explicit staff policy TBD | Explicit staff policy TBD | Explicit staff policy TBD | Deny by default |
| Register / maintain own account | N/A | Own account | Own account | N/A | N/A | N/A | N/A |
| Create / edit editorial content | Deny | Deny | Deny | Allow per collection/field policy | Deny by default | Allow | Deny |
| Approve / request changes | Deny | Deny | Deny | Only if combined role approved | Allow if role exists | Allow | Deny |
| Manage staff roles | Deny | Deny | Deny | Deny | Deny | Allow | Deny |
| Grant / revoke entitlement | Deny | Deny | Deny | Only with explicit permission | Deny by default | Allow | Only if explicitly approved |
| View payment / invoice data | Deny | Own billing only in Phase 2 | Own billing only in Phase 2 | Deny | Deny | Policy-based | Restricted view if approved |
| View audit records | Deny | Deny | Deny | Own relevant content history if approved | Review scope if approved | Allow | Restricted if approved |

This matrix is intentionally stricter than broad labels such as “staff can access everything”. SRS leaves staff download permissions policy-based; do not grant staff automatic subscriber entitlement merely because they can edit content. Reviewer and Finance are optional roles, not confirmed launch requirements.

## 4. Workshop decisions and prompts

1. Which public pages are essential for launch versus later?
2. Is a distinct desk detail page needed, or is desk only a filter?
3. Are topic pages distinct landing pages or only index filters?
4. Does every publication have at least one author? Can the organization be credited?
5. Can a publication have multiple desks?
6. Can an individual asset have a different access level from its publication?
7. Is Learning Hub a catalog only or does it need user progress?
8. Which staff roles exist at launch and which operations can each perform?
9. Are account download history/bookmarks truly required?
10. What is the final MVP boundary given current PRD/SRS conflict?
