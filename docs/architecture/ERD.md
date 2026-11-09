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
  LEARNING_RESOURCE }o--o{ TOPIC : relates_to
  LEARNING_RESOURCE }o--o{ PUBLICATION : references

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
  PUBLICATION_ASSET {
    string id PK
    string publication_id FK
    string kind
    string locale
    string storage_object_key
    string processing_status
    string access_override
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
    string id PK
    string title
    string slug
    string resource_type
    string status
  }
```

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

- Payload-owned: Publication, PublicationAsset (pending decision), Author, Topic, PublicationType, LearningResource, Page, StaffUser.
- Supabase Auth-owned: Auth user identity.
- App schema-owned: PublicUserProfile, Entitlement, audit/event tables, future payment tables.
- Object storage-owned: binary object; database holds metadata and opaque object key.

## 4. Decisions that can change this ERD

DEC-003 taxonomy/cardinality; DEC-004 translation model; DEC-007 schema ownership; DEC-009 staff access; DEC-011 asset-level access; DEC-012 asset metadata/storage adapter. Update this diagram when an ADR is Accepted.
