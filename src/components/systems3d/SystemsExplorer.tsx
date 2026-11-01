'use client'

import { type ReactElement, type ReactNode, useCallback, useEffect, useState } from 'react'

import { AccordionItem } from '@/components/Accordion'
import accordionStyles from '@/components/Accordion.module.css'
import type { SupportedLocale } from '@/i18n'

import type { SystemId } from './contract'
import { hashForSystem, systemFromHash } from './hash'
import styles from './InteractiveSystemsSection.module.css'
import { RelatedPanel } from './RelatedPanel'
import type { RelatedProjectsBySystem } from './relatedProjects'
import { showIn3dLabel, type Systems3dStrings } from './strings'
import { SystemsCard } from './SystemsCard'

export interface ExplorerSystem {
  /** The CMS array row id (accordion item id). */
  key: string
  /** The system this row shows (`shot`), when it is one of the five. */
  system: SystemId | null
  title: string
  text: string
}

export interface SystemsExplorerProps {
  locale: SupportedLocale
  poster: ReactNode
  posterAlt: string
  badgeLabel: string
  openLabel: string
  relatedHeading: string
  strings: Systems3dStrings
  systems: readonly ExplorerSystem[]
  related: RelatedProjectsBySystem
}

/**
 * CTO rules (2026-10-25): at rest the first row is expanded as in Figma and nothing is entered (no
 * hash; the card shows the overview). Opening a collapsed row enters its system; every expanded row
 * has a "Show in 3D" button (the way into the pre-expanded row); collapsing the entered row exits;
 * a `#systems-<id>` hash on load enters that system and expands its row. Focus never moves.
 */
const DEFAULT_EXPANDED_INDEX = 0

export function SystemsExplorer({
  locale,
  poster,
  posterAlt,
  badgeLabel,
  openLabel,
  relatedHeading,
  strings,
  systems,
  related,
}: SystemsExplorerProps): ReactElement {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(DEFAULT_EXPANDED_INDEX)
  const [entered, setEntered] = useState<SystemId | null>(null)

  const indexOfSystem = useCallback(
    (system: SystemId): number => systems.findIndex((row) => row.system === system),
    [systems],
  )

  const writeHash = useCallback((system: SystemId | null): void => {
    const { pathname, search } = window.location
    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${search}${hashForSystem(system)}`,
    )
  }, [])

  // Shareable hash: entered on load or on hashchange (allowlist only; no scroll jump).
  // Any other hash later (an in-page link, a cleared hash) exits, so the URL keeps describing the card.
  useEffect(() => {
    const apply = (onLoad: boolean): void => {
      const system = systemFromHash(window.location.hash)
      const idx = system ? indexOfSystem(system) : -1
      if (system && idx >= 0) {
        setExpandedIndex(idx)
        setEntered(system)
      } else if (!onLoad) {
        setEntered(null)
      }
    }
    const onHashChange = (): void => {
      apply(false)
    }
    apply(true)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [indexOfSystem])

  const enter = (system: SystemId | null): void => {
    setEntered(system)
    writeHash(system)
  }

  const toggle = (idx: number, nextExpanded: boolean): void => {
    const system = systems[idx]?.system ?? null
    if (nextExpanded) {
      setExpandedIndex(idx)
      enter(system)
    } else {
      setExpandedIndex(null)
      if (system !== null && system === entered) {
        enter(null)
      }
    }
  }

  const exitSystem = (): void => {
    enter(null)
  }

  const enteredRelated = entered ? related[entered] : undefined

  return (
    <div className={styles.explorerRow}>
      <SystemsCard
        badgeLabel={badgeLabel}
        className={styles.buildingCard}
        entered={entered}
        liveLabel={posterAlt}
        onExitSystem={exitSystem}
        onSelectRow={(idx) => {
          toggle(idx, true)
        }}
        openLabel={openLabel}
        related={enteredRelated ?? null}
        relatedHeading={relatedHeading}
        strings={strings}
      >
        {poster}
      </SystemsCard>

      <div className={styles.accordionCol}>
        <div
          className={`${accordionStyles.accordionList} ${styles.interactiveAccordion}`}
          data-component="accordion"
        >
          {systems.map((row, idx) => {
            const badge = String(idx + 1).padStart(2, '0')
            return (
              <AccordionItem
                body={
                  <>
                    <p className={`${styles.systemDescription} t-body-m`}>{row.text}</p>
                    {row.system ? (
                      <button
                        aria-label={showIn3dLabel(strings, row.title)}
                        aria-pressed={entered === row.system}
                        className={`${styles.showIn3dButton} t-label-button`}
                        data-show-in-3d={row.system}
                        onClick={() => {
                          enter(row.system)
                        }}
                        type="button"
                      >
                        {strings.showIn3d}
                      </button>
                    ) : null}
                  </>
                }
                defaultExpanded={idx === DEFAULT_EXPANDED_INDEX}
                id={row.key}
                key={row.key}
                locale={locale}
                numberBadge={badge}
                onToggle={(next) => {
                  toggle(idx, next)
                }}
                state={expandedIndex === idx ? 'Expanded' : 'Collapsed'}
                title={row.title}
              />
            )
          })}
        </div>
        {enteredRelated && enteredRelated.projects.length > 0 ? (
          <RelatedPanel
            heading={relatedHeading}
            placement="stacked"
            related={enteredRelated}
            strings={strings}
          />
        ) : null}
      </div>
    </div>
  )
}
