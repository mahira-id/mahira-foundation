# SPIKE-002 — Public and Staff Authentication Boundaries
**Status:** Selesai (M5-01; lokal 2026-11-20, domain Preview 2026-11-24, cek Owner A–K lulus; DEC-008 dan ADR-0003 Accepted 2026-11-24) · **Decision links:** DEC-008, DEC-009, DEC-016 · **ADR:** 0003 · **Owner:** Haidar (Product Owner)
## Question
Can Supabase Auth for public users and Payload Auth for staff coexist in one Next.js application with distinct cookies/sessions, route guards, and server-side authorization, without accidental privilege crossover?
## Hypothesis
The two identity domains can remain separate if their session verification, roles, database access, and route protection are explicit. No public signup flow can create or elevate a Payload staff user.
## Scope
- One public user role with registration/login/logout flow in non-production.
- One Payload staff Admin and one Editor test account.
- Public account route and staff admin route.
- One server operation for each domain.
- Negative tests for cross-access and forged role metadata.
## Exit criteria
- Public user cannot authenticate to Payload admin.
- Public signup/profile metadata cannot create or modify staff role.
- Staff Payload session is not treated as Supabase public user entitlement.
- Each sensitive operation verifies its own expected identity provider server-side.
- Session expiry/logout/invalid cookie behavior is safe.
- Route/layout guard does not become the sole protection for data operations.
- No privileged key or cookie leaks to client code/logs.
## Evidence
Record cookie names/scopes/paths, auth helper versions, route tests, negative tests, behavior across preview domain, and framework integration details. Do not copy actual credentials or session cookie values into the report.
## Hasil M5-01 (2026-11-20)
Dikerjakan di branch fitur `feat/m5-01-02-auth` (DECISIONS §2.18 keputusan 1), basis `origin/master` `2bd114f`; kode di commit `3bfe97e` (inti auth, gerbang env, `proxy.ts`), `e1db8c3` (halaman akun), `b71a397` (perbaikan tes About). Node v26.13.0, Windows. Semua ID tes ada di TEST-PLAN §12.2. Tidak ada nilai kredensial atau cookie di dokumen ini.
### Versi helper dan integrasi
- `@supabase/ssr` 0.12.7 dan `@supabase/supabase-js` 2.119.2, dipin exact, hanya di `lib/auth/` dan helper tes. Tanpa client Supabase di browser dan tanpa `NEXT_PUBLIC_*`. `payload` dan `@payloadcms/*` tetap 3.93.0.
- Form HTML biasa (`<form method="post">`) ke route handler `/{locale}/auth/*`, bukan Server Action. Setiap langkah adalah POST dokumen penuh, 303, lalu GET. Tidak ada `redirect()` saat render, jadi cache router browser tidak menyimpan redirect auth dan loop §2.10 tidak dapat terulang lewat jalur ini.
- `proxy.ts`: cabang akun sebelum gerbang CMS. `GET /{locale}/account` memakai `getClaims()` (verifikasi JWT lokal) untuk gerbang kasar dan refresh sesi; tanpa cookie sesi atau klaim tidak valid → 307 ke `/{locale}/login`. Cabang pra-cek admin (`payload-token`, 307 ke `/admin/login`) tidak berubah secara logika; matcher 8 → 20 entri.
- Gerbang env `lib/auth/env.ts`: tanpa `APP_SUPABASE_PUBLISHABLE_KEY` atau `VERCEL_ENV=production` → akun mati dan route akun 404 (juga POST, juga saat CMS hidup); kunci tanpa `APP_SUPABASE_URL` → build gagal dan hanya menyebut nama `APP_SUPABASE_URL`.
### Cookie (probe 2026-11-20, tanpa nilai)
| Cookie | Scope | Atribut |
|---|---|---|
| `sb-dmtbieetvgkvncadbkmd-auth-token` (dipecah `.0`, `.1` bila besar) | host-only (tanpa `Domain`), `Path=/` | `HttpOnly`, `SameSite=Lax`, `Max-Age`, `Secure` hanya di https |
| `payload-token` (staf) | host-only, `Path=/` | diatur Payload; tidak dibaca oleh kode akun |
- Login password tidak menulis cookie lain selain cookie sesi di atas (probe AU2). Alur email memakai tautan `token_hash` ke `/{locale}/auth/confirm`.
- Access token ditandatangani asimetris (ES256), sehingga `getClaims()` memverifikasi lokal. Penurunan teknis: cookie lama setelah logout masih lolos pemeriksaan lokal di `proxy.ts`, tetapi handler dan halaman akun memakai `getUser()` ke server Auth dan menjawab `session-ended`.
- Temuan: sesi dari tautan pemulihan dan tautan pendaftaran punya `amr` `otp`, sesi login password punya `password`. Reset password hanya menerima `otp` atau `recovery` yang tidak lebih tua dari 3600 detik, jadi sesi password biasa tidak dapat melewati password lama.
### Bukti per kriteria keluar
| # | Kriteria | Bukti (ID tes) | Hasil |
|---|---|---|---|
| EC1 | Pengguna publik tidak dapat masuk ke Payload admin | `auth-boundary` AB1: kredensial publik ke `/api/users/login` tanpa token; cookie sesi, `Bearer`, `JWT`, dan `payload-token` berisi access token publik: `/admin` 307, `/api/users/me` `user: null`, `/api/publications` 403 | Lulus (lokal) |
| EC2 | Signup/metadata tidak membuat atau mengubah role staf | AB2: `user_metadata` `{role:"admin"}` tidak mengubah role JWT (`authenticated`) dan tidak memberi akses Payload; PATCH role editor dengan bearer publik 403, role tidak berubah; jumlah user Payload sama, tidak ada user Payload dengan email itu. Unit AUU3 (+ break B7): `signUp` tidak pernah menerima `options.data` | Lulus |
| EC3 | Sesi staf bukan identitas publik | AB3: hanya `payload-token` editor → `/id/account` 307 ke login; change-password `session-ended`. `account-pages` AP4: dua cookie sekaligus → hanya email publik yang tampil | Lulus |
| EC4 | Tiap operasi sensitif memeriksa penyedia identitasnya sendiri | AB4: kedua cookie → `/admin` 200 oleh Payload, halaman publik 200 tanpa `Set-Cookie` `sb-`; AUU7 (+ break B4): change-password memakai email dari `getUser()`; AUU5 (+ break B3) dan AU8: reset memakai klaim terverifikasi dengan `amr` tautan email | Lulus |
| EC5 | Expiry, logout, cookie rusak aman | AU5 (logout 303 `signed-out`, cookie dihapus, cookie lama → `session-ended`); AU6 (cookie sampah, token rusak, refresh valid dirotasi: 307 atau cookie baru, tidak pernah 5xx); AP3 | Lulus |
| EC6 | Guard route bukan satu-satunya perlindungan | Handler dan halaman memeriksa sendiri (`getUser()`, `isAuthEnabled()` + `notFound()`); AU5, AU8, AP3 (proxy meloloskan cookie lama, handler menolak) | Lulus |
| EC7 | Tidak ada key atau cookie bocor | ASU1 (`@supabase/` hanya di `lib/auth/` dan helper tes; `APP_SUPABASE_SECRET_KEY`, `SERVICE_ROLE`, `NEXT_PUBLIC_` tidak ada di `app/`, `components/`, `lib/`, `payload/`, `proxy.ts`); AP6 (tidak ada token atau key di HTML); secret-scan `.next/static` dan `.next/server` bersih (1213 berkas); log hanya `code` atau `name` galat; cookie `HttpOnly` | Lulus |
Pertahanan tambahan yang diuji: setiap POST wajib `Origin` yang sama dengan host (`x-forwarded-host` bila ada), selain itu 403 tanpa cookie (AU1, break B1 → AUU1, AUU12, AU1); tujuan redirect hanya dari daftar tertutup, `?next=` diabaikan (AU7); `?status=` di luar daftar tidak ditampilkan (AP5); galat login generik dan email belum terverifikasi memakai status yang sama dengan password salah (AU3, break B6).
### Bukti rusak-sengaja
Unit B1–B8 dan matriks (B2 pada mode `authoff` → tepat G11.1–G11.9) dan integrasi (B1 → AU1, B3 → AU8, B6 → AU3), semuanya dikembalikan dengan SHA-256 identik; BB1 pada UI (APU3). Rincian ada di CHANGELOG [M5-01] dan `breaks.md` di folder tugas (tidak dilacak git).
### Perilaku di domain Preview
Diukur oleh Owner di Vercel Preview PR #27 (branch `feat/m5-01-02-auth`, head `de0e68e`), laporan Owner 2026-11-24: langkah Supabase/Vercel A–E diterapkan dan cek Preview A–K semua lulus, sesuai skenario ENVIRONMENTS §3.1 "Akun publik (M5-01/M5-02)". Termasuk F (login → `/id/account` tanpa bounce dan tanpa loop saat Back; router Next 16.4.4 dengan `partialPrefetching`) dan I (`/admin` tanpa loop `/admin` ↔ `/admin/login` saat sesi publik aktif di browser yang sama; sesi publik tidak membuka admin; sesi staf saja di `/id/account` → `/id/login`). Akun uji dihapus Owner (K). Email konfirmasi dan reset terkirim lewat Resend sebagai custom SMTP Supabase (DEC-019 Accepted 2026-11-24), bukan SMTP bawaan. Run browser lokal tetap tidak tercatat; bukti browser hanya cek Owner ini.
## Open questions
- Will any staff member need a separate public user account to access exclusive publications? **Dijawab** (DECISIONS §2.18 keputusan 14b): staf yang perlu file `registered` mendaftar akun publik biasa tanpa tautan ke akun staf.
- What is the staff MFA policy? **Dialihkan ke M4** (keputusan 14b); belum dicek apakah Payload 3.93.0 punya MFA bawaan.
- Is custom internal dashboard functionality needed beyond Payload admin? **Tidak** (keputusan 14b).
- Catatan untuk M4: pola redirect allow-list Preview `https://mahira-foundation-*-mahiraindodev-2070.vercel.app/**` mungkin juga cocok dengan domain proyek Vercel akun lain (belum diverifikasi). Kode PR-1 selalu mengirim origin-nya sendiri, jadi tidak terdampak; hanya pemanggil langsung API Auth yang memegang publishable key yang dapat memanfaatkannya. Tinjau saat allow-list direvisi di M4.
