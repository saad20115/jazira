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
    background: 'rgba(80, 144, 224, 0.16)',
    border: 'rgba(80, 144, 224, 0.48)',
    color: 'rgb(80, 144, 224)',
    dot: 'rgb(80, 144, 224)',
  },
  contacted: {
    label: {
      ar: 'تم التواصل',
      en: 'Contacted',
    },
    background: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.48)',
    color: 'rgb(245, 158, 11)',
    dot: 'rgb(245, 158, 11)',
  },
  quoted: {
    label: {
      ar: 'تم إرسال العرض',
      en: 'Quoted',
    },
    background: 'rgba(139, 92, 246, 0.16)',
    border: 'rgba(139, 92, 246, 0.48)',
    color: 'rgb(167, 139, 250)',
    dot: 'rgb(167, 139, 250)',
  },
  closed: {
    label: {
      ar: 'مغلق',
      en: 'Closed',
    },
    background: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.48)',
    color: 'rgb(16, 185, 129)',
    dot: 'rgb(16, 185, 129)',
  },
  spam: {
    label: {
      ar: 'غير مرغوب (Spam)',
      en: 'Spam',
    },
    background: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.48)',
    color: 'rgb(239, 68, 68)',
    dot: 'rgb(239, 68, 68)',
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
