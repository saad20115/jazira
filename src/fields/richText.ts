import {
  BlockquoteFeature,
  BoldFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import {
  type FieldAffectingData,
  type FieldHook,
  type RelationshipField,
  type RichTextField,
  type TypeWithID,
  ValidationError,
} from 'payload'

import { validateExternalUrl, validateInternalPath } from './link'

/**
 * Allowed Lexical AST node types for the limited richText feature set (`I2`, `P2-T3`, `P2-T4`):
 * - `root`, `paragraph`, `text`, `linebreak`
 * - `heading` (`h2`, `h3`, `h4` only)
 * - `list` (`bullet`, `number` only), `listitem`
 * - `quote` (`blockquote`)
 * - `link`, `autolink` (`I3` URL rules)
 * - `upload` (`media` collection only)
 */
export const ALLOWED_LIMITED_LEXICAL_NODE_TYPES = [
  'root',
  'paragraph',
  'heading',
  'text',
  'linebreak',
  'list',
  'listitem',
  'quote',
  'link',
  'autolink',
  'upload',
] as const

export const ALLOWED_PARAGRAPH_ONLY_LEXICAL_NODE_TYPES = [
  'root',
  'paragraph',
  'text',
  'linebreak',
] as const

export const ALLOWED_HEADING_TAGS = ['h2', 'h3', 'h4'] as const
export const ALLOWED_LIST_TYPES = ['bullet', 'number'] as const
export const ALLOWED_LIST_TAGS = ['ul', 'ol'] as const
export const ALLOWED_UPLOAD_COLLECTIONS = ['media'] as const
export const ALLOWED_INTERNAL_LINK_COLLECTIONS = ['services', 'projects'] as const

/**
 * Lexical text node format bitmask:
 * 1 = bold (`IS_BOLD`), 2 = italic (`IS_ITALIC`).
 * Any bit outside (1 | 2 = 3), such as strikethrough (4), underline (8), code (16),
 * subscript (32), superscript (64), is disallowed.
 */
const ALLOWED_TEXT_FORMAT_MASK = 1 | 2

export function validateRichTextLinkUrl(value: unknown): true | string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'الرابط داخل النص المنسق مطلوب. / Link URL in rich text is required.'
  }
  const trimmed = value.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return validateInternalPath(trimmed, { required: true })
  }
  return validateExternalUrl(trimmed, {
    allowedProtocols: ['http:', 'https:', 'mailto:', 'tel:'],
    required: true,
  })
}

export interface ValidateLexicalOptions {
  maxParagraphs?: number
  mode?: 'limited' | 'paragraphsOnly'
  required?: boolean
}

export function extractPositiveIntMediaId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
    return raw
  }
  if (typeof raw === 'string' && /^[1-9]\d*$/.test(raw.trim())) {
    const parsed = Number.parseInt(raw.trim(), 10)
    return parsed > 0 ? parsed : null
  }
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    return extractPositiveIntMediaId((raw as { id?: unknown }).id)
  }
  return null
}

export function extractRichTextUploadMediaIds(node: unknown): number[] {
  const ids = new Set<number>()

  const walk = (current: unknown): void => {
    if (!current || typeof current !== 'object') {
      return
    }
    if (Array.isArray(current)) {
      for (const item of current) {
        walk(item)
      }
      return
    }
    const record = current as Record<string, unknown>
    if (record.type === 'upload' && record.relationTo === 'media') {
      const id = extractPositiveIntMediaId(record.value)
      if (id !== null) {
        ids.add(id)
      }
    }
    for (const val of Object.values(record)) {
      if (typeof val === 'object' && val !== null) {
        walk(val)
      }
    }
  }

  walk(node)
  return Array.from(ids)
}

function inspectLexicalNode(
  node: unknown,
  allowedTypes: ReadonlySet<string>,
  path: string,
): true | string {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return `عقدة Lexical غير صالحة في ${path}. / Invalid Lexical AST node at ${path}.`
  }

  const record = node as Record<string, unknown>
  const nodeType = record.type
  if (typeof nodeType !== 'string' || !allowedTypes.has(nodeType)) {
    return `عنصر غير مسموح به في النص المنسق ("${String(nodeType)}"). العناصر المسموحة فقط: العناوين (h2–h4)، الفقرات، العريض، المائل، القوائم، الاقتباس، الروابط الآمنة، وصور الوسائط. / Disallowed Lexical node type "${String(nodeType)}" at ${path} (I2).`
  }

  // Reject raw HTML or inline style properties injected onto any node
  if (typeof record.html === 'string' || typeof record.rawHtml === 'string') {
    return `لا يُسمح بإدراج كود HTML خام داخل النص المنسق (${path}). / Raw HTML properties are not allowed in Lexical nodes at ${path} (I2).`
  }
  if (typeof record.style === 'string' && record.style.trim().length > 0) {
    return `لا يُسمح بخصائص النمط المضمّنة (inline style) في النص المنسق (${path}). / Inline style attributes are not allowed in Lexical nodes at ${path} (I2).`
  }

  if (nodeType === 'heading') {
    const tag = record.tag
    if (typeof tag !== 'string' || !(ALLOWED_HEADING_TAGS as readonly string[]).includes(tag)) {
      return `مستوى العنوان "${String(tag)}" غير مسموح. المستويات المسموحة: h2, h3, h4 فقط. / Disallowed heading tag "${String(tag)}" at ${path}; only h2–h4 are allowed (I2).`
    }
  }

  if (nodeType === 'list') {
    const listType = record.listType
    if (
      typeof listType !== 'string' ||
      !(ALLOWED_LIST_TYPES as readonly string[]).includes(listType)
    ) {
      return `نوع القائمة "${String(listType)}" غير مسموح. الأنواع المسموحة: نقطية أو رقمية فقط. / Disallowed listType "${String(listType)}" at ${path}; only bullet and number lists are allowed (I2).`
    }
    const tag = record.tag
    if (
      tag !== undefined &&
      (typeof tag !== 'string' || !(ALLOWED_LIST_TAGS as readonly string[]).includes(tag))
    ) {
      const tagLabel = typeof tag === 'string' ? tag : JSON.stringify(tag)
      return `وسم القائمة "${tagLabel}" غير مسموح. / Disallowed list tag "${tagLabel}" at ${path} (I2).`
    }
  }

  if (nodeType === 'text') {
    const format = record.format
    if (typeof format === 'number') {
      if (!Number.isInteger(format) || format < 0 || (format & ~ALLOWED_TEXT_FORMAT_MASK) !== 0) {
        return `تنسيق النص (${String(format)}) غير مسموح. التنسيقات المسموحة: عريض (bold) ومائل (italic) فقط. / Disallowed text format bitmask ${String(format)} at ${path}; only bold (1) and italic (2) are allowed (I2).`
      }
    } else if (typeof format === 'string' && format.length > 0) {
      if (format !== 'bold' && format !== 'italic') {
        return `تنسيق النص "${format}" غير مسموح. / Disallowed text format "${format}" at ${path} (I2).`
      }
    }
  }

  if (nodeType === 'upload') {
    const relationTo = record.relationTo
    if (
      typeof relationTo !== 'string' ||
      !(ALLOWED_UPLOAD_COLLECTIONS as readonly string[]).includes(relationTo)
    ) {
      return `مجموعة الرفع "${String(relationTo)}" غير مسموحة داخل النص المنسق؛ يُسمح بمجموعة "media" فقط. / Disallowed upload relationTo "${String(relationTo)}" at ${path}; only "media" is allowed (I2).`
    }
    if (extractPositiveIntMediaId(record.value) === null) {
      return `معرّف ملف الوسائط في عقدة الرفع (${path}) غير صالح. / Invalid media upload reference ID at ${path}.`
    }
  }

  if (nodeType === 'link' || nodeType === 'autolink') {
    const fields =
      typeof record.fields === 'object' && record.fields !== null
        ? (record.fields as Record<string, unknown>)
        : undefined
    const linkType = fields?.linkType ?? record.linkType ?? 'custom'
    if (linkType === 'internal') {
      const doc =
        typeof fields?.doc === 'object' && fields.doc !== null
          ? (fields.doc as Record<string, unknown>)
          : undefined
      const relationTo = doc?.relationTo
      if (
        typeof relationTo !== 'string' ||
        !(ALLOWED_INTERNAL_LINK_COLLECTIONS as readonly string[]).includes(relationTo)
      ) {
        return `الرابط الداخلي في النص المنسق يجب أن يشير إلى خدمة أو مشروع صالح. / Internal rich text link at ${path} must reference a valid collection (services or projects).`
      }
      if (doc?.value === undefined || doc.value === null || doc.value === '') {
        return `الرابط الداخلي في النص المنسق يفتقد المستند الهدف. / Internal rich text link at ${path} is missing target document value.`
      }
    } else {
      const url = fields?.url ?? record.url
      const urlCheck = validateRichTextLinkUrl(url)
      if (urlCheck !== true) {
        return urlCheck
      }
    }
  }

  const children = record.children
  if (children !== undefined) {
    if (!Array.isArray(children)) {
      return `قائمة العناصر الفرعية في ${path} غير صالحة. / Invalid children array at ${path}.`
    }
    for (let i = 0; i < children.length; i += 1) {
      const childResult = inspectLexicalNode(
        children[i],
        allowedTypes,
        `${path}.children[${String(i)}]`,
      )
      if (childResult !== true) {
        return childResult
      }
    }
  }

  return true
}

export function validateLimitedLexicalState(
  value: unknown,
  options: ValidateLexicalOptions = {},
): true | string {
  const { maxParagraphs, mode = 'limited', required = false } = options

  if (value === null || value === undefined || value === '') {
    return required ? 'محتوى النص المنسق مطلوب. / Rich text content is required.' : true
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return 'بنية النص المنسق (Lexical JSON) غير صالحة. / Invalid Lexical JSON structure.'
  }

  const root = (value as Record<string, unknown>).root
  if (typeof root !== 'object' || root === null || Array.isArray(root)) {
    return 'جذر النص المنسق (root) مفقود أو غير صالح. / Lexical root node is missing or invalid.'
  }

  const rootRecord = root as Record<string, unknown>
  if (rootRecord.type !== 'root' || !Array.isArray(rootRecord.children)) {
    return 'جذر النص المنسق (root) يجب أن يحتوي على مصفوفة عناصر (children). / Lexical root must have type "root" and a children array.'
  }

  if (typeof maxParagraphs === 'number' && maxParagraphs > 0) {
    const paragraphCount = rootRecord.children.filter(
      (child) =>
        typeof child === 'object' &&
        child !== null &&
        (child as { type?: unknown }).type === 'paragraph',
    ).length
    if (paragraphCount > maxParagraphs) {
      return `الحد الأقصى لعدد الفقرات المسموح به في هذا الحقل هو ${String(maxParagraphs)} فقرات (المُدخل: ${String(paragraphCount)}). / Maximum ${String(maxParagraphs)} paragraphs allowed (received ${String(paragraphCount)}).`
    }
  }

  const allowedSet = new Set<string>(
    mode === 'paragraphsOnly'
      ? ALLOWED_PARAGRAPH_ONLY_LEXICAL_NODE_TYPES
      : ALLOWED_LIMITED_LEXICAL_NODE_TYPES,
  )

  return inspectLexicalNode(rootRecord, allowedSet, 'root')
}

export function createLimitedLexicalEditor() {
  return lexicalEditor({
    features: [
      ParagraphFeature(),
      HeadingFeature({
        enabledHeadingSizes: ['h2', 'h3', 'h4'],
      }),
      BoldFeature(),
      ItalicFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      BlockquoteFeature(),
      LinkFeature({
        enabledCollections: [...ALLOWED_INTERNAL_LINK_COLLECTIONS],
        fields: ({ defaultFields }) =>
          defaultFields.map((field) => {
            if ('name' in field && field.name === 'url' && field.type === 'text') {
              const updatedField: FieldAffectingData = {
                ...field,
                hooks: {},
                validate: (val: unknown, opts: { siblingData?: Record<string, unknown> }) => {
                  if (opts.siblingData?.linkType === 'internal') {
                    return true
                  }
                  return validateRichTextLinkUrl(val)
                },
              }
              return updatedField
            }
            return field
          }),
      }),
      UploadFeature({
        enabledCollections: ['media'],
        collections: {
          media: {
            fields: [],
          },
        },
      }),
    ],
  })
}

export function createParagraphOnlyLexicalEditor() {
  return lexicalEditor({
    features: [ParagraphFeature(), BoldFeature(), ItalicFeature()],
  })
}

type RichTextFieldHook = FieldHook<
  TypeWithID & Record<string, unknown>,
  unknown,
  Record<string, unknown>
>

export interface LimitedRichTextFieldOptions {
  label?: RichTextField['label']
  localized?: boolean
  maxParagraphs?: number
  mode?: 'limited' | 'paragraphsOnly'
  name?: string
  overrides?: Partial<RichTextField>
  required?: boolean
}

export function limitedRichTextField(options: LimitedRichTextFieldOptions = {}): RichTextField {
  const {
    label = {
      ar: 'المحتوى التفصيلي',
      en: 'Detailed Content',
    },
    localized = true,
    maxParagraphs,
    mode = 'limited',
    name = 'body',
    overrides = {},
    required = false,
  } = options

  const enforceAstHook: RichTextFieldHook = async (args) => {
    const val = args.value
    if (val === null || val === undefined || val === '') {
      return val
    }
    const globalSlug = (args as { global?: { slug?: string } }).global?.slug
    const validationResult = validateLimitedLexicalState(val, { maxParagraphs, mode, required })
    if (validationResult !== true) {
      const resolvedPath =
        Array.isArray(args.path) && args.path.length > 0 ? args.path.map(String).join('.') : name
      throw new ValidationError(
        {
          collection: args.collection?.slug,
          errors: [
            {
              label: args.field.label === false ? undefined : args.field.label,
              message: validationResult,
              path: resolvedPath,
            },
          ],
          global: globalSlug,
          id: args.originalDoc?.id ?? args.data?.id,
          req: args.req,
        },
        args.req.t,
      )
    }

    const payloadFromReq = (
      args.req as unknown as {
        payload?: { find?: (opts: Record<string, unknown>) => Promise<{ docs: unknown[] }> }
      }
    ).payload
    if (mode === 'limited' && typeof payloadFromReq?.find === 'function') {
      const uploadIds = extractRichTextUploadMediaIds(val)
      if (uploadIds.length > 0) {
        const foundMedia = await payloadFromReq.find({
          collection: 'media',
          depth: 0,
          limit: uploadIds.length,
          overrideAccess: true,
          req: args.req,
          where: {
            id: {
              in: uploadIds,
            },
          },
        })
        if (foundMedia.docs.length !== uploadIds.length) {
          throw new ValidationError(
            {
              collection: args.collection?.slug,
              errors: [
                {
                  label: args.field.label === false ? undefined : args.field.label,
                  message:
                    'أحد ملفات الوسائط المضمّنة في النص المنسق غير موجود في مكتبة الوسائط. / One or more media items embedded in the rich text body do not exist in the media library.',
                  path: name,
                },
              ],
              global: globalSlug,
              id: args.originalDoc?.id ?? args.data?.id,
              req: args.req,
            },
            args.req.t,
          )
        }
      }
    }

    return val
  }

  const {
    admin: overrideAdmin,
    hooks: overrideHooks,
    validate: overrideValidate,
    ...restOverrides
  } = overrides

  return {
    name,
    type: 'richText',
    label,
    localized,
    required,
    editor:
      mode === 'paragraphsOnly' ? createParagraphOnlyLexicalEditor() : createLimitedLexicalEditor(),
    ...restOverrides,
    admin: {
      ...overrideAdmin,
    },
    hooks: {
      ...overrideHooks,
      beforeValidate: [enforceAstHook, ...(overrideHooks?.beforeValidate ?? [])],
      beforeChange: [...(overrideHooks?.beforeChange ?? [])],
      afterChange: [...(overrideHooks?.afterChange ?? [])],
      afterRead: [...(overrideHooks?.afterRead ?? [])],
      beforeDuplicate: [...(overrideHooks?.beforeDuplicate ?? [])],
    },
    validate: async (value, validateOptions) => {
      const astResult = validateLimitedLexicalState(value, { maxParagraphs, mode, required })
      if (astResult !== true) {
        return astResult
      }
      if (typeof overrideValidate === 'function') {
        return overrideValidate(value, validateOptions)
      }
      return true
    },
  }
}

export function paragraphRichTextField(
  options: Omit<LimitedRichTextFieldOptions, 'mode'> = {},
): RichTextField {
  return limitedRichTextField({
    name: 'text',
    label: {
      ar: 'النص (فقرات فقط)',
      en: 'Text (Paragraphs Only)',
    },
    ...options,
    mode: 'paragraphsOnly',
  })
}

/**
 * Hidden relationship field (`bodyMedia`) that indexes every `media` upload ID referenced
 * inside a localized richText `body` field across all locales (`ar` and `en`), on both
 * draft and published saves (`P2-T4 R-11`).
 */
export function bodyMediaField(bodyFieldName = 'body'): RelationshipField {
  return {
    name: 'bodyMedia',
    type: 'relationship',
    relationTo: 'media',
    hasMany: true,
    admin: {
      hidden: true,
    },
    hooks: {
      beforeChange: [
        ({ data, originalDoc, req, siblingData, siblingDocWithLocales }) => {
          const operationLocale =
            typeof req.locale === 'string' && req.locale !== 'all' && req.locale.length > 0
              ? req.locale
              : 'ar'
          const siblingRecord = siblingData as Record<string, unknown> | undefined
          const dataRecord = data as Record<string, unknown> | undefined
          const originalRecord = originalDoc as Record<string, unknown> | undefined
          const activeBody =
            siblingRecord && siblingRecord[bodyFieldName] !== undefined
              ? siblingRecord[bodyFieldName]
              : dataRecord && dataRecord[bodyFieldName] !== undefined
                ? dataRecord[bodyFieldName]
                : originalRecord?.[bodyFieldName]

          const mediaIds = new Set<number>()
          for (const id of extractRichTextUploadMediaIds(activeBody)) {
            mediaIds.add(id)
          }

          const localizedBodies = siblingDocWithLocales?.[bodyFieldName]
          if (
            localizedBodies &&
            typeof localizedBodies === 'object' &&
            !Array.isArray(localizedBodies) &&
            !('root' in localizedBodies)
          ) {
            for (const [localeKey, localeBody] of Object.entries(
              localizedBodies as Record<string, unknown>,
            )) {
              if (localeKey === operationLocale && activeBody !== undefined) {
                continue
              }
              for (const id of extractRichTextUploadMediaIds(localeBody)) {
                mediaIds.add(id)
              }
            }
          }

          return Array.from(mediaIds)
        },
      ],
    },
  }
}
