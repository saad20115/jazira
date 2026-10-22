import type {
  CheckboxField,
  FieldHook,
  PayloadRequest,
  TextField,
  TextFieldSingleValidation,
  TypeWithID,
  Where,
} from 'payload'

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_SLUG_LENGTH = 80
export const DEFAULT_SLUG_LOCK_FIELD = 'slugLocked'

export type SingleTextField = Extract<TextField, { hasMany?: false | undefined }>
export type SlugFieldHook = FieldHook<
  TypeWithID & Record<string, unknown>,
  unknown,
  Record<string, unknown>
>

/**
 * In-memory fallback registry per Payload instance so `slugLocked` state is tracked
 * even when a test collection registers `slugField()` alone without `slugLockedField()`.
 * Real collections use `slugFields()` / `slugLockedField()` to persist `slugLocked` in Postgres.
 */
const lockedSlugDocsByPayload = new WeakMap<object, Set<string>>()

function getLockedSetForPayload(payloadObj: unknown): Set<string> | undefined {
  if (typeof payloadObj !== 'object' || payloadObj === null) {
    return undefined
  }
  const hasRealOperations =
    typeof (payloadObj as { findByID?: unknown }).findByID === 'function' ||
    typeof (payloadObj as { update?: unknown }).update === 'function'
  if (!hasRealOperations) {
    return undefined
  }
  let set = lockedSlugDocsByPayload.get(payloadObj)
  if (!set) {
    set = new Set<string>()
    lockedSlugDocsByPayload.set(payloadObj, set)
  }
  return set
}

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

/**
 * Truncates a hyphen-delimited slug to at most `maxLength` characters,
 * cutting cleanly at the last word boundary (`-`) when one exists.
 */
export function truncateSlugAtWordBoundary(slug: string, maxLength = MAX_SLUG_LENGTH): string {
  if (slug.length <= maxLength) {
    return slug
  }
  const sliced = slug.slice(0, maxLength)
  if (slug[maxLength] === '-') {
    return sliced.replace(/-+$/g, '')
  }
  const lastHyphen = sliced.lastIndexOf('-')
  if (lastHyphen > 0) {
    return sliced.slice(0, lastHyphen).replace(/-+$/g, '')
  }
  return sliced.replace(/-+$/g, '')
}

export function slugify(input: string, maxLength = MAX_SLUG_LENGTH): string {
  const transliterated = transliterateArabic(input)
  const rawSlug = transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’‘`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return truncateSlugAtWordBoundary(rawSlug, maxLength)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Resolves a unique slug against existing slugs by checking exact `baseSlug`
 * and `baseSlug-<n>` matches and taking `maxSuffix + 1` (R-9), while keeping
 * the resulting slug within `MAX_SLUG_LENGTH` (R-8).
 */
export function resolveUniqueSlug(baseSlug: string, existingSlugs: Iterable<string>): string {
  const normalizedBase = truncateSlugAtWordBoundary(baseSlug, MAX_SLUG_LENGTH)
  if (!normalizedBase) {
    return ''
  }

  const taken = new Set<string>()
  for (const s of existingSlugs) {
    if (typeof s === 'string' && s.length > 0) {
      taken.add(s)
    }
  }

  if (!taken.has(normalizedBase)) {
    return normalizedBase
  }

  const computeNextForBase = (candidateBase: string): number => {
    const numberedRegex = new RegExp(`^${escapeRegExp(candidateBase)}-([1-9]\\d*)$`)
    let maxSuffix = 1
    for (const s of taken) {
      const match = numberedRegex.exec(s)
      if (match?.[1]) {
        const parsed = Number.parseInt(match[1], 10)
        if (Number.isSafeInteger(parsed) && parsed > maxSuffix) {
          maxSuffix = parsed
        }
      }
    }
    return maxSuffix + 1
  }

  let nextSuffix = computeNextForBase(normalizedBase)
  let suffixStr = `-${String(nextSuffix)}`
  let effectiveBase = normalizedBase

  if (effectiveBase.length + suffixStr.length > MAX_SLUG_LENGTH) {
    effectiveBase = truncateSlugAtWordBoundary(normalizedBase, MAX_SLUG_LENGTH - suffixStr.length)
    if (taken.has(effectiveBase)) {
      nextSuffix = Math.max(nextSuffix, computeNextForBase(effectiveBase))
      suffixStr = `-${String(nextSuffix)}`
    }
  }

  while (taken.has(`${effectiveBase}-${String(nextSuffix)}`)) {
    nextSuffix += 1
  }

  return `${effectiveBase}-${String(nextSuffix)}`
}

type PayloadFindLike = {
  find?: (opts: {
    collection: string
    depth?: number
    limit?: number
    overrideAccess?: boolean
    pagination?: boolean
    req?: unknown
    where: Where
  }) => Promise<{ docs?: Array<Record<string, unknown>> }>
  findByID?: (opts: {
    collection: string
    depth?: number
    disableErrors?: boolean
    draft?: boolean
    fallbackLocale?: false | string
    id: number | string
    locale?: string
    overrideAccess?: boolean
    req?: PayloadRequest
  }) => Promise<Record<string, unknown> | null | undefined>
}

export const validateSlug: TextFieldSingleValidation = (value, options) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'المعرّف النصي (Slug) مطلوب. / Slug is required.'
  }
  if (value.length > MAX_SLUG_LENGTH) {
    return `يجب ألا يتجاوز المعرّف النصي ${String(MAX_SLUG_LENGTH)} حرفاً. / Slug must not exceed ${String(MAX_SLUG_LENGTH)} characters.`
  }
  if (!SLUG_REGEX.test(value)) {
    return 'يجب أن يحتوي المعرّف النصي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: my-slug-1). / Slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$.'
  }

  const collectionSlug = (options as { collectionSlug?: string } | undefined)?.collectionSlug
  const fieldName =
    typeof (options as { name?: string } | undefined)?.name === 'string'
      ? (options as { name: string }).name
      : 'slug'
  const currentId =
    (options as { id?: number | string } | undefined)?.id ??
    ((options as { data?: Record<string, unknown> } | undefined)?.data?.id as
      number | string | undefined)
  const req = (options as { req?: PayloadRequest } | undefined)?.req
  const payload = req?.payload as PayloadFindLike | undefined

  if (collectionSlug && typeof payload?.find === 'function') {
    const where: Where =
      currentId !== undefined
        ? {
            and: [{ [fieldName]: { equals: value } }, { id: { not_equals: currentId } }],
          }
        : { [fieldName]: { equals: value } }

    const txReq = req?.transactionID
      ? ({ transactionID: req.transactionID } as unknown as PayloadRequest)
      : undefined

    return payload
      .find({
        collection: collectionSlug,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req: txReq,
        where,
      })
      .then((existing) => {
        if ((existing.docs ?? []).length > 0) {
          return 'هذا المعرّف النصي (Slug) مستخدم بالفعل في سجل آخر. يرجى اختيار معرّف فريد. / This slug is already in use by another document. Please choose a unique slug.'
        }
        return true as const
      })
      .catch(() => true as const)
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

function extractNonEmptyString(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim()
  }
  return undefined
}

async function resolveSourceStringForSlug(
  from: string,
  args: Parameters<SlugFieldHook>[0],
): Promise<string | undefined> {
  const siblingVal = args.siblingData[from]
  const dataVal = (args.data as Record<string, unknown> | undefined)?.[from]
  const localesVal = args.siblingDocWithLocales?.[from]
  const originalVal = (args.originalDoc as Record<string, unknown> | undefined)?.[from]
  const prevSiblingVal = args.previousSiblingDoc?.[from]

  const candidates = [siblingVal, dataVal, localesVal, originalVal, prevSiblingVal]

  // 1. Prefer an explicit English string from any localized { en, ar } object representation
  for (const candidate of candidates) {
    const { en } = extractLocalizedSource(candidate)
    if (en) {
      return en
    }
  }

  // 2. If the current request locale is English, incoming siblingVal/dataVal is the English title
  const reqLocale = typeof args.req.locale === 'string' ? args.req.locale : undefined
  if (reqLocale === 'en') {
    const incomingEn = extractNonEmptyString(siblingVal) ?? extractNonEmptyString(dataVal)
    if (incomingEn) {
      return incomingEn
    }
  }

  // 3. When saving in a non-English locale (e.g. 'ar') on an existing document, check if an English
  //    title exists in the database via req.payload.findByID({ locale: 'en', fallbackLocale: false }) (R-2)
  const collectionSlug = args.collection?.slug
  const rawId = args.originalDoc?.id ?? args.data?.id
  const currentId = typeof rawId === 'number' || typeof rawId === 'string' ? rawId : undefined
  const payload = args.req.payload as PayloadFindLike | undefined

  if (
    reqLocale !== 'en' &&
    collectionSlug &&
    currentId !== undefined &&
    typeof payload?.findByID === 'function'
  ) {
    const hasDrafts = Boolean(args.collection?.versions?.drafts)
    const txReq = args.req.transactionID
      ? ({ transactionID: args.req.transactionID } as unknown as PayloadRequest)
      : undefined
    try {
      const enDoc = await payload.findByID({
        collection: collectionSlug,
        depth: 0,
        disableErrors: true,
        draft: hasDrafts,
        fallbackLocale: false,
        id: currentId,
        locale: 'en',
        overrideAccess: true,
        req: txReq,
      })
      const rawEnField = enDoc?.[from]
      const enFromDoc = extractNonEmptyString(rawEnField) ?? extractLocalizedSource(rawEnField).en
      if (enFromDoc) {
        return enFromDoc
      }
    } catch {
      // Fall back to incoming/existing values below if findByID fails
    }
  }

  // 4. Fallback to incoming plain string (e.g. Arabic title when creating/editing in 'ar')
  const incomingPlain = extractNonEmptyString(siblingVal) ?? extractNonEmptyString(dataVal)
  if (incomingPlain) {
    return incomingPlain
  }

  // 5. Fallback to Arabic from any localized { en, ar } object representation
  for (const candidate of candidates) {
    const { ar } = extractLocalizedSource(candidate)
    if (ar) {
      return ar
    }
  }

  // 6. Fallback to originalDoc / previousSiblingDoc plain string
  return extractNonEmptyString(originalVal) ?? extractNonEmptyString(prevSiblingVal)
}

async function findExistingMatchingSlugs(
  payload: PayloadFindLike,
  collectionSlug: string,
  fieldName: string,
  baseSlug: string,
  currentId: number | string | undefined,
  req: PayloadRequest,
): Promise<string[]> {
  if (typeof payload.find !== 'function') {
    return []
  }

  const slugMatchWhere: Where = {
    or: [{ [fieldName]: { equals: baseSlug } }, { [fieldName]: { like: `${baseSlug}-` } }],
  }

  const where: Where =
    currentId !== undefined
      ? {
          and: [slugMatchWhere, { id: { not_equals: currentId } }],
        }
      : slugMatchWhere

  const txReq = req.transactionID
    ? ({ transactionID: req.transactionID } as unknown as PayloadRequest)
    : undefined

  const existing = await payload.find({
    collection: collectionSlug,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    req: txReq,
    where,
  })

  const numberedPattern = new RegExp(`^${escapeRegExp(baseSlug)}-([1-9]\\d*)$`)
  return (existing.docs ?? [])
    .map((doc) => doc[fieldName])
    .filter(
      (s): s is string => typeof s === 'string' && (s === baseSlug || numberedPattern.test(s)),
    )
}

function setSlugLockedFlag(
  args: Parameters<SlugFieldHook>[0],
  lockFieldName: string,
  locked: boolean,
): void {
  args.siblingData[lockFieldName] = locked
  if (typeof args.data === 'object') {
    ;(args.data as Record<string, unknown>)[lockFieldName] = locked
  }
  const collectionSlug = args.collection?.slug
  const rawId = args.originalDoc?.id ?? args.data?.id
  const currentId = typeof rawId === 'number' || typeof rawId === 'string' ? rawId : undefined
  const lockedSet = getLockedSetForPayload(args.req.payload)
  if (lockedSet && collectionSlug && currentId !== undefined) {
    const key = `${collectionSlug}:${String(currentId)}`
    if (locked) {
      lockedSet.add(key)
    } else {
      lockedSet.delete(key)
    }
  }
}

export interface SlugFieldOptions {
  from?: string
  lockFieldName?: string
  name?: string
  overrides?: Partial<SingleTextField>
}

export function buildSlugBeforeValidateHook(
  from = 'title',
  fieldName = 'slug',
  lockFieldName = DEFAULT_SLUG_LOCK_FIELD,
): SlugFieldHook {
  return async (args) => {
    const collectionSlug = args.collection?.slug
    const originalRecord = args.originalDoc as Record<string, unknown> | undefined
    const dataRecord = args.data as Record<string, unknown> | undefined
    const rawId = originalRecord?.id ?? dataRecord?.id
    const currentId = typeof rawId === 'number' || typeof rawId === 'string' ? rawId : undefined

    const lockedSet = getLockedSetForPayload(args.req.payload)
    if (args.operation === 'create' && lockedSet && collectionSlug && currentId !== undefined) {
      lockedSet.delete(`${collectionSlug}:${String(currentId)}`)
    }

    const prevSlug =
      extractNonEmptyString(originalRecord?.[fieldName]) ??
      extractNonEmptyString(args.previousValue)

    const rawSiblingSlug = extractNonEmptyString(args.siblingData[fieldName])
    const rawValueSlug = extractNonEmptyString(args.value)

    // Detect if the editor explicitly typed/changed the slug manually on this save:
    // - On create: any non-empty slug provided in siblingData or value
    // - On update: a non-empty slug in siblingData (or value when prevSlug is absent) that differs from prevSlug
    const manualCandidate =
      args.operation === 'create'
        ? (rawSiblingSlug ?? rawValueSlug)
        : rawSiblingSlug !== undefined
          ? rawSiblingSlug
          : prevSlug === undefined
            ? rawValueSlug
            : undefined

    const isManualSlugInput =
      manualCandidate !== undefined &&
      (args.operation === 'create' ||
        prevSlug === undefined ||
        (manualCandidate !== prevSlug && slugify(manualCandidate) !== prevSlug))

    const incomingStatus = args.siblingData._status ?? dataRecord?._status
    const originalStatus = originalRecord?._status
    const isPublishingNow = incomingStatus === 'published'
    const wasPublishedBefore = originalStatus === 'published'

    const wasLockedInDoc =
      originalRecord?.[lockFieldName] === true ||
      args.previousSiblingDoc?.[lockFieldName] === true ||
      args.siblingData[lockFieldName] === true ||
      dataRecord?.[lockFieldName] === true ||
      (lockedSet !== undefined &&
        collectionSlug !== undefined &&
        currentId !== undefined &&
        lockedSet.has(`${collectionSlug}:${String(currentId)}`))

    const wasAlreadyLocked = wasLockedInDoc || wasPublishedBefore

    // R-6 & R-2(3): If the editor typed a manual slug, normalize it via slugify and lock slugLocked
    if (isManualSlugInput) {
      setSlugLockedFlag(args, lockFieldName, true)
      if (typeof args.context === 'object') {
        ;(args.context as Record<string, unknown>)[`__${lockFieldName}`] = true
      }
      const normalizedManual = slugify(manualCandidate)
      // If slugify produces an empty string (e.g. only symbols), return trimmed manual input so validateSlug rejects it
      return normalizedManual.length > 0 ? normalizedManual : manualCandidate
    }

    // R-2(2) & R-2(3): If slugLocked is already true, keep the existing slug untouched
    if (wasAlreadyLocked && prevSlug) {
      setSlugLockedFlag(args, lockFieldName, true)
      return prevSlug
    }

    // R-2(2): While slugLocked is false, (re)generate from English title if one exists, otherwise transliterated Arabic
    const source = await resolveSourceStringForSlug(from, args)
    if (!source) {
      if (isPublishingNow) {
        setSlugLockedFlag(args, lockFieldName, true)
      }
      return prevSlug ?? args.value
    }

    const baseSlug = slugify(source)
    if (!baseSlug) {
      if (isPublishingNow) {
        setSlugLockedFlag(args, lockFieldName, true)
      }
      return prevSlug ?? args.value
    }

    // Lock slug when the document is first published (R-2(3))
    if (isPublishingNow) {
      setSlugLockedFlag(args, lockFieldName, true)
      if (typeof args.context === 'object') {
        ;(args.context as Record<string, unknown>)[`__${lockFieldName}`] = true
      }
    } else if (!wasAlreadyLocked) {
      setSlugLockedFlag(args, lockFieldName, false)
    }

    const payload = args.req.payload as PayloadFindLike | undefined
    if (collectionSlug && payload && typeof payload.find === 'function') {
      try {
        const existingSlugs = await findExistingMatchingSlugs(
          payload,
          collectionSlug,
          fieldName,
          baseSlug,
          currentId,
          args.req,
        )
        return resolveUniqueSlug(baseSlug, existingSlugs)
      } catch {
        return baseSlug
      }
    }

    return baseSlug
  }
}

export function slugLockedField(name = DEFAULT_SLUG_LOCK_FIELD): CheckboxField {
  return {
    name,
    type: 'checkbox',
    defaultValue: false,
    admin: {
      hidden: true,
      position: 'sidebar',
    },
    hooks: {
      beforeChange: [
        ({ context, siblingData, value }) => {
          if (
            siblingData[name] === true ||
            (typeof context === 'object' &&
              (context as Record<string, unknown>)[`__${name}`] === true)
          ) {
            return true
          }
          return typeof value === 'boolean' ? value : false
        },
      ],
    },
  }
}

export function slugField(options: SlugFieldOptions = {}): SingleTextField {
  const {
    from = 'title',
    lockFieldName = DEFAULT_SLUG_LOCK_FIELD,
    name = 'slug',
    overrides = {},
  } = options
  const beforeValidateHook = buildSlugBeforeValidateHook(from, name, lockFieldName)

  const afterChangeLockHook: SlugFieldHook = ({
    collection,
    context,
    data,
    operation,
    originalDoc,
    req,
    siblingData,
    value,
  }) => {
    const collectionSlug = collection?.slug
    const rawDocId =
      (originalDoc as Record<string, unknown> | undefined)?.id ??
      (data as Record<string, unknown> | undefined)?.id
    const docId =
      typeof rawDocId === 'number' || typeof rawDocId === 'string' ? rawDocId : undefined
    const lockedSet = getLockedSetForPayload(req.payload)
    if (lockedSet && collectionSlug && docId !== undefined) {
      const isLocked =
        siblingData[lockFieldName] === true ||
        (data as Record<string, unknown> | undefined)?.[lockFieldName] === true ||
        (originalDoc as Record<string, unknown> | undefined)?.[lockFieldName] === true ||
        siblingData._status === 'published' ||
        (data as Record<string, unknown> | undefined)?._status === 'published' ||
        (originalDoc as Record<string, unknown> | undefined)?._status === 'published' ||
        (typeof context === 'object' &&
          (context as Record<string, unknown>)[`__${lockFieldName}`] === true)

      const key = `${collectionSlug}:${String(docId)}`
      if (isLocked) {
        lockedSet.add(key)
      } else if (operation === 'create') {
        lockedSet.delete(key)
      }
    }
    return value
  }

  const defaultAdmin: NonNullable<SingleTextField['admin']> = {
    position: 'sidebar',
    description: {
      en: 'URL-safe identifier auto-generated from the English title (or transliterated Arabic fallback). Editable.',
      ar: 'معرّف الرابط النصي، يُولَّد تلقائياً من العنوان الإنجليزي (أو تعريب العنوان العربي عند غيابه) ويمكن تعديله.',
    },
  }

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
    validate: validateSlug,
    ...overrides,
    admin: {
      ...defaultAdmin,
      ...overrides.admin,
    },
    hooks: {
      ...overrides.hooks,
      beforeValidate: [beforeValidateHook, ...(overrides.hooks?.beforeValidate ?? [])],
      beforeChange: [...(overrides.hooks?.beforeChange ?? [])],
      afterChange: [afterChangeLockHook, ...(overrides.hooks?.afterChange ?? [])],
      afterRead: [...(overrides.hooks?.afterRead ?? [])],
      beforeDuplicate: [...(overrides.hooks?.beforeDuplicate ?? [])],
    },
    hasMany: false,
  }
}

export function slugFields(options: SlugFieldOptions = {}): [SingleTextField, CheckboxField] {
  return [slugField(options), slugLockedField(options.lockFieldName)]
}
