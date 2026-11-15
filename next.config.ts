import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import { HTML_LIMITED_BOTS } from "./lib/seo/html-limited-bots";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // M3-07 item 9 (DECISIONS §2.13): app/global-not-found.tsx answers URLs
    // that match no route (two root layouts, so no app/not-found.tsx).
    globalNotFound: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // M3-07 item 8 (DECISIONS §2.13): crawlers on this list (Next's default
  // list + Googlebot) get the blocking render, so an unknown publication
  // slug answers a real 404 and an old slug a real 308 instead of HTTP 200
  // with the static shell. Re-check on every Next upgrade (DEC-006).
  htmlLimitedBots: HTML_LIMITED_BOTS,
  // One copy of `payload` for pages, /admin and the REST routes. withPayload
  // externalizes it only in dev; bundled, the RSC and route layers each get a
  // copy while getPayload shares one global instance, so a page-first init
  // breaks `instanceof ValidationError` in REST error formatting and drops
  // errors[0].data (TEST-PLAN §12.5). Re-check on every Payload upgrade (DEC-006).
  serverExternalPackages: ["payload"],
  turbopack: {
    root: path.resolve(dirname),
    rules: {
      // Tailwind only processes project CSS; Payload's CSS in node_modules is "foreign".
      "*.css": {
        condition: { not: "foreign" },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
