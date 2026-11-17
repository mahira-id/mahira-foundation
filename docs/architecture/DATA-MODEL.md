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
| PublicationAsset metadata | Payload (koleksi upload `publication-files`, M3-08, DECISIONS §2.14 butir 1) | Staff write; read anonim Local API hanya `ready` + `public`; lokasi storage server-only | Payload migration workflow |
| LearningResource | Payload | Payload access control | Payload migration workflow |
| Page | Payload | Payload access control | Payload migration workflow |
| StaffUser | Payload Auth | Payload Auth + collection access | Payload migration workflow |
| PublicUser profile | Application schema + Supabase Auth identity | RLS; user can read/update approved fields only | Supabase/application migration |
| Entitlement | Application schema | Server writes; user reads only own allowed summary | Supabase/application migration |
| Subscription (Phase 2) | Application schema | Server/provider event writes; user reads own projection | Supabase/application migration |
| DownloadEvent | Application schema | Server inserts; restricted staff access; retention | Supabase/application migration |
| PaymentEvent (Phase 2) | Application schema | Server only; verified provider event | Supabase/application migration |

**Critical ownership issue:** SRS places assets near Payload and storage in Supabase. Decide whether Payload owns the asset metadata collection and uses an adapter, or whether app-owned storage metadata references Payload publications. Do not duplicate one asset record across both owners without a synchronization contract. **Diputuskan 2026-11-16 (DECISIONS §2.14 butir 1):** Payload memiliki metadata aset (koleksi `publication-files`) dan menyimpan objeknya lewat adapter `@payloadcms/storage-s3` di Supabase Storage; tidak ada record aset kedua di skema aplikasi (§4.2).

## 3. Common conventions

- Primary key: use the ID strategy generated/required by the selected ORM/CMS; do not assume UUID if Payload adapter defaults differ. Application-owned tables may use UUID.
- `created_at`, `updated_at`: server/database-generated; never trusted from public client.
- `created_by`, `updated_by`: staff relation or verified user ID where applicable; maintain actor type where sources differ.
- Slugs: normalized lowercase kebab-case; unique scope TBD (global vs per locale vs collection). Slug changes create redirect records. Publikasi: slug unik per locale (DEC-005, indeks `locale_slug_idx`); sejak M3-07 setiap slug yang pernah tayang published + `public` dicatat di riwayat slug `publication-slugs` (§4.8) untuk redirect 308 slug lama (DECISIONS §2.11 P9 A).
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
| `assets` | relationship | No | No | One-to-many or join collection depending on CMS. Diterapkan M3-08 sebagai `files`: upload `hasMany` → `publication-files`, urutan tersimpan, per record (bukan field bersama DEC-004), ikut versi/draf (§4.2). |
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

#### 4.2.1 Implementasi M3-08: koleksi `publication-files` (diterapkan)

Koleksi upload Payload `publication-files` (`payload/collections/PublicationFiles.ts`, tabel `publication_files`, migrasi `20261115_181459_m3_08_publication_files`), terpisah dari `media`. Dasar: keputusan Owner 2026-11-16 (DECISIONS §2.14 butir 1–4, 8). Objek disimpan di private bucket `publication-files` lewat `@payloadcms/storage-s3` 3.93.0 (`payload/payload.config.ts`).

| Field usulan di atas | Diterapkan sebagai | Aturan |
|---|---|---|
| `id` | `id` serial | Kunci primer; id di URL unduhan `/api/files/{id}/download`. |
| `publication` | tanpa back-relation; `Publications.files` (upload `hasMany`, berurutan) | Satu file untuk tepat satu record publikasi (satu bahasa): hook `beforeChange` Publication menolak file yang sudah dicantumkan baris utama record lain atau versi `latest` record lain, dan file yang sama dua kali (`payload/hooks/one-publication-per-file.ts`). |
| `label` | `label` text | Wajib; teks panel di halaman detail. |
| `kind` | `kind` select | Wajib: `preview`, `full_document`, `appendix`, `dataset`, `supplementary`, `other` (tanpa `cover`; cover tetap `media`). |
| `locale` | `language` select `id`/`en` | Wajib; bahasa dokumen itu sendiri (boleh beda dari record publikasi). |
| `mimeType` | `mimeType` (Payload) | Hanya `application/pdf`; Payload memeriksa isi file (deteksi tipe + header `%PDF-` + `xref`/`%%EOF` di 1 KB terakhir), juga untuk client upload. |
| `fileSizeBytes` | `filesize` (Payload) | Maksimal 52428800 byte (50 MB, batas bucket; hook `refuseOversizedFile`). |
| `storageProvider`, `bucket` | konfigurasi adapter, bukan kolom | Bucket `publication-files` adalah konstanta di config; tidak pernah dari client. |
| `objectKey` | `filename` + `prefix` + `_objectKey` (plugin) | Nama asli yang disanitasi Payload (unik, indeks `publication_files_filename_idx`); client upload menambah segmen acak `_objectKey`. Server-only: tidak pernah di-select untuk halaman publik. |
| `checksum` | tidak ada | Belum dibutuhkan. |
| `accessOverride` | `accessLevel` select | Wajib, tanpa default, `public`/`registered`/`subscriber` (DEC-011 Accepted). Akses efektif = yang lebih ketat dengan publikasi (ACCESS-POLICY §4.2). |
| `processingStatus` | `status` select | `pending`, `ready`, `failed`, `quarantined`, `archived`; diisi sistem (`ready` saat dibuat; create/update access `false`). |
| `rightsMetadata`, `uploadedBy` | tidak ada | Di luar cakupan M3-08. |
| `createdAt` | `createdAt`/`updatedAt` | Diisi sistem. |

- **Kolom tambahan Payload:** `url` (`/api/publication-files/file/<nama>`, hanya untuk admin), `thumbnail_u_r_l`, `width`, `height`, `focal_x`, `focal_y` (kosong untuk PDF).
- **Tanpa versi:** perubahan label, jenis, bahasa, dan Access Level langsung berlaku. Isi file yang dipakai versi tayang publikasi tidak dapat diganti atau dihapus (butir 8, EDITORIAL-WORKFLOW §9.4).
- **Akses:** read staf atau Local API anonim dengan `PUBLIC_FILE_READ` (`status = ready` dan `accessLevel = public`); REST anonim ditolak; create/update/delete staf (`isStaff`). RLS aktif di tabel baru (migrasi `up()` memanggil `enableRlsOnPayloadTables`).
- **Migrasi:** aditif saja: empat enum, tabel `publication_files`, kolom nullable `publication_files_id` (FK `ON DELETE cascade`) di `publications_rels`, `_publications_v_rels`, dan `payload_locked_documents_rels`. `down()` menghapusnya dengan `IF EXISTS` (daftar file publikasi hilang; objek di bucket tetap).
- **Tidak disimpan:** signed URL, URL bucket publik, data unduhan (tanpa audit atau hitungan di M3-08, butir 9).

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

### 4.6.1 About (global Payload `about`, M3-09, diterapkan)

Keputusan Owner 2026-11-17 (DECISIONS §2.15 keputusan 1–4, 6). Satu dokumen (singleton) `payload/globals/About.ts`, bukan koleksi; tidak berelasi dengan koleksi lain.

| Field | Tipe | Lokalisasi | Catatan |
|---|---|---|---|
| `hero.eyebrow`, `hero.lead` | teks, textarea (paragraf dipisah baris kosong) | per locale | Opsional. |
| `hero.title` | teks | per locale | Wajib; H1 halaman. |
| `hero.ctas[]` (maks 2) | `label`, `kind` (`anchor`/`publications`/`email`), `anchor` | per locale | Tujuan diselesaikan kode; `anchor` hanya untuk jenis `anchor`. |
| `sections[]` | array | per locale | Urutan = urutan tampil. |
| `sections[].anchor` | teks | per locale | Pola slug (huruf kecil, angka, tanda hubung tunggal); target CTA. |
| `sections[].label`, `.heading`, `.body`, `.quote`, `.outro` | teks/textarea | per locale | Label = eyebrow seksi; judul H2 (label bila judul kosong); `quote` = kutipan sorot; `outro` = paragraf penutup setelah daftar. |
| `sections[].lists[]` | `heading`, `intro`, `style` (`numbered`/`bulleted`), `items[]` | per locale | Beberapa daftar per seksi, masing-masing dengan subjudul sendiri. |
| `sections[].lists[].items[]` | `title`, `subtitle`, `text` | per locale | Judul butir (kata pembuka tebal), sub-label tebal opsional, teks. |
| `sections[].ctas[]` (maks 2) | seperti `hero.ctas` | per locale | Satu-satunya field di luar daftar keputusan 2; dipakai CTA seksi penutup (keputusan 14). |
| `seo.title`, `seo.description` | teks, textarea | per locale | Wajib; `<title>` dan meta description. |
| `contactEmail` | email | bersama | Opsional; target CTA `email` (`mailto:`). |
| `enReady` | checkbox | bersama | Label "Versi EN siap tayang"; default mati; hanya staf; menentukan apakah EN tampil. |

- **Versi:** `versions: { drafts: true, max: 25 }`; satu `_status` untuk kedua locale.
- **Akses:** staf (Editor/Admin) membaca semuanya (termasuk draf); Local API anonim hanya `_status = published` (filter di akses baca); REST/GraphQL anonim ditolak; `update` dan `readVersions` hanya staf. Hook `denyPublicFallbackForGlobal` menolak pembacaan anonim yang meminta locale fallback. Pembacaan publik hanya lewat `lib/cms/public-content.ts` (`overrideAccess: false`, `fallbackLocale: false`).
- **Penayangan:** `isAboutVisible(doc, locale)`: published, `hero.title`, `seo.title`, `seo.description` terisi; EN juga `enReady`.
- **Penyimpanan:** migrasi `20261117_055203_m3_09_about` menambah 14 tabel (`about`, `about_locales`, `about_hero_ctas`, `about_sections`, `about_sections_ctas`, `about_sections_lists`, `about_sections_lists_items`, dan tujuh tabel versi `_about_v*`) serta 9 enum, dengan RLS aktif di `up()` (DEC-007). Diterapkan ke `mahira-cms`.
- **Isi.** Tidak ada isi organisasi di repo; tes memakai teks `[FIXTURE]` dan memulihkan global ke keadaan semula (TEST-PLAN §12.3).

### 4.7 StaffUser

Fields: email, name, role(s), active/disabled state, MFA policy/state as available, timestamps, last activity if policy permits. Do not expose staff records publicly. Fine-grained collection/global permissions remain in Payload access configuration.

### 4.8 PublicationSlug (riwayat slug, M3-07, diterapkan)

Koleksi Payload `publication-slugs` (`payload/collections/PublicationSlugs.ts`, tabel `publication_slugs`, migrasi `20261115_054138_m3_07_publication_slugs`). Dasar: keputusan Owner 2026-11-15 butir 7 (redirect 308 slug lama dengan riwayat slug per locale, migrasi disetujui) dan DECISIONS §2.11 P9 A. Bentuk penyimpanan, slug mana yang dicatat, rantai, dan konflik adalah usulan planner M3-07 (DECISIONS §2.13, PP1–PP4), bukan keputusan Owner.

| Field | Tipe | Wajib | Aturan |
|---|---|---:|---|
| `id` | serial | Ya | Kunci primer. |
| `publication` | relationship → `publications` | Ya | Record yang terakhir menerbitkan URL ini sebagai published + `public`. FK `ON DELETE set null` pada kolom `NOT NULL`: hook `beforeDelete` Publication menghapus baris record lebih dulu. |
| `locale` | select `id`/`en` | Ya | Locale URL. |
| `slug` | text | Ya | `validateSlug` (huruf kecil, angka, tanda hubung tunggal). |
| `createdAt`, `updatedAt` | timestamp | Ya | Diisi sistem. |

- **Keunikan:** satu pemilik per URL, indeks unik (`locale`, `slug`) = `locale_slug_1_idx` (Payload menamai indeks gabungan menurut kolom; `publications` tetap `locale_slug_idx` karena koleksi itu dibangun lebih dulu).
- **Yang dicatat:** hook `afterChange` Publication (`payload/hooks/publication-slugs.ts` `recordPublicSlug`) membaca ulang record di tabel utama dengan `PUBLIC_PUBLICATION_READ` di transaksi simpan yang sama. Bila record kini published + `public`, URL-nya dicatat (slug saat ini juga); baris yang milik record lain dipindah ke record ini. Simpan draft, unpublish, dan Access Level `registered`/`subscriber` tidak mencatat apa pun.
- **Rantai:** baris menunjuk record, bukan slug berikutnya, jadi A → B → C selalu berakhir di slug C saat ini dalam satu langkah.
- **Retensi:** baris disimpan sampai slug itu diterbitkan record lain (baris pindah) atau record dihapus (baris dihapus). Kapan slug lama dianggap retired untuk konten produksi tetap terbuka (ADR-0005 "Still open").
- **Akses:** read hanya staf atau Local API anonim server-side (REST anonim ditolak, P1 A); create/update/delete ditolak untuk semua pemanggil API, hanya hook dengan `overrideAccess: true` yang menulis. Tanpa versi; `admin.hidden`. RLS aktif (migrasi `up()` memanggil `enableRlsOnPayloadTables`).
- **Backfill migrasi:** record published + `public` yang tayang, lalu versi published + `public` di `_publications_v` (terbaru per `locale` + `slug`, versi record yang sudah dihapus dilewati); `ON CONFLICT DO NOTHING`. `down()` menghapus tabel, enum, dan kolom `payload_locked_documents_rels.publication_slugs_id` (riwayat hilang; `up()` ulang membangunnya lagi dari record dan versi yang masih ada, maksimal 25 versi per record).
- **Pemakaian:** halaman detail membaca riwayat hanya bila tidak ada record published + `public` dengan URL itu (`lib/cms/public-content.ts` `getPublicationRedirect`), lalu membaca record tujuan sebagai pengunjung anonim; redirect hanya ke locale yang sama (IA-ROUTING-I18N §5).

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
- Public asset must be located in public storage only after classification approval. Sejak M3-08 file PDF publikasi, juga yang `public`, ada di private bucket dan diunduh lewat signed URL (DECISIONS §2.14 butir 2); public storage hanya untuk cover/image.
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
3. Asset metadata owner and adapter strategy. Dijawab 2026-11-16 (DECISIONS §2.14 butir 1): Payload, koleksi upload `publication-files` dengan `@payloadcms/storage-s3` ke private bucket `publication-files` (§4.2.1).
4. Whether assets can override publication access level. Dijawab 2026-11-16 (DECISIONS §2.14 butir 3, DEC-011 Accepted): setiap file punya `accessLevel` wajib tanpa default; akses efektif = yang lebih ketat; file yang lebih longgar tidak berpengaruh (ACCESS-POLICY §4.2).
5. Whether author is required or institutional attribution is allowed.
6. Slug uniqueness scope and redirect retention. Keunikan per locale terbukti (DEC-005); riwayat slug dan retensinya diterapkan di M3-07 (§4.8). Aturan retired untuk konten produksi tetap terbuka (ADR-0005).
7. Exact editorial status workflow.
8. Data retention for download events and deleted accounts.
9. Need for user avatar/profile fields.
10. Whether any public account data must be visible to staff and under what permission.
