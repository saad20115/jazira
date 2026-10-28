/**
 * P3-T14 acceptance recordings (`handoff/tasks/P3-T14.md` § Acceptance, `docs/05-design.md` §20).
 *
 * Usage (run against a server that serves the commit under review, e.g. `next start` in a fresh clone):
 *   RECORD_ADMIN_EMAIL=... RECORD_ADMIN_PASSWORD=... \
 *   node scripts/record/p3-t14-motion-recordings.mjs <baseUrl> <outDir>
 *
 * - No credentials live in this file: the caller passes them in the environment.
 * - The Home page global is a draft (P4-T2 seed), so pages open through the staff draft preview
 *   (`/api/preview`, HMAC secret derived from PAYLOAD_SECRET exactly like `src/lib/preview.ts`).
 * - Every recording is a real Playwright `recordVideo` webm. Nothing is edited after capture.
 * - The Arabic recording turns `site-settings.arabicEnabled` on and always restores the original value.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'

const [, , baseUrlArg, outDirArg] = process.argv
if (!baseUrlArg || !outDirArg) {
  throw new Error('Usage: node scripts/record/p3-t14-motion-recordings.mjs <baseUrl> <outDir>')
}
const BASE_URL = baseUrlArg.replace(/\/+$/, '')
const OUT_DIR = path.resolve(outDirArg)
const ADMIN_EMAIL = process.env.RECORD_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.RECORD_ADMIN_PASSWORD
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('RECORD_ADMIN_EMAIL and RECORD_ADMIN_PASSWORD must be set')
}

function readPayloadSecret() {
  if (process.env.PAYLOAD_SECRET) {
    return process.env.PAYLOAD_SECRET
  }
  const line = fs
    .readFileSync(path.resolve(process.cwd(), '.env'), 'utf8')
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith('PAYLOAD_SECRET='))
  const value = line?.slice(line.indexOf('=') + 1).trim()
  if (!value) {
    throw new Error('PAYLOAD_SECRET is not available')
  }
  return value
}

const PREVIEW_SECRET = crypto
  .createHmac('sha256', readPayloadSecret())
  .update('aljazira-live-preview-secret-v1')
  .digest('hex')

async function adminToken() {
  await fetch(`${BASE_URL}/api/users/first-register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Recording Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  }).catch(() => null)
  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const json = await res.json()
  if (!json.token) {
    throw new Error(`Login failed with HTTP ${String(res.status)}`)
  }
  return json.token
}

async function setArabicEnabled(token, value) {
  const res = await fetch(`${BASE_URL}/api/globals/site-settings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify({ arabicEnabled: value }),
  })
  if (!res.ok) {
    throw new Error(`site-settings update failed with HTTP ${String(res.status)}`)
  }
}

async function readArabicEnabled(token) {
  const res = await fetch(`${BASE_URL}/api/globals/site-settings?depth=0`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const json = await res.json()
  return Boolean(json.arabicEnabled)
}

async function recordingContext(browser, token, { viewport, reducedMotion, skipIntro = true }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: reducedMotion ?? 'no-preference',
    recordVideo: { dir: OUT_DIR, size: viewport },
  })
  await context.addCookies([
    {
      name: 'payload-token',
      value: token,
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  if (skipIntro) {
    await context.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    })
  }
  return context
}

async function openHome(page, locale) {
  await page.goto(
    `${BASE_URL}/api/preview?secret=${PREVIEW_SECRET}&locale=${locale}&path=${encodeURIComponent('/')}`,
    { waitUntil: 'networkidle' },
  )
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

async function slowScroll(page, stepPx, pauseMs) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= total; y += stepPx) {
    await page.mouse.wheel(0, stepPx)
    await page.waitForTimeout(pauseMs)
  }
  await page.waitForTimeout(1200)
}

async function finish(context, page, fileName) {
  const video = page.video()
  await context.close()
  if (!video) {
    throw new Error(`No video recorded for ${fileName}`)
  }
  const target = path.join(OUT_DIR, fileName)
  await video.saveAs(target)
  await video.delete()
  const bytes = fs.statSync(target).size
  process.stdout.write(`[p3-t14-recordings] ${fileName} ${String(bytes)} bytes\n`)
}

async function recordScroll(
  browser,
  token,
  { fileName, locale, viewport, reducedMotion, skipIntro },
) {
  const context = await recordingContext(browser, token, { viewport, reducedMotion, skipIntro })
  const page = await context.newPage()
  await openHome(page, locale)
  await page.waitForTimeout(skipIntro === false ? 2600 : 800)
  await slowScroll(page, viewport.width < 768 ? 240 : 320, 260)
  await finish(context, page, fileName)
}

async function hoverAndHold(page, selector, holdMs = 1100) {
  const target = page.locator(selector).first()
  if ((await target.count()) === 0) {
    process.stdout.write(`[p3-t14-recordings] hover target not found: ${selector}\n`)
    return
  }
  await target.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const box = await target.boundingBox()
  if (!box) {
    return
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 })
  await page.waitForTimeout(holdMs)
  await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 12 })
  await page.waitForTimeout(500)
}

async function recordHovers(browser, token) {
  const viewport = { width: 1440, height: 900 }
  const context = await recordingContext(browser, token, { viewport })
  const page = await context.newPage()
  await openHome(page, 'en')
  await page.waitForTimeout(800)
  await hoverAndHold(
    page,
    '[data-home-section="hero"] [data-component="button"][data-button-variant="Gold"]',
  )
  await hoverAndHold(
    page,
    '[data-home-section="hero"] [data-component="button"][data-button-variant="Glass"]',
  )
  await hoverAndHold(page, 'header [data-component="nav-link"]')
  await hoverAndHold(page, '[data-component="service-tile"][data-state="Default"]')
  await hoverAndHold(page, '[data-component="project-card"]')
  await hoverAndHold(page, '[data-component="brand-tile"]')
  await hoverAndHold(page, 'footer a[href]')
  await finish(context, page, 'hover-en-1440.webm')
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const token = await adminToken()
  const browser = await chromium.launch()
  try {
    await recordScroll(browser, token, {
      fileName: 'home-en-1440-scroll.webm',
      locale: 'en',
      viewport: { width: 1440, height: 900 },
    })
    await recordScroll(browser, token, {
      fileName: 'home-en-390-scroll.webm',
      locale: 'en',
      viewport: { width: 390, height: 844 },
    })
    await recordScroll(browser, token, {
      fileName: 'home-en-1440-first-visit-with-intro.webm',
      locale: 'en',
      viewport: { width: 1440, height: 900 },
      skipIntro: false,
    })
    await recordScroll(browser, token, {
      fileName: 'home-en-1440-reduced-motion.webm',
      locale: 'en',
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    await recordHovers(browser, token)

    const originalArabic = await readArabicEnabled(token)
    try {
      await setArabicEnabled(token, true)
      await recordScroll(browser, token, {
        fileName: 'home-ar-1440-scroll.webm',
        locale: 'ar',
        viewport: { width: 1440, height: 900 },
      })
    } finally {
      await setArabicEnabled(token, originalArabic)
    }
  } finally {
    await browser.close()
  }
}

await main()
