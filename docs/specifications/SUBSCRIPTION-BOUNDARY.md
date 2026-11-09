# Subscription Boundary & Phase 2 Readiness

**ID:** SPEC-SUB-BOUNDARY-001 · **Status:** Future-scope guardrail · **Version:** 0.1.0

## 1. Purpose

Menjaga agar model data dan access evaluator pada MVP dapat dikembangkan ke subscription tanpa mengimplementasikan payment prematurely. Dokumen ini bukan spesifikasi pembayaran lengkap dan tidak menetapkan harga, gateway, recurring method, refund, atau legal terms.

## 2. What belongs in the MVP

- A publication/asset has a defined access requirement.
- A user identity has a stable internal reference.
- The system can represent manual entitlement with source, scope, validity, status, and audit trail.
- Authorization evaluator can answer allow/deny without knowing which payment provider may be used later.
- Private asset delivery is server-authorized.
- Account UI can show a neutral access state if account feature is in MVP scope.

## 3. What must remain out of scope until Phase 2

- Payment capture/settlement.
- Plan catalog/pricing and taxes.
- Automatic recurring billing.
- Provider-specific subscriptions and invoices.
- Cancellation/refund customer journeys.
- Payment reconciliation dashboard beyond minimal operational logs.
- Subscription marketing/upsell commitments.

## 4. Entitlement as the stable abstraction

A future subscription should be one possible source of entitlement, alongside manual grant or other approved source. The content authorization layer must depend on the effective entitlement, not on a direct provider API call during every download.

Recommended conceptual fields:
- subject/user reference;
- scope (publication, asset, collection, or plan-derived scope);
- source (`manual`, `subscription`, future source enum);
- status;
- valid_from / valid_until;
- grant/revoke actor and reason;
- created/updated timestamps;
- source reference for reconciliation (nullable for manual grant).

The final schema must prevent accidental overlapping grants from creating ambiguous revocation behavior. Define whether a revoked grant can coexist with another active source and how effective access is calculated.

## 5. Future payment integration requirements

When Phase 2 is approved, produce a separate Subscription Specification and payment ADR covering:
- business model and plan definitions;
- one-time vs recurring/manual renewal;
- provider selection and onboarding/legal eligibility;
- provider customer/payment/subscription IDs;
- state machine and allowed transitions;
- webhook signature verification;
- idempotency and event ordering;
- failed/pending payment handling;
- expiry, grace period, cancellation, refund, dispute;
- invoice/receipt and tax requirements;
- reconciliation and support operations;
- privacy and financial retention.

Do not derive entitlement from a front-end redirect or client-supplied payment status.

## 6. Migration compatibility checks

Before MVP schema acceptance, verify that:
- `Entitlement.source` can represent manual and future provider origins.
- Entitlement validity can be bounded in time.
- Public user identity is stable and not coupled to email string.
- Publication/asset access requirement can evolve without exposing storage internals.
- Download decision is provider-agnostic.
- Audit trail can identify who or what created/revoked an entitlement.

## 7. Phase 2 entry gate

Phase 2 begins only after product owner approves the business model, legal/onboarding readiness is reviewed, provider sandbox is available, subscription state machine is documented, and payment-specific test cases are accepted.
