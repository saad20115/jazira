import { describe, expect, it } from 'vitest'

import {
  chooseModelTier,
  decideStart,
  type DeviceCaps,
  isHighPerformanceGpu,
  parseGfxOverride,
} from '@/components/systems3d/tier'

const desktop: DeviceCaps = {
  deviceMemory: 8,
  hardwareConcurrency: 8,
  saveData: false,
  effectiveType: '4g',
  reducedMotion: false,
  coarsePointer: false,
  phoneLayout: false,
}

describe('P3-T5 device tiers', () => {
  it('a capable desktop starts live', () => {
    expect(decideStart(desktop)).toBe('live')
    expect(decideStart({ reducedMotion: false, coarsePointer: false, phoneLayout: false })).toBe(
      'live',
    )
  })

  it('every §8b constraint keeps the stills tier (no 3D download)', () => {
    expect(decideStart({ ...desktop, reducedMotion: true })).toBe('stills')
    expect(decideStart({ ...desktop, saveData: true })).toBe('stills')
    for (const slow of ['slow-2g', '2g', '3g']) {
      expect(decideStart({ ...desktop, effectiveType: slow })).toBe('stills')
    }
    expect(decideStart({ ...desktop, deviceMemory: 2 })).toBe('stills')
    expect(decideStart({ ...desktop, deviceMemory: 3.9 })).toBe('stills')
    expect(decideStart({ ...desktop, deviceMemory: 4 })).toBe('live')
    expect(decideStart({ ...desktop, hardwareConcurrency: 4 })).toBe('stills')
    expect(decideStart({ ...desktop, hardwareConcurrency: 5 })).toBe('live')
  })

  it('recognises high-performance GPUs and treats integrated, mobile and software ones as low', () => {
    for (const gpu of [
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Apple M2',
    ]) {
      expect(isHighPerformanceGpu(gpu), gpu).toBe(true)
    }
    for (const gpu of [
      'ANGLE (Intel, Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
      'Mali-G78',
      'Adreno (TM) 650',
      'Apple GPU',
      'Microsoft Basic Render Driver',
      '',
      null,
      undefined,
    ]) {
      expect(isHighPerformanceGpu(gpu), String(gpu)).toBe(false)
    }
  })

  it('lite is the default; full only on a desktop with a high-performance GPU', () => {
    const rtx = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    const hd530 = 'ANGLE (Intel, Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    expect(chooseModelTier(desktop, rtx)).toBe('full')
    expect(chooseModelTier(desktop, hd530)).toBe('lite')
    expect(chooseModelTier(desktop, null)).toBe('lite')
    expect(chooseModelTier({ ...desktop, coarsePointer: true }, rtx)).toBe('lite')
    expect(chooseModelTier({ ...desktop, phoneLayout: true }, rtx)).toBe('lite')
    expect(chooseModelTier({ ...desktop, deviceMemory: 4 }, rtx)).toBe('lite')
  })

  it('parses only the three ?gfx= values', () => {
    expect(parseGfxOverride('?gfx=stills')).toBe('stills')
    expect(parseGfxOverride('?gfx=low&x=1')).toBe('low')
    expect(parseGfxOverride('?gfx=high')).toBe('high')
    expect(parseGfxOverride('?gfx=ultra')).toBeNull()
    expect(parseGfxOverride('?gfx=<script>')).toBeNull()
    expect(parseGfxOverride('')).toBeNull()
  })
})
