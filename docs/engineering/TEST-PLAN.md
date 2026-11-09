# Test Plan & Quality Strategy

**ID:** ENG-TEST-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Quality objectives

Verify not only that pages render, but that publication lifecycle, locale behavior, authorization, private file delivery, and operational recovery work end-to-end. Security-critical behavior must have tests before release, not only manual QA.

## 2. Test layers

| Layer | Purpose | What to test | Tool choice |
|---|---|---|---|
| Static checks | Catch style/type issues | Lint, typecheck, formatting | Existing ESLint/TypeScript; formatter TBD. |
| Unit | Isolated business rules | Entitlement evaluator, slug/locale utility, schema validation | Test runner TBD. |
| Component | UI behavior/states | Locked state, forms, access badges, keyboard behavior | React component testing library TBD. |
| Integration | Boundaries and adapters | Payload/Postgres, Auth, RLS, Storage, route handlers | Test DB/projects and provider mocks. |
| E2E | Complete user workflows | Editorial publish, browse/search, auth, gated download | Playwright is a candidate. |
| Security | Adversarial access | IDOR, privilege escalation, direct object access, secret leakage | Automated tests + manual review. |
| SEO | Search presentation | HTML metadata, canonical, hreflang, sitemap, structured data | HTML assertions and crawler validation. |
| Accessibility | Inclusive use | Keyboard, focus, labels, contrast, semantics, zoom | Automated tooling + manual tests. |
| Performance | Real loading behavior | CWV, query latency, large PDF delivery, image/font impact | Staging measurements and production monitoring. |
| Recovery | Operational resilience | Restore, failed upload, expired session, cache failure | Runbook exercises. |

Select exact library versions only after reviewing current compatibility and project constraints.

## 3. Risk-based priority

**P0 release gates:** publication visibility correctness, no draft leakage, role boundaries, private asset authorization, RLS for app-owned user data, session handling, public SEO metadata, migration repeatability, staging deployment, basic backup restore.

**P1:** search relevance, editorial workflow edge cases, bilingual parity, performance budgets, accessibility audit, monitoring/alerting, account data self-service.

**P2:** bookmark/history, newsletter, advanced analytics, PDF full-text search, advanced Learning Hub/LMS, subscription payment lifecycle.

Priority values must be reconciled with the final MVP decision in PRD/SRS.

## 4. Minimum authorization matrix tests

| Asset/access | Visitor | Registered no grant | Subscriber active | Subscriber expired | Editor | Admin |
|---|---|---|---|---|---|---|
| Public metadata | Allow | Allow | Allow | Allow | Allow | Allow |
| Public asset | Allow | Allow | Allow | Allow | Allow | Allow |
| Registered asset | Deny | Allow | Allow | Allow | Deny (DEC-009) | Deny (DEC-009) |
| Subscriber asset | Deny | Deny | Allow | Deny | Deny (DEC-009) | Deny (DEC-009) |
| Draft metadata | Deny | Deny | Deny | Deny | According to CMS access | According to CMS access |
| Change staff role | Deny | Deny | Deny | Deny | Deny | Allow |

DEC-009 (Accepted 2026-11-09): Editor/Admin columns describe the public download endpoint. A CMS session gives no bypass there; only the public account's entitlement counts. Editor/Admin handle assets inside the CMS under Payload access control.

## 5. Unit test cases — access evaluator

- Public asset allows anonymous request when asset/publication is published.
- Registered access denies anonymous.
- Registered access allows authenticated user under approved registration rule.
- Subscriber access denies when entitlement missing.
- Subscriber access denies when entitlement expired or not yet valid.
- Revoked/suspended entitlement denies.
- Entitlement for a different publication/asset does not grant access.
- Multiple grants resolve according to documented precedence.
- Draft/unpublished/withdrawn asset denies regardless of entitlement.
- Stale or malformed identity facts deny.
- Staff identity does not silently imply subscriber entitlement.
- Client-supplied access level has no effect.

## 6. Integration test cases

- Payload collection create/update/publish with correct schema migration.
- Payload role restrictions on collection and globals.
- Supabase profile RLS blocks cross-user select/update.
- Entitlement self-read allowed but self-grant denied.
- Private bucket object cannot be read anonymously.
- Server issues a signed URL only after policy allows.
- Storage failure returns safe error and no audit false-success.
- Replacing/deleting asset does not orphan or expose previous object.
- Cache revalidation follows successful publish commit.

## 7. E2E scenarios

### Editorial
1. Editor logs into staff CMS.
2. Creates publication draft in ID.
3. Adds author, taxonomy, cover, and a public or private asset.
4. Saves preview; visitor cannot access draft URL or asset.
5. Authorized staff publishes; public detail renders correct metadata.
6. Search and sitemap include published item.
7. Unpublish/withdraw removes it from public listings and sitemap.

### Public reader
1. Visitor opens index, searches, filters, paginates.
2. Opens detail and sees metadata/abstract.
3. Downloads public asset.
4. Attempts gated asset and sees correct sign-in/entitlement guidance.

### Account
1. User registers and verifies according to configured policy.
2. User signs in and sees own account details.
3. User cannot inspect or mutate another user's profile/entitlements.
4. Manual grant allows only relevant scoped access.
5. Expiry/revocation denies subsequent authorization requests.

## 8. Localization/SEO tests

- Correct locale route, translated content, date/number formatting.
- Missing translation does not silently display wrong language.
- Hreflang only for true equivalent published pairs.
- Canonical self-references correct URL.
- Noindex account/admin/preview; not in sitemap.
- Private body/file URL absent from HTML, hydration JSON, network payload, and OG tags.
- Slug redirect no loops/chains.

## 9. Security testing checklist

- IDOR across user IDs and asset IDs.
- Privilege escalation through signup metadata or profile update.
- CSRF/session protection as applicable to chosen framework patterns.
- XSS in rich text, embeds, titles, search terms, and CMS content.
- SQL injection/query filter abuse (use parameterized/query builder patterns).
- Open redirect via return URL.
- Upload MIME spoofing, oversized files, malicious filenames, malformed PDF/image.
- Direct object URL access and signed URL leakage.
- Rate limiting/abuse on download and auth endpoints.
- Secret scanning and client bundle inspection.
- Staff MFA/configuration and session expiry behavior.

## 10. Test data and environments

Use deterministic synthetic fixtures representing both locales, multiple authors/desks/types, each access level, draft/published/withdrawn states, and active/expired/revoked entitlements. Avoid production PII. Staging should be production-like but isolated.

## 11. Exit criteria

A release candidate passes all P0 tests, has no unresolved critical/high security issue, has recorded manual review for tests that cannot be automated, and includes reproducible evidence (CI result, staging checklist, screenshots/log references) tied to a commit.
