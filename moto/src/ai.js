// IA dos pilotos: perfil de velocidade pela curvatura + perseguicao de ponto (pure pursuit).
import { yawCap, gripForce, topSpeed, K_AERO, L, MAX_ANG } from './physics.js';

export function buildProfile(track, spec, skill) {
  const n = track.n, ds = track.ds, out = new Float32Array(n);
  const vtop = topSpeed(spec) * 0.985;
  const kw = K_AERO * spec.aero;
  const gb = 22 * spec.grip * 0.9 * skill;
  // curvatura antecipada: maior valor numa janela a frente
  for (let i = 0; i < n; i++) {
    let k = 0;
    for (let j = -3; j <= 6; j++) k = Math.max(k, Math.abs(track.curv[(i + j + n) % n]));
    let v;
    if (k <= kw * 1.04) v = vtop; else v = Math.sqrt(gb / (k - kw));
    out[i] = Math.min(vtop, v);
  }
  const bd = 31 * spec.brake * skill;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = n * 2; i >= 0; i--) {
      const a = i % n, b = (i + 1) % n;
      const vmax = Math.sqrt(out[b] * out[b] + 2 * bd * ds);
      if (out[a] > vmax) out[a] = vmax;
    }
  }
  return out;
}

const TANA = Math.tan(MAX_ANG);

export class AIDriver {
  constructor(racer, track, profile, rnd) {
    this.r = racer; this.t = track; this.prof = profile;
    this.lane = 0; this.pref = (rnd() - 0.5) * 3; this.laneNow = this.pref;
    this.skillJ = 0.985 + rnd() * 0.03;
    this.react = 0;
  }
  // devolve {steer, throttle, brake}
  drive(dt, cars, playerProg, boost) {
    const r = this.r, t = this.t, n = t.n, ds = t.ds;
    const v = Math.max(r.v, 0);
    // pista livre ou carro a frente
    let target = this.pref, blockDist = 99;
    for (const o of cars) {
      if (o === r || o.ghost) continue;
      const gap = o.prog - r.prog;
      if (gap > 0 && gap < 32) {
        const dl = o.lat - r.lat;
        if (Math.abs(dl) < 2.9) {
          target = r.lat - (dl >= 0 ? 1 : -1) * 3.2;
          if (gap < blockDist) blockDist = gap;
        }
      }
    }
    const lim = t.w - 1.7;
    target = Math.max(-lim, Math.min(lim, target));
    this.laneNow += (target - this.laneNow) * Math.min(1, dt * 1.6);
    // ponto alvo
    const Ld = 9 + 0.42 * v;
    const j = (r.idx + Math.max(2, Math.round(Ld / ds))) % n;
    const tx = t.x[j] + t.rx[j] * this.laneNow, tz = t.z[j] + t.rz[j] * this.laneNow;
    const dx = tx - r.x, dz = tz - r.z;
    const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw), rx = -fz, rz = fx;
    const alpha = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
    const dist = Math.hypot(dx, dz);
    const desiredYaw = 2 * Math.sin(alpha) / Math.max(dist, 4) * Math.max(v, 3);
    let steer = desiredYaw / Math.max(0.05, yawCap(r.spec, v, r.wear, r.gm));
    steer = Math.max(-1, Math.min(1, steer));
    // velocidade alvo
    const look = (r.idx + Math.round(v * 0.25 / ds)) % n;
    let vt = this.prof[look] * this.skillJ * boost * (0.82 + 0.18 * r.wear) * Math.pow(r.gm == null ? 1 : r.gm, 0.55);
    if (Math.abs(r.lat) > t.w + t.kerb) vt = Math.min(vt, 28);
    if (blockDist < 12) vt = Math.min(vt, v * 0.985 + 1);
    let throttle = 0, brake = 0;
    if (v > vt * 1.015) { brake = Math.min(1, (v - vt) / 7); }
    else throttle = Math.max(0.25, Math.min(1, (vt - v) / 3 + 0.4));
    if (v > vt * 1.015 && v - vt < 1.5) { brake = 0; throttle = 0; }
    // recuperacao se estiver parado
    if (v < 1.5 && !r.finished) { this.stuck = (this.stuck || 0) + dt; } else this.stuck = 0;
    return { steer, throttle, brake, stuck: this.stuck > 3.5 };
  }
}
