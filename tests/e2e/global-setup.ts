import crypto from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { FullConfig } from '@playwright/test'

const E2E_ADMIN_EMAIL = 'e2e-admin@aljazira.co'
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

export interface SiteSettingsLocaleSnapshot {
  arabicEnabled?: boolean
  companyName?: string
  defaultSeo?: {
    description?: string
    title?: string
  }
  tagline?: string
}

export interface SiteSettingsFullSnapshot {
  ar: SiteSettingsLocaleSnapshot
  baseURL: string
  en: SiteSettingsLocaleSnapshot
}

interface PgQueryResult {
  rows: Array<Record<string, unknown>>
}

interface PgClientLike {
  connect(): Promise<void>
  end(): Promise<void>
  query(sql: string, values?: unknown[]): Promise<PgQueryResult>
}

let activeSiteSettingsSnapshot: SiteSettingsFullSnapshot | null = null

function readDotEnvKey(keyName: string): string | undefined {
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

function createPgClient(connectionString: string): PgClientLike {
  const localRequire = createRequire(import.meta.url)
  const dbPostgresEntry = localRequire.resolve('@payloadcms/db-postgres')
  const pgRequire = createRequire(dbPostgresEntry)
  const pgModule = pgRequire('pg') as {
    Client: new (opts: { connectionString: string }) => PgClientLike
  }
  return new pgModule.Client({ connectionString })
}

export function requireE2EAdminPassword(rawEnv: NodeJS.ProcessEnv = process.env): string {
  const pwd = rawEnv.E2E_ADMIN_PASSWORD?.trim()
  if (!pwd) {
    throw new Error(
      'E2E_ADMIN_PASSWORD must be set in the environment (no hardcoded default password is permitted).',
    )
  }
  return pwd
}

export function assertSafeE2ETarget(
  baseURL: string,
  rawEnv: NodeJS.ProcessEnv = process.env,
): string {
  let parsedBase: URL
  try {
    parsedBase = new URL(baseURL)
  } catch {
    throw new Error(`Playwright E2E safety guard: invalid baseURL "${baseURL}".`)
  }
  const baseHost = parsedBase.hostname.trim().toLowerCase()
  if (!LOOPBACK_HOSTS.has(baseHost)) {
    throw new Error(
      `Playwright E2E safety guard: refusing to run against non-loopback baseURL host "${baseHost}". Target must be a loopback host (localhost, 127.0.0.1, ::1).`,
    )
  }

  // R1-2: Require E2E_DATABASE_URL explicitly (no fallback to TEST_DATABASE_URL) and require it to equal the server DATABASE_URL.
  const e2eDbUrl = rawEnv.E2E_DATABASE_URL?.trim()
  if (!e2eDbUrl) {
    throw new Error(
      'Playwright E2E safety guard: E2E_DATABASE_URL must be explicitly set (no fallback to TEST_DATABASE_URL) and must equal the server DATABASE_URL ending in _test, _e2e, or _run_*.',
    )
  }

  const serverDbUrl = rawEnv.DATABASE_URL?.trim() || readDotEnvKey('DATABASE_URL')
  if (!serverDbUrl) {
    throw new Error(
      'Playwright E2E safety guard: DATABASE_URL must be set and must equal E2E_DATABASE_URL.',
    )
  }

  if (e2eDbUrl !== serverDbUrl) {
    throw new Error(
      'Playwright E2E safety guard: E2E_DATABASE_URL must equal the DATABASE_URL the server under test is started with (ending in _test, _e2e, or _run_*).',
    )
  }

  let parsedDb: URL
  try {
    parsedDb = new URL(e2eDbUrl)
  } catch {
    throw new Error('Playwright E2E safety guard: E2E_DATABASE_URL is not a valid URI.')
  }

  const dbHost = parsedDb.hostname.trim().toLowerCase()
  const dbName = decodeURIComponent(parsedDb.pathname.replace(/^\/+/, '')).trim()

  if (!LOOPBACK_HOSTS.has(dbHost)) {
    throw new Error(
      `Playwright E2E safety guard: refusing to run against non-loopback database host "${dbHost}".`,
    )
  }
  if (!/_(test|e2e|run_[a-z0-9_]+)$/i.test(dbName)) {
    throw new Error(
      `Playwright E2E safety guard: refusing to run against database "${dbName}". Target DB name must end in _test (or be a per-run DB).`,
    )
  }

  return e2eDbUrl
}

export async function verifyServerUsesE2EDatabase(
  baseURL: string,
  rawEnv: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const targetDbUrl = assertSafeE2ETarget(baseURL, rawEnv)

  // Skip live socket probe only in unit tests that mock globalThis.fetch
  if ('mock' in globalThis.fetch) {
    return
  }

  const parsedDb = new URL(targetDbUrl)
  const dbName = decodeURIComponent(parsedDb.pathname.replace(/^\/+/, '')).trim()
  const client = createPgClient(targetDbUrl)

  await client.connect()
  try {
    const regRes = await client.query(
      "SELECT to_regclass('public.site_settings') AS settings_reg, to_regclass('public.site_settings_locales') AS locales_reg",
    )
    const hasTables = Boolean(regRes.rows[0]?.settings_reg && regRes.rows[0]?.locales_reg)
    if (!hasTables) {
      throw new Error(
        `Playwright E2E safety guard: E2E test database "${dbName}" has no site_settings tables, so the server at "${baseURL}" is not connected to "${dbName}".`,
      )
    }

    const probeTagline = `__e2e_db_probe_${crypto.randomUUID()}__`
    const parentRes = await client.query('SELECT id FROM site_settings ORDER BY id ASC LIMIT 1')
    let parentId = parentRes.rows[0]?.id as number | undefined
    let insertedParentId: number | null = null
    let insertedLocaleRowId: number | null = null
    let updatedLocaleRowId: number | null = null
    let previousTagline: string | null = null

    if (parentId === undefined) {
      const insParent = await client.query(
        "INSERT INTO site_settings (email, phone, whatsapp, updated_at, created_at) VALUES ('info@aljazira.co', '+966 57 353 4185', '966573534185', now(), now()) RETURNING id",
      )
      parentId = insParent.rows[0]?.id as number
      insertedParentId = parentId
    }

    const locRes = await client.query(
      "SELECT id, tagline FROM site_settings_locales WHERE _parent_id = $1 AND _locale = 'en' LIMIT 1",
      [parentId],
    )
    if (locRes.rows.length > 0) {
      updatedLocaleRowId = locRes.rows[0]?.id as number
      previousTagline = (locRes.rows[0]?.tagline as string | null) ?? null
      await client.query('UPDATE site_settings_locales SET tagline = $1 WHERE id = $2', [
        probeTagline,
        updatedLocaleRowId,
      ])
    } else {
      const insLoc = await client.query(
        "INSERT INTO site_settings_locales (company_name, tagline, _locale, _parent_id) VALUES ('Al Jazira for Imdad Smart Co.', $1, 'en', $2) RETURNING id",
        [probeTagline, parentId],
      )
      insertedLocaleRowId = insLoc.rows[0]?.id as number
    }

    let observedTagline: string | null = null
    try {
      const res = await fetch(`${baseURL}/api/globals/site-settings?locale=en&depth=0`, {
        headers: { 'cache-control': 'no-store' },
      })
      const json = res.ok ? ((await res.json()) as { tagline?: string }) : null
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
        `Playwright E2E safety guard: server at "${baseURL}" is not connected to E2E test database "${dbName}" (server returned tagline "${String(observedTagline)}" instead of the probe written to "${dbName}"). Refusing to call first-register or mutate globals on a non-test database.`,
      )
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function resetE2ETestUsers(baseURL: string): Promise<void> {
  const targetDbUrl = assertSafeE2ETarget(baseURL)
  const client = createPgClient(targetDbUrl)
  await client.connect()
  try {
    await client.query('DELETE FROM users')
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function ensureE2EAdminToken(baseURL: string): Promise<string> {
  assertSafeE2ETarget(baseURL)
  const adminPassword = requireE2EAdminPassword()
  await verifyServerUsesE2EDatabase(baseURL)

  const adminEmail = process.env.E2E_ADMIN_EMAIL?.trim() || E2E_ADMIN_EMAIL

  const tryRegisterAndLogin = async (): Promise<string | null> => {
    await fetch(`${baseURL}/api/users/first-register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'أحمد المنصور',
        email: adminEmail,
        password: adminPassword,
      }),
    }).catch(() => null)

    // R1-3: Only authenticate against the E2E admin email (never try other accounts).
    const res = await fetch(`${baseURL}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    })

    if (res.ok) {
      const json = (await res.json()) as { token?: string }
      if (json.token) {
        return json.token
      }
    }
    return null
  }

  let token = await tryRegisterAndLogin()
  if (!token && !('mock' in globalThis.fetch)) {
    await resetE2ETestUsers(baseURL)
    token = await tryRegisterAndLogin()
  }

  if (!token) {
    throw new Error('Playwright globalSetup: could not authenticate an admin user')
  }

  return token
}

export async function snapshotSiteSettingsViaApi(
  baseURL: string,
  token: string,
): Promise<SiteSettingsFullSnapshot> {
  assertSafeE2ETarget(baseURL)
  const headers = { Authorization: `JWT ${token}` }

  const [enRes, arRes] = await Promise.all([
    fetch(`${baseURL}/api/globals/site-settings?locale=en&depth=0`, { headers }),
    fetch(`${baseURL}/api/globals/site-settings?locale=ar&depth=0`, { headers }),
  ])

  const enJson = enRes.ok ? ((await enRes.json()) as SiteSettingsLocaleSnapshot) : {}
  const arJson = arRes.ok ? ((await arRes.json()) as SiteSettingsLocaleSnapshot) : {}

  return {
    baseURL,
    en: {
      arabicEnabled: false,
      companyName: enJson.companyName ?? 'Al Jazira for Imdad Smart Co.',
      tagline: enJson.tagline ?? 'MEP & Smart Engineering Solutions · Riyadh, KSA',
      defaultSeo: {
        title:
          enJson.defaultSeo?.title ?? 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering',
        description:
          enJson.defaultSeo?.description ??
          'Integrated electromechanical, HVAC, firefighting, and smart engineering contracting in Saudi Arabia.',
      },
    },
    ar: {
      arabicEnabled: false,
      companyName: arJson.companyName ?? 'شركة الجزيرة الإمداد الذكي',
      tagline:
        arJson.tagline ?? 'حلول الكهروميكانيك والهندسة الذكية · الرياض، المملكة العربية السعودية',
      defaultSeo: {
        title:
          arJson.defaultSeo?.title ??
          'شركة الجزيرة الإمداد الذكي — مقاولات الكهروميكانيك والأنظمة الذكية',
        description:
          arJson.defaultSeo?.description ??
          'مقاولات متكاملة في الأنظمة الكهروميكانيكية والتكييف ومكافحة الحريق والأنظمة الذكية في المملكة العربية السعودية.',
      },
    },
  }
}

export async function restoreSiteSettingsViaApi(
  snapshot: SiteSettingsFullSnapshot,
  token: string,
): Promise<void> {
  assertSafeE2ETarget(snapshot.baseURL)
  const headers = {
    Authorization: `JWT ${token}`,
    'content-type': 'application/json',
  }

  const arRes = await fetch(`${snapshot.baseURL}/api/globals/site-settings?locale=ar`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      companyName: snapshot.ar.companyName,
      tagline: snapshot.ar.tagline,
      arabicEnabled: false,
      defaultSeo: snapshot.ar.defaultSeo,
    }),
  })
  if (!arRes.ok) {
    throw new Error(`Failed to restore site-settings (ar): HTTP ${String(arRes.status)}`)
  }

  const enRes = await fetch(`${snapshot.baseURL}/api/globals/site-settings?locale=en`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      companyName: snapshot.en.companyName,
      tagline: snapshot.en.tagline,
      arabicEnabled: false,
      defaultSeo: snapshot.en.defaultSeo,
    }),
  })
  if (!enRes.ok) {
    throw new Error(`Failed to restore site-settings (en): HTTP ${String(enRes.status)}`)
  }
}

export async function setArabicEnabledViaApi(
  baseURL: string,
  token: string,
  arabicEnabled: boolean,
): Promise<void> {
  assertSafeE2ETarget(baseURL)
  const headers = {
    Authorization: `JWT ${token}`,
    'content-type': 'application/json',
  }

  const enRes = await fetch(`${baseURL}/api/globals/site-settings?locale=en`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      companyName: 'Al Jazira for Imdad Smart Co.',
      tagline: 'MEP & Smart Engineering Solutions · Riyadh, KSA',
      arabicEnabled,
      defaultSeo: {
        title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering',
        description:
          'Integrated electromechanical, HVAC, firefighting, and smart engineering contracting in Saudi Arabia.',
      },
    }),
  })
  if (!enRes.ok) {
    throw new Error(`Failed to update site-settings (en): HTTP ${String(enRes.status)}`)
  }

  const arRes = await fetch(`${baseURL}/api/globals/site-settings?locale=ar`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      companyName: 'شركة الجزيرة الإمداد الذكي',
      tagline: 'حلول الكهروميكانيك والهندسة الذكية · الرياض، المملكة العربية السعودية',
      arabicEnabled,
      defaultSeo: {
        title: 'شركة الجزيرة الإمداد الذكي — مقاولات الكهروميكانيك والأنظمة الذكية',
        description:
          'مقاولات متكاملة في الأنظمة الكهروميكانيكية والتكييف ومكافحة الحريق والأنظمة الذكية في المملكة العربية السعودية.',
      },
    }),
  })
  if (!arRes.ok) {
    throw new Error(`Failed to update site-settings (ar): HTTP ${String(arRes.status)}`)
  }
}

export async function globalTeardown(): Promise<void> {
  if (!activeSiteSettingsSnapshot) {
    return
  }
  const snapshot = activeSiteSettingsSnapshot
  activeSiteSettingsSnapshot = null
  const token = await ensureE2EAdminToken(snapshot.baseURL)
  await restoreSiteSettingsViaApi(snapshot, token)
}

export default async function globalSetup(config: FullConfig): Promise<() => Promise<void>> {
  const baseURL = (
    config.projects[0]?.use?.baseURL ||
    process.env.SERVER_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '')

  assertSafeE2ETarget(baseURL)
  const token = await ensureE2EAdminToken(baseURL)
  activeSiteSettingsSnapshot = await snapshotSiteSettingsViaApi(baseURL, token)

  // Enable Arabic before existing /ar/* e2e suites (such as p3-t2.e2e.spec.ts) run (`R-3`),
  // and return a globalTeardown callback so Playwright restores snapshotted site-settings (arabicEnabled: false) after the run.
  await setArabicEnabledViaApi(baseURL, token, true)

  return async () => {
    await globalTeardown()
  }
}
