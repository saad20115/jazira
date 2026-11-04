'use client'

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { CspSafeImage } from '@/components/CspSafeImage'
import { revealAttributes } from '@/components/Reveal'
import {
  formatLightboxCounter,
  formatOpenImageInLightbox,
  getDictionary,
  type SupportedLocale,
} from '@/i18n'

import styles from './Lightbox.module.css'

export interface LightboxSlide {
  id: string
  src: string
  alt: string
  caption?: string | null
  width?: number | null
  height?: number | null
}

export interface LightboxProps {
  slides: readonly LightboxSlide[]
  activeIndex: number
  locale: SupportedLocale
  onClose: () => void
  onChangeIndex: (nextIndex: number) => void
}

const SWIPE_THRESHOLD_PX = 40

function ExpandCornerSvg(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 6V2H10M14 2L9.33333 6.66667M2 10V14H6M2 14L6.66667 9.33333"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LightboxCloseSvg(): ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 4L10 10M10 10L16 16M10 10L16 4M10 10L4 16"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LightboxPrevSvg(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={styles.directionalIcon}
    >
      <path
        d="M13 4L5 10L13 16"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LightboxNextSvg(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={styles.directionalIcon}
    >
      <path
        d="M7 4L15 10L7 16"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Figma overlay `28:1687`–`28:1689` (`design/context/overlays/overlay-lightbox-1.md`).
 * Accessible modal gallery viewer (`docs/05-design.md` §4 & `P3-T8` Scope 3):
 * - `role="dialog"`, `aria-modal="true"`, focus trapped inside while open
 * - `Escape` closes and returns focus to the triggering thumbnail button
 * - Keyboard arrows (`ArrowLeft` / `ArrowRight`, inverted in RTL) and pointer swipe
 */
export function Lightbox({
  slides,
  activeIndex,
  locale,
  onClose,
  onChangeIndex,
}: LightboxProps): ReactElement | null {
  const dict = getDictionary(locale)
  const isRtl = locale === 'ar'
  const total = slides.length
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const prevButtonRef = useRef<HTMLButtonElement | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const pointerStartXRef = useRef<number | null>(null)

  const goPrev = useCallback((): void => {
    if (total <= 1) return
    const nextIdx = (activeIndex - 1 + total) % total
    onChangeIndex(nextIdx)
  }, [activeIndex, onChangeIndex, total])

  const goNext = useCallback((): void => {
    if (total <= 1) return
    const nextIdx = (activeIndex + 1) % total
    onChangeIndex(nextIdx)
  }, [activeIndex, onChangeIndex, total])

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (isRtl) {
          goPrev()
        } else {
          goNext()
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        if (isRtl) {
          goNext()
        } else {
          goPrev()
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [goNext, goPrev, isRtl, onClose])

  if (total === 0) {
    return null
  }

  const safeIndex = ((activeIndex % total) + total) % total
  const currentSlide = slides[safeIndex]

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Tab') return

    const focusables = [
      closeButtonRef.current,
      ...(total > 1 ? [prevButtonRef.current, nextButtonRef.current] : []),
    ].filter((el): el is HTMLButtonElement => el !== null)

    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const activeEl = document.activeElement

    if (event.shiftKey) {
      if (activeEl === first || !focusables.includes(activeEl as HTMLButtonElement)) {
        event.preventDefault()
        last.focus()
      }
    } else if (activeEl === last || !focusables.includes(activeEl as HTMLButtonElement)) {
      event.preventDefault()
      first.focus()
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    pointerStartXRef.current = event.clientX
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (pointerStartXRef.current === null || total <= 1) return
    const deltaX = event.clientX - pointerStartXRef.current
    pointerStartXRef.current = null

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return

    if (deltaX < 0) {
      if (isRtl) {
        goPrev()
      } else {
        goNext()
      }
    } else if (isRtl) {
      goNext()
    } else {
      goPrev()
    }
  }

  const counterLabel = formatLightboxCounter(
    dict.projects.detail.lightboxCounterTemplate,
    dict.projects.detail.lightboxCounterWithCaptionTemplate,
    safeIndex + 1,
    total,
    currentSlide.caption,
  )

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={dict.projects.detail.galleryHeading}
      data-component="lightbox"
      data-active-index={safeIndex}
      onKeyDown={handleDialogKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={styles.viewer}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className={styles.imageStage}>
          <CspSafeImage
            src={currentSlide.src}
            alt={currentSlide.alt}
            width={currentSlide.width ?? 1100}
            height={currentSlide.height ?? 640}
            sizes="(max-width: 1180px) 100vw, 1100px"
            className={styles.stageImage}
          />
        </div>

        <p className={`${styles.captionBar} t-label-nav`} aria-live="polite" data-lightbox-counter>
          {counterLabel}
        </p>

        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          aria-label={dict.a11y.lightboxClose}
          data-lightbox-close
          onClick={onClose}
        >
          <LightboxCloseSvg />
        </button>

        {total > 1 ? (
          <>
            <button
              ref={prevButtonRef}
              type="button"
              className={styles.prevButton}
              aria-label={dict.a11y.lightboxPrev}
              data-lightbox-prev
              onClick={goPrev}
            >
              <LightboxPrevSvg />
            </button>
            <button
              ref={nextButtonRef}
              type="button"
              className={styles.nextButton}
              aria-label={dict.a11y.lightboxNext}
              data-lightbox-next
              onClick={goNext}
            >
              <LightboxNextSvg />
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export interface ProjectGalleryProps {
  slides: readonly LightboxSlide[]
  locale: SupportedLocale
}

/**
 * Figma section `20:982` (`Project Visual Showcase` gallery grid) wired to `<Lightbox>`.
 */
export function ProjectGallery({ slides, locale }: ProjectGalleryProps): ReactElement | null {
  const dict = getDictionary(locale)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const triggeringIndexRef = useRef<number | null>(null)
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])

  if (slides.length === 0) {
    return null
  }

  const handleOpen = (index: number): void => {
    triggeringIndexRef.current = index
    setOpenIndex(index)
  }

  const handleClose = (): void => {
    const idxToRestore = triggeringIndexRef.current ?? openIndex
    triggeringIndexRef.current = null
    setOpenIndex(null)
    if (idxToRestore !== null) {
      triggerRefs.current[idxToRestore]?.focus()
      requestAnimationFrame(() => {
        triggerRefs.current[idxToRestore]?.focus()
      })
    }
  }

  return (
    <>
      <div className={styles.galleryGrid} data-component="project-gallery">
        {slides.map((slide, idx) => {
          const buttonAriaLabel = formatOpenImageInLightbox(
            dict.projects.detail.openImageInLightboxTemplate,
            idx + 1,
            slides.length,
          )
          return (
            <button
              key={slide.id}
              ref={(el) => {
                triggerRefs.current[idx] = el
              }}
              type="button"
              className={styles.galleryItemButton}
              aria-label={buttonAriaLabel}
              data-gallery-item={idx}
              onClick={() => {
                handleOpen(idx)
              }}
              {...revealAttributes({ variant: 'fade', step: idx % 3 })}
            >
              <CspSafeImage
                src={slide.src}
                alt={slide.alt}
                width={slide.width ?? 373}
                height={slide.height ?? 260}
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 373px"
                className={styles.galleryThumbImage}
              />
              <span className={styles.expandBadge} aria-hidden="true">
                <ExpandCornerSvg />
              </span>
            </button>
          )
        })}
      </div>

      {openIndex !== null ? (
        <Lightbox
          slides={slides}
          activeIndex={openIndex}
          locale={locale}
          onClose={handleClose}
          onChangeIndex={setOpenIndex}
        />
      ) : null}
    </>
  )
}
