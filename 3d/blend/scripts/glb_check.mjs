// node glb_check.mjs <file.glb> — summary of the GLB JSON chunk (no dependencies).
import { readFileSync } from 'node:fs';
const buf = readFileSync(process.argv[2]);
const len = buf.readUInt32LE(12);
const j = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'));
const tris = (j.meshes || []).reduce((s, m) => s + m.primitives.reduce((t, p) =>
  t + (p.indices !== undefined ? j.accessors[p.indices].count : j.accessors[p.attributes.POSITION].count) / 3, 0), 0);
const blend = j.materials.filter(m => m.alphaMode === 'BLEND').map(m => m.name);
const variants = j.extensions?.KHR_materials_variants?.variants?.map(v => v.name) || [];
const mapped = j.meshes.filter(m => m.primitives.some(p => p.extensions?.KHR_materials_variants)).map(m => m.name);
const extras = j.nodes.filter(n => n.extras).map(n => `${n.name}: ${JSON.stringify(n.extras)}`);
const cams = j.nodes.filter(n => n.camera !== undefined).map(n => `${n.name} yfov=${(j.cameras[n.camera].perspective.yfov * 180 / Math.PI).toFixed(2)}°`);
const occ = [...new Set(j.materials.filter(m => m.occlusionTexture).map(m => `texCoord ${m.occlusionTexture.texCoord ?? 0}`))];
console.log(JSON.stringify({ bytes: buf.length, triangles: tris, nodes: j.nodes.length, meshes: j.meshes.length,
  materials: j.materials.length, textures: (j.textures || []).length, blendMaterials: blend, variants,
  meshesWithVariants: mapped.length, occlusionTexCoords: occ, cameras: cams, extras }, null, 1));
