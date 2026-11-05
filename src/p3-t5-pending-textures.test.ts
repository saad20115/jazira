import {
  CompressedTexture,
  LinearSRGBColorSpace,
  type MeshStandardMaterial,
  RGBA_ASTC_4x4_Format,
  SRGBColorSpace,
} from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import type { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { describe, expect, it } from 'vitest'

import {
  inlineBasisuPlugin,
  PendingTexture,
} from '@/components/systems3d/viewer/inlineBasisuPlugin'

/**
 * O-9a (P3-T5 round 8): the parse hands its materials placeholder textures at once, so the hero's
 * programs can link while the KTX2 workers transcode. Each transcode then fills its texture and
 * every clone GLTFLoader made of it (a second UV set, a texture transform) in place.
 */

const BIN = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb])

const GLTF_JSON = {
  asset: { version: '2.0' },
  extensionsUsed: ['KHR_texture_basisu', 'KHR_texture_transform'],
  buffers: [{ byteLength: 8 }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 4 },
    { buffer: 0, byteOffset: 4, byteLength: 4 },
  ],
  images: [
    { name: 'img_colour', bufferView: 0, mimeType: 'image/ktx2' },
    { name: 'img_normal', bufferView: 1, mimeType: 'image/ktx2' },
  ],
  textures: [
    { extensions: { KHR_texture_basisu: { source: 0 } } },
    { extensions: { KHR_texture_basisu: { source: 1 } } },
  ],
  materials: [
    {
      name: 'second_uv_set',
      pbrMetallicRoughness: { baseColorTexture: { index: 0, texCoord: 1 } },
      normalTexture: { index: 1 },
    },
    {
      name: 'transformed',
      pbrMetallicRoughness: {
        baseColorTexture: {
          index: 0,
          extensions: { KHR_texture_transform: { offset: [0.5, 0] } },
        },
      },
    },
  ],
}

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

interface HeldTranscode {
  resolve: (texture: CompressedTexture) => void
  reject: (error: Error) => void
}

/** A KTX2Loader stand-in whose transcodes finish only when the test says so. */
function heldKtx2(held: HeldTranscode[]): KTX2Loader {
  return {
    parse: (
      _buffer: ArrayBuffer,
      onLoad: (t: CompressedTexture) => void,
      onError: (e: Error) => void,
    ) => {
      held.push({ resolve: onLoad, reject: onError })
    },
  } as unknown as KTX2Loader
}

function transcoded(): CompressedTexture {
  const texture = new CompressedTexture(
    [{ data: new Uint8Array(16), width: 4, height: 4 }],
    4,
    4,
    RGBA_ASTC_4x4_Format,
  )
  texture.colorSpace = LinearSRGBColorSpace
  return texture
}

async function parse(held: HeldTranscode[]): Promise<{
  gltf: GLTF
  uv: MeshStandardMaterial
  xf: MeshStandardMaterial
  settled: () => Promise<void>
}> {
  const ktx2 = heldKtx2(held)
  const basisu = inlineBasisuPlugin(ktx2)
  const loader = new GLTFLoader().setKTX2Loader(ktx2)
  loader.register(basisu.plugin)
  const gltf = await loader.parseAsync(toGlb(), '')
  const uv = (await gltf.parser.getDependency('material', 0)) as MeshStandardMaterial
  const xf = (await gltf.parser.getDependency('material', 1)) as MeshStandardMaterial
  return { gltf, uv, xf, settled: () => basisu.fills.settled() }
}

describe('P3-T5 O-9a: textures are filled after the parse, clones included', () => {
  it('the parse and its materials finish before any texture is transcoded', async () => {
    const held: HeldTranscode[] = []
    const { uv, xf } = await parse(held)
    expect(held).toHaveLength(2)
    for (const map of [uv.map, uv.normalMap, xf.map]) {
      expect(map).toBeInstanceOf(PendingTexture)
      expect(map?.mipmaps).toEqual([])
    }
    // GLTFLoader cloned the colour texture for the second UV set and for the transform.
    expect(uv.map).not.toBe(xf.map)
    expect(uv.map?.channel).toBe(1)
  })

  it('a transcode fills its texture and every clone in place, and settled() waits for it', async () => {
    const held: HeldTranscode[] = []
    const { uv, xf, settled } = await parse(held)
    let done = false
    const waiting = settled().then(() => {
      done = true
    })
    const colour = transcoded()
    const normal = transcoded()
    held[0].resolve(colour)
    await Promise.resolve()
    expect(done).toBe(false)
    held[1].resolve(normal)
    await waiting
    expect(done).toBe(true)
    for (const map of [uv.map, xf.map]) {
      expect(map?.mipmaps).toBe(colour.mipmaps)
      expect(map?.format).toBe(RGBA_ASTC_4x4_Format)
      expect(map?.image).toEqual({ width: 4, height: 4 })
      expect(map?.version).toBeGreaterThan(0)
    }
    expect(uv.normalMap?.mipmaps).toBe(normal.mipmaps)
    // The parse's colour space wins where it set one (colour maps); the transcode's elsewhere.
    expect(uv.map?.colorSpace).toBe(SRGBColorSpace)
    expect(xf.map?.colorSpace).toBe(SRGBColorSpace)
    expect(uv.normalMap?.colorSpace).toBe(LinearSRGBColorSpace)
  })

  it('a failed transcode makes settled() reject', async () => {
    const held: HeldTranscode[] = []
    const { settled } = await parse(held)
    held[0].resolve(transcoded())
    held[1].reject(new Error('transcoder failed'))
    await expect(settled()).rejects.toThrow('transcoder failed')
  })
})
