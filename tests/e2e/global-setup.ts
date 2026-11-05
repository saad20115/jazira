import fs from 'node:fs'
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
): void {
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

  const targetDbUrl =
    rawEnv.E2E_DATABASE_URL?.trim() ||
    rawEnv.TEST_DATABASE_URL?.trim() ||
    rawEnv.DATABASE_URL?.trim() ||
    readDotEnvKey('TEST_DATABASE_URL') ||
    readDotEnvKey('DATABASE_URL')

  if (!targetDbUrl) {
    throw new Error(
      'Playwright E2E safety guard: refusing to run because no TEST_DATABASE_URL / DATABASE_URL could be resolved.',
    )
  }

  let parsedDb: URL
  try {
    parsedDb = new URL(targetDbUrl)
  } catch {
    throw new Error('Playwright E2E safety guard: resolved database URL is not a valid URI.')
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
}

export async function ensureE2EAdminToken(baseURL: string): Promise<string> {
  assertSafeE2ETarget(baseURL)
  const adminPassword = requireE2EAdminPassword()

  await fetch(`${baseURL}/api/users/first-register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'أحمد المنصور',
      email: E2E_ADMIN_EMAIL,
      password: adminPassword,
    }),
  }).catch(() => null)

  const candidateEmails = [
    E2E_ADMIN_EMAIL,
    process.env.E2E_ADMIN_EMAIL?.trim(),
    'admin@aljazira.local',
    'p3-t12-evidence-admin@aljazira.co',
  ].filter((email): email is string => Boolean(email))

  let token: string | null = null
  let loggedInEmail: string | null = null

  for (const email of candidateEmails) {
    const res = await fetch(`${baseURL}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: adminPassword }),
    })
    if (res.ok) {
      const json = (await res.json()) as { token?: string }
      if (json.token) {
        token = json.token
        loggedInEmail = email
        break
      }
    }
  }

  if (!token) {
    throw new Error('Playwright globalSetup: could not authenticate an admin user')
  }

  // Ensure e2e-admin@aljazira.co exists for admin-smoke.spec.ts even if another admin was created first
  if (loggedInEmail !== E2E_ADMIN_EMAIL) {
    const checkRes = await fetch(
      `${baseURL}/api/users?where[email][equals]=${encodeURIComponent(E2E_ADMIN_EMAIL)}&limit=1`,
      {
        headers: { Authorization: `JWT ${token}` },
      },
    )
    const checkJson = checkRes.ok ? ((await checkRes.json()) as { docs?: unknown[] }) : { docs: [] }
    if (!checkJson.docs || checkJson.docs.length === 0) {
      await fetch(`${baseURL}/api/users`, {
        method: 'POST',
        headers: {
          Authorization: `JWT ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'أحمد المنصور',
          email: E2E_ADMIN_EMAIL,
          password: adminPassword,
          role: 'admin',
        }),
      })
    }
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
