---
name: supabase-auth-and-rls
description: Implement or review Supabase Auth, public user profiles, PostgreSQL application tables, RLS policies, session handling, or server-side Supabase access for Mahira.
---
# Supabase Auth and RLS

## Preconditions

The current inspected repository does not yet include Supabase packages or project configuration. First confirm DEC-007 schema ownership and DEC-008 identity boundary, then run the relevant auth/DB technical spike. Do not install or connect Supabase simply because this skill activates.

## Rules
- Public users authenticate through the accepted public identity provider; staff identity remains separate unless the owner changes the decision.
- Use verified server session identity; never trust a caller-supplied `user_id` as proof of identity.
- Enable RLS on application-owned tables that are accessed through Supabase client contexts.
- Write least-privilege policies for SELECT/INSERT/UPDATE/DELETE independently; do not use one broad policy for all operations.
- Test cross-user isolation and unauthenticated behavior.
- Keep privileged service-role keys server-only and narrowly scoped.
- Do not assume RLS protects Payload queries made through a direct database connection. Payload collection access control remains necessary for Payload-owned content.
- Keep migrations in version control and clearly assign migration ownership.
- Never execute production resets or destructive migrations without explicit authorization.

## Required test cases
- anonymous access;
- user reads only their own profile/entitlement view;
- user cannot edit role or grant entitlement;
- user A cannot read/change user B's data;
- expired/revoked entitlement is not treated as active;
- service-role code rejects unauthorized principals before privileged access.
