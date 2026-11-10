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

Saat CMS mati, `proxy.ts` menjawab 404 (`X-Robots-Tag: noindex`, `Cache-Control: no-store`) untuk `/admin` dan `/api/*`, dan sejak M3-01 juga untuk halaman publik berbasis CMS `/id/publications` dan `/en/publications` (Production tidak menampilkan halaman publikasi sampai M4). Config Payload juga mendapat secret kosong, sehingga `payload.init` gagal sebelum koneksi DB walaupun proxy terlewati. Proxy ini gerbang, bukan otorisasi; saat CMS hidup, access control Payload tetap berlaku.

TLS ke database: CA Supabase Root 2021 di-pin di `payload/db/supabase-root-ca.ts` (sertifikat publik, bukan secret). Tidak ada variabel `CMS_SUPABASE_DB_CA_CERT`. `CMS_SUPABASE_DATABASE_URI` tidak boleh berisi parameter `sslmode`, karena `pg` akan mengganti objek `ssl` yang memuat CA tersebut.

Key lain di `.env.local` (`CMS_SUPABASE_URL`, `*_PUBLISHABLE_KEY`, `*_SECRET_KEY`, `APP_SUPABASE_SERVICE_ROLE_KEY`, `OPENALEX_API_KEY`) tidak dipakai kode dan tidak di-set di Vercel.

Sejak M3-02, saat CMS hidup (Preview, lokal), REST anonim ditolak (403) di semua koleksi dan GraphQL tetap mati; halaman publik membaca lewat Local API di server (DECISIONS §2.4 P1).

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
