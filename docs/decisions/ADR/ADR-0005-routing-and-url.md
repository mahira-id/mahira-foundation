# ADR-0005 — Locale-prefixed Routing and Slug Policy

- **Status:** Accepted (2026-11-08) for the rules in "Decision" below. Validation evidence pending: Spike A prototype of spec `03-architecture-technical-validation` (design Revision 3 §22). The rules under "Still open" are not decided.
- **Related decisions:** DEC-004, DEC-005 (Accepted 2026-11-08), DEC-021 (Accepted 2026-11-08)
- **Decision owner / approver:** Product Owner. Approver: Haidar (Product Owner), 2026-11-08. No SEO owner is named yet; the Product Owner approved in that role's place.

## Context

PRD dan SRS mengusulkan `/id` dan `/en`, stable slug, hreflang, canonical, shareable filter state, serta area akun yang noindex. Repository awal hanya menampilkan `app/page.tsx`; struktur route locale belum terbukti diimplementasikan.

## Decision (Accepted 2026-11-08)

Detail lengkap ada di `docs/decisions/DECISIONS.md` §2.1 (DEC-005, DEC-021).

- Locale yang didukung: `id` dan `en`, selalu sebagai prefix URL (`/id/...`, `/en/...`).
- `/` tetap homepage, tanpa redirect.
- Route publikasi: `/{locale}/publications` (indeks) dan `/{locale}/publications/{slug}` (detail). Segmen teknis `publications` tidak diterjemahkan.
- Slug publikasi unik per locale.
- Slug lama di-redirect dengan HTTP 308 dalam satu hop.
- URL tanpa trailing slash; varian dengan trailing slash di-redirect 308.
- Varian huruf besar mengembalikan 404. `/id` dan `/en` tanpa segmen lanjutan mengembalikan 404.
- Language switcher tanpa pasangan terjemahan yang eligible mengarah ke indeks publikasi locale lain.
- Canonical self-referencing; `hreflang` hanya jika pasangan terjemahan eligible; halaman search dan filter `noindex` (DEC-021).

## Still open (not decided by this ADR)

- ~~Default locale sebagai setting bernama (homepage `/` tetap berbahasa Indonesia tanpa redirect, tetapi tidak ada keputusan "default locale" untuk fungsi lain).~~ **Dijawab Owner 2026-11-10** (DECISIONS §2.4 P4c): konstanta `DEFAULT_LOCALE = "id"` (`lib/i18n/locales.ts`) hanya untuk `/` dan `localization.defaultLocale` Payload; tanpa redirect dan tanpa fallback konten. Diterapkan di M3-01.
- ~~Kanonikalisasi query string selain aturan `noindex`.~~ **Dijawab Owner 2026-11-15** (DECISIONS §2.13 keputusan 2): halaman 1 indeks tanpa `?page`, `?page=n` tanpa filter dapat diindeks dengan canonical ke dirinya sendiri, URL dengan `q` atau filter `noindex, follow` tanpa canonical. Usulan planner (PP10): `?page=1` dan parameter tak dikenal (mis. `?utm_source=`) memakai canonical URL dasar. Domain canonical `https://mahira.id` (keputusan 1). Diterapkan di M3-07.
- Segmen route lain di bawah ini: topics, account, dan mount path admin. ~~learning-hub~~ **Dijawab Owner 2026-11-17** (DECISIONS §2.16 keputusan 7): `/{locale}/learning-hub` dan `/{locale}/learning-hub/{slug}` untuk kedua locale, slug unik per locale, belum ada riwayat slug; diterapkan di M3-12. ~~about~~ dijawab di DECISIONS §2.15 (M3-09).
- Kapan slug lama dianggap retired (aturan "permanent redirect only after content owner confirms") untuk konten produksi. Sejak M3-07 (riwayat slug, DATA-MODEL §4.8) slug lama disimpan dan di-redirect sampai slug itu diterbitkan record lain (URL pindah ke record itu) atau record dihapus; aturan retired yang dikonfirmasi pemilik konten tetap belum diputuskan.

## Proposed route baseline (historical, before acceptance)

```text
/{locale}
/{locale}/publications
/{locale}/publications/{slug}
/{locale}/topics/{slug}
/{locale}/publications/type/{slug}
/{locale}/learning-hub
/{locale}/learning-hub/{slug}
/{locale}/about
/{locale}/account
/{locale}/account/profile
/{locale}/account/library
/admin                    # Payload admin; confirm mount path
```

Route names and taxonomy segments are proposals, except the two publication routes accepted above. `/{locale}` alone returns 404 under the accepted decision. Desk routes are outside the accepted taxonomy (DEC-003) and were removed. Search (`/{locale}/publications?q=`) and type pages (`/{locale}/publications/type/{slug}`) were decided 2026-11-09 (DECISIONS DEC-005 addendum). Freeze the other segments only after information architecture review.

## Rules to decide (historical list; see "Decision" and "Still open")

- Supported locales: `id`, `en`; default locale: TBD (likely `id`, not yet accepted).
- Root `/` behavior: deterministic redirect or locale selection; must not vary unpredictably by user agent.
- Content slug: language-specific only if localization model allows; uniqueness scope must be explicit.
- Locale switching: preserve translation identity when equivalent translation exists; otherwise take the user to corresponding index or a clear unavailable state, not an unrelated slug.
- Query strings: committed search/filter/sort/pagination state is shareable and canonicalized intentionally.
- Old slug: redirect map with permanent redirect only after content owner confirms old URL is retired and target equivalent.
- Do not translate technical route segments differently per locale unless a deliberate SEO/IA decision requires it.

## Proposed route conventions

- Lowercase, kebab-case slugs; no trailing slash unless framework configuration requires a uniform convention.
- URL encoding handled by framework; normalize and validate input server-side.
- Do not place private IDs or storage object keys in public URLs.
- Account/admin paths are noindex and excluded from public sitemap.
- Admin path must not be treated as a security control; authorization is server-side.

## Validation

Test locale switching, missing translation, duplicate slug, renamed slug redirect, query parameter persistence, canonical, hreflang pairs, sitemap exclusion of private pages, and 404 behavior.

Status validasi (2026-11-08): belum dijalankan. Prototipe Spike A (spec 03 design Revision 3 §22, tahap P3 sampai P5) menguji aturan di bagian "Decision".

Status validasi (2026-11-10): dijalankan di M2-02 pada branch spike/m2-payload-postgres; hasil di SPIKE-001 §7.6; rekomendasi di DECISIONS §2.3. Status ADR tidak berubah.

Status validasi (2026-11-15, M3-07, branch `feat/m3-07-seo`): "renamed slug redirect" diuji di `tests/integration/slug-redirect.test.ts` RD1–RD9 (satu hop untuk rantai A → B → C, locale sama saja, tanpa loop, slug yang dipakai ulang, record tujuan tidak tayang atau terbatas, Googlebot) dan `tests/unit/slug-redirect.test.ts` SLU1–SLU7. Aturan "Slug lama di-redirect dengan HTTP 308 dalam satu hop" terpenuhi sebagai 308 sungguhan hanya untuk user agent di daftar `htmlLimitedBots` (`lib/seo/html-limited-bots.ts`: daftar bawaan Next 16.4.4, misalnya Bingbot, ditambah Googlebot sejak M3-07 keputusan 8, DECISIONS §2.13). Dengan daftar yang sama, aturan "Upper-case variants return 404" untuk slug publikasi berhuruf besar kini berupa HTTP 404 sungguhan untuk crawler itu (`tests/integration/publication-detail.test.ts` DT11); browser tetap HTTP 200 + `noindex` (amandemen §2.11 P7 A). Aturan "Bare `/id` and `/en` return 404" memakai halaman 404 global Mahira sejak M3-07 keputusan 9 (`app/global-not-found.tsx`). User agent lain menerima HTTP 200 karena static shell route detail sudah terkirim (sama dengan amandemen DECISIONS §2.11 P7 A); redirect permanennya ada di payload RSC dan diikuti router browser, tanpa refresh meta, jadi tanpa JavaScript tidak ada pengalihan (IA-ROUTING-I18N §5 aturan 3; usulan planner PP5, DECISIONS §2.13). Status ADR tidak berubah.

Status validasi (2026-11-15, M3-07, canonical/hreflang/sitemap): "canonical, hreflang pairs, sitemap exclusion of private pages" diuji di `tests/integration/seo.test.ts` SE1–SE8 (canonical `https://mahira.id` ke dirinya sendiri di `/`, indeks, dan detail; hreflang timbal balik hanya untuk pasangan published + `public`, tanpa hreflang bila pasangan draft atau unpublished; URL dengan `q`/filter `noindex, follow` tanpa canonical; sitemap tanpa draft, unpublished, `registered`, `subscriber`), `tests/unit/seo.test.ts` SEU1–SEU11, dan gerbang `tests/build/env-gate-http.test.ts` G9 (sitemap hanya `/` saat CMS mati). Aturan "Canonical self-referencing; `hreflang` hanya jika pasangan terjemahan eligible; halaman search dan filter `noindex`" terpenuhi; tanpa `x-default` (DECISIONS §2.13 keputusan 3). Status ADR tidak berubah.

## Change history

| Date | Change |
|---|---|
| 2026-11-05 | Initial proposed ADR. |
| 2026-11-08 | Status Accepted for the rules in "Decision", approver Haidar (Product Owner). "Still open" section added. Earlier lists kept and labelled historical. |
| 2026-11-10 | Validation pointer to M2-02 results (SPIKE-001 §7.6, DECISIONS §2.3) added. Status unchanged. |
| 2026-11-10 | "Still open" default-locale item marked answered by the Owner (DECISIONS §2.4 P4c); implemented in M3-01. Status unchanged. |
| 2026-11-15 | M3-07: slug-history retention noted under "Still open" (retirement rule still open); validation of the old-slug 308 recorded, including the HTTP status per user agent. Status unchanged. |
| 2026-11-15 | M3-07: query-string canonicalization item under "Still open" marked answered by the Owner (DECISIONS §2.13 decision 2); validation of canonical, hreflang and sitemap exclusion recorded. Status unchanged. |
