import { PMREMGenerator, type WebGLRenderer } from 'three'
import { describe, expect, it } from 'vitest'

import { hasPmremInternals } from '@/components/systems3d/viewer/precompile'

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
