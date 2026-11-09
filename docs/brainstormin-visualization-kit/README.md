# Mahira Foundation — Brainstorming Visualization Kit

**Versi:** 0.1.0  
**Tujuan:** paket peta visual yang dapat diedit untuk membantu brainstorming fitur, halaman, aktor, alur, arsitektur, data, dan roadmap Mahira.

## Isi paket

- `excalidraw/*.excalidraw` — papan Excalidraw dalam format JSON, dengan shape, text, dan connector terpisah agar dapat diedit.
- `mermaid/*.mmd` — source diagram berbasis teks untuk Mermaid renderer/plugin dan version control.
- `previews/*.svg` — preview SVG yang dapat diperbesar tanpa pecah.
- `reference/FEATURE-AND-PAGE-INVENTORY.md` — inventaris fitur dan halaman secara hierarkis.
- `reference/WORKSHOP-SESSION-PLAN.md` — alur sesi brainstorming, pertanyaan, dan output yang diharapkan.
- `GALLERY.html` — galeri preview seluruh diagram.
- `MANIFEST.json` — daftar file diagram dan metadata paket.

## Daftar 17 papan visual

| ID | Papan | Fungsi |
|---|---|---|
| 00 | Master Product Map | Gambaran induk platform dan empat domain utama. |
| 01 | Feature Capability Tree | Rincian capability → module → feature. |
| 02 | Sitemap & Page Hierarchy | Route dan kelompok halaman publik, akun, admin, operasi internal. |
| 03 | Actors, Roles & Capabilities | Aktor, kemampuan, dan batas identitas staf/publik. |
| 04 | User Journeys | Alur discovery, locked content, dan account. |
| 05 | Editorial & Translation Workflow | Draft, review, publish, archive, dan proses terjemahan. |
| 06 | Content Architecture & Taxonomy | Publication, Desk, Topic, Publication Type, Tag, assets, Learning Hub. |
| 07 | Logical Data Model & Ownership | Pemisahan domain Payload, Supabase Auth, dan tabel aplikasi. |
| 07B | Content Relationship ERD | Hubungan entitas editorial dan cardinality yang perlu dikonfirmasi. |
| 07C | User, Entitlement & Subscription Data | Relasi user, profile, entitlement, download event, dan Phase 2 payment. |
| 08 | System Architecture & Integrations | Komponen aplikasi, database, storage, layanan eksternal, dan trust boundary. |
| 09 | Access Control & Download Flow | Urutan otorisasi dan keputusan akses dokumen. |
| 10 | Subscription & Entitlement Lifecycle | Siklus subscription dan entitlement untuk Phase 2. |
| 11 | Development Roadmap — Vertical Slices | Urutan fondasi, spike, vertical slices, hardening, dan ekspansi. |
| 12 | Brainstorming Decision Parking Lot | Pertanyaan terbuka lintas domain untuk workshop. |
| 13 | Requirement-to-Implementation Traceability | Rantai requirement sampai code dan test. |
| 14 | Page Anatomy & Component Map | Blok halaman inti dan komponen pendukungnya. |

## Urutan workshop yang disarankan

1. **Scope & IA:** 00 → 01 → 02 → 14.
2. **Content & Editorial:** 05 → 06 → 07B → 07.
3. **Identity & Access:** 03 → 04 → 07C → 08 → 09 → 10.
4. **Delivery & Decisions:** 11 → 12 → 13.

Rincian fasilitasi ada pada `reference/WORKSHOP-SESSION-PLAN.md`.

## Menggunakan Excalidraw

1. Buka Excalidraw.
2. Pilih menu **Open** atau **Import** dan pilih salah satu file dari `excalidraw/` (atau drag file ke canvas, tergantung versi aplikasi).
3. Mulai dari papan induk `00-MASTER-PRODUCT-MAP`.
4. Duplikasi papan sebelum workshop agar versi baseline tidak tertimpa.
5. Tambahkan sticky notes, owner, prioritas, dan keputusan pada salinan papan.
6. Setelah sesi, simpan hasil yang disepakati sebagai file `.excalidraw` baru atau perbarui versi workshop yang disimpan di repository.

Elemen teks, shape, dan connector disimpan sebagai elemen tersendiri. Struktur JSON telah diperiksa secara programatis, tetapi tetap lakukan uji buka/import pertama di versi Excalidraw yang kamu gunakan.

## Menggunakan FigJam

File SVG dapat dimasukkan ke FigJam sebagai visual referensi atau underlay. Import SVG belum tentu menghasilkan objek FigJam yang seluruh komponennya dapat diedit satu per satu. Untuk workshop FigJam yang sepenuhnya native, gunakan preview SVG sebagai panduan lalu buat ulang/pecah node menggunakan shape dan connector FigJam, atau gunakan integrasi Mermaid yang tersedia pada workspace-mu.

## Legenda warna dan status

| Warna | Arti |
|---|---|
| Biru tua | Induk / root product domain |
| Biru muda | Domain atau capability baseline |
| Putih kebiruan / abu-abu | Modul, entitas, atau struktur pendukung |
| Hijau | Arah yang diizinkan / tindakan berhasil |
| Kuning | Pertanyaan terbuka / perlu konfirmasi |
| Oranye | Usulan yang memerlukan policy atau validasi |
| Ungu | Opsional atau Phase 2 |
| Merah | Batas keamanan atau risiko penting |

Setiap item sebaiknya diberi status teks: `BASELINE`, `PROPOSED`, `TBD`, `OPTIONAL`, atau `PHASE 2`.

## Dasar dan tingkat kepastian

Paket ini disusun terutama dari PRD, PDD, SRS, struktur repository, dan ekspor percakapan dengan Claude yang diberikan dalam percakapan ini. Diagram merupakan alat brainstorming dan dekomposisi; bukan pengesahan otomatis atas semua fitur atau arsitektur.

- **BASELINE:** disebut secara eksplisit dalam dokumen inti.
- **PROPOSED:** turunan atau rekomendasi untuk membantu implementasi.
- **TBD:** memerlukan keputusan stakeholder atau validasi teknis.
- **OPTIONAL:** tidak wajib sebelum kebutuhan konkretnya terbukti.
- **PHASE 2:** perlu dipisahkan dari MVP, terutama payment dan subscription.

Perbedaan definisi MVP masih harus diselesaikan: PRD §7 memisahkan publication MVP dengan user access MVP+, sementara PRD §13 dan beberapa requirement SRS menempatkan akun/access/entitlement sebagai acceptance MVP/P0.

Akses staf terhadap file registered/subscriber tidak boleh diasumsikan otomatis dari role Editor/Admin. Kebijakan tersebut perlu keputusan eksplisit.

Desk, Topic, Publication Type, dan Tag diperlakukan sebagai konsep berbeda. Jangan menyatukannya menjadi generic Category tanpa kebutuhan dan keputusan yang terdokumentasi.

## Pemetaan sumber dokumen inti

| Papan | Rujukan baseline utama |
|---|---|
| 00 | PRD §1–2, §6; SRS §2 |
| 01 | PRD §5–6; SRS FR-001–FR-028; PDD §7–10 |
| 02 | PRD §6, §9; SRS §6 |
| 03 | PRD §5, §6.3–6.4; SRS §2, §4 |
| 04 | PRD §8–9; SRS §4, §12 |
| 05 | PRD D-05; PDD §9; SRS FR-014–FR-017 |
| 06 | PRD D-02; SRS §5; PDD §8 |
| 07 | SRS §2.2–2.3, §5.2 |
| 07B | SRS §5.1; relasi many-to-many adalah usulan yang perlu validasi |
| 07C | SRS §2.1, §4, §5, §9 |
| 08 | SRS §2, §8, §11 |
| 09 | PRD §8; SRS §4.3, §8 |
| 10 | PRD §7–8; SRS §9 |
| 11 | PRD §7; SRS §13–14 |
| 12 | PRD §12; SRS §15 |
| 13 | PRD §4, §13; SRS §3, §12–14 |
| 14 | PDD §7–10; PRD §6; SRS FR |

## Rekomendasi lokasi pada repository

Simpan paket ini di `docs/visuals/brainstorming/` agar diagram editable berada dekat dokumentasi sumber. Jangan menyimpan satu-satunya salinan hasil workshop di workspace eksternal.
