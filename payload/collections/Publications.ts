import type { CollectionConfig } from "payload";
import { validateSlug } from "../fields/slug";
import { enforceSharedFields } from "../hooks/enforce-shared-fields";

/**
 * Publication (DEC-004 linked-record model): one record per language, linked
 * by `translationGroup`. No field is localized; `locale` says which language
 * the record is written in (DATA-MODEL §4.1).
 *
 * Uniqueness is per language, enforced by compound indexes: one slug per
 * locale, and at most one record per locale in a translation group.
 */
export const Publications: CollectionConfig = {
  slug: "publications",
  admin: {
    useAsTitle: "title",
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    // Anonymous readers see published records only; staff see drafts too.
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
    readVersions: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // DEC-004: shared fields stay equal across the Translation Group.
    beforeChange: [enforceSharedFields],
  },
  indexes: [
    { fields: ["locale", "slug"], unique: true },
    { fields: ["translationGroup", "locale"], unique: true },
  ],
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      // Unique per locale through the compound index, not globally.
      name: "slug",
      type: "text",
      required: true,
      validate: validateSlug,
    },
    {
      name: "locale",
      type: "select",
      required: true,
      options: [
        { label: "Bahasa Indonesia", value: "id" },
        { label: "English", value: "en" },
      ],
    },
    {
      name: "translationGroup",
      type: "relationship",
      relationTo: "translation-groups",
      required: true,
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "publicationType",
      type: "relationship",
      relationTo: "publication-types",
      required: true,
    },
    {
      name: "topics",
      type: "relationship",
      relationTo: "topics",
      hasMany: true,
      required: true,
      minRows: 1,
    },
    {
      name: "authors",
      type: "relationship",
      relationTo: "authors",
      hasMany: true,
      required: true,
      minRows: 1,
    },
    {
      // No default: every publication needs an explicit access decision.
      name: "accessLevel",
      type: "select",
      required: true,
      options: [
        { label: "Public", value: "public" },
        { label: "Registered", value: "registered" },
        { label: "Subscriber", value: "subscriber" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
    },
    {
      // Per-record (not in DEC-004's shared-field list), optional, public file.
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
  ],
};
