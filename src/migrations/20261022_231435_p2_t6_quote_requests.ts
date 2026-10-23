import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quote_requests_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_quote_requests_status" AS ENUM('new', 'contacted', 'quoted', 'closed', 'spam');
  CREATE TYPE "public"."enum_quote_requests_email_status" AS ENUM('pending', 'sent', 'failed');
  CREATE TABLE "quote_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"company" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"service_id" integer,
  	"message" varchar,
  	"locale" "enum_quote_requests_locale" DEFAULT 'ar' NOT NULL,
  	"source_page" varchar,
  	"consent" boolean DEFAULT false NOT NULL,
  	"status" "enum_quote_requests_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" integer,
  	"internal_notes" varchar,
  	"email_status" "enum_quote_requests_email_status" DEFAULT 'pending' NOT NULL,
  	"email_attempts" numeric DEFAULT 0,
  	"email_last_error" varchar,
  	"ip_hash" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quote_requests_id" integer;
  ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "quote_requests_service_idx" ON "quote_requests" USING btree ("service_id");
  CREATE INDEX "quote_requests_status_idx" ON "quote_requests" USING btree ("status");
  CREATE INDEX "quote_requests_assigned_to_idx" ON "quote_requests" USING btree ("assigned_to_id");
  CREATE INDEX "quote_requests_email_status_idx" ON "quote_requests" USING btree ("email_status");
  CREATE INDEX "quote_requests_ip_hash_idx" ON "quote_requests" USING btree ("ip_hash");
  CREATE INDEX "quote_requests_updated_at_idx" ON "quote_requests" USING btree ("updated_at");
  CREATE INDEX "quote_requests_created_at_idx" ON "quote_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quote_requests_fk" FOREIGN KEY ("quote_requests_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_quote_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("quote_requests_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_quote_requests_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_quote_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "quote_requests_id";
  ALTER TABLE "quote_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "quote_requests" CASCADE;
  DROP TYPE "public"."enum_quote_requests_locale";
  DROP TYPE "public"."enum_quote_requests_status";
  DROP TYPE "public"."enum_quote_requests_email_status";`)
}
