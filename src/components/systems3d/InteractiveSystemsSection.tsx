import type React from 'react'

import { Eyebrow } from '@/components/Eyebrow'
import { resolveMediaAsset } from '@/components/media-utils'
import { getDictionary, type SupportedLocale } from '@/i18n'
import type { HomePage } from '@/payload-types'
import gridStyles from '@/styles/grid.module.css'

import { isSystemId } from './contract'
import styles from './InteractiveSystemsSection.module.css'
import { loadRelatedProjects } from './loadRelatedProjects'
import { RELEASE_BASE_PATH } from './renderContract'
import { getSystems3dStrings } from './strings'
import { type ExplorerSystem, SystemsExplorer, type SystemsExplorerProps } from './SystemsExplorer'

type InteractiveSystemsData = HomePage['interactiveSystems']
type InteractiveSystemItem = NonNullable<NonNullable<InteractiveSystemsData>['systems']>[number]

const STILLS_PATH = `${RELEASE_BASE_PATH}/stills`
const POSTER_SIZES = '(max-width: 1279px) 100vw, 600px'
const POSTER_WIDTHS = [828, 1440, 2048] as const

function posterSrcSet(format: 'webp' | 'jpg'): string {
  return POSTER_WIDTHS.map((w) => `${STILLS_PATH}/hero_${String(w)}.${format} ${String(w)}w`).join(
    ', ',
  )
}

/** Class names of the split section head shared with other home sections (stay in `page.module.css`). */
export interface InteractiveSystemsHeadClassNames {
  head: string
  headLeft: string
  heading: string
}

export interface InteractiveSystemsSectionProps {
  companyName: string | null
  data: InteractiveSystemsData | null | undefined
  headClassNames: InteractiveSystemsHeadClassNames
  locale: SupportedLocale
  /** Renders the `H2` title with its gold accent segment (`renderAccentHeading(title, 'interactive')`). */
  renderHeading: (title: string) => React.ReactNode
}

/**
 * Home section 4, "Interactive Systems" (`111:1608`, `handoff/tasks/P3-T5.md`).
 * The related projects are read inside the section (C3-1): the read starts here, unawaited, and its
 * promise goes to the client explorer, which suspends only the panels on it. The card and the
 * accordion never wait for it and are never remounted when it arrives.
 */
export function InteractiveSystemsSection({
  companyName,
  data,
  headClassNames,
  locale,
  renderHeading,
}: InteractiveSystemsSectionProps): React.JSX.Element | null {
  const interactiveEnabled = data?.enabled !== false
  const interactiveEyebrow = data?.eyebrow?.trim() || null
  const interactiveTitle = data?.title?.trim() || null
  const interactiveIntro = data?.intro?.trim() || null
  const interactiveHeroImage = resolveMediaAsset(
    data?.heroImage,
    interactiveTitle ?? companyName ?? '',
    'hero',
  )
  const interactiveSystemsList = data?.systems ?? []
  const hasInteractiveContent = Boolean(
    interactiveSystemsList.length > 0 && (interactiveTitle || interactiveHeroImage),
  )

  if (!interactiveEnabled || !hasInteractiveContent) {
    return null
  }
  const dict = getDictionary(locale)
  const strings = getSystems3dStrings(locale)
  // The poster is always the pinned release still (CTO Q3, 2026-10-25); the CMS heroImage only
  // supplies its alt text while a 3D release is pinned.
  const cmsAlt =
    typeof data?.heroImage === 'object' && data.heroImage ? data.heroImage.alt.trim() : ''
  const posterAlt = cmsAlt || strings.posterAlt

  const explorerSystems: ExplorerSystem[] = interactiveSystemsList.map(
    (sysItem: InteractiveSystemItem, idx: number) => ({
      key: sysItem.id ?? `system-${String(idx + 1)}`,
      system: isSystemId(sysItem.shot) ? sysItem.shot : null,
      title: sysItem.title,
      text: sysItem.text,
    }),
  )

  const explorerProps: SystemsExplorerProps = {
    badgeLabel: dict.home.interactive3dBadge,
    locale,
    openLabel: data?.liveModelLabel?.trim() || dict.actions.openLive3dModel,
    poster: (
      <picture className={styles.stillPicture}>
        <source sizes={POSTER_SIZES} srcSet={posterSrcSet('webp')} type="image/webp" />
        {/* A plain <img>: next/image would re-encode the still that the live first frame must match. */}
        <img
          alt={posterAlt}
          className={styles.buildingRender}
          decoding="async"
          height={2048}
          loading="lazy"
          sizes={POSTER_SIZES}
          src={`${STILLS_PATH}/hero_1440.jpg`}
          srcSet={posterSrcSet('jpg')}
          width={2048}
        />
      </picture>
    ),
    posterAlt,
    related: loadRelatedProjects(locale, data),
    relatedHeading: dict.home.relatedProjectsHeading,
    strings,
    systems: explorerSystems,
  }

  return (
    <section
      className={styles.interactiveSection}
      data-home-section="interactive-systems"
      id="interactive-systems"
    >
      <div className={`${gridStyles.container} ${styles.interactiveStack}`}>
        <div className={headClassNames.head}>
          <div className={headClassNames.headLeft}>
            {interactiveEyebrow ? <Eyebrow label={interactiveEyebrow} tone="Light" /> : null}
            {interactiveTitle ? (
              <h2 className={`${headClassNames.heading} t-h2`}>
                {renderHeading(interactiveTitle)}
              </h2>
            ) : null}
          </div>
          {interactiveIntro ? (
            <p className={`${styles.interactiveIntroText} t-body-m`}>{interactiveIntro}</p>
          ) : null}
        </div>

        <SystemsExplorer {...explorerProps} />
      </div>
    </section>
  )
}
