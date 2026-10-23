import type { ArrayField, CollapsibleField, NamedGroupField, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { Brands } from '../collections/Brands'
import { deriveFieldTargetPaths, deriveGlobalTargetReferences } from '../collections/Media'
import { Projects, PROJECT_SCOPE_OPTIONS } from '../collections/Projects'
import { Services } from '../collections/Services'
import { Team } from '../collections/Team'
import { Videos } from '../collections/Videos'
import { getDefaultInteractiveSystems } from './HomePage'
import {
  AboutPage,
  ALL_GLOBALS,
  ContactPage,
  enforcePublishedReadOnGlobalBeforeOperation,
  HomePage,
  Navigation,
  PAGES_ADMIN_GROUP,
  PrivacyPage,
  ProjectsPage,
  publishableGlobalVersions,
  ServicesPage,
  SETTINGS_ADMIN_GROUP,
  SiteSettings,
} from './index'

describe('P2-T5 Globals unit suite', () => {
  it('exports all 8 globals in ALL_GLOBALS with expected slugs and admin groups', () => {
    expect(ALL_GLOBALS.map((g) => g.slug)).toEqual([
      'site-settings',
      'navigation',
      'home-page',
      'services-page',
      'about-page',
      'projects-page',
      'contact-page',
      'privacy-page',
    ])

    expect(SiteSettings.admin?.group).toEqual(SETTINGS_ADMIN_GROUP)
    expect(Navigation.admin?.group).toEqual(SETTINGS_ADMIN_GROUP)

    for (const pageGlobal of [
      HomePage,
      ServicesPage,
      AboutPage,
      ProjectsPage,
      ContactPage,
      PrivacyPage,
    ]) {
      expect(pageGlobal.admin?.group).toEqual(PAGES_ADMIN_GROUP)
      expect(pageGlobal.versions).toEqual(publishableGlobalVersions)
    }
  })

  it('enforces explicit access rules on site-settings, navigation, and publishable page globals (Z1 & Z2)', () => {
    expect(SiteSettings.access?.update).toBe(isAdmin)
    expect(Navigation.access?.update).toBe(isAdminOrEditor)

    for (const pageGlobal of [
      HomePage,
      ServicesPage,
      AboutPage,
      ProjectsPage,
      ContactPage,
      PrivacyPage,
    ]) {
      expect(pageGlobal.access?.read).toBe(publishedOrLoggedIn)
      expect(pageGlobal.access?.readVersions).toBe(isAdminOrEditor)
      expect(pageGlobal.access?.update).toBe(isAdminOrEditor)
    }
  })

  it('forces args.draft = false on unauthenticated read operations via enforcePublishedReadOnGlobalBeforeOperation', () => {
    const args = { draft: true }
    const result: unknown = enforcePublishedReadOnGlobalBeforeOperation({
      args,
      context: {},
      global: HomePage as never,
      operation: 'read',
      overrideAccess: false,
      req: { user: null } as never,
    })
    expect((result as { draft?: boolean }).draft).toBe(false)

    const authedArgs = { draft: true }
    const authedResult: unknown = enforcePublishedReadOnGlobalBeforeOperation({
      args: authedArgs,
      context: {},
      global: HomePage as never,
      operation: 'read',
      overrideAccess: false,
      req: { user: { id: 1, role: 'editor' } } as never,
    })
    expect((authedResult as { draft?: boolean }).draft).toBe(true)
  })

  it('configures collapsible sections in Figma order with Arabic labels and enabled checkboxes across all page globals', () => {
    const getCollapsibleGroupNames = (fields: typeof HomePage.fields): string[] =>
      fields.map((field) => {
        expect(field.type).toBe('collapsible')
        if (field.type !== 'collapsible') {
          return ''
        }
        expect(field.admin?.initCollapsed).toBe(true)
        const label = field.label as { ar?: string; en?: string }
        expect(typeof label.ar).toBe('string')
        expect((label.ar ?? '').length).toBeGreaterThan(0)
        const inner = field.fields[0]
        if ('name' in inner && typeof inner.name === 'string') {
          return inner.name
        }
        return ''
      })

    expect(getCollapsibleGroupNames(HomePage.fields)).toEqual([
      'hero',
      'whoWeAre',
      'coreServices',
      'interactiveSystems',
      'statsSection',
      'featuredProjects',
      'partners',
      'cta',
      'meta',
    ])

    expect(getCollapsibleGroupNames(ServicesPage.fields)).toEqual([
      'pageHeader',
      'servicesIntro',
      'specialist',
      'materials',
      'process',
      'cta',
      'meta',
    ])

    expect(getCollapsibleGroupNames(AboutPage.fields)).toEqual([
      'pageHeader',
      'story',
      'strengths',
      'missionVision',
      'team',
      'meta',
    ])

    expect(getCollapsibleGroupNames(ProjectsPage.fields)).toEqual([
      'pageHeader',
      'impact',
      'portfolio',
      'cta',
      'meta',
    ])

    expect(getCollapsibleGroupNames(ContactPage.fields)).toEqual([
      'pageHeader',
      'getInTouch',
      'findOffice',
      'meta',
    ])

    expect(getCollapsibleGroupNames(PrivacyPage.fields)).toEqual(['pageHeader', 'enabled', 'meta'])
  })

  it('configures interactiveSystems.systems with exact minRows: 5, maxRows: 5, default 5 discipline mappings, and localized PROJECT_SCOPE_OPTIONS labels (R-2)', () => {
    const interactiveCollapsible = HomePage.fields[3] as CollapsibleField
    const interactiveGroup = interactiveCollapsible.fields[0] as NamedGroupField
    expect(interactiveGroup.name).toBe('interactiveSystems')

    const systemsField = interactiveGroup.fields.find(
      (f): f is ArrayField => 'name' in f && f.name === 'systems' && f.type === 'array',
    )
    expect(systemsField).toBeDefined()
    expect(systemsField?.minRows).toBe(5)
    expect(systemsField?.maxRows).toBe(5)

    const arDefaults = getDefaultInteractiveSystems('ar')
    const enDefaults = getDefaultInteractiveSystems('en')
    expect(arDefaults).toHaveLength(5)
    expect(enDefaults).toHaveLength(5)
    expect(arDefaults.map((row) => ({ shot: row.shot, disciplines: row.disciplines }))).toEqual([
      { shot: 'hvac', disciplines: ['hvac'] },
      { shot: 'fire', disciplines: ['fire-fighting'] },
      { shot: 'plumbing', disciplines: ['plumbing'] },
      { shot: 'power', disciplines: ['electrical'] },
      { shot: 'smart', disciplines: ['low-current', 'data-center'] },
    ])

    const disciplinesField = systemsField?.fields.find(
      (f): f is SelectField => 'name' in f && f.name === 'disciplines' && f.type === 'select',
    )
    expect(disciplinesField?.options).toEqual([...PROJECT_SCOPE_OPTIONS])
    for (const opt of PROJECT_SCOPE_OPTIONS) {
      expect(typeof opt.label.ar).toBe('string')
      expect(typeof opt.label.en).toBe('string')
    }
  })

  it('derives all global and collection upload/relationship paths for media, stats, and videos directly from config (R-4)', () => {
    const mediaGlobals = deriveGlobalTargetReferences(ALL_GLOBALS, 'media')
    expect(mediaGlobals).toEqual([
      {
        slug: 'site-settings',
        fieldPaths: ['office.mapImage', 'defaultSeo.image'],
        richTextPaths: [],
        versioned: false,
      },
      {
        slug: 'home-page',
        fieldPaths: [
          'hero.background',
          'whoWeAre.image',
          'interactiveSystems.heroImage',
          'cta.backgroundImage',
          'meta.image',
        ],
        richTextPaths: ['whoWeAre.text'],
        versioned: true,
      },
      {
        slug: 'services-page',
        fieldPaths: ['pageHeader.image', 'cta.backgroundImage', 'meta.image'],
        richTextPaths: [],
        versioned: true,
      },
      {
        slug: 'about-page',
        fieldPaths: [
          'pageHeader.image',
          'story.image',
          'missionVision.mission.image',
          'missionVision.vision.image',
          'missionVision.image',
          'meta.image',
        ],
        richTextPaths: ['story.text'],
        versioned: true,
      },
      {
        slug: 'projects-page',
        fieldPaths: ['pageHeader.image', 'portfolio.image', 'cta.backgroundImage', 'meta.image'],
        richTextPaths: ['portfolio.text'],
        versioned: true,
      },
      {
        slug: 'contact-page',
        fieldPaths: ['pageHeader.image', 'meta.image'],
        richTextPaths: [],
        versioned: true,
      },
      {
        slug: 'privacy-page',
        fieldPaths: ['pageHeader.image', 'bodyMedia', 'meta.image'],
        richTextPaths: ['body'],
        versioned: true,
      },
    ])

    const statsGlobals = deriveGlobalTargetReferences(ALL_GLOBALS, 'stats')
    expect(statsGlobals).toEqual([
      {
        slug: 'home-page',
        fieldPaths: ['whoWeAre.badgeStat', 'statsSection.stats'],
        richTextPaths: [],
        versioned: true,
      },
      {
        slug: 'about-page',
        fieldPaths: ['story.badgeStat'],
        richTextPaths: [],
        versioned: true,
      },
      {
        slug: 'projects-page',
        fieldPaths: ['impact.stats', 'portfolio.badgeStat'],
        richTextPaths: [],
        versioned: true,
      },
    ])

    const videosGlobals = deriveGlobalTargetReferences(ALL_GLOBALS, 'videos')
    expect(videosGlobals).toEqual([
      {
        slug: 'home-page',
        fieldPaths: ['hero.backgroundVideo'],
        richTextPaths: [],
        versioned: true,
      },
    ])

    // Also verify collection field paths targeting media match our Media.ts collection checks
    expect(deriveFieldTargetPaths(Team.fields, 'media').fieldPaths).toEqual(['photo'])
    expect(deriveFieldTargetPaths(Services.fields, 'media').fieldPaths).toEqual([
      'image',
      'meta.image',
      'bodyMedia',
    ])
    expect(deriveFieldTargetPaths(Projects.fields, 'media').fieldPaths).toEqual([
      'coverImage',
      'gallery',
      'meta.image',
      'bodyMedia',
    ])
    expect(deriveFieldTargetPaths(Brands.fields, 'media').fieldPaths).toEqual(['logo'])
    expect(deriveFieldTargetPaths(Videos.fields, 'media').fieldPaths).toEqual(['poster'])
    expect(deriveFieldTargetPaths(Projects.fields, 'videos').fieldPaths).toEqual(['video'])
  })
})
