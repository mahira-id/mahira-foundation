# Integration Contracts

**Status:** Proposed integration boundary guide  
**Related:** SRS §2, §8–§11; DEC-006–DEC-019

## 1. Purpose

Menjelaskan kontrak dan pemilik integrasi antara Next.js, Payload, Supabase services, storage, email, observability, search, dan payment provider di masa depan. Ini bukan vendor API reference.

## 2. Integration inventory

| Integration | Direction | Data exchanged | Trust/secret boundary | Failure policy |
|---|---|---|---|---|
| Next.js ↔ Payload Local API | Server → CMS | Published content queries, preview, editorial operations | Server-side only for privileged operations; Payload access control still applies where relevant. | Fail safe; public cache fallback only if content validity is known. |
| Next.js ↔ Supabase Auth | Browser/server ↔ Auth | Session, signup/login/reset, verified user identity | Public anon key can be client-visible under Supabase model; service role remains server-only. Validate exact key use. | Auth-required flow fails closed. |
| Next.js ↔ App Postgres | Server → DB | Profile, entitlement, audit/event | Use scoped connection/credentials; RLS or explicit server-only path documented. | Deny restricted access if authority unavailable. |
| Next.js/Payload ↔ Storage | Server → object storage | Upload, metadata, public/private object access | Storage secrets server-side; client upload only via controlled signed upload design. | Retry safely; no partially published asset. |
| Search ↔ Postgres | Server/query | Indexed public metadata | Draft/private data excluded. | Search unavailable state; no fallback to insecure query. |
| Next.js → Email | Server → provider | Verification/reset/transactional email | API/SMTP secret server-only; domain authentication. | Retry/idempotency and status log without secrets. |
| Next.js → Sentry/monitor | Server/client SDK | Error and performance context | Scrub PII, tokens, signed URLs; environment separation. | App should not depend on telemetry availability. |
| Payment provider → webhook (Phase 2) | Provider → server endpoint | Signed event and transaction references | Verify signature/authenticity; replay/idempotency protection. | Durable queue/state and retry/reconciliation. |

## 3. Content read contract

- Public read layer returns only published, locale-matched, public-projection fields.
- Draft/preview requires staff-authorized preview session and must not be shared as public content.
- Queries always include locale and publication status.
- Query result pagination is stable and bounded.
- CMS internal IDs may be used server-side; public URLs use slug.

## 4. Storage upload contract

- Staff upload is authenticated and authorized.
- Validate file size, extension, declared MIME, actual content signature where feasible, and permitted formats.
- Create pending metadata/object state; publish asset only after successful upload and validation.
- Avoid orphaned objects: cleanup failed/pending uploads after a defined retention window.
- Store object key privately; never pass it back to public client.
- If direct-to-storage upload is used, issue a short-lived upload permission limited to one object/path and validate completion server-side.
- Replacing an asset should preserve old version/reference until new asset is verified, where editorial audit requires.

## 5. Auth/session contract

- Use official server/client helpers appropriate to pinned Supabase SSR package version.
- Read identity from a verified session on the server.
- Refresh cookies/tokens only using documented framework integration.
- Do not copy Supabase session into localStorage manually.
- Protect account routes on the server; middleware may redirect for UX but is not the only authorization check.
- Staff Payload session must not be used as a Supabase public-user identity.

## 6. API versioning and compatibility

Internal application APIs may start unversioned while only one frontend consumes them, but response shapes must be treated as contracts and changed deliberately. If external consumers or public integrations arise, introduce explicit versioning and deprecation policy. Never expose Payload privileged API or database connection directly to the browser.

## 7. Secrets inventory

Exact env var names are finalized with the selected libraries and code. At minimum inventory database URL(s), Payload secret, Supabase URL and public/anon key, Supabase service-role key (server only), storage credentials, email provider credentials, Sentry configuration, webhook secret (future payment), and preview/revalidation secrets if used. See `engineering/ENVIRONMENTS.md`.

## 8. Contract verification

Every integration requires: successful path, invalid credential path, provider timeout, retry behavior, duplicate request behavior, logging/correlation, secret non-disclosure, and environment separation. Add contract tests where possible and document pinned versions.
