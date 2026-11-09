---
name: secure-publication-download
description: Design, implement, or review publication asset classification, private object storage, entitlement evaluation, download endpoints, signed URLs, download audit, and access-denied behavior.
---
# Secure Publication Download

## Preconditions

Read `docs/architecture/ACCESS-POLICY.md`, `DATA-MODEL.md`, and relevant accepted ADRs. Confirm DEC-009 staff access, DEC-010 authorization semantics, DEC-011 storage, and the storage/gating spike. If any is OPEN, do not implement the final access behavior.

## Mandatory model

- Authorize the specific asset, not only whether the page displays a download button.
- Keep publication metadata and file access separate.
- Restricted objects must be in private storage; never in `public/` or a public bucket.
- Determine access on the server using trusted publication metadata and canonical entitlement data.
- Fail closed on missing, invalid, expired, revoked, or contradictory data.
- Signed URLs are short-lived bearer credentials. Never log them, place them in analytics, or expose them before policy approval.
- Explain that an already-issued signed URL remains usable until expiry unless the provider supports revocation of that object/session.
- Record only audit information justified by security and privacy policy.

## Verification

Test anonymous, registered, valid subscriber, expired subscriber, revoked entitlement, wrong scope, wrong asset ID, unpublished content, missing file, direct private-object URL, and staff policy. Check both API response and storage behavior.
