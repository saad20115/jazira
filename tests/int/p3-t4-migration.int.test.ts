import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  down as migrateP3T4R2Down,
  up as migrateP3T4R2Up,
} from '../../src/migrations/20261024_104400_p3_t4_r2_title_accent_and_stats_bg'
import payloadConfig from '../../src/payload.config'

let payload: Payload

type DrizzleDb = {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Array<Record<string, unknown>> }>
}

function getDrizzle(instance: Payload): DrizzleDb {
  return (instance.db as unknown as { drizzle: DrizzleDb }).drizzle
}

async function hasColumn(db: DrizzleDb, tableName: string, columnName: string): Promise<boolean> {
  const res = await db.execute(sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    LIMIT 1
  `)
  return res.rows.length > 0
}

describe('P3-T4 R2 Migration Integration (R-12, R-13) — 20261024_104400_p3_t4_r2_title_accent_and_stats_bg', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: payloadConfig })
  })

  it('migrates pre-R2 rows containing "s", "\\n", embedded whitespace, single-line strings, and Arabic across home_page, services_page, projects_page and _v tables up and down without data loss', async () => {
    const db = getDrizzle(payload)

    // Ensure starting state has the R2 columns before rolling down to pre-R2 schema
    const hasHeroAccentInitially = await hasColumn(db, 'home_page_locales', 'hero_title_accent')
    if (!hasHeroAccentInitially) {
      await migrateP3T4R2Up({ db, payload, req: {} } as never)
    }

    try {
      // 1. Roll back to pre-R2 schema
      await migrateP3T4R2Down({ db, payload, req: {} } as never)

      expect(await hasColumn(db, 'home_page_locales', 'hero_title_accent')).toBe(false)
      expect(await hasColumn(db, 'home_page_locales', 'cta_title_accent')).toBe(false)
      expect(await hasColumn(db, 'services_page_locales', 'cta_title_accent')).toBe(false)
      expect(await hasColumn(db, 'projects_page_locales', 'cta_title_accent')).toBe(false)

      // 2. Clear and seed pre-R2 rows across all 6 global + version tables
      await db.execute(sql`
        DELETE FROM "_home_page_v_locales";
        DELETE FROM "_home_page_v";
        DELETE FROM "home_page_locales";
        DELETE FROM "home_page";

        DELETE FROM "_services_page_v_locales";
        DELETE FROM "_services_page_v";
        DELETE FROM "services_page_locales";
        DELETE FROM "services_page";

        DELETE FROM "_projects_page_v_locales";
        DELETE FROM "_projects_page_v";
        DELETE FROM "projects_page_locales";
        DELETE FROM "projects_page";
      `)

      await db.execute(sql`INSERT INTO "home_page" ("id", "_status") VALUES (1, 'published')`)
      await db.execute(sql`
        INSERT INTO "home_page_locales" ("_parent_id", "_locale", "hero_title", "cta_title")
        VALUES
          (1, 'en', ${'Building the Future\nwith Smart Solutions'}, ${'Ready to Build\nYour Next Smart Systems Project?'}),
          (1, 'ar', ${'نبني المستقبل\nبحلول هندسية ذكية'}, ${'هل أنت مستعد لبناء\nمشروعك الهندسي القادم؟'})
      `)

      await db.execute(
        sql`INSERT INTO "_home_page_v" ("id", "version__status", "latest") VALUES (1, 'published', true)`,
      )
      await db.execute(sql`
        INSERT INTO "_home_page_v_locales" ("_parent_id", "_locale", "version_hero_title", "version_cta_title")
        VALUES
          (1, 'en', ${'  Building the Future  \n  with   Smart   Solutions \n and   seamless   service  '}, ${'Single line CTA with smart solutions and zero newlines'}),
          (1, 'ar', ${'عنوان بسطر واحد بدون تقسيم تلقائي'}, ${'سطر أول للنداء\nسطر ثانٍ مميز\nمع سطر ثالث مدمج'})
      `)

      await db.execute(sql`INSERT INTO "services_page" ("id", "_status") VALUES (1, 'published')`)
      await db.execute(sql`
        INSERT INTO "services_page_locales" ("_parent_id", "_locale", "cta_title")
        VALUES
          (1, 'en', ${'Services CTA\nAccent part with smart systems'}),
          (1, 'ar', ${'نداء صفحة الخدمات\nالجزء المميز للخدمات'})
      `)

      await db.execute(
        sql`INSERT INTO "_services_page_v" ("id", "version__status", "latest") VALUES (1, 'published', true)`,
      )
      await db.execute(sql`
        INSERT INTO "_services_page_v_locales" ("_parent_id", "_locale", "version_cta_title")
        VALUES
          (1, 'en', ${'Single line services CTA keeps all sss intact'}),
          (1, 'ar', ${'نسخة خدمات\nجزء ثانٍ للنسخة'})
      `)

      await db.execute(sql`INSERT INTO "projects_page" ("id", "_status") VALUES (1, 'published')`)
      await db.execute(sql`
        INSERT INTO "projects_page_locales" ("_parent_id", "_locale", "cta_title")
        VALUES
          (1, 'en', ${'Projects CTA\nSmart solutions for projects'}),
          (1, 'ar', ${'نداء صفحة المشاريع\nالجزء المميز للمشاريع'})
      `)

      await db.execute(
        sql`INSERT INTO "_projects_page_v" ("id", "version__status", "latest") VALUES (1, 'published', true)`,
      )
      await db.execute(sql`
        INSERT INTO "_projects_page_v_locales" ("_parent_id", "_locale", "version_cta_title")
        VALUES
          (1, 'en', ${'Projects version CTA\nVersion accent with systems'}),
          (1, 'ar', ${'\nLeading newline with empty first line stays untouched'})
      `)

      // 3. Run up() and verify exact title & accent across all 6 tables
      await migrateP3T4R2Up({ db, payload, req: {} } as never)

      const homeRows = await db.execute(sql`
        SELECT "_locale", "hero_title", "hero_title_accent", "cta_title", "cta_title_accent"
        FROM "home_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(homeRows.rows).toEqual([
        {
          _locale: 'ar',
          hero_title: 'نبني المستقبل',
          hero_title_accent: 'بحلول هندسية ذكية',
          cta_title: 'هل أنت مستعد لبناء',
          cta_title_accent: 'مشروعك الهندسي القادم؟',
        },
        {
          _locale: 'en',
          hero_title: 'Building the Future',
          hero_title_accent: 'with Smart Solutions',
          cta_title: 'Ready to Build',
          cta_title_accent: 'Your Next Smart Systems Project?',
        },
      ])

      const homeVersionRows = await db.execute(sql`
        SELECT "_locale", "version_hero_title", "version_hero_title_accent", "version_cta_title", "version_cta_title_accent"
        FROM "_home_page_v_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(homeVersionRows.rows).toEqual([
        {
          _locale: 'ar',
          version_hero_title: 'عنوان بسطر واحد بدون تقسيم تلقائي',
          version_hero_title_accent: null,
          version_cta_title: 'سطر أول للنداء',
          version_cta_title_accent: 'سطر ثانٍ مميز مع سطر ثالث مدمج',
        },
        {
          _locale: 'en',
          version_hero_title: 'Building the Future',
          version_hero_title_accent: 'with Smart Solutions and seamless service',
          version_cta_title: 'Single line CTA with smart solutions and zero newlines',
          version_cta_title_accent: null,
        },
      ])

      const servicesRows = await db.execute(sql`
        SELECT "_locale", "cta_title", "cta_title_accent"
        FROM "services_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(servicesRows.rows).toEqual([
        {
          _locale: 'ar',
          cta_title: 'نداء صفحة الخدمات',
          cta_title_accent: 'الجزء المميز للخدمات',
        },
        {
          _locale: 'en',
          cta_title: 'Services CTA',
          cta_title_accent: 'Accent part with smart systems',
        },
      ])

      const servicesVersionRows = await db.execute(sql`
        SELECT "_locale", "version_cta_title", "version_cta_title_accent"
        FROM "_services_page_v_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(servicesVersionRows.rows).toEqual([
        {
          _locale: 'ar',
          version_cta_title: 'نسخة خدمات',
          version_cta_title_accent: 'جزء ثانٍ للنسخة',
        },
        {
          _locale: 'en',
          version_cta_title: 'Single line services CTA keeps all sss intact',
          version_cta_title_accent: null,
        },
      ])

      const projectsRows = await db.execute(sql`
        SELECT "_locale", "cta_title", "cta_title_accent"
        FROM "projects_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(projectsRows.rows).toEqual([
        {
          _locale: 'ar',
          cta_title: 'نداء صفحة المشاريع',
          cta_title_accent: 'الجزء المميز للمشاريع',
        },
        {
          _locale: 'en',
          cta_title: 'Projects CTA',
          cta_title_accent: 'Smart solutions for projects',
        },
      ])

      const projectsVersionRows = await db.execute(sql`
        SELECT "_locale", "version_cta_title", "version_cta_title_accent"
        FROM "_projects_page_v_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(projectsVersionRows.rows).toEqual([
        {
          _locale: 'ar',
          version_cta_title: '\nLeading newline with empty first line stays untouched',
          version_cta_title_accent: null,
        },
        {
          _locale: 'en',
          version_cta_title: 'Projects version CTA',
          version_cta_title_accent: 'Version accent with systems',
        },
      ])

      // 4. Run down() and verify exact round-trip concatenation across all 6 tables (R-13)
      await migrateP3T4R2Down({ db, payload, req: {} } as never)

      const homeDownRows = await db.execute(sql`
        SELECT "_locale", "hero_title", "cta_title"
        FROM "home_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(homeDownRows.rows).toEqual([
        {
          _locale: 'ar',
          hero_title: 'نبني المستقبل\nبحلول هندسية ذكية',
          cta_title: 'هل أنت مستعد لبناء\nمشروعك الهندسي القادم؟',
        },
        {
          _locale: 'en',
          hero_title: 'Building the Future\nwith Smart Solutions',
          cta_title: 'Ready to Build\nYour Next Smart Systems Project?',
        },
      ])

      const homeVersionDownRows = await db.execute(sql`
        SELECT "_locale", "version_hero_title", "version_cta_title"
        FROM "_home_page_v_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(homeVersionDownRows.rows).toEqual([
        {
          _locale: 'ar',
          version_hero_title: 'عنوان بسطر واحد بدون تقسيم تلقائي',
          version_cta_title: 'سطر أول للنداء\nسطر ثانٍ مميز مع سطر ثالث مدمج',
        },
        {
          _locale: 'en',
          version_hero_title: 'Building the Future\nwith Smart Solutions and seamless service',
          version_cta_title: 'Single line CTA with smart solutions and zero newlines',
        },
      ])

      const servicesDownRows = await db.execute(sql`
        SELECT "_locale", "cta_title"
        FROM "services_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(servicesDownRows.rows).toEqual([
        {
          _locale: 'ar',
          cta_title: 'نداء صفحة الخدمات\nالجزء المميز للخدمات',
        },
        {
          _locale: 'en',
          cta_title: 'Services CTA\nAccent part with smart systems',
        },
      ])

      const servicesVersionDownRows = await db.execute(sql`
        SELECT "_locale", "version_cta_title"
        FROM "_services_page_v_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(servicesVersionDownRows.rows).toEqual([
        {
          _locale: 'ar',
          version_cta_title: 'نسخة خدمات\nجزء ثانٍ للنسخة',
        },
        {
          _locale: 'en',
          version_cta_title: 'Single line services CTA keeps all sss intact',
        },
      ])

      const projectsDownRows = await db.execute(sql`
        SELECT "_locale", "cta_title"
        FROM "projects_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(projectsDownRows.rows).toEqual([
        {
          _locale: 'ar',
          cta_title: 'نداء صفحة المشاريع\nالجزء المميز للمشاريع',
        },
        {
          _locale: 'en',
          cta_title: 'Projects CTA\nSmart solutions for projects',
        },
      ])

      const projectsVersionDownRows = await db.execute(sql`
        SELECT "_locale", "version_cta_title"
        FROM "_projects_page_v_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(projectsVersionDownRows.rows).toEqual([
        {
          _locale: 'ar',
          version_cta_title: '\nLeading newline with empty first line stays untouched',
        },
        {
          _locale: 'en',
          version_cta_title: 'Projects version CTA\nVersion accent with systems',
        },
      ])

      // 5. Run up() a second time to verify full up -> down -> up round-trip
      await migrateP3T4R2Up({ db, payload, req: {} } as never)

      const homeUpAgainRows = await db.execute(sql`
        SELECT "_locale", "hero_title", "hero_title_accent", "cta_title", "cta_title_accent"
        FROM "home_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(homeUpAgainRows.rows).toEqual(homeRows.rows)

      const servicesUpAgainRows = await db.execute(sql`
        SELECT "_locale", "cta_title", "cta_title_accent"
        FROM "services_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(servicesUpAgainRows.rows).toEqual(servicesRows.rows)

      const projectsUpAgainRows = await db.execute(sql`
        SELECT "_locale", "cta_title", "cta_title_accent"
        FROM "projects_page_locales"
        WHERE "_parent_id" = 1
        ORDER BY "_locale" ASC
      `)
      expect(projectsUpAgainRows.rows).toEqual(projectsRows.rows)
    } finally {
      // Ensure schema is always left at latest (up) state for subsequent test suites
      const hasHeroAccentAtEnd = await hasColumn(db, 'home_page_locales', 'hero_title_accent')
      if (!hasHeroAccentAtEnd) {
        await migrateP3T4R2Up({ db, payload, req: {} } as never)
      }
    }
  })
})
