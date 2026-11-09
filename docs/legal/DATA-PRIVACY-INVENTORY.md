# Data Privacy Inventory & Governance Register

**ID:** LEGAL-PRIV-001 · **Status:** Initial inventory / requires legal review · **Version:** 0.1.0

> Dokumen ini adalah inventaris teknis dan operasional awal, bukan pendapat hukum atau pernyataan kepatuhan. Organisasi harus meminta tinjauan penasihat hukum/privasi yang memahami hukum Indonesia, termasuk UU Pelindungan Data Pribadi, peraturan pelaksana, kontrak provider, serta konteks organisasi.

## 1. Purpose

Mencatat data pribadi yang mungkin diproses, tujuan, dasar pemrosesan yang perlu dikonfirmasi, akses, retensi, penghapusan, vendor, dan kontrol. Isi tabel berdasarkan implementasi nyata; jangan menganggap semua field sudah disetujui untuk dikumpulkan.

## 2. Data inventory (proposed, validate before collection)

| Data category | Potential fields | Purpose | System/owner | Access | Retention decision |
|---|---|---|---|---|---|
| Public account identity | Auth UUID, email, verification status | Login/account identity | Supabase Auth | User and authorized server operations | TBD with legal/business need. |
| Profile | Display name, optional organization/role/preferences | Personalize account and attribution | Supabase app profile | Own user; authorized staff only if justified | TBD; minimize fields. |
| Authentication/security events | Login timestamps, failed attempts, session metadata | Account security and abuse prevention | Auth/provider/security logs | Restricted ops | Provider limits and legal review. |
| Entitlement | User reference, scope, source, validity, status | Enforce document access | Supabase app-owned data | User may read sanitized own status; staff permission for grants | Keep while needed to prove access rights; exact period TBD. |
| Download audit | User/asset reference, time, decision, request correlation | Security, abuse investigation, usage reporting if approved | Supabase app-owned data | Restricted; minimize exposure | TBD; do not collect unnecessary device fingerprint. |
| Staff account | Email, role, status, MFA/security events | CMS operation and accountability | Payload | Admin and authorized staff | Employment/contract lifecycle policy TBD. |
| Editorial attribution | Author name, biography, affiliation, portrait | Publication metadata | Payload | Public when published; editor manages | Publication/archive policy; image consent/rights required. |
| Contact/newsletter | Email, message, consent/unsubscribe state | Reply or newsletter delivery | Provider TBD | Limited editorial/communications role | Purpose-specific retention and unsubscribe rules. |
| Payment (Phase 2) | Provider reference, transaction status, invoice/receipt data | Billing and entitlement | Payment provider + Supabase reference data | Finance/authorized admin | Legal/accounting requirements to be confirmed. |

## 3. Data minimization

- Collect only fields required for a defined product purpose.
- Avoid collecting date of birth, identity number, home address, phone, sensitive traits, or precise location unless a documented necessity and legal approval exist.
- Do not store payment card data; use provider-hosted/tokenized flow where selected and validated.
- Separate public author profile data from private account profile data.
- Never expose internal entitlement notes, security logs, staff details, or billing metadata publicly.

## 4. Purpose and lawful basis register

For each actual processing activity, stakeholder/legal reviewer must document purpose, applicable lawful basis/consent requirement, data subject notice, controller/processor roles, and any cross-border transfer implications. Do not use a generic consent checkbox for unrelated purposes. Newsletter consent should be separate from account registration unless counsel approves another lawful basis.

## 5. Data subject requests and lifecycle

Define and test workflows for:
- access/copy request;
- correction/update;
- deletion/erasure where applicable;
- consent withdrawal where consent is the basis;
- account closure;
- retention exception and legal hold;
- complaint/contact escalation.

Account deletion must account for dependent records, publication authorship, audit integrity, billing references, and provider retention. Decide whether to delete, anonymize, or retain restricted records under approved legal obligations. Do not cascade-delete records blindly.

## 6. Security and vendor register

For each vendor (hosting, database, storage, email, analytics, monitoring, payment), record service, data categories, region/location, subprocessor information, contract/DPA status, retention/deletion behavior, incident notification path, and access owner. Provider features and region claims must be verified from current contracts/settings, not copied from old AI chat.

## 7. Access and logging

- Apply least privilege to staff and vendors.
- Log privileged access and sensitive changes, but do not log passwords, auth tokens, signed URLs, full private document contents, or payment secrets.
- Review staff access periodically and remove access promptly when no longer required.
- Define audit log retention based on purpose and legal review.

## 8. Data breach and incident readiness

Identify incident owner, legal/privacy contact, technical responder, provider escalation routes, evidence preservation process, communication decision owner, and applicable notification timelines. The exact statutory requirements and timing must be confirmed by qualified legal counsel against current law and facts. Test the response process before production launch.

## 9. Required approvals

| Item | Owner | Status |
|---|---|---|
| Data controller identity and contact | Organization/legal | TBD |
| Privacy notice | Legal/product | TBD |
| Data processing purposes/lawful basis | Legal | TBD |
| Retention schedule | Legal/operations | TBD |
| User deletion/request workflow | Engineering/legal | TBD |
| Vendor and cross-border review | Legal/operations | TBD |
| Incident response plan | Legal/security | TBD |
| Phase 2 payment data review | Legal/finance | Future |
