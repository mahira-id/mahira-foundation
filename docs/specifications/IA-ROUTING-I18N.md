# Information Architecture, Routing & Internationalization Specification

**ID:** SPEC-IA-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Tujuan dan batas

Menetapkan sitemap konseptual, route ownership, locale behavior, URL invariants, dan perilaku perpindahan bahasa. Dokumen ini belum menyatakan struktur URL final sebagai keputusan diterima; ADR-0004 dan ADR-0005 harus disetujui sebelum route publik dimigrasikan atau slug produksi diterbitkan.

## 2. Prinsip

1. Semua route konten publik berada di bawah locale prefix (`/id` atau `/en`) sesuai SRS.
2. URL harus stabil, dapat dibagikan, dan tidak bergantung pada label navigasi yang dapat berubah.
3. Slug bukan primary key. Gunakan immutable internal ID untuk relasi dan operasi.
4. Locale UI dan locale konten harus diketahui secara eksplisit; jangan diam-diam menampilkan konten berbahasa lain seolah-olah terjemahan tersedia.
5. Route akun dan internal tidak masuk sitemap publik dan diberi `noindex`.
6. Filter dan query yang mengubah hasil listing sebaiknya tercermin dalam query string, bukan segmen path kecuali ada kebutuhan SEO yang disetujui.
7. Route admin Payload tidak dicampur dengan route publik; prefix final harus diuji terhadap konfigurasi Payload dan Next.js.

## 3. Sitemap konseptual

### 3.1 Public surface

| Page | Route candidate | Notes |
|---|---|---|
| Home | `/` (Indonesia; DEC-005, DECISIONS §2.7 P6 A) | Editorial landing page; only `locale: id` publications. Bare `/id` and `/en` stay 404 (DEC-005). English homepage: **OPEN**. |
| Publication index | `/{locale}/publications` | Search, filters, pagination. |
| Publication detail | `/{locale}/publications/{slug}` | One localized publication representation. |
| Publication type index | `/{locale}/publications/type/{typeSlug}` | Only if taxonomy deserves an indexable landing page. |
| Topic detail | `/{locale}/topics/{topicSlug}` | Implement only if user-facing taxonomy requires it. |
| Learning Hub index | `/{locale}/learning-hub` | Catalog. |
| Learning resource detail | `/{locale}/learning-hub/{slug}` | Detail or outbound/embed page. |
| About | `/{locale}/about` | Organization-controlled content. |
| Contact | `/{locale}/contact` | Publish only after contact process is approved. |

### 3.2 Account surface

| Page | Route candidate | Access |
|---|---|---|
| Account overview | `/{locale}/account` | Authenticated public user. |
| Profile | `/{locale}/account/profile` | Authenticated public user; own profile only. |
| Library / access | `/{locale}/account/library` | Authenticated public user; only own entitlements. |
| Download history | `/{locale}/account/downloads` | Optional, requires product/privacy approval. |
| Subscription | `/{locale}/account/subscription` | Phase 2; do not expose before subscription model exists. |

### 3.3 Internal surface

| Page | Route candidate | Access |
|---|---|---|
| Payload admin | `/admin` (candidate) | Payload staff auth and collection access control. |
| Custom staff operations | `/internal/...` (candidate) | Explicit server-side staff authorization. |

No public account session may grant access to `/admin`. No staff cookie may be interpreted as a public-user entitlement.

## 4. Locale behavior

- Supported locales: `id` and `en` (baseline requirement).
- Default locale: `id`. Dijawab Owner 2026-11-10 (DECISIONS §2.4 P4c, ADR-0005 "Still open"): `DEFAULT_LOCALE = "id"` hanya untuk `/` dan `defaultLocale` Payload; tanpa redirect ke locale default dan tanpa fallback konten. Diterapkan di M3-01 (`lib/i18n/locales.ts`).
- Locale detection: may use user preference or `Accept-Language` only for initial routing. Persisted user preference, if introduced, must not override an explicitly requested URL locale.
- Explicit URL locale wins over browser preference.
- Unknown locale: return a controlled not-found or redirect to an approved default; never create an unbounded redirect loop.
- Locale switcher: switch to the equivalent translated record only when a valid translation relationship exists. Otherwise, show a clear unavailable state or navigate to the destination locale's index according to approved UX; do not fabricate a slug.
- Fallback content: if field-level fallback is chosen, indicate the source language in UI and metadata wherever fallback could mislead. Recommended default: do not silently publish fallback-language body copy as a localized page.
- Date/number formatting: use locale-aware formatting; store timestamps in a timezone-safe canonical format and organization timezone separately if required.

## 5. Slug and URL rules

1. Lowercase, URL-safe slug; normalize whitespace and punctuation deterministically.
2. Store slug per localized content record if linked translations are selected; uniqueness should be scoped deliberately (e.g. locale + route collection), not assumed.
3. Slug change requires a redirect record from old path to new path. Redirects must be locale-aware and loop-checked.
4. Reserved path segments (`admin`, `account`, `api`, `internal`, `topics`, `publications`, `learning-hub`) must not be accepted as conflicting content slugs in their respective route namespace.
5. Do not derive a permanent slug from a mutable title at request time.
6. Use stable IDs for cache tags, relations, and internal links; do not use localized slug as a foreign key.
7. Decide trailing slash policy once and apply consistently to canonical URLs, redirects, sitemap, and links.
8. Query parameters for search/filter should be normalized, bounded, and safe to share. Do not index arbitrary query permutations by default.

## 6. Canonical and hreflang

- Each indexable localized page emits a self-referencing canonical URL.
- Translation equivalents emit reciprocal `hreflang` alternates only when both records are published and genuinely equivalent.
- `x-default` is optional and should point to a neutral locale selector or approved default page.
- Do not canonicalize EN to ID merely because one translation is missing.
- Draft, preview, account, internal, and non-public states must not be included in public sitemap output.

## 7. Search and taxonomy URL state

Recommended query contract for publication listing:

`?q=...&type=...&topic=...&year=...&page=...&sort=...`

- All parameters optional; invalid values normalize or return a safe validation response.
- Search is initially scoped to active locale (SRS recommendation); cross-language search remains an open product decision.
- Pagination is deterministic, with stable sort tie-breaker (e.g. published date then ID).
- Shareable filters are preserved by links; transient input keystrokes need not update URL until committed.
- Define maximum page size and maximum query length in API specification.

## 8. Sitemap and robots route ownership

- Public sitemap includes published, indexable content only, per locale.
- Include alternates when translations exist.
- Exclude account/admin/internal/preview/auth callback/utility endpoints.
- `robots.ts` must not be treated as an authorization control. Private endpoints and files remain protected server-side.
- `robots.txt` disallow rules are not a substitute for `noindex` or access control.

## 9. Acceptance criteria

- Direct request to `/id/...` and `/en/...` renders the requested locale or a defined unavailable state.
- Language switching resolves to the linked translated record, not a guessed slug.
- Published translated pages emit reciprocal hreflang; missing translations do not create false alternates.
- Canonical URL matches normalized locale route.
- Account/admin pages are excluded from sitemap and carry `noindex`.
- Search/filter state survives refresh and can be shared.
- Slug updates create validated redirects and do not break internal references.

## 10. Open decisions

| ID | Decision | Needed before |
|---|---|---|
| IA-01 | Default locale — dijawab Owner 2026-11-10: `id`, hanya untuk `/` dan Payload (DECISIONS §2.4 P4c; §4) | Routing implementation |
| IA-02 | Linked records vs field localization | Content schema |
| IA-03 | Locale fallback behavior | UX and CMS implementation |
| IA-04 | Topic public index strategy (Desk out of scope, DEC-003) | Sitemap and taxonomy routes |
| IA-05 | Search locale scope | Search implementation |
| IA-06 | Slug uniqueness and redirect retention | Migration and route implementation |
