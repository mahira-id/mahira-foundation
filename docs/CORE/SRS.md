**SRS / SOFTWARE REQUIREMENTS SPECIFICATION**

**Spesifikasi Kebutuhan Perangkat Lunak**

Spesifikasi fungsional, nonfungsional, arsitektur target, aktor, integrasi, kontrol akses, dan kriteria verifikasi.

| **Project**     | Mahira Indonesia Development (brand publik, DEC-001; nama legal TBD)           |
|-----------------|-----------------------------------------------------------------------|
| **Document ID** | SRS-MID                                                               |
| **Version**     | 0.1                                                                   |
| **Status**      | Baseline draft — untuk review dan penyelarasan                        |
| **Tanggal**     | 04 November 2026                                                      |
| **Bahasa**      | Indonesia; istilah teknis dipertahankan bila lebih presisi            |
| **Basis**       | Brief pengguna, mockup homepage, dan dokumen diskusi teknis terlampir |

> **STATUS DOKUMEN**
>
> Dokumen ini menetapkan baseline kebutuhan dan rekomendasi. Item yang belum diputuskan ditandai sebagai asumsi atau keputusan terbuka; jangan menganggapnya sebagai keputusan final sebelum disetujui pemilik produk.

# Kontrol dokumen

| **Item**        | **Keterangan**                                                                           |
|-----------------|------------------------------------------------------------------------------------------|
| Cakupan         | Platform publikasi, Learning Hub, akun pengguna, dan dashboard internal.                 |
| Target stack    | Next.js + Payload CMS + Supabase; rekomendasi baseline yang harus lolos technical spike. |
| Lingkungan      | Development, staging, production.                                                        |
| Dokumen terkait | PRD-MID sebagai sumber kebutuhan; PDD-MID sebagai kontrak desain dan UX.                 |
| Status          | Draft spesifikasi; belum menjadi kontrak implementasi final                              |

# 1. Pendahuluan

## 1.1 Tujuan dokumen

SRS mendefinisikan perilaku sistem yang dapat diuji untuk platform Mahira Indonesia Development (nama kerja). Dokumen ini menjadi rujukan implementasi, pengujian, dan penerimaan teknis. Kebutuhan yang belum mendapat keputusan bisnis diberi label “TBD” atau “proposed” dan harus dikonfirmasi sebelum menjadi kontrak final.

## 1.2 Ruang lingkup sistem

Sistem mencakup website publik yang SEO-oriented, katalog dan detail publikasi, pencarian, Learning Hub, autentikasi pengguna umum, area akun, dashboard editorial/admin, penyimpanan file, serta kerangka access level dan entitlement. Integrasi payment gateway dan subscription aktif berada pada fase lanjutan.

## 1.3 Terminologi

| **Istilah**     | **Definisi**                                                                                            |
|-----------------|---------------------------------------------------------------------------------------------------------|
| Payload CMS     | CMS untuk model konten dan dashboard editorial; kandidat baseline yang dipasang dalam aplikasi Next.js. |
| Supabase        | Backend platform yang menyediakan PostgreSQL, Auth untuk pengguna umum, dan Storage.                    |
| Access level    | Tingkat akses yang melekat pada publikasi: public, registered, subscriber.                              |
| Entitlement     | Hak aktual pengguna untuk mengakses konten berdasarkan akun, langganan, atau grant manual.              |
| Signed URL      | URL file privat yang ditandatangani dan memiliki masa berlaku terbatas.                                 |
| Staf            | Istilah payung untuk Editor dan Admin saja, bukan role tersendiri (DEC-009); identitas terpisah dari pengguna umum. |
| ISR / SSG / SSR | Strategi rendering Next.js untuk halaman statis, regenerasi, atau dinamis.                              |

# 2. Gambaran sistem

## 2.1 Aktor dan kelas pengguna

| **Aktor**                     | **Sistem identitas**               | **Kapabilitas minimum**                                                                                 |
|-------------------------------|------------------------------------|---------------------------------------------------------------------------------------------------------|
| Visitor / anonim              | Tidak perlu login.                 | Membaca halaman publik, melihat metadata dan ringkasan publikasi, mencari, serta mengakses file public. |
| Registered user               | Supabase Auth.                     | Kapabilitas visitor + mengakses konten registered dan area akun.                                        |
| Subscriber                    | Supabase Auth + entitlement aktif. | Kapabilitas registered + mengakses publikasi subscriber selama hak akses berlaku.                       |
| Editor                        | Payload user/staff.                | Mengelola konten sesuai access control; membuat draft, metadata, preview, dan publish sesuai policy.    |
| Admin                         | Payload user/staff.                | Mengelola konfigurasi/role staf dan akses editorial penuh sesuai policy.                                |
| Reviewer / Finance            | Tidak dipakai.                     | Owner 2026-11-09: role yang dibutuhkan hanya Public user, Editor, Admin (DEC-009, DEC-016). |

## 2.2 Konteks arsitektur target

| **Lapisan**             | **Komponen baseline**                      | **Tanggung jawab**                                                                                                          |
|-------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Web application         | Next.js App Router + TypeScript            | Situs publik, route akun, route handler/server actions, server-side authorization, rendering SSG/ISR/SSR.                   |
| CMS / staff admin       | Payload CMS 3                              | Konten publikasi, penulis, topik, halaman, Learning Hub, media metadata, localization, draft/versions, access control staf. |
| Database                | Supabase PostgreSQL                        | Data aplikasi; tabel CMS via Payload dan data user/entitlement via Supabase. Ownership dan migrasi harus dipisahkan jelas.  |
| Public-user auth        | Supabase Auth + @supabase/ssr              | Registrasi, login, session, token, dan identitas pengguna umum.                                                             |
| File storage            | Supabase Storage                           | Public bucket untuk aset publik; private bucket untuk file terbatas.                                                        |
| Search                  | Postgres FTS + pg_trgm                     | Pencarian judul, ringkasan, metadata dan, bila disetujui, hasil ekstraksi PDF.                                              |
| Localization            | Payload localization + next-intl           | Konten dan UI ID/EN; model relasi terjemahan wajib diputuskan.                                                              |
| Hosting                 | Vercel Pro + Supabase Pro (proposed)       | Deployment Next.js dan layanan backend managed; domain tetap di Hostinger.                                                  |
| Email & monitoring      | Resend/Brevo SMTP; Sentry + uptime monitor | Email auth/transaksional dan pemantauan error/availability.                                                                 |
| Payment (fase lanjutan) | Xendit atau Midtrans                       | Pembayaran dan webhook subscription; provider belum dipilih.                                                                |

> **STATUS ARSITEKTUR**
>
> Stack di atas adalah baseline rekomendasi dari diskusi, bukan hasil uji teknis yang telah terbukti. Lakukan technical spike untuk memvalidasi Payload + Supabase Postgres + Auth + Storage + satu dokumen gated sebelum mengunci implementasi.

## 2.3 Pembagian tanggung jawab data

- **Payload:** konten editorial dan identitas staf: publikasi, author, topic/desk, halaman, event, Learning Hub, localization, workflow editorial, staff role.

- **Supabase:** akun publik, profil, entitlement, subscription (fase lanjutan), log unduhan, bookmark/riwayat bila disetujui, serta file privat.

- **Batas kontrol akses:** Payload access control melindungi data/aksi CMS; Supabase RLS melindungi data pengguna umum. Jangan menganggap tabel Payload otomatis terlindungi RLS hanya karena berada di Supabase Postgres.

- **File:** jangan menyimpan file upload permanen di filesystem aplikasi serverless; gunakan storage adapter ke Supabase Storage atau object storage yang disetujui.

# 3. Persyaratan fungsional

Prioritas: P0 = wajib untuk MVP; P1 = penting setelah inti MVP; P2 = opsional/ekspansi. Requirement harus diuji pada lingkungan staging sebelum dinyatakan selesai.

| **ID** | **Fitur**                    | **Prioritas** | **Requirement**                                                                                                          | **Kriteria verifikasi**                                                                                       |
|--------|------------------------------|---------------|--------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| FR-001 | Locale routing               | P0            | Sistem harus menyediakan route locale untuk ID dan EN, misalnya /id dan /en.                                             | Pengguna dapat berpindah bahasa; URL menunjukkan locale aktif.                                                |
| FR-002 | Homepage publik              | P0            | Sistem harus menampilkan identitas organisasi, navigasi, publikasi unggulan/terbaru, dan entry point Learning Hub/About. | Setiap blok utama menavigasi ke halaman yang benar; konten berasal dari CMS atau konfigurasi yang disepakati. |
| FR-003 | Publication listing          | P0            | Sistem harus menampilkan daftar publikasi dengan metadata minimum dan status akses.                                      | Daftar memuat judul, ringkasan singkat, tanggal, penulis/topik sesuai data, dan dapat dipaginasi.             |
| FR-004 | Publication detail           | P0            | Sistem harus menyediakan halaman detail dengan slug stabil, metadata, ringkasan, dan kontrol file/akses.                 | URL publik dapat dibagikan; halaman mempunyai title/description dan konten yang sesuai.                       |
| FR-005 | Taxonomy navigation          | P0            | Sistem harus mengelompokkan publikasi berdasarkan tipe dan topik/desk yang disetujui.                                    | Pengguna dapat menelusuri topik; kategori kosong tidak ditampilkan sebagai navigasi aktif.                    |
| FR-006 | Search                       | P0            | Sistem harus mencari publikasi berdasarkan kata kunci pada field yang ditentukan.                                        | Hasil relevan ditampilkan; query kosong/invalid dan no-results memiliki state yang jelas.                     |
| FR-007 | SEO metadata                 | P0            | Setiap halaman publikasi harus menyediakan metadata unik dan social preview.                                             | HTML response memiliki title, description, canonical dan Open Graph yang tepat.                               |
| FR-008 | Public file download         | P0            | Sistem harus mengizinkan unduhan file publik tanpa login.                                                                | File public hanya dapat diakses melalui URL/bucket yang memang diklasifikasikan public.                       |
| FR-009 | Access-level enforcement     | MVP+ (DEC-002) | Sistem harus memeriksa access_level dan entitlement pada server sebelum mengeluarkan akses file.                         | Anonim/registered tanpa hak tidak memperoleh signed URL file subscriber.                                      |
| FR-010 | Public account registration  | MVP+ (DEC-002) | Sistem harus mendukung registrasi pengguna umum melalui Supabase Auth.                                                   | Akun dibuat, validasi/verifikasi sesuai konfigurasi, dan session tersedia setelah flow selesai.               |
| FR-011 | Public user sign-in/out      | MVP+ (DEC-002) | Sistem harus mendukung login, logout, dan reset password.                                                                | Session dibuat/dihapus dengan aman; route akun memerlukan session valid.                                      |
| FR-012 | Account area                 | MVP+ (DEC-002) | Sistem harus menyediakan area akun dasar bagi pengguna terdaftar.                                                        | Pengguna dapat melihat profil dan status akses; halaman tidak diindeks mesin pencari.                         |
| FR-013 | Entitlement administration   | MVP+ (DEC-002) | Staf berwenang harus dapat memberikan/mencabut entitlement manual sebelum payment aktif.                                 | Perubahan dicatat dan berdampak pada keputusan akses berikutnya.                                              |
| FR-014 | Editorial content management | P0            | Editor harus dapat membuat, membaca, memperbarui, dan mengarsipkan konten publikasi.                                     | CRUD mengikuti access control staf dan validasi field wajib.                                                  |
| FR-015 | Editorial workflow           | P0            | Sistem CMS harus mendukung draft, preview, dan publish; review/schedule dikonfirmasi pada proses editorial.              | Konten draft tidak tampil di halaman publik; konten published tampil sesuai locale.                           |
| FR-016 | Author and topic management  | P0            | Staf harus dapat mengelola penulis dan topik/desk sebagai entitas terstruktur.                                           | Referensi dapat digunakan ulang pada beberapa publikasi.                                                      |
| FR-017 | Media and file upload        | P0            | Staf harus dapat mengunggah cover dan file publik/privat ke object storage.                                              | Upload memiliki validasi tipe/ukuran, status, dan lokasi penyimpanan sesuai klasifikasi.                      |
| FR-018 | Learning Hub catalog         | P1            | Sistem harus menampilkan katalog materi pembelajaran dengan kategori dan metadata.                                       | Pengguna dapat membuka detail/resource dan mengikuti embed/tautan yang tersedia.                              |
| FR-019 | Video embed                  | P1            | Sistem harus mendukung video eksternal melalui embed, misalnya YouTube.                                                  | Embed responsive, memiliki title/accessibility, dan tidak mengunggah file video ke app server.                |
| FR-020 | Static content pages         | P1            | Staf harus dapat mengelola halaman About dan halaman informasi lain yang disepakati.                                     | Perubahan konten dapat diterbitkan tanpa deployment aplikasi.                                                 |
| FR-021 | Event content                | P2            | Sistem dapat menyediakan konten event bila diperlukan organisasi.                                                        | Event memiliki detail dan status; scope final ditentukan terpisah.                                            |
| FR-022 | Subscription lifecycle       | P1            | Sistem harus menyediakan model subscription dan entitlement saat fase pembayaran dimulai.                                | Status langganan diperbarui dari sumber pembayaran server-side, bukan redirect browser.                       |
| FR-023 | Payment webhook              | P1            | Sistem harus menerima dan memproses webhook gateway secara idempotent.                                                   | Webhook duplikat tidak menggandakan transaksi atau mengubah entitlement secara salah.                         |
| FR-024 | Subscription account view    | P1            | Pengguna harus dapat melihat status langganan dan informasi tagihan yang tersedia.                                       | Status, tanggal, dan tindakan sesuai kontrak provider dan policy organisasi.                                  |
| FR-025 | Email notifications          | P1            | Sistem dapat mengirim email verifikasi, reset password, dan notifikasi transaksi sesuai fase.                            | Pengiriman melalui SMTP/provider transaksional; hasil gagal dicatat dan dapat diretry dengan aman.            |
| FR-026 | Download audit log           | P1            | Sistem dapat mencatat event unduhan file terbatas.                                                                       | Log memuat user, document, timestamp dan hasil sesuai kebijakan privasi.                                      |
| FR-027 | Bookmark / download history  | P2            | Sistem dapat menyediakan bookmark atau riwayat unduhan bila disetujui.                                                   | Data bersifat per-user dan dilindungi RLS.                                                                    |
| FR-028 | Newsletter integration       | P2            | Sistem dapat mengintegrasikan layanan newsletter eksternal.                                                              | Consent dan unsubscribe dikelola sesuai provider dan policy privasi.                                          |

# 4. Persyaratan akses dan otorisasi

## 4.1 Matriks akses konten

| **Resource / tindakan**      | **Anonim** | **Registered** | **Subscriber**         | **Editor**                  | **Admin** |
|------------------------------|------------|----------------|------------------------|-----------------------------|-----------|
| Membaca metadata publik      | Ya         | Ya             | Ya                     | Ya                          | Ya        |
| Membaca ringkasan publik     | Ya         | Ya             | Ya                     | Ya                          | Ya        |
| Download level public        | Ya         | Ya             | Ya                     | Ya                          | Ya        |
| Download level registered    | Tidak      | Ya             | Ya                     | Sesuai policy staf          | Ya        |
| Download level subscriber    | Tidak      | Tidak          | Jika entitlement aktif | Sesuai policy staf          | Ya        |
| Membuat/mengubah konten CMS  | Tidak      | Tidak          | Tidak                  | Ya                          | Ya        |
| Mengelola user staf/role     | Tidak      | Tidak          | Tidak                  | Tidak                       | Ya        |
| Memberi/mencabut entitlement | Tidak      | Tidak          | Tidak                  | Sesuai permission eksplisit | Ya        |

Akses staf untuk membaca/unduh dokumen eksklusif perlu policy eksplisit. Jangan menyimpulkan bahwa seluruh staf otomatis memiliki entitlement publik; gunakan akun publik terpisah atau grant yang tercatat bila kebutuhan operasional mengharuskannya.

## 4.2 Aturan otorisasi wajib

- Setiap route handler, server action, dan operasi sensitif harus memverifikasi sesi dan role di server; middleware dan conditional rendering hanya lapisan UX.

- Service role key hanya berada di server dan hanya digunakan setelah authorization check berhasil.

- Supabase RLS aktif untuk data pengguna umum seperti profile, entitlement yang dibaca user, bookmark, serta riwayat unduhan.

- Payload access control menjadi kontrol utama untuk koleksi CMS dan akun staf; jangan bergantung pada RLS Supabase untuk tabel yang diakses melalui koneksi Payload.

- Tidak boleh ada jalur self-service yang mengubah role akun publik menjadi Admin/Editor.

- Admin/staff perlu MFA bila tersedia dan area internal diberi noindex.

- Perubahan entitlement, role, dan file sensitif harus dapat ditelusuri melalui log yang sesuai kebijakan retensi.

## 4.3 Alur akses file privat

1.  Pengguna menekan aksi download pada halaman publikasi.

2.  Client memanggil endpoint server dengan identitas publikasi/file; client tidak mengirim keputusan akses yang dipercaya.

3.  Server membaca session Supabase yang valid (bila konten memerlukan login).

4.  Server mengambil access_level publikasi dari sumber konten yang terpercaya.

5.  Server mengecek entitlement pengguna dan status subscription/grant bila diperlukan.

6.  Jika memenuhi syarat, server menghasilkan signed URL dengan masa berlaku pendek dari private bucket.

7.  Jika tidak memenuhi syarat, server mengembalikan respons akses-terbatas yang konsisten dan UI menjelaskan langkah berikutnya.

8.  Keputusan akses dan event unduhan dicatat sesuai policy audit/privacy.

> **INVARIANT KEAMANAN**
>
> Tidak ada file subscriber yang boleh disajikan dari public bucket atau folder statis yang dapat ditebak. URL privat harus berumur pendek, dan endpoint tetap memverifikasi entitlement sebelum menerbitkannya.

# 5. Persyaratan data

## 5.1 Entitas konseptual

| **Entitas**           | **Atribut penting (konseptual)**                                                                                                                            | **Owner yang disarankan**   |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|
| Publication           | title, slug, summary/abstract, type, language, author relation, topic relation, published_at, access_level, status, cover, file reference, locale relation. | Payload                     |
| Author                | name, biography, photo (opsional), affiliation (jika perlu), locale/translation policy.                                                                     | Payload                     |
| Topic / Desk          | name, slug, description, ordering, locale/translation policy.                                                                                               | Payload                     |
| LearningResource      | title, description, type, topic, embed/external URL, thumbnail, publication relation (opsional).                                                            | Payload                     |
| Page                  | title, slug, body/blocks, locale, publication status, SEO fields.                                                                                           | Payload                     |
| StaffUser             | email, role, status, MFA policy.                                                                                                                            | Payload Auth                |
| PublicUser            | auth identity, profile fields, created_at, updated_at.                                                                                                      | Supabase Auth + app profile |
| Entitlement           | user_id, scope/publication_id or plan, source, valid_from, valid_until, status.                                                                             | Supabase                    |
| Subscription (fase 2) | user_id, provider, provider_reference, plan, status, current_period, cancellation/renewal metadata.                                                         | Supabase                    |
| DownloadLog           | user_id, publication/file_id, timestamp, result, request correlation.                                                                                       | Supabase                    |

Daftar di atas adalah model konseptual, bukan skema final. Field wajib, cardinality, translation relation, slug uniqueness, retention, dan migration ownership harus ditetapkan saat data design/ADR.

## 5.2 Kepemilikan skema dan migrasi

- Tetapkan boundary yang eksplisit antara tabel Payload dan tabel aplikasi Supabase agar tidak terjadi benturan nama atau migrasi silang.

- Jangan mengubah schema produksi secara manual melalui dashboard sebagai workflow normal; gunakan migration yang tersimpan di repository.

- Gunakan koneksi pooler untuk runtime bila sesuai dengan kebutuhan serverless dan koneksi direct untuk operasi migrasi yang membutuhkannya; validasi pada technical spike.

- Buat Supabase project terpisah untuk development, staging, dan production.

- Backup database dan uji restore harus menjadi bagian dari release readiness.

# 6. Persyaratan localization dan URL

- Bahasa target minimum adalah Indonesia (id) dan Inggris (en).

- URL publik harus memiliki locale prefix yang konsisten; struktur final slug diputuskan pada ADR routing.

- Halaman dengan versi terjemahan setara harus saling mereferensikan dan mengirim hreflang yang sesuai.

- Jika terjemahan belum tersedia, sistem tidak boleh menampilkan versi bahasa berbeda tanpa penanda atau aturan fallback yang jelas.

- Konten, navigasi, status, error, tanggal, dan angka mengikuti locale aktif.

- Pencarian harus jelas apakah hanya mencari locale aktif atau mencakup semua bahasa; pilihan awal disarankan locale aktif dan perlu diuji.

> **KEPUTUSAN WAJIB SEBELUM SCHEMA FINAL**
>
> Linked translation records vs field-level localization belum diputuskan pada sumber. Putuskan model tersebut sebelum implementasi koleksi Publication, Author, Topic, slug, dan search index.

# 7. Persyaratan pencarian dan pengindeksan

| **Area**           | **Persyaratan**                                                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Search source      | Minimum: title, summary/abstract, author, topic, type, dan locale. PDF full-text menjadi opsi setelah ekstraksi diuji.              |
| Search engine awal | PostgreSQL full-text search; pg_trgm untuk pencocokan parsial/fuzzy seperlunya.                                                     |
| Ranking            | Prioritaskan kecocokan judul dan istilah penting; strategi ranking final ditetapkan melalui pengujian dataset aktual.               |
| UX search          | Debounce input, dukung Enter, clear button, loading, no-result, error dan pencegahan stale response.                                |
| SEO                | Halaman publik menghasilkan HTML yang dapat dirender crawler; gunakan SSG/ISR bila sesuai, SSR untuk data yang memerlukan dinamika. |
| Social sharing     | Open Graph title, description, image, dan canonical disediakan per publikasi.                                                       |
| Indexing policy    | Area account/admin diberi noindex; metadata publikasi yang digate tetap dapat diindeks sesuai policy.                               |

# 8. Persyaratan file dan media

- Cover, image publik, dan file unduhan publik disimpan pada lokasi storage yang memang dapat diakses publik.

- PDF eksklusif disimpan pada private bucket; jangan pernah mengandalkan route tersembunyi atau nama file sulit ditebak sebagai kontrol akses.

- Upload memvalidasi MIME type, ekstensi, ukuran, status upload, dan metadata publikasi. Batas ukuran harus dikonfirmasi organisasi dan provider.

- Upload menggunakan storage adapter atau integrasi server-side sehingga file tidak ditulis ke filesystem ephemeral aplikasi.

- Video Learning Hub menggunakan embed/URL eksternal pada fase awal; tidak ada kebutuhan self-host video yang telah disahkan.

- File dapat dihapus/diarsip sesuai lifecycle konten dan kebijakan retensi, dengan perlindungan dari penghapusan tidak sengaja.

# 9. Persyaratan subscription dan pembayaran (fase lanjutan)

Subscription bukan prasyarat peluncuran MVP. Namun model entitlement harus cukup generik agar fase pembayaran tidak memerlukan perubahan besar pada aturan akses publikasi.

- Payment provider belum dipilih; Xendit dan Midtrans merupakan kandidat dalam diskusi, bukan keputusan final.

- Pemilihan gateway mempertimbangkan metode pembayaran yang relevan bagi pengguna Indonesia, recurring support, webhook, biaya, settlement, dokumentasi, dan persyaratan onboarding/legal.

- Webhook diverifikasi sesuai mekanisme provider, diproses idempotent, dan tidak mempercayai redirect browser sebagai bukti pembayaran.

- Perubahan status payment/subscription memutakhirkan entitlement secara server-side.

- Skenario uji mencakup sukses, gagal, pending, webhook duplikat, webhook terlambat, pembatalan, kedaluwarsa, perpanjangan, dan refund bila didukung policy.

- Aturan grace period, pembatalan, refund, perubahan plan, pajak, dan invoice merupakan keputusan bisnis/legal yang belum ditetapkan.

# 10. Persyaratan nonfungsional

| **ID**  | **Kategori**        | **Persyaratan**                                                                                                                                         |
|---------|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-001 | SEO & rendering     | Halaman publik harus menghasilkan metadata spesifik dan HTML awal yang dapat diindeks; pilih SSG/ISR/SSR sesuai sifat data.                             |
| NFR-002 | Performance         | Optimalkan Core Web Vitals, ukuran gambar, font loading, cache, pagination, dan query; target angka ditentukan setelah baseline dan pengukuran staging. |
| NFR-003 | Security            | Authorization server-side, secret server-only, RLS untuk data pengguna, access control CMS, storage private untuk file eksklusif.                       |
| NFR-004 | Availability        | Gunakan managed services dan monitoring; definisikan SLO/uptime target sebelum production SLA disepakati.                                               |
| NFR-005 | Scalability         | Desain query/index, cache, asset storage, dan search dapat ditingkatkan tanpa memindahkan seluruh aplikasi.                                             |
| NFR-006 | Accessibility       | Target WCAG 2.2 AA sebagai baseline desain dan implementasi; keyboard, focus, semantic HTML, contrast, dan form errors.                                 |
| NFR-007 | Responsive          | Mendukung mobile, tablet, dan desktop tanpa overflow tak disengaja; uji minimal viewport kecil dan desktop laptop.                                      |
| NFR-008 | Localization        | UI dan content schema mendukung ID/EN; layout tidak mengasumsikan panjang teks tetap.                                                                   |
| NFR-009 | Maintainability     | TypeScript, lint, test, migrations in version control, dokumentasi konfigurasi, dan boundary data yang eksplisit.                                       |
| NFR-010 | Observability       | Error monitoring, uptime monitoring, log yang aman, correlation untuk webhook/unduhan, dan alert sesuai risiko.                                         |
| NFR-011 | Backup & recovery   | Backup terjadwal sesuai tier layanan dan uji restore berkala; tetapkan RPO/RTO setelah kebutuhan bisnis diketahui.                                      |
| NFR-012 | Privacy             | Minimalkan data personal, dokumentasikan tujuan/consent/retention, dan siapkan mekanisme akses/penghapusan sesuai legal review.                         |
| NFR-013 | Content reliability | Draft tidak bocor ke publik; perubahan publish, localization, dan file reference harus konsisten.                                                       |
| NFR-014 | Session safety      | Tangani session expiry, unauthorized, forbidden, retry, dan redirect kembali ke tujuan secara aman.                                                     |

# 11. Deployment dan lingkungan

| **Lingkungan** | **Tujuan**                                                 | **Konfigurasi minimum**                                                                                                                    |
|----------------|------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Development    | Pengembangan lokal dan integrasi awal.                     | Next.js lokal; Supabase dev; data uji; secret terpisah; migration terbaru.                                                                 |
| Staging        | Validasi vertical slice, QA, editor trial, dan regression. | Deployment preview/staging yang menyerupai production; Supabase staging; dataset uji realistis; tidak memakai data sensitif tanpa kontrol. |
| Production     | Layanan publik.                                            | Vercel production + Supabase production; backup, monitoring, SMTP, domain/DNS, secrets, access roles, dan storage policy final.            |

- Gunakan GitHub sebagai source control dan CI; setiap perubahan melalui pull request/preview deployment bila workflow tim mendukung.

- Environment variable dibedakan tiap environment; secret tidak masuk repository atau client bundle.

- Konfigurasi domain tetap pada registrar/Hostinger; DNS diarahkan ke hosting aplikasi sesuai deployment setup.

- Vercel Pro + Supabase Pro menjadi rekomendasi diskusi untuk produksi komersial; biaya final dan batas penggunaan harus diverifikasi sebelum aktivasi.

- Hostinger shared/Web App Hosting atau VPS tidak dijadikan baseline produksi pada dokumen ini; dapat dievaluasi ulang melalui benchmark jika biaya mengharuskan.

# 12. Strategi pengujian

| **Jenis tes**     | **Cakupan minimum**                                                               | **Contoh verifikasi**                                                                                  |
|-------------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Unit              | Policy access, entitlement evaluator, utility locale/slug, schema validation.     | Anonymous cannot receive subscriber entitlement; expired entitlement returns deny.                     |
| Integration       | Payload + Postgres, Supabase Auth, Storage adapter, server route.                 | Create publication; upload private PDF; request download; server produces signed URL only after allow. |
| E2E               | Jalur publikasi, akun, gated download, dashboard.                                 | Editor publish; visitor reads summary; registered user is denied subscriber file; subscriber allowed.  |
| Security          | RLS, role boundary, secret exposure, object storage access, authorization bypass. | Direct private bucket URL denied; client cannot change role; service role key absent from client JS.   |
| SEO               | HTML metadata, sitemap, canonical, Open Graph, hreflang.                          | View source/metadata per locale and publication; crawlability check.                                   |
| Responsive & a11y | Keyboard, focus, contrast, form error, small viewport, zoom.                      | Navigable without mouse; focus visible; no clipped controls; content remains readable.                 |
| Recovery          | Backup restore, failed webhook retry, upload failure, session expiry.             | Restore to staging and verify data; duplicate webhook does not duplicate state transition.             |

## 12.1 Matriks pengujian akses minimum

| **Skenario**                            | **Visitor** | **Registered** | **Subscriber** | **Editor**   | **Admin** |
|-----------------------------------------|-------------|----------------|----------------|--------------|-----------|
| Public publication metadata             | Allow       | Allow          | Allow          | Allow        | Allow     |
| Public PDF download                     | Allow       | Allow          | Allow          | Policy-based | Allow     |
| Registered-only PDF                     | Deny        | Allow          | Allow          | Policy-based | Allow     |
| Subscriber PDF with active entitlement  | Deny        | Deny           | Allow          | Policy-based | Allow     |
| Subscriber PDF with expired entitlement | Deny        | Deny           | Deny           | Policy-based | Allow     |
| Open CMS editor                         | Deny        | Deny           | Deny           | Allow        | Allow     |
| Change staff role                       | Deny        | Deny           | Deny           | Deny         | Allow     |

# 13. Technical spike dan urutan implementasi

Implementasi tidak disarankan menggunakan pola backend-first sampai seluruh backend dianggap matang. Gunakan fondasi tipis lalu vertical slice yang menguji setiap aliran dari database sampai UI.

| **Tahap**                               | **Eksperimen / pekerjaan**                                                                         | **Exit criteria**                                                              |
|-----------------------------------------|----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Spike 1 — CMS + DB                      | Next.js + Payload + Supabase Postgres; buat satu koleksi Publication sederhana.                    | Build berhasil; create/read/update; migration dan runtime connection terbukti. |
| Spike 2 — Auth + role                   | Supabase Auth untuk akun publik; Payload auth untuk staf; test boundary.                           | User publik tidak dapat masuk admin; staff role terverifikasi di server.       |
| Spike 3 — Storage + gating              | Upload PDF ke private bucket; access level public/registered/subscriber; signed URL.               | Semua kasus allow/deny pada matriks akses berhasil.                            |
| Foundation                              | Repo, TypeScript, lint, test, CI, environment dev/staging/prod, locale route, logging, migrations. | Tim dapat membuat dan mengirim perubahan ke staging secara repeatable.         |
| Vertical slice 1: Publication           | CMS entry → list/detail SSR/SSG/ISR → SEO → search → public download.                              | Editor mencoba konten nyata; pengunjung dapat menemukan dan membaca publikasi. |
| Vertical slice 2: Account & entitlement | Registrasi/login → account view → manual grant → gated download.                                   | E2E access test lengkap dan security review awal lulus.                        |
| Vertical slice 3: Learning Hub          | Model konten → admin → catalog → detail/embed.                                                     | Konten pembelajaran dikelola editor dan bekerja di mobile.                     |
| Phase 2: Subscription                   | Sandbox payment → verified webhook → subscription state → entitlement → user account.              | Payment lifecycle, duplicate/late webhook, dan expiry diuji.                   |
| Release hardening                       | SEO, performance, a11y, backup/restore, monitoring, legal/privacy, migration/redirect.             | Checklist launch disetujui dan pemulihan terbukti.                             |

# 14. Kriteria penerimaan sistem MVP

9.  Next.js dapat dibuild dan dideploy ke staging dengan koneksi database yang stabil.

10. Payload dapat mengelola publikasi, penulis, topik, file, dan konten yang disepakati tanpa menyimpan upload permanen di filesystem aplikasi.

11. Halaman publik mendukung ID/EN sesuai model localization final, metadata SEO, dan social preview.

12. Pencarian publikasi berfungsi pada field minimum yang ditetapkan.

13. Supabase Auth mengelola akun umum; Payload mengelola akun staf dan role editorial.

14. Aturan access level public/registered/subscriber terimplementasi di server.

15. File private tidak dapat diakses langsung tanpa authorization; signed URL hanya dibuat setelah policy check.

16. RLS untuk data publik user aktif dan diuji; access control Payload untuk staff content aktif dan diuji.

17. Area akun dan admin memiliki noindex dan perlindungan route/operation di server.

18. Automated tests meliputi matriks akses; backup restore staging dan monitoring dasar telah diverifikasi.

# 15. Keputusan teknis yang masih terbuka

| **ID** | **Isu**                        | **Keputusan yang dibutuhkan**                                                                           |
|--------|--------------------------------|---------------------------------------------------------------------------------------------------------|
| T-01   | Payload + Supabase integration | Validasi versi Payload, adapter Postgres, connection pooling, migration workflow, dan schema ownership. |
| T-02   | Localization model             | Linked records atau field localization; slug dan fallback.                                              |
| T-03   | Storage adapter                | Pilih adapter/integrasi Supabase Storage dan strategi upload dari Payload.                              |
| T-04   | Search scope                   | Apakah PDF text extraction masuk MVP; definisi relevansi dan filter.                                    |
| T-05   | Subscription model             | Plan, status, period, grace period, cancel/refund, renewal, payment provider.                           |
| T-06   | Staff and public user identity | Apakah staf hanya memakai akun Payload atau perlu akses konten publik dengan akun Supabase terpisah.    |
| T-07   | Operational admin features     | Manajemen user, grant entitlement, analytics, finance; custom view Payload atau route internal.         |
| T-08   | Hosting and region             | Konfirmasi Vercel/Supabase plan, database region, egress, backup, dan total cost.                       |
| T-09   | Email and deliverability       | Provider SMTP, domain authentication, transactional templates, dan notification policy.                 |
| T-10   | Privacy/legal                  | Data fields, retention, user deletion, consent, publication rights, dan terms subscription.             |

# Glosarium

| **Istilah**        | **Definisi dalam konteks project**                                                                  |
|--------------------|-----------------------------------------------------------------------------------------------------|
| RLS                | Row Level Security pada PostgreSQL/Supabase untuk membatasi baris berdasarkan identitas dan policy. |
| SSR                | Server-Side Rendering; HTML dihasilkan pada request.                                                |
| SSG                | Static Site Generation; halaman dibuat saat build.                                                  |
| ISR                | Incremental Static Regeneration; halaman statis dapat diregenerasi.                                 |
| Webhook idempotent | Pemrosesan event yang aman terhadap pengiriman event yang sama lebih dari sekali.                   |
| MFA                | Multi-Factor Authentication untuk lapisan autentikasi tambahan.                                     |
| Noindex            | Instruksi agar halaman tertentu tidak dimasukkan ke indeks mesin pencari.                           |
