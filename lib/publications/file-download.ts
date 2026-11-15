/**
 * The public download route `GET /api/files/{fileId}/download` (M3-08,
 * DECISIONS §2.14 items 2 and 6). Pure: no I/O, no Payload import.
 *
 * Answers: 307 to a short-lived signed URL when every check passed; 404 for
 * every denial (CMS off, invalid or unknown id, draft, unpublished, not
 * public, file not ready), so a denial says nothing about the file; 503 when
 * the database or the storage failed. Every answer has `Cache-Control:
 * no-store` (a signed URL is a bearer credential and must not be cached)
 * and `X-Robots-Tag: noindex` (PDFs are not indexed; DEC-021).
 */
export const DOWNLOAD_HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } as const;

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

export type DownloadOutcome = { kind: "redirect"; url: string } | { kind: "not-found" } | { kind: "unavailable" };

/** The HTTP answer of the download route; the signed URL goes only into `Location`. */
export function downloadResponse(outcome: DownloadOutcome): Response {
  if (outcome.kind === "redirect") {
    return new Response(null, { status: 307, headers: { ...DOWNLOAD_HEADERS, Location: outcome.url } });
  }
  if (outcome.kind === "unavailable") {
    return new Response("File could not be loaded", { status: 503, headers: DOWNLOAD_HEADERS });
  }
  return new Response("Not Found", { status: 404, headers: DOWNLOAD_HEADERS });
}
