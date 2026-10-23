import { headers } from 'next/headers'
import type React from 'react'

import { CmsLink } from '@/components/CmsLink'
import { DEFAULT_LOCALE, getDictionary, isSupportedLocale, type SupportedLocale } from '@/i18n'

import styles from './not-found.module.css'

export default async function LocaleNotFoundPage(): Promise<React.JSX.Element> {
  const requestHeaders = await headers()
  const rawLocale = requestHeaders.get('x-aljazira-locale')
  const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE
  const dict = getDictionary(locale)

  return (
    <section className={styles.wrapper} data-theme="dark">
      <div className={styles.card}>
        <p className={`${styles.code} t-stat-number`}>{dict.errors.notFoundCode}</p>
        <h1 className={`${styles.title} t-h2`}>{dict.errors.notFoundTitle}</h1>
        <p className={`${styles.description} t-body-l`}>{dict.errors.notFoundDescription}</p>
        <CmsLink href={`/${locale}`} className={`${styles.cta} t-label-button`}>
          {dict.actions.backToHome}
        </CmsLink>
      </div>
    </section>
  )
}
