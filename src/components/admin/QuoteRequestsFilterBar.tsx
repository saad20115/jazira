'use client'

import { useAuth, useConfig, useListQuery, useTranslation } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import type { Where } from 'payload'
import React from 'react'

import { QUOTE_STATUS_PILL_STYLES, type QuoteRequestStatusValue } from './QuoteStatusPillCell'

const STATUS_OPTIONS: readonly QuoteRequestStatusValue[] = [
  'new',
  'contacted',
  'quoted',
  'closed',
  'spam',
]

export const QuoteRequestsFilterBar: React.FC = () => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'
  const searchParams = useSearchParams()
  // The list keeps its own copy of the query and writes it back into the URL. Changing the filter
  // through that copy (not by pushing a new URL) is what lets a cleared filter stay cleared.
  const { query, refineListData } = useListQuery()

  const activeStatus = searchParams.get('where[status][equals]') ?? ''
  const activeAssignedExists = searchParams.get('where[assignedTo][exists]') ?? ''
  const activeDateGte = searchParams.get('where[createdAt][greater_than_equal]') ?? ''
  // P5-T2 §3: "Mine" = requests assigned to the logged-in user.
  const { user } = useAuth<{ id?: number | string; role?: string }>()
  const { config } = useConfig()
  const myId = user?.id === undefined ? '' : String(user.id)
  const activeMine = myId !== '' && searchParams.get('where[assignedTo][equals]') === myId
  // P5-T2 §4: the CSV export takes the list's current filter and search (admin only; the
  // endpoint re-checks the role).
  const exportQuery = new URLSearchParams()
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('where') || key === 'search') {
      exportQuery.append(key, value)
    }
  }
  const exportQueryString = exportQuery.toString()
  const exportHref = `${config.serverURL}${config.routes.api}/quote-requests/export-csv${exportQueryString ? `?${exportQueryString}` : ''}`

  const applyFilter = (updates: Record<string, string | null>) => {
    const where = new Map<string, unknown>(Object.entries(query.where ?? {}))
    for (const [key, val] of Object.entries(updates)) {
      const match = /^where\[(\w+)\]\[(\w+)\]$/.exec(key)
      const field = match?.[1]
      const operator = match?.[2]
      if (field === undefined || operator === undefined) {
        continue
      }
      const current = where.get(field)
      const constraint = new Map<string, unknown>(
        typeof current === 'object' && current !== null ? Object.entries(current) : [],
      )
      if (val === null || val === '') {
        constraint.delete(operator)
      } else {
        constraint.set(operator, val)
      }
      if (constraint.size === 0) {
        where.delete(field)
      } else {
        where.set(field, Object.fromEntries(constraint))
      }
    }
    void refineListData({ where: Object.fromEntries(where) as Where, page: 1 })
  }

  const setDateDaysAgo = (days: number | null) => {
    if (days === null) {
      applyFilter({ 'where[createdAt][greater_than_equal]': null })
      return
    }
    const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    applyFilter({ 'where[createdAt][greater_than_equal]': d.toISOString() })
  }

  return (
    <div
      data-testid="quote-requests-filter-bar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
      }}
    >
      {/* Status quick filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85 }}>
          {isEnglish ? 'Status:' : 'تصفية حسب الحالة:'}
        </span>
        <button
          type="button"
          onClick={() => {
            applyFilter({ 'where[status][equals]': null })
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: activeStatus === '' ? 700 : 500,
            border:
              activeStatus === ''
                ? '1px solid var(--theme-elevation-500)'
                : '1px solid var(--theme-elevation-200)',
            background: activeStatus === '' ? 'var(--theme-elevation-150)' : 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'All' : 'الكل'}
        </button>
        {STATUS_OPTIONS.map((statusKey) => {
          const cfg = QUOTE_STATUS_PILL_STYLES[statusKey]
          const isSelected = activeStatus === statusKey
          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => {
                applyFilter({
                  'where[status][equals]': isSelected ? null : statusKey,
                })
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 700 : 500,
                border: `1px solid ${isSelected ? cfg.color : cfg.border}`,
                background: isSelected ? cfg.background : 'transparent',
                color: cfg.color,
                cursor: 'pointer',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '0.4rem',
                  height: '0.4rem',
                  borderRadius: '9999px',
                  background: cfg.dot,
                }}
              />
              <span>{isEnglish ? cfg.label.en : cfg.label.ar}</span>
            </button>
          )
        })}
      </div>

      {/* Assignee quick filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85 }}>
          {isEnglish ? 'Assignee:' : 'المسؤول المعيّن:'}
        </span>
        <button
          type="button"
          onClick={() => {
            applyFilter({ 'where[assignedTo][exists]': null, 'where[assignedTo][equals]': null })
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: activeAssignedExists === '' ? 700 : 500,
            border:
              activeAssignedExists === ''
                ? '1px solid var(--theme-elevation-500)'
                : '1px solid var(--theme-elevation-200)',
            background: activeAssignedExists === '' ? 'var(--theme-elevation-150)' : 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'All' : 'الكل'}
        </button>
        <button
          type="button"
          onClick={() => {
            applyFilter({
              'where[assignedTo][equals]': null,
              'where[assignedTo][exists]': activeAssignedExists === 'true' ? null : 'true',
            })
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: activeAssignedExists === 'true' ? 700 : 500,
            border:
              activeAssignedExists === 'true'
                ? '1px solid var(--theme-elevation-500)'
                : '1px solid var(--theme-elevation-200)',
            background:
              activeAssignedExists === 'true' ? 'var(--theme-elevation-150)' : 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Assigned' : 'معيّن لموظف'}
        </button>
        <button
          type="button"
          onClick={() => {
            applyFilter({
              'where[assignedTo][equals]': null,
              'where[assignedTo][exists]': activeAssignedExists === 'false' ? null : 'false',
            })
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: activeAssignedExists === 'false' ? 700 : 500,
            border:
              activeAssignedExists === 'false'
                ? '1px solid var(--theme-elevation-500)'
                : '1px solid var(--theme-elevation-200)',
            background:
              activeAssignedExists === 'false' ? 'var(--theme-elevation-150)' : 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Unassigned' : 'غير معيّن'}
        </button>
        {myId !== '' ? (
          <button
            type="button"
            data-testid="quote-filter-mine"
            aria-pressed={activeMine}
            onClick={() => {
              applyFilter({
                'where[assignedTo][exists]': null,
                'where[assignedTo][equals]': activeMine ? null : myId,
              })
            }}
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: activeMine ? 700 : 500,
              border: activeMine
                ? '1px solid var(--theme-elevation-500)'
                : '1px solid var(--theme-elevation-200)',
              background: activeMine ? 'var(--theme-elevation-150)' : 'transparent',
              color: 'var(--theme-text, inherit)',
              cursor: 'pointer',
            }}
          >
            {isEnglish ? 'Mine' : 'طلباتي'}
          </button>
        ) : null}
      </div>

      {/* Date quick filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85 }}>
          {isEnglish ? 'Date:' : 'تاريخ الطلب:'}
        </span>
        <button
          type="button"
          onClick={() => {
            setDateDaysAgo(null)
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: activeDateGte === '' ? 700 : 500,
            border:
              activeDateGte === ''
                ? '1px solid var(--theme-elevation-500)'
                : '1px solid var(--theme-elevation-200)',
            background: activeDateGte === '' ? 'var(--theme-elevation-150)' : 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Any time' : 'كل الأوقات'}
        </button>
        <button
          type="button"
          onClick={() => {
            setDateDaysAgo(7)
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            border: '1px solid var(--theme-elevation-200)',
            background: 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Last 7 days' : 'آخر 7 أيام'}
        </button>
        <button
          type="button"
          onClick={() => {
            setDateDaysAgo(30)
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            border: '1px solid var(--theme-elevation-200)',
            background: 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Last 30 days' : 'آخر 30 يوماً'}
        </button>
      </div>

      {user?.role === 'admin' ? (
        <a
          href={exportHref}
          data-testid="quote-export-csv"
          className="btn btn--style-secondary btn--size-small"
          style={{ marginInlineStart: 'auto' }}
        >
          {isEnglish ? 'Export CSV (current filter)' : 'تصدير CSV (حسب التصفية الحالية)'}
        </a>
      ) : null}
    </div>
  )
}

export default QuoteRequestsFilterBar
