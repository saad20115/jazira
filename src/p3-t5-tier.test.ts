import { describe, expect, it } from 'vitest'

import {
  chooseModelTier,
  decideStart,
  type DeviceCaps,
  FPS_WINDOW,
  fpsVerdict,
  isHighPerformanceGpu,
  isSoftwareRenderer,
  LOW_TIER_FPS,
  PROBE_FRAMES,
  probeVerdict,
  STILLS_TIER_FPS,
  WARMUP_SKIP_CAP_MS,
  warmupSample,
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

describe('P3-T5 FPS check during shader warm-up (CTO 2026-11-01: capped blind window)', () => {
  /** Feeds intervals of `ms` while `preparing`; returns how many were sampled. */
  const run = (start: number, preparing: boolean, ms: number, n: number) => {
    let skippedMs = start
    let sampled = 0
    for (let i = 0; i < n; i += 1) {
      const step = warmupSample(skippedMs, preparing, ms)
      skippedMs = step.skippedMs
      sampled += step.sample ? 1 : 0
    }
    return { sampled, skippedMs }
  }

  it('samples every interval when no warm-up runs', () => {
    expect(run(0, false, 16, 100)).toEqual({ sampled: 100, skippedMs: 0 })
  })

  it('skips warm-up intervals only until the cap, then samples again while it still runs', () => {
    const ms = 50
    const skippedFrames = WARMUP_SKIP_CAP_MS / ms
    const { sampled, skippedMs } = run(0, true, ms, skippedFrames + 40)
    expect(skippedMs).toBe(WARMUP_SKIP_CAP_MS)
    expect(sampled).toBe(40)
  })

  it('skips right below the cap and samples from the cap on', () => {
    expect(warmupSample(WARMUP_SKIP_CAP_MS - 1, true, 16)).toEqual({
      sample: false,
      skippedMs: WARMUP_SKIP_CAP_MS + 15,
    })
    expect(warmupSample(WARMUP_SKIP_CAP_MS, true, 16).sample).toBe(true)
  })

  it('a new warm-up after one ends gets its own blind window', () => {
    const afterCap = run(0, true, 100, 40).skippedMs
    expect(warmupSample(afterCap, false, 16)).toEqual({ sample: true, skippedMs: 0 })
    expect(warmupSample(0, true, 16).sample).toBe(false)
  })
})

describe('P3-T5 O-9: the GPU probe fixes the tier before the first visible frame', () => {
  const lowFrameMs = 1000 / LOW_TIER_FPS
  const stillsFrameMs = 1000 / STILLS_TIER_FPS
  const frames = (first: number, rest: number): number[] => [
    first,
    ...Array.from({ length: PROBE_FRAMES - 1 }, () => rest),
  ]

  it('frames faster than the low rate keep the model', () => {
    expect(probeVerdict(frames(lowFrameMs * 0.5, lowFrameMs * 0.5), false)).toBe('ok')
  })

  it('frames slower than the low rate start on the low tier', () => {
    expect(probeVerdict(frames(lowFrameMs * 2, lowFrameMs * 2), false)).toBe('low')
  })

  it('the first frame (first-use costs) never decides', () => {
    expect(probeVerdict(frames(stillsFrameMs * 20, lowFrameMs * 0.5), false)).toBe('ok')
  })

  it('the median decides: one slow frame among fast ones keeps the tier', () => {
    const timed = frames(lowFrameMs * 0.5, lowFrameMs * 0.5)
    timed[timed.length - 1] = stillsFrameMs * 20
    expect(probeVerdict(timed, false)).toBe('ok')
  })

  it('once low, frames slower than the stills rate end on the stills tier', () => {
    expect(probeVerdict(frames(stillsFrameMs * 2, stillsFrameMs * 2), true)).toBe('stills')
    expect(probeVerdict(frames(lowFrameMs * 1.2, lowFrameMs * 1.2), true)).toBe('ok')
  })

  it('no timed frame (the viewer was disposed) decides nothing', () => {
    expect(probeVerdict([], false)).toBe('ok')
    expect(probeVerdict([stillsFrameMs * 20], true)).toBe('ok')
  })
})
