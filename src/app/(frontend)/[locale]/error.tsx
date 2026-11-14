'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import type React from 'react'

import { DEFAULT_LOCALE, getDictionary, isSupportedLocale, type SupportedLocale } from '@/i18n'

import styles from './not-found.module.css'

interface LocaleErrorPageProps {
  error: unknown
  retry: () => void
}

/**
 * P3-T10 §3 — localized 500 page ("CTO decisions" §6: Page header style with a CTA back home).
 * It never renders the error's message, digest or stack, so production shows no internals.
 * The site navbar and footer stay, because this boundary sits under the locale layout.
 */
export default function LocaleErrorPage({ retry }: LocaleErrorPageProps): React.JSX.Element {
  const params = useParams<{ locale?: string }>()
  const rawLocale = params.locale
  const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <section className={styles.wrapper} data-theme="dark" data-error-page="500">
      <div className={styles.card}>
        <p className={`${styles.code} t-stat-number`}>{dict.errors.serverErrorCode}</p>
        <h1 className={`${styles.title} t-h2`}>{dict.errors.serverErrorTitle}</h1>
        <p className={`${styles.description} t-body-l`}>{dict.errors.serverErrorDescription}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.cta} t-label-button`}
            onClick={() => {
              retry()
            }}
          >
            {dict.actions.tryAgain}
          </button>
          <Link href={`/${locale}`} className={`${styles.secondaryCta} t-label-button`}>
            {dict.actions.backToHome}
          </Link>
        </div>
      </div>
    </section>
  )
}
