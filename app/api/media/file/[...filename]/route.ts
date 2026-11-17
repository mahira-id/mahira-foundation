import { DOWNLOAD_HEADERS } from "@/lib/publications/file-download";

/**
 * `/api/media/file/*` (M3-08, DECISIONS §2.14 item 10): always 404 with
 * `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
 *
 * Media files are public bucket URLs (`disablePayloadAccessControl`,
 * payload/payload.config.ts), so the collection has no file handler and
 * Payload's REST route fell back to the local disk and answered HTTP 500
 * (SPIKE-003 §8). Nothing is served from here. Other methods answer 405.
 * This static route wins over Payload's `/api/[...slug]`.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string[] }> }) {
  // Read the params: the handler is never prerendered (Cache Components).
  await params;
  return new Response("Not Found", { status: 404, headers: DOWNLOAD_HEADERS });
}
