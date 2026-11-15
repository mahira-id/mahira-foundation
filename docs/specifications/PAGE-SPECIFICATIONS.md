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
- **Tautan sejak M3-05 (DECISIONS §2.11 P10 A):** judul lead bertautan ke `/id/publications/{slug}` (`components/home/publication-lead.tsx`); setiap baris indeks tetap `<details>`, dan panelnya (di luar `<summary>`) berisi tautan "Baca publikasi" ke `/id/publications/{slug}` (`data-home-read`, `components/home/latest-publications.tsx`). Saat CMS mati tidak ada tautan publikasi. Header dan footer tidak berubah.

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

Implementasi M3-07 (DEC-021, DECISIONS §2.13 keputusan 1–6): `metadataBase` `https://mahira.id` di kedua root layout (juga di Preview); canonical `https://mahira.id` (self, tanpa query string); tanpa hreflang (tidak ada homepage EN); Open Graph `website`, `og:locale` `id_ID`, `og:url`, judul dan deskripsi situs, gambar `https://mahira.id/og/site` (gambar tipografis 1200×630 hasil `ImageResponse`: logo Mahira, baris "Riset · Kebijakan · Pembelajaran", headline hero); Twitter `summary_large_image` dengan gambar yang sama. Tanpa JSON-LD. Kode: `lib/seo/metadata.ts` `homeMetadata`, `app/(site)/page.tsx`, `app/og/site/route.tsx`. Kata kunci metadata layout (termasuk "learning hub") tidak diubah.

## 3. Publication index

**Route:** `/{locale}/publications` · **Audience:** public · **Indexing:** halaman 1 tanpa query dan `?page=n` tanpa filter dapat diindeks dengan canonical ke dirinya sendiri; URL dengan `q`, filter, atau state tidak valid `noindex, follow` tanpa canonical (M3-07, DECISIONS §2.13 keputusan 2).

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

### Implementasi M3-05 (DECISIONS §2.11)
- **Kode:** `app/[locale]/publications/page.tsx`; kontrak URL `lib/publications/index-params.ts`; view model `lib/publications/index-view.ts`; query `lib/cms/publication-index-query.ts`; baca `getPublicationIndex` di `lib/cms/public-content.ts` (anonim, `overrideAccess: false`, `draft: false`, `fallbackLocale: false`); komponen `components/publication/{publication-list,index-filters,index-pagination}.tsx`.
- **Yang tampil:** hanya publikasi published + `public` di locale route (P7 A, DEC-002). Pencarian `q` diterapkan di M3-06 (bagian "Implementasi M3-06" di bawah); tanpa lead dan cover di indeks (P15 A).
- **Kontrak query (P2 A, P3 A):** `?type=<slug>&topic=<slug>&year=<yyyy>&page=<n>`, urutan tetap, nilai kosong = tidak ada, `page` dihilangkan untuk halaman 1; parameter lain diabaikan. 12 baris per halaman. Form GET `next/form` dengan satu `<select>` per filter yang punya pilihan ("Semua" = kosong), tombol "Terapkan"; tautan "Hapus filter" ke `/{locale}/publications` bila ada filter. Filter tanpa pilihan tidak dirender; tanpa pilihan sama sekali tidak ada form. Menerapkan filter kembali ke halaman 1.
- **Pilihan filter (P1 A, P5 A):** term `isActive: true` dengan nama di locale halaman dan dipakai ≥ 1 publikasi tampil; tahun = tahun `publishedAt` dalam WIB. `topic` cocok di posisi mana pun; filter digabung AND; `year` mengecualikan publikasi tanpa tanggal.
- **Urutan (P4 A):** bertanggal (`publishedAt` terbaru) lalu tanpa tanggal (`createdAt` terbaru); seri dipecah dengan `id` terbaru.
- **Baris (P15 A):** tanggal · jenis (`<time>` hanya bila ada `publishedAt`), judul `<h2>` bertautan ke `/{locale}/publications/{slug}` (anchor hanya berisi judul), penulis, ringkasan dipotong 3 baris, bidang kerja utama, badge akses berbahasa locale. Tanggal "28 Okt 2026" / "28 Oct 2026".
- **Pagination:** tampil bila lebih dari satu halaman; "Sebelumnya"/"Berikutnya" (nonaktif di ujung, `aria-disabled`), nomor halaman (`aria-current="page"`), "Halaman p dari n"; tautan tidak memuat nilai kosong.
- **State (`data-index-state`):** `list`; `empty` (katalog kosong, teks lama); `no-results` ("Tidak ada publikasi yang cocok dengan filter ini." + "Hapus filter"); `unknown-filter` (slug tidak ada, term nonaktif atau tanpa publikasi tampil, tahun tanpa publikasi: "Filter tidak dikenal: …" + "Hapus filter"; nilai tidak pernah ditampilkan ulang); `page-not-found` (`page` bukan bilangan bulat positif atau lewat halaman terakhir: "Halaman ini tidak ada." + "Kembali ke halaman 1"); `error` (gagal baca: "Publikasi belum dapat dimuat. …", log `[publications]` hanya nama galat). Pada `no-results` dan `unknown-filter`, "Hapus filter" tampil dua kali (bar filter dan pesan). Semua state HTTP 200 (daftar di-stream di `Suspense`).
- **Robots (P3 A, DEC-021):** `noindex, follow` bila ada `q` atau filter berisi (sejak M3-06 `q` dihitung sebagai filter), atau state `unknown-filter`, `page-not-found`, `error`. `/{locale}/publications` dan `?page=n` tanpa filter boleh diindeks; canonical dan hreflang sejak M3-07 (di bawah).
- **SEO (M3-07, DEC-021, DECISIONS §2.13 keputusan 2, 3, 5; `lib/seo/metadata.ts` `indexMetadata`):** URL yang dapat diindeks punya canonical ke dirinya sendiri di `https://mahira.id`: halaman 1 tanpa `?page` (juga untuk `?page=1` dan parameter tak dikenal seperti `?utm_source=`), halaman n `?page=n`. hreflang `id` ↔ `en` (`/id/publications` ↔ `/en/publications`) hanya di halaman 1, tanpa x-default. URL `noindex, follow` tidak punya canonical dan hreflang. Setiap state punya Open Graph `website` (`og:locale` `id_ID`/`en_GB`, judul "Publikasi — Mahira Indonesia Development" / "Publications — …", deskripsi = intro kamus, `og:url` = canonical, untuk URL noindex URL dasar indeks) dan Twitter `summary_large_image`; gambar `https://mahira.id/og/{locale}/publications` (gambar tipografis judul indeks; 404 bila CMS mati).
- **CMS mati:** 404 dari `proxy.ts` (P14 A).

### Implementasi M3-06 (DECISIONS §2.12; ADR-0007)
- **Kode:** `app/[locale]/publications/page.tsx` (meneruskan `q`, `searchable`, teks tanpa hasil); `components/publication/index-filters.tsx` (form); teks di `lib/i18n/dictionaries.ts` (`searchLabel`, `clearSearch`, `noResultsSearch`, `filtersLabel`); kontrak URL `lib/publications/index-params.ts`; kata dan tsquery `lib/publications/search-terms.ts`; SQL `lib/cms/publication-search-query.ts`; baca `getPublicationIndex` di `lib/cms/public-content.ts`.
- **Form (P3):** satu form GET `next/form`, jalan tanpa JavaScript. Urutan field di DOM = urutan URL: `q` (`<input type="search" name="q" id="filter-q" maxlength="100" enterkeyhint="search">` dengan `<label>` permanen "Cari publikasi" / "Search publications"), lalu select `type`, `topic`, `year`, lalu tombol "Terapkan" / "Apply". URL `?q=&type=&topic=&year=&page=`; nilai kosong tidak ditulis oleh `indexHref`/`readIndexQuery`; menerapkan kembali ke halaman 1. Nama form (`aria-label`): "Cari dan saring publikasi" / "Search and filter publications". Form tampil selama katalog tidak kosong (state bukan `empty`), juga bila tidak ada filter yang punya pilihan, sehingga kotak cari tetap ada. Tidak ada kotak cari di header atau homepage (P9).
- **Nilai `q` (P8):** ditampilkan kembali di kotak cari dalam bentuk ternormalisasi (NFKC, deretan spasi menjadi satu, dipotong ke 100 code point) dan di-escape React. Tautan pagination, "Kembali ke halaman 1", dan "Hapus pencarian dan filter" memakai filter yang sama (`q` ikut kecuali tautan hapus). Tautan hapus bila ada `q` atau filter: "Hapus pencarian dan filter" / "Clear search and filters" (tanpa `q`: "Hapus filter" / "Clear filters" seperti M3-05).
- **State (`data-index-state`):** tidak ada nilai baru. `q` dihitung sebagai filter: nol hasil → `no-results`; `unknown-filter` dan `page-not-found` bekerja seperti M3-05 dengan `q` ikut. Dengan `q`, `no-results` menampilkan "Tidak ada publikasi yang cocok dengan pencarian ini." / "No publications match this search." (tidak mengutip `q`); tanpa `q` teks filter M3-05 tetap. "Hapus pencarian dan filter" tampil dua kali (bar form dan pesan), seperti pola M3-05.
- **Usulan planner, bukan keputusan Owner:** (1) `q` lebih dari 100 karakter dipotong ke 100 code point pertama, dicari dan ditampilkan ulang dalam bentuk itu, tanpa pesan galat. (2) `q` hanya spasi = tidak ada `q` (daftar biasa, dapat diindeks); `q` hanya tanda baca → `no-results` tanpa query SQL; `q` hanya stop word EN → query tetap dikirim, Postgres menjadikannya tsquery kosong tanpa baris, jadi `no-results`; keduanya tetap `noindex, follow`. (3) Tidak ada state baru di `data-index-state`.
- **Robots:** setiap URL dengan `q` berisi `noindex, follow` (DEC-021).
- **Uji:** `tests/integration/publication-search.test.ts` SR8 (isi kotak cari, label, `maxlength`, escape), SR9 (urutan field = urutan URL, tanpa kontrol `sort`), SR10 (teks tanpa hasil ID/EN, tanpa mengutip `q`, label hapus), SR11 (`page-not-found` mempertahankan `q`); cek visual manual ID desktop dan 390 px lewat Playwright MCP (tangkapan layar di folder tugas, tidak dilacak git).

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
Locale-specific metadata, canonical, reciprocal hreflang only for valid translation pairs, OG image, publication structured data only when fields are reliable. Do not expose private file URL in metadata. Structured data (JSON-LD) tidak ada di M3-07 (DECISIONS §2.13 keputusan 6; PUB-OQ-39 tetap terbuka).

### Implementasi M3-05 (DECISIONS §2.11)
- **Kode:** `app/[locale]/publications/[slug]/page.tsx` (route blocking, `export const instant = false`, tanpa `Suspense` dan tanpa `loading.tsx`), `app/[locale]/publications/[slug]/error.tsx` (galat tak terduga, tombol `retry()`), `app/[locale]/not-found.tsx` (M3-05b), `components/publication/{publication-detail,publication-error-state,preview-banner}.tsx`, `lib/publications/detail-view.ts`, `lib/cms/publication-detail-query.ts`, `getPublicationDetail` di `lib/cms/public-content.ts`.
- **Yang punya halaman (P7 A):** hanya publikasi published + `public` di locale itu. Penyimpangan sementara dari PRD §8 sampai M5: publikasi `registered`/`subscriber` tidak punya halaman metadata (DEC-002, DECISIONS §2.8).
- **Not-found (amandemen P7 A):** draft, `registered`, `subscriber`, slug locale lain, slug tidak ada, huruf besar, pola slug tidak valid, dan slug lama yang record tujuannya tidak lagi published + `public` di locale itu → `notFound()`: **HTTP 200** + `<meta name="robots" content="noindex">` + halaman not-found Mahira (sejak M3-05b; sampai M3-05 halaman bawaan Next berteks Inggris). Penyebab status 200: static shell per locale dikirim sebelum halaman jalan (DECISIONS §2.11, amandemen). Sejak M3-07 (DECISIONS §2.13 keputusan 8): user agent di daftar `htmlLimitedBots` (`lib/seo/html-limited-bots.ts`: daftar bawaan Next 16.4.4, misalnya Bingbot, ditambah Googlebot) mendapat render blocking tanpa static shell, jadi kasus yang sama menjawab **HTTP 404** dengan halaman not-found Mahira yang sama; browser dan user agent lain tetap HTTP 200. Trailing slash → 308 tanpa slash.
- **Slug lama (M3-07, DECISIONS §2.11 P9 A):** URL tanpa record published + `public` yang slugnya ada di riwayat slug (DATA-MODEL §4.8) dan record pemiliknya kini published + `public` di locale yang sama → `permanentRedirect()` ke `/{locale}/publications/{slug saat ini}` tanpa query string (`getPublicationRedirect`). Status HTTP per user agent: IA-ROUTING-I18N §5 aturan 3.
- **Halaman not-found Mahira (M3-05b, disetujui Owner 2026-11-14):** `app/[locale]/not-found.tsx` untuk setiap `notFound()` di bawah layout `[locale]`. Header situs (`LocaleHeader`, switcher ke indeks locale lain), `<main data-not-found="{locale}">` dengan H1 "Halaman tidak ditemukan" / "Page not found", teks "Halaman yang Anda cari tidak ada atau tidak lagi tersedia." / "The page you are looking for does not exist or is no longer available.", dan tombol "Lihat seluruh publikasi" / "View all publications" ke `/{locale}/publications` (`lib/i18n/dictionaries.ts` `notFound`). Locale dari root param (`next/root-params`), karena file not-found tidak menerima props. Tema terang dengan token `app/(site)/globals.css` dan Hanken Grotesk, juga saat browser memakai mode gelap (`colorScheme: "light"` dari layout). `<title>` tetap judul situs (not-found bersarang tidak mendukung metadata). Respons HTML-nya error shell Next 16.4.4 (`<html id="__next_error__">`) dan browser merender halaman dari payload RSC, sama seperti halaman bawaan sebelumnya; tanpa JavaScript halaman kosong.
- **URL yang tidak cocok dengan route (M3-07, DECISIONS §2.13 keputusan 9; sampai M3-07 halaman 404 bawaan Next berteks Inggris):** `/foo`, `/id`, `/en`, `/id/foo` (diuji GNF1, G10) → `app/global-not-found.tsx` (`experimental.globalNotFound: true` di `next.config.ts`; app punya dua root layout, jadi tidak ada `app/not-found.tsx`): **HTTP 404** + `noindex` (ditambahkan Next) untuk semua user agent. Dokumen HTML penuh tanpa layout: `<html lang="id">`, `<title>` "Halaman tidak ditemukan — Mahira Indonesia Development", header biru dengan logo ke `/`, `<main data-global-not-found>` dua kolom (satu kolom di layar sempit): H1 "Halaman tidak ditemukan" dan teks not-found ID, lalu bagian `lang="en"` dengan H2 "Page not found" dan teks EN (`lib/i18n/dictionaries.ts` `notFound`). Tautan: "Lihat seluruh publikasi" / "View all publications" ke `/{id,en}/publications` hanya saat CMS hidup (`isCmsEnabled()`; saat CMS mati `proxy.ts` menjawab 404 untuk indeks), dan "Ke beranda" / "Go to the homepage" ke `/` (versi EN dengan `hrefLang="id"`). Tema terang dengan token `app/(site)/globals.css` dan Hanken Grotesk, juga di mode gelap (`colorScheme: "light"`). **Celah tercatat (usulan planner PP11):** locale tidak dikenal (`/xx/publications`) cocok dengan route `[locale]/publications`; layout `[locale]` memanggil `notFound()` dan Next 16.4.4 merender halaman 404 bawaan Next di sana (HTTP 404, `noindex`, teks Inggris), bukan halaman global ini.
- **Isi (P7 A):** `<article data-publication-detail data-preview>`; breadcrumb ("Publikasi" → `/{locale}/publications`, lalu judul `aria-current="page"`); jenis, bidang kerja (utama dulu; label term nonaktif tetap tampil bila bernama, P5 A), tanggal terbit bila ada, bahasa; H1; ringkasan penuh per paragraf (dipisah baris kosong); `<dl>` penulis, terbit, bidang kerja, akses (badge berbahasa locale); `coverImage` bila Media gambar dengan `url`, lebar, tinggi (`next/image` `unoptimized`, alt dari Media), selain itu cover tipografis. Tanpa panel unduhan sampai M3-08; tanpa publikasi terkait, isi, sitasi, bagikan.
- **Metadata:** `<title>` = judul, description = ringkasan (tanpa description bila ringkasan kosong).
- **SEO (M3-07, DEC-021, DECISIONS §2.13 keputusan 2, 3, 5; `lib/seo/metadata.ts` `detailMetadata`):** hanya mode publik. Canonical `https://mahira.id/{locale}/publications/{slug}`; hreflang hanya bila record locale lain di Translation Group yang sama published + `public` (`getPublicationAlternates`), berisi kedua locale (self = canonical), tanpa x-default. Open Graph `article`, `og:locale` `id_ID`/`en_GB`, `og:url` = canonical, judul dan ringkasan record locale itu (tanpa fallback), `og:site_name`; gambar = `coverImage` (URL publik, ukuran, alt; alt kosong → judul) bila ada, selain itu `https://mahira.id/og/{locale}/publications/{slug}`: gambar tipografis 1200×630 (logo, label "Publikasi"/"Publications", judul maksimal 4 baris) yang membaca judul record published + `public` locale itu secara anonim (`getPublicPublicationTitle`), `Cache-Control: no-store`; slug draft, unpublished, `registered`/`subscriber`, locale lain, tidak dikenal atau tidak valid, dan CMS mati → 404. Twitter `summary_large_image` dengan gambar yang sama. Pratinjau staf, not-found, slug lama (redirect), dan state galat tidak punya canonical, hreflang, atau Open Graph. Font gambar: Hanken Grotesk 700 latin + latin-ext (`assets/fonts/`, OFL); karakter di luar subset itu diambil `next/og` dari Google Fonts saat render (perilaku bawaan `@vercel/og`; gagal unduh tidak menggagalkan gambar).
- **Switcher (P8 A):** pasangan Translation Group yang published + public di locale lain → tautan ke detail pasangan (`hrefLang`); tanpa pasangan → `/{locale lain}/publications` dengan `title` "Belum tersedia dalam English" / "Not available in Bahasa Indonesia" (juga sebagai teks `sr-only`). Logo di halaman EN → `/` dengan `hrefLang="id"`.
- **Gagal baca (amandemen P15 A):** halaman merender state galat berbahasa locale di server (`data-publication-error`, "Publikasi belum dapat dimuat." / "This publication could not be loaded.", tautan "Muat ulang" ke URL yang sama): **HTTP 200** + `noindex, follow`; HTML tanpa host DB; log `[publication-detail]` hanya nama galat.
- **Pratinjau draf staf (P11 A):** lihat EDITORIAL-WORKFLOW §9. Dalam pratinjau: banner `role="status"` `data-preview-banner` "Pratinjau draf: belum tentu terlihat pengunjung." / "Draft preview: visitors may not see this version." dengan tombol "Keluar dari pratinjau" / "Exit preview" (form POST native ke `/api/preview/exit`), `data-preview="true"`, robots `noindex, nofollow`, `Cache-Control` berisi `no-store`. Switcher memakai pasangan yang published saja.
- **Keluar dari pratinjau (M3-05b, disetujui Owner 2026-11-14):** form mengirim `id`, `locale`, `slug`. `app/api/preview/exit/route.ts` mematikan Draft Mode lalu menjawab 303 ke `previewExitTarget` (`lib/cms/staff-preview.ts`): untuk sesi Editor/Admin yang terverifikasi, detail publik versi tayang bila record published + `public` (dibaca anonim lewat `findPublicRef`; locale dan slug record itu sendiri, bukan dari form), selain itu (belum pernah terbit, sudah di-unpublish, Access Level bukan `public`) halaman edit `/admin/collections/publications/<id>` bila record ada. Tanpa sesi staf, `id` tidak valid, atau record tidak ada: detail dari `locale`/`slug` kiriman bila valid, selain itu `/`, seperti di M3-05; tanpa sesi staf tidak pernah ke `/admin`. Hanya path situs ini; gagal baca CMS → target terakhir itu, log `[preview]` hanya nama galat; CMS mati → 404.
- **CMS mati:** 404 dari `proxy.ts` (P14 A).

## 5. Search results

**Route:** `/{locale}/publications?q=...` (query state on the publication index; decided 2026-11-09, DEC-005 addendum). Page is `noindex` (DEC-021).

- Show query, result count, filters, sort, list, pagination.
- Empty query should not trigger expensive unrestricted search; show discovery suggestions or recent publications.
- No-results includes query correction/removal suggestions.
- Escape/highlight matched terms safely; never render search HTML as trusted markup.
- Search is initially locale-scoped per SRS recommendation; cross-locale mode is TBD.
- **Diterapkan di M3-06 (DECISIONS §2.12, ADR-0007):** query, jumlah hasil, filter, daftar, dan pagination ada di halaman indeks yang sama. Tidak ada kontrol urutan dan tidak ada parameter `sort`; urutan = relevansi bila ada `q`. Tidak ada highlight kata cocok dan tidak ada saran atau koreksi query (P4, P7). `q` kosong = indeks biasa (daftar terbaru), bukan pencarian. Pesan tanpa hasil tidak mengutip `q`. Cakupan dan perilaku: "Implementasi M3-06" di §3.

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
