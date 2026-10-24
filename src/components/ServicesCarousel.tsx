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
 * Zero-dependency interactive services carousel with auto-advance (`4500ms`), pause on hover/focus/offscreen,
 * pointer/touch drag & swipe, RTL-aware keyboard arrows (`ArrowLeft`/`ArrowRight`), and `prefers-reduced-motion: reduce` support.
 */
export function ServicesCarousel({
  services,
  locale = DEFAULT_LOCALE,
  position,
  autoAdvanceMs = 4500,
  viewAllHref,
  viewAllLabel,
  learnMoreLabel,
  className,
}: ServicesCarouselProps): ReactElement | null {
  const dict = getDictionary(locale)
  const isRtl = locale === 'ar'
  const totalSlides = services.length
  const maxIndex = Math.max(0, totalSlides - 1)

  const initialIndex = position ? Math.min(maxIndex, Math.max(0, position - 1)) : 0
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isFocusedWithin, setIsFocusedWithin] = useState<boolean>(false)
  const [isOffscreen, setIsOffscreen] = useState<boolean>(false)
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
  const [dragOffsetPx, setDragOffsetPx] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const sectionRef = useRef<HTMLElement | null>(null)
  const dragStartXRef = useRef<number | null>(null)

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
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  useEffect(() => {
    if (
      position !== undefined ||
      autoAdvanceMs <= 0 ||
      totalSlides <= 1 ||
      prefersReducedMotion ||
      isHovered ||
      isFocusedWithin ||
      isOffscreen ||
      isDragging
    ) {
      return
    }

    const timer = window.setInterval(() => {
      goToNext()
    }, autoAdvanceMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    position,
    autoAdvanceMs,
    totalSlides,
    prefersReducedMotion,
    isHovered,
    isFocusedWithin,
    isOffscreen,
    isDragging,
    goToNext,
  ])

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

  const directionMultiplier = isRtl ? 1 : -1
  const baseTranslatePx = activeIndex * CARD_STEP_PX * directionMultiplier
  const totalTranslatePx = baseTranslatePx + dragOffsetPx

  // Progress bar thumb offset (`107.5px` per step in Figma `175:3714` 5-position track)
  const thumbStepPx = maxIndex > 0 ? 430 / maxIndex : 0
  const thumbTranslatePx = activeIndex * thumbStepPx * (isRtl ? -1 : 1)

  const resolvedViewAllHref = viewAllHref ?? `/${locale}/services`
  const resolvedViewAllLabel = viewAllLabel ?? dict.cards.viewAllServicesButton

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
      onFocusCapture={() => {
        setIsFocusedWithin(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocusedWithin(false)
        }
      }}
      className={rootClasses}
      data-component="services-carousel"
      data-active-index={activeIndex}
      data-position={position ?? activeIndex + 1}
      data-offscreen={isOffscreen ? 'true' : 'false'}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
    >
      <div
        className={viewportClasses}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={finishDrag}
      >
        <div
          className={trackClasses}
          style={{ transform: `translate3d(${String(totalTranslatePx)}px, 0, 0)` }}
          data-carousel-track="true"
        >
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
          <div
            className={styles.progressThumb}
            style={{ transform: `translate3d(${String(thumbTranslatePx)}px, 0, 0)` }}
            data-carousel-thumb="true"
          />
        </div>

        <div className={styles.actionsGroup}>
          <div className={styles.arrowPair}>
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
