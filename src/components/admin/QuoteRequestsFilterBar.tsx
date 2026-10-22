'use client'

import { useTranslation } from '@payloadcms/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeStatus = searchParams.get('where[status][equals]') ?? ''
  const activeAssignedExists = searchParams.get('where[assignedTo][exists]') ?? ''
  const activeDateGte = searchParams.get('where[createdAt][greater_than_equal]') ?? ''

  const applyFilter = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === '') {
        next.delete(key)
      } else {
        next.set(key, val)
      }
    }
    next.set('page', '1')
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
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
        border: '1px solid var(--theme-elevation-150, rgba(128,128,128,0.2))',
        background: 'var(--theme-elevation-50, rgba(128,128,128,0.05))',
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
                ? '1px solid #5090E0'
                : '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
            background: activeStatus === '' ? 'rgba(80, 144, 224, 0.18)' : 'transparent',
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
            applyFilter({ 'where[assignedTo][exists]': null })
          }}
          style={{
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: activeAssignedExists === '' ? 700 : 500,
            border:
              activeAssignedExists === ''
                ? '1px solid #5090E0'
                : '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
            background: activeAssignedExists === '' ? 'rgba(80, 144, 224, 0.18)' : 'transparent',
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
                ? '1px solid #5090E0'
                : '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
            background:
              activeAssignedExists === 'true' ? 'rgba(80, 144, 224, 0.18)' : 'transparent',
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
                ? '1px solid #5090E0'
                : '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
            background:
              activeAssignedExists === 'false' ? 'rgba(80, 144, 224, 0.18)' : 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Unassigned' : 'غير معيّن'}
        </button>
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
                ? '1px solid #5090E0'
                : '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
            background: activeDateGte === '' ? 'rgba(80, 144, 224, 0.18)' : 'transparent',
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
            border: '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
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
            border: '1px solid var(--theme-elevation-200, rgba(128,128,128,0.25))',
            background: 'transparent',
            color: 'var(--theme-text, inherit)',
            cursor: 'pointer',
          }}
        >
          {isEnglish ? 'Last 30 days' : 'آخر 30 يوماً'}
        </button>
      </div>
    </div>
  )
}

export default QuoteRequestsFilterBar
