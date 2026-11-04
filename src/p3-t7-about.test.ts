import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/font/google', () => ({
  Poppins: () => ({ variable: '--font-poppins' }),
  Noto_Kufi_Arabic: () => ({ variable: '--font-noto-kufi-arabic' }),
}))

import { renderAboutAccentHeading } from '@/app/(frontend)/[locale]/about/page'
import { TeamCard } from '@/components/TeamCard'
import { TeamMarquee } from '@/components/TeamMarquee'
import type { Team } from '@/payload-types'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/about',
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

const sampleLeadership: Team = {
  id: 1,
  name: 'Eng. Khalid Al-Otaibi',
  position: 'Chief Executive Officer',
  tier: 'leadership',
  bio: 'Over 25 years of MEP contracting leadership across Saudi Arabia.',
  active: true,
  order: 1,
  updatedAt: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-10-01T00:00:00.000Z',
}

const sampleStaff: Team[] = [
  {
    id: 2,
    name: 'Project Engineer',
    position: 'Engineering',
    tier: 'staff',
    active: true,
    order: 1,
    updatedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Site Engineer',
    position: 'Site Execution',
    tier: 'staff',
    active: true,
    order: 2,
    updatedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
]

describe('P3-T7 — About Us page components & helpers', () => {
  it('renders multiline and inline gold accent headings for About sections', () => {
    const storyHtml = renderToStaticMarkup(
      React.createElement(
        'h2',
        null,
        renderAboutAccentHeading('Engineering Excellence\nSince 1979', true),
      ),
    )
    expect(storyHtml).toContain('Engineering Excellence')
    expect(storyHtml).toContain('Since 1979')

    const strengthsHtml = renderToStaticMarkup(
      React.createElement('h2', null, renderAboutAccentHeading('Our Core\nStrengths', false)),
    )
    expect(strengthsHtml).toContain('Our Core ')
    expect(strengthsHtml).toContain('>Strengths<')
  })

  it('renders TeamCard and TeamMarquee for active leadership and staff records', () => {
    const cardHtml = renderToStaticMarkup(
      React.createElement(TeamCard, {
        locale: 'en',
        member: sampleLeadership,
      }),
    )
    expect(cardHtml).toContain('Eng. Khalid Al-Otaibi')
    expect(cardHtml).toContain('Chief Executive Officer')

    const marqueeHtml = renderToStaticMarkup(
      React.createElement(TeamMarquee, {
        locale: 'en',
        members: sampleStaff,
      }),
    )
    expect(marqueeHtml).toContain('Project Engineer')
    expect(marqueeHtml).toContain('Site Engineer')
  })
})
