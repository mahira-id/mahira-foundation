---
name: editorial-content-modeling
description: Design or implement Mahira editorial content types, publication collections, authors, desks, topics, tags, publication assets, localized content, or editorial workflow in a CMS.
---
# Editorial Content Modeling

## Preconditions

- Read `docs/architecture/CONTENT-ARCHITECTURE.md` and `DATA-MODEL.md`.
- Confirm DEC-003 taxonomy, DEC-004 localization, DEC-006 CMS, and DEC-007 database ownership as applicable.
- Confirm the Payload/Postgres spike has passed before installing/configuring Payload in application code.

## Modeling procedure
1. Identify the editorial concept and its lifecycle; do not model UI labels as database concepts automatically.
2. Define stable IDs, field types, required/optional rules, validation, locale behavior, slug uniqueness, relationships, deletion rules, and owner.
3. Distinguish publication metadata from downloadable assets.
4. Define draft/review/published/archived transitions and who may perform them.
5. Define whether publication is available in one locale or both; never silently copy a missing translation.
6. Add access fields only according to the accepted access model.
7. Generate migration and backfill notes, then update ERD and tests.

## Safety

- Do not create final Desk/Topic/Type taxonomies from placeholder examples.
- Do not duplicate Payload-owned tables in the Supabase application schema.
- Do not change production schema manually.
- Do not add fields just because a sample CMS schema contains them.
