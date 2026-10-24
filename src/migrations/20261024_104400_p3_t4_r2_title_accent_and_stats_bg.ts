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

  -- Backfill hero_title / hero_title_accent on home_page_locales and _home_page_v_locales (R-2, R-12, R-13, R-25):
  -- Split strictly on newline (chr(10)); skip rows whose first line is empty; leave any single-line value untouched; use POSIX '[[:space:]]+' (no E'\\s+').
  UPDATE "home_page_locales"
  SET
    "hero_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("hero_title" from strpos("hero_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "hero_title" = btrim(
      regexp_replace(
        split_part("hero_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "hero_title" IS NOT NULL
    AND strpos("hero_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("hero_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "hero_title_accent" IS NULL
      OR btrim(regexp_replace("hero_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  UPDATE "_home_page_v_locales"
  SET
    "version_hero_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("version_hero_title" from strpos("version_hero_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "version_hero_title" = btrim(
      regexp_replace(
        split_part("version_hero_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "version_hero_title" IS NOT NULL
    AND strpos("version_hero_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("version_hero_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "version_hero_title_accent" IS NULL
      OR btrim(regexp_replace("version_hero_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  -- Backfill cta_title / cta_title_accent on home_page, services_page, and projects_page (R-2, R-12, R-13, R-25)
  UPDATE "home_page_locales"
  SET
    "cta_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("cta_title" from strpos("cta_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "cta_title" = btrim(
      regexp_replace(
        split_part("cta_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "cta_title" IS NOT NULL
    AND strpos("cta_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("cta_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "cta_title_accent" IS NULL
      OR btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  UPDATE "_home_page_v_locales"
  SET
    "version_cta_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("version_cta_title" from strpos("version_cta_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "version_cta_title" = btrim(
      regexp_replace(
        split_part("version_cta_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "version_cta_title" IS NOT NULL
    AND strpos("version_cta_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("version_cta_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "version_cta_title_accent" IS NULL
      OR btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  UPDATE "services_page_locales"
  SET
    "cta_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("cta_title" from strpos("cta_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "cta_title" = btrim(
      regexp_replace(
        split_part("cta_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "cta_title" IS NOT NULL
    AND strpos("cta_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("cta_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "cta_title_accent" IS NULL
      OR btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  UPDATE "_services_page_v_locales"
  SET
    "version_cta_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("version_cta_title" from strpos("version_cta_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "version_cta_title" = btrim(
      regexp_replace(
        split_part("version_cta_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "version_cta_title" IS NOT NULL
    AND strpos("version_cta_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("version_cta_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "version_cta_title_accent" IS NULL
      OR btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  UPDATE "projects_page_locales"
  SET
    "cta_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("cta_title" from strpos("cta_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "cta_title" = btrim(
      regexp_replace(
        split_part("cta_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "cta_title" IS NOT NULL
    AND strpos("cta_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("cta_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "cta_title_accent" IS NULL
      OR btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );

  UPDATE "_projects_page_v_locales"
  SET
    "version_cta_title_accent" = NULLIF(
      btrim(
        regexp_replace(
          substring("version_cta_title" from strpos("version_cta_title", chr(10)) + 1),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ),
      ''
    ),
    "version_cta_title" = btrim(
      regexp_replace(
        split_part("version_cta_title", chr(10), 1),
        '[[:space:]]+',
        ' ',
        'g'
      )
    )
  WHERE "version_cta_title" IS NOT NULL
    AND strpos("version_cta_title", chr(10)) > 0
    AND btrim(regexp_replace(split_part("version_cta_title", chr(10), 1), '[[:space:]]+', ' ', 'g')) <> ''
    AND (
      "version_cta_title_accent" IS NULL
      OR btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g')) = ''
    );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "home_page_locales"
   SET "hero_title" = CASE
     WHEN "hero_title" IS NULL OR btrim(regexp_replace("hero_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("hero_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("hero_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("hero_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "hero_title_accent" IS NOT NULL
     AND btrim(regexp_replace("hero_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "_home_page_v_locales"
   SET "version_hero_title" = CASE
     WHEN "version_hero_title" IS NULL OR btrim(regexp_replace("version_hero_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("version_hero_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("version_hero_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("version_hero_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "version_hero_title_accent" IS NOT NULL
     AND btrim(regexp_replace("version_hero_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "home_page_locales"
   SET "cta_title" = CASE
     WHEN "cta_title" IS NULL OR btrim(regexp_replace("cta_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("cta_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "cta_title_accent" IS NOT NULL
     AND btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "_home_page_v_locales"
   SET "version_cta_title" = CASE
     WHEN "version_cta_title" IS NULL OR btrim(regexp_replace("version_cta_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("version_cta_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "version_cta_title_accent" IS NOT NULL
     AND btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "services_page_locales"
   SET "cta_title" = CASE
     WHEN "cta_title" IS NULL OR btrim(regexp_replace("cta_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("cta_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "cta_title_accent" IS NOT NULL
     AND btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "_services_page_v_locales"
   SET "version_cta_title" = CASE
     WHEN "version_cta_title" IS NULL OR btrim(regexp_replace("version_cta_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("version_cta_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "version_cta_title_accent" IS NOT NULL
     AND btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "projects_page_locales"
   SET "cta_title" = CASE
     WHEN "cta_title" IS NULL OR btrim(regexp_replace("cta_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("cta_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "cta_title_accent" IS NOT NULL
     AND btrim(regexp_replace("cta_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

   UPDATE "_projects_page_v_locales"
   SET "version_cta_title" = CASE
     WHEN "version_cta_title" IS NULL OR btrim(regexp_replace("version_cta_title", '[[:space:]]+', ' ', 'g')) = ''
       THEN btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g'))
     ELSE btrim(regexp_replace("version_cta_title", '[[:space:]]+', ' ', 'g'))
       || chr(10)
       || btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g'))
   END
   WHERE "version_cta_title_accent" IS NOT NULL
     AND btrim(regexp_replace("version_cta_title_accent", '[[:space:]]+', ' ', 'g')) <> '';

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
