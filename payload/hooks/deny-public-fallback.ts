import type { CollectionBeforeOperationHook } from "payload";

/**
 * No locale fallback for unauthenticated reads (DEC-005, finding C4c).
 *
 * The Local API copies a caller's `fallbackLocale` onto `req`, and `find` /
 * `findByID` read `req.fallbackLocale` after this hook runs. Forcing `false`
 * here means an anonymous read of a localized collection never shows text of
 * another language, whatever the caller (or a query parameter) asked for.
 * Staff users keep the requested fallback; that is an editing tool, not a
 * public page. Register it on every collection with localized fields.
 */
export const denyPublicFallback: CollectionBeforeOperationHook = ({ args, req }) => {
  if (!req.user) req.fallbackLocale = false;
  return args;
};
