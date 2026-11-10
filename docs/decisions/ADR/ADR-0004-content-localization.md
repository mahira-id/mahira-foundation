# ADR-0004 — Content Localization Model

- **Status:** Accepted (2026-11-08). Validation evidence pending: Spike A prototype of spec `03-architecture-technical-validation` (design Revision 3 §22).
- **Related decisions:** DEC-004 (Accepted 2026-11-08), DEC-005
- **Decision owner / approver:** Product Owner. Approver: Haidar (Product Owner), 2026-11-08. No Editorial Lead is named yet; the Product Owner approved in that role's place.

## Context

Mahira menargetkan Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`). PDD/PRD/SRS mensyaratkan locale URL dan tidak mengizinkan fallback bahasa secara diam-diam. Model penyimpanan belum dipilih: field-level localization atau linked translation entries.

## Options

### A. Field-level localization
Satu record publication memiliki field localized untuk title, slug, summary, body dan metadata.

**Pros:** satu identity untuk konten; relasi author/topic mudah; native localization workflow dapat mengurangi duplikasi.  
**Cons:** setiap locale dapat memiliki status editorial, tanggal rilis, slug, dan kelengkapan yang berbeda; perilaku fallback dan unique slug perlu diuji; perubahan satu record dapat mengikat lifecycle dua bahasa.

### B. Linked translation records
Setiap bahasa adalah record terpisah dengan relasi `translation_group_id`/`translations`.

**Pros:** slug, status, metadata, penulis, tanggal, dan publish lifecycle dapat independen; bahasa dapat terbit pada waktu berbeda; lebih mudah memodelkan adaptasi substansial.  
**Cons:** relasi pasangan, konsistensi taksonomi, UI pengelolaan terjemahan, dan query hreflang perlu dirancang.

### C. Hybrid
Localized fields untuk copy sederhana, linked records untuk publication atau entitas editorial yang memiliki lifecycle terpisah.

**Pros:** fleksibel.  
**Cons:** lebih banyak pola dan aturan; rawan inkonsistensi bila tidak dibatasi.

## Decision (Accepted 2026-11-08)

Opsi C (hybrid) dipilih oleh Product Owner. Heading lama "### Opsi terpilih: C. Hybrid" di bawah daftar opsi diganti oleh bagian ini; isinya sama, kini dengan status, approver, dan tanggal.

- **Publication:** satu record per bahasa, dihubungkan oleh satu Translation_Group. Slug unik per locale di level database.
- **Tanpa fallback konten:** terjemahan yang belum ada berarti tidak ada halaman dalam bahasa itu.
- **Field bersama:** Access_Level, Publication_Type, Topics, dan Authors sama untuk semua versi bahasa; aturan ini ditegakkan di server pada setiap jalur simpan dan terbit.
- **Per bahasa:** judul, slug, ringkasan, isi, field SEO, tanggal terbit, status editorial, file khusus bahasa, bahasa sumber, status terjemahan. Penerjemah adalah kontributor per bahasa, bukan Author. Tidak ada terjemahan mesin yang belum direview.
- **Term taksonomi dan Author:** field localization dengan fallback mati; term aktif wajib punya kedua bahasa; nama tampilan Author tidak diterjemahkan; biografi yang tidak ada tidak ditampilkan.

Detail lengkap ada di `docs/decisions/DECISIONS.md` §2.1 (DEC-004).

**Consequences:** relasi Translation_Group, aturan field bersama, dan query hreflang harus dibangun dan diuji (Cons opsi B dan C di atas). Validasi pada versi Payload yang dipin belum ada; jika prototipe Spike A menunjukkan salah satu aturan tidak dapat ditegakkan, Owner meninjau ulang keputusan ini sebelum skema produksi dibuat.

## Proposed evaluation and recommendation (historical, before acceptance)

Jangan putuskan hanya karena salah satu opsi didukung CMS. Buat 3–5 contoh nyata: publikasi yang diterjemahkan penuh, publikasi yang terbit beda tanggal, publikasi yang hanya tersedia ID, author profile, dan topic page.

Rekomendasi awal untuk **Publication** adalah mempertimbangkan linked translation records bila setiap bahasa akan memiliki slug, lifecycle, metadata, dan editorial approval independen. Field-level localization dapat lebih tepat jika satu publikasi benar-benar satu record dan setiap bahasa selalu bergerak bersama. Untuk Author/Topic, field localization mungkin lebih sederhana bila entitas lintas bahasa tetap satu identity. Ini rekomendasi bersyarat, bukan keputusan.

## Required rules regardless of option

- Locale aktif selalu terlihat pada URL.
- Tidak menampilkan teks bahasa lain seolah-olah locale aktif.
- Hreflang hanya diterbitkan jika pasangan terjemahan yang setara tersedia dan published.
- Search menentukan dengan jelas apakah query hanya untuk locale aktif.
- Slug unik pada scope yang ditetapkan dan tidak berubah diam-diam.
- Terjemahan memiliki status completeness/review.
- Fallback UI string tidak sama dengan fallback konten.

## Validation

Spike membuat satu publication ID/EN, slug berbeda, satu versi yang belum diterjemahkan, satu perubahan hanya di EN, serta metadata canonical/hreflang. Uji bagaimana Payload localization, draft/version, uniqueness, dan API query bekerja pada versi yang dipin.

Status validasi (2026-11-08): belum dijalankan. Prototipe Spike A (spec `03-architecture-technical-validation`, design Revision 3 §22) menjalankan pemeriksaan ini. Apakah delapan pemeriksaan DEC-004 dari workshop 2026-11-06 dicatat sebagai bagian resmi Spike A menunggu konfirmasi Owner (spec 03 OG-09).

Status validasi (2026-11-10): dijalankan di M2-02 pada branch spike/m2-payload-postgres; hasil di SPIKE-001 §7.6; rekomendasi di DECISIONS §2.3. Status ADR tidak berubah.

## Change history

| Date | Change |
|---|---|
| 2026-11-05 | Initial proposed ADR. |
| 2026-11-08 | Status Accepted, approver Haidar (Product Owner). Stray heading "Opsi terpilih: C. Hybrid" replaced by the "Decision" section. Validation note added. |
| 2026-11-10 | Validation pointer to M2-02 results (SPIKE-001 §7.6, DECISIONS §2.3) added. Status unchanged. |
