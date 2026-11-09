# ADR-0007 — PostgreSQL Search Baseline

- **Status:** Proposed
- **Related decisions:** DEC-013, DEC-021
- **Decision owner / approver:** Engineering + Product Owner — TBD

## Context

Search MVP needs publication title, summary/abstract, author, topic, type, and locale. SRS proposes PostgreSQL full-text search and `pg_trgm`; external engines are candidates only if scale or relevance requires them. PDF text extraction remains optional.

## Proposed decision

Start with Postgres FTS on explicitly selected public fields. Add `pg_trgm` only for a demonstrated partial/fuzzy matching need. Search results must respect publication status, locale, visibility, and public metadata policy. Search must not disclose draft/private fields or gated file content.

## Ranking and indexing

- Initial ranking gives strongest weight to title, then summary/abstract, then taxonomy/author metadata.
- Exact ranking weights remain a tuning parameter based on representative content and search evaluation, not an arbitrary permanent value.
- Define normalization for Indonesian and English separately where needed; language dictionaries/configurations must be tested on real terms.
- Index updates on publish/unpublish/translation changes must not expose draft records.
- Search results must have stable pagination and deterministic tie-break ordering.

## PDF full-text

Do not include PDF full-text in MVP unless a spike demonstrates extraction quality, language support, processing cost, security, and content-rights suitability. Extracted text is sensitive content and must inherit file access classification; it must not accidentally become a public search snippet for gated files.

## Exit / scale-up criteria

Evaluate Meilisearch/Typesense only when measured query latency, relevance tuning, typo tolerance, multilingual behavior, facets, or load requirements exceed the Postgres solution. Migration requires a source-of-truth and reindexing plan.

## Validation

Create a representative dataset and a relevance test set with expected top results for ID/EN. Measure query latency, typo behavior, no-result behavior, pagination, index freshness, and non-disclosure of drafts/gated contents.
