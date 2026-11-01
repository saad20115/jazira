'use client'

import Image, { type ImageProps } from 'next/image'
import type { JSX } from 'react'

/**
 * Prevents `next/image` from emitting an inline `style="color:transparent"` attribute that
 * violates strict `style-src` CSP without `'unsafe-inline'`.
 * Because `next/image` is a Client Component, passing `{ color: undefined }` from a Server
 * Component would lose the `undefined` key during RSC Flight serialization; constructing
 * `{ color: undefined }` inside this `'use client'` wrapper preserves the override on both
 * SSR and client hydration while `img[data-nimg] { color: transparent; }` in `globals.css`
 * provides the styling rule via stylesheet.
 */
const CSP_SAFE_IMAGE_STYLE = { color: undefined } as const

export type CspSafeImageProps = Omit<ImageProps, 'style'>

export function CspSafeImage({ alt, unoptimized, ...rest }: CspSafeImageProps): JSX.Element {
  const isPayloadMediaRoute =
    typeof rest.src === 'string' && rest.src.startsWith('/api/media/file/')
  return (
    <Image
      alt={alt}
      unoptimized={unoptimized ?? isPayloadMediaRoute}
      {...rest}
      style={CSP_SAFE_IMAGE_STYLE}
    />
  )
}
