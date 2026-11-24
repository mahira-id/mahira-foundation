/**
 * The public download route `GET /api/files/{fileId}/download` (M3-08,
 * DECISIONS §2.14 items 2 and 6; M5-04, §2.18 decision 12). Pure: no I/O,
 * no Payload import.
 *
 * Answers: 307 to a short-lived signed URL when every check passed (the URL
 * asks storage for `Content-Disposition: attachment`, see
 * attachmentDisposition); 303 to the login page with an internal return
 * path for a `registered` file without a valid public session; 404 for
 * every other denial (CMS off, invalid or unknown id, draft, unpublished,
 * `subscriber`, unverified email, file not ready), so a denial says nothing
 * about the file; 503 when the database or the storage failed. Every
 * answer has `Cache-Control: no-store` (a signed URL is a bearer credential
 * and must not be cached) and `X-Robots-Tag: noindex` (PDFs are not
 * indexed; DEC-021).
 *
 * When the route read the public session (`registered` files only), the
 * answer also carries the cookies Supabase set (a refreshed session or
 * removals) and its cache headers, then `Cache-Control: private, no-store`.
 */
export const DOWNLOAD_HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } as const;

/** Cache-Control of an answer that read the public session. */
export const SESSION_CACHE_CONTROL = "private, no-store";

/** Largest id of the Postgres `integer` primary key; a bigger number is never a record. */
const MAX_ID = 2_147_483_647;

/** The `{fileId}` segment as a record id: digits without a leading zero, at most the integer range; else null. */
export function parseFileId(value: string | null | undefined): number | null {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,9}$/.test(value)) return null;
  const id = Number(value);
  return id <= MAX_ID ? id : null;
}

/** Path of the download link of a file on the detail page. */
export function downloadPath(id: number): string {
  return `/api/files/${id}/download`;
}

/** Name of a download whose stored name has no character left after cleaning. */
const FALLBACK_FILENAME = "download.pdf";

/**
 * `Content-Disposition` that storage sends with a signed download (Owner
 * 2026-11-16, DECISIONS §2.14 item 6): `attachment`, so the browser saves
 * the PDF instead of opening it inline, with the stored file name in both
 * forms of RFC 6266: `filename="…"` as an ASCII fallback and
 * `filename*=UTF-8''…` with the exact name percent-encoded (RFC 8187).
 * Control characters (CR, LF, …) are dropped from both forms; the fallback
 * turns non-ASCII characters, `"`, `\` and `%` into `_`. So the value never
 * ends the header or the quoted string, whatever the stored name holds.
 */
export function attachmentDisposition(filename: string): string {
  const name = filename.toWellFormed().replace(/[\u0000-\u001f\u007f-\u009f]/g, "") || FALLBACK_FILENAME;
  const ascii = name.replace(/[^\u0020-\u007e]|["\\%]/g, "_");
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export type DownloadOutcome =
  | { kind: "redirect"; url: string }
  | { kind: "login"; location: string }
  | { kind: "not-found" }
  | { kind: "unavailable" };

/**
 * The HTTP answer of the download route; the signed URL goes only into
 * `Location`. `base` is the request URL: the login `Location` is absolute
 * on the request's own origin. The session cookies, when the route read the
 * session, are added by lib/auth/download-session.ts withSessionWrites.
 */
export function downloadResponse(outcome: DownloadOutcome, base?: string): Response {
  if (outcome.kind === "redirect") {
    return new Response(null, { status: 307, headers: { ...DOWNLOAD_HEADERS, Location: outcome.url } });
  }
  if (outcome.kind === "login") {
    const location = base ? new URL(outcome.location, base).toString() : outcome.location;
    return new Response(null, { status: 303, headers: { ...DOWNLOAD_HEADERS, Location: location } });
  }
  if (outcome.kind === "unavailable") {
    return new Response("File could not be loaded", { status: 503, headers: DOWNLOAD_HEADERS });
  }
  return new Response("Not Found", { status: 404, headers: DOWNLOAD_HEADERS });
}
