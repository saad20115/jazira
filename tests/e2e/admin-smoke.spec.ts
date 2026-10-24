import fs from 'fs'
import path from 'path'
import { expect, test } from '@playwright/test'

const ADMIN_EMAIL = 'e2e-admin@aljazira.co'
const ADMIN_PASSWORD = 'Strong!AdminPassword#2026'

test.describe('Payload Admin Login Smoke (en LTR & ar RTL)', () => {
  test('renders /admin/login in English (LTR) by default and in Arabic (RTL) after switching language', async ({
    context,
    page,
    request,
  }) => {
    const outDir = path.resolve(process.cwd(), 'docs/reports/phase-1')
    fs.mkdirSync(outDir, { recursive: true })

    // Ensure the first admin user is registered so /admin/login renders the login screen
    const registerRes = await request.post('/api/users/first-register', {
      data: {
        name: 'أحمد المنصور',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    })
    expect([200, 201, 403]).toContain(registerRes.status())

    // Start with a clean unauthenticated browser context (no cookies)
    await context.clearCookies()

    // 1. Open /admin/login -> proxy sets payload-lng=en -> renders in English (LTR)
    await page.goto('/admin/login', { waitUntil: 'networkidle' })

    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'en')
    await expect(html).toHaveAttribute('dir', /^ltr$/i)

    // Verify English labels & submit button on the login screen
    await expect(page.locator('label', { hasText: 'Email' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Password' })).toBeVisible()
    await expect(page.getByRole('button', { name: /log\s*in/i })).toBeVisible()

    await page.screenshot({
      path: path.join(outDir, 'e2e-admin-login-en.png'),
      fullPage: true,
    })

    // 2. Log in, switch language to Arabic in /admin/account, log out, and verify /admin/login in Arabic (RTL)
    await page.locator('input[name="email"]').fill(ADMIN_EMAIL)
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /log\s*in/i }).click()
    await page.waitForURL((url) => url.pathname === '/admin' || url.pathname === '/admin/')

    await page.goto('/admin/account', { waitUntil: 'networkidle' })
    const langControl = page.locator('.payload-settings__language .rs__control')
    await expect(langControl).toBeVisible()
    await langControl.click()
    await page.locator('.rs__option', { hasText: 'العربية' }).click()

    await expect(html).toHaveAttribute('lang', 'ar', { timeout: 15_000 })
    await expect(html).toHaveAttribute('dir', /^rtl$/i)

    // Clear only the auth session cookie while preserving the user's payload-lng=ar preference
    const cookies = await context.cookies()
    const lngCookie = cookies.find((c) => c.name === 'payload-lng')
    expect(lngCookie?.value).toBe('ar')

    await context.clearCookies()
    if (lngCookie) {
      await context.addCookies([lngCookie])
    }

    await page.goto('/admin/login', { waitUntil: 'networkidle' })
    await expect(html).toHaveAttribute('lang', 'ar')
    await expect(html).toHaveAttribute('dir', /^rtl$/i)

    // Verify Arabic labels & submit button on the login screen
    await expect(page.locator('label', { hasText: 'البريد الإلكتروني' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'كلمة المرور' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'تسجيل الدخول' })).toBeVisible()

    await page.screenshot({
      path: path.join(outDir, 'e2e-admin-login-ar.png'),
      fullPage: true,
    })
  })
})
