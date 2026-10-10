import * as THREE from 'three';
import * as TX from './textures.js';

const carbon = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.45, metalness: 0.5 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.92, metalness: 0 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.25, metalness: 0.9 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.1, metalness: 0.6 });

function lathe(profile, seg = 24) {
  const g = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0], p[1])), seg);
  g.rotateX(Math.PI / 2); // eixo Y -> Z
  return g;
}

function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; return m;
}

function wheel(front, mats) {
  const R = front ? 0.33 : 0.36, W = front ? 0.30 : 0.42;
  const pivot = new THREE.Group();           // esterco (yaw)
  const spin = new THREE.Group(); pivot.add(spin);
  // pneu com ombros arredondados
  const prof = [];
  const hw = W / 2, sh = 0.05;
  prof.push([R * 0.62, -hw]);
  prof.push([R - sh, -hw]);
  for (let a = 0; a <= 6; a++) { const t = (a / 6) * Math.PI / 2; prof.push([R - sh + Math.sin(t) * sh, -hw + sh - Math.cos(t) * sh]); }
  prof.push([R, hw - sh]);
  for (let a = 0; a <= 6; a++) { const t = (a / 6) * Math.PI / 2; prof.push([R - sh + Math.cos(t) * sh, hw - sh + Math.sin(t) * sh]); }
  prof.push([R - sh, hw]);
  prof.push([R * 0.62, hw]);
  const tg = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 28);
  tg.rotateZ(Math.PI / 2);
  const tyre = new THREE.Mesh(tg, rubber); tyre.castShadow = true; tyre.receiveShadow = true; spin.add(tyre);
  // faixa colorida lateral (composto)
  const bm = new THREE.MeshBasicMaterial({ color: mats.band, side: THREE.DoubleSide }); mats.list && mats.list.push(bm);
  const band = new THREE.Mesh(new THREE.RingGeometry(R * 0.66, R * 0.74, 28), bm);
  band.rotation.y = Math.PI / 2; band.position.x = hw + 0.002; spin.add(band);
  const band2 = band.clone(); band2.material = bm; band2.position.x = -hw - 0.002; spin.add(band2);
  const rimG = new THREE.CylinderGeometry(R * 0.6, R * 0.6, W * 0.9, 22); rimG.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimG, rimMat); spin.add(rim);
  for (let i = 0; i < 5; i++) { // raios
    const sp = new THREE.Mesh(new THREE.BoxGeometry(W * 0.95, 0.04, R * 1.0), carbon); sp.rotation.x = (i / 5) * Math.PI; spin.add(sp);
  }
  return { pivot, spin, R };
}

export function makeCar(o) {
  const c1 = new THREE.Color(o.c1), c2 = new THREE.Color(o.c2);
  const paint = new THREE.MeshPhysicalMaterial({ color: c1, roughness: 0.32, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  const paint2 = new THREE.MeshPhysicalMaterial({ color: c2, roughness: 0.38, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  // estilo de pintura: textura desenhada no monocoque, cobertura do motor e sidepods
  const pid = o.paint && o.paint !== 'solid' ? o.paint : null;
  let paintP = paint;
  if (pid) {
    paintP = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: TX.liveryTex(pid, o.c1, o.c2), roughness: pid === 'carbon' ? 0.28 : 0.32, metalness: pid === 'gold' ? 0.85 : pid === 'carbon' ? 0.5 : 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  }
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);

  // monocoque (revolucao) - nariz pontudo ate a traseira
  const fus = new THREE.Mesh(lathe([[0.0, 2.55], [0.06, 2.45], [0.13, 2.1], [0.2, 1.55], [0.27, 0.9], [0.34, 0.2], [0.36, -0.4], [0.32, -1.1], [0.24, -1.8], [0.15, -2.15], [0.0, -2.2]], 28), paintP);
  fus.scale.set(1, 0.78, 1); fus.position.y = 0.4; fus.castShadow = true; body.add(fus);
  // pontas laterais (sidepods)
  for (const s of [-1, 1]) {
    const sp = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 1.35, 6, 14), paintP); sp.rotation.x = Math.PI / 2; sp.scale.set(1.0, 1.0, 0.82);
    sp.position.set(s * 0.58, 0.3, -0.35); sp.castShadow = true; body.add(sp);
    // entrada de ar
    const inlet = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 18), paint2); inlet.position.set(s * 0.58, 0.32, 0.38); inlet.scale.set(1, 0.9, 1); body.add(inlet);
    const dark = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), glassMat); dark.position.set(s * 0.58, 0.32, 0.375); body.add(dark);
    // suportes das rodas (bracos)
    for (const [zz, xx, y2] of [[1.6, 0.85, 0.34], [-1.55, 0.88, 0.36]]) {
      body.add(box(Math.abs(xx - 0.2), 0.035, 0.05, carbon, s * (xx + 0.2) / 2, y2 + 0.06, zz + 0.15, 0, 0, s * -0.05));
      body.add(box(Math.abs(xx - 0.2), 0.035, 0.05, carbon, s * (xx + 0.2) / 2, y2 - 0.1, zz - 0.15, 0, 0, s * 0.05));
    }
  }
  // assoalho
  body.add(box(1.5, 0.05, 3.9, carbon, 0, 0.1, -0.2));
  body.add(box(1.2, 0.05, 0.9, carbon, 0, 0.14, -2.0, -0.14, 0, 0)); // difusor
  // cobertura do motor / airbox
  const eng = new THREE.Mesh(lathe([[0.0, -1.9], [0.12, -1.7], [0.2, -1.0], [0.24, -0.45], [0.2, -0.2], [0.0, -0.1]], 20), paintP); eng.scale.set(0.8, 1.15, 1); eng.position.set(0, 0.58, 0); eng.castShadow = true; body.add(eng);
  const air = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.34, 14, 1, true), paint2); air.position.set(0, 0.78, -0.18); air.scale.set(1, 1, 1.5); body.add(air);
  // nadadeira
  const fin = box(0.03, 0.34, 1.4, paint2, 0, 0.82, -1.3); body.add(fin);
  // halo
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 8, 22, Math.PI), carbon); halo.rotation.set(0, Math.PI / 2, 0); halo.rotation.z = 0.0; halo.position.set(0, 0.5, 0.0); halo.scale.set(1, 1, 1.55);
  const halo2 = new THREE.Group(); halo2.add(halo); halo2.rotation.x = 0; body.add(halo2);
  const pylon = box(0.035, 0.22, 0.035, carbon, 0, 0.5, 0.45, 0.35, 0, 0); body.add(pylon);
  // piloto / capacete
  const hel = o.helmet || { c1: '#ffffff', c2: '#111111', style: 0 };
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshPhysicalMaterial({ color: hel.c1, roughness: 0.25, metalness: 0.1, clearcoat: 1 }));
  hm.position.set(0, 0.5, -0.12); hm.scale.set(1, 1.05, 1.15); hm.castShadow = true; body.add(hm);
  const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.152, 20, 10, 0, Math.PI * 2, 0.1, 0.35), new THREE.MeshPhysicalMaterial({ color: hel.c2, roughness: 0.3, clearcoat: 1 }));
  if ((hel.style | 0) % 2 === 0) { stripe.position.copy(hm.position); stripe.scale.copy(hm.scale); stripe.rotation.x = 0; body.add(stripe); }
  else { const band = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.025, 8, 20), new THREE.MeshStandardMaterial({ color: hel.c2 })); band.position.copy(hm.position); band.scale.set(1, 1.05, 1.15); band.rotation.y = Math.PI / 2; body.add(band); }
  const visor = box(0.2, 0.06, 0.1, glassMat, 0, 0.52, 0.0); body.add(visor);
  // asa dianteira
  const fw = new THREE.Group(); fw.position.set(0, 0.13, 2.38);
  fw.add(box(2.0, 0.035, 0.42, carbon, 0, 0, 0)); fw.add(box(1.9, 0.03, 0.28, paint, 0, 0.07, -0.12, -0.12, 0, 0)); fw.add(box(1.6, 0.03, 0.2, carbon, 0, 0.13, -0.2, -0.22, 0, 0));
  for (const s of [-1, 1]) fw.add(box(0.035, 0.24, 0.55, paint2, s * 1.0, 0.1, -0.03));
  fw.add(box(0.1, 0.12, 0.5, carbon, 0, 0.06, -0.35));
  body.add(fw);
  // asa traseira
  const rw = new THREE.Group(); rw.position.set(0, 0.9, -2.2);
  rw.add(box(1.5, 0.045, 0.52, carbon, 0, 0, 0, 0.06, 0, 0)); rw.add(box(1.5, 0.04, 0.34, paint, 0, 0.17, -0.08, 0.28, 0, 0));
  for (const s of [-1, 1]) rw.add(box(0.04, 0.62, 0.74, paint2, s * 0.77, 0.05, -0.02));
  rw.add(box(0.06, 0.55, 0.25, carbon, 0, -0.3, 0.1));
  body.add(rw);
  // luz de freio / escapamento
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1010, emissiveIntensity: 0.5 });
  const bl = box(0.2, 0.08, 0.04, brakeMat, 0, 0.62, -2.5); body.add(bl);
  const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 10), rimMat); ex.rotation.x = Math.PI / 2; ex.position.set(0, 0.52, -2.1); body.add(ex);
  // decalques: numero + patrocinadores
  const numT = TX.numberTex(o.number || 1, '#111', '#fff');
  const numM = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: numT, transparent: true }));
  numM.rotation.set(-Math.PI / 2 + 0.12, 0, 0); numM.position.set(0, 0.906, -0.92); body.add(numM);
  const noseNum = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: numT, transparent: true })); noseNum.rotation.set(-Math.PI / 2 + 0.2, 0, 0); noseNum.position.set(0, 0.585, 1.5); body.add(noseNum);
  const spons = o.sponsors || ['NOVA', 'KRONOS'];
  spons.forEach((sp, k) => {
    const dt = TX.decalTex(sp, o.c1, '#fff'); dt.colorSpace = THREE.SRGBColorSpace;
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.17), new THREE.MeshBasicMaterial({ map: dt, transparent: true, opacity: 0.0 }));
      // decalques ficam nos sidepods
      d.material.opacity = 1; d.position.set(s * (0.58 + 0.275), 0.32, -0.15 - k * 0.58); d.rotation.y = s * Math.PI / 2;
      body.add(d);
    }
  });
  // rodas
  const tyreBand = o.tyreBand || '#ffd23f';
  const bandMats = [];
  const W = [
    { f: true, x: 0.93, z: 1.6 }, { f: true, x: -0.93, z: 1.6 }, { f: false, x: 0.97, z: -1.55 }, { f: false, x: -0.97, z: -1.55 },
  ].map(d => { const w = wheel(d.f, { band: tyreBand, list: bandMats }); w.pivot.position.set(d.x, w.R, d.z); body.add(w.pivot); w.front = d.f; return w; });
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  var api = {
    group: g, body, wheels: W,
    setBrake(on) { brakeMat.emissiveIntensity = on ? 3.5 : 0.5; },
    spin(dist) { for (const w of W) w.spin.rotation.x += dist / w.R; },
    steer(a) { W[0].pivot.rotation.y = a; W[1].pivot.rotation.y = a; },
    setTyre(hex) { for (const m of bandMats) m.color.set(hex); },
    setDamage(d) {
      if (api._dm === d) return; api._dm = d;
      fw.rotation.z = d * 0.14; fw.scale.x = 1 - d * 0.4; fw.position.y = 0.13 - d * 0.05; fw.rotation.x = d * 0.08;
      rw.rotation.z = -d * 0.1; rw.position.x = d * 0.04;
    },
  };
  return api;
}
