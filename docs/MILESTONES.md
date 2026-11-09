# MILESTONES — Rujukan Utama Arah & Status Pengembangan

| Item | Nilai |
|---|---|
| Status dokumen | Canonical (dokumen utama #1; pasangannya: `CHANGELOG.md`) |
| Owner | Haidar (Product Owner) |
| Terakhir diperbarui | 2026-11-10 |
| Menggantikan | `STATUS.md` (tidak ada lagi di repo) |

## 0. Aturan pakai (singkat)

1. **Mulai dari sini.** Dokumen ini menjawab: *sedang di fase apa, apa berikutnya, apa yang memblokir.*
2. Dokumen lain (`CORE/`, `decisions/`, `architecture/`, `specifications/`, `engineering/`, dll.) adalah **rujukan turunan**: dibuka hanya saat task membutuhkannya. Jangan menyalin isinya ke sini; cukup tautkan ID (`DEC-NNN`, `FR-NNN`, `SPIKE-NNN`).
3. Keputusan tetap dicatat di `decisions/DECISIONS.md`. Dokumen ini hanya merujuk ID-nya.
4. Setiap task selesai → (a) centang di sini dengan ID task, (b) tambah entri di `CHANGELOG.md` dengan commit/bukti.
5. Status task: `TODO` · `DOING` · `BLOCKED` · `DONE` (wajib ada commit/bukti di CHANGELOG).
6. Milestone baru boleh dimulai bila *exit criteria* milestone sebelumnya terpenuhi atau Owner menyetujui paralelisasi.

## 1. Ringkasan fase

| ID | Milestone | Fase SDLC | Status | Gate keputusan |
|---|---|---|---|---|
| M0 | Fondasi homepage & paket dokumen | Inisiasi | DONE | — |
| M1 | Rekonsiliasi dokumen & keputusan | Requirements | DONE (M1-08 ditunda ke M4-05) | — |
| M2 | Validasi teknis (spike) | Design / arsitektur | DOING (bukti spike tercatat; menunggu keputusan Owner) | DEC-006, DEC-007, DEC-012 (DEC-018 Accepted) |
| M3 | MVP — Platform publikasi | Implementasi | BLOCKED (M2) | DEC-013, DEC-017, DEC-024 |
| M4 | Launch hardening & rilis | Verifikasi / rilis | BLOCKED (M3) | DEC-020, DEC-022, DEC-023 |
| M5 | MVP+ — Akses pengguna | Implementasi lanjutan | BLOCKED | DEC-008–011, DEC-019, DEC-020 |
| M6 | Expansion — Learning Hub & engagement | Evolusi | BLOCKED | DEC-014 |
| M7 | Phase 2 — Subscription & pembayaran | Evolusi | BLOCKED | PRD D-08 |

## 2. Detail milestone

### M0 — Fondasi (Inisiasi)
- [x] M0-01 Homepage statis Next.js 16 + Tailwind 4 (`app/page.tsx`, konten sampel `lib/landing-content.ts`) — commit `024c69c`
- [x] M0-02 Aset logo Mahira (`public/logo/`) — commit `70f85dc`
- [x] M0-03 Paket dokumen `docs/` + `.kiro/steering`, `.kiro/skills`
- [x] M0-04 Commit paket dokumen & `.kiro/` — commit `2da3510`
- [x] M0-05 Hapus `INTEGRATE-INTO-REPOSITORY.md`, `PACKAGE-MANIFEST.json`; pindahkan `CHAT_WITH_CLAUDE.md` ke `docs/references/` (REF-001) — branch `chore/m0-cleanup`
- [x] M0-06 Root `README.md` diganti: stack, perintah Bun, alur kerja branch/PR — branch `chore/m0-cleanup`

**Exit:** semua dokumen ter-commit; root bersih.

### M1 — Rekonsiliasi (Requirements)
- [x] M1-01 DEC-002 diterapkan: PRD §13 AC 5–6 dan SRS FR-009–013 ditandai MVP+ — branch `docs/m1-reconciliation`
- [x] M1-02 DEC-003 (2 sumbu) diterapkan: banner + Desk/Tag ditandai Not in MVP di `CONTENT-ARCHITECTURE`, `DATA-MODEL`; Desk/Tag dihapus dari `ERD`; "desk" dihapus dari spesifikasi
- [x] M1-03 DEC-009 Accepted (role: Public user, Editor, Admin); SRS aktor & glosarium diperbarui
- [x] M1-03b SRS matriks akses (§4/§12), T-06, dan TEST-PLAN matriks disinkronkan dengan DEC-009 (bypass Admin dihapus)
- [x] M1-04 Route diputuskan (DEC-005 addendum): search `/{locale}/publications?q=`, type `/{locale}/publications/type/{slug}`; route/param Desk dihapus dari ADR-0005, IA, API, PAGE spec
- [x] M1-05 Heading keliru "Opsi terpilih: Opsi B" dihapus dari ADR-0001
- [x] M1-06 Tautan DEC spike diperbaiki: SPIKE-001 → DEC-004/005/006/007/018; SPIKE-002 → DEC-008/009/016; SPIKE-003 → DEC-009/010/011/012
- [x] M1-07 PRD/SRS: Owner = Haidar, nama brand sesuai DEC-001
- [ ] M1-08 DITUNDA ke M4-05 — Owner 2026-11-09: 10 PDF RFID di `public/publications/` (git-ignored) hanya contoh sementara. Dipakai sebagai fixture berlabel di M2–M3; nilai Topic diuji dengan konten nyata Mahira saat migrasi konten. Tidak memblokir exit M1.

**Exit:** tidak ada konflik terbuka antar PRD/SRS/arsitektur untuk scope M2–M3.

### M2 — Validasi teknis (Design)
- [x] M2-01 SPIKE-001 Payload 3 + Postgres embedded di Next.js 16.4.4 (DEC-006, DEC-007); runtime Node.js (DEC-018). Lingkungan: CMS `mahira-cms`, APP `mahira.id` (`DECISIONS.md` §2.2) — bukti: branch `spike/m2-payload-postgres`, commit `17fdf0c`, `3b1ff83`, SPIKE-001 §7.1–§7.5
- [x] M2-02 Uji localization hybrid DEC-004 & slug DEC-005 (unik per locale, tanpa kebocoran draft, hreflang) — bukti: branch `spike/m2-payload-postgres`, commit `c8b783b`, SPIKE-001 §7.6 (pass=41 fail=0; check 4 PARTIAL: temuan `fallback-locale` untuk M3)
- [x] M2-03 SPIKE-003 storage objek + file publik (DEC-012); bagian gated menunggu M5 — bukti: branch `spike/m2-payload-postgres`, commit `c19a774`, SPIKE-003 §7.2–§7.5
- [ ] M2-04 Build + deploy preview berhasil; pin versi Node.js (`engines.node` + setting Vercel); pilih region produksi (bukti untuk DEC-017) — DOING: `bun run build` exit 0 di setiap commit spike, `engines.node` `26.x` (commit `17fdf0c`, SPIKE-001 §7.7); deploy preview & region menunggu keputusan Owner (DECISIONS §2.3)
- [ ] M2-05 Catat hasil di spike report; ubah DEC terkait ke Accepted/Rejected — DOING: bukti & rekomendasi dicatat (SPIKE-001, SPIKE-003, DECISIONS §2.3); perubahan status DEC menunggu persetujuan Owner

**Exit:** DEC-006/007/012/018 Accepted dengan bukti spike.

### M3 — MVP Publikasi (Implementasi, vertical slice)
- [ ] M3-01 Routing locale `/id` `/en`, language switcher, fallback eksplisit (DEC-004/005)
- [ ] M3-02 Koleksi CMS: Publication, Author, Topic, Publication Type, Media; role Admin/Editor (DEC-016)
- [ ] M3-03 Workflow editorial minimum: draft → publish/unpublish (DEC-015)
- [ ] M3-04 Homepage diganti dari konten sampel ke data CMS
- [ ] M3-05 Publication index (filter, pagination, URL state) & detail
- [ ] M3-06 Search dasar Postgres FTS (DEC-013)
- [ ] M3-07 SEO: metadataBase, canonical, hreflang, sitemap, OG (DEC-021)
- [ ] M3-08 Unduhan file publik; `access_level` tersimpan sejak awal
- [ ] M3-09 Halaman About; satu sumber token desain (DEC-024)
- [ ] M3-10 Test framework dipilih + tes kritikal (belum ada di repo)

**Exit:** PRD §13 AC 1–4 & 7 lulus di staging.

### M4 — Launch hardening (Verifikasi & Rilis)
- [ ] M4-01 Audit aksesibilitas WCAG 2.2 AA & performa
- [ ] M4-02 Security review; privacy policy (DEC-020)
- [ ] M4-03 Backup + uji restore, RPO/RTO (DEC-023)
- [ ] M4-04 Monitoring & analytics (DEC-022)
- [ ] M4-05 Migrasi konten nyata; `RELEASE-CHECKLIST` lulus; produksi `https://mahira.id`

**Exit:** PRD §13 AC 8 lulus; rilis produksi tercatat di CHANGELOG sebagai versi `1.0.0`.

### M5 — MVP+ Akses pengguna
- [ ] M5-01 SPIKE-002 auth boundary (Supabase Auth publik vs staf Payload)
- [ ] M5-02 Registrasi/login/reset, email transaksional (DEC-019)
- [ ] M5-03 Entitlement manual + evaluator akses server-side (DEC-010/011)
- [ ] M5-04 File eksklusif: private bucket + signed URL; tes matriks akses SRS §12.1

### M6 — Expansion
- [ ] M6-01 Learning Hub katalog + embed (DEC-014); event/newsletter sesuai kebutuhan nyata

### M7 — Phase 2 Subscription
- [ ] M7-01 Payment gateway, webhook idempoten, siklus langganan (PRD D-08)

## 3. Blocker aktif

| ID | Blocker | Memblokir | Owner |
|---|---|---|---|
| B-01 | DEC-007 kepemilikan skema DB (Open — critical); bukti SPIKE-001 §7.2–§7.3 sudah ada, menunggu keputusan Owner atas DEC-007 dan penyelarasan ADR-0002 (DECISIONS §2.3) | M3 | PO |
| B-06 | Bukti deploy M2-04: branch `spike/*` dilewati Ignored Build Step Vercel; cara memperoleh bukti deploy belum dipilih (DECISIONS §2.3 poin a) | M2-04 | PO |
| B-05 | Project Supabase spike ada di Eropa (`eu-west-1`, `eu-central-1`); region produksi belum dipilih | M4 | PO (DEC-017, DEC-020) |
| B-03 | Belum ada Editorial Lead / Security owner / SEO owner | M1-08, M4 | PO |
| B-04 | Nilai taksonomi belum ada; M3 memakai nilai fixture berlabel, nilai final saat M4-05 | M4-05 | Editorial Lead |
