/* Motor do Imperio da Fazenda 3D (sem graficos): fazenda ociosa com canteiros, animais, melhorias e ganho offline. */
(function (root) {
  var CROPS = [
    { id: 'trigo', nome: 'Trigo', cost: 4, time: 6, gain: 7, unlock: 0, col: 0xe8c547 },
    { id: 'milho', nome: 'Milho', cost: 30, time: 12, gain: 48, unlock: 400, col: 0xffd23c },
    { id: 'tomate', nome: 'Tomate', cost: 160, time: 22, gain: 250, unlock: 3500, col: 0xef4036 },
    { id: 'cenoura', nome: 'Cenoura', cost: 900, time: 38, gain: 1400, unlock: 28000, col: 0xff8a1f },
    { id: 'morango', nome: 'Morango', cost: 5200, time: 60, gain: 8000, unlock: 220000, col: 0xff3d6e },
    { id: 'abobora', nome: 'Abóbora', cost: 30000, time: 95, gain: 46000, unlock: 1700000, col: 0xff9a2e },
    { id: 'estrela', nome: 'Planta Mágica', cost: 180000, time: 150, gain: 280000, unlock: 13000000, col: 0xb06bff }
  ];
  var ANIMALS = [
    { id: 'galinha', nome: 'Galinha', cost: 150, inc: 0.5 }, { id: 'vaca', nome: 'Vaca', cost: 2200, inc: 5 },
    { id: 'ovelha', nome: 'Ovelha', cost: 30000, inc: 40 }, { id: 'porco', nome: 'Porco', cost: 400000, inc: 300 }
  ];
  var PLOT_COST = [0, 0, 90, 450, 2200, 11000, 55000, 270000, 1300000, 6500000, 32000000, 160000000];
  var NP = PLOT_COST.length, MAXANI = 8, OFFLINE_MAX = 8 * 3600;

  function Farm(opts) {
    opts = opts || {}; this.rnd = opts.rnd || Math.random;
    this.money = 20; this.total = 20; this.sel = 0; this.owned = [true, false, false, false, false, false, false]; this.plots = [];
    for (var i = 0; i < NP; i++) this.plots.push({ on: i < 2, crop: -1, prog: 0, auto: false });
    this.ani = [0, 0, 0, 0]; this.fert = 0; this.tractor = 0; this.rainT = 0; this.rainCd = 0; this.fesT = 0; this.fesCd = 0; this.t = 0; this.ev = []; this.ach = {}; this.pend = 0; this.nAuto = 0; this.accum = 0; this.taps = 0;
  }
  Farm.CROPS = CROPS; Farm.ANIMALS = ANIMALS; Farm.PLOT_COST = PLOT_COST; Farm.NP = NP; Farm.MAXANI = MAXANI;
  var P = Farm.prototype;
  P.mult = function () { return (1 + 0.25 * this.fert) * (this.fesT > 0 ? 2 : 1); };
  P.speed = function () { return (1 + 0.2 * this.tractor) * (this.rainT > 0 ? 2 : 1); };
  P.gainOf = function (ci) { return CROPS[ci].gain * this.mult(); };
  P.aniCost = function (k) { return Math.ceil(ANIMALS[k].cost * Math.pow(1.22, this.ani[k])); };
  P.aniInc = function () { var s = 0; for (var k = 0; k < 4; k++) s += this.ani[k] * ANIMALS[k].inc; return s * this.mult(); };
  P.fertCost = function () { return Math.ceil(900 * Math.pow(3.8, this.fert)); };
  P.tractorCost = function () { return Math.ceil(2000 * Math.pow(4.2, this.tractor)); };
  P.autoCost = function () { return Math.ceil(500 * Math.pow(3.6, this.nAuto)); };
  P.cropIncome = function () { var s = 0; for (var i = 0; i < NP; i++) { var p = this.plots[i]; if (p.on && p.auto && p.crop >= 0) s += (CROPS[p.crop].gain - CROPS[p.crop].cost) * this.mult() / (CROPS[p.crop].time / this.speed()); } return s; };
  P.income = function () { return this.aniInc() + this.cropIncome(); };
  P.add = function (v) { this.money += v; this.total += v; this.accum += v; };
  P.achieve = function (k, pts) { if (!this.ach[k]) { this.ach[k] = 1; this.pend += pts; this.ev.push({ t: 'ach', k: k, pts: pts }); } };
  P.plant = function (i, ci) {
    var p = this.plots[i]; ci = ci === undefined ? this.sel : ci; if (!p || !p.on || p.crop >= 0 && p.prog < 1 && p.crop >= 0 && p.prog > 0 || !this.owned[ci]) return false;
    if (p.crop >= 0) return false; var c = CROPS[ci]; if (this.money < c.cost) return false; this.money -= c.cost; p.crop = ci; p.prog = 0.0001; this.ev.push({ t: 'plant', i: i }); return true;
  };
  P.reap = function (i) {
    var p = this.plots[i]; if (!p || !p.on || p.crop < 0 || p.prog < 1) return 0; var g = this.gainOf(p.crop), ci = p.crop; this.add(g); p.crop = -1; p.prog = 0; this.ev.push({ t: 'reap', i: i, v: g });
    if (ci >= 1) this.achieve('c' + ci, 5); return g;
  };
  P.tap = function (i) {
    var p = this.plots[i]; if (!p) return 'none'; if (!p.on) return this.buyPlot(i) ? 'buy' : 'poor';
    if (p.crop < 0) return this.plant(i) ? 'plant' : (this.money < CROPS[this.sel].cost ? 'poor' : 'none');
    if (p.prog >= 1) { this.reap(i); return 'reap'; }
    p.prog = Math.min(1, p.prog + 0.02); this.taps++; return 'grow';
  };
  P.buyPlot = function (i) { var p = this.plots[i]; if (!p || p.on || i === 0 || this.plots[i - 1] && !this.plots[i - 1].on || this.money < PLOT_COST[i]) return false; this.money -= PLOT_COST[i]; p.on = true; this.ev.push({ t: 'plot', i: i }); this.achieve('p' + i, 6); return true; };
  P.unlockCrop = function (ci) { var c = CROPS[ci]; if (this.owned[ci] || this.money < c.unlock || !this.owned[ci - 1]) return false; this.money -= c.unlock; this.owned[ci] = true; this.sel = ci; this.ev.push({ t: 'crop', ci: ci }); this.achieve('u' + ci, 8); return true; };
  P.buyAnimal = function (k) { if (this.ani[k] >= MAXANI) return false; var c = this.aniCost(k); if (this.money < c) return false; this.money -= c; this.ani[k]++; this.ev.push({ t: 'animal', k: k }); this.achieve('a' + k, 6); if (this.ani[k] === MAXANI) this.achieve('am' + k, 10); return true; };
  P.buyFert = function () { var c = this.fertCost(); if (this.fert >= 12 || this.money < c) return false; this.money -= c; this.fert++; this.ev.push({ t: 'up' }); this.achieve('f' + this.fert, 3); return true; };
  P.buyTractor = function () { var c = this.tractorCost(); if (this.tractor >= 12 || this.money < c) return false; this.money -= c; this.tractor++; this.ev.push({ t: 'up' }); this.achieve('t' + this.tractor, 3); return true; };
  P.buyAuto = function () {
    var c = this.autoCost(), i; for (i = 0; i < NP; i++) if (this.plots[i].on && !this.plots[i].auto) break; if (i >= NP || this.money < c) return false;
    this.money -= c; this.plots[i].auto = true; this.nAuto++; if (this.plots[i].crop < 0) this.plots[i].crop = this.sel; this.ev.push({ t: 'auto', i: i }); this.achieve('r' + this.nAuto, 5); return true;
  };
  P.rain = function () { if (this.rainCd > 0) return false; this.rainT = 30; this.rainCd = 90; this.ev.push({ t: 'rain' }); return true; };
  P.festival = function () { if (this.fesCd > 0) return false; this.fesT = 40; this.fesCd = 150; this.ev.push({ t: 'fest' }); return true; };
  P.step = function (dt) {
    this.t += dt; this.rainT = Math.max(0, this.rainT - dt); this.rainCd = Math.max(0, this.rainCd - dt); this.fesT = Math.max(0, this.fesT - dt); this.fesCd = Math.max(0, this.fesCd - dt);
    var sp = this.speed(), i, p, c;
    for (i = 0; i < NP; i++) {
      p = this.plots[i]; if (!p.on) continue;
      if (p.crop >= 0 && p.prog < 1) { c = CROPS[p.crop]; p.prog = Math.min(1, p.prog + dt * sp / c.time); if (p.prog >= 1) this.ev.push({ t: 'ready', i: i }); }
      if (p.auto) { if (p.crop >= 0 && p.prog >= 1) { this.reap(i); p.crop = p.crop; } if (p.crop < 0) { var ci = this.owned[this.sel] ? this.sel : 0; if (this.money >= CROPS[ci].cost) { this.money -= CROPS[ci].cost; p.crop = ci; p.prog = 0.0001; } } }
    }
    var a = this.aniInc() * dt; if (a > 0) this.add(a);
  };
  P.offline = function (sec) {
    sec = Math.max(0, Math.min(OFFLINE_MAX, sec)); if (sec < 30) return 0; var g = this.aniInc() * sec + this.cropIncome() * sec * 0.6;
    if (g > 0) this.add(g); for (var i = 0; i < NP; i++) { var p = this.plots[i]; if (p.on && p.crop >= 0 && p.prog > 0) p.prog = Math.min(1, p.prog + sec * this.speed() / CROPS[p.crop].time); } return g;
  };
  P.save = function () { return { m: this.money, tt: this.total, sel: this.sel, ow: this.owned.slice(), pl: this.plots.map(function (p) { return { on: p.on, crop: p.crop, prog: p.prog, auto: p.auto }; }), an: this.ani.slice(), f: this.fert, tr: this.tractor, rc: this.rainCd, fc: this.fesCd, ach: this.ach, pend: this.pend, na: this.nAuto, ts: Date.now() }; };
  P.load = function (d) {
    try {
      this.money = +d.m; this.total = +d.tt; this.sel = d.sel | 0; this.owned = d.ow.slice(); this.plots = d.pl.map(function (p) { return { on: !!p.on, crop: p.crop | 0, prog: +p.prog || 0, auto: !!p.auto }; });
      while (this.plots.length < NP) this.plots.push({ on: false, crop: -1, prog: 0, auto: false });
      this.ani = d.an.slice(); this.fert = d.f | 0; this.tractor = d.tr | 0; this.rainCd = +d.rc || 0; this.fesCd = +d.fc || 0; this.ach = d.ach || {}; this.pend = d.pend | 0; this.nAuto = d.na | 0;
      if (!isFinite(this.money) || !isFinite(this.total)) return false; return d.ts ? (Date.now() - d.ts) / 1000 : 0;
    } catch (e) { return false; }
  };
  root.Farm = Farm;
})(typeof window !== 'undefined' ? window : globalThis);
