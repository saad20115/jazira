import AxeBuilder from '@axe-core/playwright'
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import {
  ensureE2EAdminToken,
  restoreSiteSettingsViaApi,
  setArabicEnabledViaApi,
  type SiteSettingsFullSnapshot,
  snapshotSiteSettingsViaApi,
} from './global-setup'

/**
 * P3-T10 §4 + Phase 3 acceptance:
 * - axe-core on every public page in `en` and `ar`: zero serious or critical violations
 *   (WCAG 2.0/2.1/2.2 A and AA rules);
 * - zero CSP violations and zero hydration warnings in the console on every page;
 * - 404 and the sitemap/robots basics.
 * Arabic is switched on for the Arabic pass and the site settings are restored afterwards.
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

interface ConsoleProblem {
  page: string
  text: string
}

function isCspOrHydrationProblem(text: string): boolean {
  return (
    /content security policy/i.test(text) ||
    /refused to (load|execute|apply)/i.test(text) ||
    /hydrat/i.test(text) ||
    /did not match/i.test(text)
  )
}

async function newQuietContext(
  browser: import('@playwright/test').Browser,
  locale: 'en' | 'ar',
): Promise<BrowserContext> {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    locale: locale === 'ar' ? 'ar-SA' : 'en-US',
  })
  // Skip the one-time intro splash so the page content itself is audited.
  await context.addInitScript(() => {
    window.sessionStorage.setItem('aljazira_intro_seen', '1')
  })
  return context
}

async function firstSlug(baseURL: string, kind: 'projects' | 'services'): Promise<string | null> {
  const response = await fetch(`${baseURL}/sitemap.xml`)
  const xml = await response.text()
  const match = new RegExp(`<loc>[^<]*/en/${kind}/([^<]+)</loc>`).exec(xml)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

async function auditPage(
  page: Page,
  path: string,
  problems: ConsoleProblem[],
): Promise<{ path: string; violations: string[] }> {
  const onConsole = (message: import('@playwright/test').ConsoleMessage): void => {
    if (
      (message.type() === 'error' || message.type() === 'warning') &&
      isCspOrHydrationProblem(message.text())
    ) {
      problems.push({ page: path, text: message.text() })
    }
  }
  page.on('console', onConsole)
  try {
    const response = await page.goto(path, { waitUntil: 'networkidle' })
    expect(response?.status(), `${path} status`).toBeLessThan(400)
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    const violations = results.violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map(
        (violation) =>
          `${String(violation.impact)} ${violation.id}: ${violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(' '))
            .join(' | ')}`,
      )
    return { path, violations }
  } finally {
    page.off('console', onConsole)
  }
}

test.describe('P3-T10 — accessibility (axe), CSP and hydration on every public page', () => {
  test.setTimeout(600_000)

  let baseURL = 'http://localhost:3000'
  let adminToken = ''
  let snapshot: SiteSettingsFullSnapshot | null = null
  const pages: string[] = ['', '/services', '/about', '/projects', '/contact']

  test.beforeAll(async () => {
    baseURL = (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
    adminToken = await ensureE2EAdminToken(baseURL)
    snapshot = await snapshotSiteSettingsViaApi(baseURL, adminToken)
    const projectSlug = await firstSlug(baseURL, 'projects')
    const serviceSlug = await firstSlug(baseURL, 'services')
    expect(projectSlug, 'a published project in the sitemap').not.toBeNull()
    expect(serviceSlug, 'a published service in the sitemap').not.toBeNull()
    pages.push(`/projects/${String(projectSlug)}`, `/services/${String(serviceSlug)}`)
  })

  test.afterAll(async () => {
    if (snapshot && adminToken) {
      await restoreSiteSettingsViaApi(snapshot, adminToken)
    }
  })

  for (const locale of ['en', 'ar'] as const) {
    test(`${locale}: zero serious/critical axe violations, zero CSP and hydration messages`, async ({
      browser,
    }) => {
      await setArabicEnabledViaApi(baseURL, adminToken, locale === 'ar')
      const context = await newQuietContext(browser, locale)
      const page = await context.newPage()
      const problems: ConsoleProblem[] = []
      const results: { path: string; violations: string[] }[] = []
      try {
        for (const subpath of pages) {
          results.push(await auditPage(page, `/${locale}${subpath}`, problems))
        }
        const missing = await page.goto(`/${locale}/p3-t10-this-page-does-not-exist`)
        expect(missing?.status()).toBe(404)
        await expect(page.locator('h1')).toHaveCount(1)
        const notFoundAudit = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
        results.push({
          path: `/${locale}/<404>`,
          violations: notFoundAudit.violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => `${String(v.impact)} ${v.id}`),
        })
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      } finally {
        await context.close()
      }
      expect(results.filter((r) => r.violations.length > 0)).toEqual([])
      expect(problems).toEqual([])
    })
  }

  test('WCAG 2.5.8: the footer language switcher is at least 24 x 24 at 1440 (en and ar)', async ({
    browser,
  }) => {
    await setArabicEnabledViaApi(baseURL, adminToken, true)
    for (const locale of ['en', 'ar'] as const) {
      const context = await newQuietContext(browser, locale)
      const page = await context.newPage()
      try {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto(`/${locale}`)
        const switcher = page.getByTestId('footer-language-switcher')
        await switcher.scrollIntoViewIfNeeded()
        const box = await switcher.boundingBox()
        expect(box, `${locale} switcher box`).not.toBeNull()
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(24)
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(24)
      } finally {
        await context.close()
      }
    }
  })

  test('robots.txt points to the sitemap; the sitemap lists English pages and hreflang', async ({
    request,
  }) => {
    await setArabicEnabledViaApi(baseURL, adminToken, false)
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain(`Sitemap: ${baseURL}/sitemap.xml`)
    expect(robots).toContain('Disallow: /admin')
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`<loc>${baseURL}/en/projects</loc>`)
    expect(sitemap).toContain('hreflang="x-default"')
    expect(sitemap).not.toContain(`<loc>${baseURL}/ar`)
  })
})
