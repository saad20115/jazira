'use client'

import {
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import Link from 'next/link'

import { ArrowUpRightIcon, CubeIcon } from '@/components/icons'

import type { SystemId } from './contract'
import styles from './InteractiveSystemsSection.module.css'
import type { SystemRelatedProjects } from './relatedProjects'
import { DPR_CAP, LIVE_LOOK, type LiveLook, RELEASE_BASE_PATH } from './renderContract'
import { StillLabels } from './StillLabels'
import type { Systems3dStrings } from './strings'
import { chooseModelTier, decideStart, type DeviceCaps, parseGfxOverride } from './tier'
import type { ViewerHandle } from './viewer/createViewer'

/** still → loading → live; any failure (or a weak device) → stills. The still is never removed. */
type Phase = 'still' | 'loading' | 'live' | 'stills'

/** A start that has not rendered its first frame by then falls back to the stills tier. */
const START_TIMEOUT_MS = 45_000

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

/** `?fixes=-aniso,-a2c` switches V-2 / V-3 off in development builds only (before/after crops). */
function readFixesOverride(): { anisotropy: boolean; alphaToCoverage: boolean } {
  const off =
    process.env.NODE_ENV === 'production'
      ? []
      : (new URLSearchParams(window.location.search).get('fixes')?.split(',') ?? [])
  return { anisotropy: !off.includes('-aniso'), alphaToCoverage: !off.includes('-a2c') }
}

const subscribeNever = (): (() => void) => () => undefined

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
  related,
  relatedHeading,
  strings,
}: SystemsCardProps): ReactElement {
  const hydrated = useHydrated()
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<ViewerHandle | null>(null)
  const [phase, setPhase] = useState<Phase>('still')
  const [session, setSession] = useState(0)
  const [active, setActive] = useState(false)

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
          reducedMotion: caps.reducedMotion,
          look: readLookOverride(),
          fixes: readFixesOverride(),
          signal: controller.signal,
          onFirstFrame: () => {
            firstFrame = true
            window.clearTimeout(timeout)
            setPhase('live')
          },
          onFailure: fallBack,
        }),
      )
      .then((handle) => {
        viewerRef.current = handle
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

  const activate = useCallback((): void => {
    if (phase === 'live' && !active) {
      setActive(true)
      viewerRef.current?.setActive(true)
    }
  }, [phase, active])

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
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
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
      {entered ? (
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
      {entered ? (
        <button
          className={`${styles.openModelButton} t-label-button`}
          data-exit-system="true"
          data-label-obstacle="true"
          onClick={(event) => {
            event.stopPropagation()
            onExitSystem()
          }}
          type="button"
        >
          {strings.exitSystem}
        </button>
      ) : showLiveControls ? (
        <button
          className={`${styles.openModelButton} t-label-button`}
          data-open-3d-model="true"
          onClick={onOpen}
          type="button"
        >
          {openLabel}
          <ArrowUpRightIcon aria-hidden="true" />
        </button>
      ) : null}
      {entered && related && related.projects.length > 0 ? (
        <aside
          aria-label={relatedHeading}
          className={styles.relatedPanel}
          data-label-obstacle="true"
        >
          <p className={`${styles.relatedProjectsLabel} t-label-caps`}>{relatedHeading}</p>
          <ul className={styles.relatedList}>
            {related.projects.map((project) => (
              <li key={project.id}>
                <Link
                  className={`${styles.relatedProjectLink} t-body-s-medium`}
                  href={project.href}
                >
                  {project.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link className={`${styles.relatedAllLink} t-label-link`} href={related.allHref}>
            {strings.allProjects}
            <ArrowUpRightIcon aria-hidden="true" />
          </Link>
        </aside>
      ) : null}
    </div>
  )
}
