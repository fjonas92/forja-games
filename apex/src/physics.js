// Fisica arcade dos carros (compartilhada pelo jogador e pela IA). Sem dependencias.
import { locate } from './trackgen.js';

export const ACC = 17, DRAG0 = 0.0022, G_BASE = 22, K_AERO = 0.0041, L = 3.6, MAX_ANG = 0.5;
const TAN = Math.tan(MAX_ANG);

// spec: {power, aero, grip, brake, wing(-2..2)}  (valores ~1)
export function makeSpec(team, upg = {}, wing = 0) {
  const u = k => (upg[k] || 0) * 0.015;
  return {
    power: team.power + u('motor'),
    aero: (team.aero + u('aero')) * (1 + 0.07 * wing),
    grip: team.grip + u('tyre'),
    brake: team.brake + u('brake'),
    drag: 1 + 0.045 * wing,
    wearK: 1 - (upg.tyre || 0) * 0.06,
  };
}

// aderencia do composto conforme a umidade da pista (0 seco .. 1 encharcado). S = liso, W = chuva
export function tyreGm(tyre, wet) {
  if (tyre === 'W') return 0.90 + 0.08 * Math.min(1, wet / 0.5);
  return 1 - 0.34 * wet;
}

export class Racer {
  constructor(def, spec) {
    Object.assign(this, def);
    this.spec = spec;
    this.x = 0; this.z = 0; this.y = 0; this.yaw = 0; this.v = 0;
    this.idx = 0; this.lat = 0; this.prog = 0; this.lastS = 0; this.lap = 0;
    this.lapStart = 0; this.lapTimes = []; this.best = 0; this.finished = false; this.finishTime = 0;
    this.wear = 1; this.surf = 0; this.wallCd = 0; this.hits = 0; this.slipS = 0; this.yawRate = 0;
    this.pitch = 0; this.roll = 0; this.brakeOn = false; this.out = 0; this.stuckT = 0; this.latAcc = 0; this.bump = 0;
    this.loc = { i: 0, lat: 0, along: 0, s: 0, y: 0 };
    this.dmg = 0; this.tyre = 'S'; this.gm = 1; this.ghost = false; this.pit = null; this.pitReq = null; this.pull = 0; this.pitCount = 0;
    this.thr = 0; this.brk = 0; this.str = 0; this.accNow = 0;
  }
  place(track, s, lat) {
    const n = track.n; let f = s / track.ds; let i = Math.floor(f); const k = f - i;
    i = ((i % n) + n) % n; const j = (i + 1) % n;
    const px = track.x[i] + (track.x[j] - track.x[i]) * k, pz = track.z[i] + (track.z[j] - track.z[i]) * k;
    this.x = px + track.rx[i] * lat; this.z = pz + track.rz[i] * lat; this.yaw = track.hdg[i];
    this.y = track.y[i]; this.v = 0; this.idx = i; this.lat = lat;
    locate(track, this.x, this.z, i, this.loc); this.lastS = this.loc.s;
  }
}

export function topSpeed(spec) { return Math.sqrt(ACC * spec.power / (DRAG0 * spec.drag)); }
export function gripForce(spec, v, wear = 1, gm = 1, af = 1) { return G_BASE * spec.grip * (0.78 + 0.22 * wear) * gm + K_AERO * spec.aero * af * v * v; }
export function yawCap(spec, v, wear = 1, gm = 1) {
  const sv = Math.max(v, 3);
  return Math.min(sv * TAN / L, 1.15 * gripForce(spec, sv, wear, gm) / sv);
}
export function brakeDecel(spec) { return (38 + 8 * spec.aero) * spec.brake; }

// avanca um carro. inp: {steer(-1..1, + direita), throttle, brake}. slip: reducao de arrasto por vacuo (0..1)
export function stepCar(r, inp, dt, track, slip = 0) {
  const sp = r.spec, w = track.w, K = track.kerb, D = track.D;
  let v = r.v;
  const thr = inp.throttle, brk = inp.brake;
  // superficie
  const lat = r.loc.lat, al = Math.abs(lat);
  let sg = 1, kind = 0; // 0 asfalto 1 zebra 2 grama 3 muro
  if (al > w) { kind = 1; sg = 0.96; }
  if (al > w + K) { kind = 2; sg = 0.6; }
  r.surf = kind;
  // aceleracao
  const drag = DRAG0 * sp.drag * (1 - 0.28 * slip);
  const gm = r.gm == null ? 1 : r.gm, dm = r.isPlayer ? (r.dmg || 0) : 0, af = 1 - 0.32 * dm;
  let acc = thr * ACC * sp.power * (1 - 0.10 * dm) * (0.55 + 0.45 * gm) * (kind === 2 ? 0.6 : 1) - drag * v * Math.abs(v);
  if (thr < 0.05 && brk < 0.05) acc -= 2.4 * Math.sign(v);
  let brakeLoad = 0;
  if (brk > 0.02) {
    if (v > 0.5) { acc -= brk * brakeDecel(sp) * (0.4 + 0.6 * gm) * (kind === 2 ? 0.7 : 1); brakeLoad = brk * Math.min(1, v / 40); }
    else if (thr < 0.05) acc = -brk * 7; // re
  }
  v += acc * dt;
  if (v < -9) v = -9;
  if (brk > 0.02 && v < 0 && thr > 0.05) v = Math.min(0, v + 30 * dt);
  if (kind === 2) { const cap = 33; if (v > cap) v -= (v - cap) * 1.5 * dt; }
  // direcao
  const av = Math.abs(v);
  const geo = Math.max(av, 3) * TAN / L;
  const gf = gripForce(sp, av, r.wear, gm, af);
  const gn = 1.15 * gf / Math.max(av, 3);
  const demand = inp.steer * Math.min(geo, gn);
  const avail = gf * sg * (1 - 0.38 * brakeLoad) / Math.max(av, 3);
  let yr = Math.max(-avail, Math.min(avail, demand));
  const exc = Math.abs(demand) - avail;
  if (exc > 0 && av > 8) { v -= Math.sign(v) * Math.min(exc * av * 0.30 * dt, av * 0.3 * dt * 3); r.slipS = Math.min(1, r.slipS + dt * 3); }
  else r.slipS = Math.max(0, r.slipS - dt * 2.5);
  if (v < 0) yr = -yr;
  // carro batido puxa para um lado
  if (dm > 0.35) { if (!r.pull) r.pull = Math.random() < 0.5 ? 1 : -1; yr += r.pull * (dm - 0.35) * 0.12 * Math.min(1, av / 50); }
  r.yawRate = yr;
  r.yaw -= yr * dt;
  r.latAcc = yr * v;
  // desgaste dos pneus
  const wetWear = r.tyre === 'W' ? 1 + 1.2 * Math.max(0, 1 - (r.wetNow || 0) / 0.5) : 1;
  r.wear = Math.max(0.5, r.wear - (Math.abs(r.latAcc) * 1.6e-5 + brakeLoad * 3.5e-4 + (kind === 2 ? 3e-4 : 0)) * sp.wearK * wetWear * dt);
  // posicao
  const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
  r.x += fx * v * dt; r.z += fz * v * dt;
  r.v = v; r.accNow = acc;
  // localizacao na pista
  locate(track, r.x, r.z, r.idx, r.loc);
  r.idx = r.loc.i; r.lat = r.loc.lat;
  // muro
  r.wallCd = Math.max(0, r.wallCd - dt);
  const lim = D - 1.3, l2 = r.loc.lat, a2 = Math.abs(l2);
  let hit = 0;
  if (a2 > lim) {
    const sgn = Math.sign(l2), sh = a2 - lim, i = r.loc.i;
    r.x -= sgn * track.rx[i] * sh; r.z -= sgn * track.rz[i] * sh;
    // alinha com a pista
    let da = track.hdg[i] - r.yaw; da = Math.atan2(Math.sin(da), Math.cos(da));
    const rel = Math.abs(da);
    if (r.wallCd <= 0) { hit = Math.min(1, rel * 1.2 + av / 90); r.v *= 0.62; r.wallCd = 0.45; r.hits++; }
    r.yaw += da * Math.min(1, dt * 6);
    r.v *= 1 - Math.min(0.9, dt * 2.2);
    r.loc.lat = sgn * lim; r.lat = r.loc.lat;
  }
  r.hit = hit;
  r.y = r.loc.y;
  // inclinacao visual
  const tp = Math.max(-0.12, Math.min(0.12, -acc * 0.0035)); r.pitch += (tp - r.pitch) * Math.min(1, dt * 6);
  const tr = Math.max(-0.07, Math.min(0.07, r.latAcc * 0.0012)); r.roll += (tr - r.roll) * Math.min(1, dt * 6);
  r.brakeOn = brk > 0.1 && v > 1;
  // progresso
  let ds = r.loc.s - r.lastS; const Lt = track.length;
  if (ds > Lt / 2) ds -= Lt; else if (ds < -Lt / 2) ds += Lt;
  r.lastS = r.loc.s; r.prog += ds;
  return hit;
}

// colisao simples entre carros (2 circulos por carro)
export function carCollisions(cars, dt) {
  let big = 0;
  for (let a = 0; a < cars.length; a++) {
    const A = cars[a];
    for (let b = a + 1; b < cars.length; b++) {
      const B = cars[b];
      if (A.ghost || B.ghost) continue;
      if (Math.abs(A.x - B.x) > 6 || Math.abs(A.z - B.z) > 6) continue;
      for (const oa of [-1.3, 1.3]) for (const ob of [-1.3, 1.3]) {
        const ax = A.x + Math.sin(A.yaw) * oa, az = A.z + Math.cos(A.yaw) * oa;
        const bx = B.x + Math.sin(B.yaw) * ob, bz = B.z + Math.cos(B.yaw) * ob;
        let dx = bx - ax, dz = bz - az; const d = Math.hypot(dx, dz), R = 1.9;
        if (d < R && d > 1e-4) {
          dx /= d; dz /= d; const pen = (R - d) * 0.5;
          A.x -= dx * pen; A.z -= dz * pen; B.x += dx * pen; B.z += dz * pen;
          const rear = A.prog < B.prog ? A : B, front = rear === A ? B : A;
          const rel = rear.v - front.v;
          if (rel > 0) { rear.v -= rel * 0.45; front.v += rel * 0.15; if (rel > big) big = rel; }
          // pequeno giro
          const side = (dx * Math.cos(A.yaw) - dz * Math.sin(A.yaw));
          A.yaw += side * 0.01; B.yaw -= side * 0.01;
        }
      }
    }
  }
  return big;
}
