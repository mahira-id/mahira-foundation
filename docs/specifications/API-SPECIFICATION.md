# API Specification — Application Contracts

**ID:** SPEC-API-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Tujuan

Mendokumentasikan kontrak server-side yang dipakai browser atau integrasi internal. Ini bukan pengganti API resmi Payload/Supabase. Gunakan server components dan direct server-side library calls bila tidak diperlukan HTTP boundary; buat Route Handler hanya ketika dibutuhkan oleh browser, file download, webhook, atau integrasi eksternal.

## 2. General contract

- Semua input dari client dianggap tidak tepercaya.
- Validasi input di server menggunakan schema validator yang disepakati (library TBD).
- Jangan menerima `role`, `access_level`, `owner_id`, `entitlement_status`, `storage_bucket`, atau keputusan `allowed` dari client sebagai fakta otoritatif.
- Identitas berasal dari session yang diverifikasi di server.
- Gunakan HTTP status yang konsisten; jangan mengungkap apakah suatu file privat ada jika policy mengharuskan respons yang sama untuk mengurangi enumeration.
- Response tidak mengandung secret, database detail, signed URL permanen, stack trace, atau object key privat.
- Terapkan rate limit pada auth-sensitive, search, download-token, dan endpoint publik yang rentan abuse; vendor/algoritma TBD.
- Log correlation/request ID, bukan token, password, signed URL, atau isi dokumen.
- Gunakan idempotency untuk operasi mutasi yang dapat diulang dan seluruh webhook pembayaran fase 2.

## 3. Contract envelope (recommended)

Success response dapat menggunakan bentuk konsisten:

```json
{
  "data": {},
  "meta": { "requestId": "..." }
}
```

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa input yang dikirim.",
    "fields": {}
  },
  "meta": { "requestId": "..." }
}
```

Jangan mengirim internal exception message kepada pengguna. Untuk server component errors, gunakan error boundary yang sesuai.

## 4. Proposed application endpoints

Semua path berikut adalah kandidat. Sesuaikan dengan Next.js Route Handler conventions dan kebutuhan nyata; hindari membuat endpoint hanya untuk membungkus query yang dapat dilakukan di server.

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/publications` | Public | Search/list; bounded filters and pagination. |
| GET | `/api/publications/{id-or-safe-key}` | Public | Optional data endpoint; public pages may fetch server-side directly. |
| GET | `/api/files/{fileId}/download` | Conditional (M3-08: tanpa sesi, file `public` saja) | Authorize access and issue short-lived signed URL. Dibangun di M3-08 sebagai GET, bukan POST (§5.1). |
| GET/PATCH | `/api/account/profile` | Supabase user | Read/update own profile only. |
| GET | `/api/account/entitlements` | Supabase user | Read own effective entitlement summary. |
| GET | `/api/account/downloads` | Supabase user | Optional own history, if approved. |
| POST | `/api/webhooks/{provider}` | Provider signature | Phase 2 verified payment event only. |
| POST | `/api/revalidate` | Secret/system | Optional protected cache revalidation endpoint. |

Payload admin APIs remain governed by Payload auth and access control. Do not expose service credentials or create a browser path that bypasses Payload access control.

## 5. Download contract

### 5.1 Implementasi M3-08: `GET /api/files/{fileId}/download` (file `public`)

Keputusan Owner 2026-11-16 (DECISIONS §2.14 butir 2, 3, 6, 9). Kontrak ini berlaku untuk file ber-akses efektif `public`; file `registered`/`subscriber` mengikuti §5.2 di M5/M7.

- **Method dan path.** `GET /api/files/{fileId}/download` (route `app/api/files/[fileId]/download/route.ts`). Deviasi tercatat dari `POST` di §5.2: GET dipilih agar tautan "Unduh PDF" / "Download PDF" bekerja tanpa JavaScript. Tidak ada body dan tidak ada parameter lain; `fileId` adalah id record `publication-files` (bilangan bulat positif tanpa nol di depan, ≤ 2147483647).
- **Pemeriksaan di server, setiap request** (`lib/cms/public-content.ts` `getPublicFileDownload`, semuanya sebagai pengunjung anonim lewat Local API dengan `overrideAccess: false`):
  1. file terbaca anonim: `status = ready` dan `accessLevel = public` (`PUBLIC_FILE_READ`);
  2. versi tayang (tabel utama, `draft: false`) sebuah record publikasi mencantumkan file itu, dan record itu `published` + `public` (`PUBLIC_PUBLICATION_READ`); file yang hanya ada di draf, record yang belum pernah terbit, dan record yang di-unpublish tidak lolos;
  3. file PDF siap dan level yang lebih ketat antara publikasi dan file adalah `public` (`isPublicDownload`, DEC-011);
  4. URL GET ditandatangani 60 detik (`lib/cms/publication-file-storage.ts`, `@aws-sdk/s3-request-presigner` ke endpoint S3 Supabase dengan config client yang sama dengan adapter `@payloadcms/storage-s3`), dengan `response-content-disposition` = `attachment` dan nama file tersimpan (sejak 2026-11-16).
- **Tanpa sesi.** Route tidak membaca sesi; sesi staf tidak memberi bypass (DEC-009). Staf membuka file di `/admin` lewat `/api/publication-files/file/<nama>` di bawah access control Payload (302 bertanda tangan).

| Kondisi | Respons |
|---|---|
| Semua pemeriksaan lolos | `307`, `Location` = signed URL 60 detik ke private bucket `publication-files` yang membuat storage menjawab `Content-Disposition: attachment`; tanpa body |
| CMS mati, id tidak valid atau tidak dikenal, file draf/tidak tayang/tidak terpasang, publikasi draf/di-unpublish/bukan `public`, file `registered`/`subscriber`, file belum `ready` | `404` `Not Found` yang sama untuk semua penolakan (tidak membocorkan keberadaan file) |
| Galat baca database atau galat penandatanganan | `503` |

- **Header setiap respons:** `Cache-Control: no-store` (signed URL adalah bearer credential) dan `X-Robots-Tag: noindex` (PDF tidak diindeks; halaman detail tetap yang diindeks, DEC-021).
- **Log:** hanya nama galat (`PublicationReadError`, `FileStorageError`), tidak pernah URL atau signed URL.
- **Nama file unduhan dan attachment (OPEN ditutup 2026-11-16, catatan bertanggal DECISIONS §2.14):** objek disimpan dengan nama asli yang sudah disanitasi Payload. Signed URL membawa `response-content-disposition`, dan Supabase menjawab dengan header itu (SPIKE-003 §11, DL4): `attachment; filename="<fallback ASCII>"; filename*=UTF-8''<nama ter-encode persen>` (RFC 6266). Browser mengunduh PDF sebagai file dengan nama tersimpan, tidak membukanya inline. Header aman dari injeksi: karakter kontrol (CR, LF, …) dibuang dari kedua bentuk, dan fallback mengganti `"`, `\`, `%`, serta karakter non-ASCII dengan `_` (`attachmentDisposition` di `lib/publications/file-download.ts`; FU10, FU11). Dependency langsung: `@aws-sdk/s3-request-presigner` (disetujui Owner) dan `@aws-sdk/client-s3` (sumber `GetObjectCommand`/`S3Client`, diberitahukan kepada Owner oleh orchestrator), keduanya exact `3.1164.0`; tanpa variabel env baru. Unduhan staf di `/admin` tetap lewat handler adapter (Bucket + Key saja, terbuka inline).
- **TTL dan pencabutan:** URL baru ditolak setelah 60 detik (DL11). Unduhan yang sudah berjalan tidak diputus saat TTL lewat (diukur lokal: 10 MB yang dibaca lambat selesai 818 detik sesudah URL dibuat); request `Range` baru dengan URL kedaluwarsa dijawab 400, jadi lanjutan unduhan butuh klik ulang. Unpublish atau perubahan Access Level berlaku untuk request berikutnya; URL yang sudah diberikan tetap berlaku sampai 60 detik.
- **Tanpa audit, hitungan unduhan, atau rate limit** untuk unduhan publik di M3-08 (butir 9). FR-026 untuk file terbatas (M5); rate limit dicatat sebagai butir M4.
- **`/api/media/file/*`** selalu `404` dengan kedua header di atas (butir 10; sebelumnya HTTP 500 dari fallback disk Payload, SPIKE-003 §8). File media tetap URL bucket publik.

### 5.2 Kontrak umum (file terbatas, M5/M7)

#### Request

`POST /api/files/{assetId}/download` (kandidat awal; M3-08 membangun `GET /api/files/{fileId}/download`, §5.1. Bentuk untuk file terbatas diputuskan di M5.)

The authenticated/anonymous caller identifies only the asset requested. The server loads publication/asset access metadata from trusted sources.

Optional request body may contain a client correlation hint only:

```json
{ "clientRequestId": "opaque-uuid" }
```

Do not accept client-supplied user ID or access level.

#### Decision flow

1. Resolve asset by immutable ID and confirm it is deliverable/published.
2. Resolve publication and effective asset access policy.
3. Verify Supabase public-user session when access requires it.
4. Load active entitlement(s) from trusted server-side source.
5. Evaluate explicit policy; staff access is deny-by-default until an approved rule exists.
6. If allowed, issue a narrowly scoped, short-lived signed URL or stream content through server.
7. Record the authorization outcome using a privacy-reviewed audit schema.
8. Return only the minimum data required for the client to initiate download.

#### Response semantics

| Condition | Candidate response | Notes |
|---|---|---|
| Public asset allowed | `200` | Short-lived URL or server download response. |
| Login required | `401` | UI may offer login with safe return path. |
| Authenticated but entitlement insufficient | `403` | UI explains required access level. |
| Asset unavailable/unpublished | `404` | Avoid draft existence disclosure. |
| Invalid request | `400` / `422` | Use one convention consistently. |
| Rate limited | `429` | Include retry guidance when appropriate. |
| Storage/provider failure | `503` or generic `500` | Do not mislabel as access denied. |

Whether inaccessible assets return `403` or `404` must be decided from the threat model and UX requirements. Never return a signed URL on deny.

#### URL expiry

File `public` (M3-08): 60 detik (DECISIONS §2.14 butir 2; pengukuran di §5.1). File terbatas: TTL is **TBD**. Choose the shortest practical period after testing download size, user experience, and provider constraints. Signed URLs are bearer credentials: anyone who obtains one may use it until expiry. Revoking an entitlement does not necessarily invalidate an already issued URL. If immediate revocation is required, use a proxy/stream or another revocation-capable design.

### 5.3 Implementasi M3-13: `GET /api/learning-hub/files/{fileId}/download?locale=id|en` (file toolkit)

Keputusan Owner 2026-11-18 (DECISIONS §2.17 keputusan 1–5). Kontrak ini mengikuti §5.1 dengan pemeriksaan toolkit sebagai pengganti pemeriksaan publikasi; tidak ada access level (semua materi Learning Hub publik, DEC-014).

- **Method dan path.** `GET /api/learning-hub/files/{fileId}/download?locale=id|en` (route `app/api/learning-hub/files/[fileId]/download/route.ts`). `fileId` adalah id record `toolkit-files` (bilangan bulat positif tanpa nol di depan, ≤ 2147483647; `parseFileId` yang sama dengan §5.1). `locale` wajib karena toolkit dan labelnya berlokalisasi; tautan di panel file membawa locale halaman. Tidak ada body.
- **Tidak bertabrakan.** Route statis ini lebih spesifik daripada `app/(payload)/api/[...slug]`; Payload REST tidak punya koleksi `learning-hub` (globalnya `/api/globals/learning-hub`) dan koleksi file ada di `/api/toolkit-files`. `/api/files/{id}/download` (§5.1) punya segmen pertama berbeda dan memeriksa tabel `publication-files`; id kedua koleksi dapat sama dan tidak pernah saling membuka (TK5, FA5/FA5b).
- **Gerbang CMS mati.** `proxy.ts` tidak berubah: matcher `/api/:path*` menjawab 404 + `noindex` + `no-store` saat CMS mati atau Production; route mengulang `isCmsEnabled()` (G5.11).
- **Pemeriksaan di server, setiap request** (`lib/cms/public-content.ts` `getPublicToolkitFileDownload`, sebagai pengunjung anonim lewat Local API dengan `overrideAccess: false`):
  1. file terbaca anonim: `status = ready` dan PDF (`PUBLIC_TOOLKIT_FILE_READ`);
  2. versi tayang (tabel utama, `draft: false`, locale yang diminta, tanpa fallback) sebuah toolkit mencantumkan file itu; file yang hanya ada di draf, toolkit yang belum pernah terbit, dan toolkit yang di-unpublish tidak lolos;
  3. `isResourceVisible`: published, Topic aktif dan bernama di locale itu, EN juga "Versi EN siap tayang", minimal satu file;
  4. file itu termasuk item toolkit di locale tersebut (`toolkitFileItems`: ready, PDF, berlabel di locale itu);
  5. URL GET ditandatangani 60 detik dengan `signedFileUrl` (key `toolkits/<nama file>`, `response-content-disposition` = `attachment` dan nama file tersimpan, RFC 6266; sama dengan §5.1).
- **Tanpa sesi.** Sesi staf tidak memberi bypass (DEC-009); staf membuka file di `/admin` lewat `/api/toolkit-files/file/<nama>`.

| Kondisi | Respons |
|---|---|
| Semua pemeriksaan lolos | `307`, `Location` = signed URL 60 detik ke private bucket `publication-files` (key `toolkits/…`) yang membuat storage menjawab `Content-Disposition: attachment`; tanpa body |
| CMS mati; id atau `locale` tidak valid, hilang, atau tidak dikenal; file tidak ada atau belum `ready`; file tidak terpasang atau hanya di draf; toolkit draf, belum pernah terbit, di-unpublish, atau tidak tampil di locale itu (termasuk EN tanpa "Versi EN siap tayang" atau tanpa label EN); Topic tidak aktif; id file publikasi | `404` `Not Found` yang sama untuk semua penolakan (tidak membocorkan keberadaan file) |
| Galat baca database atau galat penandatanganan | `503` |

- **Header setiap respons:** `Cache-Control: no-store` dan `X-Robots-Tag: noindex` (`downloadResponse` yang sama dengan §5.1).
- **Log:** hanya nama galat (`[toolkit-download]` + `LearningHubReadError` atau `FileStorageError`), tidak pernah URL atau signed URL.
- **TTL dan pencabutan:** sama dengan §5.1: URL baru ditolak setelah 60 detik; unpublish berlaku untuk request berikutnya, URL yang sudah diberikan berlaku sampai 60 detik.
- **Tanpa audit, hitungan unduhan, atau rate limit** (butir M4, DECISIONS §2.14).
- **Upload.** Staf mengunggah lewat `clientUploads` di `/admin` (endpoint `POST /api/storage-s3-generate-signed-url` hanya Editor/Admin; objek tersimpan di prefix `toolkits/`); `toolkit-files` hanya menerima PDF (cek isi `%PDF-`, 50 MB).
- **Verifikasi:** TK1–TK11 di `tests/integration/toolkit-files.test.ts` (TK4 307 + attachment + nama tersimpan, TK5 semua penolakan, TK6 REST/GraphQL anonim, TK7 URL objek langsung), `downloads` untuk regresi §5.1, gerbang G4.8/G4.9/G5.11; TEST-PLAN §12.2.

## 6. Search/list contract

Suggested query parameters: `q`, `locale`, `type`, `topic`, `year`, `sort`, `page`, `pageSize`.

- `locale` must match supported values; preferably derive from route context and reject conflicting query value.
- Bound `q` length and normalize whitespace. Diterapkan di M3-06 (DECISIONS §2.12 P8): maksimal 100 code point, NFKC dan whitespace dirapikan; `q` lebih panjang dipotong (usulan planner, bukan galat). Parameter `sort` tidak ada di M3-06 (P4): urutan relevansi bila ada `q`, selain itu urutan M3-05; `sort` diabaikan. Pencarian publik halaman indeks memakai `?q=` di route `/{locale}/publications` (DEC-005 addendum), bukan endpoint terpisah.
- Allowlist sort keys and sort direction.
- Enforce server maximum page size; proposed default 12–20 and maximum 50 pending UX/performance test.
- Return only published and indexable records for public callers.
- Never reveal private internal fields or file object keys.
- Search ranking must be tested on a representative content corpus before declaring relevance complete.

## 7. Profile and entitlement contracts

- A public user can read/update only permitted fields of their own profile.
- Email/identity changes follow Supabase Auth flows; do not directly edit auth identity columns in application profile APIs.
- Users may read a sanitized summary of their own entitlement, not grant/revoke it.
- A client cannot create its own entitlement or set subscription state.
- Admin grant/revoke must use explicit staff permission, reason, validity bounds, and audit trail.

## 8. Webhook contract (Phase 2)

- Verify provider signature/authenticity before processing.
- Store provider event ID with unique constraint and processing status.
- Process transactionally where possible; duplicate delivery must not duplicate business effects.
- Handle out-of-order and late events using provider event time, local state machine, and reconciliation rules.
- Do not trust success redirect parameters from browser.
- Acknowledge only after durable acceptance; define retry/dead-letter behavior.
- Never log payment secrets or full sensitive payloads.

## 9. API test checklist

- Invalid/missing session.
- Expired session.
- Wrong role.
- Cross-user IDOR attempt.
- Forged client access level.
- Unpublished asset.
- Direct private bucket access.
- Expired/forwarded signed URL.
- Storage timeout.
- Duplicate request and duplicate webhook.
- Rate limit behavior.
- Secret and stack-trace leakage.
