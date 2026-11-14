import { randomBytes } from 'node:crypto'

import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test'

import { ensureE2EAdminToken } from './global-setup'

/**
 * P2-T7 — the dashboard as staff use it: the language switch, the navigation order, the dashboard
 * home and what an editor sees of it, the hidden API tab, Live Preview while typing, and the phone
 * of a quote request.
 */
const GROUPS_EN = ['Content', 'Pages', 'Company', 'Media', 'Sales', 'Settings', 'System']
const GROUPS_AR = ['المحتوى', 'الصفحات', 'الشركة', 'الوسائط', 'المبيعات', 'الإعدادات', 'النظام']
const MIN_FILL_WAIT_MS = 3_500
const PREVIEW_SETTLE_MS = 2_000

async function staffContext(
  browser: Browser,
  baseURL: string,
  token: string,
  options: { browserLocale?: string } = {},
): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // The browser's language decides its Accept-Language header.
    locale: options.browserLocale ?? 'en-US',
  })
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
  return context
}

async function api(
  baseURL: string,
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(`${baseURL}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `JWT ${token}`, 'content-type': 'application/json' },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  })
  return { status: response.status, json: (await response.json()) as unknown }
}

/** The dashboard specs run on the seeded e2e database, like the public-page specs. */
async function firstPublishedProject(
  baseURL: string,
  token: string,
): Promise<{ id: number; title: string }> {
  const projects = await api(
    baseURL,
    token,
    '/api/projects?limit=1&depth=0&sort=order&locale=en&where[_status][equals]=published',
  )
  const project = (projects.json as { docs: { id: number; title: string }[] }).docs.at(0)
  if (!project) {
    throw new Error('Expected at least one published project in the seed')
  }
  return project
}

async function homeGroups(page: Page): Promise<string[]> {
  return page
    .locator('[data-admin-group]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-admin-group') ?? ''))
}

async function navGroups(page: Page): Promise<string[]> {
  return page
    .locator('.nav .nav-group')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.querySelector('.nav-group__label')?.textContent.trim() ?? ''),
    )
}

test.describe('P2-T7 — dashboard UX', () => {
  test.setTimeout(180_000)

  let baseURL = 'http://localhost:3000'
  let token = ''

  test.beforeAll(async () => {
    baseURL = (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
    token = await ensureE2EAdminToken(baseURL)
  })

  test('the header switch turns the dashboard Arabic (RTL) and back; groups keep the card order', async ({
    browser,
  }) => {
    const context = await staffContext(browser, baseURL, token)
    const page = await context.newPage()
    await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' })

    await expect(page.locator('html')).toHaveAttribute('dir', /^ltr$/i)
    await expect(page.locator('[data-testid="admin-home-title"]')).toBeVisible()
    expect(await homeGroups(page)).toEqual(GROUPS_EN)
    expect(await navGroups(page)).toEqual(GROUPS_EN)
    await expect(page).toHaveTitle(/\| Al Jazira$/)

    const toggle = page.locator('[data-testid="admin-language-toggle"]')
    await expect(toggle).toHaveText('العربية')
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('dir', /^rtl$/i)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect.poll(() => homeGroups(page)).toEqual(GROUPS_AR)
    expect(await navGroups(page)).toEqual(GROUPS_AR)

    // The choice is kept on the next page.
    await page.goto(`${baseURL}/admin/collections/projects`, { waitUntil: 'networkidle' })
    await expect(page.locator('html')).toHaveAttribute('dir', /^rtl$/i)

    await page.locator('[data-testid="admin-language-toggle"]').click()
    await expect(page.locator('html')).toHaveAttribute('dir', /^ltr$/i)
    await context.close()
  })

  test('Arabic: an edit view with a rich-text editor does not scroll sideways', async ({
    browser,
  }) => {
    const context = await staffContext(browser, baseURL, token)
    await context.addCookies([
      { name: 'payload-lng', value: 'ar', domain: new URL(baseURL).hostname, path: '/' },
    ])
    const page = await context.newPage()
    const project = await firstPublishedProject(baseURL, token)
    await page.goto(`${baseURL}/admin/collections/projects/${String(project.id)}`, {
      waitUntil: 'networkidle',
    })
    await expect(page.locator('html')).toHaveAttribute('dir', /^rtl$/i)
    // The editor's parked menus sit about 10 000 px to the left; the page must not grow to reach them.
    await expect(page.locator('.link-editor').first()).toBeAttached()
    const widths = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }))
    expect(widths.page).toBeLessThanOrEqual(widths.viewport)
    await context.close()
  })

  test('dashboard home: an admin has the site-settings link and the Users section; an editor has neither', async ({
    browser,
  }) => {
    const adminContext = await staffContext(browser, baseURL, token)
    const adminPage = await adminContext.newPage()
    await adminPage.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' })
    for (const card of ['quotes', 'drafts', 'recent', 'quick-links']) {
      await expect(adminPage.locator(`[data-admin-card="${card}"]`)).toBeVisible()
    }
    const adminQuick = adminPage.locator('[data-admin-card="quick-links"]')
    await expect(adminQuick.locator('a[href="/admin/globals/site-settings"]')).toHaveCount(1)
    await expect(adminQuick.locator('a[href="/admin/collections/projects/create"]')).toHaveCount(1)
    await expect(adminPage.locator('.admin-home a[href="/admin/collections/users"]')).toHaveCount(1)
    await adminContext.close()

    const email = `p2t7-editor-${String(Date.now())}@example.test`
    const password = `Ed!${randomBytes(18).toString('base64url')}9a`
    const created = await api(baseURL, token, '/api/users', {
      method: 'POST',
      body: { name: 'P2-T7 e2e editor', email, password, role: 'editor' },
    })
    expect(created.status).toBe(201)
    const login = await fetch(`${baseURL}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(login.status).toBe(200)
    const editorToken = ((await login.json()) as { token: string }).token

    const editorContext = await staffContext(browser, baseURL, editorToken)
    const editorPage = await editorContext.newPage()
    await editorPage.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' })
    await expect(editorPage.locator('[data-testid="admin-home-title"]')).toBeVisible()
    await expect(editorPage.locator('[data-admin-card="recent"]')).toBeVisible()
    await expect(
      editorPage.locator('.admin-home a[href="/admin/globals/site-settings"]'),
    ).toHaveCount(0)
    await expect(editorPage.locator('.admin-home a[href="/admin/collections/users"]')).toHaveCount(
      0,
    )
    await expect(
      editorPage
        .locator('[data-admin-card="quick-links"]')
        .locator('a[href="/admin/collections/projects/create"]'),
    ).toHaveCount(1)
    await editorContext.close()
  })

  test('a project edit view has no API tab, and Live Preview follows the typing', async ({
    browser,
  }) => {
    const project = await firstPublishedProject(baseURL, token)

    const context = await staffContext(browser, baseURL, token)
    const page = await context.newPage()
    await page.goto(`${baseURL}/admin/collections/projects/${String(project.id)}`, {
      waitUntil: 'networkidle',
    })
    await expect(page.locator('.doc-tab', { hasText: /^API$/ })).toHaveCount(0)
    await expect(page.locator('.doc-tab').first()).toBeVisible()

    // Payload remembers per user whether Live Preview was open, so open it only when it is closed.
    const livePreview = page.locator('.live-preview-window--is-live-previewing')
    if ((await livePreview.count()) === 0) {
      await page.locator('#live-preview-toggler').click()
    }
    await expect(livePreview).toBeVisible()
    const preview = page.frameLocator('.live-preview-window iframe')
    await expect(preview.locator('h1')).toContainText(project.title, { timeout: 30_000 })
    // Type once the previewed page is there, as a member of staff would.
    await expect(preview.locator('footer')).toBeAttached({ timeout: 30_000 })
    await page.waitForTimeout(PREVIEW_SETTLE_MS)

    const edited = `${project.title} LP${String(Date.now()).slice(-5)}`
    await page.locator('#field-title').fill(edited)
    await expect(preview.locator('h1')).toContainText(edited, { timeout: 30_000 })

    // Put the title back, and wait for the preview to follow.
    await page.locator('#field-title').fill(project.title)
    await expect(preview.locator('h1')).not.toContainText('LP', { timeout: 30_000 })
    await context.close()
  })

  test('a quote request phone reads grouped in the list and the edit view', async ({
    browser,
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': '198.51.100.141' })
    const email = `p2t7-phone-${String(Date.now())}@example.test`
    await page.goto('/en/contact', { waitUntil: 'networkidle' })
    await page.locator('[data-quote-next="step-1"]').click()
    await expect(page.locator('[data-quote-step="2"]')).toBeVisible()
    await page.locator('#quote-name').fill('P2T7 E2E Visitor')
    await page.locator('#quote-company').fill('P2T7 E2E Company')
    await page.locator('#quote-phone').fill('57 353 4185')
    await page.locator('#quote-email').fill(email)
    await page.locator('[data-quote-next="step-2"]').click()
    await expect(page.locator('[data-quote-step="3"]')).toBeVisible()
    await page.locator('#quote-consent').check()
    await page.waitForTimeout(MIN_FILL_WAIT_MS)
    await page.locator('[data-quote-submit]').click()
    await expect(page.locator('[data-component="message-sent-dialog"]')).toBeVisible()

    const found = await api(
      baseURL,
      token,
      `/api/quote-requests?where[email][equals]=${encodeURIComponent(email)}&depth=0&limit=1`,
    )
    const quote = (found.json as { docs: { id: number; phone: string }[] }).docs.at(0)
    expect(quote?.phone).toBe('+966573534185')
    if (!quote) {
      return
    }

    const context = await staffContext(browser, baseURL, token)
    const admin = await context.newPage()
    await admin.goto(
      `${baseURL}/admin/collections/quote-requests?where[email][equals]=${encodeURIComponent(email)}&columns=${encodeURIComponent('["name","phone","status"]')}`,
      { waitUntil: 'networkidle' },
    )
    await expect(admin.locator('[data-testid="quote-phone-cell"]').first()).toHaveText(
      '+966 57 353 4185',
    )

    await admin.goto(`${baseURL}/admin/collections/quote-requests/${String(quote.id)}`, {
      waitUntil: 'networkidle',
    })
    const field = admin.locator('[data-testid="quote-phone-field"]')
    await expect(field).toHaveValue('+966 57 353 4185')
    await expect(field).toBeDisabled()
    await context.close()
  })
})
