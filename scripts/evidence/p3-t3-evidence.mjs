import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Self-contained machine-captured evidence generator for `P3-T3` (`R-1`, `M-107`,
 * `handoff/tasks/P3-T3.md`, `handoff/README.md` §"Machine-captured evidence").
 *
 * Usage:
 *   node scripts/evidence/p3-t3-evidence.mjs [baseUrl] [evidenceDir] [phase3Dir]
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

const P3_T3_COMPONENT_MAP = [
  {
    key: 'service-tile',
    selector: '[data-styleguide-section="service-tile"]',
    figmaPng: 'service-tile.png',
    outName: 'side-by-side-service-tile.png',
  },
  {
    key: 'service-card',
    selector: '[data-styleguide-section="service-card"]',
    figmaPng: 'service-card.png',
    outName: 'side-by-side-service-card.png',
  },
  {
    key: 'project-card',
    selector: '[data-styleguide-section="project-card"]',
    figmaPng: 'project-card.png',
    outName: 'side-by-side-project-card.png',
  },
  {
    key: 'partner-tile',
    selector: '[data-styleguide-subsection="partner-tile"]',
    figmaPng: 'partner-tile.png',
    outName: 'side-by-side-partner-tile.png',
  },
  {
    key: 'brand-tile',
    selector: '[data-styleguide-subsection="brand-tile"]',
    figmaPng: 'brand-tile.png',
    outName: 'side-by-side-brand-tile.png',
  },
  {
    key: 'logo-marquee',
    selector: '[data-styleguide-section="logo-marquee"]',
    figmaPng: 'logo-marquee.png',
    outName: 'side-by-side-logo-marquee.png',
  },
  {
    key: 'avatar-placeholder',
    selector: '[data-styleguide-subsection="avatar-placeholder"]',
    figmaPng: 'avatar-placeholder.png',
    outName: 'side-by-side-avatar-placeholder.png',
  },
  {
    key: 'portrait-placeholder',
    selector: '[data-styleguide-subsection="portrait-placeholder"]',
    figmaPng: 'portrait-placeholder.png',
    outName: 'side-by-side-portrait-placeholder.png',
  },
  {
    key: 'team-member',
    selector: '[data-styleguide-subsection="team-member"]',
    figmaPng: 'team-member.png',
    outName: 'side-by-side-team-member.png',
  },
  {
    key: 'team-card',
    selector: '[data-styleguide-subsection="team-card-states"]',
    figmaPng: 'team-card.png',
    outName: 'side-by-side-team-card.png',
  },
  {
    key: 'team-marquee',
    selector: '[data-styleguide-section="team-marquee"]',
    figmaPng: 'team-marquee.png',
    outName: 'side-by-side-team-marquee.png',
  },
  {
    key: 'services-carousel',
    selector: '[data-styleguide-section="services-carousel"]',
    figmaPng: 'services-carousel.png',
    outName: 'side-by-side-services-carousel.png',
  },
]

/**
 * Stitches three PNG buffers side-by-side (`figmaBuffer`, `enBuffer`, `arBuffer`)
 * with zero text overlays (`handoff/README.md:180`).
 *
 * @param {Buffer} figmaBuffer
 * @param {Buffer} enBuffer
 * @param {Buffer} arBuffer
 * @param {string} outPath
 */
async function createTriSideBySideImage(figmaBuffer, enBuffer, arBuffer, outPath) {
  const fMeta = await sharp(figmaBuffer).metadata()
  const eMeta = await sharp(enBuffer).metadata()
  const aMeta = await sharp(arBuffer).metadata()

  const fW = fMeta.width ?? 400
  const fH = fMeta.height ?? 300
  const eW = eMeta.width ?? 400
  const eH = eMeta.height ?? 300
  const aW = aMeta.width ?? 400
  const aH = aMeta.height ?? 300

  const gap = 24
  const pad = 24
  const totalW = pad + fW + gap + eW + gap + aW + pad
  const totalH = pad + Math.max(fH, eH, aH) + pad

  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 246, g: 248, b: 251, alpha: 1 },
    },
  })
    .composite([
      { input: figmaBuffer, left: pad, top: pad },
      { input: enBuffer, left: pad + fW + gap, top: pad },
      { input: arBuffer, left: pad + fW + gap + eW + gap, top: pad },
    ])
    .png()
    .toFile(outPath)
}

/**
 * Creates an animated `.gif` from an array of PNG frame buffers using `sharp` (`pageHeight`).
 *
 * @param {Buffer[]} frameBuffers
 * @param {string} outPath
 * @param {number} delayMs
 */
async function createAnimatedGifFromFrames(frameBuffers, outPath, delayMs = 180) {
  if (frameBuffers.length === 0) {
    return
  }
  const firstMeta = await sharp(frameBuffers[0]).metadata()
  const targetW = Math.min(960, firstMeta.width ?? 800)
  const resizedFirst = await sharp(frameBuffers[0]).resize({ width: targetW }).png().toBuffer()
  const rMeta = await sharp(resizedFirst).metadata()
  const frameW = rMeta.width ?? targetW
  const frameH = rMeta.height ?? 300

  const normalizedFrames = []
  for (const buf of frameBuffers) {
    const norm = await sharp(buf)
      .resize(frameW, frameH, { fit: 'cover', position: 'left top' })
      .png()
      .toBuffer()
    normalizedFrames.push(norm)
  }

  const totalH = frameH * normalizedFrames.length
  const compositeOps = normalizedFrames.map((buf, idx) => ({
    input: buf,
    left: 0,
    top: idx * frameH,
  }))

  const spriteBuffer = await sharp({
    create: {
      width: frameW,
      height: totalH,
      channels: 4,
      background: { r: 246, g: 248, b: 251, alpha: 1 },
    },
  })
    .composite(compositeOps)
    .png()
    .toBuffer()

  await sharp(spriteBuffer, { animated: true, pageHeight: frameH })
    .gif({
      loop: 0,
      delay: Array(normalizedFrames.length).fill(delayMs),
    })
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

async function runP3T3Evidence(baseUrl, evidenceDir, phase3Dir) {
  const outDirs = [evidenceDir, phase3Dir].filter(Boolean)
  for (const dir of outDirs) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const headerBlock = getRepoHeaderBlock()
  const figmaComponentsDir = path.resolve(process.cwd(), 'design', 'screenshots', 'components')
  const browser = await chromium.launch({ headless: true })

  const consoleEvents = []
  const pageErrors = []
  const cspViolations = []
  const motionVerification = {
    en: {},
    ar: {},
    reducedMotion: {
      en: {},
      ar: {},
    },
  }

  try {
    // 1. Capture EN and AR component sections at 1440x900
    const sectionBuffers = { en: {}, ar: {} }

    for (const locale of ['en', 'ar']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await context.newPage()

      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleEvents.push({ locale, type: msg.type(), text: msg.text() })
        }
      })
      page.on('pageerror', (err) => {
        pageErrors.push({ locale, message: err.message })
      })
      await page.exposeFunction('__recordP3T3CspViolation', (detail) => {
        cspViolations.push({ locale, ...detail })
      })
      await page.addInitScript(() => {
        window.addEventListener('securitypolicyviolation', (e) => {
          // @ts-ignore
          window.__recordP3T3CspViolation({
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
          })
        })
      })

      await page.goto(`${baseUrl}/${locale}/styleguide`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)

      // Full-page P3-T3 styleguide screenshot at 1440
      const full1440Path = path.join(evidenceDir, `styleguide-p3-t3-1440-${locale}.png`)
      await page.screenshot({ path: full1440Path, fullPage: true })
      copyToDirs(full1440Path, outDirs)

      for (const item of P3_T3_COMPONENT_MAP) {
        const loc = page.locator(item.selector).first()
        await loc.scrollIntoViewIfNeeded()
        await page.waitForTimeout(120)
        sectionBuffers[locale][item.key] = await loc.screenshot()
      }

      // Capture animated GIF frames + interactive verification for LogoMarquee, ServicesCarousel, and TeamCard
      // A) LogoMarquee animation frames + hover pause + offscreen pause
      const marqueeLoc = page.locator('[data-testid="live-logo-marquee"]').first()
      await marqueeLoc.scrollIntoViewIfNeeded()
      const marqueeFrames = []
      for (let i = 0; i < 6; i++) {
        marqueeFrames.push(await marqueeLoc.screenshot())
        await page.waitForTimeout(220)
      }
      const marqueeGifPath = path.join(evidenceDir, `marquee-${locale}.gif`)
      await createAnimatedGifFromFrames(marqueeFrames, marqueeGifPath, 180)
      copyToDirs(marqueeGifPath, outDirs)

      const marqueeTrackRunningState = await page
        .locator('[data-testid="live-logo-marquee"] [data-row="1"] > div')
        .first()
        .evaluate((el) => window.getComputedStyle(el).animationPlayState)

      await marqueeLoc.hover()
      await page.waitForTimeout(80)
      const marqueeTrackHoverState = await page
        .locator('[data-testid="live-logo-marquee"] [data-row="1"] > div')
        .first()
        .evaluate((el) => window.getComputedStyle(el).animationPlayState)

      const duplicateAriaHiddenCount = await page
        .locator('[data-testid="live-logo-marquee"] [data-marquee-group="duplicate"][aria-hidden="true"]')
        .count()

      // B) ServicesCarousel animation frames + keyboard + button + drag checks
      const carouselWrapper = page.locator('[data-testid="live-services-carousel"]').first()
      const carouselSec = carouselWrapper.locator('[data-component="services-carousel"]').first()
      await carouselWrapper.scrollIntoViewIfNeeded()

      const carouselFrames = []
      const initialIndex = await carouselSec.getAttribute('data-active-index')
      carouselFrames.push(await carouselWrapper.screenshot())

      // Click Next button twice to capture slide progression
      const nextBtn = carouselSec.locator('[data-carousel-action="next"]').first()
      await nextBtn.click()
      await page.waitForTimeout(260)
      const afterNextClickIndex = await carouselSec.getAttribute('data-active-index')
      carouselFrames.push(await carouselWrapper.screenshot())

      await nextBtn.click()
      await page.waitForTimeout(260)
      carouselFrames.push(await carouselWrapper.screenshot())

      // Keyboard navigation check (ArrowRight / ArrowLeft)
      await carouselSec.focus()
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight')
      await page.waitForTimeout(260)
      const afterKeyNextIndex = await carouselSec.getAttribute('data-active-index')
      carouselFrames.push(await carouselWrapper.screenshot())

      await page.keyboard.press(locale === 'ar' ? 'ArrowRight' : 'ArrowLeft')
      await page.waitForTimeout(260)
      const afterKeyPrevIndex = await carouselSec.getAttribute('data-active-index')
      carouselFrames.push(await carouselWrapper.screenshot())

      const carouselGifPath = path.join(evidenceDir, `carousel-${locale}.gif`)
      await createAnimatedGifFromFrames(carouselFrames, carouselGifPath, 320)
      copyToDirs(carouselGifPath, outDirs)

      // C) TeamCard entrance animation frames
      const teamRowLoc = page.locator('[data-testid="live-team-cards"]').first()
      await teamRowLoc.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      const teamEnteredAttr = await teamRowLoc
        .locator('[data-component="team-card"]')
        .first()
        .getAttribute('data-scroll-entered')

      // Capture entrance progression across the Enter 1..5 preview states + live row
      const enterStateLocs = page.locator('[data-styleguide-subsection="team-card-states"] [data-component="team-card"]')
      const enterCount = await enterStateLocs.count()
      const teamFrames = []
      for (let i = 0; i < enterCount; i++) {
        teamFrames.push(await enterStateLocs.nth(i).screenshot())
      }
      const teamGifPath = path.join(evidenceDir, `team-card-entrance-${locale}.gif`)
      await createAnimatedGifFromFrames(teamFrames, teamGifPath, 220)
      copyToDirs(teamGifPath, outDirs)

      motionVerification[locale] = {
        marqueeTrackRunningState,
        marqueeTrackHoverState,
        duplicateAriaHiddenCount,
        carouselInitialIndex: initialIndex,
        carouselAfterNextClickIndex: afterNextClickIndex,
        carouselAfterKeyNextIndex: afterKeyNextIndex,
        carouselAfterKeyPrevIndex: afterKeyPrevIndex,
        teamCardScrollEntered: teamEnteredAttr,
      }

      // Responsive captures at 768 and 390
      for (const vp of [
        { width: 768, height: 1024 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(vp)
        await page.waitForTimeout(150)
        const vpPath = path.join(evidenceDir, `styleguide-p3-t3-${String(vp.width)}-${locale}.png`)
        await page.screenshot({ path: vpPath, fullPage: false })
        copyToDirs(vpPath, outDirs)
      }

      await context.close()
    }

    // 2. Stitch side-by-side comparison sheets (`[Figma | EN | AR]`)
    for (const item of P3_T3_COMPONENT_MAP) {
      const figmaPath = path.join(figmaComponentsDir, item.figmaPng)
      if (!fs.existsSync(figmaPath)) {
        continue
      }
      const figmaBuf = fs.readFileSync(figmaPath)
      const enBuf = sectionBuffers.en[item.key]
      const arBuf = sectionBuffers.ar[item.key]
      if (enBuf && arBuf) {
        const outPath = path.join(evidenceDir, item.outName)
        await createTriSideBySideImage(figmaBuf, enBuf, arBuf, outPath)
        copyToDirs(outPath, outDirs)
      }
    }

    // 3. Verify `prefers-reduced-motion: reduce` stops marquee, carousel, and team-card animations
    for (const locale of ['en', 'ar']) {
      const rmContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      })
      const rmPage = await rmContext.newPage()
      await rmPage.goto(`${baseUrl}/${locale}/styleguide`, { waitUntil: 'networkidle' })
      await rmPage.evaluate(() => document.fonts.ready)

      const logoMarqueeAnimName = await rmPage
        .locator('[data-testid="live-logo-marquee"] [data-row="1"] > div')
        .first()
        .evaluate((el) => window.getComputedStyle(el).animationName)

      const logoMarqueeDuplicateDisplay = await rmPage
        .locator('[data-testid="live-logo-marquee"] [data-marquee-group="duplicate"]')
        .first()
        .evaluate((el) => window.getComputedStyle(el).display)

      const teamMarqueeAnimName = await rmPage
        .locator('[data-testid="live-team-marquee"] [data-row="1"] > div')
        .first()
        .evaluate((el) => window.getComputedStyle(el).animationName)

      const carouselSec = rmPage
        .locator('[data-testid="live-services-carousel"] [data-component="services-carousel"]')
        .first()
      await carouselSec.scrollIntoViewIfNeeded()

      const carouselReducedMotionAttr = await carouselSec.getAttribute('data-reduced-motion')
      const carouselIndexBeforeWait = await carouselSec.getAttribute('data-active-index')
      await rmPage.waitForTimeout(4800)
      const carouselIndexAfterWait = await carouselSec.getAttribute('data-active-index')
      const carouselTrackTransition = await carouselSec
        .locator('[data-carousel-track="true"]')
        .first()
        .evaluate((el) => window.getComputedStyle(el).transitionDuration)

      const teamCardTransition = await rmPage
        .locator('[data-testid="live-team-cards"] [data-component="team-card"]')
        .first()
        .evaluate((el) => window.getComputedStyle(el).transitionDuration)

      const rmShotPath = path.join(evidenceDir, `reduced-motion-${locale}.png`)
      await rmPage.locator('[data-testid="live-logo-marquee"]').first().screenshot({ path: rmShotPath })
      copyToDirs(rmShotPath, outDirs)

      motionVerification.reducedMotion[locale] = {
        logoMarqueeAnimationName: logoMarqueeAnimName,
        logoMarqueeDuplicateDisplay,
        teamMarqueeAnimationName: teamMarqueeAnimName,
        carouselReducedMotionAttr,
        carouselIndexBeforeWait,
        carouselIndexAfterWait,
        carouselTrackTransitionDuration: carouselTrackTransition,
        teamCardTransitionDuration: teamCardTransition,
      }

      await rmContext.close()
    }
  } finally {
    await browser.close()
  }

  const reportPayload = {
    baseUrl,
    consoleErrorsAndWarnings: consoleEvents.length,
    pageErrors: pageErrors.length,
    cspViolations: cspViolations.length,
    motionVerification,
  }

  const jsonPath = path.join(evidenceDir, 'motion-and-a11y-checks.json')
  fs.writeFileSync(jsonPath, JSON.stringify(reportPayload, null, 2), 'utf8')
  copyToDirs(jsonPath, outDirs)

  const logLines = [
    headerBlock.trimEnd(),
    `BaseURL: ${baseUrl}`,
    `ConsoleErrorsAndWarnings: ${String(consoleEvents.length)}`,
    `PageErrors: ${String(pageErrors.length)}`,
    `CSPViolations: ${String(cspViolations.length)}`,
    '',
    '=== Normal Motion & Interactive Checks (EN) ===',
    JSON.stringify(motionVerification.en, null, 2),
    '',
    '=== Normal Motion & Interactive Checks (AR / RTL) ===',
    JSON.stringify(motionVerification.ar, null, 2),
    '',
    '=== prefers-reduced-motion: reduce Verification (EN) ===',
    JSON.stringify(motionVerification.reducedMotion.en, null, 2),
    '',
    '=== prefers-reduced-motion: reduce Verification (AR / RTL) ===',
    JSON.stringify(motionVerification.reducedMotion.ar, null, 2),
    '',
  ]

  const logPath = path.join(evidenceDir, 'motion-and-a11y-checks.log')
  fs.writeFileSync(logPath, logLines.join('\n'), 'utf8')
  copyToDirs(logPath, outDirs)

  if (consoleEvents.length > 0 || pageErrors.length > 0 || cspViolations.length > 0) {
    throw new Error(
      `Console/page/CSP errors detected during P3-T3 evidence capture: ${JSON.stringify({
        consoleEvents,
        pageErrors,
        cspViolations,
      })}`,
    )
  }
}

const args = process.argv.slice(2)
const baseUrl = args[0] || 'http://localhost:3126'
const evidenceDir =
  args[1] || path.resolve(process.cwd(), 'docs', 'reports', 'evidence', 'P3-T3', 'r1')
const phase3Dir =
  args[2] || path.resolve(process.cwd(), 'docs', 'reports', 'phase-3', 'P3-T3')

runP3T3Evidence(baseUrl, evidenceDir, phase3Dir).catch((err) => {
  process.stderr.write(`[p3-t3-evidence] ERROR: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exit(1)
})
