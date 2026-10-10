import * as THREE from 'three';
import * as TX from './textures.js';

const carbon = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.45, metalness: 0.5 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.92, metalness: 0 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.25, metalness: 0.9 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.1, metalness: 0.6 });
const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dce2, roughness: 0.18, metalness: 1 });

function lathe(profile, seg = 24) {
  const g = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0], p[1])), seg);
  g.rotateX(Math.PI / 2); // eixo Y -> Z
  return g;
}
function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; return m;
}
// cilindro/capsula ligando dois pontos
function link(a, b, r, mat, cap = false) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = new THREE.Mesh(cap ? new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 4, 8) : new THREE.CylinderGeometry(r, r, len, 8), mat);
  m.position.copy(A.clone().add(B).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; return m;
}

function wheel(R, W, band, list) {
  const spin = new THREE.Group(), prof = [], hw = W / 2, sh = Math.min(0.09, hw * 0.9);
  prof.push([R * 0.6, -hw]); prof.push([R - sh, -hw]);
  for (let a = 0; a <= 6; a++) { const t = (a / 6) * Math.PI / 2; prof.push([R - sh + Math.sin(t) * sh, -hw + sh - Math.cos(t) * sh]); }
  prof.push([R, hw - sh]);
  for (let a = 0; a <= 6; a++) { const t = (a / 6) * Math.PI / 2; prof.push([R - sh + Math.cos(t) * sh, hw - sh + Math.sin(t) * sh]); }
  prof.push([R - sh, hw]); prof.push([R * 0.6, hw]);
  const tg = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 28); tg.rotateZ(Math.PI / 2);
  const tyre = new THREE.Mesh(tg, rubber); tyre.castShadow = true; spin.add(tyre);
  const bm = new THREE.MeshBasicMaterial({ color: band, side: THREE.DoubleSide }); list.push(bm);
  const b1 = new THREE.Mesh(new THREE.RingGeometry(R * 0.66, R * 0.76, 28), bm); b1.rotation.y = Math.PI / 2; b1.position.x = hw + 0.002; spin.add(b1);
  const b2 = b1.clone(); b2.position.x = -hw - 0.002; spin.add(b2);
  const rimG = new THREE.CylinderGeometry(R * 0.58, R * 0.58, W * 0.85, 22); rimG.rotateZ(Math.PI / 2); spin.add(new THREE.Mesh(rimG, rimMat));
  for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.035, R * 1.0), carbon); sp.rotation.x = (i / 6) * Math.PI; spin.add(sp); }
  return { spin, R };
}

export function makeCar(o) {
  const c1 = new THREE.Color(o.c1), c2 = new THREE.Color(o.c2);
  const paint = new THREE.MeshPhysicalMaterial({ color: c1, roughness: 0.3, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  const paint2 = new THREE.MeshPhysicalMaterial({ color: c2, roughness: 0.36, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const pid = o.paint && o.paint !== 'solid' ? o.paint : null;
  let paintP = paint;
  if (pid) paintP = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: TX.liveryTex(pid, o.c1, o.c2), roughness: pid === 'carbon' ? 0.28 : 0.3, metalness: pid === 'gold' ? 0.85 : pid === 'carbon' ? 0.5 : 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const bandMats = [], tyreBand = o.tyreBand || '#ffd23f';
  const RF = 0.35, RR = 0.37;

  // chassi e motor
  body.add(box(0.26, 0.3, 0.7, carbon, 0, 0.46, 0.02));
  const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 14), carbon); eng.rotation.z = Math.PI / 2; eng.position.set(0, 0.36, 0.05); body.add(eng);
  body.add(link([0, 0.62, 0.38], [0, 0.45, -0.28], 0.045, chrome));
  // tanque (pintura com estilo)
  const tank = new THREE.Mesh(lathe([[0, 0.5], [0.12, 0.43], [0.2, 0.22], [0.22, -0.08], [0.17, -0.38], [0, -0.5]], 22), paintP);
  tank.scale.set(1, 0.85, 1); tank.position.set(0, 0.8, 0.18); tank.castShadow = true; body.add(tank);
  // carenagem frontal
  const fair = new THREE.Mesh(lathe([[0, 0.62], [0.07, 0.56], [0.2, 0.36], [0.29, 0.05], [0.3, -0.2], [0.2, -0.32], [0, -0.34]], 22), paintP);
  fair.scale.set(0.9, 1.0, 1); fair.position.set(0, 0.86, 0.72); fair.castShadow = true; body.add(fair);
  body.add(box(0.3, 0.22, 0.03, glassMat, 0, 1.12, 0.62, -0.7, 0, 0));
  for (const s of [-1, 1]) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff0b0, emissiveIntensity: 1.2 })); lamp.position.set(s * 0.12, 0.86, 1.28); body.add(lamp); }
  // banco e rabeta
  body.add(box(0.28, 0.08, 0.7, carbon, 0, 0.93, -0.38));
  const tail = new THREE.Mesh(lathe([[0, 0.55], [0.12, 0.42], [0.2, 0.1], [0.19, -0.3], [0.1, -0.55], [0, -0.6]], 18), paint2);
  tail.scale.set(0.95, 0.75, 1); tail.position.set(0, 0.88, -0.78); tail.castShadow = true; body.add(tail);
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1010, emissiveIntensity: 0.5 });
  body.add(box(0.2, 0.07, 0.03, brakeMat, 0, 0.9, -1.42));
  // escapamento
  for (const s of [1]) { const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.8, 12), chrome); ex.rotation.x = Math.PI / 2 + 0.1; ex.position.set(s * 0.2, 0.42, -0.65); body.add(ex); }
  // balanca e roda traseira
  body.add(link([0, 0.46, -0.3], [0, RR, -1.0], 0.04, carbon));
  const rw = wheel(RR, 0.26, tyreBand, bandMats); rw.spin.position.set(0, RR, -1.0); body.add(rw.spin);
  // garfo + guidao + roda dianteira (gira junto)
  const fork = new THREE.Group(); fork.position.set(0, 0.98, 0.58); body.add(fork);
  const front = new THREE.Vector3(0, RF - 0.98, 1.05 - 0.58);
  for (const s of [-1, 1]) fork.add(link([s * 0.07, 0, 0], [s * 0.07, front.y, front.z], 0.03, chrome));
  fork.add(box(0.8, 0.04, 0.05, carbon, 0, 0.1, -0.02));
  for (const s of [-1, 1]) fork.add(link([s * 0.4, 0.1, -0.02], [s * 0.45, 0.12, -0.02], 0.035, rubber));
  const fwl = wheel(RF, 0.17, tyreBand, bandMats); fwl.spin.position.copy(front); fork.add(fwl.spin);
  // piloto
  const suit = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.6, metalness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: 0.7 });
  const rider = new THREE.Group(); body.add(rider);
  const torso = link([0, 1.05, -0.28], [0, 1.42, 0.08], 0.17, suit, true); rider.add(torso);
  for (const s of [-1, 1]) {
    rider.add(link([s * 0.2, 1.37, 0.05], [s * 0.38, 1.1, 0.52], 0.06, suit, true));
    rider.add(link([s * 0.15, 1.0, -0.3], [s * 0.2, 0.76, 0.12], 0.085, suit, true));
    rider.add(link([s * 0.2, 0.76, 0.12], [s * 0.22, 0.45, -0.1], 0.07, dark, true));
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), dark); gl.position.set(s * 0.4, 1.1, 0.54); rider.add(gl);
  }
  const hel = o.helmet || { c1: '#ffffff', c2: '#111111', style: 0 };
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshPhysicalMaterial({ color: hel.c1, roughness: 0.25, metalness: 0.1, clearcoat: 1 }));
  hm.position.set(0, 1.58, 0.17); hm.scale.set(1, 1.05, 1.15); hm.castShadow = true; rider.add(hm);
  if ((hel.style | 0) % 2 === 0) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.162, 20, 10, 0, Math.PI * 2, 0.1, 0.35), new THREE.MeshPhysicalMaterial({ color: hel.c2, roughness: 0.3, clearcoat: 1 })); st.position.copy(hm.position); st.scale.copy(hm.scale); rider.add(st); }
  else { const bd = new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.025, 8, 20), new THREE.MeshStandardMaterial({ color: hel.c2 })); bd.position.copy(hm.position); bd.scale.set(1, 1.05, 1.15); bd.rotation.y = Math.PI / 2; rider.add(bd); }
  rider.add(box(0.22, 0.07, 0.1, glassMat, 0, 1.58, 0.33));
  // numeros e patrocinadores
  const numT = TX.numberTex(o.number || 1, '#111', '#fff');
  const mkNum = (x, y, z, ry, s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: numT, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; body.add(m); };
  mkNum(0, 0.92, 1.0, 0, 0.26); for (const s of [-1, 1]) mkNum(s * 0.24, 0.8, 0.12, s * Math.PI / 2, 0.26);
  (o.sponsors || ['NOVA', 'KRONOS']).forEach((sp, k) => {
    const dt = TX.decalTex(sp, o.c1, '#fff'); dt.colorSpace = THREE.SRGBColorSpace;
    for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), new THREE.MeshBasicMaterial({ map: dt, transparent: true })); d.position.set(s * 0.215, 0.9 - k * 0.0, -0.62 - k * 0.52); d.rotation.y = s * Math.PI / 2; d.position.y = 0.88; body.add(d); }
  });
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  var api = {
    group: g, body, rider, wheels: [rw, fwl], lean: true, leanK: 8,
    setLean(a) { body.rotation.z = a; rider.rotation.z = a * 0.28; },
    setBrake(on) { brakeMat.emissiveIntensity = on ? 3.5 : 0.5; },
    spin(dist) { rw.spin.rotation.x += dist / RR; fwl.spin.rotation.x += dist / RF; },
    steer(a) { fork.rotation.y = a * 0.7; },
    setTyre(hex) { for (const m of bandMats) m.color.set(hex); },
    setDamage() { },
  };
  return api;
}
