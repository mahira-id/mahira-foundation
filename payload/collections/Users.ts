import type { CollectionConfig } from "payload";
import { isAdmin, isAdminField, isAdminOrSelf } from "../access/roles";
import { firstUserIsAdmin } from "../hooks/first-user-is-admin";
import { keepOneAdminOnDelete, keepOneAdminOnRoleChange } from "../hooks/keep-one-admin";

/**
 * Staff identity (Admin/Editor) for the Payload admin. Separate from public
 * users (DEC-009). There is no public self-registration.
 *
 * Staff user management is Admin only (ACCESS-POLICY §6, DEC-016): only Admin
 * creates, deletes or unlocks users and changes roles. An Editor reads and
 * updates only their own user (e.g. password) and cannot change `role`.
 * The last Admin can be neither demoted nor deleted.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  hooks: {
    // Owner 2026-11-10, P5 A: the first user of an empty database is Admin.
    beforeChange: [firstUserIsAdmin, keepOneAdminOnRoleChange],
    beforeDelete: [keepOneAdminOnDelete],
  },
  fields: [
    {
      // DEC-016: one role per staff user. Only Admin may set or change it.
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        position: "sidebar",
      },
    },
  ],
};
