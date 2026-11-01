'use client'

import { useEffect } from 'react'

import { startMotionController } from '@/components/motion/motion-controller'

/**
 * Motion system root (`docs/05-design.md` CTO decision #20, P3-T14).
 *
 * Renders nothing. After hydration it starts the shared motion controller, which sets
 * `html[data-motion="on"]` only when `IntersectionObserver` exists and reduced motion is off, and
 * only after the intro splash has ended. Mounted once in the locale layout, so it covers every
 * public page and client-side navigations (new content is picked up by a `MutationObserver`).
 */
export function MotionRoot(): null {
  useEffect(() => {
    const handle = startMotionController(document, window)
    return () => {
      handle?.dispose()
    }
  }, [])
  return null
}
