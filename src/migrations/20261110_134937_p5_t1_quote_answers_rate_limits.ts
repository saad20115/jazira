import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quote_requests_services_needed" AS ENUM('hvac', 'fire-fighting', 'plumbing', 'electrical', 'low-current', 'smart-systems', 'supply-only');
  CREATE TYPE "public"."enum_quote_requests_project_type" AS ENUM('hotel-tower', 'commercial-office', 'hospital-healthcare', 'industrial-warehouse', 'residential-compound', 'infrastructure-data-center', 'other');
  CREATE TYPE "public"."enum_quote_requests_project_stage" AS ENUM('design', 'tender', 'construction', 'retrofit', 'maintenance');
  CREATE TYPE "public"."enum_quote_requests_project_location" AS ENUM('makkah', 'riyadh', 'jeddah', 'madinah', 'eastern-province', 'neom-red-sea', 'other');
  CREATE TYPE "public"."enum_quote_requests_preferred_contact" AS ENUM('whatsapp', 'phone', 'email');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'notifyQuoteRequest' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'notifyQuoteRequest' BEFORE 'schedulePublish';
  CREATE TABLE "quote_requests_services_needed" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_quote_requests_services_needed",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "quote_rate_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ip_hash" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "quote_requests" ADD COLUMN "project_type" "enum_quote_requests_project_type";
  ALTER TABLE "quote_requests" ADD COLUMN "project_stage" "enum_quote_requests_project_stage";
  ALTER TABLE "quote_requests" ADD COLUMN "project_location" "enum_quote_requests_project_location";
  ALTER TABLE "quote_requests" ADD COLUMN "preferred_contact" "enum_quote_requests_preferred_contact";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quote_rate_limits_id" integer;
  ALTER TABLE "quote_requests_services_needed" ADD CONSTRAINT "quote_requests_services_needed_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "quote_requests_services_needed_order_idx" ON "quote_requests_services_needed" USING btree ("order");
  CREATE INDEX "quote_requests_services_needed_parent_idx" ON "quote_requests_services_needed" USING btree ("parent_id");
  CREATE INDEX "quote_rate_limits_ip_hash_idx" ON "quote_rate_limits" USING btree ("ip_hash");
  CREATE INDEX "quote_rate_limits_updated_at_idx" ON "quote_rate_limits" USING btree ("updated_at");
  CREATE INDEX "quote_rate_limits_created_at_idx" ON "quote_rate_limits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quote_rate_limits_fk" FOREIGN KEY ("quote_rate_limits_id") REFERENCES "public"."quote_rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_quote_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("quote_rate_limits_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Hand-fixed after generation (P5-T1): the generated order dropped the rate-limit table with
  // CASCADE before dropping its foreign key, so the key is dropped with IF EXISTS; queued
  // notification jobs are removed first so the job enums can be narrowed back.
  await db.execute(sql`
   ALTER TABLE "quote_requests_services_needed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quote_rate_limits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "quote_requests_services_needed" CASCADE;
  DROP TABLE "quote_rate_limits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_quote_rate_limits_fk";
  DELETE FROM "payload_jobs_log" WHERE "task_slug"::text = 'notifyQuoteRequest';
  DELETE FROM "payload_jobs" WHERE "task_slug"::text = 'notifyQuoteRequest';

  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_quote_rate_limits_id_idx";
  ALTER TABLE "quote_requests" DROP COLUMN "project_type";
  ALTER TABLE "quote_requests" DROP COLUMN "project_stage";
  ALTER TABLE "quote_requests" DROP COLUMN "project_location";
  ALTER TABLE "quote_requests" DROP COLUMN "preferred_contact";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quote_rate_limits_id";
  DROP TYPE "public"."enum_quote_requests_services_needed";
  DROP TYPE "public"."enum_quote_requests_project_type";
  DROP TYPE "public"."enum_quote_requests_project_stage";
  DROP TYPE "public"."enum_quote_requests_project_location";
  DROP TYPE "public"."enum_quote_requests_preferred_contact";`)
}
