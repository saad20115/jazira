import { describe, expect, it } from 'vitest'

import {
  detectImageMimeFromMagicBytes,
  detectVideoMimeFromMagicBytes,
  MAX_VIDEO_FILE_SIZE_BYTES,
  sanitizeUploadFilename,
  validateAndSanitizeMediaFile,
  validateAndSanitizeVideoFile,
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

  it('detects MP4 and WebM from magic bytes and rejects AVIF, Matroska MKV, SVG, and HTML', () => {
    const mp4Header = Buffer.from('\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2mp41', 'binary')
    const webmHeader = Buffer.from(
      [
        0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2,
        0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d,
      ], // EBML + DocType 'webm'
    )
    const mkvHeader = Buffer.from(
      [
        0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x88, 0x6d, 0x61, 0x74, 0x72, 0x6f, 0x73, 0x6b,
        0x61,
      ], // EBML + DocType 'matroska'
    )
    const avifHeader = Buffer.from('\x00\x00\x00\x1cftypavif\x00\x00\x00\x00avifmif1', 'ascii')
    const htmlBuffer = Buffer.from(
      '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>',
      'utf8',
    )

    expect(detectVideoMimeFromMagicBytes(mp4Header)).toBe('video/mp4')
    expect(detectVideoMimeFromMagicBytes(webmHeader)).toBe('video/webm')
    expect(detectVideoMimeFromMagicBytes(mkvHeader)).toBeNull()
    expect(detectVideoMimeFromMagicBytes(avifHeader)).toBeNull()
    expect(detectVideoMimeFromMagicBytes(htmlBuffer)).toBeNull()
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

  it('randomizes video filenames to <timestamp>-<16hex>.<mp4|webm> derived strictly from detected magic bytes, ignoring .html/.svg/no-ext client names (R-1)', async () => {
    const mp4Bytes = Buffer.from('\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2mp41', 'binary')
    const webmBytes = Buffer.from([
      0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2,
      0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d,
    ])

    for (const dangerousName of ['../../hero-clip.mp4', 'plain.html', 'plain.svg', 'noext']) {
      const candidate = {
        name: dangerousName,
        mimetype: 'text/html',
        size: mp4Bytes.length,
        data: mp4Bytes,
      }
      await expect(validateAndSanitizeVideoFile(candidate)).resolves.toBe('video/mp4')
      expect(candidate.name).toMatch(/^\d+-[0-9a-f]{16}\.mp4$/)
      expect(candidate.mimetype).toBe('video/mp4')
    }

    const webmAsHtml = {
      name: 'vpoly.html',
      mimetype: 'text/html',
      size: webmBytes.length,
      data: webmBytes,
    }
    await expect(validateAndSanitizeVideoFile(webmAsHtml)).resolves.toBe('video/webm')
    expect(webmAsHtml.name).toMatch(/^\d+-[0-9a-f]{16}\.webm$/)
    expect(webmAsHtml.mimetype).toBe('video/webm')

    const oversizedMp4 = {
      name: 'huge.mp4',
      mimetype: 'video/mp4',
      size: MAX_VIDEO_FILE_SIZE_BYTES + 1024 * 1024, // 101 MB
      data: mp4Bytes,
    }
    await expect(validateAndSanitizeVideoFile(oversizedMp4)).rejects.toThrow(/file/i)

    const disguisedHtmlMp4 = {
      name: 'exploit.mp4',
      mimetype: 'video/mp4',
      size: 64,
      data: Buffer.from(
        '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>',
        'utf8',
      ),
    }
    await expect(validateAndSanitizeVideoFile(disguisedHtmlMp4)).rejects.toThrow(/file/i)
  })
})
