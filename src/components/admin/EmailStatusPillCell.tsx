'use client'

import { useTranslation } from '@payloadcms/ui'

export interface AdminCellComponentProps {
  cellData?: unknown
}

export type QuoteEmailStatusValue = 'pending' | 'sent' | 'failed'

interface EmailStatusStyleConfig {
  label: {
    ar: string
    en: string
  }
  background: string
  border: string
  color: string
  dot: string
}

export const EMAIL_STATUS_PILL_STYLES: Record<QuoteEmailStatusValue, EmailStatusStyleConfig> = {
  pending: {
    label: {
      ar: 'قيد الإرسال',
      en: 'Pending',
    },
    background: 'var(--theme-warning-100)',
    border: 'var(--theme-warning-300)',
    color: 'var(--theme-warning-600)',
    dot: 'var(--theme-warning-500)',
  },
  sent: {
    label: {
      ar: 'تم الإرسال',
      en: 'Sent',
    },
    background: 'var(--theme-success-100)',
    border: 'var(--theme-success-300)',
    color: 'var(--theme-success-600)',
    dot: 'var(--theme-success-500)',
  },
  failed: {
    label: {
      ar: 'فشل الإرسال',
      en: 'Failed',
    },
    background: 'var(--theme-error-100)',
    border: 'var(--theme-error-300)',
    color: 'var(--theme-error-600)',
    dot: 'var(--theme-error-500)',
  },
}

export const EmailStatusPillCell: React.FC<AdminCellComponentProps> = ({ cellData }) => {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'
  const rawStatus = typeof cellData === 'string' ? cellData : 'pending'
  const config =
    rawStatus in EMAIL_STATUS_PILL_STYLES
      ? EMAIL_STATUS_PILL_STYLES[rawStatus as QuoteEmailStatusValue]
      : EMAIL_STATUS_PILL_STYLES.pending

  const label = isEnglish ? config.label.en : config.label.ar

  return (
    <span
      data-testid={`email-status-pill-${rawStatus}`}
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

export default EmailStatusPillCell
