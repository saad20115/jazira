'use client'

import Link from 'next/link'
import type React from 'react'

import { arDictionary } from '@/i18n/ar'
import { enDictionary } from '@/i18n/en'

import styles from './global-error.module.css'

interface GlobalErrorProps {
  error: unknown
  retry: () => void
}

/**
 * P3-T10 §3 — last-resort 500 page, used only when a root layout itself fails. It replaces the
 * root layout, so it renders its own document and cannot know the locale: it shows English and
 * Arabic together. It never renders the error's message, digest or stack.
 */
export default function GlobalError({ retry }: GlobalErrorProps): React.JSX.Element {
  return (
    <html lang="en" dir="ltr">
      <body className={styles.body}>
        <title>{`${enDictionary.errors.serverErrorTitle} | ${arDictionary.errors.serverErrorTitle}`}</title>
        <main className={styles.card}>
          <p className={styles.code}>{enDictionary.errors.serverErrorCode}</p>
          <section className={styles.block}>
            <h1 className={styles.title}>{enDictionary.errors.serverErrorTitle}</h1>
            <p className={styles.description}>{enDictionary.errors.serverErrorDescription}</p>
          </section>
          <section className={styles.block} lang="ar" dir="rtl">
            <h2 className={styles.title}>{arDictionary.errors.serverErrorTitle}</h2>
            <p className={styles.description}>{arDictionary.errors.serverErrorDescription}</p>
          </section>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                retry()
              }}
            >
              {enDictionary.actions.tryAgain} ·{' '}
              <span lang="ar">{arDictionary.actions.tryAgain}</span>
            </button>
            <Link className={styles.link} href="/en">
              {enDictionary.actions.backToHome}
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
