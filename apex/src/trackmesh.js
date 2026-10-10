import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THEMES, SPONSORS } from './data.js';
import { pointAt } from './trackgen.js';
import * as TX from './textures.js';

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// fita ao longo da pista. fn(i) -> [latA, yA, latB, yB]
function ribbon(t, fn, vScale, mat, opt = {}) {
  const n = t.n, pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const k = i % n, [la, ya, lb, yb] = fn(k);
    pos.push(t.x[k] + t.rx[k] * la, t.y[k] + ya, t.z[k] + t.rz[k] * la, t.x[k] + t.rx[k] * lb, t.y[k] + yb, t.z[k] + t.rz[k] * lb);
    const v = (i * t.ds) / vScale;
    if (opt.swap) uv.push(v, 0, v, 1); else uv.push(0, v, 1, v);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = opt.shadow !== false; m.castShadow = false;
  return m;
}

function colorGeo(geo, hex) {
  const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (geo.index) geo = geo.toNonIndexed ? geo : geo; return geo;
}
function G(geo, hex, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.deleteAttribute('uv');
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(sx, sy, sz));
  g.applyMatrix4(m);
  colorGeo(g, hex);
  return g;
}
const CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s, 1);
const ICO = (d = 1) => new THREE.IcosahedronGeometry(1, d);

function jitter(geo, amt, seed) {
  const r = rng(seed), p = geo.attributes.position, map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3);
    if (!map.has(k)) map.set(k, [(r() - .5) * amt, (r() - .5) * amt, (r() - .5) * amt]);
    const o = map.get(k); p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]);
  }
  geo.computeVertexNormals(); return geo;
}

// ---------- modelos de cenario (geometria mesclada com cores por vertice) ----------
const KINDS = {
  tree() {
    return mergeGeometries([
      G(CYL(0.25, 0.4, 3.2, 7), '#5b4030', 0, 1.6, 0),
      G(ICO(1), '#3f8a3a', 0, 4.6, 0, 2.6, 2.3, 2.6), G(ICO(1), '#4a9a42', 1.0, 3.8, 0.5, 1.8, 1.6, 1.8), G(ICO(1), '#357a32', -1.0, 3.7, -0.6, 1.9, 1.7, 1.9),
    ]);
  },
  pine() {
    return mergeGeometries([
      G(CYL(0.22, 0.35, 2.2, 7), '#4e3a2a', 0, 1.1, 0),
      G(new THREE.ConeGeometry(2.4, 3.6, 9, 1), '#24582f', 0, 3.6, 0), G(new THREE.ConeGeometry(1.9, 3.2, 9, 1), '#2a6636', 0, 5.4, 0), G(new THREE.ConeGeometry(1.3, 2.8, 9, 1), '#2f7a3d', 0, 7.1, 0),
    ]);
  },
  snowpine() {
    return mergeGeometries([
      G(CYL(0.22, 0.35, 2.2, 7), '#4e3a2a', 0, 1.1, 0),
      G(new THREE.ConeGeometry(2.4, 3.6, 9, 1), '#2d5a45', 0, 3.6, 0), G(new THREE.ConeGeometry(1.9, 3.2, 9, 1), '#e9f1f5', 0, 5.4, 0), G(new THREE.ConeGeometry(1.3, 2.8, 9, 1), '#f4f8fb', 0, 7.1, 0),
    ]);
  },
  sakura() {
    return mergeGeometries([
      G(CYL(0.28, 0.45, 3.4, 7), '#5a4036', 0, 1.7, 0),
      G(ICO(1), '#f4b6cc', 0, 4.8, 0, 2.7, 2.1, 2.7), G(ICO(1), '#f8c8d8', 1.4, 4.1, 0.6, 1.8, 1.5, 1.8), G(ICO(1), '#eea2bd', -1.3, 4.0, -0.5, 1.9, 1.5, 1.9), G(ICO(1), '#fbd6e2', 0.1, 6.1, 0.3, 1.5, 1.2, 1.5),
    ]);
  },
  palm() {
    const parts = [];
    let x = 0, y = 0, a = 0;
    for (let i = 0; i < 6; i++) {
      const h = 1.5; a += 0.07;
      parts.push(G(CYL(0.22 - i * 0.015, 0.26 - i * 0.015, h, 7), '#8a6b48', x, y + h / 2, 0, 1, 1, 1, 0, -a));
      x += Math.sin(a) * h; y += Math.cos(a) * h;
    }
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const leaf = G(new THREE.SphereGeometry(1, 6, 4), i % 2 ? '#2f9a46' : '#3aa851', 0, 0, 0, 2.6, 0.08, 0.55);
      const m = new THREE.Matrix4().makeRotationY(ang).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0)).multiply(new THREE.Matrix4().makeRotationZ(-0.35));
      m.premultiply(new THREE.Matrix4().makeTranslation(x, y, 0));
      // folha parte do topo, deslocada para fora
      const t0 = new THREE.Matrix4().makeTranslation(2.4, 0, 0);
      leaf.applyMatrix4(t0); leaf.applyMatrix4(m);
      parts.push(leaf);
    }
    return mergeGeometries(parts);
  },
  cactus() {
    return mergeGeometries([
      G(new THREE.CapsuleGeometry(0.45, 3.6, 4, 8), '#4f8f4a', 0, 2.3, 0),
      G(new THREE.CapsuleGeometry(0.28, 1.2, 4, 8), '#4f8f4a', 0.9, 2.5, 0), G(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), '#4f8f4a', 0.9, 3.4, 0, 1, 1, 1, 0, 0),
      G(new THREE.CapsuleGeometry(0.26, 1.0, 4, 8), '#58994f', -0.9, 2.9, 0), G(new THREE.CapsuleGeometry(0.22, 0.8, 4, 8), '#58994f', -0.9, 3.6, 0),
    ]);
  },
  rock() {
    const g = jitter(new THREE.IcosahedronGeometry(1, 1), 0.35, 4);
    return mergeGeometries([G(g, '#8d8a85', 0, 0.6, 0, 2.4, 1.6, 2.1), G(jitter(new THREE.IcosahedronGeometry(1, 1), 0.3, 9), '#9c9893', 1.8, 0.3, 0.8, 1.3, 0.9, 1.2)]);
  },
  bush() {
    return mergeGeometries([G(ICO(1), '#43803a', 0, 0.7, 0, 1.5, 1.0, 1.5), G(ICO(1), '#4d8f43', 0.9, 0.5, 0.4, 1.0, 0.8, 1.0), G(ICO(1), '#3a7433', -0.8, 0.5, -0.3, 1.1, 0.8, 1.1)]);
  },
  lamp() {
    return mergeGeometries([
      G(CYL(0.12, 0.16, 9, 6), '#555a62', 0, 4.5, 0), G(new THREE.BoxGeometry(2.4, 0.18, 0.35), '#555a62', 1.1, 9.0, 0),
      G(new THREE.BoxGeometry(0.9, 0.18, 0.5), '#fff2c8', 2.2, 8.9, 0),
    ]);
  },
};

const BUILD_COLORS = ['#ffffff', '#e8e2da', '#cfd8e3', '#e3d3c6', '#d6dde0'];

function boxWithUV(w, h, d, tw) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, nrm = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ny = Math.abs(nrm.getY(i));
    if (ny > 0.5) { uv.setXY(i, 0.01, 0.01); continue; } // topo: pega pixel de parede
    const horiz = Math.abs(nrm.getX(i)) > 0.5 ? d : w;
    uv.setXY(i, uv.getX(i) * horiz / tw, uv.getY(i) * h / tw);
  }
  g.translate(0, h / 2, 0);
  return g;
}

export function buildTrackWorld(t, opts = {}) {
  const cfg = t.cfg, th = THEMES[cfg.theme], night = !!th.night;
  const root = new THREE.Group();
  const quality = opts.quality || 'high';
  const D = t.D, w = t.w, K = t.kerb;
  const rand = rng(cfg.len * 13 + 7);
  TX.setAniso(quality === 'low' ? 2 : 8);

  // --- materiais
  const asTex = TX.asphaltTex();
  const asMat = new THREE.MeshStandardMaterial({ map: asTex, roughness: 0.92, metalness: 0.0 });
  const kerbMat = new THREE.MeshStandardMaterial({ map: TX.kerbTex(), roughness: 0.7 });
  const grTex = TX.grassTex(th.grass[0], th.grass[1]);
  const grMat = new THREE.MeshStandardMaterial({ map: grTex, roughness: 1 });
  const wallTexture = TX.wallTex(SPONSORS.slice(0, 8));
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.6, side: THREE.DoubleSide });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });

  // --- pista (u=0..1 atravessa a pista; v ao longo)
  const road = ribbon(t, () => [-w, 0, w, 0], w * 2, asMat); root.add(road);
  for (const sgn of [-1, 1]) {
    // zebra
    root.add(ribbon(t, () => sgn < 0 ? [-w - K, 0.035, -w, 0.01] : [w, 0.01, w + K, 0.035], 8, kerbMat));
    // grama do acostamento
    const grassVerge = ribbon(t, () => sgn < 0 ? [-D, -0.02, -w - K, 0.0] : [w + K, 0.0, D, -0.02], 10, grMat);
    grassVerge.material = grMat; root.add(grassVerge);
    // muro
    const wall = ribbon(t, () => [sgn * D, -0.1, sgn * D, 1.25], 32, wallMat, { swap: true, shadow: true });
    wall.castShadow = true; root.add(wall);
    // talude externo ate o chao
    root.add(ribbon(t, i => {
      const drop = Math.max(18, t.y[i] * 1.8 + 6);
      return sgn < 0 ? [-D - drop, -t.y[i] - 0.12, -D, -0.02] : [D, -0.02, D + drop, -t.y[i] - 0.12];
    }, 10, grMat));
    // linha de borda
    root.add(ribbon(t, () => sgn < 0 ? [-w + 0.25, 0.02, -w + 0.55, 0.02] : [w - 0.55, 0.02, w - 0.25, 0.02], 10, lineMat, { shadow: false }));
  }
  // linha de largada xadrez (indice 0)
  {
    const cm = new THREE.MeshStandardMaterial({ map: TX.checkerTex(), roughness: 0.8 });
    cm.map.repeat.set(w * 2 / 1.5, 3); cm.map.wrapS = cm.map.wrapT = THREE.RepeatWrapping;
    const g = new THREE.PlaneGeometry(w * 2, 3.0); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, cm); m.position.set(t.x[0], t.y[0] + 0.03, t.z[0]); m.rotation.y = t.hdg[0] + Math.PI / 2; m.rotation.y = t.hdg[0] - Math.PI / 2;
    // plano local: largura em X. precisa que X aponte para direita da pista
    m.rotation.y = t.hdg[0];
    m.receiveShadow = true; root.add(m);
    // marcas de grid
    const slot = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    for (let k = 0; k < 20; k++) {
      const row = k >> 1, side = (k & 1) ? 1 : -1;
      const p = pointAt(t, -(7 + row * 8.5), side * 3.4);
      const sg = new THREE.PlaneGeometry(2.4, 0.16); sg.rotateX(-Math.PI / 2);
      const sm = new THREE.Mesh(sg, slot); sm.position.set(p.x, p.y + 0.03, p.z); sm.rotation.y = p.hdg; root.add(sm);
      const sg2 = new THREE.PlaneGeometry(0.16, 1.4); sg2.rotateX(-Math.PI / 2);
      const sm2 = new THREE.Mesh(sg2, slot); sm2.position.set(p.x - Math.cos(p.hdg) * 1.2 * 1, p.y + 0.03, p.z + Math.sin(p.hdg) * 1.2 * 1); sm2.rotation.y = p.hdg; root.add(sm2);
    }
    // portico de largada
    const gm = new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.5, metalness: 0.4 });
    const ph = pointAt(t, 0, 0);
    const gg = new THREE.Group(); gg.position.set(ph.x, ph.y, ph.z); gg.rotation.y = t.hdg[0];
    for (const sgn of [-1, 1]) { const pm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 8, 0.7), gm); pm.position.set(sgn * (w + 2.2), 4, 0); pm.castShadow = true; gg.add(pm); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry((w + 2.2) * 2 + 1, 1.8, 0.8), new THREE.MeshStandardMaterial({ map: TX.bannerTex('APEX'), roughness: 0.5 }));
    beam.position.set(0, 8, 0); beam.castShadow = true; gg.add(beam);
    root.add(gg);
  }

  // --- chao / ilha / agua
  let maxX = 0, maxZ = 0; for (let i = 0; i < t.n; i++) { maxX = Math.max(maxX, Math.abs(t.x[i])); maxZ = Math.max(maxZ, Math.abs(t.z[i])); }
  const gtex = TX.grassTex(th.ground, th.grass[1]); gtex.repeat.set(160, 160);
  const gmat = new THREE.MeshStandardMaterial({ map: gtex, roughness: 1, color: 0xffffff });
  if (th.water) {
    const seg = 96, gg = new THREE.CircleGeometry(1, seg); gg.rotateX(-Math.PI / 2);
    const p = gg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z);
      const wob = 1 + 0.10 * Math.sin(3 * a + 1) + 0.07 * Math.sin(5 * a + 2) + 0.04 * Math.sin(9 * a);
      p.setXYZ(i, Math.cos(a) * r * (maxX + 330) * wob, -0.1, Math.sin(a) * r * (maxZ + 330) * wob);
    }
    const uvs = gg.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, p.getX(i) / 30, p.getZ(i) / 30);
    gtex.repeat.set(1, 1);
    const island = new THREE.Mesh(gg, gmat); island.receiveShadow = true; root.add(island);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: night ? 0x0b1f3a : 0x1e78b8, roughness: 0.12, metalness: 0.25 }));
    sea.position.y = -1.2; root.add(sea);
  } else {
    const big = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), gmat);
    big.position.y = -0.1; big.receiveShadow = true; root.add(big);
  }
  const inside = (x, z) => {
    if (!th.water) return true;
    const a = Math.atan2(z, x), wob = 1 + 0.10 * Math.sin(3 * a + 1) + 0.07 * Math.sin(5 * a + 2) + 0.04 * Math.sin(9 * a);
    return (x / ((maxX + 330) * wob * 0.9)) ** 2 + (z / ((maxZ + 330) * wob * 0.9)) ** 2 < 1;
  };

  // --- hash espacial p/ evitar colocar objetos sobre a pista
  const CELL = 60, hash = new Map();
  for (let i = 0; i < t.n; i += 2) { const k = Math.floor(t.x[i] / CELL) + ',' + Math.floor(t.z[i] / CELL); (hash.get(k) || hash.set(k, []).get(k)).push(i); }
  const clear = (x, z, dist) => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const l = hash.get((cx + a) + ',' + (cz + b)); if (!l) continue;
      for (const i of l) if ((t.x[i] - x) ** 2 + (t.z[i] - z) ** 2 < dist * dist) return false;
    }
    return true;
  };

  // --- cenario instanciado
  const dummy = new THREE.Object3D();
  const counts = quality === 'low' ? 0.45 : quality === 'medium' ? 0.75 : 1;
  const kinds = [...new Set(th.scenery)];
  const matV = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  const lampEmis = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: night ? 0xffd890 : 0x000000, emissiveIntensity: night ? 0.5 : 0 });
  for (const kind of kinds) {
    if (kind === 'building') continue;
    const geo = KINDS[kind]();
    const share = th.scenery.filter(k => k === kind).length / th.scenery.length;
    const want = Math.round((kind === 'lamp' ? 1 : 1) * (kind === 'lamp' ? t.n / 14 : 520) * share * counts * (kind === 'rock' ? 0.7 : 1));
    const list = [];
    for (let tries = 0; list.length < want && tries < want * 12; tries++) {
      const i = (rand() * t.n) | 0, side = rand() > 0.5 ? 1 : -1;
      let lat;
      const minLat = D + Math.max(18, t.y[i] * 1.8 + 6) + 4;
      if (kind === 'lamp') { lat = D + 3; if ((i % 14) !== 0) continue; } else lat = minLat + Math.pow(rand(), 1.5) * 110;
      const x = t.x[i] + t.rx[i] * side * lat, z = t.z[i] + t.rz[i] * side * lat;
      if (!inside(x, z) || !clear(x, z, D + (kind === 'lamp' ? 1.5 : 8))) continue;
      const base = kind === 'lamp' ? Math.max(0, t.y[i] - Math.max(0, 0)) : 0;
      list.push([x, kind === 'lamp' ? t.y[i] : -0.1 + (side * 0), z, rand() * 6.28, kind === 'lamp' ? 1 : 0.8 + rand() * 0.9, side, i]);
    }
    const mesh = new THREE.InstancedMesh(geo, kind === 'lamp' ? lampEmis : matV, list.length);
    const col = new THREE.Color();
    list.forEach((o, k) => {
      let y = o[1];
      if (kind !== 'lamp') {
        // altura do terreno: no talude externo, o objeto precisa ficar sobre o chao (y~0)
        y = -0.1;
      }
      dummy.position.set(o[0], y, o[2]);
      dummy.rotation.set(0, kind === 'lamp' ? Math.atan2(-o[5] * t.rx[o[6]], -o[5] * t.rz[o[6]]) + Math.PI / 2 : o[3], 0);
      if (kind === 'lamp') { dummy.rotation.y = t.hdg[o[6]] + (o[5] > 0 ? Math.PI : 0); }
      const s = o[4] * (kind === 'rock' ? 1.6 : 1); dummy.scale.set(s, s * (0.9 + rand() * 0.35), s);
      dummy.updateMatrix(); mesh.setMatrixAt(k, dummy.matrix);
      col.setHSL(0, 0, 0.82 + rand() * 0.25); mesh.setColorAt(k, col);
    });
    mesh.castShadow = kind !== 'bush' && kind !== 'lamp'; mesh.receiveShadow = false; mesh.frustumCulled = false;
    root.add(mesh);
  }
  // predios
  if (kinds.includes('building')) {
    const wt = TX.windowTex(night); const em = night ? TX.windowEmissiveTex() : null;
    const defs = [[16, 40, 16], [22, 70, 18], [14, 26, 24], [26, 52, 20], [18, 95, 18]];
    const want = Math.round(120 * counts);
    defs.forEach((dd, di) => {
      const geo = boxWithUV(dd[0], dd[1], dd[2], 14);
      const mat = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.55, metalness: 0.15, emissive: night ? 0xffffff : 0x000000, emissiveMap: em, emissiveIntensity: night ? 1.0 : 0 });
      const list = [];
      for (let tries = 0; list.length < want / defs.length && tries < 500; tries++) {
        const i = (rand() * t.n) | 0, side = rand() > 0.5 ? 1 : -1, lat = D + Math.max(18, t.y[i] * 1.8 + 6) + 30 + rand() * 120;
        const x = t.x[i] + t.rx[i] * side * lat, z = t.z[i] + t.rz[i] * side * lat;
        if (!clear(x, z, D + 26)) continue;
        list.push([x, z, rand() * 6.28]);
      }
      const mesh = new THREE.InstancedMesh(geo, mat, list.length), col = new THREE.Color();
      list.forEach((o, k) => {
        dummy.position.set(o[0], -0.1, o[1]); dummy.rotation.set(0, Math.round(o[2] / 1.5708) * 1.5708 + (rand() - .5) * 0.2, 0); dummy.scale.set(1, 0.8 + rand() * 0.6, 1);
        dummy.updateMatrix(); mesh.setMatrixAt(k, dummy.matrix); col.set(BUILD_COLORS[(rand() * BUILD_COLORS.length) | 0]); mesh.setColorAt(k, col);
      });
      mesh.castShadow = true; mesh.frustumCulled = false; root.add(mesh);
    });
  }

  // --- arquibancadas
  {
    const ct = TX.crowdTex(); ct.repeat.set(30, 1);
    const stMat = new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9 });
    const concrete = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd9dde3, roughness: 0.4, metalness: 0.3 });
    const addStand = (s0, len, side) => {
      const p = pointAt(t, s0, 0);
      const g = new THREE.Group(); g.position.set(p.x, p.y, p.z); g.rotation.y = p.hdg;
      for (let k = 0; k < 5; k++) {
        const bx = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6 + k * 1.6, len), k === 0 ? concrete : stMat);
        bx.position.set(-side * (D + 5 + k * 3.2), (1.6 + k * 1.6) / 2, 0); bx.castShadow = true; bx.receiveShadow = true; g.add(bx);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, len), roofMat); roof.position.set(-side * (D + 13), 11, 0); roof.rotation.z = side * 0.06; roof.castShadow = true; g.add(roof);
      for (const zz of [-len / 2 + 2, 0, len / 2 - 2]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 6), roofMat); pole.position.set(-side * (D + 20), 5.5, zz); g.add(pole); }
      root.add(g);
    };
    addStand(60, 150, 1); addStand(60, 150, -1);
    // curva mais fechada: arquibancada extra
    let bi = 0; for (let i = 0; i < t.n; i++) if (Math.abs(t.curv[i]) > Math.abs(t.curv[bi])) bi = i;
    addStand(bi * t.ds - 20, 90, t.curv[bi] > 0 ? -1 : 1);
  }

  // --- montanhas distantes
  if (th.mount) {
    const parts = [];
    const R = Math.max(maxX, maxZ) + 1100;
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2 + rand() * 0.3, h = 260 + rand() * 340, rad = 280 + rand() * 260;
      const g = new THREE.ConeGeometry(rad, h, 14, 8, true); g.translate(0, h / 2, 0);
      const p = g.attributes.position, col = new Float32Array(p.count * 3), base = new THREE.Color(th.mountCol), snow = new THREE.Color('#f4f7fb');
      const sd = rand() * 100;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), f = y / h, ang = Math.atan2(p.getZ(i), p.getX(i));
        const n = Math.sin(ang * 5 + sd) * 0.18 + Math.sin(ang * 11 + sd * 2) * 0.08 + Math.sin(y * 0.03 + sd) * 0.06;
        const sc = 1 + n * (1 - f);
        p.setXYZ(i, p.getX(i) * sc, y * (1 + n * 0.1), p.getZ(i) * sc);
        const c = base.clone().lerp(new THREE.Color('#3f5a3a'), Math.max(0, 0.5 - f) * 0.7);
        if (th.snowcap && f > 0.62 - n * 0.3) c.lerp(snow, Math.min(1, (f - 0.6) * 6));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv');
      g.computeVertexNormals(); g.translate(Math.cos(a) * R * (1 + rand() * 0.15), -2, Math.sin(a) * R * (1 + rand() * 0.15));
      parts.push(g.toNonIndexed());
    }
    const mm = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, flatShading: false }));
    mm.frustumCulled = false; root.add(mm);
  }

  // --- nuvens
  if (!night) {
    const ct = TX.cloudTex();
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthWrite: false, fog: false, opacity: 0.85 }));
      const a = rand() * 6.28, r = 500 + rand() * 1800;
      s.position.set(Math.cos(a) * r, 380 + rand() * 260, Math.sin(a) * r); s.scale.set(700 + rand() * 600, 260 + rand() * 120, 1); root.add(s);
    }
  }
  root.userData.theme = th; root.userData.asMat = asMat;
  return root;
}
