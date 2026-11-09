import Link from 'next/link'
import type { ReactElement } from 'react'

import { ArrowUpRightIcon } from '@/components/icons'

import styles from './InteractiveSystemsSection.module.css'
import type { SystemRelatedProjects } from './relatedProjects'
import type { Systems3dStrings } from './strings'

export interface RelatedPanelProps {
  related: SystemRelatedProjects
  heading: string
  strings: Systems3dStrings
  /** `card`: over the card's inline-end side (≥ 768 px); `stacked`: below the accordion (phones). */
  placement: 'card' | 'stacked'
}

/** Related projects of the entered system (§6): up to 3 links and "All related projects". */
export function RelatedPanel({
  related,
  heading,
  strings,
  placement,
}: RelatedPanelProps): ReactElement {
  return (
    <aside
      aria-label={heading}
      className={placement === 'card' ? styles.relatedPanel : styles.relatedPanelStacked}
      data-label-obstacle={placement === 'card' ? 'true' : undefined}
      data-related-panel={placement}
    >
      <p className={`${styles.relatedProjectsLabel} t-label-caps`}>{heading}</p>
      <ul className={styles.relatedList}>
        {related.projects.map((project) => (
          <li key={project.id}>
            <Link className={`${styles.relatedProjectLink} t-body-s-medium`} href={project.href}>
              {project.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link className={`${styles.relatedAllLink} t-label-link`} href={related.allHref}>
        {strings.allProjects}
        <ArrowUpRightIcon aria-hidden="true" />
      </Link>
    </aside>
  )
}
