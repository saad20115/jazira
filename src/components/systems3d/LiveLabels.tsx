'use client'

import { type ReactElement, type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import styles from './InteractiveSystemsSection.module.css'
import { HotspotItem } from './HotspotItem'
import { choosePillSpot, type Rect } from './labelLayout'
import { HOTSPOT_LABEL_IDS, type HotspotLabelId, type Systems3dStrings } from './strings'
import type { ProjectedLabel } from './viewer/systemStage'

export type LiveLabelSink = (labels: ProjectedLabel[] | null) => void

export interface LiveLabelsProps {
  cardRef: RefObject<HTMLDivElement | null>
  /** Receives the sink the viewer calls after every frame. */
  sinkRef: RefObject<LiveLabelSink | null>
  strings: Systems3dStrings
}

function isLabelId(value: string): value is HotspotLabelId {
  return (HOTSPOT_LABEL_IDS as readonly string[]).includes(value)
}

/**
 * Labels of the live view: anchors projected from the GLB `HOT_<s>_<n>` nodes every frame (hidden
 * when out of frame or occluded). React renders the list only when it changes; positions are
 * written through the CSSOM (CSP: no inline style attributes).
 */
export function LiveLabels({ cardRef, sinkRef, strings }: LiveLabelsProps): ReactElement | null {
  const [items, setItems] = useState<{ name: string; label: string }[]>([])
  const anchorRefs = useRef(new Map<string, HTMLLIElement>())
  const pillRefs = useRef(new Map<string, HTMLSpanElement>())
  const keyRef = useRef('')
  const latestRef = useRef<ProjectedLabel[] | null>(null)

  const place = useCallback(
    (labels: ProjectedLabel[]) => {
      const card = cardRef.current
      if (!card) {
        return
      }
      const box = card.getBoundingClientRect()
      const obstacles: Rect[] = [...card.querySelectorAll('[data-label-obstacle]')].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }
      })
      const placed: Rect[] = []
      for (const label of [...labels].sort((a, b) => a.y - b.y)) {
        const anchor = anchorRefs.current.get(label.name)
        const pill = pillRefs.current.get(label.name)
        if (!anchor || !pill) {
          continue
        }
        anchor.style.setProperty('translate', `${label.x.toFixed(1)}px ${label.y.toFixed(1)}px`)
        anchor.style.setProperty('visibility', label.visible ? 'visible' : 'hidden')
        const w = pill.offsetWidth
        const h = pill.offsetHeight
        const spot = label.visible
          ? choosePillSpot(label.x, label.y, w, h, box.width, box.height, [...obstacles, ...placed])
          : null
        if (spot) {
          placed.push({ x: label.x + spot.dx, y: label.y + spot.dy, w, h })
          pill.style.setProperty('translate', `${spot.dx.toFixed(1)}px ${spot.dy.toFixed(1)}px`)
        }
        pill.style.setProperty('opacity', spot ? '1' : '0')
      }
    },
    [cardRef],
  )

  useEffect(() => {
    sinkRef.current = (labels) => {
      latestRef.current = labels
      const key = labels ? labels.map((l) => l.name).join('|') : ''
      if (key !== keyRef.current) {
        keyRef.current = key
        setItems(labels ? labels.map(({ name, label }) => ({ name, label })) : [])
        return
      }
      if (labels) {
        place(labels)
      }
    }
    return () => {
      sinkRef.current = null
    }
  }, [sinkRef, place])

  // Rendering is on demand: the frame that first reports the labels may be the last one for a
  // while, so the new list is placed from the latest report as soon as React has rendered it.
  useEffect(() => {
    if (items.length > 0 && latestRef.current) {
      place(latestRef.current)
    }
  }, [items, place])

  if (items.length === 0) {
    return null
  }
  return (
    <ul className={styles.labelLayer} data-live-labels="true">
      {items.map((item) =>
        isLabelId(item.label) ? (
          <HotspotItem
            anchorRef={(el) => {
              if (el) {
                anchorRefs.current.set(item.name, el)
              } else {
                anchorRefs.current.delete(item.name)
              }
            }}
            key={item.name}
            pillRef={(el) => {
              if (el) {
                pillRefs.current.set(item.name, el)
              } else {
                pillRefs.current.delete(item.name)
              }
            }}
            text={strings.hotspots[item.label]}
          />
        ) : null,
      )}
    </ul>
  )
}
