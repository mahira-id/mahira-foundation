# SPIKE-002 — Public and Staff Authentication Boundaries

**Status:** Planned · **Decision links:** DEC-004, DEC-005, DEC-007 · **ADR:** 0003 · **Owner:** TBD

## Question
Can Supabase Auth for public users and Payload Auth for staff coexist in one Next.js application with distinct cookies/sessions, route guards, and server-side authorization, without accidental privilege crossover?

## Hypothesis
The two identity domains can remain separate if their session verification, roles, database access, and route protection are explicit. No public signup flow can create or elevate a Payload staff user.

## Scope
- One public user role with registration/login/logout flow in non-production.
- One Payload staff Admin and one Editor test account.
- Public account route and staff admin route.
- One server operation for each domain.
- Negative tests for cross-access and forged role metadata.

## Exit criteria
- Public user cannot authenticate to Payload admin.
- Public signup/profile metadata cannot create or modify staff role.
- Staff Payload session is not treated as Supabase public user entitlement.
- Each sensitive operation verifies its own expected identity provider server-side.
- Session expiry/logout/invalid cookie behavior is safe.
- Route/layout guard does not become the sole protection for data operations.
- No privileged key or cookie leaks to client code/logs.

## Evidence
Record cookie names/scopes/paths, auth helper versions, route tests, negative tests, behavior across preview domain, and framework integration details. Do not copy actual credentials or session cookie values into the report.

## Open questions
- Will any staff member need a separate public user account to access exclusive publications?
- What is the staff MFA policy?
- Is custom internal dashboard functionality needed beyond Payload admin?
