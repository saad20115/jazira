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
/** H3b (CTO decision 2026-10-25, `handoff/reviews/P3-T5.md`): the KTX2 worker's own and only CSP. */
const WORKER_CSP =
  "default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'"

interface Recorder {
  /** Same-origin `/systems/` requests other than the release stills (method + path). */
  model: string[]
  cspViolations: string[]
  warnings: string[]
  /** Every Content-Security-Policy header of each GET response for the worker script. */
  workerGetCsp: string[][]
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
  const recorder: Recorder = { model: [], cspViolations: [], warnings: [], workerGetCsp: [] }
  page.on('response', (response) => {
    if (response.request().method() === 'GET' && new URL(response.url()).pathname === WORKER_PATH) {
      void response.headersArray().then((headers) => {
        recorder.workerGetCsp.push(
          headers
            .filter((h) => h.name.toLowerCase() === 'content-security-policy')
            .map((h) => h.value),
        )
      })
    }
  })
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

/** The still card is interactive once hydrated: it is focusable then (O-2 start triggers). */
async function waitHydrated(card: Locator): Promise<void> {
  await expect(card).toHaveAttribute('tabindex', '0')
}

/** O-2: a click on the image starts the model (and, on a mouse, activates it once live). */
async function clickImage(card: Locator): Promise<void> {
  await waitHydrated(card)
  const box = await card.boundingBox()
  expect(box).not.toBeNull()
  await card.click({ position: { x: (box?.width ?? 0) / 2, y: (box?.height ?? 0) / 2 } })
}

async function goLive(card: Locator): Promise<void> {
  await clickImage(card)
  await expect(card).toHaveAttribute('data-viewer-state', 'live', { timeout: LIVE_TIMEOUT })
}

function rows(page: Page): Locator {
  return page.locator('[data-component="accordion-item"]')
}

function rowHeader(row: Locator): Locator {
  return row.locator(':scope > button')
}

/** The system a row shows (the row must be expanded). */
async function systemOfRow(row: Locator): Promise<string> {
  const value = await row.locator('[data-row-system]').getAttribute('data-row-system')
  expect(value).not.toBeNull()
  return value ?? ''
}

/** O-3: the controls the owner removed are nowhere on the page. */
async function expectRemovedControlsAbsent(page: Page): Promise<void> {
  await expect(page.locator('[data-show-in-3d]')).toHaveCount(0)
  await expect(page.locator('[data-done]')).toHaveCount(0)
  for (const name of ['Show in 3D', 'Zoom in', 'Zoom out', 'Done']) {
    await expect(
      page.locator('#interactive-systems').getByRole('button', { name, exact: true }),
    ).toHaveCount(0)
  }
}

/**
 * O-6: every visible hotspot dot in `layer` is the topmost element at its own centre, so a tap on it
 * reaches it (no other dot or tap area covers it). Returns the accessible names checked.
 */
async function expectEveryDotTappable(layer: Locator): Promise<string[]> {
  const dots = layer.locator('li button').filter({ visible: true })
  await expect(dots.first()).toBeVisible({ timeout: 15_000 })
  const names: string[] = []
  const count = await dots.count()
  for (let i = 0; i < count; i += 1) {
    const dot = dots.nth(i)
    const name = (await dot.getAttribute('aria-label')) ?? ''
    const onTop = await dot.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el
    })
    expect(onTop, `the "${name}" dot is covered`).toBe(true)
    names.push(name)
  }
  return names
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

  test('@smoke image first: the Figma image paints, hover changes nothing, a click starts', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page)
    // O-1: the Figma image through Next image optimisation, not a release still.
    const poster = card.locator('img').first()
    await expect(poster).toBeVisible()
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.complete)).toBe(true)
    expect(await poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    const src = await poster.evaluate((img: HTMLImageElement) => img.currentSrc)
    expect(src).toContain('/_next/image?url=')
    expect(src).toContain('tower-render')
    expect(src).not.toContain('/stills/')
    // O-3 at rest: the badge and "Open the live 3D model", as in Figma; no removed control.
    await expect(card.locator('[data-open-3d-model]')).toBeVisible()
    await expect(card.locator(':scope > [class*="liveModelBadge"]')).toBeVisible()
    await expect(card.locator('[data-reset-view]')).toHaveCount(0)
    await expectRemovedControlsAbsent(page)
    await page.waitForTimeout(2_000)
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
    expect(recorder.model).toEqual([])
    expect(await wheelScrolls(page, card)).toBeGreaterThan(0)

    // O-2: hover never swaps (it may only fetch the viewer code).
    await card.hover()
    await page.waitForTimeout(1_500)
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
    expect(recorder.model).toEqual([])

    await clickImage(card)
    await expect(card).not.toHaveAttribute('data-viewer-state', 'still')
  })

  test('reduced motion keeps the stills tier: no 3D download; a system shows its end still and labels', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const recorder = record(page)
    const card = await openHome(page)
    await clickImage(card)
    await expect(card).toHaveAttribute('data-viewer-state', 'stills')
    await expect(card).toHaveAttribute('data-viewer-fallback', 'device')
    // One click on the pre-expanded first header enters it (O-2).
    const first = rows(page).first()
    await rowHeader(first).click()
    const system = await systemOfRow(first)
    await expect(card).toHaveAttribute('data-entered', system)
    await expect(first).toHaveAttribute('data-accordion-state', 'Expanded')
    await expect(page).toHaveURL(new RegExp(`#systems-${system}$`))
    const layer = card.locator(`[data-entered-system="${system}"]`)
    await expect(layer).toBeVisible()
    await expect(layer.locator('li button').filter({ visible: true }).first()).toBeVisible()
    expect(recorder.model).toEqual([])

    // Another hash later (an in-page link) exits the system; a system hash enters again.
    await page.evaluate(() => {
      window.location.hash = 'stats'
    })
    await expect(card).toHaveAttribute('data-entered', 'none')
    await page.evaluate(() => {
      window.location.hash = 'systems-fire'
    })
    await expect(card).toHaveAttribute('data-entered', 'fire')
  })

  test('a #systems hash on load enters that system without starting the model', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page, '#systems-fire')
    await expect(card).toHaveAttribute('data-entered', 'fire')
    await expect(card.locator('[data-entered-system="fire"]')).toBeVisible()
    await expect(card.locator('[data-exit-system]')).toBeVisible()
    await expect(card.locator('[data-open-3d-model]')).toHaveCount(0)
    await page.waitForTimeout(1_500)
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
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
      await clickImage(card)
      await expect(card).toHaveAttribute('data-viewer-state', 'stills', { timeout: LIVE_TIMEOUT })
      await expect(card).toHaveAttribute('data-viewer-fallback', 'worker-policy')
      expect(workerMethods).toEqual(['HEAD'])
      expect(recorder.warnings).toEqual([
        '[systems3d] KTX2 worker policy check failed; staying on the still images',
      ])
    })
  }

  test('@gpu @smoke live: mouse — a click cross-fades to the model with the CSP intact; one header click enters', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page)
    await expectHardwareGpu(page)
    const sizeBefore = await card.boundingBox()
    await goLive(card)
    // O-4: a soft cross-fade, and the card size does not change.
    const fade = await card
      .locator('canvas')
      .evaluate((el) => getComputedStyle(el).transitionDuration)
    expect(fade).toBe('0.5s')
    const sizeAfter = await card.boundingBox()
    expect([sizeAfter?.width, sizeAfter?.height]).toEqual([sizeBefore?.width, sizeBefore?.height])
    expect(recorder.model).toEqual(
      expect.arrayContaining([`HEAD ${WORKER_PATH}`, `GET ${WORKER_PATH}`]),
    )
    // C3-3 (CTO 2c): the GET the Worker itself makes carries exactly the H3b policy, once.
    await expect.poll(() => recorder.workerGetCsp.length).toBeGreaterThan(0)
    for (const policies of recorder.workerGetCsp) {
      expect(policies).toEqual([WORKER_CSP])
    }
    await expect(card).toHaveAttribute('data-entered', 'none')
    // O-3 live, overview: one "reset view"; the badge and the open button are gone.
    await expect(card.locator('[data-reset-view]')).toHaveCount(1)
    await expect(card.locator('[data-open-3d-model]')).toHaveCount(0)
    await expect(card.locator(':scope > [class*="liveModelBadge"]')).toHaveCount(0)
    await expect(card.locator('button').filter({ visible: true })).toHaveCount(1)
    await expectRemovedControlsAbsent(page)

    // The pre-expanded first row enters with one header click, and exits from the card.
    const first = rows(page).first()
    await rowHeader(first).click()
    const firstSystem = await systemOfRow(first)
    await expect(card).toHaveAttribute('data-entered', firstSystem)
    await expect(first).toHaveAttribute('data-accordion-state', 'Expanded')
    await expect(
      card.locator('[data-live-labels] li button').filter({ visible: true }).first(),
    ).toBeVisible({
      timeout: 15_000,
    })
    // Inside a system: "Exit system" and "reset view".
    await expect(card.locator('[data-exit-system]')).toHaveCount(1)
    await expect(card.locator('[data-reset-view]')).toHaveCount(1)
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

  test('@gpu live: a system card click on the still card starts the model in that system', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page)
    await expectHardwareGpu(page)
    const row = rows(page).nth(1)
    await rowHeader(row).click()
    const system = await systemOfRow(row)
    await expect(card).toHaveAttribute('data-entered', system)
    await expect(card).toHaveAttribute('data-viewer-state', 'live', { timeout: LIVE_TIMEOUT })
    await expect(
      card.locator('[data-live-labels] li button').filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 15_000 })
    expect(recorder.model.some((entry) => entry.endsWith('.glb'))).toBe(true)
    // A start from a system card leaves the page wheel alone.
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
  })

  test('@gpu live: the page scroll is never trapped — the wheel zooms only while the card is active', async ({
    page,
  }) => {
    const card = await openHome(page)
    await expectHardwareGpu(page)
    // A click on the image starts the model and takes the wheel once it is live.
    await goLive(card)
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    expect(await wheelScrolls(page, card)).toBe(0)
    await page.keyboard.press('Escape')
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
    expect(await wheelScrolls(page, card)).toBeGreaterThan(0)
    await card.click()
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    expect(await wheelScrolls(page, card)).toBe(0)
    await page.locator('h1, h2').first().click()
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
  })

  test('@gpu live: keyboard — Enter starts, digits enter systems, Escape exits then deactivates', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page)
    await expectHardwareGpu(page)
    // Focus alone starts nothing (O-2); Enter on the focused card does. The card is focusable once
    // hydrated (its keyboard handlers exist only then).
    await waitHydrated(card)
    await card.focus()
    await expect(card).toBeFocused()
    await page.waitForTimeout(1_000)
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
    expect(recorder.model).toEqual([])
    await page.keyboard.press('Enter')
    await expect(card).toHaveAttribute('data-viewer-state', 'live', { timeout: LIVE_TIMEOUT })
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    await expect(card).toBeFocused()
    const scrollBefore = await page.evaluate(() => window.scrollY)
    for (const key of ['ArrowLeft', 'ArrowUp', '+', '-', '0']) {
      await page.keyboard.press(key)
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)

    // Each digit enters its row's system (labels show once the flight lands); Escape exits it.
    const count = await rows(page).count()
    expect(count).toBe(5)
    for (let i = 0; i < count; i += 1) {
      await page.keyboard.press(String(i + 1))
      const system = await systemOfRow(rows(page).nth(i))
      await expect(card).toHaveAttribute('data-entered', system)
      await expect(card).toBeFocused()
      await expect(
        card.locator('[data-live-labels] li button').filter({ visible: true }).first(),
      ).toBeVisible({ timeout: 15_000 })
      await page.keyboard.press('Escape')
      await expect(card).toHaveAttribute('data-entered', 'none')
      await expect(card.locator('[data-live-labels] li')).toHaveCount(0, { timeout: 15_000 })
      await expect(card).toHaveAttribute('data-viewer-active', 'true')
    }
    await page.keyboard.press('Escape')
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
  })

  test('@gpu live: a #systems hash enters on load, and a lost context falls back to stills keeping it', async ({
    page,
  }) => {
    const card = await openHome(page, '#systems-fire')
    await expectHardwareGpu(page)
    await expect(card).toHaveAttribute('data-entered', 'fire')
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
    await goLive(card)
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

  test('@gpu live: a high-performance GPU name (set by the test) gets the full model, enters and exits', async ({
    page,
    context,
    browser,
  }) => {
    // The real GPU is checked in a context without the name override below.
    const probe = await browser.newContext()
    try {
      await expectHardwareGpu(await probe.newPage())
    } finally {
      await probe.close()
    }
    // Device hint from outside the code under test: the renderer name the tier rules read.
    await context.addInitScript(() => {
      const UNMASKED_RENDERER_WEBGL = 0x9246
      for (const proto of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
        const original = Reflect.get(proto, 'getParameter') as (name: GLenum) => unknown
        proto.getParameter = function (this: WebGLRenderingContext, name: GLenum): unknown {
          return name === UNMASKED_RENDERER_WEBGL
            ? 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)'
            : Reflect.apply(original, this, [name])
        }
      }
    })
    const recorder = record(page)
    const card = await openHome(page)
    await goLive(card)
    await expect(card).toHaveAttribute('data-viewer-tier', 'full')
    expect(recorder.model).toContain('GET /systems/v022n/tower.glb')
    expect(recorder.model).not.toContain('GET /systems/v022n/tower-lite.glb')

    await card.focus()
    await page.keyboard.press('1')
    const system = await systemOfRow(rows(page).first())
    await expect(card).toHaveAttribute('data-entered', system)
    await expect(
      card.locator('[data-live-labels] li button').filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 15_000 })
    await page.keyboard.press('Escape')
    await expect(card).toHaveAttribute('data-entered', 'none')
    await expect(card.locator('[data-live-labels] li')).toHaveCount(0, { timeout: 15_000 })
    await expect(card).toHaveAttribute('data-viewer-state', 'live')
    if (PRODUCTION_SERVER) {
      expect(recorder.cspViolations).toEqual([])
    }
  })

  test('@gpu live: under 6× CPU throttling the card ends in the low or stills tier', async ({
    page,
    context,
  }) => {
    const card = await openHome(page)
    await expectHardwareGpu(page)
    await goLive(card)
    const tierNow = async (): Promise<string | null> =>
      (await card.getAttribute('data-viewer-state')) === 'stills'
        ? 'stills'
        : card.getAttribute('data-viewer-tier')
    expect(await tierNow()).toMatch(/^(lite|full)$/)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    try {
      await card.click()
      await expect(card).toHaveAttribute('data-viewer-active', 'true')
      const box = await card.boundingBox()
      expect(box).not.toBeNull()
      const x = (box?.x ?? 0) + (box?.width ?? 0) / 2
      const y = (box?.y ?? 0) + (box?.height ?? 0) / 2
      // Keep the canvas animating (drag-orbit back and forth) while the rolling FPS check runs.
      await expect
        .poll(
          async () => {
            await page.mouse.move(x, y)
            await page.mouse.down()
            for (let i = 1; i <= 20; i += 1) {
              await page.mouse.move(x + (i % 10 < 5 ? i * 6 : 60 - i * 3), y)
            }
            await page.mouse.up()
            return tierNow()
          },
          { timeout: 60_000, intervals: [0] },
        )
        .toMatch(/^(low|stills)$/)
      if ((await tierNow()) === 'stills') {
        await expect(card).toHaveAttribute('data-viewer-fallback', 'too-slow')
        await expect(card.locator('img').first()).toBeVisible()
      }
    } finally {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    }
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
      await clickImage(card)
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
      await clickImage(card)
      await expect(card).toHaveAttribute('data-viewer-state', 'stills', {
        timeout: LIVE_TIMEOUT,
      })
      await expect(card).toHaveAttribute('data-viewer-fallback', /^(software|too-slow)$/)
      await expect(card.locator('canvas')).toHaveCount(0)
      await expect(card.locator('img').first()).toBeVisible()
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

  test('O-6: every Fire dot of the still can be tapped at 390 px, and a tap downloads nothing', async ({
    page,
  }) => {
    const recorder = record(page)
    const card = await openHome(page, '#systems-fire')
    await expect(card).toHaveAttribute('data-entered', 'fire')
    await card.scrollIntoViewIfNeeded()
    const layer = card.locator('[data-entered-system="fire"]')
    const names = await expectEveryDotTappable(layer)
    expect(names).toEqual(expect.arrayContaining(['Fire pumps', 'Jockey pump']))
    for (const name of ['Fire pumps', 'Jockey pump']) {
      const dot = layer.getByRole('button', { name, exact: true })
      await dot.tap({ timeout: 10_000 })
      await expect(dot).toHaveAttribute('aria-expanded', 'true')
    }
    // Buttons inside the still card (dots, Exit system) never start the model (§8c).
    await card.locator('[data-exit-system]').tap({ timeout: 10_000 })
    await expect(card).toHaveAttribute('data-entered', 'none')
    await page.waitForTimeout(1_000)
    await expect(card).toHaveAttribute('data-viewer-state', 'still')
    expect(recorder.model).toEqual([])
  })

  test('@gpu live: touch — a tap on the image opens, headers enter, dots can be tapped, scroll is trapped only while active', async ({
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
    // O-2: a tap on the image starts the model; on touch it does not take the page scroll yet.
    await waitHydrated(card)
    const box = await card.boundingBox()
    await page.touchscreen.tap(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    )
    await expect(card).toHaveAttribute('data-viewer-state', 'live', { timeout: LIVE_TIMEOUT })
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
    expect(await swipeScrolls()).toBeGreaterThan(0)

    await page.touchscreen.tap((box?.x ?? 0) + 40, (box?.y ?? 0) + 60)
    await expect(card).toHaveAttribute('data-viewer-active', 'true')
    expect(await swipeScrolls()).toBe(0)
    // No Done button (O-3): a tap outside the card hands the scroll back.
    await expectRemovedControlsAbsent(page)
    await page.locator('h1, h2').first().tap({ timeout: 10_000 })
    await expect(card).toHaveAttribute('data-viewer-active', 'false')
    await card.scrollIntoViewIfNeeded()
    expect(await swipeScrolls()).toBeGreaterThan(0)

    // Every system by touch: one tap on its header enters it (the pre-expanded first row too), a
    // second tap on the same header exits.
    const count = await rows(page).count()
    expect(count).toBe(5)
    for (let i = 0; i < count; i += 1) {
      const row = rows(page).nth(i)
      await rowHeader(row).tap({ timeout: 10_000 })
      const system = await systemOfRow(row)
      await expect(card).toHaveAttribute('data-entered', system)
      await expect(page.locator('[data-related-panel="card"]')).toBeHidden()
      // On phones the accordion is below the card: the viewer renders only while the card is on
      // screen, so scroll back to it as a visitor would.
      await card.scrollIntoViewIfNeeded()
      const labels = card.locator('[data-live-labels]')
      const dot = labels.locator('li button').filter({ visible: true }).first()
      await expect(dot).toBeVisible({ timeout: 15_000 })
      // O-6: no dot is covered by another (Fire: the pumps and the jockey pump).
      await page.waitForTimeout(500)
      await expectEveryDotTappable(labels)
      if (i === 2) {
        await dot.tap({ timeout: 10_000 })
        await expect(card.locator('[data-live-labels] li[data-expanded="true"]')).toHaveCount(1)
      }
      await rowHeader(row).tap({ timeout: 10_000 })
      await expect(card).toHaveAttribute('data-entered', 'none')
      await card.scrollIntoViewIfNeeded()
      await expect(card.locator('[data-live-labels] li')).toHaveCount(0, { timeout: 15_000 })
    }
  })
})
