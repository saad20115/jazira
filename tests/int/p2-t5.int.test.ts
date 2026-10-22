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
process.env.MEDIA_DIR = path.resolve(process.cwd(), 'tmp-test-media-p2-t5')
process.env.VIDEOS_DIR = path.resolve(process.cwd(), 'tmp-test-videos-p2-t5')

type RouteHandler = (
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
) => Promise<Response>

let payload: Payload
let restGet: RouteHandler
let restPost: RouteHandler
let restDelete: RouteHandler
let adminToken = ''
let editorToken = ''
let editorUser: Record<string, unknown>
let mediaId: number | string
let videoId: number | string
let statIds: Array<number | string> = []

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

const buildParagraphLexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'rtl' as const,
    children: paragraphs.map((p) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'rtl' as const,
      textFormat: 0,
      textStyle: '',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: p,
          version: 1,
        },
      ],
    })),
  },
})

interface JsonApiResponse {
  status: number
  body: Record<string, unknown>
}

async function callJsonApi(options: {
  method: 'GET' | 'POST' | 'DELETE'
  slugPath: string[]
  query?: Record<string, string>
  body?: Record<string, unknown>
  token?: string
}): Promise<JsonApiResponse> {
  const { method, slugPath, query = {}, body, token } = options
  const url = new URL(`http://localhost:3000/api/${slugPath.join('/')}`)
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v)
  }

  const headers = new Headers()
  headers.set('Origin', 'http://localhost:3000')
  if (body !== undefined) {
    headers.set('content-type', 'application/json')
  }
  if (token) {
    headers.set('cookie', `payload-token=${token}`)
    headers.set('authorization', `JWT ${token}`)
  }

  const request = new Request(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const routeArgs = { params: Promise.resolve({ slug: slugPath }) }
  const response =
    method === 'GET'
      ? await restGet(request, routeArgs)
      : method === 'DELETE'
        ? await restDelete(request, routeArgs)
        : await restPost(request, routeArgs)

  const text = await response.text()
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(text) as Record<string, unknown>
  } catch {
    parsed = { raw: text }
  }

  return {
    status: response.status,
    body: parsed,
  }
}

describe('P2-T5 integration suite (Globals: site-settings, navigation, home-page, services-page, about-page, projects-page, contact-page, privacy-page)', () => {
  const adminEmail = 'admin-p2t5@aljazira.co'
  const editorEmail = 'editor-p2t5@aljazira.co'
  const strongPassword = 'Str0ng!Pass#2026_AlJazira'

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
    restDelete = routesModule.REST_DELETE(configModule.default)

    payload = await getPayload({ config: configModule.default })
    await payload.db.migrateFresh({ forceAcceptWarning: true })

    // 1. Register first user (admin)
    const firstReg = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'first-register'],
      body: {
        email: adminEmail,
        password: strongPassword,
        name: 'مدير النظام',
      },
    })
    expect(firstReg.status).toBe(200)

    const adminLogin = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      body: { email: adminEmail, password: strongPassword },
    })
    expect(adminLogin.status).toBe(200)
    adminToken = adminLogin.body.token as string

    // 2. Create editor user
    const createdEditor = await payload.create({
      collection: 'users',
      data: {
        email: editorEmail,
        password: strongPassword,
        name: 'محرر الصفحات',
        role: 'editor',
      },
      overrideAccess: true,
    })
    editorUser = createdEditor as unknown as Record<string, unknown>

    const editorLogin = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      body: { email: editorEmail, password: strongPassword },
    })
    expect(editorLogin.status).toBe(200)
    editorToken = editorLogin.body.token as string

    // 3. Create media, video, and 5 stats for global relationships
    const pngBuffer = await sharp({
      create: {
        width: 80,
        height: 60,
        channels: 3,
        background: { r: 1, g: 16, b: 37 },
      },
    })
      .png()
      .toBuffer()

    const mediaDoc = await payload.create({
      collection: 'media',
      locale: 'ar',
      data: {
        alt: 'صورة خلفية للصفحات',
      },
      file: {
        data: pngBuffer,
        mimetype: 'image/png',
        name: 'global-hero.png',
        size: pngBuffer.length,
      },
      overrideAccess: true,
    })
    mediaId = mediaDoc.id

    const mp4Buf = createMinimalMp4Buffer(64)
    const videoDoc = await payload.create({
      collection: 'videos',
      locale: 'ar',
      data: {
        title: 'فيديو الواجهة الرئيسية',
      },
      file: {
        data: mp4Buf,
        mimetype: 'video/mp4',
        name: 'hero-bg.mp4',
        size: mp4Buf.length,
      },
      overrideAccess: true,
    })
    videoId = videoDoc.id

    const statConfigs = [
      { value: '45+', ar: 'عاماً من الخبرة الهندسية', en: 'Years of Experience' },
      { value: '100+', ar: 'مشروع منجز', en: 'Completed Projects' },
      { value: '85%', ar: 'تنفيذ ذاتي بالكوادر الداخلية', en: 'Self-Performed Work' },
      { value: '21+', ar: 'تخصص كهروميكانيكي', en: 'MEP Disciplines' },
      { value: '3', ar: 'دول خليجية مخدومة', en: 'Countries Served' },
    ]
    statIds = []
    for (let i = 0; i < statConfigs.length; i += 1) {
      const s = await payload.create({
        collection: 'stats',
        locale: 'ar',
        data: {
          value: statConfigs[i].value,
          label: statConfigs[i].ar,
          order: i + 1,
        },
        overrideAccess: true,
      })
      await payload.update({
        collection: 'stats',
        id: s.id,
        locale: 'en',
        data: {
          label: statConfigs[i].en,
        },
        overrideAccess: true,
      })
      statIds.push(s.id)
    }
  }, 120_000)

  afterAll(async () => {
    const mediaDir = process.env.MEDIA_DIR ?? ''
    const videosDir = process.env.VIDEOS_DIR ?? ''
    await fs.rm(mediaDir, { recursive: true, force: true })
    await fs.rm(videosDir, { recursive: true, force: true })
  }, 60_000)

  it('enforces site-settings admin-only update (Z1): anonymous & editor cannot update, admin can update, and anonymous can read', async () => {
    // 1. Anonymous cannot update site-settings
    const anonUpdate = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'site-settings'],
      body: {
        companyName: 'Hacked Co',
      },
    })
    expect(anonUpdate.status).toBe(403)

    // 2. Editor cannot update site-settings (REST)
    const editorUpdate = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'site-settings'],
      token: editorToken,
      body: {
        companyName: 'Editor Attempt Co',
      },
    })
    expect(editorUpdate.status).toBe(403)

    // 3. Editor cannot update site-settings via Local API with overrideAccess: false
    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        user: editorUser,
        overrideAccess: false,
        data: {
          companyName: 'Editor Local API Attempt',
        },
      }),
    ).rejects.toThrow()

    // 4. Admin rejects unsafe URL scheme in socials or mapUrl (I3)
    const unsafeSocialUpdate = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'site-settings'],
      token: adminToken,
      body: {
        companyName: 'شركة الجزيرة الإمداد الذكي',
        email: 'info@aljazira.co',
        phone: '+966 57 353 4185',
        whatsapp: '966573534185',
        socials: [{ platform: 'linkedin', url: 'javascript:alert(1)' }],
      },
    })
    expect(unsafeSocialUpdate.status).toBe(400)

    // 5. Admin updates site-settings in ar and en
    const adminUpdateAr = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'site-settings'],
      query: { locale: 'ar' },
      token: adminToken,
      body: {
        companyName: 'شركة الجزيرة الإمداد الذكي',
        tagline: 'المقاولات الكهروميكانيكية · مكافحة الحريق · الأنظمة الذكية',
        email: 'info@aljazira.co',
        phone: '+966 57 353 4185',
        whatsapp: '966573534185',
        whatsappLabel: 'تحدث مع مهندس مختص',
        address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
        mapUrl: 'https://maps.google.com/?q=Makkah',
        workingHours: 'الأحد – الخميس، 8:00 صباحاً – 5:00 مساءً',
        office: {
          title: 'المقر الرئيسي',
          address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
          mapImage: mediaId,
          mapUrl: 'https://maps.google.com/?q=7676+Bathaa+Quraish+Makkah',
        },
        socials: [
          { platform: 'linkedin', url: 'https://www.linkedin.com/company/aljazira' },
          { platform: 'x', url: 'https://x.com/aljazira' },
          { platform: 'whatsapp', url: 'https://wa.me/966573534185' },
        ],
        footerText:
          'شركة رائدة في المقاولات الكهروميكانيكية في منطقة الخليج بخبرة تتجاوز 45 عاماً.',
        copyright: '© 2026 شركة الجزيرة الإمداد الذكي. جميع الحقوق محفوظة.',
        defaultSeo: {
          title: 'شركة الجزيرة الإمداد الذكي | مقاولات MEP والأنظمة الذكية',
          description: 'خبرة تتجاوز 45 عاماً في تنفيذ المشاريع الكهروميكانيكية ومكافحة الحريق.',
          image: mediaId,
        },
      },
    })
    expect(adminUpdateAr.status).toBe(200)

    const adminUpdateEn = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'site-settings'],
      query: { locale: 'en' },
      token: adminToken,
      body: {
        companyName: 'Al Jazira for Imdad Smart Company',
        tagline: 'MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS',
        whatsappLabel: 'Chat with an engineer',
        address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
        workingHours: 'Sunday – Thursday, 8:00 AM – 5:00 PM',
        office: {
          title: 'Head office',
          address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
        },
        footerText:
          'A leading MEP construction company in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over 45 years of experience.',
        copyright: '© 2026 Al Jazira for Imdad Smart Company. All rights reserved.',
        defaultSeo: {
          title: 'Al Jazira for Imdad Smart Co. | MEP & Smart Systems Contractor',
          description: 'Over 45 years of MEP engineering excellence across the Gulf region.',
        },
      },
    })
    expect(adminUpdateEn.status).toBe(200)

    // 6. Anonymous GET /api/globals/site-settings succeeds in both ar and en
    const anonGetAr = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'site-settings'],
      query: { locale: 'ar' },
    })
    expect(anonGetAr.status).toBe(200)
    expect(anonGetAr.body.companyName).toBe('شركة الجزيرة الإمداد الذكي')
    expect(anonGetAr.body.email).toBe('info@aljazira.co')

    const anonGetEn = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'site-settings'],
      query: { locale: 'en' },
    })
    expect(anonGetEn.status).toBe(200)
    expect(anonGetEn.body.companyName).toBe('Al Jazira for Imdad Smart Company')
    expect(anonGetEn.body.tagline).toBe('MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS')
  })

  it('allows editor and admin to update navigation, preserves array order, and enforces I3 link validation', async () => {
    // 1. Anonymous cannot update navigation
    const anonUpdate = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'navigation'],
      body: { header: [] },
    })
    expect(anonUpdate.status).toBe(403)

    // 2. Editor rejects unsafe javascript: link in header
    const unsafeNav = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'navigation'],
      token: editorToken,
      body: {
        header: [
          {
            label: 'Unsafe Link',
            link: {
              type: 'external',
              url: 'javascript:alert(1)',
            },
          },
        ],
      },
    })
    expect(unsafeNav.status).toBe(400)

    // 3. Editor updates navigation in ar and en with ordered header links & footer columns
    const editorUpdateAr = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'navigation'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        header: [
          { label: 'خدماتنا', link: { type: 'internal', internalRoute: '/services' } },
          { label: 'من نحن', link: { type: 'internal', internalRoute: '/about' } },
          { label: 'مشاريعنا', link: { type: 'internal', internalRoute: '/projects' } },
          { label: 'تواصل معنا', link: { type: 'internal', internalRoute: '/contact' } },
        ],
        headerCta: {
          label: 'اطلب عرض سعر',
          link: { type: 'internal', internalRoute: '/contact' },
        },
        footer: [
          {
            title: 'روابط سريعة',
            links: [
              { label: 'الرئيسية', link: { type: 'internal', internalRoute: '/' } },
              { label: 'خدماتنا', link: { type: 'internal', internalRoute: '/services' } },
              { label: 'من نحن', link: { type: 'internal', internalRoute: '/about' } },
              { label: 'مشاريعنا', link: { type: 'internal', internalRoute: '/projects' } },
              { label: 'تواصل معنا', link: { type: 'internal', internalRoute: '/contact' } },
            ],
          },
        ],
        footerCta: {
          title: 'هل لديك مشروع قيد التخطيط؟',
          text: 'أرسل لنا المخططات أو جدول الكميات وسيتواصل معك مهندسونا خلال يوم عمل واحد.',
          button: {
            label: 'اطلب عرض سعر',
            link: { type: 'internal', internalRoute: '/contact' },
          },
          whatsappLabel: 'تحدث عبر واتساب',
        },
      },
    })
    expect(editorUpdateAr.status).toBe(200)

    const anonReadNav = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'navigation'],
      query: { locale: 'ar' },
    })
    expect(anonReadNav.status).toBe(200)
    const headerItems = anonReadNav.body.header as Array<{ label: string }>
    expect(headerItems.map((h) => h.label)).toEqual(['خدماتنا', 'من نحن', 'مشاريعنا', 'تواصل معنا'])
  })

  it('enforces Z2 on home-page (and all publishable page globals): anonymous REST GET /api/globals/home-page returns published version only while a newer draft exists', async () => {
    // 1. Save initial draft of home-page via editor
    const draftSave1 = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        hero: {
          enabled: true,
          eyebrow: 'مسودة أولية غير منشورة',
          title: 'عنوان المسودة الأولى فقط',
          subtitle: 'هذا المحتوى مسودة ولا يجب أن يظهر للزوار',
          background: mediaId,
        },
      },
    })
    expect(draftSave1.status).toBe(200)

    // Anonymous GET /api/globals/home-page (and ?draft=true) must NOT leak the unpublished draft
    const anonBeforePublish = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
    })
    expect(anonBeforePublish.status).toBe(200)
    expect((anonBeforePublish.body.hero as { title?: string } | undefined)?.title).toBeUndefined()

    const anonDraftQueryBeforePublish = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
    })
    expect(anonDraftQueryBeforePublish.status).toBe(200)
    expect(
      (anonDraftQueryBeforePublish.body.hero as { title?: string } | undefined)?.title,
    ).toBeUndefined()

    // Anonymous cannot access /api/globals/home-page/versions
    const anonVersions = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page', 'versions'],
    })
    expect(anonVersions.status).toBe(403)

    // 2. Publish home-page with full Addendum structure
    const publishSave = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'published',
        hero: {
          enabled: true,
          eyebrow: '+45 عاماً من التميز الهندسي',
          title: 'نبني المستقبل بحلول هندسية ذكية',
          subtitle:
            'شركة الجزيرة الإمداد الذكي رائدة في المقاولات الكهروميكانيكية وأنظمة مكافحة الحريق والأنظمة الذكية في منطقة الخليج.',
          background: mediaId,
          primaryCta: {
            label: 'استكشف خدماتنا',
            link: { type: 'internal', internalRoute: '/services' },
          },
          secondaryCta: {
            label: 'استعرض المشاريع',
            link: { type: 'internal', internalRoute: '/projects' },
          },
        },
        whoWeAre: {
          enabled: true,
          badgeStat: statIds[0],
          eyebrow: 'من نحن',
          title: 'تميز هندسي منذ عام 1979',
          text: buildParagraphLexical([
            'بخبرة تقارب خمسة عقود في أسواق الخليج، رسخت شركة الجزيرة الإمداد الذكي مكانتها كمقاول متخصص وموثوق للأعمال الكهروميكانيكية.',
            'ننفذ حزم MEP المتكاملة عبر مهندسينا وفنيينا الداخليين بنسبة 85% لضمان أعلى معايير الجودة والالتزام بالجدول الزمني.',
          ]),
          button: {
            label: 'تعرف علينا أكثر',
            link: { type: 'internal', internalRoute: '/about' },
          },
          image: mediaId,
        },
        coreServices: {
          enabled: true,
          eyebrow: 'خدماتنا الأساسية',
          title: 'خدمات كهروميكانيكية وإنشائية متكاملة تحت سقف عقد واحد',
          intro: 'من تنسيق التصميم إلى الفحص والتشغيل التجريبي والتسليم.',
          button: {
            label: 'عرض جميع الخدمات',
            link: { type: 'internal', internalRoute: '/services' },
          },
        },
        interactiveSystems: {
          enabled: true,
          eyebrow: 'الأنظمة التفاعلية',
          title: 'كل نظام هندسي، فريق واحد مسؤول',
          intro: 'اختر نظاماً لتتعرف على كيفية تصميمه وتركيبه واختباره وتشغيله.',
          heroImage: mediaId,
          relatedProjectsLabel: 'مشاريع ذات صلة',
          liveModelLabel: 'افتح المجسم التفاعلي ثلاثي الأبعاد',
          systems: [
            {
              title: 'التكييف والمياه المبردة (HVAC)',
              text: 'الشيلرات ووحدات مناولة الهواء ومجاري الهواء وإدارة الدخان.',
              shot: 'hvac',
              disciplines: ['hvac'],
            },
            {
              title: 'مكافحة الحريق والإنذار',
              text: 'مضخات الحريق وشبكات الرش الآلي والإطفاء بالغازات النظيفة.',
              shot: 'fire',
              disciplines: ['fire-fighting'],
            },
            {
              title: 'السباكة والصرف وإمدادات المياه',
              text: 'مجموعات رفع الضغط والخزانات وشبكات التغذية والصرف.',
              shot: 'plumbing',
              disciplines: ['plumbing'],
            },
            {
              title: 'توزيع الطاقة والإنارة',
              text: 'لوحات الجهد المتوسط والمنخفض والقضبان النحاسية والمولدات الاحتياطية.',
              shot: 'power',
              disciplines: ['electrical'],
            },
            {
              title: 'الأنظمة الذكية والتيار الخفيف وBMS',
              text: 'الكابلات الهيكلية وغرف البيانات وكاميرات المراقبة وأتمتة المباني.',
              shot: 'smart',
              disciplines: ['low-current', 'data-center'],
            },
          ],
        },
        statsSection: {
          enabled: true,
          title: 'ثقة رواد الصناعة',
          text: 'أرقامنا تتحدث عن عقود من الحلول الهندسية الموثوقة في الخليج.',
          stats: statIds.slice(0, 4),
        },
        featuredProjects: {
          enabled: true,
          eyebrow: 'سجل أعمالنا',
          title: 'مشاريعنا المميزة',
          intro: 'نخبة من أبرز مشاريع المقاولات الكهروميكانيكية والأنظمة الذكية.',
          button: {
            label: 'عرض جميع المشاريع',
            link: { type: 'internal', internalRoute: '/projects' },
          },
        },
        partners: {
          enabled: true,
          eyebrow: 'شركاء النجاح',
          title: 'شركاؤنا المعتمدون',
          intro: 'نتعاون مع كبرى العلامات التجارية العالمية لتقديم أعلى مستويات الجودة.',
        },
        cta: {
          enabled: true,
          title: 'هل أنت مستعد لبناء مشروعك القادم؟',
          text: 'تواصل معنا اليوم للحصول على استشارة هندسية مجانية.',
          button: {
            label: 'تواصل معنا اليوم',
            link: { type: 'internal', internalRoute: '/contact' },
          },
          secondaryButton: {
            label: 'اتصل بنا الآن',
            link: { type: 'external', url: 'tel:+966573534185' },
          },
          backgroundImage: mediaId,
        },
        meta: {
          title: 'الصفحة الرئيسية | شركة الجزيرة الإمداد الذكي',
          description: 'مقاولون متخصصون في الأعمال الكهروميكانيكية ومكافحة الحريق والأنظمة الذكية.',
          image: mediaId,
        },
      },
    })
    expect(publishSave.status).toBe(200)

    // 3. Anonymous GET /api/globals/home-page now returns the published version
    const anonPublished = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
    })
    expect(anonPublished.status).toBe(200)
    expect((anonPublished.body.hero as { title?: string }).title).toBe(
      'نبني المستقبل بحلول هندسية ذكية',
    )

    // 4. Editor saves a newer draft on home-page WITHOUT publishing
    const newerDraftSave = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        hero: {
          enabled: true,
          eyebrow: '+45 عاماً من التميز الهندسي',
          title: 'عنوان مسودة أحدث لم يُنشر بعد (سري)',
          subtitle: 'وصف مسودة جديدة قيد المراجعة',
          background: mediaId,
        },
      },
    })
    expect(newerDraftSave.status).toBe(200)

    // 5. Anonymous GET /api/globals/home-page (both normal and ?draft=true) MUST STILL return the published version!
    const anonWhileNewerDraftExists = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
    })
    expect(anonWhileNewerDraftExists.status).toBe(200)
    expect((anonWhileNewerDraftExists.body.hero as { title?: string }).title).toBe(
      'نبني المستقبل بحلول هندسية ذكية',
    )

    const anonDraftParamWhileNewerDraftExists = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
    })
    expect(anonDraftParamWhileNewerDraftExists.status).toBe(200)
    expect((anonDraftParamWhileNewerDraftExists.body.hero as { title?: string }).title).toBe(
      'نبني المستقبل بحلول هندسية ذكية',
    )

    // Local API with overrideAccess: false and no user also returns the published version even when draft: true is requested
    const localAnonRead = await payload.findGlobal({
      slug: 'home-page',
      locale: 'ar',
      draft: true,
      overrideAccess: false,
    })
    expect((localAnonRead.hero as { title?: string }).title).toBe('نبني المستقبل بحلول هندسية ذكية')

    // 6. Editor with ?draft=true sees the newer draft
    const editorDraftRead = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
    })
    expect(editorDraftRead.status).toBe(200)
    expect((editorDraftRead.body.hero as { title?: string }).title).toBe(
      'عنوان مسودة أحدث لم يُنشر بعد (سري)',
    )
  })

  it('enforces home-page invariants (hero.background xor hero.backgroundVideo, unique interactiveSystems.systems[].shot, statsSection max 4, and paragraphRichTextField AST limits)', async () => {
    // 1. Setting both hero.background and hero.backgroundVideo fails validation
    const bothHeroBgAndVideo = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'draft',
        hero: {
          title: 'تعارض صورة وفيديو',
          background: mediaId,
          backgroundVideo: videoId,
        },
      },
    })
    expect(bothHeroBgAndVideo.status).toBe(400)

    // 2. Duplicate shot in interactiveSystems.systems fails validation
    const duplicateShot = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'draft',
        interactiveSystems: {
          title: 'أنظمة مكررة',
          systems: [
            { title: 'نظام 1', text: 'وصف 1', shot: 'hvac', disciplines: ['hvac'] },
            { title: 'نظام 2', text: 'وصف 2', shot: 'hvac', disciplines: ['fire-fighting'] },
          ],
        },
      },
    })
    expect(duplicateShot.status).toBe(400)

    // 3. More than 4 stats in statsSection.stats fails validation
    const fiveStats = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'draft',
        statsSection: {
          title: '5 أرقام',
          stats: statIds, // 5 items
        },
      },
    })
    expect(fiveStats.status).toBe(400)

    // 4. Heading node inside paragraphRichTextField (whoWeAre.text) is rejected (paragraphs only)
    const headingInWhoWeAre = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'draft',
        whoWeAre: {
          title: 'من نحن',
          text: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              direction: 'rtl',
              children: [
                {
                  type: 'heading',
                  tag: 'h2',
                  format: '',
                  indent: 0,
                  version: 1,
                  direction: 'rtl',
                  children: [{ type: 'text', text: 'عنوان غير مسموح', version: 1 }],
                },
              ],
            },
          },
        },
      },
    })
    expect(headingInWhoWeAre.status).toBe(400)
  })

  it('verifies services-page, about-page, projects-page, contact-page, and privacy-page fields, draft/publish Z2 behaviour, and revalidation hooks', async () => {
    const revalidateTagSpy = vi.mocked(nextCache.revalidateTag)
    const revalidatePathSpy = vi.mocked(nextCache.revalidatePath)

    // 1. services-page publish
    revalidateTagSpy.mockClear()
    revalidatePathSpy.mockClear()

    const servicesPub = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'services-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'published',
        pageHeader: {
          enabled: true,
          title: 'خدماتنا الهندسية',
          subtitle: 'خدمات MEP متكاملة بنسبة تنفيذ ذاتي 85%.',
          image: mediaId,
        },
        servicesIntro: {
          enabled: true,
          eyebrow: 'الخدمات الرئيسية',
          title: 'حلول متكاملة',
          intro: 'من التصميم إلى التسليم.',
        },
        specialist: {
          enabled: true,
          eyebrow: 'خدمات إضافية',
          title: 'الخدمات التخصصية',
          intro: 'فرق متخصصة لكل نظام هندسي.',
        },
        materials: {
          enabled: true,
          eyebrow: 'المواد والعلامات التجارية',
          title: 'المواد والعلامات التجارية المعتمدة',
          intro: 'المواد والمصنعون المعتمدون في مشاريعنا.',
        },
        process: {
          enabled: true,
          eyebrow: 'كيف نعمل',
          title: 'من المعاينة إلى التسليم',
          intro: 'منهجية عمل واضحة وموثوقة.',
          steps: [
            { title: 'المعاينة والاستشارة', text: 'زيارة الموقع وتحديد المتطلبات.' },
            { title: 'التصميم والهندسة القيمية', text: 'مخططات تنفيذية منسقة.' },
            { title: 'التوريد والمشتريات', text: 'معدات أصلية من شركائنا.' },
            { title: 'التركيب والتنفيذ', text: 'بأيدي مهندسينا وفنيينا.' },
            { title: 'الفحص والتشغيل والتسليم', text: 'اختبارات T&C وTAB ومخططات As-Built.' },
          ],
        },
        cta: {
          enabled: true,
          title: 'هل أنت مستعد لبناء مشروعك القادم؟',
          text: 'تواصل معنا للحصول على استشارة مجانية.',
          button: {
            label: 'تواصل معنا اليوم',
            link: { type: 'internal', internalRoute: '/contact' },
          },
        },
      },
    })
    expect(servicesPub.status).toBe(200)
    expect(revalidateTagSpy.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining([
        'global:services-page',
        'global:services-page:ar',
        'global:services-page:en',
      ]),
    )
    expect(revalidatePathSpy.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(['/ar/services', '/en/services']),
    )

    // 2. about-page publish
    const aboutPub = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'about-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'published',
        pageHeader: {
          enabled: true,
          title: 'من نحن',
          subtitle: 'تعرف على قصة 45+ عاماً من التميز الهندسي.',
          image: mediaId,
        },
        story: {
          enabled: true,
          badgeStat: statIds[0],
          eyebrow: 'قصتنا',
          title: 'تميز هندسي منذ عام 1979',
          text: buildParagraphLexical([
            'شركة الجزيرة الإمداد الذكي (مجموعة إمداد سابقاً) اسم رائد في قطاع المقاولات الكهروميكانيكية.',
          ]),
          quote: 'تنمية المجتمع وخدمته بأعلى مستويات النزاهة والالتزام المهني.',
          quoteAuthor: 'أ. رشوان محمود — المؤسس',
          image: mediaId,
        },
        strengths: {
          enabled: true,
          eyebrow: 'لماذا تختارنا',
          title: 'نقاط قوتنا الأساسية',
          intro: 'خمسة عقود من بناء الثقة وتقديم الجودة.',
          items: [
            {
              title: 'خبرة عميقة في أسواق الخليج',
              text: 'فهم دقيق للمتطلبات المحلية والمعايير الدولية.',
            },
            { title: 'سجل حافل بالإنجازات', text: 'أكثر من 100 مشروع منجز بنجاح.' },
          ],
        },
        missionVision: {
          enabled: true,
          eyebrow: 'من نحن',
          title: 'رسالتنا ورؤيتنا',
          intro: 'الهدف وراء كل مشروع ننفذه.',
          mission: {
            eyebrow: 'رسالتنا',
            title: 'رسالتنا',
            text: 'تقديم مشاريع MEP عالمية الجودة بأمان وفي الوقت المحدد.',
            pillars: [
              { title: 'التميز الهندسي', text: 'حلول شاملة وفعالة.' },
              { title: 'السلامة أولاً', text: 'أعلى معايير الصحة والسلامة المهنية.' },
            ],
            image: mediaId,
          },
          vision: {
            eyebrow: 'رؤيتنا',
            title: 'رؤيتنا',
            text: 'أن نكون الرائد الإقليمي في صناعة المقاولات الكهروميكانيكية.',
            pillars: [{ title: 'توسيع الكفاءات الأساسية', text: 'تعزيز قدراتنا الكهروميكانيكية.' }],
            image: mediaId,
          },
          image: mediaId,
        },
        team: {
          enabled: true,
          eyebrow: 'فريقنا',
          title: 'تعرف على فريقنا',
          intro: 'نخبة من المهندسين والإداريين والفنيين.',
          staffTitle: 'الكفاءات التي تقف خلف كل مشروع',
          staffText: 'مهندسون ومشرفون وفنيون متخصصون من فريقنا الداخلي.',
        },
      },
    })
    expect(aboutPub.status).toBe(200)

    // 3. projects-page publish
    revalidateTagSpy.mockClear()
    revalidatePathSpy.mockClear()

    const projectsPub = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'projects-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'published',
        pageHeader: {
          enabled: true,
          title: 'مشاريعنا',
          subtitle: 'أكثر من 100 مشروع منجز في الخليج.',
          image: mediaId,
        },
        impact: {
          enabled: true,
          title: 'أثرنا بالأرقام',
          text: 'محطات رئيسية وإنجازات موثقة على مدى أربعة عقود.',
          stats: statIds.slice(0, 4),
        },
        portfolio: {
          enabled: true,
          eyebrow: 'محفظة أعمالنا',
          title: 'مشاريع تجسد التميز الهندسي',
          text: buildParagraphLexical([
            'نفذت الشركة مشاريع كهروميكانيكية بارزة تشمل الأبراج الفندقية ومراكز البيانات والجامعات.',
          ]),
          quote: 'هندسة المشاريع الكبرى بجودة ودقة وسلامة لا تقبل المساومة.',
          quoteAuthor: 'شركة الجزيرة الإمداد الذكي',
          badgeStat: statIds[1],
          image: mediaId,
        },
        cta: {
          enabled: true,
          title: 'هل لديك مشروع قيد الدراسة؟',
          text: 'دع خبرتنا التي تتجاوز 45 عاماً تعمل لصالح مشروعك القادم.',
          button: {
            label: 'اطلب عرض سعر',
            link: { type: 'internal', internalRoute: '/contact' },
          },
        },
      },
    })
    expect(projectsPub.status).toBe(200)
    expect(revalidateTagSpy.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining([
        'global:projects-page',
        'global:projects-page:ar',
        'global:projects-page:en',
        'collection:projects',
        'collection:projects:ar',
        'collection:projects:en',
      ]),
    )

    // 4. contact-page publish
    const contactPub = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'contact-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'published',
        pageHeader: {
          enabled: true,
          title: 'تواصل معنا',
          subtitle: 'يسعدنا دائماً الاستماع إليك وتقديم استشارة مجانية.',
          image: mediaId,
        },
        getInTouch: {
          enabled: true,
          eyebrow: 'تواصل معنا',
          title: 'لنتحدث عن مشروعك',
          intro: 'اطلب عرض سعر للمقاولات أو التوريد أو تحدث مباشرة مع مهندس مختص.',
        },
        findOffice: {
          enabled: true,
          eyebrow: 'موقعنا',
          title: 'تفضل بزيارة مكتبنا',
          intro: 'نسعد بلقائكم في مقرنا الرئيسي بمكة المكرمة.',
        },
      },
    })
    expect(contactPub.status).toBe(200)

    // 5. privacy-page saved as draft (placeholder stays in draft per Addendum line 239)
    revalidateTagSpy.mockClear()
    const privacyDraft = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'privacy-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        pageHeader: {
          enabled: true,
          title: '[placeholder] سياسة الخصوصية',
          subtitle: '[placeholder] مسودة بانتظار اعتماد النص القانوني من العميل.',
        },
        enabled: true,
        body: buildParagraphLexical([
          '[placeholder] نص سياسة الخصوصية قيد المراجعة والاعتماد من العميل (D4).',
        ]),
      },
    })
    expect(privacyDraft.status).toBe(200)
    // Draft save must not trigger revalidation
    expect(revalidateTagSpy).not.toHaveBeenCalled()

    // Anonymous GET /api/globals/privacy-page does not expose the draft placeholder
    const anonPrivacy = await callJsonApi({
      method: 'GET',
      slugPath: ['globals', 'privacy-page'],
      query: { locale: 'ar' },
    })
    expect(anonPrivacy.status).toBe(200)
    expect((anonPrivacy.body.pageHeader as { title?: string } | undefined)?.title).toBeUndefined()

    // 6. R-4: Saving a draft (?draft=true) on an already-published global (services-page) triggers zero revalidations
    revalidateTagSpy.mockClear()
    revalidatePathSpy.mockClear()

    const draftOnPublishedServices = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'services-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        pageHeader: {
          enabled: true,
          title: 'مسودة قيد التعديل على صفحة منشورة',
          subtitle: 'لا يجب أن تبطل الكاش العام',
          image: mediaId,
        },
      },
    })
    expect(draftOnPublishedServices.status).toBe(200)
    expect(revalidateTagSpy).not.toHaveBeenCalled()
    expect(revalidatePathSpy).not.toHaveBeenCalled()

    // Unpublishing services-page (without ?draft=true, transitioning main global from published -> draft) DOES revalidate
    const unpublishServices = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'services-page'],
      query: { locale: 'ar' },
      token: editorToken,
      body: {
        _status: 'draft',
        pageHeader: {
          enabled: true,
          title: 'صفحة خدمات تم إلغاء نشرها',
          image: mediaId,
        },
      },
    })
    expect(unpublishServices.status).toBe(200)
    expect(revalidateTagSpy.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining([
        'global:services-page',
        'global:services-page:ar',
        'global:services-page:en',
      ]),
    )
    expect(revalidatePathSpy.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(['/ar/services', '/en/services']),
    )
  })

  it('returns HTTP 400 with field errors for invalid relationship IDs and enum values on global draft and published saves (R-6)', async () => {
    // 1. Invalid hero.background media ID on draft save
    const badHeroBgDraft = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        hero: {
          title: 'صورة غير موجودة',
          background: 999999,
        },
      },
    })
    expect(badHeroBgDraft.status).toBe(400)
    expect(
      (badHeroBgDraft.body.errors as Array<{ data?: { errors?: Array<{ path?: string }> } }>)[0]
        ?.data?.errors,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'hero.background' })]))

    // 2. Invalid statsSection.stats ID on draft save
    const badStatsDraft = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        statsSection: {
          title: 'إحصائية غير موجودة',
          stats: [999999],
        },
      },
    })
    expect(badStatsDraft.status).toBe(400)
    expect(
      (badStatsDraft.body.errors as Array<{ data?: { errors?: Array<{ path?: string }> } }>)[0]
        ?.data?.errors,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'statsSection.stats' })]))

    // 3. Invalid meta.image ID on draft save
    const badMetaImageDraft = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'en', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        meta: {
          title: 'Invalid Meta Image',
          image: 999999,
        },
      },
    })
    expect(badMetaImageDraft.status).toBe(400)
    expect(
      (badMetaImageDraft.body.errors as Array<{ data?: { errors?: Array<{ path?: string }> } }>)[0]
        ?.data?.errors,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'meta.image' })]))

    // 4. Invalid interactiveSystems shot / disciplines enum on draft save
    const badEnumDraft = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        interactiveSystems: {
          title: 'خيار غير صالح',
          systems: [
            {
              title: 'نظام تجريبي',
              text: 'وصف',
              shot: 'invalid-shot',
              disciplines: ['NOT_A_VALID_SCOPE'],
            },
          ],
        },
      },
    })
    expect(badEnumDraft.status).toBe(400)
    expect(
      (badEnumDraft.body.errors as Array<{ data?: { errors?: Array<{ path?: string }> } }>)[0]?.data
        ?.errors,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'interactiveSystems.systems.0.shot' }),
        expect.objectContaining({ path: 'interactiveSystems.systems.0.disciplines' }),
      ]),
    )

    // 5. Invalid social platform or mapImage on site-settings
    const badSiteSettings = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'site-settings'],
      query: { locale: 'ar' },
      token: adminToken,
      body: {
        office: {
          mapImage: 999999,
        },
        socials: [
          {
            platform: 'invalid-platform',
            url: 'https://linkedin.com/company/aljazira',
          },
        ],
      },
    })
    expect(badSiteSettings.status).toBe(400)
    expect(
      (badSiteSettings.body.errors as Array<{ data?: { errors?: Array<{ path?: string }> } }>)[0]
        ?.data?.errors,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'office.mapImage' }),
        expect.objectContaining({ path: 'socials.0.platform' }),
      ]),
    )
  })

  it('prevents deleting media referenced by globals in localized meta.image or richText body upload nodes (R-7)', async () => {
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    )

    const enGlobalMetaMedia = await payload.create({
      collection: 'media',
      locale: 'ar',
      data: { alt: 'صورة ميتا إنجليزية للصفحة الرئيسية' },
      file: {
        data: tinyPng,
        mimetype: 'image/png',
        name: 'p2-t5-en-meta.png',
        size: tinyPng.byteLength,
      },
      overrideAccess: true,
    })

    const privacyBodyUploadMedia = await payload.create({
      collection: 'media',
      locale: 'ar',
      data: { alt: 'صورة مضمنة في سياسة الخصوصية' },
      file: {
        data: tinyPng,
        mimetype: 'image/png',
        name: 'p2-t5-privacy-body.png',
        size: tinyPng.byteLength,
      },
      overrideAccess: true,
    })

    // 1. Reference enGlobalMetaMedia ONLY in English meta.image of home-page
    const saveEnMeta = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'en', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        meta: {
          title: 'English Home Meta',
          image: enGlobalMetaMedia.id,
        },
      },
    })
    expect(saveEnMeta.status).toBe(200)

    const delEnGlobalMetaBlocked = await callJsonApi({
      method: 'DELETE',
      slugPath: ['media', String(enGlobalMetaMedia.id)],
      token: adminToken,
    })
    expect(delEnGlobalMetaBlocked.status).toBe(400)

    // Clear English meta.image and verify deletion succeeds
    await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'en', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        meta: {
          title: 'English Home Meta',
          image: null,
        },
      },
    })
    // Also publish without the image so no version/main row holds it
    await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'home-page'],
      query: { locale: 'en' },
      token: editorToken,
      body: {
        _status: 'published',
        meta: {
          title: 'English Home Meta',
          image: null,
        },
      },
    })

    const delEnGlobalMetaAllowed = await callJsonApi({
      method: 'DELETE',
      slugPath: ['media', String(enGlobalMetaMedia.id)],
      token: adminToken,
    })
    expect(delEnGlobalMetaAllowed.status).toBe(200)

    // 2. Reference privacyBodyUploadMedia ONLY inside privacy-page.body richText upload node
    const savePrivacyWithUpload = await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'privacy-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        enabled: true,
        body: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'rtl',
            children: [
              {
                type: 'upload',
                relationTo: 'media',
                value: privacyBodyUploadMedia.id,
                format: '',
                version: 2,
              },
            ],
          },
        },
      },
    })
    expect(savePrivacyWithUpload.status).toBe(200)

    const delPrivacyBodyMediaBlocked = await callJsonApi({
      method: 'DELETE',
      slugPath: ['media', String(privacyBodyUploadMedia.id)],
      token: adminToken,
    })
    expect(delPrivacyBodyMediaBlocked.status).toBe(400)

    // Replace body without the upload node and verify deletion succeeds
    await callJsonApi({
      method: 'POST',
      slugPath: ['globals', 'privacy-page'],
      query: { locale: 'ar', draft: 'true' },
      token: editorToken,
      body: {
        _status: 'draft',
        enabled: true,
        body: buildParagraphLexical([
          '[placeholder] نص سياسة الخصوصية قيد المراجعة والاعتماد من العميل (D4).',
        ]),
      },
    })

    const delPrivacyBodyMediaAllowed = await callJsonApi({
      method: 'DELETE',
      slugPath: ['media', String(privacyBodyUploadMedia.id)],
      token: adminToken,
    })
    expect(delPrivacyBodyMediaAllowed.status).toBe(200)
  })
})
