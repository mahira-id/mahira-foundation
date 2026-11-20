# Entity Relationship Diagram (ERD)

**Status:** Logical proposal. Cardinality and localization implementation require DEC-003/004/007/011.  
**Source:** `DATA-MODEL.md` is the field-level authority.

## 1. Editorial and content domain (conceptual)

```mermaid
erDiagram
  PUBLICATION ||--o{ PUBLICATION_ASSET : has
  PUBLICATION }o--o{ AUTHOR : credits
  PUBLICATION }o--o{ TOPIC : classified_as
  PUBLICATION }o--|| PUBLICATION_TYPE : has_type
  PUBLICATION }o--o{ PUBLICATION : translation_group
  PUBLICATION ||--o{ PUBLICATION_SLUG : public_url_history
  LEARNING_RESOURCE }o--|| TOPIC : theme

  PUBLICATION {
    string id PK
    string title
    string slug
    string locale
    string summary
    string access_level
    string status
    datetime published_at
  }
  PUBLICATION_SLUG {
    int id PK
    int publication_id FK
    string locale
    string slug
  }
  PUBLICATION_ASSET {
    int id PK
    string label
    string kind
    string language
    string access_level
    string status
    string filename
    string prefix
    string _objectKey
    string mime_type
    numeric filesize
  }
  AUTHOR {
    string id PK
    string display_name
    string slug
    boolean is_public
  }
  TOPIC {
    string id PK
    string name
    string slug
  }
  PUBLICATION_TYPE {
    string id PK
    string name
    string slug
  }
  LEARNING_RESOURCE {
    int id PK
    string type
    string title
    string summary
    string slug
    string material_language
    int topic_id FK
    string youtube_id
    int cover_image_id FK
    int sort_order
    datetime published_at
    boolean en_ready
    string status
  }
  LEARNING_HUB_TEXTS {
    string hero_title
    string hero_intro
    string seo_title
    string seo_description
    string status
  }
```

`PUBLICATION_ASSET` is the Payload upload collection `publication-files` as built in M3-08 (DECISIONS §2.14, DATA-MODEL §4.2.1): a Publication lists its files in order through `publications_rels.publication_files_id` (field `files`, upload `hasMany`; drafts in `_publications_v_rels`), with no back-relation column on the file. A file belongs to exactly one publication record, enforced by a Publication `beforeChange` hook, not by a database constraint. The object lives in the private bucket `publication-files`; `filename`, `prefix` and `_objectKey` locate it and stay server-only.

`LEARNING_RESOURCE` is the Payload collection `learning-resources` (M3-11, DECISIONS §2.16, DATA-MODEL §4.5; tables `lh_resources*`): one record per resource with field-localized ID/EN, one required Topic as its theme, an optional playlist cover in `media`, and its own sections array (the About section model, without CTAs). It has no relation to `PUBLICATION` in M3 (decision 14). `type` is `video`, `playlist`, `guide` or `toolkit`; toolkits are public since M3-13 (DECISIONS §2.17). `TOOLKIT_FILE` is the upload collection `toolkit-files` (private bucket `publication-files`, prefix `toolkits/`, PDF only; localized `label`, `language`, system `status`; no access level, no versions), and `LEARNING_RESOURCE.files` is an ordered, non-localized many-to-many list to it (tables `lh_resources_rels` and `_lh_resources_v_rels`, one list for ID and EN). A file belongs to exactly one toolkit (hook), not enforced by a foreign key. The relation is described here and in DATA-MODEL §4.5; it is not drawn in the diagram. `LEARNING_HUB_TEXTS` is the singleton global `learning-hub` (catalog H1, intro and SEO texts per locale; tables `learning_hub*`); it has no relations.
The diagram uses direct many-to-many labels for readability. Actual Payload implementation may generate join tables, arrays, or relation collections depending on the selected adapter and relationship configuration. If author order or contribution role is needed, use an explicit relation collection rather than an unqualified many-to-many relation.

## 2. Public account and entitlement domain

```mermaid
erDiagram
  AUTH_USER ||--o| PUBLIC_USER_PROFILE : has
  AUTH_USER ||--o{ ENTITLEMENT : receives
  ENTITLEMENT }o--o| PUBLICATION_REF : scopes_to
  ENTITLEMENT ||--o{ ENTITLEMENT_AUDIT : changes
  AUTH_USER ||--o{ DOWNLOAD_EVENT : initiates
  PUBLICATION_REF ||--o{ DOWNLOAD_EVENT : relates_to
  ASSET_REF ||--o{ DOWNLOAD_EVENT : relates_to

  AUTH_USER {
    uuid id PK
  }
  PUBLIC_USER_PROFILE {
    uuid user_id PK
    string display_name
    string locale_preference
    datetime created_at
  }
  ENTITLEMENT {
    uuid id PK
    uuid user_id FK
    string scope_type
    string scope_id
    string source
    string status
    datetime valid_from
    datetime valid_until
  }
  ENTITLEMENT_AUDIT {
    uuid id PK
    uuid entitlement_id FK
    string actor_type
    string action
    datetime occurred_at
  }
  DOWNLOAD_EVENT {
    uuid id PK
    uuid user_id FK
    string publication_ref
    string asset_ref
    string decision
    datetime occurred_at
  }
  PUBLICATION_REF {
    string id PK
  }
  ASSET_REF {
    string id PK
  }
```

`PUBLICATION_REF` and `ASSET_REF` are conceptual references across domain ownership, not necessarily foreign-key tables in Supabase application schema. Do not create cross-owner hard foreign keys unless migration and lifecycle ownership are designed and tested.

## 3. Ownership overlay

- Payload-owned: About (global singleton `about`, M3-09, DECISIONS §2.15, DATA-MODEL §4.6.1; tanpa relasi ke entitas lain, array bersarang hero CTA → seksi → daftar → butir milik dokumen itu sendiri), Publication, PublicationSlug (riwayat slug publik, unik per `locale` + `slug`; M3-07, DATA-MODEL §4.8), PublicationAsset (koleksi `publication-files`, M3-08, DECISIONS §2.14 butir 1, DATA-MODEL §4.2.1), Author, Topic, PublicationType, LearningResource (koleksi `learning-resources`, M3-11, DECISIONS §2.16, DATA-MODEL §4.5; relasi wajib ke Topic, opsional ke `media`) dan teks katalognya (global singleton `learning-hub`, DATA-MODEL §4.5.1), Page, StaffUser.
- Supabase Auth-owned: Auth user identity.
- App schema-owned: PublicUserProfile, Entitlement, audit/event tables, future payment tables.
- Object storage-owned: binary object; database holds metadata and opaque object key.

## 4. Decisions that can change this ERD

DEC-003 taxonomy/cardinality; DEC-004 translation model; DEC-007 schema ownership; DEC-009 staff access; DEC-011 asset-level access (Accepted 2026-11-16, DECISIONS §2.14 butir 3: `access_level` per file wajib, akses efektif = yang lebih ketat); DEC-012 asset metadata/storage adapter (tetap Proposed; M3-08 membuktikan private bucket + signed URL 60 detik untuk file publik). Update this diagram when an ADR is Accepted.
