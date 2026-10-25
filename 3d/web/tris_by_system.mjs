// Triangles stored in a GLB, per top-level group (SYS_<s>, ARCH_*, SITE ...), from the glTF JSON (no dependencies).
//   node tris_by_system.mjs <file.glb> [...]
import { readFileSync } from 'node:fs';

for (const file of process.argv.slice(2)) {
  const buf = readFileSync(file);
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
  const meshTris = (m) => json.meshes[m].primitives.reduce((t, p) => {
    const a = json.accessors[p.indices !== undefined ? p.indices : p.attributes.POSITION];
    return t + a.count / 3;
  }, 0);
  const groups = {}; const seen = new Set();
  const walk = (n, group) => {
    const node = json.nodes[n];
    const g = group || (/^(SYS_|ARCH_|SITE|LIGHTS|CAMERAS)/.test(node.name || '') ? node.name : null);
    if (node.mesh !== undefined && !seen.has(node.mesh)) {          // stored = unique meshes
      seen.add(node.mesh); groups[g || 'other'] = (groups[g || 'other'] || 0) + meshTris(node.mesh);
    }
    for (const c of node.children || []) walk(c, g);
  };
  for (const n of json.scenes[json.scene ?? 0].nodes) walk(n, null);
  const total = Object.values(groups).reduce((a, b) => a + b, 0);
  console.log(`TRIS ${file}: total ${total}`);
  for (const [g, t] of Object.entries(groups).sort()) console.log(`  ${g.padEnd(14)} ${t}`);
}
