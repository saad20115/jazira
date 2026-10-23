import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DEFAULT_LOCALE, getDictionary, isSupportedLocale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
  const dict = getDictionary(resolvedLocale)
  return {
    title: dict.errors.notFoundTitle,
    description: dict.errors.notFoundDescription,
  }
}

export default function CatchAllNotFoundPage(): never {
  notFound()
}
