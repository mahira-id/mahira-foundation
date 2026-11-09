# SPIKE-003 — Supabase Storage and Gated Publication Assets

**Status:** Planned · **Decision links:** DEC-007, DEC-008, DEC-009 · **ADR:** 0006 · **Owner:** TBD

## Question
Can the selected upload/storage integration support public and private publication assets without persisting uploads on ephemeral application filesystem, and can the server enforce asset-level entitlement before issuing access?

## Scope
- Public cover/image upload.
- Public PDF upload/read.
- Private PDF upload to private bucket.
- Download endpoint with visitor, registered, active entitlement, expired entitlement, and denied cases.
- Signed URL expiry and object replacement lifecycle.
- Attempt direct access to the private object URL.

## Hypothesis
A private bucket plus server-side authorization and short-lived signed URL can satisfy the baseline. Immediate revocation of an already issued signed URL may not be guaranteed; the experiment must document actual provider semantics.

## Exit criteria
- Upload is durable across app redeploy/restart.
- Private bucket denies anonymous direct read.
- Unauthorized requests never receive signed URL.
- User cannot change asset/publication ID or role to bypass policy.
- Asset lifecycle handles pending, failed, replaced, unpublished, and deleted objects.
- Signed URL TTL behavior is measured and recorded.
- Audit log records decision outcome without logging the URL/token.
- Large-file download behavior is acceptable under chosen hosting/runtime constraints.

## Evidence
Bucket policies, test results, object metadata, signed URL expiry observations, failed upload recovery, egress/latency measurements, and storage adapter source/version.

## Open questions
- Payload storage adapter versus custom server-side Supabase Storage integration?
- Direct signed upload versus server-mediated upload?
- Do assets need independent access levels?
- Is watermarking ever required?
- What object retention/deletion and backup policy applies?
