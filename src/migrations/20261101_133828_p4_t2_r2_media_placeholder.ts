import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "placeholder" boolean DEFAULT false;
  CREATE INDEX "media_placeholder_idx" ON "media" USING btree ("placeholder");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_placeholder_idx";
  ALTER TABLE "media" DROP COLUMN "placeholder";`)
}
