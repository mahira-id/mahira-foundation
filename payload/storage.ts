import type { S3ClientConfig } from "@aws-sdk/client-s3";

import type { CmsEnv } from "./env";

/**
 * Server-only. Supabase Storage of the APP project (mahira.id) through its
 * S3-compatible endpoint, shared by the storage adapter in
 * payload/payload.config.ts and the public download signer in
 * lib/cms/publication-file-storage.ts, so both use one endpoint, region and
 * key set. The S3 access keys bypass Storage RLS: server-only, never
 * NEXT_PUBLIC_*.
 */

/**
 * Private bucket of `publication-files` (M3-08, DECISIONS §2.14 items 2, 5),
 * created by the Owner: not public, 50 MB limit, application/pdf only.
 * Shared by Preview, local runs and tests (test objects `fixture-test-*`).
 */
export const FILES_BUCKET = "publication-files";

/**
 * TTL of a signed download URL (item 2): an unpublish or an access change
 * takes effect for new downloads at once, and within 60 s for a URL
 * already handed out.
 */
export const SIGNED_DOWNLOAD_TTL_SECONDS = 60;

/**
 * S3 client config for every bucket of the APP project (the S3 keys cover
 * every bucket, SPIKE-003 §8).
 */
export function storageClientConfig(cms: CmsEnv): S3ClientConfig {
  const ref = new URL(cms.APP_SUPABASE_URL.replace(/\/+$/, "")).hostname.split(".")[0];
  return {
    endpoint: `https://${ref}.storage.supabase.co/storage/v1/s3`,
    // DECISIONS §2.2 (mahira.id region); production region open (DEC-017/DEC-020).
    region: "eu-central-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: cms.APP_SUPABASE_S3_ACCESS_KEY_ID,
      secretAccessKey: cms.APP_SUPABASE_S3_SECRET_ACCESS_KEY,
    },
  };
}
