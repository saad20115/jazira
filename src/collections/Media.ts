import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { isAdminOrEditor } from '../access/index'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  validateAndSanitizeMediaFile,
} from '../security/uploadValidation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [
      async (hookArg) => {
        const { operation, req } = hookArg as unknown as {
          operation: string
          req: typeof hookArg.req
        }
        if ((operation === 'create' || operation === 'update') && req.file) {
          await validateAndSanitizeMediaFile(req.file)
        }
        return hookArg.args
      },
    ],
  },
  upload: {
    // Stored outside public/ so files are served through Payload's access-controlled handler
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
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
