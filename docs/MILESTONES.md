# MILESTONES — Rujukan Utama Arah & Status Pengembangan

| Item | Nilai |
|---|---|
| Status dokumen | Canonical (dokumen utama #1; pasangannya: `CHANGELOG.md`) |
| Owner | Haidar (Product Owner) |
| Terakhir diperbarui | 2026-11-13 |
| Menggantikan | `STATUS.md` (tidak ada lagi di repo) |

## 0. Aturan pakai (singkat)

1. **Mulai dari sini.** Dokumen ini menjawab: *sedang di fase apa, apa berikutnya, apa yang memblokir.*
2. Dokumen lain (`CORE/`, `decisions/`, `architecture/`, `specifications/`, `engineering/`, dll.) adalah **rujukan turunan**: dibuka hanya saat task membutuhkannya. Jangan menyalin isinya ke sini; cukup tautkan ID (`DEC-NNN`, `FR-NNN`, `SPIKE-NNN`).
3. Keputusan tetap dicatat di `decisions/DECISIONS.md`. Dokumen ini hanya merujuk ID-nya.
4. Setiap task selesai → (a) centang di sini dengan ID task, (b) tambah entri di `CHANGELOG.md` dengan commit/bukti.
5. Status task: `TODO` · `DOING` · `BLOCKED` · `DONE` (wajib ada commit/bukti di CHANGELOG).
6. Milestone baru boleh dimulai bila *exit criteria* milestone sebelumnya terpenuhi atau Owner menyetujui paralelisasi. Urutan eksekusi sejak 2026-11-12: M0 → M1 → M2 → M3 → M5 → M4 (launch) → M6 / M7 (DECISIONS §2.8). ID milestone dan task tidak di-renumber; urutan di §1 dan §2 mengikuti urutan eksekusi.

## 1. Ringkasan fase

| ID | Milestone | Fase SDLC | Status | Gate keputusan |
|---|---|---|---|---|
| M0 | Fondasi homepage & paket dokumen | Inisiasi | DONE | — |
| M1 | Rekonsiliasi dokumen & keputusan | Requirements | DONE (M1-08 ditunda ke M4-05) | — |
| M2 | Validasi teknis (spike) | Design / arsitektur | DONE (2026-11-10) | — |
| M3 | MVP — Platform publikasi + Learning Hub | Implementasi | DOING (M3-00, M3-01, M3-02, M3-03, M3-04, M3-10 selesai) | DEC-017, DEC-024 (DEC-013 Accepted); DEC-014 (detail OPEN, M3-11) |
| M5 | Akses pengguna publik (pra-launch) | Implementasi | BLOCKED (M3) | DEC-008, DEC-010–DEC-012, DEC-019, DEC-020 |
| M4 | Launch hardening & rilis | Verifikasi / rilis | BLOCKED (M3, M5) | DEC-020, DEC-022, DEC-023 |
| M6 | Expansion pasca-launch | Evolusi | BLOCKED (M4) | Kebutuhan nyata (DECISIONS §2.8 Q3 A) |
| M7 | Phase 2 — Subscription (pasca-launch) | Evolusi | BLOCKED (M4) | PRD D-08, DEC-010 |

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
- [x] M2-04 Build + deploy preview berhasil; pin versi Node.js (`engines.node` + setting Vercel); pilih region produksi (bukti untuk DEC-017) — `bun run build` exit 0 di setiap commit spike, `engines.node` `26.x` (commit `17fdf0c`, SPIKE-001 §7.7); pin `26.x` disetujui Owner 2026-11-10 dan versi Node di Vercel sudah di-set Owner. Bukti deploy Preview + Node 26.x selesai di M3-00 (`dpl_HdrgFNmF49qwQ53vUjjGBSc2ms2N`); region produksi → M4 (B-05)
- [x] M2-05 Hasil dicatat di SPIKE-001/003; Owner 2026-11-10: DEC-006, DEC-007, DEC-013 Accepted, bukti DEC-004/005 ditambahkan, pin Node DEC-018 disetujui (DECISIONS §2.1). Branch spike di-push sebagai arsip, tidak di-merge.

**Exit:** DEC-006/007/018 Accepted dengan bukti spike ✔. DEC-012 tetap Proposed: bagian publik terbukti, bagian privat di M5-04.

### M3 — MVP Publikasi + Learning Hub (Implementasi, vertical slice)
Dasar kode: kode spike sudah ada di `master` sejak PR #3 (`e7f6876`, 2026-11-10, merge di luar rencana; Owner memilih maju, bukan revert). Build produksi Vercel untuk `e7f6876` ERROR (`Missing required environment variable APP_SUPABASE_URL` dari `payload/payload.config.ts`); `mahira.id` masih melayani deploy `3839725`.
- [x] M3-00 Pulihkan `master`: build Vercel hijau tanpa mengaktifkan `/admin` produksi ke database spike; buang skrip cek dan konfigurasi bertanda "SPIKE ONLY"; bukti build di Vercel Preview + Node 26.x (sisa M2-04) — branch `feat/m3-00-master-cleanup`, commit `2dc2e19`; Owner 2026-11-10: Opsi A (Payload mati di Vercel Production, hidup di Preview); build lulus tanpa env dan dengan env lengkap (CHANGELOG [M3-00]). Commit ter-push langsung ke `master` (upstream branch salah). Production `644833c` READY (`dpl_CEo1P2xzx6phTQPPmicCuHH8ZnSk`, 2026-11-10): `mahira.id/` 200, `/admin` 404, `/api/publications` 404. Preview dengan CMS aktif lulus (Owner 2026-11-10): `dpl_HdrgFNmF49qwQ53vUjjGBSc2ms2N` (redeploy `644833c`, target Preview) — login `/admin` OK, `/api/publications?limit=1` 200 (`totalDocs` 18, fixture). Production `4f6b466` (`dpl_CwFk9zTw3ixvZgBkhKoRWFb6hdvi`) tetap `/admin` 404
- [x] M3-01 Routing locale `/id` `/en`, language switcher, fallback eksplisit (DEC-004/005); tutup celah `?fallback-locale=` di REST publik (temuan C4c) — branch `feat/m3-02-m3-01-cms-locale`, commit `8641593` (root layout `[locale]`, kerangka `/{locale}/publications`, switcher, `denyPublicFallback`, gerbang proxy); jawaban Owner DECISIONS §2.4 P4; bukti: CHANGELOG [M3-01]. Redirect 308 untuk slug lama menunggu halaman detail (M3-05/M3-07); 404 varian huruf besar perlu dicek ulang di Vercel Preview (artefak NTFS di Windows). Temuan tersisa: logo header di halaman `/en` menaut ke `/` (homepage Indonesia) tanpa `hrefLang` **Deploy (PR #6, merge `4c305ef`, 2026-11-11):** Preview lulus uji Owner (`/id`, `/en` publications, switcher, `/` tidak berubah); `/ID/publications` dialihkan ke huruf kecil, bukan 404 (Owner-observed; sumber pengalihan tidak ada di kode aplikasi, belum diverifikasi; tidak ada konten di URL huruf besar). Production: `/id/publications`, `/en/publications` 404.
- [x] M3-02 Koleksi CMS: Publication, Author, Topic, Publication Type, Media; role Admin/Editor (DEC-016). Dari review M2: manajemen user staf hanya Admin; perbaiki race di hook shared-field DEC-004; tentukan penanganan log `cacheComponents` di admin (DEC-006); batasi REST publik: anonim saat ini bisa membaca publikasi `accessLevel: registered` lewat `/api/publications`, padahal DEC-002 menahannya sampai MVP+ (temuan uji Preview 2026-11-10); kembalikan pin `payload` dan `@payloadcms/next` ke `3.93.0` (commit `08d03cb` memakai `^`) — branch `feat/m3-02-m3-01-cms-locale`, commit `e57a91b` (pin), `8488ee6` (race), `e0f71ec` (role, akses, migrasi `20261110_175914_m3_02_roles_access` diterapkan ke `mahira-cms`), `54d095f` (perbaikan review temuan 1–3: hapus Translation Group hanya Admin dan ditolak selama masih dipakai, `publishedAt: null` saat terbit diisi ulang, Admin terakhir tidak bisa diturunkan atau dihapus); jawaban Owner DECISIONS §2.4; bukti: CHANGELOG [M3-02]. Upgrade Payload wajib mengulang cek race (ENG-ENV-001 §3.1). Temuan tersisa: REST `PATCH` tanpa `?locale` pada term terlokalisasi (Topic, Publication Type) yang sudah punya nama ID dan EN menjawab `name: This field is required` (Payload 3.93.0; admin UI selalu mengirim `?locale`) **Deploy (PR #6, merge `4c305ef`, 2026-11-11):** Preview lulus uji Owner (login Admin, menu Users); REST anonim di Preview tertahan Vercel Authentication sebelum aplikasi, jadi 403 anonim dibuktikan lewat cek lokal (39/0), bukan Preview. Production: `/admin`, `/api/publications` 404. Data API `mahira-cms` dimatikan Owner (P7 C).
- [x] M3-03 Workflow editorial minimum: draft → publish/unpublish (DEC-015) — branch `feat/m3-03-editorial-workflow`, commit `5692448` (kolom virtual `liveOnSite` "Tayang di situs" untuk staf, `defaultColumns` daftar publikasi; P4 B), `20065cd` (tes integrasi `tests/integration/workflow.test.ts`), `023093f` (simpan tanpa `_status` di atas draft tertunda ditolak 400; P5 A), `3a02be7` (query `liveOnSite` satu request dijalankan berurutan), `eb28705` (dokumen: EDITORIAL-WORKFLOW §9, TEST-PLAN §12, ENVIRONMENTS §3.1, SRS FR-014/FR-015, TRACEABILITY); jawaban Owner 2026-11-12 DECISIONS §2.6; tanpa perubahan skema atau migrasi; bukti: CHANGELOG [M3-03]. Admin UI tidak dicakup tes otomatis (TEST-PLAN §12). **Deploy (PR #9, merge `aec5878`, 2026-11-12 05:49 UTC):** CI `check` hijau di PR (run `43163004553`, head `cf61e5c`) dan push `master` (run `43163887214`); status Vercel di `aec5878` "Deployment has completed". Preview lulus uji Owner 2026-11-12 (`mahira-foundation-its0ygex7-mahiraindodev-2070.vercel.app/admin`): daftar Publications menampilkan kolom "Tayang di situs" (Ya/Tidak) bersama Status, Ever Published, Published At (18 record fixture). Production dicek HTTP: `/` 200; `/admin`, `/api/publications`, `/id/publications`, `/en/publications` 404
- [x] M3-04 Homepage diganti dari konten sampel ke data CMS — branch `feat/m3-04-homepage-cms` (basis `origin/master` `e08a858`), commit `69bcfcf` (eslint mengabaikan `.agents/`, P11 A), `b48efe3` (lapisan baca `lib/cms/homepage-query.ts` + view model `lib/home/homepage-view.ts`, unit H1–H8), `42e142a` (`/` membaca CMS saat request; konten sampel, menu Learning Hub, dan kolom Topik footer dihapus), `068700b` (gerbang G1/G7/G8 + `tests/integration/homepage.test.ts` HP1–HP7), `4c75448` (REST dipanaskan sebelum `GET /` di run integrasi; HP8 `todo`), `2c9da35` (H5: hasil galat tanpa topik), `0e0a0ee` (dokumen M3-04), `ccd3b07` (arah Owner DECISIONS §2.8), `9fe78a3` (tautan §2.7 → §2.8, catatan G1 untuk M3-12); jawaban Owner 2026-11-12 DECISIONS §2.7; tanpa perubahan skema atau migrasi; bukti: CHANGELOG [M3-04]. Temuan review minor R1–R3 **diperbaiki** di branch `fix/payload-single-instance` (basis `origin/master` `689be13`): R1 HP1 kini memeriksa sifat urutan (bertanggal terbaru dulu, bertanggal sebelum tanpa tanggal) dan urutan relatif fixture-nya, bukan posisi tetap (commit `140d7ee`); R2 batas jaminan "log hanya nama galat" dicatat di TEST-PLAN §12.5 dan PAGE-SPECIFICATIONS §2: jaminan itu untuk baris log `[homepage]`, sedangkan log koneksi Payload sendiri saat init gagal dapat memuat host/user pooler (commit dokumen branch itu); R3 exit M4 diselaraskan dengan label AC DECISIONS §2.8 (commit dokumen yang sama). Temuan tersisa (ada sebelum M3-04) **diperbaiki** di branch yang sama, commit `140d7ee`: build produksi memuat dua salinan `payload` (bundle halaman RSC dan bundle route REST/admin), dan `getPayload` menyimpan satu instance global; bila halaman (sejak M3-04 juga `GET /`) atau `/admin` yang pertama membuat instance di proses yang baru, ValidationError REST kehilangan rincian field (`errors[0].data`). Gejala terlihat di Preview 2026-11-12: aktivasi Topic dengan nama ID saja ditolak (benar) dengan pesan "The following field is invalid: isActive" tanpa rincian. Perbaikan: `serverExternalPackages: ["payload"]` di `next.config.ts` (disetujui Owner 2026-11-12, "kerjakan butir 1"); warm-up REST di run integrasi dihapus; HP8 (`GET /` lebih dulu) menjadi tes biasa dan HP9 baru (`GET /admin` lebih dulu); bukti: CHANGELOG [M3-04] di Fixed. Belum dicek di Vercel Preview (menunggu merge/deploy). **Deploy (PR #11, merge `c02eea0`, 2026-11-12 17:59 UTC):** CI `check` hijau di PR (run `43274929506`) dan push `master` (run `43275195710`); Vercel "Deployment has completed". Production: `/` 200 dengan "Belum ada publikasi yang terbit", tanpa konten sampel dan tanpa Learning Hub; `/admin`, `/api/publications`, `/id/publications`, `/en/publications` 404. Preview lulus uji Owner (`dpl_FLdPT2VrdsDmNC5SozzupCsh1J4D`); Topic fixture "Energi" kini aktif (diganti nama oleh Owner, tanpa label `[FIXTURE]`). **Temuan Preview sesudah PR #13 (merge `8540424`, 2026-11-12 19:43 UTC; butir 1b):** Owner mengaktifkan Topic "[FIXTURE] Topik Hanya ID" di `/admin` Preview; simpan ditolak dengan pesan yang sesuai (laporan Owner; perbaikan PR #13 terlihat bekerja), tetapi reload `/admin` sesudahnya gagal "This page couldn't load" (digest 498284311). Penyebab (terbukti lewat reproduksi lokal terhadap `mahira-cms`, konsisten dengan log Vercel): session pooler Supavisor port 5432 menolak klien di atas `pool_size` 15 (`EMAXCONNSESSION`) dan menahan koneksi server beberapa menit sesudah klien pergi, sedangkan Payload memakai default `pg-pool` (sampai 10 klien per proses) di 2 function Vercel yang memakai DB; connect yang ditolak di `payload.init` meninggalkan rejection tanpa handler (`unhandledRejection: undefined`), sehingga Vercel menghentikan instance (exit 128). PR #13 bukan penyebab. **Diperbaiki** di branch `fix/db-connection-limits` (basis `origin/master` `8540424`): commit `311683f` (pool `max: 5`, idle 5 detik, tunggu klien maksimal 10 detik; wrapper `db.init` menangani promise `initializing`; unit DB1/DB2) dan commit dokumen branch itu (DECISIONS §2.9 dan pemicu review ketiga DEC-006, ENVIRONMENTS §3.1, TEST-PLAN §12, CHANGELOG); jawaban Owner 2026-11-12 DECISIONS §2.9 (1 a, 2 a, 3 a, 4 b, 5 b, 6 a, 7 a); bukti: CHANGELOG [M3-04] di Fixed. Owner sudah mengganti `CMS_SUPABASE_DATABASE_URI` Preview ke transaction pooler port 6543 (laporan Owner, belum diverifikasi agen). Belum dicek di Vercel Preview: langkah Owner di ENVIRONMENTS §3.1, menunggu push dan build Preview baru. Production tidak berubah (CMS mati; pooler dan pool Production diputuskan di M4). **Cek Preview butir 1b (PR #14, merge `dd7a806`, 2026-11-13):** Owner melaporkan dari Preview `dpl_2T1NC5dUchqDfFNBQJh4Hcw8hR4R` (branch `fix/db-connection-limits`) bahwa semua cek lulus: pesan validasi Topic sesuai, dan reload `/admin` sesudah membuka beberapa halaman tidak lagi menampilkan "This page couldn't load" (laporan Owner). **Temuan Preview yang sama (butir 1c):** sesudah login, URL bolak-balik cepat antara `/admin` dan `/admin/login` sampai hard reload; clear site data tidak membantu; burst `GET /admin/login` yang sama sudah ada di log 2026-11-12. Penyebab (terbukti lewat reproduksi lokal di build produksi dengan Playwright MCP dan akun fixture Editor): router browser Next 16.4.4 menyimpan redirect anonim Payload dari `/admin` sebagai halaman `/admin` lengkap (`partialPrefetching`), dan route `/admin` lama yang disembunyikan menjalankan redirect itu lagi (`cacheComponents`, vercel/next.js#92767); sebelum perbaikan, 105 `GET /admin/login` dalam 85 detik tanpa berhenti. Server selalu mengenali sesi; log `new Date()`, `proxy.ts`, dan butir 1b tidak terlibat. **Diperbaiki** di branch `fix/admin-login-loop` (basis `origin/master` `dd7a806`): commit `a5321de` (`proxy.ts`, hanya saat CMS hidup: `GET` halaman admin yang dilindungi tanpa cookie `payload-token` → 307 `/admin/login`; `await connection()` di halaman admin buatan Payload; unit PX1–PX6, integrasi AD1–AD7 di `tests/integration/admin.test.ts`; HP9 memanaskan server dengan `/admin/login`) dan commit dokumen branch itu (DECISIONS §2.10 dan §2.4 P2 A, pemicu review keempat DEC-006, ENVIRONMENTS §3.1, TEST-PLAN §12, CHANGELOG); jawaban Owner 2026-11-13 DECISIONS §2.10 (1 A, 2 (i), 3 (a)). Sesudah perbaikan, login dari `/admin` anonim langsung ke dashboard tanpa pantulan; dengan cookie yang ditolak Payload, satu pantulan lalu dashboard; bukti: CHANGELOG [M3-04] di Fixed. Tanpa perubahan dependency, versi, skema, atau migrasi. Preview lulus uji Owner 2026-11-13 (`dpl_Hdxe2qseaNyV1LZUv86Kqpgr9NoU`, branch `fix/admin-login-loop`): `/admin` tanpa login langsung ke `/admin/login`, login masuk dashboard tanpa bolak-balik, deep link `/admin/collections/topics` kembali ke Topics sesudah login, reload halaman admin tanpa loop. **Deploy (PR #15, merge `9e9ff11`, 2026-11-13 08:36 UTC):** CI `check` hijau di PR dan push `master`; Vercel "Deployment has completed". Production tidak berubah: `/` 200; `/admin`, `/admin/login`, `/api/publications`, `/id/publications` 404
- [ ] M3-05 Publication index (filter, pagination, URL state) & detail; urutan `publishedAt` kosong di `/{locale}/publications` (DECISIONS §2.7 P4c)
- [ ] M3-06 Search dasar Postgres FTS (DEC-013)
- [ ] M3-07 SEO: metadataBase, canonical, hreflang, sitemap, OG (DEC-021)
- [ ] M3-08 Unduhan file publik; `access_level` tersimpan sejak awal
- [ ] M3-09 Halaman About; satu sumber token desain (DEC-024)
- [x] M3-10 Test framework dipilih + tes kritikal — branch `feat/m3-10-test-framework`, commit `0378252` (runner `node:test` + `tsx` 4.23.15, 69 unit test), `1967756` (matriks build 4 mode + cek gerbang HTTP + CI GitHub Actions tanpa secret), `421de03` (104 tes integrasi DB `mahira-cms` dengan isolasi fixture); jawaban Owner 2026-11-11 DECISIONS §2.5; perintah `bun run test`, `bun run test:integration`, `bun run test:build-matrix` (TEST-PLAN §12); bukti: CHANGELOG [M3-10]. Sisa temuan: belum ada E2E browser (Playwright di M3-05/M5); tes DB dan `migrate:status` tidak jalan di CI; Vercel Preview memakai DB yang sama dengan tes; pooler Supabase `mahira-cms` dua kali memutus koneksi di tengah run dan transaksi yatim menahan row lock ±15 menit (koneksi app tidak dibatasi `idle_in_transaction_session_timeout`; kandidat M4); helper akhir pool tes memakai internal `pg-pool` (cek ulang saat upgrade Payload/`pg`); `getPayload` non-produksi menulis ulang `payload/payload-types.ts` dengan LF di checkout CRLF; varian huruf besar `/ID`, `/EN` (run 2026-11-12 juga `/En`) + `/publications` 200 berisi shell kosong di `next start` Windows (filesystem lokal; varian berubah antar-run; di Linux/Vercel belum dicek); `.kiro/steering/tech.md` yang masih menyebut belum ada Payload/test framework diperbarui 2026-11-13 (branch `docs/steering-refresh`). **Deploy (PR #7, merge `4945d0d`, 2026-11-11 17:16 UTC):** CI `check` hijau di PR (run `43066390970`, head `c9313de`) dan push `master` (run `43066583204`); status Vercel di `4945d0d` "Deployment has completed" (`dpl_9w1ogeMXtqtaM6y1fP61NZnDdRYZ`). Production dicek HTTP: `/` 200; `/admin`, `/api/publications`, `/id/publications`, `/en/publications` 404. Temuan review 3 (log `next start` di `%TEMP%`) dan 4 (tanggal DECISIONS §2.5 / TEST-PLAN §12.1) ditutup di branch `chore/m3-10-leftovers`
- [ ] M3-11 Keputusan detail Learning Hub (DEC-014; butir OPEN di DECISIONS §2.8: model konten dan jenis materi, relasi ke Topic/"Bidang kerja", model bilingual, route, storage file toolkit, halaman detail vs embed langsung) + koleksi CMS — workflow terpisah
- [ ] M3-12 Halaman publik Learning Hub (katalog per tema, embed video/playlist YouTube, panduan) + membuka kembali blok dan menu Learning Hub di homepage (DECISIONS §2.7 P2 A; gerbang G1 yang sejak M3-04 memeriksa teks "Learning Hub" tidak ada di `/` ikut disesuaikan, TEST-PLAN §12.2) — workflow terpisah
- [ ] M3-13 Toolkit Learning Hub yang dapat diunduh publik (bergantung M3-08) — workflow terpisah

**Exit:** PRD §13 AC 1–4, 7 dan 9 lulus di staging.

### M5 — Akses pengguna publik (pra-launch)
Dipindah ke sebelum M4 (DECISIONS §2.8 Q1 A). Bagian khusus subscriber pindah ke M7-02 dan M7-03.
- [ ] M5-01 SPIKE-002 auth boundary (Supabase Auth publik vs staf Payload)
- [ ] M5-02 Registrasi/login/logout/reset + verifikasi email, email transaksional (DEC-019), area akun minimal
- [ ] M5-03 Evaluator akses server-side untuk level `registered` (DEC-010/011); entitlement manual subscriber pindah ke M7-02
- [ ] M5-04 File `registered`: private bucket + cek sesi di server + signed URL; tes matriks akses SRS §12.1 kolom Visitor/Registered/Editor/Admin (kolom subscriber pindah ke M7-03)

**Exit:** PRD §13 AC 5, 6 (file `registered`) dan 10 lulus di staging.

### M4 — Launch hardening (Verifikasi & Rilis)
- [ ] M4-01 Audit aksesibilitas WCAG 2.2 AA & performa
- [ ] M4-02 Security review; privacy policy (DEC-020)
- [ ] M4-03 Backup + uji restore, RPO/RTO (DEC-023)
- [ ] M4-04 Monitoring & analytics (DEC-022)
- [ ] M4-05 Migrasi konten nyata; `RELEASE-CHECKLIST` lulus; produksi `https://mahira.id`

**Exit:** PRD §13 AC 8 lulus; AC 1–5, 6 (file `registered`), 7, 9, 10 tetap lulus (bagian subscriber AC 6 di M7, DECISIONS §2.8); rilis produksi tercatat di CHANGELOG sebagai versi `1.0.0`.

### M6 — Expansion pasca-launch
- [ ] M6-01 Event, newsletter, form jaringan dosen, sesuai kebutuhan nyata (DECISIONS §2.8 Q3 A)

### M7 — Phase 2 Subscription (pasca-launch)
- [ ] M7-01 Payment gateway, webhook idempoten, siklus langganan (PRD D-08)
- [ ] M7-02 Entitlement manual subscriber + evaluator akses level `subscriber` (dari M5-03; DEC-010/011)
- [ ] M7-03 File subscriber: private bucket + signed URL; kolom subscriber di matriks akses SRS §12.1 (dari M5-04)

## 3. Blocker aktif

| ID | Blocker | Memblokir | Owner |
|---|---|---|---|
| B-05 | Project Supabase spike ada di Eropa (`eu-west-1`, `eu-central-1`); region produksi belum dipilih | M4 | PO (DEC-017, DEC-020) |
| B-03 | Belum ada Editorial Lead / Security owner / SEO owner | M1-08, M4 | PO |
| B-04 | Nilai taksonomi belum ada; M3 memakai nilai fixture berlabel, nilai final saat M4-05 | M4-05 | Editorial Lead |
