import type { CollectionConfig } from "payload";
import { isStaff, isStaffOrAnonymousLocalRead } from "../access/roles";

/**
 * Public files (M2-03, DEC-012). Files are stored in Supabase Storage through
 * @payloadcms/storage-s3 on a public bucket; nothing is written to the
 * application filesystem (no staticDir). Gated/private assets are M5 and do
 * not belong in this collection.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    // Metadata: anonymous REST denied (P1 A); public pages use the Local API.
    // The files themselves are public bucket URLs (disablePayloadAccessControl).
    read: isStaffOrAnonymousLocalRead,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
