import type { NextRequest } from "next/server";

import { getPublicFileDownload } from "@/lib/cms/public-content";
import { downloadResponse, parseFileId } from "@/lib/publications/file-download";
import { isCmsEnabled } from "@/payload/env";

/**
 * Public file download (M3-08, DECISIONS §2.14 items 2 and 6): the
 * "Unduh PDF" / "Download PDF" link of the detail page. A GET, so the link
 * works without JavaScript (recorded deviation from API-SPECIFICATION §5's
 * POST). getPublicFileDownload checks the file and its live publication as
 * an anonymous visitor on every request; then the answer is 307 to a 60 s
 * signed URL of the private bucket, signed so that storage answers
 * `Content-Disposition: attachment` with the stored file name (the browser
 * downloads instead of opening inline). Every denial is the same 404; a database
 * or storage failure is 503 (the log carries the error name only, never a
 * URL). `Cache-Control: no-store` and `X-Robots-Tag: noindex` on every
 * answer (lib/publications/file-download.ts). No session is read: a staff
 * login gives no bypass here (DEC-009); staff open files in /admin. No
 * audit, download count or rate limit in M3-08 (item 9).
 *
 * proxy.ts answers 404 while the CMS is off (`/api/:path*`); the check here
 * repeats it. This static route wins over Payload's `/api/[...slug]`.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const id = parseFileId((await params).fileId);
  if (!isCmsEnabled() || id === null) return downloadResponse({ kind: "not-found" });
  try {
    const url = await getPublicFileDownload(id);
    return downloadResponse(url ? { kind: "redirect", url } : { kind: "not-found" });
  } catch {
    // Logged by getPublicFileDownload (error name only).
    return downloadResponse({ kind: "unavailable" });
  }
}
