import { describe, expect, it } from 'vitest'

import {
  chooseModelTier,
  decideStart,
  type DeviceCaps,
  FPS_WINDOW,
  fpsVerdict,
  isHighPerformanceGpu,
  isSoftwareRenderer,
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
      'ANGLE (AMD, AMD Radeon(TM) RX 7600S Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (AMD, AMD Radeon Pro W6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Apple M2',
    ]) {
      expect(isHighPerformanceGpu(gpu), gpu).toBe(true)
    }
    for (const gpu of [
      'ANGLE (Intel, Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      // Ryzen APUs (integrated Radeon, shared memory).
      'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (AMD, AMD Radeon(TM) Vega 8 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (AMD, AMD Radeon 780M Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
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

  it('recognises software renderers (stills before any download) and nothing else', () => {
    for (const gpu of [
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'Microsoft Basic Render Driver',
      'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
    ]) {
      expect(isSoftwareRenderer(gpu), gpu).toBe(true)
    }
    for (const gpu of [
      'ANGLE (Intel, Intel(R) HD Graphics 530 (0x00001912) Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Mali-G78',
      'Apple GPU',
      '',
      null,
      undefined,
    ]) {
      expect(isSoftwareRenderer(gpu), String(gpu)).toBe(false)
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
})

describe('P3-T5 run-time FPS tier check', () => {
  const frames = (ms: number, n = FPS_WINDOW): number[] => Array.from({ length: n }, () => ms)

  it('needs a full window before deciding', () => {
    expect(fpsVerdict(frames(100, FPS_WINDOW - 1), false)).toBe('ok')
  })

  it('drops to low below 45 fps, and to stills below 24 fps once low', () => {
    expect(fpsVerdict(frames(1000 / 60), false)).toBe('ok')
    expect(fpsVerdict(frames(1000 / 46), false)).toBe('ok')
    expect(fpsVerdict(frames(1000 / 44), false)).toBe('low')
    expect(fpsVerdict(frames(1000 / 30), true)).toBe('ok')
    expect(fpsVerdict(frames(1000 / 23), true)).toBe('stills')
    expect(fpsVerdict(frames(1000 / 23), false)).toBe('low')
  })

  it('one long stall (hidden tab, shader compile) does not drop a 60 fps device', () => {
    expect(fpsVerdict([...frames(1000 / 60, FPS_WINDOW - 1), 10_000], false)).toBe('ok')
    expect(fpsVerdict(frames(300), false)).toBe('low')
    expect(fpsVerdict(frames(300), true)).toBe('stills')
  })

  it('uses only the most recent window', () => {
    expect(fpsVerdict([...frames(100, 200), ...frames(10)], false)).toBe('ok')
    expect(fpsVerdict([...frames(10, 200), ...frames(100)], false)).toBe('low')
  })
})
