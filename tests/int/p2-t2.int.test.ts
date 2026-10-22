import fs from 'fs/promises'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://aljazira_app:dev_only_local_pg_password_change_me@127.0.0.1:5434/aljazira_test'
process.env.PAYLOAD_SECRET = 'test_payload_secret_with_at_least_forty_eight_random_bytes_1234567890'
process.env.IP_HASH_SALT = 'test_ip_hash_salt_with_at_least_forty_eight_random_bytes_1234567890ab'
process.env.SERVER_URL = 'http://localhost:3000'
process.env.MEDIA_DIR = path.resolve(process.cwd(), 'tmp-test-media-p2-t2')
process.env.VIDEOS_DIR = path.resolve(process.cwd(), 'tmp-test-videos-p2-t2')

type RouteHandler = (
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
) => Promise<Response>

let payload: Payload
let restGet: RouteHandler
let restPost: RouteHandler
let restPatch: RouteHandler
let restDelete: RouteHandler
let adminToken = ''
let editorToken = ''

async function callJsonApi(options: {
  body?: unknown
  cookie?: string
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST'
  slug: string[]
}): Promise<{ body: Record<string, unknown>; response: Response; status: number }> {
  const url = `http://localhost:3000/api/${options.slug.join('/')}`
  const headers = new Headers()
  headers.set('Origin', 'http://localhost:3000')
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.cookie) {
    headers.set('Cookie', options.cookie)
    const tokenMatch = /^payload-token=(.+)$/.exec(options.cookie)
    if (tokenMatch?.[1]) {
      headers.set('Authorization', `JWT ${tokenMatch[1]}`)
    }
  }

  const request = new Request(url, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const handler =
    options.method === 'GET'
      ? restGet
      : options.method === 'POST'
        ? restPost
        : options.method === 'PATCH'
          ? restPatch
          : restDelete

  const response = await handler(request, {
    params: Promise.resolve({ slug: options.slug }),
  })
  const text = await response.text()
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(text) as Record<string, unknown>
  } catch {
    parsed = { raw: text }
  }

  return {
    response,
    status: response.status,
    body: parsed,
  }
}

async function callUploadApi(options: {
  collectionSlug: 'media' | 'videos'
  cookie?: string
  fileBuffer: Buffer
  filename: string
  mimeType: string
  payloadFields: Record<string, unknown>
}): Promise<{ body: Record<string, unknown>; status: number }> {
  const formData = new FormData()
  formData.set('_payload', JSON.stringify(options.payloadFields))
  formData.set(
    'file',
    new Blob([new Uint8Array(options.fileBuffer)], { type: options.mimeType }),
    options.filename,
  )

  const headers = new Headers()
  headers.set('Origin', 'http://localhost:3000')
  if (options.cookie) {
    headers.set('Cookie', options.cookie)
    const tokenMatch = /^payload-token=(.+)$/.exec(options.cookie)
    if (tokenMatch?.[1]) {
      headers.set('Authorization', `JWT ${tokenMatch[1]}`)
    }
  }

  const request = new Request(`http://localhost:3000/api/${options.collectionSlug}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  const response = await restPost(request, {
    params: Promise.resolve({ slug: [options.collectionSlug] }),
  })
  const body = (await response.json()) as Record<string, unknown>
  return {
    status: response.status,
    body,
  }
}

function createValidMp4Buffer(sizeBytes: number): Buffer {
  const ftypBox = Buffer.from('\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2mp41', 'binary')
  const totalSize = Math.max(sizeBytes, 32)
  const buf = Buffer.alloc(totalSize, 0)
  ftypBox.copy(buf, 0)
  buf.writeUInt32BE(totalSize - 24, 24)
  buf.write('mdat', 28, 'ascii')
  return buf
}

function createPolyglotMp4BufferWithFreeBoxScript(): Buffer {
  const ftypBox = Buffer.from('\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41', 'binary')
  const scriptPayload = Buffer.from('<script>alert(1)</script>', 'utf8')
  const freeBoxSize = 8 + scriptPayload.length
  const freeBox = Buffer.alloc(freeBoxSize)
  freeBox.writeUInt32BE(freeBoxSize, 0)
  freeBox.write('free', 4, 'ascii')
  scriptPayload.copy(freeBox, 8)
  const mdatBox = Buffer.from('\x00\x00\x00\x10mdat\x00\x00\x00\x00\x00\x00\x00\x00', 'binary')
  return Buffer.concat([ftypBox, freeBox, mdatBox])
}

describe('P2-T2 integration suite (videos, brands, stats, materials)', () => {
  beforeAll(async () => {
    const mediaDir = process.env.MEDIA_DIR ?? ''
    const videosDir = process.env.VIDEOS_DIR ?? ''
    await fs.rm(mediaDir, { recursive: true, force: true })
    await fs.rm(videosDir, { recursive: true, force: true })
    await fs.mkdir(mediaDir, { recursive: true })
    await fs.mkdir(videosDir, { recursive: true })

    const configModule = await import('../../src/payload.config')
    const routesModule = await import('@payloadcms/next/routes')

    restGet = routesModule.REST_GET(configModule.default)
    restPost = routesModule.REST_POST(configModule.default)
    restPatch = routesModule.REST_PATCH(configModule.default)
    restDelete = routesModule.REST_DELETE(configModule.default)

    payload = await getPayload({ config: configModule.default })

    await payload.db.migrateFresh({ forceAcceptWarning: true })

    // Create first admin user
    const firstReg = await callJsonApi({
      method: 'POST',
      slug: ['users', 'first-register'],
      body: {
        email: 'admin-p2t2@aljazira.co',
        password: 'Str0ng!Admin#Pass2026_OK',
        name: 'System Admin',
      },
    })
    expect(firstReg.status).toBe(200)
    adminToken = firstReg.body.token as string

    // Create editor user
    const editorCreate = await callJsonApi({
      method: 'POST',
      slug: ['users'],
      cookie: `payload-token=${adminToken}`,
      body: {
        email: 'editor-p2t2@aljazira.co',
        password: 'Str0ng!Editor#Pass2026_OK',
        name: 'Content Editor',
      },
    })
    expect(editorCreate.status).toBe(201)

    const editorLogin = await callJsonApi({
      method: 'POST',
      slug: ['users', 'login'],
      body: {
        email: 'editor-p2t2@aljazira.co',
        password: 'Str0ng!Editor#Pass2026_OK',
      },
    })
    expect(editorLogin.status).toBe(200)
    editorToken = editorLogin.body.token as string
  }, 120_000)

  afterAll(async () => {
    await payload.destroy()
    if (process.env.MEDIA_DIR) {
      await fs.rm(process.env.MEDIA_DIR, { recursive: true, force: true })
    }
    if (process.env.VIDEOS_DIR) {
      await fs.rm(process.env.VIDEOS_DIR, { recursive: true, force: true })
    }
  })

  it('allows anonymous public GET on videos, brands, stats, and materials, and blocks anonymous writes with 403 without buffering large bodies (Z1, R-2)', async () => {
    for (const slug of ['videos', 'brands', 'stats', 'materials'] as const) {
      const getRes = await callJsonApi({
        method: 'GET',
        slug: [slug],
      })
      expect(getRes.status).toBe(200)

      const postRes = await callJsonApi({
        method: 'POST',
        slug: [slug],
        body: { title: 'Anon Attempt' },
      })
      expect(postRes.status).toBe(403)
    }

    const anonVideoUpload = await callUploadApi({
      collectionSlug: 'videos',
      filename: 'anon.mp4',
      mimeType: 'video/mp4',
      fileBuffer: createValidMp4Buffer(1024),
      payloadFields: { title: 'Anon Video' },
    })
    expect(anonVideoUpload.status).toBe(403)

    // R-2: Verify anonymous 99 MB multipart POST to /api/videos is rejected with 403 immediately (< 500ms) with 0 bytes read from the stream
    const ninetyNineMb = 99 * 1024 * 1024
    let bytesReadFromAnonStream = 0
    const trackedAnonStream = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          const chunk = new Uint8Array(64 * 1024)
          bytesReadFromAnonStream += chunk.byteLength
          controller.enqueue(chunk)
        },
      },
      { highWaterMark: 0 },
    )

    const anonLargeHeaders = new Headers({
      'Content-Length': String(ninetyNineMb),
      'Content-Type': 'multipart/form-data; boundary=----AnonLargeBoundary',
      Origin: 'http://localhost:3000',
    })

    const startAnonLarge = performance.now()
    const anonLargeReq = new Request('http://localhost:3000/api/videos', {
      method: 'POST',
      headers: anonLargeHeaders,
      body: trackedAnonStream,
      duplex: 'half',
    } as RequestInit)
    const anonLargeRes = await restPost(anonLargeReq, {
      params: Promise.resolve({ slug: ['videos'] }),
    })
    const elapsedAnonLargeMs = performance.now() - startAnonLarge

    expect(anonLargeRes.status).toBe(403)
    expect(anonLargeReq.bodyUsed).toBe(false)
    expect(bytesReadFromAnonStream).toBe(0)
    expect(elapsedAnonLargeMs).toBeLessThan(500)
  })

  it('enforces per-collection upload limits, randomizes video filenames to <timestamp>-<16hex>.<mp4|webm> (R-1), isolates VIDEOS_DIR from MEDIA_DIR (R-6), rejects 101 MB MP4, and rejects disguised HTML (I5, R-9)', async () => {
    // 1. Valid MP4 (12 MB — larger than the 10 MB global media limit, proving per-collection 100 MB limit on /api/videos)
    const twelveMbMp4 = createValidMp4Buffer(12 * 1024 * 1024)
    const validVideoRes = await callUploadApi({
      collectionSlug: 'videos',
      cookie: `payload-token=${editorToken}`,
      filename: 'hero-12mb.mp4',
      mimeType: 'video/mp4',
      fileBuffer: twelveMbMp4,
      payloadFields: { title: 'فيديو الواجهة الرئيسية' },
    })
    expect(validVideoRes.status).toBe(201)
    const videoDoc = validVideoRes.body.doc as {
      filename: string
      filesize: number
      id: number
      mimeType: string
      title: string
    }
    expect(videoDoc.mimeType).toBe('video/mp4')
    expect(videoDoc.filesize).toBe(12 * 1024 * 1024)
    expect(videoDoc.title).toBe('فيديو الواجهة الرئيسية')
    expect(videoDoc.filename).toMatch(/^\d+-[0-9a-f]{16}\.mp4$/)

    // R-6: Verify file is stored in VIDEOS_DIR and cannot be fetched via /api/media/file/
    const storedVideoPath = path.join(process.env.VIDEOS_DIR ?? '', videoDoc.filename)
    const storedStat = await fs.stat(storedVideoPath)
    expect(storedStat.size).toBe(12 * 1024 * 1024)
    const mediaCrossRouteRes = await callJsonApi({
      method: 'GET',
      slug: ['media', 'file', `videos%2F${videoDoc.filename}`],
    })
    expect(mediaCrossRouteRes.status).toBeGreaterThanOrEqual(400)
    expect(mediaCrossRouteRes.status).not.toBe(200)

    // R-1: Uploading valid MP4 (including polyglot with <script> in a 'free' box) as plain.html, plain.svg, vpoly.html, or noext stores as <timestamp>-<16hex>.mp4
    const polyglotMp4 = createPolyglotMp4BufferWithFreeBoxScript()
    for (const dangerousFilename of ['plain.html', 'plain.svg', 'vpoly.html', 'noext']) {
      const polyRes = await callUploadApi({
        collectionSlug: 'videos',
        cookie: `payload-token=${editorToken}`,
        filename: dangerousFilename,
        mimeType: 'text/html',
        fileBuffer: polyglotMp4,
        payloadFields: { title: `Test ${dangerousFilename}` },
      })
      expect(polyRes.status).toBe(201)
      const polyDoc = polyRes.body.doc as { filename: string; mimeType: string }
      expect(polyDoc.mimeType).toBe('video/mp4')
      expect(polyDoc.filename).toMatch(/^\d+-[0-9a-f]{16}\.mp4$/)
      expect(polyDoc.filename).not.toContain('html')
      expect(polyDoc.filename).not.toContain('svg')
    }

    // 2. Verify that /api/media still enforces the 10 MB global image limit with 413 (R-9)
    const elevenMbJpeg = Buffer.alloc(11 * 1024 * 1024, 0)
    elevenMbJpeg[0] = 0xff
    elevenMbJpeg[1] = 0xd8
    elevenMbJpeg[2] = 0xff
    const oversizedImageRes = await callUploadApi({
      collectionSlug: 'media',
      cookie: `payload-token=${editorToken}`,
      filename: 'too-big-11mb.jpg',
      mimeType: 'image/jpeg',
      fileBuffer: elevenMbJpeg,
      payloadFields: { alt: 'Too big image' },
    })
    expect(oversizedImageRes.status).toBe(413)

    // 3. Rejects 101 MB MP4 on /api/videos
    const hundredAndOneMbMp4 = createValidMp4Buffer(101 * 1024 * 1024)
    const oversizedVideoRes = await callUploadApi({
      collectionSlug: 'videos',
      cookie: `payload-token=${editorToken}`,
      filename: 'oversized-101mb.mp4',
      mimeType: 'video/mp4',
      fileBuffer: hundredAndOneMbMp4,
      payloadFields: { title: 'فيديو كبير جداً' },
    })
    expect(oversizedVideoRes.status).toBe(400)

    // 4. Rejects disguised HTML renamed .mp4 on /api/videos
    const disguisedHtmlMp4 = await callUploadApi({
      collectionSlug: 'videos',
      cookie: `payload-token=${editorToken}`,
      filename: 'disguised.mp4',
      mimeType: 'video/mp4',
      fileBuffer: Buffer.from(
        '<!DOCTYPE html><html><body><script>alert("xss")</script></body></html>',
        'utf8',
      ),
      payloadFields: { title: 'Disguised HTML' },
    })
    expect(disguisedHtmlMp4.status).toBe(400)
  }, 60_000)

  it('allows editor CRUD on stats, brands, and materials, validates brand website scheme, and blocks deleting a brand referenced by materials', async () => {
    // 1. Editor creates a stat
    const statCreate = await callJsonApi({
      method: 'POST',
      slug: ['stats'],
      cookie: `payload-token=${editorToken}`,
      body: {
        value: '45+',
        label: 'عاماً من الخبرة الهندسية',
        order: 1,
      },
    })
    expect(statCreate.status).toBe(201)
    const statId = (statCreate.body.doc as { id: number }).id

    // Editor updates the stat
    const statUpdate = await callJsonApi({
      method: 'PATCH',
      slug: ['stats', String(statId)],
      cookie: `payload-token=${editorToken}`,
      body: {
        value: '46+',
      },
    })
    expect(statUpdate.status).toBe(200)
    expect((statUpdate.body.doc as { value: string }).value).toBe('46+')

    // 2. Editor attempts to create a brand with a javascript: website URL -> rejected (400)
    const badBrand = await callJsonApi({
      method: 'POST',
      slug: ['brands'],
      cookie: `payload-token=${editorToken}`,
      body: {
        name: 'Evil Brand',
        website: 'javascript:alert(1)',
      },
    })
    expect(badBrand.status).toBe(400)

    // 3. Editor creates a valid brand
    const brandCreate = await callJsonApi({
      method: 'POST',
      slug: ['brands'],
      cookie: `payload-token=${editorToken}`,
      body: {
        name: 'Schneider Electric',
        origin: 'فرنسا',
        website: 'https://www.se.com',
        showInMarquee: true,
        order: 1,
      },
    })
    expect(brandCreate.status).toBe(201)
    const brandId = (brandCreate.body.doc as { id: number }).id

    // 3b. R-7 & R-8: Rejects non-existent brand ID with 400 (not 500 FK violation) and non-integer itemNo (4.5) with 400
    const missingBrandMaterial = await callJsonApi({
      method: 'POST',
      slug: ['materials'],
      cookie: `payload-token=${editorToken}`,
      body: {
        itemNo: 99,
        system: 'electrical',
        description: 'Material with non-existent brand',
        brands: [999999],
      },
    })
    expect(missingBrandMaterial.status).toBe(400)

    const floatItemNoMaterial = await callJsonApi({
      method: 'POST',
      slug: ['materials'],
      cookie: `payload-token=${editorToken}`,
      body: {
        itemNo: 4.5,
        system: 'electrical',
        description: 'Material with float itemNo',
        brands: [brandId],
      },
    })
    expect(floatItemNoMaterial.status).toBe(400)

    // 4. Editor creates an approved material referencing the brand
    const materialCreate = await callJsonApi({
      method: 'POST',
      slug: ['materials'],
      cookie: `payload-token=${editorToken}`,
      body: {
        itemNo: 1,
        system: 'electrical',
        description: 'لوحات التوزيع الرئيسية والثانوية (LV Switchgear & Panelboards)',
        brands: [brandId],
        notes: 'معتمد وفق مواصفات الشركة السعودية للكهرباء',
      },
    })
    expect(materialCreate.status).toBe(201)
    const materialId = (materialCreate.body.doc as { id: number }).id

    // 5. Deleting the brand while referenced by the material is blocked with a clear Arabic/English message
    const blockedDelete = await callJsonApi({
      method: 'DELETE',
      slug: ['brands', String(brandId)],
      cookie: `payload-token=${adminToken}`,
    })
    expect(blockedDelete.status).toBe(400)
    const errText = JSON.stringify(blockedDelete.body)
    expect(errText).toContain('لا يمكن حذف هذه العلامة التجارية')
    expect(errText).toContain('Cannot delete this brand')
    expect(errText).toContain('#1')

    // 6. After deleting the referencing material, deleting the brand succeeds
    const materialDelete = await callJsonApi({
      method: 'DELETE',
      slug: ['materials', String(materialId)],
      cookie: `payload-token=${editorToken}`,
    })
    expect(materialDelete.status).toBe(200)

    const brandDelete = await callJsonApi({
      method: 'DELETE',
      slug: ['brands', String(brandId)],
      cookie: `payload-token=${editorToken}`,
    })
    expect(brandDelete.status).toBe(200)

    const statDelete = await callJsonApi({
      method: 'DELETE',
      slug: ['stats', String(statId)],
      cookie: `payload-token=${editorToken}`,
    })
    expect(statDelete.status).toBe(200)
  })
})
