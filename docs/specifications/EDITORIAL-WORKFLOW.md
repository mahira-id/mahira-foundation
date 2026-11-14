# Editorial Workflow Specification

**ID:** SPEC-EDITORIAL-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Purpose

Menetapkan lifecycle konten dan pembagian tanggung jawab editorial agar fitur Payload, status publik, terjemahan, revisi, dan audit konsisten. Alur final harus dikonfirmasi bersama pemilik organisasi dan calon editor; dokumen ini menawarkan baseline yang dapat diuji.

## 2. Proposed content lifecycle

```text
Draft → In Review → Changes Requested → Approved → Scheduled → Published
  ↑          ↓                                      ↓
  └──────────┴──────────────────────────────────────┘

Published → Updated (new version) / Unpublished / Archived / Withdrawn
```

Status konseptual tersebut tidak harus seluruhnya menjadi pilihan status tunggal di CMS. Payload draft/version, publication status, review assignment, dan scheduled publication mungkin direpresentasikan sebagai field/workflow hooks. Implementasi harus memilih state model eksplisit; jangan mengasumsikan label UI sama dengan database state.

## 3. Roles and separation of duties

| Role | Draft/create | Edit own/others | Review | Approve | Publish/unpublish | Manage staff |
|---|---:|---:|---:|---:|---:|---:|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| Editor | Yes | Policy TBD | If assigned | No by default | Policy TBD | No |
| Reviewer (optional) | No by default | Comment/request changes | Yes | Recommendation only | No | No |
| Finance (optional) | No | No | No | No | No | No |

Least privilege applies. If the team is very small, one person may perform multiple roles operationally, but role permissions remain explicit. Admin access is not a substitute for a documented publishing policy.

## 4. Proposed workflow details

### 4.1 Create draft

- Editor selects content type and locale.
- System creates an internal immutable record ID.
- Required metadata is validated at save or transition, not necessarily at initial draft creation.
- Draft content is not publicly queryable, indexable, or downloadable.
- Assets uploaded to a draft remain private/quarantined or otherwise inaccessible publicly until an approved publication/asset state.

### 4.2 Submit for review

- Editor runs completeness validation (title, summary, author, type, topic policy (DEC-003), rights, access level, primary asset where required).
- Reviewer assignment and due date are optional until organization decides they are needed.
- Submitted snapshot/version is identifiable.
- Reviewer can approve, request changes, or reject/return with reason.
- Review comments should be auditable and permission-scoped.

### 4.3 Approval and scheduling

- Approval does not automatically imply immediate public visibility unless policy says so.
- Scheduled publication stores timezone-safe timestamp and organization timezone convention.
- Publishing job reliability and hosting limitations must be tested; if scheduled tasks depend on external cron, document ownership and retry behavior.
- A failed publish job must be visible to staff and must not silently claim success.

### 4.4 Publish

On publication:
- Verify content is approved or explicit bypass permission exists.
- Verify all required localized fields and public asset references.
- Set published timestamp and public status atomically where possible.
- Revalidate affected route/cache tags only after durable database commit.
- Update sitemap and search index according to published content.
- Record actor, timestamp, version, and relevant change summary.

### 4.5 Post-publication revision

- Never silently overwrite material research changes without version history.
- Preserve prior version when versioning is enabled/required.
- Distinguish typographical correction from substantive update if editorial policy needs it.
- Record update date and optional correction note.
- Revalidate public caches and search index after successful commit.
- If asset is replaced, ensure old private/public object lifecycle is safe and references are not broken prematurely.

### 4.6 Unpublish, archive, withdraw

These are distinct business actions and must not be conflated:
- **Unpublish:** temporarily remove from public display; may be republished.
- **Archive:** mark no longer actively maintained but retain discoverability according to policy.
- **Withdraw:** remove/disable public access due to rights, legal, factual, or safety concerns; consider a public notice page if approved.
- **Delete:** exceptional destructive operation; require explicit permission, confirmation, and retention/legal checks.

For all state changes, invalidate public caches and search/sitemap entries. Private file URL issuance must re-check current publication/asset state.

## 5. Localization workflow

- Each language version has an explicit status and responsible editor/translator.
- Translation is not assumed complete merely because source-language record is published.
- Track translation source/version to reduce stale translations.
- A source change may mark translations as `needs_review` or `out_of_date`.
- Locale switcher offers only a verified published equivalent.
- Translation publication can be independent or synchronized depending on the approved localization model.

## 6. Editorial quality checklist

- Title and summary are accurate and useful.
- Authors, affiliations, dates, and type are verified.
- Topic/type taxonomy follows controlled vocabularies.
- Citations/references are formatted consistently.
- Publication rights, licenses, and third-party permissions are recorded.
- Access level and each asset's effective access are confirmed.
- PDF opens, is legible, tagged/accessible where possible, and matches metadata.
- Translation is reviewed by an accountable language owner.
- SEO title/description and cover/social image are valid.
- Preview reviewed on mobile and desktop.

## 7. Audit and accountability

Record at minimum actor, action, entity ID, prior/current lifecycle state, timestamp, and correlation identifier for publish/unpublish, access-level changes, asset replacement/deletion, role changes, entitlement grants/revokes, and other privileged operations. Define comment retention and audit retention with privacy/legal review.

## 8. Questions requiring stakeholder decision

1. Is peer/editorial review mandatory for every publication?
2. Can an Editor publish directly, or only Admin/Approver?
3. Is there a designated Reviewer role?
4. What is the timezone for scheduling?
5. What public notice is required for withdrawn publications?
6. Who owns English translation and review?
7. Which publication types require full PDF, abstract, references, or citation metadata?

## 9. Implementasi MVP (M3-03, DECISIONS §2.6)

Workflow minimum DEC-015 (draft → published → unpublished) untuk koleksi Publication, sesuai jawaban Owner 2026-11-12 (DECISIONS §2.6). Bagian §2–§4 di atas tetap baseline usulan untuk fase berikutnya.

### 9.1 Model state

Status disimpan per versi bahasa (satu record per bahasa, DEC-004). "Tayang di situs" adalah field virtual `liveOnSite` yang hanya terbaca staf (§2.6 P4).

| State | Disimpan sebagai | Tampil di situs | Admin menampilkan (Status / Tayang di situs) |
|---|---|---|---|
| Draft, belum pernah terbit | `_status: draft`, `everPublished: false` | tidak | Draft / Tidak |
| Published | record `_status: published` | ya, bila `accessLevel: public` (DEC-002) | Published / Ya (Tidak bila `registered`/`subscriber`) |
| Published dengan revisi tertunda | record published, versi terbaru draft | versi yang terbit | Changed / Ya |
| Unpublished | record `_status: draft`, `everPublished: true` | tidak | Draft atau Changed / Tidak (dibaca dari kode Payload 3.93.0, belum diuji di browser) |
| Review / Approved / Scheduled | tidak ada di MVP (DEC-015) | — | — |
| Archived / Withdrawn | bukan state; pakai Unpublish (§2.6 P1) | — | — |

### 9.2 Aksi

- **Save Draft**, **Publish** / **Publish changes**, dan **Unpublish** (dengan dialog konfirmasi) adalah tombol bawaan Payload; labelnya tetap Inggris dan sesuai PDD §9 (§2.6 P9).
- Editor dan Admin sama-sama boleh membuat, mengubah, menerbitkan, dan meng-unpublish (DEC-016). Ini menjawab "Policy TBD" kolom Publish/unpublish Editor di §3 dan pertanyaan §8 nomor 2.
- Menghapus versi bahasa yang pernah terbit hanya boleh Admin (DEC-016); Editor mendapat 403.
- **Preview** (sejak M3-05, DECISIONS §2.11 P11 A): tombol bawaan Payload di form Publication membuka `/api/preview?id=<id>` di tab baru. Handler memverifikasi sesi Editor/Admin, mengaktifkan Draft Mode, lalu mengalihkan ke `/{locale}/publications/{slug}` dari data draf. Halaman menampilkan versi terbaru (draft atau revisi tertunda) dengan banner "Pratinjau draf: belum tentu terlihat pengunjung." dan tombol "Keluar dari pratinjau"; halaman itu `noindex` dan tidak di-cache. Sejak M3-05b (disetujui Owner 2026-11-14), tombol itu membuka halaman publik versi yang tayang bila publikasi punya versi published + `public`, selain itu halaman edit publikasi itu di `/admin` (PAGE-SPECIFICATIONS §4). Hanya halaman detail; indeks dan homepage selalu menampilkan versi yang tayang. Tanpa sesi staf, pratinjau tidak tersedia (404) dan cookie Draft Mode diabaikan. Media yang diunggah tetap mengikuti known issue di §9.3.

### 9.3 Aturan

- Validasi field tidak jalan saat Save Draft (`drafts` tanpa `validate`), sehingga draft boleh belum lengkap; field wajib diperiksa saat terbit (§4.1). Teruji: draft hanya dengan judul, slug, bahasa, dan Translation Group tersimpan; Publish-nya ditolak 400 dengan ringkasan, jenis publikasi, topik, penulis, dan Access Level sebagai field yang kurang (W1–W2).
- `publishedAt` terisi otomatis saat pertama terbit bila kosong dan tidak berubah saat terbit ulang atau saat revisi diterbitkan (§2.4 P3).
- Revisi setelah terbit disimpan sebagai draft di atas versi yang tayang; pengunjung tetap melihat versi yang terbit sampai Publish changes (§4.5).
- Simpan non-draft tanpa `_status` pada publikasi yang tayang dan punya draft tertunda ditolak 400; editor harus memilih Publish atau Save Draft (§2.6 P5). `updateSharedFields()` ikut ditolak dan di-rollback.
- Status tiap bahasa berdiri sendiri: unpublish versi ID tidak mengubah versi EN.
- **Slug:** jangan ganti slug publikasi yang sudah terbit sampai redirect slug lama tersedia (M3-07, DECISIONS §2.11 P9 A). Sampai itu URL lama langsung menjadi halaman not-found.
- Cache (§4.4): halaman publik dibaca saat request; tidak ada hook revalidasi di M3-03. Bacaan publik yang nanti memakai `"use cache"` wajib memberi `cacheTag` dan direvalidasi setelah commit (§2.6 P3).
- Sitemap dan indeks pencarian (§4.4) mengikuti M3-06/M3-07, preview draft M3-05 (§2.6 P2; diterapkan, §9.2), jejak audit aktor/waktu (§4.4, §7) M4-02 (§2.6 P7), dan privasi file Media dari draft (§4.1) M3-08 (§2.6 P8; known issue: file di bucket publik terbuka lewat URL-nya).
- Verifikasi: `tests/integration/workflow.test.ts` (W1–W13) dan `tests/unit/publication-workflow.test.ts`; preview: `tests/integration/preview.test.ts` (PV1–PV10) dan `tests/unit/preview.test.ts` (PVU1–PVU7) (TEST-PLAN §12.2). Tombol Preview di admin UI belum diuji otomatis (TEST-PLAN §12.5).
