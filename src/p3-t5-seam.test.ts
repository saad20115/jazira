import fs from 'node:fs'
import path from 'node:path'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  InteractiveSystemsSection,
  type InteractiveSystemsSectionProps,
} from '@/components/systems3d/InteractiveSystemsSection'
import type { HomePage, Media } from '@/payload-types'

type InteractiveSystemsData = NonNullable<HomePage['interactiveSystems']>

const SECTION_CSS = 'src/components/systems3d/InteractiveSystemsSection.module.css'
const PAGE_CSS = 'src/app/(frontend)/[locale]/page.module.css'

function makeMedia(id: number, url: string, alt: string): Media {
  return {
    id,
    alt,
    url,
    filename: url.split('/').pop() ?? 'file.png',
    mimeType: 'image/png',
    filesize: 1024,
    width: 1200,
    height: 800,
    updatedAt: '2026-10-25T00:00:00.000Z',
    createdAt: '2026-10-25T00:00:00.000Z',
  }
}

function buildData(overrides: Partial<InteractiveSystemsData> = {}): InteractiveSystemsData {
  return {
    enabled: true,
    eyebrow: 'INTERACTIVE SYSTEMS',
    title: 'Every system, one accountable team',
    intro: 'Click any discipline to inspect how our MEP systems work together.',
    heroImage: makeMedia(3, '/media/tower-render.png', 'Tower render'),
    systems: [
      { id: 'sys-1', title: 'HVAC & Chilled Water', text: 'Chillers.', shot: 'hvac' },
      { id: 'sys-2', title: 'Fire Fighting', text: 'Fire pumps.', shot: 'fire' },
      { id: null, title: 'Plumbing', text: 'Booster sets.', shot: 'plumbing' },
    ],
    ...overrides,
  } as InteractiveSystemsData
}

function render(overrides: Partial<InteractiveSystemsSectionProps> = {}): string {
  const props: InteractiveSystemsSectionProps = {
    companyName: 'Al Jazira',
    data: buildData(),
    headClassNames: { head: 'HEAD_CLS', headLeft: 'HEADLEFT_CLS', heading: 'HEADING_CLS' },
    locale: 'en',
    renderHeading: (title) => React.createElement('em', { 'data-heading': 'yes' }, title),
    ...overrides,
  }
  return renderToStaticMarkup(React.createElement(InteractiveSystemsSection, props))
}

describe('P3-T5 M1 seam: InteractiveSystemsSection', () => {
  it('renders section 4 with its landmarks, the shared head classes and the heading renderer', () => {
    const html = render()
    expect(html.startsWith('<section ')).toBe(true)
    expect(html).toContain('data-home-section="interactive-systems"')
    expect(html).toContain('id="interactive-systems"')
    expect(html).toContain('data-interactive-3d-card="true"')
    expect(html).toContain('<div class="HEAD_CLS">')
    expect(html).toContain('<div class="HEADLEFT_CLS">')
    expect(html).toContain('<h2 class="HEADING_CLS t-h2"><em data-heading="yes">')
    expect(html).toContain('Every system, one accountable team</em></h2>')
    expect(html).toContain('INTERACTIVE SYSTEMS')
    expect(html).toContain('Click any discipline to inspect')
    expect(html).toContain('alt="Tower render"')
  })

  it('renders one numbered accordion item per system, the first one expanded', () => {
    const html = render()
    expect(html.match(/data-accordion-state="/g)).toHaveLength(3)
    expect(html.match(/data-accordion-state="Expanded"/g)).toHaveLength(1)
    expect(html.indexOf('data-accordion-state="Expanded"')).toBeLessThan(
      html.indexOf('HVAC &amp; Chilled Water'),
    )
    for (const badge of ['01', '02', '03']) {
      expect(html).toContain(`>${badge}<`)
    }
    expect(html).toContain('Booster sets.')
  })

  it('renders nothing when the section is disabled or has no systems', () => {
    expect(render({ data: buildData({ enabled: false }) })).toBe('')
    expect(render({ data: buildData({ systems: [] }) })).toBe('')
    expect(render({ data: null })).toBe('')
  })

  it('renders without a title when the hero image is present, and not without both', () => {
    const noTitle = render({ data: buildData({ title: '  ' }) })
    expect(noTitle).toContain('data-interactive-3d-card="true"')
    expect(noTitle).not.toContain('<h2')
    expect(render({ data: buildData({ title: null, heroImage: null }) })).toBe('')
  })

  it('moves the section-4 rules out of page.module.css into its own module (token discipline kept)', () => {
    const sectionCss = fs.readFileSync(path.resolve(process.cwd(), SECTION_CSS), 'utf8')
    const pageCss = fs.readFileSync(path.resolve(process.cwd(), PAGE_CSS), 'utf8')
    for (const selector of [
      '.interactiveSection',
      '.interactiveStack',
      '.interactiveIntroText',
      '.explorerRow',
      '.buildingCard',
      '.buildingRender',
      '.accordionCol',
      '.interactiveAccordion',
      '.systemDescription',
    ]) {
      expect(sectionCss, `${selector} in the section module`).toContain(`${selector} {`)
      expect(pageCss, `${selector} left in page.module.css`).not.toContain(selector)
    }

    const tokensCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')
    const definedVars = new Set<string>()
    for (const match of tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
      definedVars.add(match[1])
    }
    const stripped = sectionCss.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(stripped).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(stripped).not.toMatch(/\brgba?\s*\(/i)
    const usedVars = [...stripped.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1])
    expect(usedVars.length).toBeGreaterThan(0)
    for (const varName of usedVars) {
      expect(definedVars.has(varName), `undefined ${varName}`).toBe(true)
    }
  })
})
