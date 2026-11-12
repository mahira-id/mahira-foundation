# Test Plan & Quality Strategy

**ID:** ENG-TEST-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Quality objectives

Verify not only that pages render, but that publication lifecycle, locale behavior, authorization, private file delivery, and operational recovery work end-to-end. Security-critical behavior must have tests before release, not only manual QA.

## 2. Test layers

| Layer | Purpose | What to test | Tool choice |
|---|---|---|---|
| Static checks | Catch style/type issues | Lint, typecheck, formatting | Existing ESLint/TypeScript; formatter TBD. |
| Unit | Isolated business rules | Entitlement evaluator, slug/locale utility, schema validation | `node:test` (Node 26) + loader `tsx` 4.23.15, `bun run test` (DECISIONS §2.5). |
| Component | UI behavior/states | Locked state, forms, access badges, keyboard behavior | TBD, belum dibutuhkan (komponen saat ini server-rendered). |
| Integration | Boundaries and adapters | Payload/Postgres, Auth, RLS, Storage, route handlers | `node:test` + `tsx` terhadap `mahira-cms` bersama dengan isolasi fixture (§12); DB tes terpisah belum ada. |
| E2E | Complete user workflows | Editorial publish, browse/search, auth, gated download | Playwright, ditunda sampai ada interaksi browser (M3-05/M5). |
| Security | Adversarial access | IDOR, privilege escalation, direct object access, secret leakage | Automated tests + manual review. |
| SEO | Search presentation | HTML metadata, canonical, hreflang, sitemap, structured data | HTML assertions and crawler validation. |
| Accessibility | Inclusive use | Keyboard, focus, labels, contrast, semantics, zoom | Automated tooling + manual tests. |
| Performance | Real loading behavior | CWV, query latency, large PDF delivery, image/font impact | Staging measurements and production monitoring. |
| Recovery | Operational resilience | Restore, failed upload, expired session, cache failure | Runbook exercises. |

Select exact library versions only after reviewing current compatibility and project constraints.

## 3. Risk-based priority

**P0 release gates:** publication visibility correctness, no draft leakage, role boundaries, private asset authorization, RLS for app-owned user data, session handling, public SEO metadata, migration repeatability, staging deployment, basic backup restore.

**P1:** search relevance, editorial workflow edge cases, bilingual parity, performance budgets, accessibility audit, monitoring/alerting, account data self-service.

**P2:** bookmark/history, newsletter, advanced analytics, PDF full-text search, advanced Learning Hub/LMS, subscription payment lifecycle.

Priority values must be reconciled with the final MVP decision in PRD/SRS.

**Gate launch (DECISIONS §2.8, 2026-11-12):** selain gate P0 di atas, launch (M4) mensyaratkan akun publik (registrasi, login, reset, verifikasi email), unduhan file `registered` yang diotorisasi di server (M5), dan Learning Hub cakupan launch (katalog per tema, embed YouTube, panduan, toolkit publik; DEC-014, M3-11–M3-13). Kolom subscriber di §4 diuji di M7 (Phase 2). "Advanced Learning Hub/LMS" di P2 tetap berarti fitur di luar cakupan launch DEC-014.

## 4. Minimum authorization matrix tests

| Asset/access | Visitor | Registered no grant | Subscriber active | Subscriber expired | Editor | Admin |
|---|---|---|---|---|---|---|
| Public metadata | Allow | Allow | Allow | Allow | Allow | Allow |
| Public asset | Allow | Allow | Allow | Allow | Allow | Allow |
| Registered asset | Deny | Allow | Allow | Allow | Deny (DEC-009) | Deny (DEC-009) |
| Subscriber asset | Deny | Deny | Allow | Deny | Deny (DEC-009) | Deny (DEC-009) |
| Draft metadata | Deny | Deny | Deny | Deny | According to CMS access | According to CMS access |
| Change staff role | Deny | Deny | Deny | Deny | Deny | Allow |

DEC-009 (Accepted 2026-11-09): Editor/Admin columns describe the public download endpoint. A CMS session gives no bypass there; only the public account's entitlement counts. Editor/Admin handle assets inside the CMS under Payload access control.

Fase (DECISIONS §2.8 Q1 A): kolom Visitor, Registered no grant, Editor, dan Admin diuji sebelum launch (M5-04); kolom Subscriber active dan Subscriber expired diuji di Phase 2 (M7-03).

## 5. Unit test cases — access evaluator

- Public asset allows anonymous request when asset/publication is published.
- Registered access denies anonymous.
- Registered access allows authenticated user under approved registration rule.
- Subscriber access denies when entitlement missing.
- Subscriber access denies when entitlement expired or not yet valid.
- Revoked/suspended entitlement denies.
- Entitlement for a different publication/asset does not grant access.
- Multiple grants resolve according to documented precedence.
- Draft/unpublished/withdrawn asset denies regardless of entitlement.
- Stale or malformed identity facts deny.
- Staff identity does not silently imply subscriber entitlement.
- Client-supplied access level has no effect.

## 6. Integration test cases

- Payload collection create/update/publish with correct schema migration.
- Payload role restrictions on collection and globals.
- Supabase profile RLS blocks cross-user select/update.
- Entitlement self-read allowed but self-grant denied.
- Private bucket object cannot be read anonymously.
- Server issues a signed URL only after policy allows.
- Storage failure returns safe error and no audit false-success.
- Replacing/deleting asset does not orphan or expose previous object.
- Cache revalidation follows successful publish commit.

## 7. E2E scenarios

### Editorial
1. Editor logs into staff CMS.
2. Creates publication draft in ID.
3. Adds author, taxonomy, cover, and a public or private asset.
4. Saves preview; visitor cannot access draft URL or asset.
5. Authorized staff publishes; public detail renders correct metadata.
6. Search and sitemap include published item.
7. Unpublish/withdraw removes it from public listings and sitemap.

### Public reader
1. Visitor opens index, searches, filters, paginates.
2. Opens detail and sees metadata/abstract.
3. Downloads public asset.
4. Attempts gated asset and sees correct sign-in/entitlement guidance.

### Account
1. User registers and verifies according to configured policy.
2. User signs in and sees own account details.
3. User cannot inspect or mutate another user's profile/entitlements.
4. Manual grant allows only relevant scoped access.
5. Expiry/revocation denies subsequent authorization requests.

## 8. Localization/SEO tests

- Correct locale route, translated content, date/number formatting.
- Missing translation does not silently display wrong language.
- Hreflang only for true equivalent published pairs.
- Canonical self-references correct URL.
- Noindex account/admin/preview; not in sitemap.
- Private body/file URL absent from HTML, hydration JSON, network payload, and OG tags.
- Slug redirect no loops/chains.

## 9. Security testing checklist

- IDOR across user IDs and asset IDs.
- Privilege escalation through signup metadata or profile update.
- CSRF/session protection as applicable to chosen framework patterns.
- XSS in rich text, embeds, titles, search terms, and CMS content.
- SQL injection/query filter abuse (use parameterized/query builder patterns).
- Open redirect via return URL.
- Upload MIME spoofing, oversized files, malicious filenames, malformed PDF/image.
- Direct object URL access and signed URL leakage.
- Rate limiting/abuse on download and auth endpoints.
- Secret scanning and client bundle inspection.
- Staff MFA/configuration and session expiry behavior.

## 10. Test data and environments

Use deterministic synthetic fixtures representing both locales, multiple authors/desks/types, each access level, draft/published/withdrawn states, and active/expired/revoked entitlements. Avoid production PII. Staging should be production-like but isolated.

## 11. Exit criteria

A release candidate passes all P0 tests, has no unresolved critical/high security issue, has recorded manual review for tests that cannot be automated, and includes reproducible evidence (CI result, staging checklist, screenshots/log references) tied to a commit.

## 12. Tes yang ada di repo (M3-10, M3-03, M3-04)

Keputusan Owner 2026-11-11: DECISIONS §2.5 (P1a A, P1b (i), P1c (i), P2 A, P3 B, P4 A, folder (a)). Runner: `node:test` bawaan Node 26 dengan loader `tsx` 4.23.15. Semua tes jalan di Node (DEC-018); Bun hanya meluncurkan script. Vitest, Jest, `bun test`, dan Playwright tidak dipasang. Tes workflow editorial M3-03 mengikuti jawaban Owner 2026-11-12 (DECISIONS §2.6); tes homepage M3-04 mengikuti jawaban Owner 2026-11-12 (DECISIONS §2.7).

### 12.1 Perintah

| Perintah | Isi | Butuh | Durasi lokal (2026-11-12) |
|---|---|---|---|
| `bun run test` | Unit test `tests/unit/**/*.test.ts` | Tanpa DB, tanpa `.env.local` | ±15–45 detik (97 tes sejak M3-04, sebagian besar waktu impor `tsx`/Payload) |
| `bun run test:integration [--skip-build] [--only access,guards,locale,race,workflow,homepage,db-invariants]` | Build env lengkap, `next start` di port 3100 (request pertama `GET /`, tanpa warm-up REST sejak perbaikan urutan inisialisasi Payload; §12.5), lalu satu proses `node --test` per file dengan urutan access, guards, locale, race, workflow, homepage, db-invariants; server dihentikan di `finally`; exit 1 bila ada file gagal. HP8 dan HP9 (`homepage`) masing-masing menyalakan server kedua di port 3101 tanpa build | `.env.local` lengkap, DB `mahira-cms` | Run penuh M3-03 2026-11-12: 15,5 menit (access ±3–5,5; guards ±3–4; locale ±1; race ±3–4; workflow ±3,5–6; db-invariants ±20 detik; build ±1 menit) |
| `bun run test:build-matrix [--modes absent,prodsim,partial,full]` | 4 mode build + cek HTTP gerbang (`tests/build/env-gate-http.test.ts`) + secret-scan log build dan `.next/static` + `.next/server` | Mode `full` dan secret-scan `.next` hanya bila `.env.local` ada | ±2,5–3,5 menit dengan cache Turbopack hangat |

Cek read-only tanpa server: `node --import tsx --test --test-reporter=spec tests/integration/db-invariants.test.ts`.

Runner integrasi menjalankan satu proses per file karena `node:test` mengurutkan file satu invocation berdasarkan nama, sedangkan `db-invariants` harus terakhir.

### 12.2 File dan cakupan

ID cek dari skrip arsip M3-01/M3-02 dipertahankan di nama tes. Cek jumlah user (S0/S9, U0/U1) menjadi hook `before`/`after` (guard Owner), sehingga jumlah tes lebih kecil daripada jumlah cek arsip.

| File | Tes | Cakupan |
|---|---|---|
| `tests/unit/env.test.ts` | 11 | `payload/env.ts`: tanpa env → CMS mati; set lengkap → hidup; set parsial → error yang hanya menyebut nama variabel; `VERCEL_ENV=production` mematikan CMS, juga untuk set parsial |
| `tests/unit/proxy.test.ts` | 4 | `proxy.ts`: 404 + `X-Robots-Tag: noindex` + `Cache-Control: no-store` saat CMS mati; lanjut saat hidup; `config.matcher` 4 entri |
| `tests/unit/locales.test.ts` | 10 | `lib/i18n/locales.ts`: `LOCALES`, `DEFAULT_LOCALE`, `isLocale`, `otherLocale`, `languageSwitchHref` |
| `tests/unit/roles.test.ts` | 18 | `payload/access/roles.ts` (6, termasuk `isStaffField` dari M3-03) + akses koleksi Publications, Users, Topics, PublicationTypes, TranslationGroups dan field `everPublished` (12) |
| `tests/unit/publication-workflow.test.ts` | 19 | M3-03 (DECISIONS §2.6): `readLiveOnSite` L1–L5 (anonim tanpa query; staf dan `overrideAccess` dihitung dari record utama dengan `PUBLIC_PUBLICATION_READ`; tanpa id → `no`; query satu request berurutan), konfigurasi `liveOnSite` (virtual, tanpa filter daftar, hanya dibaca staf, tidak pernah ditulis) dan `defaultColumns`; `markStatusNotSent` M1–M2 dan `refuseImplicitStatusOverPendingDraft` U1–U7 (P5 A), urutan hook `beforeOperation`/`beforeChange` |
| `tests/unit/publication-lifecycle.test.ts` | 9 | `setPublicationLifecycleFields` (`publishedAt` terisi saat terbit, termasuk nilai `null`; `everPublished`) |
| `tests/unit/deny-public-fallback.test.ts` | 7 | `denyPublicFallback`: request tanpa login tidak boleh fallback locale |
| `tests/unit/staff-user-hooks.test.ts` | 11 | `keepOneAdminOnRoleChange` (3), `keepOneAdminOnDelete` termasuk hapus bulk (5), `firstUserIsAdmin` (3); user in-memory, tanpa DB |
| `tests/unit/homepage.test.ts` | 8 | M3-04 (DECISIONS §2.7): H1–H2 tanggal "28 Okt 2026" dan tahun dalam WIB (beda dari UTC dan zona mesin KST); H3 `toHomePublication` (topik utama `topics[0]`, relasi angka/nama kosong → null, tanpa `publishedAt` tanpa tanggal); H4 `toHomeTopics` (hanya aktif + nama ID, collator `id`); H5 `planHomepage` (off, error tanpa topik, kosong, satu, banyak tanpa mengulang lead); H6–H7 kontrak query `findHomepagePublications`/`findActiveTopics` dengan `find` palsu (anonim, `draft: false`, `fallbackLocale: false`, `locale: id`, bertanggal lalu tanpa tanggal); H8 log galat hanya nama galat |
| `tests/build/env-gate-http.test.ts` | G1–G8 | Gerbang CMS lewat HTTP pada mode off/on/prod (dipanggil oleh `test:build-matrix`; tidak masuk `bun run test`). M3-04: G1 juga memeriksa tidak ada teks sampel homepage (peka huruf besar; kata kunci metadata "learning hub" tetap sampai M3-07; cek "Learning Hub" disesuaikan di M3-12 saat blok dan menunya dibuka kembali); G7 (off, prod) catatan "Belum ada publikasi yang terbit" tanpa blok CMS dan tanpa tautan `/id/publications`; G8 (on) blok CMS dirender |
| `tests/integration/access.test.ts` | 37 | Arsip `m3-02-access-checks` (39 cek): S1, S2, A1.1–A1.10 (Local API anonim hanya published + public), A2, L1–L3, E1–E11 (batas role Editor/Admin), D1–D4, D3b, LC1–LC5; L4 dan D3x OBSERVED |
| `tests/integration/guards.test.ts` | 23 | Arsip `m3-02-review-fixes-checks` (25 cek): G1, G2, G2b, G2c, G3–G6 (Admin terakhir; Owner hanya di transaksi rollback), T1–T7 (hapus Translation Group hanya Admin dan tidak saat dipakai), P0–P5 (`publishedAt`); G7 OBSERVED |
| `tests/integration/locale.test.ts` | 37 | Arsip `m3-01-locale-checks` (37 cek): L1.1–L2.4, S1, S1.b, S2, S2.b, Q1–Q3, R1.1–R1.6, R2, R3, R3.b, R4.1–R4.3, R5.1–R5.6, F1, F1.b, F2, F3 (`?fallback-locale=` ditolak); E.id, E.en, F4 OBSERVED |
| `tests/integration/race.test.ts` | 3 | Arsip `m3-02-race-checks` (4 cek): R1–R3, penulis bersamaan pada field bersama (row lock Translation Group, DEC-004) |
| `tests/integration/workflow.test.ts` | 14 | M3-03 (DEC-015, DECISIONS §2.6): W1–W7 satu record lewat draft tidak lengkap → publish ditolak 400 (field wajib) → terbit → revisi draft (situs tetap versi lama) → terbit revisi → unpublish seperti tombol admin → terbit ulang, dengan `/id/publications` dicek pada request berikutnya dan `publishedAt` pertama dipertahankan; W8 unpublish ID, EN tetap tayang; W9 `liveOnSite` di daftar staf; W9b tanpa key `liveOnSite` untuk Local API anonim; W10–W12 simpan tanpa `_status` di atas draft tertunda ditolak (Local API, REST Editor, `updateSharedFields` + rollback); W13 simpan tanpa `_status` tetap diterima tanpa draft tertunda |
| `tests/integration/homepage.test.ts` | 9 | M3-04 (DECISIONS §2.7): HP1 lead = publikasi bertanggal terbaru, indeks bertanggal dulu lalu tanpa tanggal urut `createdAt`, maksimal 4 baris; HP2 tanpa record `registered`, draft, atau EN; HP3 tanggal WIB, keterangan "Publikasi terbaru · 2090", judul fixture, badge "Akses publik"; HP4 Bidang kerja hanya topik aktif, urut nama; HP5 label topik utama nonaktif tetap tampil; HP6 unpublish lead terlihat pada request berikutnya; HP7 tanpa nama field staf/internal di HTML; HP8/HP9 urutan inisialisasi Payload §12.5 (server kedua, `GET /` atau `GET /admin` lebih dulu, lalu login kosong ke `/api/users/login` wajib 400 dengan `errors[0].data`). Sejak perbaikan review R1 (branch `fix/payload-single-instance`), HP1 memeriksa sifat urutan (bertanggal terbaru dulu, semua baris bertanggal sebelum baris tanpa tanggal, maksimal 4 baris) dan urutan relatif fixture-nya (`old`, `undated-2`, `undated-1`), bukan posisi tetap, sehingga record published + public lain di `mahira-cms` tidak membuatnya gagal |
| `tests/integration/db-invariants.test.ts` | 4 | I1 users = 1 dan satu-satunya user Admin bukan fixture; I2 RLS aktif di setiap tabel `public`; I3 setiap migrasi di `payload/migrations/index.ts` sudah jalan; I4 0 record `fixture-test-` |

Hasil di tree akhir M3-10: unit 69/69; integrasi 104/104 (37 + 23 + 37 + 3 + 4); matriks build: absent build 0 + gerbang off 12/12, prodsim build 0 + gerbang prod 12/12, partial build gagal dengan nama variabel saja, full build 0 + gerbang on 10/10. Setiap area keamanan diuji rusak-sengaja dan gagal seperti diharapkan (bukti: CHANGELOG [M3-10]).

Hasil di tree akhir M3-03 (2026-11-12): unit 89/89; integrasi 118/118 (37 + 23 + 37 + 3 + 14 + 4); matriks build keempat mode PASS dengan angka gerbang yang sama. Setiap tes baru diuji rusak-sengaja (bukti: CHANGELOG [M3-03]).

Hasil di tree akhir M3-04 (2026-11-12, kode `2c9da35`): unit 97/97; integrasi 125/125 lulus + 1 `todo` (37 + 23 + 37 + 3 + 14 + 7 + 4; HP8 `todo` gagal seperti diharapkan, §12.5), run penuh ±17,5 menit; matriks build: absent build 0 + gerbang off 13/13, prodsim build 0 + gerbang prod 13/13, partial build gagal dengan nama variabel saja, full build 0 + gerbang on 11/11. Setiap tes baru (H1–H8, G1 tambahan, G7, G8, HP1–HP7) diuji rusak-sengaja dan gagal seperti diharapkan (bukti: CHANGELOG [M3-04]).

Hasil perbaikan urutan inisialisasi Payload dan review R1 (2026-11-13, branch `fix/payload-single-instance`, kode `140d7ee`): unit 97/97; integrasi 127/127 (37 + 23 + 37 + 3 + 14 + 9 + 4) tanpa warm-up REST; matriks build keempat mode PASS dengan angka gerbang M3-04. HP8 dan HP9 gagal sebelum `serverExternalPackages` (`data=no`) dan lulus sesudahnya; HP1 baru gagal pada dua uji rusak-sengaja (bukti: CHANGELOG [M3-04] di Fixed).

### 12.3 Aturan keamanan DB (P2 A)

- **Guard target** (`tests/helpers/target-guard.ts`): tes menolak jalan sebelum koneksi DB bila `VERCEL_ENV` terisi, bila set env CMS tidak lengkap, atau bila `CMS_SUPABASE_DATABASE_URI` tidak menunjuk project `mahira-cms` (ref `qnfzzymrceoubowfknvl`). Pesan hanya menyebut nama variabel.
- **Guard Owner:** sebelum dan sesudah setiap file, `users` = 1 dan satu-satunya user (bukan fixture) ber-role Admin. Email dan id Owner tidak pernah dicetak.
- **Fixture:** slug dan email berprefix `fixture-test-<area>-` (access, guard, home, locale, race, workflow), email `@example.invalid`, label/judul `[FIXTURE] test <area> `. Dihapus di awal dan akhir file; hanya fixture buatan tes yang disentuh. Fixture `[FIXTURE]` lama tidak diubah.
- **SQL langsung di `homepage.test.ts` (M3-04):** publikasi terbit tanpa `publishedAt` hanya bisa dibuat dengan `UPDATE "publications" SET "published_at" = NULL`, karena hook terbit selalu mengisi tanggal (§2.4 P3 B). `WHERE` dibatasi ke id fixture dan prefix slug `fixture-test-home-`, jadi tidak ada record lain yang tersentuh. Area `home` tidak membuat user.
- **Akun Owner** hanya disentuh di dalam transaksi yang selalu di-rollback. Uji rusak-sengaja keep-one-admin, first-user-is-admin, akses Users, `isAdminOrSelf`, dan `isAdminField` hanya lewat unit test tanpa DB.
- **Berurutan:** file integrasi jalan satu per satu; jangan menjalankan dua run integrasi bersamaan, dan jangan `bun run build` saat tes integrasi berjalan.
- Koneksi tes dibatasi `idle_in_transaction_session_timeout = '60s'`; password fixture acak di memori; log server ditulis ke folder temp OS, bukan ke repo. `migrate`, `migrate:reset`, `migrate:fresh`, dan `migrate:down` tidak pernah dijalankan oleh tes.

### 12.4 CI (P3 B)

`.github/workflows/ci.yml` jalan pada `pull_request` dan `push` ke `master`, tanpa secret, `permissions: contents: read`, action di-pin ke commit SHA, Bun 1.3.14 dan Node 26.x: `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, `bun run test:build-matrix --modes absent,prodsim,partial`. Workflow ini belum pernah jalan di GitHub sampai branch M3-10 di-push.

### 12.5 Yang belum dicakup

- E2E browser (Playwright) menunggu interaksi browser (M3-05/M5).
- Tes DB dan `migrate:status` (DEC-007) tidak jalan di CI karena tidak ada secret DB di GitHub; `db-invariants` lokal memeriksa migrasi.
- Vercel Preview memakai DB `mahira-cms` yang sama, jadi fixture published + public buatan tes sempat terlihat di Preview selama run.
- Komponen UI belum diuji (belum ada komponen interaktif).
- UI daftar dan edit Publication di admin (kolom default, "Tayang di situs", konfirmasi Unpublish) belum punya tes otomatis; cek manual Owner di Vercel Preview sampai Playwright tersedia (M3-05/M5). Tes M3-03 memanggil REST dengan parameter yang sama seperti tombol admin (Save Draft `?draft=true` + `_status: draft`, Publish `_status: published`, Unpublish `?unpublishAllLocales=true` + `_status: draft`), tetapi tidak membuka admin.
- Pooler Supabase `mahira-cms` memutus koneksi ("Connection terminated unexpectedly") di 4 dari 15 run integrasi M3-03 (2026-11-12); run diulang, tidak ada assertion yang gagal karena perilaku aplikasi. Bila pemutusan terjadi saat cleanup `after`, fixture tertinggal sampai file area yang sama jalan lagi (cleanup di awal file).
- Jalur gagal `getHomepageData` (M3-04, P3 A: pesan "Publikasi belum dapat dimuat", log hanya nama galat) hanya diuji di unit (`planHomepage` H5, `readErrorLabel` H8); tidak ada tes yang memutus DB di tengah run.
- **Batas jaminan "log hanya nama galat" (review M3-04 R2).** Jaminan PAGE-SPECIFICATIONS §2 dan DECISIONS §2.7 P3 berlaku untuk baris log aplikasi `[homepage]` (`readErrorLabel`). Bila `getPayload` gagal tersambung ke Postgres saat init (misalnya di `GET /`), adapter `@payloadcms/db-postgres` 3.93.0 (`dist/connect.js`) lebih dulu menulis log error sendiri, `Error: cannot connect to Postgres. Details: <err.message>` beserta objek `err`, dan pesan `pg`/Node itu dapat memuat host pooler atau user DB (bukan password). Log itu di luar kendali kode aplikasi (`node_modules` tidak di-patch); log runtime Vercel Preview dan log `next start` lokal (folder temp OS) diperlakukan sebagai berisi host/user DB. Tidak ada tes otomatis untuk log ini.
- **Urutan inisialisasi Payload (ada sebelum M3-04; diperbaiki 2026-11-13, branch `fix/payload-single-instance`, commit `140d7ee`).** Build produksi memuat dua salinan `payload` (bundle halaman RSC dan bundle route REST/admin; `withPayload` hanya meng-externalize `payload` di dev), dan `getPayload` menyimpan satu instance global. Bila halaman (sejak M3-04 juga `GET /`) atau `/admin` yang pertama membuat instance di proses `next start` yang baru, ValidationError REST kehilangan rincian field (`errors[0].data`; pesan tinggal "The following field is invalid: …"), karena `instanceof ValidationError` gagal antar-salinan. Run penuh pertama M3-04 gagal di access D2 dan workflow W2/W11 karena ini. Perbaikan: `serverExternalPackages: ["payload"]` di `next.config.ts` (disetujui Owner 2026-11-12). Warm-up REST dihapus: runner tidak lagi memakai `warmPath: "/api/users"` dan `assertServerUp` tidak lagi mengirim GET REST sebelum `GET /`, jadi semua tes REST kini jalan di atas instance yang dibuat halaman. HP8 (`GET /` lebih dulu) menjadi tes biasa dan HP9 (`GET /admin` lebih dulu, `startNextServer` `warmPath`) ditambahkan; keduanya gagal sebelum perbaikan (`data=no`) dan lulus sesudahnya (`name=ValidationError data=yes paths=email`). Belum dicek di Vercel Preview (menunggu deploy). Detail: MILESTONES M3-04, ENVIRONMENTS §3.1.

### 12.6 Exit code di Node 26.13.0

Di Node lokal v26.13.0 semua run M3-10, M3-03, dan M3-04 (unit, matriks build, integrasi, termasuk run rusak-sengaja) mengembalikan exit code aslinya: 0 lulus, 1 gagal. Tes `todo` yang gagal (HP8 sampai perbaikan 2026-11-13) tidak mengubah exit code. Assertion libuv / exit 9 yang tercatat di SPIKE-001 §8 (Node 26.4.0) tidak muncul. Exit code tidak disamarkan dan `--test-force-exit` tidak dipakai.

### 12.7 Tes race saat upgrade Payload

Row lock Translation Group bergantung pada internal `@payloadcms/drizzle` (ENVIRONMENTS §3.1). Pada setiap upgrade Payload (dan `pg`), jalankan ulang tes race sampai lulus:

- `bun run test:integration --skip-build --only race`, atau
- langsung tanpa server: `node --import tsx --test --test-reporter=spec tests/integration/race.test.ts`.

Helper `closeTestPayload` mengakhiri pool `pg` lewat internal `pg-pool` 3.14.0; tes race yang selesai dan keluar sendiri juga membuktikan helper ini masih berfungsi.

Tes workflow (M3-03) juga bergantung pada perilaku Payload 3.93.0 (ENVIRONMENTS §3.1): jalankan ulang `bun run test:integration --only race,workflow` pada setiap upgrade Payload.

`serverExternalPackages: ["payload"]` (§12.5) bergantung pada cara `withPayload` 3.93.0 membundel `payload`: pada setiap upgrade Payload atau Next, jalankan ulang `bun run test:integration --only homepage` (dengan build) sampai HP8 dan HP9 lulus (ENVIRONMENTS §3.1, DEC-006).
