/**
 * KHR_texture_basisu without blob URLs (CSP H3 `connect-src 'self'`).
 *
 * three's GLTFLoader turns every GLB-embedded KTX2 image into a `blob:` URL and lets KTX2Loader
 * `fetch()` it, which the public CSP blocks (`connect-src` has no `blob:`). This plugin replaces the
 * built-in one (GLTFLoader keys plugins by extension name, so a registered plugin of the same name
 * wins) and hands the embedded bytes straight to `KTX2Loader.parse()`; transcoding still runs in the
 * KTX2 worker (`worker-src 'self' blob:`, H3a). Texture setup mirrors `GLTFParser.loadTextureImage`
 * of three 0.186.1 (flipY, name, sampler filters and wrapping, association).
 */

import {
  type CompressedTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  type MagnificationTextureFilter,
  type MinificationTextureFilter,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,
  type Texture,
  type Wrapping,
} from 'three'
import type { GLTFLoaderPlugin, GLTFParser } from 'three/addons/loaders/GLTFLoader.js'
import type { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

const EXTENSION = 'KHR_texture_basisu'

const MAG_FILTERS: Readonly<Record<number, MagnificationTextureFilter>> = {
  9728: NearestFilter,
  9729: LinearFilter,
}

const MIN_FILTERS: Readonly<Record<number, MinificationTextureFilter>> = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipmapNearestFilter,
  9985: LinearMipmapNearestFilter,
  9986: NearestMipmapLinearFilter,
  9987: LinearMipmapLinearFilter,
}

const WRAPPINGS: Readonly<Record<number, Wrapping>> = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping,
}

interface TextureDef {
  name?: string
  sampler?: number
  extensions?: Record<string, { source?: number } | undefined>
}
interface ImageDef {
  name?: string
  bufferView?: number
  mimeType?: string
}
interface SamplerDef {
  magFilter?: number
  minFilter?: number
  wrapS?: number
  wrapT?: number
}
interface GltfJsonSubset {
  textures?: TextureDef[]
  images?: ImageDef[]
  samplers?: SamplerDef[]
}

function parseKtx2(loader: KTX2Loader, buffer: ArrayBuffer): Promise<CompressedTexture> {
  return new Promise((resolve, reject) => {
    loader.parse(buffer, resolve, reject)
  })
}

export function inlineBasisuPlugin(ktx2: KTX2Loader): (parser: GLTFParser) => GLTFLoaderPlugin {
  return (parser) => ({
    name: EXTENSION,
    loadTexture(textureIndex: number): Promise<Texture> | null {
      const json = parser.json as GltfJsonSubset
      const textureDef = json.textures?.[textureIndex]
      const source = textureDef?.extensions?.[EXTENSION]?.source
      if (!textureDef || source === undefined) {
        return null
      }
      const imageDef = json.images?.[source]
      if (imageDef?.bufferView === undefined) {
        // The release embeds every texture; an external KTX2 URI is not part of the contract.
        return Promise.reject(new Error(`${EXTENSION}: image ${String(source)} is not embedded`))
      }
      const sampler =
        (textureDef.sampler !== undefined && json.samplers?.[textureDef.sampler]) || {}
      return (parser.getDependency('bufferView', imageDef.bufferView) as Promise<ArrayBuffer>)
        .then((bufferView) => parseKtx2(ktx2, bufferView.slice(0)))
        .then((texture) => {
          texture.flipY = false
          texture.name = textureDef.name ?? imageDef.name ?? ''
          texture.magFilter =
            (sampler.magFilter !== undefined && MAG_FILTERS[sampler.magFilter]) || LinearFilter
          texture.minFilter =
            (sampler.minFilter !== undefined && MIN_FILTERS[sampler.minFilter]) ||
            LinearMipmapLinearFilter
          texture.wrapS =
            (sampler.wrapS !== undefined && WRAPPINGS[sampler.wrapS]) || RepeatWrapping
          texture.wrapT =
            (sampler.wrapT !== undefined && WRAPPINGS[sampler.wrapT]) || RepeatWrapping
          texture.generateMipmaps = false
          texture.userData.mimeType = imageDef.mimeType ?? 'image/ktx2'
          parser.associations.set(texture, { textures: textureIndex })
          return texture
        })
    },
  })
}
