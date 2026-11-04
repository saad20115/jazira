'use client'

import { type JSX, type KeyboardEvent, useId, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/Button'
import { renderAccentHeading } from '@/components/CtaBand'
import { Eyebrow } from '@/components/Eyebrow'
import { formatServiceNumber } from '@/components/media-utils'
import {
  formatMaterialsShowing,
  formatMaterialsShowingSystem,
  formatViewAllItems,
  type UiDictionary,
} from '@/i18n'

import styles from './ApprovedMaterialsTable.module.css'

export type MaterialSystemKey = 'electrical' | 'mechanical' | 'structural' | 'architectural'
export type MaterialTabKey = 'all' | MaterialSystemKey

export interface ApprovedMaterialBrandItem {
  id: number | string
  name: string
  origin?: string | null
}

export interface ApprovedMaterialRow {
  id: number | string
  itemNo: number
  system: MaterialSystemKey
  description: string
  brands: ApprovedMaterialBrandItem[]
}

export interface ApprovedMaterialsTableProps {
  eyebrow?: string | null
  title?: string | null
  intro?: string | null
  materials: ApprovedMaterialRow[]
  dict: UiDictionary['services']
}

const SYSTEM_TABS: readonly MaterialTabKey[] = [
  'all',
  'electrical',
  'mechanical',
  'structural',
  'architectural',
] as const

function resolveOriginsLabel(brands: ApprovedMaterialBrandItem[]): string {
  const uniqueOrigins: string[] = []
  for (const brand of brands) {
    const clean = typeof brand.origin === 'string' ? brand.origin.trim() : ''
    if (clean && !uniqueOrigins.includes(clean)) {
      uniqueOrigins.push(clean)
    }
  }
  return uniqueOrigins.length > 0 ? uniqueOrigins.join(' · ') : '—'
}

export function ApprovedMaterialsTable({
  eyebrow,
  title,
  intro,
  materials,
  dict,
}: ApprovedMaterialsTableProps): JSX.Element {
  const baseId = useId()
  const [activeSystem, setActiveSystem] = useState<MaterialTabKey>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => a.itemNo - b.itemNo)
  }, [materials])

  const countsBySystem = useMemo(() => {
    const counts: Record<MaterialTabKey, number> = {
      all: sortedMaterials.length,
      electrical: 0,
      mechanical: 0,
      structural: 0,
      architectural: 0,
    }
    for (const row of sortedMaterials) {
      if (row.system in counts) {
        counts[row.system] += 1
      }
    }
    return counts
  }, [sortedMaterials])

  const filteredMaterials = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return sortedMaterials.filter((row) => {
      if (activeSystem !== 'all' && row.system !== activeSystem) {
        return false
      }
      if (!query) {
        return true
      }
      if (row.description.toLowerCase().includes(query)) {
        return true
      }
      if (String(row.itemNo).includes(query)) {
        return true
      }
      return row.brands.some(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          (typeof b.origin === 'string' && b.origin.toLowerCase().includes(query)),
      )
    })
  }, [sortedMaterials, activeSystem, searchQuery])

  const getTabLabel = (tab: MaterialTabKey): string => {
    switch (tab) {
      case 'all':
        return dict.tabAll
      case 'electrical':
        return dict.tabElectrical
      case 'mechanical':
        return dict.tabMechanical
      case 'structural':
        return dict.tabStructural
      case 'architectural':
        return dict.tabArchitectural
    }
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const total = SYSTEM_TABS.length
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % total
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + total) % total
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = total - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      const nextTab = SYSTEM_TABS[nextIndex] ?? 'all'
      setActiveSystem(nextTab)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  const panelId = `${baseId}-materials-panel`
  const activeTabId = `${baseId}-tab-${activeSystem}`

  const footerText =
    activeSystem === 'all'
      ? formatMaterialsShowing(
          dict.showingItemsTemplate,
          filteredMaterials.length,
          sortedMaterials.length,
        )
      : formatMaterialsShowingSystem(
          dict.showingSystemItemsTemplate,
          filteredMaterials.length,
          countsBySystem[activeSystem],
          getTabLabel(activeSystem),
        )

  const viewAllLabel = formatViewAllItems(dict.viewAllItemsTemplate, sortedMaterials.length)

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.headerCopy}>
            {eyebrow ? <Eyebrow tone="Light" label={eyebrow} /> : null}
            {title ? (
              <h2 className={`${styles.title} t-h2`}>{renderAccentHeading(title)}</h2>
            ) : null}
            {intro ? <p className={`${styles.intro} t-body-l`}>{intro}</p> : null}
          </div>

          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M12.25 12.25L15.75 15.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              aria-label={dict.materialsSearchLabel}
              placeholder={dict.materialsSearchPlaceholder}
              className={`${styles.searchInput} t-body-s`}
            />
          </div>
        </div>

        <div role="tablist" aria-label={dict.materialsTabsLabel} className={styles.tabList}>
          {SYSTEM_TABS.map((tab, index) => {
            const isSelected = activeSystem === tab
            const tabId = `${baseId}-tab-${tab}`
            const tabLabel = getTabLabel(tab)
            const tabCount = countsBySystem[tab]
            return (
              <button
                key={tab}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={panelId}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setActiveSystem(tab)
                }}
                onKeyDown={(e) => {
                  handleTabKeyDown(e, index)
                }}
                className={`${styles.tabButton} ${isSelected ? styles.tabButtonActive : ''} t-label-nav`}
              >
                <span>{tabLabel}</span>
                <span
                  className={`${styles.tabCount} ${isSelected ? styles.tabCountActive : ''} t-label-tag`}
                >
                  {tabCount}
                </span>
              </button>
            )
          })}
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={activeTabId}
          className={styles.tableCard}
        >
          <table className={styles.table}>
            <caption className={styles.srOnly}>{dict.materialsTableCaption}</caption>
            <thead className={styles.thead}>
              <tr>
                <th scope="col" className={`${styles.th} ${styles.colNo} t-label-caps`}>
                  {dict.colNumber}
                </th>
                <th scope="col" className={`${styles.th} ${styles.colMaterial} t-label-caps`}>
                  {dict.colMaterial}
                </th>
                <th scope="col" className={`${styles.th} ${styles.colBrand} t-label-caps`}>
                  {dict.colBrand}
                </th>
                <th scope="col" className={`${styles.th} ${styles.colOrigin} t-label-caps`}>
                  {dict.colOrigin}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${styles.emptyCell} t-body-m`}>
                    {dict.noMaterialsMatch}
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((row, index) => {
                  const isAlt = index % 2 === 1
                  const originsText = resolveOriginsLabel(row.brands)
                  const paddedItemNo = formatServiceNumber(row.itemNo)
                  return (
                    <tr key={row.id} className={isAlt ? `${styles.tr} ${styles.trAlt}` : styles.tr}>
                      <td className={`${styles.td} ${styles.itemNoText} t-body-s-medium`}>
                        {paddedItemNo}
                      </td>
                      <td className={`${styles.td} ${styles.materialDesc} t-body-s-medium`}>
                        {row.description}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.brandChips}>
                          {row.brands.map((brand) => (
                            <span key={brand.id} className={`${styles.brandChip} t-label-link`}>
                              {brand.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.originText} t-body-s`}>
                        {originsText}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <div className={styles.mobileCards}>
            {filteredMaterials.length === 0 ? (
              <div className={`${styles.emptyCell} t-body-m`}>{dict.noMaterialsMatch}</div>
            ) : (
              filteredMaterials.map((row, index) => {
                const isAlt = index % 2 === 1
                const originsText = resolveOriginsLabel(row.brands)
                const paddedItemNo = formatServiceNumber(row.itemNo)
                return (
                  <article
                    key={row.id}
                    className={
                      isAlt ? `${styles.mobileCard} ${styles.mobileCardAlt}` : styles.mobileCard
                    }
                  >
                    <div className={styles.mobileCardHead}>
                      <span className={`${styles.mobileNoBadge} t-label-tag`}>{paddedItemNo}</span>
                      <span className={`${styles.mobileOrigin} t-caption`}>{originsText}</span>
                    </div>
                    <p className={`${styles.materialDesc} t-body-m-medium`}>{row.description}</p>
                    <div className={styles.brandChips}>
                      {row.brands.map((brand) => (
                        <span key={brand.id} className={`${styles.brandChip} t-label-link`}>
                          {brand.name}
                        </span>
                      ))}
                    </div>
                  </article>
                )
              })
            )}
          </div>

          <div className={styles.tableFooter}>
            <p className={`${styles.footerCount} t-body-s`}>{footerText}</p>
            {activeSystem !== 'all' || searchQuery.trim().length > 0 ? (
              <Button
                variant="Outline"
                label={viewAllLabel}
                showArrow
                onClick={() => {
                  setActiveSystem('all')
                  setSearchQuery('')
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
