// Som procedural (WebAudio): motor, vento, pneus, bips de largada, batidas.
export class Sfx {
  constructor() { this.ctx = null; this.on = true; this.vol = 0.8; this.running = false; }
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.on ? this.vol : 0; this.master.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.connect(this.master); this.out = comp;
    // motor: 2 serras + onda quadrada sub
    this.o1 = c.createOscillator(); this.o1.type = 'sawtooth';
    this.o2 = c.createOscillator(); this.o2.type = 'square';
    this.o3 = c.createOscillator(); this.o3.type = 'sawtooth';
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 900; this.lp.Q.value = 2.5;
    this.eg = c.createGain(); this.eg.gain.value = 0;
    const g1 = c.createGain(); g1.gain.value = 0.5; const g2 = c.createGain(); g2.gain.value = 0.25; const g3 = c.createGain(); g3.gain.value = 0.3;
    this.o1.connect(g1).connect(this.lp); this.o2.connect(g2).connect(this.lp); this.o3.connect(g3).connect(this.lp);
    this.lp.connect(this.eg).connect(this.out);
    this.o1.start(); this.o2.start(); this.o3.start();
    // ruido (vento / pneu)
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const mkNoise = (type, f, q) => {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
      const bq = c.createBiquadFilter(); bq.type = type; bq.frequency.value = f; bq.Q.value = q;
      const g = c.createGain(); g.gain.value = 0; s.connect(bq).connect(g).connect(this.out); s.start(); return { g, bq };
    };
    this.wind = mkNoise('lowpass', 600, 0.5);
    this.tyre = mkNoise('bandpass', 1500, 4);
    this.grass = mkNoise('lowpass', 300, 1);
    this.running = true;
  }
  setOn(v) { this.on = v; if (this.master) this.master.gain.value = v ? this.vol : 0; this._musicApply(); }
  // musica da abertura (arquivo intro.mp3): toca nos menus, some na corrida
  music(on) { this.musWant = on; this._musicApply(); }
  _musicApply() {
    const want = this.musWant && this.on;
    if (!this.mus) { if (!want) return; this.mus = new Audio('intro.mp3'); this.mus.loop = true; this.mus.preload = 'auto'; this.mus.volume = 0; }
    const a = this.mus; clearInterval(this._mf);
    if (want) { const p = a.play(); if (p && p.catch) p.catch(() => { }); }
    this._mf = setInterval(() => {
      const target = want ? 0.5 : 0, d = target - a.volume;
      if (Math.abs(d) < 0.03) { a.volume = target; clearInterval(this._mf); if (!want) a.pause(); }
      else a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(d) * 0.03));
    }, 60);
  }
  update(r, thr, paused) {
    if (!this.running) return;
    const c = this.ctx, t = c.currentTime;
    if (paused || !r) { this.eg.gain.setTargetAtTime(0.0, t, 0.05); this.wind.g.gain.setTargetAtTime(0, t, 0.05); this.tyre.g.gain.setTargetAtTime(0, t, 0.05); this.grass.g.gain.setTargetAtTime(0, t, 0.05); return; }
    const v = Math.abs(r.v);
    const gear = Math.min(8, 1 + Math.floor(v / 11.5)), frac = Math.min(1, (v - (gear - 1) * 11.5) / 11.5);
    r.gear = gear; r.rpm = 0.32 + 0.68 * Math.max(0, frac) * (0.55 + 0.45 * Math.min(1, thr + 0.3));
    const f = 55 + r.rpm * 230;
    this.o1.frequency.setTargetAtTime(f, t, 0.03); this.o2.frequency.setTargetAtTime(f * 0.5, t, 0.03); this.o3.frequency.setTargetAtTime(f * 1.51, t, 0.03);
    this.lp.frequency.setTargetAtTime(500 + r.rpm * 2600 + thr * 600, t, 0.05);
    this.eg.gain.setTargetAtTime(0.10 + 0.12 * thr + 0.05 * r.rpm, t, 0.05);
    this.wind.g.gain.setTargetAtTime(Math.min(0.28, v / 320), t, 0.1);
    this.wind.bq.frequency.setTargetAtTime(300 + v * 9, t, 0.1);
    const sk = Math.max(r.slipS, r.brakeOn && v > 40 ? 0.35 * Math.min(1, v / 70) : 0);
    this.tyre.g.gain.setTargetAtTime(sk * 0.22, t, 0.04);
    this.grass.g.gain.setTargetAtTime(r.surf === 2 ? Math.min(0.3, v / 150) : r.surf === 1 ? 0.08 * Math.min(1, v / 40) : 0, t, 0.05);
  }
  beep(freq, dur = 0.18, vol = 0.25, type = 'sine') {
    if (!this.running) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  }
  thud(force = 0.5) {
    if (!this.running) return;
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const bq = c.createBiquadFilter(); bq.type = 'lowpass'; bq.frequency.value = 700; const g = c.createGain();
    g.gain.setValueAtTime(0.5 * force + 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    s.connect(bq).connect(g).connect(this.out); s.start(t, Math.random()); s.stop(t + 0.4);
  }
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.3, 0.2, 'triangle'), i * 140)); }
  tick() { this.beep(900, 0.05, 0.12, 'square'); }
}
