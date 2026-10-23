'use client'

import { useTranslation } from '@payloadcms/ui'

export interface AdminCellComponentProps {
  cellData?: unknown
}

export type QuoteRequestStatusValue = 'new' | 'contacted' | 'quoted' | 'closed' | 'spam'

interface StatusStyleConfig {
  label: {
    ar: string
    en: string
  }
  background: string
  border: string
  color: string
  dot: string
}

export const QUOTE_STATUS_PILL_STYLES: Record<QuoteRequestStatusValue, StatusStyleConfig> = {
  new: {
    label: {
      ar: 'جديد',
      en: 'New',
    },
    background: 'var(--theme-elevation-100)',
    border: 'var(--theme-elevation-300)',
    color: 'var(--theme-text)',
    dot: 'var(--theme-elevation-600)',
  },
  contacted: {
    label: {
      ar: 'تم التواصل',
      en: 'Contacted',
    },
    background: 'var(--theme-warning-100)',
    border: 'var(--theme-warning-300)',
    color: 'var(--theme-warning-600)',
    dot: 'var(--theme-warning-500)',
  },
  quoted: {
    label: {
      ar: 'تم إرسال العرض',
      en: 'Quoted',
    },
    background: 'var(--theme-elevation-150)',
    border: 'var(--theme-elevation-400)',
    color: 'var(--theme-text)',
    dot: 'var(--theme-elevation-700)',
  },
  closed: {
    label: {
      ar: 'مغلق',
      en: 'Closed',
    },
    background: 'var(--theme-success-100)',
    border: 'var(--theme-success-300)',
    color: 'var(--theme-success-600)',
    dot: 'var(--theme-success-500)',
  },
  spam: {
    label: {
      ar: 'غير مرغوب (Spam)',
      en: 'Spam',
    },
    background: 'var(--theme-error-100)',
    border: 'var(--theme-error-300)',
    color: 'var(--theme-error-600)',
    dot: 'var(--theme-error-500)',
  },
}

export const QuoteStatusPillCell: React.FC<AdminCellComponentProps> = ({ cellData }) => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'
  const rawStatus = typeof cellData === 'string' ? cellData : 'new'
  const config =
    rawStatus in QUOTE_STATUS_PILL_STYLES
      ? QUOTE_STATUS_PILL_STYLES[rawStatus as QuoteRequestStatusValue]
      : QUOTE_STATUS_PILL_STYLES.new

  const label = isEnglish ? config.label.en : config.label.ar

  return (
    <span
      data-testid={`quote-status-pill-${rawStatus}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.2rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        background: config.background,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '0.45rem',
          height: '0.45rem',
          borderRadius: '9999px',
          background: config.dot,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </span>
  )
}

export default QuoteStatusPillCell
