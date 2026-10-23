import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import { preload } from 'react-dom'

import type { SupportedLocale } from '@/i18n'

export interface LocaleFontPreloadMap {
  ar: string[]
  en: string[]
}

let cachedFontPreloadMap: LocaleFontPreloadMap | null = null

/**
 * Extracts locale-specific `.woff2` font preload URLs from built `@font-face` CSS rules (`R-11`):
 * - `ar`: `Noto Kufi Arabic` normal weight(s) in the Arabic unicode range (`U+6??` / `U+0600`)
 * - `en`: `Poppins` normal weights (`400`, `500`, `600`, `700`) in the Latin unicode range (`U+??` / `U+0000`)
 */
export function extractLocaleFontPreloadsFromCss(cssContent: string): LocaleFontPreloadMap {
  const arSet = new Set<string>()
  const enSet = new Set<string>()

  const fontFaceBlocks = cssContent.match(/@font-face\s*\{[^}]+\}/g) ?? []
  for (const block of fontFaceBlocks) {
    if (!/font-style\s*:\s*normal/i.test(block)) {
      continue
    }
    const urlMatch = block.match(
      /url\((?:['"]?)(?:\.\.\/media\/|\/_next\/static\/media\/)([^)'"]+\.woff2)(?:['"]?)\)/i,
    )
    if (!urlMatch || !urlMatch[1]) {
      continue
    }
    const href = `/_next/static/media/${urlMatch[1]}`

    if (/font-family\s*:\s*['"]?Noto Kufi Arabic['"]?(?:[;}]|$)/i.test(block)) {
      if (/unicode-range\s*:[^;]*(?:U\+6\?\?|U\+0600)/i.test(block)) {
        arSet.add(href)
      }
    } else if (/font-family\s*:\s*['"]?Poppins['"]?(?:[;}]|$)/i.test(block)) {
      if (/unicode-range\s*:[^;]*(?:U\+\?\?|U\+0000)/i.test(block)) {
        enSet.add(href)
      }
    }
  }

  return {
    ar: [...arSet],
    en: [...enSet],
  }
}

function getLocaleFontPreloadMap(): LocaleFontPreloadMap {
  if (
    cachedFontPreloadMap &&
    (cachedFontPreloadMap.ar.length > 0 || cachedFontPreloadMap.en.length > 0)
  ) {
    return cachedFontPreloadMap
  }

  const arSet = new Set<string>()
  const enSet = new Set<string>()

  const candidateDirs = [
    path.resolve('.next/static/chunks'),
    path.resolve('.next/dev/static/chunks'),
  ]

  for (const dirPath of candidateDirs) {
    if (!fs.existsSync(dirPath)) {
      continue
    }
    try {
      const entries = fs.readdirSync(dirPath)
      for (const entry of entries) {
        if (!entry.endsWith('.css')) {
          continue
        }
        const cssContent = fs.readFileSync(path.join(dirPath, entry), 'utf8')
        const extracted = extractLocaleFontPreloadsFromCss(cssContent)
        for (const href of extracted.ar) {
          arSet.add(href)
        }
        for (const href of extracted.en) {
          enSet.add(href)
        }
      }
    } catch {
      // Ignore read errors when .next is not yet built
    }
  }

  const result: LocaleFontPreloadMap = {
    ar: [...arSet],
    en: [...enSet],
  }
  if (result.ar.length > 0 || result.en.length > 0) {
    cachedFontPreloadMap = result
  }
  return result
}

/**
 * Emits `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous">` tags
 * only for the active locale's font weights (`R-11`).
 */
export function preloadLocaleFonts(locale: SupportedLocale): string[] {
  const map = getLocaleFontPreloadMap()
  const urls = map[locale]
  for (const href of urls) {
    preload(href, {
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    })
  }
  return urls
}
