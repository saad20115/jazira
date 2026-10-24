import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Self-contained machine-captured evidence generator for `P3-T3` (`R-1`..`R-11`, `M-107`, `M-119`,
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
  const videoTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p3-t3-video-'))
  const browser = await chromium.launch({ headless: true })

  const rawConsoleErrors = []
  const pageErrors = []
  const rawCspViolations = []
  const styleSrcAttrViolations = []
  const inlineStyleAttrConsoleErrors = []

  const motionVerification = {
    en: {},
    ar: {},
    reducedMotion: {
      en: {},
      ar: {},
    },
  }

  try {
    // 1. Capture EN and AR component sections at 1440x900 + record .webm video (`R-9`)
    const sectionBuffers = { en: {}, ar: {} }

    for (const locale of ['en', 'ar']) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        recordVideo: {
          dir: videoTmpDir,
          size: { width: 1280, height: 720 },
        },
      })
      const page = await context.newPage()

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          rawConsoleErrors.push({ locale, text: msg.text() })
          if (msg.text().includes('style-src-attr')) {
            inlineStyleAttrConsoleErrors.push({ locale, text: msg.text() })
          }
        }
      })
      page.on('pageerror', (err) => {
        pageErrors.push({ locale, message: err.message })
      })
      await page.exposeFunction('__recordP3T3CspViolation', (detail) => {
        rawCspViolations.push({ locale, ...detail })
        if (
          detail.effectiveDirective === 'style-src-attr' ||
          detail.violatedDirective === 'style-src-attr'
        ) {
          styleSrcAttrViolations.push({ locale, ...detail })
        }
      })
      await page.addInitScript(() => {
        window.addEventListener('securitypolicyviolation', (e) => {
          // @ts-ignore
          window.__recordP3T3CspViolation({
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            effectiveDirective: e.effectiveDirective,
          })
        })
      })

      await page.goto(`${baseUrl}/${locale}/styleguide`, { waitUntil: 'networkidle' })
      await page.evaluate(async () => {
        document.querySelectorAll('nextjs-portal').forEach((el) => el.remove())
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }
      })

      // Verify zero non-custom-property inline `style="..."` attributes in app DOM (`R-1`, `R-12`, `R-13`, `R-14`)
      const ssrHtml = await (await fetch(`${baseUrl}/${locale}/styleguide`)).text()
      const ssrInlineStyleAttributeCount = (ssrHtml.match(/\sstyle="/g) ?? []).length
      if (ssrInlineStyleAttributeCount !== 0) {
        throw new Error(
          `Expected 0 style=" attributes in SSR HTML on /${locale}/styleguide, found ${String(ssrInlineStyleAttributeCount)}`,
        )
      }

      const domStyleInspection = await page.evaluate(() => {
        const frameworkAllowlistSelectors = [
          'next-route-announcer',
          'nextjs-portal',
          'script[style="display: block; position: absolute;"]',
        ]
        const allStyledInBody = Array.from(document.body.querySelectorAll('[style]'))
        let frameworkCount = 0
        let cssomCustomPropCount = 0
        let nonCustomPropCount = 0
        for (const el of allStyledInBody) {
          if (
            frameworkAllowlistSelectors.some((sel) => el.matches(sel) || el.closest(sel) !== null)
          ) {
            frameworkCount += 1
            continue
          }
          const props = Array.from(el.style)
          if (props.length > 0 && props.every((p) => p.startsWith('--'))) {
            cssomCustomPropCount += 1
          } else {
            nonCustomPropCount += 1
          }
        }
        return {
          frameworkAllowlist: frameworkAllowlistSelectors,
          totalBodyStyleElementsCount: allStyledInBody.length,
          frameworkAllowedStyleElementsCount: frameworkCount,
          nonCustomPropInlineStyleCount: nonCustomPropCount,
          cssomCustomPropElementCount: cssomCustomPropCount,
        }
      })
      if (domStyleInspection.nonCustomPropInlineStyleCount !== 0) {
        throw new Error(
          `Expected 0 non-custom-property [style] elements in document.body on /${locale}/styleguide, found ${String(domStyleInspection.nonCustomPropInlineStyleCount)}`,
        )
      }

      // Measure fixed aspect ratios / dimensions across all P3-T3 components (`R-7`, `R-8`, `R-13`, `R-15`, `R-16`)
      const componentDimensions = await page.evaluate(() => {
        const measure = (sel) => {
          const el = document.querySelector(sel)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { width: Math.round(r.width), height: Math.round(r.height) }
        }
        const partnerTiles = Array.from(
          document.querySelectorAll('[data-component="partner-tile"]'),
        )
        const partnerOverflowPx = partnerTiles.reduce((maxOv, tile) => {
          const ov = Math.max(0, tile.scrollWidth - tile.clientWidth)
          return Math.max(maxOv, ov)
        }, 0)

        const enter1Card = document.querySelector(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Enter 1"]',
        )
        const enter1Content = enter1Card
          ? enter1Card.querySelector('[data-team-card-content="true"]')
          : null

        const sixthTeamCardContent = document.querySelector(
          '[data-testid="live-team-cards"] [data-component="team-card"][data-enter-delay="600"] [data-team-card-content="true"]',
        )
        const defaultTeamCard = document.querySelector(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Default"]',
        )
        const hoverTeamCard = document.querySelector(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Hover"]',
        )
        const defaultPartnerTile = document.querySelector(
          '[data-styleguide-subsection="partner-tile"] [data-component="partner-tile"][data-state="Default"]',
        )
        const partnerWordmarkSpan = defaultPartnerTile
          ? defaultPartnerTile.querySelector('span')
          : null

        return {
          serviceTileDefault: measure(
            '[data-component="service-tile"][data-state="Default"][data-variant="grid"]',
          ),
          serviceTileFeatured: measure(
            '[data-component="service-tile"][data-state="Featured"][data-variant="grid"]',
          ),
          serviceTileCarousel: measure('[data-component="service-tile"][data-variant="carousel"]'),
          serviceCard: measure('[data-component="service-card"]'),
          projectCard: measure('[data-component="project-card"]'),
          partnerTile: measure('[data-component="partner-tile"]'),
          partnerTileMaxHorizontalOverflowPx: partnerOverflowPx,
          partnerTileDefaultShadow: defaultPartnerTile
            ? window.getComputedStyle(defaultPartnerTile).boxShadow
            : null,
          partnerTileWordmarkClassName: partnerWordmarkSpan ? partnerWordmarkSpan.className : null,
          partnerTileWordmarkFontSize: partnerWordmarkSpan
            ? window.getComputedStyle(partnerWordmarkSpan).fontSize
            : null,
          brandTile: measure('[data-component="brand-tile"]'),
          avatar120: measure('[data-component="avatar"][data-size="120"]'),
          avatar52: measure('[data-component="avatar"][data-size="52"]'),
          portrait: measure('[data-component="portrait"]'),
          teamMember: measure('[data-component="team-member"]'),
          teamCard: measure('[data-component="team-card"]'),
          teamCardEnter1OuterOpacity: enter1Card
            ? window.getComputedStyle(enter1Card).opacity
            : null,
          teamCardEnter1InnerOpacity: enter1Content
            ? window.getComputedStyle(enter1Content).opacity
            : null,
          teamCardSixthStaggerTransitionDelay: sixthTeamCardContent
            ? window.getComputedStyle(sixthTeamCardContent).transitionDelay
            : null,
          teamCardOuterTransitionProperty: defaultTeamCard
            ? window.getComputedStyle(defaultTeamCard).transitionProperty
            : null,
          teamCardHoverAfterShadow: hoverTeamCard
            ? window.getComputedStyle(hoverTeamCard, '::after').boxShadow
            : null,
          teamCardHoverAfterOpacity: hoverTeamCard
            ? window.getComputedStyle(hoverTeamCard, '::after').opacity
            : null,
        }
      })

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

      // Interactive verification for LogoMarquee, TeamMarquee, ServicesCarousel, and TeamCard
      // A) LogoMarquee hover pause + pause toggle button (`R-6`)
      const marqueeLoc = page.locator('[data-testid="live-logo-marquee"]').first()
      await marqueeLoc.scrollIntoViewIfNeeded()
      await page.mouse.move(1, 1)
      await page.waitForTimeout(150)

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

      // Move mouse away and test LogoMarquee pause/play toggle button (`R-6`)
      await page.mouse.move(1, 1)
      const marqueePauseBtn = marqueeLoc.locator('[data-marquee-action="toggle-pause"]').first()
      const marqueePauseBefore = await marqueePauseBtn.getAttribute('aria-pressed')
      await marqueePauseBtn.click()
      const marqueePauseAfterClick = await marqueePauseBtn.getAttribute('aria-pressed')
      const marqueeRootPausedAttr = await marqueeLoc
        .locator('[data-component="logo-marquee"]')
        .first()
        .getAttribute('data-paused')
      await marqueePauseBtn.click()
      const marqueePauseRestored = await marqueePauseBtn.getAttribute('aria-pressed')

      const duplicateAriaHiddenCount = await page
        .locator(
          '[data-testid="live-logo-marquee"] [data-marquee-group="duplicate"][aria-hidden="true"]',
        )
        .count()

      // B) ServicesCarousel thumb geometry + keyboard + button + mid-drag + overscroll + focus sync + 12/20 services (`R-4`, `R-5`, `R-6`, `R-8`, `R-12`, `R-14`, `R-16`)
      const carouselThumbGeometry = await page.evaluate(() => {
        const staticCarousels = Array.from(
          document.querySelectorAll(
            '[data-styleguide-section="services-carousel"] [data-component="services-carousel"]',
          ),
        ).slice(0, 5)
        const positions = staticCarousels.map((c) => {
          const thumb = c.querySelector('[data-carousel-thumb="true"]')
          const track = thumb ? thumb.parentElement : null
          const thumbRect = thumb ? thumb.getBoundingClientRect() : null
          const trackRect = track ? track.getBoundingClientRect() : null
          const m = thumb ? new DOMMatrixReadOnly(window.getComputedStyle(thumb).transform) : null
          return {
            position: c.getAttribute('data-position'),
            trackWidth: trackRect ? Math.round(trackRect.width) : null,
            thumbWidth: thumbRect ? Math.round(thumbRect.width) : null,
            thumbTranslateX: m ? Math.round(m.m41) : null,
          }
        })
        return positions
      })

      const carouselWrapper = page.locator('[data-testid="live-services-carousel"]').first()
      const carouselSec = carouselWrapper.locator('[data-component="services-carousel"]').first()
      await carouselWrapper.scrollIntoViewIfNeeded()
      await page.mouse.move(1, 1)
      await page.waitForTimeout(220)

      const carouselRegionLabel = await carouselSec.getAttribute('aria-label')
      const carouselRoleDescription = await carouselSec.getAttribute('aria-roledescription')
      const carouselMaxIndexAttr = await carouselSec.getAttribute('data-max-index')
      const liveRegionLoc = carouselSec.locator('[data-carousel-live-region="true"]').first()
      const liveRegionAriaLiveWhilePlaying = await liveRegionLoc.getAttribute('aria-live')

      // Test ServicesCarousel pause/play button (`R-6`)
      const carouselPauseBtn = carouselSec.locator('[data-carousel-action="toggle-pause"]').first()
      await carouselPauseBtn.click()
      const carouselPausedAttr = await carouselSec.getAttribute('data-paused')
      const liveRegionAriaLiveWhenPaused = await liveRegionLoc.getAttribute('aria-live')

      const initialIndex = await carouselSec.getAttribute('data-active-index')

      // Click Next button twice to capture slide progression
      const nextBtn = carouselSec.locator('[data-carousel-action="next"]').first()
      await nextBtn.click()
      await page.waitForTimeout(260)
      const afterNextClickIndex = await carouselSec.getAttribute('data-active-index')

      await nextBtn.click()
      await page.waitForTimeout(260)

      // Keyboard navigation check (ArrowRight / ArrowLeft)
      await carouselSec.focus()
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight')
      await page.waitForTimeout(260)
      const afterKeyNextIndex = await carouselSec.getAttribute('data-active-index')

      await page.keyboard.press(locale === 'ar' ? 'ArrowRight' : 'ArrowLeft')
      await page.waitForTimeout(480)
      const afterKeyPrevIndex = await carouselSec.getAttribute('data-active-index')

      // Pointer drag/swipe verification + mid-drag visual feedback (`R-11`, `R-14`)
      const trackLoc = carouselSec.locator('[data-carousel-track="true"]').first()
      const vpBox = await carouselSec.boundingBox()
      let afterPointerDragIndex = afterKeyPrevIndex
      let trackTranslateXBeforeDrag = 0
      let trackTranslateXMidDrag = 0
      let midDragDeltaPx = 0
      if (vpBox) {
        trackTranslateXBeforeDrag = await trackLoc.evaluate((el) => {
          const m = new DOMMatrixReadOnly(window.getComputedStyle(el).transform)
          return Math.round(m.m41)
        })
        const startX = vpBox.x + vpBox.width / 2
        const startY = vpBox.y + 150
        const dragDelta = locale === 'ar' ? 140 : -140
        await page.mouse.move(startX, startY)
        await page.mouse.down()
        await page.mouse.move(startX + dragDelta / 2, startY, { steps: 4 })
        await page.mouse.move(startX + dragDelta, startY, { steps: 4 })
        trackTranslateXMidDrag = await trackLoc.evaluate((el) => {
          const m = new DOMMatrixReadOnly(window.getComputedStyle(el).transform)
          return Math.round(m.m41)
        })
        midDragDeltaPx = trackTranslateXMidDrag - trackTranslateXBeforeDrag
        await page.mouse.up()
        await page.waitForTimeout(260)
        afterPointerDragIndex = await carouselSec.getAttribute('data-active-index')
      }

      // Off-screen slide keyboard focus sync verification (`R-5`)
      const slide6Link = carouselSec.locator('[data-slide-index="5"] a').first()
      await slide6Link.focus()
      await page.waitForTimeout(200)
      const afterFocusSlide6Index = await carouselSec.getAttribute('data-active-index')
      const viewportScrollLeftAfterFocus = await trackLoc.evaluate((el) =>
        el.parentElement ? el.parentElement.scrollLeft : 0,
      )
      const nextBtnDisabledAtMax = await nextBtn.isDisabled()

      // Verify 12-service and 20-service carousels (`R-12`)
      const scaleProof = {}
      for (const count of [12, 20]) {
        const scaleSec = page
          .locator(
            `[data-testid="services-carousel-${String(count)}"] [data-component="services-carousel"]`,
          )
          .first()
        await scaleSec.scrollIntoViewIfNeeded()
        await scaleSec.focus()
        await page.keyboard.press('End')
        await page.waitForTimeout(480)
        scaleProof[`services${String(count)}`] = await scaleSec.evaluate((el) => {
          const track = el.querySelector('[data-carousel-track="true"]')
          const thumb = el.querySelector('[data-carousel-thumb="true"]')
          const progressTrack = thumb ? thumb.parentElement : null
          const trackMatrix = track
            ? new DOMMatrixReadOnly(window.getComputedStyle(track).transform)
            : null
          const thumbMatrix = thumb
            ? new DOMMatrixReadOnly(window.getComputedStyle(thumb).transform)
            : null
          const thumbRect = thumb ? thumb.getBoundingClientRect() : null
          const progressRect = progressTrack ? progressTrack.getBoundingClientRect() : null
          const overshootPx =
            thumbRect && progressRect
              ? Math.max(
                  0,
                  Math.round(thumbRect.right - progressRect.right),
                  Math.round(progressRect.left - thumbRect.left),
                )
              : null
          return {
            activeIndexAtEnd: el.getAttribute('data-active-index'),
            maxIndex: el.getAttribute('data-max-index'),
            trackTranslateXAtEnd: trackMatrix ? Math.round(trackMatrix.m41) : null,
            thumbTranslateXAtEnd: thumbMatrix ? Math.round(thumbMatrix.m41) : null,
            thumbWidth: thumbRect ? Math.round(thumbRect.width) : null,
            progressTrackWidth: progressRect ? Math.round(progressRect.width) : null,
            thumbOvershootPx: overshootPx,
          }
        })
      }

      // C) TeamCard scroll-triggered entrance verification (`R-13`)
      const teamRowLoc = page.locator('[data-testid="live-team-cards"]').first()
      await teamRowLoc.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      const teamEnteredAttr = await teamRowLoc
        .locator('[data-component="team-card"]')
        .first()
        .getAttribute('data-scroll-entered')
      const sixthTeamCardEnteredAttr = await teamRowLoc
        .locator('[data-component="team-card"][data-enter-delay="600"]')
        .first()
        .getAttribute('data-scroll-entered')

      // Responsive captures at 768 and 390 + 390px horizontal overflow check (`R-7`)
      const mobileOverflow = {}
      for (const vp of [
        { width: 768, height: 1024 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(vp)
        await page.waitForTimeout(180)
        const vpPath = path.join(evidenceDir, `styleguide-p3-t3-${String(vp.width)}-${locale}.png`)
        await page.screenshot({ path: vpPath, fullPage: false })
        copyToDirs(vpPath, outDirs)
        if (vp.width === 390) {
          mobileOverflow.viewport390ScrollWidth = await page.evaluate(
            () => document.documentElement.scrollWidth,
          )
        }
      }

      motionVerification[locale] = {
        ssrInlineStyleAttributeCount,
        frameworkAllowlist: domStyleInspection.frameworkAllowlist,
        totalBodyStyleElementsCount: domStyleInspection.totalBodyStyleElementsCount,
        frameworkAllowedStyleElementsCount: domStyleInspection.frameworkAllowedStyleElementsCount,
        nonCustomPropInlineStyleCount: domStyleInspection.nonCustomPropInlineStyleCount,
        cssomCustomPropElementCount: domStyleInspection.cssomCustomPropElementCount,
        componentDimensions,
        mobileOverflow,
        marqueeTrackRunningState,
        marqueeTrackHoverState,
        marqueePauseToggle: {
          before: marqueePauseBefore,
          afterClick: marqueePauseAfterClick,
          rootPausedAttr: marqueeRootPausedAttr,
          restored: marqueePauseRestored,
        },
        duplicateAriaHiddenCount,
        carouselThumbGeometry,
        carouselA11y: {
          regionLabel: carouselRegionLabel,
          roleDescription: carouselRoleDescription,
          maxIndex: carouselMaxIndexAttr,
          liveRegionAriaLiveWhilePlaying,
          liveRegionAriaLiveWhenPaused,
          userPausedAttrAfterToggle: carouselPausedAttr,
        },
        carouselInitialIndex: initialIndex,
        carouselAfterNextClickIndex: afterNextClickIndex,
        carouselAfterKeyNextIndex: afterKeyNextIndex,
        carouselAfterKeyPrevIndex: afterKeyPrevIndex,
        carouselPointerDrag: {
          trackTranslateXBeforeDrag,
          trackTranslateXMidDrag,
          midDragDeltaPx,
          activeIndexAfterRelease: afterPointerDragIndex,
        },
        carouselFocusSyncOnSlide6: {
          activeIndexAfterFocus: afterFocusSlide6Index,
          viewportScrollLeft: viewportScrollLeftAfterFocus,
          nextButtonDisabledAtMaxIndex: nextBtnDisabledAtMax,
        },
        carouselScaleProof: scaleProof,
        teamCardScrollEntered: teamEnteredAttr,
        sixthTeamCardScrollEntered: sixthTeamCardEnteredAttr,
      }

      const videoObj = page.video()
      await context.close()
      if (videoObj) {
        const recordedVideoPath = await videoObj.path()
        const targetVideoPath = path.join(evidenceDir, `motion-${locale}.webm`)
        fs.copyFileSync(recordedVideoPath, targetVideoPath)
        copyToDirs(targetVideoPath, outDirs)
      }
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
      await rmPage.evaluate(async () => {
        document.querySelectorAll('nextjs-portal').forEach((el) => el.remove())
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }
      })

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
      await rmPage.waitForTimeout(4200)
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
      await rmPage
        .locator('[data-testid="live-logo-marquee"]')
        .first()
        .screenshot({ path: rmShotPath })
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
    try {
      fs.rmSync(videoTmpDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }

  const reportPayload = {
    baseUrl,
    styleSrcAttrViolationsCount: styleSrcAttrViolations.length,
    inlineStyleAttrConsoleErrorsCount: inlineStyleAttrConsoleErrors.length,
    pageErrorsCount: pageErrors.length,
    rawConsoleErrorsCount: rawConsoleErrors.length,
    rawCspViolationsCount: rawCspViolations.length,
    styleSrcAttrViolations,
    inlineStyleAttrConsoleErrors,
    pageErrors,
    rawCspViolations,
    motionVerification,
  }

  const jsonPath = path.join(evidenceDir, 'motion-and-a11y-checks.json')
  fs.writeFileSync(jsonPath, JSON.stringify(reportPayload, null, 2), 'utf8')
  copyToDirs(jsonPath, outDirs)

  const logLines = [
    headerBlock.trimEnd(),
    `BaseURL: ${baseUrl}`,
    `StyleSrcAttrViolations (unfiltered): ${String(styleSrcAttrViolations.length)}`,
    `InlineStyleAttrConsoleErrors (unfiltered): ${String(inlineStyleAttrConsoleErrors.length)}`,
    `PageErrors (unfiltered): ${String(pageErrors.length)}`,
    `RawDevHmrCspEvents (recorded transparently): ${String(rawCspViolations.length)}`,
    '',
    '=== Normal Motion, Dimensions & Interactive Checks (EN) ===',
    JSON.stringify(motionVerification.en, null, 2),
    '',
    '=== Normal Motion, Dimensions & Interactive Checks (AR / RTL) ===',
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

  if (
    styleSrcAttrViolations.length > 0 ||
    inlineStyleAttrConsoleErrors.length > 0 ||
    pageErrors.length > 0
  ) {
    throw new Error(
      `Inline style / page errors detected during P3-T3 evidence capture: ${JSON.stringify({
        styleSrcAttrViolations,
        inlineStyleAttrConsoleErrors,
        pageErrors,
      })}`,
    )
  }
}

const args = process.argv.slice(2)
const baseUrl = args[0] || 'http://localhost:3126'
const evidenceDir =
  args[1] || path.resolve(process.cwd(), 'docs', 'reports', 'evidence', 'P3-T3', 'r3')
const phase3Dir =
  args[2] || path.resolve(process.cwd(), 'docs', 'reports', 'phase-3', 'P3-T3', 'r3')

runP3T3Evidence(baseUrl, evidenceDir, phase3Dir).catch((err) => {
  process.stderr.write(
    `[p3-t3-evidence] ERROR: ${err instanceof Error ? err.stack : String(err)}\n`,
  )
  process.exit(1)
})
