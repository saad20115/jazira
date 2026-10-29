import { type BrowserContext, expect, type Locator, type Page, test } from '@playwright/test'

/**
 * P3-T5 — the live 3D tower in the home "Interactive systems" card.
 *
 * `@gpu` tests need a live canvas on a hardware GPU and run only in the `gpu` project
 * (`E2E_GPU=1 playwright test --project=gpu`); they fail, never skip, when the GPU is not usable.
 * Every other test runs in the default project, CI included: there, a software renderer must end in
 * the stills tier with the reason `software`. On Windows the GPU is used through ANGLE D3D11.
 *
 * `E2E_PRODUCTION_SERVER=1` (a `next start` or standalone server) also asserts that the page load
 * itself is free of CSP violations; the dev server injects inline styles of its own.
 */

const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render|^none$/i

test.use({ launchOptions: { args: GPU_ARGS } })

const PRODUCTION_SERVER = process.env.E2E_PRODUCTION_SERVER === '1'
const WORKER_PATH = '/systems/v022n/basis/ktx2-worker.js'
const LIVE_TIMEOUT = 60_000

interface Recorder {
  /** Same-origin `/systems/` requests other than the release stills (method + path). */
  model: string[]
  cspViolations: string[]
  warnings: string[]
}

/** Skips the intro splash (a returning visit) and pins capable-device hints, so the 3D path runs. */
async function prepare(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    } catch {
      // about:blank has no storage; the next navigation sets it.
    }
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(
        `[csp-violation] ${event.effectiveDirective} ${event.blockedURI} ${event.sourceFile}`,
      )
    })
  })
}

function record(page: Page): Recorder {
  const recorder: Recorder = { model: [], cspViolations: [], warnings: [] }
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/systems/') && !url.pathname.includes('/stills/')) {
      recorder.model.push(`${request.method()} ${url.pathname}`)
    }
  })
  page.on('console', (message) => {
    const text = message.text()
    if (text.startsWith('[csp-violation]') || text.includes('Content Security Policy')) {
      recorder.cspViolations.push(text)
    }
    if (text.startsWith('[systems3d]')) {
      recorder.warnings.push(text)
    }
  })
  return recorder
}

async function openHome(page: Page, hash = ''): Promise<Locator> {
  await page.goto(`/en${hash}`)
  await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
  const card = page.locator('[data-interactive-3d-card]')
  await card.scrollIntoViewIfNeeded()
  return card
}

async function rendererName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) {
      return 'none'
    }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown'
  })
}

/** `@gpu` tests: a software or missing renderer is a failure of the run, not a skip. */
async function expectHardwareGpu(page: Page): Promise<void> {
  const renderer = await rendererName(page)
  expect(renderer, 'the gpu project needs a hardware WebGL renderer').not.toMatch(SOFTWARE_RENDERER)
}

async function goLive(page: Page, card: Locator): Promise<void> {
  await card.hover()
  await expect(card).toHaveAttribute('data-viewer-state', 'live', { timeout: LIVE_TIMEOUT })
}

function rows(page: Page): Locator {
  return page.locator('[data-component="accordion-item"]')
}

function rowHeader(row: Locator): Locator {
  return row.locator(':scope > button')
}

/** The system a row shows, read from its "Show in 3D" button (the row must be expanded). */
async function systemOfRow(row: Locator): Promise<string> {
  const value = await row.locator('[data-show-in-3d]').getAttribute('data-show-in-3d')
  expect(value).not.toBeNull()
  return value ?? ''
}

async function wheelScrolls(page: Page, card: Locator): Promise<number> {
  const box = await card.boundingBox()
  expect(box).not.toBeNull()
  if (!box) {
    return 0
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  const before = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 200)
  await page.waitForTimeout(400)
  const after = await page.evaluate(() => window.scrollY)
  await page.evaluate((y) => {
    window.scrollTo(0, y)
  }, before)
  await page.waitForTimeout(100)
  return after - before
}

test.describe('P3-T5 live 3D card', () => {
  test.setTimeout(120_000)

  test.beforeEach(async ({ context }) => {
    await prepare(context)
  })

  test('@smoke still first: the release still paints and no 3D asset loads before intent', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page)
    const poster = card.locator('picture img').first()
    await expect(poster).toBeVisible()
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.complete)).toBe(true)
    expect(await poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await page.waitForTimeout(2_000)
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
    expect(recorder.model).toEqual([])
    expect(await wheelScrolls(page, card)).toBeGreaterThan(0)

    await card.hover()
    await expect(card).not.toHaveAttribute('data-viewer-state', 'still')
  })

  test('reduced motion keeps the stills tier: no 3D download; a system shows its end still and labels', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const recorder = record(page)
    const card = await openHome(page)
    await card.hover()
    await expect(card).toHaveAttribute('data-viewer-state', 'stills')
    await expect(card).toHaveAttribute('data-viewer-fallback', 'device')
    await page.locator('[data-show-in-3d]').first().click()
    const system = await systemOfRow(rows(page).first())
    await expect(card).toHaveAttribute('data-entered', system)
    await expect(page).toHaveURL(new RegExp(`#systems-${system}$`))
    const layer = card.locator(`[data-entered-system="${system}"]`)
    await expect(layer).toBeVisible()
    await expect(layer.locator('li button').filter({ visible: true }).first()).toBeVisible()
    expect(recorder.model).toEqual([])
  })

  for (const variant of ['missing', 'different'] as const) {
    test(`@gpu C3-3: a ${variant} worker CSP fails closed to stills before any worker starts`, async ({
      page,
    }) => {
      const workerMethods: string[] = []
      await page.route(`**${WORKER_PATH}`, async (route) => {
        workerMethods.push(route.request().method())
        const response = await route.fetch()
        const headers = { ...response.headers() }
        if (variant === 'missing') {
          delete headers['content-security-policy']
        } else {
          headers['content-security-policy'] = "default-src 'none'; script-src *"
        }
        await route.fulfill({ response, headers })
      })
      const recorder = record(page)
      const card = await openHome(page)
      await expectHardwareGpu(page)
      await card.hover()
      await expect(card).toHaveAttribute('data-viewer-state', 'stills', { timeout: LIVE_TIMEOUT })
      await expect(card).toHaveAttribute('data-viewer-fallback', 'worker-policy')
      expect(workerMethods).toEqual(['HEAD'])
      expect(recorder.warnings).toEqual([
        '[systems3d] KTX2 worker policy check failed; staying on the still images',
      ])
    })
  }

  test('@gpu @smoke live: mouse — hover goes live with the CSP intact; rows enter and exit systems', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page)
    await expectHardwareGpu(page)
    await goLive(page, card)
    expect(recorder.model).toEqual(
      expect.arrayContaining([`HEAD ${WORKER_PATH}`, `GET ${WORKER_PATH}`]),
    )
    await expect(card).toHaveAttribute('data-entered', 'none')

    // The pre-expanded first row enters through its "Show in 3D" button, and exits from the card.
    const first = rows(page).first()
    await first.locator('[data-show-in-3d]').click()
    const firstSystem = await systemOfRow(first)
    await expect(card).toHaveAttribute('data-entered', firstSystem)
    await expect(first.locator('[data-show-in-3d]')).toHaveAttribute('aria-pressed', 'true')
    await expect(
      card.locator('[data-live-labels] li button').filter({ visible: true }).first(),
    ).toBeVisible({
      timeout: 15_000,
    })
    await card.locator('[data-exit-system]').click()
    await expect(card).toHaveAttribute('data-entered', 'none')
    expect(new URL(page.url()).hash).toBe('')

    // Opening a collapsed row enters its system; collapsing it exits. Focus stays on the header.
    const count = await rows(page).count()
    for (let i = 1; i < count; i += 1) {
      const row = rows(page).nth(i)
      const header = rowHeader(row)
      await header.click()
      const system = await systemOfRow(row)
      await expect(card).toHaveAttribute('data-entered', system)
      await expect(page).toHaveURL(new RegExp(`#systems-${system}$`))
      await expect(header).toBeFocused()
      await expect(
        card.locator('[data-live-labels] li button').filter({ visible: true }).first(),
      ).toBeVisible({
        timeout: 15_000,
      })
      await expect(card).toHaveAttribute('data-viewer-state', 'live')
      await header.click()
      await expect(card).toHaveAttribute('data-entered', 'none')
    }

    if (PRODUCTION_SERVER) {
      expect(recorder.cspViolations).toEqual([])
    }
  })

  test('@gpu live: the page scroll is never trapped — the wheel zooms only while the card is active', async ({
    page,
  }) => {
    const card = await openHome(page)
    await expectHardwareGpu(page)
    await goLive(page, card)
    expect(await wheelScrolls(page, card)).toBeGreaterThan(0)
    await card.click()
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    expect(await wheelScrolls(page, card)).toBe(0)
    await page.keyboard.press('Escape')
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
    expect(await wheelScrolls(page, card)).toBeGreaterThan(0)
    await card.click()
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    await page.locator('h1, h2').first().click()
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
  })

  test('@gpu live: keyboard — focus activates, digits enter systems, Escape exits then deactivates', async ({
    page,
  }) => {
    const card = await openHome(page)
    await expectHardwareGpu(page)
    await goLive(page, card)
    await card.focus()
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    const scrollBefore = await page.evaluate(() => window.scrollY)
    for (const key of ['ArrowLeft', 'ArrowUp', '+', '-', '0']) {
      await page.keyboard.press(key)
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)

    await page.keyboard.press('2')
    const system = await systemOfRow(rows(page).nth(1))
    await expect(card).toHaveAttribute('data-entered', system)
    await expect(card).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(card).toHaveAttribute('data-entered', 'none')
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    await page.keyboard.press('Escape')
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
  })

  test('@gpu live: a #systems hash enters on load, and a lost context falls back to stills keeping it', async ({
    page,
  }) => {
    const card = await openHome(page, '#systems-fire')
    await expectHardwareGpu(page)
    await expect(card).toHaveAttribute('data-entered', 'fire')
    await goLive(page, card)
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-interactive-3d-card] canvas')
      const gl = canvas instanceof HTMLCanvasElement ? canvas.getContext('webgl2') : null
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    })
    await expect(card).toHaveAttribute('data-viewer-state', 'stills')
    await expect(card).toHaveAttribute('data-viewer-fallback', 'context-lost')
    await expect(card).toHaveAttribute('data-entered', 'fire')
    await expect(card.locator('[data-entered-system="fire"]')).toBeVisible()
    expect(new URL(page.url()).hash).toBe('#systems-fire')
  })
})

test.describe('P3-T5 live 3D card — WebGL disabled', () => {
  test.setTimeout(120_000)

  // Launch options are per worker, so this test starts its own browser with WebGL switched off.
  test('a browser without WebGL falls back to the stills tier', async ({
    playwright,
    channel,
    baseURL,
  }) => {
    const browser = await playwright.chromium.launch({
      ...(channel ? { channel } : {}),
      args: [...GPU_ARGS, '--disable-webgl', '--disable-webgl2'],
    })
    try {
      const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
      await prepare(context)
      const page = await context.newPage()
      const card = await openHome(page)
      expect(await rendererName(page)).toBe('none')
      await card.hover()
      await expect(card).toHaveAttribute('data-viewer-state', 'stills', {
        timeout: LIVE_TIMEOUT,
      })
      await expect(card).toHaveAttribute('data-viewer-fallback', 'no-webgl')
      await expect(card.locator('canvas')).toHaveCount(0)
    } finally {
      await browser.close()
    }
  })
})

test.describe('P3-T5 live 3D card — software renderer', () => {
  test.setTimeout(120_000)

  // CI's renderer; forced here so the test means the same on every machine.
  test('a software WebGL renderer ends in the stills tier, without a canvas or a 3D download', async ({
    playwright,
    channel,
    baseURL,
  }) => {
    const browser = await playwright.chromium.launch({
      ...(channel ? { channel } : {}),
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    })
    try {
      const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
      await prepare(context)
      const page = await context.newPage()
      const recorder = record(page)
      const card = await openHome(page)
      expect(await rendererName(page)).toMatch(/swiftshader/i)
      await card.hover()
      await expect(card).toHaveAttribute('data-viewer-state', 'stills', {
        timeout: LIVE_TIMEOUT,
      })
      await expect(card).toHaveAttribute('data-viewer-fallback', /^(software|too-slow)$/)
      await expect(card.locator('canvas')).toHaveCount(0)
      await expect(card.locator('picture img').first()).toBeVisible()
      expect(recorder.model.filter((entry) => entry.endsWith('.glb'))).toEqual([])
    } finally {
      await browser.close()
    }
  })
})

test.describe('P3-T5 live 3D card — phone', () => {
  test.setTimeout(120_000)
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test.beforeEach(async ({ context }) => {
    await prepare(context)
  })

  test('@gpu live: touch — tap opens, rows enter, dots expand their label, scroll is trapped only while active', async ({
    page,
    context,
  }) => {
    const card = await openHome(page)
    await expectHardwareGpu(page)
    const cdp = await context.newCDPSession(page)
    // A one-finger upward swipe over the card centre; the finger rests before lifting (no fling,
    // which would swallow the next tap).
    const swipeScrolls = async (): Promise<number> => {
      const box = await card.boundingBox()
      expect(box).not.toBeNull()
      const x = Math.round((box?.x ?? 0) + (box?.width ?? 0) / 2)
      const y = Math.round((box?.y ?? 0) + (box?.height ?? 0) / 2)
      const before = await page.evaluate(() => window.scrollY)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let i = 1; i <= 10; i += 1) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y - i * 25 }],
        })
        await page.waitForTimeout(16)
      }
      await page.waitForTimeout(150)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await page.waitForTimeout(500)
      const after = await page.evaluate(() => window.scrollY)
      await page.evaluate((top) => {
        window.scrollTo(0, top)
      }, before)
      await page.waitForTimeout(150)
      return after - before
    }

    await test.step('still card: the page scrolls', async () => {
      expect(await swipeScrolls()).toBeGreaterThan(0)
    })
    await page.locator('[data-open-3d-model]').tap({ timeout: 10_000 })
    await expect(card).toHaveAttribute('data-viewer-state', 'live', { timeout: LIVE_TIMEOUT })
    expect(await swipeScrolls()).toBeGreaterThan(0)

    const box = await card.boundingBox()
    await page.touchscreen.tap((box?.x ?? 0) + 40, (box?.y ?? 0) + 40)
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    expect(await swipeScrolls()).toBe(0)
    await page.locator('[data-done]').tap({ timeout: 10_000 })
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
    expect(await swipeScrolls()).toBeGreaterThan(0)

    const row = rows(page).nth(2)
    await rowHeader(row).tap({ timeout: 10_000 })
    const system = await systemOfRow(row)
    await expect(card).toHaveAttribute('data-entered', system)
    await expect(page.locator('[data-related-panel="card"]')).toBeHidden()
    // On phones the accordion is below the card: the viewer renders only while the card is on
    // screen, so scroll back to it as a visitor would.
    await card.scrollIntoViewIfNeeded()
    const dot = card.locator('[data-live-labels] li button').filter({ visible: true }).first()
    await expect(dot).toBeVisible({ timeout: 15_000 })
    await dot.tap({ timeout: 10_000 })
    await expect(card.locator('[data-live-labels] li[data-expanded="true"]')).toHaveCount(1)
  })
})
