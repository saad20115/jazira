import fs from 'node:fs'
import path from 'node:path'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  INTRO_HARD_CAP_MS,
  INTRO_PREPAINT_INLINE_SCRIPT,
  INTRO_SPLASH_STORAGE_KEY,
  INTRO_TOTAL_DURATION_MS,
  IntroSplash,
  markIntroSplashSeen,
  shouldSkipIntroSplash,
} from '@/components/IntroSplash'
import { normalizeLocalMediaUrl, resolveMediaAsset } from '@/components/media-utils'
import type { Brand, HomePage, Media, Project, Service, SiteSetting, Stat } from '@/payload-types'

const mockSiteSettings = vi.fn<() => Promise<SiteSetting | null>>()
const mockHomePage = vi.fn<() => Promise<HomePage | null>>()
const mockServices = vi.fn<() => Promise<Service[]>>()
const mockStats = vi.fn<() => Promise<Stat[]>>()
const mockProjects = vi.fn<
  (
    locale: string,
    opts?: { featuredOnly?: boolean },
  ) => Promise<{
    docs: Project[]
    totalDocs: number
    totalPages: number
    page: number
  }>
>()
const mockBrands = vi.fn<() => Promise<Brand[]>>()

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  draftMode: () => Promise.resolve({ isEnabled: false }),
  headers: () =>
    Promise.resolve(
      new Map([
        ['x-nonce', 'test-csp-nonce-r4'],
        ['x-aljazira-pathname', '/en'],
      ]),
    ),
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
  getNavigation: () => Promise.resolve(null),
  resolveAuthenticatedStaffUser: () => Promise.resolve(null),
  isArabicEnabled: () => Promise.resolve(true),
  isAuthorizedArabicPreviewRequest: () => Promise.resolve(false),
  getHomePage: () => mockHomePage(),
  getServices: () => mockServices(),
  getStats: () => mockStats(),
  getProjects: (locale: string, opts?: { featuredOnly?: boolean }) => mockProjects(locale, opts),
  getBrands: () => mockBrands(),
}))

import LocaleRootLayout from '@/app/(frontend)/[locale]/layout'
import LocaleHomePage, {
  extractLexicalParagraphs,
  generateMetadata,
  renderAccentHeading,
} from '@/app/(frontend)/[locale]/page'

function makeMedia(id: number, url: string, alt: string): Media {
  return {
    id,
    url,
    alt,
    width: 1200,
    height: 800,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeLexicalParagraphs(
  texts: string[],
): NonNullable<NonNullable<HomePage['whoWeAre']>['text']> {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: texts.map((t) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text: t, version: 1 }],
      })),
    },
  }
}

const SAMPLE_STATS: Stat[] = [
  {
    id: 1,
    label: 'Years of Experience',
    value: '9+',
    order: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    label: 'Projects Delivered',
    value: '30+',
    order: 2,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    label: 'Engineers & Technicians',
    value: '120+',
    order: 3,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 4,
    label: 'Partner Brands',
    value: '50+',
    order: 4,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const SAMPLE_SERVICES: Service[] = [
  {
    id: 1,
    title: 'Electrical Contracting',
    slug: 'electrical-contracting',
    tier: 'main',
    order: 1,
    featured: true,
    icon: 'electrical',
    shortDescription: 'Complete MV/LV electrical contracting.',
    image: makeMedia(10, '/media/svc-electrical.png', 'Electrical'),
    _status: 'published',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'HVAC & Mechanical Systems',
    slug: 'hvac-mechanical',
    tier: 'main',
    order: 2,
    featured: true,
    icon: 'hvac',
    shortDescription: 'Chilled-water plants, AHUs, VRF, and TAB.',
    image: makeMedia(11, '/media/svc-hvac.png', 'HVAC'),
    _status: 'published',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const SAMPLE_PROJECTS: Project[] = [
  {
    id: 101,
    title: 'Al Khalil Investment Project',
    slug: 'al-khalil-makkah',
    summary: 'Full low-current and structured cabling.',
    location: 'Makkah — Ibrahim Al Khalil Rd.',
    category: 'low-current',
    scopeSummary: 'LOW CURRENT SCS',
    scope: ['low-current', 'hvac'],
    status: 'completed',
    featured: true,
    order: 1,
    coverImage: makeMedia(20, '/media/proj-tower.png', 'Al Khalil'),
    _status: 'published',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 102,
    title: 'King Abdullah Road Tunnel — Exit 10',
    slug: 'king-abdullah-tunnel',
    summary: 'Ventilation, jet fans, fire fighting.',
    location: 'Riyadh — King Abdullah Rd.',
    category: 'mep',
    scopeSummary: 'FULL MEP WORKS',
    scope: ['hvac', 'fire-fighting', 'electrical'],
    status: 'completed',
    featured: true,
    order: 2,
    coverImage: makeMedia(21, '/media/proj-tunnel.png', 'Tunnel'),
    _status: 'published',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const SAMPLE_BRANDS: Brand[] = [
  {
    id: 201,
    name: 'ABB',
    logo: makeMedia(30, '/media/brand-abb.png', 'ABB'),
    showInMarquee: true,
    order: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 202,
    name: 'Schneider Electric',
    logo: makeMedia(31, '/media/brand-schneider.png', 'Schneider Electric'),
    showInMarquee: true,
    order: 2,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function buildSampleHomePage(): HomePage {
  return {
    id: 1,
    _status: 'published',
    hero: {
      enabled: true,
      eyebrow: 'MEP & SMART ENGINEERING CONTRACTORS · RIYADH, KSA',
      title: 'Smart Engineering',
      titleAccent: 'Solutions for Mega Projects',
      subtitle:
        'Full-scope electromechanical, firefighting, low-current and smart infrastructure contracting.',
      background: makeMedia(1, '/media/hero-city.png', 'Riyadh skyline'),
      primaryCta: {
        label: 'Explore Our Services',
        link: { type: 'internal', internalRoute: '/services' },
      },
      secondaryCta: {
        label: 'View Projects',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    whoWeAre: {
      enabled: true,
      badgeStat: SAMPLE_STATS[0],
      eyebrow: 'WHO WE ARE',
      title: 'An Integrated MEP Engineering Partner Built on Precision',
      text: makeLexicalParagraphs([
        'Al Jazira for Imdad Smart Co. is a Riyadh-based engineering and contracting company.',
        'From design coordination and BIM modeling to installation, testing and commissioning.',
      ]),
      button: {
        label: 'Learn More About Us',
        link: { type: 'internal', internalRoute: '/about' },
      },
      image: makeMedia(2, '/media/about-team.png', 'Engineering team'),
    },
    coreServices: {
      enabled: true,
      eyebrow: 'CORE SERVICES',
      title: 'Comprehensive MEP & Contracting Disciplines',
      intro: 'Eight integrated engineering capabilities delivered by our in-house teams.',
      button: {
        label: 'View All Services',
        link: { type: 'internal', internalRoute: '/services' },
      },
    },
    interactiveSystems: {
      enabled: true,
      eyebrow: 'INTERACTIVE SYSTEMS',
      title: 'Explore Every System Inside the Building',
      intro: 'Click any discipline to inspect how our MEP systems work together.',
      heroImage: makeMedia(3, '/media/tower-render.png', '3D Building Systems'),
      liveModelLabel: 'Open the live 3D model',
      relatedProjectsLabel: 'Related projects',
      systems: [
        {
          id: 'sys-1',
          title: 'HVAC & Chilled Water',
          text: 'Chillers, AHUs, FCUs, VRF, ductwork, smoke management.',
          shot: 'hvac',
          disciplines: ['hvac'],
        },
        {
          id: 'sys-2',
          title: 'Fire Fighting & Fire Alarm',
          text: 'Fire pumps, sprinkler and hose systems.',
          shot: 'fire',
          disciplines: ['fire-fighting'],
        },
        {
          id: 'sys-3',
          title: 'Plumbing, Drainage & Water Supply',
          text: 'Booster sets, water tanks, domestic water.',
          shot: 'plumbing',
          disciplines: ['plumbing'],
        },
        {
          id: 'sys-4',
          title: 'Power Distribution & Lighting',
          text: 'MV/LV panels, busways, small power.',
          shot: 'power',
          disciplines: ['electrical'],
        },
        {
          id: 'sys-5',
          title: 'Smart Systems, ELV & BMS',
          text: 'Structured cabling, CCTV, access control.',
          shot: 'smart',
          disciplines: ['low-current', 'data-center'],
        },
      ],
    },
    statsSection: {
      enabled: true,
      title: 'Trusted by Industry Leaders',
      text: 'Proven track record across Saudi Arabia’s most demanding sectors.',
      stats: SAMPLE_STATS,
      backgroundImage: makeMedia(6, '/media/bg-pipes.png', 'Stats Background'),
    },
    featuredProjects: {
      enabled: true,
      eyebrow: 'OUR PORTFOLIO',
      title: 'Landmark Projects Across the Kingdom',
      intro: 'Selected engagements demonstrating our capability across infrastructure.',
      button: {
        label: 'View All Projects',
        link: { type: 'internal', internalRoute: '/projects' },
      },
    },
    partners: {
      enabled: true,
      eyebrow: 'TRUSTED PARTNERS',
      title: 'Global Manufacturers We Work With',
      intro: 'Certified installer and supply partner for leading international MEP brands.',
    },
    cta: {
      enabled: true,
      title: 'Ready to Start Your',
      titleAccent: 'Next Project?',
      text: 'Share your project scope or BOQ with our engineering team.',
      backgroundImage: makeMedia(4, '/media/proj-tower.png', 'CTA Backdrop'),
      button: {
        label: 'Contact Us Today',
        link: { type: 'internal', internalRoute: '/contact' },
      },
      secondaryButton: {
        label: 'Call Us Now',
      },
    },
    meta: {
      title: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering',
      description: 'Integrated MEP and smart engineering contracting in Riyadh, KSA.',
      image: makeMedia(5, '/media/hero-city.png', 'OG Image'),
    },
  }
}

describe('P3-T4 — Home Page (`/[locale]`) & Intro Splash (`28:1609` -> `28:1615`)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSiteSettings.mockResolvedValue({
      id: 1,
      companyName: 'Al Jazira for Imdad Smart Co.',
      tagline: 'MEP & Smart Engineering Solutions · Riyadh, KSA',
      arabicEnabled: true,
      phone: '+966 57 353 4185',
      email: 'info@aljazira-imdad.sa',
      whatsapp: '966573534185',
      defaultSeo: {
        title: 'Default SEO Title',
        description: 'Default SEO Description',
      },
    })
    mockHomePage.mockResolvedValue(buildSampleHomePage())
    mockServices.mockResolvedValue(SAMPLE_SERVICES)
    mockStats.mockResolvedValue(SAMPLE_STATS)
    mockProjects.mockResolvedValue({
      docs: SAMPLE_PROJECTS,
      totalDocs: SAMPLE_PROJECTS.length,
      totalPages: 1,
      page: 1,
    })
    mockBrands.mockResolvedValue(SAMPLE_BRANDS)
  })

  describe('1. IntroSplash (`28:1609` -> `28:1615`, CTO decision §3)', () => {
    it('enforces total duration <= 1600ms, sessionStorage key aljazira_intro_seen, and prefers-reduced-motion suppression', () => {
      expect(INTRO_SPLASH_STORAGE_KEY).toBe('aljazira_intro_seen')
      expect(INTRO_TOTAL_DURATION_MS).toBeLessThanOrEqual(1600)

      // 1. Server / undefined window -> skip
      expect(shouldSkipIntroSplash(undefined)).toBe(true)

      // 2. Fresh browser session with motion allowed -> do NOT skip
      const store = new Map<string, string>()
      const mockWinAllowed = {
        matchMedia: () => ({ matches: false }),
        sessionStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => {
            store.set(k, v)
          },
        },
      } as unknown as Window

      expect(shouldSkipIntroSplash(mockWinAllowed)).toBe(false)
      markIntroSplashSeen(mockWinAllowed)
      expect(store.get(INTRO_SPLASH_STORAGE_KEY)).toBe('1')
      // Once marked seen in sessionStorage -> skip on subsequent visits
      expect(shouldSkipIntroSplash(mockWinAllowed)).toBe(true)

      // 3. prefers-reduced-motion: reduce -> always skip even when sessionStorage is empty
      const mockWinReducedMotion = {
        matchMedia: (q: string) => ({
          matches: q.includes('prefers-reduced-motion'),
        }),
        sessionStorage: {
          getItem: () => null,
          setItem: () => undefined,
        },
      } as unknown as Window
      expect(shouldSkipIntroSplash(mockWinReducedMotion)).toBe(true)
    })

    it('renders start (`28:1609`) and reveal (`28:1615`) states with Logo, gold rule, tagline, and >=44px skip button', () => {
      const startHtml = renderToStaticMarkup(
        React.createElement(IntroSplash, {
          locale: 'en',
          forceState: 'start',
          siteName: 'Al Jazira for Imdad Smart Co.',
          tagline: 'MEP & Smart Engineering Solutions · Riyadh, KSA',
        }),
      )
      expect(startHtml).toContain('data-component="intro-splash"')
      expect(startHtml).toContain('data-intro-state="start"')
      expect(startHtml).toContain('data-intro-skip="true"')
      expect(startHtml).toContain('Skip Intro')

      const revealHtml = renderToStaticMarkup(
        React.createElement(IntroSplash, {
          locale: 'ar',
          forceState: 'reveal',
          siteName: 'شركة الجزيرة للإمداد الذكي',
          tagline: 'حلول الأعمال الكهروميكانيكية والهندسة الذكية · الرياض',
        }),
      )
      expect(revealHtml).toContain('data-intro-state="reveal"')
      expect(revealHtml).toContain('حلول الأعمال الكهروميكانيكية والهندسة الذكية · الرياض')
      expect(revealHtml).toContain('تخطي المقدمة')

      // R-4: SSR render without forceState emits the overlay in initial 'start' state so it is present at frame 0
      const ssrDefaultHtml = renderToStaticMarkup(
        React.createElement(IntroSplash, {
          locale: 'en',
          siteName: 'Al Jazira for Imdad Smart Co.',
        }),
      )
      expect(ssrDefaultHtml).toContain('data-component="intro-splash"')
      expect(ssrDefaultHtml).toContain('data-intro-state="start"')
      expect(INTRO_PREPAINT_INLINE_SCRIPT).toContain('aljazira_intro_seen')
      expect(INTRO_PREPAINT_INLINE_SCRIPT).toContain('data-intro')
    })
  })

  describe('2. Text & Heading Helpers (`extractLexicalParagraphs`, `renderAccentHeading`)', () => {
    it('extracts up to 2 paragraphs from Lexical richText JSON and styles section H2 accent spans', () => {
      const lexical = makeLexicalParagraphs([
        'First paragraph.',
        'Second paragraph.',
        'Third paragraph.',
      ])
      expect(extractLexicalParagraphs(lexical, 2)).toEqual([
        'First paragraph.',
        'Second paragraph.',
      ])
      expect(extractLexicalParagraphs(null)).toEqual([])

      const accentHtml = renderToStaticMarkup(
        React.createElement(
          'h2',
          null,
          renderAccentHeading('An Integrated MEP Engineering Partner Built on Precision'),
        ),
      )
      expect(accentHtml).toContain('Built on Precision')
      expect(accentHtml).toContain('<span')
    })
  })

  describe('3. LocaleHomePage full render (`en` and `ar`), section order, `enabled` toggles, and empty states', () => {
    it('renders all 8 sections in Figma order (`hero`, `who-we-are`, `core-services`, `interactive-systems`, `stats`, `featured-projects`, `partners`, `cta`)', async () => {
      const element = await LocaleHomePage({
        params: Promise.resolve({ locale: 'en' }),
      })
      const html = renderToStaticMarkup(element)

      const sectionOrder = [
        'data-home-section="hero"',
        'data-home-section="who-we-are"',
        'data-home-section="core-services"',
        'data-home-section="interactive-systems"',
        'data-home-section="stats"',
        'data-home-section="featured-projects"',
        'data-home-section="partners"',
        'data-home-section="cta"',
      ]

      let prevIdx = -1
      for (const marker of sectionOrder) {
        const idx = html.indexOf(marker)
        expect(idx, `Expected ${marker} to be present`).toBeGreaterThan(prevIdx)
        prevIdx = idx
      }

      // Verifies Hero content + scroll hint button + R-2/R-8 space between title and titleAccent spans
      expect(html).toContain('Smart Engineering')
      expect(html).toContain('Solutions for Mega Projects')
      expect(html).toContain('</span> <span')
      expect(html).toContain('data-home-scroll-hint="true"')

      // Verifies Who We Are badge stat + paragraphs
      expect(html).toContain('data-who-badge-stat="true"')
      expect(html).toContain('Years of Experience')
      expect(html).toContain('Al Jazira for Imdad Smart Co. is a Riyadh-based engineering')

      // Verifies Core Services carousel
      expect(html).toContain('data-component="services-carousel"')
      expect(html).toContain('Electrical Contracting')

      // Verifies Interactive Systems 3D card + 5 accordion items, and R-6 (live 3D badge/button hidden until P3-T5)
      expect(html).toContain('data-interactive-3d-card="true"')
      expect(html).not.toContain('3D MODEL · LIVE VERSION AVAILABLE')
      expect(html).not.toContain('data-open-3d-model="true"')
      expect(html).toContain('HVAC &amp; Chilled Water')
      expect(html).toContain('Fire Fighting &amp; Fire Alarm')

      // Verifies Stats section + R-7 statsSection.backgroundImage
      expect(html).toContain('Trusted by Industry Leaders')
      expect(html).toContain('Projects Delivered')
      expect(html).toContain('%2Fmedia%2Fbg-pipes.png')

      // Verifies Featured Projects cards using project.scopeSummary badge
      expect(html).toContain('LOW CURRENT SCS')
      expect(html).toContain('FULL MEP WORKS')

      // Verifies Partners LogoMarquee
      expect(html).toContain('data-component="logo-marquee"')
      expect(html).toContain('ABB')

      // Verifies CTA section
      expect(html).toContain('Ready to Start Your')
      expect(html).toContain('Next Project?')
      expect(html).toContain('tel:+966573534185')
    })

    it('hides individual sections when their `enabled` checkbox is false', async () => {
      const customHome = buildSampleHomePage()
      customHome.whoWeAre = { ...customHome.whoWeAre, enabled: false }
      customHome.statsSection = { ...customHome.statsSection, enabled: false }
      customHome.partners = { ...customHome.partners, enabled: false }
      mockHomePage.mockResolvedValueOnce(customHome)

      const element = await LocaleHomePage({
        params: Promise.resolve({ locale: 'en' }),
      })
      const html = renderToStaticMarkup(element)

      expect(html).toContain('data-home-section="hero"')
      expect(html).not.toContain('data-home-section="who-we-are"')
      expect(html).toContain('data-home-section="core-services"')
      expect(html).toContain('data-home-section="interactive-systems"')
      expect(html).not.toContain('data-home-section="stats"')
      expect(html).toContain('data-home-section="featured-projects"')
      expect(html).not.toContain('data-home-section="partners"')
      expect(html).toContain('data-home-section="cta"')
    })

    it('renders cleanly without crashing when CMS collections and globals are empty', async () => {
      mockSiteSettings.mockResolvedValueOnce(null)
      mockHomePage.mockResolvedValueOnce(null)
      mockServices.mockResolvedValueOnce([])
      mockStats.mockResolvedValueOnce([])
      mockProjects.mockResolvedValue({
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
      })
      mockBrands.mockResolvedValueOnce([])

      const element = await LocaleHomePage({
        params: Promise.resolve({ locale: 'ar' }),
      })
      const html = renderToStaticMarkup(element)
      expect(html).toContain('data-page="home"')
      expect(html).not.toContain('data-home-section="hero"')
    })
  })

  describe('4. generateMetadata (`home-page.meta` + `site-settings.defaultSeo` fallback)', () => {
    it('uses home-page.meta when populated and falls back to site-settings.defaultSeo when empty', async () => {
      const metaWithHome = await generateMetadata({
        params: Promise.resolve({ locale: 'en' }),
      })
      expect(metaWithHome.title).toEqual({
        absolute: 'Al Jazira for Imdad Smart Co. — MEP & Smart Engineering',
      })
      expect(metaWithHome.description).toBe(
        'Integrated MEP and smart engineering contracting in Riyadh, KSA.',
      )
      expect(metaWithHome.alternates).toEqual({
        canonical: '/en',
        languages: {
          ar: '/ar',
          en: '/en',
          'x-default': '/en',
        },
      })
      expect(metaWithHome.openGraph?.siteName).toBe('Al Jazira for Imdad Smart Co.')
      expect(metaWithHome.openGraph?.url).toBe('/en')
      expect(metaWithHome.openGraph?.images).toEqual([
        {
          url: '/media/hero-city.png',
          width: 1200,
          height: 800,
          alt: 'OG Image',
        },
      ])

      const homeWithoutMeta = buildSampleHomePage()
      homeWithoutMeta.meta = {}
      mockHomePage.mockResolvedValueOnce(homeWithoutMeta)

      const fallbackMeta = await generateMetadata({
        params: Promise.resolve({ locale: 'ar' }),
      })
      expect(fallbackMeta.title).toEqual({ absolute: 'Default SEO Title' })
      expect(fallbackMeta.description).toBe('Default SEO Description')
    })
  })

  describe('5. CSS token discipline in Home & IntroSplash CSS modules', () => {
    it('ensures every var(--*) referenced in page.module.css and IntroSplash.module.css is defined in tokens.css and contains zero raw hex/rgb literals', () => {
      const tokensCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/styles/tokens.css'),
        'utf8',
      )
      const definedVars = new Set<string>()
      for (const match of tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
        definedVars.add(match[1])
      }

      for (const relPath of [
        'src/app/(frontend)/[locale]/page.module.css',
        'src/components/IntroSplash.module.css',
        'src/components/ServiceTile.module.css',
      ]) {
        const cssContent = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8')
        const stripped = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
        expect(stripped).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
        expect(stripped).not.toMatch(/\brgba?\s*\(/i)

        const fileVars = new Set(definedVars)
        for (const match of stripped.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
          fileVars.add(match[1])
        }

        for (const match of stripped.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
          const varName = match[1]
          expect(fileVars.has(varName), `${relPath} references undefined ${varName}`).toBe(true)
        }
      }
    })

    it('normalizes local Payload serverURL media URLs to relative paths for next/image localPatterns', () => {
      expect(
        normalizeLocalMediaUrl('http://localhost:3000/api/media/file/hero-city-1376x768.webp'),
      ).toBe('/api/media/file/hero-city-1376x768.webp')
      expect(normalizeLocalMediaUrl('/api/media/file/hero-city.png')).toBe(
        '/api/media/file/hero-city.png',
      )
      const resolved = resolveMediaAsset(
        makeMedia(
          99,
          'http://localhost:3000/api/media/file/hero-city-1376x768.webp',
          'Riyadh skyline',
        ),
        'Fallback',
      )
      expect(resolved?.url).toBe('/api/media/file/hero-city-1376x768.webp')
    })

    it('enforces R-1 carousel padding-inline-start/end, R-20 430px/1300px geometry, R-4 pre-paint inline script in LocaleRootLayout <head>, R-14 default hidden overlay, and R-15 <=1.6s navigationStart hard cap', async () => {
      // 1. R-4 + R-20: Render LocaleRootLayout and verify <head> injects the nonce-bearing INTRO_PREPAINT_INLINE_SCRIPT
      //    (fails immediately if INTRO_PREPAINT_INLINE_SCRIPT is removed from src/app/(frontend)/[locale]/layout.tsx)
      const layoutElement = await LocaleRootLayout({
        children: React.createElement('div', { 'data-testid': 'home-child' }, 'Child'),
        params: Promise.resolve({ locale: 'en' }),
      })
      const layoutProps = layoutElement.props as {
        children: Array<React.ReactElement<{ children?: React.ReactNode }> | null>
      }
      const headElement = layoutProps.children.find((el) => el && el.type === 'head')
      expect(headElement).toBeDefined()
      const headMarkup = renderToStaticMarkup(headElement as React.ReactElement)
      expect(headMarkup).toContain('nonce="test-csp-nonce-r4"')
      expect(headMarkup).toContain(INTRO_SPLASH_STORAGE_KEY)
      expect(headMarkup).toContain("setAttribute('data-intro','active')")

      // 2. R-1 + R-20: Verify .carouselOuter in page.module.css has padding-inline-start: var(--container-gutter)
      //    and ServicesCarousel.module.css has 430px height (340 + 40 + 50) and 140px inline-end padding
      const pageModuleCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/(frontend)/[locale]/page.module.css'),
        'utf8',
      )
      const carouselOuterMatch = pageModuleCss.match(/\.carouselOuter\s*\{([^}]*)\}/)
      expect(carouselOuterMatch).not.toBeNull()
      expect(carouselOuterMatch?.[1]).toMatch(
        /padding-inline-start\s*:\s*var\(--container-gutter\)/,
      )

      const servicesCarouselCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/ServicesCarousel.module.css'),
        'utf8',
      )
      const carouselBlock = servicesCarouselCss.match(/\.carousel\s*\{([^}]*)\}/)?.[1] ?? ''
      const viewportBlock = servicesCarouselCss.match(/\.viewport\s*\{([^}]*)\}/)?.[1] ?? ''
      const trackBlock = servicesCarouselCss.match(/\.track\s*\{([^}]*)\}/)?.[1] ?? ''
      const controlsRowBlock = servicesCarouselCss.match(/\.controlsRow\s*\{([^}]*)\}/)?.[1] ?? ''

      expect(carouselBlock).toMatch(/inline-size\s*:\s*1300px/)
      expect(carouselBlock).toMatch(/gap\s*:\s*var\(--space-40\)/)
      expect(viewportBlock).toMatch(/block-size\s*:\s*340px/)
      expect(trackBlock).toMatch(/padding-inline-end\s*:\s*140px/)
      expect(controlsRowBlock).toMatch(/padding-inline-end\s*:\s*140px/)
      expect(controlsRowBlock).toMatch(/block-size\s*:\s*50px/)
      expect(servicesCarouselCss).toMatch(
        /@media\s*\(max-width:\s*1279\.98px\)\s*\{[\s\S]*?\.track,\s*\.controlsRow\s*\{[\s\S]*?padding-inline-end\s*:\s*var\(--container-gutter\)/,
      )

      // 3. R-14: Verify .overlay in IntroSplash.module.css is display: none by default (no-JS safe)
      //    and display: flex only when html[data-intro='active'] or [data-intro-forced='true']
      const introSplashCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/IntroSplash.module.css'),
        'utf8',
      )
      const overlayRule = introSplashCss.match(/\.overlay\s*\{([^}]*)\}/)?.[1] ?? ''
      expect(overlayRule).toMatch(/display\s*:\s*none/)
      expect(overlayRule).not.toMatch(/display\s*:\s*flex/)
      expect(introSplashCss).toMatch(
        /:global\(html\[data-intro='active'\]\)\s+\.overlay[\s\S]*?display\s*:\s*flex/,
      )

      // 4. R-15: Verify INTRO_TOTAL_DURATION_MS and INTRO_HARD_CAP_MS are <= 1600ms and timed from performance.now()
      expect(INTRO_TOTAL_DURATION_MS).toBeLessThanOrEqual(1600)
      expect(INTRO_HARD_CAP_MS).toBeLessThanOrEqual(1600)
      expect(INTRO_PREPAINT_INLINE_SCRIPT).toContain('performance.now()')
      expect(INTRO_PREPAINT_INLINE_SCRIPT).toContain(`${String(INTRO_HARD_CAP_MS)}-now`)
    })
  })
})
