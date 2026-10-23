import crypto from 'crypto'
import fsSync from 'fs'
import fs from 'fs/promises'
import path from 'path'
import {
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type Endpoint,
  Forbidden,
  type PayloadHandler,
  ValidationError,
} from 'payload'

import { isAdminOrEditor } from '../access/index'
import { env } from '../env'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'
import { createPublicAPIError } from '../security/apiError'
import {
  ALLOWED_VIDEO_MIME_TYPES,
  collectRequestTempFilePaths,
  createSafeUploadFileHandler,
  MAX_VIDEO_FILE_SIZE_BYTES,
  MAX_VIDEO_REQUEST_SIZE_BYTES,
  validateAndSanitizeVideoFile,
} from '../security/uploadValidation'
import {
  deriveGlobalTargetReferences,
  findGlobalTargetReferences,
  findReferencingLabels,
} from './Media'

export const VIDEO_UPLOAD_INSTANCE_ID = crypto.randomBytes(6).toString('hex')

export const VIDEO_UPLOAD_TEMP_DIR = path.join(
  env.UPLOAD_TMP_DIR,
  `instance-${VIDEO_UPLOAD_INSTANCE_ID}`,
)

process.once('exit', () => {
  try {
    fsSync.rmSync(VIDEO_UPLOAD_TEMP_DIR, { recursive: true, force: true })
  } catch {
    // Best-effort cleanup on shutdown
  }
})

type ActiveBeforeOperationArg = Exclude<
  Parameters<CollectionBeforeOperationHook>[0],
  { operation: 'read' | 'readDistinct' }
>

const validateVideoUploadBeforeOperation: CollectionBeforeOperationHook = async (rawArg) => {
  const { args, operation, req } = rawArg as ActiveBeforeOperationArg
  if (operation === 'create' || operation === 'update') {
    const reqWithFiles = req as unknown as {
      file?: typeof req.file
      files?: Record<string, unknown>
    }
    if (reqWithFiles.files && typeof reqWithFiles.files === 'object') {
      const keys = Object.keys(reqWithFiles.files)
      if (
        keys.length > 1 ||
        (keys.length === 1 && keys[0] !== 'file') ||
        Array.isArray(reqWithFiles.files.file)
      ) {
        throw new ValidationError({
          errors: [
            {
              path: 'file',
              message: 'Only a single "file" upload field is allowed per request.',
            },
          ],
        })
      }
    }
    if (req.file) {
      await validateAndSanitizeVideoFile(req.file)
    }
  }
  return args
}

/**
 * Wraps Payload's built-in collection endpoints (`POST /`, `PATCH /`, `PATCH /:id`)
 * for `videos` so that:
 * 1. Unauthenticated / non-admin-or-editor callers are rejected with 403 (`Forbidden`)
 *    before `addDataAndFileToRequest` reads or buffers a single byte of the request body (R-2).
 * 2. Authenticated admin/editor uploads stream to temporary files on disk (`useTempFiles: true`)
 *    outside all served `staticDir` directories (`VIDEO_UPLOAD_TEMP_DIR`, R-11), capped at
 *    1 file part (`files: 1`, R-12), `MAX_VIDEO_FILE_SIZE_BYTES` inclusive (`fileSize: MAX + 1`, R-13),
 *    and `MAX_VIDEO_REQUEST_SIZE_BYTES` (105 MB, R-5).
 */
function createVideoUploadEndpoint(method: 'patch' | 'post', endpointPath: '/' | '/:id'): Endpoint {
  const handler: PayloadHandler = async (req) => {
    if (!isAdminOrEditor({ req })) {
      throw new Forbidden(req.t)
    }

    const requestTempDir = path.join(
      VIDEO_UPLOAD_TEMP_DIR,
      `${String(Date.now())}-${crypto.randomBytes(6).toString('hex')}`,
    )
    await fs.mkdir(requestTempDir, { recursive: true })

    const scopedPayload = Object.create(req.payload, {
      config: {
        enumerable: true,
        value: {
          ...req.payload.config,
          upload: {
            ...req.payload.config.upload,
            abortOnLimit: false,
            limits: {
              ...req.payload.config.upload.limits,
              files: 1,
              // Busboy sets `file.truncated = true` when bytesRead >= limits.fileSize,
              // so +1 allows an exact 100 MiB (104,857,600 bytes) file while truncating at 100 MiB + 1 (R-13).
              fileSize: MAX_VIDEO_FILE_SIZE_BYTES + 1,
            },
            requestSizeLimit: MAX_VIDEO_REQUEST_SIZE_BYTES,
            tempFileDir: requestTempDir,
            useTempFiles: true,
          },
        },
      },
    }) as typeof req.payload

    req.payload = scopedPayload

    const endpoints = req.payload.collections.videos.config.endpoints
    const defaultEndpoint = Array.isArray(endpoints)
      ? endpoints.find(
          (ep) => ep.method === method && ep.path === endpointPath && ep.handler !== handler,
        )
      : undefined

    if (!defaultEndpoint) {
      await fs.rm(requestTempDir, { recursive: true, force: true }).catch(() => undefined)
      await fs.rmdir(VIDEO_UPLOAD_TEMP_DIR).catch(() => undefined)
      return Response.json({ message: 'Endpoint not found' }, { status: 404 })
    }

    try {
      return await defaultEndpoint.handler(req)
    } finally {
      const tempPaths = collectRequestTempFilePaths(req)
      await Promise.all(tempPaths.map((p) => fs.unlink(p).catch(() => undefined)))
      await fs.rm(requestTempDir, { recursive: true, force: true }).catch(() => undefined)
      await fs.rmdir(VIDEO_UPLOAD_TEMP_DIR).catch(() => undefined)
    }
  }

  return {
    method,
    path: endpointPath,
    handler,
  }
}

const preventVideoDeletionWhenReferenced: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const referencesByKey = new Map<string, string>()

  for (const draft of [false, true] as const) {
    await findReferencingLabels({
      collection: 'projects',
      where: { video: { equals: id } },
      labelField: 'title',
      draft,
      localized: true,
      referencesByKey,
      req,
    })
  }

  const globalChecks = deriveGlobalTargetReferences(req.payload.globals.config, 'videos')
  for (const gCheck of globalChecks) {
    const found = await findGlobalTargetReferences({
      ...gCheck,
      targetId: id,
      req,
    })
    for (const ref of found) {
      referencesByKey.set(ref, ref)
    }
  }

  if (referencesByKey.size > 0) {
    const refList = [...referencesByKey.values()].join(', ')
    throw createPublicAPIError(
      `لا يمكن حذف هذا الفيديو لأنه مستخدم في: ${refList}. يرجى إزالة الارتباط أولاً. / Cannot delete this video because it is referenced by: ${refList}. Remove those references first.`,
      400,
    )
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
    beforeDelete: [preventVideoDeletionWhenReferenced],
    afterChange: [createRevalidateAfterChangeHook({ collection: 'videos' })],
    afterDelete: [createRevalidateAfterDeleteHook({ collection: 'videos' })],
  },
  upload: {
    staticDir: env.VIDEOS_DIR,
    mimeTypes: [...ALLOWED_VIDEO_MIME_TYPES],
    handlers: [createSafeUploadFileHandler(env.VIDEOS_DIR)],
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
