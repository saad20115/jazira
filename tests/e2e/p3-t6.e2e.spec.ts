import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { ensureE2EAdminToken } from './global-setup'

function readPayloadSecret(): string {
  if (process.env.PAYLOAD_SECRET) {
    return process.env.PAYLOAD_SECRET
  }
  const envPath = path.resolve(process.cwd(), '.env')
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith('PAYLOAD_SECRET='))
  const value = line?.slice(line.indexOf('=') + 1).trim()
  if (!value) {
    throw new Error('P3-T6 e2e: PAYLOAD_SECRET is not available to build the preview secret')
  }
  return value
}

function previewSecret(): string {
  return crypto
    .createHmac('sha256', readPayloadSecret())
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

test.describe('P3-T6 — Services Page, Service Detail, PageHeader & ApprovedMaterialsTable E2E', () => {
  test('returns 404 for unknown or draft-only service slugs when anonymous', async ({ page }) => {
    const draftNotFoundRes = await page.goto('/en/services/general-contracting')
    expect(draftNotFoundRes?.status()).toBe(404)

    const unknownNotFoundRes = await page.goto('/en/services/non-existent-service-slug-xyz')
    expect(unknownNotFoundRes?.status()).toBe(404)
  })

  test('renders /en/services, /ar/services, and /en/services/[slug] with 73 materials, keyboard-accessible tablist, search filter, and responsive mobile cards', async ({
    page,
    baseURL,
  }) => {
    const resolvedBase = (baseURL ?? 'http://localhost:3000').replace(/\/+$/, '')
    const token = await ensureE2EAdminToken(resolvedBase)
    const secret = previewSecret()

    const pageErrors: string[] = []
    const cspViolations: string[] = []

    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })
    await page.exposeFunction('__recordP3T6CspViolation', (uri: string) => {
      if (uri !== 'eval' && uri !== 'inline') {
        cspViolations.push(uri)
      }
    })
    await page.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
      window.addEventListener('securitypolicyviolation', (e) => {
        const fn = (window as unknown as { __recordP3T6CspViolation?: (u: string) => void })
          .__recordP3T6CspViolation
        if (fn) fn(e.blockedURI || e.violatedDirective)
      })
    })

    // Enable staff preview mode so the full P4-T2 drafted services-page and 10 services render
    await page.context().addCookies([
      {
        name: 'payload-token',
        value: token,
        url: resolvedBase,
      },
    ])

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(
      `/api/preview?secret=${encodeURIComponent(secret)}&locale=en&global=services-page`,
      { waitUntil: 'networkidle' },
    )
    await expect(page).toHaveURL(/\/en\/services$/)

    // 1. PageHeader h1 & breadcrumbs
    await expect(page.locator('h1')).toContainText('Our Services')
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbNav).toBeVisible()
    await expect(breadcrumbNav.locator('[aria-current="page"]')).toBeVisible()

    // 2. Main services alternating rows with anchor IDs
    await expect(page.locator('article#general-contracting')).toBeVisible()
    await expect(page.locator('article#mep-works')).toBeVisible()

    // 3. ApprovedMaterialsTable: semantic table with 73 rows sorted by itemNo
    const table = page.locator('table')
    await expect(table).toBeVisible()
    await expect(table.locator('caption')).toHaveCount(1)
    await expect(table.locator('thead th[scope="col"]')).toHaveCount(4)

    const allRows = table.locator('tbody tr')
    await expect(allRows).toHaveCount(73)
    await expect(allRows.first().locator('td').first()).toHaveText('01')
    await expect(allRows.last().locator('td').first()).toHaveText('73')

    // 4. WAI-ARIA tablist filtering + keyboard ArrowRight/ArrowLeft navigation
    const tablist = page.locator('[role="tablist"]')
    const tabs = tablist.locator('[role="tab"]')
    await expect(tabs).toHaveCount(5)
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')

    await tabs.nth(1).click() // Electrical
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    const electricalCount = await allRows.count()
    expect(electricalCount).toBeGreaterThan(0)
    expect(electricalCount).toBeLessThan(73)

    // Keyboard navigation from Electrical -> Mechanical via ArrowRight
    await tabs.nth(1).focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(2)).toBeFocused()

    // Reset back to All systems via "View all 73 items" button
    await page.getByRole('button', { name: /View all 73 items/i }).click()
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(allRows).toHaveCount(73)

    // 5. Search input filtering
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('3M')
    const filteredByBrandCount = await allRows.count()
    expect(filteredByBrandCount).toBeGreaterThan(0)
    expect(filteredByBrandCount).toBeLessThan(73)
    await searchInput.fill('')
    await expect(allRows).toHaveCount(73)

    // 6. Mobile viewport (390px): stacked cards, zero horizontal overflow
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(table).toBeHidden()
    const hasOverflowEn = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(hasOverflowEn).toBe(false)

    // 7. Arabic RTL (/ar/services) at 1440px and 390px
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/ar/services', { waitUntil: 'networkidle' })
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('table tbody tr')).toHaveCount(73)

    await page.setViewportSize({ width: 390, height: 844 })
    const hasOverflowAr = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(hasOverflowAr).toBe(false)

    // 8. Service Detail page (/en/services/mep-works)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/services/mep-works', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toContainText('MEP Works')

    expect(pageErrors).toEqual([])
    expect(cspViolations).toEqual([])
  })
})
