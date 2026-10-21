// Architectural night render of an MEP tower for the Al Jazira website.
// Shared by the offline renderer (render.html) and the live 3D artifact.
export function buildScene(THREE, { RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }, renderer, opts = {}) {
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  // ---------- sky (screen-space gradient) ----------
  const sky = document.createElement('canvas'); sky.width = 4; sky.height = 512;
  { const g = sky.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#030a1a'); gr.addColorStop(0.45, '#0a1b3a'); gr.addColorStop(0.72, '#1d3560'); gr.addColorStop(0.86, '#4b4a63'); gr.addColorStop(1, '#a8743f');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 512); }
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = opts.transparent ? null : skyTex;
  scene.fog = new THREE.FogExp2(0x101f3d, 0.0026);

  // ---------- environment for reflections ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSphere = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 top=vec3(0.02,0.05,0.12); vec3 mid=vec3(0.12,0.2,0.36); vec3 hor=vec3(0.85,0.55,0.3); vec3 c = h>0.0 ? mix(mid, top, pow(h,0.6)) : mix(mid*0.4, vec3(0.03), -h); c = mix(c, hor, exp(-abs(h)*14.0)*0.9); gl_FragColor = vec4(c,1.0); }'
  }));
  envScene.add(envSphere);
  const panel = (w, h, col, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
  panel(60, 10, 0xffc58a, 80, 6, 30); panel(40, 8, 0x8fb4ff, -70, 30, -40); panel(30, 30, 0x334a70, 0, 80, 0);
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0x6b86b8, 0x1a1410, 0.45));
  const key = new THREE.DirectionalLight(0xffc28a, 1.35); key.position.set(160, 70, 90); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -110, right: 110, top: 130, bottom: -40, near: 20, far: 420 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.04;
  scene.add(key);
  const moon = new THREE.DirectionalLight(0x9db7ff, 0.55); moon.position.set(-120, 140, -80); scene.add(moon);

  // ---------- materials ----------
  const M = {
    asphalt: new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.92 }),
    curb: new THREE.MeshStandardMaterial({ color: 0x5b6270, roughness: 0.8 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x9aa3b1, roughness: 0.6, metalness: 0.2 }),
    spandrel: new THREE.MeshStandardMaterial({ color: 0x1a2536, roughness: 0.35, metalness: 0.7 }),
    mullion: new THREE.MeshStandardMaterial({ color: 0x7c8796, roughness: 0.28, metalness: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd2a043, roughness: 0.28, metalness: 1.0, envMapIntensity: 1.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x24456e, roughness: 0.04, metalness: 0.85, envMapIntensity: 1.7, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.58 }),
    interiorDark: new THREE.MeshStandardMaterial({ color: 0x0b1424, roughness: 0.9 }),
    lit: new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc77a, emissiveIntensity: 1.25, roughness: 0.9 }),
    litCool: new THREE.MeshStandardMaterial({ color: 0xe6f0ff, emissive: 0xcfe1ff, emissiveIntensity: 1.0, roughness: 0.9 }),
    lobby: new THREE.MeshStandardMaterial({ color: 0xffe0a6, emissive: 0xffb860, emissiveIntensity: 1.1 }),
    led: new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffc04d, emissiveIntensity: 3.0 }),
    plant: new THREE.MeshStandardMaterial({ color: 0x9aa4b2, roughness: 0.5, metalness: 0.5 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x24533d, roughness: 0.85 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x3b2d22, roughness: 0.9 }),
    city: new THREE.MeshStandardMaterial({ color: 0x101a2b, roughness: 0.6, metalness: 0.4 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd590, emissiveIntensity: 4 }),
    tail: new THREE.MeshStandardMaterial({ color: 0xff5a4a, emissive: 0xff3a2a, emissiveIntensity: 3 }),
    head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dd, emissiveIntensity: 3 }),
    car: new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.45, metalness: 0.4, envMapIntensity: 0.5 })
  };

  const add = (geo, mat, x, y, z, { cast = true, recv = true } = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, o) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, o);
  const inst = (geo, mat, list, { cast = false } = {}) => { const im = new THREE.InstancedMesh(geo, mat, list.length); const o = new THREE.Object3D();
    list.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.set(0, t[6] || 0, 0); o.scale.set(t[3] || 1, t[4] || 1, t[5] || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = cast; im.receiveShadow = true; scene.add(im); return im; };

  // ---------- ground, plaza, road ----------
  const ground = add(new THREE.PlaneGeometry(1600, 1600), M.asphalt, 0, 0, 0, { cast: false }); ground.rotation.x = -Math.PI / 2;
  const tiles = document.createElement('canvas'); tiles.width = tiles.height = 256;
  { const g = tiles.getContext('2d'); g.fillStyle = '#3a414d'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#2a3039'; g.lineWidth = 3;
    for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(255,255,255,${0.02 + 0.03 * Math.random()})`; g.fillRect((Math.random() * 8 | 0) * 32, (Math.random() * 8 | 0) * 32, 32, 32); } }
  const tileTex = new THREE.CanvasTexture(tiles); tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(14, 14); tileTex.colorSpace = THREE.SRGBColorSpace; tileTex.anisotropy = 8;
  const plaza = add(new THREE.CircleGeometry(48, 96), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.62, metalness: 0.15, envMapIntensity: 0.8 }), 0, 0.05, 0, { cast: false }); plaza.rotation.x = -Math.PI / 2;
  const curb = add(new THREE.RingGeometry(48, 49.2, 128), M.curb, 0, 0.08, 0, { cast: false }); curb.rotation.x = -Math.PI / 2;
  const goldRing = add(new THREE.RingGeometry(44.6, 45, 160), M.led, 0, 0.1, 0, { cast: false }); goldRing.rotation.x = -Math.PI / 2;
  const dashes = []; for (let a = 0; a < 360; a += 3) { const r = 58, t = a * Math.PI / 180; dashes.push([Math.cos(t) * r, 0.07, Math.sin(t) * r, 1, 1, 1, -t]); }
  inst(new THREE.BoxGeometry(0.25, 0.02, 1.8), new THREE.MeshStandardMaterial({ color: 0xd8dde6, emissive: 0x333333 }), dashes);

  // ---------- tower ----------
  const FH = 3.6, PODIUM = 8;
  const LOW = { w: 22, d: 16, floors: 17, y0: PODIUM };
  const UP = { w: 18, d: 13, floors: 7, y0: PODIUM + 17 * FH };
  const TOP = UP.y0 + UP.floors * FH;
  const mullions = [], litCells = [], coolCells = [], darkCells = [], spandrels = [];
  function shaft(S) {
    const H = S.floors * FH, yc = S.y0 + H / 2;
    box(S.w - 1.6, H, S.d - 1.6, M.interiorDark, 0, yc, 0, { cast: false });           // core / interior volume
    const faces = [[0, S.d / 2, S.w, 0], [0, -S.d / 2, S.w, Math.PI], [S.w / 2, 0, S.d, Math.PI / 2], [-S.w / 2, 0, S.d, -Math.PI / 2]];
    for (const [fx, fz, len, rot] of faces) {
      const g = box(len, H, 0.12, M.glass, fx, yc, fz, { cast: false, recv: false }); g.rotation.y = rot; g.renderOrder = 2;
      const n = Math.round(len / 1.5), step = len / n;
      const dirx = Math.cos(rot), dirz = -Math.sin(rot), nx = Math.sin(rot), nz = Math.cos(rot);
      for (let k = 0; k <= n; k++) { const t = -len / 2 + k * step; mullions.push([fx + dirx * t + nx * 0.15, yc, fz + dirz * t + nz * 0.15, 1, H, 1, rot]); }
      for (let f = 0; f < S.floors; f++) {
        const y = S.y0 + f * FH + FH * 0.55;
        spandrels.push([fx + nx * 0.12, S.y0 + f * FH + 0.25, fz + nz * 0.12, len, 1, 1, rot]);
        for (let k = 0; k < n; k++) { const t = -len / 2 + (k + 0.5) * step; const p = [fx + dirx * t - nx * 0.55, y, fz + dirz * t - nz * 0.55, step * 0.92, FH * 0.78, 1, rot];
          const r = rand(); (r < 0.34 ? litCells : r < 0.44 ? coolCells : darkCells).push(p); }
      }
    }
    for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) box(0.7, H + 0.4, 0.7, M.gold, cx * (S.w / 2 + 0.1), yc, cz * (S.d / 2 + 0.1));
    box(S.w + 0.6, 0.5, S.d + 0.6, M.slab, 0, S.y0 + H + 0.25, 0);
  }
  shaft(LOW); shaft(UP);
  inst(new THREE.BoxGeometry(0.16, 1, 0.3), M.mullion, mullions);
  inst(new THREE.BoxGeometry(1, 0.55, 0.2), M.spandrel, spandrels);
  const litIM = inst(new THREE.BoxGeometry(1, 1, 0.08), M.lit, litCells);
  { const c = new THREE.Color(); litCells.forEach((_, i) => { const k = 0.45 + rand() * 0.55; c.setRGB(k, k * (0.92 + rand() * 0.08), k * (0.8 + rand() * 0.2)); litIM.setColorAt(i, c); }); litIM.instanceColor.needsUpdate = true; }
  inst(new THREE.BoxGeometry(1, 1, 0.08), M.litCool, coolCells);
  inst(new THREE.BoxGeometry(1, 1, 0.08), M.interiorDark, darkCells);
  // setback terrace + crown with gold louvers and LED band
  box(LOW.w - 0.6, 1.1, 0.25, M.gold, 0, UP.y0 + 0.55, LOW.d / 2);
  const crownH = 9, louvers = [];
  for (const [fx, fz, len, rot] of [[0, UP.d / 2, UP.w, 0], [0, -UP.d / 2, UP.w, 0], [UP.w / 2, 0, UP.d, Math.PI / 2], [-UP.w / 2, 0, UP.d, Math.PI / 2]]) {
    const n = Math.round(len / 0.9); for (let k = 0; k <= n; k++) { const t = -len / 2 + k * len / n; louvers.push([fx + Math.cos(rot) * t, TOP + crownH / 2, fz - Math.sin(rot) * t, 1, 1, 1, rot]); } }
  inst(new THREE.BoxGeometry(0.12, crownH, 0.6), M.gold, louvers, { cast: true });
  box(UP.w + 0.4, 0.35, UP.d + 0.4, M.led, 0, TOP + crownH + 0.2, 0, { cast: false });
  box(UP.w - 3, 2.6, UP.d - 4, M.plant, 0, TOP + 1.3, 0);                                   // rooftop chillers inside crown
  for (const x of [-5, 0, 5]) add(new THREE.CylinderGeometry(1.4, 1.4, 0.4, 24), M.spandrel, x, TOP + 2.8, 0);

  // ---------- podium ----------
  const PW = 36, PD = 28;
  box(PW + 2, 0.6, PD + 2, M.slab, 0, 0.3, 0);
  box(PW, PODIUM - 1.2, PD, M.lobby, 0, PODIUM / 2, 0, { cast: false });
  const pg = box(PW + 0.2, PODIUM - 1.2, PD + 0.2, M.glass, 0, PODIUM / 2, 0, { cast: false, recv: false }); pg.renderOrder = 2;
  const pm = []; for (let x = -PW / 2; x <= PW / 2 + 0.01; x += 2.25) { pm.push([x, PODIUM / 2, PD / 2 + 0.15, 1, PODIUM - 1.2, 1, 0]); pm.push([x, PODIUM / 2, -PD / 2 - 0.15, 1, PODIUM - 1.2, 1, 0]); }
  for (let z = -PD / 2; z <= PD / 2 + 0.01; z += 2.33) { pm.push([PW / 2 + 0.15, PODIUM / 2, z, 1, PODIUM - 1.2, 1, Math.PI / 2]); pm.push([-PW / 2 - 0.15, PODIUM / 2, z, 1, PODIUM - 1.2, 1, Math.PI / 2]); }
  inst(new THREE.BoxGeometry(0.18, 1, 0.3), M.mullion, pm);
  box(PW + 1.6, 1.0, PD + 1.6, M.slab, 0, PODIUM - 0.4, 0);
  for (const [w, d, x, z] of [[PW + 1.9, 0.3, 0, PD / 2 + 0.95], [PW + 1.9, 0.3, 0, -PD / 2 - 0.95], [0.3, PD + 1.9, PW / 2 + 0.95, 0], [0.3, PD + 1.9, -PW / 2 - 0.95, 0]]) box(w, 0.9, d, M.gold, x, PODIUM - 0.4, z, { recv: false });
  box(16, 0.6, 7, M.spandrel, 0, 5.2, PD / 2 + 3.5); box(16.2, 0.25, 0.25, M.gold, 0, 5.2, PD / 2 + 7);                                           // entrance canopy
  for (const x of [-7, 7]) add(new THREE.CylinderGeometry(0.3, 0.3, 4.9, 16), M.mullion, x, 2.45, PD / 2 + 6.5);
  // podium roof plant: water tanks and AHUs
  for (const x of [9, 13]) add(new THREE.CylinderGeometry(1.6, 1.6, 3.4, 28), M.plant, x, PODIUM + 2, -10);
  box(5, 2.2, 3.2, M.plant, -12, PODIUM + 1.4, -10);
  // substation + generator yard
  box(7, 3.2, 5, M.plant, 30, 1.6, -22); box(7.2, 0.25, 5.2, M.spandrel, 30, 3.3, -22);

  // ---------- trees, lamps, cars ----------
  const trunks = [], crowns = [], lamps = [], heads = [];
  for (let a = 0; a < 360; a += 11) { const t = a * Math.PI / 180, r = 42 + (rand() - 0.5) * 2; if (Math.abs(Math.sin(t) - 1) < 0.08) continue;
    trunks.push([Math.cos(t) * r, 1.2, Math.sin(t) * r, 1, 1, 1]); const s = 1 + rand() * 0.5; crowns.push([Math.cos(t) * r, 3.6 + s * 0.4, Math.sin(t) * r, s, s * 1.05, s]); }
  for (let a = 0; a < 360; a += 30) { const t = (a + 15) * Math.PI / 180, r = 50.5; lamps.push([Math.cos(t) * r, 3.2, Math.sin(t) * r, 1, 1, 1]); heads.push([Math.cos(t) * r, 6.6, Math.sin(t) * r, 1, 1, 1]); }
  inst(new THREE.CylinderGeometry(0.28, 0.36, 2.4, 8), M.trunk, trunks);
  inst(new THREE.IcosahedronGeometry(2.1, 1), M.leaf, crowns, { cast: true });
  inst(new THREE.CylinderGeometry(0.1, 0.12, 6.4, 8), M.mullion, lamps);
  inst(new THREE.SphereGeometry(0.42, 12, 8), M.lamp, heads);
  for (let a = 0; a < 360; a += 60) { const t = (a + 15) * Math.PI / 180; const pl = new THREE.PointLight(0xffc98a, 30, 26, 1.8); pl.position.set(Math.cos(t) * 50, 6, Math.sin(t) * 50); scene.add(pl); }
  const cars = [], tails = [], hls = [];
  for (let k = 0; k < 14; k++) { const t = rand() * Math.PI * 2, lane = rand() < 0.5 ? 55.5 : 60.5, rot = -t + (lane > 58 ? Math.PI : 0);
    const x = Math.cos(t) * lane, z = Math.sin(t) * lane; cars.push([x, 0.75, z, 1, 1, 1, rot]);
    const fx = Math.sin(rot) * 2.2, fz = Math.cos(rot) * 2.2; hls.push([x + fx, 0.8, z + fz, 1, 1, 1, rot]); tails.push([x - fx, 0.8, z - fz, 1, 1, 1, rot]); }
  inst(new THREE.BoxGeometry(1.9, 1.3, 4.4), M.car, cars, { cast: true });
  inst(new THREE.BoxGeometry(1.6, 0.25, 0.12), M.head, hls); inst(new THREE.BoxGeometry(1.6, 0.25, 0.12), M.tail, tails);

  // ---------- city context ----------
  const win = document.createElement('canvas'); win.width = 64; win.height = 256;
  { const g = win.getContext('2d'); g.fillStyle = '#0c1526'; g.fillRect(0, 0, 64, 256);
    for (let y = 4; y < 256; y += 8) for (let x = 3; x < 64; x += 6) if (Math.random() < 0.28) { g.fillStyle = Math.random() < 0.7 ? '#ffcf86' : '#cfe0ff'; g.globalAlpha = 0.4 + Math.random() * 0.6; g.fillRect(x, y, 3, 4); } }
  const winTex = new THREE.CanvasTexture(win); winTex.colorSpace = THREE.SRGBColorSpace;
  const cityMat = new THREE.MeshStandardMaterial({ color: 0x0f1828, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.9, roughness: 0.6, metalness: 0.3 });
  for (let k = 0; k < 90; k++) { const t = rand() * Math.PI * 2, r = 330 + rand() * 260, h = 30 + rand() * rand() * 200, w = 12 + rand() * 18;
    const m = box(w, h, w * (0.7 + rand() * 0.6), cityMat, Math.cos(t) * r, h / 2, Math.sin(t) * r, { cast: false }); m.rotation.y = rand() * Math.PI; }

  // ---------- camera & post ----------
  const camera = new THREE.PerspectiveCamera(opts.fov || 24, 1, 1, 2500);
  const target = new THREE.Vector3(0, 49, 0);
  const R = 312, ELEV = 0.2;
  function setAngle(deg) { const t = (deg + 35) * Math.PI / 180; camera.position.set(Math.cos(t) * R * Math.cos(ELEV), target.y + R * Math.sin(ELEV), Math.sin(t) * R * Math.cos(ELEV)); camera.lookAt(target); }
  setAngle(0);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.7, 0.5, 0.82); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const anchors = {
    1: new THREE.Vector3(0, TOP + crownH + 2, 0),           // HVAC – rooftop chillers
    2: new THREE.Vector3(LOW.w / 2, PODIUM + 9 * FH, LOW.d / 2), // fire riser / sprinklers
    3: new THREE.Vector3(11, PODIUM + 4.2, -10),            // water tanks
    4: new THREE.Vector3(28, 5, -20),                       // power – substation
    5: new THREE.Vector3(0, 6, PD / 2 + 3.5)                // ELV/BMS – lobby
  };
  function resize(w, h) { renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  return { scene, camera, target, composer, setAngle, anchors, resize, R, ELEV };
}
