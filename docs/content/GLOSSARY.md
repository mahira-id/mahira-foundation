# Mahira Project Glossary

**ID:** CONTENT-GLOSSARY-001 · **Status:** Working glossary · **Version:** 0.1.0

| Term | Definition in this project | Notes / avoid confusion |
|---|---|---|
| Publication | A structured editorial record representing a research or knowledge output. | Not the same as a file asset. |
| Publication asset | A file or external resource attached to a publication. | May have its own access requirement and locale. |
| Publication type | Editorial format/classification (e.g. report or brief). | Controlled vocabulary; not identical to desk/topic. |
| Research desk | Organization-level research/work area or issue portfolio. | Exact organizational meaning and hierarchy TBD. |
| Topic | Subject/theme associated with one or more publications. | May be many-to-many. |
| Category | Broad classification label, only if needed in final taxonomy. | Do not create duplicate concept alongside desk/topic without reason. |
| Tag | Lightweight descriptive keyword. | Not necessarily curated landing page. |
| Author | Person/entity credited as author. | CMS creator is not automatically author. |
| Contributor | Person with a defined contribution not necessarily an author. | Editorial policy defines attribution. |
| Learning resource | Structured educational resource displayed in Learning Hub. | Not automatically a course/LMS unit. |
| Localization | Adaptation of content fields to a locale. | Distinguish from UI translation. |
| Locale | Language/region identifier used by routes and formatting. | Current supported set: `id`, `en`. |
| Linked translation | Separate localized records explicitly linked as equivalents. | One candidate model. |
| Field localization | Multiple locale values in one logical record. | One candidate model. |
| Slug | Human-readable URL identifier. | Not a stable database primary key. |
| Canonical URL | Preferred URL representation of a page. | Self canonical expected for localized public pages. |
| Hreflang | Alternate-language relation metadata. | Only for true published equivalents. |
| Access level | Classification of access requirement on publication/asset. | `public`, `registered`, `subscriber` are baseline terms. |
| Entitlement | Effective right granted to a user for a scope and time range. | May come from manual grant or future subscription. |
| Subscription | Commercial relationship/plan state with provider and billing lifecycle. | Phase 2; not synonymous with entitlement. |
| Authentication | Verification of user identity/session. | Does not itself establish content permission. |
| Authorization | Decision whether an identity may perform an action on a resource. | Must be enforced server-side. |
| RLS | PostgreSQL Row Level Security. | App-owned user tables; not assumed to protect Payload's privileged DB connection. |
| Payload access control | Payload's authorization mechanism for staff and CMS operations. | Separate from Supabase RLS. |
| Signed URL | Time-limited bearer URL allowing access to an object. | Exposure risk until expiry; TTL TBD. |
| Private bucket | Storage bucket/object policy that denies anonymous public reads. | Hidden URL is not access control. |
| Editorial workflow | Process through which content is created, reviewed, approved, and published. | Final states require stakeholder approval. |
| Draft | Non-public work in progress. | Must not leak through routes, APIs, search, or assets. |
| Published | Approved public state. | Public visibility still depends on locale and policy. |
| Withdrawn | Content removed from normal access due to rights/legal/editorial reason. | Distinct from archive/delete. |
| SSG | Static Site Generation. | Build-time HTML generation. |
| SSR | Server-Side Rendering. | Request-time HTML generation. |
| ISR | Incremental Static Regeneration. | Cache regeneration/revalidation strategy must be explicit. |
| Vertical slice | End-to-end feature across data, server behavior, and UI. | Must be demoable in staging. |
| ADR | Architecture Decision Record. | Captures context, options, decision, and consequences. |
| Technical spike | Time-boxed experiment to reduce a specific technical uncertainty. | Output is evidence, not merely implementation code. |
| MVP | Minimum viable release. | Definition must be reconciled between PRD and SRS. |

## Naming policy

Use `Publication` consistently for the content entity and `Publication Asset` for each attached file/resource. Use `Desk` and `Topic` only after their organizational semantics are confirmed. In UI, Indonesian terms may be “Publikasi”, “Desk Riset”, “Topik”, “Akses”, and “Langganan”; English equivalents should be consistent with approved glossary and translation files.
