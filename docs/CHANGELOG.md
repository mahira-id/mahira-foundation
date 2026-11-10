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

### Added
- [M2-01] Payload 3.93.0 embedded di Next.js 16.4.4 (`app/(payload)`, homepage ke `app/(site)`), Postgres adapter ke `mahira-cms` (session pooler, TLS), migrasi `initial` + `publications` dengan RLS di setiap tabel, admin `/admin`, REST `/api` — bukti: branch `spike/m2-payload-postgres` commit `17fdf0c`, `3b1ff83`; lint + build exit 0; upgrade, reset dan clean install exit 0; seed-count 5/5 PASS di setiap run; Data API probe 15/15 PASS (`rows=0`); RLS 19/19; konkurensi 50+10 paralel 0 error; restart persistence OK; SPIKE-001 §7.1–§7.5
- [M2-02] Hook shared fields DEC-004, `updateSharedFields()`, helper hreflang, skrip localization checks 1–8 — bukti: commit `c8b783b`; `m2-02-localization-checks.ts` 2 run, masing-masing `pass=41 fail=0 observed=3`; check 4 PARTIAL (`fallback-locale`); lint + build exit 0; SPIKE-001 §7.6
- [M2-03] Koleksi `media` + `@payloadcms/storage-s3` 3.93.0 ke bucket publik `spike-m2-public` (Supabase `mahira.id`), `coverImage` di Publications — bukti: commit `c19a774`; `m2-03-storage-checks.ts` `pass=6 fail=0 observed=5`; durabilitas setelah restart OK; upload admin UI OK; secret-scan `.next/static` bersih; lint + build exit 0; SPIKE-003 §7
- [M2-04] Sebagian: `engines.node` `26.x`; `bun run build` exit 0 di setiap commit spike; proses runtime = `node` — bukti: commit `17fdf0c`, SPIKE-001 §7.7. Deploy preview dan region belum (DECISIONS §2.3 poin a, b)

### Decisions
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
- [M2-03] `down()` migrasi `media` diberi guard `IF EXISTS`; mode `SPIKE_MODE=count` di seed hanya menghitung grup seed (sebelumnya FAIL karena grup fixture M2-02/M2-03) — bukti: commit `119a131`; `migrate:down` → `migrate` berhasil, `migrate:status` 3/3 Ran=Yes, RLS 20/20, seed-count 5/5 PASS; lint + build exit 0; SPIKE-001 §7.2
- [M1-05] ADR-0001: heading "Opsi terpilih: Opsi B" (Vite) yang bertentangan dengan keputusan diusulkan dihapus — bukti: branch `docs/m1-reconciliation`

### Removed
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
