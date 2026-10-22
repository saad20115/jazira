import {
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type CollectionSlug,
  type GlobalSlug,
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

const findReferencingLabels = async ({
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
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

const uploadValueMatchesMediaId = (raw: unknown, targetId: number | string): boolean => {
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

const findGlobalMediaReferences = async ({
  slug,
  uploadPaths,
  versioned,
  richTextBody,
  mediaId,
  req,
}: {
  slug: GlobalSlug
  uploadPaths: readonly string[]
  versioned?: boolean
  richTextBody?: boolean
  mediaId: number | string
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

      for (const path of uploadPaths) {
        if (uploadValueMatchesMediaId(getNestedValue(doc, path), mediaId)) {
          return [`global:${slug}`]
        }
      }

      if (
        richTextBody &&
        (uploadValueMatchesMediaId(doc.bodyMedia, mediaId) ||
          richTextReferencesMediaId(doc.body, mediaId))
      ) {
        return [`global:${slug}`]
      }
    }
  }

  return []
}

const preventMediaDeletionWhenReferenced: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const checks: Array<{
    collection: CollectionSlug
    where: Where
    labelField: string
    versioned?: boolean
    localized?: boolean
  }> = [
    {
      collection: 'team',
      where: { photo: { equals: id } },
      labelField: 'name',
    },
    {
      collection: 'services',
      where: {
        or: [
          { image: { equals: id } },
          { 'meta.image': { equals: id } },
          { bodyMedia: { equals: id } },
        ],
      },
      labelField: 'title',
      versioned: true,
      localized: true,
    },
    {
      collection: 'projects',
      where: {
        or: [
          { coverImage: { equals: id } },
          { gallery: { equals: id } },
          { 'meta.image': { equals: id } },
          { bodyMedia: { equals: id } },
        ],
      },
      labelField: 'title',
      versioned: true,
      localized: true,
    },
    {
      collection: 'brands',
      where: { logo: { equals: id } },
      labelField: 'name',
    },
    {
      collection: 'videos',
      where: { poster: { equals: id } },
      labelField: 'title',
    },
  ]

  const globalChecks: Array<{
    slug: GlobalSlug
    uploadPaths: readonly string[]
    versioned?: boolean
    richTextBody?: boolean
  }> = [
    {
      slug: 'site-settings',
      uploadPaths: ['office.mapImage', 'defaultSeo.image'],
    },
    {
      slug: 'home-page',
      uploadPaths: [
        'hero.background',
        'whoWeAre.image',
        'interactiveSystems.heroImage',
        'cta.backgroundImage',
        'meta.image',
      ],
      versioned: true,
    },
    {
      slug: 'services-page',
      uploadPaths: ['pageHeader.image', 'cta.backgroundImage', 'meta.image'],
      versioned: true,
    },
    {
      slug: 'about-page',
      uploadPaths: [
        'pageHeader.image',
        'story.image',
        'missionVision.mission.image',
        'missionVision.vision.image',
        'missionVision.image',
        'meta.image',
      ],
      versioned: true,
    },
    {
      slug: 'projects-page',
      uploadPaths: ['pageHeader.image', 'portfolio.image', 'cta.backgroundImage', 'meta.image'],
      versioned: true,
    },
    {
      slug: 'contact-page',
      uploadPaths: ['pageHeader.image', 'meta.image'],
      versioned: true,
    },
    {
      slug: 'privacy-page',
      uploadPaths: ['pageHeader.image', 'meta.image'],
      versioned: true,
      richTextBody: true,
    },
  ]

  const referencesByKey = new Map<string, string>()
  for (const check of checks) {
    await findReferencingLabels({
      collection: check.collection,
      where: check.where,
      labelField: check.labelField,
      draft: false,
      localized: check.localized,
      referencesByKey,
      req,
    })

    if (check.versioned) {
      await findReferencingLabels({
        collection: check.collection,
        where: check.where,
        labelField: check.labelField,
        draft: true,
        localized: check.localized,
        referencesByKey,
        req,
      })
    }
  }

  for (const globalCheck of globalChecks) {
    const globalRefs = await findGlobalMediaReferences({
      slug: globalCheck.slug,
      uploadPaths: globalCheck.uploadPaths,
      versioned: globalCheck.versioned,
      richTextBody: globalCheck.richTextBody,
      mediaId: id,
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

export const Media: CollectionConfig = {
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
}
