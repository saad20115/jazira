import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "arabic_enabled" boolean DEFAULT false;
   UPDATE "site_settings" SET "arabic_enabled" = false WHERE "arabic_enabled" IS NULL;
   ALTER TABLE "quote_requests" ALTER COLUMN "locale" SET DEFAULT 'en'::"public"."enum_quote_requests_locale";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quote_requests" ALTER COLUMN "locale" SET DEFAULT 'ar'::"public"."enum_quote_requests_locale";
   ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "arabic_enabled";`)
}
