import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig, type DatabaseAdapterObj } from "payload";
import { DEFAULT_LOCALE } from "../lib/i18n/locales";
import { Authors } from "./collections/Authors";
import { Media } from "./collections/Media";
import { Publications } from "./collections/Publications";
import { PublicationTypes } from "./collections/PublicationTypes";
import { Topics } from "./collections/Topics";
import { TranslationGroups } from "./collections/TranslationGroups";
import { Users } from "./collections/Users";
import { SUPABASE_ROOT_CA_2021 } from "./db/supabase-root-ca";
import { readCmsEnv } from "./env";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");

// null = CMS off (no CMS env, or Vercel Production). See ./env.ts.
const cms = readCmsEnv();

// Supabase Storage of the APP project (mahira.id), S3-compatible endpoint.
// The S3 access keys bypass Storage RLS: server-only, never NEXT_PUBLIC_*.
const appSupabaseUrl = cms ? cms.APP_SUPABASE_URL.replace(/\/+$/, "") : "";
const appSupabaseRef = cms ? new URL(appSupabaseUrl).hostname.split(".")[0] : "";
// Spike bucket and prefix are kept until M3-08 (Owner 2026-11-10, M3-00 U2).
const PUBLIC_BUCKET = "spike-m2-public";
const MEDIA_PREFIX = "spike-m2";

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
  collections: [Users, Publications, Authors, Topics, PublicationTypes, TranslationGroups, Media],
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
      config: cms
        ? {
          endpoint: `https://${appSupabaseRef}.storage.supabase.co/storage/v1/s3`,
          // DECISIONS §2.2 (mahira.id region); production region open (DEC-017/DEC-020).
          region: "eu-central-1",
          forcePathStyle: true,
          credentials: {
            accessKeyId: cms.APP_SUPABASE_S3_ACCESS_KEY_ID,
            secretAccessKey: cms.APP_SUPABASE_S3_SECRET_ACCESS_KEY,
          },
        }
        : {},
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
