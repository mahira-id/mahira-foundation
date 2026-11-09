---
inclusion: auto
name: content-data-model
description: Use when designing or implementing publications, publication assets, authors, research desks, topics, publication types, tags, learning resources, Payload collections, database schema, migrations, or localization fields.
---
# Mahira — Content and Data Modeling

## Modeling principles

- Model editorial concepts explicitly. Do not collapse Desk, Topic, Publication Type, Category, and Tag into one field without editorial approval.
- A Publication and its Publication Assets are distinct concepts. A publication may have a cover, preview, full report, appendix, dataset, or supporting file; access and lifecycle may differ by asset.
- Use stable opaque identifiers for relations and storage references; do not use translated title/slug as a database identity.
- Define cardinality, uniqueness scope, nullability, validation, deletion behavior, and owner for every relationship.
- Keep content status, translation status, asset-processing status, and access level as separate state dimensions.
- Do not make all content bilingual by copying a translation that has not been reviewed.
- Do not invent a final taxonomy. Treat proposed examples as placeholders until the Editorial Lead/PO confirms them.

## Ownership and schema rules

The proposed baseline assigns editorial content and staff identity to Payload, and public-user/account/entitlement data to Supabase application tables. This is not yet a migration contract. Read the accepted database ownership ADR and data model before creating collections or SQL migrations. Payload-owned tables must not be casually modified through Supabase dashboard SQL; application-owned schema must have a separate, explicit migration authority.

## Before changing a model

- Check `docs/architecture/CONTENT-ARCHITECTURE.md` and `DATA-MODEL.md`.
- Check localization and routing decisions.
- Check `DECISIONS.md` for open taxonomy and ownership decisions.
- Update ERD and traceability when accepted model changes affect relations.
- Add migration/rollback notes and data backfill tests.

## References

#[[file:docs/architecture/CONTENT-ARCHITECTURE.md]]
#[[file:docs/architecture/DATA-MODEL.md]]
#[[file:docs/architecture/ERD.md]]
#[[file:docs/decisions/DECISIONS.md]]
