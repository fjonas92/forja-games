// Modelos 3D low-poly: herói, moradores, criaturas, inimigos e o Golem Guardião
import * as THREE from './three.js';
import { PALETTES } from './sprites.js';

/* ---------- utilidades ---------- */
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...o });
export const glowMat = (color, k = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.4, metalness: 0 });
// caixa de cantos arredondados (normais suaves): troca o visual "bloco" por algo macio
function rbox(w, h, d, r) {
  r = Math.min(r !== undefined ? r : Math.min(w, h, d) * 0.32, Math.min(w, h, d) / 2 - 0.001);
  const g = new THREE.BoxGeometry(w, h, d, 4, 4, 4), p = g.attributes.position, n = g.attributes.normal, hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    v.sub(c); if (v.lengthSq() > 1e-9) { v.normalize(); n.setXYZ(i, v.x, v.y, v.z); v.multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z); }
  }
  return g;
}
const B = (w, h, d, r) => rbox(w, h, d, r);
const R = (w, h, d) => rbox(w, h, d, Math.min(0.06, Math.min(w, h, d) / 2 - 0.001)); // caixa de arquitetura (quase reta)
const S = (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
const C = (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg);
const K = (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg);
const O = r => new THREE.OctahedronGeometry(r);
export const geo = { B, R, S, C, K, O };

export function add(parent, g, color, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(g, o.mat || std(color, o.m));
  m.position.set(x, y, z); m.castShadow = o.shadow !== false;
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  parent.add(m); return m;
}
export function pivot(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
export function blob(r, a = 0.3) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: a, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.renderOrder = 1; return m;
}
let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace; return _glow;
}
export function glow(color, size, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}
const lerpAng = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
const collect = g => { const mats = []; g.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !o.userData.noFlash) mats.push(o.material); }); return mats; };

// envelope comum: grupo, giro suave, brilho de dano e descarte
function wrap(group, extra = {}) {
  const m = { group, ry: 0, mats: null, flashing: false, ...extra };
  m.face = (a, k = 0.3) => { m.ry = lerpAng(m.ry, a, k); group.rotation.y = m.ry; };
  m.setFace = a => { m.ry = a; group.rotation.y = a; };
  m.flash = on => {
    if (!m.mats) m.mats = collect(group).map(mt => ({ mt, e: mt.emissive.getHex(), i: mt.emissiveIntensity }));
    if (on === m.flashing) return; m.flashing = on;
    m.mats.forEach(({ mt, e, i }) => { if (on) { mt.emissive.setHex(0xffffff); mt.emissiveIntensity = 0.85; } else { mt.emissive.setHex(e); mt.emissiveIntensity = i; } });
  };
  m.dispose = () => { group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(x => { if (x.map && x.map !== _glow) x.map.dispose(); x.dispose(); }); }); };
  return m;
}
// ângulo de giro (em Y) para um vetor (dx, dz) do mundo; o modelo olha para +Z
export const yawOf = (dx, dz) => Math.atan2(dx, dz);
export const DIR_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

/* ---------- humanos: Kael e os moradores ---------- */
export function makeHumanoid(pal, opts = {}) {
  const P = PALETTES[pal] || PALETTES.hero, group = new THREE.Group();
  group.add(blob(0.42));
  const root = pivot(group, 0, 0.7, 0), body = pivot(root, 0, -0.7, 0);
  const legL = pivot(body, -0.12, 0.5, 0), legR = pivot(body, 0.12, 0.5, 0);
  [legL, legR].forEach(l => { add(l, B(0.17, 0.36, 0.19), P.p, 0, -0.18, 0); add(l, B(0.19, 0.16, 0.25), P.L, 0, -0.42, 0.03); });
  const torso = add(body, B(0.5, 0.48, 0.3), P.b, 0, 0.78, 0);
  add(body, B(0.52, 0.07, 0.32), P.L, 0, 0.56, 0); add(body, B(0.09, 0.09, 0.02), P.g, 0, 0.56, 0.165);
  add(body, B(0.3, 0.05, 0.31), P.w, 0, 1.0, 0);
  const head = pivot(body, 0, 1.02, 0);
  add(head, B(0.46, 0.42, 0.42, 0.19), P.s, 0, 0.2, 0);
  add(head, B(0.5, 0.16, 0.46), P.h, 0, 0.43, 0); add(head, B(0.5, 0.34, 0.14), P.h, 0, 0.25, -0.18);
  [-1, 1].forEach(s => { add(head, B(0.05, 0.26, 0.38), P.h, s * 0.255, 0.28, -0.02); add(head, B(0.07, 0.09, 0.02), P.e, s * 0.1, 0.2, 0.215); });
  add(head, B(0.46, 0.1, 0.05), P.h, 0, 0.38, 0.22);
  const arm = (x) => { const a = pivot(body, x, 0.98, 0); add(a, B(0.14, 0.28, 0.14), P.b, 0, -0.14, 0); add(a, B(0.12, 0.13, 0.12), P.s, 0, -0.34, 0); return a; };
  const armL = arm(-0.34), armR = arm(0.34);
  const m = wrap(group, { root, body, head, legL, legR, armL, armR, swordPivot: null, weapon: null, pal });
  // acessórios de cada personagem
  if (pal === 'hero') {
    add(body, B(0.44, 0.62, 0.05), P.B, 0, 0.74, -0.19, { r: [0.12, 0, 0] });
    // visual do Kael como na arte original: cabelo castanho bagunçado, tunica azul com lenço e detalhes dourados, luvas escuras, botas azuis
    head.scale.setScalar(1.3);
    [[-0.2, 0.5, 0.02, 0.5, -0.7], [-0.1, 0.56, 0.02, 0.3, -0.3], [0.0, 0.6, 0.04, 0.2, 0.0], [0.1, 0.57, 0.03, 0.1, 0.3], [0.2, 0.5, 0.0, -0.2, 0.7], [-0.12, 0.5, -0.14, 0.8, -0.3], [0.1, 0.5, -0.14, 0.8, 0.3], [0.0, 0.46, -0.2, 0.9, 0.0]].forEach(([x, y, z, rx, rz]) => add(head, K(0.1, 0.34, 4), P.h, x, y, z, { r: [rx * 0.6, 0, rz] }));
    [-0.14, 0, 0.14].forEach((x, i) => add(head, B(0.16, 0.13, 0.05, 0.03), P.h, x, 0.36 - (i === 1 ? 0.04 : 0), 0.235, { r: [0.15, 0, (i - 1) * 0.3] }));
    [-1, 1].forEach(sd => { add(head, B(0.12, 0.17, 0.025), '#1a1018', sd * 0.115, 0.19, 0.222); add(head, B(0.035, 0.04, 0.02), '#ffffff', sd * 0.13, 0.235, 0.236); add(head, K(0.05, 0.2, 4), P.h, sd * 0.27, 0.12, -0.02, { r: [0, 0, sd * 0.25] }); });
    add(body, B(0.5, 0.17, 0.42, 0.07), P.B, 0, 1.02, 0); add(body, B(0.51, 0.03, 0.43), P.g, 0, 0.94, 0);
    [-1, 1].forEach(sd => { add(body, S(0.17, 8, 6), P.b, sd * 0.35, 1.0, 0, { s: [1, 0.7, 1.15] }); add(body, B(0.2, 0.03, 0.2), P.g, sd * 0.35, 0.92, 0); }); add(body, B(0.32, 0.5, 0.05), P.B, 0.05, 0.82, 0.17, { r: [0, 0, -0.35] });
    add(body, B(0.2, 0.55, 0.05), P.B, 0.1, 0.55, -0.24, { r: [0.25, 0, 0.1] });
    add(body, B(0.54, 0.14, 0.34), P.b, 0, 0.5, 0); add(body, B(0.55, 0.035, 0.35), P.g, 0, 0.43, 0); add(body, B(0.3, 0.035, 0.31), P.g, 0, 0.94, 0.0);
    add(body, B(0.1, 0.1, 0.03), P.g, 0, 0.56, 0.175);
    [armL, armR].forEach(a => { add(a, B(0.17, 0.16, 0.17), P.B, 0, -0.26, 0); add(a, B(0.18, 0.035, 0.18), P.g, 0, -0.18, 0); add(a, B(0.14, 0.12, 0.14), '#232a4a', 0, -0.34, 0); });
    [legL, legR].forEach(l => { add(l, B(0.2, 0.2, 0.26), '#2a46a8', 0, -0.4, 0.03); add(l, B(0.21, 0.04, 0.27), P.g, 0, -0.3, 0.03); });
    m.swordPivot = pivot(armR, 0, -0.34, 0.04); m.swordPivot.rotation.x = -1.2;
  } else if (pal === 'elder') {
    add(body, B(0.58, 0.4, 0.38), P.B, 0, 0.4, 0); add(body, B(0.3, 0.26, 0.1), P.h, 0, 1.0, 0.2);
    add(armR, C(0.025, 0.03, 1.5), '#7a4a2a', 0.0, -0.1, 0.12); add(armR, O(0.1), '#7fd6ff', 0, 0.68, 0.12, { mat: glowMat('#7fd6ff', 0.9), s: [1, 1.4, 1] });
  } else if (pal === 'merchant') {
    add(body, B(0.42, 0.5, 0.24), '#8a5530', 0, 0.82, -0.27); add(body, B(0.46, 0.12, 0.26), '#5a2e1a', 0, 1.08, -0.27); add(body, B(0.14, 0.16, 0.1), P.g, -0.2, 0.52, 0.18);
  } else if (pal === 'smith') {
    add(body, B(0.46, 0.5, 0.04), '#3a2414', 0, 0.76, 0.17); torso.scale.x = 1.15;
    add(armR, C(0.03, 0.03, 0.5), '#6a4024', 0, -0.4, 0.1, { r: [0.4, 0, 0] }); add(armR, B(0.2, 0.14, 0.12), '#b9b9c4', 0, -0.62, 0.22);
  } else if (pal === 'kid') {
    [-1, 1].forEach(s => add(head, S(0.1), P.h, s * 0.3, 0.1, -0.05)); add(body, B(0.2, 0.08, 0.04), P.g, 0, 1.0, 0.16);
  } else if (pal === 'guard') {
    add(head, S(0.3, 10, 6), '#9aa4b8', 0, 0.38, 0, { s: [1, 0.8, 1.05] }); add(head, B(0.05, 0.22, 0.2), '#d8462e', 0, 0.65, -0.05);
    add(armR, C(0.025, 0.025, 2.0), '#7a4a2a', 0, 0.2, 0.12); add(armR, K(0.07, 0.3, 4), '#d0d4de', 0, 1.25, 0.12);
    add(body, B(0.54, 0.1, 0.34), '#8a2a2a', 0, 0.97, 0);
  } else if (pal === 'laylla') {
    add(head, B(0.16, 0.46, 0.16, 0.07), P.h, 0, 0.1, -0.3, { r: [0.35, 0, 0] }); add(head, S(0.1, 6, 5), P.H, 0, 0.42, -0.3);
    add(body, B(0.38, 0.1, 0.36), P.w, 0, 1.02, 0); add(body, B(0.14, 0.4, 0.04), P.B, 0.08, 0.86, 0.17);
    add(body, C(0.06, 0.06, 0.6, 6), '#6a4024', 0.16, 0.9, -0.22, { r: [0.15, 0, 0.35] }); [0, 1, 2].forEach(i => add(body, K(0.035, 0.12, 4), '#d0d4de', 0.26 + i * 0.015, 1.24 + i * 0.01, -0.22 + i * 0.03, { r: [0.15, 0, 0.35] }));
    add(body, B(0.54, 0.34, 0.34), P.B, 0, 0.3, 0, { s: [1, 0.7, 1] });
  }
  group.scale.setScalar(opts.scale || (pal === 'kid' ? 0.78 : pal === 'hero' ? 0.95 : 1));
  // troca de arma (só o herói)
  m.setWeapon = kind => {
    if (!m.swordPivot || m.weapon === kind) return; m.weapon = kind;
    while (m.swordPivot.children.length) { const c = m.swordPivot.children.pop(); c.geometry && c.geometry.dispose(); }
    const sp = m.swordPivot; m.mats = null;
    if (kind === 'sword_crystal') { add(sp, B(0.08, 0.8, 0.03), '#9fe8ff', 0, -0.52, 0, { mat: glowMat('#7fd6ff', 0.7) }); add(sp, B(0.24, 0.05, 0.07), '#f0c04a', 0, -0.12, 0); add(sp, C(0.025, 0.03, 0.16), '#4e2c18', 0, -0.03, 0); const sg = glow('#7fd6ff', 0.8, 0.5); sg.position.set(0, -0.55, 0); sp.add(sg); }
    else if (kind === 'sword_iron') { add(sp, B(0.07, 0.72, 0.025), '#cfd6e4', 0, -0.5, 0); add(sp, B(0.22, 0.05, 0.06), '#f0c04a', 0, -0.12, 0); add(sp, C(0.025, 0.03, 0.16), '#4e2c18', 0, -0.03, 0); }
    else { add(sp, C(0.028, 0.04, 0.6), '#8a5a32', 0, -0.35, 0); add(sp, C(0.03, 0.03, 0.12), '#4e2c18', 0, -0.03, 0); }
  };
  if (pal === 'hero') m.setWeapon('none');
  // pose: walkT já vem no ritmo do jogo; swing 0..1 durante o golpe; dodge 0..1 durante a esquiva
  m.pose = ({ moving, walkT = 0, t = 0, swing = -1, dodge = -1, talk = false }) => {
    const ph = walkT * 1.6, sw = moving ? Math.sin(ph) : 0;
    legL.rotation.x = sw * 0.75; legR.rotation.x = -sw * 0.75;
    armL.rotation.x = -sw * 0.65;
    armR.rotation.x = (m.swordPivot ? -0.55 : 0) + sw * (m.swordPivot ? 0.25 : 0.65) + (pal === 'guard' || pal === 'elder' ? -0.1 : 0);
    body.position.y = -0.7 + (moving ? Math.abs(Math.sin(ph)) * 0.05 : Math.sin(t * 2 + (m.ry || 0)) * 0.012);
    head.rotation.y = talk ? Math.sin(t * 6) * 0.08 : 0; body.rotation.y = 0;
    if (m.swordPivot) m.swordPivot.rotation.x = -1.2;
    if (swing >= 0) { const e = 1 - Math.pow(1 - Math.min(1, swing), 2.2); armR.rotation.x = -2.7 + e * 2.3; m.swordPivot.rotation.x = -0.35; body.rotation.y = (0.5 - e) * 0.9; }
    root.rotation.x = dodge >= 0 ? dodge * Math.PI * 2 : 0;
  };
  return m;
}

/* ---------- criaturas companheiras ---------- */
const FLAME = ['#c22e1b', '#ff7a2a', '#ffb03a', '#ffe27a'];
export function makeFox(evolved) {
  const group = new THREE.Group(); group.add(blob(0.45, 0.3));
  const body = pivot(group, 0, 0, 0), OR = '#ff8a2a', CR = '#fff1d6', DK = '#1a1424';
  add(body, S(0.3), OR, 0, 0.36, 0, { s: [0.85, 0.8, 1.25] }); add(body, S(0.2), CR, 0, 0.3, 0.13, { s: [0.9, 0.7, 1.1] });
  const head = pivot(body, 0, 0.58, 0.34);
  add(head, S(0.23), OR, 0, 0, 0); add(head, S(0.12), CR, 0, -0.05, 0.17, { s: [1, 0.8, 1.2] }); add(head, S(0.04), DK, 0, -0.02, 0.3);
  [-1, 1].forEach(s => { add(head, S(0.035), DK, s * 0.1, 0.05, 0.18); add(head, K(0.09, 0.24, 4), OR, s * 0.13, 0.24, -0.02, { r: [0, 0, -s * 0.2] }); add(head, K(0.04, 0.14, 4), DK, s * 0.13, 0.22, 0.03, { r: [0, 0, -s * 0.2] }); });
  if (evolved) { add(head, O(0.07), '#ffe27a', 0, 0.3, 0.08, { mat: glowMat('#ffe27a', 0.9), s: [1, 1.8, 1] }); }
  const legs = [[-0.13, 0.22], [0.13, 0.22], [-0.13, -0.2], [0.13, -0.2]].map(([x, z]) => { const l = pivot(body, x, 0.2, z); add(l, B(0.1, 0.22, 0.1), DK, 0, -0.1, 0); return l; });
  const tails = [], n = evolved ? 3 : 1;
  for (let i = 0; i < n; i++) {
    const tp = pivot(body, 0, 0.42, -0.32); tp.rotation.set(-1.0, (i - (n - 1) / 2) * 0.5, 0); tails.push(tp);
    [[0.12, 0.13, 0], [0.18, 0.12, 1], [0.26, 0.09, 2], [0.33, 0.06, 3]].forEach(([y, r, c]) => add(tp, S(r, 8, 6), FLAME[c], 0, y + 0.02, 0, { mat: glowMat(FLAME[c], 0.55), shadow: false }));
    const tg = glow('#ff9a3a', 0.9, 0.55); tg.position.set(0, 0.3, 0); tp.add(tg);
  }
  const m = wrap(group, { body, head, legs, tails });
  group.scale.setScalar(evolved ? 1.35 : 1);
  m.pose = ({ moving, t, speed = 0, down = false }) => {
    const ph = t * 14; legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(ph + (i % 2 ? 0 : Math.PI) + (i > 1 ? 0.8 : 0)) * 0.7 : 0; });
    body.position.y = moving ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(t * 3) * 0.015;
    head.rotation.x = Math.sin(t * 2) * 0.05; tails.forEach((tp, i) => { tp.rotation.z = Math.sin(t * 6 + i) * 0.25; tp.rotation.x = -1.0 + Math.sin(t * 4 + i) * 0.1; });
    group.rotation.z = down ? 1.35 : 0; group.position.y = down ? 0.12 : 0;
  };
  return m;
}
export function makeTurtle(evolved) {
  const group = new THREE.Group(); group.add(blob(0.5, 0.3));
  const body = pivot(group, 0, 0, 0), SH = evolved ? '#3b7fd0' : '#4dc3ff', SK = '#5ab8e8', DK = '#1a1424';
  add(body, new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), SH, 0, 0.18, 0, { s: [1.05, 0.85, 1.2] });
  add(body, C(0.43, 0.43, 0.08, 10), DK, 0, 0.17, 0, { s: [1.05, 1, 1.2] });
  [[-0.15, 0.3, 0.05], [0.12, 0.34, -0.1], [0.05, 0.3, 0.2], [-0.1, 0.28, -0.22]].forEach(([x, y, z]) => add(body, O(0.09), '#bff3ff', x, y, z, { mat: glowMat('#bff3ff', 0.5), s: [1, 1.3, 1] }));
  if (evolved) add(body, K(0.1, 0.45, 5), '#9fe8ff', 0, 0.66, -0.05, { mat: glowMat('#9fe8ff', 0.8) });
  const head = pivot(body, 0, 0.25, 0.5); add(head, S(0.16), SK, 0, 0, 0, { s: [1, 0.9, 1.1] }); [-1, 1].forEach(s => add(head, S(0.03), DK, s * 0.08, 0.05, 0.12));
  const legs = [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]].map(([x, z]) => { const l = pivot(body, x, 0.14, z); add(l, B(0.16, 0.16, 0.2), '#2a6ea8', 0, -0.07, 0); return l; });
  const m = wrap(group, { body, head, legs });
  group.scale.setScalar(evolved ? 1.35 : 1);
  m.pose = ({ moving, t, down = false }) => {
    legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(t * 9 + (i % 2 ? 0 : Math.PI)) * 0.5 : 0; });
    body.position.y = Math.sin(t * 3) * 0.012; head.position.z = 0.5 + Math.sin(t * 2) * 0.03;
    group.rotation.z = down ? 1.3 : 0; group.position.y = down ? 0.1 : 0;
  };
  return m;
}

/* ---------- inimigos ---------- */
export function makeSlime(color) {
  const group = new THREE.Group(); group.add(blob(0.5, 0.3));
  const body = pivot(group, 0, 0, 0);
  add(body, S(0.44, 14, 10), color, 0, 0.34, 0, { s: [1, 0.78, 1], m: { transparent: true, opacity: 0.92, roughness: 0.3 } });
  add(body, S(0.2, 8, 6), '#10264a', 0, 0.28, 0, { s: [1, 0.8, 1], m: { transparent: true, opacity: 0.35 } });
  add(body, S(0.07, 6, 4), '#ffffff', -0.18, 0.58, 0.18, { shadow: false, s: [1.4, 0.8, 1] });
  [-1, 1].forEach(s => add(body, S(0.06, 6, 4), '#0b1530', s * 0.15, 0.38, 0.38));
  const m = wrap(group, { body });
  // hop: 0..1 (1 = começo do pulo); t em segundos
  m.pose = ({ hop = 0, t = 0 }) => {
    const sq = hop > 0 ? 1 - hop * 0.25 : 1 + Math.sin(t * 6) * 0.06, lift = hop > 0 ? Math.sin(hop * Math.PI) * 0.5 : 0;
    body.scale.set(1 / sq, sq, 1 / sq); body.position.y = lift;
  };
  return m;
}
export function makeFungo() {
  const group = new THREE.Group(); group.add(blob(0.45, 0.3));
  const body = pivot(group, 0, 0, 0);
  add(body, C(0.2, 0.26, 0.55, 8), '#f1e3c4', 0, 0.28, 0);
  [-1, 1].forEach(s => add(body, B(0.05, 0.1, 0.02), '#1a1424', s * 0.08, 0.34, 0.235));
  const cap = pivot(body, 0, 0.5, 0);
  add(cap, new THREE.SphereGeometry(0.52, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), '#d8463a', 0, 0, 0, { s: [1, 0.85, 1] });
  add(cap, C(0.52, 0.52, 0.05, 12), '#a8302a', 0, 0.0, 0);
  [[-0.22, 0.33, 0.15], [0.12, 0.43, -0.06], [0.28, 0.28, 0.2], [-0.05, 0.2, -0.32]].forEach(([x, y, z]) => add(cap, S(0.07, 6, 4), '#ffe9d6', x, y, z, { shadow: false }));
  const m = wrap(group, { body, cap });
  m.pose = ({ t = 0, charge = 0 }) => { const k = 1 + charge * 0.25; cap.scale.set(k, 1 - charge * 0.1, k); cap.position.y = 0.5 + Math.sin(t * 7) * 0.03; body.rotation.z = Math.sin(t * 3) * 0.04; };
  return m;
}
export function makeWolf() {
  const group = new THREE.Group(); group.add(blob(0.6, 0.3));
  const body = pivot(group, 0, 0, 0), D = '#3b2f5e', F = '#5b4a8a';
  add(body, S(0.32), D, 0, 0.5, 0, { s: [0.8, 0.85, 1.55] }); add(body, S(0.28), F, 0, 0.64, -0.05, { s: [0.7, 0.45, 1.35] });
  const head = pivot(body, 0, 0.7, 0.52);
  add(head, B(0.28, 0.27, 0.3), D, 0, 0, 0); add(head, B(0.16, 0.14, 0.24), '#2f2650', 0, -0.05, 0.24); add(head, B(0.06, 0.05, 0.04), '#ff4fd8', 0, -0.0, 0.37, { shadow: false });
  [-1, 1].forEach(s => { add(head, B(0.05, 0.04, 0.03), '#ff4fd8', s * 0.09, 0.06, 0.15, { mat: glowMat('#ff4fd8', 1.2) }); add(head, K(0.07, 0.18, 4), F, s * 0.1, 0.2, -0.05, { r: [0, 0, -s * 0.15] }); });
  const legs = [[-0.15, 0.32], [0.15, 0.32], [-0.15, -0.34], [0.15, -0.34]].map(([x, z]) => { const l = pivot(body, x, 0.42, z); add(l, B(0.11, 0.42, 0.11), '#120c20', 0, -0.2, 0); return l; });
  const tail = pivot(body, 0, 0.6, -0.55); add(tail, K(0.09, 0.55, 5), F, 0, -0.2, -0.12, { r: [-1.25, 0, 0] });
  const trail = glow('#a77bff', 1.6, 0); trail.position.set(0, 0.5, -0.6); body.add(trail);
  const m = wrap(group, { body, head, legs, tail });
  m.pose = ({ t = 0, moving = false, dash = false, windup = false }) => {
    const sp = dash ? 26 : 12; legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(t * sp + (i % 2 ? 0 : Math.PI)) * 0.7 : 0; });
    body.position.y = moving ? Math.abs(Math.sin(t * sp)) * 0.05 : Math.sin(t * 2) * 0.01; body.rotation.x = windup ? -0.25 : dash ? 0.12 : 0;
    tail.rotation.z = Math.sin(t * 5) * 0.25; trail.material.opacity = dash ? 0.6 : 0; head.position.y = windup ? 0.62 : 0.7;
  };
  return m;
}
export function makeGolem() {
  const group = new THREE.Group(); group.add(blob(1.3, 0.35));
  const body = pivot(group, 0, 0, 0), st = '#5a6684', st2 = '#3d4660', cryMats = [];
  const cry = (g, x, y, z, o = {}) => { const mt = glowMat('#7fd6ff', 0.9); cryMats.push(mt); return add(body, g, null, x, y, z, { mat: mt, ...o }); };
  [-1, 1].forEach(s => { add(body, B(0.5, 0.8, 0.5), st2, s * 0.4, 0.4, 0); add(body, B(0.62, 0.18, 0.62), st, s * 0.4, 0.06, 0.04); });
  add(body, B(1.35, 1.1, 0.95), st, 0, 1.3, 0); add(body, B(1.5, 0.35, 1.05), st2, 0, 1.78, 0); add(body, B(1.1, 0.4, 0.8), st2, 0, 0.78, 0);
  add(body, B(0.55, 0.45, 0.5), st, 0, 2.08, 0.06);
  const eyeMats = [-1, 1].map(s => { const mt = glowMat('#ffe27a', 1.2); add(body, B(0.14, 0.08, 0.03), null, s * 0.13, 2.1, 0.33, { mat: mt }); return mt; });
  const arms = [-1, 1].map(s => {
    const a = pivot(body, s * 0.95, 1.75, 0); add(a, B(0.4, 0.95, 0.42), st2, 0, -0.48, 0); const fist = add(a, B(0.55, 0.5, 0.55), '#7fd6ff', 0, -1.1, 0, { mat: glowMat('#7fd6ff', 0.6) }); cryMats.push(fist.material); return a;
  });
  [[-0.42, 2.15, -0.5, 1.7], [0, 2.45, -0.55, 2.4], [0.42, 2.1, -0.5, 1.5]].forEach(([x, y, z, h]) => cry(O(0.2), x, y, z, { s: [0.8, h, 0.8] }));
  cry(O(0.24), 0, 1.4, 0.5, { s: [1, 1.3, 0.6] });
  const core = glow('#7fd6ff', 1.7, 0.7); core.position.set(0, 1.4, 0.7); body.add(core);
  const m = wrap(group, { body, arms });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    const col = phase > 1 ? '#ff7ae0' : (m.cryCol || '#7fd6ff');
    cryMats.forEach(mt => { mt.color.set(col); mt.emissive.set(col); mt.emissiveIntensity = sleep ? 0.2 : 0.55 + Math.sin(t * 5) * 0.25; });
    eyeMats.forEach(mt => { const c = phase > 1 ? '#ff4fd8' : '#ffe27a'; mt.color.set(c); mt.emissive.set(c); mt.emissiveIntensity = sleep ? 0.05 : 1.2; });
    core.material.color.set(col); core.material.opacity = sleep ? 0.15 : 0.55 + Math.sin(t * 5) * 0.2;
    body.position.y = sleep ? -0.15 : Math.sin(t * 2.5) * 0.04;
    arms.forEach((a, i) => { a.rotation.x = sleep ? 0.2 : -windup * 2.3 + Math.sin(t * 2.5 + i) * 0.06; a.rotation.z = (i ? -1 : 1) * (sleep ? 0.05 : 0.12); });
  };
  m.glowMats = cryMats;
  return m;
}

/* ---------- Slime Ancestral: um Gotalim gigante com coroa de cristal ---------- */
export function makeSlimeKing() {
  const m = makeSlime('#58d98a'); m.group.scale.setScalar(2.7);
  const body = m.body;
  add(body, C(0.26, 0.3, 0.12, 8), null, 0, 0.8, 0, { mat: glowMat('#f0c04a', 0.5) });
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(body, K(0.06, 0.2, 4), null, Math.cos(a) * 0.24, 0.95, Math.sin(a) * 0.24, { mat: glowMat('#f0c04a', 0.6) }); }
  add(body, O(0.15), null, 0, 0.36, 0.05, { mat: glowMat('#d6ff5a', 1.0), shadow: false });
  const core = glow('#d6ff5a', 0.9, 0.6); core.position.set(0, 0.36, 0.05); body.add(core);
  return m;
}

/* ---------- Guardião Espinheiro: um tronco vivo coberto de espinhos ---------- */
export function makeEspinheiro() {
  const group = new THREE.Group(); group.add(blob(1.4, 0.35));
  const body = pivot(group, 0, 0, 0), bark = '#93653a', bark2 = '#6e4a2a', leaf = '#4a9a3a', eyeMats = [];
  [-1, 1].forEach(s => { add(body, B(0.55, 0.9, 0.55), bark2, s * 0.45, 0.45, 0.05); add(body, B(0.8, 0.2, 0.95), bark, s * 0.45, 0.1, 0.12); add(body, B(0.3, 0.2, 0.8), bark2, s * 0.9, 0.1, -0.3, { r: [0, s * 0.5, 0] }); });
  add(body, B(1.35, 1.5, 1.05, 0.25), bark, 0, 1.6, 0); add(body, B(1.0, 0.9, 0.85, 0.2), bark2, 0, 2.55, 0.02);
  [-1, 1].forEach(s => { const mt = glowMat('#8fe05a', 1.2); eyeMats.push(mt); add(body, B(0.2, 0.1, 0.04), null, s * 0.2, 2.6, 0.45, { mat: mt }); });
  add(body, B(0.4, 0.07, 0.04), '#1a0f08', 0, 2.38, 0.45);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; add(body, S(0.4, 8, 6), i % 2 ? leaf : '#3a8a30', Math.cos(a) * 0.55, 3.15 + (i % 3) * 0.1, Math.sin(a) * 0.55, { s: [1, 0.8, 1] }); }
  add(body, S(0.55, 8, 6), '#56ad44', 0, 3.4, 0, { s: [1, 0.75, 1] });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, y = 1.0 + (i % 4) * 0.4; add(body, K(0.1, 0.55, 5), '#d8c9a0', Math.cos(a) * 0.7, y, Math.sin(a) * 0.55, { r: [Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3] }); }
  const aura = glow('#8fe05a', 5, 0.28); aura.position.set(0, 1.8, 0.4); body.add(aura);
  const arms = [-1, 1].map(s => {
    const a = pivot(body, s * 0.95, 2.1, 0); add(a, B(0.38, 1.15, 0.42), bark2, 0, -0.55, 0); add(a, B(0.6, 0.5, 0.6), bark, 0, -1.25, 0);
    for (let k = 0; k < 3; k++) add(a, K(0.08, 0.4, 5), '#d8c9a0', (k - 1) * 0.2, -1.6, 0.1, { r: [Math.PI, 0, 0] });
    return a;
  });
  const m = wrap(group, { body, arms });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    eyeMats.forEach(mt => { const c = phase > 1 ? '#ff9a3a' : '#8fe05a'; mt.color.set(c); mt.emissive.set(c); mt.emissiveIntensity = sleep ? 0.05 : 1.1 + Math.sin(t * 5) * 0.2; });
    body.position.y = sleep ? -0.15 : Math.sin(t * 2.2) * 0.05;
    arms.forEach((a, i) => { a.rotation.x = sleep ? 0.2 : -windup * 2.4 + Math.sin(t * 2 + i) * 0.07; a.rotation.z = (i ? -1 : 1) * (sleep ? 0.05 : 0.14); });
  };
  return m;
}

/* ---------- Cavaleiro de Pedra: armadura de pedra com lâmina e escudo ---------- */
export function makeKnight() {
  const group = new THREE.Group(); group.add(blob(1.2, 0.35));
  const body = pivot(group, 0, 0, 0), st = '#8d8c9a', st2 = '#6a6976', gold = '#d9a441', glowMats = [];
  [-1, 1].forEach(s => { add(body, B(0.42, 0.95, 0.46), st2, s * 0.3, 0.48, 0); add(body, B(0.5, 0.2, 0.62), st, s * 0.3, 0.1, 0.07); });
  add(body, B(1.05, 1.0, 0.72, 0.2), st, 0, 1.45, 0); add(body, B(1.1, 0.14, 0.78), gold, 0, 1.0, 0); add(body, B(0.5, 0.5, 0.06), gold, 0, 1.55, 0.37);
  [-1, 1].forEach(s => add(body, S(0.36, 10, 8), st2, s * 0.72, 1.85, 0, { s: [1, 0.8, 1] }));
  add(body, B(0.62, 0.66, 0.6, 0.2), st, 0, 2.3, 0); add(body, B(0.7, 0.1, 0.66), gold, 0, 2.0, 0);
  const eye = glowMat('#ffb03a', 1.3); glowMats.push(eye); add(body, B(0.46, 0.08, 0.04), null, 0, 2.32, 0.31, { mat: eye });
  add(body, K(0.12, 0.55, 5), '#c2402a', 0, 2.85, -0.1, { r: [-0.5, 0, 0] });
  const armR = pivot(body, 0.82, 1.85, 0); add(armR, B(0.32, 0.9, 0.34), st2, 0, -0.45, 0); add(armR, B(0.4, 0.34, 0.4), gold, 0, -0.95, 0);
  const bm = glowMat('#cfd6e4', 0.15); glowMats.push(bm); add(armR, B(0.16, 1.7, 0.07), null, 0, -1.9, 0.12, { mat: bm }); add(armR, B(0.5, 0.1, 0.12), gold, 0, -1.08, 0.12);
  const armL = pivot(body, -0.82, 1.85, 0); add(armL, B(0.32, 0.9, 0.34), st2, 0, -0.45, 0); add(armL, B(0.16, 1.2, 0.85, 0.06), gold, -0.28, -0.75, 0.1); add(armL, B(0.1, 0.8, 0.5), st, -0.34, -0.75, 0.1);
  const m = wrap(group, { body, armR, armL });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    const c = phase > 1 ? '#ff5a3a' : '#ffb03a';
    eye.color.set(c); eye.emissive.set(c); eye.emissiveIntensity = sleep ? 0.05 : 1.2;
    bm.color.set(phase > 1 ? '#ff7a4a' : '#cfd6e4'); bm.emissive.set(phase > 1 ? '#ff5a3a' : '#cfd6e4'); bm.emissiveIntensity = phase > 1 ? 0.7 + Math.sin(t * 8) * 0.2 : 0.15;
    body.position.y = sleep ? -0.05 : Math.sin(t * 2.4) * 0.03;
    armR.rotation.x = sleep ? 0.1 : -0.35 - windup * 2.5; armR.rotation.z = -0.1; armL.rotation.x = sleep ? 0 : -0.25 + Math.sin(t * 2) * 0.05;
  };
  return m;
}

/* ---------- cor extra: mistura as cores do modelo com uma cor (variantes e chefes) ---------- */
export function tintModel(m, hex, k = 0.5) {
  const tc = new THREE.Color(hex), seen = new Set(); m.cryCol = hex;
  m.group.traverse(o => {
    if (!o.isMesh || !o.material || o.material.isMeshBasicMaterial) return;
    for (const mt of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (seen.has(mt)) continue; seen.add(mt); if (!mt.color) continue;
      const lit = mt.emissive && mt.emissiveIntensity > 0.25;
      mt.color.lerp(tc, lit ? 0.85 : k); if (lit) mt.emissive.lerp(tc, 0.85);
    }
  });
  return m;
}

/* ---------- Dragão (Boreal e Drakmor): corpo, asas, pescoço comprido e cauda ---------- */
export function makeDragon() {
  const group = new THREE.Group(); group.add(blob(1.7, 0.35));
  const body = pivot(group, 0, 0, 0), sc = '#6f7f9c', sc2 = '#4a5874', bel = '#d8dcea', eyeMats = [];
  add(body, S(0.8, 12, 9), sc, 0, 1.3, 0, { s: [0.95, 0.85, 1.65] }); add(body, S(0.6, 10, 8), bel, 0, 1.08, 0.2, { s: [0.8, 0.55, 1.4] });
  for (let i = 0; i < 6; i++) add(body, K(0.1, 0.3 + (i % 2) * 0.08, 4), sc2, 0, 1.95 - Math.abs(i - 2.5) * 0.06, -0.9 + i * 0.36);
  const legs = [[-0.55, 0.75], [0.55, 0.75], [-0.55, -0.75], [0.55, -0.75]].map(([x, z]) => { const l = pivot(body, x, 1.0, z); add(l, B(0.3, 0.85, 0.34), sc2, 0, -0.42, 0); add(l, B(0.38, 0.14, 0.52), '#25202e', 0, -0.85, 0.1); return l; });
  const neck = pivot(body, 0, 1.6, 1.15); add(neck, C(0.22, 0.34, 1.1, 8), sc, 0, 0.42, 0.25, { r: [0.75, 0, 0] });
  const head = pivot(neck, 0, 0.88, 0.62);
  add(head, B(0.56, 0.46, 0.7, 0.14), sc, 0, 0, 0); add(head, B(0.36, 0.26, 0.5, 0.1), sc2, 0, -0.1, 0.5);
  [-1, 1].forEach(s => { const mt = glowMat('#ffe27a', 1.3); eyeMats.push(mt); add(head, B(0.12, 0.07, 0.05), null, s * 0.2, 0.1, 0.3, { mat: mt }); add(head, K(0.07, 0.5, 5), bel, s * 0.2, 0.3, -0.25, { r: [-0.9, 0, -s * 0.3] }); });
  const mouth = glow('#ffb03a', 1.8, 0); mouth.position.set(0, -0.05, 0.85); head.add(mouth);
  const wings = [-1, 1].map(s => {
    const w = pivot(body, s * 0.55, 1.85, -0.1);
    add(w, B(1.9, 0.06, 0.2, 0.02), sc2, s * 0.95, 0, 0); add(w, B(1.5, 0.05, 1.0, 0.02), '#3a4660', s * 0.8, 0, -0.15); add(w, B(0.7, 0.05, 0.8, 0.02), '#46567a', s * 1.5, 0, 0.02);
    return w;
  });
  const tail = pivot(body, 0, 1.2, -1.4); add(tail, K(0.28, 1.6, 6), sc, 0, 0, -0.7, { r: [-Math.PI / 2, 0, 0] }); add(tail, K(0.18, 0.5, 4), bel, 0, 0, -1.65, { r: [-Math.PI / 2, 0, 0] });
  const m = wrap(group, { body, neck, head, wings, tail, legs });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    eyeMats.forEach(mt => { const c = phase > 1 ? '#ff4fd8' : '#ffe27a'; mt.color.set(c); mt.emissive.set(c); mt.emissiveIntensity = sleep ? 0.05 : 1.2; });
    body.position.y = sleep ? -0.35 : Math.sin(t * 2.3) * 0.05;
    wings.forEach((w, i) => { const s = i ? 1 : -1; w.rotation.z = sleep ? s * -1.15 : s * (-0.15 - Math.sin(t * 2.4) * 0.28 - windup * 0.5); });
    neck.rotation.x = sleep ? 0.55 : -windup * 0.7 + Math.sin(t * 1.6) * 0.04; head.rotation.x = windup * 0.5;
    mouth.material.opacity = windup * 0.9; tail.rotation.y = Math.sin(t * 1.8) * 0.3;
    legs.forEach((l, i) => { l.rotation.x = sleep ? 0 : Math.sin(t * 2 + i) * 0.04; });
  };
  return m;
}

/* ---------- Escorpião-Rei ---------- */
export function makeScorpion() {
  const group = new THREE.Group(); group.add(blob(1.5, 0.35));
  const body = pivot(group, 0, 0, 0), sh = '#9a7a3a', sh2 = '#6a4e22', eyeMats = [];
  add(body, S(0.7, 12, 8), sh, 0, 0.62, 0, { s: [1.1, 0.55, 1.5] }); add(body, S(0.45, 10, 8), sh2, 0, 0.7, 0.85, { s: [1, 0.7, 0.9] });
  [-1, 1].forEach(s => { const mt = glowMat('#ff4a2a', 1.3); eyeMats.push(mt); add(body, S(0.07, 6, 5), null, s * 0.17, 0.95, 1.1, { mat: mt }); });
  const claws = [-1, 1].map(s => { const a = pivot(body, s * 0.7, 0.6, 1.0); add(a, B(0.28, 0.22, 0.9, 0.08), sh2, s * 0.15, 0, 0.45); const p1 = add(a, B(0.22, 0.2, 0.55, 0.06), sh, s * 0.05, 0, 1.05), p2 = add(a, B(0.2, 0.18, 0.5, 0.06), sh, s * 0.4, 0, 1.0); a.userData.p = [p1, p2]; return a; });
  const legs = []; for (let i = 0; i < 4; i++) [-1, 1].forEach(s => { const l = pivot(body, s * 0.55, 0.5, -0.5 + i * 0.4); add(l, B(0.9, 0.08, 0.1, 0.03), sh2, s * 0.45, -0.1, 0, { r: [0, 0, s * -0.4] }); legs.push(l); });
  const tail = pivot(body, 0, 0.7, -0.9);
  const segs = []; let par = tail; for (let i = 0; i < 4; i++) { const sgm = pivot(par, 0, 0.0, i ? -0.1 : 0); add(sgm, S(0.28 - i * 0.03, 8, 6), i % 2 ? sh : sh2, 0, 0.3, -0.1); sgm.position.set(0, i ? 0.42 : 0, i ? -0.28 : 0); segs.push(sgm); par = sgm; }
  add(par, K(0.12, 0.5, 5), null, 0, 0.55, 0.1, { mat: glowMat('#b8ff5a', 0.9), r: [2.2, 0, 0] });
  const m = wrap(group, { body, claws, tail, legs });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    eyeMats.forEach(mt => { mt.emissiveIntensity = sleep ? 0.05 : 1.2; });
    body.position.y = sleep ? -0.18 : Math.sin(t * 2.6) * 0.03;
    legs.forEach((l, i) => { l.rotation.y = sleep ? 0 : Math.sin(t * 6 + i * 1.3) * 0.2; });
    claws.forEach((c, i) => { c.rotation.x = sleep ? 0.2 : -windup * 0.9 + Math.sin(t * 2 + i) * 0.1; c.rotation.y = (i ? -1 : 1) * windup * 0.4; });
    segs.forEach((s2, i) => { s2.rotation.x = sleep ? -0.5 : -0.55 - windup * 0.5 + Math.sin(t * 2 + i * 0.5) * 0.07; });
  };
  return m;
}

/* ---------- Hidra Venenosa: três cabeças ---------- */
export function makeHydra() {
  const group = new THREE.Group(); group.add(blob(1.6, 0.35));
  const body = pivot(group, 0, 0, 0), sk = '#4a7a3a', sk2 = '#2f5a2a', bel = '#c8d890', eyeMats = [];
  add(body, S(0.85, 12, 9), sk, 0, 0.9, 0, { s: [1.2, 0.85, 1.4] }); add(body, S(0.6, 10, 8), bel, 0, 0.75, 0.3, { s: [0.9, 0.55, 1] });
  [-1, 1].forEach(s => { add(body, B(0.36, 0.7, 0.4), sk2, s * 0.7, 0.35, 0.3); add(body, B(0.4, 0.18, 0.55), sk, s * 0.7, 0.08, 0.4); });
  const tail = pivot(body, 0, 0.7, -1.1); add(tail, K(0.3, 1.5, 6), sk, 0, 0, -0.65, { r: [-Math.PI / 2, 0, 0] });
  const necks = [-1, 0, 1].map((s, i) => {
    const n = pivot(body, s * 0.55, 1.35, 0.5); add(n, C(0.17, 0.25, 1.6, 7), sk, 0, 0.8, 0.0);
    const h = pivot(n, 0, 1.65, 0.1); add(h, B(0.44, 0.34, 0.6, 0.12), sk2, 0, 0, 0.12); add(h, B(0.28, 0.2, 0.4, 0.08), sk, 0, -0.08, 0.5);
    [-1, 1].forEach(e => { const mt = glowMat('#d6ff5a', 1.3); eyeMats.push(mt); add(h, S(0.06, 6, 5), null, e * 0.16, 0.1, 0.35, { mat: mt }); add(h, K(0.05, 0.3, 4), bel, e * 0.18, 0.25, -0.05, { r: [-0.5, 0, -e * 0.3] }); });
    return { n, h, s, i };
  });
  const m = wrap(group, { body, necks, tail });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    eyeMats.forEach(mt => { const c = phase > 1 ? '#ff4a4a' : '#d6ff5a'; mt.color.set(c); mt.emissive.set(c); mt.emissiveIntensity = sleep ? 0.05 : 1.2; });
    body.position.y = sleep ? -0.2 : Math.sin(t * 2) * 0.04;
    necks.forEach(({ n, h, s, i }) => { n.rotation.z = sleep ? s * 0.5 : s * 0.3 + Math.sin(t * 1.7 + i * 2.1) * 0.22; n.rotation.x = sleep ? 0.7 : (s === 0 ? -windup * 0.9 : windup * 0.25) + Math.sin(t * 1.3 + i) * 0.1 + 0.15; h.rotation.x = sleep ? 0.4 : windup * 0.6; });
    tail.rotation.y = Math.sin(t * 1.6) * 0.3;
  };
  return m;
}

/* ---------- Noxar, o Devorador de Luz: esfera sombria flutuante com olho central ---------- */
export function makeNoxar() {
  const group = new THREE.Group(); group.add(blob(1.5, 0.3));
  const body = pivot(group, 0, 0, 0), dk = '#1a0c2a', purple = '#7a3ac0';
  const core = add(body, S(1.0, 16, 12), dk, 0, 2.3, 0, { m: { emissive: new THREE.Color('#2a0a4a'), emissiveIntensity: 0.5, roughness: 0.4 } });
  const eyeMat = glowMat('#ffffff', 1.4); add(body, S(0.38, 12, 10), null, 0, 2.35, 0.82, { mat: eyeMat, s: [1.2, 0.8, 0.5] });
  const pupil = add(body, S(0.16, 8, 6), '#10001a', 0, 2.35, 1.0, { s: [0.7, 1.5, 0.5] });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(body, K(0.14, 0.9, 5), dk, Math.cos(a) * 0.95, 2.3 + Math.sin(a) * 0.95, 0, { r: [0, 0, a - Math.PI / 2] }); }
  const tent = [-1, 1].map(s => { const a = pivot(body, s * 1.0, 2.2, 0); for (let k = 0; k < 3; k++) add(a, K(0.2 - k * 0.04, 0.9, 5), dk, s * (0.2 + k * 0.25), -0.5 - k * 0.55, 0.0, { r: [0, 0, s * 0.35] }); return a; });
  const orbs = []; for (let i = 0; i < 6; i++) { const o = add(body, O(0.17), null, 0, 2.3, 0, { mat: glowMat(purple, 1.1) }); orbs.push(o); }
  const aura = glow(purple, 6, 0.4); aura.position.set(0, 2.3, 0); body.add(aura);
  const m = wrap(group, { body, tent });
  m.pose = ({ t = 0, windup = 0, sleep = false, phase = 1 }) => {
    const c = phase > 1 ? '#ff4a6a' : purple;
    orbs.forEach((o, i) => { const a = t * (phase > 1 ? 1.8 : 1.0) + i / 6 * Math.PI * 2; o.position.set(Math.cos(a) * 1.7, 2.3 + Math.sin(a * 2) * 0.3, Math.sin(a) * 1.7); o.material.color.set(c); o.material.emissive.set(c); });
    eyeMat.color.set(phase > 1 ? '#ffb0c0' : '#ffffff'); eyeMat.emissive.set(phase > 1 ? '#ff4a6a' : '#ffffff'); eyeMat.emissiveIntensity = sleep ? 0.1 : 1.3 + windup;
    aura.material.color.set(c); aura.material.opacity = sleep ? 0.1 : 0.35 + windup * 0.3;
    body.position.y = (sleep ? -0.4 : 0) + Math.sin(t * 1.6) * 0.18; core.scale.setScalar(1 + windup * 0.15 + Math.sin(t * 3) * 0.02);
    tent.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * (0.1 + windup * 0.9 + Math.sin(t * 2 + i) * 0.1); a.rotation.x = -windup * 0.8; });
  };
  return m;
}
