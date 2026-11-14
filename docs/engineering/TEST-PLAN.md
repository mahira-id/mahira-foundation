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
| E2E | Complete user workflows | Editorial publish, browse/search, auth, gated download | Playwright, ditunda ke M5 (DECISIONS §2.11 P12 B: `@playwright/test` tidak dipasang di M3-05). Sampai itu bagian browser dicek manual lewat Playwright MCP dengan tangkapan layar di folder tugas. |
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

## 12. Tes yang ada di repo (M3-10, M3-03, M3-04, M3-05)

Keputusan Owner 2026-11-11: DECISIONS §2.5 (P1a A, P1b (i), P1c (i), P2 A, P3 B, P4 A, folder (a)). Runner: `node:test` bawaan Node 26 dengan loader `tsx` 4.23.15. Semua tes jalan di Node (DEC-018); Bun hanya meluncurkan script. Vitest, Jest, `bun test`, dan Playwright tidak dipasang. Tes workflow editorial M3-03 mengikuti jawaban Owner 2026-11-12 (DECISIONS §2.6); tes homepage M3-04 mengikuti jawaban Owner 2026-11-12 (DECISIONS §2.7); tes indeks, detail, dan pratinjau M3-05 mengikuti jawaban Owner 2026-11-13 beserta amandemennya (DECISIONS §2.11).

### 12.1 Perintah

| Perintah | Isi | Butuh | Durasi lokal (2026-11-12) |
|---|---|---|---|
| `bun run test` | Unit test `tests/unit/**/*.test.ts` | Tanpa DB, tanpa `.env.local` | ±15–45 detik (106 tes sejak butir 1c, 132 sejak M3-05; sebagian besar waktu impor `tsx`/Payload) |
| `bun run test:integration [--skip-build] [--only access,guards,locale,race,workflow,homepage,admin,index,detail,preview,db-invariants]` | Build env lengkap, `next start` di port 3100 (request pertama `GET /`, tanpa warm-up REST sejak perbaikan urutan inisialisasi Payload; §12.5), lalu satu proses `node --test` per file dengan urutan access, guards, locale, race, workflow, homepage, admin (sejak butir 1c), index, detail, preview (sejak M3-05), db-invariants; server dihentikan di `finally`; exit 1 bila ada file gagal. HP8, HP9 (`homepage`) dan DT10 (`detail`) masing-masing menyalakan server kedua di port 3101 tanpa build | `.env.local` lengkap, DB `mahira-cms` | Run penuh M3-03 2026-11-12: 15,5 menit (access ±3–5,5; guards ±3–4; locale ±1; race ±3–4; workflow ±3,5–6; db-invariants ±20 detik; build ±1 menit). M3-05 (2026-11-13): `--only locale,homepage,index,detail,db-invariants` dengan build ±16 menit; `--only admin,detail,preview,db-invariants` dengan build ±8 menit; `detail` ±3,5 menit (DT10 menyalakan server kedua); satu request indeks ±1–2 detik (4 query berurutan ke pooler) |
| `bun run test:build-matrix [--modes absent,prodsim,partial,full]` | 4 mode build + cek HTTP gerbang (`tests/build/env-gate-http.test.ts`) + secret-scan log build dan `.next/static` + `.next/server` | Mode `full` dan secret-scan `.next` hanya bila `.env.local` ada | ±2,5–3,5 menit dengan cache Turbopack hangat |

Cek read-only tanpa server: `node --import tsx --test --test-reporter=spec tests/integration/db-invariants.test.ts`.

Runner integrasi menjalankan satu proses per file karena `node:test` mengurutkan file satu invocation berdasarkan nama, sedangkan `db-invariants` harus terakhir.

### 12.2 File dan cakupan

ID cek dari skrip arsip M3-01/M3-02 dipertahankan di nama tes. Cek jumlah user (S0/S9, U0/U1) menjadi hook `before`/`after` (guard Owner), sehingga jumlah tes lebih kecil daripada jumlah cek arsip.

| File | Tes | Cakupan |
|---|---|---|
| `tests/unit/env.test.ts` | 11 | `payload/env.ts`: tanpa env → CMS mati; set lengkap → hidup; set parsial → error yang hanya menyebut nama variabel; `VERCEL_ENV=production` mematikan CMS, juga untuk set parsial |
| `tests/unit/proxy.test.ts` | 11 | `proxy.ts`: 404 + `X-Robots-Tag: noindex` + `Cache-Control: no-store` saat CMS mati, juga dengan cookie auth dan untuk `POST` (cek cookie tidak pernah mendahului gerbang); lanjut saat hidup; `config.matcher` 4 entri. Butir 1c (DECISIONS §2.10), CMS hidup: PX1 `GET /admin` tanpa cookie → 307 `/admin/login` tanpa `redirect`; PX2 deep link → `redirect` = path + query tanpa `_rsc` dan tanpa `redirect` lama; PX3 route admin publik Payload diteruskan; PX4 halaman admin yang dilindungi bukan publik; PX5 cookie `payload-token` berisi → diteruskan, cookie kosong atau cookie lain → 307; PX6 `POST`/`HEAD`/`PUT /admin`, `/api/*`, dan halaman publikasi diteruskan |
| `tests/unit/locales.test.ts` | 10 | `lib/i18n/locales.ts`: `LOCALES`, `DEFAULT_LOCALE`, `isLocale`, `otherLocale`, `languageSwitchHref` |
| `tests/unit/roles.test.ts` | 19 | `payload/access/roles.ts` (6, termasuk `isStaffField` dari M3-03; M3-05: `staffRoleOfUser`, 1) + akses koleksi Publications, Users, Topics, PublicationTypes, TranslationGroups dan field `everPublished` (12) |
| `tests/unit/publication-index.test.ts` | 12 | M3-05 (DECISIONS §2.11 P1–P5): IXU1 `readIndexQuery` (nilai pertama, kosong = tidak ada, parameter lain dibuang); IXU2 `parsePage`; IXU3 `indexHref` (urutan tetap, halaman 1 dan nilai kosong tidak ditulis); IXU4 `orderRefs` (bertanggal dulu, pemecah seri `id`); IXU5 pilihan hanya term aktif + bernama + dipakai, urutan collator; IXU6 tahun WIB; IXU7 `topic` di posisi mana pun, AND; IXU8 nilai tak dikenal → `unknown-filter` sebelum cek halaman; IXU9 `page-not-found`, `empty` vs `no-results`, isi halaman 2; IXU10 `toIndexItem` tanggal ID/EN, label term nonaktif; IXU11 `indexNoindex`; IXU12 kontrak query dengan `find` palsu (anonim, `overrideAccess: false`, `draft: false`, `fallbackLocale: false`, `pagination: false`, tanpa query untuk id kosong, tanpa field staf) |
| `tests/unit/publication-detail.test.ts` | 6 | M3-05 (§2.11 P7, P8, P11): DTU1 `isPublicationSlug`; DTU2 `toPublicationDetail` (paragraf, urutan topik, term tanpa nama dibuang, tanggal ID/EN); DTU3 cover hanya Media gambar dengan `url` dan ukuran; DTU4 `switcherFor`; DTU5 kontrak `findPublicPublication` (anonim, `draft: false`, `fallbackLocale: false`, `limit: 1`, tanpa field staf); DTU6 kontrak `findDraftPublication` (`draft: true`, `user`, `overrideAccess: false`) |
| `tests/unit/preview.test.ts` | 7 | M3-05 (§2.11 P11): PVU1 `previewUrl`; PVU2 `parsePreviewId` (bilangan bulat positif ≤ 2147483647, tanpa nol di depan); PVU3 `previewTarget`; PVU4 `exitTarget`; PVU5 `staffFromHeaders` dengan `auth` palsu (Editor/Admin → user; tanpa user, role lain, koleksi lain → null); PVU6 `Publications.admin.preview`; PVU7 kontrak `findDraftRef` (`draft: true`, `user`, `overrideAccess: false`) |
| `tests/unit/publication-workflow.test.ts` | 19 | M3-03 (DECISIONS §2.6): `readLiveOnSite` L1–L5 (anonim tanpa query; staf dan `overrideAccess` dihitung dari record utama dengan `PUBLIC_PUBLICATION_READ`; tanpa id → `no`; query satu request berurutan), konfigurasi `liveOnSite` (virtual, tanpa filter daftar, hanya dibaca staf, tidak pernah ditulis) dan `defaultColumns`; `markStatusNotSent` M1–M2 dan `refuseImplicitStatusOverPendingDraft` U1–U7 (P5 A), urutan hook `beforeOperation`/`beforeChange` |
| `tests/unit/publication-lifecycle.test.ts` | 9 | `setPublicationLifecycleFields` (`publishedAt` terisi saat terbit, termasuk nilai `null`; `everPublished`) |
| `tests/unit/deny-public-fallback.test.ts` | 7 | `denyPublicFallback`: request tanpa login tidak boleh fallback locale |
| `tests/unit/staff-user-hooks.test.ts` | 11 | `keepOneAdminOnRoleChange` (3), `keepOneAdminOnDelete` termasuk hapus bulk (5), `firstUserIsAdmin` (3); user in-memory, tanpa DB |
| `tests/unit/homepage.test.ts` | 8 | M3-04 (DECISIONS §2.7): H1–H2 tanggal "28 Okt 2026" dan tahun dalam WIB (beda dari UTC dan zona mesin KST); H3 `toHomePublication` (topik utama `topics[0]`, relasi angka/nama kosong → null, tanpa `publishedAt` tanpa tanggal); H4 `toHomeTopics` (hanya aktif + nama ID, collator `id`); H5 `planHomepage` (off, error tanpa topik, kosong, satu, banyak tanpa mengulang lead); H6–H7 kontrak query `findHomepagePublications`/`findActiveTopics` dengan `find` palsu (anonim, `draft: false`, `fallbackLocale: false`, `locale: id`, bertanggal lalu tanpa tanggal); H8 log galat hanya nama galat |
| `tests/unit/db-connection.test.ts` | 2 | Butir 1b (DECISIONS §2.9 jawaban 2 A, 3 A), `payload/payload.config.ts` asli dengan env CMS palsu, tanpa DB: DB1 opsi pool `max` 5, `idleTimeoutMillis` 5000, `connectionTimeoutMillis` 10000; DB2 `getPayload` ke server TCP lokal yang menutup setiap koneksi: dua percobaan sama-sama melempar galat init (`payloadInitError`), keduanya mencapai server (init dicoba ulang), dan tidak ada `unhandledRejection`. `NODE_ENV=production` mencegah `payload generate:types` menulis ulang `payload/payload-types.ts` |
| `tests/build/env-gate-http.test.ts` | G1–G8 | Gerbang CMS lewat HTTP pada mode off/on/prod (dipanggil oleh `test:build-matrix`; tidak masuk `bun run test`). M3-04: G1 juga memeriksa tidak ada teks sampel homepage (peka huruf besar; kata kunci metadata "learning hub" tetap sampai M3-07; cek "Learning Hub" disesuaikan di M3-12 saat blok dan menunya dibuka kembali); G7 (off, prod) catatan "Belum ada publikasi yang terbit" tanpa blok CMS dan tanpa tautan `/id/publications`; G8 (on) blok CMS dirender. M3-05 (DECISIONS §2.11 P11, P14, amandemen P7): G3.6 `GET /api/preview?id=1` dan G3.7 `POST /api/preview/exit` (off, prod) → 404 + `noindex` + `no-store`; G5.3/G5.4 `GET /{id,en}/publications/gate-check` (off, prod) → 404; G6.3 `/id/publications/gate-no-such-slug` dan G6.4 `/id/publications/Gate-Upper` (on) → halaman not-found dengan `noindex` dan digest `notFound()` (HTTP 200; 404 juga diterima); G4.4 `GET /api/preview?id=1` anonim (on) → 404 + `noindex` + `no-store`, tanpa cookie `__prerender_bypass` |
| `tests/integration/access.test.ts` | 37 | Arsip `m3-02-access-checks` (39 cek): S1, S2, A1.1–A1.10 (Local API anonim hanya published + public), A2, L1–L3, E1–E11 (batas role Editor/Admin), D1–D4, D3b, LC1–LC5; L4 dan D3x OBSERVED |
| `tests/integration/guards.test.ts` | 23 | Arsip `m3-02-review-fixes-checks` (25 cek): G1, G2, G2b, G2c, G3–G6 (Admin terakhir; Owner hanya di transaksi rollback), T1–T7 (hapus Translation Group hanya Admin dan tidak saat dipakai), P0–P5 (`publishedAt`); G7 OBSERVED |
| `tests/integration/locale.test.ts` | 37 | Arsip `m3-01-locale-checks` (37 cek): L1.1–L2.4, S1, S1.b, S2, S2.b, Q1–Q3, R1.1–R1.6, R2, R3, R3.b, R4.1–R4.3, R5.1–R5.6, F1, F1.b, F2, F3 (`?fallback-locale=` ditolak); E.id, E.en, F4 OBSERVED. Sejak M3-05: L1.3/L2.3, L1.4/L2.4, dan Q1–Q3 membandingkan gabungan semua halaman indeks (`fetchAllIndexPages`); R1.6 (`/id/publications/x`) memeriksa halaman not-found + `noindex`, bukan 404 (§2.11 amandemen P7 A) |
| `tests/integration/race.test.ts` | 3 | Arsip `m3-02-race-checks` (4 cek): R1–R3, penulis bersamaan pada field bersama (row lock Translation Group, DEC-004) |
| `tests/integration/workflow.test.ts` | 14 | M3-03 (DEC-015, DECISIONS §2.6): W1–W7 satu record lewat draft tidak lengkap → publish ditolak 400 (field wajib) → terbit → revisi draft (situs tetap versi lama) → terbit revisi → unpublish seperti tombol admin → terbit ulang, dengan `/id/publications` dicek pada request berikutnya dan `publishedAt` pertama dipertahankan; W8 unpublish ID, EN tetap tayang; W9 `liveOnSite` di daftar staf; W9b tanpa key `liveOnSite` untuk Local API anonim; W10–W12 simpan tanpa `_status` di atas draft tertunda ditolak (Local API, REST Editor, `updateSharedFields` + rollback); W13 simpan tanpa `_status` tetap diterima tanpa draft tertunda. Sejak M3-05, `listed()` membaca semua halaman indeks |
| `tests/integration/homepage.test.ts` | 10 | M3-05 HP10 (§2.11 P10 A): judul lead bertautan ke `/id/publications/<slug>`; setiap baris indeks punya tautan `data-home-read` ke `/id/publications/<slug>` di luar `<summary>`. M3-04 (DECISIONS §2.7): HP1 lead = publikasi bertanggal terbaru, indeks bertanggal dulu lalu tanpa tanggal urut `createdAt`, maksimal 4 baris; HP2 tanpa record `registered`, draft, atau EN; HP3 tanggal WIB, keterangan "Publikasi terbaru · 2090", judul fixture, badge "Akses publik"; HP4 Bidang kerja hanya topik aktif, urut nama; HP5 label topik utama nonaktif tetap tampil; HP6 unpublish lead terlihat pada request berikutnya; HP7 tanpa nama field staf/internal di HTML; HP8/HP9 urutan inisialisasi Payload §12.5 (server kedua, `GET /` atau `GET /admin/login` lebih dulu; HP9 memakai `GET /admin` sampai butir 1c, lalu login kosong ke `/api/users/login` wajib 400 dengan `errors[0].data`). Sejak perbaikan review R1 (branch `fix/payload-single-instance`), HP1 memeriksa sifat urutan (bertanggal terbaru dulu, semua baris bertanggal sebelum baris tanpa tanggal, maksimal 4 baris) dan urutan relatif fixture-nya (`old`, `undated-2`, `undated-1`), bukan posisi tetap, sehingga record published + public lain di `mahira-cms` tidak membuatnya gagal |
| `tests/integration/admin.test.ts` | 7 | Butir 1c (DECISIONS §2.10), lewat HTTP tanpa browser: AD1 `GET /admin` anonim → 307 `/admin/login` tanpa `redirect`; AD2 deep link anonim (dokumen dan request RSC) → 307 dengan `redirect=<path dan query>`; AD3 route admin publik Payload (`login`, `forgot`, `reset/…`, `logout-inactivity`, `create-first-user`, `unauthorized`, `users/verify/…`) → 200; AD4 `POST /admin` dan `GET /api/users/me` anonim tidak dialihkan; AD5 sesi Editor fixture (cookie `payload-token`): `/admin` dokumen dan RSC 200 tanpa redirect ke `/admin/login`, dashboard dirender; AD6 sesi itu di `/admin/login` dialihkan ke `/admin` (server melihat sesi); AD7 cookie tidak sah diteruskan proxy dan Payload sendiri mengalihkan ke `/admin/login`. Request RSC mengikuti satu 307 `_rsc` dari Next 16. Bagian browser (cache router, route `<Activity>`) tidak dicakup (§12.5) |
| `tests/integration/publication-index.test.ts` | 10 | M3-05 (§2.11 P1–P5, P15), area `index`, helper `tests/helpers/publication-pages.ts`: IX1 `?type=` halaman 1 (12 baris berurutan, jumlah, `noindex, follow`); IX2 halaman 2 dan tautan pagination (tetap `type`, tanpa nilai kosong, halaman 1 tanpa `page`); IX3 `topic` posisi kedua, `year=2090` dalam WIB tanpa publikasi tanpa tanggal, `type`+`topic` AND; IX4 pilihan filter (term nonaktif dan jenis yang hanya dipakai record `registered` tidak muncul); IX5 nilai tak dikenal → `unknown-filter` + "Hapus filter" + `noindex`; IX6 `page=0`, `abc`, `01`, `99` → `page-not-found` + tautan halaman 1 + `noindex`; IX7 tanpa filter, `?utm_source=x`, `?type=&topic=&year=` → `list` tanpa `noindex`; IX8 draft, `registered`, EN tidak pernah tampil di `/id/publications`; IX9 `/en/publications` dengan teks dan tautan EN; IX10 tanpa `liveOnSite`, `everPublished`, `translationGroup`, `_status` di HTML |
| `tests/integration/publication-detail.test.ts` | 10 | M3-05 (§2.11 P7, P8, P10, P15 dan amandemen), area `detail`: DT1 isi detail ID (H1, dua paragraf, penulis, jenis, label topik nonaktif lebih dulu, "05 Jan 2090", "Bahasa Indonesia", "Akses publik", breadcrumb, `<title>`, description); DT2 draft, `registered`, `subscriber`, slug locale lain, slug tidak ada, huruf besar, `a_b` → halaman not-found + `noindex` + digest `notFound()` (HTTP 200; 404 juga diterima); DT3 switcher ke pasangan EN dengan `hreflang="en"`; DT4 tanpa pasangan (pasangan EN berupa draft) → `/en/publications` dengan `title` "Belum tersedia dalam English"; DT5 trailing slash → 308; DT6 halaman EN ("05 Jan 2090", "Public access", logo `hreflang="id"`, switcher ke pasangan ID); DT7 unpublish → not-found pada request berikutnya, terbit ulang → tampil; DT8 baris indeks bertautan ke detail; DT9 tanpa field staf/internal di HTML; DT10 gagal baca (server kedua di port 3101 dengan DB tak terjangkau): detail → `data-publication-error`, `noindex`, tanpa `127.0.0.1` (HTTP 200); indeks → `data-index-state="error"` + `noindex` |
| `tests/integration/preview.test.ts` | 10 | M3-05 (§2.11 P11), area `preview`, Editor fixture `fixture-test-preview-editor@example.invalid` (cookie `payload-token`, tidak pernah dicetak): PV1 `GET /api/preview` anonim → 404 tanpa `__prerender_bypass`; PV2 id tidak valid atau tidak dikenal dengan sesi Editor → 404; PV3 `payload-token` tidak sah → 404; PV4 Editor → 307 ke URL draf + `__prerender_bypass`; PV5 bypass + Editor → draf, banner, `data-preview="true"`, `noindex`, `no-store`; PV6 bypass tanpa Editor → not-found untuk draf, versi tayang tanpa banner untuk `live`; PV7 revisi tertunda `T2` hanya dengan bypass + Editor; PV8 indeks dan `/` tidak pernah menampilkan draf atau banner; PV9 `POST /api/preview/exit` → 303 ke detail + `Set-Cookie` yang menghapus `__prerender_bypass`, field tidak valid → 303 `/`; PV10 `GET /api/preview/exit` → 405 |
| `tests/integration/db-invariants.test.ts` | 4 | I1 users = 1 dan satu-satunya user Admin bukan fixture; I2 RLS aktif di setiap tabel `public`; I3 setiap migrasi di `payload/migrations/index.ts` sudah jalan; I4 0 record `fixture-test-` |

Hasil di tree akhir M3-10: unit 69/69; integrasi 104/104 (37 + 23 + 37 + 3 + 4); matriks build: absent build 0 + gerbang off 12/12, prodsim build 0 + gerbang prod 12/12, partial build gagal dengan nama variabel saja, full build 0 + gerbang on 10/10. Setiap area keamanan diuji rusak-sengaja dan gagal seperti diharapkan (bukti: CHANGELOG [M3-10]).

Hasil di tree akhir M3-03 (2026-11-12): unit 89/89; integrasi 118/118 (37 + 23 + 37 + 3 + 14 + 4); matriks build keempat mode PASS dengan angka gerbang yang sama. Setiap tes baru diuji rusak-sengaja (bukti: CHANGELOG [M3-03]).

Hasil di tree akhir M3-04 (2026-11-12, kode `2c9da35`): unit 97/97; integrasi 125/125 lulus + 1 `todo` (37 + 23 + 37 + 3 + 14 + 7 + 4; HP8 `todo` gagal seperti diharapkan, §12.5), run penuh ±17,5 menit; matriks build: absent build 0 + gerbang off 13/13, prodsim build 0 + gerbang prod 13/13, partial build gagal dengan nama variabel saja, full build 0 + gerbang on 11/11. Setiap tes baru (H1–H8, G1 tambahan, G7, G8, HP1–HP7) diuji rusak-sengaja dan gagal seperti diharapkan (bukti: CHANGELOG [M3-04]).

Hasil perbaikan urutan inisialisasi Payload dan review R1 (2026-11-13, branch `fix/payload-single-instance`, kode `140d7ee`): unit 97/97; integrasi 127/127 (37 + 23 + 37 + 3 + 14 + 9 + 4) tanpa warm-up REST; matriks build keempat mode PASS dengan angka gerbang M3-04. HP8 dan HP9 gagal sebelum `serverExternalPackages` (`data=no`) dan lulus sesudahnya; HP1 baru gagal pada dua uji rusak-sengaja (bukti: CHANGELOG [M3-04] di Fixed).

Hasil batas koneksi database butir 1b (2026-11-12 UTC, branch `fix/db-connection-limits`, kode `311683f`): unit 99/99 (97 + DB1, DB2); integrasi 127/127 pada run kedua (run pertama terkena putus koneksi pooler saat cleanup `workflow`, §12.5); matriks build keempat mode PASS dengan angka gerbang M3-04. DB1 gagal dengan `max: 10`, dan DB2 gagal tanpa handler `initializing` (galat `undefined`, rejection yang tercatat di log Vercel) (bukti: CHANGELOG [M3-04] di Fixed).

Hasil loop login admin butir 1c (2026-11-13 UTC, branch `fix/admin-login-loop`, kode `a5321de`): unit 106/106 (99 + 7 baru di `proxy.test.ts`); integrasi 134/134 (37 + 23 + 37 + 3 + 14 + 9 + 7 + 4) dengan HP9 memanaskan server lewat `/admin/login`; matriks build keempat mode PASS dengan angka gerbang M3-04. Uji rusak-sengaja: redirect login dimatikan → AD1, AD2, PX1, PX2, PX5 gagal; daftar route publik kosong → PX3; `cookies.has` alih-alih nilai cookie → PX5; `_rsc` tidak dibuang → PX2 (bukti: CHANGELOG [M3-04] di Fixed).

Hasil M3-05 (2026-11-13, branch `feat/m3-05-publication-index-detail`, kode `5e2ef08`, run per fitur): unit 132/132 (106 + IXU1–IXU12, DTU1–DTU6, PVU1–PVU7, `staffRoleOfUser`); integrasi per file: locale 37/37, workflow 14/14, homepage 10/10, admin 7/7, index 10/10, detail 10/10, preview 10/10, db-invariants 4/4 (users = 1, 0 record `fixture-test-`); matriks build: absent build 0 + gerbang off 17/17, prodsim build 0 + gerbang prod 17/17, partial build gagal dengan nama variabel saja, full build 0 + gerbang on 14/14. `migrate:create m3_05_schema_check --skip-empty` tidak membuat file (P13 A). Setiap tes baru diuji rusak-sengaja dan gagal seperti diharapkan; dua break tertutupi lapisan lain dan dicatat (hapus `fallbackLocale` di query detail tertutup `localization.fallback: false` + hook `denyPublicFallback`; bacaan staf `draft: false` tidak menggagalkan PV5 karena record yang belum pernah terbit menyimpan draf di baris utamanya, PV7 menangkapnya). Run penuh di tree akhir sesudah rebase: CHANGELOG [M3-05].

### 12.3 Aturan keamanan DB (P2 A)

- **Guard target** (`tests/helpers/target-guard.ts`): tes menolak jalan sebelum koneksi DB bila `VERCEL_ENV` terisi, bila set env CMS tidak lengkap, atau bila `CMS_SUPABASE_DATABASE_URI` tidak menunjuk project `mahira-cms` (ref `qnfzzymrceoubowfknvl`). Pesan hanya menyebut nama variabel.
- **Guard Owner:** sebelum dan sesudah setiap file, `users` = 1 dan satu-satunya user (bukan fixture) ber-role Admin. Email dan id Owner tidak pernah dicetak.
- **Fixture:** slug dan email berprefix `fixture-test-<area>-` (access, admin, guard, home, locale, race, workflow; sejak M3-05 juga index, detail, preview), email `@example.invalid`, label/judul `[FIXTURE] test <area> `. Dihapus di awal dan akhir file; hanya fixture buatan tes yang disentuh. Fixture `[FIXTURE]` lama tidak diubah.
- **SQL langsung di `homepage.test.ts` (M3-04):** publikasi terbit tanpa `publishedAt` hanya bisa dibuat dengan `UPDATE "publications" SET "published_at" = NULL`, karena hook terbit selalu mengisi tanggal (§2.4 P3 B). `WHERE` dibatasi ke id fixture dan prefix slug `fixture-test-home-`, jadi tidak ada record lain yang tersentuh. Area `home` tidak membuat user.
- **SQL langsung di `publication-index.test.ts` (M3-05):** pola yang sama untuk dua publikasi tanpa tanggal, `WHERE` dibatasi ke id fixture dan prefix slug `fixture-test-index-`. Area `index` dan `detail` tidak membuat user. Area `preview` membuat satu Editor `fixture-test-preview-editor@example.invalid` (dihapus di awal dan akhir; guard Owner tetap `users` = 1 sesudah file) dan dua publikasi ber-`publishedAt` 2099-01-05, yang sempat terlihat di homepage Preview selama run.
- **Akun Owner** hanya disentuh di dalam transaksi yang selalu di-rollback. Uji rusak-sengaja keep-one-admin, first-user-is-admin, akses Users, `isAdminOrSelf`, dan `isAdminField` hanya lewat unit test tanpa DB.
- **Berurutan:** file integrasi jalan satu per satu; jangan menjalankan dua run integrasi bersamaan, dan jangan `bun run build` saat tes integrasi berjalan.
- **Session pooler penuh (butir 1b):** tes integrasi memakai session pooler port 5432 (`pool_size` 15), yang masih menahan koneksi beberapa menit sesudah klien pergi, misalnya sesudah Preview lama di port 5432 dipakai. Sebelum `bun run test:integration`, cek `pg_stat_activity` (read-only) dan tunggu slot kosong. Galat `EMAXCONNSESSION` berarti pooler penuh, bukan kode yang gagal (ENVIRONMENTS §3.1).
- Koneksi tes dibatasi `idle_in_transaction_session_timeout = '60s'`; password fixture acak di memori; log server ditulis ke folder temp OS, bukan ke repo. `migrate`, `migrate:reset`, `migrate:fresh`, dan `migrate:down` tidak pernah dijalankan oleh tes.

### 12.4 CI (P3 B)

`.github/workflows/ci.yml` jalan pada `pull_request` dan `push` ke `master`, tanpa secret, `permissions: contents: read`, action di-pin ke commit SHA, Bun 1.3.14 dan Node 26.x: `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, `bun run test:build-matrix --modes absent,prodsim,partial`. Workflow ini belum pernah jalan di GitHub sampai branch M3-10 di-push.

### 12.5 Yang belum dicakup

- E2E browser (Playwright) ditunda ke M5 (DECISIONS §2.11 P12 B).
- **M3-05, bagian browser tanpa tes otomatis:** navigasi klien `next/form` (submit filter mengubah URL dan kembali ke halaman 1), back/forward, dan cache router; tombol Preview di admin dan form banner "Keluar dari pratinjau" di browser nyata (cookie `__prerender_bypass` `Secure; HttpOnly; SameSite=None`); overflow horizontal di 390 px. Buktinya cek manual Playwright MCP dengan tangkapan layar di folder tugas (tidak dilacak git) dan langkah Owner di ENVIRONMENTS §3.1.
- **M3-05, belum dicakup sama sekali:** cover `coverImage` dengan record Media nyata (Media 0 record di `mahira-cms`; hanya unit DTU3); pratinjau dan halaman detail lewat transaction pooler Vercel Preview (port 6543; tes jalan di session pooler 5432); status HTTP 404/500 sungguhan untuk crawler (HTTP 200 + `noindex` per amandemen §2.11; item terbuka M3-07 `htmlLimitedBots`); teks halaman not-found bawaan Next berbahasa Inggris juga di halaman ID.
- **Log Next saat indeks gagal baca (M3-05, diperbaiki saat integrasi lintas fitur):** dengan DB tak terjangkau, `generateMetadata` indeks dulu mencatat "unstable value … while prerendering" dari Next. Sejak itu `generateMetadata` indeks memanggil `connection()` sebelum membaca, sama seperti detail. Cek manual (`next start` dengan URI DB `127.0.0.1:9`): 0 baris "unstable value"; `/id/publications`, `?type=x`, dan `/en/publications` 200 dengan state `error` dan `noindex, follow`. Log ini tidak punya tes otomatis.
- **Loop login admin (butir 1c, DECISIONS §2.10 jawaban 3 (a)).** Penyebabnya ada di router browser Next (cache data runtime dari `partialPrefetching`, route `<Activity>` tersembunyi dari `cacheComponents`), jadi tes HTTP `admin.test.ts` dan unit `proxy.test.ts` hanya memeriksa sisi server: 307 dari proxy, route yang diteruskan, dan sesi yang dikenali. Tidak ada perbedaan di level HTTP yang membuktikan efek `connection()` di halaman admin. Bukti browser: run Playwright MCP sebelum dan sesudah perbaikan di `.agents/tasks/mahira-foundation-fix-admin-login-loop-2026-11-13/` (tidak dilacak git) dan langkah Owner di ENVIRONMENTS §3.1. Sejak butir 1c, `GET /admin` anonim tidak lagi mencapai Payload, jadi HP9 memanaskan server segar dengan `GET /admin/login` (halaman admin yang sama).
- Tes DB dan `migrate:status` (DEC-007) tidak jalan di CI karena tidak ada secret DB di GitHub; `db-invariants` lokal memeriksa migrasi.
- Vercel Preview memakai DB `mahira-cms` yang sama, jadi fixture published + public buatan tes sempat terlihat di Preview selama run.
- Komponen UI belum diuji (belum ada komponen interaktif).
- UI daftar dan edit Publication di admin (kolom default, "Tayang di situs", konfirmasi Unpublish) belum punya tes otomatis; cek manual Owner di Vercel Preview sampai Playwright tersedia (M5, DECISIONS §2.11 P12 B). Tes M3-03 memanggil REST dengan parameter yang sama seperti tombol admin (Save Draft `?draft=true` + `_status: draft`, Publish `_status: published`, Unpublish `?unpublishAllLocales=true` + `_status: draft`), tetapi tidak membuka admin.
- Pooler Supabase `mahira-cms` memutus koneksi ("Connection terminated unexpectedly") di 4 dari 15 run integrasi M3-03 (2026-11-12); run diulang, tidak ada assertion yang gagal karena perilaku aplikasi. Bila pemutusan terjadi saat cleanup `after`, fixture tertinggal sampai file area yang sama jalan lagi (cleanup di awal file). Run integrasi pertama butir 1b (2026-11-12) mengalaminya: `workflow` 14/14 lulus, tetapi hook `after` gagal ("fixtures left after cleanup: translationGroups=1") dan `db-invariants` I4 gagal pada grup itu; run berikutnya membersihkannya dan lulus 127/127. Dugaan, belum diverifikasi: COMMIT hapus grup hilang, karena `@payloadcms/drizzle` 3.93.0 tidak meneruskan COMMIT yang gagal.
- **Batas koneksi database (butir 1b)** tidak punya tes integrasi otomatis. DB1 hanya memeriksa opsi pool di config; puncak 5 koneksi per proses diukur manual (burst `next start`, socket per PID lewat `netstat`, CHANGELOG [M3-04] di Fixed). Tes integrasi jalan di session pooler port 5432, sedangkan Preview memakai transaction pooler port 6543; admin di port 6543 hanya dicek Owner di Preview (ENVIRONMENTS §3.1).
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

Wrapper `db.init` di `payload/payload.config.ts` (butir 1b) bergantung pada promise internal `initializing` `@payloadcms/db-postgres` 3.93.0: pada setiap upgrade Payload, jalankan `bun run test` sampai DB1 dan DB2 (`tests/unit/db-connection.test.ts`) lulus (ENVIRONMENTS §3.1, DEC-006).

Login admin butir 1c bergantung pada nama cookie `payload-token`, daftar route admin publik Payload 3.93.0, dan edit tangan `connection()` di `app/(payload)/admin/[[...segments]]/page.tsx`: pada setiap upgrade Payload atau Next, jalankan `bun run test` sampai PX1–PX6 lulus dan `bun run test:integration --only admin` sampai AD1–AD7 lulus, lalu ulangi cek login di browser (ENVIRONMENTS §3.1 "Login admin", DEC-006).

Pratinjau dan detail M3-05 bergantung pada `payload.auth({ headers })` dan `admin.preview` Payload 3.93.0, pada Next 16.4.4 yang menggabungkan cookie Draft Mode ke `NextResponse.redirect` dan menulis `Cache-Control: no-store` di Draft Mode, serta pada static shell per locale yang membuat not-found berstatus 200: pada setiap upgrade Payload atau Next, jalankan `bun run test:integration --only detail,preview` sampai DT1–DT10 dan PV1–PV10 lulus (DT2/DT10 menerima 404/500 bila Next mengubah perilaku status).
