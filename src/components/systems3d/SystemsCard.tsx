'use client'

import {
  type FocusEvent,
  type KeyboardEvent,
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
import { RelatedPanel } from './RelatedPanel'
import type { SystemRelatedProjects } from './relatedProjects'
import {
  DPR_CAP,
  LITE_GROUND_TINT,
  type LiteGroundTint,
  LIVE_LOOK,
  type LiveLook,
  RELEASE_BASE_PATH,
} from './renderContract'
import { StillLabels } from './StillLabels'
import type { Systems3dStrings } from './strings'
import { chooseModelTier, decideStart, type DeviceCaps, parseGfxOverride } from './tier'
import type { ViewerHandle } from './viewer/createViewer'

/** still → loading → live; any failure (or a weak device) → stills. The still is never removed. */
type Phase = 'still' | 'loading' | 'live' | 'stills'

/** A start that has not rendered its first frame by then falls back to the stills tier. */
const START_TIMEOUT_MS = 45_000

/** Phones render at most this many frames per second (§8c). */
const PHONE_MAX_FPS = 30

/** Keyboard steps (card focused): arrows orbit, +/- zoom. */
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
  /** The server-rendered poster (the CAM_hero still). */
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
  related: SystemRelatedProjects | null
  relatedHeading: string
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

/** `?gfx=stills|low|high` forces a tier in development builds only (§8b evidence). */
function readGfxOverride(): ReturnType<typeof parseGfxOverride> {
  return process.env.NODE_ENV === 'production' ? null : parseGfxOverride(window.location.search)
}

/** `?look=exposure,env,emissive,roomEnv,floorEdge` overrides the V-1 calibration in development builds only. */
function readLookOverride(): LiveLook {
  if (process.env.NODE_ENV === 'production') {
    return LIVE_LOOK
  }
  const raw = new URLSearchParams(window.location.search).get('look')
  const values = raw?.split(',').map(Number) ?? []
  if (values.length !== 5 || values.some((v) => !Number.isFinite(v) || v < 0 || v > 8)) {
    return LIVE_LOOK
  }
  const [
    exposureScale = 1,
    envIntensity = 1,
    emissiveScale = 1,
    roomEnvIntensity = 1,
    floorEdgeLevel = 1,
  ] = values
  return { exposureScale, envIntensity, emissiveScale, roomEnvIntensity, floorEdgeLevel }
}

/** `?ground=pr,pg,pb,vr,vg,vb` overrides the C3-2 lite ground tint in development builds only. */
function readGroundOverride(): LiteGroundTint {
  if (process.env.NODE_ENV === 'production') {
    return LITE_GROUND_TINT
  }
  const values =
    new URLSearchParams(window.location.search).get('ground')?.split(',').map(Number) ?? []
  if (values.length !== 6 || values.some((v) => !Number.isFinite(v) || v < 0 || v > 4)) {
    return LITE_GROUND_TINT
  }
  const [pr = 1, pg = 1, pb = 1, vr = 1, vg = 1, vb = 1] = values
  return { paving: [pr, pg, pb], vegetation: [vr, vg, vb] }
}

/** `?fixes=-aniso,-a2c` switches V-2 / V-3 off in development builds only (before/after crops). */
function readFixesOverride(): { anisotropy: boolean; alphaToCoverage: boolean } {
  const off =
    process.env.NODE_ENV === 'production'
      ? []
      : (new URLSearchParams(window.location.search).get('fixes')?.split(',') ?? [])
  return { anisotropy: !off.includes('-aniso'), alphaToCoverage: !off.includes('-a2c') }
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
  related,
  relatedHeading,
  strings,
}: SystemsCardProps): ReactElement {
  const hydrated = useHydrated()
  const phoneLayout = usePhoneLayout()
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<ViewerHandle | null>(null)
  const [phase, setPhase] = useState<Phase>('still')
  const [session, setSession] = useState(0)
  const [active, setActive] = useState(false)
  const [hint, setHint] = useState(false)
  const hintShownRef = useRef(false)
  const labelSinkRef = useRef<LiveLabelSink | null>(null)
  const enteredRef = useRef(entered)
  useEffect(() => {
    enteredRef.current = entered
  }, [entered])

  const startLive = useCallback((): void => {
    if (phase !== 'still') {
      return
    }
    const override = readGfxOverride()
    if (
      override === 'stills' ||
      (override === null && decideStart(readDeviceCaps()) === 'stills')
    ) {
      setPhase('stills')
      return
    }
    setPhase('loading')
    setSession((n) => n + 1)
  }, [phase])

  // One viewer per session; it lives until a failure or unmount (aborting disposes it).
  useEffect(() => {
    const canvas = canvasRef.current
    const card = cardRef.current
    if (session === 0 || !canvas || !card) {
      return
    }
    const controller = new AbortController()
    const caps = readDeviceCaps()
    const override = readGfxOverride()
    let firstFrame = false
    const fallBack = (): void => {
      window.clearTimeout(timeout)
      controller.abort()
      viewerRef.current = null
      setActive(false)
      setPhase('stills')
    }
    const timeout = window.setTimeout(() => {
      if (!firstFrame) {
        fallBack()
      }
    }, START_TIMEOUT_MS)
    import('./viewer/createViewer')
      .then(({ createViewer }) =>
        createViewer({
          canvas,
          container: card,
          selectTier: (gpu) =>
            override === 'high' ? 'full' : override === 'low' ? 'lite' : chooseModelTier(caps, gpu),
          allowBloom: true,
          pixelRatioCap: caps.coarsePointer || caps.phoneLayout ? DPR_CAP.mobile : DPR_CAP.desktop,
          maxFps: caps.coarsePointer || caps.phoneLayout ? PHONE_MAX_FPS : 0,
          reducedMotion: caps.reducedMotion,
          look: readLookOverride(),
          groundTint: readGroundOverride(),
          fixes: readFixesOverride(),
          signal: controller.signal,
          onFirstFrame: () => {
            firstFrame = true
            window.clearTimeout(timeout)
            setPhase('live')
          },
          onFailure: fallBack,
          onLabels: (labels) => {
            labelSinkRef.current?.(labels)
          },
        }),
      )
      .then((handle) => {
        viewerRef.current = handle
        if (enteredRef.current) {
          handle.setSystem(enteredRef.current)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          fallBack()
        }
      })
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
      viewerRef.current = null
    }
  }, [session])

  // The live view follows the entered system (camera flight); the stills overlay covers the rest.
  useEffect(() => {
    if (phase === 'live') {
      viewerRef.current?.setSystem(entered)
    }
  }, [phase, entered])

  const activate = useCallback((): void => {
    if (phase === 'live' && !active) {
      setActive(true)
      viewerRef.current?.setActive(true)
      if (!hintShownRef.current) {
        hintShownRef.current = true
        setHint(true)
      }
    }
  }, [phase, active])

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
    setActive(false)
    viewerRef.current?.setActive(false)
  }, [])

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
      if (event.key === 'Escape' && !enteredRef.current) {
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

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'mouse') {
      startLive()
    }
  }
  const onFocus = (event: FocusEvent<HTMLDivElement>): void => {
    startLive()
    if (event.target === event.currentTarget) {
      activate()
    }
  }
  const onOpen = (): void => {
    startLive()
    activate()
  }

  // Keyboard (card focused): arrows rotate, +/- zoom, 0 resets, 1-5 enter systems, Escape exits the
  // system first and then deactivates. Keys are handled only on the card itself, never on its
  // buttons or links, so page keyboard navigation is untouched.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) {
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
  const showLiveControls = hydrated && phase !== 'stills'

  return (
    <div
      aria-busy={phase === 'loading' ? true : undefined}
      className={className}
      data-interactive-3d-card="true"
      data-viewer-active={active ? 'true' : 'false'}
      data-viewer-state={phase}
      onClick={activate}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnter}
      ref={cardRef}
      tabIndex={phase === 'live' ? 0 : undefined}
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
      {showLiveControls && !entered ? (
        <span className={`${styles.liveModelBadge} t-label-caps`}>
          <CubeIcon aria-hidden="true" className={styles.liveModelBadgeIcon} />
          {badgeLabel}
        </span>
      ) : null}
      {entered || showLiveControls ? (
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
          ) : (
            <button
              className={`${styles.openModelButton} t-label-button`}
              data-open-3d-model="true"
              onClick={onOpen}
              type="button"
            >
              {phoneLayout ? strings.exploreIn3d : openLabel}
              <ArrowUpRightIcon aria-hidden="true" />
            </button>
          )}
          {phase === 'live' ? (
            <>
              <button
                aria-label={strings.zoomIn}
                className={`${styles.viewControl} ${styles.viewControlZoomIn}`}
                onClick={(event) => {
                  event.stopPropagation()
                  viewerRef.current?.zoomBy(KEY_ZOOM_IN)
                }}
                type="button"
              />
              <button
                aria-label={strings.zoomOut}
                className={`${styles.viewControl} ${styles.viewControlZoomOut}`}
                onClick={(event) => {
                  event.stopPropagation()
                  viewerRef.current?.zoomBy(KEY_ZOOM_OUT)
                }}
                type="button"
              />
              <button
                aria-label={strings.resetView}
                className={`${styles.viewControl} ${styles.viewControlReset}`}
                onClick={(event) => {
                  event.stopPropagation()
                  viewerRef.current?.resetView()
                }}
                type="button"
              />
              {active ? (
                <button
                  className={`${styles.doneButton} t-label-button`}
                  data-done="true"
                  onClick={(event) => {
                    event.stopPropagation()
                    deactivate()
                  }}
                  type="button"
                >
                  {strings.done}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {hint ? (
        <p aria-live="polite" className={`${styles.dragHint} t-caption`} role="status">
          {strings.dragHint}
        </p>
      ) : null}
      {entered && related && related.projects.length > 0 ? (
        <RelatedPanel
          heading={relatedHeading}
          placement="card"
          related={related}
          strings={strings}
        />
      ) : null}
    </div>
  )
}
