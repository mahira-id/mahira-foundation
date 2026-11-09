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

- Default locale sebagai setting bernama (homepage `/` tetap berbahasa Indonesia tanpa redirect, tetapi tidak ada keputusan "default locale" untuk fungsi lain).
- Kanonikalisasi query string selain aturan `noindex`.
- Segmen route lain di bawah ini: topics, learning-hub, about, account, dan mount path admin.
- Kapan slug lama dianggap retired (aturan "permanent redirect only after content owner confirms") untuk konten produksi.

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

## Change history

| Date | Change |
|---|---|
| 2026-11-05 | Initial proposed ADR. |
| 2026-11-08 | Status Accepted for the rules in "Decision", approver Haidar (Product Owner). "Still open" section added. Earlier lists kept and labelled historical. |
