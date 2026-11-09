# Mahira Foundation — Documentation Index

**Project:** Mahira Foundation / Mahira Indonesia Development (working name; legal and public identity not confirmed)  
**Documentation set:** 0.1.0  
**Status:** Working baseline — proposed specifications, not blanket approval  
**Language:** Bahasa Indonesia; technical terms may remain in English where more precise.

Dokumen ini adalah pintu masuk dokumentasi proyek. Ia tidak menggantikan PRD, PDD, atau SRS. Dokumen tambahan di paket ini menerjemahkan baseline tersebut menjadi keputusan, spesifikasi arsitektur, kontrak implementasi, dan strategi verifikasi.

## 0. Dokumen rujukan utama (baca ini dulu)

| Dokumen | Menjawab |
|---|---|
| [`MILESTONES.md`](MILESTONES.md) | Fase saat ini, task berikutnya, blocker, exit criteria. Menggantikan `STATUS.md`. |
| [`CHANGELOG.md`](CHANGELOG.md) | Apa yang sudah selesai, kapan, dan buktinya (commit/tes). |

Semua dokumen lain di bawah ini adalah **rujukan turunan**: dibuka hanya bila task di `MILESTONES.md` membutuhkannya. Setiap task selesai wajib dicentang di `MILESTONES.md` dan dicatat di `CHANGELOG.md`.

## 1. Cara membaca dokumentasi

1. `CORE/PRD.md`, `CORE/PDD.md`, dan `CORE/SRS.md` adalah baseline kebutuhan produk, desain, dan sistem. Salinan dokumen inti yang sudah ada di repository sebaiknya tetap menjadi sumber; folder `CORE/` dalam paket ini hanya memuat petunjuk integrasi, bukan salinan yang menimpa file lama.
2. `decisions/DECISIONS.md` menunjukkan apa yang sudah diketahui, apa yang diusulkan, dan apa yang belum diputuskan.
3. ADR menjelaskan alasan, alternatif, konsekuensi, dan status keputusan arsitektural tertentu.
4. `architecture/` menjelaskan struktur domain, data, batas sistem, integrasi, dan keamanan.
5. `specifications/` menjelaskan perilaku route, API, halaman, SEO, workflow, dan batas subscription.
6. `design/` menerjemahkan arah PDD ke token dan aturan aset brand.
7. `engineering/` menjadi kontrak cara kode dibangun, dijalankan, diuji, dan dirilis.
8. `content/` menjadi pedoman pengelolaan konten dan istilah.
9. `spikes/` menyimpan bukti eksperimen sebelum asumsi teknis dikunci.
10. `legal/` adalah inventaris kerja untuk stakeholder dan penasihat hukum, bukan pendapat hukum.

## 2. Status dan arti label

| Label | Makna | Boleh dipakai sebagai kontrak implementasi? |
|---|---|---|
| `BASELINE` | Dinyatakan dalam PRD/PDD/SRS yang tersedia. | Ya, sepanjang tidak bertentangan dengan keputusan yang lebih baru dan disetujui. |
| `PROPOSED` | Rekomendasi desain/teknis dalam paket ini. | Belum; perlu persetujuan atau ADR. |
| `OPEN` / `TBD` | Belum ada informasi/keputusan yang cukup. | Tidak. Jangan menebak. |
| `ACCEPTED` | Disetujui pemilik keputusan dan dicatat. | Ya, dalam ruang lingkup yang dinyatakan. |
| `SUPERSEDED` | Digantikan keputusan/dokumen lain. | Tidak; hanya untuk histori. |
| `IMPLEMENTED` | Sudah dibuat dan diverifikasi pada versi/commit tertentu. | Hanya untuk implementasi yang dibuktikan. |

**Penting:** status dokumen dan status keputusan berbeda. Dokumen dapat berstatus `Draft` sementara beberapa keputusan di dalamnya `Accepted`. Paket ini tidak mengasumsikan bahwa rekomendasi telah disetujui.

## 3. Hierarki sumber kebenaran

Gunakan urutan berikut untuk menyelesaikan konflik:

1. Kebijakan hukum, kontrak provider, dan keputusan tertulis stakeholder yang sah, dalam ruang lingkupnya.
2. ADR berstatus `Accepted` untuk keputusan arsitektural yang secara eksplisit dicakup ADR.
3. Spesifikasi domain/teknis berstatus `Approved` atau `Accepted`.
4. SRS untuk perilaku sistem dan requirement yang belum diubah secara sah.
5. PRD untuk tujuan, scope, pengguna, dan prioritas produk.
6. PDD untuk prinsip visual, UX, dan token desain yang disetujui.
7. Engineering conventions dan instruksi repository untuk cara implementasi.
8. Catatan spike, issue, pull request, chat AI, dan referensi eksternal sebagai bukti/konteks, bukan sumber final dengan sendirinya.

Jika dua sumber pada tingkat yang sama bertentangan, **jangan memilih diam-diam**. Buat issue/decision item, tunjuk pemilik, dan selesaikan melalui pembaruan dokumen atau ADR. ADR tidak otomatis mengubah kebutuhan produk; perubahan scope harus disetujui Product Owner dan kemudian disinkronkan ke PRD/SRS.

## 4. Peta dokumen

| Area | Dokumen | Tujuan | Prioritas |
|---|---|---|---|
| Governance | `decisions/DECISIONS.md` | Single register keputusan dan pertanyaan terbuka. | P0 |
| Governance | `decisions/ADR/` | Record keputusan arsitektur dengan alasan dan konsekuensi. | P0 |
| Architecture | `architecture/SYSTEM-ARCHITECTURE.md` | Konteks sistem, boundary, aliran utama, trust boundary. | P0 |
| Architecture | `architecture/CONTENT-ARCHITECTURE.md` | Taksonomi dan model editorial. | P0 |
| Architecture | `architecture/DATA-MODEL.md`, `ERD.md` | Field, relasi, ownership, constraint, dan diagram. | P0 |
| Security | `architecture/ACCESS-POLICY.md` | Aturan autentikasi/otorisasi/entitlement/file. | P0 |
| Integration | `architecture/INTEGRATION-CONTRACTS.md` | Batas dan kontrak antarkomponen/provider. | P1 |
| Specifications | `specifications/IA-ROUTING-I18N.md` | Sitemap, locale, URL, slug, canonical/hreflang. | P0 |
| Specifications | `specifications/API-SPECIFICATION.md` | Kontrak API aplikasi dan error semantics. | P1 |
| Specifications | `specifications/PAGE-SPECIFICATIONS.md` | Tujuan, data, urutan blok, state, SEO, a11y tiap halaman. | P1, per slice |
| Specifications | `specifications/EDITORIAL-WORKFLOW.md` | Lifecycle dan transisi konten. | P1 |
| Specifications | `specifications/SEO-SPECIFICATION.md` | Metadata, indexing, sitemap, structured data. | P1 |
| Specifications | `specifications/SUBSCRIPTION-BOUNDARY.md` | Batas kesiapan entitlement sekarang dan payment nanti. | P2 |
| Design | `design/DESIGN-TOKENS.md` | Token implementasi yang diturunkan dari PDD. | P1 |
| Design | `design/BRAND-ASSETS.md` | Penggunaan varian logo dan aset. | P2 |
| Engineering | `engineering/ENGINEERING-CONVENTIONS.md` | Coding, server/client, naming, review, DoD. | P0 |
| Engineering | `engineering/PROJECT-STRUCTURE.md` | Struktur folder target dan ownership kode. | P1 |
| Engineering | `engineering/ENVIRONMENTS.md` | Dev/staging/prod, secrets, migration, backup. | P0 |
| Engineering | `engineering/TEST-PLAN.md` | Piramida tes dan test scenarios. | P0 |
| Engineering | `engineering/TRACEABILITY-MATRIX.md` | Requirement → design → code → test. | P1, hidup |
| Engineering | `engineering/RELEASE-CHECKLIST.md` | Gate staging/production. | P1 |
| Content | `content/EDITORIAL-GUIDE.md` | Metadata, standar naskah, revisi, terjemahan. | P1 |
| Content | `content/GLOSSARY.md` | Istilah baku produk/editorial/teknis. | P1 |
| Spikes | `spikes/` | Bukti eksperimen. | P0 sebelum keputusan terkait |
| Legal/privacy | `legal/DATA-PRIVACY-INVENTORY.md` | Inventaris pemrosesan data untuk review. | P0, mulai dini |
| Operations | `STATUS.md` | Kondisi pekerjaan terkini dan blockers. | P0 |

## 5. Aturan pemeliharaan dokumentasi

- Setiap dokumen wajib memiliki owner/role, version, status, tanggal update, dan dokumen terkait.
- Satu fakta normatif hanya mempunyai satu lokasi canonical. Dokumen lain menautkan, tidak menyalin detail.
- Setiap requirement diberi ID stabil (`FR`, `NFR`, `AC`, `SEC`, `DATA`, `SEO`, `OPS`) dan tidak digunakan ulang.
- Setiap keputusan penting mempunyai ID `DEC-NNN`; ADR menggunakan `ADR-NNNN`.
- Perubahan requirement harus menyebut dampaknya pada data model, access policy, route/API, desain, dan tests yang terkait.
- Catatan percakapan AI tidak otomatis menjadi keputusan. Ringkas hasil yang diterima ke register/dokumen canonical.
- Hindari menulis nilai yang belum diketahui sebagai fakta. Gunakan `TBD`, pemilik, dan batas waktu keputusan.
- Perbarui `STATUS.md` setiap sesi kerja yang mengubah status slice atau blocker.

## 6. Read order untuk AI coding agent

1. Root `AGENTS.md` dan `README.md`.
2. Dokumen `CORE` terkait task.
3. `DECISIONS.md` dan ADR yang relevan.
4. Spesifikasi domain yang langsung terkait task.
5. Engineering conventions, test plan, dan struktur proyek.
6. Source code aktual dan test yang ada.

Jika dokumen dan codebase tidak konsisten, jangan mengasumsikan salah satunya benar. Laporkan mismatch, identifikasi dampak, dan minta/ikuti keputusan pemilik proyek.

## 7. Integrasi dengan dokumen inti yang sudah ada

Pindahkan atau pertahankan file yang sudah tersedia sebagai `docs/CORE/PRD.md`, `PDD.md`, `SRS.md`, dan README baseline. Arsip percakapan AI sudah dipindahkan ke `docs/references/CHAT_WITH_CLAUDE.md` (REF-001, non-normatif).
