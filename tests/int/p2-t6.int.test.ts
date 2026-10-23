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
    expect(storedAfterTamper.phone).toBe('+966573534185')
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

  it('normalizes phone inputs (0573534185, 057 353 4185, 00966 57 353 4185, +966 57 353 4185) to canonical E.164 +966573534185 (R-3, R-12), preserves read-only serviceTitle snapshot when the referenced service is deleted (R-4), and allows editors to read only id + name of other users (R-5, R-11)', async () => {
    // R-3: Rejects 00966 with wrong national digit count, bare 966573534185 without +, and +111111111111111
    for (const invalidPhone of ['009665735341', '966573534185', '+111111111111111']) {
      await expect(
        payload.create({
          collection: 'quote-requests',
          overrideAccess: true,
          data: {
            name: 'اختبار رقم هاتف غير صالح',
            email: 'phone-check@example.sa',
            phone: invalidPhone,
            locale: 'ar',
            consent: true,
            status: 'new',
            emailStatus: 'pending',
          },
        }),
      ).rejects.toThrow()
    }

    // R-12: All valid KSA local and international formats store canonical E.164 (+966573534185)
    for (const rawPhoneVariant of [
      '0573534185',
      '057 353 4185',
      '00966 57 353 4185',
      '+966 57 353 4185',
      '+966 (57) 353-4185',
    ]) {
      const createdVariant = await payload.create({
        collection: 'quote-requests',
        overrideAccess: true,
        data: {
          name: 'عميل اختبار تطبيع E.164',
          email: 'e164-check@example.sa',
          phone: rawPhoneVariant,
          locale: 'ar',
          consent: true,
          status: 'new',
          emailStatus: 'pending',
        },
      })
      expect(createdVariant.phone, `rawPhoneVariant=${rawPhoneVariant}`).toBe('+966573534185')
      await payload.delete({
        collection: 'quote-requests',
        id: createdVariant.id,
        overrideAccess: true,
      })
    }

    // R-4: Create a temporary service, create a quote request with 00966 phone assigned to adminUser, verify E.164 normalization and serviceTitle snapshot
    const tempService = await payload.create({
      collection: 'services',
      draft: false,
      locale: 'ar',
      overrideAccess: true,
      data: {
        title: 'أنظمة التيار الخفيف والتحكم الذكي (ELV)',
        slug: 'temp-elv-systems-r4',
        tier: 'additional',
        icon: 'mep',
        shortDescription: 'أنظمة الأمن والمراقبة والتحكم بالمباني.',
        order: 9,
        _status: 'published',
      },
    })

    const quoteWith00966 = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        name: 'م. ماجد الدوسري',
        company: 'شركة الرؤية الذكية',
        email: 'majed@smartvision.example.sa',
        phone: '00966 57 353 4185',
        service: tempService.id,
        assignedTo: adminUser.id,
        locale: 'ar',
        consent: true,
        status: 'new',
        emailStatus: 'pending',
      },
    })

    // Phone normalized to canonical E.164 (+966573534185), and serviceTitle snapshot captured
    expect(quoteWith00966.phone).toBe('+966573534185')
    expect(quoteWith00966.serviceTitle).toBe('أنظمة التيار الخفيف والتحكم الذكي (ELV)')

    // R-11: Editor reading the quote request at depth=1 sees the assignee's id and name, but never another user's email, role, or sessions
    const quoteDepth1AsEditor = await callJsonApi({
      method: 'GET',
      slugPath: ['quote-requests', String(quoteWith00966.id)],
      query: { depth: '1' },
      token: editorToken,
    })
    expect(quoteDepth1AsEditor.status).toBe(200)
    const populatedAssignee = quoteDepth1AsEditor.body.assignedTo as Record<string, unknown>
    expect(populatedAssignee).toEqual({
      id: adminUser.id,
      name: 'مدير المبيعات والنظام',
    })
    expect(populatedAssignee.email).toBeUndefined()
    expect(populatedAssignee.role).toBeUndefined()
    expect(populatedAssignee.sessions).toBeUndefined()

    // R-11: Editor reading GET /api/users/:adminId directly sees ONLY { id, name }, whereas GET /api/users/:editorId (self) includes email and role
    const otherUserAsEditor = await callJsonApi({
      method: 'GET',
      slugPath: ['users', String(adminUser.id)],
      token: editorToken,
    })
    expect(otherUserAsEditor.status).toBe(200)
    expect(otherUserAsEditor.body).toEqual({
      id: adminUser.id,
      name: 'مدير المبيعات والنظام',
    })
    expect(otherUserAsEditor.body.email).toBeUndefined()
    expect(otherUserAsEditor.body.role).toBeUndefined()
    expect(otherUserAsEditor.body.sessions).toBeUndefined()

    const selfUserAsEditor = await callJsonApi({
      method: 'GET',
      slugPath: ['users', String(editorUser.id)],
      token: editorToken,
    })
    expect(selfUserAsEditor.status).toBe(200)
    expect(selfUserAsEditor.body.email).toBe('editor-p2t6@aljazira.co')
    expect(selfUserAsEditor.body.role).toBe('editor')

    // Editor and admin cannot tamper with serviceTitle via REST PATCH
    const patchServiceTitle = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests', String(quoteWith00966.id)],
      token: adminToken,
      body: {
        serviceTitle: 'عنوان خدمة مزور',
        status: 'contacted',
      },
    })
    expect(patchServiceTitle.status).toBe(200)

    // Delete the referenced service -> service becomes null (ON DELETE SET NULL), serviceTitle remains intact
    await payload.delete({
      collection: 'services',
      id: tempService.id,
      overrideAccess: true,
    })

    const afterServiceDeleted = await payload.findByID({
      collection: 'quote-requests',
      id: quoteWith00966.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(afterServiceDeleted.service).toBeNull()
    expect(afterServiceDeleted.serviceTitle).toBe('أنظمة التيار الخفيف والتحكم الذكي (ELV)')
    expect(afterServiceDeleted.status).toBe('contacted')

    await payload.delete({
      collection: 'quote-requests',
      id: quoteWith00966.id,
      overrideAccess: true,
    })

    // R-5: User created without display name falls back to email so useAsTitle ('name') is never blank/Untitled
    const fallbackUser = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: '   ',
        email: 'fallback-title-p2t6@aljazira.co',
        password: 'Str0ng!User#Pass2026$Zz',
        role: 'editor',
      },
    })
    expect(fallbackUser.name).toBe('fallback-title-p2t6@aljazira.co')

    await payload.delete({
      collection: 'users',
      id: fallbackUser.id,
      overrideAccess: true,
    })
  })

  it('prevents staff and admins from forging createdAt on create (R-10) and from rewriting createdAt via REST PATCH (editor and admin) or Local API update (overrideAccess: false) across all 10 collections (R-2, R-8)', async () => {
    const forgedCreatedAt = '2000-01-01T00:00:00.000Z'

    // Create sample records and verify R-10 (forged createdAt on create via REST POST / Local API overrideAccess: false is ignored)
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
      'base64',
    )
    const mediaDoc = await payload.create({
      collection: 'media',
      locale: 'ar',
      user: editorUser,
      overrideAccess: false,
      data: {
        alt: 'صورة اختبار عدم قابلية تعديل تاريخ الإنشاء',
        createdAt: forgedCreatedAt,
      },
      file: {
        data: png1x1,
        mimetype: 'image/png',
        name: 'r2-immutable-created-at.png',
        size: png1x1.length,
      },
    })
    expect(mediaDoc.createdAt).not.toBe(forgedCreatedAt)

    // Minimal valid MP4 ftyp box buffer (32 bytes)
    const minimalMp4 = Buffer.from(
      '00000018667479706d703432000000006d70343269736f6d000000086d646174',
      'hex',
    )
    const videoDoc = await payload.create({
      collection: 'videos',
      locale: 'ar',
      user: editorUser,
      overrideAccess: false,
      data: {
        title: 'فيديو اختبار R-2',
        createdAt: forgedCreatedAt,
      },
      file: {
        data: minimalMp4,
        mimetype: 'video/mp4',
        name: 'r2-immutable.mp4',
        size: minimalMp4.length,
      },
    })
    expect(videoDoc.createdAt).not.toBe(forgedCreatedAt)

    // Create via REST POST with forged createdAt on brands, stats, materials, services, team, projects (as editor) and users (as admin) (R-10)
    const brandCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['brands'],
      token: editorToken,
      body: {
        name: 'علامة اختبار R-2',
        order: 1,
        createdAt: forgedCreatedAt,
      },
    })
    expect(brandCreateRes.status).toBe(201)
    const brandDoc = brandCreateRes.body.doc as { id: number; createdAt: string }
    expect(brandDoc.createdAt).not.toBe(forgedCreatedAt)

    const statCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['stats'],
      token: editorToken,
      body: {
        value: '45+',
        label: 'عاماً من الخبرة (R-2)',
        order: 1,
        createdAt: forgedCreatedAt,
      },
    })
    expect(statCreateRes.status).toBe(201)
    const statDoc = statCreateRes.body.doc as { id: number; createdAt: string }
    expect(statDoc.createdAt).not.toBe(forgedCreatedAt)

    const materialCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['materials'],
      token: editorToken,
      body: {
        itemNo: 77,
        system: 'electrical',
        description: 'قواطع كهربائية (R-2)',
        brands: [brandDoc.id],
        createdAt: forgedCreatedAt,
      },
    })
    expect(materialCreateRes.status).toBe(201)
    const materialDoc = materialCreateRes.body.doc as { id: number; createdAt: string }
    expect(materialDoc.createdAt).not.toBe(forgedCreatedAt)

    const serviceCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['services'],
      token: editorToken,
      body: {
        title: 'خدمة اختبار R-10',
        slug: 'r10-immutable-created-at-service',
        tier: 'additional',
        icon: 'mep',
        shortDescription: 'وصف مختصر لخدمة اختبار عدم تزوير تاريخ الإنشاء.',
        order: 5,
        _status: 'published',
        createdAt: forgedCreatedAt,
      },
    })
    expect(serviceCreateRes.status).toBe(201)
    const r10ServiceDoc = serviceCreateRes.body.doc as { id: number; createdAt: string }
    expect(r10ServiceDoc.createdAt).not.toBe(forgedCreatedAt)

    const teamCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['team'],
      token: editorToken,
      body: {
        name: 'م. خالد العتيبي',
        position: 'مهندس موقع',
        tier: 'staff',
        active: true,
        order: 1,
        createdAt: forgedCreatedAt,
      },
    })
    expect(teamCreateRes.status).toBe(201)
    const teamDoc = teamCreateRes.body.doc as { id: number; createdAt: string }
    expect(teamDoc.createdAt).not.toBe(forgedCreatedAt)

    const projectCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['projects'],
      token: editorToken,
      body: {
        title: 'مشروع اختبار R-2',
        slug: 'r2-immutable-created-at-project',
        summary: 'ملخص مشروع اختبار R-2.',
        location: 'مكة المكرمة',
        category: 'mep',
        scope: ['hvac'],
        coverImage: mediaDoc.id,
        status: 'completed',
        featured: false,
        order: 1,
        _status: 'published',
        createdAt: forgedCreatedAt,
      },
    })
    expect(projectCreateRes.status).toBe(201)
    const projectDoc = projectCreateRes.body.doc as { id: number; createdAt: string }
    expect(projectDoc.createdAt).not.toBe(forgedCreatedAt)

    const userCreateRes = await callJsonApi({
      method: 'POST',
      slugPath: ['users'],
      token: adminToken,
      body: {
        name: 'مستخدم اختبار R-10',
        email: 'r10-created-at@aljazira.co',
        password: 'Str0ng!User#Pass2026$R10',
        role: 'editor',
        createdAt: forgedCreatedAt,
      },
    })
    expect(userCreateRes.status).toBe(201)
    const r10UserDoc = userCreateRes.body.doc as { id: number; createdAt: string }
    expect(r10UserDoc.createdAt).not.toBe(forgedCreatedAt)
    await payload.delete({
      collection: 'users',
      id: r10UserDoc.id,
      overrideAccess: true,
    })

    const quoteDoc = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        name: 'عميل اختبار R-2',
        email: 'r2-quote@example.sa',
        phone: '+966 57 353 4185',
        locale: 'ar',
        consent: true,
        status: 'new',
        emailStatus: 'pending',
      },
    })

    const targets: Array<{
      slug:
        | 'users'
        | 'media'
        | 'videos'
        | 'brands'
        | 'stats'
        | 'materials'
        | 'services'
        | 'team'
        | 'projects'
        | 'quote-requests'
      id: number
      originalCreatedAt: string
      extraPatch: Record<string, unknown>
    }> = [
      {
        slug: 'users',
        id: editorUser.id,
        originalCreatedAt: editorUser.createdAt,
        extraPatch: { name: 'مهندس متابعة العروض' },
      },
      {
        slug: 'media',
        id: mediaDoc.id,
        originalCreatedAt: mediaDoc.createdAt,
        extraPatch: { alt: 'صورة اختبار محدثة' },
      },
      {
        slug: 'videos',
        id: videoDoc.id,
        originalCreatedAt: videoDoc.createdAt,
        extraPatch: { title: 'فيديو اختبار محدث' },
      },
      {
        slug: 'brands',
        id: brandDoc.id,
        originalCreatedAt: brandDoc.createdAt,
        extraPatch: { name: 'علامة اختبار محدثة' },
      },
      {
        slug: 'stats',
        id: statDoc.id,
        originalCreatedAt: statDoc.createdAt,
        extraPatch: { value: '46+' },
      },
      {
        slug: 'materials',
        id: materialDoc.id,
        originalCreatedAt: materialDoc.createdAt,
        extraPatch: { description: 'قواطع كهربائية محدثة' },
      },
      {
        slug: 'services',
        id: serviceId,
        originalCreatedAt: (
          await payload.findByID({ collection: 'services', id: serviceId, overrideAccess: true })
        ).createdAt,
        extraPatch: { shortDescription: 'تنفيذ كافة أنظمة التكييف والكهرباء والسباكة (محدث).' },
      },
      {
        slug: 'team',
        id: teamDoc.id,
        originalCreatedAt: teamDoc.createdAt,
        extraPatch: { position: 'مهندس موقع أول' },
      },
      {
        slug: 'projects',
        id: projectDoc.id,
        originalCreatedAt: projectDoc.createdAt,
        extraPatch: { summary: 'ملخص مشروع اختبار R-2 محدث.' },
      },
      {
        slug: 'quote-requests',
        id: quoteDoc.id,
        originalCreatedAt: quoteDoc.createdAt,
        extraPatch: { status: 'contacted' },
      },
    ]

    for (const target of targets) {
      // 1. REST PATCH as editor (on users, editor updates self)
      const editorPatchRes = await callJsonApi({
        method: 'PATCH',
        slugPath: [target.slug, String(target.id)],
        token: editorToken,
        body: {
          ...target.extraPatch,
          createdAt: forgedCreatedAt,
        },
      })
      expect(editorPatchRes.status, `editor REST PATCH on ${target.slug}`).toBe(200)

      // 2. REST PATCH as admin
      const adminPatchRes = await callJsonApi({
        method: 'PATCH',
        slugPath: [target.slug, String(target.id)],
        token: adminToken,
        body: {
          ...target.extraPatch,
          createdAt: forgedCreatedAt,
        },
      })
      expect(adminPatchRes.status, `admin REST PATCH on ${target.slug}`).toBe(200)

      // 3. Local API payload.update with overrideAccess: false as editor and admin (R-8)
      await payload.update({
        collection: target.slug,
        id: target.id,
        user: editorUser,
        overrideAccess: false,
        data: {
          ...target.extraPatch,
          createdAt: forgedCreatedAt,
        },
      })

      await payload.update({
        collection: target.slug,
        id: target.id,
        user: adminUser,
        overrideAccess: false,
        data: {
          ...target.extraPatch,
          createdAt: forgedCreatedAt,
        },
      })

      const fetched = (await payload.findByID({
        collection: target.slug,
        id: target.id,
        depth: 0,
        overrideAccess: true,
      })) as { createdAt: string }

      expect(fetched.createdAt, `${target.slug} createdAt must remain immutable`).toBe(
        target.originalCreatedAt,
      )
      expect(fetched.createdAt).not.toBe(forgedCreatedAt)
    }

    // Also verify bulk REST PATCH on quote-requests cannot rewrite createdAt
    const bulkPatchRes = await callJsonApi({
      method: 'PATCH',
      slugPath: ['quote-requests'],
      query: { 'where[id][equals]': String(quoteDoc.id) },
      token: adminToken,
      body: {
        status: 'quoted',
        createdAt: forgedCreatedAt,
      },
    })
    expect(bulkPatchRes.status).toBe(200)
    const quoteAfterBulk = await payload.findByID({
      collection: 'quote-requests',
      id: quoteDoc.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(quoteAfterBulk.createdAt).toBe(quoteDoc.createdAt)
    expect(quoteAfterBulk.status).toBe('quoted')
  })
})
