import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigationState: { locale: string | undefined } = { locale: 'en' }

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: navigationState.locale }),
}))

import LocaleErrorPage from '@/app/(frontend)/[locale]/error'
import GlobalError from '@/app/global-error'

const SECRET = 'db password=hunter2 at /srv/app/node_modules/pg/lib/client.js:123'

function renderLocaleError(locale: string | undefined): string {
  navigationState.locale = locale
  const error = Object.assign(new Error(SECRET), { digest: 'digest-should-not-show' })
  return renderToStaticMarkup(React.createElement(LocaleErrorPage, { error, retry: () => {} }))
}

describe('P3-T10 §3 — 500 pages are localized and show no internals', () => {
  beforeEach(() => {
    navigationState.locale = 'en'
  })

  it('renders the English 500 page with a retry button and a link home', () => {
    const html = renderLocaleError('en')
    expect(html).toContain('data-error-page="500"')
    expect(html).toContain('500')
    expect(html).toContain('Something Went Wrong')
    expect(html).toContain('Try Again')
    expect(html).toContain('href="/en"')
    expect(html).toMatch(/<h1[^>]*>/)
  })

  it('renders the Arabic 500 page from the Arabic dictionary', () => {
    const html = renderLocaleError('ar')
    expect(html).toContain('حدث خطأ غير متوقع')
    expect(html).toContain('حاول مرة أخرى')
    expect(html).toContain('href="/ar"')
  })

  it('falls back to English for an unknown locale', () => {
    const html = renderLocaleError('xx')
    expect(html).toContain('Something Went Wrong')
    expect(html).toContain('href="/en"')
  })

  it('never renders the error message, digest or stack', () => {
    for (const locale of ['en', 'ar']) {
      const html = renderLocaleError(locale)
      expect(html).not.toContain('hunter2')
      expect(html).not.toContain('node_modules')
      expect(html).not.toContain('digest-should-not-show')
    }
    const globalHtml = renderToStaticMarkup(
      React.createElement(GlobalError, {
        error: Object.assign(new Error(SECRET), { digest: 'digest-should-not-show' }),
        retry: () => {},
      }),
    )
    expect(globalHtml).not.toContain('hunter2')
    expect(globalHtml).not.toContain('digest-should-not-show')
  })

  it('global-error renders its own document in English and Arabic', () => {
    const html = renderToStaticMarkup(
      React.createElement(GlobalError, { error: new Error('x'), retry: () => {} }),
    )
    expect(html).toMatch(/^<html lang="en" dir="ltr">/)
    expect(html).toContain('Something Went Wrong')
    expect(html).toContain('lang="ar" dir="rtl"')
    expect(html).toContain('حدث خطأ غير متوقع')
    expect(html).toContain('href="/en"')
  })
})
