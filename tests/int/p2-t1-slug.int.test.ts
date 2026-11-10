import { postgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres/drizzle'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import {
  buildConfig,
  type CollectionConfig,
  getPayload,
  type Payload,
  ValidationError,
} from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { publishableVersions } from '../../src/collections/_shared/publishable'
import { Media } from '../../src/collections/Media'
import { Users } from '../../src/collections/Users'
import { env } from '../../src/env'
import { slugFields } from '../../src/fields/slug'
import { buildNonBlockingEmailAdapter } from '../../src/security/emailAdapter'
import { assertTestDatabaseIsolation } from './_helpers/testDbIsolation'

const SLUG_TEST_COLLECTION = 'slug_test_items'

const SlugTestItems: CollectionConfig = {
  slug: SLUG_TEST_COLLECTION,
  lockDocuments: false,
  timestamps: true,
  versions: publishableVersions,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    ...slugFields({ from: 'title' }),
  ],
}

type SlugTestDoc = {
  _status?: 'draft' | 'published'
  id: number | string
  slug: string
  slugLocked?: boolean
  title?: string
}

let payload: Payload

describe(
  'P2-T1 real per-locale slug & slugLocked integration tests (R-2, R-6, R-7, R-9)',
  { shuffle: false },
  () => {
    beforeAll(async () => {
      assertTestDatabaseIsolation()
      const testConfig = await buildConfig({
        serverURL: env.SERVER_URL,
        secret: env.PAYLOAD_SECRET,
        i18n: {
          supportedLanguages: { ar, en },
          fallbackLanguage: 'ar',
        },
        localization: {
          locales: [
            { code: 'ar', label: 'Arabic', rtl: true },
            { code: 'en', label: 'English', rtl: false },
          ],
          defaultLocale: 'ar',
          fallback: true,
        },
        collections: [Users, Media, SlugTestItems],
        editor: lexicalEditor(),
        db: postgresAdapter({
          push: false,
          pool: {
            connectionString: env.DATABASE_URL,
          },
        }),
        email: buildNonBlockingEmailAdapter(),
        sharp,
      })

      payload = await getPayload({
        config: testConfig,
        key: 'p2-t1-slug-int',
      })

      await payload.db.drizzle.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."_locales" AS ENUM('ar', 'en');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      CREATE TABLE IF NOT EXISTS "slug_test_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "slug" varchar,
        "slug_locked" boolean DEFAULT false,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "_status" varchar DEFAULT 'draft'
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "slug_test_items_slug_idx" ON "slug_test_items" ("slug");
      CREATE TABLE IF NOT EXISTS "slug_test_items_locales" (
        "title" varchar,
        "id" serial PRIMARY KEY NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" integer NOT NULL REFERENCES "slug_test_items"("id") ON DELETE cascade,
        CONSTRAINT "slug_test_items_locales_locale_parent_id_unique" UNIQUE("_locale", "_parent_id")
      );
      CREATE TABLE IF NOT EXISTS "_slug_test_items_v" (
        "id" serial PRIMARY KEY NOT NULL,
        "parent_id" integer REFERENCES "slug_test_items"("id") ON DELETE set null,
        "version_slug" varchar,
        "version_slug_locked" boolean DEFAULT false,
        "version_updated_at" timestamp(3) with time zone,
        "version_created_at" timestamp(3) with time zone,
        "version__status" varchar DEFAULT 'draft',
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "snapshot" boolean,
        "published_locale" varchar,
        "latest" boolean,
        "autosave" boolean
      );
      CREATE TABLE IF NOT EXISTS "_slug_test_items_v_locales" (
        "version_title" varchar,
        "id" serial PRIMARY KEY NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" integer NOT NULL REFERENCES "_slug_test_items_v"("id") ON DELETE cascade,
        CONSTRAINT "_slug_test_items_v_locales_locale_parent_id_unique" UNIQUE("_locale", "_parent_id")
      );
    `)
    })

    beforeEach(async () => {
      await payload.db.drizzle.execute(sql`
      TRUNCATE TABLE "_slug_test_items_v_locales", "_slug_test_items_v", "slug_test_items_locales", "slug_test_items" RESTART IDENTITY CASCADE;
    `)
    })

    afterAll(async () => {
      await payload.db.drizzle.execute(sql`
      DROP TABLE IF EXISTS "_slug_test_items_v_locales" CASCADE;
      DROP TABLE IF EXISTS "_slug_test_items_v" CASCADE;
      DROP TABLE IF EXISTS "slug_test_items_locales" CASCADE;
      DROP TABLE IF EXISTS "slug_test_items" CASCADE;
    `)
      if (typeof payload.db.destroy === 'function') {
        await payload.db.destroy()
      }
    })

    it('real per-locale flow: create in ar -> transliterated; add en title -> English slug; publish; change English title -> slug unchanged (R-2)', async () => {
      // 1. Create in 'ar' (default locale) as draft -> transliterated Arabic slug, slugLocked = false
      const createdInAr = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'ar',
        data: {
          title: 'فندق سوفيتيل مكة المكرمة',
        } as never,
      })) as unknown as SlugTestDoc

      expect(createdInAr.slug).toBe('fndq-swfytyl-mka-almkrma')
      expect(createdInAr.slugLocked).toBe(false)
      expect(createdInAr._status).toBe('draft')

      // 2. Add 'en' title while still draft -> slug regenerates from English title, slugLocked remains false
      const updatedWithEn = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: createdInAr.id,
        locale: 'en',
        data: {
          title: 'Sofitel Makkah Hotel',
        } as never,
      })) as unknown as SlugTestDoc

      expect(updatedWithEn.slug).toBe('sofitel-makkah-hotel')
      expect(updatedWithEn.slugLocked).toBe(false)
      expect(updatedWithEn._status).toBe('draft')

      // 2b. Edit Arabic title in 'ar' while still draft -> reads English title via findByID({ locale: 'en' }) and keeps English slug
      const updatedArDraft = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: createdInAr.id,
        locale: 'ar',
        data: {
          title: 'فندق سوفيتيل مكة المكرمة المطور',
        } as never,
      })) as unknown as SlugTestDoc

      expect(updatedArDraft.slug).toBe('sofitel-makkah-hotel')
      expect(updatedArDraft.slugLocked).toBe(false)

      // 3. Publish the document -> slugLocked becomes true
      const published = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: createdInAr.id,
        locale: 'ar',
        data: {
          _status: 'published',
        } as never,
      })) as unknown as SlugTestDoc

      expect(published.slug).toBe('sofitel-makkah-hotel')
      expect(published.slugLocked).toBe(true)
      expect(published._status).toBe('published')

      // 4. Change English title after publish -> slug remains unchanged because slugLocked is true
      const renamedAfterPublish = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: createdInAr.id,
        locale: 'en',
        data: {
          title: 'Renamed Sofitel Grand Makkah Tower',
        } as never,
      })) as unknown as SlugTestDoc

      expect(renamedAfterPublish.title).toBe('Renamed Sofitel Grand Makkah Tower')
      expect(renamedAfterPublish.slug).toBe('sofitel-makkah-hotel')
      expect(renamedAfterPublish.slugLocked).toBe(true)
    })

    it('normalizes manual slug on create/update, locks slugLocked, and returns a friendly validation error on manual slug collision (R-6, R-7)', async () => {
      const first = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'ar',
        data: {
          title: 'مشروع جامعة الأميرة نورة',
          slug: 'My Custom PNU Slug!',
        } as never,
      })) as unknown as SlugTestDoc

      expect(first.slug).toBe('my-custom-pnu-slug')
      expect(first.slugLocked).toBe(true)

      // Adding an English title afterwards must NOT overwrite the manually locked slug
      const afterEnTitle = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: first.id,
        locale: 'en',
        data: {
          title: 'Princess Noura University (PNU)',
        } as never,
      })) as unknown as SlugTestDoc

      expect(afterEnTitle.slug).toBe('my-custom-pnu-slug')
      expect(afterEnTitle.slugLocked).toBe(true)

      // Creating another document with the same manual slug fails with a Payload ValidationError (not a DB unique-constraint crash)
      let caughtError: unknown
      try {
        await payload.create({
          collection: SLUG_TEST_COLLECTION as 'users',
          locale: 'en',
          data: {
            title: 'Another Project',
            slug: 'My Custom PNU Slug!',
          } as never,
        })
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeInstanceOf(ValidationError)
      const validationErr = caughtError as ValidationError
      expect(validationErr.data.errors[0]?.message).toContain('This slug is already in use')

      // R-13: Duplicate manual slug on explicit draft: true create ALSO fails with friendly ValidationError
      let draftCreateError: unknown
      try {
        await payload.create({
          collection: SLUG_TEST_COLLECTION as 'users',
          locale: 'ar',
          draft: true,
          data: {
            title: 'مشروع مسودة مكرر',
            slug: 'my-custom-pnu-slug',
          } as never,
        })
      } catch (err) {
        draftCreateError = err
      }

      expect(draftCreateError).toBeInstanceOf(ValidationError)
      expect((draftCreateError as ValidationError).data.errors[0]?.message).toContain(
        'This slug is already in use',
      )

      // R-13: Duplicate manual slug on draft: true, autosave: true update ALSO fails with friendly ValidationError
      const otherDoc = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'ar',
        draft: true,
        data: {
          title: 'مشروع منفصل للمسودة',
        } as never,
      })) as unknown as SlugTestDoc

      let draftUpdateError: unknown
      try {
        await payload.update({
          collection: SLUG_TEST_COLLECTION as 'users',
          id: otherDoc.id,
          locale: 'ar',
          draft: true,
          autosave: true,
          data: {
            title: 'مشروع منفصل للمسودة',
            slug: 'my-custom-pnu-slug',
          } as never,
        })
      } catch (err) {
        draftUpdateError = err
      }

      expect(draftUpdateError).toBeInstanceOf(ValidationError)
      expect((draftUpdateError as ValidationError).data.errors[0]?.message).toContain(
        'This slug is already in use',
      )
    })

    it('stale-payload sequences: resending stale auto-slugs in ar or en saves does not revert or lock the slug (R-14, R-17)', async () => {
      // --- Sequence 0 (R-14): resending stale ar auto-slug on ar update ---
      const doc = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'ar',
        data: {
          title: 'فندق سوفيتيل مكة المكرمة',
        } as never,
      })) as unknown as SlugTestDoc

      expect(doc.slug).toBe('fndq-swfytyl-mka-almkrma')
      expect(doc.slugLocked).toBe(false)

      const withEn = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: doc.id,
        locale: 'en',
        data: {
          title: 'Sofitel Makkah Hotel',
        } as never,
      })) as unknown as SlugTestDoc

      expect(withEn.slug).toBe('sofitel-makkah-hotel')
      expect(withEn.slugLocked).toBe(false)

      const afterStaleArUpdate = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: doc.id,
        locale: 'ar',
        data: {
          title: 'فندق سوفيتيل مكة المكرمة المطور',
          slug: 'fndq-swfytyl-mka-almkrma',
        } as never,
      })) as unknown as SlugTestDoc

      expect(afterStaleArUpdate.slug).toBe('sofitel-makkah-hotel')
      expect(afterStaleArUpdate.slugLocked).toBe(false)

      // --- Sequence 1 (R-17): create in ar ("مبنى المختبر" -> 'mbna-almkhtbr'); first en save resends slug: 'mbna-almkhtbr' with en title "Lab Building" ---
      const lab1 = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'ar',
        data: {
          title: 'مبنى المختبر',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab1.slug).toBe('mbna-almkhtbr')
      expect(lab1.slugLocked).toBe(false)

      const lab1EnWithStaleArSlug = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: lab1.id,
        locale: 'en',
        data: {
          title: 'Lab Building',
          slug: 'mbna-almkhtbr',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab1EnWithStaleArSlug.slug).toBe('lab-building')
      expect(lab1EnWithStaleArSlug.slugLocked).toBe(false)

      // --- Sequence 2 (R-17): create in ar ("مبنى المختبر" -> 'mbna-almkhtbr'); en "Lab Building" -> 'lab-building'; resend slug: 'mbna-almkhtbr' in a subsequent en save ---
      const lab2 = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'ar',
        data: {
          title: 'مبنى المختبر الرئيسي',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab2.slug).toBe('mbna-almkhtbr-alryysy')
      expect(lab2.slugLocked).toBe(false)

      const lab2En = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: lab2.id,
        locale: 'en',
        data: {
          title: 'Main Lab Building',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab2En.slug).toBe('main-lab-building')
      expect(lab2En.slugLocked).toBe(false)

      const lab2EnResendStaleArSlug = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: lab2.id,
        locale: 'en',
        data: {
          title: 'Main Lab Building',
          slug: 'mbna-almkhtbr-alryysy',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab2EnResendStaleArSlug.slug).toBe('main-lab-building')
      expect(lab2EnResendStaleArSlug.slugLocked).toBe(false)

      // --- Sequence 3 (R-17): renaming an English title and resending the old English slug (both during rename and on a subsequent en save) ---
      const lab2RenamedWithOldEnSlug = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: lab2.id,
        locale: 'en',
        data: {
          title: 'Advanced Research Complex',
          slug: 'main-lab-building',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab2RenamedWithOldEnSlug.slug).toBe('advanced-research-complex')
      expect(lab2RenamedWithOldEnSlug.slugLocked).toBe(false)

      const lab2AfterRenameResendOldEnSlug = (await payload.update({
        collection: SLUG_TEST_COLLECTION as 'users',
        id: lab2.id,
        locale: 'en',
        data: {
          title: 'Advanced Research Complex',
          slug: 'main-lab-building',
        } as never,
      })) as unknown as SlugTestDoc
      expect(lab2AfterRenameResendOldEnSlug.slug).toBe('advanced-research-complex')
      expect(lab2AfterRenameResendOldEnSlug.slugLocked).toBe(false)
    })

    it('resolves unique suffixes without collision when an 80-char title is used 3 times (R-15)', async () => {
      const eightyCharTitle =
        'Al Jazira For Imdad Smart Company Integrated Electro Mechanical Building System'

      const doc1 = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'en',
        data: {
          title: eightyCharTitle,
        } as never,
      })) as unknown as SlugTestDoc

      const doc2 = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'en',
        data: {
          title: eightyCharTitle,
        } as never,
      })) as unknown as SlugTestDoc

      const doc3 = (await payload.create({
        collection: SLUG_TEST_COLLECTION as 'users',
        locale: 'en',
        data: {
          title: eightyCharTitle,
        } as never,
      })) as unknown as SlugTestDoc

      expect(doc1.slug).toBe(
        'al-jazira-for-imdad-smart-company-integrated-electro-mechanical-building-system',
      )
      expect(doc2.slug).toBe(
        'al-jazira-for-imdad-smart-company-integrated-electro-mechanical-building-2',
      )
      expect(doc3.slug).toBe(
        'al-jazira-for-imdad-smart-company-integrated-electro-mechanical-building-3',
      )
      expect(doc1.slug.length).toBeLessThanOrEqual(80)
      expect(doc2.slug.length).toBeLessThanOrEqual(80)
      expect(doc3.slug.length).toBeLessThanOrEqual(80)
    })
  },
)
