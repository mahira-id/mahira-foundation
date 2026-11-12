import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
