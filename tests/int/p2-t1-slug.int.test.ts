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

describe('P2-T1 real per-locale slug & slugLocked integration tests (R-2, R-6, R-7, R-9)', () => {
  beforeAll(async () => {
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
  })
})
