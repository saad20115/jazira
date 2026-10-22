import crypto from 'crypto'
import fs from 'fs/promises'
import { ValidationError } from 'payload'

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number]

export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB
export const MAX_VIDEO_REQUEST_SIZE_BYTES = 105 * 1024 * 1024 // 105 MB (100 MB video + multipart form fields overhead; matches planned Phase 6 Nginx client_max_body_size 105m for /api/videos)

const VIDEO_EXTENSION_BY_MIME: Record<AllowedVideoMimeType, 'mp4' | 'webm'> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

/**
 * Generates a randomized video filename whose extension is derived exclusively
 * from the magic-byte-verified MIME type (`<timestamp>-<16hex>.<mp4|webm>`).
 */
export function generateRandomizedVideoFilename(detectedMime: AllowedVideoMimeType): string {
  const ext = VIDEO_EXTENSION_BY_MIME[detectedMime]
  const randomHex = crypto.randomBytes(8).toString('hex')
  return `${String(Date.now())}-${randomHex}.${ext}`
}

const ALLOWED_MP4_FTYP_BRANDS = new Set([
  'isom',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'avc1',
  'dash',
  'M4V ',
  'MSNV',
  'mmp4',
])

/**
 * Inspects the magic bytes of a file buffer to determine its true image MIME type.
 * Returns null if the content is not a valid JPEG, PNG, WebP, or AVIF header.
 */
export function detectImageMimeFromMagicBytes(buffer: Uint8Array): AllowedImageMimeType | null {
  if (buffer.length < 12) {
    return null
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }

  // WebP: "RIFF" (52 49 46 46) at 0..3 and "WEBP" (57 45 42 50) at 8..11
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }

  // AVIF: ISO Base Media File Format ('ftyp' at bytes 4..7, brand 'avif' or 'avis')
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const headerSlice = Buffer.from(buffer.subarray(8, Math.min(buffer.length, 32))).toString(
      'ascii',
    )
    if (headerSlice.includes('avif') || headerSlice.includes('avis')) {
      return 'image/avif'
    }
  }

  return null
}

/**
 * Inspects the magic bytes of a file buffer to determine its true video MIME type.
 * Supports MP4 (ISO BMFF 'ftyp' with MP4 major/compatible brand) and WebM (EBML header with 'webm' DocType).
 */
export function detectVideoMimeFromMagicBytes(buffer: Uint8Array): AllowedVideoMimeType | null {
  if (buffer.length < 12) {
    return null
  }

  // MP4: ISO Base Media File Format ('ftyp' at bytes 4..7)
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const majorBrand = Buffer.from(buffer.subarray(8, 12)).toString('ascii')
    if (ALLOWED_MP4_FTYP_BRANDS.has(majorBrand)) {
      return 'video/mp4'
    }

    const boxSize = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]
    const maxOffset = Math.min(buffer.length, boxSize >= 16 ? boxSize : buffer.length, 64)

    for (let offset = 16; offset + 4 <= maxOffset; offset += 4) {
      const compatibleBrand = Buffer.from(buffer.subarray(offset, offset + 4)).toString('ascii')
      if (ALLOWED_MP4_FTYP_BRANDS.has(compatibleBrand)) {
        return 'video/mp4'
      }
    }
  }

  // WebM: EBML header (1A 45 DF A3 at bytes 0..3) containing 'webm' DocType
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    const headerSlice = Buffer.from(buffer.subarray(4, Math.min(buffer.length, 64))).toString(
      'ascii',
    )
    if (headerSlice.includes('webm')) {
      return 'video/webm'
    }
  }

  return null
}

/**
 * Sanitizes an upload filename:
 * - strips directory path segments (/ and \)
 * - removes control characters (0x00-0x1f, 0x7f-0x9f)
 * - strips leading dots (prevents dotfiles like .env or .htaccess)
 * - replaces unsafe characters with hyphens
 */
export function sanitizeUploadFilename(rawName: string): string {
  const normalizedSlashes = rawName.replace(/\\/g, '/')
  const base = normalizedSlashes.slice(normalizedSlashes.lastIndexOf('/') + 1)

  // Strip control characters and leading dots
  const withoutControls = base
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .replace(/^\.+/, '')
    .trim()

  if (!withoutControls) {
    return 'upload.bin'
  }

  const lastDot = withoutControls.lastIndexOf('.')
  const rawStem = lastDot > 0 ? withoutControls.slice(0, lastDot) : withoutControls
  const rawExt = lastDot > 0 ? withoutControls.slice(lastDot + 1) : ''

  const cleanStem =
    rawStem
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'upload'

  const cleanExt = rawExt.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase()

  return cleanExt ? `${cleanStem}.${cleanExt}` : cleanStem
}

export interface IncomingUploadFile {
  data?: Buffer
  mimetype: string
  name: string
  size: number
  tempFilePath?: string
  truncated?: boolean
}

async function readHeaderAndActualSize(
  file: IncomingUploadFile,
): Promise<{ actualSize: number; headerBuffer: Uint8Array }> {
  if (file.data && file.data.length > 0) {
    return {
      actualSize: Math.max(file.size, file.data.length),
      headerBuffer: file.data.subarray(0, 64),
    }
  }

  if (file.tempFilePath) {
    const stat = await fs.stat(file.tempFilePath)
    const handle = await fs.open(file.tempFilePath, 'r')
    try {
      const headerBuffer = Buffer.alloc(64)
      const { bytesRead } = await handle.read(headerBuffer, 0, 64, 0)
      return {
        actualSize: Math.max(file.size, stat.size),
        headerBuffer: headerBuffer.subarray(0, bytesRead),
      }
    } finally {
      await handle.close()
    }
  }

  return {
    actualSize: file.size,
    headerBuffer: Buffer.alloc(0),
  }
}

export async function validateAndSanitizeMediaFile(
  file: IncomingUploadFile,
): Promise<AllowedImageMimeType> {
  if (file.truncated || file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message: `File exceeds the maximum allowed size of 10 MB (${String(MAX_MEDIA_FILE_SIZE_BYTES)} bytes).`,
        },
      ],
    })
  }

  const { actualSize, headerBuffer } = await readHeaderAndActualSize(file)

  if (actualSize > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message: `File exceeds the maximum allowed size of 10 MB (${String(MAX_MEDIA_FILE_SIZE_BYTES)} bytes).`,
        },
      ],
    })
  }

  const detectedMime = detectImageMimeFromMagicBytes(headerBuffer)
  if (!detectedMime) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message:
            'Invalid file content: magic bytes do not match an allowed image format (image/jpeg, image/png, image/webp, image/avif). SVG and HTML uploads are forbidden.',
        },
      ],
    })
  }

  file.name = sanitizeUploadFilename(file.name)
  file.mimetype = detectedMime
  return detectedMime
}

export async function validateAndSanitizeVideoFile(
  file: IncomingUploadFile,
): Promise<AllowedVideoMimeType> {
  if (file.truncated || file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message: `Video file exceeds the maximum allowed size of 100 MB (${String(MAX_VIDEO_FILE_SIZE_BYTES)} bytes).`,
        },
      ],
    })
  }

  const { actualSize, headerBuffer } = await readHeaderAndActualSize(file)

  if (actualSize > MAX_VIDEO_FILE_SIZE_BYTES) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message: `Video file exceeds the maximum allowed size of 100 MB (${String(MAX_VIDEO_FILE_SIZE_BYTES)} bytes).`,
        },
      ],
    })
  }

  const detectedMime = detectVideoMimeFromMagicBytes(headerBuffer)
  if (!detectedMime) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message:
            'Invalid video content: magic bytes do not match an allowed video format (video/mp4, video/webm). Disguised HTML/SVG and other containers are forbidden.',
        },
      ],
    })
  }

  file.name = generateRandomizedVideoFilename(detectedMime)
  file.mimetype = detectedMime
  return detectedMime
}
