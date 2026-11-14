# ADR-0007 — PostgreSQL Search Baseline

- **Status:** Accepted (2026-11-15). Implementation and evidence: "Implementasi M3-06" below.
- **Related decisions:** DEC-013 (Accepted 2026-11-10), DEC-005 addendum (search via `/{locale}/publications?q=`, Accepted 2026-11-09), DEC-021; jawaban Owner M3-06 (DECISIONS §2.12)
- **Decision owner / approver:** Engineering + Product Owner. Approver: Haidar (Product Owner): DEC-013 Accepted 2026-11-10; jawaban M3-06 2026-11-15 (DECISIONS §2.12). No Engineering owner is named yet.

## Context

Search MVP needs publication title, summary/abstract, author, topic, type, and locale. SRS proposes PostgreSQL full-text search and `pg_trgm`; external engines are candidates only if scale or relevance requires them. PDF text extraction remains optional.

## Decision

Start with Postgres FTS on explicitly selected public fields. Add `pg_trgm` only for a demonstrated partial/fuzzy matching need. Search results must respect publication status, locale, visibility, and public metadata policy. Search must not disclose draft/private fields or gated file content.

## Ranking and indexing

- Initial ranking gives strongest weight to title, then summary/abstract, then taxonomy/author metadata.
- Exact ranking weights remain a tuning parameter based on representative content and search evaluation, not an arbitrary permanent value.
- Define normalization for Indonesian and English separately where needed; language dictionaries/configurations must be tested on real terms.
- Index updates on publish/unpublish/translation changes must not expose draft records.
- Search results must have stable pagination and deterministic tie-break ordering.

## PDF full-text

Do not include PDF full-text in MVP unless a spike demonstrates extraction quality, language support, processing cost, security, and content-rights suitability. Extracted text is sensitive content and must inherit file access classification; it must not accidentally become a public search snippet for gated files.

## Exit / scale-up criteria

Evaluate Meilisearch/Typesense only when measured query latency, relevance tuning, typo tolerance, multilingual behavior, facets, or load requirements exceed the Postgres solution. Migration requires a source-of-truth and reindexing plan.

## Validation

Create a representative dataset and a relevance test set with expected top results for ID/EN. Measure query latency, typo behavior, no-result behavior, pagination, index freshness, and non-disclosure of drafts/gated contents.

## Implementasi M3-06 (2026-11-15)

Keputusan produk: jawaban Owner 2026-11-15 (DECISIONS §2.12 P1–P11). Kode: `lib/cms/publication-search-query.ts` (SQL), `lib/publications/search-terms.ts` (kata → tsquery), `lib/publications/index-params.ts` (`q`), `lib/publications/index-view.ts` (`planIndex` dengan rank), `lib/cms/public-content.ts` (`getPublicationIndex`).

### Penyimpanan: pilihan 6B (§2.12 P6)

- **Pilihan:** `to_tsvector` dihitung saat query. Tidak ada kolom `tsvector`, indeks GIN, atau migrasi; tidak ada yang diterapkan ke `mahira-cms`.
- **Alasan (bukti read-only 2026-11-15, PG 17.11):** dokumen pencarian berasal dari lima tabel (`publications`, `publications_rels`, `authors.display_name`, `topics_locales.name`, `publication_types_locales.name`). Generated column tidak dapat membaca tabel lain, jadi 6A butuh trigger atau hook di empat tabel lebih, backfill, dan snapshot migrasi Payload yang tidak lagi cocok dengan skema. Volume saat ini kecil: 18 record `publications` (11 published + public) dan 31 baris `_publications_v`. Indeks M3-05 sudah memindai semua record yang terlihat di setiap request (`findIndexRefs`).
- **Bukti tanpa perubahan skema:** `bun run payload migrate:create m3_06_schema_check --skip-empty` tidak membuat file.
- **Trigger review:** lebih dari 5.000 publikasi published, atau p95 pencarian lebih dari 300 ms. Saat itu evaluasi 6A: kolom `tsvector` + GIN lewat migrasi Payload yang di-commit, RLS di `up()` (DEC-007).

### Dokumen, konfigurasi, dan bobot (§2.12 P1, P2)

- Field: `title` (bobot A), `summary` (B), serta nama penulis, nama topik (Bidang kerja), dan nama jenis publikasi dalam locale route (C). Isi body dan isi PDF tidak dicari (DEC-013).
- Konfigurasi per locale: `/id` memakai `indonesian`, `/en` memakai `english` (`SEARCH_CONFIG`). Fakta 2026-11-15: stemming `indonesian` jalan (`pembangunan`/`membangun` → `bangun`, `kebijakan`/`kebijakannya` → `bijak`), stop word tidak dibuang (`dan`, `yang` tetap lexeme). `english` membuang stop word (`the` → query kosong) dan melakukan stemming (`policies`/`policy` → `polici`, `governance`/`governing` → `govern`).
- Bobot `ts_rank('{0.1,0.2,0.4,1.0}', …)` (urutan D, C, B, A) adalah tuning awal, bukan nilai permanen. Satu kemunculan: A 0,608, B 0,243, C 0,122.

### Query dan urutan (§2.12 P3–P5)

- `q` dinormalisasi (NFKC, deretan spasi atau karakter kontrol menjadi satu spasi, trim, 100 code point pertama). Kata = deretan huruf atau angka Unicode (`[\p{L}\p{N}]+`); karakter lain hanya pemisah, jadi operator tsquery dari pengunjung (`& | ! ( ) : * < >`) tidak pernah sampai ke Postgres. Semua kata digabung dengan AND; kata terakhir juga dicocokkan sebagai prefix (`ekon` cocok dengan `ekonomi`).
- Teks query, locale, dan konfigurasi selalu dikirim sebagai parameter terikat (`to_tsquery($n::regconfig, $m)`). Tidak ada SQL yang dirangkai dari input.
- `q` digabung dengan `type`, `topic`, dan `year` secara AND. Dengan `q`: rank turun, rank sama mengikuti urutan M3-05 (bertanggal `publishedAt` terbaru dulu, lalu tanpa tanggal `createdAt` terbaru, lalu `id` lebih besar), jadi pagination stabil. Tanpa `q`: urutan M3-05 (§2.11 P4 A). Tidak ada parameter `sort`.
- `pg_trgm` tidak dipasang: tes relevansi SR1–SR3 lulus dengan kata utuh + stemming + prefix kata terakhir. Typo tidak ditoleransi; itu bahan evaluasi bila Owner menemukannya pada konten nyata.

### Non-disclosure dan kesegaran

SQL pencarian adalah satu-satunya bacaan publik di luar Local API. Hasilnya dijaga dalam empat lapisan: (1) `WHERE` mengulang `PUBLIC_PUBLICATION_READ` (`_status` published, `access_level` public) dan `locale` record pada baris utama `publications`, tidak pernah `_publications_v`, jadi draf tertunda tidak pernah dicari; (2) nama topik dan jenis hanya dari baris `_locale` = locale route, tanpa fallback; (3) SQL hanya mengembalikan id dan rank, lalu `planIndex` hanya menyimpan id yang juga dikembalikan scan anonim `findIndexRefs`; (4) baris halaman berasal dari `findIndexPage` anonim. `ts_rank` dihitung per dokumen, jadi record tersembunyi tidak memengaruhi rank record lain. Pencarian dihitung per request (tanpa `"use cache"`, jadi tanpa `cacheTag`); publish dan unpublish terlihat pada request berikutnya (SR6). Log galat tetap hanya nama galat (`[publications]`).

### Usulan planner (bukan keputusan Owner)

- `q` lebih dari 100 karakter: 100 code point pertama sesudah normalisasi dipakai untuk mencari dan ditampilkan lagi; tidak ada state galat.
- `q` tanpa kata yang bisa dicari: `q` yang hanya spasi sama dengan tanpa `q` (daftar biasa, boleh diindeks). `q` yang hanya tanda baca menjadi `no-results` tanpa query SQL. `q` yang hanya berisi stop word Inggris menghasilkan tsquery kosong, jadi `no-results`. Setiap `q` yang tidak kosong membuat halaman `noindex, follow`.
- Tidak ada nilai `data-index-state` baru: `q` dihitung sebagai filter (tanpa hasil → `no-results`).
- Runner integrasi bisa menjalankan file tertentu: `bun run test:integration --only <nama,...>` (nama file `search` sejak M3-06).

### Validasi

Unit SRU1–SRU7 dan integrasi SR1–SR7 dengan fixture sintetis ID/EN `fixture-test-search-` dan hasil teratas yang diharapkan (TEST-PLAN §12.2). Relevansi pada konten nyata dicek Owner di Vercel Preview sesudah merge (§2.12 P10). Latensi pencarian belum diukur terpisah; satu request indeks ke pooler jarak jauh butuh ±1–2 detik untuk semua query-nya (TEST-PLAN §12.1). Pengukuran p95 untuk trigger review di atas dilakukan di Preview atau M4.
