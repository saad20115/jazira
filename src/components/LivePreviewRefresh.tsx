'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** When the "ready" message is repeated after the first one, in milliseconds. */
const READY_REPEAT_MS = [500, 2000, 5000] as const

function isDocumentEvent(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === 'payload-document-event'
  )
}

/**
 * P2-T7 §3 — the public page's side of Payload Live Preview. The pages are server-rendered, so
 * the page does not read the form data Payload posts; it re-renders from the saved draft. Payload
 * posts `payload-document-event` after every save (autosave runs 800 ms after the last keystroke),
 * and this component answers with `router.refresh()`.
 *
 * It only talks to the window that embeds or opened it, and only on the same origin: the admin and
 * the site are one origin. The layout renders it only in a staff draft preview.
 */
export function LivePreviewRefresh(): null {
  const router = useRouter()

  useEffect(() => {
    const host = window.parent !== window ? window.parent : (window.opener as Window | null)
    if (!host) {
      return
    }
    const origin = window.location.origin
    const onMessage = (event: MessageEvent): void => {
      if (event.origin === origin && event.source === host && isDocumentEvent(event.data)) {
        router.refresh()
      }
    }
    window.addEventListener('message', onMessage)
    // Tells the admin the page is listening; Payload sends nothing before this. The admin attaches
    // its own listener in an effect, so a single early message can be missed: it is repeated.
    const announce = (): void => {
      host.postMessage({ type: 'payload-live-preview', ready: true }, origin)
    }
    announce()
    const timers = READY_REPEAT_MS.map((delay) => window.setTimeout(announce, delay))
    return () => {
      window.removeEventListener('message', onMessage)
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
    }
  }, [router])

  return null
}
