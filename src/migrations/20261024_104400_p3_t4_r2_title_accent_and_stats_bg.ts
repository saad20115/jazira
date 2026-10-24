import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "stats_section_background_image_id" integer;
  ALTER TABLE "home_page_locales" ADD COLUMN "hero_title_accent" varchar;
  ALTER TABLE "home_page_locales" ADD COLUMN "cta_title_accent" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_stats_section_background_image_id" integer;
  ALTER TABLE "_home_page_v_locales" ADD COLUMN "version_hero_title_accent" varchar;
  ALTER TABLE "_home_page_v_locales" ADD COLUMN "version_cta_title_accent" varchar;
  ALTER TABLE "services_page_locales" ADD COLUMN "cta_title_accent" varchar;
  ALTER TABLE "_services_page_v_locales" ADD COLUMN "version_cta_title_accent" varchar;
  ALTER TABLE "projects_page_locales" ADD COLUMN "cta_title_accent" varchar;
  ALTER TABLE "_projects_page_v_locales" ADD COLUMN "version_cta_title_accent" varchar;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_stats_section_background_image_id_media_id_fk" FOREIGN KEY ("stats_section_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_stats_section_background_image_id_media_id_fk" FOREIGN KEY ("version_stats_section_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_stats_section_stats_section_background_image_idx" ON "home_page" USING btree ("stats_section_background_image_id");
  CREATE INDEX "_home_page_v_version_stats_section_version_stats_section_idx" ON "_home_page_v" USING btree ("version_stats_section_background_image_id");

  -- Backfill hero_title / hero_title_accent on home_page_locales and _home_page_v_locales (R-2)
  UPDATE "home_page_locales"
  SET
    "hero_title_accent" = CASE
      WHEN position(E'\n' in "hero_title") > 0 THEN btrim(regexp_replace(substring("hero_title" from position(E'\n' in "hero_title") + 1), E'\\s+', ' ', 'g'))
      WHEN btrim("hero_title") = 'Building the Future with Smart Solutions' THEN 'with Smart Solutions'
      WHEN btrim("hero_title") = 'نبني المستقبل بحلول هندسية ذكية' THEN 'بحلول هندسية ذكية'
      ELSE "hero_title_accent"
    END,
    "hero_title" = CASE
      WHEN position(E'\n' in "hero_title") > 0 THEN btrim(split_part("hero_title", E'\n', 1))
      WHEN btrim("hero_title") = 'Building the Future with Smart Solutions' THEN 'Building the Future'
      WHEN btrim("hero_title") = 'نبني المستقبل بحلول هندسية ذكية' THEN 'نبني المستقبل'
      ELSE "hero_title"
    END
  WHERE "hero_title" IS NOT NULL AND ("hero_title_accent" IS NULL OR btrim("hero_title_accent") = '');

  UPDATE "_home_page_v_locales"
  SET
    "version_hero_title_accent" = CASE
      WHEN position(E'\n' in "version_hero_title") > 0 THEN btrim(regexp_replace(substring("version_hero_title" from position(E'\n' in "version_hero_title") + 1), E'\\s+', ' ', 'g'))
      WHEN btrim("version_hero_title") = 'Building the Future with Smart Solutions' THEN 'with Smart Solutions'
      WHEN btrim("version_hero_title") = 'نبني المستقبل بحلول هندسية ذكية' THEN 'بحلول هندسية ذكية'
      ELSE "version_hero_title_accent"
    END,
    "version_hero_title" = CASE
      WHEN position(E'\n' in "version_hero_title") > 0 THEN btrim(split_part("version_hero_title", E'\n', 1))
      WHEN btrim("version_hero_title") = 'Building the Future with Smart Solutions' THEN 'Building the Future'
      WHEN btrim("version_hero_title") = 'نبني المستقبل بحلول هندسية ذكية' THEN 'نبني المستقبل'
      ELSE "version_hero_title"
    END
  WHERE "version_hero_title" IS NOT NULL AND ("version_hero_title_accent" IS NULL OR btrim("version_hero_title_accent") = '');

  -- Backfill cta_title / cta_title_accent on home_page, services_page, and projects_page (R-2)
  UPDATE "home_page_locales"
  SET
    "cta_title_accent" = CASE
      WHEN position(E'\n' in "cta_title") > 0 THEN btrim(regexp_replace(substring("cta_title" from position(E'\n' in "cta_title") + 1), E'\\s+', ' ', 'g'))
      WHEN btrim("cta_title") = 'Ready to Build Your Next Project?' THEN 'Your Next Project?'
      WHEN btrim("cta_title") = 'هل أنت مستعد لبناء مشروعك القادم؟' THEN 'مشروعك القادم؟'
      ELSE "cta_title_accent"
    END,
    "cta_title" = CASE
      WHEN position(E'\n' in "cta_title") > 0 THEN btrim(split_part("cta_title", E'\n', 1))
      WHEN btrim("cta_title") = 'Ready to Build Your Next Project?' THEN 'Ready to Build'
      WHEN btrim("cta_title") = 'هل أنت مستعد لبناء مشروعك القادم؟' THEN 'هل أنت مستعد لبناء'
      ELSE "cta_title"
    END
  WHERE "cta_title" IS NOT NULL AND ("cta_title_accent" IS NULL OR btrim("cta_title_accent") = '');

  UPDATE "_home_page_v_locales"
  SET
    "version_cta_title_accent" = CASE
      WHEN position(E'\n' in "version_cta_title") > 0 THEN btrim(regexp_replace(substring("version_cta_title" from position(E'\n' in "version_cta_title") + 1), E'\\s+', ' ', 'g'))
      WHEN btrim("version_cta_title") = 'Ready to Build Your Next Project?' THEN 'Your Next Project?'
      WHEN btrim("version_cta_title") = 'هل أنت مستعد لبناء مشروعك القادم؟' THEN 'مشروعك القادم؟'
      ELSE "version_cta_title_accent"
    END,
    "version_cta_title" = CASE
      WHEN position(E'\n' in "version_cta_title") > 0 THEN btrim(split_part("version_cta_title", E'\n', 1))
      WHEN btrim("version_cta_title") = 'Ready to Build Your Next Project?' THEN 'Ready to Build'
      WHEN btrim("version_cta_title") = 'هل أنت مستعد لبناء مشروعك القادم؟' THEN 'هل أنت مستعد لبناء'
      ELSE "version_cta_title"
    END
  WHERE "version_cta_title" IS NOT NULL AND ("version_cta_title_accent" IS NULL OR btrim("version_cta_title_accent") = '');

  UPDATE "services_page_locales"
  SET
    "cta_title_accent" = btrim(regexp_replace(substring("cta_title" from position(E'\n' in "cta_title") + 1), E'\\s+', ' ', 'g')),
    "cta_title" = btrim(split_part("cta_title", E'\n', 1))
  WHERE "cta_title" IS NOT NULL AND position(E'\n' in "cta_title") > 0 AND ("cta_title_accent" IS NULL OR btrim("cta_title_accent") = '');

  UPDATE "_services_page_v_locales"
  SET
    "version_cta_title_accent" = btrim(regexp_replace(substring("version_cta_title" from position(E'\n' in "version_cta_title") + 1), E'\\s+', ' ', 'g')),
    "version_cta_title" = btrim(split_part("version_cta_title", E'\n', 1))
  WHERE "version_cta_title" IS NOT NULL AND position(E'\n' in "version_cta_title") > 0 AND ("version_cta_title_accent" IS NULL OR btrim("version_cta_title_accent") = '');

  UPDATE "projects_page_locales"
  SET
    "cta_title_accent" = btrim(regexp_replace(substring("cta_title" from position(E'\n' in "cta_title") + 1), E'\\s+', ' ', 'g')),
    "cta_title" = btrim(split_part("cta_title", E'\n', 1))
  WHERE "cta_title" IS NOT NULL AND position(E'\n' in "cta_title") > 0 AND ("cta_title_accent" IS NULL OR btrim("cta_title_accent") = '');

  UPDATE "_projects_page_v_locales"
  SET
    "version_cta_title_accent" = btrim(regexp_replace(substring("version_cta_title" from position(E'\n' in "version_cta_title") + 1), E'\\s+', ' ', 'g')),
    "version_cta_title" = btrim(split_part("version_cta_title", E'\n', 1))
  WHERE "version_cta_title" IS NOT NULL AND position(E'\n' in "version_cta_title") > 0 AND ("version_cta_title_accent" IS NULL OR btrim("version_cta_title_accent") = '');`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "home_page_locales"
   SET "hero_title" = btrim("hero_title") || ' ' || btrim("hero_title_accent")
   WHERE "hero_title" IS NOT NULL AND "hero_title_accent" IS NOT NULL AND btrim("hero_title_accent") <> '';

   UPDATE "_home_page_v_locales"
   SET "version_hero_title" = btrim("version_hero_title") || ' ' || btrim("version_hero_title_accent")
   WHERE "version_hero_title" IS NOT NULL AND "version_hero_title_accent" IS NOT NULL AND btrim("version_hero_title_accent") <> '';

   UPDATE "home_page_locales"
   SET "cta_title" = btrim("cta_title") || ' ' || btrim("cta_title_accent")
   WHERE "cta_title" IS NOT NULL AND "cta_title_accent" IS NOT NULL AND btrim("cta_title_accent") <> '';

   UPDATE "_home_page_v_locales"
   SET "version_cta_title" = btrim("version_cta_title") || ' ' || btrim("version_cta_title_accent")
   WHERE "version_cta_title" IS NOT NULL AND "version_cta_title_accent" IS NOT NULL AND btrim("version_cta_title_accent") <> '';

   ALTER TABLE "home_page" DROP CONSTRAINT "home_page_stats_section_background_image_id_media_id_fk";
  
  ALTER TABLE "_home_page_v" DROP CONSTRAINT "_home_page_v_version_stats_section_background_image_id_media_id_fk";
  
  DROP INDEX "home_page_stats_section_stats_section_background_image_idx";
  DROP INDEX "_home_page_v_version_stats_section_version_stats_section_idx";
  ALTER TABLE "home_page" DROP COLUMN "stats_section_background_image_id";
  ALTER TABLE "home_page_locales" DROP COLUMN "hero_title_accent";
  ALTER TABLE "home_page_locales" DROP COLUMN "cta_title_accent";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_stats_section_background_image_id";
  ALTER TABLE "_home_page_v_locales" DROP COLUMN "version_hero_title_accent";
  ALTER TABLE "_home_page_v_locales" DROP COLUMN "version_cta_title_accent";
  ALTER TABLE "services_page_locales" DROP COLUMN "cta_title_accent";
  ALTER TABLE "_services_page_v_locales" DROP COLUMN "version_cta_title_accent";
  ALTER TABLE "projects_page_locales" DROP COLUMN "cta_title_accent";
  ALTER TABLE "_projects_page_v_locales" DROP COLUMN "version_cta_title_accent";`)
}
