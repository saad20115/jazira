import type { FieldHookArgs, TextFieldSingleValidation, TypeWithID } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  buildSlugBeforeValidateHook,
  resolveUniqueSlug,
  SLUG_REGEX,
  slugField,
  slugify,
  transliterateArabic,
  validateSlug,
} from './slug'

type SlugHookArgs = FieldHookArgs<TypeWithID, unknown, Record<string, unknown>>

const makeHookArgs = (overrides: Partial<SlugHookArgs>): SlugHookArgs =>
  ({
    blockData: undefined,
    collection: { slug: 'projects' },
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

const makeValidateOpts = (): SlugValidateOptions => ({ req: {} }) as unknown as SlugValidateOptions

describe('slugField & slugify', () => {
  it('configures unique, indexed, required sidebar text field', () => {
    const field = slugField({ from: 'title' })
    expect(field.name).toBe('slug')
    expect(field.type).toBe('text')
    expect(field.unique).toBe(true)
    expect(field.index).toBe(true)
    expect(field.required).toBe(true)
    expect(field.admin?.position).toBe('sidebar')
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

  describe('beforeValidate hook behaviour', () => {
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
      const result = await hook(
        makeHookArgs({
          siblingData: {
            title: {
              ar: 'فندق سوفيتيل مكة',
              en: '   ',
            },
          },
        }),
      )

      expect(result).toBe('fndq-swfytyl-mka')
    })

    it('preserves manual editable slug when provided by the editor', async () => {
      const result = await hook(
        makeHookArgs({
          siblingData: {
            title: 'Sofitel Makkah Hotel',
          },
          value: 'custom-sofitel-slug',
        }),
      )

      expect(result).toBe('custom-sofitel-slug')
    })

    it('appends numeric suffix (-2, -3) when auto-generated slug already exists in collection', async () => {
      const findMock = vi.fn().mockResolvedValue({
        docs: [{ slug: 'sofitel-makkah-hotel' }, { slug: 'sofitel-makkah-hotel-2' }],
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
      expect(result).toBe('sofitel-makkah-hotel-3')
    })

    it('resolveUniqueSlug returns baseSlug when free and increments when taken', () => {
      expect(resolveUniqueSlug('mep-works', [])).toBe('mep-works')
      expect(resolveUniqueSlug('mep-works', ['mep-works'])).toBe('mep-works-2')
      expect(resolveUniqueSlug('mep-works', ['mep-works', 'mep-works-2'])).toBe('mep-works-3')
    })
  })

  describe('validateSlug pattern validation', () => {
    it('accepts valid slugs matching ^[a-z0-9]+(?:-[a-z0-9]+)*$', () => {
      expect(validateSlug('general-contracting', makeValidateOpts())).toBe(true)
      expect(validateSlug('mep', makeValidateOpts())).toBe(true)
      expect(validateSlug('building-3-phase-2', makeValidateOpts())).toBe(true)
    })

    it('rejects empty, uppercase, underscore, leading/trailing/double dashes, and non-ASCII slugs', () => {
      const invalidSlugs = [
        '',
        '   ',
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
  })
})
