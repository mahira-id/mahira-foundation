**PRD / PRODUCT REQUIREMENTS DOCUMENT**

**Kebutuhan Produk & Ruang Lingkup**

Baseline kebutuhan produk untuk platform publikasi, Learning Hub, akun pengguna, dan pengelolaan internal.

| **Project**     | Mahira Indonesia Development (brand publik, DEC-001; nama legal TBD)           |
|-----------------|-----------------------------------------------------------------------|
| **Document ID** | PRD-MID                                                               |
| **Version**     | 0.1                                                                   |
| **Status**      | Baseline draft — untuk review dan penyelarasan                        |
| **Tanggal**     | 04 November 2026                                                      |
| **Bahasa**      | Indonesia; istilah teknis dipertahankan bila lebih presisi            |
| **Basis**       | Brief pengguna, mockup homepage, dan dokumen diskusi teknis terlampir |

> **STATUS DOKUMEN**
>
> Dokumen ini menetapkan baseline kebutuhan dan rekomendasi. Item yang belum diputuskan ditandai sebagai asumsi atau keputusan terbuka; jangan menganggapnya sebagai keputusan final sebelum disetujui pemilik produk.

# Kontrol dokumen

| **Item**           | **Keterangan**                                                           |
|--------------------|--------------------------------------------------------------------------|
| Pemilik dokumen    | Haidar (Product Owner)                    |
| Penyusun awal      | Product & Engineering working draft                                      |
| Status persetujuan | Belum disetujui; memerlukan validasi stakeholder                         |
| Perubahan utama    | Dokumen awal berdasarkan percakapan teknis dan arahan visual 04 Nov 2026 |
| Perubahan 2026-11-12 | Arahan Owner (DECISIONS §2.8): Learning Hub dan akun publik level `registered` masuk cakupan launch; entitlement subscriber dan pembayaran setelah launch (Phase 2). Diubah: §4, §6.2, §6.3, §7, §10, §12 D-04/D-06, §13, glosarium |
| Relasi dokumen     | PDD-MID untuk keputusan desain; SRS-MID untuk spesifikasi sistem         |

# 1. Ringkasan eksekutif

Mahira Indonesia Development (nama kerja) direncanakan sebagai platform digital organisasi yang menjadikan publikasi berbasis riset sebagai nilai utama. Platform menyediakan pengalaman penemuan dan pembacaan publikasi, Learning Hub untuk materi pembelajaran, area akun bagi pengguna umum, serta dashboard internal untuk mengelola konten dan operasi. Di tahap berikutnya, platform akan mendukung subscription agar dokumen tertentu dapat diakses secara eksklusif.

Produk harus mampu melayani dua kepentingan yang saling terkait: (1) publikasi perlu mudah ditemukan, dibaca ringkasannya, diindeks mesin pencari, dan dibagikan; (2) organisasi perlu mengelola konten, bahasa, aset, dan hak akses dengan proses editorial yang aman. Karena itu, kebutuhan SEO, CMS, model akses, dan bilingual harus dipertimbangkan sejak fondasi, bukan ditambahkan setelah frontend selesai.

> **PRODUCT THESIS**
>
> Publikasi adalah pintu masuk utama. Learning Hub memperluas nilai edukasi. Akun dan subscription memperdalam hubungan pengguna dengan konten eksklusif tanpa mengorbankan visibilitas metadata publikasi.

# 2. Latar belakang dan peluang

Dokumen diskusi yang dilampirkan menggunakan CIPS Indonesia dan CELIOS sebagai referensi konsep. Dari pembahasan tersebut, pola yang relevan adalah portal publikasi yang memiliki klasifikasi konten, topik atau desk isu, halaman detail, pencarian, pilihan bahasa, serta Learning Hub. Platform yang direncanakan menambahkan lapisan akun dan entitlement sehingga sebagian dokumen dapat dibatasi berdasarkan status pengguna.

- **Peluang editorial:** mengonsolidasikan publikasi dalam katalog yang terstruktur dan mudah dijelajahi.

- **Peluang distribusi:** menyediakan halaman detail yang SEO-friendly dan metadata sosial untuk setiap publikasi.

- **Peluang edukasi:** menempatkan materi pembelajaran dalam Learning Hub yang terhubung dengan isu/topik organisasi.

- **Peluang keberlanjutan:** membangun akses terdaftar dan subscription sebagai lapisan monetisasi di atas konten inti.

# 3. Visi, misi produk, dan prinsip

## 3.1 Visi

Menjadi pusat publikasi dan pembelajaran digital yang memudahkan masyarakat menemukan, memahami, dan mengakses pengetahuan serta hasil kerja organisasi.

## 3.2 Prinsip produk

- **Publication-first:** publikasi mendapat prioritas utama dalam struktur informasi, navigasi, konten homepage, dan SEO.

- **Editorial quality:** konten harus memiliki penulis, tanggal, topik, ringkasan, status editorial, dan aset yang dikelola secara konsisten.

- **Public discovery, controlled access:** informasi pengenal dan ringkasan dokumen tetap terbuka; file penuh mengikuti aturan akses yang transparan.

- **Bilingual-ready:** struktur data dan URL harus mendukung Indonesia dan Inggris tanpa memaksa terjemahan yang belum tersedia.

- **Operationally manageable:** staf non-teknis perlu dapat mengelola konten tanpa menyentuh codebase.

- **Iterative delivery:** fitur dibangun sebagai vertical slice dari database sampai UI, bukan backend yang dianggap selesai sebelum dipakai pengguna.

# 4. Tujuan dan indikator keberhasilan

| **Tujuan**               | **Indikator yang disarankan**                                                                                   | **Catatan pengukuran**                                           |
|--------------------------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Penemuan publikasi       | Halaman publikasi terindeks; pencarian menghasilkan hasil relevan; pengguna membuka detail dari listing/search. | Baseline analytics dan definisi event perlu disepakati.          |
| Kualitas pengalaman baca | Pengguna dapat memahami metadata, abstrak/ringkasan, dan status akses sebelum mengunduh.                        | Uji tugas dengan pengguna; validasi pada mobile dan desktop.     |
| Efisiensi editorial      | Editor dapat membuat draft, memperbarui metadata, mengelola aset, preview, dan menerbitkan konten.              | Ukur waktu tugas dan error editorial; tetapkan setelah uji coba. |
| Kontrol akses            | Dokumen yang dibatasi tidak dapat diunduh tanpa entitlement yang sesuai.                                        | Uji otomatis untuk anonim, terdaftar, subscriber, dan staf.      |
| Kesiapan subscription    | Entitlement dan data langganan dapat diperkenalkan tanpa mengubah model publikasi inti.                         | Pembayaran dan entitlement subscriber setelah launch (Phase 2, M7). |

> **CATATAN KPI**
>
> Angka target belum ditetapkan karena belum ada baseline traffic, volume publikasi, ukuran tim editorial, atau model bisnis final. Tentukan target setelah instrumentasi dan pilot konten nyata.

# 5. Pengguna sasaran dan kebutuhan

| **Segmen pengguna**               | **Kebutuhan utama**                                                                          | **Outcome yang diharapkan**                                       |
|-----------------------------------|----------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Pembaca umum / publik             | Menemukan publikasi berdasarkan topik, jenis, atau kata kunci; memahami ringkasan dan akses. | Dapat menilai relevansi publikasi sebelum membuka atau mengunduh. |
| Mahasiswa / pendidik / pembelajar | Menemukan kelas, video, playlist, atau bahan belajar yang relevan.                           | Memperoleh materi pembelajaran yang tersusun dan mudah diakses.   |
| Pengguna terdaftar                | Mengelola profil dan mengakses konten yang memerlukan akun.                                  | Memiliki identitas pengguna dan status akses yang jelas.          |
| Subscriber (fase lanjutan)        | Mengakses publikasi eksklusif serta memahami status langganan.                               | Mendapat akses sesuai masa aktif entitlement.                     |
| Penulis / kontributor             | Memiliki atribusi dan metadata publikasi yang benar.                                         | Kontribusi dapat ditemukan dan direferensikan.                    |
| Editor / reviewer                 | Mengelola draft, metadata, terjemahan, media, review, dan publikasi.                         | Konten terbit secara konsisten melalui proses editorial.          |
| Admin organisasi                  | Mengelola pengguna staf, konfigurasi, dan kebijakan akses.                                   | Operasi internal dapat diaudit dan dikendalikan.                  |

Catatan: segmen mahasiswa/pendidik berasal dari referensi Learning Hub pada dokumen diskusi; persona dan kebutuhan aktual perlu diverifikasi dengan stakeholder dan calon pengguna.

# 6. Ruang lingkup produk

## 6.1 Area publik

- **Homepage:** identitas organisasi, proposisi nilai, publikasi unggulan/terbaru, topik atau desk, Learning Hub, dan ajakan bergabung/berkolaborasi.

- **Publication index:** daftar publikasi dengan pencarian, filter, kategori/jenis, topik, dan pagination atau pola pemuatan bertahap.

- **Publication detail:** judul, ringkasan, metadata, penulis, topik, tanggal, bahasa, status akses, file/tautan unduh, dan publikasi terkait.

- **About:** informasi organisasi, fokus kerja, tim, kolaborasi, dan kontak; isi final perlu diberikan organisasi.

- **SEO & sharing:** metadata halaman, canonical, sitemap, robots, Open Graph, dan URL yang stabil.

## 6.2 Learning Hub

- **Cakupan launch (DEC-014; DECISIONS §2.8 Q2 A):** Learning Hub wajib tersedia saat launch dengan katalog per tema, embed video/playlist YouTube, panduan, dan toolkit yang dapat diunduh publik. Semua materi dapat diakses tanpa login.

- **Referensi struktur:** https://www.cips-indonesia.org/cips-learning-hub, hanya sebagai referensi struktur; identitas dan aset CIPS tidak disalin.

- **Materi video:** prioritaskan embed dari YouTube atau sumber video eksternal; jangan mengasumsikan kebutuhan video hosting sendiri.

- **Di luar cakupan launch:** login untuk materi, progress tracking, kuis, sertifikat, kelas berbayar, dan LMS penuh.

- **OPEN (M3-11):** model konten dan jenis materi, relasi ke Topic/"Bidang kerja", model bilingual, route, penyimpanan file toolkit, serta halaman detail per materi vs embed langsung di katalog.

## 6.3 Area akun pengguna

- **Cakupan launch (DECISIONS §2.8 Q1 A, M5):** registrasi, login, logout, reset password, verifikasi email, area akun minimal, dan unduhan file level `registered` setelah cek sesi di server. Status subscription, entitlement subscriber, dan pembayaran masuk Phase 2 (M7).

- **Autentikasi:** registrasi, login, logout, reset password, dan verifikasi email sesuai kebijakan.

- **Profil:** informasi akun dan preferensi dasar.

- **Akses:** status registrasi/subscription dan penjelasan kenapa suatu dokumen terkunci.

- **Fitur opsional:** bookmark, riwayat unduhan, preferensi notifikasi; belum dikunci sebagai MVP.

## 6.4 Dashboard internal

- **Editorial CMS:** publikasi, penulis, topik, halaman, event, konten Learning Hub, bahasa, media, draft, preview, review, dan jadwal terbit.

- **Operasi non-editorial:** manajemen pengguna/entitlement dan analitik dapat ditambahkan sebagai custom view setelah kebutuhan nyata terpetakan.

- **Peran staf:** minimum Admin dan Editor. Reviewer atau Finance bersifat opsional sesuai proses organisasi.

- **Pemisahan identitas:** akun staf dikelola melalui Payload; akun umum melalui Supabase Auth. Registrasi publik tidak boleh mengangkat pengguna menjadi staf.

# 7. Prioritas dan rencana rilis

| **Fase**                          | **Cakupan**                                                                                                                          | **Prioritas / kriteria selesai**                                                                          |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Persiapan & technical spike       | Inventaris konten, user story, matriks akses, keputusan bilingual, wireframe; uji Next.js + Payload + Supabase + satu PDF gated.     | Gate sebelum implementasi penuh: koneksi DB, auth, upload/storage, build, dan gating berhasil dibuktikan. |
| MVP — Publication platform        | Situs publik bilingual-ready, CMS/admin editorial, katalog dan detail publikasi, metadata SEO, search dasar, file publik, role staf. | Editor dapat menerbitkan publikasi nyata; halaman dapat ditemukan dan dibagikan; staging dapat didemokan. |
| Learning Hub (pra-launch, M3-11–M3-13) | Katalog per tema, embed video/playlist YouTube, panduan, toolkit unduhan publik; tanpa login, progress, kuis, sertifikat (DEC-014). Detail model, route, dan storage toolkit OPEN (M3-11). | AC 9 lulus di staging.                                                                                    |
| Akses pengguna publik (pra-launch, M5, level `registered`) | Registrasi/login/logout/reset, verifikasi email (DEC-019), area akun minimal, evaluator akses server-side, unduhan file `registered` lewat private bucket dengan signed URL (DECISIONS §2.8 Q1 A). | Matriks akses kolom Visitor/Registered/Editor/Admin teruji otomatis; file privat tidak bocor; AC 5, 6 (file `registered`), 10 lulus. |
| Launch hardening (M4)             | Performance, accessibility, security review, backup restore, monitoring, privacy/legal readiness, content migration.                 | Checklist rilis dan pemulihan teruji; AC 8 lulus; rilis produksi 1.0.0.                                   |
| Expansion pasca-launch (M6)       | Event, newsletter, form jaringan dosen (DECISIONS §2.8 Q3 A), bookmark/riwayat/analitik sesuai prioritas.                            | Fitur didorong kebutuhan penggunaan aktual.                                                               |
| Phase 2 — Subscription pasca-launch (M7) | Entitlement manual subscriber, file subscriber, payment gateway, webhook idempotent, status subscription, tagihan, perpanjangan dan pembatalan. | Uji sukses/gagal bayar, webhook duplikat, kedaluwarsa, dan perubahan entitlement; kolom subscriber matriks akses teruji. |

Urutan baris di atas adalah urutan eksekusi sejak 2026-11-12 (DECISIONS §2.8): M0–M2 → M3 → M5 → M4 (launch) → M6 / M7.

# 8. Model akses konten

Setiap publikasi perlu memiliki access_level sejak model data awal, walaupun pembayaran belum hadir. Akses terhadap metadata dan akses terhadap file penuh adalah dua hal yang berbeda.

| **Level**  | **Anonim**                                     | **Pengguna terdaftar**                       | **Subscriber**                        |
|------------|------------------------------------------------|----------------------------------------------|---------------------------------------|
| Publik     | Metadata, ringkasan, file penuh dapat diakses. | Akses penuh.                                 | Akses penuh.                          |
| Terdaftar  | Metadata dan ringkasan; file penuh terkunci.   | Akses penuh.                                 | Akses penuh.                          |
| Subscriber | Metadata dan ringkasan; file penuh terkunci.   | Metadata dan ringkasan; file penuh terkunci. | Akses penuh selama entitlement aktif. |

- **Metadata tetap publik:** judul, abstrak/ringkasan, penulis, tanggal, topik, dan deskripsi akses tetap tersedia untuk SEO dan discovery.

- **File eksklusif:** disimpan di private bucket; server memverifikasi sesi dan entitlement lalu menerbitkan signed URL berumur pendek.

- **Tidak cukup menyembunyikan tombol:** semua download endpoint wajib memvalidasi akses di server dan tidak mempercayai parameter dari browser.

# 9. Bilingual, navigasi, dan pencarian

Target bahasa yang dibahas adalah Bahasa Indonesia dan Bahasa Inggris, dengan URL locale terpisah seperti /id dan /en. Pola penyimpanan terjemahan belum diputuskan: entri publikasi terpisah yang saling terhubung atau field-level localization. Keputusan ini harus dibuat sebelum finalisasi skema konten, slug, dan pencarian.

- **Routing:** rute ber-prefix locale dan hreflang untuk halaman yang memiliki pasangan terjemahan.

- **Fallback:** jangan menampilkan konten dalam bahasa yang salah tanpa penanda. Tentukan apakah locale yang belum tersedia diarahkan ke bahasa default atau menampilkan pesan eksplisit.

- **Search MVP:** Postgres full-text search dan pg_trgm; evaluasi Meilisearch/Typesense bila skala atau relevansi menuntut.

- **PDF search:** ekstraksi teks PDF saat upload dapat dipertimbangkan untuk pencarian isi dokumen; perlu validasi kualitas ekstraksi dan biaya.

# 10. Batasan dan non-goals

- **Bukan LMS penuh saat launch:** belum mencakup progress tracking, sertifikasi, kelas berbayar, penilaian kompleks, atau learning path adaptif (DEC-014).

- **Bukan sistem pembayaran saat launch:** subscription dan entitlement subscriber setelah launch (Phase 2, M7); model akses tetap menyiapkan level `subscriber`.

- **Bukan SPA murni untuk seluruh situs:** halaman publik memerlukan HTML yang siap diindeks dan metadata unik per halaman.

- **Bukan dua aplikasi terpisah secara default:** dashboard dan situs publik berada dalam satu aplikasi Next.js sampai ada alasan operasional atau keamanan yang kuat untuk memisahkan.

- **Bukan pengganti proses legal/editorial:** kebijakan publikasi, hak cipta, disclaimer riset, privasi, dan aturan subscription harus ditetapkan organisasi.

# 11. Risiko, dependensi, dan mitigasi

| **Risiko / dependensi**               | **Dampak**                                                   | **Mitigasi awal**                                                                                            |
|---------------------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Integrasi Payload + Supabase Postgres | Kompleksitas database dan dua model kontrol akses.           | Technical spike; tentukan ownership tabel; Payload access control untuk koleksinya; RLS untuk data Supabase. |
| Gating dokumen                        | Kebocoran file eksklusif berdampak reputasi dan pendapatan.  | Private bucket, server-side authorization, signed URL singkat, tes otomatis matriks akses.                   |
| Model bilingual belum diputuskan      | Migrasi konten/URL mahal jika diubah belakangan.             | ADR bilingual sebelum final schema dan proses migrasi.                                                       |
| Media pada hosting serverless         | File lokal dapat hilang atau tidak tersedia lintas instance. | Gunakan Supabase Storage atau object storage; jangan mengandalkan filesystem aplikasi.                       |
| Pengelola non-teknis                  | CMS yang terlalu teknis menurunkan adopsi.                   | Uji workflow dengan calon editor dan konten nyata sejak slice publikasi pertama.                             |
| Subscription/payment provider         | Status pembayaran dan entitlement dapat tidak sinkron.       | Pilih gateway setelah validasi legalitas; webhook idempotent; rekonsiliasi status.                           |
| Privasi dan data pengguna             | Risiko kepatuhan dan kepercayaan.                            | Minimalkan data, siapkan consent/privacy policy, retention dan penghapusan; review legal.                    |

# 12. Keputusan terbuka yang perlu disahkan

| **ID** | **Keputusan**                   | **Rekomendasi baseline / pihak yang perlu mengesahkan**                                                                         |
|--------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| D-01   | Nama dan identitas organisasi   | Konfirmasi apakah “Mahira Indonesia Development” adalah nama resmi, brand, atau placeholder.                                    |
| D-02   | Bidang/desk riset dan taksonomi | Tetapkan topik utama, jenis publikasi, serta hubungan antara topic, desk, dan category.                                         |
| D-03   | Strategi bilingual              | Pilih linked translation entries atau field-level localization; putuskan fallback dan siapa pemilik review terjemahan.          |
| D-04   | Konten Learning Hub             | Diputuskan untuk cakupan launch: DEC-014 (DECISIONS §2.8 Q2 A); model konten, route, storage toolkit OPEN (M3-11).          |
| D-05   | Proses editorial                | Tetapkan apakah ada reviewer/approval, jadwal publikasi, dan aturan revisi setelah publish.                                     |
| D-06   | Kebijakan akses                 | Definisikan konten mana yang publik, perlu akun, dan subscriber; mekanisme pemberian akses manual. Level `registered` saat launch, `subscriber` Phase 2 (DECISIONS §2.8 Q1 A). |
| D-07   | Pengelola dan role              | Konfirmasi jumlah editor/admin dan apakah diperlukan role Reviewer/Finance.                                                     |
| D-08   | Skema subscription              | Harga, durasi, recurring vs manual renewal, masa tenggang, pembatalan, refund, dan gateway belum ditetapkan.                    |
| D-09   | CMS custom vs Payload           | Payload menjadi baseline karena kebutuhan editorial; admin custom dapat dipertimbangkan bila editor tunggal dan konten sedikit. |
| D-10   | Infrastruktur final             | Vercel Pro + Supabase Pro adalah rekomendasi dari diskusi; validasi biaya, billing, region, dan hasil spike sebelum komitmen.   |

# 13. Kriteria penerimaan produk saat launch

Pemetaan fase (DECISIONS §2.8): AC 1–4 dan 7 = MVP publikasi (M3); AC 9 = Learning Hub (M3-11–M3-13); AC 5, bagian `registered` AC 6, dan AC 10 = akun publik (M5); AC 8 = launch (M4); bagian subscriber AC 6 = Phase 2 (M7).

> **1.** Pengunjung anonim dapat menemukan katalog publikasi, membuka halaman detail, membaca ringkasan, dan memahami aturan akses.
>
> **2.** Halaman detail publikasi memiliki metadata SEO dan social sharing yang unik, serta URL yang stabil.
>
> **3.** Editor dapat membuat draft, mengelola metadata dan aset, melakukan preview, dan menerbitkan publikasi melalui dashboard.
>
> **4.** Sistem mendukung konten ID/EN sesuai strategi localization yang telah disahkan.
>
> **5.** *(Launch, M5; DECISIONS §2.8 Q1 A)* Pengguna dapat mendaftar dan login; konten terdaftar dapat dibedakan dari konten subscriber.
>
> **6.** *(File `registered`: launch, M5; file subscriber: Phase 2, M7)* File eksklusif hanya diberikan setelah pemeriksaan sesi dan entitlement di sisi server.
>
> **7.** Peran admin dan editor terpisah; registrasi publik tidak dapat memperoleh hak Editor/Admin (DEC-009).
>
> **8.** Build dan deployment staging berhasil; pengujian akses dasar dan restore backup telah dijalankan sebelum peluncuran.
>
> **9.** *(Launch, M3-11–M3-13; DEC-014)* Pengunjung tanpa login dapat menjelajah katalog Learning Hub per tema, memutar video/playlist YouTube yang di-embed, membaca panduan, dan mengunduh toolkit publik; tidak ada login, progress, kuis, atau sertifikat.
>
> **10.** *(Launch, M5; DECISIONS §2.8 Q1 A)* Pengguna terdaftar dapat memverifikasi email, mereset password, melihat area akun minimal, dan mengunduh file `registered` setelah cek sesi di server; pengunjung anonim ditolak; registrasi tidak memberi hak staf (DEC-009).

# Glosarium

| **Istilah**    | **Definisi dalam konteks project**                                           |
|----------------|------------------------------------------------------------------------------|
| Entitlement    | Hak akses efektif pengguna terhadap suatu konten atau kelompok konten.       |
| Access level   | Klasifikasi akses pada publikasi: public, registered, subscriber.            |
| CMS            | Sistem untuk membuat, mengelola, meninjau, dan menerbitkan konten.           |
| Learning Hub   | Area katalog materi pembelajaran. Cakupan launch (DEC-014): katalog per tema, embed video/playlist YouTube, panduan, toolkit unduhan publik; LMS penuh tidak termasuk. |
| Vertical slice | Implementasi fitur utuh dari data/backend sampai tampilan yang dapat diuji.  |
| MVP            | Rilis minimum yang memvalidasi nilai utama publikasi dan workflow editorial. |
| Launch         | Rilis produksi 1.0.0 (M4-05) = MVP publikasi + Learning Hub + akun publik level `registered` (DECISIONS §2.8). |
| MVP+           | Label lama DEC-002. Sejak 2026-11-12: bagian `registered` pra-launch (M5) dan bagian subscriber Phase 2 (M7) (DECISIONS §2.8). |
