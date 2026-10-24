import { execFileSync, spawn, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import { getPayload } from 'payload'

import payloadConfig from '../../src/payload.config.ts'
import { buildMaterialsSeedPlan, SEED_ADMIN_USER } from '../../src/seed/materials.ts'

const outDirArg = process.argv.find((a) => a.startsWith('--out-dir='))
const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  outDirArg ? outDirArg.slice('--out-dir='.length) : 'docs/reports/evidence/P4-T1/r2',
)

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
    '### 2. Figma ↔ Raw Partner Display Name Mappings (`R-5`, `design/copy/01-home.md` `18:579`)',
  )
  lines.push('')
  lines.push(
    '| Marquee Order | Figma Partner Display Name (`18:579`) | Raw Value (`seed/materials.raw.json`) | Seeded `brands.name` | Row Numbers | Client Confirmation Needed |',
  )
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |')
  plan.figmaPartnerMappings.forEach((m) => {
    lines.push(
      `| ${String(m.marqueeOrder)} | \`${escapeMd(m.figmaDisplayName)}\` | \`${escapeMd(m.rawBrandValue)}\` | \`${escapeMd(m.seededBrandName)}\` | ${m.rowNumbers.join(', ')} | ${escapeMd(m.confirmationNeeded)} |`,
    )
  })

  lines.push('')
  lines.push(
    '### 3. Rows & Brands Flagged for Client Confirmation (`needsClientReview`, incl. Uncertain Description Typos `R-2` & Rows 58–73)',
  )
  lines.push('')
  lines.push(
    '| Row # | System | Category | Raw Input (`description` / `brandRaw` / `originRaw` / `alternativeRaw`) | Seeded Normalized Brands | Client Confirmation Needed |',
  )
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |')
  plan.needsClientReview.forEach((item) => {
    lines.push(
      `| ${String(item.rowNo)} | \`${item.system}\` | \`${item.category}\` | \`${escapeMd(item.rawBrandOrOrigin)}\` | ${item.normalizedBrands.map((b) => `\`${escapeMd(b)}\``).join(', ')} | ${escapeMd(item.details)} |`,
    )
  })

  lines.push('')
  lines.push(
    '### 4. Drafted Arabic Material Descriptions (All 73 Rows — Literal Translations `R-3` & Review Notes `R-2`)',
  )
  lines.push('')
  lines.push(
    '| Item # | System | Raw English (`seed/materials.raw.json`) | Normalized English (`description` en) | Drafted Arabic (`description` ar — `needsClientReview`) | Review Note (`R-2` / `R-5`) | Linked Normalized Brands |',
  )
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |')
  plan.materials.forEach((mat) => {
    lines.push(
      `| ${String(mat.itemNo)} | \`${mat.system}\` | \`${escapeMd(mat.rawDescription)}\` | ${escapeMd(mat.descriptionEn)} | ${escapeMd(mat.descriptionAr)} | ${escapeMd(mat.notesEn ?? '—')} | ${mat.brandNames.map((b) => `\`${escapeMd(b)}\``).join(', ')} |`,
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

  // 3. Run 2: Rerun `pnpm seed` on a non-empty DB without --reseed (`R-4` -> seed_exit_code=1)
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

  // 4. Run 3: `pnpm seed -- --reseed` in development (`R-4` -> seed_exit_code=0)
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

  // 5. Verify NODE_ENV=production guard without --force-production (`R-7` -> seed_exit_code=1)
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
    throw new Error('Expected NODE_ENV=production pnpm seed without --force-production to exit 1!')
  }

  // 6. Verify NODE_ENV=production refuses --reseed even with --force-production (`R-4` & `R-7` -> seed_exit_code=1)
  const prodReseedGuardRes = spawnSync(pnpmCmd, ['seed', '--', '--force-production', '--reseed'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, NODE_ENV: 'production' },
  })
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
      '--- ALL 73 SEEDED MATERIALS (itemNo | system | description_en | description_ar | notes_en | brandCount | brands | updatedAt) ---',
      ...materialsEn.docs.map((m) => {
        const mAr = arMatByItemNo.get(m.itemNo)
        const brandNames = (m.brands || []).map((b) => (typeof b === 'object' ? b.name : String(b)))
        const notesSuffix = m.notes ? ` | notes_en="${m.notes}"` : ''
        return `#${String(m.itemNo).padStart(2, '0')} | ${m.system.padEnd(13, ' ')} | en="${m.description}" | ar="${mAr?.description ?? ''}"${notesSuffix} | brands(${String(brandNames.length)})=[${brandNames.join(', ')}] | updatedAt=${m.updatedAt}`
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
