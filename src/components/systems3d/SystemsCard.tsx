'use client'

import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { ArrowUpRightIcon, CubeIcon } from '@/components/icons'

import { CARD_IMAGE_SIZES } from './cardImageSizes'
import type { SystemId } from './contract'
import styles from './InteractiveSystemsSection.module.css'
import { LiveLabels, type LiveLabelSink } from './LiveLabels'
import {
  DPR_CAP,
  LITE_GROUND_TINT,
  LIVE_LOOK,
  type ModelTier,
  RELEASE_BASE_PATH,
} from './renderContract'
import { StillLabels } from './StillLabels'
import { TapHint } from './TapHint'
import type { Systems3dStrings } from './strings'
import { chooseModelTier, decideStart, type DeviceCaps } from './tier'
import type { ViewerHandle } from './viewer/createViewer'
import { type FallbackReason, ViewerStartError } from './viewer/failure'

/** still → loading → live; any failure (or a weak device) → stills. The still is never removed. */
export type CardPhase = 'still' | 'loading' | 'live' | 'stills'
type Phase = CardPhase

/**
 * O-14: a start that has not rendered its first frame this long after the click falls back to the
 * stills tier (reason `timeout`), so within 10 s of the click the card is live or stills, whatever
 * the start waits for. The viewer is aborted, which ends its waits. 8 s leaves room for the stills to
 * show on a loaded device, where the timer and the render run late.
 */
const START_TIMEOUT_MS = 8_000

/**
 * O-9 / Q6: the model is prepared once the card is this close to the viewport (two viewport heights
 * above or below) after the visitor scrolled, in an idle period (at the latest after
 * `PREPARE_IDLE_TIMEOUT_MS`).
 */
const PREPARE_MARGIN = '200% 0px'
const PREPARE_IDLE_TIMEOUT_MS = 1_000

/** Phones render at most this many frames per second (§8c). */
const PHONE_MAX_FPS = 30

/** Keyboard steps (card focused): arrows orbit, +/- zoom (the wheel and pinch zoom too). */
const KEY_ROTATE = 0.15
const KEY_ZOOM_IN = 0.85
const KEY_ZOOM_OUT = 1 / KEY_ZOOM_IN
/** How long the "Drag to rotate" hint stays after the first activation. */
const HINT_MS = 3200
/** O-7: a second tap-hint cycle this long after the first ends, if the card is still idle on screen. */
const TAP_HINT_REPEAT_MS = 8_000
const TAP_HINT_MAX_CYCLES = 2
/** O-7 under reduced motion: the still hand stays this long, then fades (motion-slow). */
const TAP_HINT_STILL_MS = 2_400
const TAP_HINT_FADE_MS = 600
/** O-11: the entered still's fade-out over the canvas at the swap (motion-slow, as its CSS). */
const STILL_FADE_OUT_MS = 600
/**
 * O-14b: when the live view drops to the stills tier, the canvas stays this long after the stills
 * are in place (the entered still's fade-in, motion-slow; the canvas's own fade-out is shorter).
 */
const CANVAS_FADE_OUT_MS = 600
/** O-14b: the canvas leaves after this long even if the entered still never loads. */
const CANVAS_LEAVE_MAX_MS = 4_000

const STILLS_PATH = `${RELEASE_BASE_PATH}/stills`

function endStillSrcSet(system: SystemId, format: 'webp' | 'jpg'): string {
  return [1440, 2048]
    .map((w) => `${STILLS_PATH}/${system}_end_${String(w)}.${format} ${String(w)}w`)
    .join(', ')
}

/**
 * The end still of an entered system over the image (stills tier, and before the model is live).
 * O-8: it shows only once its picture has loaded, so the card is never an empty frame; until then the
 * image under it stays.
 */
function EnteredStill({
  cardRef,
  onLoaded,
  strings,
  system,
}: {
  cardRef: RefObject<HTMLDivElement | null>
  /** Called once the picture has loaded (its fade-in starts). */
  onLoaded?: (system: SystemId) => void
  strings: Systems3dStrings
  system: SystemId
}): ReactElement {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (loaded) {
      onLoaded?.(system)
    }
  }, [loaded, onLoaded, system])
  const markLoaded = useCallback((img: HTMLImageElement | null): void => {
    // A cached picture can be complete before React listens for its load event.
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [])
  return (
    <div
      className={styles.enteredLayer}
      data-entered-system={system}
      data-loaded={loaded ? 'true' : 'false'}
    >
      <picture className={styles.stillPicture}>
        <source
          sizes={CARD_IMAGE_SIZES}
          srcSet={endStillSrcSet(system, 'webp')}
          type="image/webp"
        />
        <img
          alt=""
          className={styles.buildingRender}
          decoding="async"
          height={2048}
          onLoad={() => {
            setLoaded(true)
          }}
          ref={markLoaded}
          sizes={CARD_IMAGE_SIZES}
          src={`${STILLS_PATH}/${system}_end_1440.jpg`}
          srcSet={endStillSrcSet(system, 'jpg')}
          width={2048}
        />
      </picture>
      <StillLabels cardRef={cardRef} strings={strings} system={system} />
    </div>
  )
}

export interface SystemsCardProps {
  /** The server-rendered poster (the Figma image, O-1). */
  children: ReactNode
  className: string
  badgeLabel: string
  openLabel: string
  /** Accessible name of the live canvas (the same tower as the poster). */
  liveLabel: string
  /** The system entered through the accordion or the URL hash, if any. */
  entered: SystemId | null
  onExitSystem: () => void
  /**
   * O-18, O-19: the exit of a wheel-out past the entered system's limit and of Escape: as the header
   * click, the system exits and its row collapses (`onExitSystem` when not given).
   */
  onCollapseExit?: () => void
  /** Keys 1–5: enter the system of that accordion row. */
  onSelectRow: (index: number) => void
  /** Increases on each system the visitor picks; each increase starts the model (O-2). */
  startSignal: number
  /** The card's phase, for the accordion (O-8: a click on the entered header goes live from a still). */
  onPhaseChange?: (phase: CardPhase) => void
  strings: Systems3dStrings
}

interface NavigatorHints {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

function readDeviceCaps(): DeviceCaps {
  const nav = navigator as Navigator & NavigatorHints
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
    effectiveType: nav.connection?.effectiveType,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    phoneLayout: window.matchMedia('(max-width: 767.98px)').matches,
  }
}

/** O-9: the viewer of this card, prepared before the click or started by it. */
interface LiveViewer {
  /** Not in the page until the visitor asks for the model. */
  canvas: HTMLCanvasElement
  /** Lets the viewer draw its first visible frame (the canvas is in the page by then). */
  show: () => void
  /** Disposes the viewer. */
  abort: () => void
  /** A failure while preparing: the click then shows the stills tier with this reason. */
  failure: FallbackReason | null
}

const subscribeNever = (): (() => void) => () => undefined

const PHONE_QUERY = '(max-width: 767.98px)'
function subscribePhone(onChange: () => void): () => void {
  const query = window.matchMedia(PHONE_QUERY)
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

/** The phone layout (< 768 px); false on the server. */
function usePhoneLayout(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  )
}

/** True after hydration: JS-only controls are not rendered into the server HTML. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
}

export function SystemsCard({
  children,
  className,
  badgeLabel,
  openLabel,
  liveLabel,
  entered,
  onExitSystem,
  onCollapseExit,
  onSelectRow,
  startSignal,
  onPhaseChange,
  strings,
}: SystemsCardProps): ReactElement {
  const hydrated = useHydrated()
  const phoneLayout = usePhoneLayout()
  const cardRef = useRef<HTMLDivElement>(null)
  /** Where the live canvas joins the card once the visitor asks for the model. */
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerHandle | null>(null)
  const [phase, setPhase] = useState<Phase>('still')
  const [fallbackReason, setFallbackReason] = useState<FallbackReason | null>(null)
  /** The live model, or `low` (the GPU probe or the run-time FPS drop; `data-viewer-tier`). */
  const [liveTier, setLiveTier] = useState<ModelTier | 'low' | null>(null)
  /** O-9: the viewer exists (preparing near the viewport, or started by a click); never reset. */
  const [viewerWanted, setViewerWanted] = useState(false)
  const liveRef = useRef<LiveViewer | null>(null)
  /** Set by the start: from then on a failure shows the stills tier instead of waiting. */
  const shownRef = useRef(false)
  const liveLabelRef = useRef(liveLabel)
  const [active, setActive] = useState(false)
  /** The same value as `active`, for the viewer callbacks that run before React re-renders. */
  const activeRef = useRef(false)
  /** A start from the card itself (image, button, Enter/Space) activates the card once it is live. */
  const activateOnLiveRef = useRef(false)
  const prefetchedRef = useRef(false)
  /** O-7: the tap hint now showing (its cycle number keys a fresh animation), or none. */
  const [tapHint, setTapHint] = useState<{
    cycle: number
    still: boolean
    leaving: boolean
  } | null>(null)
  /** Off screen the hint waits; it starts and repeats only when the card is at least half on screen. */
  const [cardInView, setCardInView] = useState(true)
  const cardHalfInViewRef = useRef(false)
  const tapHintCyclesRef = useRef(0)
  /** Set by any hover, focus, click or tap on the card, and by the start: no hint ever again. */
  const tapHintDoneRef = useRef(false)
  const tapHintTimerRef = useRef<number | undefined>(undefined)
  const [hint, setHint] = useState(false)
  /** O-11: the entered still stays over the canvas while it fades out at the swap. */
  const [stillLeaving, setStillLeaving] = useState(false)
  /** O-14b: the live view dropped to the stills tier; its canvas stays for the crossfade. */
  const [canvasLeaving, setCanvasLeaving] = useState(false)
  /** The viewer whose canvas is leaving: disposed once the crossfade is over. */
  const leavingLiveRef = useRef<LiveViewer | null>(null)
  /** The entered still that has loaded (the crossfade waits for it). */
  const [loadedStill, setLoadedStill] = useState<SystemId | null>(null)
  const phaseRef = useRef<Phase>(phase)
  const hintShownRef = useRef(false)
  const labelSinkRef = useRef<LiveLabelSink | null>(null)
  const enteredRef = useRef(entered)
  useEffect(() => {
    enteredRef.current = entered
  }, [entered])
  /** O-18: the exit a wheel-out at the limit asks for (the latest handler; the viewer outlives renders). */
  const exitSystemRef = useRef(onCollapseExit ?? onExitSystem)
  useEffect(() => {
    exitSystemRef.current = onCollapseExit ?? onExitSystem
  }, [onCollapseExit, onExitSystem])
  useEffect(() => {
    phaseRef.current = phase
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  /** Active: the card takes the wheel and one-finger drag (the first time, with the drag hint). */
  const setActiveNow = useCallback((value: boolean): void => {
    activeRef.current = value
    setActive(value)
    viewerRef.current?.setActive(value)
    if (value && !hintShownRef.current) {
      hintShownRef.current = true
      setHint(true)
    }
  }, [])

  const stopTapHint = useCallback((): void => {
    tapHintDoneRef.current = true
    window.clearTimeout(tapHintTimerRef.current)
    setTapHint(null)
  }, [])

  const playTapHint = useCallback((): void => {
    if (tapHintDoneRef.current || tapHintCyclesRef.current >= TAP_HINT_MAX_CYCLES) {
      return
    }
    tapHintCyclesRef.current += 1
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTapHint({ cycle: tapHintCyclesRef.current, still, leaving: false })
    if (still) {
      // Shown once, still, then it fades.
      tapHintDoneRef.current = true
      tapHintTimerRef.current = window.setTimeout(() => {
        setTapHint((current) => (current ? { ...current, leaving: true } : null))
        tapHintTimerRef.current = window.setTimeout(() => {
          setTapHint(null)
        }, TAP_HINT_FADE_MS)
      }, TAP_HINT_STILL_MS)
    }
  }, [])

  const onTapHintEnd = useCallback((): void => {
    setTapHint(null)
    if (tapHintDoneRef.current || tapHintCyclesRef.current >= TAP_HINT_MAX_CYCLES) {
      return
    }
    tapHintTimerRef.current = window.setTimeout(() => {
      if (cardHalfInViewRef.current) {
        playTapHint()
      }
    }, TAP_HINT_REPEAT_MS)
  }, [playTapHint])

  // O-7: the hint plays the first time the card is at least half on screen, and waits off screen.
  useEffect(() => {
    const card = cardRef.current
    if (!hydrated || !card || phase !== 'still' || tapHintDoneRef.current) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        // One target: the last entry is its latest state.
        const entry = entries[entries.length - 1]
        cardHalfInViewRef.current = entry.intersectionRatio >= 0.5
        setCardInView(entry.isIntersecting)
        if (cardHalfInViewRef.current && tapHintCyclesRef.current === 0) {
          playTapHint()
        }
      },
      { threshold: [0, 0.5] },
    )
    observer.observe(card)
    return () => {
      observer.disconnect()
    }
  }, [hydrated, phase, playTapHint])
  useEffect(
    () => () => {
      window.clearTimeout(tapHintTimerRef.current)
    },
    [],
  )

  /**
   * O-2: the model starts only from a click, a tap or a key (never hover or focus). A start from the
   * card itself also activates it once live, except on touch, where the page keeps the one-finger
   * scroll until a second tap.
   */
  const startLive = useCallback(
    (fromCard: boolean): void => {
      if (phase !== 'still') {
        return
      }
      stopTapHint()
      const caps = readDeviceCaps()
      if (decideStart(caps) === 'stills') {
        setFallbackReason('device')
        setPhase('stills')
        return
      }
      activateOnLiveRef.current = fromCard && !caps.coarsePointer
      shownRef.current = true
      setPhase('loading')
      setViewerWanted(true)
    },
    [phase, stopTapHint],
  )

  // A system picked in the accordion (or with keys 1–5) starts the model too (O-2).
  const startLiveRef = useRef(startLive)
  useEffect(() => {
    startLiveRef.current = startLive
  }, [startLive])
  useEffect(() => {
    if (startSignal > 0) {
      startLiveRef.current(false)
    }
  }, [startSignal])

  /**
   * A failure once the visitor asked for the model shows the stills tier; one while preparing waits
   * for the click (nothing visible changes before it, O-2).
   */
  const fallBack = useCallback((reason: FallbackReason): void => {
    const live = liveRef.current
    if (live && !shownRef.current) {
      live.failure = reason
      return
    }
    if (live) {
      live.failure = reason
    }
    viewerRef.current = null
    activeRef.current = false
    setActive(false)
    setFallbackReason(reason)
    setPhase('stills')
    // O-14b: the live view found too slow at rest crossfades to the stills over its last frame; the
    // canvas and the viewer leave after it (see the effect below).
    if (live && reason === 'too-slow' && phaseRef.current === 'live') {
      leavingLiveRef.current = live
      setCanvasLeaving(true)
      return
    }
    // O-14: the stills first; disposing the viewer (the scene, its GPU resources) is a long task on a
    // loaded device, so it runs in a task of its own after the card has changed.
    if (live) {
      window.setTimeout(() => {
        live.abort()
      }, 0)
    }
  }, [])

  // O-9: the model is prepared before the visitor asks for it, once the card nears the viewport, in
  // the next idle period: download, transcode, parse and shader compile in idle slices, into a
  // canvas outside the page. Only where a click would start the live view (never the stills tier,
  // never with Save-Data).
  useEffect(() => {
    const card = cardRef.current
    if (!hydrated || !card || viewerWanted || phase !== 'still') {
      return
    }
    if (decideStart(readDeviceCaps()) !== 'live') {
      return
    }
    let idleHandle: number | undefined
    let timer: number | undefined
    let observer: IntersectionObserver | null = null
    let near = false
    let scrolled = false
    const whenIdle = (run: () => void): void => {
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(run, { timeout: PREPARE_IDLE_TIMEOUT_MS })
      } else {
        timer = window.setTimeout(run, 0)
      }
    }
    const stopWatching = (): void => {
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
    const inView = (): boolean => {
      const box = card.getBoundingClientRect()
      return box.top < window.innerHeight && box.bottom > 0
    }
    const maybePrepare = (): void => {
      if (near && (scrolled || inView())) {
        stopWatching()
        whenIdle(() => {
          setViewerWanted(true)
        })
      }
    }
    function onScroll(): void {
      scrolled = true
      maybePrepare()
    }
    // Q6: from the page's load event and the idle period after it; then the card in view, or within
    // two viewports once the visitor scrolls (the model is several MB: never for a page left at its
    // top, so a page-load audit fetches no model file).
    const watch = (): void => {
      scrolled = window.scrollY !== 0
      window.addEventListener('scroll', onScroll, { passive: true })
      observer = new IntersectionObserver(
        (entries) => {
          near = entries.some((entry) => entry.isIntersecting)
          maybePrepare()
        },
        { rootMargin: PREPARE_MARGIN },
      )
      observer.observe(card)
    }
    const afterLoad = (): void => {
      whenIdle(watch)
    }
    if (document.readyState === 'complete') {
      afterLoad()
    } else {
      window.addEventListener('load', afterLoad, { once: true })
    }
    return () => {
      window.removeEventListener('load', afterLoad)
      stopWatching()
      if (idleHandle !== undefined) {
        window.cancelIdleCallback(idleHandle)
      }
      window.clearTimeout(timer)
    }
  }, [hydrated, phase, viewerWanted])

  useEffect(() => {
    liveLabelRef.current = liveLabel
    liveRef.current?.canvas.setAttribute('aria-label', liveLabel)
  }, [liveLabel])

  // One viewer, prepared or started by a click; it lives until a failure or unmount (aborting
  // disposes it).
  useEffect(() => {
    const card = cardRef.current
    if (!viewerWanted || !card) {
      return
    }
    const controller = new AbortController()
    const caps = readDeviceCaps()
    const canvas = document.createElement('canvas')
    canvas.className = styles.liveCanvas
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', liveLabelRef.current)
    let show = (): void => undefined
    const whenShown = new Promise<void>((resolve) => {
      show = resolve
    })
    const live: LiveViewer = {
      canvas,
      show,
      abort: () => {
        controller.abort()
      },
      failure: null,
    }
    liveRef.current = live
    import('./viewer/createViewer')
      .then(({ createViewer }) =>
        createViewer({
          canvas,
          container: card,
          selectTier: (gpu) => chooseModelTier(caps, gpu),
          allowBloom: true,
          pixelRatioCap: caps.coarsePointer || caps.phoneLayout ? DPR_CAP.mobile : DPR_CAP.desktop,
          maxFps: caps.coarsePointer || caps.phoneLayout ? PHONE_MAX_FPS : 0,
          reducedMotion: caps.reducedMotion,
          look: LIVE_LOOK,
          groundTint: LITE_GROUND_TINT,
          signal: controller.signal,
          whenShown,
          onFirstFrame: () => {
            // O-14: a frame that comes after the fallback (the abort runs a task later) changes nothing.
            if (live.failure) {
              return
            }
            // O-9b: in the same render as `live`, so the entered still stays mounted for its fade-out
            // (it was unmounted for one render and mounted again: a new picture to decode and
            // rasterise in the first frames, already at opacity 0, so it never faded).
            setStillLeaving(true)
            setPhase('live')
            if (activateOnLiveRef.current) {
              activateOnLiveRef.current = false
              setActiveNow(true)
            }
          },
          onFailure: fallBack,
          onLowTier: () => {
            setLiveTier('low')
          },
          // O-18: the same exit as Escape and the header (flight out, accordion closed, hash cleared).
          onWheelExit: () => {
            if (enteredRef.current) {
              exitSystemRef.current()
            }
          },
          onLabels: (labels) => {
            labelSinkRef.current?.(labels)
          },
          enteredSystem: () => enteredRef.current,
        }),
      )
      .then((handle) => {
        // O-14: a start that ends after the fallback is being disposed; the card keeps the stills.
        if (live.failure && shownRef.current) {
          return
        }
        viewerRef.current = handle
        const { tier, lowTier } = handle.stats()
        setLiveTier(lowTier ? 'low' : tier)
        if (enteredRef.current) {
          handle.setSystem(enteredRef.current)
        }
        if (activeRef.current) {
          handle.setActive(true)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          fallBack(err instanceof ViewerStartError ? err.reason : 'load-error')
        }
      })
    return () => {
      controller.abort()
      canvas.remove()
      if (liveRef.current === live) {
        liveRef.current = null
      }
      viewerRef.current = null
    }
  }, [viewerWanted, setActiveNow, fallBack])

  // The visitor asked for the model: the canvas joins the card and the viewer draws its first
  // visible frame (at once when prepared). A failure while preparing shows the stills tier now.
  useEffect(() => {
    const live = liveRef.current
    const host = canvasHostRef.current
    if (phase !== 'loading' || !live || !host) {
      return
    }
    if (live.failure) {
      fallBack(live.failure)
      return
    }
    host.appendChild(live.canvas)
    live.show()
    const timeout = window.setTimeout(() => {
      fallBack('timeout')
    }, START_TIMEOUT_MS)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [phase, fallBack])

  // O-11: at the swap the entered still fades out over the canvas (CSS), then leaves.
  useEffect(() => {
    if (phase !== 'live' || !stillLeaving) {
      return
    }
    const timer = window.setTimeout(() => {
      setStillLeaving(false)
    }, STILL_FADE_OUT_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [phase, stillLeaving])

  // O-14b: inside a system its end still fades in over the canvas (once loaded); outside one the
  // canvas fades out over the image (CSS). Then the canvas leaves, and the viewer is disposed in a
  // task of its own (a long task on a slow device, as in `fallBack`).
  useEffect(() => {
    if (!canvasLeaving) {
      return
    }
    const stillReady = entered === null || loadedStill === entered
    const timer = window.setTimeout(
      () => {
        setCanvasLeaving(false)
        const live = leavingLiveRef.current
        leavingLiveRef.current = null
        if (live) {
          window.setTimeout(() => {
            live.abort()
          }, 0)
        }
      },
      stillReady ? CANVAS_FADE_OUT_MS : CANVAS_LEAVE_MAX_MS,
    )
    return () => {
      window.clearTimeout(timer)
    }
  }, [canvasLeaving, entered, loadedStill])

  // The live view follows the entered system (camera flight); the stills overlay covers the rest.
  useEffect(() => {
    if (phase === 'live') {
      viewerRef.current?.setSystem(entered)
    }
  }, [phase, entered])

  const activate = useCallback((): void => {
    if (phase === 'live' && !active) {
      setActiveNow(true)
    }
  }, [phase, active, setActiveNow])

  useEffect(() => {
    if (!hint) {
      return
    }
    const timer = window.setTimeout(() => {
      setHint(false)
    }, HINT_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [hint])

  const deactivate = useCallback((): void => {
    setActiveNow(false)
  }, [setActiveNow])

  // While active: a press outside the card or Escape hands the wheel and one-finger drag back.
  useEffect(() => {
    if (!active) {
      return
    }
    const onPointerDown = (event: globalThis.PointerEvent): void => {
      if (event.target instanceof Node && !cardRef.current?.contains(event.target)) {
        deactivate()
      }
    }
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      // An Escape the card already used (to exit a system) must not also deactivate it.
      if (event.key === 'Escape' && !event.defaultPrevented && !enteredRef.current) {
        deactivate()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, deactivate])

  // Hover never changes what is shown (O-2), except that the tap hint stops (O-7); a mouse over the
  // card only fetches the viewer code.
  const onPointerEnter = (event: PointerEvent<HTMLDivElement>): void => {
    stopTapHint()
    if (event.pointerType !== 'mouse' || prefetchedRef.current || phase !== 'still') {
      return
    }
    prefetchedRef.current = true
    if (decideStart(readDeviceCaps()) === 'live') {
      import('./viewer/createViewer').catch(() => undefined)
    }
  }
  const onFocus = (event: FocusEvent<HTMLDivElement>): void => {
    stopTapHint()
    if (event.target === event.currentTarget) {
      activate()
    }
  }
  // A click or tap on the image starts the model; once live, it activates the card. Buttons and
  // links inside the card (exit, reset, label dots) do neither.
  const onClick = (event: MouseEvent<HTMLDivElement>): void => {
    stopTapHint()
    if (
      event.target instanceof Element &&
      event.target !== event.currentTarget &&
      event.target.closest('button, a') !== null
    ) {
      return
    }
    if (phase === 'still') {
      startLive(true)
    } else {
      activate()
    }
  }
  const onOpen = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation()
    startLive(true)
  }

  // Keyboard (card focused): Enter or Space starts the model; arrows rotate, +/- zoom, 0 resets,
  // 1-5 enter systems, Escape exits the system first and then deactivates. Keys are handled only on
  // the card itself, never on its buttons or links, so page keyboard navigation is untouched.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) {
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && phase === 'still') {
      event.preventDefault()
      startLive(true)
      return
    }
    const viewer = phase === 'live' ? viewerRef.current : null
    const actions: Record<string, (() => void) | undefined> = {
      ArrowLeft: viewer
        ? () => {
            viewer.rotateBy(KEY_ROTATE, 0)
          }
        : undefined,
      ArrowRight: viewer
        ? () => {
            viewer.rotateBy(-KEY_ROTATE, 0)
          }
        : undefined,
      ArrowUp: viewer
        ? () => {
            viewer.rotateBy(0, -KEY_ROTATE)
          }
        : undefined,
      ArrowDown: viewer
        ? () => {
            viewer.rotateBy(0, KEY_ROTATE)
          }
        : undefined,
      '+': viewer
        ? () => {
            viewer.zoomBy(KEY_ZOOM_IN)
          }
        : undefined,
      '=': viewer
        ? () => {
            viewer.zoomBy(KEY_ZOOM_IN)
          }
        : undefined,
      '-': viewer
        ? () => {
            viewer.zoomBy(KEY_ZOOM_OUT)
          }
        : undefined,
      '0': viewer
        ? () => {
            viewer.resetView()
          }
        : undefined,
      // O-19: Escape exits as the header click does (the row collapses too).
      Escape: entered ? (onCollapseExit ?? onExitSystem) : undefined,
    }
    const digit = /^[1-5]$/.test(event.key) ? Number(event.key) - 1 : -1
    const action =
      digit >= 0
        ? () => {
            onSelectRow(digit)
          }
        : actions[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  }

  const showCanvas = phase === 'loading' || phase === 'live' || canvasLeaving
  /** O-3: the badge and "Open the live 3D model" only until the model is live (as in Figma). */
  const showStartControls = hydrated && (phase === 'still' || phase === 'loading')

  return (
    <div
      aria-busy={phase === 'loading' ? true : undefined}
      className={className}
      data-entered={entered ?? 'none'}
      data-interactive-3d-card="true"
      data-canvas-leaving={canvasLeaving ? 'true' : undefined}
      data-viewer-active={active ? 'true' : 'false'}
      data-viewer-fallback={phase === 'stills' ? (fallbackReason ?? undefined) : undefined}
      data-viewer-state={phase}
      data-viewer-tier={phase === 'live' ? (liveTier ?? undefined) : undefined}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPointerDown={stopTapHint}
      onPointerEnter={onPointerEnter}
      ref={cardRef}
      tabIndex={hydrated && phase !== 'stills' ? 0 : undefined}
    >
      <div aria-hidden={phase === 'live' ? true : undefined} className={styles.poster}>
        {children}
      </div>
      {showCanvas ? (
        // The prepared canvas joins here (O-9); React never renders children into this element.
        <div className={styles.canvasHost} data-canvas-host="true" ref={canvasHostRef} />
      ) : null}
      {phase === 'live' && entered ? (
        <LiveLabels cardRef={cardRef} sinkRef={labelSinkRef} strings={strings} />
      ) : null}
      {entered && (phase !== 'live' || stillLeaving) ? (
        <EnteredStill
          cardRef={cardRef}
          key={entered}
          onLoaded={setLoadedStill}
          strings={strings}
          system={entered}
        />
      ) : null}
      {hydrated && phase === 'still' && tapHint ? (
        <TapHint
          key={tapHint.cycle}
          leaving={tapHint.leaving}
          onEnd={onTapHintEnd}
          paused={!cardInView}
          still={tapHint.still}
        />
      ) : null}
      {phase === 'loading' ? (
        <p
          className={`${styles.loadingIndicator} t-caption`}
          data-loading-indicator="true"
          role="status"
        >
          <span aria-hidden="true" className={styles.loadingSpinner} />
          {strings.loading}
        </p>
      ) : null}
      {showStartControls && !entered ? (
        <span className={`${styles.liveModelBadge} t-label-caps`}>
          <CubeIcon aria-hidden="true" className={styles.liveModelBadgeIcon} />
          {badgeLabel}
        </span>
      ) : null}
      {entered || showStartControls || phase === 'live' ? (
        <div className={styles.cardControls} data-label-obstacle="true">
          {entered ? (
            <button
              className={`${styles.openModelButton} t-label-button`}
              data-exit-system="true"
              onClick={(event) => {
                event.stopPropagation()
                onExitSystem()
              }}
              type="button"
            >
              {strings.exitSystem}
            </button>
          ) : null}
          {showStartControls && !entered ? (
            <button
              className={`${styles.openModelButton} t-label-button`}
              data-open-3d-model="true"
              onClick={onOpen}
              type="button"
            >
              {phoneLayout ? strings.exploreIn3d : openLabel}
              <ArrowUpRightIcon aria-hidden="true" />
            </button>
          ) : null}
          {phase === 'live' ? (
            <button
              aria-label={strings.resetView}
              className={`${styles.viewControl} ${styles.viewControlReset}`}
              data-reset-view="true"
              onClick={(event) => {
                event.stopPropagation()
                viewerRef.current?.resetView()
              }}
              type="button"
            />
          ) : null}
        </div>
      ) : null}
      {hint ? (
        <p aria-live="polite" className={`${styles.dragHint} t-caption`} role="status">
          {strings.dragHint}
        </p>
      ) : null}
    </div>
  )
}
