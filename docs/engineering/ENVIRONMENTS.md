# Environments & Operations Specification

**ID:** ENG-ENV-001 · **Status:** Proposed baseline · **Version:** 0.1.0

## 1. Environments

| Environment | Purpose | App deployment | Supabase | Data policy |
|---|---|---|---|---|
| Local development | Daily coding and integration | Local Next.js/Node process | Dedicated dev project or isolated local stack | Synthetic fixtures only. |
| Preview / staging | QA, editor trial, regression, release candidate | Protected preview/staging deployment | Separate staging project | Realistic synthetic or sanitized data. |
| Production | Public organization service | Production deployment | Production project | Real user/content data under approved policy. |

Do not point preview deployments at production database by default. A preview branch may need a shared staging project, but concurrent migrations and test data collisions must be controlled.

## 2. Configuration principles

- Environment-specific values are configured in deployment provider and local ignored env files.
- `.env.example` contains names and safe placeholders only, never real credentials.
- No service-role, database password, Payload secret, SMTP credential, webhook secret, or storage credential is committed.
- Public variables are only those intentionally exposed to browser and must be named accordingly.
- Validate required environment variables at startup/build with typed configuration; fail fast with safe diagnostics.
- Keep secrets in a password manager/managed secret store with limited access and rotation procedure.

## 3. Environment variable inventory (names are illustrative until code/library versions are pinned)

| Variable | Server/client | Used by | Environments | Secret? |
|---|---|---|---|---|
| `DATABASE_URL` | Server | Payload/runtime DB | All | Yes |
| `DATABASE_URL_DIRECT` | Server/CLI | Migrations where required | All | Yes |
| `PAYLOAD_SECRET` | Server | Payload | All | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase client | All | No, project endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key naming for pinned version) | Client + server | Supabase public client | All | Public key; constrained by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` (or secret key naming for pinned version) | Server only | Privileged operations only | All | Yes, highly privileged. |
| `SUPABASE_STORAGE_BUCKET_PUBLIC` | Server config | Public asset bucket | All | No |
| `SUPABASE_STORAGE_BUCKET_PRIVATE` | Server config | Private assets | All | No |
| `EMAIL_PROVIDER_API_KEY` / SMTP variables | Server | Transactional email | Staging/prod | Yes |
| `SENTRY_DSN` | Client/server depending integration | Monitoring | All | Treat public DSN as intended provider config; verify exposure policy. |
| `SENTRY_AUTH_TOKEN` | CI only | Source map upload | CI | Yes |
| `REVALIDATE_SECRET` | Server | Protected cache revalidation | If used | Yes |
| `PAYMENT_WEBHOOK_SECRET` | Server | Phase 2 webhook verification | Phase 2 only | Yes |

The exact variable names must follow pinned SDK versions. Never expose database URLs or server secrets with `NEXT_PUBLIC_` prefix.

## 4. Database and storage separation

- Separate Supabase projects are recommended for development, staging, and production.
- Establish which migrations run in which environment and who approves production execution.
- Storage buckets, policies, retention and object lifecycle must be created by repeatable scripts/migrations where supported.
- Never copy production private documents into local fixtures unless explicitly sanitized/approved.
- Keep local seed content legally distributable and clearly marked as fixtures.

## 5. Deployment pipeline

Proposed flow:
1. Developer creates focused branch.
2. Local checks: formatting/lint, typecheck, unit tests, build.
3. Pull request triggers CI and preview deployment.
4. Schema/migration review and automated checks run before staging apply.
5. Staging verification: migration, smoke, E2E, editor workflow, access matrix.
6. Product/technical approval promotes same commit to production.
7. Post-deploy smoke tests and monitoring review.

Do not run potentially destructive production migrations automatically on every preview deployment. Define a single migration authority and lock/serialization policy.

## 6. Domain and DNS

Hostinger is the current domain provider per project context. Hosting destination is proposed, not yet accepted. Record domain owner, registrar account ownership, DNS records, TTL, verification records, email DNS (SPF/DKIM/DMARC), certificate behavior, renewal date, and recovery contact in a restricted operational inventory. Do not store account passwords in documentation.

## 7. Backups, restore, and continuity

Define and approve:
- RPO (maximum acceptable data loss) and RTO (maximum acceptable recovery time).
- Database backup frequency and retention by service plan.
- Storage object backup/versioning strategy; database backup alone is not enough.
- Payload media metadata and object relationship consistency.
- Restore runbook into isolated environment.
- Credentials and DNS recovery steps.
- Periodic restore drill and evidence.

At least one staging restore test is required before production launch. Exact cadence is TBD based on risk and provider capability.

## 8. Monitoring and incident handling

Track application availability, server errors, DB connectivity, slow queries, storage errors, failed uploads/downloads, auth failures, suspicious authorization denies, and (future) webhook processing failures. Alerts should have an owner and actionable runbook. Avoid alerting on every benign denied request.

Incident runbook includes: detect, triage, contain, preserve evidence, communicate, recover, post-incident review, and follow-up tasks. Security incidents involving personal data require legal/privacy response process.

## 9. Operational acceptance

- Environment secrets are isolated and not committed.
- Staging cannot access production private storage by default.
- Migrations are reproducible and reviewed.
- Backup restore is demonstrated.
- DNS and email authentication records are verified.
- Monitoring captures actionable failures without sensitive payloads.
