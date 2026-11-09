import type { CollectionConfig } from "payload";

/**
 * Staff identity (Admin/Editor) for the Payload admin. Separate from public
 * users (DEC-009). No `access` override: Payload's default allows every
 * operation only to a logged-in user, so there is no public self-registration.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [],
};
