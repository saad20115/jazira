import {
  type FieldHookArgs,
  type TextFieldSingleValidation,
  type TypeWithID,
  ValidationError,
} from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  buildSlugBeforeValidateHook,
  MAX_SLUG_LENGTH,
  resolveUniqueSlug,
  SLUG_REGEX,
  slugField,
  slugFields,
  slugify,
  slugLockedField,
  transliterateArabic,
  truncateSlugAtWordBoundary,
  validateSlug,
} from './slug'

type SlugHookArgs = FieldHookArgs<
  TypeWithID & Record<string, unknown>,
  unknown,
  Record<string, unknown>
>

const makeHookArgs = (overrides: Partial<SlugHookArgs>): SlugHookArgs =>
  ({
    blockData: undefined,
    collection: { slug: 'projects', versions: { drafts: true } },
    context: {},
    data: {},
    field: { name: 'slug', type: 'text' },
    global: null,
    indexPath: [],
    operation: 'create',
    path: ['slug'],
    req: { locale: 'ar', payload: {} },
    schemaPath: ['slug'],
    siblingData: {},
    siblingFields: [],
    value: undefined,
    ...overrides,
  }) as unknown as SlugHookArgs

type SlugValidateOptions = Parameters<TextFieldSingleValidation>[1]

const makeValidateOpts = (overrides?: Record<string, unknown>): SlugValidateOptions =>
  ({ req: {}, ...overrides }) as unknown as SlugValidateOptions

describe('slugField & slugify', () => {
  it('configures unique, indexed, required sidebar text field and companion hidden slugLockedField', () => {
    const field = slugField({ from: 'title' })
    expect(field.name).toBe('slug')
    expect(field.type).toBe('text')
    expect(field.unique).toBe(true)
    expect(field.index).toBe(true)
    expect(field.required).toBe(true)
    expect(field.admin?.position).toBe('sidebar')

    const lockField = slugLockedField()
    expect(lockField.name).toBe('slugLocked')
    expect(lockField.type).toBe('checkbox')
    expect(lockField.defaultValue).toBe(false)
    expect(lockField.admin?.hidden).toBe(true)

    const [tupleSlug, tupleLock] = slugFields({ from: 'title' })
    expect(tupleSlug.name).toBe('slug')
    expect(tupleLock.name).toBe('slugLocked')
  })

  it('deep-merges admin and concatenates hooks when overrides are passed (R-1)', () => {
    const extraBeforeValidate = vi.fn(({ value }: { value?: unknown }) => value)
    const extraAfterRead = vi.fn(({ value }: { value?: unknown }) => value)

    const field = slugField({
      from: 'title',
      overrides: {
        admin: {
          readOnly: false,
        },
        hooks: {
          beforeValidate: [extraBeforeValidate],
          afterRead: [extraAfterRead],
        },
      },
    })

    expect(field.admin?.position).toBe('sidebar')
    expect(field.admin?.description).toBeDefined()
    expect(field.admin?.readOnly).toBe(false)
    expect(field.hooks?.beforeValidate).toHaveLength(2)
    expect(field.hooks?.beforeValidate?.[1]).toBe(extraBeforeValidate)
    expect(field.hooks?.afterRead).toEqual([extraAfterRead])
  })

  describe('10 real English titles from design/copy/ (02-services.md & 04-projects.md)', () => {
    const realCopyTitles: ReadonlyArray<readonly [string, string]> = [
      ['General Contracting', 'general-contracting'],
      ['MEP Works', 'mep-works'],
      ['Firefighting Systems', 'firefighting-systems'],
      ['Smart Systems', 'smart-systems'],
      ['HVAC, Ventilation & Refrigeration', 'hvac-ventilation-refrigeration'],
      ['Testing, Commissioning & TAB', 'testing-commissioning-tab'],
      ['Princess Noura University (PNU)', 'princess-noura-university-pnu'],
      ['Sofitel Makkah Hotel', 'sofitel-makkah-hotel'],
      ['Al Maqam Towers (A, B, C, D)', 'al-maqam-towers-a-b-c-d'],
      ['Medical Science College — Taif University', 'medical-science-college-taif-university'],
    ]

    it.each(realCopyTitles)('slugifies "%s" -> "%s"', (title, expected) => {
      const result = slugify(title)
      expect(result).toBe(expected)
      expect(SLUG_REGEX.test(result)).toBe(true)
    })
  })

  describe('Arabic -> Latin transliteration fallback', () => {
    it('transliterates Arabic project and service titles with diacritics and Eastern Arabic digits', () => {
      const arabicCases: ReadonlyArray<readonly [string, string]> = [
        ['شركة الجزيرة لإمداد الذكية', 'shrka-aljzyra-limdad-aldhkya'],
        ['أنظمة مكافحة الحريق والإنذار المبكر', 'anzma-mkafha-alhryq-walindhar-almbkr'],
        ['فندق سوفيتيل مكة المكرمة', 'fndq-swfytyl-mka-almkrma'],
        ['مشروع أبراج المقام بمكة ١٤٤٧', 'mshrwa-abraj-almqam-bmka-1447'],
        ['الأعمال الكهروميكانيكية والتكييف المركزي', 'alaamal-alkhrwmykanykya-waltkyyf-almrkzy'],
      ]

      for (const [arabicTitle, expectedSlug] of arabicCases) {
        const transliterated = transliterateArabic(arabicTitle)
        expect(transliterated.length).toBeGreaterThan(0)
        const generated = slugify(arabicTitle)
        expect(generated).toBe(expectedSlug)
        expect(SLUG_REGEX.test(generated)).toBe(true)
      }
    })
  })

  describe('Length cap at 80 chars & word-boundary truncation (R-8)', () => {
    it('caps long titles at 80 characters and cuts cleanly at a hyphen word boundary', () => {
      const longTitle =
        'Comprehensive Electromechanical Engineering Testing Commissioning and Building Management Systems Integration Project in Makkah Region'
      const result = slugify(longTitle)
      expect(result.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH)
      expect(SLUG_REGEX.test(result)).toBe(true)
      expect(result).toBe(
        'comprehensive-electromechanical-engineering-testing-commissioning-and-building',
      )
      expect(result.endsWith('-')).toBe(false)
    })

    it('truncates single uninterrupted 100-char token at 80 characters', () => {
      const singleToken = 'a'.repeat(100)
      const result = truncateSlugAtWordBoundary(singleToken)
      expect(result).toHaveLength(MAX_SLUG_LENGTH)
    })
  })

  describe('beforeValidate hook behaviour (R-2, R-6, R-9)', () => {
    const hook = buildSlugBeforeValidateHook('title', 'slug')

    it('prefers English title when both English and Arabic exist', async () => {
      const result = await hook(
        makeHookArgs({
          siblingData: {
            title: {
              ar: 'فندق سوفيتيل مكة المكرمة',
              en: 'Sofitel Makkah Hotel',
            },
          },
        }),
      )

      expect(result).toBe('sofitel-makkah-hotel')
    })

    it('falls back to transliterated Arabic when English title is absent', async () => {
      const siblingData: Record<string, unknown> = {
        title: 'فندق سوفيتيل مكة',
      }
      const result = await hook(
        makeHookArgs({
          req: { locale: 'ar', payload: {} } as unknown as SlugHookArgs['req'],
          siblingData,
        }),
      )

      expect(result).toBe('fndq-swfytyl-mka')
      expect(siblingData.slugLocked).toBe(false)
    })

    it('regenerates slug from English title when saving in en while slugLocked is false, and reads en via findByID when saving in ar (R-2)', async () => {
      // Step 1: Update in 'en' while slugLocked is false -> regenerates from incoming English title
      const enSiblingData: Record<string, unknown> = {
        title: 'Sofitel Makkah Hotel',
      }
      const afterEnSave = await hook(
        makeHookArgs({
          operation: 'update',
          originalDoc: {
            id: 42,
            slug: 'fndq-swfytyl-mka',
            slugLocked: false,
            _status: 'draft',
          },
          previousValue: 'fndq-swfytyl-mka',
          req: { locale: 'en', payload: {} } as unknown as SlugHookArgs['req'],
          siblingData: enSiblingData,
          value: 'fndq-swfytyl-mka',
        }),
      )
      expect(afterEnSave).toBe('sofitel-makkah-hotel')
      expect(enSiblingData.slugLocked).toBe(false)

      // Step 2: Subsequent draft save in 'ar' while slugLocked is false -> reads English title via findByID({ locale: 'en' })
      const findByIDMock = vi.fn().mockResolvedValue({
        id: 42,
        title: 'Sofitel Makkah Hotel',
      })
      const arSiblingData: Record<string, unknown> = {
        title: 'فندق سوفيتيل مكة المكرمة',
      }
      const afterArSave = await hook(
        makeHookArgs({
          operation: 'update',
          originalDoc: {
            id: 42,
            slug: 'sofitel-makkah-hotel',
            slugLocked: false,
            _status: 'draft',
          },
          previousValue: 'sofitel-makkah-hotel',
          req: {
            locale: 'ar',
            payload: { findByID: findByIDMock },
          } as unknown as SlugHookArgs['req'],
          siblingData: arSiblingData,
          value: 'sofitel-makkah-hotel',
        }),
      )
      expect(findByIDMock).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'projects',
          id: 42,
          locale: 'en',
          fallbackLocale: false,
        }),
      )
      expect(afterArSave).toBe('sofitel-makkah-hotel')
      expect(arSiblingData.slugLocked).toBe(false)

      // Step 3: Publish -> locks slugLocked = true
      const publishSiblingData: Record<string, unknown> = {
        _status: 'published',
      }
      const afterPublish = await hook(
        makeHookArgs({
          operation: 'update',
          originalDoc: {
            id: 42,
            slug: 'sofitel-makkah-hotel',
            slugLocked: false,
            _status: 'draft',
          },
          previousValue: 'sofitel-makkah-hotel',
          req: {
            locale: 'ar',
            payload: { findByID: findByIDMock },
          } as unknown as SlugHookArgs['req'],
          siblingData: publishSiblingData,
          value: 'sofitel-makkah-hotel',
        }),
      )
      expect(afterPublish).toBe('sofitel-makkah-hotel')
      expect(publishSiblingData.slugLocked).toBe(true)

      // Step 4: Change English title after publish -> slug remains unchanged because slugLocked is true
      const postPublishSiblingData: Record<string, unknown> = {
        title: 'Renamed Sofitel Grand Hotel',
      }
      const afterPostPublishTitleEdit = await hook(
        makeHookArgs({
          operation: 'update',
          originalDoc: {
            id: 42,
            slug: 'sofitel-makkah-hotel',
            slugLocked: true,
            _status: 'published',
          },
          previousValue: 'sofitel-makkah-hotel',
          req: { locale: 'en', payload: {} } as unknown as SlugHookArgs['req'],
          siblingData: postPublishSiblingData,
          value: 'sofitel-makkah-hotel',
        }),
      )
      expect(afterPostPublishTitleEdit).toBe('sofitel-makkah-hotel')
      expect(postPublishSiblingData.slugLocked).toBe(true)
    })

    it('normalizes manual slug via slugify and locks slugLocked immediately (R-6 & R-2)', async () => {
      const siblingData: Record<string, unknown> = {
        title: 'Sofitel Makkah Hotel',
        slug: 'My Custom Slug!',
      }
      const result = await hook(
        makeHookArgs({
          siblingData,
          value: 'My Custom Slug!',
        }),
      )

      expect(result).toBe('my-custom-slug')
      expect(siblingData.slugLocked).toBe(true)
    })

    it('queries base and base-<n> without pagination limit and takes maxSuffix + 1 (R-9)', async () => {
      const findMock = vi.fn().mockResolvedValue({
        docs: [
          { slug: 'sofitel-makkah-hotel' },
          { slug: 'sofitel-makkah-hotel-2' },
          { slug: 'sofitel-makkah-hotel-5' },
          // Unrelated contains-matches that must be ignored:
          { slug: 'grand-sofitel-makkah-hotel-99' },
          { slug: 'sofitel-makkah-hotel-annex-10' },
        ],
      })

      const result = await hook(
        makeHookArgs({
          req: {
            locale: 'en',
            payload: { find: findMock },
          } as unknown as SlugHookArgs['req'],
          siblingData: {
            title: 'Sofitel Makkah Hotel',
          },
        }),
      )

      expect(findMock).toHaveBeenCalledTimes(1)
      expect(findMock).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'projects',
          pagination: false,
        }),
      )
      expect(result).toBe('sofitel-makkah-hotel-6')
    })

    it('resolveUniqueSlug returns baseSlug when free and maxSuffix + 1 when taken (R-9)', () => {
      expect(resolveUniqueSlug('mep-works', [])).toBe('mep-works')
      expect(resolveUniqueSlug('mep-works', ['mep-works'])).toBe('mep-works-2')
      expect(resolveUniqueSlug('mep-works', ['mep-works', 'mep-works-2'])).toBe('mep-works-3')
      expect(resolveUniqueSlug('mep-works', ['mep-works', 'mep-works-2', 'mep-works-7'])).toBe(
        'mep-works-8',
      )
    })

    it('resolves unique suffixes near the 80-char cap by querying shortened candidate bases (R-15)', async () => {
      // 80-char slug: 12 words -> exactly 79 or 80 chars
      const longTitle =
        'al-jazira-for-imdad-smart-company-integrated-electro-mechanical-building-system'
      expect(longTitle.length).toBe(79)
      const shortenedBase =
        'al-jazira-for-imdad-smart-company-integrated-electro-mechanical-building'

      const findMock = vi.fn().mockResolvedValue({
        docs: [{ slug: longTitle }, { slug: `${shortenedBase}-2` }],
      })

      const result = await hook(
        makeHookArgs({
          req: {
            locale: 'en',
            payload: { find: findMock },
          } as unknown as SlugHookArgs['req'],
          siblingData: {
            title: longTitle,
          },
        }),
      )

      expect(result).toBe(`${shortenedBase}-3`)
      expect(typeof result === 'string' && result.length <= MAX_SLUG_LENGTH).toBe(true)
    })

    it('does not revert or lock slug when an ar update resends a stale ar-transliterated slug (R-14)', async () => {
      const findByIDMock = vi.fn().mockResolvedValue({
        id: 42,
        title: 'Sofitel Makkah Hotel',
      })

      const staleArSiblingData: Record<string, unknown> = {
        title: 'فندق سوفيتيل مكة المكرمة المطور',
        slug: 'fndq-swfytyl-mka-almkrma',
      }

      const result = await hook(
        makeHookArgs({
          operation: 'update',
          originalDoc: {
            id: 42,
            title: 'فندق سوفيتيل مكة المكرمة',
            slug: 'sofitel-makkah-hotel',
            slugLocked: false,
            _status: 'draft',
          },
          previousValue: 'sofitel-makkah-hotel',
          req: {
            locale: 'ar',
            payload: { findByID: findByIDMock },
          } as unknown as SlugHookArgs['req'],
          siblingData: staleArSiblingData,
          value: 'fndq-swfytyl-mka-almkrma',
        }),
      )

      expect(result).toBe('sofitel-makkah-hotel')
      expect(staleArSiblingData.slugLocked).toBe(false)
    })

    it('throws ValidationError in beforeValidate when a manual slug collides during draft/autosave save (R-13)', async () => {
      const findCollisionMock = vi.fn().mockResolvedValue({
        docs: [{ id: 99, slug: 'sofitel-makkah-hotel' }],
      })

      let caughtError: unknown
      try {
        await hook(
          makeHookArgs({
            operation: 'create',
            req: {
              locale: 'ar',
              payload: { find: findCollisionMock },
            } as unknown as SlugHookArgs['req'],
            siblingData: {
              title: 'مشروع آخر',
              slug: 'Sofitel Makkah Hotel',
              _status: 'draft',
            },
            value: 'Sofitel Makkah Hotel',
          }),
        )
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeInstanceOf(ValidationError)
      expect((caughtError as ValidationError).data.errors[0]?.message).toContain(
        'This slug is already in use',
      )
    })
  })

  describe('validateSlug pattern, length, and uniqueness validation (R-7, R-8)', () => {
    it('accepts valid slugs matching ^[a-z0-9]+(?:-[a-z0-9]+)*$', () => {
      expect(validateSlug('general-contracting', makeValidateOpts())).toBe(true)
      expect(validateSlug('mep', makeValidateOpts())).toBe(true)
      expect(validateSlug('building-3-phase-2', makeValidateOpts())).toBe(true)
    })

    it('rejects empty, >80 chars, uppercase, underscore, leading/trailing/double dashes, and non-ASCII slugs', () => {
      const invalidSlugs = [
        '',
        '   ',
        'a'.repeat(MAX_SLUG_LENGTH + 1),
        'General-Contracting',
        'mep_works',
        '-leading-dash',
        'trailing-dash-',
        'double--dash',
        'has space',
        'arabic-عربي',
        'special/char',
      ]

      for (const bad of invalidSlugs) {
        const res = validateSlug(bad, makeValidateOpts())
        expect(typeof res).toBe('string')
      }
    })

    it('returns a friendly localized validation message when a manual slug collides with an existing document (R-7)', async () => {
      const findCollisionMock = vi.fn().mockResolvedValue({
        docs: [{ id: 99, slug: 'sofitel-makkah-hotel' }],
      })

      const collisionResult = await validateSlug(
        'sofitel-makkah-hotel',
        makeValidateOpts({
          collectionSlug: 'projects',
          id: 42,
          name: 'slug',
          req: {
            payload: {
              find: findCollisionMock,
            },
          },
        }),
      )

      expect(typeof collisionResult).toBe('string')
      expect(collisionResult).toContain('This slug is already in use')

      const findFreeMock = vi.fn().mockResolvedValue({
        docs: [],
      })

      const freeResult = await validateSlug(
        'unique-sofitel-slug',
        makeValidateOpts({
          collectionSlug: 'projects',
          id: 42,
          name: 'slug',
          req: {
            payload: {
              find: findFreeMock,
            },
          },
        }),
      )

      expect(freeResult).toBe(true)
    })
  })
})
