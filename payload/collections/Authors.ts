import type { CollectionConfig } from "payload";
import { isStaff, isStaffOrAnonymousLocalRead } from "../access/roles";
import { slugField } from "../fields/slug";

export const Authors: CollectionConfig = {
  slug: "authors",
  admin: {
    useAsTitle: "displayName",
  },
  access: {
    // Anonymous REST denied (P1 A); public pages read via the Local API.
    read: isStaffOrAnonymousLocalRead,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      // A person's name is the same in every language (DEC-004).
      name: "displayName",
      type: "text",
      required: true,
    },
    slugField,
    {
      name: "biography",
      type: "textarea",
      localized: true,
    },
  ],
};
