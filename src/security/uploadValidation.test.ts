import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config'
import { Media } from '../collections/Media'
import { Videos } from '../collections/Videos'
import {
  applyUploadFileSecurityHeaders,
  createSafeUploadFileHandler,
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

  it("adds Content-Security-Policy: default-src 'none'; sandbox and X-Content-Type-Options: nosniff to /api/:collection(media|videos)/file/:path* (A-10)", async () => {
    expect(typeof nextConfig.headers).toBe('function')
    if (!nextConfig.headers) {
      throw new Error('nextConfig.headers must be defined')
    }
    const headerRules = await nextConfig.headers()
    const fileHeaderRule = headerRules.find(
      (rule) => rule.source === '/api/:collection(media|videos)/file/:path*',
    )
    expect(fileHeaderRule).toBeDefined()
    expect(fileHeaderRule?.headers).toEqual(
      expect.arrayContaining([
        {
          key: 'Content-Security-Policy',
          value: "default-src 'none'; sandbox",
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ]),
    )

    const handler = createSafeUploadFileHandler('media')
    const res = await handler(
      {} as never,
      {
        doc: null,
        headers: new Headers(),
        params: { collection: 'media', filename: 'missing.jpg' },
      } as never,
    )
    expect(res).toBeInstanceOf(Response)
    expect((res as Response).headers.get('Content-Security-Policy')).toBe(
      "default-src 'none'; sandbox",
    )
    expect((res as Response).headers.get('X-Content-Type-Options')).toBe('nosniff')

    const modifiedHeaders = applyUploadFileSecurityHeaders({ headers: new Headers() })
    expect(modifiedHeaders.get('Content-Security-Policy')).toBe("default-src 'none'; sandbox")
    expect(modifiedHeaders.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('closes the upload bypass on Media and Videos: disables pasteURL and rejects create/update JSON { url, filename } payloads when req.file is absent (A-02)', async () => {
    expect(typeof Media.upload).toBe('object')
    expect(typeof Videos.upload).toBe('object')
    expect((Media.upload as { pasteURL?: unknown }).pasteURL).toBe(false)
    expect((Videos.upload as { pasteURL?: unknown }).pasteURL).toBe(false)

    const runBeforeOperation = async (
      hooks: NonNullable<typeof Media.hooks>['beforeOperation'],
      arg: {
        args: { data: Record<string, unknown> }
        operation: 'create' | 'update'
        req: { data: Record<string, unknown> }
      },
    ) => {
      for (const hook of hooks ?? []) {
        await hook(arg as never)
      }
    }

    // 1. Create without req.file must throw ValidationError on both Media and Videos
    await expect(
      runBeforeOperation(Media.hooks?.beforeOperation, {
        args: {
          data: { url: 'http://127.0.0.1:9999/ssrf.jpg', filename: 'ssrf.jpg', alt: 'ssrf' },
        },
        operation: 'create',
        req: {
          data: { url: 'http://127.0.0.1:9999/ssrf.jpg', filename: 'ssrf.jpg', alt: 'ssrf' },
        },
      }),
    ).rejects.toThrow(/file/i)

    await expect(
      runBeforeOperation(Videos.hooks?.beforeOperation, {
        args: {
          data: { url: 'http://127.0.0.1:9999/ssrf.mp4', filename: 'ssrf.mp4', title: 'ssrf' },
        },
        operation: 'create',
        req: {
          data: { url: 'http://127.0.0.1:9999/ssrf.mp4', filename: 'ssrf.mp4', title: 'ssrf' },
        },
      }),
    ).rejects.toThrow(/file/i)

    // 2. Update without req.file that attempts to pass url or filename in args.data or req.data must throw ValidationError
    await expect(
      runBeforeOperation(Media.hooks?.beforeOperation, {
        args: { data: { alt: 'updated' } },
        operation: 'update',
        req: {
          data: { url: 'http://127.0.0.1:9999/ssrf.jpg', filename: 'ssrf.jpg', alt: 'updated' },
        },
      }),
    ).rejects.toThrow(/file/i)

    await expect(
      runBeforeOperation(Videos.hooks?.beforeOperation, {
        args: { data: { title: 'updated' } },
        operation: 'update',
        req: {
          data: { url: 'http://127.0.0.1:9999/ssrf.mp4', filename: 'ssrf.mp4', title: 'updated' },
        },
      }),
    ).rejects.toThrow(/file/i)
  })
})
