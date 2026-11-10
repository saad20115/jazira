import { NextRequest } from 'next/server'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuoteRequests } from '@/collections/QuoteRequests'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { DEFAULT_INTERACTIVE_SYSTEMS_EN, getDefaultInteractiveSystems } from '@/globals/HomePage'
import { SiteSettings } from '@/globals/SiteSettings'
import { buildHreflangAlternates, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n'
import {
  getFallbackLocale,
  isAuthorizedArabicPreviewRequest,
  isSameOriginAdminReferer,
  resolveExpectedRequestOrigin,
} from '@/lib/cms/client'
import type { HomePage, Navigation, SiteSetting } from '@/payload-types'
import { DEFAULT_ADMIN_LANG, proxy } from '@/proxy'

const mockSiteSettings = vi.fn<() => Promise<SiteSetting | null>>()
const mockNavigation = vi.fn<() => Promise<Navigation | null>>()
const mockHomePage = vi.fn<() => Promise<HomePage | null>>()
const mockDraftMode = vi.fn<() => Promise<{ isEnabled: boolean }>>()
const mockHeaders = vi.fn<() => Promise<Headers>>()
const mockStaffUser =
  vi.fn<() => Promise<{ id: number; email: string; role: 'admin' | 'editor' } | null>>()
const mockRevalidateTag = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@payload-config', () => ({
  default: Promise.resolve({}),
}))

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return {
    ...actual,
    getPayload: () =>
      Promise.resolve({
        auth: async () => ({
          user: await mockStaffUser(),
        }),
      }),
  }
})

vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => {
    mockRevalidateTag(...args)
  },
  revalidatePath: (...args: unknown[]) => {
    mockRevalidatePath(...args)
  },
  unstable_cache: (fn: unknown) => fn,
}))

vi.mock('next/headers', () => ({
  draftMode: () => mockDraftMode(),
  headers: () => mockHeaders(),
}))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  usePathname: () => '/en',
}))

vi.mock('@/styles/font-preload', () => ({
  preloadLocaleFonts: (locale: string) =>
    locale === 'ar'
      ? ['/_next/static/media/noto-kufi-arabic.woff2']
      : ['/_next/static/media/poppins.woff2'],
}))

vi.mock('@/styles/fonts', () => ({
  fontVariablesClassName: 'font-poppins font-noto-kufi',
  getLocaleFontClassName: (locale: string) => (locale === 'ar' ? 'font-noto-kufi' : 'font-poppins'),
}))

vi.mock('@/lib/cms', () => ({
  getSiteSettings: () => mockSiteSettings(),
  getNavigation: () => mockNavigation(),
  getHomePage: () => mockHomePage(),
  getServices: () => Promise.resolve([]),
  getStats: () => Promise.resolve([]),
  getProjects: () =>
    Promise.resolve({
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
    }),
  getBrands: () => Promise.resolve([]),
  resolveAuthenticatedStaffUser: () => mockStaffUser(),
  isArabicEnabled: async () => {
    const s = await mockSiteSettings()
    return s?.arabicEnabled === true
  },
  isAuthorizedArabicPreviewRequest: (
    reqHeaders: Headers,
    isDraftModeEnabled: boolean,
    search = '',
  ) => isAuthorizedArabicPreviewRequest(reqHeaders, isDraftModeEnabled, search),
}))

import LocaleCatchAllNotFoundPage from '@/app/(frontend)/[locale]/[...rest]/page'
import LocaleRootLayout, {
  buildEnglishRedirectTarget,
  enforceArabicEnabledOrRedirect,
  generateMetadata as generateLayoutMetadata,
} from '@/app/(frontend)/[locale]/layout'
import LocaleHomePage, {
  generateMetadata as generateHomeMetadata,
} from '@/app/(frontend)/[locale]/page'
import sitemap from '@/app/sitemap'

function makeBaseSiteSettings(arabicEnabled: boolean): SiteSetting {
  return {
    id: 1,
    companyName: 'Al Jazira for Imdad Smart Co.',
    tagline: 'MEP & Smart Engineering Solutions · Riyadh, KSA',
    arabicEnabled,
    phone: '+966 57 353 4185',
    email: 'info@aljazira-imdad.sa',
    whatsapp: '966573534185',
    defaultSeo: {
      title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering',
      description: 'Integrated MEP and smart engineering contracting in Riyadh, KSA.',
    },
  }
}

describe('P3-T12 — English Default + Admin "Arabic On/Off" Switch (`site-settings.arabicEnabled`)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSiteSettings.mockResolvedValue(makeBaseSiteSettings(false))
    mockNavigation.mockResolvedValue(null)
    mockHomePage.mockResolvedValue(null)
    mockDraftMode.mockResolvedValue({ isEnabled: false })
    mockStaffUser.mockResolvedValue(null)
    mockHeaders.mockResolvedValue(
      new Headers({
        'x-nonce': 'test-nonce-p3-t12',
        'x-aljazira-pathname': '/en',
        'x-aljazira-search': '',
      }),
    )
  })

  describe('1. Default Locale & Proxy (`/` -> `307 /en`, `payload-lng=en`, `R-4`, `R-5`)', () => {
    it('sets DEFAULT_LOCALE = "en", SUPPORTED_LOCALES = ["en", "ar"], DEFAULT_ADMIN_LANG = "en", and uses DEFAULT_LOCALE in QuoteRequests and HomePage (R-4)', () => {
      expect(DEFAULT_LOCALE).toBe('en')
      expect(SUPPORTED_LOCALES).toEqual(['en', 'ar'])
      expect(DEFAULT_ADMIN_LANG).toBe('en')

      const quoteLocaleField = QuoteRequests.fields.find((f) => 'name' in f && f.name === 'locale')
      expect(
        quoteLocaleField && 'defaultValue' in quoteLocaleField
          ? quoteLocaleField.defaultValue
          : null,
      ).toBe('en')

      expect(getDefaultInteractiveSystems()).toEqual(DEFAULT_INTERACTIVE_SYSTEMS_EN)
    })

    it('redirects / -> 307 /en preserving query parameters (R-5)', () => {
      const req = new NextRequest('http://localhost:3000/?q=hvac&src=hero')
      const res = proxy(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/en?q=hvac&src=hero')
    })

    it('sets payload-lng=en cookie by default on /admin when no cookie exists', () => {
      const req = new NextRequest('http://localhost:3000/admin/login')
      const res = proxy(req)
      expect(res.cookies.get('payload-lng')?.value).toBe('en')
    })
  })

  describe('2. SiteSettings `arabicEnabled` schema, field-level access, and revalidation hook', () => {
    it('defines arabicEnabled checkbox on SiteSettings with defaultValue: false, exact admin description, and isAdminFieldLevel update access', async () => {
      const field = SiteSettings.fields.find((f) => 'name' in f && f.name === 'arabicEnabled')
      expect(field).toBeDefined()
      expect(field && 'type' in field ? field.type : null).toBe('checkbox')
      expect(field && 'defaultValue' in field ? field.defaultValue : null).toBe(false)

      const adminDesc =
        field && 'admin' in field && field.admin && 'description' in field.admin
          ? (field.admin.description as { en: string; ar: string })
          : null
      expect(adminDesc?.en).toBe('Show the Arabic version of the website to visitors')

      const updateAccess =
        field && 'access' in field && field.access && 'update' in field.access
          ? field.access.update
          : null
      if (typeof updateAccess !== 'function') {
        throw new Error('Expected SiteSettings.arabicEnabled.access.update function')
      }

      // Editor cannot update arabicEnabled; admin can
      const editorAllowed = await updateAccess({
        req: { user: { id: 2, role: 'editor' } },
      } as never)
      const adminAllowed = await updateAccess({
        req: { user: { id: 1, role: 'admin' } },
      } as never)
      const anonAllowed = await updateAccess({
        req: { user: null },
      } as never)

      expect(editorAllowed).toBe(false)
      expect(anonAllowed).toBe(false)
      expect(adminAllowed).toBe(true)
    })

    it('revalidates global:site-settings tags with { expire: 0 } and /ar, /en, /sitemap.xml when SiteSettings changes', async () => {
      const afterChangeHooks = SiteSettings.hooks?.afterChange ?? []
      expect(afterChangeHooks.length).toBeGreaterThanOrEqual(1)

      for (const hook of afterChangeHooks) {
        await hook({
          context: {},
          doc: { id: 1, arabicEnabled: true },
          global: { slug: 'site-settings' },
          previousDoc: { id: 1, arabicEnabled: false },
          req: {},
        } as never)
      }

      expect(mockRevalidateTag).toHaveBeenCalledWith('global:site-settings', { expire: 0 })
      expect(mockRevalidateTag).toHaveBeenCalledWith('global:site-settings:ar', { expire: 0 })
      expect(mockRevalidateTag).toHaveBeenCalledWith('global:site-settings:en', { expire: 0 })
      const revalidatedPaths = mockRevalidatePath.mock.calls.map((c: unknown[]) => String(c[0]))
      expect(revalidatedPaths).toContain('/ar')
      expect(revalidatedPaths).toContain('/en')
      expect(revalidatedPaths).toContain('/sitemap.xml')
    })
  })

  describe('3. Public routing when `arabicEnabled = false` (default)', () => {
    it('redirects /ar -> 307 /en and /ar/services?q=hvac -> 307 /en/services?q=hvac', async () => {
      expect(buildEnglishRedirectTarget('/ar', '')).toBe('/en')
      expect(buildEnglishRedirectTarget('/ar/services', '?q=hvac')).toBe('/en/services?q=hvac')

      // Root /ar layout redirect
      mockHeaders.mockResolvedValueOnce(
        new Headers({
          'x-nonce': 'test-nonce',
          'x-aljazira-pathname': '/ar',
          'x-aljazira-search': '',
        }),
      )
      await expect(
        LocaleRootLayout({
          params: Promise.resolve({ locale: 'ar' }),
          children: React.createElement('div'),
        }),
      ).rejects.toThrow('NEXT_REDIRECT:/en')

      // Subpath /ar/services?q=hvac redirect via catch-all page
      mockHeaders.mockResolvedValueOnce(
        new Headers({
          'x-nonce': 'test-nonce',
          'x-aljazira-pathname': '/ar/services',
          'x-aljazira-search': '?q=hvac',
        }),
      )
      await expect(
        LocaleCatchAllNotFoundPage({
          params: Promise.resolve({ locale: 'ar', rest: ['services'] }),
        }),
      ).rejects.toThrow('NEXT_REDIRECT:/en/services?q=hvac')

      // /en/unmatched-route still triggers 404 (NEXT_NOT_FOUND)
      await expect(
        LocaleCatchAllNotFoundPage({
          params: Promise.resolve({ locale: 'en', rest: ['unmatched-route'] }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('hides the language switcher in Navbar (desktop + mobile drawer) and Footer when showLanguageSwitcher={false}', () => {
      const navHtmlOff = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'en',
          showLanguageSwitcher: false,
          siteName: 'Al Jazira for Imdad Smart Co.',
        }),
      )
      const footerHtmlOff = renderToStaticMarkup(
        React.createElement(Footer, {
          locale: 'en',
          showLanguageSwitcher: false,
          siteName: 'Al Jazira for Imdad Smart Co.',
        }),
      )

      expect(navHtmlOff).not.toContain('href="/ar"')
      expect(navHtmlOff).not.toContain('hreflang="ar"')
      expect(navHtmlOff).not.toContain('العربية')
      expect(footerHtmlOff).not.toContain('href="/ar"')
      expect(footerHtmlOff).not.toContain('hreflang="ar"')
      expect(footerHtmlOff).not.toContain('العربية')
    })

    it('outputs only en and x-default -> /en in hreflang, sitemap.xml, JSON-LD inLanguage, and OpenGraph locale', async () => {
      expect(buildHreflangAlternates('/', false)).toEqual({
        en: '/en',
        'x-default': '/en',
      })
      expect(buildHreflangAlternates('/services', false)).toEqual({
        en: '/en/services',
        'x-default': '/en/services',
      })

      const sitemapEntriesOff = await sitemap()
      // P3-T10 §1: the five always-present pages, English only while Arabic is off.
      expect(sitemapEntriesOff.map((e) => e.url)).toEqual([
        'http://localhost:3000/en',
        'http://localhost:3000/en/services',
        'http://localhost:3000/en/about',
        'http://localhost:3000/en/projects',
        'http://localhost:3000/en/contact',
      ])
      expect(sitemapEntriesOff[0]?.url).toBe('http://localhost:3000/en')
      expect(sitemapEntriesOff[0]?.alternates?.languages).toEqual({
        en: 'http://localhost:3000/en',
        'x-default': 'http://localhost:3000/en',
      })

      const homeMetaOff = await generateHomeMetadata({
        params: Promise.resolve({ locale: 'en' }),
      })
      expect(homeMetaOff.alternates).toEqual({
        canonical: '/en',
        languages: {
          en: '/en',
          'x-default': '/en',
        },
      })
      expect(homeMetaOff.openGraph?.locale).toBe('en_US')

      const layoutMetaOff = await generateLayoutMetadata({
        params: Promise.resolve({ locale: 'en' }),
      })
      expect(layoutMetaOff.alternates).toEqual({
        canonical: '/en',
        languages: {
          en: '/en',
          'x-default': '/en',
        },
      })
      expect(layoutMetaOff.openGraph?.locale).toBe('en_US')

      const layoutEl = await LocaleRootLayout({
        params: Promise.resolve({ locale: 'en' }),
        children: React.createElement('main', null, 'Body'),
      })
      const layoutHtml = renderToStaticMarkup(layoutEl)
      expect(layoutHtml).toContain('"inLanguage":"en"')
      expect(layoutHtml).not.toContain('href="/ar"')
    })

    it('gates generateMetadata on /ar when arabicEnabled = false so zero Arabic metadata leaks into 307 bodies or RSC payloads (R-1)', async () => {
      const arSettingsWithArabicCopy: SiteSetting = {
        ...makeBaseSiteSettings(false),
        companyName: 'شركة الجزيرة للإمداد الذكي',
        tagline: 'حلول الكهروميكانيك والهندسة الذكية',
        defaultSeo: {
          title: 'شركة الجزيرة للإمداد الذكي — مقاولات الكهروميكانيك',
          description: 'مقاولات متكاملة في الأنظمة الكهروميكانيكية',
        },
      }
      mockSiteSettings.mockResolvedValue(arSettingsWithArabicCopy)
      mockHomePage.mockResolvedValue({
        id: 1,
        meta: {
          title: 'الصفحة الرئيسية — شركة الجزيرة',
          description: 'وصف الصفحة الرئيسية بالعربية',
        },
      })

      const arLayoutMetaOff = await generateLayoutMetadata({
        params: Promise.resolve({ locale: 'ar' }),
      })
      const arHomeMetaOff = await generateHomeMetadata({
        params: Promise.resolve({ locale: 'ar' }),
      })

      expect(arLayoutMetaOff).toEqual({})
      expect(arHomeMetaOff).toEqual({})
      expect(/[\u0600-\u06FF]/.test(JSON.stringify(arLayoutMetaOff))).toBe(false)
      expect(/[\u0600-\u06FF]/.test(JSON.stringify(arHomeMetaOff))).toBe(false)
      // And mockHomePage should not even have been called for an unauthorized /ar metadata request
      expect(mockHomePage).not.toHaveBeenCalled()
    })
  })

  describe('4. Staff Preview Exception (`draftMode` & Live Preview `iframe`) when `arabicEnabled = false`', () => {
    it('allows a logged-in editor in draftMode to view /ar without redirecting to /en', async () => {
      mockDraftMode.mockResolvedValue({ isEnabled: true })
      mockStaffUser.mockResolvedValue({
        id: 2,
        email: 'editor@aljazira.co',
        role: 'editor',
      })
      const reqHeaders = new Headers({
        'x-nonce': 'test-nonce',
        'x-aljazira-pathname': '/ar',
        'x-aljazira-search': '',
      })
      mockHeaders.mockResolvedValue(reqHeaders)

      await expect(enforceArabicEnabledOrRedirect(reqHeaders, '/ar', '')).resolves.toBeUndefined()

      const layoutEl = await LocaleRootLayout({
        params: Promise.resolve({ locale: 'ar' }),
        children: React.createElement('main', null, 'Arabic Draft Preview'),
      })
      const html = renderToStaticMarkup(layoutEl)
      expect(html).toContain('lang="ar"')
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('Arabic Draft Preview')
    })

    it('allows a logged-in editor in a Live Preview iframe (sec-fetch-dest: iframe) to view /ar when arabicEnabled is false', async () => {
      mockDraftMode.mockResolvedValue({ isEnabled: false })
      mockStaffUser.mockResolvedValue({
        id: 2,
        email: 'editor@aljazira.co',
        role: 'editor',
      })
      const iframeHeaders = new Headers({
        cookie: 'payload-token=valid-staff-jwt',
        'x-nonce': 'test-nonce',
        'x-aljazira-pathname': '/ar',
        'x-aljazira-search': '',
        'sec-fetch-dest': 'iframe',
      })
      mockHeaders.mockResolvedValue(iframeHeaders)

      await expect(
        enforceArabicEnabledOrRedirect(iframeHeaders, '/ar', ''),
      ).resolves.toBeUndefined()
    })

    it('still redirects an unauthenticated visitor even if sec-fetch-dest: iframe or ?livePreview=true is spoofed', async () => {
      mockDraftMode.mockResolvedValue({ isEnabled: false })
      mockStaffUser.mockResolvedValue(null)
      const spoofedHeaders = new Headers({
        'x-nonce': 'test-nonce',
        'x-aljazira-pathname': '/ar/projects',
        'x-aljazira-search': '?livePreview=true',
        'sec-fetch-dest': 'iframe',
      })

      await expect(
        enforceArabicEnabledOrRedirect(spoofedHeaders, '/ar/projects', '?livePreview=true'),
      ).rejects.toThrow('NEXT_REDIRECT:/en/projects?livePreview=true')
    })

    it('strictly parses preview/livePreview query params via URLSearchParams and requires same-origin /admin referer from SERVER_URL (R-6, R-8, R-11)', async () => {
      mockDraftMode.mockResolvedValue({ isEnabled: false })
      mockStaffUser.mockResolvedValue({
        id: 2,
        email: 'editor@aljazira.co',
        role: 'editor',
      })

      // 1. Substring spoof ?preview=true_fake or ?not_preview=true must be rejected by real isAuthorizedArabicPreviewRequest -> redirects to /en
      const fakePreviewHeaders = new Headers({
        cookie: 'payload-token=valid-staff-jwt',
        host: 'localhost:3000',
        'x-aljazira-pathname': '/ar',
        'x-aljazira-search': '?preview=true_fake',
      })
      await expect(
        isAuthorizedArabicPreviewRequest(fakePreviewHeaders, false, '?preview=true_fake'),
      ).resolves.toBe(false)
      await expect(
        enforceArabicEnabledOrRedirect(fakePreviewHeaders, '/ar', '?preview=true_fake'),
      ).rejects.toThrow('NEXT_REDIRECT:/en?preview=true_fake')

      // 2. Cross-origin referer https://evil.example/admin (even with spoofed X-Forwarded-Host: evil.example) must be rejected (R-11)
      const crossOriginRefererHeaders = new Headers({
        cookie: 'payload-token=valid-staff-jwt',
        host: 'localhost:3000',
        'x-forwarded-host': 'evil.example',
        'x-forwarded-proto': 'https',
        referer: 'https://evil.example/admin/globals/home-page',
      })
      expect(resolveExpectedRequestOrigin()).toBe('http://localhost:3000')
      expect(
        isSameOriginAdminReferer(
          'https://evil.example/admin/globals/home-page',
          crossOriginRefererHeaders,
        ),
      ).toBe(false)
      await expect(
        isAuthorizedArabicPreviewRequest(crossOriginRefererHeaders, false, ''),
      ).resolves.toBe(false)
      await expect(
        enforceArabicEnabledOrRedirect(crossOriginRefererHeaders, '/ar', ''),
      ).rejects.toThrow('NEXT_REDIRECT:/en')

      // 3. Same-origin non-admin referer http://localhost:3000/en/about?from=/admin must be rejected
      const nonAdminRefererHeaders = new Headers({
        cookie: 'payload-token=valid-staff-jwt',
        host: 'localhost:3000',
        referer: 'http://localhost:3000/en/about?from=/admin',
      })
      expect(
        isSameOriginAdminReferer(
          'http://localhost:3000/en/about?from=/admin',
          nonAdminRefererHeaders,
        ),
      ).toBe(false)
      await expect(
        isAuthorizedArabicPreviewRequest(nonAdminRefererHeaders, false, ''),
      ).resolves.toBe(false)
      await expect(
        enforceArabicEnabledOrRedirect(nonAdminRefererHeaders, '/ar', ''),
      ).rejects.toThrow('NEXT_REDIRECT:/en')

      // 4. Same-origin /admin referer http://localhost:3000/admin/globals/home-page is accepted for authenticated staff with cookie
      const validAdminRefererHeaders = new Headers({
        cookie: 'payload-token=valid-staff-jwt',
        host: 'localhost:3000',
        referer: 'http://localhost:3000/admin/globals/home-page',
      })
      expect(
        isSameOriginAdminReferer(
          'http://localhost:3000/admin/globals/home-page',
          validAdminRefererHeaders,
        ),
      ).toBe(true)
      await expect(
        isAuthorizedArabicPreviewRequest(validAdminRefererHeaders, false, ''),
      ).resolves.toBe(true)
      await expect(
        enforceArabicEnabledOrRedirect(validAdminRefererHeaders, '/ar', ''),
      ).resolves.toBeUndefined()

      // 5. Exact ?preview=true or ?livePreview=true query param is accepted for authenticated staff with cookie
      const exactPreviewHeaders = new Headers({
        cookie: 'payload-token=valid-staff-jwt',
        host: 'localhost:3000',
      })
      await expect(
        isAuthorizedArabicPreviewRequest(exactPreviewHeaders, false, '?preview=true'),
      ).resolves.toBe(true)
      await expect(
        enforceArabicEnabledOrRedirect(exactPreviewHeaders, '/ar', '?preview=true'),
      ).resolves.toBeUndefined()
      await expect(
        enforceArabicEnabledOrRedirect(exactPreviewHeaders, '/ar', '?livePreview=true'),
      ).resolves.toBeUndefined()

      // 6. Without payload-token cookie or authorization header when draftMode is off, real isAuthorizedArabicPreviewRequest returns false immediately
      const missingCookieHeaders = new Headers({
        host: 'localhost:3000',
        referer: 'http://localhost:3000/admin/globals/home-page',
      })
      await expect(
        isAuthorizedArabicPreviewRequest(missingCookieHeaders, false, '?preview=true'),
      ).resolves.toBe(false)
    })

    it('never falls back from en to ar in getFallbackLocale, so empty en + filled ar produces 0 Arabic characters on /en (R-7)', async () => {
      expect(getFallbackLocale('ar')).toBe('en')
      expect(getFallbackLocale('en')).toBe(false)

      // Simulate Payload returning empty en fields when fallbackLocale is false (even though ar is populated in DB)
      mockSiteSettings.mockResolvedValue({
        id: 1,
        companyName: '',
        tagline: '',
        arabicEnabled: false,
        defaultSeo: {
          titleSuffix: '',
          defaultDescription: '',
        },
      } as unknown as SiteSetting)
      mockHomePage.mockResolvedValue({
        id: 1,
        hero: {
          enabled: true,
          eyebrow: '',
          title: '',
          titleAccent: '',
          subtitle: '',
        },
        meta: {
          title: '',
          description: '',
        },
      })
      mockHeaders.mockResolvedValue(
        new Headers({
          'x-nonce': 'test-nonce-r7',
          'x-aljazira-pathname': '/en',
          'x-aljazira-search': '',
        }),
      )

      const layoutMeta = await generateLayoutMetadata({
        params: Promise.resolve({ locale: 'en' }),
      })
      const homeMeta = await generateHomeMetadata({
        params: Promise.resolve({ locale: 'en' }),
      })
      expect(/[\u0600-\u06FF]/.test(JSON.stringify(layoutMeta))).toBe(false)
      expect(/[\u0600-\u06FF]/.test(JSON.stringify(homeMeta))).toBe(false)

      const pageEl = await LocaleHomePage({
        params: Promise.resolve({ locale: 'en' }),
      })
      const layoutEl = await LocaleRootLayout({
        params: Promise.resolve({ locale: 'en' }),
        children: pageEl,
      })
      const html = renderToStaticMarkup(layoutEl)
      expect(/[\u0600-\u06FF]/.test(html)).toBe(false)
    })
  })

  describe('5. Public routing when `arabicEnabled = true`', () => {
    beforeEach(() => {
      mockSiteSettings.mockResolvedValue(makeBaseSiteSettings(true))
    })

    it('renders /ar 200 RTL, displays the language switcher in Navbar and Footer, and emits both en and ar in hreflang and sitemap.xml with x-default -> /en', async () => {
      mockHeaders.mockResolvedValue(
        new Headers({
          'x-nonce': 'test-nonce-ar-on',
          'x-aljazira-pathname': '/ar',
          'x-aljazira-search': '',
        }),
      )

      const pageEl = await LocaleHomePage({
        params: Promise.resolve({ locale: 'ar' }),
      })
      const layoutEl = await LocaleRootLayout({
        params: Promise.resolve({ locale: 'ar' }),
        children: pageEl,
      })
      const html = renderToStaticMarkup(layoutEl)

      expect(html).toContain('lang="ar"')
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('href="/en"')
      expect(html).toContain('hrefLang="en"')
      expect(html).toContain('"inLanguage":"ar"')

      expect(buildHreflangAlternates('/projects', true)).toEqual({
        en: '/en/projects',
        ar: '/ar/projects',
        'x-default': '/en/projects',
      })

      const sitemapEntriesOn = await sitemap()
      expect(sitemapEntriesOn.map((e) => e.url).slice(0, 4)).toEqual([
        'http://localhost:3000/en',
        'http://localhost:3000/ar',
        'http://localhost:3000/en/services',
        'http://localhost:3000/ar/services',
      ])
      expect(sitemapEntriesOn).toHaveLength(10)
      expect(sitemapEntriesOn[0]?.alternates?.languages).toEqual({
        en: 'http://localhost:3000/en',
        ar: 'http://localhost:3000/ar',
        'x-default': 'http://localhost:3000/en',
      })
    })
  })
})
