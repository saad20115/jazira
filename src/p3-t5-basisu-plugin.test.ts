import { CompressedTexture, RGBA_ASTC_4x4_Format, type Texture } from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import type { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { beforeAll, describe, expect, it } from 'vitest'

import { inlineBasisuPlugin } from '@/components/systems3d/viewer/inlineBasisuPlugin'

/**
 * Differential test (CTO, H3b review): the inline plugin must set up every KTX2 texture exactly as
 * three 0.186.1's own `GLTFParser.loadTextureImage` does (flipY, name, sampler filters/wrapping,
 * mipmaps, userData, association), and must handle nothing but KHR_texture_basisu.
 */

const BIN = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb])

const GLTF_JSON = {
  asset: { version: '2.0' },
  extensionsUsed: ['KHR_texture_basisu'],
  buffers: [{ byteLength: 8 }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 4 },
    { buffer: 0, byteOffset: 4, byteLength: 4 },
  ],
  images: [
    { name: 'img_cw_emit', bufferView: 0, mimeType: 'image/ktx2', extras: { note: 'x' } },
    { name: 'img_shared', bufferView: 1, mimeType: 'image/ktx2' },
  ],
  samplers: [
    { magFilter: 9728, minFilter: 9985, wrapS: 33071, wrapT: 33648 },
    { magFilter: 9729, minFilter: 9729 },
  ],
  textures: [
    { name: 'tex_cw_emit', sampler: 0, extensions: { KHR_texture_basisu: { source: 0 } } },
    { name: '', sampler: 1, extensions: { KHR_texture_basisu: { source: 1 } } },
    { extensions: { KHR_texture_basisu: { source: 1 } } },
  ],
}

/** Packs the JSON and the BIN chunk into a GLB, so the buffer comes from the binary body (no fetch). */
function toGlb(): ArrayBuffer {
  const json = Buffer.from(JSON.stringify(GLTF_JSON), 'utf8')
  const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)])
  const header = Buffer.alloc(12)
  const total = 12 + 8 + jsonPadded.length + 8 + BIN.length
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(total, 8)
  const jsonHead = Buffer.alloc(8)
  jsonHead.writeUInt32LE(jsonPadded.length, 0)
  jsonHead.writeUInt32LE(0x4e4f534a, 4)
  const binHead = Buffer.alloc(8)
  binHead.writeUInt32LE(BIN.length, 0)
  binHead.writeUInt32LE(0x004e4942, 4)
  const glb = Buffer.concat([header, jsonHead, jsonPadded, binHead, BIN])
  return glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength)
}

/** A KTX2Loader stand-in: `load()` is three's built-in path (blob URL), `parse()` is the plugin's. */
function fakeKtx2(calls: string[]): KTX2Loader {
  const make = (): CompressedTexture => new CompressedTexture([], 4, 4, RGBA_ASTC_4x4_Format)
  return {
    load: (url: string, onLoad: (t: CompressedTexture) => void) => {
      calls.push(`load ${url.slice(0, 5)}`)
      onLoad(make())
    },
    parse: (buffer: ArrayBuffer, onLoad: (t: CompressedTexture) => void) => {
      calls.push(`parse ${String(buffer.byteLength)}`)
      onLoad(make())
    },
  } as unknown as KTX2Loader
}

async function parseWith(usePlugin: boolean, calls: string[]): Promise<GLTF> {
  const ktx2 = fakeKtx2(calls)
  const loader = new GLTFLoader().setKTX2Loader(ktx2)
  if (!usePlugin) {
    return loader.parseAsync(toGlb(), '')
  }
  // O-9a: the plugin's textures are filled once transcoded; compared after that.
  const basisu = inlineBasisuPlugin(ktx2)
  loader.register(basisu.plugin)
  const gltf = await loader.parseAsync(toGlb(), '')
  for (let index = 0; index < GLTF_JSON.textures.length; index += 1) {
    await gltf.parser.getDependency('texture', index)
  }
  await basisu.fills.settled()
  return gltf
}

function describeTexture(gltf: GLTF, texture: Texture | null): Record<string, unknown> {
  if (!texture) {
    return { texture: null }
  }
  return {
    flipY: texture.flipY,
    name: texture.name,
    magFilter: texture.magFilter,
    minFilter: texture.minFilter,
    wrapS: texture.wrapS,
    wrapT: texture.wrapT,
    generateMipmaps: texture.generateMipmaps,
    userData: texture.userData,
    association: gltf.parser.associations.get(texture),
  }
}

beforeAll(() => {
  // three's built-in path reads `self.URL` (a browser global) to make its blob URLs.
  ;(globalThis as { self?: unknown }).self ??= globalThis
})

describe('P3-T5 inlineBasisuPlugin vs three 0.186.1 loadTextureImage', () => {
  it('produces the same texture setup for every KHR_texture_basisu texture, without blob URLs', async () => {
    const builtInCalls: string[] = []
    const pluginCalls: string[] = []
    const builtIn = await parseWith(false, builtInCalls)
    const plugin = await parseWith(true, pluginCalls)
    for (let index = 0; index < GLTF_JSON.textures.length; index += 1) {
      const a = (await builtIn.parser.getDependency('texture', index)) as Texture | null
      const b = (await plugin.parser.getDependency('texture', index)) as Texture | null
      expect(describeTexture(plugin, b), `texture ${String(index)}`).toEqual(
        describeTexture(builtIn, a),
      )
    }
    expect(builtInCalls.every((call) => call === 'load blob:')).toBe(true)
    expect(pluginCalls).toEqual(['parse 4', 'parse 4', 'parse 4'])
  })

  it('the sampler values really differ per texture (the comparison is not vacuous)', async () => {
    const gltf = await parseWith(true, [])
    const t0 = (await gltf.parser.getDependency('texture', 0)) as Texture
    const t2 = (await gltf.parser.getDependency('texture', 2)) as Texture
    expect([t0.magFilter, t0.minFilter, t0.wrapS, t0.wrapT]).toEqual([1003, 1007, 1001, 1002])
    expect([t2.magFilter, t2.minFilter, t2.wrapS, t2.wrapT]).toEqual([1006, 1008, 1000, 1000])
    expect(t0.name).toBe('tex_cw_emit')
    expect(t0.flipY).toBe(false)
    expect(t0.userData).toEqual({ note: 'x', mimeType: 'image/ktx2' })
  })

  it('handles only KHR_texture_basisu textures and refuses external KTX2 URIs', () => {
    const plugin = inlineBasisuPlugin(fakeKtx2([])).plugin({
      json: {
        textures: [{ source: 0 }, { extensions: { KHR_texture_basisu: { source: 1 } } }],
        images: [{ uri: 'a.png' }, { uri: 'https://elsewhere.example/x.ktx2' }],
      },
    } as never)
    expect(plugin.name).toBe('KHR_texture_basisu')
    const loadTexture = plugin.loadTexture?.bind(plugin)
    expect(loadTexture?.(0)).toBeNull()
    return expect(loadTexture?.(1)).rejects.toThrow(/image 1 is not embedded/)
  })
})
