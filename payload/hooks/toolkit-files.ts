import type { CollectionAfterReadHook } from "payload";

/**
 * Admin only (M3-13 follow-up): the file card of the "File toolkit" upload
 * field on Materi Learning Hub shows `doc.filename` and nothing else, and
 * Payload 3.93.0 has no setting for another text (RelationshipContent in
 * @payloadcms/ui reads `filename` from the document it fetched). The field
 * fetches its cards with a POST that carries
 * `X-Payload-HTTP-Method-Override: GET`, in the admin locale. For that
 * request only, `filename` becomes "Label - Nama File.pdf" with the label of
 * the request locale; an empty label leaves the filename alone. The stored
 * value, the URL, the page of the file itself, the public read layer and
 * every other read are unchanged.
 */
export const showLabelInAdminFileCard: CollectionAfterReadHook = ({ doc, req }) => {
  if (!req.user) return doc;
  if (req.method?.toUpperCase() !== "POST") return doc;
  if (req.headers?.get("x-payload-http-method-override")?.toUpperCase() !== "GET") return doc;
  const label = typeof doc?.label === "string" ? doc.label.trim() : "";
  if (!label || typeof doc.filename !== "string" || !doc.filename) return doc;
  return { ...doc, filename: `${label} - ${doc.filename}` };
};
