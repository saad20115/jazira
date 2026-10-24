import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Self-contained machine-captured evidence generator for `P3-T12`
 * ("English default + admin Arabic on/off switch", `handoff/tasks/P3-T12.md`).
 *
 * Usage:
 *   node scripts/evidence/p3-t12-evidence.mjs [baseUrl] [evidenceDir] [phase3Dir]
 */

const ADMIN_EMAIL = 'p3-t12-evidence-admin@aljazira.co'
const ADMIN_PASSWORD = 'Strong!AdminPassword#2026'
const EDITOR_EMAIL = 'p3-t12-evidence-editor@aljazira.co'
const EDITOR_PASSWORD = 'Strong!EditorPassword#2026'

function resolvePreviewSecretFromEnv() {
  let payloadSecret = process.env.PAYLOAD_SECRET || ''
  if (!payloadSecret) {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envText = fs.readFileSync(envPath, 'utf8')
      const m = envText.match(/^PAYLOAD_SECRET=(.+)$/m)
      if (m && m[1]) {
        payloadSecret = m[1].trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }
  return crypto
    .createHmac('sha256', payloadSecret)
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

function getRepoHeaderBlock() {
  const cwd = process.cwd()
  let head = 'unknown'
  try {
    head = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim()
  } catch {
    // ignore
  }
  return [`$ pwd`, cwd, `$ git rev-parse HEAD`, head, ''].join('\n')
}

async function saveCompressedPng(inputBuffer, outPath, maxWidth = 1440) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(inputBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 85 })
    .toFile(outPath)
}

function makeLexical(paragraphs, direction = 'ltr') {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction,
        children: [
          { type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 },
        ],
      })),
    },
  }
}

async function ensureAdminAndEditorTokens(baseUrl) {
  await fetch(`${baseUrl}/api/users/first-register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Evidence Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  }).catch(() => null)

  const candidates = [
    { email: 'admin@aljazira.local', password: 'Passw0rd!StrongAdmin2026' },
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    { email: 'e2e-admin@aljazira.co', password: ADMIN_PASSWORD },
  ]

  let adminToken = null
  for (const cred of candidates) {
    const res = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cred),
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.token) {
        adminToken = json.token
        break
      }
    }
  }

  if (!adminToken) {
    throw new Error('Could not authenticate admin user for P3-T12 evidence')
  }

  // Ensure editor user exists
  const existingEditorRes = await fetch(
    `${baseUrl}/api/users?where[email][equals]=${encodeURIComponent(EDITOR_EMAIL)}&limit=1`,
    {
      headers: { Authorization: `JWT ${adminToken}` },
    },
  )
  const existingEditorJson = existingEditorRes.ok ? await existingEditorRes.json() : { docs: [] }
  if (!existingEditorJson.docs || existingEditorJson.docs.length === 0) {
    const createEditorRes = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Evidence Editor',
        email: EDITOR_EMAIL,
        password: EDITOR_PASSWORD,
        role: 'editor',
      }),
    })
    if (!createEditorRes.ok) {
      throw new Error(`Failed to create editor user: ${String(createEditorRes.status)}`)
    }
  }

  const editorLoginRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: EDITOR_EMAIL,
      password: EDITOR_PASSWORD,
    }),
  })
  if (!editorLoginRes.ok) {
    throw new Error(`Failed to log in editor user: ${String(editorLoginRes.status)}`)
  }
  const editorLoginJson = await editorLoginRes.json()

  return {
    adminToken,
    editorToken: editorLoginJson.token,
  }
}

async function seedMinimalHomeAndSettings(baseUrl, adminToken, arabicEnabled) {
  const authHeaders = {
    Authorization: `JWT ${adminToken}`,
    'content-type': 'application/json',
  }

  await fetch(`${baseUrl}/api/globals/site-settings?locale=en`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Al Jazira for Imdad Smart Co.',
      tagline: 'MEP & Smart Engineering Solutions · Riyadh, KSA',
      arabicEnabled,
      phone: '+966 57 353 4185',
      email: 'info@aljazira-imdad.sa',
      whatsapp: '966573534185',
      address: 'King Fahd Road, Al Olaya District, Riyadh, Kingdom of Saudi Arabia',
      defaultSeo: {
        title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering',
        description:
          'Integrated electromechanical, HVAC, firefighting, and smart engineering contracting in Saudi Arabia.',
      },
    }),
  })

  await fetch(`${baseUrl}/api/globals/site-settings?locale=ar`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'شركة الجزيرة للإمداد الذكي',
      tagline: 'حلول الكهروميكانيك والهندسة الذكية · الرياض، المملكة العربية السعودية',
      arabicEnabled,
      phone: '+966 57 353 4185',
      email: 'info@aljazira-imdad.sa',
      whatsapp: '966573534185',
      address: 'طريق الملك فهد، حي العليا، الرياض، المملكة العربية السعودية',
      defaultSeo: {
        title: 'شركة الجزيرة للإمداد الذكي — مقاولات الكهروميكانيك والأنظمة الذكية',
        description:
          'مقاولات متكاملة في الأنظمة الكهروميكانيكية والتكييف ومكافحة الحريق والأنظمة الذكية في المملكة العربية السعودية.',
      },
    }),
  })

  await fetch(`${baseUrl}/api/globals/home-page?locale=en`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      _status: 'published',
      hero: {
        enabled: true,
        eyebrow: 'MEP & SMART ENGINEERING CONTRACTORS · RIYADH, KSA',
        title: 'Smart Engineering',
        titleAccent: 'Solutions for Mega Projects',
        subtitle:
          'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting delivered across Saudi Arabia.',
        primaryCta: {
          label: 'Explore Our Services',
          link: { type: 'internal', internalRoute: '/services' },
        },
        secondaryCta: {
          label: 'View Projects',
          link: { type: 'internal', internalRoute: '/projects' },
        },
      },
      whoWeAre: {
        enabled: true,
        eyebrow: 'WHO WE ARE',
        title: 'An Integrated MEP Engineering Partner Built on Precision',
        text: makeLexical(
          ['Al Jazira for Imdad Smart Co. is a Riyadh-based engineering and contracting company.'],
          'ltr',
        ),
        button: {
          label: 'Learn More About Us',
          link: { type: 'internal', internalRoute: '/about' },
        },
      },
    }),
  })

  await fetch(`${baseUrl}/api/globals/home-page?locale=ar`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      _status: 'published',
      hero: {
        enabled: true,
        eyebrow: 'مقاولو الكهروميكانيك والأنظمة الذكية · الرياض',
        title: 'حلول هندسية ذكية',
        titleAccent: 'للمشاريع الكبرى',
        subtitle:
          'تنفيذ متكامل لأنظمة الكهروميكانيك والتكييف ومكافحة الحريق والتيار الخفيف في المملكة العربية السعودية.',
        primaryCta: {
          label: 'استكشف خدماتنا',
          link: { type: 'internal', internalRoute: '/services' },
        },
        secondaryCta: {
          label: 'تصفح المشاريع',
          link: { type: 'internal', internalRoute: '/projects' },
        },
      },
      whoWeAre: {
        enabled: true,
        eyebrow: 'من نحن',
        title: 'شريك هندسي متكامل في أنظمة الكهروميكانيك',
        text: makeLexical(
          [
            'شركة الجزيرة للإمداد الذكي شركة سعودية متخصصة في مقاولات الكهروميكانيك والأنظمة الذكية.',
          ],
          'rtl',
        ),
        button: {
          label: 'تعرف علينا أكثر',
          link: { type: 'internal', internalRoute: '/about' },
        },
      },
    }),
  })
}

async function formatHttpProbe(baseUrl, reqPath, options = {}) {
  const url = `${baseUrl}${reqPath}`
  const res = await fetch(url, { redirect: 'manual', ...options })
  const lines = [`$ curl -I "${url}"`, `HTTP/1.1 ${String(res.status)} ${res.statusText}`]
  for (const headerName of ['location', 'content-type', 'x-nextjs-cache', 'cache-control']) {
    const val = res.headers.get(headerName)
    if (val) {
      lines.push(`${headerName}: ${val}`)
    }
  }
  return { res, textBlock: lines.join('\n') }
}

async function main() {
  const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '')
  const evidenceDir = path.resolve(
    process.cwd(),
    process.argv[3] || 'docs/reports/evidence/P3-T12/r1',
  )
  const phase3Dir = path.resolve(process.cwd(), process.argv[4] || 'docs/reports/phase-3/P3-T12/r1')

  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.mkdirSync(phase3Dir, { recursive: true })

  const { adminToken, editorToken } = await ensureAdminAndEditorTokens(baseUrl)

  // =========================================================================
  // STATE 1: arabicEnabled = false (default)
  // =========================================================================
  await seedMinimalHomeAndSettings(baseUrl, adminToken, false)

  const curlLogLines = [
    getRepoHeaderBlock(),
    '=== STATE 1: site-settings.arabicEnabled = false (Default) ===',
    '',
  ]

  const probeRootOff = await formatHttpProbe(baseUrl, '/')
  curlLogLines.push(probeRootOff.textBlock, '')
  if (probeRootOff.res.status !== 308 || probeRootOff.res.headers.get('location') !== '/en') {
    throw new Error(
      `Expected / -> 308 /en when off, got ${String(probeRootOff.res.status)} ${String(probeRootOff.res.headers.get('location'))}`,
    )
  }

  const probeArOff = await formatHttpProbe(baseUrl, '/ar')
  curlLogLines.push(probeArOff.textBlock, '')
  if (probeArOff.res.status !== 307 || probeArOff.res.headers.get('location') !== '/en') {
    throw new Error(
      `Expected /ar -> 307 /en when off, got ${String(probeArOff.res.status)} ${String(probeArOff.res.headers.get('location'))}`,
    )
  }

  const probeArSubOff = await formatHttpProbe(baseUrl, '/ar/services?q=hvac')
  curlLogLines.push(probeArSubOff.textBlock, '')
  if (
    probeArSubOff.res.status !== 307 ||
    probeArSubOff.res.headers.get('location') !== '/en/services?q=hvac'
  ) {
    throw new Error(
      `Expected /ar/services?q=hvac -> 307 /en/services?q=hvac when off, got ${String(probeArSubOff.res.status)} ${String(probeArSubOff.res.headers.get('location'))}`,
    )
  }

  const probeEnOff = await formatHttpProbe(baseUrl, '/en')
  const enOffHtml = await probeEnOff.res.text()
  const enOffHreflangs = [
    ...enOffHtml.matchAll(/<link[^>]*hrefLang="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi),
  ].map((m) => ({ hreflang: m[1], href: m[2] }))
  const enOffJsonLdMatch = enOffHtml.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
  )
  const enOffOgLocaleMatch = enOffHtml.match(
    /<meta[^>]*property="og:locale"[^>]*content="([^"]+)"/i,
  )

  curlLogLines.push(
    probeEnOff.textBlock,
    `html_open_tag: ${(enOffHtml.match(/<html[^>]*>/i) || [''])[0]}`,
    `hreflang_links: ${JSON.stringify(enOffHreflangs)}`,
    `og_locale: ${enOffOgLocaleMatch ? enOffOgLocaleMatch[1] : 'missing'}`,
    `organization_json_ld: ${enOffJsonLdMatch ? enOffJsonLdMatch[1] : 'missing'}`,
    `contains_ar_switcher_href: ${String(enOffHtml.includes('href="/ar"'))}`,
    '',
  )

  const sitemapOffRes = await fetch(`${baseUrl}/sitemap.xml`)
  const sitemapOffXml = await sitemapOffRes.text()

  // =========================================================================
  // ANONYMOUS LINK CRAWL + EDITOR RBAC + STAFF PREVIEW + LIVE TOGGLE
  // =========================================================================
  const crawlAndToggleLines = [
    getRepoHeaderBlock(),
    '=== 1. Anonymous Visitor Link Crawl on /en (arabicEnabled = false) ===',
  ]

  const allHrefsOnEn = [...enOffHtml.matchAll(/<a[^>]+href="([^"]+)"/gi)].map((m) => m[1])
  const uniqueHrefsOnEn = [...new Set(allHrefsOnEn)]
  const arabicLinksOnEn = uniqueHrefsOnEn.filter(
    (h) => h === '/ar' || h.startsWith('/ar/') || h.startsWith('/ar?'),
  )

  crawlAndToggleLines.push(
    `Total <a href> elements on /en: ${String(allHrefsOnEn.length)}`,
    `Unique href targets on /en: ${JSON.stringify(uniqueHrefsOnEn)}`,
    `Arabic (/ar or /ar/*) links found on /en: ${String(arabicLinksOnEn.length)} (${JSON.stringify(arabicLinksOnEn)})`,
  )

  if (arabicLinksOnEn.length > 0) {
    throw new Error(
      `Found unexpected /ar links on /en when arabicEnabled=false: ${JSON.stringify(arabicLinksOnEn)}`,
    )
  }

  for (const href of uniqueHrefsOnEn) {
    if (href.startsWith('/')) {
      const targetPath = href.split('#')[0] || '/'
      const r = await fetch(`${baseUrl}${targetPath}`, { redirect: 'manual' })
      const body = r.status === 200 ? await r.text() : ''
      const htmlTag = (body.match(/<html[^>]*>/i) || [''])[0]
      crawlAndToggleLines.push(
        `  GET ${targetPath} -> HTTP ${String(r.status)} ${r.headers.get('location') || ''} ${htmlTag}`,
      )
      if (htmlTag.includes('lang="ar"')) {
        throw new Error(`Anonymous crawl reached Arabic HTML on ${targetPath}`)
      }
    }
  }

  crawlAndToggleLines.push(
    '',
    '=== 2. Editor RBAC Verification (Editor cannot update site-settings.arabicEnabled) ===',
  )

  const editorMutateRes = await fetch(`${baseUrl}/api/globals/site-settings?locale=en`, {
    method: 'POST',
    headers: {
      Authorization: `JWT ${editorToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      arabicEnabled: true,
    }),
  })
  const editorMutateJson = await editorMutateRes.json()
  const verifyAfterEditorRes = await fetch(`${baseUrl}/api/globals/site-settings?locale=en`)
  const verifyAfterEditorJson = await verifyAfterEditorRes.json()
  crawlAndToggleLines.push(
    `POST /api/globals/site-settings as editor (role="editor") with {"arabicEnabled": true} -> HTTP ${String(editorMutateRes.status)} (${JSON.stringify(editorMutateJson)})`,
    `GET /api/globals/site-settings after editor POST: arabicEnabled=${String(verifyAfterEditorJson?.arabicEnabled)}`,
  )
  if (editorMutateRes.status !== 403 && verifyAfterEditorJson?.arabicEnabled !== false) {
    throw new Error('Editor was able to mutate site-settings.arabicEnabled!')
  }

  crawlAndToggleLines.push(
    '',
    '=== 3. Logged-in Editor Draft Preview & Live Preview of /ar While arabicEnabled = false ===',
  )

  // 3a. /api/preview?secret=...&locale=ar&global=home-page as logged-in editor
  const previewSecret = resolvePreviewSecretFromEnv()
  const previewEndpointRes = await fetch(
    `${baseUrl}/api/preview?secret=${encodeURIComponent(previewSecret)}&locale=ar&global=home-page`,
    {
      redirect: 'manual',
      headers: {
        Cookie: `payload-token=${editorToken}`,
        'Sec-Fetch-Site': 'same-origin',
      },
    },
  )
  const previewSetCookies = previewEndpointRes.headers.getSetCookie
    ? previewEndpointRes.headers.getSetCookie()
    : [previewEndpointRes.headers.get('set-cookie') || '']
  const cookieHeaderForDraft = [
    `payload-token=${editorToken}`,
    ...previewSetCookies.map((c) => c.split(';')[0]).filter(Boolean),
  ].join('; ')

  const arDraftPreviewRes = await fetch(`${baseUrl}/ar`, {
    redirect: 'manual',
    headers: {
      Cookie: cookieHeaderForDraft,
      'Sec-Fetch-Site': 'same-origin',
    },
  })
  const arDraftPreviewHtml = await arDraftPreviewRes.text()
  crawlAndToggleLines.push(
    `GET /api/preview?secret=<hmac>&locale=ar&global=home-page (editor) -> HTTP ${String(previewEndpointRes.status)} Location: ${String(previewEndpointRes.headers.get('location'))}`,
    `GET /ar with editor payload-token + __prerender_bypass (draftMode) -> HTTP ${String(arDraftPreviewRes.status)}`,
    `html_open_tag: ${(arDraftPreviewHtml.match(/<html[^>]*>/i) || [''])[0]}`,
    `has_draft_banner: ${String(arDraftPreviewHtml.includes('/api/preview/exit'))}`,
  )
  if (arDraftPreviewRes.status !== 200 || !arDraftPreviewHtml.includes('lang="ar"')) {
    throw new Error(
      `Expected editor draft preview of /ar to return 200 RTL, got ${String(arDraftPreviewRes.status)}`,
    )
  }

  // 3b. Live Preview iframe request (Sec-Fetch-Dest: iframe) as logged-in editor
  const arLivePreviewRes = await fetch(`${baseUrl}/ar`, {
    redirect: 'manual',
    headers: {
      Cookie: `payload-token=${editorToken}`,
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Site': 'same-origin',
    },
  })
  const arLivePreviewHtml = await arLivePreviewRes.text()
  crawlAndToggleLines.push(
    `GET /ar with editor payload-token + Sec-Fetch-Dest: iframe (Live Preview) -> HTTP ${String(arLivePreviewRes.status)}`,
    `html_open_tag: ${(arLivePreviewHtml.match(/<html[^>]*>/i) || [''])[0]}`,
  )
  if (arLivePreviewRes.status !== 200 || !arLivePreviewHtml.includes('lang="ar"')) {
    throw new Error(
      `Expected editor Live Preview iframe of /ar to return 200 RTL, got ${String(arLivePreviewRes.status)}`,
    )
  }

  // =========================================================================
  // STATE 2: Admin toggles arabicEnabled = true (Live without redeploy)
  // =========================================================================
  crawlAndToggleLines.push(
    '',
    '=== 4. Live Toggle by Admin: OFF -> ON (Immediate Request #1) -> OFF (Immediate Request #1) ===',
  )

  const adminEnableRes = await fetch(`${baseUrl}/api/globals/site-settings?locale=en`, {
    method: 'POST',
    headers: {
      Authorization: `JWT ${adminToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      arabicEnabled: true,
    }),
  })
  const adminEnableJson = await adminEnableRes.json()
  crawlAndToggleLines.push(
    `Admin POST /api/globals/site-settings {"arabicEnabled": true} -> HTTP ${String(adminEnableRes.status)} (arabicEnabled=${String(adminEnableJson?.result?.arabicEnabled ?? adminEnableJson?.arabicEnabled)})`,
  )

  // Immediate first request to /ar after admin enables Arabic:
  const immediateArOn = await formatHttpProbe(baseUrl, '/ar')
  const immediateArOnHtml = await immediateArOn.res.text()
  const immediateEnOn = await formatHttpProbe(baseUrl, '/en')
  const immediateEnOnHtml = await immediateEnOn.res.text()

  crawlAndToggleLines.push(
    `Immediate Request #1 to /ar (anonymous): HTTP ${String(immediateArOn.res.status)} ${(immediateArOnHtml.match(/<html[^>]*>/i) || [''])[0]}`,
    `Immediate Request #1 to /en (anonymous): HTTP ${String(immediateEnOn.res.status)} contains_ar_switcher_href=${String(immediateEnOnHtml.includes('href="/ar"'))}`,
  )

  if (immediateArOn.res.status !== 200 || !immediateArOnHtml.includes('dir="rtl"')) {
    throw new Error(
      `Expected immediate /ar request after enabling to return 200 RTL, got ${String(immediateArOn.res.status)}`,
    )
  }
  if (!immediateEnOnHtml.includes('href="/ar"')) {
    throw new Error(
      'Expected immediate /en request after enabling to include language switcher href="/ar"',
    )
  }

  // Record State 2 in curl-headers-both-states.log and sitemap-both-states.log
  curlLogLines.push('=== STATE 2: site-settings.arabicEnabled = true (Enabled by Admin) ===', '')
  const probeRootOn = await formatHttpProbe(baseUrl, '/')
  curlLogLines.push(probeRootOn.textBlock, '')
  curlLogLines.push(
    immediateArOn.textBlock,
    `html_open_tag: ${(immediateArOnHtml.match(/<html[^>]*>/i) || [''])[0]}`,
    `contains_en_switcher_href: ${String(immediateArOnHtml.includes('href="/en"'))}`,
    '',
  )

  const enOnHreflangs = [
    ...immediateEnOnHtml.matchAll(/<link[^>]*hrefLang="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi),
  ].map((m) => ({ hreflang: m[1], href: m[2] }))
  curlLogLines.push(
    immediateEnOn.textBlock,
    `html_open_tag: ${(immediateEnOnHtml.match(/<html[^>]*>/i) || [''])[0]}`,
    `hreflang_links: ${JSON.stringify(enOnHreflangs)}`,
    `contains_ar_switcher_href: ${String(immediateEnOnHtml.includes('href="/ar"'))}`,
    '',
  )

  const sitemapOnRes = await fetch(`${baseUrl}/sitemap.xml`)
  const sitemapOnXml = await sitemapOnRes.text()

  // =========================================================================
  // PLAYWRIGHT SCREENSHOTS (Admin field EN/AR, Editor read-only, /en ON & OFF at 1440 & 390)
  // =========================================================================
  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Public screenshots while arabicEnabled = true (1440 and 390)
    const pubContextOn = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await pubContextOn.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    })
    const pageOn1440 = await pubContextOn.newPage()
    await pageOn1440.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
    await saveCompressedPng(
      await pageOn1440.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'en-switcher-on-1440.png'),
      1440,
    )

    await pageOn1440.goto(`${baseUrl}/ar`, { waitUntil: 'networkidle' })
    await saveCompressedPng(
      await pageOn1440.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'ar-live-200-rtl-1440.png'),
      1440,
    )

    await pageOn1440.setViewportSize({ width: 390, height: 844 })
    await pageOn1440.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
    // Open mobile drawer so the mobile language switcher is also visible in the 390 screenshot
    const menuBtnOn = pageOn1440.locator('header button[aria-controls]').first()
    if (await menuBtnOn.isVisible()) {
      await menuBtnOn.click()
      await pageOn1440.waitForTimeout(250)
    }
    await saveCompressedPng(
      await pageOn1440.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'en-switcher-on-390.png'),
      390,
    )
    await pubContextOn.close()

    // 2. Admin screenshots of site-settings.arabicEnabled in EN and AR + Editor read-only screenshot
    const baseUrlObj = new URL(baseUrl)
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await adminContext.addCookies([
      {
        name: 'payload-token',
        value: adminToken,
        domain: baseUrlObj.hostname,
        path: '/',
      },
      {
        name: 'payload-lng',
        value: 'en',
        domain: baseUrlObj.hostname,
        path: '/',
      },
    ])
    const adminPage = await adminContext.newPage()
    await adminPage.goto(`${baseUrl}/admin/globals/site-settings`, { waitUntil: 'networkidle' })
    await adminPage.locator('#field-arabicEnabled').waitFor({ state: 'attached', timeout: 15000 })
    await saveCompressedPng(
      await adminPage.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'admin-site-settings-arabic-switch-en.png'),
      1440,
    )

    await adminContext.addCookies([
      {
        name: 'payload-lng',
        value: 'ar',
        domain: baseUrlObj.hostname,
        path: '/',
      },
    ])
    await adminPage.goto(`${baseUrl}/admin/globals/site-settings`, { waitUntil: 'networkidle' })
    await adminPage.locator('#field-arabicEnabled').waitFor({ state: 'attached', timeout: 15000 })
    await saveCompressedPng(
      await adminPage.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'admin-site-settings-arabic-switch-ar.png'),
      1440,
    )
    await adminContext.close()

    // Editor read-only screenshot
    const editorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await editorContext.addCookies([
      {
        name: 'payload-token',
        value: editorToken,
        domain: baseUrlObj.hostname,
        path: '/',
      },
      {
        name: 'payload-lng',
        value: 'en',
        domain: baseUrlObj.hostname,
        path: '/',
      },
    ])
    const editorPage = await editorContext.newPage()
    await editorPage.goto(`${baseUrl}/admin/globals/site-settings`, { waitUntil: 'networkidle' })
    const editorCheckbox = editorPage.locator('#field-arabicEnabled')
    await editorCheckbox.waitFor({ state: 'attached', timeout: 15000 })
    const isEditorCheckboxDisabled = await editorCheckbox.isDisabled()
    crawlAndToggleLines.push(
      `Editor UI /admin/globals/site-settings #field-arabicEnabled isDisabled(): ${String(isEditorCheckboxDisabled)}`,
    )
    if (!isEditorCheckboxDisabled) {
      throw new Error(
        'Expected #field-arabicEnabled to be disabled (read-only) for editor in Admin UI',
      )
    }
    await saveCompressedPng(
      await editorPage.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'admin-site-settings-editor-readonly.png'),
      1440,
    )
    await editorContext.close()

    // 3. Turn arabicEnabled OFF via Admin and verify immediate revert + take OFF screenshots (1440 & 390)
    const adminDisableRes = await fetch(`${baseUrl}/api/globals/site-settings?locale=en`, {
      method: 'POST',
      headers: {
        Authorization: `JWT ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        arabicEnabled: false,
      }),
    })
    const adminDisableJson = await adminDisableRes.json()
    crawlAndToggleLines.push(
      `Admin POST /api/globals/site-settings {"arabicEnabled": false} -> HTTP ${String(adminDisableRes.status)} (arabicEnabled=${String(adminDisableJson?.result?.arabicEnabled ?? adminDisableJson?.arabicEnabled)})`,
    )

    const immediateArOffAfterRevert = await formatHttpProbe(baseUrl, '/ar')
    const immediateEnOffAfterRevert = await formatHttpProbe(baseUrl, '/en')
    const immediateEnOffAfterRevertHtml = await immediateEnOffAfterRevert.res.text()
    crawlAndToggleLines.push(
      `Immediate Request #1 to /ar after disabling (anonymous): HTTP ${String(immediateArOffAfterRevert.res.status)} Location: ${String(immediateArOffAfterRevert.res.headers.get('location'))}`,
      `Immediate Request #1 to /en after disabling (anonymous): HTTP ${String(immediateEnOffAfterRevert.res.status)} contains_ar_switcher_href=${String(immediateEnOffAfterRevertHtml.includes('href="/ar"'))}`,
    )

    if (
      immediateArOffAfterRevert.res.status !== 307 ||
      immediateArOffAfterRevert.res.headers.get('location') !== '/en'
    ) {
      throw new Error(
        `Expected immediate /ar request after disabling to return 307 /en, got ${String(immediateArOffAfterRevert.res.status)}`,
      )
    }
    if (immediateEnOffAfterRevertHtml.includes('href="/ar"')) {
      throw new Error('Expected immediate /en request after disabling to hide language switcher')
    }

    const pubContextOff = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await pubContextOff.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    })
    const pageOff1440 = await pubContextOff.newPage()
    await pageOff1440.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
    await saveCompressedPng(
      await pageOff1440.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'en-switcher-off-1440.png'),
      1440,
    )

    await pageOff1440.setViewportSize({ width: 390, height: 844 })
    await pageOff1440.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
    const menuBtnOff = pageOff1440.locator('header button[aria-controls]').first()
    if (await menuBtnOff.isVisible()) {
      await menuBtnOff.click()
      await pageOff1440.waitForTimeout(250)
    }
    await saveCompressedPng(
      await pageOff1440.screenshot({ fullPage: false }),
      path.join(phase3Dir, 'en-switcher-off-390.png'),
      390,
    )
    await pubContextOff.close()
  } finally {
    await browser.close()
  }

  fs.writeFileSync(
    path.join(evidenceDir, 'curl-headers-both-states.log'),
    curlLogLines.join('\n') + '\n',
    'utf8',
  )
  fs.writeFileSync(
    path.join(evidenceDir, 'sitemap-both-states.log'),
    [
      getRepoHeaderBlock(),
      '=== STATE 1: GET /sitemap.xml when site-settings.arabicEnabled = false ===',
      sitemapOffXml.trim(),
      '',
      '=== STATE 2: GET /sitemap.xml when site-settings.arabicEnabled = true ===',
      sitemapOnXml.trim(),
      '',
    ].join('\n'),
    'utf8',
  )
  fs.writeFileSync(
    path.join(evidenceDir, 'anon-crawl-toggle-and-rbac.log'),
    crawlAndToggleLines.join('\n') + '\n',
    'utf8',
  )

  console.log('P3-T12 evidence capture completed successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
