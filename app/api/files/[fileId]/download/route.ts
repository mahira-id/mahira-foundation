import type { NextRequest } from "next/server";

import { readDownloadPrincipal, withSessionWrites, type DownloadSession } from "@/lib/auth/download-session";
import { getFileDownload } from "@/lib/cms/public-content";
import { downloadResponse, parseFileId, type DownloadOutcome } from "@/lib/publications/file-download";
import { isCmsEnabled } from "@/payload/env";

/**
 * Publication file download (M3-08, DECISIONS §2.14 items 2 and 6; M5-04,
 * §2.18 decisions 11 and 12): the download link of the detail page's file
 * panel. A GET, so the link works without JavaScript (recorded deviation
 * from API-SPECIFICATION §5's POST). getFileDownload checks the file and its
 * live publication as an anonymous visitor on every request, then:
 * - effective level `public`: 307 to a 60 s signed URL of the private
 *   bucket, signed so that storage answers `Content-Disposition: attachment`
 *   with the stored file name; the session is not read;
 * - `registered` (while accounts are on): the public session is read here
 *   (lib/auth/download-session.ts, getUser(); proxy.ts does not refresh this
 *   route). Valid session with a verified email: the same 307. No valid
 *   session: 303 to `/{publication locale}/login?next=<detail path>` on the
 *   request's origin (full-document redirect, no render-time redirect,
 *   DECISIONS §2.10). Valid session, email not verified: 404. Supabase's
 *   cookies (refresh or removals) go onto that answer, with
 *   `Cache-Control: private, no-store`;
 * - every other denial (unknown or invalid id, draft, unpublished,
 *   `subscriber`, not ready) is the same 404; a database or storage failure
 *   is 503 (the log carries the error name only, never a URL).
 * `X-Robots-Tag: noindex` and `no-store` on every answer
 * (lib/publications/file-download.ts). The Payload cookie is never read: a
 * staff login gives no bypass here and counts as anonymous (DEC-009); staff
 * open files in /admin. No audit, download count or rate limit in M5
 * (§2.18 decision 10; FR-026 and rate limits are M4 items).
 *
 * proxy.ts answers 404 while the CMS is off (`/api/:path*`); the check here
 * repeats it. This static route wins over Payload's `/api/[...slug]`.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const id = parseFileId((await params).fileId);
  if (!isCmsEnabled() || id === null) return downloadResponse({ kind: "not-found" });
  // Read at most once, and only when getFileDownload asks (a `registered` file).
  const read: { session?: Promise<DownloadSession> } = {};
  const principal = async () => (await (read.session ??= readDownloadPrincipal(request))).principal;
  let outcome: DownloadOutcome;
  try {
    outcome = await getFileDownload(id, principal);
  } catch {
    // Logged by getFileDownload (error name only).
    outcome = { kind: "unavailable" };
  }
  const response = downloadResponse(outcome, request.url);
  return read.session ? withSessionWrites(response, await read.session) : response;
}
