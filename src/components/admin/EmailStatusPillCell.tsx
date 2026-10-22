'use client'

import { useTranslation } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

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
    background: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.48)',
    color: '#F59E0B',
    dot: '#F59E0B',
  },
  sent: {
    label: {
      ar: 'تم الإرسال',
      en: 'Sent',
    },
    background: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.48)',
    color: '#10B981',
    dot: '#10B981',
  },
  failed: {
    label: {
      ar: 'فشل الإرسال',
      en: 'Failed',
    },
    background: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.48)',
    color: '#EF4444',
    dot: '#EF4444',
  },
}

export const EmailStatusPillCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
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
