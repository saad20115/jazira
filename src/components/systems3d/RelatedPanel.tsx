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
}

/**
 * Related projects of the entered system (§6): up to 3 links and "All related projects". Owner O-20
 * (2026-11-11): shown below the accordion at every width, never over the model.
 */
export function RelatedPanel({ related, heading, strings }: RelatedPanelProps): ReactElement {
  return (
    <aside aria-label={heading} className={styles.relatedPanelStacked} data-related-panel="stacked">
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
