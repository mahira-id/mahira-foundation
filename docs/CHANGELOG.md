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

### Decisions
- DEC-009 → Accepted 2026-11-09: role hanya Public user, Editor, Admin; tanpa bypass staf di unduhan publik — bukti: `decisions/DECISIONS.md` §2.1

### Changed
- [M1-01] PRD §13 AC 5–6 dan SRS FR-009–013 → MVP+ (DEC-002) — bukti: branch `docs/m1-reconciliation`
- [M1-03] SRS: aktor Reviewer/Finance tidak dipakai; "Staf" = Editor + Admin (DEC-009) — bukti: branch `docs/m1-reconciliation`
- [M1-07] PRD/SRS title block & document control mengikuti DEC-001 dan Owner Haidar — bukti: branch `docs/m1-reconciliation`
- `.gitignore`: `public/publications/` (PDF pihak ketiga, fixture lokal) agar tidak ter-deploy — bukti: branch `docs/m1-reconciliation`

### Fixed
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
