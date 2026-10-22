import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type CollectionSlug,
  type Where,
} from 'payload'

import { isAdminOrEditor } from '../access/index'
import { env } from '../env'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'
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

const findReferencingLabels = async ({
  collection,
  where,
  labelField,
  draft,
  req,
}: {
  collection: CollectionSlug
  where: Where
  labelField: string
  draft?: boolean
  req: Parameters<CollectionBeforeDeleteHook>[0]['req']
}): Promise<string[]> => {
  if (!(collection in req.payload.collections)) {
    return []
  }

  const result = await req.payload.find({
    collection,
    where,
    limit: 10,
    depth: 0,
    draft: draft ?? false,
    overrideAccess: true,
    req,
  })

  if (result.totalDocs === 0) {
    return []
  }

  return result.docs.map((doc) => {
    const record = doc as unknown as Record<string, unknown>
    const rawLabel = record[labelField]
    const labelText =
      typeof rawLabel === 'string' && rawLabel.trim().length > 0
        ? rawLabel.trim()
        : `#${String(doc.id)}`
    return `${collection}(${labelText})`
  })
}

const preventMediaDeletionWhenReferenced: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const checks: Array<{
    collection: CollectionSlug
    where: Where
    labelField: string
    versioned?: boolean
  }> = [
    {
      collection: 'team',
      where: { photo: { equals: id } },
      labelField: 'name',
    },
    {
      collection: 'services',
      where: {
        or: [{ image: { equals: id } }, { 'meta.image': { equals: id } }],
      },
      labelField: 'title',
      versioned: true,
    },
    {
      collection: 'projects',
      where: {
        or: [
          { coverImage: { equals: id } },
          { gallery: { equals: id } },
          { 'meta.image': { equals: id } },
        ],
      },
      labelField: 'title',
      versioned: true,
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

  const references = new Set<string>()
  for (const check of checks) {
    const publishedLabels = await findReferencingLabels({
      collection: check.collection,
      where: check.where,
      labelField: check.labelField,
      draft: false,
      req,
    })
    for (const item of publishedLabels) {
      references.add(item)
    }

    if (check.versioned) {
      const draftLabels = await findReferencingLabels({
        collection: check.collection,
        where: check.where,
        labelField: check.labelField,
        draft: true,
        req,
      })
      for (const item of draftLabels) {
        references.add(item)
      }
    }
  }

  if (references.size > 0) {
    const refList = [...references].join(', ')
    throw new APIError(
      `لا يمكن حذف ملف الوسائط هذا لأنه مستخدم في سجلات أخرى (${refList}). يرجى إزالة الارتباط أولاً. / Cannot delete this media item because it is referenced by other record(s) (${refList}). Remove the reference first.`,
      400,
      undefined,
      true,
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
