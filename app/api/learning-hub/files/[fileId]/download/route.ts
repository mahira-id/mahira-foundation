import type { NextRequest } from "next/server";

import { getPublicToolkitFileDownload } from "@/lib/cms/public-content";
import { isLocale } from "@/lib/i18n/locales";
import { downloadResponse, parseFileId } from "@/lib/publications/file-download";
import { isCmsEnabled } from "@/payload/env";

/**
 * Public toolkit file download (M3-13, DECISIONS §2.16 decision 9, §2.17
 * decision 5A): the download link of the file panel on a toolkit page,
 * `/api/learning-hub/files/{fileId}/download?locale=id|en`. The path is
 * fixed, so the page locale is a required query value (the toolkit must be
 * visible in that locale). getPublicToolkitFileDownload checks the file and
 * the live toolkit as an anonymous visitor on every request; then the
 * answer is 307 to a 60 s signed URL of the private bucket, signed so that
 * storage answers `Content-Disposition: attachment` with the stored file
 * name. Every denial (CMS off, invalid or unknown id, missing or unknown
 * locale, draft, unpublished, not visible in that locale, inactive Topic,
 * file not ready or not on that toolkit) is the same 404; a database or
 * storage failure is 503 (the log carries the error name only, never a
 * URL). `Cache-Control: no-store` and `X-Robots-Tag: noindex` on every
 * answer (lib/publications/file-download.ts, shared with
 * /api/files/{id}/download). No session is read: a staff login gives no
 * bypass here; staff open files in /admin. No audit, count or rate limit.
 *
 * proxy.ts answers 404 while the CMS is off (`/api/:path*`); the check here
 * repeats it. This static route wins over Payload's `/api/[...slug]`
 * (Payload has no `learning-hub` collection; the global is under
 * `/api/globals/learning-hub`).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const id = parseFileId((await params).fileId);
  const locale = request.nextUrl.searchParams.get("locale");
  if (!isCmsEnabled() || id === null || locale === null || !isLocale(locale)) return downloadResponse({ kind: "not-found" });
  try {
    const url = await getPublicToolkitFileDownload(id, locale);
    return downloadResponse(url ? { kind: "redirect", url } : { kind: "not-found" });
  } catch {
    // Logged by getPublicToolkitFileDownload (error name only).
    return downloadResponse({ kind: "unavailable" });
  }
}
