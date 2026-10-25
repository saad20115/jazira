import type React from 'react'

import { Accordion, type AccordionEntry } from '@/components/Accordion'
import { CspSafeImage } from '@/components/CspSafeImage'
import { Eyebrow } from '@/components/Eyebrow'
import { resolveMediaAsset } from '@/components/media-utils'
import type { SupportedLocale } from '@/i18n'
import type { HomePage } from '@/payload-types'
import gridStyles from '@/styles/grid.module.css'

import styles from './InteractiveSystemsSection.module.css'

type InteractiveSystemsData = HomePage['interactiveSystems']
type InteractiveSystemItem = NonNullable<NonNullable<InteractiveSystemsData>['systems']>[number]

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
 * Home section 4, "Interactive Systems" (`111:1608`, `handoff/tasks/P3-T5.md` E3 step 1).
 * Moved verbatim out of `src/app/(frontend)/[locale]/page.tsx`; renders the same markup.
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

  const accordionEntries: AccordionEntry[] = interactiveSystemsList.map(
    (sysItem: InteractiveSystemItem, idx: number) => ({
      id: sysItem.id ?? `system-${String(idx + 1)}`,
      numberBadge: String(idx + 1).padStart(2, '0'),
      title: sysItem.title,
      defaultExpanded: idx === 0,
      body: <p className={`${styles.systemDescription} t-body-m`}>{sysItem.text}</p>,
    }),
  )

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

        <div className={styles.explorerRow}>
          <div className={styles.buildingCard} data-interactive-3d-card="true">
            {interactiveHeroImage ? (
              <CspSafeImage
                alt={interactiveHeroImage.alt}
                className={styles.buildingRender}
                height={580}
                sizes="(max-width: 1279px) 100vw, 600px"
                src={interactiveHeroImage.url}
                width={600}
              />
            ) : null}
          </div>

          <div className={styles.accordionCol}>
            <Accordion
              className={styles.interactiveAccordion}
              defaultExpandedIndex={0}
              items={accordionEntries}
              locale={locale}
              singleExpand
            />
          </div>
        </div>
      </div>
    </section>
  )
}
