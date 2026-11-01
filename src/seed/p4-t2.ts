import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import type { Payload } from 'payload'

import type { ProjectCategory, ProjectScope } from '../collections/Projects'
import {
  DEFAULT_INTERACTIVE_SYSTEMS_AR,
  DEFAULT_INTERACTIVE_SYSTEMS_EN,
} from '../globals/HomePage'
import {
  assertSeedEnvironmentAllowed,
  formatSeedSummaryLines,
  type MaterialsSeedRunSummary,
  SEED_ADMIN_USER,
  seedMaterialsAndBrands,
} from './materials'
import {
  DESIGN_ASSET_IMAGES_9,
  type DesignAssetImageSpec,
  FIGMA_FEATURED_PROJECTS_6,
  mapRawProjectScope,
  type MarqueeBrandSpec,
  normalizeProjectLocation,
  OWNER_MARQUEE_BRANDS_20,
  PLACEHOLDER_TEAM_MEMBERS_13,
  PROJECT_CLIENT_AR_MAP,
  PROJECT_TITLE_AR_BY_REF,
  type RawProjectPhotoEntry,
  type RawProjectPhotosManifest,
  type RawProjectRow,
  type RawProjectsJsonFile,
  SEED_SERVICES_10,
  SEED_STATS_5,
} from './p4-t2-data'

export const P4_T2_SEED_SERVER_ONLY_SENTINEL =
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_P4_T2_SEED__' as const

export interface PlannedProjectSeed {
  ref: string
  order: number
  featured: boolean
  slug: string
  titleEn: string
  titleAr: string
  locationEn: string
  locationAr: string
  clientEn: string | null
  clientAr: string | null
  rawScope: string
  category: ProjectCategory
  scope: ProjectScope[]
  scopeSummaryEn: string
  scopeSummaryAr: string
  status: 'completed'
  rawStatus: string
  source: string
  photoFile: string | null
  photoCaptionAsPrinted: string | null
  photoWidth: number | null
  photoHeight: number | null
  photoQuestion: string | null
  photoAmbiguousRawRef: string | null
  photoAltEn: string | null
  photoAltAr: string | null
  publishStatus: 'published' | 'draft'
  needsClientReview: true
  reviewNote: string
}

export interface AmbiguousPhotoAttachmentRecord {
  file: string
  rawProjectField: string
  attachedToRef: string
  attachedToTitleEn: string
  otherCandidateRef: string
  otherCandidateTitleEn: string
  captionAsPrinted: string
  question: string
}

export interface P4T2SeedPlan {
  projects: PlannedProjectSeed[]
  publishedProjectsCount: number
  draftProjectsCount: number
  featuredProjectsCount: number
  ambiguousPhotoAttachments: AmbiguousPhotoAttachmentRecord[]
  marqueeBrands: readonly MarqueeBrandSpec[]
  homeCopySource: 'design/copy/01-home.md' | 'docs/content/copy-v2/01-home.md'
}

export interface P4T2SeedRunSummary {
  reseeded: boolean
  materialsSummary: MaterialsSeedRunSummary | null
  deletedCounts: {
    projects: number
    services: number
    team: number
    stats: number
    materials: number
    brands: number
    media: number
  }
  mediaUploaded: {
    projectPhotos: number
    designAssets: number
    total: number
  }
  marqueeBrands: {
    created: number
    existingMatched: number
    oldCleared: number
    totalMarquee: number
    totalBrands: number
  }
  statsCreated: number
  servicesCreatedDraft: number
  projectsCreated: {
    publishedWithPhoto: number
    draftWithoutPhoto: number
    featured: number
    total: number
  }
  teamPlaceholdersCreatedInactive: number
  globalsSeeded: {
    siteSettings: boolean
    navigation: boolean
    draftPageGlobals: readonly string[]
  }
  homeCopySource: 'design/copy/01-home.md' | 'docs/content/copy-v2/01-home.md'
  updatedAtDigest: string
  plan: P4T2SeedPlan
}

export function loadRawProjectsJson(customPath?: string): RawProjectsJsonFile {
  const resolvedPath = customPath ?? path.resolve(process.cwd(), 'seed', 'projects.raw.json')
  const rawContent = fs.readFileSync(resolvedPath, 'utf8')
  const parsed = JSON.parse(rawContent) as Partial<RawProjectsJsonFile> | null
  if (!parsed || !Array.isArray(parsed.projects)) {
    throw new Error(`Invalid seed/projects.raw.json structure at ${resolvedPath}`)
  }
  return parsed as RawProjectsJsonFile
}

export function loadRawProjectPhotosManifest(customPath?: string): RawProjectPhotosManifest {
  const resolvedPath =
    customPath ?? path.resolve(process.cwd(), 'seed', 'images', 'projects', 'manifest.json')
  const rawContent = fs.readFileSync(resolvedPath, 'utf8')
  const parsed = JSON.parse(rawContent) as Partial<RawProjectPhotosManifest> | null
  if (!parsed || !Array.isArray(parsed.photos)) {
    throw new Error(`Invalid seed/images/projects/manifest.json structure at ${resolvedPath}`)
  }
  return parsed as RawProjectPhotosManifest
}

/**
 * Checks whether `docs/content/copy-v2/01-home.md` has been marked `APPROVED` by the CTO
 * (`handoff/tasks/P4-T2.md` Scope 4c & `M-154`). Until then, returns `'design/copy/01-home.md'`.
 */
export function resolveHomeCopySource(customCopyV2Path?: string): {
  source: 'design/copy/01-home.md' | 'docs/content/copy-v2/01-home.md'
  isCopyV2Approved: boolean
} {
  const resolvedPath =
    customCopyV2Path ?? path.resolve(process.cwd(), 'docs', 'content', 'copy-v2', '01-home.md')
  try {
    const content = fs.readFileSync(resolvedPath, 'utf8')
    const statusLineMatch = /^\s*-\s*\*\*Status:\*\*\s*(.+)$/im.exec(content)
    const statusText = statusLineMatch?.[1]?.trim() ?? ''
    if (/\bAPPROVED\b/i.test(statusText) && !/\bdraft\b/i.test(statusText)) {
      return {
        source: 'docs/content/copy-v2/01-home.md',
        isCopyV2Approved: true,
      }
    }
  } catch {
    // Fallback to design/copy/01-home.md
  }
  return {
    source: 'design/copy/01-home.md',
    isCopyV2Approved: false,
  }
}

function slugifyProjectTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90)
    .replace(/-+$/g, '')
}

/**
 * Builds the deterministic seed plan for `P4-T2` (`91` projects, `17` manifest photos,
 * `6` Figma featured projects, `20` marquee brands, and ambiguous photo resolution).
 */
export function buildP4T2SeedPlan(
  rawProjectsInput?: readonly RawProjectRow[],
  rawPhotosInput?: readonly RawProjectPhotoEntry[],
): P4T2SeedPlan {
  const rawProjects = rawProjectsInput ?? loadRawProjectsJson().projects
  const rawPhotos = rawPhotosInput ?? loadRawProjectPhotosManifest().photos
  const { source: homeCopySource } = resolveHomeCopySource()

  const projectByRef = new Map<string, RawProjectRow>()
  for (const row of rawProjects) {
    projectByRef.set(row.ref, row)
  }

  // Map each of the 17 photos to its target project ref (attaching ambiguous "A|B" to the first ref "A")
  const photoByTargetRef = new Map<
    string,
    {
      entry: RawProjectPhotoEntry
      ambiguousOtherRef: string | null
    }
  >()
  const secondaryCandidateNoteByRef = new Map<
    string,
    {
      file: string
      attachedToRef: string
      captionAsPrinted: string
      question: string
    }
  >()
  const ambiguousPhotoAttachments: AmbiguousPhotoAttachmentRecord[] = []

  for (const photo of rawPhotos) {
    const candidateRefs = photo.project
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    const primaryRef = candidateRefs[0]
    if (!primaryRef) {
      throw new Error(`Invalid photo project reference "${photo.project}" for ${photo.file}`)
    }
    const secondaryRef = candidateRefs.length > 1 ? (candidateRefs[1] ?? null) : null
    photoByTargetRef.set(primaryRef, {
      entry: photo,
      ambiguousOtherRef: secondaryRef,
    })

    if (secondaryRef) {
      const primaryRow = projectByRef.get(primaryRef)
      const secondaryRow = projectByRef.get(secondaryRef)
      const question =
        photo.question ?? `Ambiguous caption "${photo.captionAsPrinted}" between ${photo.project}`
      ambiguousPhotoAttachments.push({
        file: photo.file,
        rawProjectField: photo.project,
        attachedToRef: primaryRef,
        attachedToTitleEn: primaryRow?.name ?? primaryRef,
        otherCandidateRef: secondaryRef,
        otherCandidateTitleEn: secondaryRow?.name ?? secondaryRef,
        captionAsPrinted: photo.captionAsPrinted,
        question,
      })
      secondaryCandidateNoteByRef.set(secondaryRef, {
        file: photo.file,
        attachedToRef: primaryRef,
        captionAsPrinted: photo.captionAsPrinted,
        question,
      })
    }
  }

  const featuredByRef = new Map(FIGMA_FEATURED_PROJECTS_6.map((f) => [f.ref, f]))
  let nextNonFeaturedOrder = FIGMA_FEATURED_PROJECTS_6.length + 1
  const usedSlugs = new Set<string>()

  const projects: PlannedProjectSeed[] = rawProjects.map((raw) => {
    const featuredSpec = featuredByRef.get(raw.ref)
    const order = featuredSpec ? featuredSpec.order : nextNonFeaturedOrder++
    const featured = Boolean(featuredSpec)

    const titleEn = raw.name.trim()
    const titleAr = PROJECT_TITLE_AR_BY_REF[raw.ref] ?? titleEn
    const baseSlug = slugifyProjectTitle(titleEn)
    let slug = baseSlug
    let slugSuffix = 2
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${String(slugSuffix)}`
      slugSuffix += 1
    }
    usedSlugs.add(slug)

    const { locationEn, locationAr, fromMakkahSectionHeader } = normalizeProjectLocation(
      raw.location,
    )

    const rawCompany = raw.company.trim()
    const clientEn = rawCompany.length === 0 || rawCompany === '-' ? null : rawCompany
    const clientAr = clientEn ? (PROJECT_CLIENT_AR_MAP[clientEn] ?? clientEn) : null

    const mappedScope = mapRawProjectScope(raw.scope)
    const scopeSummaryEn = featuredSpec?.scopeSummaryEn ?? mappedScope.scopeSummaryEn
    const scopeSummaryAr = featuredSpec?.scopeSummaryAr ?? mappedScope.scopeSummaryAr

    const photoMatch = photoByTargetRef.get(raw.ref) ?? null
    const photoFile = photoMatch ? photoMatch.entry.file : null
    const publishStatus: 'published' | 'draft' = photoFile ? 'published' : 'draft'
    const photoAltEn = photoFile ? `${titleEn} — exterior` : null
    const photoAltAr = photoFile ? `${titleAr} — واجهة خارجية` : null

    const reviewNotes: string[] = [
      `Source: ${raw.ref} (${raw.source}; printed: "${raw.printed}").`,
      'AR title/location/client are drafted translations; year/value/summary left empty.',
    ]

    if (mappedScope.ambiguousScopeQuestion) {
      reviewNotes.push(mappedScope.ambiguousScopeQuestion)
    }

    if (fromMakkahSectionHeader) {
      reviewNotes.push(
        "Location seeded literally as 'Makkah Region, KSA' from profile header 'Makkah' — confirm exact city/district.",
      )
      if (/jeddah/i.test(titleEn)) {
        reviewNotes.push(
          "Title names 'Jeddah' while listed under profile section header 'Makkah' — confirm whether location is Jeddah or Makkah.",
        )
      }
    }
    if (raw.status.trim().toLowerCase() === 'working') {
      reviewNotes.push('Status in old profile was "working" — owner confirmed completed; confirm.')
    }
    if (
      raw.ref === 'A-p11-8' ||
      raw.ref === 'A-p11-10' ||
      raw.ref === 'A-p11-12'
    ) {
      reviewNotes.push(
        'Shown as "In Progress" in Figma, but owner confirmed (2026-10-24) all 91 projects are completed.',
      )
    }
    if (photoMatch) {
      reviewNotes.push(
        `Cover photo from ${photoMatch.entry.file} (caption: "${photoMatch.entry.captionAsPrinted}", ${String(photoMatch.entry.width)}×${String(photoMatch.entry.height)}px).`,
      )
      if (photoMatch.ambiguousOtherRef) {
        reviewNotes.push(
          `AMBIGUOUS PHOTO CAPTION (${photoMatch.entry.project}): "${photoMatch.entry.captionAsPrinted}" — ${String(photoMatch.entry.question)}. Attached to ${raw.ref}; confirm ${raw.ref} vs ${photoMatch.ambiguousOtherRef}.`,
        )
      }
    } else {
      reviewNotes.push('No photo in manifest.json — kept as draft.')
    }

    const secondaryAmbiguous = secondaryCandidateNoteByRef.get(raw.ref)
    if (secondaryAmbiguous) {
      reviewNotes.push(
        `AMBIGUOUS PHOTO CANDIDATE: ${secondaryAmbiguous.file} ("${secondaryAmbiguous.captionAsPrinted}") matched ${secondaryAmbiguous.attachedToRef}|${raw.ref}; attached to ${secondaryAmbiguous.attachedToRef}. Confirm if ${raw.ref}.`,
      )
    }

    return {
      ref: raw.ref,
      order,
      featured,
      slug,
      titleEn,
      titleAr,
      locationEn,
      locationAr,
      clientEn,
      clientAr,
      rawScope: raw.scope,
      category: mappedScope.category,
      scope: mappedScope.scope,
      scopeSummaryEn,
      scopeSummaryAr,
      status: 'completed',
      rawStatus: raw.status,
      source: raw.source,
      photoFile,
      photoCaptionAsPrinted: photoMatch?.entry.captionAsPrinted ?? null,
      photoWidth: photoMatch?.entry.width ?? null,
      photoHeight: photoMatch?.entry.height ?? null,
      photoQuestion: photoMatch?.entry.question ?? null,
      photoAmbiguousRawRef: photoMatch?.ambiguousOtherRef ? photoMatch.entry.project : null,
      photoAltEn,
      photoAltAr,
      publishStatus,
      needsClientReview: true,
      reviewNote: reviewNotes.join(' '),
    }
  })

  // Sort projects by `order` ascending (`1..91`) so the 6 featured projects are seeded in Figma order 1..6
  projects.sort((a, b) => a.order - b.order)

  const publishedProjectsCount = projects.filter((p) => p.publishStatus === 'published').length
  const draftProjectsCount = projects.filter((p) => p.publishStatus === 'draft').length
  const featuredProjectsCount = projects.filter((p) => p.featured).length

  return {
    projects,
    publishedProjectsCount,
    draftProjectsCount,
    featuredProjectsCount,
    ambiguousPhotoAttachments,
    marqueeBrands: OWNER_MARQUEE_BRANDS_20,
    homeCopySource,
  }
}

export function buildLexicalParagraphsRoot(paragraphs: readonly string[]): {
  root: {
    type: 'root'
    format: ''
    indent: number
    version: number
    direction: 'ltr'
    children: Array<{
      type: 'paragraph'
      format: ''
      indent: number
      version: number
      direction: 'ltr'
      textFormat: number
      textStyle: string
      children: Array<{
        type: 'text'
        detail: number
        format: number
        mode: 'normal'
        style: string
        text: string
        version: number
      }>
    }>
  }
} {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text' as const,
            detail: 0,
            format: 0,
            mode: 'normal' as const,
            style: '',
            text,
            version: 1,
          },
        ],
      })),
    },
  }
}

async function uploadMediaFileBilingual(
  payload: Payload,
  options: {
    relativeFilePath: string
    altEn: string
    altAr: string
    captionEn?: string | null
    captionAr?: string | null
    placeholder?: boolean
  },
): Promise<number> {
  const absolutePath = path.resolve(process.cwd(), options.relativeFilePath)
  const buffer = fs.readFileSync(absolutePath)
  const ext = path.extname(absolutePath).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'
  const filename = path.basename(absolutePath)

  const createdEn = await payload.create({
    collection: 'media',
    locale: 'en',
    data: {
      alt: options.altEn,
      placeholder: options.placeholder === true,
      ...(options.captionEn ? { caption: options.captionEn } : {}),
    },
    file: {
      data: buffer,
      mimetype: mimeType,
      name: filename,
      size: buffer.byteLength,
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  await payload.update({
    collection: 'media',
    id: createdEn.id,
    locale: 'ar',
    data: {
      alt: options.altAr,
      ...(options.captionAr ? { caption: options.captionAr } : {}),
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  return createdEn.id
}

export async function clearGlobalsReferencesBeforeReseed(payload: Payload): Promise<void> {
  for (const locale of ['en', 'ar'] as const) {
    await payload.updateGlobal({
      slug: 'site-settings',
      locale,
      data: {
        office: {
          mapImage: null,
        },
        defaultSeo: {
          image: null,
        },
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
  }

  const hasPublishedGlobalRow = async (
    slug:
      | 'home-page'
      | 'services-page'
      | 'about-page'
      | 'projects-page'
      | 'contact-page'
      | 'privacy-page',
  ): Promise<boolean> => {
    const doc = (await payload.findGlobal({
      slug,
      draft: false,
      depth: 0,
      overrideAccess: true,
    })) as unknown as { id?: unknown }
    return typeof doc.id === 'number' || typeof doc.id === 'string'
  }

  for (const locale of ['en', 'ar'] as const) {
    const defaultSystems =
      locale === 'ar' ? DEFAULT_INTERACTIVE_SYSTEMS_AR : DEFAULT_INTERACTIVE_SYSTEMS_EN

    for (const draft of [true, false] as const) {
      if (!draft && !(await hasPublishedGlobalRow('home-page'))) {
        continue
      }
      await payload.updateGlobal({
        slug: 'home-page',
        locale,
        draft,
        data: {
          ...(draft ? { _status: 'draft' as const } : {}),
          hero: {
            background: null,
            backgroundVideo: null,
          },
          whoWeAre: {
            badgeStat: null,
            image: null,
          },
          interactiveSystems: {
            heroImage: null,
            systems: defaultSystems.map((s) => ({
              title: s.title,
              text: s.text,
              shot: s.shot,
              disciplines: [...s.disciplines],
            })),
          },
          statsSection: {
            stats: [],
            backgroundImage: null,
          },
          cta: {
            backgroundImage: null,
          },
          meta: {
            image: null,
          },
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    for (const draft of [true, false] as const) {
      if (!draft && !(await hasPublishedGlobalRow('services-page'))) {
        continue
      }
      await payload.updateGlobal({
        slug: 'services-page',
        locale,
        draft,
        data: {
          ...(draft ? { _status: 'draft' as const } : {}),
          pageHeader: {
            image: null,
          },
          cta: {
            backgroundImage: null,
          },
          meta: {
            image: null,
          },
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    for (const draft of [true, false] as const) {
      if (!draft && !(await hasPublishedGlobalRow('about-page'))) {
        continue
      }
      await payload.updateGlobal({
        slug: 'about-page',
        locale,
        draft,
        data: {
          ...(draft ? { _status: 'draft' as const } : {}),
          pageHeader: {
            image: null,
          },
          story: {
            badgeStat: null,
            image: null,
          },
          missionVision: {
            mission: {
              image: null,
            },
            vision: {
              image: null,
            },
            image: null,
          },
          meta: {
            image: null,
          },
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    for (const draft of [true, false] as const) {
      if (!draft && !(await hasPublishedGlobalRow('projects-page'))) {
        continue
      }
      await payload.updateGlobal({
        slug: 'projects-page',
        locale,
        draft,
        data: {
          ...(draft ? { _status: 'draft' as const } : {}),
          pageHeader: {
            image: null,
          },
          impact: {
            stats: [],
          },
          portfolio: {
            badgeStat: null,
            image: null,
          },
          cta: {
            backgroundImage: null,
          },
          meta: {
            image: null,
          },
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    for (const draft of [true, false] as const) {
      if (!draft && !(await hasPublishedGlobalRow('contact-page'))) {
        continue
      }
      await payload.updateGlobal({
        slug: 'contact-page',
        locale,
        draft,
        data: {
          ...(draft ? { _status: 'draft' as const } : {}),
          pageHeader: {
            image: null,
          },
          meta: {
            image: null,
          },
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    for (const draft of [true, false] as const) {
      if (!draft && !(await hasPublishedGlobalRow('privacy-page'))) {
        continue
      }
      await payload.updateGlobal({
        slug: 'privacy-page',
        locale,
        draft,
        data: {
          ...(draft ? { _status: 'draft' as const } : {}),
          pageHeader: {
            image: null,
          },
          body: null,
          meta: {
            image: null,
          },
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }
  }
}

/**
 * Seeds `P4-T2` (`site-settings`, `navigation`, `stats`, `services`, `projects` + `17` photos,
 * `20` marquee `brands`, `team` placeholders, and the `6` publishable page globals as `draft`)
 * through Payload's Local API with `overrideAccess: false` and `SEED_ADMIN_USER`.
 */
export async function seedP4T2Content(
  payload: Payload,
  options?: {
    argv?: readonly string[]
    nodeEnv?: string
    reseed?: boolean
  },
): Promise<P4T2SeedRunSummary> {
  const effectiveNodeEnv = options?.nodeEnv ?? process.env.NODE_ENV
  const effectiveArgv = options?.argv ?? process.argv
  const reseed = options?.reseed === true || effectiveArgv.includes('--reseed')

  assertSeedEnvironmentAllowed(effectiveNodeEnv, effectiveArgv, reseed)

  const [
    existingBrandsCountRes,
    existingMaterialsCountRes,
    existingStatsCountRes,
    existingServicesCountRes,
    existingProjectsCountRes,
    existingTeamCountRes,
    existingMediaCountRes,
  ] = await Promise.all([
    payload.count({ collection: 'brands', overrideAccess: false, user: SEED_ADMIN_USER }),
    payload.count({ collection: 'materials', overrideAccess: false, user: SEED_ADMIN_USER }),
    payload.count({ collection: 'stats', overrideAccess: false, user: SEED_ADMIN_USER }),
    payload.count({ collection: 'services', overrideAccess: false, user: SEED_ADMIN_USER }),
    payload.count({ collection: 'projects', overrideAccess: false, user: SEED_ADMIN_USER }),
    payload.count({ collection: 'team', overrideAccess: false, user: SEED_ADMIN_USER }),
    payload.count({ collection: 'media', overrideAccess: false, user: SEED_ADMIN_USER }),
  ])

  const counts = {
    brands: existingBrandsCountRes.totalDocs,
    materials: existingMaterialsCountRes.totalDocs,
    stats: existingStatsCountRes.totalDocs,
    services: existingServicesCountRes.totalDocs,
    projects: existingProjectsCountRes.totalDocs,
    team: existingTeamCountRes.totalDocs,
    media: existingMediaCountRes.totalDocs,
  }

  const hasAnyP4T2Docs =
    counts.stats > 0 || counts.services > 0 || counts.projects > 0 || counts.team > 0
  const hasHalfEmptyP4T1 = (counts.brands > 0) !== (counts.materials > 0)

  if ((hasAnyP4T2Docs || hasHalfEmptyP4T1) && !reseed) {
    throw new Error(
      `[seed] Refusing to run seed on a non-empty database (brands=${String(counts.brands)}, materials=${String(counts.materials)}, stats=${String(counts.stats)}, services=${String(counts.services)}, projects=${String(counts.projects)}, team=${String(counts.team)}). The seed is a first-run baseline and never overwrites existing data. Pass --reseed in development to clear and rebuild.`,
    )
  }

  const deletedCounts = {
    projects: 0,
    services: 0,
    team: 0,
    stats: 0,
    materials: 0,
    brands: 0,
    media: 0,
  }

  let reseeded = false
  if (
    reseed &&
    (hasAnyP4T2Docs || counts.brands > 0 || counts.materials > 0 || counts.media > 0)
  ) {
    await clearGlobalsReferencesBeforeReseed(payload)

    const delProjects = await payload.delete({
      collection: 'projects',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.projects = delProjects.docs.length

    const delServices = await payload.delete({
      collection: 'services',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.services = delServices.docs.length

    const delTeam = await payload.delete({
      collection: 'team',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.team = delTeam.docs.length

    const delStats = await payload.delete({
      collection: 'stats',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.stats = delStats.docs.length

    const delMaterials = await payload.delete({
      collection: 'materials',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.materials = delMaterials.docs.length

    const delBrands = await payload.delete({
      collection: 'brands',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.brands = delBrands.docs.length

    const delMedia = await payload.delete({
      collection: 'media',
      where: { id: { exists: true } },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    deletedCounts.media = delMedia.docs.length
    reseeded = true
  }

  // Ensure P4-T1 materials + brands baseline is present
  let materialsSummary: MaterialsSeedRunSummary | null = null
  const brandsAfterClean = await payload.count({
    collection: 'brands',
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })
  if (brandsAfterClean.totalDocs === 0) {
    materialsSummary = await seedMaterialsAndBrands(payload, {
      nodeEnv: effectiveNodeEnv,
      argv: effectiveArgv,
      reseed: false,
    })
  }

  const plan = buildP4T2SeedPlan()

  // ---------------------------------------------------------------------------
  // 1. Upload the 9 Figma design placeholder images + 17 real project photos
  // ---------------------------------------------------------------------------
  const designMediaIdByKey = new Map<DesignAssetImageSpec['key'], number>()
  for (const imgSpec of DESIGN_ASSET_IMAGES_9) {
    const mediaId = await uploadMediaFileBilingual(payload, {
      relativeFilePath: imgSpec.file,
      altEn: imgSpec.altEn,
      altAr: imgSpec.altAr,
      placeholder: true,
    })
    designMediaIdByKey.set(imgSpec.key, mediaId)
  }

  const projectPhotoMediaIdByRef = new Map<string, number>()
  for (const proj of plan.projects) {
    if (proj.photoFile && proj.photoAltEn && proj.photoAltAr) {
      const mediaId = await uploadMediaFileBilingual(payload, {
        relativeFilePath: proj.photoFile,
        altEn: proj.photoAltEn,
        altAr: proj.photoAltAr,
        placeholder: false,
      })
      projectPhotoMediaIdByRef.set(proj.ref, mediaId)
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Scope 4b: 20 Owner Marquee Brands (`showInMarquee: true`, `order: 1..20`)
  // ---------------------------------------------------------------------------
  const [existingBrandsRes, existingBrandsArRes] = await Promise.all([
    payload.find({
      collection: 'brands',
      limit: 200,
      depth: 0,
      locale: 'en',
      fallbackLocale: false,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'brands',
      limit: 200,
      depth: 0,
      locale: 'ar',
      fallbackLocale: false,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
  ])

  const existingBrandByLowerName = new Map<string, (typeof existingBrandsRes.docs)[number]>()
  for (const b of existingBrandsRes.docs) {
    existingBrandByLowerName.set(b.name.toLowerCase(), b)
  }
  const existingBrandArById = new Map<number, (typeof existingBrandsArRes.docs)[number]>()
  for (const b of existingBrandsArRes.docs) {
    existingBrandArById.set(b.id, b)
  }

  const matchedExistingBrandIds = new Set<number>()
  let marqueeBrandsCreated = 0
  let marqueeBrandsExistingMatched = 0

  for (const marqueeSpec of plan.marqueeBrands) {
    let existingDoc: (typeof existingBrandsRes.docs)[number] | undefined
    for (const candidateName of marqueeSpec.matchExistingNames) {
      const found = existingBrandByLowerName.get(candidateName.toLowerCase())
      if (found) {
        existingDoc = found
        break
      }
    }

    if (existingDoc) {
      matchedExistingBrandIds.add(existingDoc.id)
      marqueeBrandsExistingMatched += 1
      const existingOriginEn =
        typeof existingDoc.origin === 'string' && existingDoc.origin.trim().length > 0
          ? existingDoc.origin.trim()
          : null
      const existingDocAr = existingBrandArById.get(existingDoc.id)
      const existingOriginAr =
        typeof existingDocAr?.origin === 'string' && existingDocAr.origin.trim().length > 0
          ? existingDocAr.origin.trim()
          : null

      await payload.update({
        collection: 'brands',
        id: existingDoc.id,
        locale: 'en',
        data: {
          name: marqueeSpec.name,
          origin: existingOriginEn ?? marqueeSpec.originEn,
          showInMarquee: true,
          order: marqueeSpec.order,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
      await payload.update({
        collection: 'brands',
        id: existingDoc.id,
        locale: 'ar',
        data: {
          name: marqueeSpec.name,
          origin: existingOriginAr ?? marqueeSpec.originAr,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    } else {
      const createdBrand = await payload.create({
        collection: 'brands',
        locale: 'en',
        data: {
          name: marqueeSpec.name,
          origin: marqueeSpec.originEn,
          showInMarquee: true,
          order: marqueeSpec.order,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
      await payload.update({
        collection: 'brands',
        id: createdBrand.id,
        locale: 'ar',
        data: {
          origin: marqueeSpec.originAr,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
      marqueeBrandsCreated += 1
    }
  }

  // Clear `showInMarquee: false` and re-order non-marquee brands (`21..100`)
  const nonMarqueeExistingDocs = existingBrandsRes.docs
    .filter((b) => !matchedExistingBrandIds.has(b.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

  let oldMarqueeCleared = 0
  let nextBrandOrder = plan.marqueeBrands.length + 1
  for (const nonMarqueeDoc of nonMarqueeExistingDocs) {
    if (nonMarqueeDoc.showInMarquee) {
      oldMarqueeCleared += 1
    }
    await payload.update({
      collection: 'brands',
      id: nonMarqueeDoc.id,
      locale: 'en',
      data: {
        showInMarquee: false,
        order: nextBrandOrder++,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
  }

  // ---------------------------------------------------------------------------
  // 3. Scope 2: Seed the 5 `stats` (`45+`, `100+`, `85%`, `21+`, `3`)
  // ---------------------------------------------------------------------------
  const statIdByKey = new Map<string, number>()
  let statsCreated = 0
  for (const statSpec of SEED_STATS_5) {
    const createdStat = await payload.create({
      collection: 'stats',
      locale: 'en',
      data: {
        value: statSpec.value,
        label: statSpec.labelEn,
        order: statSpec.order,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    await payload.update({
      collection: 'stats',
      id: createdStat.id,
      locale: 'ar',
      data: {
        label: statSpec.labelAr,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    statIdByKey.set(statSpec.key, createdStat.id)
    statsCreated += 1
  }

  // ---------------------------------------------------------------------------
  // 4. Scope 3: Seed the 10 `services` (4 `main` + 6 `additional`) as `draft`
  // ---------------------------------------------------------------------------
  let servicesCreatedDraft = 0
  for (const svcSpec of SEED_SERVICES_10) {
    const imageId = svcSpec.designImageKey
      ? (designMediaIdByKey.get(svcSpec.designImageKey) ?? null)
      : null

    const createdSvcEn = await payload.create({
      collection: 'services',
      locale: 'en',
      draft: true,
      data: {
        title: svcSpec.titleEn,
        slug: svcSpec.slug,
        tier: svcSpec.tier,
        featured: svcSpec.featured,
        icon: svcSpec.icon,
        shortDescription: svcSpec.shortDescriptionEn,
        highlights: svcSpec.highlightsEn.map((text) => ({ text })),
        body: buildLexicalParagraphsRoot([svcSpec.shortDescriptionEn]),
        ...(imageId ? { image: imageId } : {}),
        order: svcSpec.order,
        _status: 'draft',
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const highlightRowsEn = Array.isArray(createdSvcEn.highlights) ? createdSvcEn.highlights : []
    await payload.update({
      collection: 'services',
      id: createdSvcEn.id,
      locale: 'ar',
      draft: true,
      data: {
        title: svcSpec.titleAr,
        shortDescription: svcSpec.shortDescriptionAr,
        highlights: svcSpec.highlightsAr.map((text, idx) => ({
          ...(highlightRowsEn[idx]?.id ? { id: highlightRowsEn[idx].id } : {}),
          text,
        })),
        body: buildLexicalParagraphsRoot([svcSpec.shortDescriptionAr]),
        _status: 'draft',
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    servicesCreatedDraft += 1
  }

  // ---------------------------------------------------------------------------
  // 5. Scope 4a: Seed all 91 `projects` (17 published with photo, 74 draft without photo)
  // ---------------------------------------------------------------------------
  let publishedWithPhoto = 0
  let draftWithoutPhoto = 0
  let featuredCount = 0

  for (const projSpec of plan.projects) {
    const coverImageId = projectPhotoMediaIdByRef.get(projSpec.ref) ?? null
    const isPublished = projSpec.publishStatus === 'published' && coverImageId !== null

    const createdProjEn = await payload.create({
      collection: 'projects',
      locale: 'en',
      draft: !isPublished,
      data: {
        title: projSpec.titleEn,
        slug: projSpec.slug,
        category: projSpec.category,
        client: projSpec.clientEn,
        location: projSpec.locationEn,
        status: projSpec.status,
        scope: projSpec.scope,
        scopeSummary: projSpec.scopeSummaryEn,
        coverImage: coverImageId,
        featured: projSpec.featured,
        order: projSpec.order,
        needsClientReview: true,
        reviewNote: projSpec.reviewNote,
        _status: isPublished ? 'published' : 'draft',
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    await payload.update({
      collection: 'projects',
      id: createdProjEn.id,
      locale: 'ar',
      draft: !isPublished,
      data: {
        title: projSpec.titleAr,
        client: projSpec.clientAr,
        location: projSpec.locationAr,
        scopeSummary: projSpec.scopeSummaryAr,
        _status: isPublished ? 'published' : 'draft',
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    if (isPublished) {
      publishedWithPhoto += 1
    } else {
      draftWithoutPhoto += 1
    }
    if (projSpec.featured) {
      featuredCount += 1
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Scope 5: Seed 13 placeholder `team` members (`[placeholder]`, `active: false`)
  // ---------------------------------------------------------------------------
  const leadershipPlaceholderPhotoId = designMediaIdByKey.get('about-team') ?? null
  let teamPlaceholdersCreatedInactive = 0

  for (const memberSpec of PLACEHOLDER_TEAM_MEMBERS_13) {
    const createdMember = await payload.create({
      collection: 'team',
      locale: 'en',
      data: {
        name: memberSpec.nameEn,
        position: memberSpec.positionEn,
        tier: memberSpec.tier,
        ...(memberSpec.tier === 'leadership' && leadershipPlaceholderPhotoId
          ? { photo: leadershipPlaceholderPhotoId }
          : {}),
        ...(memberSpec.tier === 'leadership' && memberSpec.bioEn ? { bio: memberSpec.bioEn } : {}),
        active: false,
        order: memberSpec.order,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    await payload.update({
      collection: 'team',
      id: createdMember.id,
      locale: 'ar',
      data: {
        name: memberSpec.nameAr,
        position: memberSpec.positionAr,
        ...(memberSpec.tier === 'leadership' && memberSpec.bioAr ? { bio: memberSpec.bioAr } : {}),
        active: false,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    teamPlaceholdersCreatedInactive += 1
  }

  // ---------------------------------------------------------------------------
  // 7. Scope 1: Seed `site-settings` (`arabicEnabled: false`) & `navigation`
  // ---------------------------------------------------------------------------
  const heroCityMediaId = designMediaIdByKey.get('hero-city') ?? null
  const aboutTeamMediaId = designMediaIdByKey.get('about-team') ?? null
  const bgPipesMediaId = designMediaIdByKey.get('bg-pipes') ?? null
  const headerOfficeMediaId = designMediaIdByKey.get('header-office') ?? null
  const projTowerMediaId = designMediaIdByKey.get('proj-tower') ?? null
  const svcMepMediaId = designMediaIdByKey.get('svc-mep') ?? null
  const towerRenderMediaId = designMediaIdByKey.get('tower-render') ?? null

  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      arabicEnabled: false,
      companyName: 'Al Jazira for Imdad Smart Co.',
      tagline: 'MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS',
      email: 'info@aljazira.co',
      phone: '+966 57 353 4185',
      whatsapp: '966573534185',
      whatsappLabel: 'Chat with an engineer',
      address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
      mapUrl: 'https://maps.google.com/?q=7676+Bathaa+Quraish,+Makkah',
      workingHours: 'Sunday – Thursday, 8:00 AM – 5:00 PM',
      office: {
        title: 'Office Location',
        address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
        mapImage: null,
        mapUrl: 'https://maps.google.com/?q=7676+Bathaa+Quraish,+Makkah',
      },
      socials: [],
      footerText:
        'A leading MEP construction company in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over 45 years of experience.',
      copyright: '© 2026 Al Jazira for Imdad Smart Company. All rights reserved.',
      defaultSeo: {
        title: 'Al Jazira for Imdad Smart Co. | MEP Contracting, Firefighting & Smart Systems',
        description:
          'Al Jazira for Imdad Smart Company is a leading MEP contractor in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over four decades of proven excellence.',
        image: null,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'ar',
    data: {
      arabicEnabled: false,
      companyName: 'شركة الجزيرة الإمداد الذكي',
      tagline: 'مقاولات الكهروميكانيك · مكافحة الحريق · الأنظمة الذكية',
      whatsappLabel: 'تحدث مع مهندس مختص',
      address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
      workingHours: 'الأحد – الخميس، 8:00 صباحاً – 5:00 مساءً',
      office: {
        title: 'موقع المقر الرئيسي',
        address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
      },
      footerText:
        'شركة رائدة في مقاولات الأعمال الكهروميكانيكية (MEP) في منطقة الخليج، نقدم حلولاً عالمية المستوى في الأنظمة الميكانيكية والكهربائية والصحية بخبرة تتجاوز 45 عاماً.',
      copyright: '© 2026 شركة الجزيرة الإمداد الذكي. جميع الحقوق محفوظة.',
      defaultSeo: {
        title: 'شركة الجزيرة الإمداد الذكي | مقاولات الكهروميكانيك ومكافحة الحريق والأنظمة الذكية',
        description:
          'شركة الجزيرة الإمداد الذكي رائدة مقاولات الكهروميكانيك (MEP) في منطقة الخليج، نقدم حلولاً عالمية المستوى في الأعمال الميكانيكية والكهربائية والصحية بخبرة تتجاوز أربعة عقود.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  const navEn = await payload.updateGlobal({
    slug: 'navigation',
    locale: 'en',
    data: {
      header: [
        {
          label: 'Services',
          link: { type: 'internal', internalRoute: '/services' },
        },
        {
          label: 'About Us',
          link: { type: 'internal', internalRoute: '/about' },
        },
        {
          label: 'Projects',
          link: { type: 'internal', internalRoute: '/projects' },
        },
        {
          label: 'Contact Us',
          link: { type: 'internal', internalRoute: '/contact' },
        },
      ],
      headerCta: {
        label: 'Get a Quote',
        link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
      },
      footer: [
        {
          title: 'Quick Links',
          links: [
            { label: 'Home', link: { type: 'internal', internalRoute: '/' } },
            { label: 'Services', link: { type: 'internal', internalRoute: '/services' } },
            { label: 'About Us', link: { type: 'internal', internalRoute: '/about' } },
            { label: 'Projects', link: { type: 'internal', internalRoute: '/projects' } },
            { label: 'Contact Us', link: { type: 'internal', internalRoute: '/contact' } },
          ],
        },
      ],
      footerCta: {
        title: 'Have a project in mind?',
        text: 'Send us your drawings or BOQ and our engineers will get back to you.',
        button: {
          label: 'Get a Quote',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        whatsappLabel: 'Chat on WhatsApp',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  const headerRowsEn = Array.isArray(navEn.header) ? navEn.header : []
  const headerLabelsAr = ['خدماتنا', 'من نحن', 'مشاريعنا', 'تواصل معنا']
  const footerColsEn = Array.isArray(navEn.footer) ? navEn.footer : []
  const footerCol0LinksEn = Array.isArray(footerColsEn[0]?.links) ? footerColsEn[0].links : []
  const footerLinksLabelsAr = ['الرئيسية', 'خدماتنا', 'من نحن', 'مشاريعنا', 'تواصل معنا']

  await payload.updateGlobal({
    slug: 'navigation',
    locale: 'ar',
    data: {
      header: headerRowsEn.map((row, idx) => ({
        ...(row.id ? { id: row.id } : {}),
        label: headerLabelsAr[idx] ?? row.label,
        link: row.link,
      })),
      headerCta: {
        label: 'اطلب عرض سعر',
        link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
      },
      footer: [
        {
          ...(footerColsEn[0]?.id ? { id: footerColsEn[0].id } : {}),
          title: 'روابط سريعة',
          links: footerCol0LinksEn.map((lnk, idx) => ({
            ...(lnk.id ? { id: lnk.id } : {}),
            label: footerLinksLabelsAr[idx] ?? lnk.label,
            link: lnk.link,
          })),
        },
      ],
      footerCta: {
        title: 'هل لديك مشروع قيد التخطيط؟',
        text: 'أرسل لنا المخططات أو جداول الكميات (BOQ) وسيتواصل معك مهندسونا.',
        button: {
          label: 'اطلب عرض سعر',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        whatsappLabel: 'تحدث عبر واتساب',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // ---------------------------------------------------------------------------
  // 8. Scope 4 & 4c: Seed the 6 publishable page globals as `_status: 'draft'`
  // ---------------------------------------------------------------------------
  const yearsStatId = statIdByKey.get('years') ?? null
  const projectsStatId = statIdByKey.get('projects') ?? null
  const selfPerformedStatId = statIdByKey.get('selfPerformed') ?? null
  const disciplinesStatId = statIdByKey.get('disciplines') ?? null
  const countriesStatId = statIdByKey.get('countries') ?? null

  const homeStatsIds = [yearsStatId, projectsStatId, selfPerformedStatId, disciplinesStatId].filter(
    (id): id is number => typeof id === 'number',
  )
  const projectsImpactStatsIds = [
    projectsStatId,
    countriesStatId,
    yearsStatId,
    selfPerformedStatId,
  ].filter((id): id is number => typeof id === 'number')

  // 8a. `home-page` (from `design/copy/01-home.md`, `draft: true`, with `interactiveSystems.systems` in both `en` & `ar`)
  const savedHomeEn = await payload.updateGlobal({
    slug: 'home-page',
    locale: 'en',
    draft: true,
    data: {
      _status: 'draft',
      hero: {
        enabled: true,
        eyebrow: '45+ Years of Engineering Excellence',
        title: 'Building the Future',
        titleAccent: 'with Smart Solutions',
        subtitle:
          'Al Jazira for Imdad Smart Company is a leading MEP contractor in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over four decades of proven excellence.',
        background: heroCityMediaId,
        backgroundVideo: null,
        primaryCta: {
          label: 'Explore Our Services',
          link: { type: 'internal', internalRoute: '/services' },
        },
        secondaryCta: {
          label: 'View Projects',
          link: { type: 'internal', internalRoute: '/projects' },
        },
      },
      whoWeAre: {
        enabled: true,
        badgeStat: yearsStatId,
        eyebrow: 'Who We Are',
        title: 'Engineering Excellence\nSince 1979',
        text: buildLexicalParagraphsRoot([
          'With nearly five decades of expertise in Gulf markets, Al Jazira for Imdad Smart Company has rapidly expanded and grown from strength to strength, delivering exceptional performance and earning a reputation as a highly dependable specialist MEP contractor.',
          'We deliver comprehensive MEP packages through our in-house engineers, minimizing reliance on subcontractors and ensuring better quality, service, and on-time delivery.',
        ]),
        button: {
          label: 'Learn More About Us',
          link: { type: 'internal', internalRoute: '/about' },
        },
        image: aboutTeamMediaId,
      },
      coreServices: {
        enabled: true,
        eyebrow: 'What We Do',
        title: 'Integrated MEP & construction services\nunder one contract',
        intro:
          'From design coordination to testing & commissioning, around 85% of every MEP package is delivered by our own engineers and technicians — fewer interfaces, lower risk, faster handover.',
        button: {
          label: 'View All Services',
          link: { type: 'internal', internalRoute: '/services' },
        },
      },
      interactiveSystems: {
        enabled: true,
        eyebrow: 'Interactive',
        title: 'Every system,\none accountable team',
        intro:
          'Pick a system to see how we design, install, test and commission it, from rooftop chillers to the fire pumps at ground level.',
        systems: DEFAULT_INTERACTIVE_SYSTEMS_EN.map((item) => ({
          title: item.title,
          text: item.text,
          shot: item.shot,
          disciplines: [...item.disciplines],
        })),
        heroImage: towerRenderMediaId,
        relatedProjectsLabel: 'Related projects',
        liveModelLabel: 'Open the live 3D model',
      },
      statsSection: {
        enabled: true,
        title: 'Trusted by Industry Leaders',
        text: 'Our numbers speak for themselves — decades of reliable MEP solutions across the Gulf region.',
        stats: homeStatsIds,
        backgroundImage: bgPipesMediaId,
      },
      featuredProjects: {
        enabled: true,
        eyebrow: 'Our Portfolio',
        title: 'Featured\nProjects',
        intro:
          'A showcase of our most prestigious MEP construction and smart systems projects across the Gulf region.',
        button: {
          label: 'View All Projects',
          link: { type: 'internal', internalRoute: '/projects' },
        },
      },
      partners: {
        enabled: true,
        eyebrow: 'Trusted Partners',
        title: 'Trusted Partners',
        intro: 'We collaborate with world-leading brands to deliver the highest quality solutions.',
      },
      cta: {
        enabled: true,
        title: 'Ready to Build',
        titleAccent: 'Your Next Project?',
        text: 'Let our 45+ years of MEP expertise work for your next construction or infrastructure project. Get in touch for a free consultation.',
        button: {
          label: 'Contact Us Today',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        secondaryButton: {
          label: 'Call Us Now',
          link: { type: 'external', url: 'tel:+966573534185' },
        },
        backgroundImage: projTowerMediaId,
      },
      meta: {
        title: 'Al Jazira for Imdad Smart Co. | MEP Contracting, Firefighting & Smart Systems',
        description:
          'Al Jazira for Imdad Smart Company is a leading MEP contractor in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over four decades of proven excellence.',
        image: heroCityMediaId,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  const homeSystemsRowsEn = Array.isArray(savedHomeEn.interactiveSystems?.systems)
    ? savedHomeEn.interactiveSystems.systems
    : []

  await payload.updateGlobal({
    slug: 'home-page',
    locale: 'ar',
    draft: true,
    data: {
      _status: 'draft',
      hero: {
        enabled: true,
        eyebrow: '+45 عاماً من التميز الهندسي',
        title: 'نبني المستقبل',
        titleAccent: 'بحلول ذكية متكاملة',
        subtitle:
          'شركة الجزيرة الإمداد الذكي هي مقاول رائد لأعمال الكهروميكانيك (MEP) في منطقة الخليج، تقدم حلولاً عالمية المستوى في الأنظمة الميكانيكية والكهربائية والصحية بخبرة راسخة تتجاوز أربعة عقود.',
        primaryCta: {
          label: 'استكشف خدماتنا',
          link: { type: 'internal', internalRoute: '/services' },
        },
        secondaryCta: {
          label: 'استعرض المشاريع',
          link: { type: 'internal', internalRoute: '/projects' },
        },
      },
      whoWeAre: {
        enabled: true,
        eyebrow: 'من نحن',
        title: 'تميز هندسي\nمنذ عام 1979',
        text: buildLexicalParagraphsRoot([
          'بخبرة تقارب خمسة عقود في أسواق الخليج، توسعت شركة الجزيرة الإمداد الذكي ونمت بخطى واثقة، مقدمةً أداءً استثنائياً رسّخ مكانتها كمقاول متخصص وموثوق في أعمال الكهروميكانيك (MEP).',
          'ننفذ حزم الأعمال الكهروميكانيكية المتكاملة عبر مهندسينا وكوادرنا الداخلية، مما يقلل الاعتماد على مقاولي الباطن ويضمن أعلى مستويات الجودة والخدمة والالتزام بمواعيد التسليم.',
        ]),
        button: {
          label: 'تعرف علينا أكثر',
          link: { type: 'internal', internalRoute: '/about' },
        },
      },
      coreServices: {
        enabled: true,
        eyebrow: 'ماذا نقدم',
        title: 'خدمات الكهروميكانيك والإنشاءات المتكاملة\nتحت عقد واحد',
        intro:
          'من تنسيق التصميم إلى الاختبار والتشغيل التجريبي، يتم تنفيذ نحو 85% من كل حزمة كهروميكانيكية بواسطة مهندسينا وفنيينا الداخليين — تقاطعات أقل، مخاطر أدنى، وتسليم أسرع.',
        button: {
          label: 'عرض جميع الخدمات',
          link: { type: 'internal', internalRoute: '/services' },
        },
      },
      interactiveSystems: {
        enabled: true,
        eyebrow: 'تفاعلي',
        title: 'كل نظام،\nفريق واحد مسؤول',
        intro:
          'اختر نظاماً لتتعرف على كيفية تصميمه وتركيبه واختباره وتشغيله، من المبردات على السطح إلى مضخات الحريق في الطابق الأرضي.',
        systems: DEFAULT_INTERACTIVE_SYSTEMS_AR.map((item, idx) => ({
          ...(homeSystemsRowsEn[idx]?.id ? { id: homeSystemsRowsEn[idx].id } : {}),
          title: item.title,
          text: item.text,
          shot: item.shot,
          disciplines: [...item.disciplines],
        })),
        relatedProjectsLabel: 'مشاريع ذات صلة',
        liveModelLabel: 'افتح المجسم التفاعلي ثلاثي الأبعاد',
      },
      statsSection: {
        enabled: true,
        title: 'ثقة رواد الصناعة',
        text: 'أرقامنا تتحدث عن نفسها — عقود من حلول الكهروميكانيك الموثوقة في مختلف أنحاء الخليج.',
      },
      featuredProjects: {
        enabled: true,
        eyebrow: 'سجل إنجازاتنا',
        title: 'مشاريع\nمميزة',
        intro: 'نماذج مختارة من أبرز مشاريعنا في مقاولات الكهروميكانيك والأنظمة الذكية في منطقة الخليج.',
        button: {
          label: 'عرض جميع المشاريع',
          link: { type: 'internal', internalRoute: '/projects' },
        },
      },
      partners: {
        enabled: true,
        eyebrow: 'شركاء النجاح',
        title: 'شركاء النجاح',
        intro: 'نتعاون مع أبرز العلامات التجارية العالمية لتقديم أعلى مستويات الجودة والاعتمادية.',
      },
      cta: {
        enabled: true,
        title: 'هل أنت مستعد لبناء',
        titleAccent: 'مشروعك القادم؟',
        text: 'ضع خبرتنا الممتدة لأكثر من 45 عاماً في أعمال الكهروميكانيك في خدمة مشروعك الإنشائي أو التحتي القادم. تواصل معنا للحصول على استشارة مجانية.',
        button: {
          label: 'تواصل معنا اليوم',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        secondaryButton: {
          label: 'اتصل بنا الآن',
          link: { type: 'external', url: 'tel:+966573534185' },
        },
      },
      meta: {
        title: 'شركة الجزيرة الإمداد الذكي | مقاولات الكهروميكانيك ومكافحة الحريق والأنظمة الذكية',
        description:
          'شركة الجزيرة الإمداد الذكي هي مقاول رائد لأعمال الكهروميكانيك (MEP) في منطقة الخليج بخبرة تتجاوز 45 عاماً.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // 8b. `services-page` (from `design/copy/02-services.md`, `draft: true`)
  const savedServicesPageEn = await payload.updateGlobal({
    slug: 'services-page',
    locale: 'en',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'Our Services',
        subtitle:
          'End-to-end MEP and construction services, with around 85% of every package delivered by our own engineers and technicians.',
        image: svcMepMediaId,
      },
      servicesIntro: {
        enabled: true,
        eyebrow: 'Core Services',
        title: 'Integrated MEP & Construction Solutions',
        intro:
          'End-to-end MEP and construction services delivered by our in-house engineering teams across Saudi Arabia and the Gulf.',
      },
      specialist: {
        enabled: true,
        eyebrow: 'More services',
        title: 'Specialist\nServices',
        intro:
          'Dedicated teams for each MEP discipline, plus equipment supply, testing and long-term maintenance.',
      },
      materials: {
        enabled: true,
        eyebrow: 'Materials & brands',
        title: 'Approved\nMaterials & Brands',
        intro:
          'The materials and manufacturers we specify and install on our projects, grouped by system.',
      },
      process: {
        enabled: true,
        eyebrow: 'How We Work',
        title: 'From Survey to\nHandover',
        intro:
          'A clear, accountable process — delivered by one team from the first site visit to final commissioning.',
        steps: [
          {
            title: 'Survey & Consult',
            text: 'Site visit, requirements and scope definition.',
          },
          {
            title: 'Design & Value Engineering',
            text: 'Coordinated shop drawings and cost-optimized options.',
          },
          {
            title: 'Procurement & Supply',
            text: 'Genuine equipment from our partner brands.',
          },
          {
            title: 'Installation',
            text: 'Executed by our own engineers and technicians.',
          },
          {
            title: 'Testing & Handover',
            text: 'T&C, TAB, as-built documents and O&M support.',
          },
        ],
      },
      cta: {
        enabled: true,
        title: 'Ready to Build',
        titleAccent: 'Your Next Project?',
        text: 'Let our 45+ years of MEP expertise work for your next construction or infrastructure project. Get in touch for a free consultation.',
        button: {
          label: 'Contact Us Today',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        secondaryButton: {
          label: 'Call Us Now',
          link: { type: 'external', url: 'tel:+966573534185' },
        },
        backgroundImage: projTowerMediaId,
      },
      meta: {
        title: 'Our Services | Al Jazira for Imdad Smart Co.',
        description:
          'End-to-end MEP, firefighting, smart systems, and general contracting services with around 85% self-performed by our in-house engineers.',
        image: svcMepMediaId,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  const processStepsEn = Array.isArray(savedServicesPageEn.process?.steps)
    ? savedServicesPageEn.process.steps
    : []
  const processStepsAr = [
    {
      title: 'المعاينة والاستشارة',
      text: 'زيارة الموقع وتحديد المتطلبات ونطاق الأعمال بدقة.',
    },
    {
      title: 'التصميم والهندسة القيمية',
      text: 'مخططات تنفيذية منسقة (Shop Drawings) وخيارات محسّنة للتكلفة.',
    },
    {
      title: 'المشتريات والتوريد',
      text: 'توريد معدات أصلية من العلامات التجارية الشريكة لنا.',
    },
    {
      title: 'التركيب والتنفيذ',
      text: 'تنفيذ مباشر بأيدي مهندسينا وفنيينا الداخليين.',
    },
    {
      title: 'الاختبار والتسليم',
      text: 'الاختبار والتشغيل (T&C)، الموازنة (TAB)، مخططات As-Built ودعم التشغيل والصيانة.',
    },
  ]

  await payload.updateGlobal({
    slug: 'services-page',
    locale: 'ar',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'خدماتنا',
        subtitle:
          'خدمات متكاملة في أعمال الكهروميكانيك والإنشاءات، حيث يُنفذ نحو 85% من كل حزمة بأيدي مهندسينا وفنيينا الداخليين.',
      },
      servicesIntro: {
        enabled: true,
        eyebrow: 'الخدمات الأساسية',
        title: 'حلول الكهروميكانيك والإنشاءات المتكاملة',
        intro:
          'خدمات كهروميكانيكية وإنشائية متكاملة تنفذها فرقنا الهندسية الداخلية في المملكة العربية السعودية ومنطقة الخليج.',
      },
      specialist: {
        enabled: true,
        eyebrow: 'المزيد من الخدمات',
        title: 'الخدمات\nالتخصصية',
        intro:
          'فرق متخصصة لكل نظام كهروميكانيكي، بالإضافة إلى توريد المعدات والاختبار والصيانة طويلة الأمد.',
      },
      materials: {
        enabled: true,
        eyebrow: 'المواد والعلامات المعتمدة',
        title: 'المواد والعلامات التجارية\nالمعتمدة',
        intro: 'المواد والمصنعون الذين نعتمدهم ونركب منتجاتهم في مشاريعنا، مصنفة حسب النظام الهندسي.',
      },
      process: {
        enabled: true,
        eyebrow: 'كيف نعمل',
        title: 'من المعاينة إلى\nالتسليم',
        intro: 'منهجية عمل واضحة ومسؤولة — ينفذها فريق واحد من الزيارة الميدانية الأولى وحتى التشغيل التجريبي النهائي.',
        steps: processStepsAr.map((step, idx) => ({
          ...(processStepsEn[idx]?.id ? { id: processStepsEn[idx].id } : {}),
          title: step.title,
          text: step.text,
        })),
      },
      cta: {
        enabled: true,
        title: 'هل أنت مستعد لبناء',
        titleAccent: 'مشروعك القادم؟',
        text: 'ضع خبرتنا الممتدة لأكثر من 45 عاماً في أعمال الكهروميكانيك في خدمة مشروعك القادم. تواصل معنا للحصول على استشارة مجانية.',
        button: {
          label: 'تواصل معنا اليوم',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        secondaryButton: {
          label: 'اتصل بنا الآن',
          link: { type: 'external', url: 'tel:+966573534185' },
        },
      },
      meta: {
        title: 'خدماتنا | شركة الجزيرة الإمداد الذكي',
        description:
          'خدمات متكاملة في مقاولات الكهروميكانيك ومكافحة الحريق والأنظمة الذكية والمقاولات العامة.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // 8c. `about-page` (from `design/copy/03-about-us.md`, `draft: true`)
  const savedAboutPageEn = await payload.updateGlobal({
    slug: 'about-page',
    locale: 'en',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'About Us',
        subtitle:
          'Discover the story behind 45+ years of MEP engineering excellence in the Gulf region.',
        image: aboutTeamMediaId,
      },
      story: {
        enabled: true,
        badgeStat: yearsStatId,
        eyebrow: 'Our Story',
        title: 'Engineering Excellence\nSince 1979',
        text: buildLexicalParagraphsRoot([
          'Al Jazira for Imdad Smart Company is a leading name in the MEP construction sector in the Gulf region. With over 45 years of proven experience, the company continues to specialize in Mechanical and Electrical construction, offering complete, collaborative, and end-to-end solutions that bring life to new buildings and sustain existing ones.',
          'Established in the Kingdom of Saudi Arabia in 1979, the company diversified and constantly followed the market. For over 45 years, the team has been expanding its in-house expertise and enlarging its scope of MEP engineering services across Saudi Arabia, the UAE, and Qatar.',
        ]),
        quote:
          '“Developing and serving society with the highest levels of professional integrity and commitment.”',
        quoteAuthor: 'Al Jazira for Imdad Smart Company',
        image: aboutTeamMediaId,
      },
      strengths: {
        enabled: true,
        eyebrow: 'Why Choose Us',
        title: 'Our Core\nStrengths',
        intro:
          'Nearly five decades of building trust, delivering quality, and exceeding expectations across the Gulf region.',
        items: [
          {
            title: 'Gulf Market Expertise',
            text: 'Nearly five decades of deep expertise operating across Gulf markets, understanding local requirements and international standards.',
          },
          {
            title: 'Proven Track Record',
            text: '90+ completed projects across 100+ buildings with a reputation for exceptional performance and dependable specialist MEP contracting.',
          },
          {
            title: 'Quality & Reliability',
            text: 'Strong reputation for quality, reliability, and timely delivery — strictly conforming to international standards.',
          },
          {
            title: 'In-House Execution',
            text: '85% of MEP work is self-performed by our in-house engineers, minimizing risks and ensuring consistent quality.',
          },
        ],
      },
      missionVision: {
        enabled: true,
        eyebrow: 'Who we are',
        title: 'Our\nMission & Vision',
        intro: 'The purpose behind every project we deliver — and where we are heading next.',
        mission: {
          eyebrow: 'Our mission',
          title: 'Our Mission',
          text: 'To safely deliver world-class Quality MEP projects and infrastructure projects on time, promoting environmental protection and sustainable community development.',
          pillars: [
            {
              title: 'Engineering Excellence',
              text: 'Providing comprehensive and effective solutions across all mechanical, electrical, and plumbing works.',
            },
            {
              title: 'Safety First',
              text: 'Strictly following occupational health and safety standards to protect individuals and assets at all sites.',
            },
            {
              title: 'Sustainability',
              text: 'Implementing eco-friendly solutions that reduce energy consumption and contribute to sustainable community development.',
            },
            {
              title: 'Customer Focus',
              text: 'Understanding client needs and adapting services to ensure full satisfaction with tailored solutions.',
            },
            {
              title: 'Innovation',
              text: 'Developing innovative technologies and solutions to enhance project efficiency without compromising quality.',
            },
          ],
          image: aboutTeamMediaId,
        },
        vision: {
          eyebrow: 'Our vision',
          title: 'Our Vision',
          text: 'To become a regional market leader in the MEP Construction Industry, providing engineering excellence to valued clients through commitment to delivering best practices in corporate governance and transparency.',
          pillars: [
            {
              title: 'Expanding Core Competencies',
              text: 'Strengthening our electro-mechanical capabilities and broadening our multi-disciplined engineering service portfolio.',
            },
            {
              title: 'Unique Technologies',
              text: 'Identifying and producing unique technologies that set us apart and deliver innovative solutions for our clients.',
            },
            {
              title: 'Strategic Partnerships',
              text: 'Aligning with key partners that enhance our capabilities to produce and distribute cutting-edge engineering ideas.',
            },
          ],
          image: heroCityMediaId,
        },
        image: heroCityMediaId,
      },
      team: {
        enabled: true,
        eyebrow: 'Our team',
        title: 'Meet Our\nTeam',
        intro:
          'A solid base of skilled engineers, an effective management team, and a dedicated labor force support our growth.',
        staffTitle: 'The people behind every project',
        staffText: 'Engineers, supervisors and specialists from our in-house team.',
      },
      meta: {
        title: 'About Us | Al Jazira for Imdad Smart Co.',
        description:
          'Discover the story behind 45+ years of MEP engineering excellence in the Gulf region at Al Jazira for Imdad Smart Company.',
        image: aboutTeamMediaId,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  const strengthsRowsEn = Array.isArray(savedAboutPageEn.strengths?.items)
    ? savedAboutPageEn.strengths.items
    : []
  const missionPillarsEn = Array.isArray(savedAboutPageEn.missionVision?.mission?.pillars)
    ? savedAboutPageEn.missionVision.mission.pillars
    : []
  const visionPillarsEn = Array.isArray(savedAboutPageEn.missionVision?.vision?.pillars)
    ? savedAboutPageEn.missionVision.vision.pillars
    : []

  const strengthsRowsAr = [
    {
      title: 'خبرة راسخة في أسواق الخليج',
      text: 'ما يقارب خمسة عقود من الخبرة العميقة في أسواق الخليج وفهم المتطلبات المحلية والمعايير العالمية.',
    },
    {
      title: 'سجل إنجازات حافل',
      text: 'أكثر من 90 مشروعاً منجزاً تشمل أكثر من 100 مبنى بسمعة متميزة في الأداء والاعتمادية في مقاولات الكهروميكانيك التخصصية.',
    },
    {
      title: 'الجودة والموثوقية',
      text: 'سمعة قوية في الجودة والاعتمادية والالتزام بمواعيد التسليم — وفق المعايير العالمية الصارمة.',
    },
    {
      title: 'تنفيذ ذاتي بالكوادر الداخلية',
      text: 'يتم تنفيذ 85% من أعمال الكهروميكانيك ذاتياً بواسطة مهندسينا الداخليين، مما يقلل المخاطر ويضمن ثبات الجودة.',
    },
  ]

  const missionPillarsAr = [
    {
      title: 'التميز الهندسي',
      text: 'تقديم حلول شاملة وفعالة في كافة الأعمال الميكانيكية والكهربائية والصحية.',
    },
    {
      title: 'السلامة أولاً',
      text: 'الالتزام الصارم بمعايير الصحة والسلامة المهنية لحماية الأفراد والممتلكات في جميع المواقع.',
    },
    {
      title: 'الاستدامة',
      text: 'تطبيق حلول صديقة للبيئة تقلل استهلاك الطاقة وتسهم في التنمية المجتمعية المستدامة.',
    },
    {
      title: 'التركيز على العميل',
      text: 'فهم احتياجات العملاء وتكييف الخدمات لضمان الرضا التام عبر حلول مصممة خصيصاً.',
    },
    {
      title: 'الابتكار',
      text: 'تطوير تقنيات وحلول مبتكرة لتعزيز كفاءة المشاريع دون المساس بالجودة.',
    },
  ]

  const visionPillarsAr = [
    {
      title: 'توسيع الكفاءات الأساسية',
      text: 'تعزيز قدراتنا الكهروميكانيكية وتوسيع محفظة خدماتنا الهندسية متعددة التخصصات.',
    },
    {
      title: 'تقنيات متميزة',
      text: 'تحديد وتوظيف التقنيات النوعية التي تميزنا وتقدم حلولاً مبتكرة لعملائنا.',
    },
    {
      title: 'شراكات استراتيجية',
      text: 'التحالف مع الشركاء الرئيسيين لتعزيز قدراتنا على تطوير وتنفيذ أحدث الحلول الهندسية.',
    },
  ]

  await payload.updateGlobal({
    slug: 'about-page',
    locale: 'ar',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'من نحن',
        subtitle: 'تعرف على قصة أكثر من 45 عاماً من التميز الهندسي في أعمال الكهروميكانيك في منطقة الخليج.',
      },
      story: {
        enabled: true,
        eyebrow: 'قصتنا',
        title: 'تميز هندسي\nمنذ عام 1979',
        text: buildLexicalParagraphsRoot([
          'شركة الجزيرة الإمداد الذكي هي اسم رائد في قطاع مقاولات الكهروميكانيك (MEP) في منطقة الخليج. وبخبرة راسخة تتجاوز 45 عاماً، تواصل الشركة تخصصها في الإنشاءات الميكانيكية والكهربائية، مقدمةً حلولاً متكاملة وتعاونية من البداية إلى النهاية تمنح الحياة للمباني الجديدة وتحافظ على استدامة المباني القائمة.',
          'تأسست الشركة في المملكة العربية السعودية عام 1979، وتنوعت أعمالها وواكبت تطور السوق باستمرار. وعلى مدى أكثر من 45 عاماً، وسّع الفريق خبراته الداخلية ونطاق خدماته الهندسية الكهروميكانيكية في المملكة العربية السعودية والإمارات العربية المتحدة وقطر.',
        ]),
        quote: '«تنمية المجتمع وخدمته بأعلى مستويات النزاهة المهنية والالتزام.»',
        quoteAuthor: 'شركة الجزيرة الإمداد الذكي',
      },
      strengths: {
        enabled: true,
        eyebrow: 'لماذا تختارنا',
        title: 'نقاط قوتنا\nالأساسية',
        intro: 'قرابة خمسة عقود من بناء الثقة وتقديم الجودة وتجاوز التطلعات في مختلف أنحاء منطقة الخليج.',
        items: strengthsRowsAr.map((item, idx) => ({
          ...(strengthsRowsEn[idx]?.id ? { id: strengthsRowsEn[idx].id } : {}),
          title: item.title,
          text: item.text,
        })),
      },
      missionVision: {
        enabled: true,
        eyebrow: 'هويتنا',
        title: 'رسالتنا\nورؤيتنا',
        intro: 'الغاية وراء كل مشروع ننفذه — والوجهة التي نتطلع إليها في المستقبل.',
        mission: {
          eyebrow: 'رسالتنا',
          title: 'رسالتنا',
          text: 'تسليم مشاريع كهروميكانيكية ومشاريع بنية تحتية عالمية الجودة بأمان وفي الوقت المحدد، مع تعزيز حماية البيئة والتنمية المجتمعية المستدامة.',
          pillars: missionPillarsAr.map((pil, idx) => ({
            ...(missionPillarsEn[idx]?.id ? { id: missionPillarsEn[idx].id } : {}),
            title: pil.title,
            text: pil.text,
          })),
        },
        vision: {
          eyebrow: 'رؤيتنا',
          title: 'رؤيتنا',
          text: 'أن نكون الشركة الرائدة إقليمياً في قطاع مقاولات الكهروميكانيك (MEP)، مقدمين التميز الهندسي لعملائنا الكرام من خلال الالتزام بأفضل ممارسات الحوكمة المؤسسية والشفافية.',
          pillars: visionPillarsAr.map((pil, idx) => ({
            ...(visionPillarsEn[idx]?.id ? { id: visionPillarsEn[idx].id } : {}),
            title: pil.title,
            text: pil.text,
          })),
        },
      },
      team: {
        enabled: true,
        eyebrow: 'فريقنا',
        title: 'تعرف على\nفريقنا',
        intro: 'قاعدة صلبة من المهندسين المهرة، وإدارة فعالة، وكوادر فنية متفانية تدعم نمونا المستمر.',
        staffTitle: 'الكفاءات التي تقف وراء كل مشروع',
        staffText: 'مهندسون ومشرفون وأخصائيون من فريقنا الداخلي.',
      },
      meta: {
        title: 'من نحن | شركة الجزيرة الإمداد الذكي',
        description:
          'تعرف على قصة أكثر من 45 عاماً من التميز الهندسي في مقاولات الكهروميكانيك في منطقة الخليج.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // 8d. `projects-page` (from `design/copy/04-projects.md`, `draft: true`)
  await payload.updateGlobal({
    slug: 'projects-page',
    locale: 'en',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'Our Projects',
        subtitle:
          '90+ completed MEP, fire fighting, smart-systems and data-center projects across 100+ buildings in the Gulf. Filter by discipline to explore our track record.',
        image: projTowerMediaId,
      },
      impact: {
        enabled: true,
        title: 'Our Impact in Numbers',
        text: 'Key metrics and proven milestones across four decades of engineering excellence.',
        stats: projectsImpactStatsIds,
      },
      portfolio: {
        enabled: true,
        eyebrow: 'Our Portfolio',
        title: 'Projects That Define\nEngineering Excellence',
        text: buildLexicalParagraphsRoot([
          'With over 45 years of electro-mechanical construction experience across Saudi Arabia and the Gulf, Al Jazira for Imdad Smart Company has successfully delivered landmark MEP projects ranging from 32-floor luxury hotel towers to mission-critical data centers and university campuses.',
          'Our in-house team self-performs 85% of MEP works including HVAC, high/low voltage electrical, fire suppression, and smart automation systems — ensuring unmatched execution quality and schedule compliance.',
        ]),
        quote: '“Engineering iconic developments with uncompromised quality, precision, and safety.”',
        quoteAuthor: 'Al Jazira for Imdad Smart Co.',
        badgeStat: projectsStatId,
        image: projTowerMediaId,
      },
      cta: {
        enabled: true,
        title: 'Have a Project',
        titleAccent: 'in Mind?',
        text: 'Let our 45+ years of MEP expertise bring your next construction or infrastructure project to life. Get a free consultation today.',
        button: {
          label: 'Request a Quote',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        secondaryButton: {
          label: 'Call Us Now',
          link: { type: 'external', url: 'tel:+966573534185' },
        },
        backgroundImage: projTowerMediaId,
      },
      meta: {
        title: 'Our Projects | Al Jazira for Imdad Smart Co.',
        description:
          '90+ completed MEP, firefighting, smart-systems and data-center projects across 100+ buildings delivered in Saudi Arabia, UAE, and Qatar.',
        image: projTowerMediaId,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  await payload.updateGlobal({
    slug: 'projects-page',
    locale: 'ar',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'مشاريعنا',
        subtitle:
          'أكثر من 90 مشروعاً منجزاً تشمل أكثر من 100 مبنى في أعمال الكهروميكانيك ومكافحة الحريق والأنظمة الذكية ومراكز البيانات في الخليج. صفِّ حسب التخصص لاستعراض سجل إنجازاتنا.',
      },
      impact: {
        enabled: true,
        title: 'أثرنا بالأرقام',
        text: 'مؤشرات رئيسية ومحطات موثقة عبر أكثر من أربعة عقود من التميز الهندسي.',
      },
      portfolio: {
        enabled: true,
        eyebrow: 'سجل إنجازاتنا',
        title: 'مشاريع تجسد\nالتميز الهندسي',
        text: buildLexicalParagraphsRoot([
          'بخبرة تتجاوز 45 عاماً في الإنشاءات الكهروميكانيكية في المملكة العربية السعودية والخليج، أنجزت شركة الجزيرة الإمداد الذكي مشاريع كهروميكانيكية بارزة تتنوع بين الأبراج الفندقية الفاخرة المكونة من 32 طابقاً ومراكز البيانات الحساسة والحرم الجامعية.',
          'ينفذ فريقنا الداخلي ذاتياً 85% من أعمال الكهروميكانيك بما يشمل التكييف والكهرباء للجهد المتوسط والمنخفض وإطفاء الحريق والأتمتة الذكية — لضمان أعلى مستويات جودة التنفيذ والالتزام بالجدول الزمني.',
        ]),
        quote: '«هندسة المشاريع الكبرى بجودة ودقة وسلامة لا تقبل المساومة.»',
        quoteAuthor: 'شركة الجزيرة الإمداد الذكي',
      },
      cta: {
        enabled: true,
        title: 'هل لديك مشروع',
        titleAccent: 'قيد التخطيط؟',
        text: 'دع خبرتنا الممتدة لأكثر من 45 عاماً في أعمال الكهروميكانيك تحول مشروعك الإنشائي أو التحتي القادم إلى واقع. احصل على استشارة مجانية اليوم.',
        button: {
          label: 'اطلب عرض سعر',
          link: { type: 'internal', internalRoute: 'custom', internalPath: '/contact#quote' },
        },
        secondaryButton: {
          label: 'اتصل بنا الآن',
          link: { type: 'external', url: 'tel:+966573534185' },
        },
      },
      meta: {
        title: 'مشاريعنا | شركة الجزيرة الإمداد الذكي',
        description:
          'سجل مشاريع شركة الجزيرة الإمداد الذكي في أعمال الكهروميكانيك ومكافحة الحريق والأنظمة الذكية ومراكز البيانات.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // 8e. `contact-page` (from `design/copy/07-contact-us.md`, `draft: true`)
  await payload.updateGlobal({
    slug: 'contact-page',
    locale: 'en',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'Contact Us',
        subtitle:
          'We are always delighted to hear from you. Get in touch for a free consultation.',
        image: headerOfficeMediaId,
      },
      getInTouch: {
        enabled: true,
        eyebrow: 'Get In Touch',
        title: "Let's talk about\nyour project",
        intro:
          'Request a quote for contracting or supply, ask for brand pricing, or speak directly with an engineer.',
      },
      findOffice: {
        enabled: true,
        eyebrow: 'Our Location',
        title: 'Find\nOur Office',
        intro: "Visit us in Makkah Al Mokaramah, KSA — we'd love to meet you in person.",
      },
      meta: {
        title: 'Contact Us | Al Jazira for Imdad Smart Co.',
        description:
          'Request a quote for MEP contracting or equipment supply, or speak directly with an engineer at Al Jazira for Imdad Smart Co. in Makkah.',
        image: headerOfficeMediaId,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  await payload.updateGlobal({
    slug: 'contact-page',
    locale: 'ar',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: 'تواصل معنا',
        subtitle: 'يسعدنا دائماً تواصلكم معنا. تواصل معنا للحصول على استشارة هندسية مجانية.',
      },
      getInTouch: {
        enabled: true,
        eyebrow: 'تواصل معنا',
        title: 'لنتحدث عن\nمشروعك',
        intro:
          'اطلب عرض سعر للمقاولات أو التوريد، أو استفسر عن أسعار العلامات المعتمدة، أو تحدث مباشرة مع مهندس مختص.',
      },
      findOffice: {
        enabled: true,
        eyebrow: 'موقعنا',
        title: 'موقع\nمكتبنا الرئيسي',
        intro: 'تفضل بزيارتنا في مكة المكرمة، المملكة العربية السعودية — يسعدنا لقاؤكم شخصياً.',
      },
      meta: {
        title: 'تواصل معنا | شركة الجزيرة الإمداد الذكي',
        description:
          'اطلب عرض سعر لأعمال الكهروميكانيك أو التوريد أو تحدث مباشرة مع مهندس مختص في شركة الجزيرة الإمداد الذكي بمكة المكرمة.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // 8f. `privacy-page` (placeholder marked `[placeholder]`, kept in `draft: true` per D4 & Scope 5)
  await payload.updateGlobal({
    slug: 'privacy-page',
    locale: 'en',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: '[placeholder] Privacy Policy',
        subtitle:
          '[placeholder] How Al Jazira for Imdad Smart Co. collects, uses, and protects quote request and contact information (draft pending client legal approval).',
        image: headerOfficeMediaId,
      },
      enabled: true,
      body: buildLexicalParagraphsRoot([
        '[placeholder] This Privacy Policy draft outlines how Al Jazira for Imdad Smart Co. handles contact and quote-request submissions in accordance with Saudi Personal Data Protection Law (PDPL). Final legal text is pending client confirmation.',
        '[placeholder] Information submitted via the quote request form (name, company, email, phone, project details) is used solely by our engineering and commercial teams to prepare proposals and respond to inquiries.',
      ]),
      meta: {
        title: '[placeholder] Privacy Policy | Al Jazira for Imdad Smart Co.',
        description:
          '[placeholder] Privacy Policy for Al Jazira for Imdad Smart Company (draft pending client review).',
        image: headerOfficeMediaId,
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  await payload.updateGlobal({
    slug: 'privacy-page',
    locale: 'ar',
    draft: true,
    data: {
      _status: 'draft',
      pageHeader: {
        enabled: true,
        title: '[placeholder] سياسة الخصوصية',
        subtitle:
          '[placeholder] كيفية جمع واستخدام وحماية بيانات التواصل وطلبات عروض الأسعار لدى شركة الجزيرة الإمداد الذكي (مسودة بانتظار اعتماد النص القانوني من العميل).',
      },
      enabled: true,
      body: buildLexicalParagraphsRoot([
        '[placeholder] توضح مسودة سياسة الخصوصية هذه كيفية تعامل شركة الجزيرة الإمداد الذكي مع بيانات التواصل وطلبات عروض الأسعار وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية (PDPL). النص النهائي قيد اعتماد العميل.',
        '[placeholder] تُستخدم البيانات المرسلة عبر نموذج طلب عرض السعر (الاسم، الشركة، البريد الإلكتروني، الهاتف، وتفاصيل المشروع) حصرياً من قبل فرقنا الهندسية والتجارية لإعداد العروض والرد على الاستفسارات.',
      ]),
      meta: {
        title: '[placeholder] سياسة الخصوصية | شركة الجزيرة الإمداد الذكي',
        description: '[placeholder] مسودة سياسة الخصوصية لشركة الجزيرة الإمداد الذكي.',
      },
    },
    context: { disableRevalidate: true },
    overrideAccess: false,
    user: SEED_ADMIN_USER,
  })

  // ---------------------------------------------------------------------------
  // 9. Compute final verification counts and deterministic updatedAt digest
  // ---------------------------------------------------------------------------
  const [
    finalBrandsRes,
    finalMarqueeRes,
    finalStatsRes,
    finalServicesRes,
    finalProjectsRes,
    finalTeamRes,
  ] = await Promise.all([
    payload.find({
      collection: 'brands',
      sort: 'order',
      limit: 200,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'brands',
      where: { showInMarquee: { equals: true } },
      sort: 'order',
      limit: 100,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'stats',
      sort: 'order',
      limit: 100,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'services',
      sort: 'order',
      limit: 100,
      depth: 0,
      draft: true,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'projects',
      sort: 'order',
      limit: 200,
      depth: 0,
      draft: true,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'team',
      sort: 'order',
      limit: 100,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
  ])

  const updatedAtDigest = [
    ...finalBrandsRes.docs.map((b) => `brand:${b.name}:${String(b.order)}:${String(b.showInMarquee)}:${b.updatedAt}`),
    ...finalStatsRes.docs.map((s) => `stat:${s.value}:${s.updatedAt}`),
    ...finalServicesRes.docs.map((s) => `service:${s.slug}:${String(s._status)}:${s.updatedAt}`),
    ...finalProjectsRes.docs.map((p) => `project:${p.slug}:${String(p._status)}:${p.updatedAt}`),
    ...finalTeamRes.docs.map((t) => `team:${t.name}:${String(t.active)}:${t.updatedAt}`),
  ].join('\n')

  return {
    reseeded,
    materialsSummary,
    deletedCounts,
    mediaUploaded: {
      projectPhotos: projectPhotoMediaIdByRef.size,
      designAssets: designMediaIdByKey.size,
      total: projectPhotoMediaIdByRef.size + designMediaIdByKey.size,
    },
    marqueeBrands: {
      created: marqueeBrandsCreated,
      existingMatched: marqueeBrandsExistingMatched,
      oldCleared: oldMarqueeCleared,
      totalMarquee: finalMarqueeRes.totalDocs,
      totalBrands: finalBrandsRes.totalDocs,
    },
    statsCreated,
    servicesCreatedDraft,
    projectsCreated: {
      publishedWithPhoto,
      draftWithoutPhoto,
      featured: featuredCount,
      total: finalProjectsRes.totalDocs,
    },
    teamPlaceholdersCreatedInactive,
    globalsSeeded: {
      siteSettings: true,
      navigation: true,
      draftPageGlobals: [
        'home-page',
        'services-page',
        'about-page',
        'projects-page',
        'contact-page',
        'privacy-page',
      ],
    },
    homeCopySource: plan.homeCopySource,
    updatedAtDigest,
    plan,
  }
}

export function formatP4T2SummaryLines(summary: P4T2SeedRunSummary): string[] {
  const digestSha256 = crypto
    .createHash('sha256')
    .update(summary.updatedAtDigest, 'utf8')
    .digest('hex')

  const lines: string[] = []
  if (summary.materialsSummary) {
    lines.push(...formatSeedSummaryLines(summary.materialsSummary))
  }
  lines.push(
    '=== AL JAZIRA SEED SUMMARY (P4-T2: SETTINGS, SERVICES, PROJECTS, MARQUEE, COPY, PLACEHOLDERS) ===',
    `mode: ${summary.reseeded ? `reseed (--reseed, deleted projects=${String(summary.deletedCounts.projects)}, services=${String(summary.deletedCounts.services)}, team=${String(summary.deletedCounts.team)}, stats=${String(summary.deletedCounts.stats)}, materials=${String(summary.deletedCounts.materials)}, brands=${String(summary.deletedCounts.brands)}, media=${String(summary.deletedCounts.media)})` : 'first-run baseline'}`,
    `media: projectPhotos=${String(summary.mediaUploaded.projectPhotos)}, designAssets=${String(summary.mediaUploaded.designAssets)}, total=${String(summary.mediaUploaded.total)}`,
    `marqueeBrands: created=${String(summary.marqueeBrands.created)}, existingMatched=${String(summary.marqueeBrands.existingMatched)}, oldCleared=${String(summary.marqueeBrands.oldCleared)}, totalMarquee=${String(summary.marqueeBrands.totalMarquee)}, totalBrands=${String(summary.marqueeBrands.totalBrands)}`,
    `stats: created=${String(summary.statsCreated)}`,
    `services: createdDraft=${String(summary.servicesCreatedDraft)}`,
    `projects: publishedWithPhoto=${String(summary.projectsCreated.publishedWithPhoto)}, draftWithoutPhoto=${String(summary.projectsCreated.draftWithoutPhoto)}, featured=${String(summary.projectsCreated.featured)}, total=${String(summary.projectsCreated.total)}`,
    `teamPlaceholders: createdInactive=${String(summary.teamPlaceholdersCreatedInactive)}`,
    `globals: site-settings=seeded(arabicEnabled=false), navigation=seeded, draftPageGlobals=${summary.globalsSeeded.draftPageGlobals.join(',')}`,
    `homeCopySource: ${summary.homeCopySource}`,
    `p4t2UpdatedAtDigestSha256: ${digestSha256}`,
  )
  return lines
}
