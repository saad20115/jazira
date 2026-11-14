/**
 * P3-T14 acceptance recordings (`handoff/tasks/P3-T14.md` § Acceptance, `docs/05-design.md` §20).
 *
 * Usage (run against a server that serves the commit under review on a test/e2e database):
 *   E2E_DATABASE_URL=... DATABASE_URL=... RECORD_ADMIN_EMAIL=... RECORD_ADMIN_PASSWORD=... \
 *   node scripts/record/p3-t14-motion-recordings.mjs <baseUrl> <outDir>
 *
 * - No credentials live in this file: the caller passes them in the environment.
 * - Enforces the same loopback host and test-database guard (`_test`, `_e2e`, or `_run_*`) as Playwright E2E setup (R1-4).
 * - The Home page global is a draft (P4-T2 seed), so pages open through the staff draft preview
 *   (`/api/preview`, HMAC secret derived from PAYLOAD_SECRET exactly like `src/lib/preview.ts`).
 * - Every recording is a real Playwright `recordVideo` webm. Nothing is edited after capture.
 * - The Arabic recording turns `site-settings.arabicEnabled` on and always restores the original value.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { chromium } from '@playwright/test'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

function readDotEnvKey(keyName) {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (!fs.existsSync(envPath)) {
      return undefined
    }
    const content = fs.readFileSync(envPath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) {
        continue
      }
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) {
        continue
      }
      const key = line.slice(0, eqIdx).trim()
      const val = line.slice(eqIdx + 1).trim()
      if (key === keyName && val) {
        return val
      }
    }
  } catch {
    return undefined
  }
  return undefined
}

export function assertSafeRecordingTarget(baseUrl, rawEnv = process.env) {
  let parsedBase
  try {
    parsedBase = new URL(baseUrl)
  } catch {
    throw new Error(`Recording safety guard: invalid baseUrl "${String(baseUrl)}".`)
  }
  const baseHost = parsedBase.hostname.trim().toLowerCase()
  if (!LOOPBACK_HOSTS.has(baseHost)) {
    throw new Error(
      `Recording safety guard: refusing to run against non-loopback host "${baseHost}". Target must be a loopback host (localhost, 127.0.0.1, ::1).`,
    )
  }

  const e2eDbUrl = rawEnv.E2E_DATABASE_URL?.trim()
  if (!e2eDbUrl) {
    throw new Error(
      'Recording safety guard: E2E_DATABASE_URL must be explicitly set (no fallback to TEST_DATABASE_URL) and must equal the server DATABASE_URL ending in _test, _e2e, or _run_*.',
    )
  }

  const serverDbUrl = rawEnv.DATABASE_URL?.trim() || readDotEnvKey('DATABASE_URL')
  if (!serverDbUrl || e2eDbUrl !== serverDbUrl) {
    throw new Error(
      'Recording safety guard: E2E_DATABASE_URL must equal the DATABASE_URL the server under test is started with (ending in _test, _e2e, or _run_*).',
    )
  }

  let parsedDb
  try {
    parsedDb = new URL(e2eDbUrl)
  } catch {
    throw new Error('Recording safety guard: E2E_DATABASE_URL is not a valid URI.')
  }

  const dbHost = parsedDb.hostname.trim().toLowerCase()
  const dbName = decodeURIComponent(parsedDb.pathname.replace(/^\/+/, '')).trim()

  if (!LOOPBACK_HOSTS.has(dbHost)) {
    throw new Error(
      `Recording safety guard: refusing to run against non-loopback database host "${dbHost}".`,
    )
  }
  if (!/_(test|e2e|run_[a-z0-9_]+)$/i.test(dbName)) {
    throw new Error(
      `Recording safety guard: refusing to run against database "${dbName}". Target DB name must end in _test (or be a per-run DB).`,
    )
  }

  return e2eDbUrl
}

async function verifyServerUsesTestDatabase(baseUrl, rawEnv = process.env) {
  const targetDbUrl = assertSafeRecordingTarget(baseUrl, rawEnv)
  const parsedDb = new URL(targetDbUrl)
  const dbName = decodeURIComponent(parsedDb.pathname.replace(/^\/+/, '')).trim()

  const localRequire = createRequire(import.meta.url)
  const pgRequire = createRequire(localRequire.resolve('@payloadcms/db-postgres'))
  const { Client } = pgRequire('pg')
  const client = new Client({ connectionString: targetDbUrl })

  await client.connect()
  try {
    const regRes = await client.query(
      "SELECT to_regclass('public.site_settings') AS settings_reg, to_regclass('public.site_settings_locales') AS locales_reg",
    )
    if (!regRes.rows[0]?.settings_reg || !regRes.rows[0]?.locales_reg) {
      throw new Error(
        `Recording safety guard: test database "${dbName}" has no site_settings tables, so the server at "${baseUrl}" is not connected to "${dbName}".`,
      )
    }

    const probeTagline = `__record_db_probe_${crypto.randomUUID()}__`
    const parentRes = await client.query('SELECT id FROM site_settings ORDER BY id ASC LIMIT 1')
    let parentId = parentRes.rows[0]?.id
    let insertedParentId = null
    let insertedLocaleRowId = null
    let updatedLocaleRowId = null
    let previousTagline = null

    if (parentId === undefined) {
      const insParent = await client.query(
        "INSERT INTO site_settings (email, phone, whatsapp, updated_at, created_at) VALUES ('info@aljazira.co', '+966 57 353 4185', '966573534185', now(), now()) RETURNING id",
      )
      parentId = insParent.rows[0]?.id
      insertedParentId = parentId
    }

    const locRes = await client.query(
      "SELECT id, tagline FROM site_settings_locales WHERE _parent_id = $1 AND _locale = 'en' LIMIT 1",
      [parentId],
    )
    if (locRes.rows.length > 0) {
      updatedLocaleRowId = locRes.rows[0]?.id
      previousTagline = locRes.rows[0]?.tagline ?? null
      await client.query('UPDATE site_settings_locales SET tagline = $1 WHERE id = $2', [
        probeTagline,
        updatedLocaleRowId,
      ])
    } else {
      const insLoc = await client.query(
        "INSERT INTO site_settings_locales (company_name, tagline, _locale, _parent_id) VALUES ('Al Jazira for Imdad Smart Co.', $1, 'en', $2) RETURNING id",
        [probeTagline, parentId],
      )
      insertedLocaleRowId = insLoc.rows[0]?.id
    }

    let observedTagline = null
    try {
      const res = await fetch(`${baseUrl}/api/globals/site-settings?locale=en&depth=0`, {
        headers: { 'cache-control': 'no-store' },
      })
      const json = res.ok ? await res.json() : null
      observedTagline = json?.tagline ?? null
    } finally {
      if (updatedLocaleRowId !== null) {
        await client.query('UPDATE site_settings_locales SET tagline = $1 WHERE id = $2', [
          previousTagline,
          updatedLocaleRowId,
        ])
      }
      if (insertedLocaleRowId !== null) {
        await client.query('DELETE FROM site_settings_locales WHERE id = $1', [insertedLocaleRowId])
      }
      if (insertedParentId !== null) {
        await client.query('DELETE FROM site_settings WHERE id = $1', [insertedParentId])
      }
    }

    if (observedTagline !== probeTagline) {
      throw new Error(
        `Recording safety guard: server at "${baseUrl}" is not connected to test database "${dbName}". Refusing to call first-register or mutate globals.`,
      )
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

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

assertSafeRecordingTarget(BASE_URL)

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

async function resetRecordingTestUsers(baseUrl) {
  const targetDbUrl = assertSafeRecordingTarget(baseUrl)
  const client = createPgClient(targetDbUrl)
  await client.connect()
  try {
    await client.query('DELETE FROM users')
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function adminToken() {
  assertSafeRecordingTarget(BASE_URL)
  await verifyServerUsesTestDatabase(BASE_URL)

  const tryRegisterAndLogin = async () => {
    await fetch(`${BASE_URL}/api/users/first-register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Recording Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    }).catch(() => null)
    const res = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    })
    const json = await res.json().catch(() => ({}))
    return { status: res.status, token: json?.token ?? null }
  }

  let attempt = await tryRegisterAndLogin()
  if (!attempt.token) {
    await resetRecordingTestUsers(BASE_URL)
    attempt = await tryRegisterAndLogin()
  }
  if (!attempt.token) {
    throw new Error(`Login failed with HTTP ${String(attempt.status)}`)
  }
  return attempt.token
}

async function setArabicEnabled(token, value) {
  assertSafeRecordingTarget(BASE_URL)
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
  assertSafeRecordingTarget(BASE_URL)
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
