import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import { Authors } from "./collections/Authors";
import { PublicationTypes } from "./collections/PublicationTypes";
import { Topics } from "./collections/Topics";
import { TranslationGroups } from "./collections/TranslationGroups";
import { Users } from "./collections/Users";
import { resolveDatabaseUri } from "./db/database-uri";
import { requireEnv } from "./env";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: repoRoot,
      importMapFile: path.resolve(repoRoot, "app", "(payload)", "admin", "importMap.js"),
    },
  },
  collections: [Users, Authors, Topics, PublicationTypes, TranslationGroups],
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
    },
    // Schema changes only through committed migrations; never dev push.
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
});
