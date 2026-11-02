/**
 * Client-side motion controller (`docs/05-design.md` CTO decision #20, P3-T14).
 *
 * One shared `IntersectionObserver` drives every reveal, count-up and off-screen loop pause.
 * The controller only ever adds attributes (`data-motion`, `data-revealed`, `data-inview`,
 * `data-countup-state`) and uses CSSOM `style.setProperty` (CSP H3a). It never writes inline
 * `style` attributes and never hides content itself: the hidden "before reveal" states live in
 * CSS under `html[data-motion="on"]`, so if this module never runs, everything stays visible.
 */
import {
  COUNT_UP_FALLBACK_DURATION_MS,
  easeOutCubic,
  formatCountUpValue,
  hasReachedRevealThreshold,
  INTRO_WAIT_TIMEOUT_MS,
  isIntroPending,
  isRectInViewport,
  MOTION_REDUCED_QUERY,
  parseCountUpValue,
  parseCssTimeToMs,
  REVEAL_VISIBILITY_THRESHOLD,
  shouldEnableMotion,
  VIEWPORT_FAILSAFE_MS,
} from '@/components/motion/motion'

export const REVEAL_SELECTOR = '[data-reveal], [data-reveal-stagger]'
export const COUNT_UP_SELECTOR = '[data-countup]'
export const LOOP_SELECTOR = '[data-motion-loop]'
const ALL_MOTION_SELECTOR = `${REVEAL_SELECTOR}, ${COUNT_UP_SELECTOR}, ${LOOP_SELECTOR}`
const REVEAL_AND_COUNTUP_SELECTOR = `${REVEAL_SELECTOR}, ${COUNT_UP_SELECTOR}`

export interface MotionControllerHandle {
  dispose: () => void
}

/**
 * The browser globals the controller needs. `IntersectionObserver` is optional on purpose: §20
 * requires motion to stay off (content visible) when it is missing.
 */
export type MotionWindow = Omit<Window & typeof globalThis, 'IntersectionObserver'> & {
  IntersectionObserver?: typeof IntersectionObserver
}

function isElementLike(node: unknown): node is Element {
  return (
    typeof node === 'object' &&
    node !== null &&
    typeof (node as { matches?: unknown }).matches === 'function'
  )
}

function collectMotionTargets(scope: ParentNode | Element): Element[] {
  const found: Element[] = []
  if (isElementLike(scope) && scope.matches(ALL_MOTION_SELECTOR)) {
    found.push(scope)
  }
  scope.querySelectorAll(ALL_MOTION_SELECTOR).forEach((el) => {
    found.push(el)
  })
  return found
}

/** Pauses autoplaying looped videos when the user prefers reduced motion (§20: loops are off). */
export function pauseLoopingVideos(doc: Document): void {
  doc.querySelectorAll<HTMLVideoElement>('video[autoplay][loop]').forEach((video) => {
    video.removeAttribute('autoplay')
    if (typeof video.pause === 'function') {
      video.pause()
    }
  })
}

/**
 * Starts the motion system for the current document. Returns `null` (and changes nothing) when
 * `IntersectionObserver` is missing or reduced motion is requested.
 */
export function startMotionController(
  doc: Document,
  win: MotionWindow,
): MotionControllerHandle | null {
  const root = doc.documentElement
  try {
    const IntersectionObserverCtor = win.IntersectionObserver
    const reducedQuery = win.matchMedia(MOTION_REDUCED_QUERY)
    const enabled = shouldEnableMotion({
      hasIntersectionObserver: typeof IntersectionObserverCtor === 'function',
      prefersReducedMotion: reducedQuery.matches,
    })
    if (!enabled || !IntersectionObserverCtor) {
      if (reducedQuery.matches) {
        pauseLoopingVideos(doc)
      }
      return null
    }

    let disposed = false
    let observer: IntersectionObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let introObserver: MutationObserver | null = null
    let introTimer: ReturnType<typeof setTimeout> | null = null
    let failSafeTimer: ReturnType<typeof setTimeout> | null = null
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const frameIds = new Set<number>()
    const viewportEnteredAt = new Map<Element, number>()

    const countUpDurationMs = parseCssTimeToMs(
      win.getComputedStyle(root).getPropertyValue('--motion-countup'),
      COUNT_UP_FALLBACK_DURATION_MS,
    )

    const viewport = (): { width: number; height: number } => ({
      width: win.innerWidth,
      height: win.innerHeight,
    })

    const isDocumentHidden = (): boolean =>
      (doc as { visibilityState?: string }).visibilityState === 'hidden'

    const finishCountUp = (el: Element): void => {
      const parts = parseCountUpValue(el.getAttribute('data-countup'))
      const display = el.querySelector('[data-countup-display]')
      if (parts && display) {
        display.textContent = formatCountUpValue(parts, parts.value)
      }
      el.setAttribute('data-countup-state', 'done')
      viewportEnteredAt.delete(el)
    }

    const revealAll = (): void => {
      doc.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (!el.hasAttribute('data-revealed')) {
          el.setAttribute('data-revealed', 'instant')
        }
      })
      doc.querySelectorAll(COUNT_UP_SELECTOR).forEach((el) => {
        if (el.getAttribute('data-countup-state') !== 'done') {
          finishCountUp(el)
        }
      })
      viewportEnteredAt.clear()
    }

    /**
     * R-42 fail-safe: any exception in the controller reveals all targets and removes `data-motion`
     * from `<html>` so no content can ever remain hidden.
     */
    const failSafeDisable = (): void => {
      try {
        revealAll()
      } catch {
        /* ignore */
      }
      try {
        dispose()
      } catch {
        root.removeAttribute('data-motion')
      }
    }

    const runCountUp = (el: Element): void => {
      const parts = parseCountUpValue(el.getAttribute('data-countup'))
      const display = el.querySelector<HTMLElement>('[data-countup-display]')
      if (!parts || !display || el.getAttribute('data-countup-state') || isDocumentHidden()) {
        finishCountUp(el)
        return
      }
      // Reserve the final width first so the changing digits never shift the layout (no CLS).
      display.style.setProperty(
        'min-inline-size',
        `${String(display.getBoundingClientRect().width)}px`,
      )
      el.setAttribute('data-countup-state', 'running')
      display.textContent = formatCountUpValue(parts, 0)
      const startedAt = win.performance.now()
      const guardTimer = setTimeout(() => {
        timers.delete(guardTimer)
        if (!disposed && el.getAttribute('data-countup-state') !== 'done') {
          finishCountUp(el)
        }
      }, countUpDurationMs + 250)
      timers.add(guardTimer)

      const step = (now: number): void => {
        if (disposed) {
          return
        }
        try {
          if (isDocumentHidden()) {
            finishCountUp(el)
            return
          }
          const progress = Math.min((now - startedAt) / countUpDurationMs, 1)
          display.textContent = formatCountUpValue(parts, parts.value * easeOutCubic(progress))
          if (progress < 1) {
            frameIds.add(win.requestAnimationFrame(step))
          } else {
            finishCountUp(el)
          }
        } catch {
          failSafeDisable()
        }
      }
      frameIds.add(win.requestAnimationFrame(step))
    }

    /**
     * `wipe` / `draw` targets start fully clipped (`clip-path`), and a fully clipped element never
     * intersects. They are therefore observed through their parent element (a proxy).
     */
    const proxyTargets = new Map<Element, Element[]>()

    const revealTarget = (el: Element): void => {
      viewportEnteredAt.delete(el)
      if (el.matches(COUNT_UP_SELECTOR)) {
        runCountUp(el)
      } else {
        el.setAttribute('data-revealed', isDocumentHidden() ? 'instant' : 'true')
      }
    }

    const isTargetInViewport = (el: Element, vp: { width: number; height: number }): boolean => {
      if (isRectInViewport(el.getBoundingClientRect(), vp)) {
        return true
      }
      const variant = el.getAttribute('data-reveal')
      if ((variant === 'wipe' || variant === 'draw') && el.parentElement) {
        return isRectInViewport(el.parentElement.getBoundingClientRect(), vp)
      }
      return false
    }

    const scheduleFailSafeCheck = (delayMs: number): void => {
      if (disposed || failSafeTimer !== null) {
        return
      }
      failSafeTimer = setTimeout(() => {
        failSafeTimer = null
        checkViewportFailSafe()
      }, delayMs)
    }

    /**
     * R-42 viewport fail-safe: any target that stays in the viewport for `VIEWPORT_FAILSAFE_MS`
     * (1 s) without being revealed by the 15% IntersectionObserver threshold is revealed
     * automatically. In a background tab (`visibilityState === 'hidden'`), in-viewport targets are
     * revealed immediately because browsers pause `requestAnimationFrame` and throttle observers.
     */
    function checkViewportFailSafe(): void {
      if (disposed || !observer) {
        return
      }
      try {
        const now = win.performance.now()
        const vp = viewport()
        const hiddenTab = isDocumentHidden()
        let nextDelayMs: number | null = null

        const candidates: Element[] = []
        doc.querySelectorAll(REVEAL_AND_COUNTUP_SELECTOR).forEach((el) => {
          candidates.push(el)
        })
        for (const el of candidates) {
          const isCountUp = el.matches(COUNT_UP_SELECTOR)
          const alreadyDone = isCountUp
            ? el.getAttribute('data-countup-state') === 'done'
            : el.hasAttribute('data-revealed')
          if (alreadyDone) {
            viewportEnteredAt.delete(el)
            continue
          }
          if (!isTargetInViewport(el, vp)) {
            viewportEnteredAt.delete(el)
            continue
          }
          if (hiddenTab) {
            viewportEnteredAt.delete(el)
            observer.unobserve(el)
            if (isCountUp) {
              finishCountUp(el)
            } else {
              el.setAttribute('data-revealed', 'instant')
            }
            continue
          }
          if (isCountUp && el.getAttribute('data-countup-state') === 'running') {
            continue
          }
          const enteredAt = viewportEnteredAt.get(el)
          if (enteredAt === undefined) {
            viewportEnteredAt.set(el, now)
            nextDelayMs =
              nextDelayMs === null
                ? VIEWPORT_FAILSAFE_MS
                : Math.min(nextDelayMs, VIEWPORT_FAILSAFE_MS)
          } else if (now - enteredAt >= VIEWPORT_FAILSAFE_MS) {
            viewportEnteredAt.delete(el)
            observer.unobserve(el)
            revealTarget(el)
          } else {
            const remaining = Math.max(16, VIEWPORT_FAILSAFE_MS - (now - enteredAt))
            nextDelayMs = nextDelayMs === null ? remaining : Math.min(nextDelayMs, remaining)
          }
        }

        if (nextDelayMs !== null) {
          scheduleFailSafeCheck(nextDelayMs)
        }
      } catch {
        failSafeDisable()
      }
    }

    const handleEntries = (entries: IntersectionObserverEntry[]): void => {
      try {
        for (const entry of entries) {
          const el = entry.target
          if (el.matches(LOOP_SELECTOR)) {
            el.setAttribute('data-inview', entry.isIntersecting ? 'true' : 'false')
          }
          if (
            !entry.isIntersecting ||
            !hasReachedRevealThreshold(
              entry.intersectionRatio,
              entry.intersectionRect.height,
              win.innerHeight,
            )
          ) {
            continue
          }
          const proxied = proxyTargets.get(el)
          if (proxied) {
            proxyTargets.delete(el)
            proxied.forEach(revealTarget)
            if (!el.matches(`${REVEAL_SELECTOR}, ${COUNT_UP_SELECTOR}, ${LOOP_SELECTOR}`)) {
              observer?.unobserve(el)
              continue
            }
          }
          if (el.matches(LOOP_SELECTOR)) {
            continue
          }
          if (
            el.matches(COUNT_UP_SELECTOR)
              ? el.hasAttribute('data-countup-state')
              : el.hasAttribute('data-revealed')
          ) {
            continue
          }
          observer?.unobserve(el)
          revealTarget(el)
        }
        checkViewportFailSafe()
      } catch {
        failSafeDisable()
      }
    }

    const observeThroughProxy = (el: Element): boolean => {
      const variant = el.getAttribute('data-reveal')
      const parent = el.parentElement
      if ((variant !== 'wipe' && variant !== 'draw') || !parent || !observer) {
        return false
      }
      const list = proxyTargets.get(parent) ?? []
      list.push(el)
      proxyTargets.set(parent, list)
      observer.observe(parent)
      return true
    }

    /**
     * Observes every motion target inside `scope`. When `instantOnScreen` is true, targets that are
     * already visible are marked final immediately (they were painted before motion turned on).
     */
    const observeScope = (scope: ParentNode | Element, instantOnScreen: boolean): void => {
      if (!observer) {
        return
      }
      const vp = viewport()
      for (const el of collectMotionTargets(scope)) {
        if (el.matches(LOOP_SELECTOR)) {
          observer.observe(el)
          continue
        }
        const isCountUp = el.matches(COUNT_UP_SELECTOR)
        if (isCountUp ? el.hasAttribute('data-countup-state') : el.hasAttribute('data-revealed')) {
          continue
        }
        if (instantOnScreen && isTargetInViewport(el, vp)) {
          if (isCountUp) {
            finishCountUp(el)
          } else {
            el.setAttribute('data-revealed', 'instant')
          }
          continue
        }
        if (!observeThroughProxy(el)) {
          observer.observe(el)
        }
      }
    }

    const start = (): void => {
      if (disposed || observer) {
        return
      }
      try {
        observer = new IntersectionObserverCtor(handleEntries, {
          threshold: [0, REVEAL_VISIBILITY_THRESHOLD],
        })
        // Targets already on screen were painted before motion turned on: mark them final *before*
        // the hidden states can apply, so already-visible content is never hidden again.
        observeScope(doc, true)
        root.setAttribute('data-motion', 'on')
        const addedContentObserver = new win.MutationObserver((records: MutationRecord[]) => {
          try {
            for (const record of records) {
              record.addedNodes.forEach((node: Node) => {
                if (isElementLike(node)) {
                  observeScope(node, false)
                }
              })
            }
            checkViewportFailSafe()
          } catch {
            failSafeDisable()
          }
        })
        addedContentObserver.observe(doc.body, { childList: true, subtree: true })
        mutationObserver = addedContentObserver
        checkViewportFailSafe()
      } catch {
        failSafeDisable()
      }
    }

    const stopWaitingForIntro = (): void => {
      introObserver?.disconnect()
      introObserver = null
      if (introTimer !== null) {
        clearTimeout(introTimer)
        introTimer = null
      }
    }

    function dispose(): void {
      if (disposed) {
        return
      }
      disposed = true
      stopWaitingForIntro()
      if (failSafeTimer !== null) {
        clearTimeout(failSafeTimer)
        failSafeTimer = null
      }
      timers.forEach((id) => {
        clearTimeout(id)
      })
      timers.clear()
      viewportEnteredAt.clear()
      observer?.disconnect()
      mutationObserver?.disconnect()
      frameIds.forEach((id) => {
        win.cancelAnimationFrame(id)
      })
      frameIds.clear()
      reducedQuery.removeEventListener('change', handleReducedMotionChange)
      win.removeEventListener('beforeprint', revealAll)
      win.removeEventListener('scroll', checkViewportFailSafe)
      win.removeEventListener('resize', checkViewportFailSafe)
      win.removeEventListener('hashchange', checkViewportFailSafe)
      win.removeEventListener('load', checkViewportFailSafe)
      win.removeEventListener('pageshow', checkViewportFailSafe)
      if (typeof (doc as { removeEventListener?: unknown }).removeEventListener === 'function') {
        doc.removeEventListener('visibilitychange', checkViewportFailSafe)
      }
      // Dropping the attribute removes every hidden "before reveal" state: content stays visible.
      root.removeAttribute('data-motion')
    }

    function handleReducedMotionChange(event: MediaQueryListEvent): void {
      if (event.matches) {
        revealAll()
        pauseLoopingVideos(doc)
        dispose()
      }
    }

    reducedQuery.addEventListener('change', handleReducedMotionChange)
    win.addEventListener('beforeprint', revealAll)
    win.addEventListener('scroll', checkViewportFailSafe, { passive: true })
    win.addEventListener('resize', checkViewportFailSafe, { passive: true })
    win.addEventListener('hashchange', checkViewportFailSafe)
    win.addEventListener('load', checkViewportFailSafe)
    win.addEventListener('pageshow', checkViewportFailSafe)
    if (typeof (doc as { addEventListener?: unknown }).addEventListener === 'function') {
      doc.addEventListener('visibilitychange', checkViewportFailSafe)
    }

    if (isIntroPending(root.getAttribute('data-intro'))) {
      // Motion stays fully off while the intro overlay is on screen: nothing is hidden behind the
      // intro (P3-T4 R-26). When the intro ends, targets already on screen are marked final at once
      // and only content further down reveals on scroll (§20 "motion starts after the intro").
      const resume = (): void => {
        try {
          if (isIntroPending(root.getAttribute('data-intro'))) {
            return
          }
          stopWaitingForIntro()
          start()
        } catch {
          failSafeDisable()
        }
      }
      const introAttributeObserver = new win.MutationObserver(resume)
      introAttributeObserver.observe(root, { attributes: true, attributeFilter: ['data-intro'] })
      introObserver = introAttributeObserver
      introTimer = setTimeout(() => {
        stopWaitingForIntro()
        start()
      }, INTRO_WAIT_TIMEOUT_MS)
    } else {
      start()
    }

    return { dispose }
  } catch {
    root.removeAttribute('data-motion')
    return null
  }
}
