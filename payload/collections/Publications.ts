import type { CollectionConfig } from "payload";
import { PUBLIC_PUBLICATION_READ } from "../access/public-read";
import { isAnonymousLocalRead, isStaff, isStaffField, staffRoleOf } from "../access/roles";
import { validateSlug } from "../fields/slug";
import { enforceSharedFields } from "../hooks/enforce-shared-fields";
import { readLiveOnSite } from "../hooks/live-on-site";
import { setPublicationLifecycleFields } from "../hooks/publication-lifecycle";

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
    // DECISIONS §2.6 P4 B: status columns of the minimum workflow (DEC-015).
    defaultColumns: ["title", "locale", "_status", "liveOnSite", "everPublished", "publishedAt", "updatedAt"],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    // Staff see everything, drafts included. Public pages read through the
    // server-side Local API and see published + public records only
    // (DEC-002); anonymous REST is denied (Owner 2026-11-10, P1 A).
    read: ({ req }) => {
      if (staffRoleOf(req) !== null) return true;
      if (isAnonymousLocalRead(req)) return PUBLIC_PUBLICATION_READ;
      return false;
    },
    create: isStaff,
    update: isStaff,
    readVersions: isStaff,
    // DEC-016: only Admin deletes a language version that was ever published.
    delete: ({ req }) => {
      const role = staffRoleOf(req);
      if (role === "admin") return true;
      if (role === "editor") return { everPublished: { equals: false } };
      return false;
    },
  },
  hooks: {
    // Lifecycle fields first (P3 B, DEC-016), then DEC-004: shared fields
    // stay equal across the Translation Group.
    beforeChange: [setPublicationLifecycleFields, enforceSharedFields],
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
      admin: {
        description: "Diisi otomatis saat terbit bila kosong; boleh diubah.",
      },
    },
    {
      // System flag, set by setPublicationLifecycleFields; clients cannot write it.
      name: "everPublished",
      type: "checkbox",
      defaultValue: false,
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Diisi sistem. Versi bahasa yang pernah terbit hanya boleh dihapus Admin (DEC-016).",
      },
    },
    {
      // Virtual, staff only, computed on read (DECISIONS §2.6 P4 B): no
      // column, no migration. Payload refuses list filters on virtual fields
      // and does not sort them.
      name: "liveOnSite",
      type: "select",
      label: "Tayang di situs",
      virtual: true,
      options: [
        { label: "Ya", value: "yes" },
        { label: "Tidak", value: "no" },
      ],
      access: {
        read: isStaffField,
        create: () => false,
        update: () => false,
      },
      hooks: {
        afterRead: [readLiveOnSite],
      },
      admin: {
        readOnly: true,
        position: "sidebar",
        disableListFilter: true,
        disableBulkEdit: true,
        description:
          "Dihitung sistem, tidak disimpan: Ya bila versi yang tayang berstatus published dan Access Level public (yang dilihat pengunjung, DEC-002). Status Changed + Ya = tayang dengan revisi tertunda.",
      },
    },
    {
      // Per-record (not in DEC-004's shared-field list), optional, public file.
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
  ],
};
