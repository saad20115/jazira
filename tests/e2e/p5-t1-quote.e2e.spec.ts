import { expect, type Page, test } from '@playwright/test'

import { ensureE2EAdminToken } from './global-setup'

/**
 * P5-T1 — the real quote handler through the real form on a running build.
 * Each test sends its own `X-Real-IP` (what Nginx sets in production), so the rate-limit buckets
 * of different tests never mix; within a test the bucket is shared on purpose.
 */
const MIN_FILL_WAIT_MS = 3_500

async function fillQuoteForm(page: Page, email: string): Promise<void> {
  await page.goto('/en/contact', { waitUntil: 'networkidle' })
  await page.locator('[data-quote-next="step-1"]').click()
  await expect(page.locator('[data-quote-step="2"]')).toBeVisible()
  await page.locator('#quote-name').fill('P5T1 E2E Visitor')
  await page.locator('#quote-company').fill('P5T1 E2E Company')
  await page.locator('#quote-phone').fill('57 353 4185')
  await page.locator('#quote-email').fill(email)
  await page.locator('[data-quote-next="step-2"]').click()
  await expect(page.locator('[data-quote-step="3"]')).toBeVisible()
  await page.locator('#quote-consent').check()
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

test.describe('P5-T1 — quote form saves through the server handler (I6, Z4)', () => {
  test.setTimeout(120_000)

  let baseURL = 'http://localhost:3000'
  let token = ''

  test.beforeAll(async () => {
    baseURL = (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
    token = await ensureE2EAdminToken(baseURL)
  })

  test('a real visitor submission is saved as new/pending and the success dialog opens', async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.101' })
    const email = `p5t1-ok-${String(Date.now())}@example.test`
    await fillQuoteForm(page, email)
    await page.waitForTimeout(MIN_FILL_WAIT_MS)
    await page.locator('[data-quote-submit]').click()
    await expect(page.locator('[data-component="message-sent-dialog"]')).toBeVisible()

    const docs = await findQuotes(baseURL, token, email)
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({
      status: 'new',
      emailStatus: 'pending',
      phone: '+966573534185',
      locale: 'en',
      consent: true,
    })
    expect(typeof docs[0]?.projectType).toBe('string')
    expect(Array.isArray(docs[0]?.servicesNeeded)).toBe(true)
  })

  test('a form sent in under 3 seconds shows the failure dialog and saves nothing', async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.102' })
    const email = `p5t1-fast-${String(Date.now())}@example.test`
    await fillQuoteForm(page, email)
    await page.locator('[data-quote-submit]').click()
    const failed = page.locator('[data-component="message-failed-dialog"]')
    await expect(failed).toBeVisible()
    await expect(failed).toHaveAttribute('data-form-error', 'invalid')
    await expect(failed).toHaveAttribute('role', 'alertdialog')
    await expect(page.locator('[data-modal-close]')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(failed).toHaveCount(0)
    expect(await findQuotes(baseURL, token, email)).toHaveLength(0)
  })

  test('a filled honeypot looks like success to the bot but saves nothing', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.103' })
    const email = `p5t1-bot-${String(Date.now())}@example.test`
    await fillQuoteForm(page, email)
    await page.locator('#quote-company-website').fill('http://spam.example', { force: true })
    await page.waitForTimeout(MIN_FILL_WAIT_MS)
    await page.locator('[data-quote-submit]').click()
    await expect(page.locator('[data-component="message-sent-dialog"]')).toBeVisible()
    expect(await findQuotes(baseURL, token, email)).toHaveLength(0)
  })

  test('the 4th attempt from one IP within a minute is refused with the rate-limit message', async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.104' })
    const stamp = String(Date.now())
    for (let i = 1; i <= 3; i += 1) {
      await fillQuoteForm(page, `p5t1-rl-${stamp}-${String(i)}@example.test`)
      await page.waitForTimeout(MIN_FILL_WAIT_MS)
      await page.locator('[data-quote-submit]').click()
      await expect(page.locator('[data-component="message-sent-dialog"]')).toBeVisible()
    }
    const fourth = `p5t1-rl-${stamp}-4@example.test`
    await fillQuoteForm(page, fourth)
    await page.waitForTimeout(MIN_FILL_WAIT_MS)
    await page.locator('[data-quote-submit]').click()
    const failed = page.locator('[data-component="message-failed-dialog"]')
    await expect(failed).toBeVisible()
    await expect(failed).toHaveAttribute('data-form-error', 'rateLimited')
    expect(await findQuotes(baseURL, token, fourth)).toHaveLength(0)
  })

  test('REST cannot create a quote request or touch the rate-limit rows', async ({ request }) => {
    const body = { name: 'REST', email: 'rest@example.test', phone: '+966573534185', consent: true }
    expect((await request.post('/api/quote-requests', { data: body })).status()).toBe(403)
    expect(
      (
        await request.post('/api/quote-requests', {
          data: body,
          headers: { Authorization: `JWT ${token}` },
        })
      ).status(),
    ).toBe(403)
    expect(
      (
        await request.get('/api/quote-rate-limits', { headers: { Authorization: `JWT ${token}` } })
      ).status(),
    ).toBe(403)
  })
})
