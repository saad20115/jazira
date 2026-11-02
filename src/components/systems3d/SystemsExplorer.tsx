'use client'

import {
  type ReactElement,
  type ReactNode,
  Suspense,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react'

import { AccordionItem } from '@/components/Accordion'
import accordionStyles from '@/components/Accordion.module.css'
import type { SupportedLocale } from '@/i18n'

import type { SystemId } from './contract'
import { hashForSystem, systemFromHash } from './hash'
import styles from './InteractiveSystemsSection.module.css'
import { RelatedPanel } from './RelatedPanel'
import type { RelatedProjectsBySystem } from './relatedProjects'
import type { Systems3dStrings } from './strings'
import { type CardPhase, SystemsCard } from './SystemsCard'

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
  /**
   * The related-projects read, started on the server and not awaited (C3-1). Only the panels suspend
   * on it; the card and the accordion never wait for it and are never remounted when it arrives.
   */
  related: Promise<RelatedProjectsBySystem>
}

interface RelatedSlotProps {
  related: Promise<RelatedProjectsBySystem>
  system: SystemId | null
  heading: string
  strings: Systems3dStrings
  placement: 'card' | 'stacked'
}

/** The related-projects panel of the entered system, once the read has arrived (none while it has not). */
function RelatedSlot({
  related,
  system,
  heading,
  strings,
  placement,
}: RelatedSlotProps): ReactElement | null {
  const bySystem = use(related)
  const entry = system ? bySystem[system] : undefined
  if (!entry || entry.projects.length === 0) {
    return null
  }
  return <RelatedPanel heading={heading} placement={placement} related={entry} strings={strings} />
}

/**
 * Owner rules (O-2, 2026-11-02, `docs/05-design.md` §21): at rest the first row is expanded as in
 * Figma and nothing is entered (no hash; the card shows the image). One click on any system header
 * enters it, the pre-expanded one included, and starts the model; once the model is live, a click on
 * the entered header collapses it and exits (before that, it starts the model: O-8). A
 * `#systems-<id>` hash on load enters that system and expands its row without starting the model.
 * Focus never moves.
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
  /** Counts the visitor's system choices; each one asks the card to start the model (O-2). */
  const [startSignal, setStartSignal] = useState(0)
  const [cardPhase, setCardPhase] = useState<CardPhase>('still')

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
    // O-8: the entered system's header on a card that is not live yet (a #systems hash on load, or a
    // start still loading) goes live inside that system; it collapses and exits only once live.
    if (
      system !== null &&
      system === entered &&
      (cardPhase === 'still' || cardPhase === 'loading')
    ) {
      setStartSignal((n) => n + 1)
      return
    }
    // A click on an expanded header that is not entered (the pre-expanded first row) enters it.
    if (nextExpanded || (system !== null && system !== entered)) {
      setExpandedIndex(idx)
      enter(system)
      if (system !== null) {
        setStartSignal((n) => n + 1)
      }
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

  const relatedSlot = (placement: 'card' | 'stacked'): ReactNode =>
    entered ? (
      <Suspense fallback={null}>
        <RelatedSlot
          heading={relatedHeading}
          placement={placement}
          related={related}
          strings={strings}
          system={entered}
        />
      </Suspense>
    ) : null

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
        relatedPanel={relatedSlot('card')}
        onPhaseChange={setCardPhase}
        startSignal={startSignal}
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
                  <p
                    className={`${styles.systemDescription} t-body-m`}
                    data-row-system={row.system ?? undefined}
                  >
                    {row.text}
                  </p>
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
        {relatedSlot('stacked')}
      </div>
    </div>
  )
}
