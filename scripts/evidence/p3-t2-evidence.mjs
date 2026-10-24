import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Self-contained machine-captured evidence generator for `P3-T2` (`R-1`..`R-19`, `M-107`, `M-120`,
 * `handoff/tasks/P3-T2.md`, `handoff/README.md` §"Machine-captured evidence", `docs/05-design.md` §19).
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

function srgbToLinear(c8) {
  const c = c8 / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex) {
  const clean = hex.replace(/^#/, '')
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function computeContrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex)
  const l2 = relativeLuminance(bgHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

/**
 * Parses `src/styles/tokens.css` directly from disk and resolves hex values and `var(--*)` aliases (`R-18`).
 */
function loadTokensFromCss() {
  const tokensPath = path.resolve(process.cwd(), 'src', 'styles', 'tokens.css')
  const css = fs.readFileSync(tokensPath, 'utf8')
  /** @type {Record<string, string>} */
  const rawMap = {}
  const declRegex = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g
  let match = declRegex.exec(css)
  while (match !== null) {
    const name = match[1].trim()
    const val = match[2].trim()
    if (!rawMap[name]) {
      rawMap[name] = val
    }
    match = declRegex.exec(css)
  }

  /**
   * @param {string} tokenName
   * @returns {string}
   */
  function resolveHex(tokenName) {
    let current = rawMap[tokenName]
    let depth = 0
    while (current && depth < 10) {
      const hexMatch = current.match(/^#[0-9a-fA-F]{6}$/)
      if (hexMatch) {
        return hexMatch[0].toLowerCase()
      }
      const varMatch = current.match(/^var\((--[a-zA-Z0-9-]+)\)$/)
      if (varMatch) {
        current = rawMap[varMatch[1]]
        depth += 1
      } else {
        break
      }
    }
    throw new Error(`Could not resolve hex value for token ${tokenName} in ${tokensPath}`)
  }

  return { tokensPath, resolveHex }
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

async function runProd404AndCspCheck(baseUrl, evidenceDir) {
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

  // Unfiltered production browser check on /ar and /en (`R-2` / `M-119`)
  const browser = await chromium.launch({ headless: true })
  const prodBrowserRoutes = []
  try {
    for (const publicRoute of ['/ar', '/en']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await context.newPage()
      const consoleErrors = []
      const pageErrors = []
      const cspViolations = []

      await page.addInitScript(() => {
        window.__prodCspViolations = []
        window.addEventListener('securitypolicyviolation', (e) => {
          window.__prodCspViolations.push({
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            effectiveDirective: e.effectiveDirective,
          })
        })
      })
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      page.on('pageerror', (err) => {
        pageErrors.push(err.message || String(err))
      })

      const res = await page.goto(`${baseUrl}${publicRoute}`, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })
      const recordedViolations = await page.evaluate(() => window.__prodCspViolations || [])
      cspViolations.push(...recordedViolations)

      prodBrowserRoutes.push({
        route: publicRoute,
        status: res ? res.status() : null,
        consoleErrorsCount: consoleErrors.length,
        pageErrorsCount: pageErrors.length,
        cspViolationsCount: cspViolations.length,
        consoleErrors,
        pageErrors,
        cspViolations,
      })

      logLines.push(`=== Browser Unfiltered CSP & Console Check: ${publicRoute} (next start) ===`)
      logLines.push(`HTTPStatus: ${String(res ? res.status() : null)}`)
      logLines.push(`ConsoleErrors (unfiltered): ${String(consoleErrors.length)}`)
      logLines.push(`PageErrors (unfiltered): ${String(pageErrors.length)}`)
      logLines.push(`CSPViolations (unfiltered): ${String(cspViolations.length)}`)
      logLines.push('')

      await context.close()

      if (consoleErrors.length > 0 || pageErrors.length > 0 || cspViolations.length > 0) {
        throw new Error(
          `Production route ${publicRoute} had errors/CSP violations: ${JSON.stringify({
            consoleErrors,
            pageErrors,
            cspViolations,
          })}`,
        )
      }
    }
  } finally {
    await browser.close()
  }

  fs.writeFileSync(
    path.join(evidenceDir, 'styleguide-prod-404.log'),
    `${logLines.join('\n')}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(evidenceDir, 'styleguide-prod-404.json'),
    `${JSON.stringify(
      { baseUrl, generatedAt: new Date().toISOString(), results, prodBrowserRoutes },
      null,
      2,
    )}\n`,
    'utf8',
  )
  process.stdout.write(
    `[p3-t2-evidence] Verified /ar/styleguide & /en/styleguide return HTTP 404 and /ar & /en have 0 unfiltered CSP/console errors on production server.\n`,
  )
}

function writeContrastReport(evidenceDir, headerBlock) {
  const { tokensPath, resolveHex } = loadTokensFromCss()

  const pairs = [
    {
      label: 'Small gold text on white (Accordion "Show details", ServiceTile "Learn more")',
      foregroundToken: '--gold-700',
      backgroundToken: '--white',
      minRequired: 4.5,
    },
    {
      label: 'Small gold text on surface (PartnerTile hover subtitle on surface)',
      foregroundToken: '--gold-700',
      backgroundToken: '--surface',
      minRequired: 4.5,
    },
    {
      label: 'Small gold text on gold-50 (Eyebrow Light, Accordion expanded badge)',
      foregroundToken: '--gold-700',
      backgroundToken: '--gold-50',
      minRequired: 4.5,
    },
    {
      label: 'Light-surface focus-visible ring on white',
      foregroundToken: '--navy-950',
      backgroundToken: '--white',
      minRequired: 3.0,
    },
    {
      label: 'Light-surface focus-visible ring on surface',
      foregroundToken: '--navy-950',
      backgroundToken: '--surface',
      minRequired: 3.0,
    },
    {
      label: 'Light-surface focus-visible ring on gold-50',
      foregroundToken: '--navy-950',
      backgroundToken: '--gold-50',
      minRequired: 3.0,
    },
    {
      label: 'Dark-surface focus-visible ring & Eyebrow Dark text on navy-950',
      foregroundToken: '--gold-300',
      backgroundToken: '--navy-950',
      minRequired: 4.5,
    },
    {
      label: 'Dark-surface focus-visible ring on navy-900',
      foregroundToken: '--gold-300',
      backgroundToken: '--navy-900',
      minRequired: 4.5,
    },
    {
      label: 'Gold Button text (--navy-950) on --gold-500 fill',
      foregroundToken: '--navy-950',
      backgroundToken: '--gold-500',
      minRequired: 4.5,
    },
    {
      label: 'Body text (--text-body) on --white',
      foregroundToken: '--text-body',
      backgroundToken: '--white',
      minRequired: 4.5,
    },
  ].map((entry) => {
    const foregroundHex = resolveHex(entry.foregroundToken)
    const backgroundHex = resolveHex(entry.backgroundToken)
    const ratio = computeContrastRatio(foregroundHex, backgroundHex)
    const pass = ratio >= entry.minRequired
    if (!pass) {
      throw new Error(
        `Contrast check failed for ${entry.label}: ${String(ratio)}:1 < ${String(entry.minRequired)}:1`,
      )
    }
    return { ...entry, foregroundHex, backgroundHex, ratio, pass }
  })

  const lines = [
    headerBlock.trimEnd(),
    `=== WCAG 2.1 Contrast Verification (parsed from ${path.relative(process.cwd(), tokensPath)}, R-12, R-18, R-22) ===`,
    ...pairs.map(
      (p) =>
        `- [PASS] ${p.label}: ${p.foregroundToken} (${p.foregroundHex}) on ${p.backgroundToken} (${p.backgroundHex}) -> ${String(p.ratio)}:1 (required >= ${String(p.minRequired)}:1)`,
    ),
    '',
  ]
  fs.writeFileSync(path.join(evidenceDir, 'contrast-ratios.log'), `${lines.join('\n')}\n`, 'utf8')
  fs.writeFileSync(
    path.join(evidenceDir, 'contrast-ratios.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceFile: 'src/styles/tokens.css', pairs }, null, 2)}\n`,
    'utf8',
  )
}

async function runDevCapture(baseUrl, evidenceDir, phase3Dir) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.mkdirSync(phase3Dir, { recursive: true })
  const outDirs = [evidenceDir, phase3Dir]
  const headerBlock = getRepoHeaderBlock()

  writeContrastReport(evidenceDir, headerBlock)

  const browser = await chromium.launch({ headless: true })
  try {
    const consoleAndCspRoutes = []

    // 1. Styleguide 1440 screenshots (ar & en) + side-by-side component sheets + 2-column footer capture (`R-16`)
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

      // Capture 2-column Footer (`R-16`)
      const footer2ColLocator = page.locator('[data-testid="styleguide-footer-2col"]').first()
      await footer2ColLocator.scrollIntoViewIfNeeded()
      const footer2ColPath = path.join(evidenceDir, `footer-2col-${locale}.png`)
      await footer2ColLocator.screenshot({ path: footer2ColPath })
      copyToDirs(footer2ColPath, outDirs)

      // R-23: Inspect all `document.body.querySelectorAll('[style]')` across the entire body (including fixed elements like WhatsAppFab outside <main>)
      const bodyStyleInspection = await page.evaluate(() => {
        const frameworkAllowlistSelectors = [
          'next-route-announcer',
          'nextjs-portal',
          'script[style="display: block; position: absolute;"]',
        ]
        const allStyledInBody = Array.from(document.body.querySelectorAll('[style]'))
        const frameworkStyledNodes = []
        const cssomCustomPropNodes = []
        const nonCustomPropAppNodes = []

        for (const el of allStyledInBody) {
          const matchedFramework = frameworkAllowlistSelectors.find(
            (sel) => el.matches(sel) || el.closest(sel) !== null,
          )
          if (matchedFramework) {
            frameworkStyledNodes.push({
              tag: el.tagName.toLowerCase(),
              matchedAllowlistSelector: matchedFramework,
              styleAttr: el.getAttribute('style'),
            })
            continue
          }
          const props = Array.from(el.style)
          if (props.length > 0 && props.every((p) => p.startsWith('--'))) {
            cssomCustomPropNodes.push({
              tag: el.tagName.toLowerCase(),
              dataComponent: el.getAttribute('data-component'),
              customProps: props,
            })
          } else {
            nonCustomPropAppNodes.push({
              tag: el.tagName.toLowerCase(),
              dataComponent: el.getAttribute('data-component'),
              styleAttr: el.getAttribute('style'),
            })
          }
        }

        return {
          frameworkAllowlist: frameworkAllowlistSelectors,
          totalBodyStyleElementsCount: allStyledInBody.length,
          frameworkAllowedStyleElementsCount: frameworkStyledNodes.length,
          cssomCustomPropOnlyElementsCount: cssomCustomPropNodes.length,
          nonCustomPropAppInlineStyleCount: nonCustomPropAppNodes.length,
          frameworkStyledNodes,
          nonCustomPropAppNodes,
        }
      })

      const cspViolations = await page.evaluate(() => window.__cspViolations || [])
      // Never filter style-src-attr or inline style attribute violations (`R-2` / `M-119`)
      const styleSrcAttrViolations = cspViolations.filter(
        (v) =>
          v.effectiveDirective === 'style-src-attr' || v.violatedDirective === 'style-src-attr',
      )
      const inlineStyleAttrConsoleErrors = consoleMessages.filter(
        (m) =>
          m.type === 'error' &&
          m.text.includes('style-src-attr'),
      )

      consoleAndCspRoutes.push({
        route: `/${locale}/styleguide`,
        status: res ? res.status() : null,
        bodyStyleInspection,
        styleSrcAttrViolationsCount: styleSrcAttrViolations.length,
        inlineStyleAttrConsoleErrorsCount: inlineStyleAttrConsoleErrors.length,
        pageErrorsCount: pageErrors.length,
        rawCspViolationsCount: cspViolations.length,
        rawCspViolations: cspViolations,
        rawConsoleErrorCount: consoleMessages.filter((m) => m.type === 'error').length,
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
        await page.goto(`${baseUrl}/${locale}/styleguide`, {
          waitUntil: 'networkidle',
          timeout: 60000,
        })
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
          const burger = page
            .locator('header[data-component="navbar"] button[aria-controls]')
            .first()
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

    // 2b. Verify Figma geometry on /en/styleguide & /ar/styleguide at 1440 and /ar & /en Home overlay (`R-1`, `R-3`, `R-7`, `R-10`, `R-15`, `R-16`, `M-120`)
    const geoContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const geoPage = await geoContext.newPage()
    await geoPage.goto(`${baseUrl}/en`, { waitUntil: 'networkidle', timeout: 60000 })
    const homeMetrics = await geoPage.evaluate(() => {
      const nav = document.querySelector('header[data-component="navbar"]')
      const main = document.querySelector('main')
      const navRect = nav ? nav.getBoundingClientRect() : null
      const mainRect = main ? main.getBoundingClientRect() : null
      const navStyle = nav ? window.getComputedStyle(nav) : null
      return {
        theme: nav ? nav.getAttribute('data-navbar-theme') : null,
        navTop: navRect ? Math.round(navRect.top) : null,
        navBottom: navRect ? Math.round(navRect.bottom) : null,
        mainTop: mainRect ? Math.round(mainRect.top) : null,
        borderBottomWidth: navStyle ? navStyle.borderBottomWidth : null,
      }
    })

    await geoPage.goto(`${baseUrl}/en/styleguide`, { waitUntil: 'networkidle', timeout: 60000 })
    const styleguideEnMetrics = await geoPage.evaluate(() => {
      const topNav = document.querySelector('header[data-component="navbar"]')
      const desktopNav = topNav ? topNav.querySelector('nav') : null
      const navRect = desktopNav ? desktopNav.getBoundingClientRect() : null
      const navLogo = topNav ? topNav.querySelector('[data-component="logo"]') : null
      const navLogoRect = navLogo ? navLogo.getBoundingClientRect() : null
      const navCta = topNav ? topNav.querySelector('[data-component="button"]') : null
      const navCtaRect = navCta ? navCta.getBoundingClientRect() : null

      const footerEl = document.querySelector('footer[data-component="footer"]')
      const footerRect = footerEl ? footerEl.getBoundingClientRect() : null
      const quickLinksCol = footerEl
        ? footerEl.querySelectorAll('[class*="linksColumn"]')[0]
        : null
      const contactCol = footerEl ? footerEl.querySelector('[class*="contactColumn"]') : null
      const descEl = footerEl ? footerEl.querySelector('[class*="description"]') : null
      const headingEl = footerEl ? footerEl.querySelector('h2') : null
      const ctaTitleEl = footerEl ? footerEl.querySelector('[class*="ctaTitle"]') : null
      const ctaBodyEl = footerEl ? footerEl.querySelector('[class*="ctaBody"]') : null
      const dividerEl = footerEl ? footerEl.querySelector('[class*="bottomBar"]') : null
      const langSwitcherEl = footerEl
        ? footerEl.querySelector('[data-testid="footer-language-switcher"]')
        : null

      // 2-column footer (`R-16`)
      const footer2ColWrapper = document.querySelector('[data-testid="styleguide-footer-2col"]')
      const footer2ColContact = footer2ColWrapper
        ? footer2ColWrapper.querySelector('[class*="contactColumn"]')
        : null
      const footer2ColContactRect = footer2ColContact
        ? footer2ColContact.getBoundingClientRect()
        : null

      const fLeft = footerRect ? footerRect.left : 0
      const fTop = footerRect ? footerRect.top : 0
      const qlRect = quickLinksCol ? quickLinksCol.getBoundingClientRect() : null
      const ctRect = contactCol ? contactCol.getBoundingClientRect() : null
      const descRect = descEl ? descEl.getBoundingClientRect() : null
      const dividerRect = dividerEl ? dividerEl.getBoundingClientRect() : null
      const hStyle = headingEl ? window.getComputedStyle(headingEl) : null
      const ctaTitleStyle = ctaTitleEl ? window.getComputedStyle(ctaTitleEl) : null
      const ctaBodyStyle = ctaBodyEl ? window.getComputedStyle(ctaBodyEl) : null

      return {
        navbarLogoWidth: navLogoRect ? Math.round(navLogoRect.width) : null,
        navbarLogoHeight: navLogoRect ? Math.round(navLogoRect.height) : null,
        navbarCtaHeight: navCtaRect ? Math.round(navCtaRect.height) : null,
        navbarLinksLeft: navRect ? Math.round(navRect.left) : null,
        navbarLinksRight: navRect ? Math.round(navRect.right) : null,
        footerHeight: footerRect ? Math.round(footerRect.height) : null,
        footerDividerY: dividerRect ? Math.round(dividerRect.top - fTop) : null,
        footerDescriptionWidth: descRect ? Math.round(descRect.width) : null,
        footerQuickLinksX: qlRect ? Math.round(qlRect.left - fLeft) : null,
        footerContactX: ctRect ? Math.round(ctRect.left - fLeft) : null,
        footerHeadingFontSize: hStyle ? hStyle.fontSize : null,
        footerHeadingFontWeight: hStyle ? hStyle.fontWeight : null,
        footerHeadingTextTransform: hStyle ? hStyle.textTransform : null,
        footerCtaTitleFontSize: ctaTitleStyle ? ctaTitleStyle.fontSize : null,
        footerCtaBodyFontSize: ctaBodyStyle ? ctaBodyStyle.fontSize : null,
        footerCtaBodyLineHeight: ctaBodyStyle ? ctaBodyStyle.lineHeight : null,
        footerLanguageSwitcherHref: langSwitcherEl ? langSwitcherEl.getAttribute('href') : null,
        footerLanguageSwitcherLang: langSwitcherEl ? langSwitcherEl.getAttribute('lang') : null,
        footerLanguageSwitcherDir: langSwitcherEl ? langSwitcherEl.getAttribute('dir') : null,
        footer2ColContactWidth: footer2ColContactRect
          ? Math.round(footer2ColContactRect.width)
          : null,
      }
    })

    await geoPage.goto(`${baseUrl}/ar/styleguide`, { waitUntil: 'networkidle', timeout: 60000 })
    const rtlFabMetrics = await geoPage.evaluate(() => {
      const pulseFab = document.querySelector('[data-whatsapp-fab-state="Pulse"]')
      const ring = pulseFab ? pulseFab.querySelector('[class*="pulseRing"]') : null
      const btn = pulseFab ? pulseFab.querySelector('a') : null
      const rRect = ring ? ring.getBoundingClientRect() : null
      const bRect = btn ? btn.getBoundingClientRect() : null
      const footer2ColWrapper = document.querySelector('[data-testid="styleguide-footer-2col"]')
      const footer2ColContact = footer2ColWrapper
        ? footer2ColWrapper.querySelector('[class*="contactColumn"]')
        : null
      const footer2ColContactRect = footer2ColContact
        ? footer2ColContact.getBoundingClientRect()
        : null
      return {
        ringCenterX: rRect ? Math.round(rRect.left + rRect.width / 2) : null,
        ringCenterY: rRect ? Math.round(rRect.top + rRect.height / 2) : null,
        buttonCenterX: bRect ? Math.round(bRect.left + bRect.width / 2) : null,
        buttonCenterY: bRect ? Math.round(bRect.top + bRect.height / 2) : null,
        arFooter2ColContactWidth: footer2ColContactRect
          ? Math.round(footer2ColContactRect.width)
          : null,
      }
    })
    await geoContext.close()

    // Mobile 390px hit-target verification (`R-10`, `R-21`)
    const mobileGeoContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const mobileGeoPage = await mobileGeoContext.newPage()
    await mobileGeoPage.goto(`${baseUrl}/ar/styleguide`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    await mobileGeoPage
      .locator('header[data-component="navbar"] button[aria-controls]')
      .first()
      .click()
    await mobileGeoPage.locator('[data-navbar-drawer="open"]').waitFor({ state: 'visible' })
    const arMobileHitTargets = await mobileGeoPage.evaluate(() => {
      const drawerLink = document.querySelector('[data-navbar-drawer="open"] nav a')
      const socialBtn = document.querySelector('footer[data-component="footer"] ul a')
      const footerQuickLink = document.querySelector('footer[data-component="footer"] nav a')
      const footerLangSwitcher = document.querySelector(
        'footer[data-component="footer"] [data-testid="footer-language-switcher"]',
      )
      const lsRect = footerLangSwitcher ? footerLangSwitcher.getBoundingClientRect() : null
      return {
        drawerLinkHeight: drawerLink ? Math.round(drawerLink.getBoundingClientRect().height) : null,
        socialButtonWidth: socialBtn ? Math.round(socialBtn.getBoundingClientRect().width) : null,
        socialButtonHeight: socialBtn ? Math.round(socialBtn.getBoundingClientRect().height) : null,
        footerQuickLinkHeight: footerQuickLink
          ? Math.round(footerQuickLink.getBoundingClientRect().height)
          : null,
        arFooterLanguageSwitcherWidth: lsRect ? Math.round(lsRect.width) : null,
        arFooterLanguageSwitcherHeight: lsRect ? Math.round(lsRect.height) : null,
      }
    })
    await mobileGeoPage.goto(`${baseUrl}/en/styleguide`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
    const enMobileHitTargets = await mobileGeoPage.evaluate(() => {
      const footerLangSwitcher = document.querySelector(
        'footer[data-component="footer"] [data-testid="footer-language-switcher"]',
      )
      const lsRect = footerLangSwitcher ? footerLangSwitcher.getBoundingClientRect() : null
      return {
        enFooterLanguageSwitcherWidth: lsRect ? Math.round(lsRect.width) : null,
        enFooterLanguageSwitcherHeight: lsRect ? Math.round(lsRect.height) : null,
      }
    })
    const mobileHitTargets = {
      ...arMobileHitTargets,
      ...enMobileHitTargets,
    }
    await mobileGeoContext.close()

    if (
      (mobileHitTargets.arFooterLanguageSwitcherWidth ?? 0) < 44 ||
      (mobileHitTargets.arFooterLanguageSwitcherHeight ?? 0) < 44 ||
      (mobileHitTargets.enFooterLanguageSwitcherWidth ?? 0) < 44 ||
      (mobileHitTargets.enFooterLanguageSwitcherHeight ?? 0) < 44
    ) {
      throw new Error(
        `Footer language switcher at 390px is smaller than 44x44px (R-21): ${JSON.stringify(mobileHitTargets)}`,
      )
    }

    const geometryPayload = {
      baseUrl,
      generatedAt: new Date().toISOString(),
      homeMetrics,
      styleguideEnMetrics,
      rtlFabMetrics,
      mobileHitTargets,
    }
    fs.writeFileSync(
      path.join(evidenceDir, 'figma-geometry-verification.json'),
      `${JSON.stringify(geometryPayload, null, 2)}\n`,
      'utf8',
    )
    const geoLines = [
      headerBlock.trimEnd(),
      '=== Figma Geometry, RTL FAB Centering, 2-Column Footer & 390px Hit Target Verification (R-1..R-19, M-120) ===',
      `- Home Navbar Theme: ${String(homeMetrics.theme)} (expected Light), borderBottomWidth=${String(homeMetrics.borderBottomWidth)} (expected 0px)`,
      `- Home Navbar Overlay: navbar y=${String(homeMetrics.navTop)}..${String(homeMetrics.navBottom)}, <main> y=${String(homeMetrics.mainTop)} (expected 0)`,
      `- Desktop Navbar Logo Size: ${String(styleguideEnMetrics.navbarLogoWidth)}x${String(styleguideEnMetrics.navbarLogoHeight)}px (expected 172x50px)`,
      `- Desktop Navbar CTA Button Height: ${String(styleguideEnMetrics.navbarCtaHeight)}px (expected 44px)`,
      `- Desktop Navbar Links x-range at 1440px: ${String(styleguideEnMetrics.navbarLinksLeft)}–${String(styleguideEnMetrics.navbarLinksRight)} (centred around 720px)`,
      `- Footer Quick Links x=${String(styleguideEnMetrics.footerQuickLinksX)} (expected 508), Contact Info x=${String(styleguideEnMetrics.footerContactX)} (expected 716)`,
      `- Footer Height=${String(styleguideEnMetrics.footerHeight)}px (expected 503px), Divider y=${String(styleguideEnMetrics.footerDividerY)}px (expected ~388px), Description Width=${String(styleguideEnMetrics.footerDescriptionWidth)}px (expected 300px)`,
      `- Footer Column Heading: fontSize=${String(styleguideEnMetrics.footerHeadingFontSize)}, fontWeight=${String(styleguideEnMetrics.footerHeadingFontWeight)}, textTransform=${String(styleguideEnMetrics.footerHeadingTextTransform)}`,
      `- Footer CTA Title fontSize=${String(styleguideEnMetrics.footerCtaTitleFontSize)}, CTA Body=${String(styleguideEnMetrics.footerCtaBodyFontSize)}/${String(styleguideEnMetrics.footerCtaBodyLineHeight)}`,
      `- Footer Bottom-Bar Language Switcher (R-15): href="${String(styleguideEnMetrics.footerLanguageSwitcherHref)}", lang="${String(styleguideEnMetrics.footerLanguageSwitcherLang)}", dir="${String(styleguideEnMetrics.footerLanguageSwitcherDir)}"`,
      `- Footer 2-Column Layout Contact Width (R-16): EN=${String(styleguideEnMetrics.footer2ColContactWidth)}px, AR=${String(rtlFabMetrics.arFooter2ColContactWidth)}px (expected >= 220px)`,
      `- RTL WhatsApp FAB Pulse Ring Center: (${String(rtlFabMetrics.ringCenterX)}, ${String(rtlFabMetrics.ringCenterY)}) vs Button Center: (${String(rtlFabMetrics.buttonCenterX)}, ${String(rtlFabMetrics.buttonCenterY)})`,
      `- Mobile 390px Hit Targets (R-10, R-21): drawerLinkHeight=${String(mobileHitTargets.drawerLinkHeight)}px, socialButton=${String(mobileHitTargets.socialButtonWidth)}x${String(mobileHitTargets.socialButtonHeight)}px, footerQuickLinkHeight=${String(mobileHitTargets.footerQuickLinkHeight)}px, footerLanguageSwitcher AR=${String(mobileHitTargets.arFooterLanguageSwitcherWidth)}x${String(mobileHitTargets.arFooterLanguageSwitcherHeight)}px, EN=${String(mobileHitTargets.enFooterLanguageSwitcherWidth)}x${String(mobileHitTargets.enFooterLanguageSwitcherHeight)}px`,
      '',
    ]
    fs.writeFileSync(
      path.join(evidenceDir, 'figma-geometry-verification.log'),
      `${geoLines.join('\n')}\n`,
      'utf8',
    )

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

    // 3a. Desktop Navbar tab order at 1440x900 (/ar/styleguide)
    const desktopKbContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const desktopKbPage = await desktopKbContext.newPage()
    await desktopKbPage.goto(`${baseUrl}/ar/styleguide`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })
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

    // 3b. Mobile Drawer tab order, focus trap, and Escape at 390x844 (/ar/styleguide)
    const kbContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const kbPage = await kbContext.newPage()
    await kbPage.goto(`${baseUrl}/ar/styleguide`, { waitUntil: 'networkidle', timeout: 60000 })

    const mobileDrawerSteps = []
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
      '=== 1. Desktop Navbar Keyboard Walkthrough (/ar/styleguide at 1440x900) ===',
      ...desktopNavbarSteps.map(
        (s) =>
          `- ${s.step}: <${String(s.active?.tag)}> text="${String(s.active?.text ?? '')}" aria-label="${String(s.active?.ariaLabel ?? '')}" aria-current="${String(s.active?.ariaCurrent ?? '')}" href="${String(s.active?.href ?? '')}" outline="${String(s.active?.outlineWidth)} ${String(s.active?.outlineStyle)} ${String(s.active?.outlineColor)}"`,
      ),
      '',
      '=== 2. Mobile Drawer Keyboard Walkthrough (/ar/styleguide at 390x844) ===',
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

    const cspLogLines = [
      headerBlock.trimEnd(),
      `BaseURL: ${baseUrl}`,
      `FrameworkInlineStyleAllowlist (R-23): ["next-route-announcer", "nextjs-portal", "script[style=\\"display: block; position: absolute;\\"]"]`,
      '',
      ...consoleAndCspRoutes.flatMap((r) => [
        `=== Route: ${r.route} (HTTP ${String(r.status)}) ===`,
        `TotalBodyStyleElements (document.body.querySelectorAll('[style]')): ${String(r.bodyStyleInspection.totalBodyStyleElementsCount)}`,
        `FrameworkAllowedStyleElements (${JSON.stringify(r.bodyStyleInspection.frameworkAllowlist)}): ${String(r.bodyStyleInspection.frameworkAllowedStyleElementsCount)}`,
        `CssomCustomPropOnlyElements (--*): ${String(r.bodyStyleInspection.cssomCustomPropOnlyElementsCount)}`,
        `NonCustomPropAppInlineStyleCount (R-23): ${String(r.bodyStyleInspection.nonCustomPropAppInlineStyleCount)}`,
        `StyleSrcAttrViolations (unfiltered): ${String(r.styleSrcAttrViolationsCount)}`,
        `InlineStyleAttrConsoleErrors (unfiltered): ${String(r.inlineStyleAttrConsoleErrorsCount)}`,
        `PageErrors (unfiltered): ${String(r.pageErrorsCount)}`,
        `RawDevHmrCspEvents: ${String(r.rawCspViolationsCount)}`,
        '',
      ]),
    ]
    fs.writeFileSync(
      path.join(evidenceDir, 'styleguide-console-csp-network.log'),
      `${cspLogLines.join('\n')}\n`,
      'utf8',
    )

    for (const r of consoleAndCspRoutes) {
      if (
        r.bodyStyleInspection.nonCustomPropAppInlineStyleCount > 0 ||
        r.styleSrcAttrViolationsCount > 0 ||
        r.inlineStyleAttrConsoleErrorsCount > 0 ||
        r.pageErrorsCount > 0
      ) {
        throw new Error(
          `Styleguide route ${r.route} had inline style/page errors: nonCustomPropAppInlineStyleCount=${String(r.bodyStyleInspection.nonCustomPropAppInlineStyleCount)}, styleSrcAttrViolations=${String(r.styleSrcAttrViolationsCount)}, inlineStyleAttrConsoleErrors=${String(r.inlineStyleAttrConsoleErrorsCount)}, pageErrors=${String(r.pageErrorsCount)}`,
        )
      }
    }

    process.stdout.write(
      `[p3-t2-evidence] Completed dev styleguide screenshots, side-by-side sheets, 2-col footer screenshots, responsive navbar/drawer captures, Figma geometry verification, contrast log, and keyboard walkthrough in ${evidenceDir}.\n`,
    )
  } finally {
    await browser.close()
  }
}

async function main() {
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')))
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const baseUrl = (args[0] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const evidenceDir = path.resolve(process.cwd(), args[1] || 'docs/reports/evidence/P3-T2/r4')
  const phase3Dir = path.resolve(process.cwd(), args[2] || 'docs/reports/phase-3/P3-T2/r4')

  if (flags.has('--prod')) {
    await runProd404AndCspCheck(baseUrl, evidenceDir)
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
