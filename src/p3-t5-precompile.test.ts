import {
  BufferAttribute,
  BufferGeometry,
  type Camera,
  Group,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  type Vector4,
  type WebGLRenderer,
} from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createLinkBudget,
  FRAME_WAIT_MAX_MS,
  LINK_MAX_WAIT_MS,
  hasPmremInternals,
  uploadGeometryInChunks,
  waitForLinks,
  yieldToFrame,
} from '@/components/systems3d/viewer/precompile'

describe('P3-T5 shader warm-up', () => {
  it('three 0.186.1 still has the PMREMGenerator internals the warm-up relies on', () => {
    // The constructor only stores the renderer; nothing touches WebGL here.
    const pmrem = new PMREMGenerator({} as unknown as WebGLRenderer)
    expect(hasPmremInternals(pmrem)).toBe(true)
  })

  it('rejects an object without them (the warm-up then leaves fromScene as it is)', () => {
    expect(hasPmremInternals({} as unknown as PMREMGenerator)).toBe(false)
  })
})

/** A stand-in for three's WebGLProgram: `isReady()` is what the budget asks. */
function program(): { linked: boolean; isReady: () => boolean } {
  const p = {
    linked: false,
    isReady: () => p.linked,
  }
  return p
}

describe('P3-T5 O-12: only a few new programs link at once', () => {
  beforeEach(() => {
    // The budget polls with `window.setTimeout`; vitest runs in node.
    vi.stubGlobal('window', { setTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has room at once while fewer than the limit are linking, and is full at the limit', async () => {
    const budget = createLinkBudget(() => 2)
    await budget.room(() => false)
    expect(budget.full).toBe(false)
    budget.track([program()])
    expect(budget.full).toBe(false)
    budget.track([program()])
    expect(budget.full).toBe(true)
  })

  it('waits for room until one of the counted programs has linked', async () => {
    const budget = createLinkBudget(() => 1)
    const first = program()
    budget.track([first])
    let roomAt = 0
    const room = budget
      .room(() => false)
      .then(() => {
        roomAt = performance.now()
      })
    await new Promise((resolve) => {
      setTimeout(resolve, 120)
    })
    expect(roomAt).toBe(0)
    const linkedAt = performance.now()
    first.linked = true
    await room
    expect(roomAt).toBeGreaterThanOrEqual(linkedAt)
    expect(budget.full).toBe(false)
  })

  it('counts a program three hands back again only once', () => {
    const budget = createLinkBudget(() => 2)
    const shared = program()
    budget.track([shared])
    budget.track([shared, shared])
    expect(budget.full).toBe(false)
  })

  it('treats a program three has released as done (it never reports a link)', async () => {
    const budget = createLinkBudget(() => 1)
    const released = { program: undefined, isReady: () => false }
    budget.track([released])
    expect(budget.full).toBe(true)
    await budget.room(() => false)
    expect(budget.full).toBe(false)
  })

  it('follows the limit as it changes (more room once the limit rises)', async () => {
    let limit = 1
    const budget = createLinkBudget(() => limit)
    budget.track([program()])
    expect(budget.full).toBe(true)
    limit = 2
    expect(budget.full).toBe(false)
    await budget.room(() => false)
  })

  it('O-14: stops waiting for room after its bound, even if nothing ever links, and counts afresh', async () => {
    const budget = createLinkBudget(() => 1, 150)
    // A program on a lost context: `isReady()` never turns true.
    budget.track([program()])
    const start = performance.now()
    await budget.room(() => false)
    expect(performance.now() - start).toBeGreaterThanOrEqual(140)
    expect(budget.full).toBe(false)
  })

  it('stops waiting once cancelled', async () => {
    const budget = createLinkBudget(() => 1)
    budget.track([program()])
    let cancelled = false
    const room = budget.room(() => cancelled)
    cancelled = true
    await room
    expect(budget.full).toBe(true)
  })
})

/** A mesh with `bytes` of vertex data (one float attribute). */
function meshOf(bytes: number): Mesh {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(bytes / 4), 1))
  return new Mesh(geometry, new MeshBasicMaterial())
}

describe('P3-T5 O-12: the model buffers go up a few MB per task before the first frame', () => {
  const MB = 1024 * 1024

  it('draws each part once, alone, into a 1×1 viewport, and puts everything back', async () => {
    const scene = new Scene()
    const visible = [meshOf(1.5 * MB), meshOf(1.5 * MB), meshOf(1.5 * MB), meshOf(1.5 * MB)]
    // Hidden at rest (a system's equipment): its buffers go up too, under a hidden group.
    const hiddenGroup = new Group()
    hiddenGroup.visible = false
    const hidden = meshOf(1.5 * MB)
    hiddenGroup.add(hidden)
    const culled = meshOf(0.5 * MB)
    culled.frustumCulled = true
    scene.add(...visible, hiddenGroup, culled)
    const drawables: Mesh[] = [...visible, hidden, culled]

    const draws: Object3D[][] = []
    const viewports: number[][] = []
    const renderer = {
      getViewport: (target: Vector4) => target.set(0, 0, 640, 480),
      setViewport: (x: number | Vector4, y?: number, w?: number, h?: number) => {
        viewports.push(typeof x === 'number' ? [x, y ?? 0, w ?? 0, h ?? 0] : [x.x, x.y, x.z, x.w])
      },
      render: (root: Object3D, _camera: Camera) => {
        // What three would draw: visible meshes whose ancestors are all visible, culling off.
        const drawn: Object3D[] = []
        root.traverseVisible((object) => {
          if (object instanceof Mesh) {
            expect(object.frustumCulled).toBe(false)
            drawn.push(object)
          }
        })
        draws.push(drawn)
      },
    } as unknown as WebGLRenderer

    await uploadGeometryInChunks(
      renderer,
      scene,
      new PerspectiveCamera(),
      () => false,
      () => Promise.resolve(),
    )

    // Parts of a few MB: more than one draw, each mesh drawn in exactly one of them.
    expect(draws.length).toBeGreaterThan(1)
    for (const mesh of drawables) {
      expect(draws.filter((drawn) => drawn.includes(mesh)).length).toBe(1)
    }
    // Every draw into 1×1, and the viewport back afterwards.
    for (let i = 0; i < viewports.length; i += 2) {
      expect(viewports[i]).toEqual([0, 0, 1, 1])
      expect(viewports[i + 1]).toEqual([0, 0, 640, 480])
    }
    // The scene as it was.
    expect(hiddenGroup.visible).toBe(false)
    expect(visible.every((mesh) => mesh.visible && mesh.frustumCulled)).toBe(true)
    expect(culled.frustumCulled).toBe(true)
  })

  it('stops between parts once cancelled', async () => {
    const scene = new Scene()
    scene.add(meshOf(3 * MB), meshOf(3 * MB), meshOf(3 * MB))
    let draws = 0
    const renderer = {
      getViewport: (target: Vector4) => target.set(0, 0, 1, 1),
      setViewport: () => undefined,
      render: () => {
        draws += 1
      },
    } as unknown as WebGLRenderer
    let cancelled = false
    await uploadGeometryInChunks(
      renderer,
      scene,
      new PerspectiveCamera(),
      () => cancelled,
      () => {
        cancelled = draws > 0
        return Promise.resolve()
      },
    )
    expect(draws).toBe(1)
  })
})

describe('P3-T5 O-14: every wait for links has a bound', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { setTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('waits for the links, and returns once they are done', async () => {
    const first = program()
    const second = program()
    let done = false
    const wait = waitForLinks([first, second], () => false, 5_000).then(() => {
      done = true
    })
    await new Promise((resolve) => {
      setTimeout(resolve, 120)
    })
    expect(done).toBe(false)
    first.linked = true
    second.linked = true
    await wait
    expect(done).toBe(true)
  })

  it('returns after its bound when a program never links (a context lost before the first frame)', async () => {
    const start = performance.now()
    await waitForLinks([program()], () => false, 150)
    const waited = performance.now() - start
    expect(waited).toBeGreaterThanOrEqual(140)
    expect(waited).toBeLessThan(1_000)
  })

  it('has a default bound of a few seconds', () => {
    expect(LINK_MAX_WAIT_MS).toBeGreaterThan(0)
    expect(LINK_MAX_WAIT_MS).toBeLessThan(10_000)
  })
})

describe('P3-T5 O-9b: a slice per frame, never a wait without end', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('resolves on the next animation frame', async () => {
    const frames: (() => void)[] = []
    vi.stubGlobal('window', { setTimeout, clearTimeout })
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => frames.push(callback))
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    let done = false
    const waiting = yieldToFrame(60_000).then(() => {
      done = true
    })
    await Promise.resolve()
    expect(done).toBe(false)
    frames[0]?.()
    await waiting
    expect(done).toBe(true)
  })

  it('resolves after its bound when no frame comes (a hidden tab)', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('window', { setTimeout, clearTimeout })
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    let done = false
    const waiting = yieldToFrame(100).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(99)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await waiting
    expect(done).toBe(true)
    expect(FRAME_WAIT_MAX_MS).toBeGreaterThan(0)
  })
})
