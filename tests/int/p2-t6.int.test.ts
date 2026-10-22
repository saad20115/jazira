import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { hashIp } from '../../src/lib/ipHash'
import type { User } from '../../src/payload-types'

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
let adminUser: User
let editorUser: User
let serviceId: number

interface JsonApiCallOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  slugPath: string[]
  query?: Record<string, string>
  token?: string
  body?: unknown
}

async function callJsonApi(options: JsonApiCallOptions): Promise<{
  status: number
  body: Record<string, unknown>
}> {
  const { method, slugPath, query, token, body } = options
  const url = new URL(`http://localhost:3000/api/${slugPath.join('/')}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v)
    }
  }

  const headers = new Headers({
    Origin: 'http://localhost:3000',
  })
  if (token) {
    headers.set('cookie', `payload-token=${token}`)
    headers.set('Authorization', `JWT ${token}`)
  }
  let reqBody: string | undefined
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    reqBody = JSON.stringify(body)
  }

  const request = new Request(url.toString(), {
    method,
    headers,
    body: reqBody,
  })

  const routeContext = {
    params: Promise.resolve({ slug: slugPath }),
  }

  let response: Response
  if (method === 'GET') {
    response = await restGet(request, routeContext)
  } else if (method === 'POST') {
    response = await restPost(request, routeContext)
  } else if (method === 'PATCH') {
    response = await restPatch(request, routeContext)
  } else {
    response = await restDelete(request, routeContext)
  }

  const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return {
    status: response.status,
    body: parsed,
  }
}

describe('P2-T6 integration suite (quote-requests collection, Z1, Z4, D2, I1)', () => {
  beforeAll(async () => {
    const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'aljazira-p2t6-'))
    process.env.MEDIA_DIR = path.join(tmpBase, 'media')
    process.env.VIDEOS_DIR = path.join(tmpBase, 'videos')
    process.env.UPLOAD_TMP_DIR = path.join(tmpBase, 'tmp')
    await fs.mkdir(process.env.MEDIA_DIR, { recursive: true })
    await fs.mkdir(process.env.VIDEOS_DIR, { recursive: true })
    await fs.mkdir(process.env.UPLOAD_TMP_DIR, { recursive: true })

    const configModule = await import('../../src/payload.config')
    const routesModule = await import('@payloadcms/next/routes')

    restGet = routesModule.REST_GET(configModule.default)
    restPost = routesModule.REST_POST(configModule.default)
    restPatch = routesModule.REST_PATCH(configModule.default)
    restDelete = routesModule.REST_DELETE(configModule.default)

    payload = await getPayload({ config: configModule.default })

    await payload.db.migrateFresh({ forceAcceptWarning: true })

    const adminPassword = 'Str0ng!Admin#Pass2026$XyZ'
    const editorPassword = 'Str0ng!Editor#Pass2026$AbC'

    adminUser = await payload.create({
      collection: 'users',
      data: {
        name: 'مدير المبيعات والنظام',
        email: 'admin-p2t6@aljazira.co',
        password: adminPassword,
        role: 'admin',
      },
      overrideAccess: true,
    })

    editorUser = await payload.create({
      collection: 'users',
      data: {
        name: 'مهندس متابعة العروض',
        email: 'editor-p2t6@aljazira.co',
        password: editorPassword,
        role: 'editor',
      },
      overrideAccess: true,
    })

    const adminLogin = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      body: { email: 'admin-p2t6@aljazira.co', password: adminPassword },
    })
    expect(adminLogin.status).toBe(200)
    adminToken = String(adminLogin.body.token)

    const editorLogin = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      body: { email: 'editor-p2t6@aljazira.co', password: editorPassword },
    })
    expect(editorLogin.status).toBe(200)
    editorToken = String(editorLogin.body.token)

    const createdService = await payload.create({
      collection: 'services',
      draft: false,
      locale: 'ar',
      data: {
        title: 'الأعمال الكهروميكانيكية المتكاملة (MEP)',
        slug: 'integrated-mep-works',
        tier: 'main',
        icon: 'mep',
        shortDescription: 'تنفيذ كافة أنظمة التكييف والكهرباء والسباكة.',
        order: 1,
        _status: 'published',
      },
      overrideAccess: true,
    })
    serviceId = createdService.id
  }, 120_000)

  afterAll(async () => {
    const mediaDir = process.env.MEDIA_DIR ?? ''
    const videosDir = process.env.VIDEOS_DIR ?? ''
    const tmpDir = process.env.UPLOAD_TMP_DIR ?? ''
    await fs.rm(mediaDir, { recursive: true, force: true })
    await fs.rm(videosDir, { recursive: true, force: true })
    await fs.rm(tmpDir, { recursive: true, force: true })
  }, 60_000)

  it('enforces Z4: nobody (anonymous, editor, or admin) can create quote-requests via REST POST or Local API with overrideAccess: false', async () => {
    const samplePayload = {
      name: 'م. عبدالله القحطاني',
      company: 'شركة الإعمار المتقدمة',
      email: 'abdullah@emaar-ksa.example.com',
      phone: '+966 55 123 4567',
      service: serviceId,
      message: 'نرغب في عرض سعر لتنفيذ أعمال التكييف ومكافحة الحريق لمشروع برج مكتبي في مكة.',
      locale: 'ar' as const,
      sourcePage: '/ar/contact',
      consent: true,
      status: 'new' as const,
      emailStatus: 'pending' as const,
    }

    // 1. Anonymous REST POST /api/quote-requests -> 403
    const anonPost = await callJsonApi({
      method: 'POST',
      slugPath: ['quote-requests'],
      body: samplePayload,
    })
    expect(anonPost.status).toBe(403)

    // 2. Editor REST POST /api/quote-requests -> 403
    const editorPost = await callJsonApi({
      method: 'POST',
      slugPath: ['quote-requests'],
      token: editorToken,
      body: samplePayload,
    })
    expect(editorPost.status).toBe(403)

    // 3. Admin REST POST /api/quote-requests -> 403
    const adminPost = await callJsonApi({
      method: 'POST',
      slugPath: ['quote-requests'],
      token: adminToken,
      body: samplePayload,
    })
    expect(adminPost.status).toBe(403)

    // 4. Local API with overrideAccess: false (anonymous, editor, admin) -> throws Forbidden
    await expect(
      payload.create({
        collection: 'quote-requests',
        data: samplePayload,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'quote-requests',
        data: samplePayload,
        user: editorUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'quote-requests',
        data: samplePayload,
        user: adminUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('executes all required REST probes: anonymous GET -> 403, editor GET -> 200, editor PATCH workflow fields -> 200, editor/admin PATCH customer or system fields -> ignored (stored value unchanged), editor DELETE -> 403, admin DELETE -> 200', async () => {
    const clientIpHash = hashIp('203.0.113.88')
    const longUserAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ${'X'.repeat(320)}`

    // Server-side handler creates quote-request via Local API with overrideAccess: true
    const createdQuote = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        name: 'م. فهد السبيعي',
        company: 'مجموعة البناء الحديث للمقاولات',
        email: 'fahad@modernbuild.example.sa',
        phone: '+966 57 353 4185',
        service: serviceId,
        message: 'طلب تسعير пакет أعمال MEP كاملة لمشروع فندق 18 طابقاً في مكة المكرمة.',
        locale: 'ar',
        sourcePage: '/ar/contact',
        consent: true,
        status: 'new',
        emailStatus: 'pending',
        emailAttempts: 1,
        emailLastError: 'SMTP timeout after 10000ms (sanitized)',
        ipHash: clientIpHash,
        userAgent: longUserAgent,
      },
    })

    // Verify userAgent was truncated to 300 characters and ipHash is stored as 64-char SHA-256 hex
    expect(createdQuote.userAgent).toHaveLength(300)
    expect(createdQuote.ipHash).toBe(clientIpHash)
    expect(createdQuote.ipHash).not.toContain('203.0.113.88')

    // 1. Anonymous GET /api/quote-requests -> 403 & GET /api/quote-requests/:id -> 403
    const anonList = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests'],
    })
    expect(anonList.status).toBe(403)

    const anonGetById = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests', String(createdQuote.id)],
    })
    expect(anonGetById.status).toBe(403)

    // 2. Editor GET /api/quote-requests -> 200
    const editorList = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests'],
      token: editorToken,
    })
    expect(editorList.status).toBe(200)
    expect(editorList.body.totalDocs).toBe(1)

    // 3. Editor PATCH workflow fields (status, assignedTo, internalNotes) -> 200
    const editorPatchWorkflow = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests', String(createdQuote.id)],
      token: editorToken,
      body: {
        status: 'contacted',
        assignedTo: editorUser.id,
        internalNotes: 'تم التواصل مع المهندس فهد واستلام المخططات الأولية وجدول الكميات (BOQ).',
      },
    })
    expect(editorPatchWorkflow.status).toBe(200)
    const updatedDocFromWorkflow = editorPatchWorkflow.body.doc as Record<string, unknown>
    expect(updatedDocFromWorkflow.status).toBe('contacted')
    expect(updatedDocFromWorkflow.internalNotes).toBe(
      'تم التواصل مع المهندس فهد واستلام المخططات الأولية وجدول الكميات (BOQ).',
    )

    // 4. Editor PATCH of customer fields (email, message, name, phone) and system fields (emailStatus, emailAttempts, emailLastError, ipHash) -> ignored by field-level access; stored values unchanged!
    const editorPatchTamper = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests', String(createdQuote.id)],
      token: editorToken,
      body: {
        email: 'tampered-by-editor@attacker.example.com',
        message: 'رسالة مزورة من محرر',
        name: 'اسم مزور',
        phone: '+966 50 000 0000',
        emailStatus: 'sent',
        emailAttempts: 99,
        emailLastError: 'cleared by editor',
        ipHash: 'a'.repeat(64),
      },
    })
    expect(editorPatchTamper.status).toBe(200)

    // 5. Admin PATCH of customer fields (email, message) and system fields (emailStatus, emailAttempts, emailLastError) -> ALSO ignored by field-level access; stored values unchanged!
    const adminPatchTamper = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests', String(createdQuote.id)],
      token: adminToken,
      body: {
        status: 'quoted',
        email: 'tampered-by-admin@attacker.example.com',
        message: 'رسالة معدلة من مدير',
        emailStatus: 'sent',
        emailAttempts: 42,
        emailLastError: 'cleared by admin',
      },
    })
    expect(adminPatchTamper.status).toBe(200)

    // Verify stored values in PostgreSQL are completely unchanged for all customer & system fields, while workflow field `status` updated to 'quoted'
    const storedAfterTamper = await payload.findByID({
      collection: 'quote-requests',
      id: createdQuote.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(storedAfterTamper.status).toBe('quoted')
    expect(storedAfterTamper.assignedTo).toBe(editorUser.id)
    expect(storedAfterTamper.internalNotes).toBe(
      'تم التواصل مع المهندس فهد واستلام المخططات الأولية وجدول الكميات (BOQ).',
    )
    expect(storedAfterTamper.email).toBe('fahad@modernbuild.example.sa')
    expect(storedAfterTamper.message).toBe(
      'طلب تسعير пакет أعمال MEP كاملة لمشروع فندق 18 طابقاً في مكة المكرمة.',
    )
    expect(storedAfterTamper.name).toBe('م. فهد السبيعي')
    expect(storedAfterTamper.phone).toBe('+966 57 353 4185')
    expect(storedAfterTamper.emailStatus).toBe('pending')
    expect(storedAfterTamper.emailAttempts).toBe(1)
    expect(storedAfterTamper.emailLastError).toBe('SMTP timeout after 10000ms (sanitized)')
    expect(storedAfterTamper.ipHash).toBe(clientIpHash)

    // 6. Editor DELETE /api/quote-requests/:id -> 403
    const editorDelete = await callJsonApi({
      method: 'DELETE',
      slugPath: ['quote-requests', String(createdQuote.id)],
      token: editorToken,
    })
    expect(editorDelete.status).toBe(403)

    // 7. Admin DELETE /api/quote-requests/:id -> 200
    const adminDelete = await callJsonApi({
      method: 'DELETE',
      slugPath: ['quote-requests', String(createdQuote.id)],
      token: adminToken,
    })
    expect(adminDelete.status).toBe(200)

    const remaining = await payload.find({
      collection: 'quote-requests',
      where: { id: { equals: createdQuote.id } },
      overrideAccess: true,
    })
    expect(remaining.totalDocs).toBe(0)
  })

  it('validates customer fields, consent, relationship IDs, enums, and rejects raw IP in ipHash (D2, I1)', async () => {
    // 1. Rejects consent: false
    await expect(
      payload.create({
        collection: 'quote-requests',
        overrideAccess: true,
        data: {
          name: 'عميل بدون موافقة',
          email: 'noconsent@example.com',
          phone: '+966 57 353 4185',
          locale: 'ar',
          consent: false,
          status: 'new',
          emailStatus: 'pending',
        },
      }),
    ).rejects.toThrow()

    // 2. Rejects invalid phone format
    await expect(
      payload.create({
        collection: 'quote-requests',
        overrideAccess: true,
        data: {
          name: 'عميل برقم خاطئ',
          email: 'badphone@example.com',
          phone: '05123',
          locale: 'ar',
          consent: true,
          status: 'new',
          emailStatus: 'pending',
        },
      }),
    ).rejects.toThrow()

    // 3. Rejects raw IP address in ipHash (D2)
    await expect(
      payload.create({
        collection: 'quote-requests',
        overrideAccess: true,
        data: {
          name: 'عميل بعنوان IP خام',
          email: 'rawip@example.com',
          phone: '+966 57 353 4185',
          locale: 'ar',
          consent: true,
          status: 'new',
          emailStatus: 'pending',
          ipHash: '203.0.113.42',
        },
      }),
    ).rejects.toThrow()

    // 4. Rejects nonexistent service ID
    await expect(
      payload.create({
        collection: 'quote-requests',
        overrideAccess: true,
        data: {
          name: 'عميل بخدمة غير موجودة',
          email: 'noservice@example.com',
          phone: '+966 57 353 4185',
          service: 999999,
          locale: 'ar',
          consent: true,
          status: 'new',
          emailStatus: 'pending',
        },
      }),
    ).rejects.toThrow()

    // 5. Rejects invalid status or nonexistent assignedTo on REST PATCH
    const validDoc = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        name: 'م. سلطان الحربي',
        company: 'شركة الأبراج الذكية',
        email: 'sultan@smarttowers.example.sa',
        phone: '0551234567',
        service: serviceId,
        locale: 'ar',
        consent: true,
        status: 'new',
        emailStatus: 'pending',
      },
    })

    const badStatusPatch = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests', String(validDoc.id)],
      token: editorToken,
      body: {
        status: 'not-a-valid-status',
      },
    })
    expect(badStatusPatch.status).toBe(400)

    const badAssigneePatch = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests', String(validDoc.id)],
      token: editorToken,
      body: {
        assignedTo: 999999,
      },
    })
    expect(badAssigneePatch.status).toBe(400)

    await payload.delete({
      collection: 'quote-requests',
      id: validDoc.id,
      overrideAccess: true,
    })
  })

  it('orders quote-requests newest first (-createdAt) by default and supports filtering by status, assignedTo, and createdAt date', async () => {
    const q1 = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        name: 'طلب رقم 1 (الأقدم)',
        company: 'شركة الخليج للمقاولات',
        email: 'q1@gulf.example.sa',
        phone: '+966 57 353 4185',
        service: serviceId,
        locale: 'ar',
        consent: true,
        status: 'new',
        emailStatus: 'sent',
        ipHash: hashIp('198.51.100.1'),
      },
    })

    await new Promise((r) => setTimeout(r, 25))

    const q2 = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        name: 'طلب رقم 2 (الأحدث)',
        company: 'مؤسسة النور الهندسية',
        email: 'q2@alnoor.example.sa',
        phone: '+971 50 987 6543',
        service: serviceId,
        locale: 'en',
        consent: true,
        status: 'contacted',
        assignedTo: editorUser.id,
        emailStatus: 'pending',
        ipHash: hashIp('198.51.100.2'),
      },
    })

    // Default sort is -createdAt (newest first: q2 then q1)
    const listAll = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests'],
      token: editorToken,
    })
    expect(listAll.status).toBe(200)
    const docs = listAll.body.docs as Array<{ id: number; name: string }>
    expect(docs.map((d) => d.id)).toEqual([q2.id, q1.id])

    // Filter by status=contacted
    const filterByStatus = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests'],
      query: { 'where[status][equals]': 'contacted' },
      token: editorToken,
    })
    expect(filterByStatus.status).toBe(200)
    expect((filterByStatus.body.docs as Array<{ id: number }>).map((d) => d.id)).toEqual([q2.id])

    // Filter by assignedTo=editorUser.id
    const filterByAssignee = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests'],
      query: { 'where[assignedTo][equals]': String(editorUser.id) },
      token: editorToken,
    })
    expect(filterByAssignee.status).toBe(200)
    expect((filterByAssignee.body.docs as Array<{ id: number }>).map((d) => d.id)).toEqual([q2.id])

    // Filter by createdAt >= q2.createdAt
    const filterByDate = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests'],
      query: { 'where[createdAt][greater_than_equal]': q2.createdAt },
      token: editorToken,
    })
    expect(filterByDate.status).toBe(200)
    expect((filterByDate.body.docs as Array<{ id: number }>).map((d) => d.id)).toEqual([q2.id])
  })
})
