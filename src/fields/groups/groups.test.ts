import { describe, expect, it } from 'vitest'

import {
  buttonFields,
  buttonGroup,
  collapsibleSection,
  ctaFields,
  ctaGroup,
  pageHeaderFields,
  pageHeaderGroup,
  resolveButtonHref,
  sectionIntroFields,
  sectionIntroGroup,
} from './index'

describe('reusable field groups (button, cta, pageHeader, sectionIntro, collapsibleSection)', () => {
  describe('buttonGroup & resolveButtonHref', () => {
    it('builds a named group with localized label and linkField (includeLabel: false)', () => {
      const btn = buttonGroup({ name: 'primaryCta', required: true })
      expect(btn.name).toBe('primaryCta')
      expect(btn.type).toBe('group')

      const fields = buttonFields({ required: true })
      expect(fields).toHaveLength(2)

      const labelField = fields[0] as {
        localized?: boolean
        maxLength?: number
        name: string
        required?: boolean
        type: string
        validate?: (val: unknown) => true | string
      }
      expect(labelField.name).toBe('label')
      expect(labelField.type).toBe('text')
      expect(labelField.localized).toBe(true)
      expect(labelField.required).toBe(true)
      expect(labelField.maxLength).toBe(100)
      expect(labelField.validate?.('')).not.toBe(true)
      expect(labelField.validate?.('Explore Our Services')).toBe(true)

      const linkSubgroup = fields[1] as {
        fields: Array<{ name: string }>
        name: string
        type: string
      }
      expect(linkSubgroup.name).toBe('link')
      expect(linkSubgroup.type).toBe('group')
      expect(linkSubgroup.fields.map((f) => f.name)).toEqual([
        'type',
        'internalRoute',
        'internalPath',
        'reference',
        'url',
        'newTab',
      ])
    })

    it('resolves hrefs from nested button.link or flat button objects via I3 rules', () => {
      expect(
        resolveButtonHref({
          label: 'Explore Services',
          link: { type: 'internal', internalRoute: '/services' },
        }),
      ).toBe('/services')

      expect(
        resolveButtonHref({
          label: 'Call Us',
          link: { type: 'external', url: 'tel:+966573534185' },
        }),
      ).toBe('tel:+966573534185')

      expect(
        resolveButtonHref({
          label: 'Unsafe',
          link: { type: 'external', url: 'javascript:alert(1)' },
        }),
      ).toBeNull()
    })
  })

  describe('ctaGroup & ctaFields', () => {
    it('includes enabled checkbox, localized title/titleAccent/text, primary button, secondaryButton, and backgroundImage, and wraps in collapsibleSection', () => {
      const group = ctaGroup()
      expect(group.name).toBe('cta')
      expect(group.type).toBe('group')

      const wrapped = collapsibleSection(group)
      expect(wrapped.type).toBe('collapsible')
      expect(wrapped.admin?.initCollapsed).toBe(true)

      const names = ctaFields().map((f) => ('name' in f ? f.name : f.type))
      expect(names).toEqual([
        'enabled',
        'title',
        'titleAccent',
        'text',
        'button',
        'secondaryButton',
        'backgroundImage',
      ])
    })
  })

  describe('pageHeaderGroup & pageHeaderFields', () => {
    it('includes enabled checkbox, localized title/subtitle, and image upload -> media', () => {
      const group = pageHeaderGroup()
      expect(group.name).toBe('pageHeader')
      expect(group.type).toBe('group')

      const wrapped = collapsibleSection(group)
      expect(wrapped.type).toBe('collapsible')
      expect(wrapped.admin?.initCollapsed).toBe(true)

      const fields = pageHeaderFields({ required: true })
      expect(fields.map((f) => ('name' in f ? f.name : f.type))).toEqual([
        'enabled',
        'title',
        'subtitle',
        'image',
      ])
    })
  })

  describe('sectionIntroGroup & sectionIntroFields', () => {
    it('includes enabled checkbox, localized eyebrow, title, intro, and any extraFields', () => {
      const group = sectionIntroGroup({
        name: 'specialist',
        extraFields: [{ name: 'customNote', type: 'text' }],
      })
      expect(group.name).toBe('specialist')
      expect(group.type).toBe('group')
      expect(group.fields.map((f) => ('name' in f ? f.name : f.type))).toEqual([
        'enabled',
        'eyebrow',
        'title',
        'intro',
        'customNote',
      ])
      expect(
        sectionIntroFields({ includeEnabled: false }).map((f) => ('name' in f ? f.name : '')),
      ).toEqual(['eyebrow', 'title', 'intro'])
    })
  })
})
