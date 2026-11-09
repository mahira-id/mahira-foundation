# Release Readiness Checklist

**ID:** ENG-RELEASE-001 · **Status:** Proposed checklist · **Version:** 0.1.0

Gunakan checklist ini untuk setiap release candidate. Tandai N/A dengan alasan, bukan membiarkannya ambigu.

## 1. Product and content

- [ ] MVP/release scope and acceptance criteria approved.
- [ ] Content owner, editorial owner, and escalation contact identified.
- [ ] Production publication metadata reviewed.
- [ ] Author names, dates, taxonomy, language, rights, and disclaimers verified.
- [ ] PDF/asset opens, matches metadata, and is approved for distribution.
- [ ] No placeholder statistics, fake testimonials, or unverified organization claims.
- [ ] Translation status is explicit; no silent wrong-language fallback.

## 2. Architecture and data

- [ ] All relevant ADRs are Accepted/Rejected/Superseded, not accidentally Proposed.
- [ ] Database ownership and migration authority documented.
- [ ] Production migrations reviewed and rehearsed in staging.
- [ ] Seed scripts do not include personal/sensitive production data.
- [ ] Backup completed and restore procedure has recent evidence.
- [ ] Storage object lifecycle and orphan cleanup understood.

## 3. Security and privacy

- [ ] No secret in repository, logs, source maps, client bundle, or public response.
- [ ] Service-role key server-only and narrowly used.
- [ ] RLS and Payload access control tests pass.
- [ ] All sensitive endpoints perform server-side authorization.
- [ ] Private bucket/object access denied without authorization.
- [ ] No private file URL/body appears in HTML, hydration payload, sitemap, or OG metadata.
- [ ] Staff roles and staff MFA policy reviewed.
- [ ] Rate limiting and abuse protections configured where required.
- [ ] Privacy notice, purpose, lawful basis/consent, retention, deletion, and contact process reviewed with qualified advisor.
- [ ] Incident response contacts and reporting process known.

## 4. UX, accessibility, and content presentation

- [ ] Mobile/tablet/desktop layouts reviewed in both ID and EN.
- [ ] Keyboard-only journey works; focus indicators visible.
- [ ] Forms have labels, understandable errors, and success feedback.
- [ ] Empty, loading, no-result, error, locked, disabled, and unauthorized states reviewed.
- [ ] Color contrast and reduced-motion behavior checked.
- [ ] Images have appropriate alt treatment and dimensions.
- [ ] Long publication titles and author lists do not break layouts.

## 5. SEO and distribution

- [ ] Metadata, canonical, hreflang, OG, and sitemap verified on rendered HTML.
- [ ] Account/admin/preview pages noindex and excluded from sitemap.
- [ ] Redirects tested; no loops/chains for changed slugs.
- [ ] Structured data matches visible facts and current search guidance.
- [ ] Social preview tested for representative publication pages.
- [ ] `robots.ts` behavior verified; no assumption that it protects private content.

## 6. Reliability and operations

- [ ] Production environment variables checked and isolated from staging.
- [ ] DNS/domain and TLS verified.
- [ ] Email authentication and delivery smoke test performed if email is in scope.
- [ ] Error monitoring and uptime check are active.
- [ ] Alert routing and runbook owner identified.
- [ ] Cache invalidation/revalidation verified on publish/unpublish.
- [ ] Rollback procedure and previous known-good release identified.
- [ ] Smoke tests pass after deployment.
- [ ] Known issues and support contact documented.

## 7. Release approval

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Product owner | TBD | Pending | — | — |
| Technical owner | TBD | Pending | — | — |
| Editorial owner | TBD | Pending | — | — |
| Privacy/legal reviewer | TBD | Pending / N/A with reason | — | — |

A release is not approved while a critical security issue, private-file exposure, data corruption risk, or unreviewed destructive migration remains unresolved.
