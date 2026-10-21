import type { FieldHook, TextField, TextFieldSingleValidation, TypeWithID, Where } from 'payload'

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type SingleTextField = Extract<TextField, { hasMany?: false | undefined }>
export type SlugFieldHook = FieldHook<TypeWithID, unknown, Record<string, unknown>>

/**
 * Deterministic Arabic-to-Latin transliteration table (no network calls).
 * Covers standard Arabic letters, hamza variants, taa marbuta, alif maqsura,
 * Gulf/Persian loanword letters, and Eastern Arabic-Indic numerals.
 */
const ARABIC_TO_LATIN_MAP: Readonly<Record<string, string | undefined>> = {
  // Hamza & Alif variants
  ء: '',
  آ: 'a',
  أ: 'a',
  إ: 'i',
  ئ: 'y',
  ؤ: 'w',
  ا: 'a',
  ٱ: 'a',
  // Standard Arabic consonants & vowels
  ب: 'b',
  ت: 't',
  ة: 'a',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ى: 'a',
  ي: 'y',
  // Gulf / Persian / Urdu loan letters
  پ: 'p',
  چ: 'ch',
  ژ: 'zh',
  گ: 'g',
  ڤ: 'v',
  ک: 'k',
  ی: 'y',
  // Eastern Arabic-Indic digits (٠-٩)
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  // Extended Arabic-Indic digits (۰-۹)
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
}

// Tashkeel (harakat) and tatweel (kashida) stripped before transliteration
const ARABIC_DIACRITICS_REGEX = /[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g

export function transliterateArabic(input: string): string {
  const withoutDiacritics = input.replace(ARABIC_DIACRITICS_REGEX, '')
  let result = ''
  for (const char of withoutDiacritics) {
    const mapped = ARABIC_TO_LATIN_MAP[char]
    result += mapped ?? char
  }
  return result
}

export function slugify(input: string): string {
  const transliterated = transliterateArabic(input)
  return transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’‘`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function resolveUniqueSlug(baseSlug: string, existingSlugs: Iterable<string>): string {
  const taken = new Set<string>()
  for (const s of existingSlugs) {
    taken.add(s)
  }
  if (!taken.has(baseSlug)) {
    return baseSlug
  }
  let suffix = 2
  while (taken.has(`${baseSlug}-${String(suffix)}`)) {
    suffix += 1
  }
  return `${baseSlug}-${String(suffix)}`
}

export const validateSlug: TextFieldSingleValidation = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'المعرّف النصي (Slug) مطلوب. / Slug is required.'
  }
  if (!SLUG_REGEX.test(value)) {
    return 'يجب أن يحتوي المعرّف النصي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: my-slug-1). / Slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$.'
  }
  return true
}

function extractLocalizedSource(raw: unknown): { en?: string; ar?: string } {
  if (typeof raw === 'object' && raw !== null) {
    const record = raw as Record<string, unknown>
    const en =
      typeof record.en === 'string' && record.en.trim().length > 0 ? record.en.trim() : undefined
    const ar =
      typeof record.ar === 'string' && record.ar.trim().length > 0 ? record.ar.trim() : undefined
    return { en, ar }
  }
  return {}
}

function getSourceStringFromHookArgs(
  from: string,
  args: Parameters<SlugFieldHook>[0],
): string | undefined {
  const siblingVal = args.siblingData[from]
  const dataVal = (args.data as Record<string, unknown> | undefined)?.[from]
  const localesVal = args.siblingDocWithLocales?.[from]
  const originalVal = (args.originalDoc as Record<string, unknown> | undefined)?.[from]
  const prevSiblingVal = args.previousSiblingDoc?.[from]

  const candidates = [siblingVal, dataVal, localesVal, originalVal, prevSiblingVal]

  // 1. Prefer an explicit English string from any localized object representation
  for (const candidate of candidates) {
    const { en } = extractLocalizedSource(candidate)
    if (en) {
      return en
    }
  }

  // 2. If the current request locale is English and siblingVal/dataVal is a plain string, use it
  const reqLocale = typeof args.req.locale === 'string' ? args.req.locale : undefined
  if (reqLocale === 'en') {
    if (typeof siblingVal === 'string' && siblingVal.trim().length > 0) {
      return siblingVal.trim()
    }
    if (typeof dataVal === 'string' && dataVal.trim().length > 0) {
      return dataVal.trim()
    }
  }

  // 3. If siblingVal or dataVal is a plain string (either English or Arabic fallback), use it
  if (typeof siblingVal === 'string' && siblingVal.trim().length > 0) {
    return siblingVal.trim()
  }
  if (typeof dataVal === 'string' && dataVal.trim().length > 0) {
    return dataVal.trim()
  }

  // 4. Fallback to Arabic from any localized object representation
  for (const candidate of candidates) {
    const { ar } = extractLocalizedSource(candidate)
    if (ar) {
      return ar
    }
  }

  // 5. Fallback to originalDoc / previousSiblingDoc plain string
  if (typeof originalVal === 'string' && originalVal.trim().length > 0) {
    return originalVal.trim()
  }
  if (typeof prevSiblingVal === 'string' && prevSiblingVal.trim().length > 0) {
    return prevSiblingVal.trim()
  }

  return undefined
}

export interface SlugFieldOptions {
  from?: string
  name?: string
  overrides?: Partial<SingleTextField>
}

export function buildSlugBeforeValidateHook(from = 'title', fieldName = 'slug'): SlugFieldHook {
  return async (args) => {
    const currentValue = args.value
    if (typeof currentValue === 'string' && currentValue.trim().length > 0) {
      return currentValue.trim()
    }

    const source = getSourceStringFromHookArgs(from, args)
    if (!source) {
      return currentValue
    }

    const baseSlug = slugify(source)
    if (!baseSlug) {
      return currentValue
    }

    const collectionSlug = args.collection?.slug
    const payload = args.req.payload as
      | {
          find?: (opts: {
            collection: string
            depth?: number
            limit?: number
            overrideAccess?: boolean
            req?: unknown
            where: Where
          }) => Promise<{ docs?: Array<Record<string, unknown>> }>
        }
      | undefined

    if (collectionSlug && typeof payload?.find === 'function') {
      const currentId = args.originalDoc?.id ?? args.data?.id

      const where: Where =
        currentId !== undefined
          ? {
              and: [{ [fieldName]: { like: baseSlug } }, { id: { not_equals: currentId } }],
            }
          : { [fieldName]: { like: baseSlug } }

      try {
        const existing = await payload.find({
          collection: collectionSlug,
          depth: 0,
          limit: 100,
          overrideAccess: true,
          req: args.req,
          where,
        })
        const existingSlugs = (existing.docs ?? [])
          .map((doc) => doc[fieldName])
          .filter((s): s is string => typeof s === 'string')
        return resolveUniqueSlug(baseSlug, existingSlugs)
      } catch {
        return baseSlug
      }
    }

    return baseSlug
  }
}

export function slugField(options: SlugFieldOptions = {}): SingleTextField {
  const { from = 'title', name = 'slug', overrides = {} } = options
  const beforeValidateHook = buildSlugBeforeValidateHook(from, name)

  return {
    name,
    type: 'text',
    unique: true,
    index: true,
    required: true,
    label: {
      en: 'Slug',
      ar: 'المعرّف النصي (Slug)',
    },
    admin: {
      position: 'sidebar',
      description: {
        en: 'URL-safe identifier auto-generated from the English title (or transliterated Arabic fallback). Editable.',
        ar: 'معرّف الرابط النصي، يُولَّد تلقائياً من العنوان الإنجليزي (أو تعريب العنوان العربي عند غيابه) ويمكن تعديله.',
      },
      ...overrides.admin,
    },
    hooks: {
      ...overrides.hooks,
      beforeValidate: [beforeValidateHook, ...(overrides.hooks?.beforeValidate ?? [])],
    },
    validate: validateSlug,
    ...overrides,
    hasMany: false,
  }
}
