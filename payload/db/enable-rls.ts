import { sql, type MigrateUpArgs } from "@payloadcms/db-postgres";
import { getTableName } from "@payloadcms/db-postgres/drizzle";

/**
 * Enables Row Level Security on every table Payload manages.
 *
 * Supabase grants anon/authenticated full privileges on new tables in the
 * `public` schema and exposes that schema through the Data API, so each
 * migration calls this at the end of `up()`. With RLS on and no policies, the
 * publishable key reads nothing; Payload connects as the table owner and is
 * not affected.
 *
 * Table names come from the Payload schema, not from user input; they are
 * still quoted as identifiers.
 */
export async function enableRlsOnPayloadTables({
  db,
  payload,
}: MigrateUpArgs): Promise<void> {
  const names = new Set<string>();
  for (const table of Object.values(payload.db.tables)) {
    names.add(getTableName(table));
  }

  for (const name of names) {
    const identifier = `"${name.replaceAll('"', '""')}"`;
    await db.execute(
      sql.raw(`ALTER TABLE IF EXISTS ${identifier} ENABLE ROW LEVEL SECURITY`),
    );
  }
}
