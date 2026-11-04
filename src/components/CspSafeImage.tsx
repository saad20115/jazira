'use client'

import Image, { type ImageProps } from 'next/image'
import { createContext, type JSX, type ReactNode, useContext } from 'react'

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

/**
 * R-50: Public renders keep Next.js image optimisation (`/_next/image` + responsive `srcset`).
 * Only when server-side `draftMode().isEnabled` is true does `DraftImageBypassProvider` enable
 * direct browser fetches for `/api/media/file/...` so authenticated editors in draft preview send
 * their `payload-token` cookie instead of hitting an unauthenticated `/_next/image` loopback on
 * placeholder media (`P4-T2` R-12).
 */
const DraftImageBypassContext = createContext<boolean>(false)

export function DraftImageBypassProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children?: ReactNode
}): JSX.Element {
  return (
    <DraftImageBypassContext.Provider value={enabled}>{children}</DraftImageBypassContext.Provider>
  )
}

export type CspSafeImageProps = Omit<ImageProps, 'style' | 'fill'>

export function CspSafeImage({ alt, unoptimized, ...rest }: CspSafeImageProps): JSX.Element {
  const isDraftBypass = useContext(DraftImageBypassContext)
  const isPayloadMediaRoute =
    typeof rest.src === 'string' && rest.src.startsWith('/api/media/file/')
  return (
    <Image
      alt={alt}
      unoptimized={unoptimized ?? (isDraftBypass && isPayloadMediaRoute)}
      {...rest}
      style={CSP_SAFE_IMAGE_STYLE}
    />
  )
}
