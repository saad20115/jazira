import fs from 'fs/promises'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertTestDatabaseIsolation } from './_helpers/testDbIsolation'

process.env.DATABASE_URL = assertTestDatabaseIsolation()
process.env.PAYLOAD_SECRET = 'test_payload_secret_with_at_least_forty_eight_random_bytes_1234567890'
process.env.IP_HASH_SALT = 'test_ip_hash_salt_with_at_least_forty_eight_random_bytes_1234567890ab'
process.env.SERVER_URL = 'http://localhost:3000'
process.env.MEDIA_DIR = path.resolve(process.cwd(), 'tmp-test-media-p2-t3')
process.env.VIDEOS_DIR = path.resolve(process.cwd(), 'tmp-test-videos-p2-t3')

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
let editorCookie = ''
let uploadedMediaId: number | string

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

describe('P2-T3 integration suite (services & team)', { shuffle: false }, () => {
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
        email: 'admin-p2t3@aljazira.co',
        password: 'Str0ng!Admin#Pass2026_OK',
        name: 'مدير النظام',
      },
    })
    expect(firstReg.status).toBe(200)
    adminToken = firstReg.data.token as string

    const editorEmail = 'editor-p2t3@aljazira.co'
    const editorPassword = 'ValidEditorPassword!2026'

    const editorCreate = await callJsonApi('POST', '/api/users', {
      cookie: `payload-token=${adminToken}`,
      body: {
        name: 'محرر خدمات وفريق',
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
        width: 64,
        height: 64,
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
        alt: 'صورة اختبار للخدمات والفريق',
      }),
    )
    mediaForm.set(
      'file',
      new File([new Uint8Array(pngBuffer)], 'service-team-test.png', { type: 'image/png' }),
    )
    const mediaRes = await callMultipartApi('POST', '/api/media', mediaForm, {
      cookie: editorCookie,
    })
    expect(mediaRes.status).toBe(201)
    uploadedMediaId = (mediaRes.data.doc as { id: number | string }).id
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

  it('enforces Z1 & Z2 on services: anonymous never sees draft services (even with ?draft=true), sees published services, and newer draft edits remain hidden until published', async () => {
    // Anonymous POST to /api/services is rejected with 403
    const anonCreate = await callJsonApi('POST', '/api/services', {
      body: {
        title: 'خدمة غير مصرح بها',
        tier: 'main',
        icon: 'mep',
      },
    })
    expect(anonCreate.status).toBe(403)

    // 1. Editor creates a draft service in Arabic
    const createDraftRes = await callJsonApi('POST', '/api/services?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'الأعمال الكهروميكانيكية المتكاملة',
        tier: 'main',
        featured: true,
        icon: 'mep',
        shortDescription: 'تنفيذ كافة الأنظمة الميكانيكية والكهربائية والصحية للمشاريع الكبرى.',
        highlights: [
          { text: 'أنظمة التكييف والتهوية المركزية HVAC' },
          { text: 'شبكات الجهد المتوسط والمنخفض' },
        ],
        image: uploadedMediaId,
        order: 1,
        meta: {
          title: 'الأعمال الكهروميكانيكية | شركة الجزيرة الإمداد الذكي',
          description: 'تنفيذ كافة الأنظمة الميكانيكية والكهربائية والصحية للمشاريع الكبرى.',
          image: uploadedMediaId,
        },
        _status: 'draft',
      },
    })
    expect(createDraftRes.status).toBe(201)
    const serviceDoc = createDraftRes.data.doc as {
      _status: string
      id: number | string
      slug: string
      slugLocked: boolean
    }
    expect(serviceDoc._status).toBe('draft')
    expect(serviceDoc.slug).toBe('alaamal-alkhrwmykanykya-almtkamla')
    expect(serviceDoc.slugLocked).toBe(false)

    // 2. Anonymous user never sees the draft service in list, by ID, or with ?draft=true (Z2)
    const anonListDraft = await callJsonApi('GET', '/api/services')
    expect(anonListDraft.status).toBe(200)
    expect(anonListDraft.data.totalDocs).toBe(0)

    const anonListForceDraft = await callJsonApi('GET', '/api/services?draft=true')
    expect(anonListForceDraft.status).toBe(200)
    expect(anonListForceDraft.data.totalDocs).toBe(0)

    const anonByIdDraft = await callJsonApi(
      'GET',
      `/api/services/${String(serviceDoc.id)}?draft=true`,
    )
    expect(anonByIdDraft.status).toBe(404)

    // Editor with ?draft=true DOES see the draft service
    const editorByIdDraft = await callJsonApi(
      'GET',
      `/api/services/${String(serviceDoc.id)}?draft=true`,
      { cookie: editorCookie },
    )
    expect(editorByIdDraft.status).toBe(200)

    // 3. Editor adds English title while still draft -> slug updates to English, then publishes
    const addEnAndPublishRes = await callJsonApi(
      'PATCH',
      `/api/services/${String(serviceDoc.id)}?locale=en`,
      {
        cookie: editorCookie,
        body: {
          title: 'Integrated MEP Works',
          shortDescription: 'End-to-end mechanical, electrical, and plumbing execution.',
          highlights: [
            { text: 'Central HVAC & ventilation systems' },
            { text: 'MV & LV electrical distribution networks' },
          ],
          _status: 'published',
        },
      },
    )
    expect(addEnAndPublishRes.status).toBe(200)
    const publishedDoc = addEnAndPublishRes.data.doc as {
      _status: string
      slug: string
      slugLocked: boolean
    }
    expect(publishedDoc._status).toBe('published')
    expect(publishedDoc.slug).toBe('integrated-mep-works')
    expect(publishedDoc.slugLocked).toBe(true)

    // 4. Anonymous user now sees the published service
    const anonListPublished = await callJsonApi('GET', '/api/services?locale=en')
    expect(anonListPublished.status).toBe(200)
    expect(anonListPublished.data.totalDocs).toBe(1)

    // 5. Editor saves a new draft change -> anonymous ?draft=true is blocked (404), anonymous public GET still sees the published version, and editor ?draft=true sees the new draft (Z2)
    const draftEditRes = await callJsonApi(
      'PATCH',
      `/api/services/${String(serviceDoc.id)}?locale=en&draft=true`,
      {
        cookie: editorCookie,
        body: {
          title: 'UNPUBLISHED DRAFT MEP TITLE',
          _status: 'draft',
        },
      },
    )
    expect(draftEditRes.status).toBe(200)

    const anonForceDraftAfterEdit = await callJsonApi(
      'GET',
      `/api/services/${String(serviceDoc.id)}?locale=en&draft=true`,
    )
    expect(anonForceDraftAfterEdit.status).toBe(404)

    const anonPublicAfterEdit = await callJsonApi(
      'GET',
      `/api/services/${String(serviceDoc.id)}?locale=en`,
    )
    expect(anonPublicAfterEdit.status).toBe(200)
    expect(anonPublicAfterEdit.data.title).toBe('Integrated MEP Works')

    const editorDraftAfterEdit = await callJsonApi(
      'GET',
      `/api/services/${String(serviceDoc.id)}?locale=en&draft=true`,
      { cookie: editorCookie },
    )
    expect(editorDraftAfterEdit.status).toBe(200)
    expect(editorDraftAfterEdit.data.title).toBe('UNPUBLISHED DRAFT MEP TITLE')
  })

  it('enforces limited Lexical feature set on services.body (I2): accepts h2-h4, bold, italic, lists, blockquote, safe link, and media upload; rejects raw HTML, iframe, h1, check list, and javascript: links', async () => {
    // 1. Valid Lexical state is accepted
    const validBody = {
      root: {
        type: 'root',
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'heading',
            tag: 'h2',
            direction: 'rtl',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'أنظمة مكافحة الحريق المعتمدة',
                format: 1,
                detail: 0,
                mode: 'normal',
                style: '',
                version: 1,
              },
            ],
          },
          {
            type: 'paragraph',
            direction: 'rtl',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'تصميم وتوريد وتركيب شبكات الإطفاء والإنذار المبكر وفق كود البناء السعودي.',
                format: 2,
                detail: 0,
                mode: 'normal',
                style: '',
                version: 1,
              },
            ],
          },
          {
            type: 'quote',
            direction: 'rtl',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                text: 'أعلى معايير السلامة والاعتماد الهندسي.',
                format: 0,
                detail: 0,
                mode: 'normal',
                style: '',
                version: 1,
              },
            ],
          },
        ],
      },
    }

    const validServiceRes = await callJsonApi('POST', '/api/services?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'أنظمة مكافحة الحريق',
        tier: 'main',
        icon: 'fire',
        body: validBody,
        _status: 'published',
      },
    })
    expect(validServiceRes.status).toBe(201)
    const serviceId = (validServiceRes.data.doc as { id: number | string }).id

    // 2. Disallowed 'iframe' node on save is rejected with 400
    const iframeBody = {
      root: {
        type: 'root',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'iframe',
            src: 'https://evil.com/embed',
            version: 1,
            children: [],
          },
        ],
      },
    }

    const iframeRes = await callJsonApi('PATCH', `/api/services/${String(serviceId)}?locale=ar`, {
      cookie: editorCookie,
      body: {
        body: iframeBody,
      },
    })
    expect(iframeRes.status).toBe(400)

    // 3. Disallowed 'rawHtml' node (even on draft save) is rejected with 400
    const rawHtmlBody = {
      root: {
        type: 'root',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'rawHtml',
            html: '<script>alert(1)</script>',
            version: 1,
            children: [],
          },
        ],
      },
    }

    const rawHtmlDraftRes = await callJsonApi(
      'PATCH',
      `/api/services/${String(serviceId)}?locale=ar&draft=true`,
      {
        cookie: editorCookie,
        body: {
          body: rawHtmlBody,
          _status: 'draft',
        },
      },
    )
    expect(rawHtmlDraftRes.status).toBe(400)

    // 4. Disallowed h1 heading is rejected with 400
    const h1Body = {
      root: {
        type: 'root',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'heading',
            tag: 'h1',
            version: 1,
            children: [{ type: 'text', text: 'Not allowed H1', format: 0, version: 1 }],
          },
        ],
      },
    }

    const h1Res = await callJsonApi('PATCH', `/api/services/${String(serviceId)}?locale=ar`, {
      cookie: editorCookie,
      body: {
        body: h1Body,
      },
    })
    expect(h1Res.status).toBe(400)

    // 5. Disallowed javascript: link inside body is rejected with 400 (I3)
    const jsLinkBody = {
      root: {
        type: 'root',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'link',
                version: 1,
                fields: {
                  linkType: 'custom',
                  url: 'javascript:alert(document.cookie)',
                  newTab: false,
                },
                children: [{ type: 'text', text: 'Click me', format: 0, version: 1 }],
              },
            ],
          },
        ],
      },
    }

    const jsLinkRes = await callJsonApi('PATCH', `/api/services/${String(serviceId)}?locale=ar`, {
      cookie: editorCookie,
      body: {
        body: jsLinkBody,
      },
    })
    expect(jsLinkRes.status).toBe(400)
  })

  it('enforces team conditional validation, LinkedIn URL rules, and public active-only read access', async () => {
    // 1. Leadership without photo is rejected with 400
    const leadershipNoPhotoRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. عبد الله الشمري',
        position: 'الرئيس التنفيذي',
        tier: 'leadership',
        bio: 'خبرة تمتد لأكثر من 25 عاماً في إدارة المشاريع الكهروميكانيكية الكبرى.',
        active: true,
        order: 1,
      },
    })
    expect(leadershipNoPhotoRes.status).toBe(400)
    expect(JSON.stringify(leadershipNoPhotoRes.data)).toContain('الصورة الشخصية مطلوبة')

    // 2. Leadership with non-existent photo ID is rejected with 400 (not 500 FK error)
    const leadershipBadPhotoRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. عبد الله الشمري',
        position: 'الرئيس التنفيذي',
        tier: 'leadership',
        photo: 999999,
        active: true,
      },
    })
    expect(leadershipBadPhotoRes.status).toBe(400)

    // 3. Leadership with valid photo and valid LinkedIn URL is accepted (201)
    const leadershipValidRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. عبد الله الشمري',
        position: 'الرئيس التنفيذي',
        tier: 'leadership',
        photo: uploadedMediaId,
        bio: 'خبرة تمتد لأكثر من 25 عاماً في إدارة المشاريع الكهروميكانيكية الكبرى.',
        linkedin: 'https://www.linkedin.com/in/abdullah-alshammari',
        active: true,
        order: 1,
      },
    })
    expect(leadershipValidRes.status).toBe(201)

    // 4. Staff without photo is accepted (201)
    const staffNoPhotoRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. فهد العتيبي',
        position: 'مدير مشروع أول',
        tier: 'staff',
        active: true,
        order: 2,
      },
    })
    expect(staffNoPhotoRes.status).toBe(201)
    const staffDocId = (staffNoPhotoRes.data.doc as { id: number | string }).id

    // 5. Promoting staff (without photo) to leadership without providing a photo is rejected with 400
    const promoteWithoutPhotoRes = await callJsonApi(
      'PATCH',
      `/api/team/${String(staffDocId)}?locale=ar`,
      {
        cookie: editorCookie,
        body: {
          tier: 'leadership',
        },
      },
    )
    expect(promoteWithoutPhotoRes.status).toBe(400)

    // 6. Disallowed LinkedIn URL (non-linkedin.com host) is rejected with 400
    const badLinkedinRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. طارق الحربي',
        position: 'مهندس موقع',
        tier: 'staff',
        linkedin: 'https://linkedin.com.evil.com/in/tariq',
        active: true,
      },
    })
    expect(badLinkedinRes.status).toBe(400)

    // 7. Create an inactive team member (active: false)
    const inactiveMemberRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'عضو غير نشط',
        position: 'مهندس سابق',
        tier: 'staff',
        active: false,
        order: 3,
      },
    })
    expect(inactiveMemberRes.status).toBe(201)
    const inactiveId = (inactiveMemberRes.data.doc as { id: number | string }).id

    // 8. Anonymous user never sees inactive team members in list or by ID
    const anonTeamList = await callJsonApi('GET', '/api/team?locale=ar')
    expect(anonTeamList.status).toBe(200)
    expect(anonTeamList.data.totalDocs).toBe(2)
    const returnedIds = (anonTeamList.data.docs as Array<{ id: number | string }>).map((d) => d.id)
    expect(returnedIds).not.toContain(inactiveId)

    const anonInactiveById = await callJsonApi('GET', `/api/team/${String(inactiveId)}?locale=ar`)
    expect(anonInactiveById.status).toBe(404)

    // Editor sees all 3 team members (including inactive)
    const editorTeamList = await callJsonApi('GET', '/api/team?locale=ar', {
      cookie: editorCookie,
    })
    expect(editorTeamList.status).toBe(200)
    expect(editorTeamList.data.totalDocs).toBe(3)
  })

  it('verifies P2-T3 R-1..R-6 fixes: staff bio cleared across all locales (R-1), LinkedIn https + path (R-2), LinkFeature enabledCollections (R-3), no silent icon/tier defaults on services (R-4), Arabic SEO field labels (R-5), and media beforeDelete guard (R-6)', async () => {
    // R-1: Add an English bio to the leadership member, then switch tier to staff in Arabic -> both ar and en bios are cleared
    const leaderId = (
      (await callJsonApi('GET', '/api/team?locale=ar', { cookie: editorCookie })).data
        .docs as Array<{ id: number | string; tier: string }>
    ).find((d) => d.tier === 'leadership')?.id
    expect(leaderId).toBeDefined()

    const addEnBioRes = await callJsonApi('PATCH', `/api/team/${String(leaderId)}?locale=en`, {
      cookie: editorCookie,
      body: {
        name: 'Eng. Abdullah Al-Shammari',
        position: 'Chief Executive Officer',
        bio: 'Over 25 years of executive experience leading major MEP engineering projects.',
      },
    })
    expect(addEnBioRes.status).toBe(200)
    expect((addEnBioRes.data.doc as { bio?: string | null }).bio).toContain('Over 25 years')

    const demoteToStaffArRes = await callJsonApi(
      'PATCH',
      `/api/team/${String(leaderId)}?locale=ar`,
      {
        cookie: editorCookie,
        body: {
          tier: 'staff',
        },
      },
    )
    expect(demoteToStaffArRes.status).toBe(200)
    expect((demoteToStaffArRes.data.doc as { bio?: string | null }).bio).toBeNull()

    const anonReadEnAfterDemote = await callJsonApi(
      'GET',
      `/api/team/${String(leaderId)}?locale=en`,
    )
    expect(anonReadEnAfterDemote.status).toBe(200)
    expect(anonReadEnAfterDemote.data.bio).toBeNull()

    // Restore leadership tier so R-6 can verify media deletion guard against a leadership photo
    const restoreLeadershipRes = await callJsonApi(
      'PATCH',
      `/api/team/${String(leaderId)}?locale=ar`,
      {
        cookie: editorCookie,
        body: {
          tier: 'leadership',
          photo: uploadedMediaId,
          bio: 'خبرة تمتد لأكثر من 25 عاماً في إدارة المشاريع الكهروميكانيكية الكبرى.',
        },
      },
    )
    expect(restoreLeadershipRes.status).toBe(200)

    // R-2: LinkedIn rejects http:// and bare https://linkedin.com without /in/ or /company/ path
    const httpLinkedinRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. سامي القحطاني',
        position: 'مهندس ميكانيكا',
        tier: 'staff',
        linkedin: 'http://www.linkedin.com/in/sami-alqahtani',
        active: true,
      },
    })
    expect(httpLinkedinRes.status).toBe(400)

    const bareLinkedinRes = await callJsonApi('POST', '/api/team?locale=ar', {
      cookie: editorCookie,
      body: {
        name: 'م. سامي القحطاني',
        position: 'مهندس ميكانيكا',
        tier: 'staff',
        linkedin: 'https://linkedin.com/',
        active: true,
      },
    })
    expect(bareLinkedinRes.status).toBe(400)

    // R-3 & R-5: Verify LinkFeature enabledCollections and Arabic SEO field labels
    const { ALLOWED_INTERNAL_LINK_COLLECTIONS } = await import('../../src/fields/richText')
    expect(ALLOWED_INTERNAL_LINK_COLLECTIONS).toEqual(['services', 'projects'])

    const { seoGroupField } = await import('../../src/fields/seo')
    const seoGroup = seoGroupField()
    expect(seoGroup.label).toEqual({
      ar: 'تحسين محركات البحث (SEO)',
      en: 'SEO',
    })
    const seoSubfieldNames = seoGroup.fields.flatMap((f) => {
      const rec = f as unknown as { label?: { ar?: string }; name?: unknown }
      return typeof rec.name === 'string' ? [{ name: rec.name, ar: rec.label?.ar }] : []
    })
    expect(seoSubfieldNames).toEqual(
      expect.arrayContaining([
        { name: 'title', ar: 'عنوان الصفحة في محركات البحث (Meta Title)' },
        { name: 'description', ar: 'وصف الصفحة في محركات البحث (Meta Description)' },
        { name: 'image', ar: 'صورة المشاركة الاجتماعية (Meta Image)' },
      ]),
    )

    // R-4: Omitting icon or tier on a published service is rejected with 400 (no silent defaults)
    const missingIconServiceRes = await callJsonApi('POST', '/api/services?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'خدمة بدون أيقونة',
        tier: 'main',
        _status: 'published',
      },
    })
    expect(missingIconServiceRes.status).toBe(400)

    const missingTierServiceRes = await callJsonApi('POST', '/api/services?locale=ar', {
      cookie: editorCookie,
      body: {
        title: 'خدمة بدون فئة',
        icon: 'mep',
        _status: 'published',
      },
    })
    expect(missingTierServiceRes.status).toBe(400)

    // R-6: Deleting a media item referenced by a team member photo or service image is rejected with 400
    const deleteReferencedMediaRes = await callJsonApi(
      'DELETE',
      `/api/media/${String(uploadedMediaId)}`,
      {
        cookie: editorCookie,
      },
    )
    expect(deleteReferencedMediaRes.status).toBe(400)
    expect(JSON.stringify(deleteReferencedMediaRes.data)).toContain('team(')
  })
})
