# Rencana Sesi Brainstorming Mahira

**Tujuan:** mengubah peta produk dan diagram awal menjadi keputusan yang disepakati, bukan sekadar menghasilkan papan yang penuh sticky notes.

## Prinsip fasilitasi

1. Mulai dari tujuan pengguna dan kebutuhan organisasi, bukan dari komponen teknologi.
2. Pisahkan fakta baseline, usulan, keputusan terbuka, dan fitur masa depan.
3. Jangan menyelesaikan seluruh pertanyaan dalam satu sesi. Catat keputusan yang membutuhkan data, contoh konten, stakeholder, atau technical spike.
4. Setiap keputusan yang disepakati harus dipindahkan ke `docs/decisions/DECISIONS.md`; keputusan arsitektur yang berdampak jangka panjang perlu ADR.
5. Setiap perubahan scope harus diperiksa dampaknya terhadap page map, data model, access policy, test plan, dan roadmap.

## Status item pada papan

| Label | Arti | Perlakuan |
|---|---|---|
| BASELINE | Disebut secara eksplisit dalam PRD/PDD/SRS | Pertahankan sebagai kebutuhan awal, kecuali diubah melalui keputusan resmi. |
| PROPOSED | Rekomendasi atau turunan untuk membantu desain | Diskusikan, terima, ubah, atau tolak. Jangan dianggap final. |
| TBD | Belum diputuskan / bukti belum cukup | Tetapkan owner dan cara menyelesaikannya. |
| OPTIONAL | Hanya dibuat jika kebutuhan dan nilainya terbukti | Jangan masukkan ke MVP tanpa alasan yang disetujui. |
| PHASE 2 | Fitur lanjutan, terutama subscription/payment | Jaga boundary; siapkan extensibility tanpa membangun seluruhnya di MVP. |

## Sesi 1 — Product scope, capability tree, dan page map

**Papan:**

- `00-MASTER-PRODUCT-MAP`
- `01-FEATURE-CAPABILITY-TREE`
- `02-SITEMAP-PAGE-HIERARCHY`
- `14-PAGE-ANATOMY-AND-COMPONENT-MAP`

**Pertanyaan utama:**

- Apa empat domain produk yang benar-benar diperlukan saat launch?
- Halaman mana wajib ada dan mana hanya opsi ekspansi?
- Apakah Desk dan Topic membutuhkan halaman landing tersendiri atau cukup sebagai filter?
- Apa isi minimum homepage, publication index, publication detail, Learning Hub, dan account overview?
- Apakah MVP mengikuti Option A (publication-first) atau Option B (publication + account + manual access)?

**Output yang harus selesai:**

- Capability tree dengan status setiap fitur.
- Sitemap yang disetujui, termasuk route locale.
- Daftar halaman MVP dan non-MVP.
- Block inventory untuk halaman inti.
- Daftar keputusan terbuka dengan owner.

## Sesi 2 — Content architecture, editorial process, dan data relationships

**Papan:**

- `05-EDITORIAL-AND-TRANSLATION-WORKFLOW`
- `06-CONTENT-ARCHITECTURE-AND-TAXONOMY`
- `07B-CONTENT-RELATIONSHIP-ERD`
- `07-LOGICAL-DATA-MODEL-OWNERSHIP`

**Persiapan:** bawa 5–10 contoh publikasi nyata (berbagai tipe), contoh penulis, contoh desk/topic, dan contoh berkas lampiran jika tersedia.

**Pertanyaan utama:**

- Apa perbedaan Desk, Topic, Publication Type, dan Tag di organisasi?
- Apakah satu publikasi bisa terkait dengan beberapa Desk, Topic, dan Author?
- Apakah organisasi boleh menjadi institutional author?
- Jenis asset apa yang mungkin dilampirkan dan apakah level aksesnya bisa berbeda?
- Apa lifecycle editorial yang benar-benar digunakan tim?
- Siapa yang bertanggung jawab atas terjemahan, review, dan revisi pascapublikasi?

**Output yang harus selesai:**

- Taxonomy glossary dan relasi yang disetujui.
- Contoh record untuk validasi model.
- Cardinality relationship yang sudah dikonfirmasi atau diberi status TBD.
- Editorial lifecycle dan permission owner.
- Kebutuhan locale/translation yang jelas.

## Sesi 3 — Actors, identity, access policy, dan system architecture

**Papan:**

- `03-ACTORS-ROLES-AND-CAPABILITIES`
- `04-USER-JOURNEYS`
- `07C-USER-ENTITLEMENT-DATA-FLOW`
- `08-SYSTEM-ARCHITECTURE-AND-INTEGRATIONS`
- `09-ACCESS-CONTROL-DOWNLOAD-FLOW`
- `10-SUBSCRIPTION-AND-ENTITLEMENT-LIFECYCLE`

**Pertanyaan utama:**

- Siapa saja aktor yang benar-benar ada saat MVP?
- Identitas staf dan pengguna publik dikelola oleh sistem apa?
- Apakah staf boleh mengunduh konten registered/subscriber? Melalui permission atau entitlement terpisah?
- Apa yang dimaksud entitlement: per publication, per asset, per collection, atau berdasarkan plan?
- Bagaimana aturan inheritance antara access level publication dan asset?
- Apa yang terjadi saat entitlement kedaluwarsa atau dicabut setelah signed URL terbit?
- Operasi apa yang boleh memakai service-role credential, dan di server mana authorization diperiksa?

**Output yang harus selesai:**

- Actor/capability matrix.
- Auth boundary dan staff/public identity decision.
- Access decision table dan download flow.
- Storage classification serta signed URL policy yang masih TBD.
- Boundary Phase 2 untuk payment/subscription.

## Sesi 4 — Delivery roadmap, decision register, dan traceability

**Papan:**

- `11-DEVELOPMENT-ROADMAP-VERTICAL-SLICES`
- `12-BRAINSTORMING-DECISION-PARKING-LOT`
- `13-REQUIREMENT-TO-IMPLEMENTATION-TRACEABILITY`

**Pertanyaan utama:**

- Keputusan mana yang memblokir schema, routing, auth, atau storage?
- Spike teknis mana yang harus dilakukan untuk membuktikan keputusan?
- Apa exit criteria setiap vertical slice?
- Siapa owner setiap keputusan dan requirement?
- Bagaimana perubahan requirement akan memperbarui test case?

**Output yang harus selesai:**

- MVP boundary yang disetujui.
- Decision register berisi owner, status, blocker, dan due point.
- Spike backlog serta acceptance criteria.
- Roadmap vertical slice dengan exit criteria.
- Requirement-to-test traceability.

## Template catatan keputusan workshop

Untuk setiap item, catat:

| Field | Isi |
|---|---|
| Decision ID | ID dari `DECISIONS.md` |
| Topic | Topik yang diputuskan |
| Current state | Baseline / Proposed / TBD |
| Options | Alternatif yang dipertimbangkan |
| Decision | Pilihan yang disepakati; kosong jika belum diputuskan |
| Rationale | Alasan bisnis/teknis |
| Consequences | Dampak pada scope, data, route, security, cost, dan operasi |
| Owner | Orang yang bertanggung jawab mengesahkan |
| Evidence | Contoh konten, stakeholder validation, test, benchmark, atau spike |
| Affected docs | Dokumen yang harus diperbarui |
| Status | Open / Proposed / Accepted / Rejected / Superseded |

## Definition of a useful brainstorming outcome

Sebuah topik belum dianggap selesai hanya karena semua orang setuju secara lisan. Topik dianggap cukup selesai ketika:

- istilahnya didefinisikan;
- batas scope-nya jelas;
- owner keputusan diketahui;
- konsekuensi utama dicatat;
- dokumen sumber kebenaran diperbarui;
- requirement/test/roadmap yang terdampak ikut diperbarui.
