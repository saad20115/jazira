import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  buildP4T2SeedPlan,
  loadRawProjectPhotosManifest,
  loadRawProjectsJson,
  P4_T2_SEED_SERVER_ONLY_SENTINEL,
  resolveHomeCopySource,
} from './p4-t2'
import {
  DESIGN_ASSET_IMAGES_9,
  FIGMA_FEATURED_PROJECTS_6,
  mapRawProjectScope,
  OWNER_MARQUEE_BRANDS_20,
  P4_T2_DATA_SERVER_ONLY_SENTINEL,
  PLACEHOLDER_TEAM_MEMBERS_13,
  SEED_SERVICES_10,
  SEED_STATS_5,
} from './p4-t2-data'

describe('P4-T2 seed plan & static specs (unit)', () => {
  it('exports server-only sentinels for client-bundle guard verification', () => {
    expect(P4_T2_SEED_SERVER_ONLY_SENTINEL).toBe(
      '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_P4_T2_SEED__',
    )
    expect(P4_T2_DATA_SERVER_ONLY_SENTINEL).toBe(
      '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_P4_T2_DATA__',
    )
  })

  it('plans all 91 real projects (17 published with photos, 74 draft without photos, 6 featured in Figma order, 2 ambiguous captions attached to first ref)', () => {
    const rawProjectsFile = loadRawProjectsJson()
    const rawPhotosManifest = loadRawProjectPhotosManifest()
    expect(rawProjectsFile.count).toBe(91)
    expect(rawProjectsFile.projects).toHaveLength(91)
    expect(rawPhotosManifest.photos).toHaveLength(17)

    const plan = buildP4T2SeedPlan()
    expect(plan.projects).toHaveLength(91)
    expect(plan.publishedProjectsCount).toBe(17)
    expect(plan.draftProjectsCount).toBe(74)
    expect(plan.featuredProjectsCount).toBe(6)

    // Every project is completed and flagged needsClientReview with a non-empty reviewNote
    // D-09: No seeded project slug embeds internal spreadsheet refs (-xlsx-NN or -a-p11-N)
    // D-02: No project with rawScope "MEP" carries invented fire-fighting tag
    for (const proj of plan.projects) {
      expect(proj.status).toBe('completed')
      expect(proj.needsClientReview).toBe(true)
      expect(proj.reviewNote.length).toBeGreaterThan(20)
      expect(proj.reviewNote.length).toBeLessThanOrEqual(1000)
      expect(proj.titleEn.length).toBeGreaterThan(0)
      expect(proj.titleAr.length).toBeGreaterThan(0)
      expect(proj.slug).not.toMatch(/(xlsx|a-p11)-\d+$/i)
      if (!proj.rawScope.toLowerCase().includes('fire')) {
        expect(proj.scope).not.toContain('fire-fighting')
      }
      if (proj.publishStatus === 'published') {
        expect(proj.photoFile).not.toBeNull()
        expect(proj.photoAltEn).toBe(`${proj.titleEn} — exterior`)
        expect(proj.photoAltAr).toBe(`${proj.titleAr} — واجهة خارجية`)
      } else {
        expect(proj.photoFile).toBeNull()
        expect(proj.photoAltEn).toBeNull()
      }
    }

    // First 6 projects in plan are the 6 Figma featured projects in exact Figma order
    const featured6 = plan.projects.slice(0, 6)
    expect(featured6.map((p) => p.ref)).toEqual([
      'A-p11-1',
      'XLSX-13',
      'A-p11-8',
      'A-p11-4',
      'A-p11-25',
      'XLSX-27',
    ])
    expect(featured6.map((p) => p.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(featured6.every((p) => p.featured)).toBe(true)
    expect(FIGMA_FEATURED_PROJECTS_6).toHaveLength(6)

    // Ambiguous photos ("XLSX-1|XLSX-2" and "XLSX-18|XLSX-19") attach to first ref ("XLSX-1" and "XLSX-18")
    expect(plan.ambiguousPhotoAttachments).toEqual([
      {
        file: 'seed/images/projects/hotel-al-janadriah-tower.jpg',
        rawProjectField: 'XLSX-1|XLSX-2',
        attachedToRef: 'XLSX-1',
        attachedToTitleEn: 'Hotel AL Janaderiah Palace Hotel',
        otherCandidateRef: 'XLSX-2',
        otherCandidateTitleEn: 'Hotel AL Janadriah Palace',
        captionAsPrinted: 'Hotel AL Janadriah Tower',
        question: 'caption matches no row exactly: project 1 or 2?',
      },
      {
        file: 'seed/images/projects/ramada-makkah-hotel.jpg',
        rawProjectField: 'XLSX-18|XLSX-19',
        attachedToRef: 'XLSX-18',
        attachedToTitleEn: 'Ramada Dar AL Faezeen Hotel',
        otherCandidateRef: 'XLSX-19',
        otherCandidateTitleEn: 'Ramada Ashee Hotel',
        captionAsPrinted: 'Ramada Makkah Hotel',
        question: 'caption matches no row exactly: Ramada Dar AL Faezeen or Ramada Ashee?',
      },
    ])

    const xlsx1 = plan.projects.find((p) => p.ref === 'XLSX-1')
    const xlsx2 = plan.projects.find((p) => p.ref === 'XLSX-2')
    const xlsx18 = plan.projects.find((p) => p.ref === 'XLSX-18')
    const xlsx19 = plan.projects.find((p) => p.ref === 'XLSX-19')

    expect(xlsx1?.publishStatus).toBe('published')
    expect(xlsx1?.photoFile).toBe('seed/images/projects/hotel-al-janadriah-tower.jpg')
    expect(xlsx1?.reviewNote).toContain('AMBIGUOUS PHOTO CAPTION (XLSX-1|XLSX-2)')

    expect(xlsx2?.publishStatus).toBe('draft')
    expect(xlsx2?.photoFile).toBeNull()
    expect(xlsx2?.reviewNote).toContain('AMBIGUOUS PHOTO CANDIDATE')

    expect(xlsx18?.publishStatus).toBe('published')
    expect(xlsx18?.photoFile).toBe('seed/images/projects/ramada-makkah-hotel.jpg')
    expect(xlsx18?.reviewNote).toContain('AMBIGUOUS PHOTO CAPTION (XLSX-18|XLSX-19)')

    expect(xlsx19?.publishStatus).toBe('draft')
    expect(xlsx19?.photoFile).toBeNull()
    expect(xlsx19?.reviewNote).toContain('AMBIGUOUS PHOTO CANDIDATE')
  })

  it('maps raw scope strings literally to categories and discipline scopes without inventing tags (D-02)', () => {
    expect(mapRawProjectScope('MEP')).toMatchObject({
      category: 'mep',
      scope: ['mep'],
      scopeSummaryEn: 'MEP',
    })
    expect(mapRawProjectScope('MEP Upgrade')).toMatchObject({
      category: 'mep',
      scope: ['mep'],
      scopeSummaryEn: 'MEP Upgrade',
    })
    expect(mapRawProjectScope('MEP- Upgrad')).toMatchObject({
      category: 'mep',
      scope: ['mep'],
      scopeSummaryEn: 'MEP Upgrade',
    })
    expect(mapRawProjectScope('Low Current SCS')).toMatchObject({
      category: 'low-current',
      scope: ['low-current'],
    })
    expect(mapRawProjectScope('Low Current Systems')).toMatchObject({
      category: 'low-current',
      scope: ['low-current'],
    })
    expect(mapRawProjectScope('Structured Cabling')).toMatchObject({
      category: 'low-current',
      scope: ['low-current'],
    })
    expect(mapRawProjectScope('Video Wall')).toMatchObject({
      category: 'low-current',
      scope: ['low-current'],
    })
    expect(mapRawProjectScope('Data & Low Current Systems')).toMatchObject({
      category: 'low-current',
      scope: ['low-current'],
    })
    expect(mapRawProjectScope('Data Center MEP')).toMatchObject({
      category: 'data-center',
      scope: ['data-center', 'mep'],
    })
    expect(mapRawProjectScope('Fire Fighting')).toMatchObject({
      category: 'fire-fighting',
      scope: ['fire-fighting'],
    })
    expect(mapRawProjectScope('Fire Alarm System')).toMatchObject({
      category: 'fire-fighting',
      scope: ['fire-fighting'],
    })
    expect(mapRawProjectScope('Fire Alarm & CCTV')).toMatchObject({
      category: 'fire-fighting',
      scope: ['fire-fighting', 'low-current'],
    })
    expect(mapRawProjectScope('Civil & MEP')).toMatchObject({
      category: 'civil-mep',
      scope: ['civil', 'mep'],
    })
    expect(() => mapRawProjectScope('Unknown Scope')).toThrow(/Unrecognized raw project scope/)
  })

  it('defines the 20 owner-approved marquee brands in exact Scope 4b order, 5 stats, 10 services, and [placeholder]-marked team & design images', () => {
    expect(OWNER_MARQUEE_BRANDS_20.map((b) => `${b.name} (${b.originEn})`)).toEqual([
      'Schneider Electric (France)',
      'ABB (Switzerland)',
      'Siemens (Germany)',
      'Carrier (USA)',
      'Trane (USA)',
      'Daikin (Japan)',
      'York (USA)',
      'Zamil Air Conditioners (Saudi Arabia)',
      'Grundfos (Denmark)',
      'KSB (Germany)',
      'NAFFCO (UAE)',
      'Honeywell (USA)',
      'Legrand (France)',
      'alfanar (Saudi Arabia)',
      'Elsewedy Electric (Egypt)',
      'Riyadh Cables (Saudi Arabia)',
      'Belden (USA)',
      'Cisco (USA)',
      'Bosch (Germany)',
      'Crestron (USA)',
    ])
    expect(OWNER_MARQUEE_BRANDS_20.map((b) => b.order)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    )

    expect(SEED_STATS_5.map((s) => s.value)).toEqual(['45+', '100+', '85%', '21+', '3'])
    expect(SEED_SERVICES_10).toHaveLength(10)
    expect(SEED_SERVICES_10.filter((s) => s.tier === 'main')).toHaveLength(4)
    expect(SEED_SERVICES_10.filter((s) => s.tier === 'additional')).toHaveLength(6)

    expect(PLACEHOLDER_TEAM_MEMBERS_13).toHaveLength(13)
    for (const member of PLACEHOLDER_TEAM_MEMBERS_13) {
      expect(member.nameEn.startsWith('[placeholder]')).toBe(true)
      expect(member.nameAr.startsWith('[placeholder]')).toBe(true)
    }

    expect(DESIGN_ASSET_IMAGES_9).toHaveLength(9)
    for (const img of DESIGN_ASSET_IMAGES_9) {
      expect(img.altEn.startsWith('[placeholder]')).toBe(true)
      expect(img.altAr.startsWith('[placeholder]')).toBe(true)
    }
  })

  it('gates Scope 4c home-page copy v2 until docs/content/copy-v2/01-home.md is marked APPROVED', () => {
    expect(resolveHomeCopySource()).toEqual({
      source: 'design/copy/01-home.md',
      isCopyV2Approved: false,
    })

    const tmpFile = path.join(os.tmpdir(), `copy-v2-test-${String(Date.now())}.md`)
    try {
      fs.writeFileSync(tmpFile, '# Home — copy v2\n- **Status:** APPROVED (CTO, 2026-10-25)\n')
      expect(resolveHomeCopySource(tmpFile)).toEqual({
        source: 'docs/content/copy-v2/01-home.md',
        isCopyV2Approved: true,
      })
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile)
      }
    }
  })
})
