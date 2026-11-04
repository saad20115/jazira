// read-only pixel column/row transition dump. usage: node p3t9-col.mjs file x|y=N from to [thr]
import { createRequire } from 'node:module'; const sharp = createRequire('D:/jazira-verify/2026-11-05/ag-pages2/package.json')('sharp');
const [file, axis, from, to, thr='12'] = process.argv.slice(2);
const [a, v] = axis.split('=');
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * 3; return [data[i], data[i+1], data[i+2]]; };
let prev = null, out = [];
for (let t = +from; t <= +to; t++) {
  const c = a === 'x' ? px(+v, t) : px(t, +v);
  if (!prev || Math.abs(c[0]-prev[0])+Math.abs(c[1]-prev[1])+Math.abs(c[2]-prev[2]) > +thr) out.push(`${t}:${c.join(',')}`);
  prev = c;
}
console.log(info.width + 'x' + info.height, out.join('  '));
