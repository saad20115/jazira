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
  Footer,
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
import { Navbar } from '@/components/Navbar'
import {
  NAV_LINK_STATES,
  NAV_LINK_THEMES,
  NavLink,
} from '@/components/NavLink'
import {
  WhatsAppFab,
  WHATSAPP_FAB_STATES,
} from '@/components/WhatsAppFab'
import { switchLocaleInPathname } from '@/i18n'

let mockedPathname = '/ar/services'

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

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

  describe('5. Navbar, language switcher & mobile drawer', () => {
    it('preserves the current route when switching locales via switchLocaleInPathname', () => {
      expect(switchLocaleInPathname('/ar', 'en')).toBe('/en')
      expect(switchLocaleInPathname('/en', 'ar')).toBe('/ar')
      expect(switchLocaleInPathname('/ar/services/firefighting', 'en')).toBe(
        '/en/services/firefighting',
      )
      expect(switchLocaleInPathname('/en/projects/riyadh-metro', 'ar')).toBe(
        '/ar/projects/riyadh-metro',
      )
      expect(switchLocaleInPathname('/', 'en')).toBe('/en')
    })

    it('renders Navbar in Light/Dark themes with active link and language switcher keeping current path', () => {
      mockedPathname = '/ar/services'
      const arHtml = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'ar',
          theme: 'Light',
        }),
      )
      expect(arHtml).toContain('data-navbar-theme="Light"')
      expect(arHtml).toContain('href="/en/services"')
      expect(arHtml).toContain('hrefLang="en"')
      expect(arHtml).toContain('aria-current="page"')
      expect(arHtml).toContain('aria-expanded="false"')

      mockedPathname = '/en'
      const enDarkHtml = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'en',
          theme: 'Dark',
        }),
      )
      expect(enDarkHtml).toContain('data-navbar-theme="Dark"')
      expect(enDarkHtml).toContain('href="/ar"')
      expect(enDarkHtml).toContain('hrefLang="ar"')
    })

    it('renders the mobile dialog drawer when open with aria-expanded="true", role="dialog",aria-modal="true", language switcher, and CTA', () => {
      mockedPathname = '/ar/projects'
      const drawerOpenHtml = renderToStaticMarkup(
        React.createElement(Navbar, {
          locale: 'ar',
          defaultDrawerOpen: true,
        }),
      )
      expect(drawerOpenHtml).toContain('aria-expanded="true"')
      expect(drawerOpenHtml).toContain('role="dialog"')
      expect(drawerOpenHtml).toContain('aria-modal="true"')
      expect(drawerOpenHtml).toContain('data-navbar-drawer="open"')
      expect(drawerOpenHtml).toContain('data-language-switcher="drawer"')
      expect(drawerOpenHtml).toContain('href="/en/projects"')
    })
  })

  describe('6. Footer', () => {
    it('renders Footer with icon-only social links having explicit aria-labels in ar and en', () => {
      const arFooterHtml = renderToStaticMarkup(
        React.createElement(Footer, { locale: 'ar' }),
      )
      expect(arFooterHtml).toContain('data-component="footer"')
      for (const platform of SOCIAL_ICON_KEYS) {
        expect(arFooterHtml).toContain(`data-social-platform="${platform}"`)
      }
      expect(arFooterHtml).toContain('aria-label="تابع الجزيرة على لينكدإن"')
      expect(arFooterHtml).toContain('dir="ltr"')

      const enFooterHtml = renderToStaticMarkup(
        React.createElement(Footer, { locale: 'en' }),
      )
      expect(enFooterHtml).toContain('aria-label="Follow Al Jazira on LinkedIn"')
      expect(enFooterHtml).toContain('aria-label="Chat with Al Jazira on WhatsApp"')
    })
  })

  describe('7. WhatsAppFab', () => {
    it('renders Idle, Pulse, and Hover states with normalized wa.me URL and RTL/reduced-motion CSS rules', () => {
      expect(normalizeWhatsappDigits('+966 57 353 4185')).toBe('966573534185')
      expect(normalizeWhatsappDigits('0573534185')).toBe('966573534185')
      expect(normalizeWhatsappDigits('00966502255688')).toBe('966502255688')

      for (const state of WHATSAPP_FAB_STATES) {
        const html = renderToStaticMarkup(
          React.createElement(WhatsAppFab, {
            locale: 'ar',
            state,
            whatsapp: '+966 57 353 4185',
          }),
        )
        expect(html).toContain(`data-whatsapp-fab-state="${state}"`)
        expect(html).toContain('href="https://wa.me/966573534185"')
      }

      const fabCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/WhatsAppFab.module.css'),
        'utf8',
      )
      expect(fabCss).toContain('inset-inline-end: 24px')
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
    it('renders all 9 component sections in development and throws notFound() in production', async () => {
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

  describe('11. CSS custom property references integrity', () => {
    it('ensures every var(--*) referenced in P3-T2 CSS modules is defined in src/styles/tokens.css', () => {
      const tokensCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/styles/tokens.css'),
        'utf8',
      )
      const definedVars = new Set<string>()
      for (const match of tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
        definedVars.add(match[1])
      }

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
})
