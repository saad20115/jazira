import { isValidElement, type ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getRelated = vi.fn()
vi.mock('@/components/systems3d/relatedProjects', () => ({
  getRelatedProjectsBySystem: (...args: unknown[]) => getRelated(...args) as unknown,
}))

import { RelatedProjectsLoader } from '@/components/systems3d/RelatedProjectsLoader'
import { SYSTEMS3D_STRINGS } from '@/components/systems3d/strings'

const props = {
  data: null,
  locale: 'en' as const,
  badgeLabel: 'b',
  openLabel: 'o',
  poster: null,
  posterAlt: 'a',
  relatedHeading: 'Related projects',
  strings: SYSTEMS3D_STRINGS.en,
  systems: [],
}

afterEach(() => {
  vi.restoreAllMocks()
  getRelated.mockReset()
})

function relatedOf(element: ReactElement): unknown {
  return (element.props as { related: unknown }).related
}

describe('P3-T5 C3-1: related projects are read inside the section', () => {
  it('passes the related projects through to the explorer', async () => {
    const related = {
      hvac: {
        projects: [{ id: '1', title: 'T', href: '/en/projects/t' }],
        allHref: '/en/projects?scope=hvac',
      },
    }
    getRelated.mockResolvedValue(related)
    const element = await RelatedProjectsLoader(props)
    expect(isValidElement(element)).toBe(true)
    expect(relatedOf(element)).toBe(related)
    expect(getRelated).toHaveBeenCalledWith('en', null)
  })

  it('on a CMS failure: logs once without PII and renders without the panel', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    getRelated.mockRejectedValue(new TypeError('connect ECONNREFUSED user@example.com:5432'))
    const element = await RelatedProjectsLoader(props)
    expect(relatedOf(element)).toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
    const line = String(warn.mock.calls[0]?.[0])
    expect(line).toContain('TypeError')
    expect(line).not.toContain('example.com')
    expect(line).not.toContain('ECONNREFUSED')
  })
})
