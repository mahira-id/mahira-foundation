# Data Model Specification

> **DEC-003 (Accepted 2026-11-08):** MVP memakai dua sumbu taksonomi: Publication Type (tepat satu, wajib) dan Topic (satu atau lebih, berurutan; yang pertama primer; label publik ID "Bidang Kerja"). Desk, Tag, dan Category tidak ada di MVP. Baris dan relasi Desk/Tag di dokumen ini hanya histori; jangan diimplementasikan. Nilai taksonomi tetap Open.

**Status:** Proposed logical model; not yet a migration/schema contract  
**Related:** SRS §5; DEC-004, DEC-007–DEC-012

> Field definitions below are a design proposal intended to make decisions explicit. Confirm names, nullability, indexes, data types, and collection configuration against actual content samples and the pinned Payload/Supabase versions before generating migrations.

## 1. Modeling principles

- Every entity has a stable primary identity independent of its localized slug.
- Every table/collection has one authoritative owner and one migration authority.
- Editorial content and public-user operations are separate domains even if they share one Postgres instance.
- Published public projections contain only explicitly public fields.
- Files are object-storage objects; database stores metadata and opaque object reference, not binary content.
- Use UTC timestamps (`timestamptz` for application-owned Postgres fields) and ISO 8601 in APIs.
- Prefer explicit enums/status constraints over free-form strings for lifecycle/access fields.
- Soft-delete/archive behavior must be explicit; never silently delete a publication with references or an audit trail.
- Localization strategy is blocked by DEC-004; model below shows the conceptual linked-record variant and notes where field localization changes implementation.

## 2. Ownership map

| Entity | Proposed owner | Authentication/access | Migration authority |
|---|---|---|---|
| Publication | Payload | Payload access control; public read projection only | Payload migration workflow |
| Author | Payload | Payload access control | Payload migration workflow |
| Desk | Not in MVP (DEC-003) | Payload access control | Payload migration workflow |
| Topic | Payload | Payload access control | Payload migration workflow |
| PublicationType | Payload | Payload access control | Payload migration workflow |
| Tag | Not in MVP (DEC-003) | Payload access control | Payload migration workflow |
| PublicationAsset metadata | Payload or application domain — decide in spike | Staff write; server-only sensitive fields | One designated owner only |
| LearningResource | Payload | Payload access control | Payload migration workflow |
| Page | Payload | Payload access control | Payload migration workflow |
| StaffUser | Payload Auth | Payload Auth + collection access | Payload migration workflow |
| PublicUser profile | Application schema + Supabase Auth identity | RLS; user can read/update approved fields only | Supabase/application migration |
| Entitlement | Application schema | Server writes; user reads only own allowed summary | Supabase/application migration |
| Subscription (Phase 2) | Application schema | Server/provider event writes; user reads own projection | Supabase/application migration |
| DownloadEvent | Application schema | Server inserts; restricted staff access; retention | Supabase/application migration |
| PaymentEvent (Phase 2) | Application schema | Server only; verified provider event | Supabase/application migration |

**Critical ownership issue:** SRS places assets near Payload and storage in Supabase. Decide whether Payload owns the asset metadata collection and uses an adapter, or whether app-owned storage metadata references Payload publications. Do not duplicate one asset record across both owners without a synchronization contract.

## 3. Common conventions

- Primary key: use the ID strategy generated/required by the selected ORM/CMS; do not assume UUID if Payload adapter defaults differ. Application-owned tables may use UUID.
- `created_at`, `updated_at`: server/database-generated; never trusted from public client.
- `created_by`, `updated_by`: staff relation or verified user ID where applicable; maintain actor type where sources differ.
- Slugs: normalized lowercase kebab-case; unique scope TBD (global vs per locale vs collection). Slug changes create redirect records.
- Locale: ISO-style supported locale code (`id`, `en` initially). Validate against allowlist.
- Status: controlled enum; publication status is not access level.
- IDs in public URLs: use slugs, not sequential internal IDs.

## 4. Editorial entities (Payload-owned proposal)

### 4.1 Publication

| Field | Proposed type | Required | Localized | Notes / constraints |
|---|---|---:|---:|---|
| `id` | CMS primary key | Yes | No | Stable identity. |
| `title` | text | Yes | Yes/variant | Public title. |
| `slug` | text | Yes | Yes/variant | Stable per locale; uniqueness scope TBD. |
| `summary` | textarea/rich text limited | Yes | Yes | Public abstract/summary; length policy TBD. |
| `body` | rich text/blocks | No | Yes | Public landing/article body; do not store private full PDF body here without policy. |
| `publicationType` | relationship | Yes | No | Controlled type. |
| `desks` | **Not in MVP (DEC-003)** — relationship, one/many | TBD | No | Cardinality awaits taxonomy workshop. |
| `topics` | relationship, many | Yes (proposed) | No | At least one if business policy requires. |
| `tags` | **Not in MVP (DEC-003)** — relationship, many | No | No | Optional discovery labels. |
| `authors` | ordered relationship | Yes* | No | Relation metadata should preserve order and role. *Allow institutional author if approved. |
| `accessLevel` | enum | Yes | No | `public`, `registered`, `subscriber`; default must be consciously selected. |
| `status` | enum/CMS status | Yes | No | Draft/review/approved/scheduled/published/unpublished/archived as workflow permits. |
| `publishedAt` | timestamp | Conditional | No | Required when published; time zone policy UTC. |
| `updatedAtPublic` | timestamp | No | No | Editorially meaningful content update. |
| `coverAsset` | relationship | No | No | Public image asset only. |
| `assets` | relationship | No | No | One-to-many or join collection depending on CMS. |
| `translationGroup` | relationship/ID | Conditional | No | Required if linked-record model. |
| `locale` | enum | Conditional | No | Required if linked-record model. |
| `seoTitle` | text | No | Yes | Fallback to title if approved. |
| `seoDescription` | textarea | No | Yes | Fallback to summary if approved. |
| `canonicalOverride` | URL | No | No | Only when SEO owner permits; validate host. |
| `rightsStatement` | text/relation | TBD | Yes | Rights/licensing decision. |
| `citationText` | text | No | Yes | Generated or editorial citation format; define policy. |

### 4.2 PublicationAsset

| Field | Proposed type | Required | Owner note |
|---|---|---:|---|
| `id` | primary key | Yes | Stable identity. |
| `publication` | relation | Yes | Parent publication. |
| `label` | text | Yes | Human-readable file label. |
| `kind` | enum | Yes | cover, preview, full_document, appendix, dataset, supplementary, other. |
| `locale` | locale | No | Set if file is language-specific. |
| `mimeType` | text | Yes | Validated against file content where feasible. |
| `fileSizeBytes` | integer | Yes | Positive, maximum configured limit. |
| `storageProvider` | enum | Yes | Provider adapter identifier. |
| `bucket` | text | Yes | Private/public location classification; never client authority. |
| `objectKey` | text | Yes | Opaque key; server-only. |
| `checksum` | text | No | Integrity checking. |
| `accessOverride` | enum/null | No | Optional; effective rule defined in ACCESS-POLICY. |
| `processingStatus` | enum | Yes | pending, ready, failed, quarantined, archived. |
| `rightsMetadata` | text/relation | TBD | License/copyright restrictions. |
| `uploadedBy` | actor reference | Yes | Actor type + ID. |
| `createdAt` | timestamp | Yes | System-generated. |

Decide whether this collection is Payload-owned or application-owned before implementation. Do not store signed URLs here.

### 4.3 Author

| Field | Proposed type | Required | Localized | Notes |
|---|---|---:|---:|---|
| `id` | primary key | Yes | No | Stable person identity. |
| `displayName` | text | Yes | Possibly | Name presentation policy. |
| `slug` | text | Yes | Possibly | Public profile route only if required. |
| `biography` | rich text | No | Yes | Optional localized bio. |
| `photoAsset` | relationship | No | No | Public image only. |
| `affiliation` | text/relation | No | Yes | Only if organization wants this data. |
| `isPublic` | boolean | Yes | No | Controls public profile visibility, not publication credit. |
| `sortName` | text | No | No | Search/sort normalization. |

### 4.4 Taxonomy

`Topic` and `PublicationType` each need `id`, stable `name`, `slug`, optional description, `sortOrder`, `status/isActive`, and locale policy. Do not implement all as a single generic category table unless a later ADR justifies it.

### 4.5 LearningResource

**Status (2026-11-12):** cakupan launch disetujui (DEC-014; DECISIONS §2.8 Q2 A): video/playlist YouTube, panduan, dan toolkit unduhan publik, dikelompokkan per tema. Field di bawah tetap usulan; `downloadable` = toolkit. Relasi ke Topic, model bilingual, dan penyimpanan file toolkit OPEN (M3-11).

Proposed fields: `id`, localized `title`, `slug`, `description`, `resourceType` (video, playlist, reading, external_link, downloadable), `provider`, `externalUrl/embedId`, thumbnail asset, topics/desks, related publications, locale, status, publishedAt, SEO fields. Validate embed host against allowlist; never accept arbitrary iframe HTML from editors without sanitization.

### 4.6 Page

Proposed fields: `id`, localized title/slug/body blocks, status, locale/translation group, SEO metadata, publishedAt, updatedAt. Use constrained content blocks; do not provide unrestricted HTML unless sanitized and justified.

### 4.7 StaffUser

Fields: email, name, role(s), active/disabled state, MFA policy/state as available, timestamps, last activity if policy permits. Do not expose staff records publicly. Fine-grained collection/global permissions remain in Payload access configuration.

## 5. Application entities (Supabase/application-owned proposal)

### 5.1 PublicUserProfile

| Field | Type | Required | Rule |
|---|---|---:|---|
| `user_id` | UUID (references Auth user) | Yes | Primary key; no client-selected identity. |
| `display_name` | text | No | Length bounded; no sensitive data unless necessary. |
| `avatar_path` | text | No | Reference to approved public/user asset storage; policy TBD. |
| `locale_preference` | enum `id/en` | No | Must be allowlisted. |
| `created_at` | timestamptz | Yes | DB generated. |
| `updated_at` | timestamptz | Yes | DB generated. |

Do not duplicate email/password from Auth unless there is a documented need. Email change and verification remain Auth-owned.

### 5.2 Entitlement

**Fase (DECISIONS §2.8 Q1 A):** entitlement subscriber dibuat di Phase 2 (M7-02). Level `registered` saat launch (M5) tidak membutuhkan entitlement; cukup sesi pengguna publik yang valid.

| Field | Type | Required | Rule |
|---|---|---:|---|
| `id` | UUID | Yes | Primary key. |
| `user_id` | UUID | Yes | Auth user reference. |
| `scope_type` | enum | Yes | `publication`, `collection`, `plan`, `global` only if business approves. |
| `scope_id` | text/UUID nullable | Conditional | Publication or scope identity. |
| `source` | enum | Yes | `manual_grant`, `subscription`, `promotion`, `migration`, etc.; constrain values. |
| `status` | enum | Yes | `active`, `revoked`, `expired`, `pending` as required. |
| `valid_from` | timestamptz | Yes | Inclusive start. |
| `valid_until` | timestamptz nullable | No | Null means no predetermined expiry only when explicitly allowed. |
| `granted_by_type` | enum | Conditional | `staff`, `system`, `provider`. |
| `granted_by_id` | text nullable | No | Actor identity; avoid foreign key across auth domains unless supported. |
| `revoked_at` | timestamptz nullable | No | Audit field. |
| `revocation_reason` | text nullable | No | Minimize sensitive details. |
| `created_at` | timestamptz | Yes | DB generated. |

Constraint: entitlement must not be treated as active solely because status is `active`; evaluator also checks validity window and target scope. Prevent duplicate active grants where business rules require, using transaction/constraint strategy.

### 5.3 DownloadEvent

Proposed fields: `id`, `user_id` nullable for anonymous public event if analytics policy permits, `asset_ref`, `publication_ref`, `decision`, `reason_code`, `occurred_at`, `request_id`, `principal_type`, minimal technical metadata. Do not store signed URL, raw auth token, full IP or user-agent by default. Define retention and legal basis before enabling detailed event logging.

### 5.4 Future subscription entities

`Subscription`, `PaymentTransaction`, `PaymentWebhookEvent`, and `Invoice/Receipt` are Phase 2. Do not finalize schema until provider and commercial policy are selected. `Entitlement` remains the access-facing abstraction; payment status should not be checked ad hoc by each download route.

## 6. Relationships and cardinality

See `ERD.md`. Cardinalities marked `TBD` must be confirmed with editorial samples.

## 7. Constraints and validation catalogue

- Published publication requires all required locale-specific metadata and a valid publication type.
- Published asset must point to a ready storage object; quarantined/failed assets cannot be downloaded.
- Public asset must be located in public storage only after classification approval.
- Private asset must have a private bucket/object key and no public URL persisted in public projection.
- Slug uniqueness must be enforced by database/CMS constraint at chosen scope, not only application validation.
- `published_at` must be present when status is published; scheduled publication requires valid scheduled timestamp if workflow uses it.
- `valid_until` must be later than `valid_from`.
- Entitlement `scope_type` and `scope_id` combination must be valid.
- Relationships to archived/deleted taxonomy require a controlled archival/replace workflow.
- Validate URL fields to permitted protocols and hosts where relevant.
- Validate uploaded file's actual content/type in addition to filename extension.

## 8. Index recommendations (validate with EXPLAIN)

- Unique index on locale + slug or chosen scope.
- Index publication status + published_at for listing.
- Join indexes on publication-author/topic relations.
- Search vector GIN index on intended public fields.
- Index entitlement on `user_id`, `status`, validity window, scope fields.
- Index download event on time and asset/publication for bounded audit queries.
- Avoid speculative indexes on every field; add from query plan and real workload.

## 9. Migration ownership and lifecycle

Maintain a schema ownership ledger. Each migration must declare subsystem, purpose, backward compatibility, and rollback/forward-repair plan. Production changes use repository-controlled migrations. Prefer expand/contract for breaking changes: add nullable/new structure, backfill, deploy compatible code, switch reads/writes, then remove obsolete fields in a later release.

## 10. Open questions before schema freeze

1. Linked record vs Payload field localization.
2. Desk cardinality: closed, Desk not in MVP (DEC-003).
3. Asset metadata owner and adapter strategy.
4. Whether assets can override publication access level.
5. Whether author is required or institutional attribution is allowed.
6. Slug uniqueness scope and redirect retention.
7. Exact editorial status workflow.
8. Data retention for download events and deleted accounts.
9. Need for user avatar/profile fields.
10. Whether any public account data must be visible to staff and under what permission.
