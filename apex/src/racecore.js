// Nucleo da corrida (sem graficos): grid, largada, voltas, posicoes, IA.
import { Racer, stepCar, carCollisions } from './physics.js';
import { buildProfile, AIDriver } from './ai.js';

function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class RaceCore {
  // entries: [{id,name,teamId,number,c1,c2,isPlayer,spec, grid?}]
  constructor(track, entries, laps, skill, seed = 1) {
    this.t = track; this.laps = laps; this.rnd = mulberry(seed);
    this.cars = []; this.ai = [];
    const order = entries.map((e, i) => ({ e, q: e.qual != null ? e.qual : (e.spec.power + e.spec.grip + e.spec.aero) / 3 + (this.rnd() - 0.5) * 0.05 }))
      .sort((a, b) => b.q - a.q);
    order.forEach(({ e }, k) => {
      const r = new Racer({ id: e.id, name: e.name, teamId: e.teamId, number: e.number, c1: e.c1, c2: e.c2, isPlayer: !!e.isPlayer, tag: e.tag || '', helmet: e.helmet, nat: e.nat }, e.spec);
      const row = k >> 1, side = (k & 1) ? 3.4 : -3.4;
      const s = -(7 + row * 8.5);
      r.place(track, ((s % track.length) + track.length) % track.length, side);
      r.prog = s; r.gridPos = k + 1; r.lapStart = 0;
      this.cars.push(r);
      if (!r.isPlayer) {
        const prof = buildProfile(track, e.spec, skill * (0.985 + this.rnd() * 0.03));
        this.ai.push(new AIDriver(r, track, prof, this.rnd));
      }
    });
    this.player = this.cars.find(c => c.isPlayer) || null;
    this.time = 0; this.phase = 'countdown'; this.cd = 0; this.goAt = 5.2 + this.rnd() * 0.9; this.lights = 0;
    this.raceTime = 0; this.finishCount = 0; this.afterFinish = 0; this.done = false;
    this.events = []; this.skill = skill;
    this.order = this.cars.slice();
    this.ranking = null;
  }

  step(dt, pin) {
    const ev = this.events; ev.length = 0;
    const cars = this.cars, t = this.t;
    if (this.phase === 'countdown') {
      this.cd += dt;
      const L = Math.min(5, Math.floor(this.cd));
      if (L !== this.lights) { this.lights = L; ev.push({ type: 'light', n: L }); }
      if (this.cd >= this.goAt) { this.phase = 'race'; this.lights = 0; this.raceTime = 0; ev.push({ type: 'go' }); }
    }
    const racing = this.phase === 'race';
    if (racing) this.raceTime += dt;
    // ordem
    const ord = this.order; ord.sort((a, b) => (b.finished ? 1e9 - b.finishTime : b.prog) - (a.finished ? 1e9 - a.finishTime : a.prog));
    ord.forEach((c, i) => { c.pos = i + 1; });
    // aspirar
    const pp = this.player ? this.player.prog : 0;
    for (const c of cars) {
      let slip = 0;
      if (racing) for (const o of cars) {
        if (o === c) continue;
        const gap = o.prog - c.prog;
        if (gap > 2 && gap < 45 && Math.abs(o.lat - c.lat) < 3.2) { slip = Math.max(slip, 1 - gap / 45); }
      }
      c.slipstream = slip;
    }
    for (const c of cars) {
      let inp;
      if (c.isPlayer) {
        inp = racing || c.finished ? (c.finished ? { steer: 0, throttle: 0.0, brake: 0.25 } : pin) : { steer: 0, throttle: 0, brake: 1 };
        if (!racing) inp = { steer: 0, throttle: 0, brake: 1 };
        if (c.finished) inp = this._autoDrive(c, dt);
      } else {
        const d = this.ai.find(a => a.r === c);
        if (!racing) inp = { steer: 0, throttle: 0, brake: 1 };
        else {
          const gapP = pp - c.prog;
          const boost = 1 + Math.max(-0.02, Math.min(0.035, gapP / 2500)) * (this.skill > 0.99 ? 0.5 : 1);
          const fin = c.finished;
          const o = d.drive(dt, cars, pp, fin ? 0.62 : boost);
          if (o.stuck) { c.place(t, ((c.lastS % t.length) + t.length) % t.length, 0); c.loc.lat = 0; d.stuck = 0; }
          inp = o;
        }
      }
      c.thr = inp.throttle; c.brk = inp.brake; c.str = inp.steer;
      const hit = stepCar(c, inp, dt, t, racing ? c.slipstream : 0);
      if (hit > 0.05) ev.push({ type: 'wall', car: c, force: hit });
      // voltas
      if (racing) {
        const lapNow = Math.floor(c.prog / t.length);
        if (lapNow > c.lap && lapNow >= 1) {
          c.lap = lapNow;
          const lt = this.raceTime - c.lapStart; c.lapStart = this.raceTime;
          if (lt > 8) { c.lapTimes.push(lt); if (!c.best || lt < c.best) { c.best = lt; ev.push({ type: 'best', car: c, time: lt }); } }
          ev.push({ type: 'lap', car: c, lap: lapNow, time: lt });
          if (lapNow >= this.laps && !c.finished) {
            c.finished = true; c.finishTime = this.raceTime; this.finishCount++;
            c.finishPos = this.finishCount;
            ev.push({ type: 'finish', car: c });
          }
        } else if (lapNow < c.lap) c.lap = Math.max(0, lapNow);
      }
    }
    const big = carCollisions(cars, dt);
    if (big > 3) ev.push({ type: 'crash', force: Math.min(1, big / 25) });
    // fim
    if (this.player && this.player.finished && !this.done) {
      this.afterFinish += dt;
      if (this.afterFinish > 4 || cars.every(c => c.finished)) { this.done = true; this.ranking = this.computeRanking(); ev.push({ type: 'done' }); }
    } else if (!this.player && cars.every(c => c.finished)) { this.done = true; this.ranking = this.computeRanking(); }
    return ev;
  }

  _autoDrive(c, dt) {
    // apos a bandeirada o carro do jogador segue na linha central e freia suave
    const t = this.t, n = t.n;
    const j = (c.idx + 14) % n;
    const dx = t.x[j] - c.x, dz = t.z[j] - c.z;
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
    const alpha = Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz);
    return { steer: Math.max(-1, Math.min(1, alpha * 2.4)), throttle: c.v < 38 ? 0.6 : 0, brake: c.v > 48 ? 0.4 : 0 };
  }

  computeRanking() {
    const fin = this.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    const rest = this.cars.filter(c => !c.finished).sort((a, b) => b.prog - a.prog);
    return fin.concat(rest);
  }
}
