'use client'

import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { ArrowUpRightIcon, CubeIcon } from '@/components/icons'

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
import type { Systems3dStrings } from './strings'
import { chooseModelTier, decideStart, type DeviceCaps } from './tier'
import type { ViewerHandle } from './viewer/createViewer'
import { type FallbackReason, ViewerStartError } from './viewer/failure'

/** still → loading → live; any failure (or a weak device) → stills. The still is never removed. */
type Phase = 'still' | 'loading' | 'live' | 'stills'

/** A start that has not rendered its first frame by then falls back to the stills tier. */
const START_TIMEOUT_MS = 45_000

/** Phones render at most this many frames per second (§8c). */
const PHONE_MAX_FPS = 30

/** Keyboard steps (card focused): arrows orbit, +/- zoom (the wheel and pinch zoom too). */
const KEY_ROTATE = 0.15
const KEY_ZOOM_IN = 0.85
const KEY_ZOOM_OUT = 1 / KEY_ZOOM_IN
/** How long the "Drag to rotate" hint stays after the first activation. */
const HINT_MS = 3200

const STILLS_PATH = `${RELEASE_BASE_PATH}/stills`
const STILL_SIZES = '(max-width: 1279px) 100vw, 600px'

function endStillSrcSet(system: SystemId, format: 'webp' | 'jpg'): string {
  return [1440, 2048]
    .map((w) => `${STILLS_PATH}/${system}_end_${String(w)}.${format} ${String(w)}w`)
    .join(', ')
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
  /** Keys 1–5: enter the system of that accordion row. */
  onSelectRow: (index: number) => void
  /** The related-projects panel of the entered system (suspends on its own until the data arrives). */
  relatedPanel: ReactNode
  /** Increases on each system the visitor picks; each increase starts the model (O-2). */
  startSignal: number
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
  onSelectRow,
  relatedPanel,
  startSignal,
  strings,
}: SystemsCardProps): ReactElement {
  const hydrated = useHydrated()
  const phoneLayout = usePhoneLayout()
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<ViewerHandle | null>(null)
  const [phase, setPhase] = useState<Phase>('still')
  const [fallbackReason, setFallbackReason] = useState<FallbackReason | null>(null)
  /** The live model, or `low` after the run-time FPS drop (`data-viewer-tier`, for the e2e). */
  const [liveTier, setLiveTier] = useState<ModelTier | 'low' | null>(null)
  const [session, setSession] = useState(0)
  const [active, setActive] = useState(false)
  /** The same value as `active`, for the viewer callbacks that run before React re-renders. */
  const activeRef = useRef(false)
  /** A start from the card itself (image, button, Enter/Space) activates the card once it is live. */
  const activateOnLiveRef = useRef(false)
  const prefetchedRef = useRef(false)
  const [hint, setHint] = useState(false)
  const hintShownRef = useRef(false)
  const labelSinkRef = useRef<LiveLabelSink | null>(null)
  const enteredRef = useRef(entered)
  useEffect(() => {
    enteredRef.current = entered
  }, [entered])

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
      const caps = readDeviceCaps()
      if (decideStart(caps) === 'stills') {
        setFallbackReason('device')
        setPhase('stills')
        return
      }
      activateOnLiveRef.current = fromCard && !caps.coarsePointer
      setPhase('loading')
      setSession((n) => n + 1)
    },
    [phase],
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

  // One viewer per session; it lives until a failure or unmount (aborting disposes it).
  useEffect(() => {
    const canvas = canvasRef.current
    const card = cardRef.current
    if (session === 0 || !canvas || !card) {
      return
    }
    const controller = new AbortController()
    const caps = readDeviceCaps()
    let firstFrame = false
    const fallBack = (reason: FallbackReason): void => {
      window.clearTimeout(timeout)
      controller.abort()
      viewerRef.current = null
      activeRef.current = false
      setActive(false)
      setFallbackReason(reason)
      setPhase('stills')
    }
    const timeout = window.setTimeout(() => {
      if (!firstFrame) {
        fallBack('timeout')
      }
    }, START_TIMEOUT_MS)
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
          onFirstFrame: () => {
            firstFrame = true
            window.clearTimeout(timeout)
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
          onLabels: (labels) => {
            labelSinkRef.current?.(labels)
          },
        }),
      )
      .then((handle) => {
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
      window.clearTimeout(timeout)
      controller.abort()
      viewerRef.current = null
    }
  }, [session, setActiveNow])

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

  // Hover never changes what is shown (O-2); a mouse over the card only fetches the viewer code.
  const onPointerEnter = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType !== 'mouse' || prefetchedRef.current || phase !== 'still') {
      return
    }
    prefetchedRef.current = true
    if (decideStart(readDeviceCaps()) === 'live') {
      import('./viewer/createViewer').catch(() => undefined)
    }
  }
  const onFocus = (event: FocusEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      activate()
    }
  }
  // A click or tap on the image starts the model; once live, it activates the card. Buttons and
  // links inside the card (exit, reset, label dots, related projects) do neither.
  const onClick = (event: MouseEvent<HTMLDivElement>): void => {
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
      Escape: entered ? onExitSystem : undefined,
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

  const showCanvas = phase === 'loading' || phase === 'live'
  /** O-3: the badge and "Open the live 3D model" only until the model is live (as in Figma). */
  const showStartControls = hydrated && (phase === 'still' || phase === 'loading')

  return (
    <div
      aria-busy={phase === 'loading' ? true : undefined}
      className={className}
      data-entered={entered ?? 'none'}
      data-interactive-3d-card="true"
      data-viewer-active={active ? 'true' : 'false'}
      data-viewer-fallback={phase === 'stills' ? (fallbackReason ?? undefined) : undefined}
      data-viewer-state={phase}
      data-viewer-tier={phase === 'live' ? (liveTier ?? undefined) : undefined}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnter}
      ref={cardRef}
      tabIndex={hydrated && phase !== 'stills' ? 0 : undefined}
    >
      <div aria-hidden={phase === 'live' ? true : undefined} className={styles.poster}>
        {children}
      </div>
      {showCanvas ? (
        <canvas aria-label={liveLabel} className={styles.liveCanvas} ref={canvasRef} role="img" />
      ) : null}
      {phase === 'live' && entered ? (
        <LiveLabels cardRef={cardRef} sinkRef={labelSinkRef} strings={strings} />
      ) : null}
      {entered && phase !== 'live' ? (
        <div className={styles.enteredLayer} data-entered-system={entered} key={entered}>
          <picture className={styles.stillPicture}>
            <source
              sizes={STILL_SIZES}
              srcSet={endStillSrcSet(entered, 'webp')}
              type="image/webp"
            />
            <img
              alt=""
              className={styles.buildingRender}
              decoding="async"
              height={2048}
              sizes={STILL_SIZES}
              src={`${STILLS_PATH}/${entered}_end_1440.jpg`}
              srcSet={endStillSrcSet(entered, 'jpg')}
              width={2048}
            />
          </picture>
          <StillLabels cardRef={cardRef} strings={strings} system={entered} />
        </div>
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
      {entered ? relatedPanel : null}
    </div>
  )
}
