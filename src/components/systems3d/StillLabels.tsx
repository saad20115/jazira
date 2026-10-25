'use client'

import { type ReactElement, type RefObject, useEffect, useRef, useState } from 'react'

import { ContractError, parseStillHotspots, type StillHotspot, type SystemId } from './contract'
import { choosePillSpot, type Rect } from './labelLayout'
import styles from './InteractiveSystemsSection.module.css'
import { HotspotItem } from './HotspotItem'
import { RELEASE_BASE_PATH } from './renderContract'
import { HOTSPOT_LABEL_IDS, type HotspotLabelId, type Systems3dStrings } from './strings'

export interface StillLabelsProps {
  system: SystemId
  /** The card: the end still covers it (`object-fit: cover`, centred). */
  cardRef: RefObject<HTMLDivElement | null>
  strings: Systems3dStrings
}

function isLabelId(value: string): value is HotspotLabelId {
  return (HOTSPOT_LABEL_IDS as readonly string[]).includes(value)
}

/**
 * Labels of the stills tier: anchors from the stills package `<s>_hotspots.json` (validated), mapped
 * through the cover crop of the square end still. Positions are physical (the image is not
 * mirrored in RTL) and set through the CSSOM (CSP: no inline style attributes).
 */
export function StillLabels({ system, cardRef, strings }: StillLabelsProps): ReactElement | null {
  const [points, setPoints] = useState<StillHotspot[]>([])
  const anchorRefs = useRef(new Map<string, HTMLLIElement>())
  const pillRefs = useRef(new Map<string, HTMLSpanElement>())

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${RELEASE_BASE_PATH}/stills/${system}_hotspots.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new ContractError(`${system}_hotspots.json: HTTP ${String(response.status)}`)
        }
        return response.json() as Promise<unknown>
      })
      .then((json) => {
        setPoints(parseStillHotspots(json, system).filter((p) => isLabelId(p.label)))
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPoints([])
        }
      })
    return () => {
      controller.abort()
    }
  }, [system])

  useEffect(() => {
    const card = cardRef.current
    if (!card || points.length === 0) {
      return
    }
    const place = (): void => {
      const box = card.getBoundingClientRect()
      const { width, height } = box
      const side = Math.max(width, height)
      const obstacles: Rect[] = [...card.querySelectorAll('[data-label-obstacle]')].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }
      })
      const placed: Rect[] = []
      const ordered = [...points].sort((a, b) => a.y - b.y)
      for (const point of ordered) {
        const anchor = anchorRefs.current.get(point.name)
        const pill = pillRefs.current.get(point.name)
        if (!anchor || !pill) {
          continue
        }
        const x = point.x * side - (side - width) / 2
        const y = point.y * side - (side - height) / 2
        const inside = x >= 0 && x <= width && y >= 0 && y <= height
        anchor.style.setProperty('translate', `${x.toFixed(1)}px ${y.toFixed(1)}px`)
        anchor.style.setProperty('visibility', inside ? 'visible' : 'hidden')
        const w = pill.offsetWidth
        const h = pill.offsetHeight
        const spot = inside
          ? choosePillSpot(x, y, w, h, width, height, [...obstacles, ...placed])
          : null
        if (spot) {
          placed.push({ x: x + spot.dx, y: y + spot.dy, w, h })
          pill.style.setProperty('translate', `${spot.dx.toFixed(1)}px ${spot.dy.toFixed(1)}px`)
        }
        pill.style.setProperty('opacity', spot ? '1' : '0')
      }
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(card)
    return () => {
      observer.disconnect()
    }
  }, [points, cardRef])

  if (points.length === 0) {
    return null
  }
  return (
    <ul className={styles.labelLayer}>
      {points.map((point) =>
        isLabelId(point.label) ? (
          <HotspotItem
            anchorRef={(el) => {
              if (el) {
                anchorRefs.current.set(point.name, el)
              } else {
                anchorRefs.current.delete(point.name)
              }
            }}
            key={point.name}
            pillRef={(el) => {
              if (el) {
                pillRefs.current.set(point.name, el)
              } else {
                pillRefs.current.delete(point.name)
              }
            }}
            text={strings.hotspots[point.label]}
          />
        ) : null,
      )}
    </ul>
  )
}
