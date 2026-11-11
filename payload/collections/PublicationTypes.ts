import type { CollectionConfig } from "payload";
import { isAdmin, isStaffOrAnonymousLocalRead } from "../access/roles";
import { slugField } from "../fields/slug";
import { denyPublicFallback } from "../hooks/deny-public-fallback";
import { requireBothLocaleNamesWhenActive } from "../hooks/require-both-locale-names";

export const PublicationTypes: CollectionConfig = {
  slug: "publication-types",
  admin: {
    useAsTitle: "name",
  },
  access: {
    // Anonymous REST denied (P1 A); public pages read via the Local API.
    read: isStaffOrAnonymousLocalRead,
    // DEC-016: taxonomy terms are managed by Admin only.
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeOperation: [denyPublicFallback],
    beforeChange: [requireBothLocaleNamesWhenActive],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
    },
    slugField,
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      // Owner 2026-11-10, P6 A (i). Public meaning of "inactive": M3-05.
      name: "isActive",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Term aktif wajib punya nama Bahasa Indonesia dan English (DEC-004).",
      },
    },
  ],
};
