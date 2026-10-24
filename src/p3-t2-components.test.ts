import fs from 'node:fs'
import path from 'node:path'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import StyleguidePage from '@/app/(frontend)/[locale]/styleguide/page'
import { Accordion, AccordionItem } from '@/components/Accordion'
import {
  Button,
  BUTTON_SIZES,
  BUTTON_STATES,
  BUTTON_VARIANTS,
} from '@/components/Button'
import { Eyebrow, EYEBROW_TONES } from '@/components/Eyebrow'
import {
  buildDefaultFooterQuickLinks,
  Footer,
  getSocialAriaLabel,
  normalizeWhatsappDigits,
} from '@/components/Footer'
import {
  ArrowRightIcon,
  SERVICE_ICON_KEYS,
  SERVICE_ICON_OPTIONS,
  ServiceIcon,
  SOCIAL_ICON_KEYS,
  SocialIcon,
} from '@/components/icons'
import {
  getLogoAssetSrc,
  Logo,
  LOGO_COLORS,
  LOGO_TYPES,
} from '@/components/Logo'
import {
  buildDefaultNavbarItems,
  buildLanguageSwitchHref,
  isNavItemActive,
  Navbar,
  trapDrawerFocusOnTab,
} from '@/components/Navbar'
import {
  NAV_LINK_STATES,
  NAV_LINK_THEMES,
  NavLink,
} from '@/components/NavLink'
import {
  WhatsAppFab,
  WHATSAPP_FAB_STATES,
} from '@/components/WhatsAppFab'
import { getDictionary, switchLocaleInPathname } from '@/i18n'

let mockedPathname = '/ar/services'

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

function srgbChannelToLinear(channel8Bit: number): number {
  const c = channel8Bit / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace(/^#/, '')
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b)
}

function wcagContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA)
  const lumB = relativeLuminance(hexB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('P3-T2 — Shell & primitives + styleguide route', () => {
  afterEach(() => {
    mockedPathname = '/ar/services'
    vi.unstubAllEnvs()
  })

  describe('1. Logo & public/brand/*.svg assets', () => {
    it('renders all 15 Logo type × color variants and verifies optimised SVGs in public/brand/', () => {
      for (const type of LOGO_TYPES) {
        for (const color of LOGO_COLORS) {
          const expectedSrc = getLogoAssetSrc(type, color)
          expect(expectedSrc).toBe(`/brand/${type.toLowerCase()}-${color.toLowerCase()}.svg`)

          const diskPath = path.resolve(process.cwd(), 'public', expectedSrc.slice(1))
          expect(fs.existsSync(diskPath)).toBe(true)

          const svgContent = fs.readFileSync(diskPath, 'utf8')
          expect(svgContent).toContain('viewBox=')
          expect(svgContent.toLowerCase()).not.toContain('<script')
          expect(svgContent.toLowerCase()).not.toMatch(/\son[a-z]+\s*=/)

          const html = renderToStaticMarkup(
            React.createElement(Logo, { type, color, alt: 'Al Jazira' }),
          )
          expect(html).toContain(`src="${expectedSrc}"`)
          expect(html).toContain(`data-logo-type="${type}"`)
          expect(html).toContain(`data-logo-color="${color}"`)
        }
      }
    })
  })

  describe('2. Button', () => {
    it('renders all 4 variants × 4 states and sizes as <button> or <a> via <CmsLink>', () => {
      for (const variant of BUTTON_VARIANTS) {
        for (const state of BUTTON_STATES) {
          const html = renderToStaticMarkup(
            React.createElement(Button, {
              variant,
              state,
              label: 'Request a Quote',
            }),
          )
          expect(html).toContain('<button')
          expect(html).toContain(`data-button-variant="${variant}"`)
          expect(html).toContain(`data-button-state="${state}"`)
          if (state === 'Disabled') {
            expect(html).toContain('disabled=""')
            expect(html).toContain('aria-disabled="true"')
          }
        }
      }

      for (const size of BUTTON_SIZES) {
        const html = renderToStaticMarkup(
          React.createElement(Button, {
            size,
            href: '/ar/contact',
            locale: 'ar',
            label: 'اطلب عرض سعر',
          }),
        )
        expect(html).toContain('<a')
        expect(html).toContain('href="/ar/contact"')
        expect(html).toContain(`data-button-size="${size}"`)
      }

      const disabledLinkButtonHtml = renderToStaticMarkup(
        React.createElement(Button, {
          href: '/ar/contact',
          disabled: true,
          label: 'Disabled CTA',
        }),
      )
      expect(disabledLinkButtonHtml).toContain('<button')
      expect(disabledLinkButtonHtml).toContain('disabled=""')
    })
  })

  describe('3. Eyebrow', () => {
    it('renders Light and Dark tones with leading gold dot', () => {
      for (const tone of EYEBROW_TONES) {
        const html = renderToStaticMarkup(
          React.createElement(Eyebrow, { tone, label: 'MEP CONTRACTING' }),
        )
        expect(html).toContain(`data-eyebrow-tone="${tone}"`)
        expect(html).toContain('MEP CONTRACTING')
      }
    })
  })

  describe('4. NavLink', () => {
    it('renders Light/Dark × Default/Hover/Active and sets aria-current="page" on Active', () => {
      for (const theme of NAV_LINK_THEMES) {
        for (const state of NAV_LINK_STATES) {
          const html = renderToStaticMarkup(
            React.createElement(NavLink, {
              theme,
              state,
              href: '/en/services',
              label: 'Services',
            }),
          )
          expect(html).toContain(`data-nav-link-theme="${theme}"`)
          expect(html).toContain(`data-nav-link-state="${state}"`)
          if (state === 'Active') {
            expect(html).toContain('aria-current="page"')
          } else {
            expect(html).not.toContain('aria-current="page"')
          }
        }
      }
    })
  })

  describe('5. Navbar, CMS internalRoute active state (R-2), empty CMS hiding (R-3), language switcher (R-11) & mobile drawer', () => {
    it('preserves the current route when switching locales via switchLocaleInPathname and buildLanguageSwitchHref', () => {
      expect(switchLocaleInPathname('/ar', 'en')).toBe('/en')
      expect(switchLocaleInPathname('/en', 'ar')).toBe('/ar')
      expect(switchLocaleInPathname('/ar/services/firefighting', 'en')).toBe(
        '/en/services/firefighting',
      )
      expect(switchLocaleInPathname('/en/projects/riyadh-metro', 'ar')).toBe(
        '/ar/projects/riyadh-metro',
      )
      expect(switchLocaleInPathname('/', 'en')).toBe('/en')
      expect(buildLanguageSwitchHref('/ar/services', 'ar')).toBe('/en/services')
      expect(buildLanguageSwitchHref('/en/projects', 'en')).toBe('/ar/projects')
    })

    it('resolves CMS link.internalRoute values ("services", "/services", "home", "/", "about", "projects", "contact") in isNavItemActive and sets aria-current="page" (R-2)', () => {
      expect(
        isNavItemActive(
          { label: 'Services', link: { type: 'internal', internalRoute: 'services' } },
          '/en/services',
          'en',
        ),
      ).toBe(true)
      expect(
        isNavItemActive(
          { label: 'Services', link: { type: 'internal', internalRoute: 'services' } },
          '/en/services/hvac-mechanical',
          'en',
        ),
      ).toBe(true)
      expect(
        isNavItemActive(
          { label: 'Services', link: { type: 'internal', internalRoute: 'services' } },
          '/en/projects',
          'en',
        ),
      ).toBe(false)
      expect(
        isNavItemActive(
          { label: 'Home', link: { type: 'internal', internalRoute: 'home' } },
          '/ar',
          'ar',
        ),
      ).toBe(true)
      expect(
        isNavItemActive(
          { label: 'Home', link: { type: 'internal', internalRoute: '/' } },
          '/ar/services',
          'ar',
        ),
      ).toBe(false)
      expect(
        isNavItemActive(
          { label: 'About', link: { type: 'internal', internalRoute: 'about' } },
          '/ar/about',
          'ar',
        ),
      ).toBe(true)

      mockedPathname = '/ar/services'
      const cmsNavbarHtml = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'ar',
          items: [
            { id: '1', label: 'الرئيسية', link: { type: 'internal', internalRoute: 'home' } },
            { id: '2', label: 'خدماتنا', link: { type: 'internal', internalRoute: 'services' } },
          ],
          ctaLabel: 'اطلب عرض سعر',
          ctaLink: { type: 'internal', internalRoute: 'contact', label: 'اطلب عرض سعر' },
        }),
      )
      // R-1: Default theme on Home / public pages is Light
      expect(cmsNavbarHtml).toContain('data-navbar-theme="Light"')
      expect(cmsNavbarHtml).toContain('aria-current="page"')
      expect(cmsNavbarHtml).toContain('href="/ar/services"')
      expect(cmsNavbarHtml).toContain('href="/en/services"')
      // R-11: Language switcher aria-label includes visible text ("EN" on ar, "ع" on en)
      expect(getDictionary('en').nav.languageSwitcherAriaLabel).toContain('ع')
      expect(getDictionary('ar').nav.languageSwitcherAriaLabel).toContain('EN')
    })

    it('hides nav links and CTA button when CMS navigation is empty (R-3)', () => {
      mockedPathname = '/ar'
      const emptyNavbarHtml = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'ar',
        }),
      )
      expect(emptyNavbarHtml).toContain('data-navbar-theme="Light"')
      expect(emptyNavbarHtml).not.toContain('<nav')
      expect(emptyNavbarHtml).not.toContain('data-component="button"')
      expect(emptyNavbarHtml).not.toContain('/contact#quote')
    })

    it('renders the mobile dialog drawer when open with aria-expanded="true", role="dialog", aria-modal="true", language switcher, and CTA', () => {
      mockedPathname = '/ar/projects'
      const drawerOpenHtml = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'ar',
          defaultDrawerOpen: true,
          items: buildDefaultNavbarItems('ar'),
          ctaLabel: 'اطلب عرض سعر',
          ctaHref: '/ar/contact#quote',
        }),
      )
      expect(drawerOpenHtml).toContain('aria-expanded="true"')
      expect(drawerOpenHtml).toContain('role="dialog"')
      expect(drawerOpenHtml).toContain('aria-modal="true"')
      expect(drawerOpenHtml).toContain('data-navbar-drawer="open"')
      expect(drawerOpenHtml).toContain('href="/en/projects"')
      expect(typeof trapDrawerFocusOnTab).toBe('function')
    })
  })

  describe('6. Footer (R-1, R-3, R-4, R-5, R-6)', () => {
    it('renders all CMS footer columns with their CMS titles, ctaWhatsappLabel, platform-mapped social icons (with generic link fallback for unknown platforms), and copyright-only bottom bar', () => {
      const sampleSocials = [
        { platform: 'linkedin', url: 'https://www.linkedin.com' },
        { platform: 'x', url: 'https://x.com' },
        { platform: 'instagram', url: 'https://www.instagram.com' },
        { platform: 'facebook', url: 'https://www.facebook.com' },
        { platform: 'youtube', url: 'https://www.youtube.com/@aljazira' },
        { platform: 'threads', url: 'https://www.threads.net/@aljazira' },
      ]
      const enFooterHtml = renderToStaticMarkup(
        React.createElement(Footer, {
          locale: 'en',
          phones: ['+966 57 353 4185'],
          emails: ['info@aljazira.co'],
          address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
          whatsapp: '+966573534185',
          socialLinks: sampleSocials,
          footerColumns: [
            {
              id: 'col-1',
              title: 'Company Links',
              links: buildDefaultFooterQuickLinks('en'),
            },
            {
              id: 'col-2',
              title: 'Core Divisions',
              links: [{ id: 'mep', label: 'MEP Contracting', href: '/en/services' }],
            },
          ],
          ctaTitle: 'Have a project in mind?',
          ctaBody: 'Send us your drawings or BOQ.',
          ctaButtonLabel: 'Get a Quote',
          ctaButtonHref: '/en/contact#quote',
          ctaWhatsappLabel: 'Message Engineers on WhatsApp',
          copyright: '© 2026 Al Jazira for Imdad Smart Co.',
        }),
      )
      expect(enFooterHtml).toContain('data-component="footer"')
      // R-4 & R-15: Both CMS footer columns and their CMS titles are rendered with data-link-columns="2", plus ctaWhatsappLabel
      expect(enFooterHtml).toContain('data-link-columns="2"')
      expect(enFooterHtml).toContain('Company Links')
      expect(enFooterHtml).toContain('Core Divisions')
      expect(enFooterHtml).toContain('Message Engineers on WhatsApp')
      // R-5: YouTube gets social-youtube and aria-label="YouTube" (never WhatsApp); unknown "threads" gets generic social-link and aria-label="threads"
      expect(enFooterHtml).toContain('data-icon="social-youtube"')
      expect(enFooterHtml).toContain('aria-label="YouTube"')
      expect(enFooterHtml).toContain('data-icon="social-link"')
      expect(enFooterHtml).toContain('aria-label="threads"')
      expect(getSocialAriaLabel('en', 'youtube')).toBe('YouTube')
      expect(getSocialAriaLabel('en', 'threads')).toBe('threads')
      // R-6 & R-16: Bottom bar has copyright and language switcher (`docs/05-design.md` §8), and no invented "Privacy Policy"
      expect(enFooterHtml).toContain('© 2026 Al Jazira for Imdad Smart Co.')
      expect(enFooterHtml).toContain('data-testid="footer-language-switcher"')
      expect(enFooterHtml).toContain('href="/ar"')
      expect(enFooterHtml).toContain('hrefLang="ar"')
      expect(enFooterHtml).not.toContain('Privacy Policy')

      // R-3: Empty CMS props (even when whatsapp is set on SiteSettings) hide quick links, CTA card, socials, and bottom bar
      const emptyFooterWithWhatsappOnlyHtml = renderToStaticMarkup(
        React.createElement(Footer, { locale: 'en', whatsapp: '+966573534185' }),
      )
      expect(emptyFooterWithWhatsappOnlyHtml).not.toContain('<nav')
      expect(emptyFooterWithWhatsappOnlyHtml).not.toContain('Chat on WhatsApp')
      expect(emptyFooterWithWhatsappOnlyHtml).not.toContain('Get a Quote')
      expect(emptyFooterWithWhatsappOnlyHtml).not.toContain('Privacy Policy')
    })
  })

  describe('7. WhatsAppFab (R-1, R-7)', () => {
    it('renders Idle, Pulse, and Hover states with normalized wa.me URL, 30px inset, and RTL-safe symmetric inset: -25px; margin: auto pulseRing', () => {
      expect(normalizeWhatsappDigits('+966 57 353 4185')).toBe('966573534185')
      expect(normalizeWhatsappDigits('0573534185')).toBe('0573534185')
      expect(normalizeWhatsappDigits('00966502255688')).toBe('00966502255688')
      expect(normalizeWhatsappDigits('')).toBe('')

      expect(
        renderToStaticMarkup(React.createElement(WhatsAppFab, { locale: 'ar' })),
      ).toBe('')

      for (const state of WHATSAPP_FAB_STATES) {
        const html = renderToStaticMarkup(
          React.createElement(WhatsAppFab, {
            locale: 'en',
            state,
            whatsapp: '+966 57 353 4185',
          }),
        )
        expect(html).toContain(`data-whatsapp-fab-state="${state}"`)
        expect(html).toContain('href="https://wa.me/966573534185"')
        expect(html).toContain('Chat with us on WhatsApp')
      }

      const fabCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/WhatsAppFab.module.css'),
        'utf8',
      )
      expect(fabCss).toContain('inset-block-end: 30px')
      expect(fabCss).toContain('inset-inline-end: 30px')
      expect(fabCss).toContain('margin: auto')
      expect(fabCss).not.toContain('translate(-50%, -50%)')
      expect(fabCss).toContain('prefers-reduced-motion: reduce')
      expect(fabCss).toContain('animation: none')
    })
  })

  describe('8. Accordion & AccordionItem', () => {
    it('renders Collapsed and Expanded states with button + aria-expanded + aria-controls + region panel', () => {
      const collapsedHtml = renderToStaticMarkup(
        React.createElement(AccordionItem, {
          locale: 'en',
          id: 'acc-1',
          numberBadge: '01',
          title: 'Engineering & Shop Drawings',
          body: 'Detailed BIM coordination.',
          state: 'Collapsed',
        }),
      )
      expect(collapsedHtml).toContain('data-accordion-state="Collapsed"')
      expect(collapsedHtml).toContain('aria-expanded="false"')
      expect(collapsedHtml).toContain('aria-controls="acc-1-panel"')
      expect(collapsedHtml).toContain('id="acc-1-panel"')
      expect(collapsedHtml).toContain('hidden=""')
      expect(collapsedHtml).toContain('Show details')

      const expandedHtml = renderToStaticMarkup(
        React.createElement(AccordionItem, {
          locale: 'en',
          id: 'acc-2',
          numberBadge: '02',
          title: 'Testing & Commissioning',
          body: 'Full NFPA 72 commissioning.',
          state: 'Expanded',
        }),
      )
      expect(expandedHtml).toContain('data-accordion-state="Expanded"')
      expect(expandedHtml).toContain('aria-expanded="true"')
      expect(expandedHtml).toContain('aria-controls="acc-2-panel"')
      expect(expandedHtml).not.toContain('hidden=""')
      expect(expandedHtml).toContain('Hide details')

      const listHtml = renderToStaticMarkup(
        React.createElement(Accordion, {
          locale: 'ar',
          items: [
            { title: 'البند الأول', body: 'تفاصيل البند الأول', defaultExpanded: false },
            { title: 'البند الثاني', body: 'تفاصيل البند الثاني', defaultExpanded: true },
          ],
        }),
      )
      expect(listHtml).toContain('data-component="accordion"')
      expect(listHtml).toContain('عرض التفاصيل')
      expect(listHtml).toContain('إخفاء التفاصيل')
    })
  })

  describe('9. Icons (10 Service + 5 Social + Directional RTL)', () => {
    it('exports all 10 service icons matching SERVICE_ICON_OPTIONS, 5 social icons, and directional icon with RTL flip marker', () => {
      expect(SERVICE_ICON_KEYS).toHaveLength(10)
      expect(SERVICE_ICON_OPTIONS.map((o) => o.value)).toEqual([...SERVICE_ICON_KEYS])

      for (const iconKey of SERVICE_ICON_KEYS) {
        const html = renderToStaticMarkup(
          React.createElement(ServiceIcon, { name: iconKey }),
        )
        expect(html).toContain(`data-icon="service-${iconKey}"`)
        expect(html).toContain('viewBox="0 0 20 20"')
      }

      for (const socialKey of SOCIAL_ICON_KEYS) {
        const html = renderToStaticMarkup(
          React.createElement(SocialIcon, { name: socialKey }),
        )
        expect(html).toContain(`data-icon="social-${socialKey}"`)
        expect(html).toContain('viewBox="0 0 20 20"')
      }

      const arrowHtml = renderToStaticMarkup(React.createElement(ArrowRightIcon))
      expect(arrowHtml).toContain('data-directional-icon="true"')
    })
  })

  describe('10. /[locale]/styleguide route (dev-only; 404 in production)', () => {
    it('renders all component sections in development and throws notFound() in production', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const element = await StyleguidePage({
        params: Promise.resolve({ locale: 'ar' }),
      })
      const html = renderToStaticMarkup(element)
      for (const section of [
        'logo',
        'button',
        'eyebrow',
        'nav-link',
        'navbar',
        'footer',
        'whatsapp-fab',
        'accordion-item',
        'icons',
      ]) {
        expect(html).toContain(`data-styleguide-section="${section}"`)
      }

      vi.stubEnv('NODE_ENV', 'production')
      await expect(
        StyleguidePage({
          params: Promise.resolve({ locale: 'ar' }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND')
    })
  })

  describe('11. CSS custom property references & WCAG contrast ratios (docs/05-design.md §19, R-12, R-18)', () => {
    it('ensures every var(--*) referenced in P3-T2 CSS modules is defined in src/styles/tokens.css and verifies contrast ratios directly from tokens.css', () => {
      const tokensCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/styles/tokens.css'),
        'utf8',
      )
      const definedVars = new Map<string, string>()
      for (const match of tokensCss.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
        definedVars.set(match[1], match[2].trim())
      }
      expect(definedVars.has('--gold-700')).toBe(true)

      const gold700 = definedVars.get('--gold-700') ?? ''
      const white = definedVars.get('--white') ?? ''
      const surface = definedVars.get('--surface') ?? ''
      const gold50 = definedVars.get('--gold-50') ?? ''
      const navy950 = definedVars.get('--navy-950') ?? ''
      const gold300 = definedVars.get('--gold-300') ?? ''
      const textBody = definedVars.get('--text-body') ?? ''

      expect(textBody).toBe('#5b6475')

      // docs/05-design.md §19 contrast checks parsed directly from src/styles/tokens.css:
      expect(wcagContrastRatio(gold700, white)).toBeGreaterThanOrEqual(4.5)
      expect(wcagContrastRatio(gold700, surface)).toBeGreaterThanOrEqual(4.5)
      expect(wcagContrastRatio(gold700, gold50)).toBeGreaterThanOrEqual(4.5)
      expect(wcagContrastRatio(navy950, white)).toBeGreaterThanOrEqual(15)
      expect(wcagContrastRatio(navy950, gold50)).toBeGreaterThanOrEqual(15)
      expect(wcagContrastRatio(gold300, navy950)).toBeGreaterThanOrEqual(10)
      expect(wcagContrastRatio(textBody, white)).toBeGreaterThanOrEqual(4.5)

      const cssFiles = [
        'src/components/Logo.module.css',
        'src/components/Button.module.css',
        'src/components/Eyebrow.module.css',
        'src/components/NavLink.module.css',
        'src/components/Navbar.module.css',
        'src/components/Footer.module.css',
        'src/components/WhatsAppFab.module.css',
        'src/components/Accordion.module.css',
        'src/app/(frontend)/[locale]/styleguide/styleguide.module.css',
      ]

      for (const relPath of cssFiles) {
        const cssContent = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8')
        for (const match of cssContent.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
          const varName = match[1]
          expect(definedVars.has(varName), `${relPath} references undefined ${varName}`).toBe(true)
        }
      }
    })
  })

  describe('12. Direct unit verification of trapDrawerFocusOnTab from Navbar.tsx (R-9, R-14)', () => {
    it('wraps Tab from last focusable to first and Shift+Tab from first to last while skipping disabled and aria-hidden elements', () => {
      let focusedEl: unknown = null
      const makeFocusable = (id: string, opts?: { disabled?: boolean; ariaHidden?: boolean }) => {
        const el = {
          id,
          focus: () => {
            focusedEl = el
          },
          hasAttribute: (name: string) => (name === 'disabled' ? Boolean(opts?.disabled) : false),
          getAttribute: (name: string) =>
            name === 'aria-hidden' ? (opts?.ariaHidden ? 'true' : null) : null,
        }
        return el as unknown as HTMLElement
      }

      const first = makeFocusable('brand-link')
      const disabledBtn = makeFocusable('disabled-btn', { disabled: true })
      const middle = makeFocusable('nav-services')
      const hiddenLink = makeFocusable('hidden-link', { ariaHidden: true })
      const last = makeFocusable('cta-button')
      const allChildren = [first, disabledBtn, middle, hiddenLink, last]

      const panel = {
        querySelectorAll: () => allChildren,
        contains: (target: Node | null) => allChildren.includes(target as unknown as HTMLElement),
      } as unknown as HTMLElement

      // 1. Forward Tab on last element wraps to first
      focusedEl = last
      const tabFromLastResult = trapDrawerFocusOnTab(panel, last, false)
      expect(tabFromLastResult).toBe(first)
      expect(focusedEl).toBe(first)

      // 2. Backward Shift+Tab on first element wraps to last
      focusedEl = first
      const shiftTabFromFirstResult = trapDrawerFocusOnTab(panel, first, true)
      expect(shiftTabFromFirstResult).toBe(last)
      expect(focusedEl).toBe(last)

      // 3. Forward Tab on middle element returns null and keeps focus unchanged
      focusedEl = middle
      const tabFromMiddleResult = trapDrawerFocusOnTab(panel, middle, false)
      expect(tabFromMiddleResult).toBeNull()
      expect(focusedEl).toBe(middle)

      // 4. Tab when focus is outside panel wraps to first (or last with shiftKey)
      focusedEl = null
      const tabFromOutsideResult = trapDrawerFocusOnTab(panel, null, false)
      expect(tabFromOutsideResult).toBe(first)
      expect(focusedEl).toBe(first)
    })
  })
})
