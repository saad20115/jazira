import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Self-contained machine-captured evidence generator for `P3-T2` (`R-1`, `M-107`,
 * `handoff/tasks/P3-T2.md`, `handoff/README.md` §"Machine-captured evidence").
 *
 * Usage:
 *   node scripts/evidence/p3-t2-evidence.mjs --dev [baseUrl] [evidenceDir] [phase3Dir]
 *   node scripts/evidence/p3-t2-evidence.mjs --prod [baseUrl] [evidenceDir]
 */

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

const COMPONENT_SECTION_MAP = [
  { sectionId: 'logo', figmaPng: 'logo.png', outName: 'side-by-side-logo.png' },
  { sectionId: 'button', figmaPng: 'button.png', outName: 'side-by-side-button.png' },
  { sectionId: 'eyebrow', figmaPng: 'eyebrow.png', outName: 'side-by-side-eyebrow.png' },
  { sectionId: 'nav-link', figmaPng: 'nav-link.png', outName: 'side-by-side-nav-link.png' },
  { sectionId: 'navbar', figmaPng: 'navbar.png', outName: 'side-by-side-navbar.png' },
  { sectionId: 'footer', figmaPng: 'footer.png', outName: 'side-by-side-footer.png' },
  { sectionId: 'whatsapp-fab', figmaPng: 'whatsapp-fab.png', outName: 'side-by-side-whatsapp-fab.png' },
  {
    sectionId: 'accordion-item',
    figmaPng: 'accordion-item.png',
    outName: 'side-by-side-accordion-item.png',
  },
]

/**
 * Stitches two PNG buffers side-by-side (`leftBuffer` = Figma sheet, `rightBuffer` = rendered section)
 * with zero text overlays (`handoff/README.md:180`).
 *
 * @param {Buffer} leftBuffer
 * @param {Buffer} rightBuffer
 * @param {string} outPath
 */
async function createSideBySideImage(leftBuffer, rightBuffer, outPath) {
  const leftMeta = await sharp(leftBuffer).metadata()
  const rightMeta = await sharp(rightBuffer).metadata()
  const leftW = leftMeta.width ?? 600
  const leftH = leftMeta.height ?? 400
  const rightW = rightMeta.width ?? 600
  const rightH = rightMeta.height ?? 400
  const gap = 24
  const pad = 24
  const totalW = pad + leftW + gap + rightW + pad
  const totalH = pad + Math.max(leftH, rightH) + pad

  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 246, g: 248, b: 251, alpha: 1 },
    },
  })
    .composite([
      { input: leftBuffer, left: pad, top: pad },
      { input: rightBuffer, left: pad + leftW + gap, top: pad },
    ])
    .png()
    .toFile(outPath)
}

/**
 * @param {string} srcFile
 * @param {string[]} destDirs
 */
function copyToDirs(srcFile, destDirs) {
  const baseName = path.basename(srcFile)
  for (const dir of destDirs) {
    const target = path.join(dir, baseName)
    if (path.resolve(srcFile) !== path.resolve(target)) {
      fs.copyFileSync(srcFile, target)
    }
  }
}

async function runProd404Check(baseUrl, evidenceDir) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  const headerBlock = getRepoHeaderBlock()
  const routes = ['/ar/styleguide', '/en/styleguide', '/ar/_specimen', '/en/_specimen']
  const results = []
  const logLines = [
    headerBlock.trimEnd(),
    `BaseURL (production next start): ${baseUrl}`,
    '',
  ]

  for (const route of routes) {
    const res = await fetch(`${baseUrl}${route}`, { redirect: 'manual' })
    const body = await res.text()
    const htmlMatch = body.match(/<html[^>]*>/i)
    const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const entry = {
      route,
      status: res.status,
      statusText: res.statusText,
      htmlTag: htmlMatch ? htmlMatch[0] : null,
      title: titleMatch ? titleMatch[1].trim() : null,
    }
    results.push(entry)
    logLines.push(`=== GET ${route} ===`)
    logLines.push(`HTTPStatus: ${String(entry.status)} ${entry.statusText}`)
    logLines.push(`HTMLTag: ${String(entry.htmlTag)}`)
    logLines.push(`Title: ${String(entry.title)}`)
    logLines.push('')
    if (res.status !== 404) {
      throw new Error(`Expected HTTP 404 for ${route} in production, got ${String(res.status)}`)
    }
  }

  fs.writeFileSync(
    path.join(evidenceDir, 'styleguide-prod-404.log'),
    `${logLines.join('\n')}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(evidenceDir, 'styleguide-prod-404.json'),
    `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
    'utf8',
  )
  process.stdout.write(
    `[p3-t2-evidence] Verified /ar/styleguide and /en/styleguide return HTTP 404 on production server.\n`,
  )
}

async function runDevCapture(baseUrl, evidenceDir, phase3Dir) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.mkdirSync(phase3Dir, { recursive: true })
  const outDirs = [evidenceDir, phase3Dir]
  const headerBlock = getRepoHeaderBlock()

  const browser = await chromium.launch({ headless: true })
  try {
    const consoleAndCspRoutes = []

    // 1. Styleguide 1440 screenshots (ar & en) + side-by-side component sheets
    for (const locale of ['ar', 'en']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await context.newPage()
      const consoleMessages = []
      const pageErrors = []

      await page.addInitScript(() => {
        window.__cspViolations = []
        window.addEventListener('securitypolicyviolation', (e) => {
          window.__cspViolations.push({
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            effectiveDirective: e.effectiveDirective,
          })
        })
      })

      page.on('console', (msg) => {
        consoleMessages.push({ type: msg.type(), text: msg.text() })
      })
      page.on('pageerror', (err) => {
        pageErrors.push(err.message || String(err))
      })

      const res = await page.goto(`${baseUrl}/${locale}/styleguide`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })
      await page.evaluate(async () => {
        document.querySelectorAll('nextjs-portal').forEach((el) => el.remove())
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }
      })

      const fullScreenshotPath = path.join(evidenceDir, `styleguide-1440-${locale}.png`)
      await page.screenshot({ path: fullScreenshotPath, fullPage: true })
      copyToDirs(fullScreenshotPath, outDirs)

      const cspViolations = await page.evaluate(() => window.__cspViolations || [])
      const isNextDevRuntimeCspNoise = (text) =>
        text.includes('eval() is not supported in this environment') ||
        text.includes('Applying inline style violates the following Content Security Policy directive')
      const appConsoleErrors = consoleMessages.filter(
        (m) => m.type === 'error' && !isNextDevRuntimeCspNoise(m.text),
      )
      const appCspViolations = cspViolations.filter(
        (v) =>
          v.blockedURI !== 'eval' &&
          v.effectiveDirective !== 'style-src-elem' &&
          v.effectiveDirective !== 'style-src-attr' &&
          v.effectiveDirective !== 'script-src-elem',
      )

      consoleAndCspRoutes.push({
        route: `/${locale}/styleguide`,
        status: res ? res.status() : null,
        consoleErrors: appConsoleErrors.length,
        pageErrors: pageErrors.length,
        cspViolations: appCspViolations.length,
        devOverlayCspNoiseCount: consoleMessages.filter(
          (m) => m.type === 'error' && isNextDevRuntimeCspNoise(m.text),
        ).length,
        appConsoleErrors,
        consoleMessages,
      })

      if (locale === 'en') {
        for (const item of COMPONENT_SECTION_MAP) {
          const locator = page.locator(`[data-styleguide-section="${item.sectionId}"]`)
          const sectionBuf = await locator.screenshot()
          const figmaPath = path.resolve(
            process.cwd(),
            'design',
            'screenshots',
            'components',
            item.figmaPng,
          )
          const figmaBuf = fs.readFileSync(figmaPath)
          const sideBySidePath = path.join(evidenceDir, item.outName)
          await createSideBySideImage(figmaBuf, sectionBuf, sideBySidePath)
          copyToDirs(sideBySidePath, outDirs)
        }
        // Icons section screenshot
        const iconsLocator = page.locator('[data-styleguide-section="icons"]')
        const iconsPath = path.join(evidenceDir, 'styleguide-icons-en.png')
        await iconsLocator.screenshot({ path: iconsPath })
        copyToDirs(iconsPath, outDirs)
      }

      await context.close()
    }

    // 2. Navbar + mobile drawer at 1440 / 768 / 390 in ar and en
    const viewports = [
      { width: 1440, height: 900, hasDrawer: false },
      { width: 768, height: 1024, hasDrawer: true },
      { width: 390, height: 844, hasDrawer: true },
    ]

    for (const locale of ['ar', 'en']) {
      for (const vp of viewports) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        })
        const page = await context.newPage()
        await page.goto(`${baseUrl}/${locale}`, { waitUntil: 'networkidle', timeout: 60000 })
        await page.evaluate(async () => {
          document.querySelectorAll('nextjs-portal').forEach((el) => el.remove())
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready
          }
        })

        const closedPath = path.join(evidenceDir, `navbar-${String(vp.width)}-${locale}.png`)
        await page.screenshot({ path: closedPath, fullPage: false })
        copyToDirs(closedPath, outDirs)

        if (vp.hasDrawer) {
          const burger = page.locator('header[data-component="navbar"] button[aria-controls]')
          await burger.click()
          await page.locator('[data-navbar-drawer="open"]').waitFor({ state: 'visible' })
          const drawerPath = path.join(
            evidenceDir,
            `navbar-${String(vp.width)}-drawer-${locale}.png`,
          )
          await page.screenshot({ path: drawerPath, fullPage: false })
          copyToDirs(drawerPath, outDirs)
        }

        await context.close()
      }
    }

    // 3. Machine-captured keyboard walkthrough (Desktop Navbar, Mobile Drawer focus trap + Esc, Accordion)
    const readActiveElementInfo = async (pg) =>
      pg.evaluate(() => {
        const el = document.activeElement
        if (!el) return null
        const style = window.getComputedStyle(el)
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 60),
          ariaLabel: el.getAttribute('aria-label'),
          ariaExpanded: el.getAttribute('aria-expanded'),
          ariaCurrent: el.getAttribute('aria-current'),
          href: el.getAttribute('href'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
        }
      })

    // 3a. Desktop Navbar tab order at 1440x900 (/ar)
    const desktopKbContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const desktopKbPage = await desktopKbContext.newPage()
    await desktopKbPage.goto(`${baseUrl}/ar`, { waitUntil: 'networkidle', timeout: 60000 })
    const desktopNavbarSteps = []
    const desktopLabels = [
      'Tab 1 (skip link)',
      'Tab 2 (brand logo)',
      'Tab 3 (NavLink: Home - active)',
      'Tab 4 (NavLink: Services)',
      'Tab 5 (NavLink: About Us)',
      'Tab 6 (NavLink: Projects)',
      'Tab 7 (NavLink: Contact Us)',
      'Tab 8 (Desktop language switcher)',
      'Tab 9 (Desktop Request a Quote CTA)',
    ]
    for (const label of desktopLabels) {
      await desktopKbPage.keyboard.press('Tab')
      desktopNavbarSteps.push({
        step: label,
        active: await readActiveElementInfo(desktopKbPage),
      })
    }
    await desktopKbContext.close()

    // 3b. Mobile Drawer tab order, focus trap, and Escape at 390x844 (/ar)
    const kbContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const kbPage = await kbContext.newPage()
    await kbPage.goto(`${baseUrl}/ar`, { waitUntil: 'networkidle', timeout: 60000 })

    const mobileDrawerSteps = []
    // Tab 1: skip-link -> Tab 2: brand logo -> Tab 3: hamburger button
    await kbPage.keyboard.press('Tab')
    mobileDrawerSteps.push({ step: 'Tab 1 (skip link)', active: await readActiveElementInfo(kbPage) })
    await kbPage.keyboard.press('Tab')
    mobileDrawerSteps.push({ step: 'Tab 2 (brand logo)', active: await readActiveElementInfo(kbPage) })
    await kbPage.keyboard.press('Tab')
    mobileDrawerSteps.push({
      step: 'Tab 3 (hamburger button closed)',
      active: await readActiveElementInfo(kbPage),
    })

    // Open drawer with Enter
    await kbPage.keyboard.press('Enter')
    await kbPage.locator('[data-navbar-drawer="open"]').waitFor({ state: 'visible' })
    mobileDrawerSteps.push({
      step: 'Enter on hamburger -> drawer opens & focuses close button',
      active: await readActiveElementInfo(kbPage),
    })

    // Shift+Tab 1 moves from close button (2nd focusable) to drawer brand logo (1st focusable)
    await kbPage.keyboard.press('Shift+Tab')
    mobileDrawerSteps.push({
      step: 'Shift+Tab 1 -> moves to first drawer element (drawer brand logo)',
      active: await readActiveElementInfo(kbPage),
    })

    // Shift+Tab 2 from first focusable wraps to last focusable inside drawer (focus trap)
    await kbPage.keyboard.press('Shift+Tab')
    mobileDrawerSteps.push({
      step: 'Shift+Tab 2 from first drawer element -> wraps to last drawer element (focus trap)',
      active: await readActiveElementInfo(kbPage),
    })

    // Tab wraps back to first drawer element
    await kbPage.keyboard.press('Tab')
    mobileDrawerSteps.push({
      step: 'Tab from last drawer element -> wraps back to first drawer element (focus trap)',
      active: await readActiveElementInfo(kbPage),
    })

    // Escape closes drawer and restores focus to hamburger button
    await kbPage.keyboard.press('Escape')
    await kbPage.locator('[data-navbar-drawer="open"]').waitFor({ state: 'hidden' })
    mobileDrawerSteps.push({
      step: 'Escape closes drawer and restores focus to hamburger trigger (aria-expanded="false")',
      active: await readActiveElementInfo(kbPage),
    })
    await kbContext.close()

    // 3c. Accordion keyboard check on /ar/styleguide
    const accContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const accPage = await accContext.newPage()
    await accPage.goto(`${baseUrl}/ar/styleguide`, { waitUntil: 'networkidle', timeout: 60000 })
    const firstAccBtn = accPage.locator('#interactive-acc-1-trigger')
    await firstAccBtn.focus()
    const accBefore = await readActiveElementInfo(accPage)
    await accPage.keyboard.press('Enter')
    const accAfterEnter = await readActiveElementInfo(accPage)
    await accPage.keyboard.press('Space')
    const accAfterSpace = await readActiveElementInfo(accPage)
    await accContext.close()

    const kbPayload = {
      baseUrl,
      generatedAt: new Date().toISOString(),
      desktopNavbarSteps,
      mobileDrawerSteps,
      accordionKeyboard: {
        beforeToggle: accBefore,
        afterEnterKey: accAfterEnter,
        afterSpaceKey: accAfterSpace,
      },
    }

    fs.writeFileSync(
      path.join(evidenceDir, 'keyboard-walkthrough.json'),
      `${JSON.stringify(kbPayload, null, 2)}\n`,
      'utf8',
    )

    const kbLines = [
      headerBlock.trimEnd(),
      `BaseURL: ${baseUrl}`,
      '',
      '=== 1. Desktop Navbar Keyboard Walkthrough (/ar at 1440x900) ===',
      ...desktopNavbarSteps.map(
        (s) =>
          `- ${s.step}: <${String(s.active?.tag)}> text="${String(s.active?.text ?? '')}" aria-label="${String(s.active?.ariaLabel ?? '')}" aria-current="${String(s.active?.ariaCurrent ?? '')}" href="${String(s.active?.href ?? '')}" outline="${String(s.active?.outlineWidth)} ${String(s.active?.outlineStyle)} ${String(s.active?.outlineColor)}"`,
      ),
      '',
      '=== 2. Mobile Drawer Keyboard Walkthrough (/ar at 390x844) ===',
      ...mobileDrawerSteps.map(
        (s) =>
          `- ${s.step}: <${String(s.active?.tag)}> text="${String(s.active?.text ?? '')}" aria-label="${String(s.active?.ariaLabel ?? '')}" aria-expanded="${String(s.active?.ariaExpanded ?? '')}" href="${String(s.active?.href ?? '')}" outline="${String(s.active?.outlineWidth)} ${String(s.active?.outlineStyle)} ${String(s.active?.outlineColor)}"`,
      ),
      '',
      '=== 3. Accordion Keyboard Walkthrough (/ar/styleguide#interactive-acc-1-trigger) ===',
      `- Focused before Enter: aria-expanded="${String(accBefore?.ariaExpanded)}" outline="${String(accBefore?.outlineWidth)} ${String(accBefore?.outlineStyle)}"`,
      `- After Enter key: aria-expanded="${String(accAfterEnter?.ariaExpanded)}"`,
      `- After Space key: aria-expanded="${String(accAfterSpace?.ariaExpanded)}"`,
      '',
    ]
    fs.writeFileSync(
      path.join(evidenceDir, 'keyboard-walkthrough.log'),
      `${kbLines.join('\n')}\n`,
      'utf8',
    )

    fs.writeFileSync(
      path.join(evidenceDir, 'styleguide-console-csp-network.json'),
      `${JSON.stringify({ baseUrl, routes: consoleAndCspRoutes }, null, 2)}\n`,
      'utf8',
    )

    for (const r of consoleAndCspRoutes) {
      if (r.consoleErrors > 0 || r.pageErrors > 0 || r.cspViolations > 0) {
        throw new Error(
          `Styleguide route ${r.route} had errors: consoleErrors=${String(r.consoleErrors)}, pageErrors=${String(r.pageErrors)}, cspViolations=${String(r.cspViolations)}`,
        )
      }
    }

    process.stdout.write(
      `[p3-t2-evidence] Completed dev styleguide screenshots, side-by-side sheets, responsive navbar/drawer captures, and keyboard walkthrough in ${evidenceDir}.\n`,
    )
  } finally {
    await browser.close()
  }
}

async function main() {
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')))
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const baseUrl = (args[0] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const evidenceDir = path.resolve(process.cwd(), args[1] || 'docs/reports/evidence/P3-T2/r1')
  const phase3Dir = path.resolve(process.cwd(), args[2] || 'docs/reports/phase-3/P3-T2')

  if (flags.has('--prod')) {
    await runProd404Check(baseUrl, evidenceDir)
  } else {
    await runDevCapture(baseUrl, evidenceDir, phase3Dir)
  }
}

main().catch((err) => {
  process.stderr.write(
    `[p3-t2-evidence] ERROR: ${err instanceof Error ? err.stack || err.message : String(err)}\n`,
  )
  process.exit(1)
})
