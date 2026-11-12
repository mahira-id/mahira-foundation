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

## 12. Tes yang ada di repo (M3-10)

Keputusan Owner 2026-11-11: DECISIONS §2.5 (P1a A, P1b (i), P1c (i), P2 A, P3 B, P4 A, folder (a)). Runner: `node:test` bawaan Node 26 dengan loader `tsx` 4.23.15. Semua tes jalan di Node (DEC-018); Bun hanya meluncurkan script. Vitest, Jest, `bun test`, dan Playwright tidak dipasang.

### 12.1 Perintah

| Perintah | Isi | Butuh | Durasi lokal (2026-11-12) |
|---|---|---|---|
| `bun run test` | Unit test `tests/unit/**/*.test.ts` | Tanpa DB, tanpa `.env.local` | ±15–45 detik (69 tes, sebagian besar waktu impor `tsx`/Payload) |
| `bun run test:integration [--skip-build] [--only access,guards,locale,race,db-invariants]` | Build env lengkap, `next start` di port 3100, lalu satu proses `node --test` per file dengan urutan access, guards, locale, race, db-invariants; server dihentikan di `finally`; exit 1 bila ada file gagal | `.env.local` lengkap, DB `mahira-cms` | ±11–15 menit run penuh (build ±1 menit; access ±4–5,5; guards ±3–4; locale ±1; race ±3,5–4; db-invariants ±20 detik) |
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
| `tests/unit/roles.test.ts` | 17 | `payload/access/roles.ts` (5) + akses koleksi Publications, Users, Topics, PublicationTypes, TranslationGroups dan field `everPublished` (12) |
| `tests/unit/publication-lifecycle.test.ts` | 9 | `setPublicationLifecycleFields` (`publishedAt` terisi saat terbit, termasuk nilai `null`; `everPublished`) |
| `tests/unit/deny-public-fallback.test.ts` | 7 | `denyPublicFallback`: request tanpa login tidak boleh fallback locale |
| `tests/unit/staff-user-hooks.test.ts` | 11 | `keepOneAdminOnRoleChange` (3), `keepOneAdminOnDelete` termasuk hapus bulk (5), `firstUserIsAdmin` (3); user in-memory, tanpa DB |
| `tests/build/env-gate-http.test.ts` | G1–G6 | Gerbang CMS lewat HTTP pada mode off/on/prod (dipanggil oleh `test:build-matrix`; tidak masuk `bun run test`) |
| `tests/integration/access.test.ts` | 37 | Arsip `m3-02-access-checks` (39 cek): S1, S2, A1.1–A1.10 (Local API anonim hanya published + public), A2, L1–L3, E1–E11 (batas role Editor/Admin), D1–D4, D3b, LC1–LC5; L4 dan D3x OBSERVED |
| `tests/integration/guards.test.ts` | 23 | Arsip `m3-02-review-fixes-checks` (25 cek): G1, G2, G2b, G2c, G3–G6 (Admin terakhir; Owner hanya di transaksi rollback), T1–T7 (hapus Translation Group hanya Admin dan tidak saat dipakai), P0–P5 (`publishedAt`); G7 OBSERVED |
| `tests/integration/locale.test.ts` | 37 | Arsip `m3-01-locale-checks` (37 cek): L1.1–L2.4, S1, S1.b, S2, S2.b, Q1–Q3, R1.1–R1.6, R2, R3, R3.b, R4.1–R4.3, R5.1–R5.6, F1, F1.b, F2, F3 (`?fallback-locale=` ditolak); E.id, E.en, F4 OBSERVED |
| `tests/integration/race.test.ts` | 3 | Arsip `m3-02-race-checks` (4 cek): R1–R3, penulis bersamaan pada field bersama (row lock Translation Group, DEC-004) |
| `tests/integration/db-invariants.test.ts` | 4 | I1 users = 1 dan satu-satunya user Admin bukan fixture; I2 RLS aktif di setiap tabel `public`; I3 setiap migrasi di `payload/migrations/index.ts` sudah jalan; I4 0 record `fixture-test-` |

Hasil di tree akhir M3-10: unit 69/69; integrasi 104/104 (37 + 23 + 37 + 3 + 4); matriks build: absent build 0 + gerbang off 12/12, prodsim build 0 + gerbang prod 12/12, partial build gagal dengan nama variabel saja, full build 0 + gerbang on 10/10. Setiap area keamanan diuji rusak-sengaja dan gagal seperti diharapkan (bukti: CHANGELOG [M3-10]).

### 12.3 Aturan keamanan DB (P2 A)

- **Guard target** (`tests/helpers/target-guard.ts`): tes menolak jalan sebelum koneksi DB bila `VERCEL_ENV` terisi, bila set env CMS tidak lengkap, atau bila `CMS_SUPABASE_DATABASE_URI` tidak menunjuk project `mahira-cms` (ref `qnfzzymrceoubowfknvl`). Pesan hanya menyebut nama variabel.
- **Guard Owner:** sebelum dan sesudah setiap file, `users` = 1 dan satu-satunya user (bukan fixture) ber-role Admin. Email dan id Owner tidak pernah dicetak.
- **Fixture:** slug dan email berprefix `fixture-test-<area>-` (access, guard, locale, race), email `@example.invalid`, label/judul `[FIXTURE] test <area> `. Dihapus di awal dan akhir file; hanya fixture buatan tes yang disentuh. Fixture `[FIXTURE]` lama tidak diubah.
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

### 12.6 Exit code di Node 26.13.0

Di Node lokal v26.13.0 semua run M3-10 (unit, matriks build, integrasi, termasuk run rusak-sengaja) mengembalikan exit code aslinya: 0 lulus, 1 gagal. Assertion libuv / exit 9 yang tercatat di SPIKE-001 §8 (Node 26.4.0) tidak muncul. Exit code tidak disamarkan dan `--test-force-exit` tidak dipakai.

### 12.7 Tes race saat upgrade Payload

Row lock Translation Group bergantung pada internal `@payloadcms/drizzle` (ENVIRONMENTS §3.1). Pada setiap upgrade Payload (dan `pg`), jalankan ulang tes race sampai lulus:

- `bun run test:integration --skip-build --only race`, atau
- langsung tanpa server: `node --import tsx --test --test-reporter=spec tests/integration/race.test.ts`.

Helper `closeTestPayload` mengakhiri pool `pg` lewat internal `pg-pool` 3.14.0; tes race yang selesai dan keluar sendiri juga membuktikan helper ini masih berfungsi.
