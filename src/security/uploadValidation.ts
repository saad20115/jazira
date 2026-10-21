import fs from 'fs/promises'
import { ValidationError } from 'payload'

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const MAX_MEDIA_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

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
}

export async function validateAndSanitizeMediaFile(
  file: IncomingUploadFile,
): Promise<AllowedImageMimeType> {
  if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message: `File exceeds the maximum allowed size of 10 MB (${String(MAX_MEDIA_FILE_SIZE_BYTES)} bytes).`,
        },
      ],
    })
  }

  const buffer =
    file.data && file.data.length > 0
      ? file.data
      : file.tempFilePath
        ? await fs.readFile(file.tempFilePath)
        : Buffer.alloc(0)

  if (buffer.length > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new ValidationError({
      errors: [
        {
          path: 'file',
          message: `File exceeds the maximum allowed size of 10 MB (${String(MAX_MEDIA_FILE_SIZE_BYTES)} bytes).`,
        },
      ],
    })
  }

  const detectedMime = detectImageMimeFromMagicBytes(buffer)
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
