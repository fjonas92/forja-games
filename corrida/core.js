/* Corrida dos Herois: nucleo (pista de 3 faixas, obstaculos, poderes). Sem graficos, testavel em node. */
(function (root) {
  var LANE = 2.2, G = -38, JV = 12.2, SLIDE_T = 0.72;
  var CHARS = {
    laylla: { nome: 'Laylla', hp: 2, dj: true, special: 'ima', cost: 22 },
    palito: { nome: 'Palito Trovão', hp: 2, dj: false, special: 'raio', cost: 28 },
    bela: { nome: 'Super Bela', hp: 2, dj: false, special: 'coracoes', cost: 28, shield0: true },
    cabecao: { nome: 'Super Cabeção', hp: 3, dj: false, special: 'cabecada', cost: 26 }
  };
  var STAGES = ['Star City', 'Floresta Encantada', 'Montanha Gelada', 'Deserto Dourado', 'Cidade Neon'];
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function Run(opts) {
    opts = opts || {}; this.ch = CHARS[opts.char] || CHARS.laylla; this.rnd = rng(opts.seed || ((Math.random() * 1e9) | 0));
    this.d = 0; this.lane = 1; this.x = 0; this.y = 0; this.vy = 0; this.ground = true; this.slideT = 0; this.usedDJ = false;
    this.hp = this.ch.hp; this.maxHp = this.ch.hp; this.grace = 0; this.noHit = 0; this.shield = !!this.ch.shield0;
    this.coins = 0; this.score = 0; this.speed = 14; this.mag = 0; this.x2 = 0; this.smash = 0; this.bolt = 0; this.meter = 0; this.stage = 0; this.dead = false; this.time = 0;
    this.items = []; this.nextD = 45; this.openLane = 1; this.events = []; this.stageEnd = false; this.pending = { l: 0, r: 0, j: false, s: false, sp: false };
    this.fill(160);
  }
  Run.prototype.add = function (o) { o.got = false; o.d1 = o.d1 === undefined ? o.d0 + 1 : o.d1; this.items.push(o); return o; };
  Run.prototype.fill = function (ahead) { while (this.nextD < this.d + ahead) this.genRow(); };
  Run.prototype.pickOpen = function (near) { var o = this.openLane; var c = [o]; if (o > 0) c.push(o - 1); if (o < 2) c.push(o + 1); if (!near) { for (var i = 0; i < 3; i++) if (c.indexOf(i) < 0) c.push(i); } return c[Math.floor(this.rnd() * c.length)]; };
  Run.prototype.genRow = function () {
    var r = this.rnd, df = Math.min(1, this.d / 3500), d0 = this.nextD, sp = Math.max(17, this.speed * 1.3), p = r(), i, L;
    var open = this.pickOpen(true), lanes = [0, 1, 2];
    var coinLine = (lane, n, y) => { for (var k = 0; k < n; k++) this.add({ t: 'coin', lane: lane, d0: d0 + k * 2.2, d1: d0 + k * 2.2 + 0.8, ya: y || 0.9, yb: (y || 0.9) + 0.6 }); };
    if (this.d < 40 && d0 < 80) { coinLine(1, 6); this.nextD += sp; return; }
    if (p < 0.2) { coinLine(Math.floor(r() * 3), 5 + Math.floor(r() * 4)); this.nextD += sp + 12; }
    else if (p < 0.38 + df * 0.04) { // barreiras baixas (pular)
      var n = 1 + Math.floor(r() * (2 + df)); var ls = lanes.slice().sort(() => r() - 0.5).slice(0, Math.min(3, n));
      ls.forEach(l => this.add({ t: 'low', lane: l, d0: d0, d1: d0 + 1.2, ya: 0, yb: 0.95 }));
      var cl = ls[0]; for (i = 0; i < 3; i++) this.add({ t: 'coin', lane: cl, d0: d0 - 2.5 + i * 2.5, d1: d0 - 1.7 + i * 2.5, ya: 1.5 + (i === 1 ? 0.6 : 0), yb: 2.1 + (i === 1 ? 0.6 : 0) });
      this.nextD += sp;
    } else if (p < 0.55) { // portal alto (deslizar)
      var nn = 1 + Math.floor(r() * 3), ls2 = lanes.slice().sort(() => r() - 0.5).slice(0, nn);
      ls2.forEach(l => this.add({ t: 'high', lane: l, d0: d0, d1: d0 + 1.2, ya: 1.15, yb: 3 }));
      this.nextD += sp;
    } else if (p < 0.82 + df * 0.05) { // blocos: deixa uma faixa aberta
      var nb = Math.min(2, 1 + (r() < 0.4 + df * 0.4 ? 1 : 0)), blk = lanes.filter(l => l !== open).slice(0, nb);
      var long = r() < 0.25, len = long ? 9 + Math.floor(r() * 5) : 1.8;
      blk.forEach(l => this.add({ t: long ? 'long' : 'block', lane: l, d0: d0, d1: d0 + len, ya: 0, yb: 2.4 }));
      this.openLane = open; coinLine(open, 4); this.nextD += sp + (long ? len : 0);
    } else { // misto: bloco + barreira baixa + faixa aberta
      var o2 = open, others = lanes.filter(l => l !== o2); this.openLane = o2;
      this.add({ t: 'block', lane: others[0], d0: d0, d1: d0 + 1.8, ya: 0, yb: 2.4 });
      this.add({ t: 'low', lane: others[1], d0: d0 + 4, d1: d0 + 5.2, ya: 0, yb: 0.95 });
      this.add({ t: 'high', lane: o2, d0: d0 + 7, d1: d0 + 8.2, ya: 1.15, yb: 3 });
      this.nextD += sp + 8;
    }
    if (r() < 0.07 + df * 0.02) { var k = ['mag', 'shield', 'x2'][Math.floor(r() * 3)]; this.add({ t: k, lane: this.openLane, d0: d0 + sp * 0.5, d1: d0 + sp * 0.5 + 1, ya: 0.8, yb: 1.6 }); }
  };

  Run.prototype.input = function (k) { if (k === 'left') this.pending.l++; else if (k === 'right') this.pending.r++; else if (k === 'jump') this.pending.j = true; else if (k === 'slide') this.pending.s = true; else if (k === 'special') this.pending.sp = true; };
  Run.prototype.special = function () {
    if (this.meter < 1 || this.dead) return; this.meter = 0; var s = this.ch.special; this.events.push({ t: 'special', k: s });
    if (s === 'ima') this.mag = 9; else if (s === 'raio') this.bolt = 3.2; else if (s === 'cabecada') this.smash = 4.5;
    else if (s === 'coracoes') { var self = this; this.items.forEach(function (it) { if (!it.got && it.t !== 'coin' && it.t !== 'mag' && it.t !== 'shield' && it.t !== 'x2' && it.d0 > self.d && it.d0 < self.d + 50) { it.got = true; self.events.push({ t: 'boom', lane: it.lane, d: it.d0, y: (it.ya + it.yb) / 2 }); } }); }
  };
  Run.prototype.step = function (dt) {
    if (this.dead) return; this.events.length = 0; var P = this.pending, i, it; this.time += dt;
    if (P.l && this.lane > 0) { this.lane--; this.events.push({ t: 'lane' }); } if (P.r && this.lane < 2) { this.lane++; this.events.push({ t: 'lane' }); }
    if (P.j) { if (this.ground) { this.vy = JV; this.ground = false; this.slideT = 0; this.events.push({ t: 'jump' }); } else if (this.ch.dj && !this.usedDJ) { this.vy = JV * 0.92; this.usedDJ = true; this.events.push({ t: 'jump2' }); } }
    if (P.s) { if (this.ground) { this.slideT = SLIDE_T; this.events.push({ t: 'slide' }); } else this.vy = Math.min(this.vy, -20); }
    if (P.sp) this.special(); this.pending = { l: 0, r: 0, j: false, s: false, sp: false };
    this.speed = (14 + 17 * (1 - Math.exp(-this.d / 3000))) * (this.bolt > 0 ? 1.5 : 1);
    var dd = this.speed * dt; this.d += dd;
    this.score += dd * (this.x2 > 0 ? 2 : 1);
    var tx = (this.lane - 1) * LANE, mv = 16 * dt; this.x += Math.max(-mv, Math.min(mv, tx - this.x));
    if (!this.ground) { this.vy += G * dt; this.y += this.vy * dt; if (this.y <= 0) { this.y = 0; this.vy = 0; this.ground = true; this.usedDJ = false; this.events.push({ t: 'land' }); } }
    this.slideT = Math.max(0, this.slideT - dt); this.grace = Math.max(0, this.grace - dt); this.mag = Math.max(0, this.mag - dt); this.x2 = Math.max(0, this.x2 - dt); this.smash = Math.max(0, this.smash - dt); this.bolt = Math.max(0, this.bolt - dt);
    this.noHit += dt; if (this.noHit > 14 && this.hp < this.maxHp) { this.hp++; this.noHit = 0; this.events.push({ t: 'heal' }); }
    var h = this.slideT > 0 && this.ground ? 0.75 : 1.8, inv = this.grace > 0 || this.bolt > 0;
    for (i = 0; i < this.items.length; i++) {
      it = this.items[i]; if (it.got) continue; if (it.d1 < this.d - 1.2 || it.d0 > this.d + 1.0) { if (it.t === 'coin' && this.mag > 0 && it.d0 > this.d && it.d0 < this.d + 9) { } else continue; }
      var dx = Math.abs(this.x - (it.lane - 1) * LANE), isPick = it.t === 'coin' || it.t === 'mag' || it.t === 'shield' || it.t === 'x2';
      if (isPick) {
        var near = dx < 1.1 && it.d0 < this.d + 0.9 && it.d1 > this.d - 0.9 && this.y < it.yb && this.y + h > it.ya;
        if (it.t === 'coin' && this.mag > 0 && it.d0 > this.d - 1 && it.d0 < this.d + 9) near = true;
        if (near) { it.got = true; if (it.t === 'coin') { this.coins++; this.score += 5 * (this.x2 > 0 ? 2 : 1); this.meter = Math.min(1, this.meter + 1 / this.ch.cost); this.events.push({ t: 'coin' }); } else { if (it.t === 'mag') this.mag = 9; else if (it.t === 'x2') this.x2 = 12; else this.shield = true; this.events.push({ t: 'power', k: it.t }); } }
      } else {
        if (dx < 1.25 && it.d0 < this.d + 0.6 && it.d1 > this.d - 0.6 && this.y < it.yb && this.y + h > it.ya) {
          if (this.smash > 0 || this.bolt > 0) { it.got = true; this.events.push({ t: 'smash', lane: it.lane, d: it.d0 }); }
          else if (!inv) { it.got = true; this.noHit = 0; if (this.shield) { this.shield = false; this.grace = 1.2; this.events.push({ t: 'shieldbreak' }); } else { this.hp--; this.grace = 1.5; this.events.push({ t: 'hit' }); if (this.hp <= 0) { this.dead = true; this.events.push({ t: 'dead' }); } } }
        }
      }
    }
    var st = Math.floor(this.d / 1000); if (st !== this.stage) { this.stage = st; this.events.push({ t: 'stage', n: st }); }
    if (this.items.length > 80) this.items = this.items.filter(function (x) { return x.d1 > this.d - 15; }, this);
    this.fill(170);
  };
  root.Run = { Run: Run, CHARS: CHARS, STAGES: STAGES, LANE: LANE, SLIDE_T: SLIDE_T };
})(typeof window !== 'undefined' ? window : globalThis);
