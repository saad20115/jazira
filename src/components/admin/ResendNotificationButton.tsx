'use client'

import { useAuth, useConfig, useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * P5-T2 §2 — "Resend notification" in the quote-request edit view. Shown to admins only, and only
 * when the sales-inbox e-mail has `failed`. It calls the admin-only endpoint
 * `POST /api/quote-requests/:id/resend-notification`, which re-checks the role and the state on
 * the server (an editor gets 403; a request that is not `failed` gets 409, so no double send).
 */
type ResendState = 'idle' | 'sending' | 'queued' | 'error'

const COPY = {
  ar: {
    button: 'إعادة إرسال الإشعار',
    sending: 'جارٍ الإرسال…',
    queued: 'أُضيف الإرسال إلى قائمة الانتظار. حدّث الصفحة بعد دقيقة لرؤية الحالة.',
    error: 'تعذّرت إعادة الإرسال. حاول مرة أخرى.',
    hint: 'فشل إرسال إشعار هذا الطلب إلى بريد المبيعات.',
  },
  en: {
    button: 'Resend notification',
    sending: 'Sending…',
    queued: 'The resend is queued. Refresh in a minute to see the status.',
    error: 'The resend failed. Please try again.',
    hint: 'The sales-inbox notification for this request failed.',
  },
} as const

export const ResendNotificationButton: React.FC = () => {
  const { i18n } = useTranslation()
  const copy = i18n.language === 'ar' ? COPY.ar : COPY.en
  const { user } = useAuth<{ role?: string }>()
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const router = useRouter()
  const emailStatus = useFormFields(([fields]) => {
    // The field can be absent from the form state while it loads.
    return 'emailStatus' in fields ? fields.emailStatus.value : undefined
  })
  const [state, setState] = React.useState<ResendState>('idle')

  if (
    user?.role !== 'admin' ||
    id === undefined ||
    (emailStatus !== 'failed' && state === 'idle')
  ) {
    return null
  }

  const resend = async () => {
    setState('sending')
    try {
      const response = await fetch(
        `${config.serverURL}${config.routes.api}/quote-requests/${String(id)}/resend-notification`,
        { method: 'POST', credentials: 'include' },
      )
      setState(response.status === 202 ? 'queued' : 'error')
      if (response.status === 202) {
        router.refresh()
      }
    } catch {
      setState('error')
    }
  }

  return (
    <div data-testid="quote-resend-notification" style={{ marginBottom: '1.5rem' }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem' }}>{copy.hint}</p>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        disabled={state === 'sending' || state === 'queued'}
        onClick={() => {
          void resend()
        }}
      >
        {state === 'sending' ? copy.sending : copy.button}
      </button>
      {state === 'queued' ? (
        <p role="status" style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
          {copy.queued}
        </p>
      ) : null}
      {state === 'error' ? (
        <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
          {copy.error}
        </p>
      ) : null}
    </div>
  )
}
