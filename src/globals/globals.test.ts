import { describe, expect, it } from 'vitest'

import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
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
})
