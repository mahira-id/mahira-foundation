# API Specification — Application Contracts

**ID:** SPEC-API-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Tujuan

Mendokumentasikan kontrak server-side yang dipakai browser atau integrasi internal. Ini bukan pengganti API resmi Payload/Supabase. Gunakan server components dan direct server-side library calls bila tidak diperlukan HTTP boundary; buat Route Handler hanya ketika dibutuhkan oleh browser, file download, webhook, atau integrasi eksternal.

## 2. General contract

- Semua input dari client dianggap tidak tepercaya.
- Validasi input di server menggunakan schema validator yang disepakati (library TBD).
- Jangan menerima `role`, `access_level`, `owner_id`, `entitlement_status`, `storage_bucket`, atau keputusan `allowed` dari client sebagai fakta otoritatif.
- Identitas berasal dari session yang diverifikasi di server.
- Gunakan HTTP status yang konsisten; jangan mengungkap apakah suatu file privat ada jika policy mengharuskan respons yang sama untuk mengurangi enumeration.
- Response tidak mengandung secret, database detail, signed URL permanen, stack trace, atau object key privat.
- Terapkan rate limit pada auth-sensitive, search, download-token, dan endpoint publik yang rentan abuse; vendor/algoritma TBD.
- Log correlation/request ID, bukan token, password, signed URL, atau isi dokumen.
- Gunakan idempotency untuk operasi mutasi yang dapat diulang dan seluruh webhook pembayaran fase 2.

## 3. Contract envelope (recommended)

Success response dapat menggunakan bentuk konsisten:

```json
{
  "data": {},
  "meta": { "requestId": "..." }
}
```

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa input yang dikirim.",
    "fields": {}
  },
  "meta": { "requestId": "..." }
}
```

Jangan mengirim internal exception message kepada pengguna. Untuk server component errors, gunakan error boundary yang sesuai.

## 4. Proposed application endpoints

Semua path berikut adalah kandidat. Sesuaikan dengan Next.js Route Handler conventions dan kebutuhan nyata; hindari membuat endpoint hanya untuk membungkus query yang dapat dilakukan di server.

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/publications` | Public | Search/list; bounded filters and pagination. |
| GET | `/api/publications/{id-or-safe-key}` | Public | Optional data endpoint; public pages may fetch server-side directly. |
| POST | `/api/files/{assetId}/download` | Conditional | Authorize access and issue short-lived signed URL or stream/proxy. |
| GET/PATCH | `/api/account/profile` | Supabase user | Read/update own profile only. |
| GET | `/api/account/entitlements` | Supabase user | Read own effective entitlement summary. |
| GET | `/api/account/downloads` | Supabase user | Optional own history, if approved. |
| POST | `/api/webhooks/{provider}` | Provider signature | Phase 2 verified payment event only. |
| POST | `/api/revalidate` | Secret/system | Optional protected cache revalidation endpoint. |

Payload admin APIs remain governed by Payload auth and access control. Do not expose service credentials or create a browser path that bypasses Payload access control.

## 5. Download contract

### Request

`POST /api/files/{assetId}/download`

The authenticated/anonymous caller identifies only the asset requested. The server loads publication/asset access metadata from trusted sources.

Optional request body may contain a client correlation hint only:

```json
{ "clientRequestId": "opaque-uuid" }
```

Do not accept client-supplied user ID or access level.

### Decision flow

1. Resolve asset by immutable ID and confirm it is deliverable/published.
2. Resolve publication and effective asset access policy.
3. Verify Supabase public-user session when access requires it.
4. Load active entitlement(s) from trusted server-side source.
5. Evaluate explicit policy; staff access is deny-by-default until an approved rule exists.
6. If allowed, issue a narrowly scoped, short-lived signed URL or stream content through server.
7. Record the authorization outcome using a privacy-reviewed audit schema.
8. Return only the minimum data required for the client to initiate download.

### Response semantics

| Condition | Candidate response | Notes |
|---|---|---|
| Public asset allowed | `200` | Short-lived URL or server download response. |
| Login required | `401` | UI may offer login with safe return path. |
| Authenticated but entitlement insufficient | `403` | UI explains required access level. |
| Asset unavailable/unpublished | `404` | Avoid draft existence disclosure. |
| Invalid request | `400` / `422` | Use one convention consistently. |
| Rate limited | `429` | Include retry guidance when appropriate. |
| Storage/provider failure | `503` or generic `500` | Do not mislabel as access denied. |

Whether inaccessible assets return `403` or `404` must be decided from the threat model and UX requirements. Never return a signed URL on deny.

### URL expiry

TTL is **TBD**. Choose the shortest practical period after testing download size, user experience, and provider constraints. Signed URLs are bearer credentials: anyone who obtains one may use it until expiry. Revoking an entitlement does not necessarily invalidate an already issued URL. If immediate revocation is required, use a proxy/stream or another revocation-capable design.

## 6. Search/list contract

Suggested query parameters: `q`, `locale`, `type`, `desk`, `topic`, `year`, `sort`, `page`, `pageSize`.

- `locale` must match supported values; preferably derive from route context and reject conflicting query value.
- Bound `q` length and normalize whitespace.
- Allowlist sort keys and sort direction.
- Enforce server maximum page size; proposed default 12–20 and maximum 50 pending UX/performance test.
- Return only published and indexable records for public callers.
- Never reveal private internal fields or file object keys.
- Search ranking must be tested on a representative content corpus before declaring relevance complete.

## 7. Profile and entitlement contracts

- A public user can read/update only permitted fields of their own profile.
- Email/identity changes follow Supabase Auth flows; do not directly edit auth identity columns in application profile APIs.
- Users may read a sanitized summary of their own entitlement, not grant/revoke it.
- A client cannot create its own entitlement or set subscription state.
- Admin grant/revoke must use explicit staff permission, reason, validity bounds, and audit trail.

## 8. Webhook contract (Phase 2)

- Verify provider signature/authenticity before processing.
- Store provider event ID with unique constraint and processing status.
- Process transactionally where possible; duplicate delivery must not duplicate business effects.
- Handle out-of-order and late events using provider event time, local state machine, and reconciliation rules.
- Do not trust success redirect parameters from browser.
- Acknowledge only after durable acceptance; define retry/dead-letter behavior.
- Never log payment secrets or full sensitive payloads.

## 9. API test checklist

- Invalid/missing session.
- Expired session.
- Wrong role.
- Cross-user IDOR attempt.
- Forged client access level.
- Unpublished asset.
- Direct private bucket access.
- Expired/forwarded signed URL.
- Storage timeout.
- Duplicate request and duplicate webhook.
- Rate limit behavior.
- Secret and stack-trace leakage.
