import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook } from "payload";

const REQUIRED_LOCALES = ["id", "en"] as const;

type TermCollection = "topics" | "publication-types";

function isFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * An active Topic or Publication Type must have a name in Bahasa Indonesia and
 * English (DEC-004; Owner 2026-11-10, P6 A (i)). Inactive terms may miss one.
 *
 * The stored names are read with `locale: "all"` and WITHOUT `req`: passing
 * `req` would overwrite `req.locale` / `req.fallbackLocale` of the running
 * save (payload/dist/utilities/createLocalReq.js). The incoming name is then
 * laid over them (a string for `req.locale`, or an object for `locale=all`).
 */
export const requireBothLocaleNamesWhenActive: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  if ((data.isActive ?? originalDoc?.isActive) !== true) return data;

  const names: Record<string, unknown> = {};
  if (originalDoc?.id !== undefined) {
    const stored = await req.payload.findByID({
      collection: collection.slug as TermCollection,
      id: originalDoc.id,
      locale: "all",
      depth: 0,
      overrideAccess: true,
    });
    const storedName: unknown = stored.name;
    if (storedName !== null && typeof storedName === "object") Object.assign(names, storedName);
  }

  const incoming: unknown = data.name;
  if (typeof incoming === "string" && req.locale) {
    names[req.locale] = incoming;
  } else if (incoming !== null && typeof incoming === "object") {
    Object.assign(names, incoming);
  }

  const missing = REQUIRED_LOCALES.filter((locale) => !isFilled(names[locale]));
  if (missing.length > 0) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [
        {
          path: "isActive",
          message: `Term aktif wajib punya nama Bahasa Indonesia dan English; nama belum diisi untuk locale: ${missing.join(", ")}.`,
        },
      ],
      req,
    });
  }
  return data;
};
