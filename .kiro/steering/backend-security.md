---
inclusion: auto
name: backend-security
description: Use when creating or modifying server actions, route handlers, APIs, database access, authentication, authorization, roles, entitlements, storage, document downloads, webhooks, or secrets.
---
# Mahira — Backend Security and Trust Boundaries

## Security invariants

- The browser is untrusted. Never trust user IDs, roles, access levels, entitlement flags, file paths, object keys, or authorization decisions supplied by the client.
- Authentication identifies the principal; authorization decides the operation; entitlement determines the principal's rights to a protected resource. Do not conflate them.
- Authorize every sensitive route handler, server action, database mutation, and file operation on the server.
- Hiding a button, protecting a page layout, or checking middleware alone is not authorization.
- Deny by default when identity, publication state, asset state, or entitlement data is missing, invalid, contradictory, expired, or out of scope.
- Keep secrets and privileged keys server-only. Never expose service-role credentials through `NEXT_PUBLIC_*`, client code, logs, errors, or generated content.
- Public and staff identities are distinct in the current proposed model. Never promote a public registration to staff role.
- Restricted publication files must not be placed in a public bucket or static `public/` directory.
- Signed URLs are bearer credentials; keep expiry short, avoid logging/sharing them, and document revocation limitations.

## Architecture status

The project currently does not have Supabase Auth, RLS, Payload Auth, a storage adapter, or an access evaluator installed in the inspected package manifest. Follow the accepted ADRs and `docs/architecture/ACCESS-POLICY.md` before implementing these systems. Do not infer a policy for staff downloads or asset-level overrides from a UI requirement.

## Review requirements

For any access-sensitive change, identify:

1. the authenticated principal and authoritative identity source;
2. the resource being accessed (prefer the specific Publication Asset, not only a page-level button);
3. the source of publication/access metadata;
4. entitlement scope, status, and validity-window evaluation;
5. database and storage permissions;
6. expected allow/deny response semantics;
7. audit events and privacy/retention implications;
8. unit, integration, E2E, and direct-storage bypass tests.

## High-risk actions

Do not run destructive database migrations/resets, production data changes, credential rotation, deployment, resource deletion, or force-push operations without explicit user authorization and a reviewed plan.

## References

#[[file:docs/CORE/SRS.md]]
#[[file:docs/architecture/ACCESS-POLICY.md]]
#[[file:docs/architecture/SYSTEM-ARCHITECTURE.md]]
#[[file:docs/engineering/ENVIRONMENTS.md]]
