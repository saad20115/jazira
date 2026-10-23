import type { ReactElement } from 'react'

import { CmsLink } from '@/components/CmsLink'
import { normalizeWhatsappDigits } from '@/components/Footer'
import { WhatsAppFilledIcon } from '@/components/icons'
import { getDictionary, type SupportedLocale } from '@/i18n'

import styles from './WhatsAppFab.module.css'

export const WHATSAPP_FAB_STATES = ['Idle', 'Pulse', 'Hover'] as const
export type WhatsAppFabState = (typeof WHATSAPP_FAB_STATES)[number]

export interface WhatsAppFabProps {
  ariaLabel?: string
  className?: string
  inline?: boolean
  locale: SupportedLocale
  state?: WhatsAppFabState
  tooltipLabel?: string
  whatsapp?: string | null | undefined
}

export function WhatsAppFab({
  locale,
  whatsapp,
  state = 'Pulse',
  inline = false,
  tooltipLabel,
  ariaLabel,
  className,
}: WhatsAppFabProps): ReactElement {
  const dict = getDictionary(locale)
  const resolvedWhatsapp = whatsapp || '+966573534185'
  const href = `https://wa.me/${normalizeWhatsappDigits(resolvedWhatsapp)}`
  const resolvedTooltip = tooltipLabel || dict.nav.whatsappChatTooltip
  const resolvedAriaLabel = ariaLabel || dict.nav.whatsappFabAriaLabel

  const wrapperClasses = [
    styles.wrapper,
    inline ? styles.inline : styles.fixed,
    state === 'Pulse' ? styles.statePulse : '',
    state === 'Hover' ? styles.stateHover : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={wrapperClasses}
      data-component="whatsapp-fab"
      data-whatsapp-fab-inline={inline ? 'true' : 'false'}
      data-whatsapp-fab-state={state}
    >
      <span aria-hidden="true" className={styles.tooltip}>
        {resolvedTooltip}
      </span>
      <span className={styles.fabBox}>
        <span aria-hidden="true" className={styles.pulseRing} />
        <CmsLink
          aria-label={resolvedAriaLabel}
          className={styles.fabButton}
          href={href}
          locale={locale}
          newTab
        >
          <WhatsAppFilledIcon size={30} />
        </CmsLink>
      </span>
    </div>
  )
}
