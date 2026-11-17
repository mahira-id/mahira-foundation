import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig, type DatabaseAdapterObj } from "payload";
import { DEFAULT_LOCALE } from "../lib/i18n/locales";
import { Authors } from "./collections/Authors";
import { staffRoleOf } from "./access/roles";
import { LearningResources } from "./collections/LearningResources";
import { Media } from "./collections/Media";
import { PublicationFiles } from "./collections/PublicationFiles";
import { Publications } from "./collections/Publications";
import { PublicationSlugs } from "./collections/PublicationSlugs";
import { PublicationTypes } from "./collections/PublicationTypes";
import { Topics } from "./collections/Topics";
import { TranslationGroups } from "./collections/TranslationGroups";
import { Users } from "./collections/Users";
import { SUPABASE_ROOT_CA_2021 } from "./db/supabase-root-ca";
import { About } from "./globals/About";
import { LearningHub } from "./globals/LearningHub";
import { readCmsEnv } from "./env";
import { FILES_BUCKET, SIGNED_DOWNLOAD_TTL_SECONDS, storageClientConfig } from "./storage";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");

// null = CMS off (no CMS env, or Vercel Production). See ./env.ts.
const cms = readCmsEnv();

// Supabase Storage of the APP project (mahira.id), S3-compatible endpoint.
// The S3 access keys bypass Storage RLS: server-only, never NEXT_PUBLIC_*.
const appSupabaseUrl = cms ? cms.APP_SUPABASE_URL.replace(/\/+$/, "") : "";
// Public bucket and prefix of `media` (covers), kept until M4 (Owner
// 2026-11-10, M3-00 U2; 2026-11-16, DECISIONS §2.14 item 5; DEC-017/020).
const PUBLIC_BUCKET = "spike-m2-public";
const MEDIA_PREFIX = "spike-m2";

// One S3 client config for both buckets, shared with the public download
// signer (./storage.ts). Empty while the CMS is off.
const storageConfig = cms ? storageClientConfig(cms) : {};

/**
 * Keeps the process alive when the database connect of `payload.init` fails
 * (Owner 2026-11-12, item 1b answer 3 a, DECISIONS §2.9).
 *
 * `@payloadcms/db-postgres` 3.93.0 rejects its internal `initializing`
 * promise when the connect fails (`dist/connect.js`), and nothing awaits that
 * promise during init. The unhandled rejection made Vercel exit the function
 * instance (exit 128) and fail every request on it. With a handler attached,
 * `getPayload` still throws a catchable init error for that request only, the
 * next request retries init, and code that awaits `initializing` (drizzle
 * `beginTransaction`) still sees the rejection. `initializing` is not public
 * API: re-check on every Payload upgrade (DEC-006).
 */
function handleInitFailure<T>(db: DatabaseAdapterObj<T>): DatabaseAdapterObj<T> {
  const init = db.init;
  return {
    ...db,
    init: (args) => {
      const adapter = init(args);
      const initializing: unknown = (adapter as { initializing?: unknown }).initializing;
      if (initializing instanceof Promise) initializing.catch(() => undefined);
      return adapter;
    },
  };
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: repoRoot,
      importMapFile: path.resolve(repoRoot, "app", "(payload)", "admin", "importMap.js"),
    },
  },
  // PublicationSlugs last: Payload names compound indexes by column, so the
  // second (locale, slug) index gets a suffix; publications keeps
  // `locale_slug_idx` only while it is built first.
  collections: [
    Users,
    Publications,
    Authors,
    Topics,
    PublicationTypes,
    TranslationGroups,
    Media,
    PublicationFiles,
    PublicationSlugs,
    // M3-11 (DECISIONS §2.16): Learning Hub resources, after the existing
    // collections so their tables and index names stay as they are.
    LearningResources,
  ],
  // M3-09 (DECISIONS §2.15 decision 1): the About page, one localized global.
  // M3-12 (DECISIONS §2.16 decision 10A): texts of the Learning Hub catalog.
  globals: [About, LearningHub],
  plugins: [
    s3Storage({
      enabled: cms !== null,
      // Keeps the url, prefix and _objectKey fields when the plugin is off, so
      // the schema is the same with the CMS on or off.
      alwaysInsertFields: true,
      bucket: PUBLIC_BUCKET,
      collections: {
        media: {
          prefix: MEDIA_PREFIX,
          // Public bucket: serve files directly from Supabase, not via /api/media/file.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${appSupabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${prefix ? `${prefix}/` : ""}${encodeURIComponent(filename)}`,
        },
      },
      config: storageConfig,
    }),
    // M3-08 (DECISIONS §2.14): private bucket for publication files.
    // - Payload access control stays on, so the adapter's handler serves
    //   `/api/publication-files/file/<name>` to staff only (signed 302). The
    //   public download route signs its own GET with `attachment`
    //   (lib/cms/publication-file-storage.ts), not through this handler.
    // - signedDownloads: the handler answers 302 to a GET URL signed for
    //   SIGNED_DOWNLOAD_TTL_SECONDS instead of streaming through the function.
    // - clientUploads: the admin uploads browser → bucket with a presigned
    //   PUT (Vercel Function bodies stop at 4.5 MB); the presign endpoint
    //   `/api/storage-s3-generate-signed-url` is for Editor/Admin only.
    s3Storage({
      enabled: cms !== null,
      alwaysInsertFields: true,
      bucket: FILES_BUCKET,
      clientUploads: { access: ({ req }) => staffRoleOf(req) !== null },
      collections: {
        "publication-files": {
          signedDownloads: { expiresIn: SIGNED_DOWNLOAD_TTL_SECONDS },
        },
      },
      config: storageConfig,
    }),
  ],
  localization: {
    locales: [
      { code: "id", label: "Bahasa Indonesia" },
      { code: "en", label: "English" },
    ],
    // Payload requires a default locale for field-level localization. Owner
    // 2026-11-10, P4c (i): the site default locale is "id", used here and for
    // `/` only; no content fallback (fallback: false).
    defaultLocale: DEFAULT_LOCALE,
    fallback: false,
  },
  graphQL: {
    disable: true,
  },
  // CMS off: an empty secret makes payload.init throw before any DB
  // connection, so Payload denies even if proxy.ts were bypassed.
  secret: cms?.PAYLOAD_SECRET ?? "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: handleInitFailure(
    postgresAdapter({
      pool: {
        connectionString: cms?.CMS_SUPABASE_DATABASE_URI,
        // TLS verified against Supabase Root 2021 CA (M3-00 U1 S1). The URI must
        // not contain `sslmode`; pg would replace this `ssl` object.
        ssl: { ca: SUPABASE_ROOT_CA_2021 },
        // Pool limits per process (Owner 2026-11-12, item 1b answer 2 a). The
        // pg-pool defaults (10 clients, wait forever) filled the 15-client
        // Supabase session pooler from Vercel Preview. Payload keeps 1 client
        // checked out after connect, so 4 serve queries; idle ones close after
        // 5 s; a request that waits 10 s for a client fails instead of hanging
        // until the function timeout.
        max: 5,
        idleTimeoutMillis: 5_000,
        connectionTimeoutMillis: 10_000,
      },
      // Schema changes only through committed migrations; never dev push.
      push: false,
      migrationDir: path.resolve(dirname, "migrations"),
    }),
  ),
});
