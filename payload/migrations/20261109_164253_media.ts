import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { enableRlsOnPayloadTables } from '../db/enable-rls'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'spike-m2',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "publications" ADD COLUMN "cover_image_id" integer;
  ALTER TABLE "_publications_v" ADD COLUMN "version_cover_image_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  ALTER TABLE "publications" ADD CONSTRAINT "publications_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "publications_cover_image_idx" ON "publications" USING btree ("cover_image_id");
  CREATE INDEX "_publications_v_version_version_cover_image_idx" ON "_publications_v" USING btree ("version_cover_image_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");`)

  await enableRlsOnPayloadTables({ db, payload, req })
}

// SPIKE FIX (M2 integration): same guard as 20261109_132023_publications.
// `DROP TABLE "media" CASCADE` already removes the three FKs that reference it,
// so the generated DROP CONSTRAINT statements would fail; and Payload 3.93.0
// migrate:reset rolls back oldest-first, so earlier down() calls may already
// have dropped publications / payload_locked_documents_rels.
// IF EXISTS guards make the statements order-independent; nothing else changed.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "media" CASCADE;
  ALTER TABLE IF EXISTS "publications" DROP CONSTRAINT IF EXISTS "publications_cover_image_id_media_id_fk";
  
  ALTER TABLE IF EXISTS "_publications_v" DROP CONSTRAINT IF EXISTS "_publications_v_version_cover_image_id_media_id_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_fk";
  
  DROP INDEX IF EXISTS "publications_cover_image_idx";
  DROP INDEX IF EXISTS "_publications_v_version_version_cover_image_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_media_id_idx";
  ALTER TABLE IF EXISTS "publications" DROP COLUMN IF EXISTS "cover_image_id";
  ALTER TABLE IF EXISTS "_publications_v" DROP COLUMN IF EXISTS "version_cover_image_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "media_id";`)
}
