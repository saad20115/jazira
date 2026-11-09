// Release guards + manifest for the web GLBs (run by compress.ps1 after compression; no dependencies).
//   node guard.mjs <web dir> <toktx version> <gltf-transform version>
// Fails (exit 1) when:
//   - a file is over its byte budget (tower 8,000,000 B, tower-lite 2,500,000 B),
//   - any texture is not KTX2 (a PNG/JPEG that slipped past the slot patterns),
//   - the GPU texture estimate is over its cap (tower 24 MB, tower-lite 12 MB).
// GPU estimate per texture, with a full mip chain (x 4/3), like gltf-transform inspect's gpuSize:
//   ETC1S (BasisLZ) 0.5 B/px (BC1/ETC2 RGB), UASTC 1 B/px (BC7/ASTC), anything else 4 B/px (RGBA8).
// Writes <web dir>/manifest.json with the files, budgets, textures and the decoder versions the site must self-host.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const [web, toktxVersion, gltfTransformVersion, outArg] = process.argv.slice(2);
const out = outArg || web;          // optional 4th arg: a build dir holding the GLBs (+ its own manifest.json)
const BUDGET = {
  'tower':      { bytes: 8_000_000, gpu: 24_000_000 },
  'tower-lite': { bytes: 2_500_000, gpu: 12_000_000 },
};
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function readGlb(file) {
  const buf = readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen + 8;
  return { buf, json, bin: buf.subarray(binStart) };
}

function ktx2Info(data) {
  // KTX2 header: identifier[12], vkFormat u32 @12, typeSize @16, pixelWidth @20, pixelHeight @24, ..., levelCount @40,
  // supercompressionScheme @44 (1 = BasisLZ/ETC1S, 2 = Zstd), dfdByteOffset @48. DFD colorModel byte @ dfd+12.
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const w = dv.getUint32(20, true), h = dv.getUint32(24, true), levels = dv.getUint32(40, true);
  const scheme = dv.getUint32(44, true), dfd = dv.getUint32(48, true);
  const model = dv.getUint8(dfd + 4 + 8);
  const codec = scheme === 1 ? 'ETC1S' : model === 166 ? 'UASTC' : 'KTX2-other';
  return { w, h, levels, codec, bpp: codec === 'ETC1S' ? 0.5 : codec === 'UASTC' ? 1 : 4 };
}

function pngSize(data) { return { w: data.readUInt32BE(16), h: data.readUInt32BE(20) }; }

const errors = [], files = [];
let cameraLimits = null;                          // mirrored from the full GLB scene extras (the site may read either)
for (const name of Object.keys(BUDGET)) {
  const file = join(out, `${name}.glb`);
  const { buf, json, bin } = readGlb(file);
  const textures = [];
  let gpu = 0;
  const seen = new Set();                            // several textures (samplers/transforms) may share one image
  for (const tex of json.textures || []) {
    const src = tex.extensions?.KHR_texture_basisu?.source ?? tex.source;
    if (seen.has(src)) continue;
    seen.add(src);
    const img = json.images[src];
    const bv = json.bufferViews[img.bufferView];
    const data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    let info;
    if (img.mimeType === 'image/ktx2') info = ktx2Info(data);
    else {
      const s = img.mimeType === 'image/png' ? pngSize(data) : { w: 0, h: 0 };
      info = { ...s, levels: 1, codec: img.mimeType, bpp: 4 };
      errors.push(`${name}: texture "${img.name}" is ${img.mimeType}, not KTX2`);
    }
    const g = Math.round(info.w * info.h * info.bpp * 4 / 3);
    gpu += g;
    textures.push({ name: img.name, codec: info.codec, size: [info.w, info.h], bytes: bv.byteLength, gpuEstimate: g });
  }
  const sceneExtras = json.scenes?.[json.scene ?? 0]?.extras || {};
  if (name === "tower") cameraLimits = sceneExtras.camera_limits ?? null;
  if (!sceneExtras.camera_limits) errors.push(`${name}: scene extras carry no camera_limits`);
  let tris = 0;
  for (const m of json.meshes) for (const p of m.primitives) {
    const a = p.indices !== undefined ? json.accessors[p.indices] : json.accessors[p.attributes.POSITION];
    tris += a.count / 3;
  }
  const b = BUDGET[name];
  if (buf.length > b.bytes) errors.push(`${name}: ${buf.length} B > ${b.bytes} B budget`);
  if (gpu > b.gpu) errors.push(`${name}: GPU texture estimate ${gpu} B > ${b.gpu} B cap`);
  console.log(`GUARD ${name}: ${buf.length} B (budget ${b.bytes}), GPU textures ~${(gpu / 1e6).toFixed(2)} MB (cap ${b.gpu / 1e6} MB), ` +
              `${textures.length} textures, all KTX2: ${textures.every((t) => !t.codec.startsWith('image/'))}`);
  files.push({ file: `${name}.glb`, bytes: buf.length, sha256: sha256(buf), budgetBytes: b.bytes,
               gpuTextureEstimate: gpu, gpuTextureCap: b.gpu, trianglesStored: tris,
               extensionsUsed: json.extensionsUsed, extensionsRequired: json.extensionsRequired, textures });
}

const three = join(web, 'viewer-test', 'node_modules', 'three');
const basis = join(three, 'examples', 'jsm', 'libs', 'basis');
const meshopt = join(three, 'examples', 'jsm', 'libs', 'meshopt_decoder.module.js');
const manifest = {
  generated: new Date().toISOString(),
  files,
  camera_limits: cameraLimits,
  runtime: {
    three: JSON.parse(readFileSync(join(three, 'package.json'), 'utf8')).version,
    basisTranscoder: {
      source: 'three/examples/jsm/libs/basis (bundled with this three version; self-host these exact files, no CDN)',
      note: 'the transcoder build carries no upstream version string; identify it by three version + hashes',
      'basis_transcoder.js': sha256(readFileSync(join(basis, 'basis_transcoder.js'))),
      'basis_transcoder.wasm': sha256(readFileSync(join(basis, 'basis_transcoder.wasm'))),
    },
    meshoptDecoder: {
      source: 'three/examples/jsm/libs/meshopt_decoder.module.js',
      build: (readFileSync(meshopt, 'utf8').match(/Built from (meshoptimizer [\d.]+)/) || [])[1] || 'unknown',
      sha256: sha256(readFileSync(meshopt)),
    },
  },
  tools: { gltfTransform: gltfTransformVersion, toktx: toktxVersion },
  // v021 N-6: the live look the stills were matched with (viewer-test/index.html does exactly this)
  render: {
    tone_mapping: { live: "THREE.AgXToneMapping + Blender's 'Medium High Contrast' look patched into three's AgX (AgX-log contrast 1.2 about pivot 0.606, a CALIBRATED value = AgX-log mid-grey, not OCIO's 0.4; viewer override ?piv=, before the sigmoid), toneMappingExposure 1, outputColorSpace SRGB (applied once, in OutputPass)",
                    cycles: "AgX, look 'Medium High Contrast', exposure 0, gamma 1 (the stills)",
                    note: "pivot: OCIO's log pivot (-0.2 -> 0.4) brightened live by +18 luma vs the stills, mid-grey matches them (thirds within 1-8); the GLB emissive strengths / site light were calibrated by luma against the Cycles stills under these settings" },
    environment: 'v022 studio (scene extras.studio; there is no extras.sky, no CITY_card, no fog): scene.environment = PMREMGenerator.fromScene(a scene holding copies of extras.studio.room and every extras.studio.env_only node at their world matrices, plus, at night, the extras.studio.night_glow sphere; near 1, far 3000, position extras.studio.env_position). scene.background = null: the room mesh is the visible background (clear colour #d8d8d6 day / #1b2130 night). env_only nodes and the glow sphere are NEVER drawn in the main view. Never a flat colour. (v020 / v021: extras.sky -> float equirect.)',
    studio: { note: 'v022 studio maquette (owner 2026-10-25), mode = extras.studio.mode. day (v022): white daylight studio, bloom off, window / lobby emission a daytime glimmer. night (v022n, the owner-adopted release): the studio dimmed cool; extras.studio.moon = one THREE.DirectionalLight(color, intensity) along direction_to_light (Cycles light-links it to the model only: the lightmapped room / plinth / site have black base colour, so it cannot light them twice); extras.studio.night_glow = an env-only inward sphere, unlit colour = color x gain x mix(min, 1, smoothstep(height_from, height_to, y)), the dark-navy sheen of the glass; bloom = extras.studio.bloom on tower.glb, off on tower-lite.glb. Both: renderer.toneMappingExposure = 2 ** extras.studio.exposure_stops; extras.turntable: rotate the root node (it carries ARCH_*, SITE, SYS_*, plinth) about +Y while idle, ease back to 0 before a system entry; camera_limits.hero_shift_y replaces the hard-coded 0.227. Full schema: extras-schema.md.' },
    city: { note: 'v022 city attempt (superseded by the studio maquette; kept for reference): the Cycles stills had a full procedural city; the GLB carried a light backdrop only',
            CITY_card: '700 m cylinder round PIVOT_hero, KHR_materials_unlit, alphaMode BLEND, tex_city_band (4096 x 512 full / 2048 x 256 lite: 360 deg x latitude -20..+15 deg), baked from the stills city beyond 235 m',
            CITY_ring: '34 low blocks at 150-228 m, one instanced unit box (EXT_mesh_gpu_instancing), unlit, tex_city_ring toned from the band',
            SITE_ground: 'radius 240 m, MAT_ground_live: unlit, alpha BLEND, tex_city_ground (1024 full / 512 lite) = a top-down Cycles render of the stills city ground (streets, lamp pools, cars, tree canopies), alpha fades 205 -> 240 m' },
    bloom: { pass: 'UnrealBloomPass on a HalfFloat, 4x MSAA EffectComposer target, before OutputPass', threshold: 8.0, strength: 0.22, radius: 0.25,
             note: 'linear HDR threshold above the lit office windows: only the light sources (crown LED line, lamps, lobby, uplit pilaster bases, trails) bloom' },
    interior_mapping: { tiers: ['full'], materials: ['MAT_glass_cw', 'MAT_glass_wing', 'MAT_glass_side', 'MAT_glass_terrace'],
                        grid: '64 x 24 modules over the emissive UV (1.2 x 3.6 m; v runs down the facade)', window_band: [0.12, 0.74],
                        room: { depth_m: 7.0, head_above_sill_m: 2.23, floor_below_sill_m: 0.75 },
                        note: 'ray traced into an open-plan room per fragment, hit mapped back onto the band of tex_cw_emit (onBeforeCompile on emissivemap_fragment); lite keeps the baked room picture (ceiling-panel perspective = the depth cue)' },
  },
};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
if (errors.length) { console.error('GUARD FAILED:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('GUARD OK -> manifest.json');
