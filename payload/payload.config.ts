import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import { Authors } from "./collections/Authors";
import { Media } from "./collections/Media";
import { Publications } from "./collections/Publications";
import { PublicationTypes } from "./collections/PublicationTypes";
import { Topics } from "./collections/Topics";
import { TranslationGroups } from "./collections/TranslationGroups";
import { Users } from "./collections/Users";
import { resolveDatabaseUri } from "./db/database-uri";
import { requireEnv } from "./env";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");

// Supabase Storage of the APP project (mahira.id), S3-compatible endpoint.
// The S3 access keys bypass Storage RLS: server-only, never NEXT_PUBLIC_*.
const appSupabaseUrl = requireEnv("APP_SUPABASE_URL").replace(/\/+$/, "");
const appSupabaseRef = new URL(appSupabaseUrl).hostname.split(".")[0];
const PUBLIC_BUCKET = "spike-m2-public";

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
      bucket: PUBLIC_BUCKET,
      collections: {
        media: {
          prefix: "spike-m2",
          // Public bucket: serve files directly from Supabase, not via /api/media/file.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${appSupabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${prefix ? `${prefix}/` : ""}${encodeURIComponent(filename)}`,
        },
      },
      config: {
        endpoint: `https://${appSupabaseRef}.storage.supabase.co/storage/v1/s3`,
        // DECISIONS §2.2 (mahira.id region); production region open (DEC-017/DEC-020).
        region: "eu-central-1",
        forcePathStyle: true,
        credentials: {
          accessKeyId: requireEnv("APP_SUPABASE_S3_ACCESS_KEY_ID"),
          secretAccessKey: requireEnv("APP_SUPABASE_S3_SECRET_ACCESS_KEY"),
        },
      },
    }),
  ],
  localization: {
    locales: [
      { code: "id", label: "Bahasa Indonesia" },
      { code: "en", label: "English" },
    ],
    // Payload requires a default locale for field-level localization. This is
    // not the open DEC-005 decision about the site's default/fallback locale.
    defaultLocale: "id",
    fallback: false,
  },
  graphQL: {
    disable: true,
  },
  secret: requireEnv("PAYLOAD_SECRET"),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: resolveDatabaseUri(),
      // Without this, node-postgres talks to the Supabase pooler in plaintext
      // (the URI has no sslmode). Verifying against the system CA store fails
      // with SELF_SIGNED_CERT_IN_CHAIN (M2-01 evidence).
      // SPIKE ONLY: production must pin the Supabase CA certificate (Dashboard → Database Settings → SSL Configuration)
      ssl: { rejectUnauthorized: false },
    },
    // Schema changes only through committed migrations; never dev push.
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
});
