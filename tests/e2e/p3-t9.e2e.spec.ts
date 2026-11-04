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
    throw new Error('P3-T9 e2e: PAYLOAD_SECRET is not available to build the preview secret')
  }
  return value
}

function previewSecret(): string {
  return crypto
    .createHmac('sha256', readPayloadSecret())
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

test.describe('P3-T9 — Contact Page, 3-Step Quote Form UI, Message Sent Dialog, and Privacy Page', () => {
  test('renders /en/contact without third-party iframes, completes 3-step Quote Form via keyboard with validation error focus & Escape-dismissible Message Sent dialog, and verifies /en/privacy & /ar/contact', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(90_000)
    const resolvedBase = (baseURL ?? 'http://localhost:3000').replace(/\/+$/, '')
    const token = await ensureE2EAdminToken(resolvedBase)
    const secret = previewSecret()

    await page.setViewportSize({ width: 1440, height: 900 })

    // 1. Anonymous visitor on /en/contact sees PageHeader, contact channels from site-settings, QuoteForm, and static map with zero iframes
    const contactRes = await page.goto('/en/contact', { waitUntil: 'networkidle' })
    expect(contactRes?.status()).toBe(200)
    await expect(page.locator('[data-page-header="true"]')).toBeVisible()
    await expect(page.locator('[data-component="quote-form"]')).toBeVisible()
    await expect(page.locator('[data-static-map]')).toBeVisible()
    await expect(page.locator('[data-open-in-maps]')).toHaveAttribute('href', /maps\.google\.com/)
    await expect(page.locator('[data-office-card] [data-component="button"]')).toHaveAttribute(
      'href',
      /maps\.google\.com/,
    )
    await expect(page.locator('iframe')).toHaveCount(0)

    // 2. Step 1 -> Step 2 via keyboard (Enter on "Continue to contact details")
    const step1NextBtn = page.locator('[data-quote-next="step-1"]')
    await step1NextBtn.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-quote-step="2"]')).toBeVisible()

    // 3. Trigger validation error on Step 2 -> verify aria-describedby and focus moving to first invalid field (#quote-name)
    const step2NextBtn = page.locator('[data-quote-next="step-2"]')
    await step2NextBtn.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-error-for="name"]')).toBeVisible()
    await expect(page.locator('#quote-name')).toHaveAttribute(
      'aria-describedby',
      'quote-name-error',
    )
    await expect(page.locator('#quote-name')).toBeFocused()

    // 4. Fill Step 2 via keyboard and advance to Step 3
    await page.keyboard.type('Eng. Tariq Al-Harbi')
    await page.locator('#quote-company').fill('Al-Kholoud Contracting')
    await page.locator('#quote-phone').fill('57 353 4185')
    await page.locator('#quote-email').fill('tariq@alkholoud.sa')
    await step2NextBtn.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-quote-step="3"]')).toBeVisible()

    // 5. Verify Step 3 has neutral reply note (D-01, R-75), Privacy Policy consent link points to /en/privacy, check consent via Space, and submit via Enter
    await expect(page.locator('[data-quote-step="3"]')).not.toContainText(/working day|24|hour/i)
    const privacyLink = page.locator('[data-privacy-link]')
    await expect(privacyLink).toHaveAttribute('href', '/en/privacy')

    const consentCheckbox = page.locator('#quote-consent')
    await consentCheckbox.focus()
    await page.keyboard.press('Space')
    await expect(consentCheckbox).toBeChecked()

    const submitBtn = page.locator('[data-quote-submit]')
    await submitBtn.focus()
    await page.keyboard.press('Enter')

    // 6. Verify Message Sent dialog opens with role="dialog" and Escape closes it & returns focus
    const dialog = page.locator('[data-component="message-sent-dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('role', 'dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(page.locator('[data-modal-close]')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    // 7. Verify /en/privacy renders 200 OK
    const privacyRes = await page.goto('/en/privacy', { waitUntil: 'networkidle' })
    expect(privacyRes?.status()).toBe(200)
    await expect(page.locator('[data-page-header="true"]')).toBeVisible()
    await expect(page.locator('[data-section="privacy-body"]')).toBeVisible()

    // 8. Staff preview mode on /ar/contact renders RTL Arabic 3-step form
    await page.context().addCookies([
      {
        name: 'payload-token',
        value: token,
        url: resolvedBase,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    const arPreviewRes = await page.goto(
      `/api/preview?secret=${encodeURIComponent(secret)}&locale=ar&global=contact-page`,
      { waitUntil: 'networkidle' },
    )
    expect(arPreviewRes?.status()).toBe(200)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('[data-component="quote-form"]')).toBeVisible()
    await expect(page.locator('[data-step-counter]')).toContainText('الخطوة 1 من 3')
  })
})
