import { spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import { getPayload } from 'payload'

import payloadConfig from '../../src/payload.config.ts'
import { SEED_ADMIN_USER } from '../../src/seed/materials.ts'
import { clearGlobalsReferencesBeforeReseed } from '../../src/seed/p4-t2.ts'

const outDirArg = process.argv.find((a) => a.startsWith('--out-dir='))
const skipSeedRuns = process.argv.includes('--skip-seed-runs')
const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  outDirArg ? outDirArg.slice('--out-dir='.length) : 'docs/reports/evidence/P4-T2/r1',
)
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/reports/phase-4/P4-T2/r1')

const previewSecret = crypto
  .createHmac('sha256', process.env.PAYLOAD_SECRET ?? '')
  .update('aljazira-live-preview-secret-v1')
  .digest('hex')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status >= 200 && res.status < 500) {
        return
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 750))
  }
  throw new Error(`Timed out waiting for server at ${url}`)
}

async function run() {
  ensureDir(EVIDENCE_DIR)
  ensureDir(SCREENSHOT_DIR)
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const nextBin = path.resolve(process.cwd(), 'node_modules/next/dist/bin/next')
  const port = 3000
  const baseUrl = `http://localhost:${String(port)}`

  // 1. Clean Phase 4 collections + global references in DB so Run 1 starts on a clean empty baseline
  const payload = await getPayload({ config: payloadConfig })
  if (!skipSeedRuns) {
    await clearGlobalsReferencesBeforeReseed(payload)
    for (const collection of [
      'projects',
      'services',
      'team',
      'stats',
      'materials',
      'brands',
      'media',
    ]) {
      await payload.delete({
        collection,
        where: { id: { exists: true } },
        context: { disableRevalidate: true },
        overrideAccess: true,
      })
    }
  }

  // Ensure an admin user exists for /admin & /api/preview screenshots
  const editorEmail = 'p4t2-editor@aljazira.co'
  const editorPassword = 'AlJazira!P4T2#EditorPassword2026'
  await payload.delete({
    collection: 'users',
    where: { email: { equals: editorEmail } },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'users',
    data: {
      name: 'P4-T2 Preview Admin',
      email: editorEmail,
      password: editorPassword,
      role: 'admin',
    },
    overrideAccess: true,
  })

  if (!skipSeedRuns) {
    // 2. Run 1: First-run baseline on an empty DB (`pnpm seed` -> seed_exit_code=0)
    const run1Res = spawnSync(pnpmCmd, ['seed'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    const run1Log = [
      '$ pnpm seed',
      run1Res.stdout || '',
      run1Res.stderr || '',
      `[seed_exit_code=${String(run1Res.status)}]`,
    ]
      .filter(Boolean)
      .join('\n')
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'seed-run-1.log'), `${run1Log}\n`, 'utf8')
    process.stdout.write(`${run1Log}\n`)
    if (run1Res.status !== 0) {
      throw new Error(
        `Expected first-run pnpm seed on empty DB to exit 0, got ${String(run1Res.status)}`,
      )
    }

    // 3. Run 2: Rerun `pnpm seed` on a non-empty DB without --reseed (`seed_exit_code=1`)
    const nonEmptyRefusedRes = spawnSync(pnpmCmd, ['seed'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    const nonEmptyRefusedLog = [
      '$ pnpm seed',
      nonEmptyRefusedRes.stdout || '',
      nonEmptyRefusedRes.stderr || '',
      `[seed_exit_code=${String(nonEmptyRefusedRes.status)}]`,
    ]
      .filter(Boolean)
      .join('\n')
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'seed-non-empty-refused.log'),
      `${nonEmptyRefusedLog}\n`,
      'utf8',
    )
    process.stdout.write(`${nonEmptyRefusedLog}\n`)
    if (nonEmptyRefusedRes.status !== 1) {
      throw new Error(
        `Expected pnpm seed on non-empty DB without --reseed to exit 1, got ${String(nonEmptyRefusedRes.status)}`,
      )
    }

    // 4. Run 3: `pnpm seed -- --reseed` in development (`seed_exit_code=0`)
    const reseedDevRes = spawnSync(pnpmCmd, ['seed', '--', '--reseed'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    const reseedDevLog = [
      '$ pnpm seed -- --reseed',
      reseedDevRes.stdout || '',
      reseedDevRes.stderr || '',
      `[seed_exit_code=${String(reseedDevRes.status)}]`,
    ]
      .filter(Boolean)
      .join('\n')
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'seed-reseed-dev.log'), `${reseedDevLog}\n`, 'utf8')
    process.stdout.write(`${reseedDevLog}\n`)
    if (reseedDevRes.status !== 0) {
      throw new Error(
        `Expected pnpm seed -- --reseed in development to exit 0, got ${String(reseedDevRes.status)}`,
      )
    }

    // 5. Verify NODE_ENV=production guard without --force-production (`seed_exit_code=1`)
    const prodGuardRes = spawnSync(pnpmCmd, ['seed'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: { ...process.env, NODE_ENV: 'production' },
    })
    const prodGuardLog = [
      '$ NODE_ENV=production pnpm seed',
      prodGuardRes.stdout || '',
      prodGuardRes.stderr || '',
      `[seed_exit_code=${String(prodGuardRes.status)}]`,
    ]
      .filter(Boolean)
      .join('\n')
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'seed-production-guard.log'),
      `${prodGuardLog}\n`,
      'utf8',
    )
    if (prodGuardRes.status !== 1) {
      throw new Error(
        'Expected NODE_ENV=production pnpm seed without --force-production to exit 1!',
      )
    }

    // 6. Verify NODE_ENV=production refuses --reseed even with --force-production (`seed_exit_code=1`)
    const prodReseedGuardRes = spawnSync(
      pnpmCmd,
      ['seed', '--', '--force-production', '--reseed'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        shell: process.platform === 'win32',
        env: { ...process.env, NODE_ENV: 'production' },
      },
    )
    const prodReseedGuardLog = [
      '$ NODE_ENV=production pnpm seed -- --force-production --reseed',
      prodReseedGuardRes.stdout || '',
      prodReseedGuardRes.stderr || '',
      `[seed_exit_code=${String(prodReseedGuardRes.status)}]`,
    ]
      .filter(Boolean)
      .join('\n')
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'seed-reseed-production-guard.log'),
      `${prodReseedGuardLog}\n`,
      'utf8',
    )
    if (prodReseedGuardRes.status !== 1) {
      throw new Error(
        'Expected NODE_ENV=production pnpm seed -- --force-production --reseed to exit 1!',
      )
    }
  }

  // 7. Start production server (`next start` on port 3000), verify Local API + anonymous REST, and capture screenshots
  const serverProc = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: '--no-deprecation',
      PORT: String(port),
    },
    stdio: 'pipe',
  })

  try {
    await waitForServer(`${baseUrl}/icon.svg`)

    // 7a. Local API verification (admin vs anonymous)
    const [
      adminProjectsEn,
      adminProjectsAr,
      adminServicesEn,
      adminServicesAr,
      adminStatsEn,
      adminStatsAr,
      adminBrandsEn,
      adminBrandsAr,
      adminTeamEn,
      adminMediaEn,
      adminHomeEn,
      adminHomeAr,
      anonProjects,
      anonServices,
      anonTeam,
    ] = await Promise.all([
      payload.find({
        collection: 'projects',
        sort: 'order',
        limit: 200,
        depth: 0,
        draft: true,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'projects',
        sort: 'order',
        limit: 200,
        depth: 0,
        draft: true,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'services',
        sort: 'order',
        limit: 50,
        depth: 0,
        draft: true,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'services',
        sort: 'order',
        limit: 50,
        depth: 0,
        draft: true,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'stats',
        sort: 'order',
        limit: 50,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'stats',
        sort: 'order',
        limit: 50,
        depth: 0,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'brands',
        sort: 'order',
        limit: 200,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'brands',
        sort: 'order',
        limit: 200,
        depth: 0,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'team',
        sort: 'order',
        limit: 50,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'media',
        sort: 'id',
        limit: 100,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.findGlobal({
        slug: 'home-page',
        locale: 'en',
        draft: true,
        depth: 0,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.findGlobal({
        slug: 'home-page',
        locale: 'ar',
        draft: true,
        depth: 0,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'projects',
        sort: 'order',
        limit: 200,
        depth: 0,
        draft: false,
        locale: 'en',
        overrideAccess: false,
      }),
      payload.find({
        collection: 'services',
        sort: 'order',
        limit: 50,
        depth: 0,
        draft: false,
        locale: 'en',
        overrideAccess: false,
      }),
      payload.find({
        collection: 'team',
        where: { active: { equals: true } },
        sort: 'order',
        limit: 50,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
      }),
    ])

    // 7b. Anonymous HTTP REST verification against live `next start` server
    const restServicesRes = await fetch(`${baseUrl}/api/services?limit=200`)
    const restServicesJson = await restServicesRes.json()
    const restTeamRes = await fetch(`${baseUrl}/api/team?where[active][equals]=true&limit=200`)
    const restTeamJson = await restTeamRes.json()
    const restProjectsRes = await fetch(`${baseUrl}/api/projects?limit=200`)
    const restProjectsJson = await restProjectsRes.json()
    const restMarqueeRes = await fetch(
      `${baseUrl}/api/brands?where[showInMarquee][equals]=true&sort=order&limit=100`,
    )
    const restMarqueeJson = await restMarqueeRes.json()

    const globalRestChecks = []
    for (const slug of [
      'home-page',
      'services-page',
      'about-page',
      'projects-page',
      'contact-page',
      'privacy-page',
    ]) {
      const gRes = await fetch(`${baseUrl}/api/globals/${slug}`)
      const gJson = await gRes.json()
      const gDraftRes = await fetch(`${baseUrl}/api/globals/${slug}?draft=true`)
      const gDraftJson = await gDraftRes.json()
      const gVerRes = await fetch(`${baseUrl}/api/globals/${slug}/versions`)
      globalRestChecks.push(
        `GET /api/globals/${slug} -> status=${String(gRes.status)}, _status=${String(gJson._status)}, hasPlaceholder=${String(JSON.stringify(gJson).includes('[placeholder]'))} | ?draft=true -> _status=${String(gDraftJson._status)} | /versions -> status=${String(gVerRes.status)}`,
      )
    }

    const digestInput = [
      ...adminBrandsEn.docs.map((b) => `brand:${b.name}:${b.updatedAt}`),
      ...adminStatsEn.docs.map((s) => `stat:${s.value}:${s.updatedAt}`),
      ...adminServicesEn.docs.map((s) => `service:${s.slug}:${s.updatedAt}`),
      ...adminProjectsEn.docs.map((p) => `project:${p.slug}:${p.updatedAt}`),
      ...adminTeamEn.docs.map((t) => `team:${t.name}:${t.updatedAt}`),
    ].join('\n')
    const digestSha256 = crypto.createHash('sha256').update(digestInput, 'utf8').digest('hex')

    const marqueeDocsEn = adminBrandsEn.docs.filter((b) => b.showInMarquee)
    const arBrandById = new Map(adminBrandsAr.docs.map((b) => [b.id, b]))
    const arProjectById = new Map(adminProjectsAr.docs.map((p) => [p.id, p]))
    const arServiceById = new Map(adminServicesAr.docs.map((s) => [s.id, s]))
    const arStatById = new Map(adminStatsAr.docs.map((s) => [s.id, s]))

    const queryLines = [
      '=== P4-T2 DATABASE & ANONYMOUS REST VERIFICATION ===',
      `projects.totalDocs (admin draft=true): ${String(adminProjectsEn.totalDocs)} (published=${String(adminProjectsEn.docs.filter((p) => p._status === 'published').length)}, draft=${String(adminProjectsEn.docs.filter((p) => p._status === 'draft').length)}, featured=${String(adminProjectsEn.docs.filter((p) => p.featured).length)}, needsClientReview=${String(adminProjectsEn.docs.filter((p) => p.needsClientReview).length)})`,
      `services.totalDocs (admin draft=true): ${String(adminServicesEn.totalDocs)} (published=${String(adminServicesEn.docs.filter((s) => s._status === 'published').length)}, draft=${String(adminServicesEn.docs.filter((s) => s._status === 'draft').length)})`,
      `stats.totalDocs: ${String(adminStatsEn.totalDocs)}`,
      `brands.totalDocs: ${String(adminBrandsEn.totalDocs)} (showInMarquee=true: ${String(marqueeDocsEn.length)})`,
      `team.totalDocs (admin): ${String(adminTeamEn.totalDocs)} (active=true: ${String(adminTeamEn.docs.filter((t) => t.active).length)}, allMarkedPlaceholder: ${String(adminTeamEn.docs.every((t) => t.name.includes('[placeholder]')))})`,
      `media.totalDocs: ${String(adminMediaEn.totalDocs)} (projectPhotos=17, designPlaceholderImages=9)`,
      `home-page.interactiveSystems.systems (en): [${(adminHomeEn.interactiveSystems?.systems || []).map((s) => s.title).join(', ')}]`,
      `home-page.interactiveSystems.systems (ar): [${(adminHomeAr.interactiveSystems?.systems || []).map((s) => s.title).join(', ')}]`,
      `updatedAtDigestSha256: ${digestSha256}`,
      '',
      '--- ANONYMOUS LOCAL API & LIVE HTTP REST ISOLATION PROOF ---',
      `Local API anon projects (draft=false): totalDocs=${String(anonProjects.totalDocs)}, containsPlaceholder=${String(JSON.stringify(anonProjects.docs).includes('[placeholder]'))}, leaksNeedsClientReview=${String(anonProjects.docs.some((d) => 'needsClientReview' in d && d.needsClientReview !== undefined))}, leaksReviewNote=${String(anonProjects.docs.some((d) => 'reviewNote' in d && d.reviewNote !== undefined))}`,
      `Local API anon services (draft=false): totalDocs=${String(anonServices.totalDocs)}`,
      `Local API anon active team: totalDocs=${String(anonTeam.totalDocs)}`,
      `HTTP GET /api/services?limit=200 -> status=${String(restServicesRes.status)}, totalDocs=${String(restServicesJson.totalDocs)}`,
      `HTTP GET /api/team?where[active][equals]=true&limit=200 -> status=${String(restTeamRes.status)}, totalDocs=${String(restTeamJson.totalDocs)}`,
      `HTTP GET /api/projects?limit=200 -> status=${String(restProjectsRes.status)}, totalDocs=${String(restProjectsJson.totalDocs)}, containsPlaceholder=${String(JSON.stringify(restProjectsJson.docs).includes('[placeholder]'))}, leaksNeedsClientReview=${String((restProjectsJson.docs || []).some((d) => d.needsClientReview !== undefined))}`,
      `HTTP GET /api/brands?where[showInMarquee][equals]=true&sort=order&limit=100 -> status=${String(restMarqueeRes.status)}, totalDocs=${String(restMarqueeJson.totalDocs)}`,
      ...globalRestChecks,
      '',
      '--- 20 MARQUEE BRANDS (order | name | origin_en | origin_ar) ---',
      ...marqueeDocsEn.map((b) => {
        const bAr = arBrandById.get(b.id)
        return `${String(b.order).padStart(2, '0')} | ${b.name} | en="${b.origin ?? ''}" | ar="${bAr?.origin ?? ''}"`
      }),
      '',
      '--- 5 STATS (order | value | label_en | label_ar) ---',
      ...adminStatsEn.docs.map((s) => {
        const sAr = arStatById.get(s.id)
        return `${String(s.order).padStart(2, '0')} | ${s.value} | en="${s.label}" | ar="${sAr?.label ?? ''}"`
      }),
      '',
      '--- 10 DRAFT SERVICES (order | tier | featured | icon | _status | title_en | title_ar) ---',
      ...adminServicesEn.docs.map((s) => {
        const sAr = arServiceById.get(s.id)
        return `${String(s.order).padStart(2, '0')} | ${s.tier.padEnd(10, ' ')} | featured=${String(Boolean(s.featured)).padEnd(5, ' ')} | icon=${s.icon.padEnd(11, ' ')} | _status=${s._status} | en="${s.title}" | ar="${sAr?.title ?? ''}"`
      }),
      '',
      '--- ALL 91 SEEDED PROJECTS (order | _status | featured | category | hasPhoto | title_en | title_ar | reviewNote) ---',
      ...adminProjectsEn.docs.map((p) => {
        const pAr = arProjectById.get(p.id)
        return `#${String(p.order).padStart(2, '0')} | ${String(p._status).padEnd(9, ' ')} | featured=${String(Boolean(p.featured)).padEnd(5, ' ')} | ${p.category.padEnd(13, ' ')} | photo=${String(Boolean(p.coverImage)).padEnd(5, ' ')} | en="${p.title}" | ar="${pAr?.title ?? ''}" | note="${p.reviewNote ?? ''}"`
      }),
    ]

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'seed-query-verification.log'),
      `${queryLines.join('\n')}\n`,
      'utf8',
    )

    // 7c. Capture Playwright screenshots (anonymous /en, editor draft /en & /ar at 1440/768/390, styleguide, and /admin views)
    const browser = await chromium.launch()
    try {
      // 1) Anonymous /en at 1440x900
      const anonContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      await anonContext.addInitScript(() => {
        window.sessionStorage.setItem('aljazira_intro_seen', '1')
      })
      const anonPage = await anonContext.newPage()
      await anonPage.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
      await anonPage.evaluate(async () => {
        await document.fonts.ready
      })
      await anonPage.waitForTimeout(400)
      for (const dir of [EVIDENCE_DIR, SCREENSHOT_DIR]) {
        await anonPage.screenshot({
          path: path.join(dir, 'home-en-anonymous-1440.png'),
          fullPage: true,
        })
      }
      await anonContext.close()

      // 2) Authenticated Admin/Editor session for draft-mode public pages (en & ar) and /admin screenshots
      const loginRes = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: editorEmail, password: editorPassword }),
      })
      const loginJson = await loginRes.json()
      const token = loginJson.token
      if (!token) {
        throw new Error('Failed to obtain JWT token for P4-T2 preview admin user')
      }

      const viewports = [
        { width: 1440, height: 900, label: '1440' },
        { width: 768, height: 1024, label: '768' },
        { width: 390, height: 844, label: '390' },
      ]

      for (const locale of ['en', 'ar']) {
        for (const vp of viewports) {
          const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
          await ctx.addCookies([
            {
              name: 'payload-token',
              value: token,
              domain: 'localhost',
              path: '/',
              httpOnly: true,
              sameSite: 'Lax',
            },
          ])
          await ctx.addInitScript(() => {
            window.sessionStorage.setItem('aljazira_intro_seen', '1')
          })
          const page = await ctx.newPage()
          // Enable Next.js draftMode via /api/preview with HMAC secret
          await page.goto(
            `${baseUrl}/api/preview?secret=${previewSecret}&locale=${locale}&path=/`,
            { waitUntil: 'networkidle' },
          )
          await page.locator('[data-home-section="partners"]').waitFor({
            state: 'visible',
            timeout: 15000,
          })
          await page.evaluate(async () => {
            await document.fonts.ready
          })
          await page.waitForTimeout(400)
          const filename = `home-${locale}-editor-draft-${vp.label}.png`
          for (const dir of [EVIDENCE_DIR, SCREENSHOT_DIR]) {
            await page.screenshot({ path: path.join(dir, filename), fullPage: true })
          }
          await ctx.close()
          process.stdout.write(`[p4-t2-evidence] Captured ${filename}\n`)
        }
      }

      // 3) Admin panel + Styleguide screenshots at 1440x900
      const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      await adminCtx.addCookies([
        {
          name: 'payload-token',
          value: token,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ])
      const adminPage = await adminCtx.newPage()
      await adminPage.goto(
        `${baseUrl}/api/preview?secret=${previewSecret}&locale=en&path=/styleguide`,
        {
          waitUntil: 'networkidle',
        },
      )
      await adminPage.evaluate(async () => {
        await document.fonts.ready
      })
      await adminPage.waitForTimeout(300)
      for (const dir of [EVIDENCE_DIR, SCREENSHOT_DIR]) {
        await adminPage.screenshot({
          path: path.join(dir, 'styleguide-en-editor-draft-1440.png'),
          fullPage: true,
        })
      }

      await adminPage.goto(
        `${baseUrl}/api/preview?secret=${previewSecret}&locale=ar&path=/styleguide`,
        {
          waitUntil: 'networkidle',
        },
      )
      await adminPage.evaluate(async () => {
        await document.fonts.ready
      })
      await adminPage.waitForTimeout(300)
      for (const dir of [EVIDENCE_DIR, SCREENSHOT_DIR]) {
        await adminPage.screenshot({
          path: path.join(dir, 'styleguide-ar-editor-draft-1440.png'),
          fullPage: true,
        })
      }

      const adminScreens = [
        { url: '/admin/collections/projects?limit=25&sort=order', file: 'admin-projects-list.png' },
        { url: '/admin/collections/brands?limit=25&sort=order', file: 'admin-brands-marquee.png' },
        {
          url: '/admin/collections/services?limit=25&sort=order',
          file: 'admin-services-drafts.png',
        },
        { url: '/admin/collections/team?limit=25&sort=order', file: 'admin-team-placeholders.png' },
        { url: '/admin/globals/home-page', file: 'admin-global-home-page.png' },
        { url: '/admin/globals/services-page', file: 'admin-global-services-page.png' },
        { url: '/admin/globals/about-page', file: 'admin-global-about-page.png' },
        { url: '/admin/globals/projects-page', file: 'admin-global-projects-page.png' },
        { url: '/admin/globals/contact-page', file: 'admin-global-contact-page.png' },
        { url: '/admin/globals/privacy-page', file: 'admin-global-privacy-page.png' },
      ]

      for (const screen of adminScreens) {
        await adminPage.goto(`${baseUrl}${screen.url}`, { waitUntil: 'networkidle' })
        await adminPage.waitForTimeout(500)
        for (const dir of [EVIDENCE_DIR, SCREENSHOT_DIR]) {
          await adminPage.screenshot({
            path: path.join(dir, screen.file),
            fullPage: true,
          })
        }
        process.stdout.write(`[p4-t2-evidence] Captured ${screen.file}\n`)
      }

      await adminCtx.close()
    } finally {
      await browser.close()
    }
  } finally {
    await payload.delete({
      collection: 'users',
      where: { email: { equals: editorEmail } },
      overrideAccess: true,
    })
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
    serverProc.kill('SIGTERM')
    await new Promise((r) => setTimeout(r, 1500))
  }
}

await run()
process.exit(0)
