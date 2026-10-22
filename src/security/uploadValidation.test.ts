import { describe, expect, it } from 'vitest'

import {
  detectImageMimeFromMagicBytes,
  sanitizeUploadFilename,
  validateAndSanitizeMediaFile,
} from './uploadValidation'

describe('uploadValidation (I5)', () => {
  it('detects JPEG, PNG, WebP, and AVIF from magic bytes and rejects SVG/HTML', () => {
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ])
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ])
    const webpHeader = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'ascii')
    const avifHeader = Buffer.from('\x00\x00\x00\x1cftypavif\x00\x00\x00\x00avifmif1', 'ascii')
    const svgBuffer = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      'utf8',
    )
    const htmlBuffer = Buffer.from(
      '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>',
      'utf8',
    )

    expect(detectImageMimeFromMagicBytes(jpegHeader)).toBe('image/jpeg')
    expect(detectImageMimeFromMagicBytes(pngHeader)).toBe('image/png')
    expect(detectImageMimeFromMagicBytes(webpHeader)).toBe('image/webp')
    expect(detectImageMimeFromMagicBytes(avifHeader)).toBe('image/avif')
    expect(detectImageMimeFromMagicBytes(svgBuffer)).toBeNull()
    expect(detectImageMimeFromMagicBytes(htmlBuffer)).toBeNull()
  })

  it('sanitizes filenames by stripping paths, control chars, and leading dots', () => {
    expect(sanitizeUploadFilename('../../etc/passwd.jpg')).toBe('passwd.jpg')
    expect(sanitizeUploadFilename('..\\..\\secret\\.env.png')).toBe('env.png')
    expect(sanitizeUploadFilename('.hidden-file.webp')).toBe('hidden-file.webp')
    expect(sanitizeUploadFilename('bad\x00\x1fname!@#$.jpeg')).toBe('badname.jpeg')
  })

  it('rejects disguised HTML renamed .jpg in validateAndSanitizeMediaFile', async () => {
    const disguisedHtml = {
      name: 'exploit.jpg',
      mimetype: 'image/jpeg',
      size: 64,
      data: Buffer.from(
        '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>',
        'utf8',
      ),
    }

    await expect(validateAndSanitizeMediaFile(disguisedHtml)).rejects.toThrow(/file/i)
  })
})
