# Environments & Operations Specification

**ID:** ENG-ENV-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Environments

| Environment | Purpose | App deployment | Supabase | Data policy |
|---|---|---|---|---|
| Local development | Daily coding and integration | Local Next.js/Node process | Dedicated dev project or isolated local stack | Synthetic fixtures only. |
| Preview / staging | QA, editor trial, regression, release candidate | Protected preview/staging deployment | Separate staging project | Realistic synthetic or sanitized data. |
| Production | Public organization service | Production deployment | Production project | Real user/content data under approved policy. |

Do not point preview deployments at production database by default. A preview branch may need a shared staging project, but concurrent migrations and test data collisions must be controlled.

## 2. Configuration principles

- Environment-specific values are configured in deployment provider and local ignored env files.
- `.env.example` contains names and safe placeholders only, never real credentials.
- No service-role, database password, Payload secret, SMTP credential, webhook secret, or storage credential is committed.
- Public variables are only those intentionally exposed to browser and must be named accordingly.
- Validate required environment variables at startup/build with typed configuration; fail fast with safe diagnostics.
- Keep secrets in a password manager/managed secret store with limited access and rotation procedure.

## 3. Environment variable inventory (names are illustrative until code/library versions are pinned)

| Variable | Server/client | Used by | Environments | Secret? |
|---|---|---|---|---|
| `DATABASE_URL` | Server | Payload/runtime DB | All | Yes |
| `DATABASE_URL_DIRECT` | Server/CLI | Migrations where required | All | Yes |
| `PAYLOAD_SECRET` | Server | Payload | All | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase client | All | No, project endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key naming for pinned version) | Client + server | Supabase public client | All | Public key; constrained by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` (or secret key naming for pinned version) | Server only | Privileged operations only | All | Yes, highly privileged. |
| `SUPABASE_STORAGE_BUCKET_PUBLIC` | Server config | Public asset bucket | All | No |
| `SUPABASE_STORAGE_BUCKET_PRIVATE` | Server config | Private assets | All | No |
| `EMAIL_PROVIDER_API_KEY` / SMTP variables | Server | Transactional email | Staging/prod | Yes |
| `SENTRY_DSN` | Client/server depending integration | Monitoring | All | Treat public DSN as intended provider config; verify exposure policy. |
| `SENTRY_AUTH_TOKEN` | CI only | Source map upload | CI | Yes |
| `REVALIDATE_SECRET` | Server | Protected cache revalidation | If used | Yes |
| `PAYMENT_WEBHOOK_SECRET` | Server | Phase 2 webhook verification | Phase 2 only | Yes |

The exact variable names must follow pinned SDK versions. Never expose database URLs or server secrets with `NEXT_PUBLIC_` prefix.

### 3.1 Variabel yang dipakai kode saat ini (M3-00, 2026-11-10)

Tabel §3 di atas tetap ilustratif. Tabel ini mencatat variabel yang benar-benar dibaca kode (`payload/env.ts`), sesuai keputusan Owner 2026-11-10 (Opsi A, lihat MILESTONES M3-00).

| Variable | Server-only / secret | Vercel Preview | Vercel Production | Lokal |
|---|---|---|---|---|
| `PAYLOAD_SECRET` | Server-only; secret | Ya (nilai khusus Preview) | Tidak | Opsional (semua atau tidak sama sekali) |
| `CMS_SUPABASE_DATABASE_URI` | Server-only; secret (berisi password DB `mahira-cms`) | Ya | Tidak | Opsional (semua atau tidak sama sekali) |
| `APP_SUPABASE_URL` | Server-only; bukan secret (endpoint project `mahira.id`) | Ya | Tidak | Opsional (semua atau tidak sama sekali) |
| `APP_SUPABASE_S3_ACCESS_KEY_ID` | Server-only; secret (melewati Storage RLS) | Ya (key khusus Preview) | Tidak | Opsional (semua atau tidak sama sekali) |
| `APP_SUPABASE_S3_SECRET_ACCESS_KEY` | Server-only; secret (melewati Storage RLS) | Ya (key khusus Preview) | Tidak | Opsional (semua atau tidak sama sekali) |

Aturan set:
- Kelima variabel terisi: CMS (Payload `/admin`, `/api/*`) hidup.
- Kelimanya kosong: CMS mati. Build tetap lulus.
- Hanya sebagian terisi: build dan start gagal; pesan error menyebut nama variabel yang hilang, tidak pernah nilainya.
- `VERCEL_ENV=production`: CMS selalu mati, apa pun yang di-set. Menghidupkan CMS di Production memerlukan PR yang di-review (M4).

Saat CMS mati, `proxy.ts` menjawab 404 (`X-Robots-Tag: noindex`, `Cache-Control: no-store`) untuk `/admin` dan `/api/*`, dan sejak M3-01 juga untuk halaman publik berbasis CMS `/id/publications` dan `/en/publications` (Production tidak menampilkan halaman publikasi sampai M4). Homepage `/` tetap 200 dengan blok statis dan catatan "Belum ada publikasi yang terbit" di blok Publikasi, tanpa konten sampel (M3-04, DECISIONS §2.7 P1 A). Config Payload juga mendapat secret kosong, sehingga `payload.init` gagal sebelum koneksi DB walaupun proxy terlewati. Proxy ini gerbang, bukan otorisasi; saat CMS hidup, access control Payload tetap berlaku.

TLS ke database: CA Supabase Root 2021 di-pin di `payload/db/supabase-root-ca.ts` (sertifikat publik, bukan secret). Tidak ada variabel `CMS_SUPABASE_DB_CA_CERT`. `CMS_SUPABASE_DATABASE_URI` tidak boleh berisi parameter `sslmode`, karena `pg` akan mengganti objek `ssl` yang memuat CA tersebut.

Key lain di `.env.local` (`CMS_SUPABASE_URL`, `*_PUBLISHABLE_KEY`, `*_SECRET_KEY`, `APP_SUPABASE_SERVICE_ROLE_KEY`, `OPENALEX_API_KEY`) tidak dipakai kode dan tidak di-set di Vercel.

Sejak M3-02, saat CMS hidup (Preview, lokal), REST anonim ditolak (403) di semua koleksi dan GraphQL tetap mati; halaman publik membaca lewat Local API di server (DECISIONS §2.4 P1).

Urutan inisialisasi Payload (ada sebelum M3-04; diperbaiki di branch `fix/payload-single-instance`, commit `140d7ee`): `withPayload` 3.93.0 meng-externalize `payload` hanya di dev, sehingga build produksi memuat dua salinan `payload` (layer halaman RSC/SSR dan layer route REST/admin), sedangkan `getPayload` menyimpan satu instance global per proses. Bila halaman publik (sejak M3-04 juga `/`) atau `/admin` yang pertama membuat instance setelah cold start, ValidationError REST kehilangan rincian field (`errors[0].data`), sehingga admin UI hanya menampilkan "The following field is invalid: …". Sejak perbaikan, `next.config.ts` memuat `serverExternalPackages: ["payload"]` (disetujui Owner 2026-11-12): semua layer memakai satu salinan `payload` dari `node_modules`. Paket `@payloadcms/*` tidak perlu ikut karena kelas galatnya diimpor dari `payload`; `graphql`, `pg`, `pino`, dan `drizzle-kit` sudah external lewat `withPayload` atau daftar bawaan Next. File trace (`.nft.json`) halaman `/`, route `/api/[...slug]`, dan halaman admin memuat file `node_modules/payload`, jadi bundle function Vercel tetap lengkap (dicek lokal; Preview belum dicek). Regresi dijaga HP8 (`GET /` lebih dulu) dan HP9 (`GET /admin` lebih dulu) di `tests/integration/homepage.test.ts` (TEST-PLAN §12.5). Sesudah merge PR #13 (`8540424`, 2026-11-12), Owner melaporkan dari Preview bahwa aktivasi Topic "[FIXTURE] Topik Hanya ID" ditolak dengan pesan yang sesuai; reload `/admin` sesudahnya gagal karena koneksi database (subbagian berikut).

#### Koneksi database Payload dan langkah Owner butir 1b (jawaban Owner 2026-11-12, DECISIONS §2.9)

Masalah di Preview 2026-11-12: reload `/admin` gagal dengan "This page couldn't load" (digest 498284311). Session pooler `mahira-cms` penuh (`EMAXCONNSESSION`), connect di `payload.init` ditolak, dan rejection tanpa handler membuat Vercel menghentikan instance (exit 128). Rincian penyebab dan bukti: CHANGELOG [M3-04] (Fixed), MILESTONES M3-04.

**Batas koneksi.**

| Komponen | Batas | Catatan |
|---|---|---|
| Pool `pg` Payload per proses (`payload/payload.config.ts`, sejak commit `311683f`) | `max: 5`; klien idle ditutup sesudah 5 detik (`idleTimeoutMillis: 5000`); request yang menunggu klien lebih dari 10 detik gagal (`connectionTimeoutMillis: 10000`) | Jawaban 2 A. Payload memegang 1 klien terus sesudah connect, jadi 4 klien untuk query. Sebelumnya default `pg-pool`: 10 klien, idle 10 detik, menunggu tanpa batas. Berlaku di semua lingkungan, termasuk tes lokal |
| Function Vercel yang memakai DB (Preview) | 2 function: `/`, `/[locale]/publications`, dan `/admin` di satu function; `/api/[...slug]` di function kedua. Function ketiga (proxy) tidak memakai DB | Setiap instance punya pool sendiri (maksimal 5 klien). Jumlah function sama sebelum dan sesudah PR #13 |
| Session pooler Supavisor `mahira-cms`, port 5432 | `pool_size` 15 klien sekaligus; klien berikutnya ditolak `EMAXCONNSESSION`. Koneksi server masih ditahan beberapa menit sesudah klien pergi (insiden 2026-11-12: ±10–18 menit) | Pool Size tetap 15 (jawaban 5 B); `max_connections` Postgres 60 |
| Transaction pooler Supavisor `mahira-cms`, port 6543 | Sampai 200 klien (Nano/Micro); koneksi server dipakai bergantian per transaksi | Probe 2026-11-12: 20/20 klien paralel berhasil, dilayani 3 koneksi server, saat port 5432 menolak klien |

**Mode pooler per lingkungan.**

- **Vercel Preview: transaction pooler, port 6543** (jawaban 1 A). Owner mengganti port di `CMS_SUPABASE_DATABASE_URI` Preview; host, user, password, dan nama DB tetap. Hanya build Preview yang dibuat sesudah perubahan itu memakainya. Runtime Payload 3.93.0 cocok dengan transaction mode: tanpa named prepared statement, tanpa `SET`, `LISTEN`, atau advisory lock sesi; row lock Translation Group (`SELECT … FOR UPDATE`) berjalan di dalam satu transaksi. Kecocokan ini dibaca dari kode dan dari smoke test SPIKE-001 §7.5 (50 `find` paralel + 10 create/delete paralel di port 6543, 0 error); admin di port 6543 belum diuji di Preview (langkah Owner di bawah).
- **Lokal (`.env.local`) dan `bun run test:integration`: session pooler, port 5432.** Migrasi Payload dan `SET idle_in_transaction_session_timeout` di `tests/helpers/payload.ts` memerlukan session mode, jadi keduanya tidak dijalankan lewat port 6543. Sebelum run integrasi, cek `pg_stat_activity` (read-only) dan tunggu slot session pooler kosong (TEST-PLAN §12.3).
- **Production: belum diputuskan.** CMS mati di Production, jadi batas pool dan wrapper init tidak aktif di sana. Pooler, pool, dan `attachDatabasePool` (`@vercel/functions`) untuk Production diputuskan saat CMS dinyalakan di M4 (jawaban 4 B, 7 A).

**Saat connect DB gagal** (jawaban 3 A). Wrapper `handleInitFailure` di config menangani promise internal `initializing` adapter. Hanya request itu yang gagal: REST menjawab 500 `{"message":"There was an error initializing Payload"}`, dan `/` tetap 200 dengan "Publikasi belum dapat dimuat". Proses tetap hidup, dan request berikutnya mencoba init lagi. Log koneksi adapter tetap dapat memuat host/user pooler (TEST-PLAN §12.5).

**Langkah Owner (cek Preview tertunda):**

1. *(Sudah dikerjakan Owner 2026-11-12; nilainya tidak dibaca agen, jadi belum diverifikasi agen.)* Vercel → project `mahira-foundation` → **Settings → Environment Variables** → `CMS_SUPABASE_DATABASE_URI`, environment **Preview**: `:5432/` diganti `:6543/`. Jangan menempel nilainya ke chat atau dokumen.
2. Sesudah orchestrator mem-push branch `fix/db-connection-limits`: Vercel → **Deployments** → pilih deployment Preview branch itu (dibuat sesudah langkah 1), tunggu status **Ready**, lalu buka URL-nya. Deployment Preview lama masih memakai port 5432 dan kode lama. Jangan memakai **Redeploy** pada deployment lama untuk cek ini: redeploy 2026-11-12 sekitar 20:40 UTC masuk ke Production.
3. Buka `/admin` dan login sebagai staf.
4. Buka Topic "[FIXTURE] Topik Hanya ID", aktifkan (`isActive`), lalu simpan. Hasil yang diharapkan: simpan ditolak dengan pesan validasi, karena Topic aktif wajib punya nama ID dan EN (M3-02).
5. Reload `/admin` tiga kali. Hasil yang diharapkan: admin tampil setiap kali, tanpa "This page couldn't load".
6. Bila langkah 4 atau 5 gagal: Vercel → **Logs**, Environment `preview`, rentang waktu cek. Cari `EMAXCONNSESSION`, `unhandledRejection`, `exited with exit status`, dan `cannot connect to Postgres`, lalu kirim waktu dan baris log (tanpa nilai env) ke orchestrator. Opsional: Supabase `mahira-cms` → **Observability** → "Shared Pooler (Supavisor) Client Connections" pada rentang yang sama.

#### Langkah Owner dari jawaban 2026-11-10 (M3-02)

**P7 C — matikan Data API di `mahira-cms`.** Payload tidak memakai Data API; ia tersambung langsung ke Postgres lewat pooler. Project APP `mahira.id` jangan diubah (Storage dipakai Media).

1. Buka dashboard Supabase project `mahira-cms` (ref `qnfzzymrceoubowfknvl`): `https://supabase.com/dashboard/project/qnfzzymrceoubowfknvl/integrations/data_api/settings` (menu **Integrations → Data API → Settings**; di dashboard lama **Project Settings → Data API**).
2. Matikan toggle **Enable Data API**, lalu simpan.
3. Bila toggle itu tidak ada: hapus `public` dari **Exposed schemas**, matikan **Automatically expose new tables**, lalu simpan.
4. Verifikasi di PowerShell dengan `CMS_SUPABASE_URL` dan publishable key `mahira-cms` dari `.env.local` (isi `$env:CMS_SUPABASE_URL` dan `$env:CMS_SUPABASE_PUBLISHABLE_KEY` di sesi itu saja; jangan tempel key ke chat atau dokumen):
   `curl.exe -s -o NUL -w "%{http_code}" -H "apikey: $env:CMS_SUPABASE_PUBLISHABLE_KEY" "$env:CMS_SUPABASE_URL/rest/v1/users?select=id"`
   Hasil yang diharapkan: bukan `200` (sebelumnya `200` dengan `rows=0`, SPIKE-001 §7.3).
5. Buka `/admin` di Vercel Preview dan pastikan login tetap berhasil.

Sampai langkah ini dilakukan, RLS (tanpa policy) adalah satu-satunya penjaga tabel `mahira-cms` dari publishable key. Sumber: [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api), [Supabase — Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

**P2 A — log `cacheComponents` di Vercel.** Pesan `Route "/admin/[[...segments]]": Next.js encountered the unstable value new Date() while prerendering` muncul berlevel error pada route `/admin/[[...segments]]`, hanya di Preview dan lokal (CMS mati di Production). Di Vercel → project → **Logs**: pilih Environment `preview`, lalu pada filter **Route** pilih route selain `/admin/[[...segments]]` saat mencari error lain. Ditinjau ulang saat upgrade Payload/Next. Sumber: [Vercel — Runtime Logs](https://vercel.com/docs/logs/runtime).

#### Pemicu review saat upgrade Payload (DEC-006)

`payload` dan semua `@payloadcms/*` di-pin exact `3.93.0`; upgrade hanya lewat PR yang mengubah pin itu. PR tersebut wajib meninjau:

- **Row lock Translation Group (DEC-004).** `payload/db/lock-translation-group.ts` mengambil koneksi transaksi dari struktur internal `@payloadcms/drizzle`, `adapter.sessions[transactionID].db` (`getTransaction` tidak diekspor). Bila struktur itu berubah, helper gagal tertutup: setiap simpan Publication dan setiap hapus Translation Group gagal, alih-alih balapan. Tes race `tests/integration/race.test.ts` (R1–R3) wajib dijalankan ulang dan lulus pada setiap upgrade Payload, lewat `bun run test:integration` atau langsung `node --import tsx --test tests/integration/race.test.ts` (tanpa server). Lihat TEST-PLAN §12.7.
- **Workflow editorial M3-03 (DECISIONS §2.6 P4, P5).** Hook P5 (`payload/hooks/refuse-implicit-status-over-pending-draft.ts`) dan field virtual `liveOnSite` (`payload/hooks/live-on-site.ts`) bergantung pada perilaku Payload 3.93.0 berikut: (1) update non-draft memakai versi terbaru (draft) sebagai dasar simpan (`getLatestCollectionVersion`); (2) field `beforeValidate` mengisi setiap field yang tidak dikirim, termasuk `_status`, dari dokumen tersimpan sebelum hook `beforeChange` koleksi jalan, sehingga niat klien dibaca di `beforeOperation` (`markStatusNotSent`); (3) tombol Unpublish admin mengirim `PATCH …?unpublishAllLocales=true` dengan `_status: draft` dan menimpa versi terakhir; (4) hook `afterRead` field jalan sebelum read access field dan berjalan bersamaan untuk semua dokumen satu daftar; (5) daftar admin menampilkan "Changed" untuk draft yang punya versi published lebih lama (dibaca dari kode, belum diuji di browser). Pada setiap upgrade Payload, jalankan ulang `bun run test:integration --only race,workflow` sampai lulus (TEST-PLAN §12.7).
- **Log `cacheComponents` di admin** (P2 A di atas).
- **`serverExternalPackages: ["payload"]` di `next.config.ts`.** Periksa ulang `withPayload` versi baru (`node_modules/@payloadcms/next/dist/withPayload/withPayload.js`): apakah `payload` kini di-externalize juga di build, dan apakah paket lain perlu didaftarkan. Jalankan ulang `bun run test:integration --only homepage` sampai HP8/HP9 lulus, dan cek `.nft.json` route masih memuat `node_modules/payload`.
- **Wrapper `db.init` di `payload/payload.config.ts` (butir 1b, DECISIONS §2.9 jawaban 3 A).** `handleInitFailure` menangani promise internal `initializing` milik `@payloadcms/db-postgres` 3.93.0 (dibuat di `dist/index.js`, ditolak di `dist/connect.js` saat connect gagal; tanpa handler, Vercel menghentikan instance). Periksa bahwa field itu masih ada dan masih ditolak saat connect gagal, lalu jalankan `bun run test` sampai DB1/DB2 di `tests/unit/db-connection.test.ts` lulus (TEST-PLAN §12.7).

## 4. Database and storage separation

- Separate Supabase projects are recommended for development, staging, and production.
- Establish which migrations run in which environment and who approves production execution.
- Storage buckets, policies, retention and object lifecycle must be created by repeatable scripts/migrations where supported.
- Never copy production private documents into local fixtures unless explicitly sanitized/approved.
- Keep local seed content legally distributable and clearly marked as fixtures.

## 5. Deployment pipeline

Proposed flow:
1. Developer creates focused branch.
2. Local checks: formatting/lint, typecheck, unit tests, build.
3. Pull request triggers CI and preview deployment.
4. Schema/migration review and automated checks run before staging apply.
5. Staging verification: migration, smoke, E2E, editor workflow, access matrix.
6. Product/technical approval promotes same commit to production.
7. Post-deploy smoke tests and monitoring review.

Do not run potentially destructive production migrations automatically on every preview deployment. Define a single migration authority and lock/serialization policy.

## 6. Domain and DNS

Hostinger is the current domain provider per project context. Hosting destination is proposed, not yet accepted. Record domain owner, registrar account ownership, DNS records, TTL, verification records, email DNS (SPF/DKIM/DMARC), certificate behavior, renewal date, and recovery contact in a restricted operational inventory. Do not store account passwords in documentation.

## 7. Backups, restore, and continuity

Define and approve:
- RPO (maximum acceptable data loss) and RTO (maximum acceptable recovery time).
- Database backup frequency and retention by service plan.
- Storage object backup/versioning strategy; database backup alone is not enough.
- Payload media metadata and object relationship consistency.
- Restore runbook into isolated environment.
- Credentials and DNS recovery steps.
- Periodic restore drill and evidence.

At least one staging restore test is required before production launch. Exact cadence is TBD based on risk and provider capability.

## 8. Monitoring and incident handling

Track application availability, server errors, DB connectivity, slow queries, storage errors, failed uploads/downloads, auth failures, suspicious authorization denies, and (future) webhook processing failures. Alerts should have an owner and actionable runbook. Avoid alerting on every benign denied request.

Incident runbook includes: detect, triage, contain, preserve evidence, communicate, recover, post-incident review, and follow-up tasks. Security incidents involving personal data require legal/privacy response process.

## 9. Operational acceptance

- Environment secrets are isolated and not committed.
- Staging cannot access production private storage by default.
- Migrations are reproducible and reviewed.
- Backup restore is demonstrated.
- DNS and email authentication records are verified.
- Monitoring captures actionable failures without sensitive payloads.
