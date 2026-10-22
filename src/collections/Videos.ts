import path from 'path'
import type {
  CollectionBeforeOperationHook,
  CollectionConfig,
  Endpoint,
  PayloadHandler,
} from 'payload'

import { isAdminOrEditor } from '../access/index'
import { env } from '../env'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_FILE_SIZE_BYTES,
  validateAndSanitizeVideoFile,
} from '../security/uploadValidation'

type ActiveBeforeOperationArg = Exclude<
  Parameters<CollectionBeforeOperationHook>[0],
  { operation: 'read' | 'readDistinct' }
>

const MAX_VIDEO_MULTIPART_STREAM_BYTES = 120 * 1024 * 1024 // 120 MB hard stream cap above the 100 MB file limit

const validateVideoUploadBeforeOperation: CollectionBeforeOperationHook = async (rawArg) => {
  const { args, operation, req } = rawArg as ActiveBeforeOperationArg
  if ((operation === 'create' || operation === 'update') && req.file) {
    await validateAndSanitizeVideoFile(req.file)
  }
  return args
}

/**
 * Wraps Payload's built-in collection endpoints (`POST /`, `PATCH /`, `PATCH /:id`)
 * for `videos` so that multipart parsing on `/api/videos` allows up to 100 MB per file
 * (`MAX_VIDEO_FILE_SIZE_BYTES`), while the global `upload.limits.fileSize` in
 * `src/payload.config.ts` remains 10 MB (`MAX_MEDIA_FILE_SIZE_BYTES`) for images.
 */
function createVideoUploadEndpoint(method: 'patch' | 'post', endpointPath: '/' | '/:id'): Endpoint {
  const handler: PayloadHandler = async (req) => {
    const scopedPayload = Object.create(req.payload, {
      config: {
        enumerable: true,
        value: {
          ...req.payload.config,
          upload: {
            ...req.payload.config.upload,
            abortOnLimit: false,
            limits: {
              ...req.payload.config.upload?.limits,
              fileSize: MAX_VIDEO_FILE_SIZE_BYTES,
            },
            requestSizeLimit: MAX_VIDEO_MULTIPART_STREAM_BYTES,
          },
        },
      },
    }) as typeof req.payload

    req.payload = scopedPayload

    const endpoints = req.payload.collections.videos?.config.endpoints
    const defaultEndpoint = Array.isArray(endpoints)
      ? endpoints.find(
          (ep) => ep.method === method && ep.path === endpointPath && ep.handler !== handler,
        )
      : undefined

    if (!defaultEndpoint) {
      return Response.json({ message: 'Endpoint not found' }, { status: 404 })
    }

    return defaultEndpoint.handler(req)
  }

  return {
    method,
    path: endpointPath,
    handler,
  }
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  timestamps: true,
  labels: {
    singular: {
      ar: 'فيديو',
      en: 'Video',
    },
    plural: {
      ar: 'الفيديوهات',
      en: 'Videos',
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'mimeType', 'filesize', 'updatedAt'],
    group: {
      ar: 'الوسائط',
      en: 'Media',
    },
    description: {
      ar: 'ملفات الفيديو المرفوعة مباشرة للموقع (بصيغة MP4 أو WebM وبحجم أقصى 100 ميجابايت) لاستخدامها في خلفية الصفحة الرئيسية أو صفحات المشاريع.',
      en: 'Self-hosted video files (MP4 or WebM, max 100 MB) used in the home hero background or project detail pages.',
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  endpoints: [
    createVideoUploadEndpoint('post', '/'),
    createVideoUploadEndpoint('patch', '/'),
    createVideoUploadEndpoint('patch', '/:id'),
  ],
  hooks: {
    beforeOperation: [validateVideoUploadBeforeOperation],
    afterChange: [createRevalidateAfterChangeHook({ collection: 'videos' })],
    afterDelete: [createRevalidateAfterDeleteHook({ collection: 'videos' })],
  },
  upload: {
    staticDir: path.join(env.MEDIA_DIR, 'videos'),
    mimeTypes: [...ALLOWED_VIDEO_MIME_TYPES],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 200,
      label: {
        ar: 'العنوان',
        en: 'Title',
      },
      admin: {
        description: {
          ar: 'عنوان وصفي للفيديو باللغتين العربية والإنجليزية.',
          en: 'Descriptive title for the video in Arabic and English.',
        },
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: {
        ar: 'صورة الغلاف (Poster)',
        en: 'Poster Image',
      },
      admin: {
        description: {
          ar: 'صورة مصغّرة اختيارية تظهر قبل بدء تشغيل الفيديو.',
          en: 'Optional thumbnail image displayed before video playback starts.',
        },
      },
    },
  ],
}
