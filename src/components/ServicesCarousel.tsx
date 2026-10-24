'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from 'react'

import { Button } from '@/components/Button'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'
import { ServiceTile } from '@/components/ServiceTile'
import {
  DEFAULT_LOCALE,
  formatStepCounter,
  getDictionary,
  type SupportedLocale,
} from '@/i18n'
import type { Service } from '@/payload-types'

import styles from './ServicesCarousel.module.css'

export type ServicesCarouselPosition = 1 | 2 | 3 | 4 | 5
export type CarouselServiceItem = Pick<
  Service,
  'id' | 'title' | 'slug' | 'icon' | 'shortDescription' | 'featured'
>

export interface ServicesCarouselProps {
  autoAdvanceMs?: number
  className?: string
  learnMoreLabel?: string
  locale?: SupportedLocale
  position?: ServicesCarouselPosition
  services: readonly CarouselServiceItem[]
  viewAllHref?: string
  viewAllLabel?: string
}

const CARD_STEP_PX = 310 // 290px card + 20px gap
const CARD_GAP_PX = 20
const DEFAULT_DESKTOP_VISIBLE_CARDS = 4
const SWIPE_THRESHOLD_PX = 40

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  mql.addEventListener('change', onStoreChange)
  return () => {
    mql.removeEventListener('change', onStoreChange)
  }
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  return false
}

function getReducedMotionServerSnapshot(): boolean {
  return false
}

/**
 * Figma component `ServicesCarousel` (`175:3714`, `design/context/components/services-carousel.md`).
 * Zero-dependency interactive services carousel (`1300px` viewport with 5th card peeking) with auto-advance (`3500ms`),
 * visible WCAG 2.2.2 pause/play control, `aria-live` polite/off region, pause on hover/focus/offscreen,
 * pointer/touch drag & swipe, RTL-aware keyboard arrows (`ArrowLeft`/`ArrowRight`), and `prefers-reduced-motion: reduce` support.
 */
export function ServicesCarousel({
  services,
  locale = DEFAULT_LOCALE,
  position,
  autoAdvanceMs = 3500,
  viewAllHref,
  viewAllLabel,
  learnMoreLabel,
  className,
}: ServicesCarouselProps): ReactElement | null {
  const dict = getDictionary(locale)
  const isRtl = locale === 'ar'
  const totalSlides = services.length

  const [visibleCount, setVisibleCount] = useState<number>(() =>
    totalSlides >= 8 ? DEFAULT_DESKTOP_VISIBLE_CARDS : 1,
  )

  const maxIndex =
    position !== undefined
      ? Math.max(0, Math.min(totalSlides - 1, Math.max(4, totalSlides - visibleCount)))
      : Math.max(0, totalSlides - visibleCount)

  const initialIndex = position ? Math.min(maxIndex, Math.max(0, position - 1)) : 0
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isSlideFocused, setIsSlideFocused] = useState<boolean>(false)
  const [isUserPaused, setIsUserPaused] = useState<boolean>(false)
  const [isOffscreen, setIsOffscreen] = useState<boolean>(false)
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
  const [dragOffsetPx, setDragOffsetPx] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const sectionRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragStartXRef = useRef<number | null>(null)

  const clampedActiveIndex = Math.min(activeIndex, maxIndex)

  useEffect(() => {
    const viewportNode = viewportRef.current
    if (!viewportNode) {
      return
    }

    const measureViewport = (): void => {
      const width = viewportNode.clientWidth
      if (width <= 0) {
        return
      }
      const fits = Math.max(1, Math.floor((width + CARD_GAP_PX) / CARD_STEP_PX))
      setVisibleCount(Math.min(totalSlides, fits))
    }

    measureViewport()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      measureViewport()
    })
    resizeObserver.observe(viewportNode)
    return () => {
      resizeObserver.disconnect()
    }
  }, [totalSlides])

  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsOffscreen(!entry.isIntersecting)
        }
      },
      { threshold: 0.05 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [])

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => {
      const current = Math.min(prev, maxIndex)
      return current >= maxIndex ? 0 : current + 1
    })
  }, [maxIndex])

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => {
      const current = Math.min(prev, maxIndex)
      return current <= 0 ? maxIndex : current - 1
    })
  }, [maxIndex])

  const isAutoPlaying =
    position === undefined &&
    autoAdvanceMs > 0 &&
    maxIndex > 0 &&
    !prefersReducedMotion &&
    !isUserPaused &&
    !isHovered &&
    !isSlideFocused &&
    !isOffscreen &&
    !isDragging

  useEffect(() => {
    if (!isAutoPlaying) {
      return
    }

    const timer = window.setInterval(() => {
      goToNext()
    }, autoAdvanceMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [isAutoPlaying, autoAdvanceMs, goToNext])

  if (totalSlides === 0) {
    return null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (isRtl) {
        goToPrev()
      } else {
        goToNext()
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (isRtl) {
        goToNext()
      } else {
        goToPrev()
      }
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(maxIndex)
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return
    }
    const target = event.target as HTMLElement | null
    if (target?.closest('a, button')) {
      return
    }
    dragStartXRef.current = event.clientX
    setIsDragging(true)
    setDragOffsetPx(0)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!isDragging || dragStartXRef.current === null) {
      return
    }
    const deltaX = event.clientX - dragStartXRef.current
    setDragOffsetPx(deltaX)
  }

  const finishDrag = (): void => {
    if (!isDragging) {
      return
    }
    const delta = dragOffsetPx
    dragStartXRef.current = null
    setIsDragging(false)
    setDragOffsetPx(0)

    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (isRtl) {
        if (delta > 0) {
          goToNext()
        } else {
          goToPrev()
        }
      } else {
        if (delta < 0) {
          goToNext()
        } else {
          goToPrev()
        }
      }
    }
  }

  const handleSlideFocus = (slideIdx: number): void => {
    setIsSlideFocused(true)
    setActiveIndex(Math.min(maxIndex, Math.max(0, slideIdx)))
    if (viewportRef.current && viewportRef.current.scrollLeft !== 0) {
      viewportRef.current.scrollLeft = 0
    }
  }

  const resolvedViewAllHref = viewAllHref ?? `/${locale}/services`
  const resolvedViewAllLabel = viewAllLabel ?? dict.cards.viewAllServicesButton
  const activeService = services[clampedActiveIndex] ?? services[0]
  const liveAnnouncement = `${formatStepCounter(
    dict.carousel.slideOfTotal,
    clampedActiveIndex + 1,
    totalSlides,
  )} — ${activeService.title}`
  const pauseToggleLabel = isUserPaused ? dict.carousel.playAutoPlay : dict.carousel.pauseAutoPlay

  const rootClasses = [styles.carousel, className ?? ''].filter(Boolean).join(' ')
  const viewportClasses = [styles.viewport, isDragging ? styles.viewportDragging : '']
    .filter(Boolean)
    .join(' ')
  const trackClasses = [styles.track, isDragging ? styles.trackDragging : '']
    .filter(Boolean)
    .join(' ')

  return (
    <section
      ref={sectionRef}
      aria-roledescription={dict.carousel.carouselRoleDescription}
      aria-label={dict.carousel.regionLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
      className={rootClasses}
      data-component="services-carousel"
      data-active-index={clampedActiveIndex}
      data-max-index={maxIndex}
      data-visible-count={visibleCount}
      data-position={position ?? clampedActiveIndex + 1}
      data-paused={isUserPaused ? 'true' : 'false'}
      data-offscreen={isOffscreen ? 'true' : 'false'}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
    >
      <div
        className="sr-only"
        aria-live={isAutoPlaying ? 'off' : 'polite'}
        aria-atomic="true"
        data-carousel-live-region="true"
      >
        {liveAnnouncement}
      </div>

      <div
        ref={viewportRef}
        className={viewportClasses}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={finishDrag}
        onScroll={(event) => {
          if (event.currentTarget.scrollLeft !== 0) {
            event.currentTarget.scrollLeft = 0
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsSlideFocused(false)
          }
        }}
      >
        <div className={trackClasses} data-carousel-track="true">
          {services.map((service, idx) => {
            const slideAriaLabel = formatStepCounter(
              dict.carousel.slideOfTotal,
              idx + 1,
              totalSlides,
            )
            const tileState = idx === 0 || service.featured ? 'Featured' : 'Default'
            return (
              <div
                key={`slide-${String(service.id)}-${String(idx)}`}
                role="group"
                aria-roledescription={dict.carousel.slideRoleDescription}
                aria-label={slideAriaLabel}
                className={styles.slide}
                data-slide-index={idx}
                onFocusCapture={() => {
                  handleSlideFocus(idx)
                }}
              >
                <ServiceTile
                  service={service}
                  locale={locale}
                  variant="carousel"
                  state={tileState}
                  learnMoreLabel={learnMoreLabel}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressThumb} data-carousel-thumb="true" />
        </div>

        <div className={styles.actionsGroup}>
          <div className={styles.arrowPair}>
            <button
              type="button"
              onClick={() => {
                setIsUserPaused((prev) => !prev)
              }}
              aria-pressed={isUserPaused}
              aria-label={pauseToggleLabel}
              className={`${styles.arrowButton} ${styles.pauseButton}`}
              data-carousel-action="toggle-pause"
            >
              {isUserPaused ? (
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3.5 2.5L11.5 7L3.5 11.5V2.5Z" fill="currentColor" />
                </svg>
              ) : (
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="3" y="2.5" width="2.75" height="9" rx="1" fill="currentColor" />
                  <rect x="8.25" y="2.5" width="2.75" height="9" rx="1" fill="currentColor" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={goToPrev}
              aria-label={dict.carousel.previousSlide}
              className={`${styles.arrowButton} ${styles.prevButton}`}
              data-carousel-action="prev"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label={dict.carousel.nextSlide}
              className={`${styles.arrowButton} ${styles.nextButton}`}
              data-carousel-action="next"
            >
              <ArrowRightIcon size={18} />
            </button>
          </div>

          <Button
            variant="Dark"
            size="md"
            href={resolvedViewAllHref}
            label={resolvedViewAllLabel}
            locale={locale}
            showArrow
          />
        </div>
      </div>
    </section>
  )
}
