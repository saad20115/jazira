import React, { isValidElement, type ReactElement, type ReactNode, Suspense } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const getRelated = vi.fn()
vi.mock('@/components/systems3d/relatedProjects', () => ({
  getRelatedProjectsBySystem: (...args: unknown[]) => getRelated(...args) as unknown,
}))

import { InteractiveSystemsSection } from '@/components/systems3d/InteractiveSystemsSection'
import { loadRelatedProjects } from '@/components/systems3d/loadRelatedProjects'
import { SystemsExplorer } from '@/components/systems3d/SystemsExplorer'
import type { HomePage } from '@/payload-types'

afterEach(() => {
  vi.restoreAllMocks()
  getRelated.mockReset()
})

const DATA = {
  enabled: true,
  title: 'Every system, one accountable team',
  systems: [{ id: 'sys-1', title: 'HVAC', text: 'Chillers.', shot: 'hvac', disciplines: ['hvac'] }],
} as unknown as NonNullable<HomePage['interactiveSystems']>

/** Every element in the tree under `node`, with the chain of its element ancestors. */
function walk(
  node: ReactNode,
  ancestors: ReactElement[] = [],
  out: { element: ReactElement; ancestors: ReactElement[] }[] = [],
): { element: ReactElement; ancestors: ReactElement[] }[] {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) {
      walk(child, ancestors, out)
    }
    return out
  }
  if (!isValidElement(node)) {
    return out
  }
  out.push({ element: node, ancestors })
  const children = (node.props as { children?: ReactNode }).children
  walk(children, [...ancestors, node], out)
  return out
}

describe('P3-T5 C3-1: related projects are read inside the section, never blocking the card', () => {
  it('resolves to the related projects of the read', async () => {
    const related = {
      hvac: {
        projects: [{ id: '1', title: 'T', href: '/en/projects/t' }],
        allHref: '/en/projects?scope=hvac',
      },
    }
    getRelated.mockResolvedValue(related)
    await expect(loadRelatedProjects('en', null)).resolves.toBe(related)
    expect(getRelated).toHaveBeenCalledWith('en', null)
  })

  it('on a CMS failure: never rejects, logs once without PII, resolves to no related projects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    getRelated.mockRejectedValue(new TypeError('connect ECONNREFUSED user@example.com:5432'))
    await expect(loadRelatedProjects('en', null)).resolves.toEqual({})
    expect(warn).toHaveBeenCalledTimes(1)
    const line = String(warn.mock.calls[0]?.[0])
    expect(line).toContain('TypeError')
    expect(line).not.toContain('example.com')
    expect(line).not.toContain('ECONNREFUSED')
  })

  it('the section passes the unawaited read to the explorer, outside any Suspense boundary', () => {
    let resolveRead: (value: object) => void = () => undefined
    getRelated.mockReturnValue(
      new Promise((resolve) => {
        resolveRead = resolve
      }),
    )
    const tree = InteractiveSystemsSection({
      companyName: 'Al Jazira',
      data: DATA,
      headClassNames: { head: 'h', headLeft: 'hl', heading: 'hd' },
      locale: 'en',
      renderHeading: (title) => React.createElement('em', null, title),
    })
    // The section rendered synchronously while the read is still pending.
    const explorers = walk(tree).filter(({ element }) => element.type === SystemsExplorer)
    expect(explorers).toHaveLength(1)
    const [explorer] = explorers
    expect((explorer.element.props as { related: unknown }).related).toBeInstanceOf(Promise)
    expect(explorer.ancestors.some((a) => a.type === Suspense)).toBe(false)
    expect(getRelated).toHaveBeenCalledWith('en', DATA)
    resolveRead({})
  })
})
