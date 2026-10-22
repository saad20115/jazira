import type { CollectionBeforeOperationHook, CollectionConfig } from 'payload'

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
