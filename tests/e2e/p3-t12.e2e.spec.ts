import { expect, test } from '@playwright/test'

import { ensureE2EAdminToken, setArabicEnabledViaApi } from './global-setup'

test.describe('P3-T12 — English Default + Admin Arabic Switch E2E (R-1, R-3, R-5)', () => {
  let baseURL = 'http://localhost:3000'
  let adminToken = ''

  test.beforeAll(async () => {
    baseURL = (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
    adminToken = await ensureE2EAdminToken(baseURL)
  })

  test.afterAll(async () => {
    if (adminToken) {
      await setArabicEnabledViaApi(baseURL, adminToken, true)
    }
  })

  test('switch off redirects /ar -> 307 /en with no switcher and zero Arabic in 307/RSC bodies; admin toggle in /admin/globals/site-settings turns /ar live (200 RTL) with switcher', async ({
    browser,
    request,
  }) => {
    // 1. Start with arabicEnabled = false
    await setArabicEnabledViaApi(baseURL, adminToken, false)

    // Verify / -> 307 /en (`R-5`)
    const rootRes = await request.get('/', { maxRedirects: 0 })
    expect(rootRes.status()).toBe(307)
    expect(rootRes.headers()['location']).toBe('/en')

    // Verify /ar -> 307 /en and zero Arabic characters in the 307 HTML body and /ar?_rsc payload (`R-1`)
    const arRedirectRes = await request.get('/ar', { maxRedirects: 0 })
    expect(arRedirectRes.status()).toBe(307)
    expect(arRedirectRes.headers()['location']).toBe('/en')
    const arRedirectBody = await arRedirectRes.text()
    expect(/[\u0600-\u06FF]/.test(arRedirectBody)).toBe(false)

    const arRscRes = await request.get('/ar?_rsc=1', {
      maxRedirects: 0,
      headers: { RSC: '1' },
    })
    const arRscBody = await arRscRes.text()
    expect(/[\u0600-\u06FF]/.test(arRscBody)).toBe(false)

    // Anonymous browser visits /ar -> lands on /en with no language switcher in Navbar or Footer
    const anonContextOff = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await anonContextOff.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    })
    const anonPageOff = await anonContextOff.newPage()
    await anonPageOff.goto(`${baseURL}/ar`, { waitUntil: 'networkidle' })
    await expect(anonPageOff).toHaveURL(/\/en$/)
    await expect(anonPageOff.locator('html')).toHaveAttribute('lang', 'en')
    await expect(anonPageOff.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(
      anonPageOff.locator('header[data-component="navbar"] a[hreflang="ar"]'),
    ).toHaveCount(0)
    await expect(anonPageOff.locator('footer a[hreflang="ar"]')).toHaveCount(0)
    await anonContextOff.close()

    // 2. Admin toggles `arabicEnabled` ON via the Payload Admin UI at `/admin/globals/site-settings`
    const baseUrlObj = new URL(baseURL)
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await adminContext.addCookies([
      {
        name: 'payload-token',
        value: adminToken,
        domain: baseUrlObj.hostname,
        path: '/',
      },
      {
        name: 'payload-lng',
        value: 'en',
        domain: baseUrlObj.hostname,
        path: '/',
      },
    ])
    const adminPage = await adminContext.newPage()
    await adminPage.goto(`${baseURL}/admin/globals/site-settings`, { waitUntil: 'networkidle' })

    const arabicSwitchInput = adminPage.locator('#field-arabicEnabled')
    await arabicSwitchInput.waitFor({ state: 'attached', timeout: 15_000 })
    await expect(arabicSwitchInput).not.toBeChecked()

    await arabicSwitchInput.check({ force: true })
    await expect(arabicSwitchInput).toBeChecked()

    const savePromise = adminPage.waitForResponse(
      (res) =>
        res.url().includes('/api/globals/site-settings') &&
        (res.request().method() === 'POST' || res.request().method() === 'PATCH') &&
        res.ok(),
    )
    await adminPage.locator('#action-save').click()
    await savePromise
    await adminContext.close()

    // 3. Switch ON: anonymous browser visits /ar -> 200 OK RTL with language switcher visible
    const anonContextOn = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await anonContextOn.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    })
    const anonPageOn = await anonContextOn.newPage()
    const arLiveRes = await anonPageOn.goto(`${baseURL}/ar`, { waitUntil: 'networkidle' })
    expect(arLiveRes?.status()).toBe(200)
    await expect(anonPageOn.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(anonPageOn.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(
      anonPageOn.locator('header[data-component="navbar"] a[hreflang="en"]').first(),
    ).toBeVisible()

    // And on /en, the switcher to /ar is now visible
    await anonPageOn.goto(`${baseURL}/en`, { waitUntil: 'networkidle' })
    await expect(
      anonPageOn.locator('header[data-component="navbar"] a[hreflang="ar"]').first(),
    ).toBeVisible()
    await anonContextOn.close()
  })
})
