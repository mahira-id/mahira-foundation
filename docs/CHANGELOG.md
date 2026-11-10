# CHANGELOG — Rekam Jejak Pekerjaan

| Item | Nilai |
|---|---|
| Status dokumen | Canonical (dokumen utama #2; pasangannya: `MILESTONES.md`) |
| Format | [Keep a Changelog](https://keepachangelog.com/) + SemVer; versi `1.0.0` = rilis produksi MVP (M4) |
| Owner | Haidar (Product Owner) |

## Aturan entri

- Satu entri per task selesai. Format: `- [Milestone-ID task] Ringkasan — bukti: commit/PR/tes/dokumen`.
- Kategori: **Added** · **Changed** · **Fixed** · **Removed** · **Decisions** · **Docs**.
- Entri tanpa bukti (commit, hasil tes, atau tautan) tidak boleh ditulis sebagai selesai.
- Keputusan cukup ditulis ID + status; rinciannya tetap di `decisions/DECISIONS.md`.
- Saat rilis, pindahkan isi `[Unreleased]` ke heading versi bertanggal.

## [Unreleased]

> Entri [M2-*] merujuk commit dari branch `spike/m2-payload-postgres`, yang masuk ke `master` lewat PR #3 (`e7f6876`). Entri [M3-02] dan [M3-01] merujuk commit di branch `wf/m3-02-m3-01-cms-locale` (belum di-push).

### Fixed
- [M3-01] Temuan C4c ditutup: `?fallback-locale=` tidak bisa memaksa fallback di jalur publik. REST anonim 403 (M3-02, P1 A); hook `denyPublicFallback` (`beforeOperation` di Topics, Publication Types, Authors) memaksa `fallbackLocale: false` untuk baca tanpa login; lapisan baca publik `lib/cms/public-content.ts` selalu memakai `fallbackLocale: false` — bukti: commit `8641593`; `m3-01-locale-checks` F1/F1.b (REST anonim `/api/topics?locale=en&fallback-locale=id` 403), F2/F3 (Local API anonim `find`/`findByID` locale en + `fallbackLocale: "id"` → nama ID tidak muncul), Q1–Q3 (`/en/publications?fallback-locale=id`, `?locale=id`, `?fallbackLocale=id` → daftar sama dengan tanpa parameter); OBSERVED F4: user staf tetap mendapat fallback yang diminta (alat editor, bukan halaman publik)
- [M3-02] Race shared-field DEC-004 (review M2 temuan 1): dua penulis di Translation Group yang sama bisa lolos cek bersamaan di READ COMMITTED. Kini `enforceSharedFields` dan `updateSharedFields` mengunci baris `translation_groups` (`SELECT … FOR UPDATE`) di dalam transaksi simpan sebelum membaca sibling; `lockTranslationGroup` gagal tertutup tanpa transaksi — bukti: commit `8488ee6`; `m3-02-race-checks` sebelum fix `pass=1 fail=3` (R1 FAIL: create EN commit tanpa menunggu, grup tidak konsisten; R2 0/10 ronde konsisten; R3 kedua create diterima), sesudah fix `pass=4 fail=0` (R1 menunggu commit A lalu ditolak hook; R2 10/10; R3 satu ditolak); lint + build exit 0
- [M3-02] REST anonim terbuka (temuan uji Preview 2026-11-10, temuan C4c sebagian): anonim bisa membaca publikasi `registered` dan memaksa fallback dengan `?fallback-locale=`. Kini REST anonim 403 di semua koleksi; Local API tanpa login hanya melihat Publication published + public (DECISIONS §2.4 P1) — bukti: commit `e0f71ec`; `m3-02-access-checks` `pass=39 fail=0 observed=2` (10 URL REST anonim termasuk `?draft=true` dan `?fallback-locale=id` → 403; `POST /api/graphql` 404; Local API anonim 12 dokumen = hitungan published+public, fixture registered/draft NotFound)
- [M3-00] Bukti Preview dengan CMS aktif: `dpl_HdrgFNmF49qwQ53vUjjGBSc2ms2N` (redeploy `644833c`, Preview, Node 26.x, 5 env CMS) — login `/admin` berhasil, `/api/publications?limit=1` 200 dengan data fixture. Nama env sempat salah (`SUPABASE_URL`); build Preview `dpl_9B3vL6etqPgbfSdJFNCJfoNKVD3Y` gagal dengan pesan "set tidak lengkap" sesuai desain, lalu diperbaiki Owner — bukti: uji Owner 2026-11-10
- [M3-00] Build produksi pulih: `644833c` READY dan dipromosikan; `mahira.id/` 200 (homepage), `/admin` 404, `/api/publications` 404 (CMS mati di Production, Opsi A) — bukti: Vercel `dpl_CEo1P2xzx6phTQPPmicCuHH8ZnSk`, cek HTTP 2026-11-10. Catatan: commit M3-00 ter-push langsung ke `master` tanpa PR karena branch lokal melacak `origin/master`

### Changed
- [M3-01] `proxy.ts` juga menjawab 404 untuk `/id/publications` dan `/en/publications` saat CMS mati (tanpa env atau `VERCEL_ENV=production`); `/` tidak berubah (`<html lang>` kini dari `DEFAULT_LOCALE`, keluaran sama; header tetap "EN segera", P4b (i)). Matriks build pada `8641593`: lint exit 0 (0 error, 8 warning lama); build tanpa env, lengkap, dan prod-sim exit 0; parsial exit 1 dengan nama variabel saja; cek gerbang HTTP off 11/11, prod 11/11 (`/admin`, `/api/*`, `/id/publications`, `/en/publications` 404; `/` 200), on 9/9 (`/id/publications` dan `/en/publications` 200 dengan `lang` sesuai); secret-scan `.next/static` + `.next/server` bersih (667/655/653 file) — bukti: commit `8641593`
- [M3-02] Pin `payload` dan `@payloadcms/next` kembali ke exact `3.93.0` (sebelumnya `^3.93.0` dari `08d03cb`); diff `bun.lock` hanya dua specifier, versi terpasang 3.93.0 — bukti: commit `e57a91b`; lint + build exit 0
- [M3-02] Matriks build pada `e0f71ec`: `bun run lint` exit 0 (0 error, 8 warning: `payload`/`req` tak terpakai di signature `down()` migrasi); build tanpa env, `.env.local` lengkap, dan `.env.local` + `VERCEL_ENV=production` exit 0; set parsial (`PAYLOAD_SECRET` saja) exit 1 dengan nama variabel saja; `next start` + cek gerbang HTTP: mode off 9/9, prod 9/9 (`/` 200, `/admin` `/admin/login` `/api/publications` `/api/users` dan POST `/admin` 404), on 7/7 (`/admin` 200, `/api/publications` dan `/api/users` 403 anonim); secret-scan `.next/static` + `.next/server` bersih (601/589/589 file) dan 20 file diff bersih
- [M3-00] Keputusan Owner 2026-11-10: Opsi A; U1 S1, U2 keep, U3 keep, U4 M, U5 keep, U6 (a). TLS ke pooler `mahira-cms` kini diverifikasi terhadap Supabase Root 2021 CA yang di-pin di `payload/db/supabase-root-ca.ts` (sertifikat publik), menggantikan `rejectUnauthorized: false`. `scripts/spike/secret-scan.mjs` → `scripts/secret-scan.mjs`. Bucket `spike-m2-public` dan prefix `spike-m2` dipertahankan sampai M3-08. Owner menghapus admin spike (`users` = 0, cek read-only); data fixture dipertahankan — bukti: commit `2dc2e19`; `migrate:status` 3/3 Ran=Yes dengan CA ter-pin
- PR #3 me-merge branch spike ke `master` (di luar rencana; ikut membawa commit M1). Build produksi Vercel `e7f6876` ERROR karena env CMS tidak ada saat build; produksi tetap di deploy `3839725`. Owner memilih maju lewat M3-00, bukan revert — bukti: GitHub PR #3, Vercel deployment `dpl_DjWwddkpA8UMp2KoyN6HBp9EkWAf`

### Added
- [M3-01] Routing locale (DEC-005, ADR-0005; DECISIONS §2.4 P4a B, P4c (i), P4d): `lib/i18n/locales.ts` (`id`/`en`, `DEFAULT_LOCALE = "id"` hanya untuk `/` dan Payload, `isLocale` peka huruf besar), kamus UI `id`/`en` lengkap, root layout `app/[locale]` (`<html lang>` per locale, locale lain 404, `/id` dan `/en` 404), kerangka `/{locale}/publications` (judul publikasi published + public di locale itu saja; filter, pagination, dan tautan detail di M3-05), language switcher server-rendered (tanpa pasangan → indeks publikasi locale lain, `hreflang`) — bukti: commit `8641593`; `m3-01-locale-checks` `pass=36 fail=0 observed=6`: `/id/publications` 7 dan `/en/publications` 4 slug = set published + public per locale (dari 11 dan 7 record), tanpa slug locale lain; switcher saling tertaut dengan `hreflang`; `/id`, `/en`, `/id/Publications`, `/fr/publications`, `/does-not-exist`, `/id/publications/x` 404; `/id/publications/` 308 → `/id/publications`; `/` 200 tidak berubah. Varian huruf besar (`/ID`, `/EN`, `/En` …): 404 di cek, tetapi 3 dari 6 varian tercatat OBSERVED 200 di Windows — `next start` membaca shell prerender `id`/`en` dari disk NTFS yang tidak peka huruf besar (tanpa daftar publikasi); perlu cek 404 di Vercel Preview (Linux)
- [M3-02] Role staf `Users.role` (`admin`/`editor`, default Editor; user pertama di DB kosong Admin; hanya Admin yang mengubah role) dan akses per role (DEC-016, DEC-009): manajemen user staf (create, delete, unlock) hanya Admin, Editor hanya membaca/mengubah user sendiri; term Topic dan Publication Type hanya Admin; Editor tidak bisa menghapus versi bahasa yang pernah terbit — bukti: commit `e0f71ec`; `m3-02-access-checks` (Editor: POST `/api/users` 403, GET `/api/users` hanya diri sendiri, `role: admin` ke diri sendiri diabaikan, PATCH/DELETE user lain 403, unlock 403, tulis Topic/Publication Type 403, POST publikasi 201, hapus publikasi pernah terbit 403, hapus draft 200; Admin: buat lalu hapus user 201/200, hapus publikasi pernah terbit 200)
- [M3-02] Field siklus hidup Publication: `everPublished` (penanda sistem, klien tidak bisa menulis) dan pengisian otomatis `publishedAt` saat terbit bila kosong (DECISIONS §2.4 P3, P6); `isActive` di Topic dan Publication Type (default nonaktif; aktif hanya bila nama ID dan EN terisi) — bukti: commit `e0f71ec`; access-checks LC1–LC5 (publishedAt terisi, tanggal eksplisit dipertahankan, draft tanpa tanggal, `everPublished` tetap true saat klien kirim false dan saat unpublish), E7/E9 (REST tidak bisa mengubah `everPublished`), D2/D3/D3b (`isActive` 400 dengan nama ID saja, 200 setelah nama EN, kosongkan nama EN pada term aktif 400)
- [M3-02] Migrasi `20261110_175914_m3_02_roles_access` (enum role, kolom `role`, `ever_published`, `version_ever_published`, `is_active`; berhenti bila user > 1; user Owner → Admin; backfill `ever_published` dari `_status` dan versi; RLS di akhir `up()`; `down()` dengan guard `IF EXISTS`, direview dan tidak dijalankan di DB bersama) diterapkan ke `mahira-cms` — bukti: commit `e0f71ec`; cek read-only `users=1` sebelum migrasi; `migrate:status` 4/4 Ran=Yes; verifikasi read-only `pass=5 fail=0` (role Owner `admin`, RLS 20/20 tabel `public`, `is_active` false 2/2 topics dan 2/2 publication_types, `ever_published` 15/15 publikasi published, 31/31 versi sesuai)
- [M2-01] Payload 3.93.0 embedded di Next.js 16.4.4 (`app/(payload)`, homepage ke `app/(site)`), Postgres adapter ke `mahira-cms` (session pooler, TLS), migrasi `initial` + `publications` dengan RLS di setiap tabel, admin `/admin`, REST `/api` — bukti: branch `spike/m2-payload-postgres` commit `17fdf0c`, `3b1ff83`; lint + build exit 0; upgrade, reset dan clean install exit 0; seed-count 5/5 PASS setelah fix `119a131` (run integrasi pada `35abfbe` sempat FAIL); Data API probe 15/15 PASS (`rows=0`); RLS 19/19; konkurensi 50+10 paralel 0 error; restart persistence OK; SPIKE-001 §7.1–§7.5
- [M2-02] Hook shared fields DEC-004, `updateSharedFields()`, helper hreflang, skrip localization checks 1–8 — bukti: commit `c8b783b`; `m2-02-localization-checks.ts` 2 run, masing-masing `pass=41 fail=0 observed=3`; check 4 PARTIAL (`fallback-locale`); lint + build exit 0; SPIKE-001 §7.6
- [M2-03] Koleksi `media` + `@payloadcms/storage-s3` 3.93.0 ke bucket publik `spike-m2-public` (Supabase `mahira.id`), `coverImage` di Publications — bukti: commit `c19a774`; `m2-03-storage-checks.ts` `pass=6 fail=0 observed=5`; durabilitas setelah restart OK; upload admin UI OK; secret-scan `.next/static` bersih; lint + build exit 0; SPIKE-003 §7
- [M2-04] Sebagian: `engines.node` `26.x`; `bun run build` exit 0 di setiap commit spike; proses runtime = `node` — bukti: commit `17fdf0c`, SPIKE-001 §7.7. Deploy preview dan region belum (DECISIONS §2.3 poin a, b)

### Decisions
- [M3-01] Butir "Still open" default locale di ADR-0005 dan IA-01 ditandai dijawab Owner 2026-11-10 (DECISIONS §2.4 P4c); status ADR-0005 dan DEC-005 tidak berubah — bukti: `decisions/ADR/ADR-0005-routing-and-url.md`, `specifications/IA-ROUTING-I18N.md` §4 dan §10
- [M3-02] Jawaban Owner 2026-11-10 (P1 A, P2 A, P3 B (i), P4a B, P4b (i), P4c (i), P4d setuju, P5 A, P6 A (i), P7 C) dicatat sebagai catatan, tanpa perubahan status DEC; log `cacheComponents` di admin tetap ada (P2 A, known issue); Data API `mahira-cms` dimatikan Owner (P7 C) — bukti: `decisions/DECISIONS.md` §2.4; langkah Owner di `engineering/ENVIRONMENTS.md` §3.1
- [M2-05] DEC-006, DEC-007, DEC-013 → Accepted 2026-11-10; bukti spike ditambahkan ke DEC-004/005; pin `engines.node` 26.x (DEC-018) disetujui, versi Node di Vercel di-set Owner; DEC-012 tetap Proposed — bukti: `decisions/DECISIONS.md` §2.1, ADR-0002 ditandai partly superseded
- DEC-004/005/006/007/012/013/018: rekomendasi M2 dicatat sebagai usulan (bukan keputusan) — bukti: decisions/DECISIONS.md §2.3
- DEC-005 addendum → Accepted 2026-11-09: search `/{locale}/publications?q=`, type `/{locale}/publications/type/{slug}` — bukti: `decisions/DECISIONS.md` §2.1
- [M1-08] Owner: 10 PDF RFID = contoh sementara; uji nilai taksonomi ditunda ke M4-05
- DEC-009 → Accepted 2026-11-09: role hanya Public user, Editor, Admin; tanpa bypass staf di unduhan publik — bukti: `decisions/DECISIONS.md` §2.1

### Changed
- [M1-01] PRD §13 AC 5–6 dan SRS FR-009–013 → MVP+ (DEC-002) — bukti: branch `docs/m1-reconciliation`
- [M1-03] SRS: aktor Reviewer/Finance tidak dipakai; "Staf" = Editor + Admin (DEC-009) — bukti: branch `docs/m1-reconciliation`
- [M1-02] DEC-003 diterapkan ke CONTENT-ARCHITECTURE, DATA-MODEL, ERD, EDITORIAL-WORKFLOW, SEO-SPECIFICATION, SRS (Desk/Tag keluar dari MVP) — bukti: branch `docs/m1-reconciliation`
- [M1-03b] SRS matriks akses + T-06 dan TEST-PLAN matriks mengikuti DEC-009 — bukti: branch `docs/m1-reconciliation`
- [M1-04] Route search/type disatukan di ADR-0005, IA-ROUTING-I18N, API-SPECIFICATION, PAGE-SPECIFICATIONS; route & param Desk dihapus — bukti: branch `docs/m1-reconciliation`
- [M1-06] Tautan DEC di SPIKE-001/002/003 diperbaiki — bukti: branch `docs/m1-reconciliation`
- [M1-07] PRD/SRS title block & document control mengikuti DEC-001 dan Owner Haidar — bukti: branch `docs/m1-reconciliation`
- `.gitignore`: `public/publications/` (PDF pihak ketiga, fixture lokal) agar tidak ter-deploy — bukti: branch `docs/m1-reconciliation`

### Fixed
- [M3-00] Build Vercel gagal untuk `e7f6876` (`dpl_DjWwddkpA8UMp2KoyN6HBp9EkWAf`) dan `0389bcb` (`dpl_DXVxq7vuNP4tUC4gF29VnhLAw8zm`) karena config Payload mewajibkan env CMS saat build. Perbaikan: `payload/env.ts` membaca 5 variabel CMS sebagai satu set (lihat ENG-ENV-001 §3.1); CMS mati bila semua kosong atau `VERCEL_ENV=production`; set parsial menggagalkan build dengan nama variabel yang hilang; `proxy.ts` menjawab 404 untuk `/admin` dan `/api/*` saat CMS mati — bukti: commit `2dc2e19`; `bun run lint` exit 0 (0 error, 6 warning lama); build tanpa env exit 0, dengan `.env.local` lengkap exit 0, dengan `.env.local` + `VERCEL_ENV=production` exit 0, set parsial exit 1 (nama variabel tampil, nilai tidak); `next start` tanpa env: `/` 200, `/robots.txt` 200, `/icon.svg` 200, `/admin` `/admin/login` `/api/publications` `/api/users` 404, POST `/admin` 404; prod-sim: `/` 200, `/admin` `/api/publications` 404; env lengkap: `/` 200, `/admin` → create-first-user (form tidak dikirim), `/api/users` 403, `/api/publications` `totalDocs=15`; `payload-types.ts` tidak berubah (CMS hidup maupun mati); secret-scan `.next/static` + `.next/server` bersih (604 file); `app/(site)` dan file fondasi lain tidak berubah (`git diff --exit-code 0389bcb` exit 0)
- [M2-03] `down()` migrasi `media` diberi guard `IF EXISTS`; mode `SPIKE_MODE=count` di seed hanya menghitung grup seed (sebelumnya FAIL karena grup fixture M2-02/M2-03) — bukti: commit `119a131`; `migrate:down` → `migrate` berhasil, `migrate:status` 3/3 Ran=Yes, RLS 20/20, seed-count 5/5 PASS; lint + build exit 0; SPIKE-001 §7.2
- [M1-05] ADR-0001: heading "Opsi terpilih: Opsi B" (Vite) yang bertentangan dengan keputusan diusulkan dihapus — bukti: branch `docs/m1-reconciliation`

### Removed
- [M3-00] Skrip spike `scripts/spike/m2-01-db-smoke.ts`, `m2-01-seed.ts`, `m2-02-localization-checks.ts`, `m2-03-storage-checks.ts`; `payload/db/database-uri.ts` (`SPIKE_DB_PORT`, `describeDatabaseUri`); `requireEnv`. Semuanya tetap ada di branch arsip `spike/m2-payload-postgres` — bukti: commit `2dc2e19`; pencarian `SPIKE ONLY|SPIKE_DB_PORT|requireEnv|describeDatabaseUri|scripts/spike` di `payload`, `app`, `lib`, `scripts`, `components`: 0 hasil
- [M0-05] `INTEGRATE-INTO-REPOSITORY.md`, `PACKAGE-MANIFEST.json` (sisa paket dokumen; langkahnya sudah tercakup di MILESTONES M1–M2) — bukti: branch `chore/m0-cleanup`

### Changed
- [M0-05] `docs/CHAT_WITH_CLAUDE.md` → `docs/references/CHAT_WITH_CLAUDE.md`, diindeks sebagai REF-001 — bukti: branch `chore/m0-cleanup`
- [M0-06] Root `README.md`: boilerplate create-next-app diganti petunjuk proyek (Bun, alur branch/PR) — bukti: branch `chore/m0-cleanup`, lint + build lulus

### Decisions
- DEC-018 → Accepted 2026-11-09: Bun = package manager, Node.js = runtime — bukti: `decisions/DECISIONS.md` §2.1
- DEC-007 tetap Open; lingkungan spike dicatat (CMS `mahira-cms`, APP `mahira.id`) — bukti: `decisions/DECISIONS.md` §2.2, Supabase Management API

### Docs
- [M2-05] SPIKE-001 dan SPIKE-003 diisi hasil spike M2 (format SPIKE-TEMPLATE §1–§10); pointer validasi di ADR-0004/ADR-0005; MILESTONES M2-01–M2-03 dicentang — bukti: branch `spike/m2-payload-postgres`, commit dokumen M2; status DEC tidak berubah
- [M0-04] Paket dokumen & `.kiro/` di-commit dengan identitas Mahira ID — commit `2da3510`
- [M0] `docs/MILESTONES.md` dan `docs/CHANGELOG.md` ditetapkan sebagai dua dokumen rujukan utama; `docs/README.md` diperbarui. Menggantikan `STATUS.md` yang sudah tidak ada — commit `2da3510`

## 2026-11-08 — Keputusan Owner

### Decisions
- DEC-001, DEC-002, DEC-003 (struktur), DEC-004, DEC-005, DEC-015, DEC-016, DEC-021 → Accepted oleh Haidar (Product Owner) — bukti: `decisions/DECISIONS.md` §2.1
- DEC-004/005 masih menunggu bukti validasi spike (lihat M2-02)

## 2026-11-06 — Paket dokumentasi

### Docs
- [M0-03] Paket dokumen `docs/` (architecture, specifications, engineering, design, content, legal, spikes, decisions) dan `.kiro/steering`, `.kiro/skills` ditambahkan — bukti: untracked di git, menunggu M0-04

## Riwayat awal (git)

### Added
- [M0-02] Logo Mahira berbagai varian warna — commit `70f85dc`
- [M0-01] Homepage editorial (hero, publikasi sampel, indeks, topik, Learning Hub, tentang) + emblem logo — commit `024c69c`
- Inisialisasi Create Next App — commit `08f41a7`
