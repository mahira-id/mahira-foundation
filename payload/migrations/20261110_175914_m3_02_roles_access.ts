import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { enableRlsOnPayloadTables } from '../db/enable-rls'

// M3-02: staff role (DEC-009/DEC-016), Publication everPublished flag, and
// Topic/Publication Type isActive (Owner 2026-11-10, P5 A and P6 A (i)).
// Additive only: new columns with defaults and one enum.
//
// P5 A: the single existing staff user becomes Admin. With more than one user
// the migration stops, because the Owner must say who is Admin.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const users = await db.execute(sql`SELECT count(*)::int AS count FROM "users"`)
  const userCount = Number((users.rows[0] as { count: number } | undefined)?.count ?? 0)
  if (userCount > 1) {
    throw new Error(
      `m3_02_roles_access: expected at most 1 staff user, found ${userCount}; ask the Owner which user is Admin (P5)`,
    )
  }

  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  ALTER TABLE "publications" ADD COLUMN "ever_published" boolean DEFAULT false;
  ALTER TABLE "_publications_v" ADD COLUMN "version_ever_published" boolean DEFAULT false;
  ALTER TABLE "topics" ADD COLUMN "is_active" boolean DEFAULT false;
  ALTER TABLE "publication_types" ADD COLUMN "is_active" boolean DEFAULT false;`)

  if (userCount === 1) {
    await db.execute(sql`UPDATE "users" SET "role" = 'admin'`)
  }

  // A record is "ever published" if it is published now or any of its
  // versions was. Every version of such a record gets the flag as well:
  // with drafts on, Payload loads originalDoc from the latest version.
  await db.execute(sql`
   UPDATE "publications" p SET "ever_published" = true
    WHERE p."_status" = 'published'
       OR EXISTS (SELECT 1 FROM "_publications_v" v WHERE v."parent_id" = p."id" AND v."version__status" = 'published');
  UPDATE "_publications_v" v SET "version_ever_published" = true
    WHERE v."parent_id" IN (SELECT p."id" FROM "publications" p WHERE p."ever_published" = true);`)

  await enableRlsOnPayloadTables({ db, payload, req })
}

// Reviewed, not run on the shared mahira-cms database (DEC-007): it would
// drop the Owner's Admin role. IF EXISTS guards keep it order-independent,
// same pattern as 20261109_164253_media. No table is created in up(), so
// there is no RLS to disable.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "role";
  ALTER TABLE IF EXISTS "publications" DROP COLUMN IF EXISTS "ever_published";
  ALTER TABLE IF EXISTS "_publications_v" DROP COLUMN IF EXISTS "version_ever_published";
  ALTER TABLE IF EXISTS "topics" DROP COLUMN IF EXISTS "is_active";
  ALTER TABLE IF EXISTS "publication_types" DROP COLUMN IF EXISTS "is_active";
  DROP TYPE IF EXISTS "public"."enum_users_role";`)
}
