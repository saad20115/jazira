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
    throw new Error('P3-T7 e2e: PAYLOAD_SECRET is not available to build the preview secret')
  }
  return value
}

function previewSecret(): string {
  return crypto
    .createHmac('sha256', readPayloadSecret())
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

test.describe('P3-T7 — About Us Page (/en/about and /ar/about)', () => {
  test('hides inactive team members on the anonymous public page and renders all 5 sections in staff draft preview', async ({
    page,
    baseURL,
  }) => {
    const resolvedBase = (baseURL ?? 'http://localhost:3000').replace(/\/+$/, '')
    const token = await ensureE2EAdminToken(resolvedBase)
    const secret = previewSecret()

    await page.setViewportSize({ width: 1440, height: 900 })

    // 1. Anonymous visitor: all seeded team members have active=false, so Meet Our Team must be completely hidden
    const anonRes = await page.goto('/en/about', { waitUntil: 'networkidle' })
    expect(anonRes?.status()).toBe(200)
    await expect(page.locator('#meet-our-team')).toHaveCount(0)

    // 2. Staff draft preview: renders all 5 Figma sections (`21:1034`, `21:1046`, `21:1068`, `108:1576`, `21:1162`)
    await page.context().addCookies([
      {
        name: 'payload-token',
        value: token,
        url: resolvedBase,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])

    const previewRes = await page.goto(
      `/api/preview?secret=${encodeURIComponent(secret)}&locale=en&global=about-page`,
      { waitUntil: 'networkidle' },
    )
    expect(previewRes?.status()).toBe(200)
    expect(page.url()).toContain('/en/about')

    await expect(page.locator('[data-page-header="true"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('About Us')

    const storySection = page.locator('#our-story')
    await expect(storySection).toBeVisible()
    await expect(storySection.locator('h2')).toContainText('Engineering Excellence')
    await expect(storySection.locator('[data-story-badge-stat="true"]')).toContainText('45+')

    const strengthsSection = page.locator('#core-strengths')
    await expect(strengthsSection).toBeVisible()
    await expect(strengthsSection.locator('article[data-strength-card]')).toHaveCount(4)

    const mvSection = page.locator('#mission-vision')
    await expect(mvSection).toBeVisible()
    await expect(mvSection.locator('[data-mv-row="mission"]')).toBeVisible()
    await expect(mvSection.locator('[data-mv-row="vision"]')).toBeVisible()

    const teamSection = page.locator('#meet-our-team')
    await expect(teamSection).toBeVisible()
    await expect(teamSection.locator('[data-team-subsection="leadership"]')).toBeVisible()
    await expect(teamSection.locator('[data-team-subsection="staff"]')).toBeVisible()

    // 3. Arabic RTL draft preview (`/ar/about`)
    const arRes = await page.goto('/ar/about', { waitUntil: 'networkidle' })
    expect(arRes?.status()).toBe(200)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('h1')).toContainText('من نحن')
  })
})
