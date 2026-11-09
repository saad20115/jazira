// Test-only sink for viewer frames: POST /save?name=<file>.png (body = PNG) -> C:\aljazira-3d\renders\r4\live\<file>.png
//   node save-server.mjs        (listens on 127.0.0.1:8091, CORS open for the local viewer)
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const OUT = 'C:\\aljazira-3d\\renders\\r4\\live';
mkdirSync(OUT, { recursive: true });
createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', '*'); res.end(); return; }
  const url = new URL(req.url, 'http://x');
  if (req.method !== 'POST' || url.pathname !== '/save') { res.statusCode = 404; res.end(); return; }
  const name = basename(url.searchParams.get('name') || 'frame.png').replace(/[^\w.-]/g, '_');
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const file = join(OUT, name.endsWith('.png') ? name : name + '.png');
    writeFileSync(file, Buffer.concat(chunks));
    res.end(file);
    console.log('saved', file);
  });
}).listen(8091, '127.0.0.1', () => console.log('save-server on 127.0.0.1:8091 ->', OUT));
