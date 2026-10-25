import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ADD COLUMN "needs_client_review" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "review_note" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_needs_client_review" boolean DEFAULT false;
  ALTER TABLE "_projects_v" ADD COLUMN "version_review_note" varchar;
  CREATE INDEX "projects_needs_client_review_idx" ON "projects" USING btree ("needs_client_review");
  CREATE INDEX "_projects_v_version_version_needs_client_review_idx" ON "_projects_v" USING btree ("version_needs_client_review");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "projects_needs_client_review_idx";
  DROP INDEX "_projects_v_version_version_needs_client_review_idx";
  ALTER TABLE "projects" DROP COLUMN "needs_client_review";
  ALTER TABLE "projects" DROP COLUMN "review_note";
  ALTER TABLE "_projects_v" DROP COLUMN "version_needs_client_review";
  ALTER TABLE "_projects_v" DROP COLUMN "version_review_note";`)
}
