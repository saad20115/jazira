'use client'

import { type ReactElement, type ReactNode, useId, useState } from 'react'

import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons'
import { getDictionary, type SupportedLocale } from '@/i18n'

import styles from './Accordion.module.css'

export const ACCORDION_ITEM_STATES = ['Collapsed', 'Expanded'] as const
export type AccordionItemState = (typeof ACCORDION_ITEM_STATES)[number]

export interface AccordionItemProps {
  body?: ReactNode
  className?: string
  defaultExpanded?: boolean
  hideLabel?: string
  id?: string
  locale: SupportedLocale
  numberBadge?: string
  onToggle?: (nextExpanded: boolean) => void
  showLabel?: string
  state?: AccordionItemState
  title: string
}

export function AccordionItem({
  locale,
  numberBadge,
  title,
  body,
  defaultExpanded = false,
  state,
  showLabel,
  hideLabel,
  onToggle,
  id,
  className,
}: AccordionItemProps): ReactElement {
  const dict = getDictionary(locale)
  const generatedId = useId()
  const baseId = id ?? generatedId
  const buttonId = `${baseId}-trigger`
  const panelId = `${baseId}-panel`

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<boolean>(
    state ? state === 'Expanded' : defaultExpanded,
  )

  const isExpanded = state ? state === 'Expanded' : uncontrolledExpanded
  const effectiveState: AccordionItemState = isExpanded ? 'Expanded' : 'Collapsed'

  const resolvedShowLabel = showLabel ?? dict.accordion.showDetails
  const resolvedHideLabel = hideLabel ?? dict.accordion.hideDetails

  const handleToggle = (): void => {
    const next = !isExpanded
    if (!state) {
      setUncontrolledExpanded(next)
    }
    onToggle?.(next)
  }

  const itemClasses = [styles.item, isExpanded ? styles.itemExpanded : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={itemClasses}
      data-accordion-state={effectiveState}
      data-component="accordion-item"
    >
      <button
        aria-controls={panelId}
        aria-expanded={isExpanded}
        className={styles.headerButton}
        id={buttonId}
        onClick={handleToggle}
        type="button"
      >
        <span className={styles.leadingGroup}>
          {numberBadge ? <span className={styles.badge}>{numberBadge}</span> : null}
          <span className={styles.title}>{title}</span>
        </span>
        <span className={styles.trailingGroup}>
          <span className={styles.actionLabel}>
            {isExpanded ? resolvedHideLabel : resolvedShowLabel}
          </span>
          {isExpanded ? (
            <ChevronUpIcon className={styles.chevronExpanded} size={18} />
          ) : (
            <ChevronDownIcon className={styles.chevronCollapsed} size={18} />
          )}
        </span>
      </button>

      {/*
        §20 catalogue 8: the panel height animates with `grid-template-rows: 0fr -> 1fr`. When
        collapsed the panel is `visibility: hidden` (after the close transition) and `inert`, so it
        stays out of the tab order and the accessibility tree exactly like the former `hidden`.
      */}
      <div
        aria-labelledby={buttonId}
        className={[styles.panelGrid, isExpanded ? styles.panelGridExpanded : '']
          .filter(Boolean)
          .join(' ')}
        data-accordion-panel={effectiveState}
        id={panelId}
        inert={!isExpanded}
        role="region"
      >
        <div className={styles.panelClip}>
          <div className={styles.panel}>{body}</div>
        </div>
      </div>
    </div>
  )
}

export interface AccordionEntry {
  body: ReactNode
  defaultExpanded?: boolean
  id?: string
  numberBadge?: string
  title: string
}

export interface AccordionProps {
  className?: string
  defaultExpandedIndex?: number
  items: readonly AccordionEntry[]
  locale: SupportedLocale
  onExpandedIndexChange?: (nextIndex: number | null) => void
  singleExpand?: boolean
}

export function Accordion({
  locale,
  items,
  className,
  singleExpand = false,
  defaultExpandedIndex,
  onExpandedIndexChange,
}: AccordionProps): ReactElement {
  const initialSingleIndex = (() => {
    if (defaultExpandedIndex !== undefined) {
      return defaultExpandedIndex
    }
    const foundIdx = items.findIndex((item) => item.defaultExpanded)
    return foundIdx >= 0 ? foundIdx : 0
  })()

  const [activeIndex, setActiveIndex] = useState<number | null>(initialSingleIndex)

  const listClasses = [styles.accordionList, className ?? ''].filter(Boolean).join(' ')
  return (
    <div className={listClasses} data-component="accordion">
      {items.map((entry, idx) => {
        const badge = entry.numberBadge ?? String(idx + 1).padStart(2, '0')
        const controlledState: AccordionItemState | undefined = singleExpand
          ? activeIndex === idx
            ? 'Expanded'
            : 'Collapsed'
          : undefined

        return (
          <AccordionItem
            body={entry.body}
            defaultExpanded={entry.defaultExpanded}
            id={entry.id}
            key={entry.id ?? `${badge}-${entry.title}`}
            locale={locale}
            numberBadge={badge}
            onToggle={
              singleExpand
                ? (nextExpanded) => {
                    const nextIdx = nextExpanded ? idx : null
                    setActiveIndex(nextIdx)
                    onExpandedIndexChange?.(nextIdx)
                  }
                : undefined
            }
            state={controlledState}
            title={entry.title}
          />
        )
      })}
    </div>
  )
}
