// Sons sintetizados (sem arquivos) e uma música ambiente simples para cada região
export const Audio = {
  ctx: null, on: true, music: null, musicKind: '', master: null,
  init() {
    if (!this.ctx) { try { const A = window.AudioContext || window.webkitAudioContext; if (A) { this.ctx = new A(); this.master = this.ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(this.ctx.destination); } } catch (e) {} }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  },
  tone(f0, f1, dur, vol, type, delay) {
    if (!this.on || !this.ctx) return;
    try { const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02); } catch (e) {}
  },
  noise(dur, vol, freq) {
    if (!this.on || !this.ctx) return;
    try { const c = this.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq || 1200; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(this.master); s.start(); } catch (e) {}
  },
  swing() { this.noise(0.09, 0.25, 2600); },
  hit() { this.tone(220, 90, 0.08, 0.12, 'square'); this.noise(0.05, 0.2, 800); },
  hurt() { this.tone(180, 60, 0.18, 0.14, 'sawtooth'); },
  coin() { this.tone(988, 988, 0.06, 0.06, 'square'); this.tone(1319, 1319, 0.12, 0.06, 'square', 0.06); },
  pickup() { [660, 880, 1100].forEach((f, i) => this.tone(f, f, 0.08, 0.06, 'triangle', i * 0.05)); },
  chest() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.14, 0.07, 'triangle', i * 0.08)); },
  levelUp() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f * 1.01, 0.18, 0.08, 'square', i * 0.09)); },
  evolve() { for (let i = 0; i < 10; i++) this.tone(300 + i * 90, 320 + i * 95, 0.16, 0.05, 'triangle', i * 0.08); },
  dodge() { this.noise(0.12, 0.18, 600); },
  magic() { this.tone(400, 1200, 0.25, 0.08, 'sine'); this.tone(600, 1800, 0.25, 0.05, 'triangle'); },
  ember() { this.noise(0.08, 0.12, 1800); this.tone(500, 260, 0.08, 0.04, 'sawtooth'); },
  bubble() { this.tone(500, 900, 0.1, 0.06, 'sine'); },
  slam() { this.tone(90, 40, 0.35, 0.22, 'sawtooth'); this.noise(0.3, 0.3, 300); },
  select() { this.tone(880, 880, 0.04, 0.05, 'square'); },
  talk() { this.tone(600 + Math.random() * 200, 600, 0.03, 0.025, 'square'); },
  heal() { [523, 784, 1047].forEach((f, i) => this.tone(f, f, 0.12, 0.05, 'sine', i * 0.06)); },
  // música: arpejos suaves em loop (troca conforme a região)
  playMusic(kind) {
    if (!this.ctx || this.musicKind === kind) return;
    this.stopMusic(); this.musicKind = kind; if (!this.on || !kind) return;
    const songs = {
      village: { bpm: 96, wave: 'triangle', notes: [60, 64, 67, 72, 69, 67, 64, 67, 62, 65, 69, 74, 72, 69, 65, 69], bass: [48, 48, 45, 45, 50, 50, 43, 43] },
      forest: { bpm: 84, wave: 'sine', notes: [57, 60, 64, 67, 64, 60, 62, 65, 69, 65, 62, 60, 59, 62, 67, 62], bass: [45, 45, 41, 41, 43, 43, 40, 40] },
      sanctuary: { bpm: 120, wave: 'square', notes: [57, 57, 60, 57, 63, 62, 60, 58, 57, 57, 60, 57, 64, 63, 62, 60], bass: [45, 45, 44, 44, 43, 43, 42, 42] },
      victory: { bpm: 110, wave: 'triangle', notes: [72, 76, 79, 84, 79, 76, 77, 81, 84, 88, 84, 81, 79, 76, 72, 76], bass: [48, 53, 55, 48, 48, 53, 55, 48] }
    };
    const s = songs[kind]; if (!s) return;
    const step = 60 / s.bpm / 2, f = n => 440 * Math.pow(2, (n - 69) / 12); let i = 0;
    const tick = () => {
      if (!this.on) return;
      const n = s.notes[i % s.notes.length]; this.tone(f(n), f(n), step * 0.9, kind === 'sanctuary' ? 0.018 : 0.025, s.wave);
      if (i % 2 === 0) this.tone(f(s.bass[(i / 2) % s.bass.length]), f(s.bass[(i / 2) % s.bass.length]), step * 1.8, 0.03, 'triangle');
      i++;
    };
    this.music = setInterval(tick, step * 1000);
  },
  stopMusic() { clearInterval(this.music); this.music = null; this.musicKind = ''; },
  // música da abertura (arquivo mp3, tocando em loop com entrada e saída suaves)
  intro: null,
  playIntro() {
    if (!this.on) return;
    try {
      if (!this.intro) { this.intro = new window.Audio('audio/intro.mp3'); this.intro.loop = true; }
      const a = this.intro; clearInterval(a._f); a.volume = 0; const pr = a.play(); if (pr && pr.catch) pr.catch(() => {});
      a._f = setInterval(() => { a.volume = Math.min(0.55, a.volume + 0.03); if (a.volume >= 0.55) clearInterval(a._f); }, 60);
    } catch (e) {}
  },
  stopIntro() { const a = this.intro; if (!a) return; clearInterval(a._f); a._f = setInterval(() => { a.volume = Math.max(0, a.volume - 0.05); if (a.volume <= 0) { clearInterval(a._f); a.pause(); } }, 50); },
  setOn(v) { this.on = v; const k = this.musicKind; this.stopMusic(); if (v && k) this.playMusic(k); if (!v && this.intro) { this.intro.pause(); } }
};
