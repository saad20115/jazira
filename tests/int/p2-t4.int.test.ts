import fs from 'fs/promises'
import * as nextCache from 'next/cache'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/cache')>()
  return {
    ...actual,
    revalidatePath: vi.fn(actual.revalidatePath),
    revalidateTag: vi.fn(actual.revalidateTag),
  }
})

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://aljazira_app:dev_only_local_pg_password_change_me@127.0.0.1:5434/aljazira_test'
process.env.PAYLOAD_SECRET = 'test_payload_secret_with_at_least_forty_eight_random_bytes_1234567890'
process.env.IP_HASH_SALT = 'test_ip_hash_salt_with_at_least_forty_eight_random_bytes_1234567890ab'
process.env.SERVER_URL = 'http://localhost:3000'
process.env.MEDIA_DIR = path.resolve(process.cwd(), 'tmp-test-media-p2-t4')
process.env.VIDEOS_DIR = path.resolve(process.cwd(), 'tmp-test-videos-p2-t4')

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
let adminUserId: number | string
let editorCookie = ''
let uploadedMediaId: number | string
let uploadedVideoId: number | string

// Minimal valid MP4 header bytes (`ftypisom`) for video upload tests
function createMinimalMp4Buffer(sizeBytes = 64): Buffer {
  const buf = Buffer.alloc(Math.max(sizeBytes, 32), 0)
  buf.writeUInt32BE(24, 0)
  buf.write('ftyp', 4, 'ascii')
  buf.write('isom', 8, 'ascii')
  buf.writeUInt32BE(512, 12)
  buf.write('isom', 16, 'ascii')
  buf.write('iso2', 20, 'ascii')
  return buf
}

async function callJsonApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  urlPath: string,
  options: {
    body?: Record<string, unknown>
    cookie?: string
    headers?: Record<string, string>
  } = {},
): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = new URL(urlPath, 'http://localhost:3000')
  const slug = url.pathname
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)

  const headers = new Headers(options.headers)
  headers.set('Origin', 'http://localhost:3000')
  if (options.body !== undefined) {
    headers.set('content-type', 'application/json')
  }
  if (options.cookie) {
    headers.set('cookie', options.cookie)
    const tokenMatch = /^payload-token=(.+)$/.exec(options.cookie)
    if (tokenMatch?.[1]) {
      headers.set('Authorization', `JWT ${tokenMatch[1]}`)
    }
  }

  const req = new Request(url.toString(), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const routeParams = { params: Promise.resolve({ slug }) }
  let res: Response
  if (method === 'GET') {
    res = await restGet(req, routeParams)
  } else if (method === 'POST') {
    res = await restPost(req, routeParams)
  } else if (method === 'PATCH') {
    res = await restPatch(req, routeParams)
  } else {
    res = await restDelete(req, routeParams)
  }

  const text = await res.text()
  let data: Record<string, unknown> = {}
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      data = { raw: text }
    }
  }
  return { status: res.status, data }
}

async function callMultipartApi(
  method: 'POST' | 'PATCH',
  urlPath: string,
  formData: FormData,
  options: {
    cookie?: string
  } = {},
): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = new URL(urlPath, 'http://localhost:3000')
  const slug = url.pathname
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)

  const headers = new Headers()
  headers.set('Origin', 'http://localhost:3000')
  if (options.cookie) {
    headers.set('cookie', options.cookie)
    const tokenMatch = /^payload-token=(.+)$/.exec(options.cookie)
    if (tokenMatch?.[1]) {
      headers.set('Authorization', `JWT ${tokenMatch[1]}`)
    }
  }

  const req = new Request(url.toString(), {
    method,
    headers,
    body: formData,
  })

  const routeParams = { params: Promise.resolve({ slug }) }
  const res =
    method === 'POST' ? await restPost(req, routeParams) : await restPatch(req, routeParams)
  const text = await res.text()
  let data: Record<string, unknown> = {}
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      data = { raw: text }
    }
  }
  return { status: res.status, data }
}

describe('P2-T4 integration suite (projects)', () => {
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

    const firstReg = await callJsonApi('POST', '/api/users/first-register', {
      body: {
        email: 'admin-p2t4@aljazira.co',
        password: 'Str0ng!Admin#Pass2026_OK',
        name: 'مدير المشاريع',
      },
    })
    expect(firstReg.status).toBe(200)
    adminToken = firstReg.data.token as string
    adminUserId = (firstReg.data.user as { id: number | string }).id

    const editorEmail = 'editor-p2t4@aljazira.co'
    const editorPassword = 'ValidEditorPassword!2026'

    const editorCreate = await callJsonApi('POST', '/api/users', {
      cookie: `payload-token=${adminToken}`,
      body: {
        name: 'محرر المشاريع',
        email: editorEmail,
        password: editorPassword,
      },
    })
    expect(editorCreate.status).toBe(201)

    const loginRes = await callJsonApi('POST', '/api/users/login', {
      body: {
        email: editorEmail,
        password: editorPassword,
      },
    })
    expect(loginRes.status).toBe(200)
    editorCookie = `payload-token=${String(loginRes.data.token)}`

    const pngBuffer = await sharp({
      create: {
        width: 80,
        height: 60,
        channels: 3,
        background: { r: 50, g: 57, b: 160 },
      },
    })
      .png()
      .toBuffer()

    const mediaForm = new FormData()
    mediaForm.set(
      '_payload',
      JSON.stringify({
        alt: 'صورة غلاف مشروع اختباري',
      }),
    )
    mediaForm.set(
      'file',
      new File([new Uint8Array(pngBuffer)], 'project-cover.png', { type: 'image/png' }),
    )
    const mediaRes = await callMultipartApi('POST', '/api/media', mediaForm, {
      cookie: editorCookie,
    })
    expect(mediaRes.status).toBe(201)
    uploadedMediaId = (mediaRes.data.doc as { id: number | string }).id

    const mp4Buffer = createMinimalMp4Buffer(512)
    const videoForm = new FormData()
    videoForm.set(
      '_payload',
      JSON.stringify({
        title: 'فيديو مشروع اختباري',
      }),
    )
    videoForm.set(
      'file',
      new File([new Uint8Array(mp4Buffer)], 'project-walkthrough.mp4', { type: 'video/mp4' }),
    )
    const videoRes = await callMultipartApi('POST', '/api/videos', videoForm, {
      cookie: editorCookie,
    })
    expect(videoRes.status).toBe(201)
    uploadedVideoId = (videoRes.data.doc as { id: number | string }).id
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

  it('enforces Z1 & Z2 on projects: anonymous never sees draft projects (REST or Local API overrideAccess:false), sees published projects, and newer draft edits remain hidden until published', async () => {
    // Anonymous POST is rejected with 403
    const anonCreate = await callJsonApi('POST', '/api/projects', {
      body: {
        title: 'مشروع غير مصرح به',
        category: 'mep',
        location: 'الرياض',
        coverImage: uploadedMediaId,
      },
    })
    expect(anonCreate.status).toBe(403)

    // 1. Editor creates a draft project in Arabic
    const createDraftRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مركز البيانات الإقليمي بالرياض',
        category: 'data-center',
        client: 'خاص',
        location: 'الرياض',
        year: 2025,
        scope: ['data-center', 'mep', 'hvac', 'fire-fighting', 'low-current'],
        scopeSummary: 'تنفيذ البنية التحتية الكهروميكانيكية وأنظمة التبريد الدقيق وإطفاء الحريق.',
        deliveredBy: 'عن طريق تحالف الجزيرة الهندسي',
        summary:
          'تجهيز مركز بيانات بمعيار Tier III شاملاً أنظمة التبريد الدقيق والطاقة الاحتياطية.',
        coverImage: uploadedMediaId,
        gallery: [uploadedMediaId],
        details: [
          {
            title: 'التبريد الدقيق والمستمر',
            text: 'تركيب وحدات تبريد CRAC مزدوجة بتكرار N+1 لضمان استمرارية التشغيل.',
          },
        ],
        deliverables: [
          { text: 'شبكة توزيع الجهد المنخفض ولوحات ATS' },
          { text: 'نظام إطفاء الحريق بالغاز النظيف FM-200' },
        ],
        status: 'completed',
        featured: true,
        order: 1,
        meta: {
          title: 'مركز البيانات الإقليمي بالرياض | شركة الجزيرة الإمداد الذكي',
          description:
            'تجهيز مركز بيانات بمعيار Tier III شاملاً أنظمة التبريد الدقيق والطاقة الاحتياطية.',
          image: uploadedMediaId,
        },
        _status: 'draft',
      },
    })
    expect(createDraftRes.status).toBe(201)
    const projectDoc = createDraftRes.data.doc as {
      _status: string
      id: number | string
      slug: string
      slugLocked: boolean
    }
    expect(projectDoc._status).toBe('draft')
    expect(projectDoc.slug).toBe('mrkz-albyanat-aliqlymy-balryad')
    expect(projectDoc.slugLocked).toBe(false)

    // 2. Anonymous user never sees the draft project via REST list, ?draft=true, by ID, or Local API overrideAccess:false
    const anonList = await callJsonApi('GET', '/api/projects')
    expect(anonList.status).toBe(200)
    expect(anonList.data.totalDocs).toBe(0)

    const anonForceDraftList = await callJsonApi('GET', '/api/projects?draft=true')
    expect(anonForceDraftList.status).toBe(200)
    expect(anonForceDraftList.data.totalDocs).toBe(0)

    const anonByIdDraft = await callJsonApi(
      'GET',
      `/api/projects/${String(projectDoc.id)}?draft=true`,
    )
    expect(anonByIdDraft.status).toBe(404)

    const localAnonFind = await payload.find({
      collection: 'projects',
      draft: true,
      overrideAccess: false,
    })
    expect(localAnonFind.totalDocs).toBe(0)

    // Editor with ?draft=true DOES see the draft project
    const editorDraftGet = await callJsonApi(
      'GET',
      `/api/projects/${String(projectDoc.id)}?draft=true`,
      { cookie: editorCookie },
    )
    expect(editorDraftGet.status).toBe(200)

    // 3. Editor adds English title while slugLocked=false -> slug updates to English, then publishes -> slugLocked=true
    const publishEnRes = await callJsonApi(
      'PATCH',
      `/api/projects/${String(projectDoc.id)}?locale=en`,
      {
        cookie: editorCookie,
        body: {
          title: 'Riyadh Regional Data Center',
          client: 'Confidential',
          location: 'Riyadh',
          scopeSummary: 'Turnkey MEP, precision cooling, and clean-agent fire suppression.',
          summary: 'Tier III regional data center infrastructure with redundant cooling and power.',
          details: [
            {
              title: 'Precision N+1 Cooling',
              text: 'Dual-feed CRAC cooling units engineered for 24/7 mission-critical uptime.',
            },
          ],
          deliverables: [
            { text: 'LV power distribution & ATS switchgear' },
            { text: 'FM-200 clean-agent fire suppression network' },
          ],
          _status: 'published',
        },
      },
    )
    expect(publishEnRes.status).toBe(200)
    const publishedDoc = publishEnRes.data.doc as {
      _status: string
      slug: string
      slugLocked: boolean
    }
    expect(publishedDoc._status).toBe('published')
    expect(publishedDoc.slug).toBe('riyadh-regional-data-center')
    expect(publishedDoc.slugLocked).toBe(true)

    // 4. Anonymous user now sees the published project via REST and Local API overrideAccess:false
    const anonListPublished = await callJsonApi('GET', '/api/projects?locale=en')
    expect(anonListPublished.status).toBe(200)
    expect(anonListPublished.data.totalDocs).toBe(1)

    const localAnonPublished = await payload.find({
      collection: 'projects',
      locale: 'en',
      overrideAccess: false,
    })
    expect(localAnonPublished.totalDocs).toBe(1)
    expect(localAnonPublished.docs[0]?.title).toBe('Riyadh Regional Data Center')

    // 5. Editor saves a newer draft change -> anonymous ?draft=true returns 404, anonymous public GET still sees published title
    const draftUpdateRes = await callJsonApi(
      'PATCH',
      `/api/projects/${String(projectDoc.id)}?locale=en&draft=true`,
      {
        cookie: editorCookie,
        body: {
          title: 'UNPUBLISHED DRAFT DATA CENTER TITLE',
          _status: 'draft',
        },
      },
    )
    expect(draftUpdateRes.status).toBe(200)

    const anonDraftByIdAfterEdit = await callJsonApi(
      'GET',
      `/api/projects/${String(projectDoc.id)}?locale=en&draft=true`,
    )
    expect(anonDraftByIdAfterEdit.status).toBe(404)

    const anonPublicByIdAfterEdit = await callJsonApi(
      'GET',
      `/api/projects/${String(projectDoc.id)}?locale=en`,
    )
    expect(anonPublicByIdAfterEdit.status).toBe(200)
    expect(anonPublicByIdAfterEdit.data.title).toBe('Riyadh Regional Data Center')
  })

  it('supports scheduled publishing via Payload jobs queue (schedulePublish: true): transitions a draft project to published when the scheduled time arrives', async () => {
    const createScheduledDraftRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع مستودعات الإمداد المجدول للنشر',
        category: 'fire-fighting',
        location: 'جدة',
        coverImage: uploadedMediaId,
        _status: 'draft',
      },
    })
    expect(createScheduledDraftRes.status).toBe(201)
    const scheduledId = (createScheduledDraftRes.data.doc as { id: number | string }).id

    // Queue a schedulePublish job 350ms in the future
    const waitUntil = new Date(Date.now() + 350)
    const scheduleInput: Record<string, unknown> = {
      type: 'publish',
      doc: {
        relationTo: 'projects',
        value: String(scheduledId),
      },
      user: {
        relationTo: 'users',
        value: Number(adminUserId),
      },
    }
    await payload.jobs.queue({
      task: 'schedulePublish',
      waitUntil,
      input: scheduleInput,
    })

    // Running jobs BEFORE waitUntil does not publish the draft
    await payload.jobs.run()
    const anonBeforeTime = await callJsonApi('GET', `/api/projects/${String(scheduledId)}`)
    expect(anonBeforeTime.status).toBe(404)

    // Wait until past waitUntil and run the jobs queue
    await new Promise((resolve) => setTimeout(resolve, 450))
    const runResult = await payload.jobs.run()
    expect(runResult.jobStatus).toBeDefined()

    // Now the project is published and visible to anonymous readers
    const anonAfterTime = await callJsonApi('GET', `/api/projects/${String(scheduledId)}?locale=ar`)
    expect(anonAfterTime.status).toBe(200)
    expect(anonAfterTime.data._status).toBe('published')
    expect(anonAfterTime.data.title).toBe('مشروع مستودعات الإمداد المجدول للنشر')
  })

  it('enforces mutual exclusion between video and videoUrl (video xor videoUrl) and validates YouTube/Vimeo https:// hosts on both draft and published saves', async () => {
    // 1. Setting both video and videoUrl on create is rejected with 400
    const bothOnCreateRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بفيديو مزدوج مرفوض',
        category: 'mep',
        location: 'الدمام',
        coverImage: uploadedMediaId,
        video: uploadedVideoId,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        _status: 'published',
      },
    })
    expect(bothOnCreateRes.status).toBe(400)
    expect(JSON.stringify(bothOnCreateRes.data)).toContain('لا يمكن تحديد ملف فيديو مرفوع')

    // 2. Setting both video and videoUrl on a DRAFT save is also rejected with 400
    const bothOnDraftRes = await callJsonApi('POST', '/api/projects?locale=ar&draft=true', {
      cookie: editorCookie,
      body: {
        title: 'مسودة بفيديو مزدوج مرفوضة',
        category: 'mep',
        location: 'الدمام',
        coverImage: uploadedMediaId,
        video: uploadedVideoId,
        videoUrl: 'https://vimeo.com/123456789',
        _status: 'draft',
      },
    })
    expect(bothOnDraftRes.status).toBe(400)

    // 3. Creating a project with ONLY uploaded video succeeds (201)
    const videoOnlyRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بفيديو مرفوع فقط',
        category: 'mep',
        location: 'الدمام',
        coverImage: uploadedMediaId,
        video: uploadedVideoId,
        _status: 'published',
      },
    })
    expect(videoOnlyRes.status).toBe(201)
    const videoProjectId = (videoOnlyRes.data.doc as { id: number | string }).id

    // 4. PATCHing videoUrl onto a project that already has `video` (without clearing `video: null`) is rejected with 400
    const patchVideoUrlWithoutClearingVideoRes = await callJsonApi(
      'PATCH',
      `/api/projects/${String(videoProjectId)}?locale=ar`,
      {
        cookie: editorCookie,
        body: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      },
    )
    expect(patchVideoUrlWithoutClearingVideoRes.status).toBe(400)

    // 5. Clearing `video: null` while setting a valid YouTube or Vimeo HTTPS URL succeeds (200)
    const switchToYoutubeRes = await callJsonApi(
      'PATCH',
      `/api/projects/${String(videoProjectId)}?locale=ar`,
      {
        cookie: editorCookie,
        body: {
          video: null,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      },
    )
    expect(switchToYoutubeRes.status).toBe(200)

    const switchToVimeoRes = await callJsonApi(
      'PATCH',
      `/api/projects/${String(videoProjectId)}?locale=ar`,
      {
        cookie: editorCookie,
        body: {
          videoUrl: 'https://player.vimeo.com/video/123456789',
        },
      },
    )
    expect(switchToVimeoRes.status).toBe(200)

    // 6. Non-allowed videoUrl hosts, http:// scheme, or bare domain are rejected with 400 (even on draft save)
    const invalidVideoUrls = [
      'https://evil.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
      'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/',
      'https://vimeo.com/',
      'javascript:alert(1)',
    ]

    for (const badUrl of invalidVideoUrls) {
      const badRes = await callJsonApi(
        'PATCH',
        `/api/projects/${String(videoProjectId)}?locale=ar&draft=true`,
        {
          cookie: editorCookie,
          body: {
            videoUrl: badUrl,
            _status: 'draft',
          },
        },
      )
      expect(badRes.status).toBe(400)
    }
  })

  it('enforces slug uniqueness, field constraints (year, summary, details max 8, deliverables max 10, gallery max 30), foreign-key checks, and media deletion guard', async () => {
    // 1. Explicit locked duplicate slug is rejected with 400
    const duplicateSlugRes = await callJsonApi('POST', '/api/projects?locale=en', {
      cookie: editorCookie,
      body: {
        title: 'Another Data Center Project',
        slug: 'riyadh-regional-data-center',
        slugLocked: true,
        category: 'data-center',
        location: 'Riyadh',
        coverImage: uploadedMediaId,
        _status: 'published',
      },
    })
    expect(duplicateSlugRes.status).toBe(400)

    // 2. Auto-generated slug from identical title is deduplicated with -2 suffix
    const autoDedupeRes = await callJsonApi('POST', '/api/projects?locale=en', {
      cookie: editorCookie,
      body: {
        title: 'Riyadh Regional Data Center',
        category: 'data-center',
        location: 'Riyadh',
        coverImage: uploadedMediaId,
        _status: 'published',
      },
    })
    expect(autoDedupeRes.status).toBe(201)
    expect((autoDedupeRes.data.doc as { slug: string }).slug).toBe('riyadh-regional-data-center-2')

    // 3. Invalid year (< 1990, > currentYear + 2, or non-integer) is rejected with 400
    for (const badYear of [1989, new Date().getFullYear() + 3, 2024.5]) {
      const badYearRes = await callJsonApi('POST', '/api/projects?locale=ar', {
        cookie: editorCookie,
        body: {
          title: 'مشروع بسنة غير صالحة',
          category: 'mep',
          location: 'الرياض',
          year: badYear,
          coverImage: uploadedMediaId,
          _status: 'published',
        },
      })
      expect(badYearRes.status).toBe(400)
    }

    // 4. summary > 280 chars is rejected with 400
    const longSummaryRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بملخص طويل',
        category: 'mep',
        location: 'الرياض',
        summary: 'أ'.repeat(281),
        coverImage: uploadedMediaId,
        _status: 'published',
      },
    })
    expect(longSummaryRes.status).toBe(400)

    // 5. details > 8 items is rejected with 400
    const tooManyDetailsRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بتفاصيل زائدة',
        category: 'mep',
        location: 'الرياض',
        coverImage: uploadedMediaId,
        details: Array.from({ length: 9 }, (_, idx) => ({
          title: `تفصيل ${String(idx + 1)}`,
          text: 'نص تفصيلي للمحور الهندسي.',
        })),
        _status: 'published',
      },
    })
    expect(tooManyDetailsRes.status).toBe(400)

    // 6. deliverables > 10 items is rejected with 400
    const tooManyDeliverablesRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بمخرجات زائدة',
        category: 'mep',
        location: 'الرياض',
        coverImage: uploadedMediaId,
        deliverables: Array.from({ length: 11 }, (_, idx) => ({
          text: `مخرج رقم ${String(idx + 1)}`,
        })),
        _status: 'published',
      },
    })
    expect(tooManyDeliverablesRes.status).toBe(400)

    // 7. gallery > 30 items is rejected with 400
    const tooManyGalleryRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بمعرض صور زائد',
        category: 'mep',
        location: 'الرياض',
        coverImage: uploadedMediaId,
        gallery: Array.from({ length: 31 }, () => uploadedMediaId),
        _status: 'published',
      },
    })
    expect(tooManyGalleryRes.status).toBe(400)

    // 8. Non-existent coverImage or video ID is rejected with 400 ValidationError (not 500 FK error)
    const badCoverRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بصورة غلاف غير موجودة',
        category: 'mep',
        location: 'الرياض',
        coverImage: 999999,
        _status: 'published',
      },
    })
    expect(badCoverRes.status).toBe(400)

    const badVideoIdRes = await callJsonApi('POST', '/api/projects?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'مشروع بفيديو غير موجود',
        category: 'mep',
        location: 'الرياض',
        coverImage: uploadedMediaId,
        video: 999999,
        _status: 'published',
      },
    })
    expect(badVideoIdRes.status).toBe(400)

    // 9. Deleting a media item referenced as a project's coverImage is blocked with 400 and mentions projects(...)
    const deleteCoverMediaRes = await callJsonApi(
      'DELETE',
      `/api/media/${String(uploadedMediaId)}`,
      {
        cookie: editorCookie,
      },
    )
    expect(deleteCoverMediaRes.status).toBe(400)
    expect(JSON.stringify(deleteCoverMediaRes.data)).toContain('projects(')
  })

  it('wires revalidation hooks for project page, projects list, related projects by category, and home when featured is true', async () => {
    const tagSpy = vi.mocked(nextCache.revalidateTag).mockImplementation(() => undefined)
    const pathSpy = vi.mocked(nextCache.revalidatePath).mockImplementation(() => undefined)
    tagSpy.mockClear()
    pathSpy.mockClear()

    try {
      // 1. Publishing a NON-featured project revalidates project page, projects list, and related category, but NOT home (/ar, /en)
      const nonFeaturedRes = await callJsonApi('POST', '/api/projects?locale=en', {
        cookie: editorCookie,
        body: {
          title: 'Jeddah Low Current Hospital Network',
          category: 'low-current',
          scope: ['low-current', 'data-center'],
          location: 'Jeddah',
          featured: false,
          coverImage: uploadedMediaId,
          _status: 'published',
        },
      })
      expect(nonFeaturedRes.status).toBe(201)

      const revalidatedTagsNonFeatured = tagSpy.mock.calls.map((c) => c[0])
      const revalidatedPathsNonFeatured = pathSpy.mock.calls.map((c) => c[0])

      expect(revalidatedTagsNonFeatured).toEqual(
        expect.arrayContaining([
          'collection:projects',
          'doc:projects:jeddah-low-current-hospital-network',
          'projects:category:low-current',
          'projects:scope:low-current',
          'projects:scope:data-center',
        ]),
      )
      expect(revalidatedTagsNonFeatured).not.toContain('projects:featured')
      expect(revalidatedPathsNonFeatured).toEqual(
        expect.arrayContaining([
          '/ar/projects',
          '/en/projects',
          '/ar/projects/jeddah-low-current-hospital-network',
          '/en/projects/jeddah-low-current-hospital-network',
        ]),
      )
      expect(revalidatedPathsNonFeatured).not.toContain('/ar')
      expect(revalidatedPathsNonFeatured).not.toContain('/en')

      tagSpy.mockClear()
      pathSpy.mockClear()

      // 2. Marking the project featured: true ALSO revalidates Home (/ar, /en) and projects:featured
      const nonFeaturedId = (nonFeaturedRes.data.doc as { id: number | string }).id
      const promoteFeaturedRes = await callJsonApi(
        'PATCH',
        `/api/projects/${String(nonFeaturedId)}?locale=en`,
        {
          cookie: editorCookie,
          body: {
            featured: true,
          },
        },
      )
      expect(promoteFeaturedRes.status).toBe(200)

      const revalidatedTagsFeatured = tagSpy.mock.calls.map((c) => c[0])
      const revalidatedPathsFeatured = pathSpy.mock.calls.map((c) => c[0])

      expect(revalidatedTagsFeatured).toEqual(
        expect.arrayContaining(['projects:featured', 'projects:category:low-current']),
      )
      expect(revalidatedPathsFeatured).toEqual(expect.arrayContaining(['/ar', '/en']))
    } finally {
      tagSpy.mockRestore()
      pathSpy.mockRestore()
    }
  })
})
