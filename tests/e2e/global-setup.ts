import type { FullConfig } from '@playwright/test'

const E2E_ADMIN_EMAIL = 'e2e-admin@aljazira.co'
const E2E_ADMIN_PASSWORD = 'Strong!AdminPassword#2026'

const CANDIDATE_ADMINS = [
  { email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD },
  { email: 'admin@aljazira.local', password: 'Passw0rd!StrongAdmin2026' },
  { email: 'p3-t12-evidence-admin@aljazira.co', password: E2E_ADMIN_PASSWORD },
]

export async function ensureE2EAdminToken(baseURL: string): Promise<string> {
  await fetch(`${baseURL}/api/users/first-register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'أحمد المنصور',
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
    }),
  }).catch(() => null)

  let token: string | null = null
  let loggedInEmail: string | null = null

  for (const cred of CANDIDATE_ADMINS) {
    const res = await fetch(`${baseURL}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cred),
    })
    if (res.ok) {
      const json = (await res.json()) as { token?: string }
      if (json.token) {
        token = json.token
        loggedInEmail = cred.email
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
          password: E2E_ADMIN_PASSWORD,
          role: 'admin',
        }),
      })
    }
  }

  return token
}

export async function setArabicEnabledViaApi(
  baseURL: string,
  token: string,
  arabicEnabled: boolean,
): Promise<void> {
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
      companyName: 'شركة الجزيرة للإمداد الذكي',
      tagline: 'حلول الكهروميكانيك والهندسة الذكية · الرياض، المملكة العربية السعودية',
      arabicEnabled,
      defaultSeo: {
        title: 'شركة الجزيرة للإمداد الذكي — مقاولات الكهروميكانيك والأنظمة الذكية',
        description:
          'مقاولات متكاملة في الأنظمة الكهروميكانيكية والتكييف ومكافحة الحريق والأنظمة الذكية في المملكة العربية السعودية.',
      },
    }),
  })
  if (!arRes.ok) {
    throw new Error(`Failed to update site-settings (ar): HTTP ${String(arRes.status)}`)
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = (
    config.projects[0]?.use?.baseURL ||
    process.env.SERVER_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '')

  const token = await ensureE2EAdminToken(baseURL)
  // Enable Arabic before existing /ar/* e2e suites (such as p3-t2.e2e.spec.ts) run (`R-3`)
  await setArabicEnabledViaApi(baseURL, token, true)
}
