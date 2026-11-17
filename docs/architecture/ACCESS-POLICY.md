# Access Policy Specification

**Status:** Proposed security contract; requires Security Owner and Product Owner approval  
**Related:** PRD §8; SRS §4.1–4.3, §8, §12.1; DEC-008–DEC-012; ADR-0003, ADR-0006  
**Fase (DECISIONS §2.8 Q1 A, 2026-11-12):** baris Registered berlaku pra-launch (M5); baris Subscriber dan semua aturan entitlement berlaku di Phase 2 (M7).

## 1. Purpose

Dokumen ini menetapkan bagaimana identitas, role, access level, entitlement, dan storage digabungkan untuk menghasilkan keputusan akses. Ini adalah sumber normatif policy setelah disetujui; implementasi harus mengikuti evaluator dan test matrix di sini.

## 2. Security invariants

1. Tidak ada restricted file di public bucket, `public/` directory, static export, atau URL yang dapat diakses tanpa policy check.
2. Client tidak menentukan role, entitlement, access level, bucket, object key, atau keputusan allow/deny.
3. Semua operasi sensitif memeriksa session dan permission di server.
4. Public registration tidak dapat membuat staff, role, atau entitlement.
5. Service-role/privileged key server-only; tidak pernah masuk client bundle/log/HTML.
6. Entitlement divalidasi terhadap status, scope, dan waktu `valid_from`/`valid_until` pada saat keputusan dibuat.
7. Missing/invalid data menghasilkan deny (fail closed).
8. Payload access control melindungi koleksi/global/admin. Supabase RLS melindungi tabel aplikasi user. Satu tidak menggantikan yang lain.
9. Signed URL adalah bearer credential dan tidak boleh disimpan atau dipublikasikan.
10. Setiap grant/revoke dan keputusan akses sensitif dapat diaudit secara proporsional terhadap privacy/retention policy.

## 3. Principal types

| Principal | Identity source | Default capabilities |
|---|---|---|
| Anonymous | No authenticated session | Public metadata and public assets only. |
| Registered | Verified/valid Supabase Auth session | Anonymous capabilities + registered-level assets if account state/policy allows. |
| Subscriber | Supabase Auth + applicable active entitlement | Registered capabilities + subscriber-level assets within entitlement scope and validity. |
| Editor | Payload staff session + Editor permission | Editorial tasks explicitly granted; no automatic public entitlement. |
| Admin | Payload staff session + Admin permission | Staff administration within explicit admin policy; no automatic user subscription unless decision says so. |
| Reviewer / Finance | Optional Payload staff roles | Only approved review/finance capabilities; do not create until needed. |

Staff is not a public-user entitlement class. DEC-009 decides whether staff use a separate public account or receive a specific audited operational grant.

## 4. Resource model

Protected resource is a Publication Asset, not just a page button. Each asset resolves to parent publication and publication-state, asset processing-state, publication default access level, optional asset access override, storage visibility and opaque object reference, locale and rights metadata.

### 4.1 Proposed effective access rule

Ordered levels: `public < registered < subscriber`.

For safe default, effective access is the stricter of Publication `access_level` and Asset `access_override`, where null means inherit. An explicit override to less restrictive access is not allowed in the initial model unless an approved policy supports it. This prevents a subscriber publication from accidentally having a public full file.

Example: publication `registered`, asset `subscriber` → subscriber required. Publication `subscriber`, asset `public` → effective remains subscriber under strict inheritance. If organization wants public cover/excerpt on subscriber publication, classify that asset as a separate public promotional asset or explicitly revise the rule through an approved decision.

### 4.2 Implementasi M3-08 (DEC-011 Accepted, DECISIONS §2.14 butir 1–3)

- **Resource:** record koleksi Payload `publication-files` (file PDF), milik tepat satu record publikasi (satu bahasa); publikasi mencantumkan file-nya berurutan di field `files`.
- **Level file wajib, tanpa default, tanpa "inherit":** `accessLevel` di setiap file menyimpan `public`/`registered`/`subscriber` sejak awal. Akses efektif = level yang lebih ketat antara publikasi dan file (`lib/publications/file-access.ts` `stricterAccess`); file yang diset lebih longgar tidak berpengaruh. Nilai yang tidak dikenal atau hilang dianggap `subscriber` (fail closed).
- **Syarat unduhan publik (M3-08):** publikasi tayang (`published`) + `public`, file `ready`, PDF, akses efektif `public` (`isPublicDownload`). Diperiksa ulang di server pada setiap request unduhan (API-SPECIFICATION §5.1).
- **File `registered`/`subscriber` (sementara sampai M5/M7):** boleh diunggah ke private bucket tetapi tidak tampil di situs publik sama sekali: tidak ada baris di panel, tidak ada URL, dan route unduhan menjawab 404. Ini deviasi tercatat dari DEC-002 ("aset terbatas pada publikasi publik ditampilkan terkunci tanpa URL") dan konsisten dengan §2.11 P7 A. Unduhannya M5 (`registered`) dan M7 (`subscriber`).
- **Staf:** membuka semua file di `/admin` di bawah access control Payload (`/api/publication-files/file/<nama>`, signed 302). Route publik tidak membaca sesi, jadi sesi staf tidak memberi akses di sana (DEC-009).

## 5. Entitlement semantics

An entitlement is valid only if:

- it belongs to the verified authenticated public user;
- its status is `active`;
- current server time is greater than or equal to `valid_from`;
- `valid_until` is null only where policy explicitly permits no expiry, otherwise current time is earlier than `valid_until`;
- its scope matches the target asset/publication/plan according to defined matching rules;
- it has not been revoked and no contradictory state exists.

A subscriber label in UI, user metadata, JWT custom claim, or client cache is not authoritative proof by itself. The access evaluator reads the canonical entitlement source.

### 5.1 Scope resolution

Proposed precedence must be approved: explicit asset/publication grant, collection/plan grant, then any global grant if the organization permits global entitlement. Deny wins when data is contradictory or the content is unavailable. Define whether a narrower grant overrides a broader deny; safest initial behavior is no deny overrides except explicit revocation of the matching grant.

## 6. Access decision matrix

| Resource | Anonymous | Registered | Subscriber with valid scope | Editor | Admin |
|---|---|---|---|---|---|
| Public metadata | Allow | Allow | Allow | Allow | Allow |
| Published summary | Allow | Allow | Allow | Allow | Allow |
| Public asset | Allow | Allow | Allow | Staff policy | Staff policy |
| Registered asset | Deny/login | Allow | Allow | Deny by default | Deny by default |
| Subscriber asset | Deny/login | Deny/upsell | Allow | Deny by default | Deny by default |
| Draft metadata/content | Deny | Deny | Deny | Payload permission | Payload permission |
| CMS write | Deny | Deny | Deny | Granted collection/action | Granted collection/action |
| Staff role management | Deny | Deny | Deny | Deny | Admin only |
| Entitlement grant/revoke | Deny | Deny | Deny | Explicit permission only | Admin/explicit permission |

The staff column is deliberately deny-by-default for restricted files; DEC-009 must settle operational exception.

M3-08 (DECISIONS §2.14): baris "Public asset" berlaku untuk file `publication-files` dengan akses efektif `public` pada publikasi tayang + `public` (§4.2). "Staff policy" untuk aset publik = staf membuka file di `/admin` di bawah access control Payload; route unduhan publik sama untuk semua pemanggil. Baris Registered/Subscriber asset belum dibangun: file itu disembunyikan dan route menjawab 404 sampai M5/M7.

## 7. Evaluator interface

Proposed application contract:

```ts
export type Principal =
  | { kind: "anonymous" }
  | { kind: "public_user"; userId: string; sessionId?: string }
  | { kind: "staff_user"; staffId: string; roles: string[] };

export type AccessLevel = "public" | "registered" | "subscriber";

export type AccessReason =
  | "public_access"
  | "authenticated_access"
  | "active_entitlement"
  | "authentication_required"
  | "entitlement_required"
  | "entitlement_expired"
  | "entitlement_revoked"
  | "scope_mismatch"
  | "resource_unavailable"
  | "staff_policy_denied"
  | "policy_data_invalid";

export type AccessDecision = {
  allowed: boolean;
  reason: AccessReason;
  requiredAction?: "login" | "request_access" | "subscribe" | "retry";
};
```

This is an illustrative contract, not an exported application type until accepted. Avoid returning details that enable entitlement enumeration. Internal audit reason can be more detailed than public response.

Evaluator requirements:

- Pure decision function where possible; dependencies (time, entitlement query) supplied explicitly.
- Server time only; injectable clock for tests.
- No trust in client-supplied `accessLevel` or `userId`.
- Fail closed for unknown enum, missing publication, unpublished asset, or unavailable storage.
- Unit tests cover boundaries exactly at `valid_from` and `valid_until`.

## 8. Download endpoint flow

1. Receive opaque `assetId`; validate format and request method.
2. Resolve asset and parent publication from trusted server-side content layer.
3. Confirm publication is published in requested locale and asset processing status is `ready`.
4. Resolve principal from verified session; do not accept principal identity from request body.
5. Compute effective access level.
6. Query applicable entitlement if required.
7. Evaluate policy.
8. If denied, return stable locked/unauthorized response without object key.
9. If allowed, generate short-lived signed URL from private bucket or return public URL for public asset as appropriate.
10. Record access decision/event without storing signed URL or credentials.
11. Return a minimal response; do not cache personalized response.

Implementasi M3-08 untuk file `public` (API-SPECIFICATION §5.1): langkah 1–3, 5, 7, 9 dan 11 dibangun di `GET /api/files/{fileId}/download`; langkah 4 dan 6 tidak ada (tanpa sesi, tanpa entitlement); langkah 10 tidak ada untuk unduhan publik (butir 9: tanpa audit, hitungan, atau rate limit; log hanya nama galat). Langkah 9 selalu menerbitkan signed URL 60 detik dari private bucket, juga untuk file `public`; tidak ada URL bucket publik. Setiap penolakan menjawab 404 yang sama; galat database atau storage 503.

## 9. HTTP and UX contract

| Condition | Suggested HTTP behavior | User experience |
|---|---|---|
| Missing/invalid session for registered asset | 401 or login redirect depending endpoint | Prompt login and preserve return destination safely. |
| Authenticated but no entitlement | 403 | Explain requirement and available next action. |
| Resource not found | 404 | Not found; avoid leaking existence when policy requires concealment. |
| Draft/unpublished asset | 404/403 internal policy | Never expose draft through public endpoint. |
| Storage provider error | 503/502 depending failure | Retry message with correlation ID. |
| Invalid request | 400/422 | Correct input; no internal details. |

No generic `200` with a secret-bearing URL on denial. Never include object key, bucket credentials, entitlement internals, or private storage path in public errors.

## 10. Storage policy

- Public bucket is reserved for assets explicitly classified public and safe for anonymous access. Sejak M3-08 ini hanya cover/image `media` (bucket `spike-m2-public`, prefix `spike-m2`, sampai M4; DECISIONS §2.14 butir 5); masalah §2.6 P8 kini hanya berlaku untuk cover.
- Private bucket is required for registered/subscriber restricted assets. Sejak M3-08 semua file PDF publikasi, termasuk `public`, ada di private bucket `publication-files` (Owner: tidak publik, 50 MB, `application/pdf` saja; dipakai bersama Preview, lokal, dan tes dengan objek tes `fixture-test-*`).
- Keep bucket separation and object key prefixes as defense in depth, not as sole authorization.
- Disable public listing for private buckets.
- Use random opaque keys; sanitize display filename separately.
- Signed URL TTL: TBD. Choose from file size, mobile reliability, expected download duration, revocation semantics, and threat model; record exact setting in an accepted ADR/config. File `public` (M3-08): 60 detik (`SIGNED_DOWNLOAD_TTL_SECONDS`, payload/payload.config.ts; DECISIONS §2.14 butir 2). Unduhan yang sudah berjalan tidak diputus saat TTL lewat; request baru dengan URL kedaluwarsa ditolak (API-SPECIFICATION §5.1). TTL file terbatas ditetapkan di M5.
- Verify that generated URL is not included in application logs, analytics events, referrer headers, or cached rendered HTML.
- Define deletion lifecycle and backup retention for removed objects.

## 11. RLS policy catalogue

At minimum, define and test RLS for each app-owned table:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| public_user_profiles | Owner reads approved columns; staff access only if explicitly approved. | Trusted signup/profile bootstrap only. | Owner updates allowlisted fields. | Controlled deletion/anonymization workflow. |
| entitlements | User may read a safe projection of own entitlements; never raw staff/provider metadata if sensitive. | Server/staff operation only. | Server/staff operation only. | Prefer revoke/status change; no unrestricted user delete. |
| download_events | User may read own history only if feature approved; staff analytics only with permission. | Server-side insert only. | Immutable to clients. | Retention job/admin policy only. |
| subscriptions (future) | User reads own safe projection. | Provider webhook/server only. | Provider webhook/server only. | Retention/legal policy. |
| payment_events (future) | No public access. | Verified server webhook only. | Server processing state only. | Retention/legal policy. |

This table is a policy design guide. Actual SQL policies must use verified auth context and must be tested with anon/authenticated/service-role contexts. A table with RLS enabled but no appropriate policies may be inaccessible; that is preferable to inadvertent public access but still requires correct application behavior.

## 12. Payload access-control catalogue

For each collection/global/action document anonymous read policy (normally false for CMS API unless a public projection is explicitly required), staff read policy, create/update/delete policy by role, field-level restrictions for protected fields, draft/version read policy, publish/schedule/unpublish permission, relationship visibility/query leakage, and admin-only user management.

Do not assume hiding a navigation item enforces the action. Test API calls directly.

## 13. Audit events

Minimum audit-worthy actions:

- staff login/security event when available;
- staff role creation/change/deactivation;
- publication publish/unpublish/archive and access-level change;
- asset upload/classification/replacement/deletion;
- entitlement grant/revoke/expiry correction;
- privileged download authorization result if audit scope requires;
- payment webhook state change in Phase 2.

Each event should contain event ID, timestamp, actor type/ID, action, target type/ID, outcome, reason code, correlation/request ID, and minimal before/after metadata. Avoid recording raw secrets, signed URLs, full document contents, or unnecessary personal data. Define immutable storage/retention and access controls.

## 14. Mandatory security tests

- Anonymous cannot download registered/subscriber assets.
- Registered user without entitlement cannot download subscriber asset.
- Active scoped entitlement grants only its scope.
- Expired/revoked/wrong-scope entitlement denies.
- Client cannot override access level, user ID, or object key.
- Direct private bucket access/listing denied.
- Signed URL is short-lived and not included in public HTML/cache/logs.
- Public signup cannot create staff identity/role.
- Staff session cannot be confused with public subscriber session.
- Editor cannot change staff role or grant entitlement unless explicitly permitted.
- Unpublished/draft content never appears in public query/search/sitemap.
- Cached pages cannot leak personalized locked/unlocked decisions.

## 15. Open policy decisions

DEC-009 staff asset access; DEC-011 asset override/inheritance (Accepted 2026-11-16: level lebih ketat, file wajib punya level sendiri, §4.2); TTL and revocation behavior (file `public`: 60 detik, §10; file terbatas: M5); user verification requirement; entitlement grant scope; no-account download logging; account deletion and log retention; response concealment policy; MFA enforcement mechanism. Do not implement ambiguous exception by intuition.
