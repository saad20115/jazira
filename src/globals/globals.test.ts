import type { ArrayField, CollapsibleField, NamedGroupField, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { Brands } from '../collections/Brands'
import { Materials } from '../collections/Materials'
import {
  assertCollectionRichTextFieldsHaveBodyMediaSibling,
  buildCollectionTargetWhere,
  deriveCollectionTargetReferences,
  deriveFieldTargetPaths,
  deriveGlobalTargetReferences,
  findCollectionTargetReferences,
  Media,
} from '../collections/Media'
import { Projects, PROJECT_SCOPE_OPTIONS } from '../collections/Projects'
import { QuoteRequests } from '../collections/QuoteRequests'
import { Services } from '../collections/Services'
import { Stats } from '../collections/Stats'
import { Team } from '../collections/Team'
import { Users } from '../collections/Users'
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
      fields
        .filter((f) => !('name' in f && f.name === '_status'))
        .map((field) => {
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

  it('derives all global and collection upload/relationship paths for media, stats, and videos directly from config and fails closed on query errors (R-4, R-8, R-10)', async () => {
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
          'statsSection.backgroundImage',
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

    // Also verify collection field paths targeting media and videos are derived directly from config (R-8)
    const allCollections = [
      Users,
      Media,
      Videos,
      Brands,
      Stats,
      Materials,
      Services,
      Team,
      Projects,
      QuoteRequests,
    ]
    const mediaCollections = deriveCollectionTargetReferences(allCollections, 'media')
    expect(mediaCollections).toEqual([
      {
        slug: 'videos',
        fieldPaths: ['poster'],
        richTextPaths: [],
        labelField: 'title',
        versioned: false,
        localized: true,
      },
      {
        slug: 'brands',
        fieldPaths: ['logo'],
        richTextPaths: [],
        labelField: 'name',
        versioned: false,
        localized: true,
      },
      {
        slug: 'services',
        fieldPaths: ['image', 'meta.image', 'bodyMedia'],
        richTextPaths: ['body'],
        labelField: 'title',
        versioned: true,
        localized: true,
      },
      {
        slug: 'team',
        fieldPaths: ['photo'],
        richTextPaths: [],
        labelField: 'name',
        versioned: false,
        localized: true,
      },
      {
        slug: 'projects',
        fieldPaths: ['coverImage', 'gallery', 'meta.image', 'bodyMedia'],
        richTextPaths: ['body'],
        labelField: 'title',
        versioned: true,
        localized: true,
      },
    ])

    const videosCollections = deriveCollectionTargetReferences(allCollections, 'videos')
    expect(videosCollections).toEqual([
      {
        slug: 'projects',
        fieldPaths: ['video'],
        richTextPaths: [],
        labelField: 'title',
        versioned: true,
        localized: true,
      },
    ])

    // Verify a synthetic collection with nested upload field inside an array is derived automatically (R-8)
    const syntheticCollection = {
      slug: 'brands' as const,
      admin: { useAsTitle: 'name' },
      fields: [
        { name: 'name', type: 'text' as const, localized: true },
        {
          name: 'slides',
          type: 'array' as const,
          fields: [{ name: 'banner', type: 'upload' as const, relationTo: 'media' as const }],
        },
      ],
    }
    const syntheticDerived = deriveCollectionTargetReferences([syntheticCollection], 'media')
    expect(syntheticDerived).toEqual([
      {
        slug: 'brands',
        fieldPaths: ['slides.banner'],
        richTextPaths: [],
        labelField: 'name',
        versioned: false,
        localized: true,
      },
    ])
    expect(buildCollectionTargetWhere(['slides.banner'], 42)).toEqual({
      'slides.banner': { equals: 42 },
    })

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

    // Verify findCollectionTargetReferences fails closed if the where query throws (R-10)
    await expect(
      findCollectionTargetReferences({
        check: syntheticDerived[0],
        targetId: 42,
        referencesByKey: new Map(),
        req: {
          payload: {
            collections: { brands: {} },
            find: () => Promise.reject(new Error('simulated query failure')),
          },
        } as never,
      }),
    ).rejects.toThrow(/Could not verify media references/)

    // Verify every collection richText field allowing uploads has a bodyMedia sibling (R-18)
    expect(() => {
      assertCollectionRichTextFieldsHaveBodyMediaSibling(allCollections)
    }).not.toThrow()

    expect(() => {
      assertCollectionRichTextFieldsHaveBodyMediaSibling([
        {
          slug: 'synthetic-articles',
          fields: [{ name: 'body', type: 'richText' }],
        },
      ])
    }).toThrow(/without a "bodyMedia" sibling targeting "media"/)
  })
})
