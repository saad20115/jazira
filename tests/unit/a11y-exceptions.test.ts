import { describe, expect, it } from 'vitest'

import { type AxeViolationLike, blockingViolations } from '../e2e/a11y-exceptions'

function contrastNode(selector: string, fgColor: string, bgColor: string) {
  return { target: [selector], any: [{ data: { fgColor, bgColor, contrastRatio: 2 } }] }
}

describe('P3-T10 — owner-approved contrast exception is scoped to exact colour pairs', () => {
  it('drops only the approved Figma colours on the approved light backgrounds', () => {
    const violations: AxeViolationLike[] = [
      {
        id: 'color-contrast',
        impact: 'serious',
        nodes: [
          contrastNode('.gold', '#DFA82A', '#ffffff'),
          contrastNode('.gold600', '#c38f1c', '#ffffff'),
          contrastNode('.muted', '#8a93a3', '#e3e7ee'),
        ],
      },
    ]
    expect(blockingViolations(violations)).toEqual([])
  })

  it('still fails on any other low-contrast colour (must-fail)', () => {
    const violations: AxeViolationLike[] = [
      {
        id: 'color-contrast',
        impact: 'serious',
        nodes: [
          contrastNode('.gold', '#dfa82a', '#ffffff'),
          contrastNode('.new', '#cccccc', '#ffffff'),
        ],
      },
    ]
    expect(blockingViolations(violations)).toEqual(['serious color-contrast: .new'])
  })

  it('still fails when an approved colour sits on a background that was not approved', () => {
    const violations: AxeViolationLike[] = [
      {
        id: 'color-contrast',
        impact: 'serious',
        nodes: [contrastNode('.x', '#dfa82a', '#efcb76')],
      },
    ]
    expect(blockingViolations(violations)).toEqual(['serious color-contrast: .x'])
  })

  it('never exempts another rule, even with the same colours in its data', () => {
    const violations: AxeViolationLike[] = [
      { id: 'link-name', impact: 'serious', nodes: [contrastNode('a.icon', '#dfa82a', '#ffffff')] },
      { id: 'image-alt', impact: 'critical', nodes: [{ target: ['img'], any: [] }] },
    ]
    expect(blockingViolations(violations)).toEqual([
      'serious link-name: a.icon',
      'critical image-alt: img',
    ])
  })

  it('ignores minor and moderate findings as before', () => {
    const violations: AxeViolationLike[] = [
      { id: 'region', impact: 'moderate', nodes: [{ target: ['div'], any: [] }] },
    ]
    expect(blockingViolations(violations)).toEqual([])
  })
})
