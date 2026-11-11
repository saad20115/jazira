import { readFile } from 'node:fs/promises'

import { type Browser, expect, type Page, test } from '@playwright/test'

import { ensureE2EAdminToken } from './global-setup'

/**
 * P5-T2 — staff work a real request in the dashboard: the request comes in through the public form
 * (REST create is closed), then an admin moves it through the workflow in the edit view, uses the
 * "Mine" quick filter and downloads the CSV of the current filter.
 */
const MIN_FILL_WAIT_MS = 3_500

async function submitQuote(page: Page, email: string): Promise<void> {
  await page.goto('/en/contact', { waitUntil: 'networkidle' })
  await page.locator('[data-quote-next="step-1"]').click()
  await expect(page.locator('[data-quote-step="2"]')).toBeVisible()
  await page.locator('#quote-name').fill('P5T2 E2E Visitor')
  await page.locator('#quote-company').fill('P5T2 E2E Company')
  await page.locator('#quote-phone').fill('57 353 4185')
  await page.locator('#quote-email').fill(email)
  await page.locator('[data-quote-next="step-2"]').click()
  await expect(page.locator('[data-quote-step="3"]')).toBeVisible()
  await page.locator('#quote-consent').check()
  await page.waitForTimeout(MIN_FILL_WAIT_MS)
  await page.locator('[data-quote-submit]').click()
  await expect(page.locator('[data-component="message-sent-dialog"]')).toBeVisible()
}

async function findQuotes(
  baseURL: string,
  token: string,
  email: string,
): Promise<Array<Record<string, unknown>>> {
  const url = `${baseURL}/api/quote-requests?where[email][equals]=${encodeURIComponent(email)}&depth=0&limit=10`
  const response = await fetch(url, { headers: { Authorization: `JWT ${token}` } })
  expect(response.status).toBe(200)
  return ((await response.json()) as { docs: Array<Record<string, unknown>> }).docs
}

async function adminPage(browser: Browser, baseURL: string, token: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addCookies([
    {
      name: 'payload-token',
      value: token,
      domain: new URL(baseURL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  return context.newPage()
}

test.describe('P5-T2 — staff work a quote request in the dashboard', () => {
  test.setTimeout(180_000)

  let baseURL = 'http://localhost:3000'
  let token = ''

  test.beforeAll(async () => {
    baseURL = (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
    token = await ensureE2EAdminToken(baseURL)
  })

  test('an admin moves a request from new to contacted with a note; customer fields stay read-only', async ({
    browser,
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.121' })
    const email = `p5t2-flow-${String(Date.now())}@example.test`
    await submitQuote(page, email)
    const docs = await findQuotes(baseURL, token, email)
    expect(docs).toEqual([expect.objectContaining({ status: 'new' })])
    const id = docs.map((doc) => String(doc.id)).join('')

    const admin = await adminPage(browser, baseURL, token)
    await admin.goto(`${baseURL}/admin/collections/quote-requests/${id}`, {
      waitUntil: 'networkidle',
    })
    await expect(admin.locator('#field-email')).toBeDisabled()
    await expect(admin.locator('#field-name')).toBeDisabled()

    await admin.locator('#field-status').click()
    await admin.locator('.rs__option', { hasText: 'Contacted' }).click()
    await admin.locator('#field-internalNotes').fill('Called the client; quote to follow.')
    await admin.locator('#action-save').click()

    await expect
      .poll(async () => (await findQuotes(baseURL, token, email))[0]?.status, { timeout: 15_000 })
      .toBe('contacted')
    expect((await findQuotes(baseURL, token, email))[0]).toMatchObject({
      internalNotes: 'Called the client; quote to follow.',
      email,
    })
    await admin.context().close()
  })

  test('an admin uses the Mine filter and downloads the current filter as an Excel-ready CSV', async ({
    browser,
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.122' })
    const email = `p5t2-csv-${String(Date.now())}@example.test`
    await submitQuote(page, email)

    const admin = await adminPage(browser, baseURL, token)
    await admin.goto(`${baseURL}/admin/collections/quote-requests`, { waitUntil: 'networkidle' })
    await expect(admin.locator('[data-testid="quote-requests-filter-bar"]')).toBeVisible()

    const mine = admin.locator('[data-testid="quote-filter-mine"]')
    await expect(mine).toHaveAttribute('aria-pressed', 'false')
    await mine.click()
    await expect(mine).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => decodeURIComponent(admin.url())).toContain('where[assignedTo][equals]')
    await mine.click()
    await expect(mine).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => decodeURIComponent(admin.url())).not.toContain('[assignedTo][equals]')

    const exportLink = admin.locator('[data-testid="quote-export-csv"]')
    await expect(exportLink).toBeVisible()
    const href = await exportLink.getAttribute('href')
    expect(href).toContain('/api/quote-requests/export-csv')

    // Click it like a person does: the browser sends the same-origin request with the session cookie.
    const [download] = await Promise.all([admin.waitForEvent('download'), exportLink.click()])
    expect(download.suggestedFilename()).toMatch(/^quote-requests-.*\.csv$/)
    const bytes = await readFile(await download.path())
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const text = bytes.subarray(3).toString('utf8')
    expect(text.split('\r\n')[0]).toContain('Request ID')
    expect(text).toContain(email)
    expect(text).not.toContain('ipHash')
    await admin.context().close()
  })
})
