import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_scope" AS ENUM('mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical', 'low-current', 'data-center', 'civil');
  CREATE TYPE "public"."enum_projects_category" AS ENUM('mep', 'fire-fighting', 'low-current', 'data-center', 'civil-mep');
  CREATE TYPE "public"."enum_projects_execution_status" AS ENUM('completed', 'in-progress');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_scope" AS ENUM('mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical', 'low-current', 'data-center', 'civil');
  CREATE TYPE "public"."enum__projects_v_version_category" AS ENUM('mep', 'fire-fighting', 'low-current', 'data-center', 'civil-mep');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_published_locale" AS ENUM('ar', 'en');
  CREATE TABLE "projects_scope" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_projects_scope",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_details_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_deliverables_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_projects_category",
  	"year" numeric,
  	"cover_image_id" integer,
  	"video_id" integer,
  	"video_url" varchar,
  	"slug" varchar,
  	"slug_locked" boolean DEFAULT false,
  	"status" "enum_projects_execution_status",
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar,
  	"client" varchar,
  	"location" varchar,
  	"scope_summary" varchar,
  	"delivered_by" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_projects_v_version_scope" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__projects_v_version_scope",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_details_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_version_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_deliverables_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_category" "enum__projects_v_version_category",
  	"version_year" numeric,
  	"version_cover_image_id" integer,
  	"version_video_id" integer,
  	"version_video_url" varchar,
  	"version_slug" varchar,
  	"version_slug_locked" boolean DEFAULT false,
  	"version_status" "enum_projects_execution_status",
  	"version_featured" boolean DEFAULT false,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__projects_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_projects_v_locales" (
  	"version_title" varchar,
  	"version_client" varchar,
  	"version_location" varchar,
  	"version_scope_summary" varchar,
  	"version_delivered_by" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "services" ALTER COLUMN "tier" DROP DEFAULT;
  ALTER TABLE "services" ALTER COLUMN "icon" DROP DEFAULT;
  ALTER TABLE "_services_v" ALTER COLUMN "version_tier" DROP DEFAULT;
  ALTER TABLE "_services_v" ALTER COLUMN "version_icon" DROP DEFAULT;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "projects_scope" ADD CONSTRAINT "projects_scope_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_details" ADD CONSTRAINT "projects_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_details_locales" ADD CONSTRAINT "projects_details_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_details"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_deliverables" ADD CONSTRAINT "projects_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_deliverables_locales" ADD CONSTRAINT "projects_deliverables_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_deliverables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_scope" ADD CONSTRAINT "_projects_v_version_scope_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_details" ADD CONSTRAINT "_projects_v_version_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_details_locales" ADD CONSTRAINT "_projects_v_version_details_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_details"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_deliverables" ADD CONSTRAINT "_projects_v_version_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_deliverables_locales" ADD CONSTRAINT "_projects_v_version_deliverables_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_deliverables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_video_id_videos_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_scope_order_idx" ON "projects_scope" USING btree ("order");
  CREATE INDEX "projects_scope_parent_idx" ON "projects_scope" USING btree ("parent_id");
  CREATE INDEX "projects_details_order_idx" ON "projects_details" USING btree ("_order");
  CREATE INDEX "projects_details_parent_id_idx" ON "projects_details" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_details_locales_locale_parent_id_unique" ON "projects_details_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_details_locales_parent_id_idx" ON "projects_details_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_deliverables_order_idx" ON "projects_deliverables" USING btree ("_order");
  CREATE INDEX "projects_deliverables_parent_id_idx" ON "projects_deliverables" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_deliverables_locales_locale_parent_id_unique" ON "projects_deliverables_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_deliverables_locales_parent_id_idx" ON "projects_deliverables_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category");
  CREATE INDEX "projects_cover_image_idx" ON "projects" USING btree ("cover_image_id");
  CREATE INDEX "projects_video_idx" ON "projects" USING btree ("video_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");
  CREATE INDEX "projects_featured_idx" ON "projects" USING btree ("featured");
  CREATE INDEX "projects_order_idx" ON "projects" USING btree ("order");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "projects_meta_meta_image_idx" ON "projects_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_locales_parent_id_idx" ON "projects_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_media_id_idx" ON "projects_rels" USING btree ("media_id");
  CREATE INDEX "_projects_v_version_scope_order_idx" ON "_projects_v_version_scope" USING btree ("order");
  CREATE INDEX "_projects_v_version_scope_parent_idx" ON "_projects_v_version_scope" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_details_order_idx" ON "_projects_v_version_details" USING btree ("_order");
  CREATE INDEX "_projects_v_version_details_parent_id_idx" ON "_projects_v_version_details" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_details_locales_locale_parent_id_unique" ON "_projects_v_version_details_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_details_locales_parent_id_idx" ON "_projects_v_version_details_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_deliverables_order_idx" ON "_projects_v_version_deliverables" USING btree ("_order");
  CREATE INDEX "_projects_v_version_deliverables_parent_id_idx" ON "_projects_v_version_deliverables" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_projects_v_version_deliverables_locales_locale_parent_id_un" ON "_projects_v_version_deliverables_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_version_deliverables_locales_parent_id_idx" ON "_projects_v_version_deliverables_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_category_idx" ON "_projects_v" USING btree ("version_category");
  CREATE INDEX "_projects_v_version_version_cover_image_idx" ON "_projects_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_projects_v_version_version_video_idx" ON "_projects_v" USING btree ("version_video_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_status_idx" ON "_projects_v" USING btree ("version_status");
  CREATE INDEX "_projects_v_version_version_featured_idx" ON "_projects_v" USING btree ("version_featured");
  CREATE INDEX "_projects_v_version_version_order_idx" ON "_projects_v" USING btree ("version_order");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_snapshot_idx" ON "_projects_v" USING btree ("snapshot");
  CREATE INDEX "_projects_v_published_locale_idx" ON "_projects_v" USING btree ("published_locale");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_autosave_idx" ON "_projects_v" USING btree ("autosave");
  CREATE INDEX "_projects_v_version_meta_version_meta_image_idx" ON "_projects_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_locales_parent_id_idx" ON "_projects_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_media_id_idx" ON "_projects_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_projects_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "projects_id";
  ALTER TABLE "projects_scope" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_details" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_details_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_deliverables_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_scope" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_details" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_details_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_deliverables_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_scope" CASCADE;
  DROP TABLE "projects_details" CASCADE;
  DROP TABLE "projects_details_locales" CASCADE;
  DROP TABLE "projects_deliverables" CASCADE;
  DROP TABLE "projects_deliverables_locales" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_scope" CASCADE;
  DROP TABLE "_projects_v_version_details" CASCADE;
  DROP TABLE "_projects_v_version_details_locales" CASCADE;
  DROP TABLE "_projects_v_version_deliverables" CASCADE;
  DROP TABLE "_projects_v_version_deliverables_locales" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_locales" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  ALTER TABLE "services" ALTER COLUMN "tier" SET DEFAULT 'main';
  ALTER TABLE "services" ALTER COLUMN "icon" SET DEFAULT 'mep';
  ALTER TABLE "_services_v" ALTER COLUMN "version_tier" SET DEFAULT 'main';
  ALTER TABLE "_services_v" ALTER COLUMN "version_icon" SET DEFAULT 'mep';
  DROP TYPE "public"."enum_projects_scope";
  DROP TYPE "public"."enum_projects_category";
  DROP TYPE "public"."enum_projects_execution_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_scope";
  DROP TYPE "public"."enum__projects_v_version_category";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum__projects_v_published_locale";`)
}
