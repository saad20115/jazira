import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'

import StyleguidePage from '@/app/(frontend)/[locale]/styleguide/page'
import { Avatar } from '@/components/Avatar'
import { BrandTile } from '@/components/BrandTile'
import { LogoMarquee } from '@/components/LogoMarquee'
import { extractInitials, resolveMediaAsset } from '@/components/media-utils'
import { PartnerTile } from '@/components/PartnerTile'
import { Portrait } from '@/components/Portrait'
import { ProjectCard } from '@/components/ProjectCard'
import { ServiceCard } from '@/components/ServiceCard'
import { ServicesCarousel } from '@/components/ServicesCarousel'
import { ServiceTile } from '@/components/ServiceTile'
import { TeamCard, type TeamCardState } from '@/components/TeamCard'
import { TeamMarquee } from '@/components/TeamMarquee'
import { TeamMember } from '@/components/TeamMember'
import type { Brand, Media, Project, Service, Team } from '@/payload-types'

const mockedPathname = '/ar/services'

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

const SAMPLE_MEDIA: Media = {
  id: 501,
  alt: 'Sample engineering image',
  url: '/media/sample-full.webp',
  width: 1200,
  height: 800,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sizes: {
    thumb: {
      url: '/media/sample-thumb.webp',
      width: 400,
      height: 300,
    },
    card: {
      url: '/media/sample-card.webp',
      width: 800,
      height: 600,
    },
  },
}

const SAMPLE_SERVICE: Pick<
  Service,
  'id' | 'title' | 'slug' | 'icon' | 'shortDescription' | 'image' | 'order' | 'featured'
> = {
  id: 10,
  title: 'General Contracting',
  slug: 'general-contracting',
  icon: 'contracting',
  shortDescription: 'Civil, structural & architectural turn-key solutions',
  image: SAMPLE_MEDIA,
  order: 0,
  featured: false,
}

const SAMPLE_PROJECT_COMPLETED: Pick<
  Project,
  'title' | 'slug' | 'category' | 'location' | 'status' | 'coverImage'
> = {
  title: 'Sofitel Hotel & Towers — Makkah',
  slug: 'sofitel-hotel-makkah',
  category: 'mep',
  location: 'Makkah',
  status: 'completed',
  coverImage: SAMPLE_MEDIA,
}

const SAMPLE_PROJECT_IN_PROGRESS: Pick<
  Project,
  'title' | 'slug' | 'category' | 'location' | 'status' | 'coverImage'
> = {
  title: 'Data Center Expansion',
  slug: 'data-center-expansion',
  category: 'data-center',
  location: 'Riyadh',
  status: 'in-progress',
  coverImage: 99,
}

const SAMPLE_BRAND_WORDMARK: Pick<Brand, 'id' | 'name' | 'origin' | 'logo' | 'website'> = {
  id: 1,
  name: 'Schneider Electric',
  origin: 'France',
  logo: null,
  website: 'https://www.se.com',
}

const SAMPLE_BRAND_WITH_LOGO: Pick<Brand, 'id' | 'name' | 'origin' | 'logo' | 'website'> = {
  id: 2,
  name: 'ABB',
  origin: 'Switzerland',
  logo: SAMPLE_MEDIA,
  website: 'https://global.abb',
}

const SAMPLE_TEAM_MEMBER: Pick<
  Team,
  'id' | 'name' | 'position' | 'photo' | 'linkedin' | 'bio'
> = {
  id: 1,
  name: 'Eng. Ahmed Al-Harbi',
  position: 'CHIEF EXECUTIVE OFFICER',
  photo: null,
  linkedin: 'https://www.linkedin.com/in/ahmed',
  bio: null,
}

describe('P3-T3 — Cards & motion components', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('1. media-utils (resolveMediaAsset & extractInitials)', () => {
    it('resolves populated Media objects with preferred size and returns null for numeric IDs', () => {
      expect(resolveMediaAsset(null, 'Fallback')).toBeNull()
      expect(resolveMediaAsset(42, 'Fallback')).toBeNull()

      const cardAsset = resolveMediaAsset(SAMPLE_MEDIA, 'Fallback', 'card')
      expect(cardAsset).toEqual({
        url: '/media/sample-card.webp',
        alt: 'Sample engineering image',
        width: 800,
        height: 600,
      })

      const thumbAsset = resolveMediaAsset(SAMPLE_MEDIA, 'Fallback', 'thumb')
      expect(thumbAsset?.url).toBe('/media/sample-thumb.webp')
    })

    it('extracts initials from English and Arabic names while stripping honorific prefixes', () => {
      expect(extractInitials('Eng. Ahmed Al-Harbi')).toBe('AA')
      expect(extractInitials('م. عبدالله الراشد')).toBe('عا')
      expect(extractInitials('Alfanar')).toBe('AL')
      expect(extractInitials('   ')).toBe('')
    })
  })

  describe('2. ServiceTile (109:333)', () => {
    it('renders Default and Featured states and respects service.featured when state is omitted', () => {
      const defaultHtml = renderToStaticMarkup(
        React.createElement(ServiceTile, {
          service: SAMPLE_SERVICE,
          locale: 'en',
        }),
      )
      expect(defaultHtml).toContain('data-component="service-tile"')
      expect(defaultHtml).toContain('data-state="Default"')
      expect(defaultHtml).toContain('General Contracting')
      expect(defaultHtml).toContain('Learn more')
      expect(defaultHtml).toContain('href="/en/services#general-contracting"')

      const featuredHtml = renderToStaticMarkup(
        React.createElement(ServiceTile, {
          service: { ...SAMPLE_SERVICE, featured: true },
          locale: 'ar',
          variant: 'carousel',
        }),
      )
      expect(featuredHtml).toContain('data-state="Featured"')
      expect(featuredHtml).toContain('data-variant="carousel"')
      expect(featuredHtml).toContain('اعرف المزيد')
      expect(featuredHtml).toContain('href="/ar/services#general-contracting"')
    })
  })

  describe('3. ServiceCard (15:320)', () => {
    it('renders Default and Hover states with zero-padded number badge, icon, and image', () => {
      const defaultHtml = renderToStaticMarkup(
        React.createElement(ServiceCard, {
          service: SAMPLE_SERVICE,
          locale: 'en',
          state: 'Default',
          index: 1,
        }),
      )
      expect(defaultHtml).toContain('data-component="service-card"')
      expect(defaultHtml).toContain('data-state="Default"')
      expect(defaultHtml).toContain('>01<')
      expect(defaultHtml).toContain('General Contracting')
      expect(defaultHtml).toContain('VIEW ALL SERVICES')

      const hoverHtml = renderToStaticMarkup(
        React.createElement(ServiceCard, {
          service: { ...SAMPLE_SERVICE, image: null, order: 11 },
          locale: 'ar',
          state: 'Hover',
          fallbackImageUrl: '/images/svc-mep.png',
        }),
      )
      expect(hoverHtml).toContain('data-state="Hover"')
      expect(hoverHtml).toContain('>12<')
      expect(hoverHtml).toContain('عرض جميع الخدمات')
    })
  })

  describe('4. ProjectCard (15:269)', () => {
    it('renders completed and in-progress status pills across Default and Hover states in en and ar', () => {
      const completedHtml = renderToStaticMarkup(
        React.createElement(ProjectCard, {
          project: SAMPLE_PROJECT_COMPLETED,
          locale: 'en',
          state: 'Default',
        }),
      )
      expect(completedHtml).toContain('data-component="project-card"')
      expect(completedHtml).toContain('data-status="completed"')
      expect(completedHtml).toContain('data-state="Default"')
      expect(completedHtml).toContain('MEP')
      expect(completedHtml).toContain('Completed')
      expect(completedHtml).toContain('Sofitel Hotel &amp; Towers — Makkah')
      expect(completedHtml).toContain('Makkah')
      expect(completedHtml).toContain('VIEW PROJECT')
      expect(completedHtml).toContain('alt=""')
      expect(completedHtml).not.toContain('style=')

      const inProgressArHtml = renderToStaticMarkup(
        React.createElement(ProjectCard, {
          project: SAMPLE_PROJECT_IN_PROGRESS,
          locale: 'ar',
          state: 'Hover',
          fallbackImageUrl: '/images/proj-tower.png',
        }),
      )
      expect(inProgressArHtml).toContain('data-status="in-progress"')
      expect(inProgressArHtml).toContain('data-state="Hover"')
      expect(inProgressArHtml).toContain('مراكز البيانات')
      expect(inProgressArHtml).toContain('قيد التنفيذ')
      expect(inProgressArHtml).toContain('عرض المشروع')
    })
  })

  describe('5. PartnerTile (15:332) & BrandTile (156:890)', () => {
    it('renders PartnerTile Default & Hover states and BrandTile wordmark fallback vs uploaded logo', () => {
      const partnerDefaultHtml = renderToStaticMarkup(
        React.createElement(PartnerTile, {
          brand: SAMPLE_BRAND_WORDMARK,
          state: 'Default',
          subtitle: 'Electrical & Automation',
        }),
      )
      expect(partnerDefaultHtml).toContain('data-component="partner-tile"')
      expect(partnerDefaultHtml).toContain('data-state="Default"')
      expect(partnerDefaultHtml).toContain('SCHNEIDER ELECTRIC')
      expect(partnerDefaultHtml).toContain('Electrical &amp; Automation')

      const partnerLogoHoverHtml = renderToStaticMarkup(
        React.createElement(PartnerTile, {
          brand: SAMPLE_BRAND_WITH_LOGO,
          state: 'Hover',
        }),
      )
      expect(partnerLogoHoverHtml).toContain('data-state="Hover"')
      expect(partnerLogoHoverHtml).toContain('<img')

      const brandWordmarkHtml = renderToStaticMarkup(
        React.createElement(BrandTile, {
          brand: SAMPLE_BRAND_WORDMARK,
        }),
      )
      expect(brandWordmarkHtml).toContain('data-component="brand-tile"')
      expect(brandWordmarkHtml).toContain('Schneider Electric')
      expect(brandWordmarkHtml).toContain('France')
      expect(brandWordmarkHtml).not.toContain('<img')

      const brandLogoHtml = renderToStaticMarkup(
        React.createElement(BrandTile, {
          brand: SAMPLE_BRAND_WITH_LOGO,
        }),
      )
      expect(brandLogoHtml).toContain('data-component="brand-tile"')
      expect(brandLogoHtml).toContain('<img')
    })

    it('selects design-system heading tokens (t-h3, t-h4, t-h5) by wordmark length without ad-hoc clamp()', () => {
      const shortHtml = renderToStaticMarkup(
        React.createElement(PartnerTile, {
          brand: { ...SAMPLE_BRAND_WORDMARK, name: 'ABB' },
        }),
      )
      expect(shortHtml).toContain('t-h3')

      const mediumHtml = renderToStaticMarkup(
        React.createElement(PartnerTile, {
          brand: SAMPLE_BRAND_WORDMARK,
        }),
      )
      expect(mediumHtml).toContain('t-h4')

      const longHtml = renderToStaticMarkup(
        React.createElement(PartnerTile, {
          brand: { ...SAMPLE_BRAND_WORDMARK, name: 'شركة الفنار للأنظمة الكهربائية' },
        }),
      )
      expect(longHtml).toContain('t-h5')

      const partnerCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'components', 'PartnerTile.module.css'),
        'utf8',
      )
      expect(partnerCss).not.toContain('clamp(')
      expect(partnerCss).toContain('var(--shadow-partner-tile-rest)')
    })
  })

  describe('6. Avatar (150:318), Portrait (154:890), TeamCard (150:596), & TeamMember (150:603)', () => {
    it('renders Avatar & Portrait with silhouette/initials fallbacks and uploaded Media photos', () => {
      const avatarSilhouetteHtml = renderToStaticMarkup(
        React.createElement(Avatar, {
          member: SAMPLE_TEAM_MEMBER,
          size: 120,
          fallbackMode: 'silhouette',
        }),
      )
      expect(avatarSilhouetteHtml).toContain('data-component="avatar"')
      expect(avatarSilhouetteHtml).toContain('data-size="120"')
      expect(avatarSilhouetteHtml).toContain('data-fallback="silhouette"')
      expect(avatarSilhouetteHtml).toContain('<svg')

      const avatarInitialsHtml = renderToStaticMarkup(
        React.createElement(Avatar, {
          member: SAMPLE_TEAM_MEMBER,
          size: 52,
          fallbackMode: 'initials',
        }),
      )
      expect(avatarInitialsHtml).toContain('data-fallback="initials"')
      expect(avatarInitialsHtml).toContain('>AA<')

      const avatarPhotoHtml = renderToStaticMarkup(
        React.createElement(Avatar, {
          member: { ...SAMPLE_TEAM_MEMBER, photo: SAMPLE_MEDIA },
          size: 52,
        }),
      )
      expect(avatarPhotoHtml).toContain('data-fallback="photo"')
      expect(avatarPhotoHtml).toContain('<img')

      const portraitSilhouetteHtml = renderToStaticMarkup(
        React.createElement(Portrait, {
          member: SAMPLE_TEAM_MEMBER,
        }),
      )
      expect(portraitSilhouetteHtml).toContain('data-component="portrait"')
      expect(portraitSilhouetteHtml).toContain('data-fallback="silhouette"')
      expect(portraitSilhouetteHtml).toContain('viewBox="0 0 264 340"')

      const portraitPhotoHtml = renderToStaticMarkup(
        React.createElement(Portrait, {
          member: { ...SAMPLE_TEAM_MEMBER, photo: SAMPLE_MEDIA },
        }),
      )
      expect(portraitPhotoHtml).toContain('data-fallback="photo"')
      expect(portraitPhotoHtml).toContain('<img')
    })

    it('renders TeamCard across Default, Hover, and Enter 1..5 states and TeamMember card', () => {
      const states: readonly TeamCardState[] = [
        'Default',
        'Hover',
        'Enter 1',
        'Enter 2',
        'Enter 3',
        'Enter 4',
        'Enter 5',
      ]

      for (const state of states) {
        const html = renderToStaticMarkup(
          React.createElement(TeamCard, {
            member: SAMPLE_TEAM_MEMBER,
            locale: 'en',
            state,
            animateOnScroll: true,
            enterDelayMs: 240,
          }),
        )
        expect(html).toContain('data-component="team-card"')
        expect(html).toContain(`data-state="${state}"`)
        expect(html).toContain('Eng. Ahmed Al-Harbi')
        expect(html).toContain('CHIEF EXECUTIVE OFFICER')
        expect(html).toContain('data-enter-delay="240"')
        expect(html).toContain('data-team-card-content="true"')
        expect(html).not.toContain('style=')
        expect(html).toContain('href="https://www.linkedin.com/in/ahmed"')
      }

      const memberHtml = renderToStaticMarkup(
        React.createElement(TeamMember, {
          member: SAMPLE_TEAM_MEMBER,
        }),
      )
      expect(memberHtml).toContain('data-component="team-member"')
      expect(memberHtml).toContain('Eng. Ahmed Al-Harbi')
      expect(memberHtml).toContain('CHIEF EXECUTIVE OFFICER')
    })

    it('supports arbitrary TeamCard stagger delays (e.g. 600ms on a 6th card) via --team-enter-delay custom property, clips entrance content via .clipFrame (R-17), and fades .card::before base shadow out on hover while .card::after hover shadow fades in (R-15, R-19)', () => {
      const sixthCardHtml = renderToStaticMarkup(
        React.createElement(TeamCard, {
          member: SAMPLE_TEAM_MEMBER,
          locale: 'en',
          animateOnScroll: true,
          enterDelayMs: 600,
        }),
      )
      expect(sixthCardHtml).toContain('data-enter-delay="600"')
      expect(sixthCardHtml).toContain('data-team-card-clip="true"')
      expect(sixthCardHtml).toContain('data-team-card-content="true"')
      expect(sixthCardHtml).not.toContain('style=')

      const teamCardCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'components', 'TeamCard.module.css'),
        'utf8',
      )
      expect(teamCardCss).toContain('var(--team-enter-delay, 0ms)')
      expect(teamCardCss).not.toContain("data-enter-delay='")
      expect(teamCardCss).toContain('.clipFrame')
      expect(teamCardCss).toContain('.card::before')
      expect(teamCardCss).toContain('.card::after')
      expect(teamCardCss).toMatch(/\.stateHover::before\s*\{\s*opacity:\s*0;/)
      expect(teamCardCss).toMatch(/\.stateHover::after\s*\{\s*opacity:\s*1;/)
      expect(teamCardCss).not.toMatch(/transition:\s*[^;]*(?:border-color|box-shadow)/)
    })
  })

  describe('7. LogoMarquee (18:576) & TeamMarquee (151:964)', () => {
    it('renders 2-row marquees with aria-hidden duplicate tracks and Position A/B preview states', () => {
      expect(renderToStaticMarkup(React.createElement(LogoMarquee, { brands: [] }))).toBe('')
      expect(renderToStaticMarkup(React.createElement(TeamMarquee, { members: [] }))).toBe('')

      const logoHtml = renderToStaticMarkup(
        React.createElement(LogoMarquee, {
          brands: [SAMPLE_BRAND_WORDMARK, SAMPLE_BRAND_WITH_LOGO],
          locale: 'en',
          position: 'A',
        }),
      )
      expect(logoHtml).toContain('data-component="logo-marquee"')
      expect(logoHtml).toContain('data-position="A"')
      expect(logoHtml).toContain('data-marquee-group="primary"')
      expect(logoHtml).toContain('data-marquee-group="duplicate" aria-hidden="true"')

      const teamHtml = renderToStaticMarkup(
        React.createElement(TeamMarquee, {
          members: [
            SAMPLE_TEAM_MEMBER,
            { ...SAMPLE_TEAM_MEMBER, id: 2, name: 'Eng. Khalid Al-Mansour' },
          ],
          locale: 'ar',
          position: 'B',
        }),
      )
      expect(teamHtml).toContain('data-component="team-marquee"')
      expect(teamHtml).toContain('data-position="B"')
      expect(teamHtml).toContain('data-marquee-group="primary"')
      expect(teamHtml).toContain('data-marquee-group="duplicate" aria-hidden="true"')
    })
  })

  describe('8. ServicesCarousel (175:3714)', () => {
    it('renders accessible carousel slides, progress bar, prev/next buttons, and RTL/LTR transforms', () => {
      expect(
        renderToStaticMarkup(React.createElement(ServicesCarousel, { services: [] })),
      ).toBe('')

      const servicesList = [
        { ...SAMPLE_SERVICE, id: 1, featured: true },
        { ...SAMPLE_SERVICE, id: 2, title: 'Electrical Systems', slug: 'electrical-systems' },
        { ...SAMPLE_SERVICE, id: 3, title: 'HVAC Systems', slug: 'hvac-systems' },
      ]

      const enHtml = renderToStaticMarkup(
        React.createElement(ServicesCarousel, {
          services: servicesList,
          locale: 'en',
          position: 2,
        }),
      )
      expect(enHtml).toContain('data-component="services-carousel"')
      expect(enHtml).toContain('aria-roledescription="carousel"')
      expect(enHtml).toContain('aria-label="Services"')
      expect(enHtml).toContain('aria-roledescription="slide"')
      expect(enHtml).toContain('aria-label="1 of 3"')
      expect(enHtml).toContain('aria-label="2 of 3"')
      expect(enHtml).toContain('data-active-index="1"')
      expect(enHtml).toContain('data-carousel-live-region="true"')
      expect(enHtml).toContain('data-carousel-action="toggle-pause"')
      expect(enHtml).toContain('data-carousel-action="prev"')
      expect(enHtml).toContain('data-carousel-action="next"')
      expect(enHtml).toContain('View All Services')
      expect(enHtml).not.toContain('style=')

      const arHtml = renderToStaticMarkup(
        React.createElement(ServicesCarousel, {
          services: servicesList,
          locale: 'ar',
          position: 2,
        }),
      )
      expect(arHtml).toContain('aria-roledescription="معرض متحرك"')
      expect(arHtml).toContain('aria-label="الخدمات"')
      expect(arHtml).toContain('aria-label="1 من 3"')
      expect(arHtml).toContain('data-active-index="1"')
      expect(arHtml).toContain('عرض جميع الخدمات')
      expect(arHtml).not.toContain('style=')
    })

    it('computes maxIndex and single calc() CSS custom properties (--index, --max-index, --drag-x) for 12 and 20 services without fixed-index selector limits', () => {
      const services12 = Array.from({ length: 12 }, (_, idx) => ({
        ...SAMPLE_SERVICE,
        id: idx + 1,
        slug: `service-${String(idx + 1)}`,
      }))
      const services20 = Array.from({ length: 20 }, (_, idx) => ({
        ...SAMPLE_SERVICE,
        id: idx + 1,
        slug: `service-${String(idx + 1)}`,
      }))

      const html12 = renderToStaticMarkup(
        React.createElement(ServicesCarousel, {
          services: services12,
          locale: 'en',
        }),
      )
      expect(html12).toContain('data-max-index="8"')
      expect(html12).toContain('aria-label="12 of 12"')

      const html20 = renderToStaticMarkup(
        React.createElement(ServicesCarousel, {
          services: services20,
          locale: 'ar',
        }),
      )
      expect(html20).toContain('data-max-index="16"')
      expect(html20).toContain('aria-label="20 من 20"')

      const carouselCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'components', 'ServicesCarousel.module.css'),
        'utf8',
      )
      expect(carouselCss).not.toContain("data-active-index='")
      expect(carouselCss).not.toContain("data-max-index='")
      expect(carouselCss).toContain('var(--drag-x, 0px)')
      expect(carouselCss).toContain('var(--index, 0)')
      expect(carouselCss).toContain('var(--max-index, 4)')
    })

    it('mounts ServicesCarousel in a real Chromium DOM, sets --index / --max-index / --drag-x via CSSOM setProperty, and moves the track and thumb via calc() (R-18)', async () => {
      const rawTsx = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'components', 'ServicesCarousel.tsx'),
        'utf8',
      )
      const strippedTsx = rawTsx
        .replace(/^'use client'\s*/m, '')
        .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, '')
        .replace(/\bexport\s+function\s+ServicesCarousel\b/, 'function ServicesCarousel')
        .replace(/\bexport\s+type\b/g, 'type')
        .replace(/\bexport\s+interface\b/g, 'interface')

      const transpiled = ts.transpileModule(strippedTsx, {
        compilerOptions: {
          module: ts.ModuleKind.None,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.React,
          jsxFactory: 'MiniReact.createElement',
        },
      }).outputText

      const tokensCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'styles', 'tokens.css'),
        'utf8',
      )
      const carouselCss = fs
        .readFileSync(
          path.resolve(process.cwd(), 'src', 'components', 'ServicesCarousel.module.css'),
          'utf8',
        )
        .replace(/:global\(\[dir='rtl'\]\)/g, "[dir='rtl']")

      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
        await page.setContent(
          `<!doctype html><html lang="en" dir="ltr"><head><style>${tokensCss}\n${carouselCss}\n.carousel .track, .carousel .progressThumb { transition: none !important; }</style></head><body><div id="mount"></div></body></html>`,
        )

        const bootstrapScript = `
          (function() {
            const states = [];
            const refs = [];
            let effects = [];
            let hookCursor = 0;
            let rerender = function() {};

            const MiniReact = {
              useState: function(init) {
                const idx = hookCursor++;
                if (!(idx in states)) {
                  states[idx] = typeof init === 'function' ? init() : init;
                }
                const setState = function(updater) {
                  const prev = states[idx];
                  const next = typeof updater === 'function' ? updater(prev) : updater;
                  if (next !== prev) {
                    states[idx] = next;
                    rerender();
                  }
                };
                return [states[idx], setState];
              },
              useRef: function(init) {
                const idx = hookCursor++;
                if (!(idx in refs)) {
                  refs[idx] = { current: init };
                }
                return refs[idx];
              },
              useCallback: function(fn) {
                hookCursor++;
                return fn;
              },
              useEffect: function(fn) {
                hookCursor++;
                effects.push(fn);
              },
              useSyncExternalStore: function(_sub, getSnap) {
                hookCursor++;
                return getSnap();
              },
              createElement: function(type, props) {
                const children = Array.prototype.slice.call(arguments, 2);
                const safeProps = props || {};
                if (typeof type === 'function') {
                  return type(Object.assign({}, safeProps, { children: children }));
                }
                const tag = typeof type === 'string' ? type : 'div';
                const el = document.createElement(tag);
                Object.keys(safeProps).forEach(function(k) {
                  const v = safeProps[k];
                  if (v === undefined || v === null || k === 'children' || k === 'key') {
                    return;
                  }
                  if (k === 'className' && typeof v === 'string') {
                    el.className = v;
                  } else if (k === 'ref') {
                    if (typeof v === 'function') {
                      v(el);
                    } else if (typeof v === 'object' && 'current' in v) {
                      v.current = el;
                    }
                  } else if (k.indexOf('on') === 0 && typeof v === 'function') {
                    const rawEvt = k.slice(2).replace(/Capture$/, '').toLowerCase();
                    const useCapture = /Capture$/.test(k);
                    el.addEventListener(rawEvt, v, useCapture);
                  } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    const attrName = k === 'tabIndex' ? 'tabindex' : k;
                    el.setAttribute(attrName, String(v));
                  }
                });
                const appendChildItem = function(child) {
                  if (Array.isArray(child)) {
                    child.forEach(appendChildItem);
                  } else if (child instanceof Node) {
                    el.appendChild(child);
                  } else if (typeof child === 'string' || typeof child === 'number') {
                    el.appendChild(document.createTextNode(String(child)));
                  }
                };
                children.forEach(appendChildItem);
                return el;
              }
            };

            const useState = MiniReact.useState;
            const useEffect = MiniReact.useEffect;
            const useCallback = MiniReact.useCallback;
            const useRef = MiniReact.useRef;
            const useSyncExternalStore = MiniReact.useSyncExternalStore;
            const styles = new Proxy({}, { get: function(_t, prop) { return String(prop); } });
            const DEFAULT_LOCALE = 'en';
            const formatStepCounter = function(_tpl, cur, tot) { return String(cur) + ' of ' + String(tot); };
            const getDictionary = function() {
              return {
                cards: { viewAllServicesButton: 'View All Services' },
                carousel: {
                  carouselRoleDescription: 'carousel',
                  regionLabel: 'Services',
                  slideRoleDescription: 'slide',
                  slideOfTotal: '{current} of {total}',
                  pauseAutoPlay: 'Pause',
                  playAutoPlay: 'Play',
                  previousSlide: 'Previous',
                  nextSlide: 'Next',
                }
              };
            };
            const ServiceTile = function(p) {
              return MiniReact.createElement('div', { style: 'width:290px;height:300px;' }, p.service.title);
            };
            const Button = function(p) { return MiniReact.createElement('a', {}, p.label); };
            const ArrowLeftIcon = function() { return MiniReact.createElement('span', {}, '<'); };
            const ArrowRightIcon = function() { return MiniReact.createElement('span', {}, '>'); };

            ${transpiled}

            const services12 = Array.from({ length: 12 }, function(_, idx) {
              return {
                id: idx + 1,
                title: 'Service ' + String(idx + 1),
                slug: 'service-' + String(idx + 1),
                icon: 'mep',
                shortDescription: 'Desc',
                featured: idx === 0,
              };
            });

            const mountNode = document.getElementById('mount');
            rerender = function() {
              hookCursor = 0;
              effects = [];
              mountNode.innerHTML = '';
              const tree = ServicesCarousel({
                services: services12,
                locale: 'en',
                autoAdvanceMs: 0,
              });
              mountNode.appendChild(tree);
              effects.forEach(function(fn) { fn(); });
            };
            rerender();
          })();
        `

        await page.addScriptTag({ content: bootstrapScript })

        const domResult = await page.evaluate(() => {
          const mountNode = document.getElementById('mount')
          if (!mountNode) {
            throw new Error('Missing #mount container')
          }

          const getMetrics = () => {
            const section = mountNode.querySelector<HTMLElement>(
              '[data-component="services-carousel"]',
            )
            const viewport = section?.querySelector<HTMLElement>('.viewport')
            const track = section?.querySelector<HTMLElement>('[data-carousel-track="true"]')
            const progressTrack = section?.querySelector<HTMLElement>('.progressTrack')
            const thumb = section?.querySelector<HTMLElement>('[data-carousel-thumb="true"]')
            if (!section || !viewport || !track || !progressTrack || !thumb) {
              throw new Error('Missing carousel DOM nodes')
            }
            return {
              indexVar: section.style.getPropertyValue('--index'),
              maxIndexVar: section.style.getPropertyValue('--max-index'),
              dragXVar: section.style.getPropertyValue('--drag-x'),
              trackDeltaPx: Math.round(
                track.getBoundingClientRect().left - viewport.getBoundingClientRect().left,
              ),
              thumbLeftPx: Math.round(
                thumb.getBoundingClientRect().left - progressTrack.getBoundingClientRect().left,
              ),
              thumbRightOvershootPx: Math.round(
                thumb.getBoundingClientRect().right - progressTrack.getBoundingClientRect().right,
              ),
            }
          }

          const initial = getMetrics()

          // Click Next button -> index 1
          const nextBtn = mountNode.querySelector<HTMLButtonElement>('[data-carousel-action="next"]')
          if (!nextBtn) {
            throw new Error('Missing next button')
          }
          nextBtn.click()
          const afterNext = getMetrics()

          // Press End key on section -> index 8 (for 12 services, visibleCount = 4)
          const sectionAfterNext = mountNode.querySelector<HTMLElement>(
            '[data-component="services-carousel"]',
          )
          if (!sectionAfterNext) {
            throw new Error('Missing carousel section after next click')
          }
          sectionAfterNext.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
          )
          const afterEnd = getMetrics()

          return { initial, afterNext, afterEnd }
        })

        expect(domResult.initial.indexVar).toBe('0')
        expect(domResult.initial.maxIndexVar).toBe('8')
        expect(domResult.initial.trackDeltaPx).toBe(0)
        expect(domResult.initial.thumbLeftPx).toBe(0)

        // Removing setProperty('--index', ...) or flipping calc() sign breaks these assertions:
        expect(domResult.afterNext.indexVar).toBe('1')
        expect(domResult.afterNext.trackDeltaPx).toBe(-310)
        expect(domResult.afterNext.thumbLeftPx).toBe(65) // round(516 * 1 / 8) = 65

        expect(domResult.afterEnd.indexVar).toBe('8')
        expect(domResult.afterEnd.trackDeltaPx).toBe(-2480) // -8 * 310
        expect(domResult.afterEnd.thumbLeftPx).toBe(516) // 806 - 290
        expect(domResult.afterEnd.thumbRightOvershootPx).toBe(0)
      } finally {
        await browser.close()
      }
    })
  })

  describe('9. P3-T3 CSS Modules token & prefers-reduced-motion compliance', () => {
    const p3t3CssFiles = [
      'ServiceTile.module.css',
      'ServiceCard.module.css',
      'ProjectCard.module.css',
      'PartnerTile.module.css',
      'BrandTile.module.css',
      'Avatar.module.css',
      'Portrait.module.css',
      'TeamCard.module.css',
      'TeamMember.module.css',
      'LogoMarquee.module.css',
      'TeamMarquee.module.css',
      'ServicesCarousel.module.css',
    ]

    it('contains zero raw #hex or rgb()/rgba()/hsl() literals and honours prefers-reduced-motion', () => {
      for (const file of p3t3CssFiles) {
        const fullPath = path.resolve(process.cwd(), 'src', 'components', file)
        expect(fs.existsSync(fullPath)).toBe(true)
        const css = fs.readFileSync(fullPath, 'utf8')
        expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
        expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla)\s*\(/)
      }

      const animatedCssFiles = [
        'ServiceTile.module.css',
        'ServiceCard.module.css',
        'ProjectCard.module.css',
        'PartnerTile.module.css',
        'BrandTile.module.css',
        'TeamCard.module.css',
        'LogoMarquee.module.css',
        'TeamMarquee.module.css',
        'ServicesCarousel.module.css',
      ]

      for (const file of animatedCssFiles) {
        const fullPath = path.resolve(process.cwd(), 'src', 'components', file)
        const css = fs.readFileSync(fullPath, 'utf8')
        expect(css).toContain('@media (prefers-reduced-motion: reduce)')
      }
    })
  })

  describe('10. Styleguide route renders all P3-T3 sections in ar and en', () => {
    it('renders sections 10..18 on /ar/styleguide and /en/styleguide in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')

      const p3t3Sections = [
        'service-tile',
        'service-card',
        'project-card',
        'partner-brand-tile',
        'logo-marquee',
        'avatar-portrait-member',
        'team-card',
        'team-marquee',
        'services-carousel',
      ]

      for (const locale of ['ar', 'en'] as const) {
        const el = await StyleguidePage({ params: Promise.resolve({ locale }) })
        const html = renderToStaticMarkup(el)
        expect(html).not.toContain('style="')
        for (const section of p3t3Sections) {
          expect(html).toContain(`data-styleguide-section="${section}"`)
        }
      }
    })
  })
})
