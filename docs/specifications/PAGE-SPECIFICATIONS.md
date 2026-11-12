# Page Specifications — Initial Public and Account Slices

**ID:** SPEC-PAGE-001 · **Status:** Proposed baseline · **Version:** 0.1.0

Dokumen ini adalah page-level contract awal, bukan pixel-perfect wireframe. Urutan blok, data, state, dan acceptance criteria menjadi dasar desain detail serta implementasi. Perubahan komposisi visual harus tetap mengikuti PDD.

## 1. Shared page contract

Setiap page specification harus menetapkan: route/locale, audience, access, data source, rendering/cache, content hierarchy, actions, states, SEO, accessibility, analytics events (bila disetujui), dan test cases.

Shared states:
- Loading/skeleton atau streaming state yang tidak menyebabkan layout shift besar.
- Empty state dengan penjelasan dan next action.
- No-results untuk hasil pencarian kosong.
- Error dengan recovery path dan retry jika aman.
- Locked state yang menjelaskan syarat akses.
- Not found untuk konten yang tidak tersedia/published.
- Locale unavailable untuk konten tanpa terjemahan.

## 2. Homepage

**Route:** `/` (Indonesia; DEC-005, DECISIONS §2.7 P6 A) · **Audience:** public · **Auth:** none · **Indexing:** indexable.

Homepage hanya ada di `/` dan hanya menampilkan publikasi `locale: id`; bare `/id` dan `/en` tetap 404 (DEC-005). Header dan footer menampilkan "EN segera" (§2.4 P4b (i)). Homepage Inggris: **OPEN**.

### Block order (proposed)
1. Masthead/navigation: logo, primary navigation, locale switcher, CTA jika sudah disahkan.
2. Hero thesis: identitas dan proposisi organisasi; copy final berasal dari stakeholder.
3. Publication lead: satu publikasi unggulan dengan cover, type, title, summary, authors, date, access label.
4. Latest publications: editorial list/feature layout; link ke katalog.
5. Topics (Bidang Kerja, DEC-003): tampilkan hanya taksonomi aktif dan terkurasi.
6. Learning Hub teaser: hanya jika katalog memiliki materi nyata. Mulai M3-12 (DECISIONS §2.7 P2 A); sampai saat itu blok dan item menu "Learning Hub" (header, footer) tidak tampil.
7. About/impact: fakta dan klaim harus memiliki sumber/approval.
8. Footer: legal, contact, social links yang valid.

### Data
CMS-owned page configuration, published publications, active topic, published learning resources. Statistik seperti jumlah publikasi atau jumlah topik tidak boleh hardcoded sebagai klaim; tampilkan hanya dengan query yang tervalidasi atau hilangkan.

Implementasi M3-04 (DECISIONS §2.7):
- **Statis di kode (P2 A):** hero, Tentang + prinsip kerja, dan CTA penutup adalah konfigurasi yang disepakati (`lib/landing-content.ts`, `app/(site)/page.tsx`), bukan data CMS. Konfigurasi halaman dari CMS belum ada. Kolom "Topik" di footer dihapus.
- **Dari CMS saat request (P1 A, P2 A):** publikasi lead, indeks publikasi terbaru, dan Bidang kerja dibaca lewat lapisan baca publik anonim (`lib/cms/public-content.ts`: published + public, `locale: id`, tanpa draft, tanpa fallback locale), di dalam `Suspense` dengan `connection()` (§2.6 P3 A).
- **Lead dan indeks (P4a A, P4b (i)):** lead = publikasi ID terbaru menurut `publishedAt`; indeks = sampai 4 publikasi berikutnya tanpa mengulang lead. Publikasi tanpa `publishedAt` tampil di belakang yang bertanggal, diurutkan menurut `createdAt` terbaru, tanpa tanggal.
- **Bidang kerja (P10 A):** Topic dengan `isActive: true` dan nama ID, diurutkan menurut nama, dengan deskripsi ID bila ada, tanpa tautan. Label jenis/topik pada publikasi tetap tampil walau term-nya nonaktif.
- **Cover dan tanggal (P2b (i), P9 A):** cover tipografis dari data (jenis, topik utama, judul, tahun), tanpa nomor edisi dan gambar; tanpa lead, cover hero adalah cover merek. Tanggal "28 Okt 2026" dalam WIB.
- **Tautan (P5 A):** judul belum ditautkan sampai M3-05; tombol "Lihat semua publikasi" → `/id/publications` hanya dirender saat CMS hidup.

### States
- Jika belum ada featured item, gunakan layout latest publications tanpa placeholder klaim.
- Jika learning hub kosong, sembunyikan blok atau tampilkan state editorial yang disetujui.
- Error pada satu section tidak harus menjatuhkan seluruh homepage; tentukan graceful degradation.
- M3-04 (DECISIONS §2.7 P1 A, P3 A):
  - **CMS mati** (tanpa env, atau `VERCEL_ENV=production`): `/` tetap 200 dengan blok statis; blok Publikasi berisi "Belum ada publikasi yang terbit. Publikasi akan tampil di sini setelah diterbitkan."; Indeks dan Bidang kerja tidak tampil.
  - **Tanpa publikasi:** catatan yang sama; Indeks tidak tampil. **Satu publikasi:** lead saja. **Tanpa topik aktif:** Bidang kerja tidak tampil.
  - **Baca CMS gagal:** blok Publikasi berisi "Publikasi belum dapat dimuat. Coba muat ulang halaman beberapa saat lagi.", Bidang kerja tidak tampil, halaman tetap 200; baris log aplikasi `[homepage]` hanya mencatat nama galat. Batas: bila koneksi Postgres gagal saat init Payload, log adapter Payload sendiri (`@payloadcms/db-postgres`) memuat pesan galat koneksi yang dapat berisi host/user pooler (TEST-PLAN §12.5).

### SEO/a11y
Unique title/description, canonical, OG, one primary H1, semantic landmarks, descriptive image alt, skip link, keyboard-operable navigation.

## 3. Publication index

**Route:** `/{locale}/publications` · **Audience:** public · **Indexing:** indexable canonical; arbitrary query variants noindex/canonical policy to be finalized.

### Hierarchy
1. Breadcrumb/page title/intro.
2. Search input and clear control.
3. Filter controls: publication type, topic, year, access level only where useful and supported by data.
4. Result count only if computed from actual query.
5. Featured item or editorial lead (optional; avoid duplicate promotion).
6. Publication list/grid with consistent metadata.
7. Pagination.

### Item metadata
Title, short summary, publication type, topic, author display, published date, locale, access label, optional cover, reading/download indication only if accurate.

### Behavior
- Search and committed filters are URL-addressable.
- Filters can be combined only where semantics are defined.
- Pagination resets when query/filter changes.
- Stable ordering and page size.
- Preserve locale and filters when opening detail and navigating back.

### States
Initial, loading, populated, no results, empty catalog, error, invalid filter, pagination boundary.

### SEO/a11y
Index page title; use links for navigation; labels for filters; announce result updates accessibly; avoid indexing infinite filter permutations.

## 4. Publication detail

**Route:** `/{locale}/publications/{slug}` · **Audience:** public · **Indexing:** published metadata page indexable unless policy says otherwise.

### Hierarchy
1. Breadcrumb.
2. Type/access label and publication date.
3. H1 title.
4. Summary/abstract.
5. Author list and affiliations where approved.
6. Topic taxonomy (DEC-003).
7. Cover or editorial image.
8. Download/preview panel per asset and access policy.
9. Table of contents or body if available.
10. References/citation metadata if available.
11. Related publications based on explicit relation or transparent algorithm.
12. Citation/share actions if included in scope.

### Access behavior
Metadata remains public according to PRD. Each downloadable asset resolves its effective access policy. Locked UI must say whether login or entitlement is required and must not imply a failure. Download authorization is always server-side.

### States
Published, unpublished/not found, translation unavailable, asset unavailable, public download, login required, entitlement required, storage error, archived/withdrawn notice.

### SEO
Locale-specific metadata, canonical, reciprocal hreflang only for valid translation pairs, OG image, publication structured data only when fields are reliable. Do not expose private file URL in metadata.

## 5. Search results

**Route:** `/{locale}/publications?q=...` (query state on the publication index; decided 2026-11-09, DEC-005 addendum). Page is `noindex` (DEC-021).

- Show query, result count, filters, sort, list, pagination.
- Empty query should not trigger expensive unrestricted search; show discovery suggestions or recent publications.
- No-results includes query correction/removal suggestions.
- Escape/highlight matched terms safely; never render search HTML as trusted markup.
- Search is initially locale-scoped per SRS recommendation; cross-locale mode is TBD.

## 6. Locked content state

This is a component/pattern reused in publication detail and resource cards.

- State the actual requirement: sign in, registered account, active subscriber entitlement, or unavailable.
- Provide one primary next action appropriate to state.
- Do not reveal private storage path, entitlement internals, or staff-only metadata.
- Do not show subscription price or purchase CTA until plan and legal terms are approved.
- If the user is already entitled but download fails, show a service error, not an upsell.

## 7. Account overview

**Route:** `/{locale}/account` · **Audience:** authenticated public user · **Indexing:** noindex.  
**Fase:** pra-launch (M5; DECISIONS §2.8 Q1 A); status langganan Phase 2 (M7).

- Account summary, verified-email status if available, profile actions.
- Access/entitlement summary in user-friendly language.
- Links to profile and library/download history only if shipped.
- Do not show internal staff roles or other users' information.
- Session-expired state redirects through approved auth flow with safe return URL.

## 8. Publication CMS form (editorial specification)

Not a public page, but a critical operational surface. Required groups: core metadata, locale/translation link, authors, taxonomy, publication type, lifecycle, access, assets, SEO, preview/publish controls. Exact fields come from DATA-MODEL.md. Inline field validation; unsaved-change warning; preview; clear draft/published state; permission-aware actions.

## 9. Learning Hub index/detail (launch, DEC-014)

**Cakupan launch (DECISIONS §2.8 Q2 A):** katalog per tema, embed video/playlist YouTube, panduan, dan toolkit yang dapat diunduh publik; semua tanpa login; tanpa progress, kuis, atau sertifikat. Referensi struktur: https://www.cips-indonesia.org/cips-learning-hub (identitas dan aset tidak disalin).

**OPEN (M3-11):** model konten dan jenis materi, relasi tema ke Topic/"Bidang kerja", model bilingual, route (IA-ROUTING-I18N §3.1), penyimpanan file toolkit, serta halaman detail per materi vs embed langsung di katalog. Hierarki di bawah adalah baseline lama dan ditinjau ulang di M3-11.

Index: title/intro, topic/format filters only if data exists, resource listing, empty/error/loading. Detail: title, format, summary, thumbnail, external provider/source, embed with accessible title, related publications. External embeds must respect privacy/consent requirements and should not load third-party trackers before necessary consent if policy requires.

## 10. Wireframe and review checklist

Before high-fidelity UI, create low-fidelity wireframes for homepage, publication index, publication detail, search results, locked state, account overview, and CMS create/edit. Review content density with real publication examples in both locales. Confirm mobile flow, keyboard navigation, empty/error/locked states, and editorial usability with an actual editor.
