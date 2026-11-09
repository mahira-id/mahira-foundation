# ADR-0006 — Publication Assets, Access Control and Private Delivery

- **Status:** Proposed; security decision requires explicit approval
- **Related decisions:** DEC-009, DEC-010, DEC-011, DEC-012
- **Decision owner / approver:** Security owner + Product Owner — TBD

## Context

Baseline PRD/SRS places `access_level` on Publication and requires private PDFs, server-side authorization, short-lived signed URLs, and no public-bucket exposure. A publication may contain multiple files with potentially different exposure (cover, preview, full report, appendix, dataset). This asset-level requirement is a design question not yet resolved in the baseline.

## Proposed model

- Publication carries a default access level (`public`, `registered`, `subscriber`).
- PublicationAsset carries file metadata and may optionally declare an access override.
- Effective asset access should never be less restrictive than its publication default unless an explicit product rule permits a public asset under a gated publication. For the initial safe model, an asset's effective access is the stricter of publication default and asset override.
- Public cover/preview should be stored as public objects only after editorial classification.
- Full files and restricted appendices should use private object storage.
- Client receives an opaque asset identifier, not a trusted bucket/key or access decision.
- Server resolves asset from trusted content data, authenticates principal, evaluates policy, records decision, then generates short-lived signed URL.

## Access principal

Public users use Supabase Auth. Staff use Payload Auth. Staff access to private assets is denied until DEC-009 explicitly defines a separate audited policy. No automatic Admin bypass should be inferred in the user-facing download path.

## Evaluator contract (proposed)

Input: principal (anonymous/public user/staff), asset, publication, current server time, relevant entitlement records, request context.  
Output: `allow` or `deny`, stable reason code, required action (login / obtain entitlement / unavailable), audit classification. Evaluator must be deterministic for the same normalized inputs and must fail closed on missing or inconsistent data.

## Signed URL controls

- TTL must be short and configurable. Exact value is TBD and must be balanced against file size and user experience.
- Never log full signed URLs or tokens.
- Do not persist signed URLs in CMS records, analytics, page HTML, or public caches.
- Download endpoint must not be publicly cacheable; verify behavior of CDN/framework caching.
- Re-check authorization for each URL issuance. Understand that an issued signed URL may remain usable until expiration unless provider supports revocation.
- Use random opaque object keys; obscurity is not access control.
- Validate allowed MIME types, size, extension, filename handling, and malware-scanning needs based on operational risk.

## Error semantics

- `401` or login redirect: unauthenticated principal when login is required.
- `403` or a non-disclosing locked response: authenticated but not entitled.
- `404`: asset/publication does not exist or is intentionally concealed to avoid enumeration; policy must be consistent.
- `410`: removed content only if product/SEO policy explicitly wants a gone response.

The exact UX and status mapping must be decided; do not use HTTP status alone as the UI message.

## Validation

Test direct object URL, guessed key, expired signed URL, tampered asset ID, cross-user access, revoked entitlement, missing entitlement, staff session, anonymous request, cache behavior, and concurrent download requests.
