import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { enableRlsOnPayloadTables } from '../db/enable-rls'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_publications_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_publications_access_level" AS ENUM('public', 'registered', 'subscriber');
  CREATE TYPE "public"."enum_publications_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_version_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum__publications_v_version_access_level" AS ENUM('public', 'registered', 'subscriber');
  CREATE TYPE "public"."enum__publications_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_published_locale" AS ENUM('id', 'en');
  CREATE TABLE "publications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"locale" "enum_publications_locale",
  	"translation_group_id" integer,
  	"summary" varchar,
  	"publication_type_id" integer,
  	"access_level" "enum_publications_access_level",
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_publications_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "publications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer,
  	"authors_id" integer
  );
  
  CREATE TABLE "_publications_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_locale" "enum__publications_v_version_locale",
  	"version_translation_group_id" integer,
  	"version_summary" varchar,
  	"version_publication_type_id" integer,
  	"version_access_level" "enum__publications_v_version_access_level",
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__publications_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__publications_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_publications_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer,
  	"authors_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "publications_id" integer;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_translation_group_id_translation_groups_id_fk" FOREIGN KEY ("translation_group_id") REFERENCES "public"."translation_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_publication_type_id_publication_types_id_fk" FOREIGN KEY ("publication_type_id") REFERENCES "public"."publication_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_parent_id_publications_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_translation_group_id_translation_groups_id_fk" FOREIGN KEY ("version_translation_group_id") REFERENCES "public"."translation_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_publication_type_id_publication_types_id_fk" FOREIGN KEY ("version_publication_type_id") REFERENCES "public"."publication_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "publications_translation_group_idx" ON "publications" USING btree ("translation_group_id");
  CREATE INDEX "publications_publication_type_idx" ON "publications" USING btree ("publication_type_id");
  CREATE INDEX "publications_updated_at_idx" ON "publications" USING btree ("updated_at");
  CREATE INDEX "publications_created_at_idx" ON "publications" USING btree ("created_at");
  CREATE INDEX "publications__status_idx" ON "publications" USING btree ("_status");
  CREATE UNIQUE INDEX "locale_slug_idx" ON "publications" USING btree ("locale","slug");
  CREATE UNIQUE INDEX "translationGroup_locale_idx" ON "publications" USING btree ("translation_group_id","locale");
  CREATE INDEX "publications_rels_order_idx" ON "publications_rels" USING btree ("order");
  CREATE INDEX "publications_rels_parent_idx" ON "publications_rels" USING btree ("parent_id");
  CREATE INDEX "publications_rels_path_idx" ON "publications_rels" USING btree ("path");
  CREATE INDEX "publications_rels_topics_id_idx" ON "publications_rels" USING btree ("topics_id");
  CREATE INDEX "publications_rels_authors_id_idx" ON "publications_rels" USING btree ("authors_id");
  CREATE INDEX "_publications_v_parent_idx" ON "_publications_v" USING btree ("parent_id");
  CREATE INDEX "_publications_v_version_version_translation_group_idx" ON "_publications_v" USING btree ("version_translation_group_id");
  CREATE INDEX "_publications_v_version_version_publication_type_idx" ON "_publications_v" USING btree ("version_publication_type_id");
  CREATE INDEX "_publications_v_version_version_updated_at_idx" ON "_publications_v" USING btree ("version_updated_at");
  CREATE INDEX "_publications_v_version_version_created_at_idx" ON "_publications_v" USING btree ("version_created_at");
  CREATE INDEX "_publications_v_version_version__status_idx" ON "_publications_v" USING btree ("version__status");
  CREATE INDEX "_publications_v_created_at_idx" ON "_publications_v" USING btree ("created_at");
  CREATE INDEX "_publications_v_updated_at_idx" ON "_publications_v" USING btree ("updated_at");
  CREATE INDEX "_publications_v_snapshot_idx" ON "_publications_v" USING btree ("snapshot");
  CREATE INDEX "_publications_v_published_locale_idx" ON "_publications_v" USING btree ("published_locale");
  CREATE INDEX "_publications_v_latest_idx" ON "_publications_v" USING btree ("latest");
  CREATE INDEX "version_locale_version_slug_idx" ON "_publications_v" USING btree ("version_locale","version_slug");
  CREATE INDEX "version_translationGroup_version_locale_idx" ON "_publications_v" USING btree ("version_translation_group_id","version_locale");
  CREATE INDEX "_publications_v_rels_order_idx" ON "_publications_v_rels" USING btree ("order");
  CREATE INDEX "_publications_v_rels_parent_idx" ON "_publications_v_rels" USING btree ("parent_id");
  CREATE INDEX "_publications_v_rels_path_idx" ON "_publications_v_rels" USING btree ("path");
  CREATE INDEX "_publications_v_rels_topics_id_idx" ON "_publications_v_rels" USING btree ("topics_id");
  CREATE INDEX "_publications_v_rels_authors_id_idx" ON "_publications_v_rels" USING btree ("authors_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_publications_id_idx" ON "payload_locked_documents_rels" USING btree ("publications_id");`)

  await enableRlsOnPayloadTables({ db, payload, req })
}

// SPIKE FIX (M2-01): the generated down() failed in both rollback paths:
// - migrate:down: `DROP TABLE "publications" CASCADE` already removes
//   payload_locked_documents_rels_publications_fk, so the later DROP CONSTRAINT
//   errored ("constraint ... does not exist");
// - migrate:reset: Payload 3.93.0 rolls back oldest-first, so `initial` had
//   already dropped payload_locked_documents_rels ("relation ... does not exist").
// IF EXISTS guards make the statements order-independent; nothing else changed.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "publications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "publications_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_publications_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_publications_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "publications" CASCADE;
  DROP TABLE IF EXISTS "publications_rels" CASCADE;
  DROP TABLE IF EXISTS "_publications_v" CASCADE;
  DROP TABLE IF EXISTS "_publications_v_rels" CASCADE;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_publications_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_publications_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "publications_id";
  DROP TYPE IF EXISTS "public"."enum_publications_locale";
  DROP TYPE IF EXISTS "public"."enum_publications_access_level";
  DROP TYPE IF EXISTS "public"."enum_publications_status";
  DROP TYPE IF EXISTS "public"."enum__publications_v_version_locale";
  DROP TYPE IF EXISTS "public"."enum__publications_v_version_access_level";
  DROP TYPE IF EXISTS "public"."enum__publications_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__publications_v_published_locale";`)
}
