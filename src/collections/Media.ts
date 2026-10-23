import {
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type CollectionSlug,
  type Field,
  type GlobalConfig,
  type GlobalSlug,
  type SanitizedCollectionConfig,
  type SanitizedGlobalConfig,
  type Where,
} from 'payload'

import { isAdminOrEditor } from '../access/index'
import { env } from '../env'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
  REVALIDATE_LOCALES,
} from '../hooks/revalidate'
import { createPublicAPIError } from '../security/apiError'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  createSafeUploadFileHandler,
  validateAndSanitizeMediaFile,
} from '../security/uploadValidation'
import { withImmutableCreatedAt } from './_shared/immutableTimestamps'

type ActiveBeforeOperationArg = Exclude<
  Parameters<CollectionBeforeOperationHook>[0],
  { operation: 'read' | 'readDistinct' }
>

const validateUploadBeforeOperation: CollectionBeforeOperationHook = async (rawArg) => {
  const { args, operation, req } = rawArg as ActiveBeforeOperationArg
  if ((operation === 'create' || operation === 'update') && req.file) {
    await validateAndSanitizeMediaFile(req.file)
  }
  return args
}

export function richTextReferencesMediaId(node: unknown, targetId: number | string): boolean {
  if (!node || typeof node !== 'object') {
    return false
  }
  if (Array.isArray(node)) {
    return node.some((child) => richTextReferencesMediaId(child, targetId))
  }
  const record = node as Record<string, unknown>
  if (record.type === 'upload' && record.relationTo === 'media') {
    const rawVal = record.value
    const uploadId =
      typeof rawVal === 'object' && rawVal !== null && 'id' in rawVal
        ? (rawVal as { id?: unknown }).id
        : rawVal
    if (
      (typeof uploadId === 'number' || typeof uploadId === 'string') &&
      String(uploadId) === String(targetId)
    ) {
      return true
    }
  }
  for (const val of Object.values(record)) {
    if (typeof val === 'object' && val !== null) {
      if (richTextReferencesMediaId(val, targetId)) {
        return true
      }
    }
  }
  return false
}

const recordReferencingDoc = (
  referencesByKey: Map<string, string>,
  collection: CollectionSlug,
  doc: { id: number | string },
  labelField: string,
): void => {
  const key = `${collection}:${String(doc.id)}`
  const fallbackFormatted = `${collection}(#${String(doc.id)})`
  const record = doc as unknown as Record<string, unknown>
  const rawLabel = record[labelField]
  const hasRealLabel = typeof rawLabel === 'string' && rawLabel.trim().length > 0
  const formatted = hasRealLabel ? `${collection}(${rawLabel.trim()})` : fallbackFormatted

  const existing = referencesByKey.get(key)
  if (existing === undefined || (existing === fallbackFormatted && hasRealLabel)) {
    referencesByKey.set(key, formatted)
  }
}

export const findReferencingLabels = async ({
  collection,
  where,
  labelField,
  draft,
  localized,
  referencesByKey,
  req,
}: {
  collection: CollectionSlug
  where: Where
  labelField: string
  draft?: boolean
  localized?: boolean
  referencesByKey: Map<string, string>
  req: Parameters<CollectionBeforeDeleteHook>[0]['req']
}): Promise<void> => {
  if (!(collection in req.payload.collections)) {
    return
  }

  const localesToQuery = localized ? REVALIDATE_LOCALES : ([undefined] as const)

  for (const locale of localesToQuery) {
    const result = await req.payload.find({
      collection,
      where,
      ...(locale ? { locale, fallbackLocale: false as const } : {}),
      limit: 10,
      depth: 0,
      draft: draft ?? false,
      overrideAccess: true,
      req,
    })

    for (const doc of result.docs) {
      recordReferencingDoc(referencesByKey, collection, doc, labelField)
    }
  }
}

const getNestedValue = (obj: unknown, dotPath: string): unknown => {
  let current: unknown = obj
  for (const part of dotPath.split('.')) {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    if (Array.isArray(current)) {
      current = current
        .map((item) =>
          item && typeof item === 'object' ? (item as Record<string, unknown>)[part] : undefined,
        )
        .filter((v) => v !== undefined)
      continue
    }
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export const uploadValueMatchesMediaId = (raw: unknown, targetId: number | string): boolean => {
  if (raw === null || raw === undefined) {
    return false
  }
  if (Array.isArray(raw)) {
    return raw.some((item) => uploadValueMatchesMediaId(item, targetId))
  }
  const resolved = typeof raw === 'object' && 'id' in raw ? (raw as { id?: unknown }).id : raw
  return (
    (typeof resolved === 'number' || typeof resolved === 'string') &&
    String(resolved) === String(targetId)
  )
}

export interface DerivedFieldTargetPaths {
  fieldPaths: string[]
  richTextPaths: string[]
}

const joinPath = (prefix: string, name: string): string =>
  prefix.length > 0 ? `${prefix}.${name}` : name

/**
 * Walks a collection or global `fields` tree and extracts all `upload`/`relationship`
 * field paths targeting `targetCollection` (`'media'`, `'stats'`, `'videos'`, etc.),
 * plus `richText` field paths when `targetCollection === 'media'` (`P2-T5 R-4`).
 */
export function deriveFieldTargetPaths(
  fields: readonly Field[],
  targetCollection: CollectionSlug,
  prefix = '',
  out: DerivedFieldTargetPaths = { fieldPaths: [], richTextPaths: [] },
): DerivedFieldTargetPaths {
  for (const field of fields) {
    if (field.type === 'collapsible' || field.type === 'row') {
      deriveFieldTargetPaths(field.fields, targetCollection, prefix, out)
      continue
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabPrefix =
          'name' in tab && typeof tab.name === 'string' ? joinPath(prefix, tab.name) : prefix
        deriveFieldTargetPaths(tab.fields, targetCollection, tabPrefix, out)
      }
      continue
    }

    if (!('name' in field) || typeof field.name !== 'string') {
      continue
    }

    const currentPath = joinPath(prefix, field.name)

    if (field.type === 'group' || field.type === 'array') {
      deriveFieldTargetPaths(field.fields, targetCollection, currentPath, out)
      continue
    }

    if (field.type === 'upload' || field.type === 'relationship') {
      const matchesTarget =
        field.relationTo === targetCollection ||
        (Array.isArray(field.relationTo) && field.relationTo.includes(targetCollection))
      if (matchesTarget && !out.fieldPaths.includes(currentPath)) {
        out.fieldPaths.push(currentPath)
      }
      continue
    }

    if (field.type === 'richText' && targetCollection === 'media') {
      if (!out.richTextPaths.includes(currentPath)) {
        out.richTextPaths.push(currentPath)
      }
    }
  }

  return out
}

export interface GlobalTargetReferenceSpec {
  slug: GlobalSlug
  fieldPaths: readonly string[]
  richTextPaths: readonly string[]
  versioned: boolean
}

export function deriveGlobalTargetReferences(
  globalsConfig: ReadonlyArray<GlobalConfig | SanitizedGlobalConfig>,
  targetCollection: CollectionSlug,
): GlobalTargetReferenceSpec[] {
  const specs: GlobalTargetReferenceSpec[] = []
  for (const g of globalsConfig) {
    const { fieldPaths, richTextPaths } = deriveFieldTargetPaths(g.fields, targetCollection)
    if (fieldPaths.length === 0 && richTextPaths.length === 0) {
      continue
    }
    const versioned = Boolean(g.versions && typeof g.versions === 'object' && g.versions.drafts)
    specs.push({
      slug: g.slug as GlobalSlug,
      fieldPaths,
      richTextPaths,
      versioned,
    })
  }
  return specs
}

export const findGlobalTargetReferences = async ({
  slug,
  fieldPaths,
  richTextPaths = [],
  versioned,
  targetId,
  req,
}: {
  slug: GlobalSlug
  fieldPaths: readonly string[]
  richTextPaths?: readonly string[]
  versioned?: boolean
  targetId: number | string
  req: Parameters<CollectionBeforeDeleteHook>[0]['req']
}): Promise<string[]> => {
  const registeredGlobals = req.payload.globals.config
  if (!registeredGlobals.some((g) => g.slug === slug)) {
    return []
  }

  const draftStates = versioned ? ([false, true] as const) : ([false] as const)
  for (const draft of draftStates) {
    for (const locale of REVALIDATE_LOCALES) {
      const doc = (await req.payload.findGlobal({
        slug,
        locale,
        fallbackLocale: false,
        depth: 0,
        draft,
        overrideAccess: true,
        req,
      })) as unknown as Record<string, unknown>

      for (const path of fieldPaths) {
        if (uploadValueMatchesMediaId(getNestedValue(doc, path), targetId)) {
          return [`global:${slug}`]
        }
      }

      for (const rtPath of richTextPaths) {
        if (richTextReferencesMediaId(getNestedValue(doc, rtPath), targetId)) {
          return [`global:${slug}`]
        }
      }
    }
  }

  return []
}

export interface CollectionTargetReferenceSpec {
  slug: CollectionSlug
  fieldPaths: readonly string[]
  richTextPaths: readonly string[]
  labelField: string
  versioned: boolean
  localized: boolean
}

const fieldsHaveLocalizedProp = (fields: readonly Field[]): boolean => {
  for (const field of fields) {
    if ('localized' in field && field.localized === true) {
      return true
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      if (fieldsHaveLocalizedProp(field.fields)) {
        return true
      }
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('localized' in tab && tab.localized === true) {
          return true
        }
        if (fieldsHaveLocalizedProp(tab.fields)) {
          return true
        }
      }
    }
  }
  return false
}

const inferCollectionLabelField = (col: CollectionConfig | SanitizedCollectionConfig): string => {
  if (
    col.admin &&
    typeof col.admin.useAsTitle === 'string' &&
    col.admin.useAsTitle.trim().length > 0
  ) {
    return col.admin.useAsTitle.trim()
  }
  for (const candidate of ['title', 'name', 'label']) {
    if (col.fields.some((f) => 'name' in f && f.name === candidate)) {
      return candidate
    }
  }
  return 'id'
}

/**
 * Derives all collection upload/relationship/richText reference specs targeting `targetCollection`
 * directly from the Payload collections config (`P2-T5 R-4`, `P2-T8 R-8`).
 */
export function deriveCollectionTargetReferences(
  collectionsConfig: ReadonlyArray<CollectionConfig | SanitizedCollectionConfig>,
  targetCollection: CollectionSlug,
): CollectionTargetReferenceSpec[] {
  const specs: CollectionTargetReferenceSpec[] = []
  for (const col of collectionsConfig) {
    if (col.slug === targetCollection) {
      continue
    }
    const { fieldPaths, richTextPaths } = deriveFieldTargetPaths(col.fields, targetCollection)
    if (fieldPaths.length === 0 && richTextPaths.length === 0) {
      continue
    }
    const versioned = Boolean(
      col.versions &&
      (col.versions === true || (typeof col.versions === 'object' && col.versions.drafts)),
    )
    const localized = fieldsHaveLocalizedProp(col.fields)
    specs.push({
      slug: col.slug as CollectionSlug,
      fieldPaths,
      richTextPaths,
      labelField: inferCollectionLabelField(col),
      versioned,
      localized,
    })
  }
  return specs
}

export function buildCollectionTargetWhere(
  fieldPaths: readonly string[],
  targetId: number | string,
): Where | null {
  if (fieldPaths.length === 0) {
    return null
  }
  if (fieldPaths.length === 1) {
    return { [fieldPaths[0]]: { equals: targetId } }
  }
  return {
    or: fieldPaths.map((p) => ({ [p]: { equals: targetId } })),
  }
}

export const findCollectionTargetReferences = async ({
  check,
  targetId,
  referencesByKey,
  req,
}: {
  check: CollectionTargetReferenceSpec
  targetId: number | string
  referencesByKey: Map<string, string>
  req: Parameters<CollectionBeforeDeleteHook>[0]['req']
}): Promise<void> => {
  if (!(check.slug in req.payload.collections)) {
    return
  }

  const draftStates = check.versioned ? ([false, true] as const) : ([false] as const)
  const where = buildCollectionTargetWhere(check.fieldPaths, targetId)
  const needsInMemoryPathScan =
    check.fieldPaths.some((p) => p.includes('.')) ||
    (check.richTextPaths.length > 0 && !check.fieldPaths.includes('bodyMedia'))

  for (const draft of draftStates) {
    let whereFailed = false
    if (where !== null) {
      try {
        await findReferencingLabels({
          collection: check.slug,
          where,
          labelField: check.labelField,
          draft,
          localized: check.localized,
          referencesByKey,
          req,
        })
      } catch {
        whereFailed = true
      }
    }

    if (needsInMemoryPathScan || whereFailed) {
      const localesToQuery = check.localized ? REVALIDATE_LOCALES : ([undefined] as const)
      for (const locale of localesToQuery) {
        const result = await req.payload.find({
          collection: check.slug,
          ...(locale ? { locale, fallbackLocale: false as const } : {}),
          limit: 100,
          depth: 0,
          draft,
          overrideAccess: true,
          req,
        })
        for (const doc of result.docs) {
          const matchedField = check.fieldPaths.some((path) =>
            uploadValueMatchesMediaId(getNestedValue(doc, path), targetId),
          )
          const matchedRichText = check.richTextPaths.some((rtPath) =>
            richTextReferencesMediaId(getNestedValue(doc, rtPath), targetId),
          )
          if (matchedField || matchedRichText) {
            recordReferencingDoc(referencesByKey, check.slug, doc, check.labelField)
          }
        }
      }
    }
  }
}

const preventMediaDeletionWhenReferenced: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const collectionsConfig = Object.values(req.payload.collections).map((c) => c.config)
  const collectionChecks = deriveCollectionTargetReferences(collectionsConfig, 'media')
  const globalChecks = deriveGlobalTargetReferences(req.payload.globals.config, 'media')

  const referencesByKey = new Map<string, string>()
  for (const check of collectionChecks) {
    await findCollectionTargetReferences({
      check,
      targetId: id,
      referencesByKey,
      req,
    })
  }

  for (const globalCheck of globalChecks) {
    const globalRefs = await findGlobalTargetReferences({
      slug: globalCheck.slug,
      fieldPaths: globalCheck.fieldPaths,
      richTextPaths: globalCheck.richTextPaths,
      versioned: globalCheck.versioned,
      targetId: id,
      req,
    })
    for (const item of globalRefs) {
      referencesByKey.set(item, item)
    }
  }

  if (referencesByKey.size > 0) {
    const refList = [...referencesByKey.values()].join(', ')
    throw createPublicAPIError(
      `لا يمكن حذف ملف الوسائط هذا لأنه مستخدم في سجلات أخرى (${refList}). يرجى إزالة الارتباط أولاً. / Cannot delete this media item because it is referenced by other record(s) (${refList}). Remove the reference first.`,
      400,
    )
  }
}

export const Media: CollectionConfig = withImmutableCreatedAt({
  slug: 'media',
  timestamps: true,
  labels: {
    singular: {
      ar: 'وسائط',
      en: 'Media',
    },
    plural: {
      ar: 'الوسائط',
      en: 'Media',
    },
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    group: {
      ar: 'الوسائط',
      en: 'Media',
    },
    description: {
      ar: 'مكتبة الصور المرفوعة للموقع (JPEG، PNG، WebP، AVIF بحد أقصى 10 ميجابايت). يتم توليد المقاسات المحسّنة بصيغة WebP تلقائياً.',
      en: 'Uploaded image library (JPEG, PNG, WebP, AVIF up to 10 MB). Automatically generates optimized WebP responsive sizes.',
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [validateUploadBeforeOperation],
    beforeDelete: [preventMediaDeletionWhenReferenced],
    afterChange: [createRevalidateAfterChangeHook({ collection: 'media' })],
    afterDelete: [createRevalidateAfterDeleteHook({ collection: 'media' })],
  },
  upload: {
    // Stored outside public/ at the validated absolute MEDIA_DIR path (default <cwd>/media in dev)
    staticDir: env.MEDIA_DIR,
    mimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    handlers: [createSafeUploadFileHandler(env.MEDIA_DIR)],
    focalPoint: true,
    formatOptions: {
      format: 'webp',
    },
    imageSizes: [
      {
        name: 'thumb',
        width: 400,
        withoutEnlargement: true,
        formatOptions: {
          format: 'webp',
        },
      },
      {
        name: 'card',
        width: 800,
        withoutEnlargement: true,
        formatOptions: {
          format: 'webp',
        },
      },
      {
        name: 'hero',
        width: 1920,
        withoutEnlargement: true,
        formatOptions: {
          format: 'webp',
        },
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: false,
        formatOptions: {
          format: 'webp',
        },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: {
        ar: 'النص البديل',
        en: 'Alt Text',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: {
        ar: 'التسمية التوضيحية',
        en: 'Caption',
      },
    },
  ],
})
