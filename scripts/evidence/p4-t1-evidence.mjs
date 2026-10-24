import { execFileSync, spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import { getPayload } from 'payload'

import payloadConfig from '../../src/payload.config.ts'
import { buildMaterialsSeedPlan, SEED_ADMIN_USER } from '../../src/seed/materials.ts'

const EVIDENCE_DIR = path.resolve(process.cwd(), 'docs/reports/evidence/P4-T1/r1')

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

function escapeMd(val) {
  return String(val ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
}

function generateMarkdownTables(plan) {
  const lines = []

  lines.push('### 1. Normalizations Applied (`raw` → `normalized`, row numbers)')
  lines.push('')
  lines.push('| # | Category | Field | Raw Value | Normalized Value | Reason | Row Numbers |')
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |')
  plan.normalizationsApplied.forEach((norm, idx) => {
    lines.push(
      `| ${String(idx + 1)} | \`${norm.category}\` | \`${norm.field}\` | \`${escapeMd(norm.rawValue)}\` | \`${escapeMd(norm.normalizedValue)}\` | ${escapeMd(norm.reason)} | ${norm.rowNumbers.join(', ')} |`,
    )
  })

  lines.push('')
  lines.push(
    '### 2. Rows & Brands Flagged for Client Confirmation (`needsClientReview`, incl. rows 58–73)',
  )
  lines.push('')
  lines.push(
    '| Row # | System | Category | Raw Input (`brandRaw` / `originRaw` / `alternativeRaw`) | Seeded Normalized Brands | Client Confirmation Needed |',
  )
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |')
  plan.needsClientReview.forEach((item) => {
    lines.push(
      `| ${String(item.rowNo)} | \`${item.system}\` | \`${item.category}\` | \`${escapeMd(item.rawBrandOrOrigin)}\` | ${item.normalizedBrands.map((b) => `\`${escapeMd(b)}\``).join(', ')} | ${escapeMd(item.details)} |`,
    )
  })

  lines.push('')
  lines.push('### 3. Drafted Arabic Material Descriptions (All 73 Rows — `needsClientReview`)')
  lines.push('')
  lines.push(
    '| Item # | System | Raw English (`seed/materials.raw.json`) | Normalized English (`description` en) | Drafted Arabic (`description` ar — `needsClientReview`) | Linked Normalized Brands |',
  )
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |')
  plan.materials.forEach((mat) => {
    lines.push(
      `| ${String(mat.itemNo)} | \`${mat.system}\` | \`${escapeMd(mat.rawDescription)}\` | ${escapeMd(mat.descriptionEn)} | ${escapeMd(mat.descriptionAr)} | ${mat.brandNames.map((b) => `\`${escapeMd(b)}\``).join(', ')} |`,
    )
  })

  return `${lines.join('\n')}\n`
}

async function run() {
  ensureDir(EVIDENCE_DIR)
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const nextBin = path.resolve(process.cwd(), 'node_modules/next/dist/bin/next')
  const port = 3141
  const baseUrl = `http://localhost:${String(port)}`

  // 1. Clean materials and brands in DB so Run 1 starts from 0 materials and 0 brands
  const payload = await getPayload({ config: payloadConfig })
  await payload.delete({
    collection: 'materials',
    where: { itemNo: { greater_than_equal: 1 } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'brands',
    where: { id: { exists: true } },
    overrideAccess: true,
  })

  // 2. Run 1: pnpm seed
  const run1Out = execFileSync(pnpmCmd, ['seed'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'seed-run-1.log'), run1Out, 'utf8')
  process.stdout.write(run1Out)

  // 3. Run 2: consecutive pnpm seed (idempotent: 0 created, 0 updated)
  const run2Out = execFileSync(pnpmCmd, ['seed'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'seed-run-2.log'), run2Out, 'utf8')
  process.stdout.write(run2Out)

  // 4. Verify NODE_ENV=production guard without --force-production
  const prodGuardRes = spawnSync(pnpmCmd, ['seed'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  const prodGuardLog = [
    `$ NODE_ENV=production pnpm seed`,
    `exitCode: ${String(prodGuardRes.status)}`,
    prodGuardRes.stdout || '',
    prodGuardRes.stderr || '',
  ].join('\n')
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'seed-production-guard.log'), prodGuardLog, 'utf8')
  if (prodGuardRes.status === 0) {
    throw new Error('Expected NODE_ENV=production pnpm seed without --force-production to fail!')
  }

  // 5. Start production server (`next start` on port 3141), seed Home page baseline (--skip-brands so the 83 seeded brands remain untouched), verify DB via Local API, and capture Home page screenshots in ar & en at 1440, 768, 390
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
    execFileSync(
      process.execPath,
      ['scripts/evidence/p3-t4-evidence.mjs', baseUrl, '--mode=seed-only', '--skip-brands'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
      },
    )

    // 6. Query verification via Local API (`overrideAccess: false`, `user: SEED_ADMIN_USER`)
    const [materialsEn, materialsAr, brandsEn, brandsAr, navAr, navEn] = await Promise.all([
      payload.find({
        collection: 'materials',
        sort: 'itemNo',
        limit: 200,
        depth: 1,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'materials',
        sort: 'itemNo',
        limit: 200,
        depth: 0,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'brands',
        sort: 'name',
        limit: 200,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'brands',
        sort: 'name',
        limit: 200,
        depth: 0,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.findGlobal({
        slug: 'navigation',
        locale: 'ar',
        depth: 0,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.findGlobal({
        slug: 'navigation',
        locale: 'en',
        depth: 0,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])

    const arMatByItemNo = new Map(materialsAr.docs.map((m) => [m.itemNo, m]))
    const arBrandById = new Map(brandsAr.docs.map((b) => [b.id, b]))

    const sysCounts = { electrical: 0, mechanical: 0, structural: 0, architectural: 0 }
    let minBrands = Number.POSITIVE_INFINITY
    for (const m of materialsEn.docs) {
      sysCounts[m.system] = (sysCounts[m.system] || 0) + 1
      const bCount = Array.isArray(m.brands) ? m.brands.length : 0
      if (bCount < minBrands) minBrands = bCount
    }

    const updatedAtDigest = [
      ...brandsEn.docs.map((b) => `brand:${b.name}:${b.updatedAt}`),
      ...materialsEn.docs.map((m) => `material:${String(m.itemNo)}:${m.updatedAt}`),
    ].join('\n')
    const digestSha256 = crypto.createHash('sha256').update(updatedAtDigest, 'utf8').digest('hex')

    const sortedBrandsByOrder = [...brandsEn.docs].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    )

    const queryLines = [
      '=== P4-T1 DATABASE QUERY VERIFICATION (Payload Local API, overrideAccess: false) ===',
      `materials.totalDocs (en): ${String(materialsEn.totalDocs)}`,
      `materials.totalDocs (ar): ${String(materialsAr.totalDocs)}`,
      `brands.totalDocs (en): ${String(brandsEn.totalDocs)}`,
      `brands.totalDocs (ar): ${String(brandsAr.totalDocs)}`,
      `marqueeBrandsCount (showInMarquee=true): ${String(brandsEn.docs.filter((b) => b.showInMarquee).length)}`,
      `systemCounts: electrical=${String(sysCounts.electrical)}, mechanical=${String(sysCounts.mechanical)}, structural=${String(sysCounts.structural)}, architectural=${String(sysCounts.architectural)}`,
      `everyMaterialHasAtLeastOneBrand: ${String(materialsEn.totalDocs === 73 && minBrands >= 1)} (minBrandsPerMaterial=${String(minBrands)})`,
      `navigation.header (ar): [${(navAr.header || []).map((h) => h.label).join(', ')}]`,
      `navigation.header (en): [${(navEn.header || []).map((h) => h.label).join(', ')}]`,
      `updatedAtDigestSha256: ${digestSha256}`,
      '',
      '--- ALL 83 SEEDED BRANDS (order | name | origin_en | origin_ar | showInMarquee | updatedAt) ---',
      ...sortedBrandsByOrder.map((b) => {
        const bAr = arBrandById.get(b.id)
        return `${String(b.order).padStart(2, '0')} | ${b.name} | en=${b.origin ?? '(empty)'} | ar=${bAr?.origin ?? '(empty)'} | marquee=${String(Boolean(b.showInMarquee))} | updatedAt=${b.updatedAt}`
      }),
      '',
      '--- ALL 73 SEEDED MATERIALS (itemNo | system | description_en | description_ar | brandCount | brands | updatedAt) ---',
      ...materialsEn.docs.map((m) => {
        const mAr = arMatByItemNo.get(m.itemNo)
        const brandNames = (m.brands || []).map((b) => (typeof b === 'object' ? b.name : String(b)))
        return `#${String(m.itemNo).padStart(2, '0')} | ${m.system.padEnd(13, ' ')} | en="${m.description}" | ar="${mAr?.description ?? ''}" | brands(${String(brandNames.length)})=[${brandNames.join(', ')}] | updatedAt=${m.updatedAt}`
      }),
    ]
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'seed-query-verification.log'),
      `${queryLines.join('\n')}\n`,
      'utf8',
    )

    const plan = buildMaterialsSeedPlan()
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'seed-tables.md'),
      generateMarkdownTables(plan),
      'utf8',
    )

    // 7. Capture Home page screenshots in ar & en at 1440, 768, 390 on the same live server
    const browser = await chromium.launch()
    try {
      const viewports = [
        { width: 1440, height: 900, label: '1440' },
        { width: 768, height: 1024, label: '768' },
        { width: 390, height: 844, label: '390' },
      ]
      for (const locale of ['ar', 'en']) {
        for (const vp of viewports) {
          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
          })
          await context.addInitScript(() => {
            window.sessionStorage.setItem('aljazira_intro_seen', '1')
          })
          const page = await context.newPage()
          await page.goto(`${baseUrl}/${locale}`, { waitUntil: 'networkidle' })
          await page.locator('[data-home-section="partners"]').waitFor({
            state: 'visible',
            timeout: 15000,
          })
          const sectionCount = await page.locator('[data-home-section]').count()
          if (sectionCount !== 8) {
            throw new Error(
              `Expected 8 [data-home-section] elements on /${locale} (${vp.label}), found ${String(sectionCount)}`,
            )
          }
          await page.evaluate(async () => {
            await document.fonts.ready
          })
          await page.waitForTimeout(400)
          const outFile = path.join(EVIDENCE_DIR, `home-${locale}-${vp.label}.png`)
          await page.screenshot({ path: outFile, fullPage: true })
          await context.close()
          process.stdout.write(`[p4-t1-evidence] Captured ${outFile}\n`)
        }
      }
    } finally {
      await browser.close()
    }
  } finally {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
    serverProc.kill('SIGTERM')
    await new Promise((r) => setTimeout(r, 1500))
  }
}

await run()
process.exit(0)
