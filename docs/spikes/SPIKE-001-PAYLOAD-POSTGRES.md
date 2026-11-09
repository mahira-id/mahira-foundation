# SPIKE-001 — Payload CMS with Supabase PostgreSQL

**Status:** Completed with findings · **Owner:** Haidar (Product Owner), approver keputusan · **Date:** 2026-11-10 (dijalankan 2026-11-09 s.d. 2026-11-10) · **Decision links:** DEC-004, DEC-005, DEC-006, DEC-007, DEC-013, DEC-018 · **ADR:** 0002, 0004, 0005

Branch spike: `spike/m2-payload-postgres` (lokal, tidak di-push, tidak di-merge), basis `c013392`. Commit kode: `17fdf0c`, `3b1ff83`, `c8b783b` (M2-01, M2-02); `c19a774` (M2-03, lihat SPIKE-003). Rekomendasi keputusan dicatat sebagai usulan di `decisions/DECISIONS.md` §2.3; tidak ada status DEC yang diubah oleh spike ini.

## 1. Question
Can the pinned Payload CMS 3 integration and selected PostgreSQL adapter run reliably against the intended Supabase database configuration, with isolated schema ownership and repeatable migrations, in local development and the proposed deployment environment?

Untuk M2-02 ditambahkan pertanyaan turunan: apakah model localization hybrid DEC-004 dan aturan slug DEC-005 dapat ditegakkan di Payload 3.93.0 (delapan pemeriksaan workshop 2026-11-06, §7.6).

## 2. Hypothesis
A single Next.js application can host Payload while Payload owns its collections/tables and Supabase application SQL owns separate user/access tables. Runtime and migration connections may need different connection settings. This is a hypothesis, not a verified fact for the current repository.

## 3. Scope and non-scope
**Scope (dijalankan):**
- M2-01: Payload 3.93.0 di dalam Next.js 16.4.4 (route group `app/(payload)`), Postgres adapter ke project CMS `mahira-cms`, koleksi Users, Authors, Topics, PublicationTypes, TranslationGroups, Publications; migrasi awal, upgrade di DB berisi data, reset + clean install; RLS; admin UI; REST anonim; restart; mode koneksi + konkurensi.
- M2-02: pemeriksaan localization 1–8 (DEC-004/DEC-005, check 8 untuk DEC-013).
- M2-04 (sebagian): `bun run build` di setiap commit dan pin `engines.node`.

**Non-scope / tidak dijalankan:**
- Deploy preview: tidak dijalankan. Branch `spike/*` dilewati oleh Ignored Build Step Vercel, jadi tidak ada URL preview dan tidak ada bukti `process.version` di Vercel.
- Tabel milik aplikasi (APP) lewat otoritas migrasi terpisah (prosedur langkah 6 versi lama): tidak dijalankan. CMS dan APP adalah project Supabase terpisah; project APP tidak disentuh.
- Backup/restore database: tidak dijalankan (DEC-023, M4-03).
- Localization lengkap, skema final, migrasi konten nyata, rich text (Lexical), resize gambar (sharp), GraphQL, kredensial produksi, polish admin UX.
- Route locale `/id`, `/en`, redirect 308, canonical dan `<link rel=alternate>` di halaman: M3-01/M3-07.

## 4. Environment and pinned versions
| Item | Nilai |
|---|---|
| OS | Windows (mesin lokal di Indonesia) |
| Runtime | Node.js v26.4.0 (`C:\Program Files\nodejs\node.exe`); proses `next start` terverifikasi `node` |
| Package manager | Bun 1.3.14, hanya package manager (DEC-018); bin dijalankan lewat `bun run <script>` di bawah Node, tanpa `--bun` |
| Framework | Next.js 16.4.4 (Turbopack), React / React DOM 19.3.0, TypeScript 5.9.3, `@types/node` 20.19.43 |
| Payload | `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/db-postgres` 3.93.0 (exact); `graphql` 16.15.0 (peer `^16.8.1`) |
| Driver (dari adapter) | `pg` 8.20.0, `drizzle-orm` 0.45.2, `drizzle-kit` 0.31.7; `tsx` 4.23.15 untuk `payload run` |
| Database | Supabase `mahira-cms` (ref `qnfzzymrceoubowfknvl`), `eu-west-1`, PostgreSQL 17.11 (aarch64) |
| Koneksi | Session pooler (Supavisor, host `*.pooler.supabase.com`), port 5432, URI tanpa `sslmode`; TLS lewat `pool.ssl` (lihat §8). Transaction pooler port 6543 diuji lewat override `SPIKE_DB_PORT` |
| Konfigurasi Payload | `push: false`, `migrationDir: payload/migrations`, `graphQL.disable: true`, admin di `/admin`, REST di `/api`; `localization: { locales: id, en; defaultLocale: 'id'; fallback: false }` (`defaultLocale` wajib di Payload, bukan keputusan default locale DEC-005) |
| Konfigurasi Next | `cacheComponents: true`, `partialPrefetching: true`, `withPayload(…, { devBundleServerPackages: false })`, rule Turbopack `*.css` dengan `condition: { not: "foreign" }` |
| `engines.node` | `26.x` |
| Target deploy | Vercel (tidak diuji, lihat §3) |

## 5. Procedure
Semua perintah dijalankan di worktree branch spike. Bukti mentah disimpan di luar repo (folder evidence task M2, tidak di-commit).

1. Baseline di `c013392`: `bun run lint`, `bun run build`, `bun run start --port 3100`, cek `GET /` dan computed style `#beranda` (Playwright).
2. Read-only Composio (`SUPABASE_RUN_READ_ONLY_QUERY`) ke CMS dan APP: inventaris skema, `pg_default_acl`, `pg_ts_config`, `to_tsvector('indonesian', …)`, ekstensi tersedia (check 8).
3. `bun add --exact payload@3.93.0 @payloadcms/next@3.93.0 @payloadcms/ui@3.93.0 @payloadcms/db-postgres@3.93.0`; `bun add graphql@^16.8.1`; `bun pm untrusted`.
4. Pindahkan homepage ke `app/(site)/`, salin file template `app/(payload)/` dari `templates/blank` tag v3.93.0 (tanpa `custom.scss` dan route GraphQL), buat `payload/payload.config.ts` + koleksi; `bun run payload generate:types`, `bun run payload generate:importmap`; tambah `engines.node`.
5. `bun run payload run scripts/spike/m2-01-db-smoke.ts` (`SPIKE_MODE=describe`): klasifikasi URI tanpa mencetak nilai; `bun run payload migrate:status` untuk konektivitas.
6. `bun run payload migrate:create initial` → `bun run payload migrate` → `migrate:status`; seed `bun run payload run scripts/spike/m2-01-seed.ts` dua kali (idempoten).
7. Tambah koleksi Publications; `bun run payload migrate:create publications` → `bun run payload migrate` pada DB berisi seed; seed `SPIKE_MODE=count`.
8. Probe Data API dengan publishable key CMS (`GET /rest/v1/<table>`), cek `relrowsecurity` dan grant via Composio.
9. `bun run payload migrate:reset`, `migrate`, `migrate:down`, `migrate:status`, `migrate` (clean install dari state repo), re-seed.
10. `bun run lint`, `bun run build`, `bun run start --port 3100`; cek `/`, `/admin`, REST anonim; buat dan publish publikasi ID + EN lewat admin UI (Playwright); stop/start server dan cek ulang data.
11. `bun run payload run scripts/spike/m2-01-db-smoke.ts`: 50 `find` paralel + 10 create/delete paralel, session 5432 dan transaction 6543.
12. `node scripts/spike/secret-scan.mjs .next/static`, `.next`, file yang di-stage.
13. M2-02: hook shared fields + helper, lalu `bun run payload run scripts/spike/m2-02-localization-checks.ts` dua kali; cek admin UI (Playwright).

## 6. Acceptance / exit criteria
| Kriteria (dari versi Planned) | Hasil | Bukti |
|---|---|---|
| Clean install and migration work from repository state | PASS | §7.2: `migrate:reset` → `public` kosong → `migrate` menerapkan dua migrasi, re-seed exit 0 |
| Existing database migration path is repeatable and documented | PASS dengan temuan | §7.2: migrasi `publications` di DB ber-seed dan `media` di DB berisi data; `down()` hasil generate perlu diperbaiki, `migrate:reset` salah urutan (§8) |
| CRUD works after process restart and redeploy | PARTIAL: restart PASS; redeploy NOT RUN | §7.4; tidak ada preview untuk `spike/*` |
| App-owned migration does not alter Payload-owned objects | NOT RUN | Tidak ada migrasi APP di M2; project APP tidak berubah (§7.3) |
| Runtime connection behavior is stable under representative concurrency | PASS (skala spike) | §7.5: 0 error di semua run, kedua mode pooler |
| No credentials appear in client bundle or logs | PASS | secret-scan `.next/static` (70 file) dan `.next` (663 file) bersih; log server tanpa nilai env |
| Backup/restore and migration rollback/forward strategy is understood | PARTIAL | Rollback/forward dipahami (§7.2, §8); backup/restore NOT RUN (M4-03) |
| Exact version and provider limitations are recorded | PASS | §4, §8 |

## 7. Results and evidence

### 7.1 Integrasi dan build
- `bun run lint` exit 0 di setiap commit (0 error; 4–6 warning unused-arg pada signature `down()` migrasi hasil generate).
- `bun run build` exit 0 di setiap commit. Baseline `c013392`: compile ~32 s, TS ~16 s. `17fdf0c`: cold 150 s (compile 90 s, TS 35.8 s), warm 48 s. `3b1ff83`: cold 119 s (compile 47 s, TS 27.7 s), warm 34 s. `c8b783b`: 84 s lalu 62 s. Build tidak membuka koneksi DB (tidak ada log Payload/DB di output build).
- "Cache Components enabled" tanpa error build; fallback `cacheComponents: false` tidak dipakai.
- Route table:

| Route | Tipe |
|---|---|
| `/` | Static |
| `/_not-found` | Static |
| `/admin/[[...segments]]` | Partial Prerender |
| `/api/[...slug]` | Dynamic |
| `/icon.svg`, `/robots.txt` | Static |

- Homepage tidak berubah: `GET /` 200 berisi "Riset untuk"; `#beranda` `rgb(30, 111, 183)`, font Hanken Grotesk, h1 66.888px (viewport 929×869) sama dengan baseline. `/robots.txt`, `/favicon.ico`, `/icon.svg` 200; `/does-not-exist` 404.

### 7.2 Migrasi
| Langkah | Hasil | Waktu |
|---|---|---|
| `migrate:create initial` | 15 tabel `public` + enum `_locales`; satu-satunya edit: panggilan `enableRlsOnPayloadTables` di akhir `up()` | 14.9 s |
| `migrate` initial | exit 0 | up 4.2 s, 20.3 s wall |
| Seed ×2 | users 1, authors 2, topics 2, publication-types 2, translation-groups 1; run kedua membuat 0 | 49 s / 60 s |
| `migrate:create publications` + `migrate` di DB ber-seed | 4 tabel baru; data seed tetap (`SPIKE_MODE=count` PASS) | up 4.9 s; exit 9 setelah "Done." (libuv, §8), `migrate:status` Ran=Yes |
| `migrate:reset` (down asli) | FAIL: urutan oldest-first, `publications` down gagal; sisa objek spike dihapus dengan skrip sementara | 19 s |
| `migrate:down` (down asli) | FAIL: `DROP CONSTRAINT` setelah `CASCADE`; transaksi di-rollback | 20 s |
| Dengan guard `IF EXISTS` di `down()`: `migrate:reset` → `migrate` → `migrate:down` → `migrate` | semua exit 0; `public` kembali 0 relasi/0 type setelah reset | up ~5 s per migrasi, down ~0.5 s, clean install ~28–29 s wall |
| Migrasi `media` (M2-03) di DB berisi 18 publikasi | exit 0 (lalu exit 9 libuv); status ketiga migrasi Ran=Yes; jumlah data tidak berubah | up 5.6 s |

Setiap panggilan CLI Payload punya start-up tetap ~13–16 s (tsx + load config).

### 7.3 Kepemilikan skema dan keamanan data
- Inventaris (Composio read-only) dibanding baseline: CMS `auth` 27, `extensions` 2, `realtime` 3, `storage` 10, `vault` 2 tabel dengan nama identik; hanya `public` yang bertambah (0 → 15 → 19, lalu 20 dengan `media`). Project APP tidak berubah (`public` 0, skema lain identik).
- RLS: 19/19 tabel `relrowsecurity = true` setelah upgrade dan setelah clean install; 20/20 setelah migrasi `media`.
- Grant: `anon` dan `authenticated` tetap punya `SELECT` pada `public.users` dan `public.publications` (default ACL Supabase). Yang memblokir baris adalah RLS tanpa policy.
- Probe Data API dengan `CMS_SUPABASE_PUBLISHABLE_KEY`: 15 tabel (termasuk `users`, `users_sessions`, `publications`, `_publications_v`, `payload_migrations`) semuanya HTTP 200 `rows=0`, padahal `users` berisi 1 baris → PASS.
- Index unik DB: `locale_slug_idx (locale, slug)` dan `"translationGroup_locale_idx" (translation_group_id, locale)` di `publications`; tabel versi mendapat pasangan non-unik. Tidak ada unique index pada `slug` saja.

### 7.4 Runtime
- Proses server: `node` di ketiga start.
- `/admin` 200 → `/admin/login`; HTML admin punya `<meta name="robots" content="noindex, nofollow">` (tanpa header `X-Robots-Tag`).
- REST anonim: `GET /api/publications` 200; `GET /api/users` 403; `POST /api/users` 403 (tidak ada registrasi mandiri staf); `GET /api/translation-groups` 403; `/api/publications/versions` 403.
- Admin UI: login staf, lalu buat dan publish publikasi `[FIXTURE]` ID (id 1) dan EN (id 2) dalam satu Translation Group. GET anonim per group → 2 dokumen `published`.
- Draft staf (dibuat lalu dihapus) tidak terlihat oleh anonim: list, `?draft=true`, `where[_status][equals]=draft` (0), `GET /3` (404).
- Restart persistence: setelah stop/start, data yang sama kembali; start ketiga pada build final juga OK.

### 7.5 Mode koneksi dan konkurensi
50 `find` paralel + 10 create/delete paralel dari Indonesia ke `eu-west-1`, pool default node-postgres (max 10). `getPayload` init 1.5–1.9 s.

| Mode | find p50/p95/max | create+delete p50/p95/max | Error |
|---|---|---|---|
| Session 5432, TLS | 3549/4014/4192 ms | 2851/4662/4662 ms | 0 |
| Session 5432, TLS (run 2) | 3575/4233/4245 ms | 2843/4668/4668 ms | 0 |
| Transaction 6543, TLS | 3553/4059/4247 ms | 2902/4728/4728 ms | 0 |
| Session 5432, plaintext (sebelum fix TLS) | 3356/3972/4002 ms | 2869/4694/4694 ms | 0 |

`leftover=0` di setiap run. `migrate:status` jalan di transaction mode; migrasi hanya dijalankan di session mode. Latensi didominasi antrean 50 query di 10 koneksi dan RTT ~250–300 ms ke Eropa; ini bukan angka produksi.

### 7.6 Localization (M2-02)
Skrip `scripts/spike/m2-02-localization-checks.ts`, dua run penuh (217 s dan 232 s): keduanya exit 0, `SUMMARY pass=41 fail=0 observed=3`, 45 baris cek identik. Admin UI dicek dengan Playwright.

| # | Check | Aturan ADR | Metode | Hasil | Fakta teramati |
|---|---|---|---|---|---|
| 1 | Slug unik per locale | ADR-0004 "Slug unik per locale di level database"; ADR-0005 "Slug publikasi unik per locale" | Local API + REST; index DB | PASS (C1a, C1b, C1c, C1d-publish, C1e); C1d OBSERVED | Locale+slug sama di group lain ditolak index `locale_slug_idx` (pg 23505 → `ValidationError` 400 "locale, slug: Value must be unique"); slug sama di locale lain diterima; EN kedua di satu group ditolak. C1d: draft save dengan slug terpakai DITERIMA (hanya `_publications_v`), publish ditolak, slug publik tetap |
| 2 | Shared fields sama dalam group di setiap jalur simpan/terbit | ADR-0004 "Field bersama … ditegakkan di server pada setiap jalur simpan dan terbit" | Hook `beforeChange` `payload/hooks/enforce-shared-fields.ts`; Local API, REST, admin UI | PASS (C2a-local/rest, C2b, C2c-local/rest, C2d-local/rest, C2e-local/rest, C2f, C2f-rollback, C2g, C2h; C6b) | Ditolak pada create, update, draft save, publish (termasuk `?draft=true` + `_status: published` seperti admin), restore; urutan topics/authors dihitung; edit judul saja lolos. `updateSharedFields()` mengubah semua sibling dalam satu transaksi dan me-rollback saat sibling kedua gagal. REST tidak bisa mengatur `context`. Admin: Save Draft → 400 hanya toast generik; Publish → 400 + pesan hook di field |
| 3 | Tanpa kebocoran draft | ADR-0004 "satu record per bahasa" (status per bahasa); "Hreflang hanya … published" | REST + Local API anonim (`overrideAccess: false`) | PASS (C3a–C3e); C3d-draftparam OBSERVED | Record/judul draft-only tidak pernah kembali. `?draft=true` anonim pada dokumen published dengan draft lebih baru → 404 (by id) / 0 dokumen (list): tidak bocor, tetapi kode publik tidak boleh mengirim `draft=true` |
| 4 | Tanpa fallback konten | ADR-0004 "Tanpa fallback konten"; taksonomi/Author "fallback mati" | Local API + REST dengan `locale=en` | PARTIAL: C4a, C4b, C4d PASS; C4c OBSERVED | Topic tanpa nama EN → tanpa nama; group hanya-ID → 0 dokumen EN. Tetapi REST `?locale=en&fallback-locale=id` mengembalikan nama ID: klien mana pun bisa memaksa fallback pada field terlokalisasi (Topic, PublicationType, biografi Author). Publication tidak terdampak (tidak punya field terlokalisasi) |
| 5 | Hreflang hanya untuk pasangan published yang eligible | ADR-0004 required rule hreflang; ADR-0005 "hreflang hanya jika pasangan terjemahan eligible" | Helper `lib/publications/alternates.ts` (anonim, `_status = published`, group sama) | PASS (C5a–C5d), level helper | Pasangan published → dua path; EN published + ID draft → `{}`; slug sama di group lain diabaikan; setelah unpublish → `{}`. Route dan `<link rel=alternate>` belum ada (M3) |
| 6 | Restore versi per record dan tidak merusak shared fields | ADR-0004 status editorial per bahasa + shared fields | `restoreVersion` Local API | PASS (C6a, C6b) | Restore EN v1 hanya mengubah EN; restore yang melanggar shared fields ditolak karena `restoreVersion` menjalankan hook `beforeChange` di 3.93.0 |
| 7 | Field bernama `locale` vs parameter `locale` Payload | ADR-0004 (field bahasa record, DATA-MODEL §4.1); "Fallback UI string tidak sama dengan fallback konten" | Config, migrasi, REST, Local API, admin UI | PASS (C7a–C7d, teknis); C7-ui OBSERVED | Nama `locale` diterima (tidak di-rename). `?locale=en` tidak memfilter Publications; `where[locale][equals]=en` memfilter. Admin menampilkan dua kontrol "Locale" berbeda makna di layar edit Publication (lihat §8) |
| 8 | Konfigurasi FTS Indonesia (DEC-013) | DEC-013 | Composio read-only di CMS dan APP | PASS | `indonesian` ada di `pg_ts_config` (29 config) di kedua project; `to_tsvector('indonesian', 'Pembangunan berkelanjutan untuk Indonesia yang lebih adil')` = `'adil':7 'bangun':1 'indonesia':4 'kelanjut':2 'lebih':6 'untuk':3 'yang':5` (stemming jalan, stop word tetap); `pg_trgm` 1.6 dan `unaccent` 1.1 tersedia, belum di-install |

Sumber delapan pemeriksaan: brief task (workshop 2026-11-06), diverifikasi terhadap bagian "Decision"/"Required rules" ADR-0004 dan ADR-0005. Lihat §8 tentang spec 03 dan OG-09.

### 7.7 Pin Node.js (M2-04)
- `package.json` `"engines": { "node": "26.x" }`.
- Syarat yang dibaca: `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/storage-s3` 3.93.0 `node ^22.23.4 || >=24.22.1`; `@payloadcms/db-postgres` 3.93.0 tanpa field `engines`; Next 16.4.4 `node >=20.9.0`.
- Vercel: major tersedia 26.x (default), 24.x, 22.x; `engines.node` mengalahkan setting project ([Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)).
- Node lokal v26.4.0 memenuhi `26.x` dan rentang Payload, tetapi di bawah batas keamanan 26.12.1 dari [bulletin Vercel CVE-2026-111497](https://vercel.com/kb/bulletin/node-js-security-advisory).
- Bukti di Vercel (versi Node build dan function): tidak dijalankan (tidak ada preview untuk `spike/*`).

## 8. Failure modes and constraints
- **Bun tidak tercantum** sebagai package manager di dokumentasi Payload (pnpm/npm/yarn). Bun 1.3.14 me-resolve semua peer tanpa warning; 3 postinstall esbuild diblokir (tidak di-trust) dan tidak mengganggu `payload run`/`generate:*`.
- **cacheComponents:** dokumentasi Payload menyebut kompatibilitasnya "not guaranteed". Build lulus dan admin berfungsi, tetapi setiap request admin terautentikasi mencatat error `Route "/admin/[[...segments]]": Next.js encountered the unstable value new Date() while prerendering` (40× dalam satu sesi, dari `authenticate` Payload). Ini akan membanjiri log produksi. Opsi M3: biarkan dan filter, tunggu perbaikan Payload, atau `cacheComponents: false` (trade-off DEC-006).
- **TLS:** konfigurasi awal (URI tanpa `sslmode`, tanpa `pool.ssl`) tersambung **tanpa enkripsi**. Verifikasi dengan CA sistem gagal `SELF_SIGNED_CERT_IN_CHAIN`. Spike memakai `ssl: { rejectUnauthorized: false }` (ditandai SPIKE ONLY). Produksi wajib pin CA Supabase.
- **Migrasi:** `down()` hasil drizzle-kit gagal (DROP CONSTRAINT setelah CASCADE) dan harus direview sebelum commit; `down()` migrasi `media` juga belum dijaga dan belum dieksekusi. `migrate:reset` di 3.93.0 me-rollback migrasi **tertua dulu** (bug; laporkan ke upstream) → jangan pakai untuk multi-migrasi. Jangan pernah `migrate:fresh`.
- **Exit code:** di Windows + Node v26.4.0, `payload migrate` dan skrip kadang abort setelah sukses dengan assertion libuv (`src\win\async.c` line 94, exit 9). CI harus memeriksa `migrate:status`, bukan hanya exit code; uji ulang di Node ≥ 26.12.1 / Linux.
- **Nama compound index** tidak diberi prefix tabel (`locale_slug_idx`); koleksi kedua dengan field compound yang sama akan bentrok.
- **Draft save melewati validasi `required`.** Hook shared fields tidak membandingkan nilai yang kosong; sibling draft dengan field bersama kosong bisa berdampingan dengan sibling published sampai diisi.
- **Celah slug di draft (C1d):** slug duplikat baru terdeteksi saat publish; pesan error generik menyebut kolom DB (`locale, slug`), bukan label field.
- **Restore versi** menjalankan hook `beforeChange` (perilaku yang diinginkan, diverifikasi di 3.93.0; uji ulang saat upgrade). Backup/restore database tidak diuji.
- **Deadlock shared fields:** dengan hook aktif, mengubah field bersama satu per satu selalu ditolak. Perubahan harus lewat `updateSharedFields()` (server-only, satu transaksi, `context.sharedFieldSync`). Perilaku pada sibling yang versi terakhirnya draft di atas versi published belum diuji (desain M3).
- **Dua kontrol "Locale" di admin:** header admin menampilkan pemilih "Locale" pada layar edit Publication walaupun tidak ada field Publication yang dilokalisasi; memilih English mengubah label relasi ke nama EN, sedangkan field `locale` record tetap "Bahasa Indonesia". Opsi M3: ganti label field (mis. "Bahasa publikasi") atau sembunyikan localizer pada Publications.
- **Parameter `fallback-locale`:** REST publik bisa memaksa fallback pada koleksi terlokalisasi (C4c). Kode publik tidak boleh mengirim `fallbackLocale`; perlu keputusan M3 apakah REST publik untuk topics/publication-types/authors dibatasi.
- **Data API Supabase:** default ACL memberi `anon`/`authenticated` hak pada semua tabel `public`; keamanan bergantung pada RLS di setiap migrasi. Opsi hardening M3: `REVOKE` + `ALTER DEFAULT PRIVILEGES`, atau matikan Data API di `mahira-cms`.
- **Sumber spec tidak ada:** `.kiro/specs/03-architecture-technical-validation/` (dirujuk DECISIONS, ADR-0004, ADR-0005 sebagai sumber "Spike A" dan "design Revision 3 §22") tidak ada di repo maupun checkout utama. OG-09 (apakah delapan pemeriksaan adalah pemeriksaan resmi Spike A) belum dikonfirmasi Owner.
- **ADR-0002:** teks "Proposed decision" menyebut satu Supabase Postgres, sedangkan catatan Owner memilih Opsi 3 (database terpisah) dan lingkungan spike memakai dua project. Teks ADR tidak diubah oleh spike.
- **Worktree:** `tsconfig.json` (`**/*.ts`) dan ESLint di checkout utama tidak mengabaikan `.worktrees/`; selama worktree ini ada, lint/build di checkout utama dapat ikut membaca file worktree.
- **Kredensial spike:** password admin spike sempat tampil di output tool Playwright MCP (tidak di repo, docs, atau evidence). Rotasi atau hapus user admin spike saat spike ditutup.
- **Region:** kedua project spike di Eropa; latensi di §7.5 tidak mewakili produksi (DEC-017/DEC-020).
- **Biaya waktu:** CLI Payload ~13–16 s start-up; seed 38–60 s; skrip localization 217–232 s (panggilan berurutan ke pooler Eropa).

## 9. Decision recommendation
Rekomendasi saja; status keputusan tidak diubah. Tabel lengkap dan tindakan Owner ada di `decisions/DECISIONS.md` §2.3.

| DEC | Rekomendasi |
|---|---|
| DEC-004 | Tetap Accepted. Bukti validasi: check 1–3, 5–7 PASS, check 4 PARTIAL (C4c). Tindak lanjut M3: larang `fallbackLocale` di kode publik dan putuskan pembatasan REST publik. |
| DEC-005 | Tetap Accepted. Slug unik per locale terbukti di DB; aturan route (308, 404, trailing slash, `/id`/`/en`) belum diuji, diuji di M3-01/M3-07. |
| DEC-006 | Proposed → siap Accepted bila Owner setuju: Payload 3.93.0 embedded di Next.js 16.4.4 jalan (build, admin, REST, Local API, restart). Owner perlu memilih penanganan cacheComponents (§8). |
| DEC-007 | Open → usulan arah: project CMS terpisah, skema `public` CMS hanya lewat migrasi Payload yang di-commit (`push: false`), RLS di setiap `up()`, `down()` direview, CI cek `migrate:status`. Siap diputuskan bila Owner setuju dan teks ADR-0002 diselaraskan. |
| DEC-013 | Proposed → siap Accepted untuk arah "mulai dengan PostgreSQL FTS" bila Owner setuju; relevansi (stop word tetap) diuji dengan konten di M3-06. |
| DEC-018 | Tetap Accepted. Usulan pin `engines.node` `26.x`; bukti di Vercel menunggu cara deploy proof (DECISIONS §2.3 poin a). |

## 10. Follow-up
| Tindak lanjut | Owner | Milestone |
|---|---|---|
| Putuskan DEC-006, DEC-007, DEC-013 berdasarkan §2.3; selaraskan teks ADR-0002 | Haidar (PO) | M2-05 |
| Pilih cara memperoleh bukti deploy (preview untuk branch spike atau branch lain) dan region produksi | Haidar (PO) | M2-04 (DEC-017, DEC-020) |
| Konfirmasi OG-09 dan nasib rujukan `.kiro/specs/03-…` | Haidar (PO) | M2-05 |
| Pin CA Supabase untuk koneksi DB; hardening grant/Data API CMS | Engineering | M3-02 |
| Review `down()` migrasi; CI memeriksa `migrate:status`; jangan pakai `migrate:reset`/`migrate:fresh` | Engineering | M3-02, M3-10 |
| Penanganan cacheComponents di admin | Engineering | M3 (setelah DEC-006) |
| Label field `locale` / localizer admin; pesan error slug dan shared fields untuk editor | Engineering | M3-02, M3-03 |
| Larang `fallbackLocale`/`draft=true` di kode publik; putuskan akses REST publik koleksi terlokalisasi | Engineering | M3-01, M3-05 |
| Route locale, canonical, hreflang di halaman | Engineering | M3-01, M3-07 |
| Upgrade Node lokal ke ≥ 26.12.1; uji ulang exit code libuv | Engineering | M3-10 |
| Rotasi/hapus user admin spike dan fixture `[FIXTURE]` di `mahira-cms` saat spike ditutup | Engineering | M2-05 |
| Ulangi spike bila Payload, Next.js, adapter, atau provider/region berubah | Engineering | — |
