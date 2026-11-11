import 'server-only'

import crypto from 'node:crypto'
import { z } from 'zod'

import type { SupportedLocale } from '@/i18n'
import { isValidInternalCmsPath, prefixInternalPathWithLocale } from '@/lib/link-safety'
import { getPreviewSecret } from '@/previewSecret'

// The derivation lives in `src/security/previewSecret.ts` so that `payload.config.ts` can use it
// for the Live Preview URL (P2-T7 §3); this module stays the server-only entry for the site.
export { getPreviewSecret }

export function verifyPreviewSecret(candidate: string): boolean {
  const expected = getPreviewSecret()
  const a = Buffer.from(candidate, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(a, b)
}

export const previewQuerySchema = z
  .object({
    secret: z.string().min(16).max(256),
    locale: z.enum(['en', 'ar']).optional().default('en'),
    path: z.string().min(1).max(256).optional(),
    collection: z.enum(['services', 'projects']).optional(),
    global: z
      .enum([
        'home-page',
        'services-page',
        'about-page',
        'projects-page',
        'contact-page',
        'privacy-page',
      ])
      .optional(),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  })
  .strict()

export type PreviewQueryInput = z.infer<typeof previewQuerySchema>

const GLOBAL_ROUTE_MAP: Record<NonNullable<PreviewQueryInput['global']>, string> = {
  'home-page': '/',
  'services-page': '/services',
  'about-page': '/about',
  'projects-page': '/projects',
  'contact-page': '/contact',
  'privacy-page': '/privacy',
}

export function resolvePreviewTargetPath(input: {
  locale: SupportedLocale
  path?: string | undefined
  collection?: PreviewQueryInput['collection']
  global?: PreviewQueryInput['global']
  slug?: string | undefined
}): string | null {
  if (input.path) {
    if (!isValidInternalCmsPath(input.path)) {
      return null
    }
    return prefixInternalPathWithLocale(input.path, input.locale)
  }

  if (input.collection) {
    if (input.slug) {
      return `/${input.locale}/${input.collection}/${input.slug}`
    }
    return `/${input.locale}/${input.collection}`
  }

  if (input.global) {
    const baseRoute = GLOBAL_ROUTE_MAP[input.global]
    return prefixInternalPathWithLocale(baseRoute, input.locale)
  }

  return `/${input.locale}`
}

export const previewExitQuerySchema = z
  .object({
    returnTo: z.string().min(1).max(256).optional(),
  })
  .strict()
