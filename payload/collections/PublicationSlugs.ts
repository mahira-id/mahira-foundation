import type { CollectionConfig } from "payload";
import { isStaffOrAnonymousLocalRead } from "../access/roles";
import { validateSlug } from "../fields/slug";

/**
 * Slug history of public publication URLs (M3-07, DECISIONS §2.11 P9 A;
 * DATA-MODEL §4 PublicationSlug). One row per URL `/{locale}/publications/{slug}`
 * that visitors could open: every slug a Publication had when it was saved
 * published + public, its current one included. The detail page uses it for
 * the 308 of an old slug (lib/cms/public-content.ts getPublicationRedirect).
 *
 * Written only by the Publication hooks (payload/hooks/publication-slugs.ts)
 * with `overrideAccess: true`; nobody creates, edits or deletes a row through
 * the API or the admin. One owner per URL: unique (locale, slug), so a slug
 * that another record publishes later moves to that record. Rows point to the
 * record, not to a slug, so a chain A → B → C ends on the current slug in
 * one step. No versions: a restore never brings back or drops a row.
 *
 * Read: staff, or a public page through the server-side Local API
 * (anonymous REST denied, P1 A). A row says nothing about the record's
 * current state; the redirect reads the target as an anonymous visitor.
 */
export const PublicationSlugs: CollectionConfig = {
  slug: "publication-slugs",
  admin: {
    useAsTitle: "slug",
    hidden: true,
  },
  access: {
    read: isStaffOrAnonymousLocalRead,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  indexes: [{ fields: ["locale", "slug"], unique: true }],
  fields: [
    {
      name: "publication",
      type: "relationship",
      relationTo: "publications",
      required: true,
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
      // Unique per locale through the compound index, like Publication.slug.
      name: "slug",
      type: "text",
      required: true,
      validate: validateSlug,
    },
  ],
};
