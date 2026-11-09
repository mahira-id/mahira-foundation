# SPIKE-003 — Supabase Storage and Gated Publication Assets

**Status:** Completed with findings untuk bagian publik (M2-03); bagian privat Planned (M5-04) · **Owner:** Haidar (Product Owner), approver keputusan · **Date:** 2026-11-10 (bagian publik dijalankan 2026-11-09 s.d. 2026-11-10) · **Decision links:** DEC-009, DEC-010, DEC-011, DEC-012 · **ADR:** 0006

Branch spike: `spike/m2-payload-postgres` (lokal, tidak di-push, tidak di-merge), commit kode `c19a774`. Rekomendasi dicatat sebagai usulan di `decisions/DECISIONS.md` §2.3; tidak ada status DEC yang diubah.

## 1. Question
Can the selected upload/storage integration support public and private publication assets without persisting uploads on ephemeral application filesystem, and can the server enforce asset-level entitlement before issuing access?

M2-03 menjawab bagian pertama untuk file **publik** saja. Bagian privat dan entitlement dijawab di M5-04.

## 2. Hypothesis
A private bucket plus server-side authorization and short-lived signed URL can satisfy the baseline. Immediate revocation of an already issued signed URL may not be guaranteed; the experiment must document actual provider semantics.

Hipotesis bagian publik (M2-03): Payload upload collection + `@payloadcms/storage-s3` ke bucket publik Supabase Storage menyimpan file di object storage, tidak di filesystem aplikasi, dan file dibaca anonim lewat URL publik Supabase.

## 3. Scope and non-scope
**Scope (dijalankan, M2-03):** koleksi `media` (upload), field `coverImage` di Publications, upload PDF dan gambar publik lewat Local API dan admin UI, baca anonim, tolak MIME tidak diizinkan, replace, delete, durabilitas setelah restart, tidak ada file di filesystem aplikasi, regresi homepage, secret-scan bundle.

**Tidak dijalankan (M5, M5-04):** private bucket, signed URL dan TTL, endpoint unduhan dengan kasus visitor/registered/entitlement aktif/kedaluwarsa/ditolak, akses langsung ke object privat, manipulasi ID/role, audit log, unduhan file besar.

**Tidak dijalankan (lainnya):** redeploy (tidak ada preview untuk `spike/*`), `clientUploads` (upload langsung dari browser), batas body request Vercel untuk upload lewat server, file PDF pihak ketiga (`public/publications/`) — sengaja tidak diunggah ke bucket publik; spike memakai file sintetis `[FIXTURE]`.

## 4. Environment and pinned versions
| Item | Nilai |
|---|---|
| Runtime / tooling | Sama dengan SPIKE-001 §4 (Windows, Node v26.4.0, Bun 1.3.14 sebagai package manager, Next.js 16.4.4, Payload 3.93.0) |
| Adapter | `@payloadcms/storage-s3` 3.93.0 (exact); menarik `@aws-sdk/client-s3` 3.1164.0 dan `@aws-sdk/lib-storage` |
| Project | Supabase `mahira.id` (APP, ref `dmtbieetvgkvncadbkmd`), region `eu-central-1` |
| Bucket | `spike-m2-public` (dibuat Owner 2026-11-09): `public = true`, `file_size_limit` 52428800 (50 MiB), `allowed_mime_types` `application/pdf`, `image/png`, `image/jpeg`, `image/webp`. Satu-satunya bucket di project; dibiarkan untuk Owner |
| Endpoint | `https://<ref>.storage.supabase.co/storage/v1/s3`, `forcePathStyle: true`, kredensial `APP_SUPABASE_S3_ACCESS_KEY_ID` / `APP_SUPABASE_S3_SECRET_ACCESS_KEY` (server-only) |
| Konfigurasi koleksi | `prefix: 'spike-m2'`, `disablePayloadAccessControl: true`, `generateFileURL` → `<APP_SUPABASE_URL>/storage/v1/object/public/spike-m2-public/<prefix>/<filename>` |
| Migrasi | `20261109_164253_media` (tabel `media`, kolom cover di `publications` dan `_publications_v`, `payload_locked_documents_rels.media_id`) + RLS |

## 5. Procedure
1. Cek keberadaan variabel S3 berdasarkan nama saja; cek bucket via Composio read-only (awalnya 0 bucket; Owner membuat `spike-m2-public`).
2. `bun add --exact @payloadcms/storage-s3@3.93.0`; `bun pm untrusted` (tidak ada script baru selain 3 postinstall esbuild yang sudah diblokir).
3. Tambah `payload/collections/Media.ts`, `coverImage` di Publications, plugin `s3Storage` di `payload/payload.config.ts`.
4. `bun run payload migrate:create media` → hitung data → `bun run payload migrate` → `migrate:status` → hitung data dan `relrowsecurity` lagi.
5. `bun run payload generate:types`, `bun run payload generate:importmap`, `bun run lint`, `bun run build`.
6. `bun run start --port 3100`; `bun run payload run scripts/spike/m2-03-storage-checks.ts` (S1–S7), snapshot `storage.objects` via Composio sebelum dan sesudah S7.
7. Stop/start server; cek media dan URL publik lagi (durabilitas).
8. Upload lewat admin UI (Playwright) dan baca anonim.
9. Cek homepage, `node scripts/spike/secret-scan.mjs .next/static`, cari string endpoint S3 di bundle statis.
10. `SPIKE_MODE=cleanup`: hapus media dan publikasi fixture; cek `storage.objects` kosong.

## 6. Acceptance / exit criteria
| Kriteria | Bagian | Hasil |
|---|---|---|
| Upload is durable across app redeploy/restart | Publik (M2-03) | PARTIAL: restart PASS; redeploy NOT RUN |
| Private bucket denies anonymous direct read | Privat (M5-04) | NOT RUN |
| Unauthorized requests never receive signed URL | Privat (M5-04) | NOT RUN |
| User cannot change asset/publication ID or role to bypass policy | Privat (M5-04) | NOT RUN |
| Asset lifecycle handles pending, failed, replaced, unpublished, and deleted objects | Publik sebagian (M2-03), sisanya M5-04 | PARTIAL: failed (MIME ditolak, S4) PASS, replaced (S6) OBSERVED, deleted (S7) PASS; pending dan unpublished NOT RUN |
| Signed URL TTL behavior is measured and recorded | Privat (M5-04) | NOT RUN |
| Audit log records decision outcome without logging the URL/token | Privat (M5-04) | NOT RUN |
| Large-file download behavior is acceptable under chosen hosting/runtime constraints | M5-04 | NOT RUN |

## 7. Results and evidence
### 7.1 Instalasi, migrasi, build
- `bun add` exit 0 (51 paket). Versi next 16.4.4, react/react-dom 19.3.0, payload 3.93.0 tidak berubah.
- Migrasi `media` diterapkan di DB berisi data (5.6 s), lalu exit 9 libuv saat teardown (temuan SPIKE-001 §8); `migrate:status` ketiga migrasi Ran=Yes. Data tetap: publications 18, versi 31, groups 11, topics 2, authors 2. RLS 20/20 tabel `true` termasuk `media`.
- `bun run lint` exit 0 (0 error, 6 warning unused-arg di `down()` hasil generate). `bun run build` exit 0 dua kali (98 s; final 123 s, compile 31.2 s, TS 45 s), route sama dengan SPIKE-001 §7.1.

### 7.2 Pemeriksaan S1–S7
Skrip `scripts/spike/m2-03-storage-checks.ts`: `SUMMARY pass=6 fail=0 observed=5`, exit 0.

| ID | Pemeriksaan | Hasil | Fakta teramati |
|---|---|---|---|
| S1 | Upload PDF lewat Local API | PASS | `fixture-m2-public.pdf`, `application/pdf`, 626 byte, prefix `spike-m2`, URL publik Supabase; upload 5586 ms |
| S2 | GET anonim URL publik | PASS | 200 `application/pdf`, sha256 cocok, `cache-control: no-cache`; fetch pertama 5432 ms |
| S2-proxy | GET `/api/media/file/<filename>` | OBSERVED | HTTP 500; log "File … is missing on the disk". Dengan `disablePayloadAccessControl` adapter tidak memasang handler, Payload jatuh ke disk lokal (tidak ada file yang ditulis) |
| S3 | PNG sebagai `coverImage` publikasi published | PASS | `GET /api/publications/<id>?depth=1` anonim 200, `coverImage.url` = URL publik; body tanpa endpoint S3, signature, atau access key. OBSERVED: objek media menampilkan key `prefix` dan `_objectKey` ke anonim (tidak berbahaya untuk file publik) |
| S4 | Tolak `text/plain` | PASS | `ValidationError` "The following field is invalid: file" (log: tipe `text/plain` tidak diizinkan); bucket juga membatasi MIME |
| S5 | Tidak ada file di filesystem aplikasi | PASS | Folder `media` tidak ada di worktree; tidak ada file bernama sama dengan upload (di luar `node_modules`, `.next`, `.git`); tetap tidak ada setelah restart |
| S6 | Replace file | OBSERVED | `payload.update` dengan file baru (3389 ms): nama jadi `fixture-m2-cover-v2.png`, URL berubah, URL baru 200 dengan sha256 v2; objek lama DIHAPUS adapter (URL lama dengan cache-buster → 400). URL lama **tanpa** cache-buster masih 200 (101 ms) sesaat setelah replace: CDN Supabase menyajikan salinan cache. `coverImage.url` publikasi ikut berubah (relasi by id) |
| S7 | Delete media | PASS | Objek hilang dari `storage.objects` (7339 ms); URL publik setelahnya 400 (`application/json`, bukan 404) |

Latensi (Windows lokal → `eu-central-1`, skala spike): upload 3.4–5.6 s, delete 7.3 s, fetch anonim pertama 4.8–5.4 s, fetch ter-cache ~0.1 s.

### 7.3 Durabilitas
Server dihentikan (port bebas) lalu dijalankan lagi: `GET /api/media/2` 200 dan URL publik (cache-busted) 200 `image/png` dengan sha256 cocok; tidak ada folder `media` di worktree.

### 7.4 Upload lewat admin UI
Media → Create New → pilih `fixture-m2-cover.png`, alt `[FIXTURE] admin upload` → Save: tersimpan sebagai media id 3, layar edit menampilkan URL publik Supabase (70 byte, 1×1, `image/png`). URL publik anonim 200 `image/png`; `GET /api/media/3` anonim 200. Upload admin lewat server (`clientUploads` tidak aktif).

### 7.5 Regresi homepage dan bundle
`GET /` 200 berisi "Riset untuk"; `#beranda` `rgb(30, 111, 183)` (baseline). Secret-scan `.next/static` bersih (70 file) di kedua build; 0 file statis memuat `storage/v1/s3` atau nama variabel S3.

### 7.6 Pembersihan
`SPIKE_MODE=cleanup` menghapus media 2 dan 3 (objeknya ikut dihapus adapter) serta publikasi fixture dan group-nya. `storage.objects` di `spike-m2-public` = 0 baris; `media` CMS = 0; publications = 18 (seperti sebelum M2-03). Bucket dibiarkan.

## 8. Failure modes and constraints
- **S3 access key Supabase melewati Storage RLS** dan memberi baca/tulis/hapus penuh pada semua bucket project `mahira.id`. Key wajib server-only (tidak pernah `NEXT_PUBLIC_*`), dirotasi, dan dipisah per environment (DEC-012, M5).
- **Upload lewat server:** ukuran file dibatasi batas body request Vercel; tidak diuji. Alternatif `clientUploads` butuh CORS PUT di bucket; tidak diuji.
- **`/api/media/file/<name>` → 500** saat `disablePayloadAccessControl: true`. Tidak boleh ada kode yang menautkan ke route itu; blokir atau terima 500.
- **CDN menyajikan objek lama** di URL lama sesaat setelah replace/delete. Untuk file publik efeknya terbatas (replace mengganti nama file). Untuk file terbatas (M5) ini alasan memakai signed URL di bucket privat, bukan URL publik.
- **Objek hilang menjawab 400**, bukan 404.
- **Key internal adapter** (`prefix`, `_objectKey`) terlihat di respons anonim.
- **`down()` migrasi `media`** hasil generate gagal dengan pola yang sama seperti SPIKE-001 §8; sudah dijaga `IF EXISTS` dan diuji `migrate:down` → `migrate` (commit `119a131`, SPIKE-001 §7.2).
- **Region:** bucket di `eu-central-1`; region produksi terbuka (DEC-017/DEC-020).
- **Bucket `spike-m2-public` dibiarkan** di project `mahira.id` untuk Owner; menghapusnya adalah pilihan Owner.
- `coverImage` tidak termasuk shared fields DEC-004, jadi record ID dan EN boleh punya cover berbeda.

## 9. Decision recommendation
Rekomendasi saja; status tidak diubah. Lihat `decisions/DECISIONS.md` §2.3.

- **DEC-012 (bagian publik):** bukti mendukung object storage Supabase lewat `@payloadcms/storage-s3` dengan file publik disajikan langsung dari URL publik Supabase dan tanpa file di filesystem aplikasi. Rekomendasi: tetap Proposed, karena bagian privat (private bucket + signed URL setelah otorisasi server) belum diuji. Owner dapat mencatat bagian publik sebagai tervalidasi.
- **Tetap terbuka untuk M5-04:** DEC-011 (akses level publikasi vs aset), bagian privat DEC-012 (signed URL, TTL, revocation), DEC-010 (evaluator entitlement), upload langsung vs lewat server, retensi dan backup objek.

## 10. Follow-up
| Tindak lanjut | Owner | Milestone |
|---|---|---|
| Putuskan apakah bagian publik DEC-012 dicatat tervalidasi; hapus atau pertahankan bucket `spike-m2-public` | Haidar (PO) | M2-05 |
| Nama bucket/prefix produksi, region, pemisahan key S3 per environment | Engineering + PO | M3-08 (DEC-017, DEC-020) |
| Putuskan `clientUploads` + CORS vs upload lewat server; uji ukuran file nyata | Engineering | M3-08 |
| Blokir atau dokumentasikan `/api/media/file/*` | Engineering | M3-08 |
| Jalankan bagian privat: private bucket, signed URL + TTL, matriks akses, audit, file besar | Engineering | M5-04 |
| Ulangi spike bila adapter, `@aws-sdk/client-s3`, atau provider berubah | Engineering | — |
