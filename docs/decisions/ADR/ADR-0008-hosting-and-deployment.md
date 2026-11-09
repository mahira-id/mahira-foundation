# ADR-0008 — Hosting and Deployment Topology

- **Status:** Proposed; commercial and technical validation pending
- **Related decisions:** DEC-017, DEC-023
- **Decision owner / approver:** Product Owner + Engineering — TBD

## Context

The current architecture discussion proposes Vercel for Next.js and Supabase for PostgreSQL/Auth/Storage, with domain registration/DNS at Hostinger. Hostinger shared/Web App Hosting and VPS were explored. No production hosting commitment is considered final until cost, regional latency, Payload compatibility, resource limits, and operational requirements are verified.

## Options

| Option | Advantages | Risks / verification |
|---|---|---|
| Vercel + Supabase managed | Familiar GitHub deployment/preview workflow; less server administration; Next.js deployment model. | Commercial plan and usage costs; runtime/function constraints; Payload compatibility; DB connection strategy; egress/storage costs. |
| Hostinger managed Node/Web App + Supabase | Potentially lower flat hosting cost and local billing. | Must benchmark Next.js + Payload build/runtime, process limits, memory/CPU contention, file handling, cache/ISR semantics, backups, and support constraints. |
| VPS + container platform + Supabase or self-managed DB | Root/control, flexible workers and Docker. | Requires security patches, firewall, backups, monitoring, deploy pipeline, process management, incident response, and recovery competence. |

### Opsi terpilih: Vercel + Supabase managed

## Proposed direction

Use Vercel + Supabase as the initial production candidate and keep Hostinger as domain/DNS provider. Do not introduce VPS into production solely as a learning exercise. A VPS can be an isolated sandbox. This is a recommendation, not a price guarantee or provider capability assertion.

## Required validation before Accepted

- Pin Next.js, Payload, Node.js runtime, Bun/npm tooling and adapter versions.
- Prove Payload admin, upload to object storage, draft/preview, public ISR/SSR, and private download endpoint on target host.
- Prove migration connection and serverless runtime DB connection/pooling behavior.
- Confirm region choice and latency from target audience.
- Estimate recurring costs, traffic, PDF egress, storage, backups, seats, email and observability.
- Define restore test, RPO/RTO, incident owner, and vendor exit path.
- Confirm provider commercial terms directly before purchase.

## Rollback

Keep deployment reproducible from Git and migrations; maintain previous stable deployment and a database backup/restore procedure. Application rollback must be compatible with database migrations (expand/contract where needed).
