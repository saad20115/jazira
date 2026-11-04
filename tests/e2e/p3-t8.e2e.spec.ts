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
    throw new Error('P3-T8 e2e: PAYLOAD_SECRET is not available to build the preview secret')
  }
  return value
}

function previewSecret(): string {
  return crypto
    .createHmac('sha256', readPayloadSecret())
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

test.describe('P3-T8 — Projects List, Project Detail, and Lightbox', () => {
  test('filters projects on /en/projects, returns 404 for draft slugs to anonymous visitors, and opens/navigates/closes Lightbox with keyboard focus return', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(90_000)
    const resolvedBase = (baseURL ?? 'http://localhost:3000').replace(/\/+$/, '')
    const token = await ensureE2EAdminToken(resolvedBase)
    const secret = previewSecret()

    await page.setViewportSize({ width: 1440, height: 900 })

    // 1. Anonymous visitor on /en/projects sees PageHeader, filter tabs, 15 cards on page 1, and pagination
    const listRes = await page.goto('/en/projects', { waitUntil: 'networkidle' })
    expect(listRes?.status()).toBe(200)
    await expect(page.locator('[data-page-header="true"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText(/Projects/i)
    await expect(page.locator('[data-projects-filters]')).toBeVisible()
    await expect(page.locator('[data-projects-grid] > div')).toHaveCount(15)
    await expect(page.locator('[data-projects-pagination]')).toBeVisible()

    // Clicking a category tab updates ?category= and filters the grid
    await page.locator('[data-filter-category="fire-fighting"]').click()
    await page.waitForURL(/category=fire-fighting/)
    await expect(page.locator('[data-filter-category="fire-fighting"]')).toHaveAttribute(
      'aria-current',
      'page',
    )

    // Invalid query parameters fall back safely without throwing (I1)
    const invalidRes = await page.goto('/en/projects?category=evil-input&status=bad&page=-99', {
      waitUntil: 'networkidle',
    })
    expect(invalidRes?.status()).toBe(200)
    await expect(page.locator('[data-filter-category="all"]')).toHaveAttribute(
      'aria-current',
      'page',
    )

    // 2. Anonymous visitor requesting a draft-only project slug gets 404
    const draftSlugRes = await page.goto('/en/projects/princess-noura-university-pnu', {
      waitUntil: 'networkidle',
    })
    expect(draftSlugRes?.status()).toBe(404)

    // 3. Temporarily attach gallery images to sofitel-makkah-hotel via REST to test Lightbox keyboard navigation & focus return, then restore in finally
    const findSofitelRes = await page.request.get(
      `${resolvedBase}/api/projects?where[slug][equals]=sofitel-makkah-hotel&depth=0&locale=en`,
      {
        headers: { Authorization: `JWT ${token}` },
      },
    )
    expect(findSofitelRes.ok()).toBe(true)
    const sofitelListJson = (await findSofitelRes.json()) as {
      docs: Array<{ id: number; coverImage?: number | null; gallery?: number[] | null }>
    }
    const sofitelDoc = sofitelListJson.docs.at(0)
    if (!sofitelDoc) {
      throw new Error('Expected sofitel-makkah-hotel project document')
    }

    const mediaRes = await page.request.get(`${resolvedBase}/api/media?limit=3&depth=0`, {
      headers: { Authorization: `JWT ${token}` },
    })
    const mediaJson = (await mediaRes.json()) as { docs: Array<{ id: number }> }
    const mediaIds = mediaJson.docs.map((d) => d.id)

    try {
      await page.request.patch(`${resolvedBase}/api/projects/${String(sofitelDoc.id)}?locale=en`, {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          gallery: mediaIds,
        },
      })

      // Enter staff preview mode so cached public queries are bypassed immediately
      await page.context().addCookies([
        {
          name: 'payload-token',
          value: token,
          url: resolvedBase,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ])

      const detailPreviewRes = await page.goto(
        `/api/preview?secret=${encodeURIComponent(secret)}&locale=en&collection=projects&slug=sofitel-makkah-hotel`,
        { waitUntil: 'networkidle' },
      )
      expect(detailPreviewRes?.status()).toBe(200)
      await expect(page.locator('[data-section="project-hero"] h1')).toContainText(
        'Sofitel Makkah Hotel',
      )
      await expect(page.locator('[data-project-sheet]')).toBeVisible()

      const firstThumb = page.locator('[data-gallery-item="0"]')
      await firstThumb.scrollIntoViewIfNeeded()
      await firstThumb.click()

      const dialog = page.locator('[data-component="lightbox"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAttribute('role', 'dialog')
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
      await expect(page.locator('[data-lightbox-counter]')).toContainText(
        `1 / ${String(mediaIds.length)}`,
      )

      // ArrowRight advances to slide 2
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('[data-lightbox-counter]')).toContainText(
        `2 / ${String(mediaIds.length)}`,
      )

      // Escape closes and returns focus to the triggering thumbnail button
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(firstThumb).toBeFocused()

      // 4. Staff in draft mode can also view draft-only project and Arabic RTL /ar/projects
      const staffDraftProjectRes = await page.goto('/en/projects/princess-noura-university-pnu', {
        waitUntil: 'networkidle',
      })
      expect(staffDraftProjectRes?.status()).toBe(200)

      const arListRes = await page.goto('/ar/projects', { waitUntil: 'networkidle' })
      expect(arListRes?.status()).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    } finally {
      await page.request.patch(`${resolvedBase}/api/projects/${String(sofitelDoc.id)}?locale=en`, {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          gallery: sofitelDoc.gallery ?? [],
        },
      })
    }
  })
})
