**PDD / PRODUCT DESIGN DOCUMENT**

**Arah Desain Produk & Pengalaman Pengguna**

Kontrak arah visual, prinsip editorial, sistem desain awal, serta pola pengalaman untuk situs publik dan permukaan produk terautentikasi.

| **Project**     | Mahira Indonesia Development (nama kerja, perlu konfirmasi)           |
|-----------------|-----------------------------------------------------------------------|
| **Document ID** | PDD-MID                                                               |
| **Version**     | 0.1                                                                   |
| **Status**      | Baseline draft — untuk review dan penyelarasan                        |
| **Tanggal**     | 04 November 2026                                                      |
| **Bahasa**      | Indonesia; istilah teknis dipertahankan bila lebih presisi            |
| **Basis**       | Brief pengguna, mockup homepage, dan dokumen diskusi teknis terlampir |

> **STATUS DOKUMEN**
>
> Dokumen ini menetapkan baseline kebutuhan dan rekomendasi. Item yang belum diputuskan ditandai sebagai asumsi atau keputusan terbuka; jangan menganggapnya sebagai keputusan final sebelum disetujui pemilik produk.

# Kontrol dokumen

| **Item**         | **Keterangan**                                                                                                                 |
|------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Definisi PDD     | Product Design Document — digunakan di sini untuk mendokumentasikan arah visual dan UX produk.                                 |
| Pemilik desain   | Product / Design Lead — belum ditentukan                                                                                       |
| Status           | Baseline visual dan UX; bukan final pixel specification                                                                        |
| Referensi visual | Mockup homepage yang diunggah pengguna                                                                                         |
| Referensi konsep | CIPS Indonesia dan CELIOS disebut sebagai referensi struktur pada dokumen diskusi; bukan acuan untuk menyalin identitas visual |

# 1. Design thesis

> **CREATIVE NORTH STAR**
>
> Sebuah ruang editorial lembaga riset: tegas seperti masthead publikasi, terstruktur seperti indeks pengetahuan, dan tenang seperti ruang baca. Identitas biru memimpin; isi riset menjadi elemen visual utama.

Desain tidak boleh terasa seperti dashboard SaaS yang ditempelkan ke website organisasi, atau template landing page dengan pola kartu yang berulang. Situs publik memakai register editorial-institutional. Area akun dan dashboard internal memakai register produk: lebih padat, konsisten, dan berorientasi tugas, tetapi tetap membawa warna dan tipografi brand yang sama.

## 1.1 Satu identitas, tiga register

| **Permukaan**      | **Register desain**       | **Prioritas visual dan UX**                                                                      |
|--------------------|---------------------------|--------------------------------------------------------------------------------------------------|
| Situs publik       | Editorial / institutional | Hierarki judul, kurasi publikasi, taksonomi, metadata, keterbacaan dan discovery.                |
| Area akun          | Product / service         | Status akses, profil, subscription, riwayat, tindakan yang jelas, dan pesan kondisi akun.        |
| Dashboard internal | Editorial operations      | Kepadatan data yang terkontrol, filter, tabel, workflow draft/review/publish, dan kontrol akses. |

# 2. Review mockup yang diunggah

## 2.1 Elemen yang dipertahankan

- **Warna hero:** bidang biru penuh selaras dengan primary brand \#1E6FB7 dan memberi identitas institusional yang mudah dikenali.

- **Wordmark dan nama organisasi:** logo berada di kiri atas; nama organisasi menjadi headline utama sehingga hierarki brand langsung terbaca.

- **Navigasi ringkas:** Home, Publication, Learning Hub, About memberi jalur utama yang mudah dipahami.

- **Kontras:** teks putih di atas biru memudahkan pembacaan headline dan navigasi.

- **Garis transisi:** strip biru muda di bawah hero dapat dipertahankan sebagai pemisah identitas, jika menjadi elemen sistem yang konsisten.

## 2.2 Hal yang perlu diperbaiki sebelum dianggap final

| **Temuan**                                                         | **Risiko**                                                           | **Arahan desain**                                                                                                                        |
|--------------------------------------------------------------------|----------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Hero mengambil hampir seluruh perhatian pertama.                   | Pengunjung belum melihat bukti nilai publikasi atau konten nyata.    | Pertahankan headline, tetapi tempatkan preview publikasi unggulan/terbaru tepat setelah hero.                                            |
| Statistik 100+, 12, 6 belum memiliki sumber data yang ditunjukkan. | Angka dapat terbaca sebagai klaim organisasi yang belum tervalidasi. | Tampilkan hanya jika berasal dari CMS/analytics yang sah; jika belum, ganti dengan pernyataan nilai atau konten unggulan.                |
| CTA “Join with Us” masih umum.                                     | Aksi dan tujuan tidak jelas.                                         | Gunakan label yang spesifik setelah jalur bisnis disahkan, misalnya “Bergabung sebagai kontributor” atau “Jelajahi kolaborasi”.          |
| Navigasi berbahasa Inggris, konten belum didefinisikan bilingual.  | Pengalaman bahasa tidak konsisten.                                   | Sediakan language switcher ID/EN dan perilaku fallback yang jelas.                                                                       |
| Area putih di bawah hero masih kosong.                             | Mockup belum menunjukkan sistem editorial dan ritme konten.          | Gunakan sebagai awal katalog publikasi, topik/desk, dan Learning Hub; jangan menambah dekorasi tanpa informasi.                          |
| H1 sangat besar dan uppercase.                                     | Pada layar kecil dapat memakan viewport dan menekan konten utama.    | Pertahankan skala display desktop, tetapi gunakan responsive clamp, line-wrap yang disengaja, dan ukuran mobile yang lebih proporsional. |

# 3. Prinsip desain yang wajib dijaga

- **Konten adalah visual:** cover publikasi, judul riset, abstrak, topik, penulis, dan tanggal harus menjadi bahan komposisi utama.

- **Hierarki sebelum dekorasi:** ukuran teks, ruang, garis, dan posisi harus membantu pembaca memahami struktur; bukan sekadar menambah ornamen.

- **Ragam layout yang terarah:** jangan menampilkan setiap section sebagai grid tiga kartu identik. Gunakan daftar editorial, feature spread, indeks topik, dan blok konten sesuai sifat informasi.

- **Aksen terbatas:** blue menjadi identitas dominan; orange dan green digunakan hemat dengan makna yang konsisten.

- **Permukaan terang:** light theme menjadi default; putih adalah kanvas utama, silver adalah lapisan bantu.

- **Kerapian operasional:** dashboard boleh padat tetapi bukan sempit; kolom, filter, dan status harus bisa dipindai.

- **Gerak seperlunya:** animasi hanya untuk feedback, transisi konteks, atau reveal konten yang bermanfaat; hormati reduced motion.

# 4. Sistem warna

| **Token / warna** | **Nilai** | **Peran**                                                    | **Aturan penggunaan**                                                                                                                                                |
|-------------------|-----------|--------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Primary Blue      | \#1E6FB7  | Identitas brand, CTA utama, link dan elemen navigasi aktif.  | Warna utama. Gunakan turunan terang/gelap untuk state, surface tint, dan hierarchy; jangan mengganti warna dasar brand.                                              |
| Orange            | \#FF6A00  | Aksen identitas dan penekanan terbatas.                      | Jangan gunakan sebagai teks kecil di atas putih; kontrasnya sekitar 2.87:1. Gunakan pada marker, garis, ikon berukuran memadai, atau bidang dengan foreground gelap. |
| Green             | \#1B684C  | Aksen logo dan status positif bila relevan.                  | Bisa digunakan untuk status sukses dengan label teks; hindari makna dekoratif yang tidak konsisten.                                                                  |
| Silver            | \#EDEDED  | Surface sekunder, background grup, pemisah visual.           | Bukan warna teks di atas putih; gunakan untuk area permukaan yang terkontrol.                                                                                        |
| Dark Silver       | \#848484  | Border, ikon sekunder, disabled, metadata yang tidak kritis. | Kontras sekitar 3.74:1 di atas putih; jangan gunakan untuk body copy kecil. Gunakan \#101010 atau turunan neutral yang lebih gelap untuk teks sekunder penting.      |
| Black             | \#101010  | Teks utama dan ikon penting.                                 | Warna default teks di atas putih/silver; menjaga kontras tinggi.                                                                                                     |
| White             | \#FFFFFF  | Kanvas utama dan teks di atas primary.                       | Background default light theme dan foreground pada bidang biru.                                                                                                      |

Catatan kontras: perhitungan indikatif terhadap putih menggunakan relative luminance menghasilkan Blue 5.23:1, Green 6.71:1, Orange 2.87:1, Dark Silver 3.74:1, dan Black 19.03:1. Kontras harus diuji ulang pada kombinasi warna aktual, ukuran font, state, dan komponen akhir; angka ini bukan pengganti audit aksesibilitas.

## 4.1 Turunan primary blue

Turunan primary dapat dibuat sebagai ramp token dari tint sangat terang sampai shade gelap. Gunakan tint untuk hero transition, surface selection, hover dan background callout; gunakan shade gelap untuk active/pressed atau teks/link pada area terang. Nilai turunan final ditetapkan melalui token design system dan diuji kontrasnya, bukan dipilih secara acak per komponen.

- **Primary 50–100:** surface lembut, highlight area, selected row, atau panel informasi.

- **Primary 200–300:** border beraksen, divider khusus, dan hover lembut.

- **Primary 500:** brand primary \#1E6FB7.

- **Primary 600–800:** hover/active yang lebih dalam dan teks link saat background tidak biru.

- **Primary 900:** shade gelap untuk konteks terbatas, bukan pengganti warna utama brand.

# 5. Tipografi

Satu keluarga font digunakan pada seluruh antarmuka: Hanken Grotesk. Tidak ada pasangan display serif, monospace, atau secondary family untuk heading/body. Karakter visual dibentuk melalui ukuran, weight, line-height, letter spacing, dan lebar kolom.

| **Peran**           | **Weight yang disarankan** | **Arahan**                                                                                              |
|---------------------|----------------------------|---------------------------------------------------------------------------------------------------------|
| Display / hero      | 700–800                    | Besar, rapat, dapat uppercase untuk brand statement; jangan memakai uppercase pada semua judul section. |
| Page title          | 700                        | Judul halaman utama, singkat dan informatif.                                                            |
| Section heading     | 600–700                    | Membagi struktur konten; gunakan sentence case.                                                         |
| Body / long-form    | 400–500                    | Line-height sekitar 1.55–1.7; lebar baris nyaman untuk membaca esai dan abstrak.                        |
| Navigation / button | 600                        | Label ringkas, konsisten, tidak terlalu padat.                                                          |
| Metadata / caption  | 400–500                    | Ukuran lebih kecil tetapi tetap terbaca; jangan memakai \#848484 untuk teks kecil yang penting.         |
| Numbers / metrics   | 700                        | Pakai angka tabular bila tersedia; angka harus punya konteks dan sumber.                                |

> **ATURAN FONT**
>
> Semua komponen memakai Hanken Grotesk. Siapkan fallback sistem yang netral untuk kondisi font gagal dimuat, tetapi jangan menjadikan fallback sebagai keluarga desain kedua. Pastikan font subset dan weight yang dipakai dimuat dengan benar agar tidak terjadi layout shift.

# 6. Layout, grid, dan density

## 6.1 Situs publik

- **Container:** gunakan max-width konsisten yang cukup lebar untuk katalog dan artikel; hero dapat lebih luas daripada body long-form.

- **Grid:** desktop dapat menggunakan 12-column logic; tablet menyederhanakan menjadi 8/6 kolom dan mobile menjadi satu kolom utama.

- **Reading measure:** artikel, abstrak, dan deskripsi panjang dibatasi lebar bacanya; jangan memanjangkan baris sampai selebar viewport.

- **Editorial rhythm:** variasikan komposisi antara feature publication, list/index, topic directory, dan learning resources.

- **Whitespace:** gunakan ruang untuk mengelompokkan informasi; bukan membuat bagian kosong yang tidak punya fungsi.

## 6.2 Area akun dan dashboard

- **Account:** ringkas; status subscription/entitlement dan tindakan utama harus terlihat tanpa visual yang berlebihan.

- **Dashboard:** sidebar atau top navigation yang stabil, page title, contextual action, filter dan table/list. Hindari hero besar di ruang kerja.

- **Table:** header, sorting, filtering, pagination, empty, loading, no-results, dan error harus dirancang sebagai state, bukan ditambahkan setelahnya.

- **Responsive:** tabel kompleks dapat bergeser menjadi row cards atau horizontal scroll terkontrol; jangan memotong aksi penting.

## 6.3 Spacing dan shape

Gunakan rhythm spacing yang konsisten dan terdokumentasi (misalnya token kecil, sedang, besar, dan jarak section) sebelum implementasi. Radius komponen relatif kecil dan utilitarian: sudut 0–8 px sebagai default awal; pill hanya untuk label/status bila membantu scanning. Shadow bukan alat utama hierarchy; utamakan background, garis, dan tipografi.

# 7. Arah komposisi halaman utama

| **Urutan blok**            | **Tujuan**                                               | **Perlakuan visual**                                                                                              |
|----------------------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| Masthead / navigation      | Menampilkan logo, jalur navigasi utama, bahasa, dan CTA. | Sederhana, background yang konsisten dengan hero atau header putih saat scroll; jangan menambah banyak item.      |
| Hero thesis                | Menjelaskan identitas dan fokus organisasi.              | Biru primary, headline besar, copy pendukung singkat, satu CTA utama yang jelas.                                  |
| Publication lead           | Menunjukkan bukti nilai inti melalui publikasi nyata.    | Satu publikasi unggulan dengan cover, tipe, topik, tanggal, judul, abstrak ringkas.                               |
| Latest / publication index | Mengundang eksplorasi konten.                            | List editorial atau layout campuran; berikan jalur ke seluruh katalog.                                            |
| Topics / research desks    | Mengelompokkan pengetahuan.                              | Index topik dengan deskripsi singkat dan jumlah konten hanya jika datanya valid.                                  |
| Learning Hub               | Menampilkan sumber pembelajaran.                         | Gunakan thumbnail/video cover dan metadata format; jangan membuatnya terlihat seperti kursus berbayar jika bukan. |
| About / impact             | Membangun konteks dan kepercayaan.                       | Narasi organisasi, fokus, kolaborasi, dan data yang dapat diverifikasi.                                           |
| Join / footer              | Mengarahkan tindakan berikutnya.                         | CTA spesifik dan informasi kontak/legal; newsletter hanya bila layanan dan consent sudah siap.                    |

# 8. Pola desain halaman publikasi

## 8.1 Publication index

- **Pencarian yang terlihat:** input pencarian, clear action, dan state hasil/no-result.

- **Filter yang bermakna:** jenis publikasi, topik/desk, bahasa, dan tahun hanya jika data mendukung.

- **Card/list:** judul, kategori, ringkasan pendek, penulis/tanggal, format, dan access badge; cover digunakan bila tersedia dan relevan.

- **Pagination:** kontrol halaman/range yang jelas; jangan memuat daftar tak terbatas tanpa strategi navigasi.

- **URL state:** query dan filter yang committed idealnya tercermin dalam URL supaya hasil dapat dibagikan.

## 8.2 Publication detail

- **Header:** jenis publikasi, topik, judul, ringkasan, penulis, tanggal, dan bahasa.

- **Aksi:** preview atau download sesuai level akses; locked state menjelaskan persyaratan, bukan hanya disabled button.

- **Konten:** deskripsi/abstrak, daftar isi atau isi yang tersedia, referensi metadata, file terkait, dan publikasi terkait jika data tersedia.

- **SEO:** judul halaman, deskripsi, canonical, Open Graph, dan structured metadata yang sesuai.

- **Gated:** metadata tetap terlihat; area file menampilkan status akses dan jalur untuk login/berlangganan sesuai kebijakan.

# 9. Pola UX area akun dan dashboard internal

| **Pola**           | **Perilaku yang diharapkan**                                                                                                                       |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| Account overview   | Menampilkan identitas akun, status verifikasi, status akses/subscription, dan tindakan yang paling relevan.                                        |
| Locked content     | Menerangkan level akses dan langkah untuk memperoleh akses; tidak memberi kesan bahwa error terjadi.                                               |
| CMS create/edit    | Label field jelas, draft tersimpan, validasi dekat field, preview sebelum publish, dan peringatan saat meninggalkan perubahan yang belum disimpan. |
| Publish workflow   | Label aksi konsisten: Save draft, Submit for review (jika review aktif), Schedule, Publish, Unpublish.                                             |
| Table/list         | Search/filter/sort/page size dan selection konsisten; berikan loading, empty, no-result, partial-error, dan recovery.                              |
| Destructive action | Konfirmasi untuk delete, revoke access, atau tindakan yang sulit dipulihkan; dialog menjelaskan objek dan konsekuensinya.                          |
| Feedback           | Toast untuk acknowledgement; inline error untuk kesalahan yang harus diperbaiki; jangan menggunakan alert/confirm browser.                         |

# 10. Komponen inti dan state

| **Komponen**         | **State minimum**                                            | **Catatan visual/UX**                                                                                    |
|----------------------|--------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Button               | Default, hover, focus-visible, pressed, disabled, busy.      | Punya hierarchy primary/secondary/tertiary dan intent; busy tidak mengubah ukuran tombol.                |
| Link                 | Default, hover, focus, visited bila relevan.                 | Tetap terlihat sebagai navigasi; jangan hanya mengandalkan warna.                                        |
| Input / search       | Idle, focus, filled, invalid, disabled, loading, clearable.  | Label permanen; error menjelaskan perbaikan; search debounce dan cegah hasil lama menimpa hasil terbaru. |
| Badge / access label | Public, Registered, Subscriber, Draft, Published, Scheduled. | Label teks selalu ada; warna tidak menjadi satu-satunya pembawa makna.                                   |
| Card / list item     | Default, hover/focus, selected bila diperlukan.              | Click target jelas; jangan semua kartu diberi bayangan dan radius besar.                                 |
| Table                | Loading, empty, no-results, error, populated, selection.     | Jaga tinggi/struktur agar tidak melompat ketika data berubah.                                            |
| Dialog / drawer      | Open, busy, validation error, success.                       | Fokus keyboard dikelola; Escape dan focus restoration sesuai perilaku modal.                             |
| Toast / alert        | Info, success, warning, danger.                              | Gunakan bahasa yang menjelaskan hasil dan langkah berikutnya.                                            |

# 11. Anti-pattern: yang harus dihindari

| **Hindari**                                                              | **Alasan / pengganti**                                                                                                               |
|--------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Gradient glow, blur/glassmorphism, blob abstrak, dan dekorasi generik.   | Tidak berasal dari dunia publikasi/ristek; gunakan tipografi, cover, garis, dan layout editorial.                                    |
| Grid tiga kartu yang diulang di setiap section.                          | Membuat semua informasi terasa setara; gunakan pola yang sesuai jenis konten.                                                        |
| Angka statistik tanpa sumber atau konteks.                               | Berisiko menjadi klaim palsu; gunakan angka hanya jika dinamis/terverifikasi dan diberi label.                                       |
| Ikon dekoratif di setiap heading atau menu.                              | Menambah noise; ikon hanya untuk mempercepat pemahaman atau aksi.                                                                    |
| Animasi scroll dan hover berlebihan.                                     | Mengganggu pembacaan dan berisiko terasa seperti template; gunakan motion untuk feedback.                                            |
| Semua judul uppercase dan oversized.                                     | Mengurangi variasi hierarki dan keterbacaan; uppercase hanya untuk brand statement/eyebrow tertentu.                                 |
| Stock/AI imagery yang tidak terkait konten.                              | Mengurangi kepercayaan; prioritaskan cover publikasi, foto kegiatan nyata, grafik riset, atau ilustrasi editorial yang punya tujuan. |
| Tombol CTA kabur seperti “Learn More” atau “Join with Us” tanpa konteks. | Label aksi harus menyebut hasil: “Lihat seluruh publikasi”, “Unduh ringkasan”, “Daftar akun”.                                        |

# 12. Aksesibilitas, responsive, dan localization

- **Kontras:** gunakan pasangan foreground/background yang memenuhi target WCAG 2.2 AA sebagai sasaran desain; cek teks, kontrol, border penting, dan focus indicator.

- **Keyboard:** semua navigasi dan aksi dapat digunakan via keyboard dengan focus-visible yang jelas.

- **Semantic UI:** gunakan button untuk aksi, link untuk navigasi, label untuk field, heading terstruktur, serta status/error yang dapat dibaca assistive technology.

- **Reduced motion:** hindari animasi non-esensial saat preferensi reduced motion aktif.

- **Responsive:** uji setidaknya pada mobile, tablet, laptop, dan desktop; hindari horizontal overflow yang tidak disengaja.

- **Bilingual:** panjang teks ID dan EN dapat berbeda; jangan hardcode lebar label atau posisi kontrol yang rapuh.

- **Hanken Grotesk:** pastikan font memuat aksara yang dibutuhkan konten; fallback sistem digunakan saat glyph tidak tersedia.

# 13. Prinsip konten dan microcopy

- **Spesifik dan informatif:** judul, label, dan CTA harus menyebut apa yang pengguna lihat atau lakukan.

- **Bahasa aktif:** gunakan kata kerja konsisten, misalnya “Simpan draf”, “Terbitkan”, “Unduh publikasi”.

- **Kondisi kosong:** jelaskan kenapa belum ada data dan apa tindakan yang tersedia.

- **Error:** jelaskan apa yang gagal dan cara pemulihan; jangan hanya menulis “Something went wrong”.

- **Gated state:** jelaskan level yang diperlukan, status login, atau status langganan tanpa menampilkan detail internal.

# 14. Token dan implementasi

PDD ini mendokumentasikan intent dan nilai yang disetujui. Saat codebase dibuat, satu sumber token runtime harus dipilih: (A) DESIGN.md menghasilkan CSS/Tailwind tokens; atau (B) file CSS/theme yang ada menjadi canonical dan PDD/DESIGN.md mencerminkan nilainya. Jangan menyimpan nilai yang sama secara manual di banyak tempat.

| **Token konseptual**  | **Peran runtime yang disarankan**                       | **Konsumen**                                       |
|-----------------------|---------------------------------------------------------|----------------------------------------------------|
| --color-primary       | Primary brand/action                                    | Button, link, nav active, focus ring yang sesuai.  |
| --color-primary-tint  | Surface highlight                                       | Selected row, info panel, active filters.          |
| --color-accent-orange | Accent brand                                            | Marker, small visual emphasis, non-critical badge. |
| --color-success       | Semantic success (berbasis green brand dengan validasi) | Success state dan status aktif.                    |
| --color-text          | Primary text (#101010)                                  | Heading, body, labels.                             |
| --color-text-muted    | Neutral text yang cukup gelap                           | Secondary copy, helper text, metadata penting.     |
| --color-border        | Border netral turunan silver                            | Input, card boundary, divider.                     |
| --font-family-sans    | Hanken Grotesk                                          | Seluruh UI: heading, body, control, metadata.      |

# 15. Checklist review desain

1.  Apakah identitas biru, Hanken Grotesk, dan komposisi editorial konsisten?

2.  Apakah publikasi menjadi konten paling menonjol setelah hero, bukan ilustrasi dekoratif?

3.  Apakah semua statistik, cover, penulis, dan tanggal berasal dari sumber data yang benar?

4.  Apakah teks dan kontrol memiliki kontras, ukuran, dan focus state yang memadai?

5.  Apakah layout tetap terbaca pada mobile dan bilingual?

6.  Apakah loading, empty, error, locked, disabled, dan success state sudah dirancang?

7.  Apakah area publik, akun, dan internal memiliki register yang tepat tetapi tetap satu identitas?

8.  Apakah ada elemen yang hanya ditambahkan agar terlihat “modern” tanpa menyelesaikan kebutuhan informasi? Jika ada, hapus atau berikan alasan yang dapat diuji.

# Glosarium

| **Istilah**             | **Definisi dalam konteks project**                                                                   |
|-------------------------|------------------------------------------------------------------------------------------------------|
| Editorial-institutional | Register visual organisasi riset/publikasi: otoritatif, terstruktur, fokus pada isi dan keterbacaan. |
| Publication lead        | Konten publikasi yang dipilih sebagai sorotan utama pada halaman.                                    |
| Reading measure         | Batas lebar baris teks agar bacaan panjang nyaman dibaca.                                            |
| Semantic color          | Warna yang memiliki makna state, misalnya success, warning, danger, bukan dekorasi.                  |
| Microcopy               | Label, helper text, pesan status, error, dan instruksi singkat pada UI.                              |
| Design token            | Nilai desain terstandar yang digunakan secara konsisten oleh komponen.                               |
