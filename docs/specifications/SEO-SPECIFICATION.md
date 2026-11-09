# SEO & Search Engine Presentation Specification

**ID:** SPEC-SEO-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Objective

Menjadikan publikasi mudah ditemukan dan dibagikan tanpa membuka aset/file yang seharusnya privat. Implementasi harus menjaga perbedaan antara halaman metadata publik dan file gated.

## 2. Indexability policy

| Surface | Indexing policy | Reason |
|---|---|---|
| Public homepage/about | Index | Public organization information. |
| Published publication detail | Index by default | Public metadata and abstract. |
| Public publication index | Index | Discovery page. |
| Taxonomy landing pages | Index only when useful, non-thin and curated | Avoid empty/duplicative archives. |
| Search result pages | Usually noindex for arbitrary query permutations | Avoid low-value URL explosion. |
| Account/admin/internal | Noindex | Private/service surface; still require auth. |
| Draft/preview | Noindex and access-protected | Must never be public. |
| Private asset object | No public indexing and no public access | Storage policy is the real protection. |

`robots.txt` is not access control. A noindex directive is not a substitute for authentication. Never put secrets or private file URLs in sitemap/metadata.

## 3. Metadata templates

### Homepage
- Title: approved organization name + concise purpose descriptor.
- Description: approved mission/value proposition; avoid unverified claims.
- Canonical: localized homepage.
- OG: organization-approved brand image.

### Publication detail
- Title: publication title + organization name, subject to sensible length.
- Description: editorially approved summary, not truncated arbitrary body text.
- Canonical: self URL of the locale record.
- OG image: approved cover or generated brand template using public assets only.
- Author/date/type: use actual verified metadata.

### Desk/topic/type page
- Title and description must explain the collection, not duplicate a generic template.
- Index only if it contains enough useful, curated content.

### Learning resource
- Title, description, thumbnail, format/provider, and dates where relevant.
- Do not claim course accreditation or learning outcomes without source.

## 4. Canonical, hreflang, redirects

Follow `IA-ROUTING-I18N.md`: canonical self URL per locale, reciprocal hreflang for published equivalent records only, explicit slug redirect mapping, and no false language alternate. Old routes should issue a single-hop permanent redirect where possible; avoid chains and loops.

## 5. Structured data

Evaluate schema.org types based on actual content characteristics and supported properties, for example `Organization`, `WebSite`, `BreadcrumbList`, and a suitable `Report`/`ScholarlyArticle`/`CreativeWork` type where justified. Do not force a schema type just to obtain a rich result. JSON-LD must match visible page content, must not include invented ratings/reviews, and must not expose private asset URLs. Validate using current search-engine tools/documentation at release time.

## 6. Paywalled/gated content

- Public metadata and summary remain visible as permitted by PRD.
- Do not place subscriber-only full text in HTML source, hidden DOM, JSON payload, hydration data, or public API response.
- Distinguish preview/abstract from full restricted content.
- Follow current Google guidance for paywalled content and `isAccessibleForFree`/`hasPart` only where it truly matches the page and implementation. Verify current syntax and eligibility before launch; do not treat structured data as a method to bypass access policy.
- PDF files are not made private by hiding the download button. Storage must enforce private access.

## 7. Sitemap

- Generate from published, indexable records only.
- Include localized URLs and alternate links only for real translations.
- Update after publication, unpublish, withdrawal, and slug change.
- Exclude noindex, account, admin, search parameter variants, previews, and private assets.
- Split sitemaps when scale/limits require; monitor generation errors.

## 8. Performance and technical SEO

- Server-render meaningful content and metadata for indexable public routes.
- Optimize image dimensions/formats and provide width/height or aspect ratio to limit layout shift.
- Font loading should limit layout shift and support Indonesian/English glyph coverage.
- Use descriptive link text, semantic headings, accessible alt text, and crawlable internal links.
- Handle 404, 410/withdrawn (if chosen), 301/308 redirects, and canonical consistently.
- Add analytics only after privacy/consent decision; do not block primary rendering on optional analytics.

## 9. Measurement

Define events and dashboards only after analytics/privacy decisions. Possible metrics: index coverage, organic landing sessions, publication detail engagement, search-to-detail conversion, PDF download authorization success/deny, and locale usage. Metrics must not be fabricated or shown as organization facts without a source and definition.

## 10. Launch acceptance

- Rendered HTML contains correct locale metadata.
- Canonical and hreflang match IA rules.
- No gated body or private asset URL appears in page source/network payload.
- Sitemap contains only published indexable pages.
- Account/admin/preview surfaces are noindex and authenticated.
- Broken redirects, 404s, duplicate titles, empty descriptions, and invalid JSON-LD are checked.
- Paywall markup is reviewed against current search guidance at release time.
