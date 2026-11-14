import type { TextField, TextFieldSingleValidation } from "payload";

/** Lowercase letters, digits and single hyphens; also the slug check of the public detail route (M3-05). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const validateSlug: TextFieldSingleValidation = (value) => {
  if (!value) {
    return "Slug is required.";
  }
  return (
    SLUG_PATTERN.test(value) ||
    "Use lowercase letters, digits and single hyphens (e.g. energi-iklim)."
  );
};

/** Required, unique, non-localized URL slug shared by taxonomy collections. */
export const slugField: TextField = {
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  validate: validateSlug,
};
