import { Forbidden, type CollectionBeforeOperationHook, type GlobalBeforeOperationHook } from "payload";

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

/**
 * The same rule for a global (M3-09, the `about` global). Payload 3.93.0's
 * global `findOne` reads `req.fallbackLocale` before its beforeOperation
 * hooks run (payload/dist/globals/operations/findOne.js), so resetting it
 * here, as denyPublicFallback does, would come too late. Instead an
 * unauthenticated request that asks for a fallback locale is refused
 * (403), so it can never show text of another language. Without a request
 * for one (`false`, the sanitized default with `localization.fallback:
 * false`) the args pass unchanged. Staff keep the requested fallback.
 */
export const denyPublicFallbackForGlobal: GlobalBeforeOperationHook = ({ args, req }) => {
  if (!req.user && hasFallback(req.fallbackLocale)) throw new Forbidden(req.t);
  return args;
};

function hasFallback(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value !== "";
}
