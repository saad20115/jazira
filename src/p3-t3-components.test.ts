import fs from 'node:fs'
import path from 'node:path'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
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
      expect(completedHtml).toContain('COMPLETED')
      expect(completedHtml).toContain('Sofitel Hotel &amp; Towers — Makkah')
      expect(completedHtml).toContain('Makkah')
      expect(completedHtml).toContain('VIEW PROJECT')

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
        expect(html).toContain('transition-delay:240ms')
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
      expect(enHtml).toContain('aria-roledescription="slide"')
      expect(enHtml).toContain('aria-label="1 of 3"')
      expect(enHtml).toContain('aria-label="2 of 3"')
      expect(enHtml).toContain('data-active-index="1"')
      expect(enHtml).toContain('translate3d(-310px, 0, 0)')
      expect(enHtml).toContain('data-carousel-action="prev"')
      expect(enHtml).toContain('data-carousel-action="next"')
      expect(enHtml).toContain('View All Services')

      const arHtml = renderToStaticMarkup(
        React.createElement(ServicesCarousel, {
          services: servicesList,
          locale: 'ar',
          position: 2,
        }),
      )
      expect(arHtml).toContain('aria-roledescription="معرض متحرك"')
      expect(arHtml).toContain('aria-label="1 من 3"')
      expect(arHtml).toContain('translate3d(310px, 0, 0)')
      expect(arHtml).toContain('عرض جميع الخدمات')
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
        for (const section of p3t3Sections) {
          expect(html).toContain(`data-styleguide-section="${section}"`)
        }
      }
    })
  })
})
