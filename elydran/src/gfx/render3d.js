// Renderizador 3D do ELYDRAN (Three.js). A lógica do jogo continua em 2D (x, y em pixels); aqui cada ponto vira X = x/16, Z = y/16.
import * as THREE from './three.js';
import { TILE, VIEW_W, VIEW_H, FONT } from '../config.js';
import { T } from '../world/maps.js';
import * as M from './models3d.js';
import { add, pivot, blob, glow, glowMat, std, geo, yawOf, DIR_ANGLE } from './models3d.js';

const U = 1 / TILE;
const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
const TREE_COL = {
  green: ['#173d24', '#24602e', '#33803a', '#4ea044', '#7cc35a'], dark: ['#0f2a1f', '#173f2c', '#22553a', '#2f6e47', '#4d8f5c'],
  autumn: ['#4a2a12', '#8a4a1a', '#c8742a', '#e8a23a', '#ffd37a'], pink: ['#5a2246', '#9a3a72', '#d0609a', '#f08ab8', '#ffc2dc'], pine: ['#0f2a22', '#174033', '#1f5944', '#2c7457', '#4c9a72'],
  snow: ['#4a6a88', '#7a9ab8', '#b0c8de', '#dcebf8', '#ffffff'], frost: ['#2c5a78', '#4e8aaa', '#82bcd8', '#b8e4f4', '#eaffff'],
  dry: ['#6a5a2a', '#8a7a38', '#a89a48', '#c4b45a', '#dccc72'], palm: ['#5a3a1a', '#3a7a2a', '#4e9a38', '#6ab84a', '#9ad86a'],
  ash: ['#1a1412', '#2a201c', '#3a2e28', '#4e403a', '#665650'], dead: ['#2a2018', '#3a2e22', '#4a3c2c', '#5a4a38', '#6a5a46'],
  swamp: ['#24301c', '#34441f', '#46582a', '#586c36', '#6c8244'], void: ['#1a0c28', '#2c1444', '#442264', '#663a8c', '#9a62c0']
};
const PINE = new Set(['pine', 'snow', 'frost', 'ash']);
const GRASSPAL = {
  day: ['#3f9a3a', '#62b84c', '#8fd865', '#56a845'], forest: ['#2f6f3c', '#438f4a', '#62b25a', '#3a7a3a'], ice: ['#e8f2fc', '#d6e6f6', '#f6fbff', '#c0d6ec'],
  desert: ['#c8a85a', '#d8bc6e', '#b89848', '#e0c880'], volcano: ['#4a3430', '#5a403a', '#3a2a26', '#6a4a40'], swamp: ['#5a7a34', '#6a8a3e', '#4a6a2c', '#7a9a48'],
  corrupt: ['#5a3a7a', '#7a4aa0', '#4a2c66', '#9a60c0'], sky: ['#6ac86a', '#8ae07a', '#52b45a', '#a4ee8e']
};
const PILC = { stone: ['#8c88a0', '#aaa6bc'], rock: ['#6a5a4a', '#8a7a66'], ice: ['#7ac0e0', '#c0eaff'], gold: ['#b8903c', '#e8c470'], dark: ['#2e2238', '#54406a'] };
const VOIDY = new Set(['sanctuary', 'sky']);
const ROOF = { red: ['#6a1e1a', '#a83a2a', '#d0583a'], blue: ['#1a2a4a', '#2f4f7a', '#4a72a8'], green: ['#1f3a22', '#2f5a34', '#4a7a46'], gold: ['#6a4a12', '#b8862a', '#e8b64a'] };
// aparência de cada região
const ENV = {
  day: { bg: '#cfe8ff', sky: ['#4f9fe8', '#9ccff5', '#e6f3ff'], fog: [40, 120], hemi: ['#e4f2ff', '#7a9a58', 1.5], sun: ['#fff0cf', 2.6], sunDir: [-0.55, 1, 0.45], water: '#3a9ad8', ext: '#4e9c40' },
  forest: { bg: '#3d7a66', sky: ['#0e3436', '#1f5750', '#5f9a78'], fog: [18, 66], hemi: ['#9ccbc0', '#2a4a30', 1.25], sun: ['#e6f2b0', 1.7], sunDir: [-0.5, 1, 0.5], water: '#2a8aa8', ext: '#2f6e35' },
  sanctuary: { bg: '#150c30', sky: ['#04020a', '#0c0720', '#201048'], fog: [34, 120], hemi: ['#8a7acd', '#1a1030', 1.0], sun: ['#b8a8ff', 0.9], sunDir: [-0.3, 1, 0.6], water: '#3a9ad8', ext: null },
  ice: { bg: '#cfe4f6', sky: ['#3a78b8', '#9cc8ec', '#e8f4ff'], fog: [30, 100], hemi: ['#e0f0ff', '#8aa8c8', 1.5], sun: ['#f0f8ff', 2.4], sunDir: [-0.5, 1, 0.4], water: '#4cc0ee', ext: '#dfeaf5', ambient: '#ffffff' },
  desert: { bg: '#f2d9a0', sky: ['#4a96d8', '#f0c880', '#ffe8b0'], fog: [34, 110], hemi: ['#fff0d0', '#b8884a', 1.5], sun: ['#fff0c0', 3.0], sunDir: [-0.6, 1, 0.3], water: '#3ab0b0', ext: '#e0c27a', ambient: '#ffe9a8' },
  volcano: { bg: '#2a0e0a', sky: ['#140404', '#3a1008', '#8a2c10'], fog: [18, 76], hemi: ['#ff9a5a', '#2a0c08', 1.1], sun: ['#ff8a4a', 1.6], sunDir: [-0.4, 1, 0.5], water: '#ff6a1a', waterGlow: 1.1, waterOp: 0.95, ext: '#3a2e2c', ambient: '#ff8a3a' },
  swamp: { bg: '#3c4a3a', sky: ['#10201a', '#2a4034', '#6a8a60'], fog: [14, 58], hemi: ['#a0c0a0', '#2a3a22', 1.15], sun: ['#d8e8a0', 1.3], sunDir: [-0.4, 1, 0.5], water: '#4a6a3a', waterOp: 0.9, ext: '#3a4c28', ambient: '#c8f070' },
  corrupt: { bg: '#3a2050', sky: ['#10041a', '#3a1048', '#7a3a78'], fog: [14, 56], hemi: ['#c8a0e8', '#201030', 1.1], sun: ['#d0a0ff', 1.2], sunDir: [-0.4, 1, 0.5], water: '#7a3ab8', ext: '#2c2238', ambient: '#d080ff' },
  sky: { bg: '#bfe0ff', sky: ['#3a86e0', '#8ec4f4', '#f4faff'], fog: [40, 130], hemi: ['#eaf4ff', '#a8c8e8', 1.6], sun: ['#fff6dc', 2.8], sunDir: [-0.5, 1, 0.4], water: '#8ac8f0', ext: null, ambient: '#ffffff' }
};

/* ---------- geometria: juntar peças com cor por vértice ---------- */
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4();
function part(g, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
  return { g, color, m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)).clone(), new THREE.Vector3(sx, sy, sz)) };
}
// ruído por posição (vértices iguais recebem o mesmo deslocamento, então a superfície não racha)
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function merge(parts, grad = false) {
  const pos = [], nor = [], col = [], tc = new THREE.Color();
  for (const { g, color, m, fol } of parts) {
    const n = g.index ? g.toNonIndexed() : g.clone();
    if (fol) { // folhagem: moita irregular e macia
      const pp = n.attributes.position, nn0 = n.attributes.normal; for (let i = 0; i < pp.count; i++) { const k = (hash3(+pp.getX(i).toFixed(3), +pp.getY(i).toFixed(3), +pp.getZ(i).toFixed(3)) - 0.5) * fol; pp.setXYZ(i, pp.getX(i) + nn0.getX(i) * k, pp.getY(i) + nn0.getY(i) * k, pp.getZ(i) + nn0.getZ(i) * k); }
    }
    n.applyMatrix4(m); if (!n.attributes.normal) n.computeVertexNormals();
    const p = n.attributes.position.array, nn = n.attributes.normal.array, c = new THREE.Color(color);
    for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(nn[i]); }
    for (let i = 0; i < p.length / 3; i++) { if (grad) { const k = 0.78 + 0.4 * Math.min(1, Math.max(0, p[i * 3 + 1] / 3)); tc.setRGB(c.r * k, c.g * k, c.b * k); col.push(tc.r, tc.g, tc.b); } else col.push(c.r, c.g, c.b); }
    n.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}
const ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
const treeGeoCache = {};
function treeGeometry(kind) {
  if (treeGeoCache[kind]) return treeGeoCache[kind];
  const C = TREE_COL[kind] || TREE_COL.green, P = [part(geo.C(0.13, 0.21, 1.3, 6), '#6b3d22', 0, 0.65, 0), part(geo.C(0.24, 0.3, 0.12, 6), '#4e2c18', 0, 0.06, 0)];
  if (PINE.has(kind)) [[1.15, 1.3, 1.45, 1], [0.92, 1.15, 2.2, 2], [0.66, 1.0, 2.85, 3], [0.4, 0.7, 3.4, 3]].forEach(([r, h, y, c]) => P.push(part(geo.K(r, h, 8), C[c], 0, y, 0)));
  else if (kind === 'dead' || kind === 'swamp') {
    [[0.35, 1.2, 0.5, 0.8, 0.3], [-0.35, 1.5, -0.4, 0.7, 0.35], [0.1, 1.9, 0.6, 0.6, 0.5], [-0.15, 2.0, -0.2, 0.5, 0.2]].forEach(([x, y, z, l, a], i) => P.push(part(geo.C(0.03, 0.07, l, 4), C[1], x, y, z, 1, 1, 1, z * 0.9, 0, -x * 1.4)));
    P.push(part(geo.C(0.09, 0.24, 1.9, 6), C[2], 0, 0.95, 0));
    if (kind === 'swamp') [[0.3, 1.9, 0.2, 0.42], [-0.3, 1.6, -0.2, 0.36]].forEach(([x, y, z, r]) => { const pt = part(ico(r, 1), C[3], x, y, z, 1, 0.7, 1); pt.fol = 0.18; P.push(pt); });
  } else if (kind === 'palm') {
    P.push(part(geo.C(0.1, 0.2, 2.5, 6), '#8a6a3a', 0.15, 1.25, 0, 1, 1, 1, 0, 0, -0.1));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; P.push(part(geo.K(0.2, 1.4, 4), C[1 + (i % 3)], 0.3 + Math.cos(a) * 0.6, 2.5, Math.sin(a) * 0.6, 0.6, 1, 0.25, Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3)); }
  } else [[0, 2.0, 0, 1.1, 2], [0.62, 1.6, 0.25, 0.78, 3], [-0.55, 1.65, -0.3, 0.8, 2], [0.1, 2.65, -0.1, 0.75, 3], [-0.2, 1.5, 0.6, 0.6, 3], [0.5, 2.35, -0.45, 0.55, 4], [-0.35, 2.4, 0.3, 0.5, 4]].forEach(([x, y, z, r, c]) => { const pt = part(ico(r, 2), C[c], x, y, z, 1, 0.88, 1); pt.fol = 0.22; P.push(pt); });
  return (treeGeoCache[kind] = merge(P, true));
}
function rippleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(180,225,255,.9)'; g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) { const x = (i * 23) % 64, y = (i * 37) % 64; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 12, y); g.stroke(); g.beginPath(); g.moveTo(x - 64, y); g.quadraticCurveTo(x - 58, y - 3, x - 52, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const grad = (stops, w = 4, h = 64) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };

export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05; this.post = null;
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
    this.hemi = new THREE.HemisphereLight('#fff', '#888', 1.2); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff', 2.5); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 140;
    this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.06; this.scene.add(this.sun, this.sun.target);
    this.world = new THREE.Group(); this.dyn = new THREE.Group(); this.scene.add(this.world, this.dyn);
    this.yaw = 0; this.pitch = 0.93; this.dist = 16.5; this.distGoal = 16.5; this.target = new THREE.Vector3(); this.shake = new THREE.Vector3();
    this.ents = new Map(); this.anim = []; this.mapRef = null; this.t = 0; this.rippleTex = rippleTexture(); this.proj = new THREE.Vector3();
    this.maxAniso = this.r.capabilities.getMaxAnisotropy();
    this.initFx();
    import('./post.js').then(m => { this.post = m.makePost(this.r, this.scene, this.cam); this.resize(); }).catch(e => console.warn('Sem pós-processamento (segue sem brilho):', e));
    canvas.addEventListener('wheel', e => { this.distGoal = Math.max(8, Math.min(22, this.distGoal + Math.sign(e.deltaY) * 1.2)); e.preventDefault(); }, { passive: false });
    this.resize(); try { new ResizeObserver(() => this.resize()).observe(canvas.parentElement); } catch (e) { addEventListener('resize', () => this.resize()); }
  }
  resize() {
    const p = this.canvas.parentElement, w = Math.max(2, p.clientWidth), h = Math.max(2, p.clientHeight);
    this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); if (this.post) this.post.setSize(w, h);
  }
  // posição do mundo 2D para a tela interna 480x270 (usada pela interface 2D por cima do 3D)
  project(x, y, h = 0) {
    this.proj.set(x * U, h, y * U).project(this.cam);
    return { x: (this.proj.x * 0.5 + 0.5) * VIEW_W, y: (-this.proj.y * 0.5 + 0.5) * VIEW_H, z: this.proj.z };
  }

  /* ---------- montar o mapa ---------- */
  clearWorld() {
    this.dropAll(); this.anim = [];
    this.world.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(x => { if (x.map && x.map !== this.rippleTex && x.userData.ownMap !== false) x.map.dispose(); x.dispose(); }); });
    this.world.clear();
  }
  buildMap(map, g) {
    this.clearWorld(); this.mapRef = map; let env = ENV[map.theme] || ENV.day; if (map.envMod) env = { ...env, ...map.envMod, hemi: map.envMod.hemi || env.hemi }; const W = this.world;
    this.env = env; if (this.skyTex) this.skyTex.dispose(); this.skyTex = grad([[0, env.sky[0]], [0.55, env.sky[1]], [1, env.sky[2]]], 4, 256); this.scene.background = this.skyTex; this.scene.fog = new THREE.Fog(env.bg, env.fog[0], env.fog[1]);
    this.hemi.color.set(env.hemi[0]); this.hemi.groundColor.set(env.hemi[1]); this.hemi.intensity = env.hemi[2]; this.sun.color.set(env.sun[0]); this.sun.intensity = env.sun[1];
    this.sunOff = new THREE.Vector3(...env.sunDir).normalize().multiplyScalar(60);
    this.buildGround(map, g); this.buildGrass(map); this.buildProps(map, g);
    if (env.ext) { const ext = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ color: env.ext })); ext.rotation.x = -Math.PI / 2; ext.position.set(map.w / 2, -0.04, map.h / 2); ext.receiveShadow = true; W.add(ext); }
    this.buildAmbient(map);
    const p = g.player; this.target.set(p.x * U, 0.9, p.y * U); this.yaw = 0;
  }
  // capim em tufos (uma malha instanciada para o mapa inteiro)
  buildGrass(map) {
    if (map.theme === 'sanctuary') return;
    const pal = (GRASSPAL[map.theme] || GRASSPAL.day).map(c => new THREE.Color(c));
    const P = []; [[0, 0, 0.42, 0], [0.07, 0.03, 0.3, 0.45], [-0.07, 0.02, 0.34, -0.4], [0.02, -0.06, 0.26, 0.25]].forEach(([x, z, h, tl]) => P.push(part(geo.K(0.05, h, 3), '#ffffff', x, h / 2, z, 1, 1, 1, tl * 0.6, tl * 3, tl)));
    const tg = merge(P), cp = tg.attributes.position, cc = tg.attributes.color; for (let i = 0; i < cp.count; i++) { const k = 0.5 + 1.1 * Math.min(1, cp.getY(i) / 0.42); cc.setXYZ(i, k, k, k); }
    const spots = [], r = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(map.w * 17 + map.h * 3);
    for (let z = 0; z < map.h; z++) for (let x = 0; x < map.w; x++) { const t = map.get(x, z); if (t === T.GRASS || t === T.GRASS2 || t === T.MOSS) for (let i = 0; i < 3; i++) spots.push([x + r(), z + r()]); }
    if (!spots.length) return;
    const im = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), spots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
    spots.forEach(([x, z], i) => { const s = 0.7 + r() * 0.9; m4.compose(v.set(x, 0, z), q.setFromEuler(e.set(0, r() * 6.28, 0)), s3.set(s, s * (0.8 + r() * 0.6), s)); im.setMatrixAt(i, m4); im.setColorAt(i, pal[Math.floor(r() * pal.length)]); });
    im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; this.world.add(im);
  }
  // chão suave: pega a cor média de cada tile do chão 2D, mistura os vizinhos e pinta capim, manchas e pedras por cima
  groundCanvas(map, g) {
    const w = map.w, h = map.h, S = Math.min(32, Math.floor(4096 / Math.max(w, h))), src = g.ground, sctx = src.getContext('2d'), data = sctx.getImageData(0, 0, src.width, src.height).data;
    const small = document.createElement('canvas'); small.width = w; small.height = h; const sc = small.getContext('2d'), img = sc.createImageData(w, h), avg = [];
    for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
      let r = 0, gg = 0, b = 0, n = 0;
      for (let y = 0; y < TILE; y += 2) for (let x = 0; x < TILE; x += 2) { const i = ((ty * TILE + y) * src.width + tx * TILE + x) * 4; r += data[i]; gg += data[i + 1]; b += data[i + 2]; n++; }
      const k = (ty * w + tx) * 4; img.data[k] = r / n; img.data[k + 1] = gg / n; img.data[k + 2] = b / n; img.data[k + 3] = 255; avg.push([r / n, gg / n, b / n]);
    }
    sc.putImageData(img, 0, 0);
    const big = document.createElement('canvas'); big.width = w * S; big.height = h * S; const c = big.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(small, 0, 0, w * S, h * S);
    // pedra, calçada e ponte mantêm o desenho original, só suavizado
    const rr = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(w * 31 + h * 7);
    for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) { const t = map.get(tx, ty); if (t === T.COBBLE || t === T.STONE || t === T.BRIDGE) c.drawImage(src, tx * TILE, ty * TILE, TILE, TILE, tx * S, ty * S, S, S); }
    // manchas suaves de luz e sombra
    for (let i = 0; i < w * h * 0.9; i++) {
      const x = rr() * w * S, y = rr() * h * S, rad = (0.6 + rr() * 1.6) * S, tx = Math.min(w - 1, Math.floor(x / S)), ty = Math.min(h - 1, Math.floor(y / S)), t = map.get(tx, ty);
      if (t === T.WATER) continue; const light = rr() > 0.5, gr = c.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, light ? 'rgba(255,255,220,.10)' : 'rgba(0,20,10,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // capim, pedrinhas e terra
    c.lineCap = 'round';
    for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
      const t = map.get(tx, ty), a = avg[ty * w + tx], grass = t === T.GRASS || t === T.GRASS2 || t === T.MOSS || t === T.TALL || t === T.FLOWER, dirt = t === T.PATH || t === T.SAND;
      if (!grass && !dirt) continue;
      const n = grass ? 9 : 6;
      for (let i = 0; i < n; i++) {
        const x = (tx + rr()) * S, y = (ty + rr()) * S, up = rr() > 0.5, f = up ? 1.28 : 0.74;
        c.strokeStyle = `rgba(${Math.min(255, a[0] * f) | 0},${Math.min(255, a[1] * f) | 0},${Math.min(255, a[2] * f) | 0},${grass ? 0.55 : 0.4})`; c.lineWidth = grass ? 1.3 : 1.8;
        c.beginPath(); c.moveTo(x, y); if (grass) c.lineTo(x + (rr() - 0.5) * 4, y - 3 - rr() * 5); else c.lineTo(x + 1.5 + rr() * 2, y + (rr() - 0.5) * 2); c.stroke();
      }
    }
    return big;
  }
  buildGround(map, g) {
    const w = map.w, h = map.h, top = [], uv = [], sideP = [], sideC = [], wat = [], watUV = [];
    const tex = new THREE.CanvasTexture(this.groundCanvas(map, g)); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = this.maxAniso; tex.generateMipmaps = true;
    const hOf = (x, z) => { if (x < 0 || z < 0 || x >= w || z >= h) return VOIDY.has(map.theme) ? -3.5 : 0; const t = map.get(x, z); return t === T.VOID ? -3.5 : t === T.WATER ? -0.45 : 0; };
    const col = (c) => new THREE.Color(c), earth = col('#7a5a38'), sand = col('#cdb27a'), stoneT = col('#5a5478'), stoneB = col('#120c22'), skyT = col('#b8a888'), skyB = col('#4a4060');
    const wall = (x0, z0, x1, z1, yt, yb, ct, cb) => { // quad vertical de (x0,z0) a (x1,z1)
      const v = [[x0, yt, z0, ct], [x1, yt, z1, ct], [x1, yb, z1, cb], [x0, yt, z0, ct], [x1, yb, z1, cb], [x0, yb, z0, cb]];
      v.forEach(([x, y, z, c]) => { sideP.push(x, y, z); sideC.push(c.r, c.g, c.b); });
    };
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      const t = map.get(x, z); if (t === T.VOID) continue; const y = hOf(x, z);
      const u0 = x / w, u1 = (x + 1) / w, v0 = 1 - z / h, v1 = 1 - (z + 1) / h;
      top.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x, y, z, x + 1, y, z + 1, x + 1, y, z);
      uv.push(u0, v0, u0, v1, u1, v1, u0, v0, u1, v1, u1, v0);
      if (t === T.WATER) { const wy = -0.14; wat.push(x, wy, z, x, wy, z + 1, x + 1, wy, z + 1, x, wy, z, x + 1, wy, z + 1, x + 1, wy, z); [[x, z], [x, z + 1], [x + 1, z + 1], [x, z], [x + 1, z + 1], [x + 1, z]].forEach(([a, b]) => watUV.push(a * 0.35, b * 0.35)); }
      const lo = (nx, nz) => hOf(nx, nz) < y - 0.01, cT = map.theme === 'sanctuary' ? stoneT : map.theme === 'sky' ? skyT : (t === T.SAND ? sand : earth), cB = map.theme === 'sanctuary' ? stoneB : map.theme === 'sky' ? skyB : earth.clone().multiplyScalar(0.55);
      if (lo(x, z - 1)) wall(x, z, x + 1, z, y, hOf(x, z - 1), cT, cB); if (lo(x, z + 1)) wall(x + 1, z + 1, x, z + 1, y, hOf(x, z + 1), cT, cB);
      if (lo(x - 1, z)) wall(x, z + 1, x, z, y, hOf(x - 1, z), cT, cB); if (lo(x + 1, z)) wall(x + 1, z, x + 1, z + 1, y, hOf(x + 1, z), cT, cB);
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(top, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); tg.computeVertexNormals();
    const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, side: THREE.DoubleSide })); ground.receiveShadow = true; this.world.add(ground);
    if (sideP.length) { const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sideP, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sideC, 3)); sg.computeVertexNormals(); const sm = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide })); sm.receiveShadow = true; this.world.add(sm); }
    if (wat.length) {
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wat, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(watUV, 2)); wg.computeVertexNormals();
      const wm = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: this.env.water, map: this.rippleTex, transparent: true, opacity: this.env.waterOp || 0.78, roughness: 0.15, metalness: 0.05, emissive: this.env.water, emissiveIntensity: this.env.waterGlow || 0.18, side: THREE.DoubleSide }));
      wm.receiveShadow = true; wm.renderOrder = 2; this.world.add(wm); this.anim.push(t => { this.rippleTex.offset.set(t * 0.03, t * 0.02); });
    }
    // sombra azulada do vazio: nada. Corrimão das pontes
    const rails = [];
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) if (map.get(x, z) === T.BRIDGE) {
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dz]) => {
        if (map.get(x + dx, z + dz) !== T.WATER) return; const cx = x + 0.5 + dx * 0.46, cz = z + 0.5 + dz * 0.46;
        rails.push(part(geo.R(dx ? 0.08 : 1, 0.08, dz ? 0.08 : 1), '#4e2c18', cx, 0.42, cz)); rails.push(part(geo.R(dx ? 0.1 : 0.12, 0.45, dz ? 0.1 : 0.12), '#3a2010', cx - (dx ? 0 : 0.45), 0.22, cz - (dz ? 0 : 0.45)));
      });
    }
    if (rails.length) { const rm = new THREE.Mesh(merge(rails), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); rm.castShadow = true; this.world.add(rm); }
    // tufos de capim e flores
    const tufts = [], flowers = [], FC = ['#ffd23f', '#ff6fa8', '#ffffff', '#8ad0ff'], r = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(map.w * 13 + map.h);
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      const t = map.get(x, z);
      if (t === T.TALL) for (let i = 0; i < 4; i++) tufts.push(part(geo.K(0.07, 0.55 + r() * 0.25, 4), (GRASSPAL[map.theme] || GRASSPAL.day)[1], x + r(), 0.28, z + r(), 1, 1, 1, (r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4));
      else if (t === T.FLOWER) for (let i = 0; i < 3; i++) { const fx = x + 0.15 + r() * 0.7, fz = z + 0.15 + r() * 0.7; flowers.push(part(geo.C(0.012, 0.012, 0.3, 3), '#2f6e35', fx, 0.15, fz), part(ico(0.07, 0), FC[Math.floor(r() * 4)], fx, 0.32, fz)); }
    }
    [[tufts, true], [flowers, false]].forEach(([p, cast]) => { if (!p.length) return; const m = new THREE.Mesh(merge(p), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.castShadow = false; this.world.add(m); });
  }

  /* ---------- objetos do cenário ---------- */
  buildProps(map, g) {
    const W = this.world, L = (o) => o.seed || 0;
    this.chestList = []; this.bushList = []; this.saveList = []; this.trapped = null; this.portalObj = null; this.bigCrystal = null; this.lamps = []; this.gateList = []; this.spikeList = []; this.runeList = [];
    const stdv = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide });
    // árvores (uma malha instanciada por tipo)
    const byKind = {};
    for (const o of map.objects) if (o.type === 'tree') (byKind[o.kind] = byKind[o.kind] || []).push(o);
    const tm = stdv(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
    for (const [kind, list] of Object.entries(byKind)) {
      const im = new THREE.InstancedMesh(treeGeometry(kind), tm, list.length);
      list.forEach((o, i) => { const s = 0.9 + (L(o) % 5) * 0.075; q.setFromEuler(eu.set(0, L(o) * 0.7, 0)); m4.compose(v3.set(o.x * U, 0, (o.y - 2) * U), q, sc.set(s, s * (0.95 + (L(o) % 3) * 0.06), s)); im.setMatrixAt(i, m4); });
      im.castShadow = true; im.instanceMatrix.needsUpdate = true; W.add(im);
    }
    // casas, pedras, pilares e pequenos detalhes juntos numa malha só
    const P = [];
    const WALL = ['#ead9b0', '#dcc79e', '#efe0c0', '#d3dcb4'];
    const gable = (cx, cz, s, h, y, color, dz) => {
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute([-s, 0, dz, s, 0, dz, 0, h, dz, s, 0, -dz, -s, 0, -dz, 0, h, -dz], 3));
      P.push(part(gg, color, cx, y, cz));
    };
    for (const o of map.objects) {
      const hx = o.x * U, hz = o.y * U;
      if (o.type === 'house') {
        const w = o.wt - 0.5, d = 2.3, cz = hz - d / 2 - 0.05, rc = ROOF[o.roof] || ROOF.red, wc = WALL[L(o) % WALL.length], s = w / 2 + 0.3, h = 0.95, a = Math.atan2(h, s), ln = Math.hypot(s, h);
        P.push(part(geo.R(w, 1.6, d), wc, hx, 0.8, cz), part(geo.R(w + 0.12, 0.28, d + 0.12), '#7a6a5a', hx, 0.14, cz));
        [-1, 1].forEach(sd => P.push(part(geo.R(ln, 0.14, d + 0.5), rc[sd > 0 ? 1 : 2], hx + sd * s / 2, 1.6 + h / 2 + 0.05, cz, 1, 1, 1, 0, 0, -sd * a)));
        P.push(part(geo.R(w + 1.1, 0.1, 0.12), rc[0], hx, 1.6 + h + 0.1, cz));
        gable(hx, cz + d / 2 - 0.02, s - 0.3, h - 0.05, 1.6, wc, 0.02);
        P.push(part(geo.R(0.55, 0.95, 0.07), '#4e2c18', hx, 0.5, hz - 0.03), part(geo.R(0.7, 0.08, 0.1), '#3a2010', hx, 1.0, hz - 0.03));
        [-1, 1].forEach(sd => { if (w > 3) P.push(part(geo.R(0.42, 0.42, 0.07), '#ffd98a', hx + sd * w * 0.3, 1.0, hz - 0.03), part(geo.R(0.5, 0.06, 0.1), '#5a3a22', hx + sd * w * 0.3, 0.76, hz - 0.02)); });
        P.push(part(geo.R(0.34, 1.0, 0.34), '#8a7a6a', hx + w / 2 - 0.55, 2.35, cz - 0.3));
      } else if (o.type === 'rock') {
        P.push(part(ico(0.5, 0), '#8a8794', hx, 0.22, hz - 0.3, o.s * 1.1, 0.62 * o.s, o.s * 0.95, 0, o.x), part(ico(0.28, 0), '#9a97a4', hx + 0.4, 0.12, hz - 0.1, 1, 0.7, 1));
      } else if (o.type === 'pillar') {
        const z0 = hz - 0.4, hh = o.broken ? 1.1 : 2.7, pc = PILC[o.style] || PILC.stone;
        P.push(part(geo.R(0.95, 0.22, 0.95), pc[0], hx, 0.11, z0), part(geo.C(0.3, 0.36, hh, 8), pc[1], hx, 0.22 + hh / 2, z0));
        if (!o.broken) P.push(part(geo.R(0.85, 0.2, 0.85), pc[0], hx, 0.32 + hh, z0));
        else P.push(part(geo.R(0.4, 0.3, 0.35), '#9a96ac', hx + 0.7, 0.15, z0 + 0.3, 1, 1, 1, 0.2, 0.6, 0.3), part(geo.R(0.3, 0.2, 0.3), '#8c88a0', hx - 0.6, 0.1, z0 + 0.5, 1, 1, 1, 0, 1, 0.2));
      } else if (o.type === 'sign') {
        P.push(part(geo.R(0.1, 1.0, 0.1), '#5a3a22', hx, 0.5, hz - 0.2), part(geo.R(1.0, 0.5, 0.08), '#a8743a', hx, 0.95, hz - 0.2), part(geo.R(1.05, 0.06, 0.1), '#6a4422', hx, 1.2, hz - 0.2));
      }
    }
    if (P.length) { const mesh = new THREE.Mesh(merge(P), stdv()); mesh.castShadow = true; mesh.receiveShadow = true; W.add(mesh); }
    // chafariz
    for (const o of map.objects) if (o.type === 'fountain') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 4) * U); W.add(gr);
      add(gr, geo.C(1.15, 1.25, 0.55, 18), '#a8a6b8', 0, 0.27, 0); add(gr, geo.C(0.95, 0.95, 0.06, 18), this.env.water, 0, 0.55, 0, { m: { emissive: new THREE.Color(this.env.water), emissiveIntensity: 0.25, transparent: true, opacity: 0.85 } });
      add(gr, geo.C(0.18, 0.24, 1.0, 8), '#9896aa', 0, 0.9, 0); add(gr, geo.C(0.5, 0.2, 0.18, 12), '#a8a6b8', 0, 1.35, 0);
      const jet = add(gr, geo.S(0.17, 8, 6), '#bff3ff', 0, 1.55, 0, { mat: glowMat('#9fe8ff', 0.7), shadow: false }); const gl = glow('#9fe8ff', 2.2, 0.5); gl.position.y = 1.5; gr.add(gl);
      this.anim.push(t => { jet.position.y = 1.55 + Math.sin(t * 3) * 0.07; gl.material.opacity = 0.45 + Math.sin(t * 2.4) * 0.12; });
    }
    // lampiões
    for (const o of map.objects) if (o.type === 'lamp') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 2) * U); W.add(gr);
      add(gr, geo.C(0.05, 0.08, 1.7, 6), '#2a2438', 0, 0.85, 0); add(gr, geo.R(0.28, 0.06, 0.28), '#2a2438', 0, 1.7, 0);
      add(gr, geo.S(0.15, 8, 6), '#ffd37a', 0, 1.88, 0, { mat: glowMat('#ffd37a', 1.3), shadow: false }); const gl = glow('#ffd37a', 2.6, 0.55); gl.position.y = 1.88; gr.add(gl); this.lamps.push(gl);
    }
    // cogumelos que brilham
    const capMats = {}, stemM = std('#d8d0e0');
    for (const o of map.objects) if (o.type === 'glowshroom') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, o.y * U); W.add(gr); const cm = capMats[o.col] || (capMats[o.col] = glowMat(o.col, 1.0));
      const sm = new THREE.Mesh(geo.C(0.03, 0.045, 0.2, 5), stemM); sm.position.y = 0.1; gr.add(sm);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), cm); cap.position.y = 0.19; gr.add(cap);
      const gl = glow(o.col, 1.1, 0.45); gl.position.y = 0.25; gr.add(gl);
    }
    // portal do selo
    for (const o of map.objects) if (o.type === 'portal') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 5) * U); W.add(gr);
      [-1, 1].forEach(s => { add(gr, geo.R(0.75, 3.4, 0.75), '#6a6488', s * 1.2, 1.7, 0); add(gr, geo.R(0.95, 0.24, 0.95), '#4e4a6a', s * 1.2, 0.12, 0); add(gr, geo.O(0.2), '#7fd6ff', s * 1.2, 3.7, 0, { mat: glowMat('#7fd6ff', 0.9), s: [1, 1.6, 1] }); });
      add(gr, geo.R(3.3, 0.55, 0.8), '#6a6488', 0, 3.5, 0);
      const mat = new THREE.MeshBasicMaterial({ color: '#7fd6ff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), sw = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.2), mat); sw.position.y = 1.65; gr.add(sw);
      const gl = glow('#7fd6ff', 5, 0.5); gl.position.y = 1.7; gr.add(gl); this.portalObj = { mat, gl };
    }
    // cristal gigante da arena
    for (const o of map.objects) if (o.type === 'bigcrystal') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 3) * U); W.add(gr);
      add(gr, geo.C(1.5, 1.8, 0.5, 8), '#4a4468', 0, 0.25, 0);
      const mt = glowMat('#b07aff', 0.9), c1 = add(gr, geo.O(1), '#b07aff', 0, 2.5, 0, { mat: mt, s: [0.9, 1.9, 0.9] }); [[-0.9, 1.0, 0.3], [0.9, 0.9, -0.2]].forEach(([x, y, z]) => add(gr, geo.O(0.45), '#b07aff', x, y, z, { mat: mt, s: [1, 1.8, 1] }));
      const gl = glow('#b07aff', 7, 0.55); gl.position.y = 2.6; gr.add(gl); this.bigCrystal = { mt, gl, c1 };
    }
    // buracos e escadarias (entrada do Poço Gosmento e das Ruínas)
    for (const o of map.objects) if (o.type === 'hole') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 6) * U); W.add(gr);
      add(gr, geo.C(1.2, 1.35, 0.18, 18), '#4a4468', 0, 0.06, 0);
      add(gr, geo.C(0.95, 0.95, 0.04, 18), null, 0, 0.17, 0, { mat: new THREE.MeshBasicMaterial({ color: '#05030c' }), shadow: false });
      add(gr, geo.C(0.8, 0.8, 0.02, 18), null, 0, 0.2, 0, { mat: new THREE.MeshBasicMaterial({ color: o.col, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }), shadow: false });
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; add(gr, geo.R(0.34, 0.3 + (i % 3) * 0.1, 0.3), '#7a7690', Math.cos(a) * 1.3, 0.18, Math.sin(a) * 1.3, { r: [0, -a, 0] }); }
      const gl = glow(o.col, 4, 0.5); gl.position.y = 0.6; gr.add(gl); this.anim.push(t => { gl.material.opacity = 0.42 + Math.sin(t * 2.5) * 0.14; });
    }
    // portões (gosma na ponte, pedra nas ruínas): afundam quando abertos
    for (const o of map.objects) if (o.type === 'gate') {
      const s0 = o.solid0 || o.solid, gr = new THREE.Group(); W.add(gr);
      const cx = (s0.x + s0.w / 2) * U, cz = (s0.y + s0.h / 2) * U, w = s0.w * U, d = s0.h * U;
      if (o.style === 'goo') {
        const mt = std('#58d98a', { transparent: true, opacity: 0.88, roughness: 0.25, emissive: new THREE.Color('#2f9a5a'), emissiveIntensity: 0.35 });
        for (let i = 0; i < 4; i++) add(gr, geo.S(0.95, 12, 9), null, cx, 0.9, cz + (i - 1.5) * d / 4, { mat: mt, s: [0.75 + (i % 2) * 0.15, 1.5 + (i % 3) * 0.2, 0.95] });
        add(gr, geo.S(0.4, 8, 6), null, cx - 0.2, 2.3, cz, { mat: glowMat('#c8ff9a', 0.6) });
        const gl = glow('#58d98a', 3.5, 0.35); gl.position.set(cx, 1.2, cz); gr.add(gl);
      } else {
        const gc = o.id === 'gate_a' ? '#e8b64a' : '#7fd6ff';
        add(gr, geo.R(Math.max(w, 1.0), 2.2, Math.max(d, 1.0)), '#6a6488', cx, 1.1, cz); add(gr, geo.R(Math.max(w, 1.0) + 0.1, 0.2, Math.max(d, 1.0) + 0.1), '#4e4a6a', cx, 2.3, cz);
        add(gr, geo.O(0.25), null, cx, 2.75, cz, { mat: glowMat(gc, 1.0), s: [0.8, 1.4, 0.8] });
        const gl = glow(gc, 3, 0.5); gl.position.set(cx, 2.7, cz); gr.add(gl);
      }
      this.gateList.push({ o, gr });
    }
    // armadilhas de espinhos
    for (const o of map.objects) if (o.type === 'spikes') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 8) * U); W.add(gr);
      const pm = std('#2a2438'); add(gr, geo.R(0.62, 0.06, 0.62), null, 0, 0.03, 0, { mat: pm, shadow: false });
      const cones = pivot(gr, 0, 0, 0); [[0, 0], [0.17, 0.12], [-0.17, 0.12], [0, -0.18]].forEach(([x, z]) => add(cones, geo.K(0.07, 0.55, 5), '#d0d4de', x, 0.28, z));
      cones.scale.y = 0.01; this.spikeList.push({ o, cones, pm });
    }
    // runas e tábuas
    for (const o of map.objects) if (o.type === 'rune') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 6) * U); W.add(gr);
      add(gr, geo.C(0.42, 0.5, 0.7, 8), '#4a4468', 0, 0.35, 0);
      const mt = glowMat(o.col, 0.05); add(gr, geo.O(0.3), null, 0, 1.15, 0, { mat: mt, s: [0.8, 1.3, 0.8] });
      const gl = glow(o.col, 2.6, 0); gl.position.y = 1.15; gr.add(gl); this.runeList.push({ o, mt, gl });
    }
    for (const o of map.objects) if (o.type === 'tablet') {
      const gr = new THREE.Group(); gr.position.set(o.x * U, 0, (o.y - 4) * U); W.add(gr);
      add(gr, geo.R(0.95, 1.35, 0.22), '#6a6488', 0, 0.68, 0, { r: [-0.1, 0, 0] });
      [0.95, 0.75, 0.55].forEach((y, i) => add(gr, geo.R(0.55 - i * 0.1, 0.05, 0.04), null, 0, y, 0.13, { mat: glowMat('#9fe8ff', 0.8), shadow: false }));
    }
    // moitas e arbustos de frutinha
    const leaf = std('#2f7a3a'), leaf2 = std('#3d9248'), berryM = glowMat('#ff7a3a', 0.5);
    for (const b of map.bushes) {
      const gr = new THREE.Group(); gr.position.set(b.x * U, 0, (b.y - 4) * U); W.add(gr);
      [[0, 0.32, 0, 0.45], [-0.32, 0.25, 0.1, 0.34], [0.3, 0.27, -0.05, 0.36]].forEach(([x, y, z, r], i) => { const m = new THREE.Mesh(ico(r, 1), i % 2 ? leaf2 : leaf); m.position.set(x, y, z); m.scale.y = 0.85; m.castShadow = true; gr.add(m); });
      const berries = new THREE.Group(); [[0.2, 0.55, 0.3], [-0.25, 0.45, 0.28], [0.35, 0.4, 0.1], [0, 0.66, 0.1]].forEach(([x, y, z]) => { const m = new THREE.Mesh(ico(0.07, 0), berryM); m.position.set(x, y, z); berries.add(m); }); gr.add(berries);
      this.bushList.push({ b, berries });
    }
    // baús
    const wood = std('#8a5a2a'), wood2 = std('#a06a30'), gold = glowMat('#e8b64a', 0.25);
    for (const c of map.chests) {
      const gr = new THREE.Group(); gr.position.set(c.x * U, 0, (c.y - 2) * U); W.add(gr);
      add(gr, geo.R(0.9, 0.5, 0.6), null, 0, 0.25, 0, { mat: wood }); add(gr, geo.R(0.94, 0.08, 0.64), null, 0, 0.18, 0, { mat: gold }); add(gr, geo.R(0.12, 0.22, 0.04), null, 0, 0.45, 0.31, { mat: gold });
      const lid = pivot(gr, 0, 0.5, -0.3); add(lid, geo.R(0.9, 0.22, 0.6), null, 0, 0.11, 0.3, { mat: wood2 }); add(lid, geo.R(0.94, 0.06, 0.64), null, 0, 0.12, 0.3, { mat: gold });
      const gl = glow('#ffd37a', 1.6, 0.35); gl.position.y = 0.5; gr.add(gl); this.chestList.push({ c, lid, gl });
    }
    // cristais de descanso
    for (const sv of map.saves) {
      const gr = new THREE.Group(); gr.position.set(sv.x * U, 0, (sv.y - 2) * U); W.add(gr);
      add(gr, geo.C(0.45, 0.55, 0.25, 8), '#4a4468', 0, 0.12, 0); const mt = glowMat('#7fd6ff', 0.9), cr = add(gr, geo.O(0.45), '#7fd6ff', 0, 1.1, 0, { mat: mt, s: [0.8, 1.6, 0.8] });
      const gl = glow('#7fd6ff', 3, 0.5); gl.position.y = 1.1; gr.add(gl); this.saveList.push({ cr, gl, gr });
    }
    // Cristarta presa
    const tp = map.specials.find(s => s.id === 'trapped');
    if (tp) {
      const gr = new THREE.Group(); gr.position.set(tp.x * U, 0, tp.y * U); W.add(gr);
      const tm2 = M.makeTurtle(false); gr.add(tm2.group); tm2.setFace(0.6);
      const bub = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), new THREE.MeshStandardMaterial({ color: '#bff3ff', transparent: true, opacity: 0.22, roughness: 0.1, emissive: '#7fd6ff', emissiveIntensity: 0.4, depthWrite: false })); bub.position.y = 0.5; gr.add(bub);
      this.trapped = { gr, tm: tm2, bub };
    }
  }
  buildAmbient(map) {
    const th = map.theme, amb = this.env.ambient, n = th === 'forest' ? 150 : th === 'sanctuary' || th === 'corrupt' ? 100 : amb ? 70 : 36, pos = new Float32Array(n * 3), base = [], r = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(map.w + 5);
    for (let i = 0; i < n; i++) base.push([r() * map.w, 0.3 + r() * (th === 'forest' ? 2.8 : 5), r() * map.h, r() * 6.28]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ map: M.glowTexture(), size: th === 'forest' ? 0.42 : 0.3, color: amb || (th === 'forest' ? '#d8ff8a' : th === 'sanctuary' ? '#c49bff' : '#fff6d0'), transparent: true, opacity: th === 'day' ? 0.5 : 0.85, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; this.world.add(pts);
    this.anim.push(t => {
      for (let i = 0; i < n; i++) { const [bx, by, bz, ph] = base[i]; pos[i * 3] = bx + Math.sin(t * 0.4 + ph) * 0.7; pos[i * 3 + 1] = (th === 'sanctuary' || th === 'volcano' || th === 'ice') ? (by + t * (th === 'ice' ? -0.3 : 0.25) + 50) % 5 + 0.2 : by + Math.sin(t * 0.8 + ph * 2) * 0.3; pos[i * 3 + 2] = bz + Math.cos(t * 0.35 + ph) * 0.7; }
      g.attributes.position.needsUpdate = true;
    });
  }

  /* ---------- efeitos e extras ---------- */
  initFx() {
    this.S = { npc: new Map(), enemy: new Map(), proj: new Map(), pick: new Map(), pet: new Map(), player: new Map() };
    const N = 900; this.fxN = N; this.fxPos = new Float32Array(N * 3); this.fxCol = new Float32Array(N * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.fxPos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.fxCol, 3)); g.setDrawRange(0, 0);
    this.fxPts = new THREE.Points(g, new THREE.PointsMaterial({ map: M.glowTexture(), size: 0.3, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); this.fxPts.frustumCulled = false; this.scene.add(this.fxPts);
    this.colCache = new Map();
    const basic = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const sl = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.9, 22, 1, 0, 1.1), basic('#ffffff', 0)); sl.rotation.x = -Math.PI / 2;
    this.slash = new THREE.Group(); this.slash.add(sl); this.slash.visible = false; this.slashMesh = sl; this.scene.add(this.slash);
    this.tele = new THREE.Group(); const tr = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 44), basic('#ff4a4a', 0.9)), tf = new THREE.Mesh(new THREE.CircleGeometry(1, 44), basic('#ff3a3a', 0.35));
    tr.rotation.x = tf.rotation.x = -Math.PI / 2; this.tele.add(tr, tf); this.tele.visible = false; this.teleFill = tf; this.scene.add(this.tele);
    addEventListener('wheel', e => { if (!this.canvas.offsetParent || !this.canvas.parentElement.contains(e.target)) return; this.distGoal = Math.max(8, Math.min(22, this.distGoal + Math.sign(e.deltaY) * 1.2)); }, { passive: true });
  }
  dropAll() {
    for (const st of Object.values(this.S)) { for (const e of st.values()) { this.dyn.remove(e.group); e.dispose && e.dispose(); } st.clear(); }
  }
  track(store, items, make, upd) {
    const seen = new Set();
    for (const it of items) { let e = store.get(it); if (!e) { e = make(it); if (!e) continue; store.set(it, e); this.dyn.add(e.group); } seen.add(it); upd(e, it); }
    for (const [it, e] of store) if (!seen.has(it)) { this.dyn.remove(e.group); e.dispose && e.dispose(); store.delete(it); }
  }
  xray(m) {
    const mat = new THREE.MeshBasicMaterial({ color: '#7fd6ff', transparent: true, opacity: 0.45, depthFunc: THREE.GreaterDepth, depthWrite: false }), list = [];
    m.group.traverse(o => { if (o.isMesh && o.material && !o.material.isMeshBasicMaterial) list.push(o); });
    list.forEach(o => { const t = new THREE.Mesh(o.geometry, mat); t.position.copy(o.position); t.rotation.copy(o.rotation); t.scale.copy(o.scale); t.renderOrder = 5; o.parent.add(t); });
  }
  color(col) {
    let c = this.colCache.get(col); if (c) return c;
    try { c = new THREE.Color(col); } catch (e) { c = new THREE.Color('#ffffff'); } this.colCache.set(col, c); return c;
  }

  /* ---------- atualizar a cena a cada quadro ---------- */
  sync(g, dt) {
    if (g.map !== this.mapRef) this.buildMap(g.map, g);
    this.t += dt; const t = g.t, p = g.player, map = g.map, fl = g.flags;
    const faceAng = a => Math.PI / 2 - a;
    // herói
    this.track(this.S.player, [p], () => { const m = M.makeHumanoid('hero'); m.weaponKind = 'none'; this.xray(m); return m; }, (m) => {
      m.group.position.set(p.x * U, 0, p.y * U); m.face(faceAng(p.aim), 0.35);
      if (m.weaponKind !== p.weapon) { m.weaponKind = p.weapon; m.setWeapon(p.weapon); }
      m.group.visible = !(p.iframes > 0 && p.dodgeT <= 0 && Math.floor(t * 20) % 2);
      m.pose({ moving: p.moving, walkT: p.walkT, t, swing: p.swingT < 0.2 ? p.swingT / 0.2 : -1, dodge: p.dodgeT > 0 ? 1 - p.dodgeT / 0.22 : -1 });
    });
    // moradores
    this.track(this.S.npc, g.npcs, n => M.makeHumanoid(n.pal), (m, n) => {
      m.group.position.set(n.x * U, 0, n.y * U); m.face(faceAng(DIR_ANGLE[n.dir] || 0), 0.2);
      m.pose({ moving: !!n.walkT, walkT: n.walkT, t, talk: g.talkingTo === n });
    });
    // inimigos
    const alive = g.enemies.filter(e => e.hp > 0);
    this.track(this.S.enemy, alive, e => {
      let m; const lk = e.d.look || e.kind, md = e.d.model;
      if (md) { m = md === 'wolf' ? M.makeWolf() : md === 'golem' ? M.makeGolem() : md === 'dragon' ? M.makeDragon() : md === 'scorpion' ? M.makeScorpion() : md === 'knight' ? M.makeKnight() : md === 'thorn' ? M.makeEspinheiro() : md === 'hydra' ? M.makeHydra() : M.makeNoxar(); if (e.d.scale && e.d.scale !== 1) m.group.scale.setScalar(e.d.scale); if (e.d.tint) M.tintModel(m, e.d.tint, md === 'wolf' ? 0.55 : 0.4); }
      else if (lk === 'gotalim') m = M.makeSlime(e.d.color); else if (lk === 'fungo') m = M.makeFungo(); else if (lk === 'lobo') m = M.makeWolf(); else if (e.kind === 'slimeboss') m = M.makeSlimeKing(); else if (e.kind === 'espinheiro') m = M.makeEspinheiro(); else if (e.kind === 'cavaleiro') m = M.makeKnight(); else m = M.makeGolem();
      if (e.d.look && e.d.tint && lk !== 'gotalim') M.tintModel(m, e.d.tint, 0.55);
      if (e.alpha) m.group.scale.setScalar(1.35); m.px = e.x; m.py = e.y; return m;
    }, (m, e) => {
      const dx = e.x - m.px, dy = e.y - m.py, mv = Math.hypot(dx, dy); m.px = e.x; m.py = e.y;
      m.group.position.set(e.x * U, 0, e.y * U);
      const dpx = p.x - e.x, dpy = p.y - e.y, busy = e.state === 'windup' || e.state === 'charge' || e.state === 'slam' || e.boss;
      if (busy && e.state !== 'sleep') m.face(yawOf(dpx, dpy), 0.12); else if (mv > 0.05) m.face(yawOf(dx, dy), 0.25); else if (Math.hypot(dpx, dpy) < 110) m.face(yawOf(dpx, dpy), 0.12);
      const lk = e.d.look || e.kind;
      if (e.kind === 'slimeboss') m.pose({ hop: e.state === 'slam' ? 1 - e.windup : 0, t: e.t });
      else if (e.d.model && e.d.model !== 'wolf') m.pose({ t: e.t, windup: (e.state === 'slam' || e.state === 'charge') ? e.windup : 0, sleep: e.state === 'sleep', phase: e.phase });
      else if (lk === 'gotalim') m.pose({ hop: e.hop, t: e.t }); else if (lk === 'fungo') m.pose({ t: e.t, charge: e.charge });
      else if (lk === 'lobo' || e.d.model === 'wolf') m.pose({ t: e.t, moving: mv > 0.05, dash: e.state === 'dash', windup: e.state === 'windup' });
      else m.pose({ t: e.t, windup: (e.state === 'slam' || e.state === 'charge') ? e.windup : 0, sleep: e.state === 'sleep', phase: e.phase });
      m.flash(e.hurtT > 0);
    });
    // companheiro
    const pet = g.petObj;
    this.track(this.S.pet, pet ? [pet] : [], pt => { const d = pt.def, ev = !d.evolution && pt.data.id !== 'brasek' && pt.data.id !== 'cristarta', m = d.look === 'turtle' ? M.makeTurtle(ev) : M.makeFox(ev); m.px = pt.x; m.py = pt.y; return m; }, (m, pt) => {
      const dx = pt.x - m.px, dy = pt.y - m.py, mv = Math.hypot(dx, dy); m.px = pt.x; m.py = pt.y; m.group.position.x = pt.x * U; m.group.position.z = pt.y * U;
      if (mv > 0.15) m.face(yawOf(dx, dy), 0.2); m.pose({ moving: mv > 0.15, t: pt.t, down: pt.fainted });
      m.group.visible = !(pt.hurtT > 0 && Math.floor(pt.t * 20) % 2);
    });
    // itens no chão
    const PC = { shard: '#9fe8ff', berry: '#ff9a3a', potion: '#ff5a7a', ether: '#5a8aff', coin: '#ffd23f' };
    this.track(this.S.pick, g.pickups, pk => {
      const grp = new THREE.Group(), col = PC[pk.kind] || '#ffffff', mm = new THREE.Mesh(pk.kind === 'coin' ? new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12) : new THREE.OctahedronGeometry(0.17), glowMat(col, 0.7));
      if (pk.kind === 'coin') mm.rotation.x = Math.PI / 2; const inner = new THREE.Group(); inner.add(mm); grp.add(inner); const gl = glow(col, 0.9, 0.5); grp.add(gl); grp.userData.inner = inner;
      return { group: grp, inner, dispose() { mm.geometry.dispose(); mm.material.dispose(); gl.material.dispose(); } };
    }, (e, pk) => { e.group.position.set(pk.x * U, 0.4 + pk.z * U + Math.sin(pk.t * 5) * 0.04, pk.y * U); e.inner.rotation.y = pk.t * 3; });
    // projéteis
    this.track(this.S.proj, g.projectiles, pr => {
      const grp = new THREE.Group(); let mesh, col = pr.col || '#7fd6ff';
      if (pr.kind === 'nova') { mesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: '#bff3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.9; }
      else if (pr.kind === 'ember') { mesh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), glowMat('#ffb03a', 1.2)); grp.add(glow('#ff9a3a', 1.3, 0.7)); }
      else if (pr.kind === 'bubble') { mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: '#7fd6ff', transparent: true, opacity: 0.55, emissive: '#4dc3ff', emissiveIntensity: 0.5 })); }
      else if (pr.kind === 'spore') { mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), glowMat('#c8f070', 0.9)); grp.add(glow('#c8f070', 1.0, 0.5)); }
      else { mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), glowMat(col, 1.2)); mesh.scale.set(0.6, 0.6, 2.4); grp.add(glow(col, 1.2, 0.6)); }
      grp.add(mesh); return { group: grp, mesh, dispose() { mesh.geometry.dispose(); mesh.material.dispose(); } };
    }, (e, pr) => {
      if (pr.kind === 'nova') { e.group.position.set(pr.x * U, 0, (pr.y + 6) * U); e.mesh.scale.setScalar(Math.max(0.1, pr.r * U)); e.mesh.material.opacity = Math.max(0, 1 - pr.t / pr.life); }
      else { e.group.position.set(pr.x * U, pr.kind === 'shardp' ? 0.8 : 0.55, (pr.y + 6) * U); if (pr.kind === 'shardp') e.group.rotation.y = yawOf(pr.vx, pr.vy); }
    });
    // objetos que mudam: baús, moitas, cristais, selo, criatura presa
    for (const { c, lid, gl } of this.chestList) { const open = !!fl[c.id]; lid.rotation.x += ((open ? -1.9 : 0) - lid.rotation.x) * Math.min(1, dt * 10); gl.visible = !open; }
    for (const { b, berries } of this.bushList) berries.visible = b.kind === 'berry' && !!b.ready;
    for (const gt of this.gateList) { const gr = gt.gr; if (gt.o.open) { if (gr.visible) { gr.position.y -= dt * 1.8; if (gr.position.y < -2.6) gr.visible = false; } } else { gr.visible = true; gr.position.y = 0; } }
    for (const sp of this.spikeList) { const ph = (g.t + sp.o.off) % 3, tg = ph > 1.9 ? 1 : ph > 1.3 ? 0.12 : 0, w = ph > 1.3 && ph <= 1.9; sp.cones.scale.y += (tg - sp.cones.scale.y) * Math.min(1, dt * 20); sp.cones.visible = sp.cones.scale.y > 0.04; sp.pm.emissive.set(w ? '#ff3a3a' : '#000000'); sp.pm.emissiveIntensity = w ? 0.6 + Math.sin(t * 25) * 0.3 : 0; }
    for (const rn of this.runeList) { const lit = !!(g.runeLit && g.runeLit[rn.o.idx]); rn.mt.emissiveIntensity += ((lit ? 1.6 : 0.05) - rn.mt.emissiveIntensity) * Math.min(1, dt * 8); rn.gl.material.opacity = lit ? 0.6 : 0; }
    for (const s of this.saveList) { s.cr.rotation.y = t * 1.2; s.cr.position.y = 1.1 + Math.sin(t * 2) * 0.1; s.gl.material.opacity = 0.45 + Math.sin(t * 2.6) * 0.12; }
    if (this.portalObj) { const on = g.quests.atLeast('main', 'thorn'); this.portalObj.mat.color.set(on ? '#7fd6ff' : '#6a5a9a'); this.portalObj.mat.opacity = on ? 0.45 + Math.sin(t * 3) * 0.15 : 0.12; this.portalObj.gl.material.opacity = on ? 0.55 : 0.1; }
    if (this.bigCrystal) { const bd = !!fl.bossDefeated, c = bd ? '#9fe8ff' : '#b07aff'; this.bigCrystal.mt.color.set(c); this.bigCrystal.mt.emissive.set(c); this.bigCrystal.gl.material.color.set(c); this.bigCrystal.c1.rotation.y = t * 0.6; this.bigCrystal.mt.emissiveIntensity = 0.7 + Math.sin(t * 2) * 0.25; }
    for (const l of this.lamps) l.material.opacity = 0.5 + Math.sin(t * 5 + l.position.x) * 0.06;
    if (this.trapped) { this.trapped.gr.visible = !fl.cristarta; this.trapped.tm.pose({ moving: false, t, down: false }); this.trapped.bub.scale.setScalar(1 + Math.sin(t * 2) * 0.03); }
    for (const fn of this.anim) fn(this.t);
    // golpe da espada e marcação do chefe
    const sw = p.swingT < 0.18 && g.mode === 'play';
    this.slash.visible = sw;
    if (sw) { const k = p.swingT / 0.18; this.slash.position.set(p.x * U, 0.9, p.y * U); this.slash.rotation.y = -(p.aim - 1.1 + k * 2.2); this.slash.scale.setScalar(1 + k * 0.35); this.slashMesh.material.opacity = 0.9 * (1 - k * 0.7); this.slashMesh.material.color.set(p.weapon === 'sword_crystal' ? '#bff3ff' : '#ffffff'); }
    const bs = g.boss && g.boss.state === 'slam' && g.boss.target;
    this.tele.visible = !!bs; if (bs) { const b = g.boss; this.tele.position.set(b.target.x * U, 0.07, b.target.y * U); this.tele.scale.setScalar((b.slamR || 42) * U); this.teleFill.scale.setScalar(Math.max(0.02, b.windup)); }
    // partículas do jogo
    let n = 0; const fp = this.fxPos, fc = this.fxCol;
    for (const q of g.fx.parts) {
      if (n >= this.fxN) break; const c = this.color(q.col), k = Math.max(0, 1 - q.t / q.life);
      fp[n * 3] = q.x * U; fp[n * 3 + 1] = (q.z !== undefined ? q.z : 8) * U + 0.1; fp[n * 3 + 2] = q.y * U; fc[n * 3] = c.r * k; fc[n * 3 + 1] = c.g * k; fc[n * 3 + 2] = c.b * k; n++;
    }
    this.fxPts.geometry.setDrawRange(0, n); this.fxPts.geometry.attributes.position.needsUpdate = true; this.fxPts.geometry.attributes.color.needsUpdate = true;
    this.updateCamera(g, dt);
  }
  updateCamera(g, dt) {
    const p = g.player, inp = g.input, k = Math.min(1, dt * 8);
    this.target.x += (p.x * U - this.target.x) * k; this.target.z += (p.y * U - this.target.z) * k; this.target.y = 0.9;
    let dyw = (inp.yaw || 0) - this.yaw; while (dyw > Math.PI) dyw -= Math.PI * 2; while (dyw < -Math.PI) dyw += Math.PI * 2; this.yaw += dyw * Math.min(1, dt * 10);
    this.distGoal = Math.max(8, Math.min(22, this.distGoal + (inp.zoomAxis || 0) * dt * 9));
    const want = this.distGoal + (g.boss && g.boss.state !== 'sleep' ? 3 : 0); this.dist += (want - this.dist) * Math.min(1, dt * 4);
    const h = this.dist * Math.cos(this.pitch), sh = g.fx.shake * 0.05;
    this.cam.position.set(this.target.x + Math.sin(this.yaw) * h + (Math.random() - 0.5) * sh, this.target.y + this.dist * Math.sin(this.pitch) + (Math.random() - 0.5) * sh, this.target.z + Math.cos(this.yaw) * h);
    this.cam.lookAt(this.target); this.cam.updateMatrixWorld();
    this.sun.position.copy(this.target).add(this.sunOff); this.sun.target.position.copy(this.target); this.sun.target.updateMatrixWorld();
  }
  render() {
    if (this.post) { try { this.post.render(); return; } catch (e) { console.warn('Pós-processamento desligado:', e); this.post = null; } }
    this.r.render(this.scene, this.cam);
  }

  // interface 2D por cima do 3D: barras de vida e números de dano
  drawOverlay(ctx, g) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    for (const e of g.enemies) {
      if (e.hp <= 0 || e.boss || e.hp >= e.maxHp) continue;
      const q = this.project(e.x, e.y, (e.alpha ? 2.1 : 1.35)); if (q.z > 1) continue;
      const w = 18, k = e.hp / e.maxHp; ctx.fillStyle = '#1a1424'; ctx.fillRect(Math.round(q.x - w / 2 - 1), Math.round(q.y - 1), w + 2, 4); ctx.fillStyle = '#ff4f6a'; ctx.fillRect(Math.round(q.x - w / 2), Math.round(q.y), Math.round(w * k), 2);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const tx of g.fx.texts) {
      const q = this.project(tx.gx !== undefined ? tx.gx : tx.x, tx.gy !== undefined ? tx.gy : tx.y, 1.5 + tx.t * 1.6); if (q.z > 1) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, 2.2 - tx.t * 2.4)); ctx.font = (tx.big ? 'bold 11px ' : 'bold 9px ') + FONT;
      const x = Math.round(q.x), y = Math.round(q.y); ctx.fillStyle = '#1a1424'; ctx.fillText(tx.s, x + 1, y + 1); ctx.fillText(tx.s, x - 1, y); ctx.fillStyle = tx.col; ctx.fillText(tx.s, x, y);
    }
    ctx.globalAlpha = 1;
  }
}
