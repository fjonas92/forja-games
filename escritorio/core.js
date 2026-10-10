/* Motor do Meu Escritorio 3D (sem graficos): visitantes, recepcao, sujeira, funcionarios, incendios, alugueis e expansoes. */
(function (root) {
  var LV = [0, 8, 25, 60, 120, 220, 400, 700, 1100];
  var PADS = [
    { id: 'cad1', n: 'Mais 2 cadeiras', cost: 40, lv: 1, req: null },
    { id: 'rec1', n: 'Recepcionista', cost: 150, lv: 1, req: 'cad1' },
    { id: 'reu1', n: 'Sala de reunião 2', cost: 260, lv: 1, req: null },
    { id: 'lim1', n: 'Faxineiro', cost: 400, lv: 2, req: 'rec1' },
    { id: 'cad2', n: 'Mais 2 cadeiras', cost: 700, lv: 2, req: 'cad1' },
    { id: 'ala_e', n: 'Ala Leste', cost: 1200, lv: 2, req: null },
    { id: 'alu1', n: 'Alugar sala A', cost: 2000, lv: 3, req: 'ala_e' },
    { id: 'rec2', n: 'Recepcionista 2', cost: 2800, lv: 3, req: 'rec1' },
    { id: 'reu2', n: 'Sala de reunião 3', cost: 3600, lv: 3, req: 'reu1' },
    { id: 'lim2', n: 'Faxineiro 2', cost: 4500, lv: 4, req: 'lim1' },
    { id: 'ala_o', n: 'Ala Oeste', cost: 7000, lv: 4, req: 'ala_e' },
    { id: 'alu2', n: 'Alugar sala B', cost: 11000, lv: 5, req: 'alu1' },
    { id: 'cad3', n: 'Mais 2 cadeiras', cost: 15000, lv: 5, req: 'cad2' },
    { id: 'reu3', n: 'Sala de reunião 4', cost: 20000, lv: 5, req: 'reu2' },
    { id: 'alu3', n: 'Alugar sala C', cost: 28000, lv: 6, req: 'ala_o' },
    { id: 'alu4', n: 'Alugar sala D', cost: 70000, lv: 7, req: 'alu3' }
  ];
  var RENT = { alu1: 4, alu2: 12, alu3: 30, alu4: 80 };
  var CHAIRS = [[3, 3.2], [5, 3.2], [3, 1.4], [5, 1.4], [7, 3.2], [7, 1.4], [2, 4.4], [6, 4.4]];
  var QUEUE = [[-3, 1.4], [-3, 2.5], [-3, 3.6]];
  var SEATS = [[2, -3.1], [5.4, -3.1], [-0.8, -3.1], [7.2, -3.1]];
  var DESK = [-3, 0.5], STAFF = [-3, -1.9], DOOR = [0, 5.4], OUT = [0, 8.5];
  var RECTS = {
    lobby: [-7.8, 7.8, -5.2, 5.4], door_e: [7.6, 9.4, -1.3, 1.3], east: [9.2, 24.2, -5.2, 5.4], door_w: [-9.4, -7.6, -1.3, 1.3], west: [-24.2, -9.2, -5.2, 5.4]
  };
  function Office(opts) {
    opts = opts || {}; this.rnd = opts.rnd || Math.random;
    this.money = 30; this.stars = 0; this.p = { x: -3, z: -3.2 }; this.mv = { x: 0, z: 0 }; this.bought = {}; this.paid = {}; this.vis = []; this.mess = []; this.fire = null; this.cleaners = []; this.nid = 1;
    this.t = 0; this.spawnT = 3; this.fireT = 80; this.serveP = 0; this.serving = null; this.ev = []; this.earned = 0; this.starsGained = 0; this.pend = 0; this.served = 0; this.lost = 0; this.wasteT = 0;
  }
  Office.PADS = PADS; Office.LV = LV; Office.RENT = RENT; Office.CHAIRS = CHAIRS; Office.SEATS = SEATS; Office.DESK = DESK; Office.STAFF = STAFF; Office.DOOR = DOOR; Office.OUT = OUT; Office.QUEUE = QUEUE; Office.RECTS = RECTS;
  var P = Office.prototype;
  P.has = function (id) { return !!this.bought[id]; };
  P.level = function () { var l = 1; for (var i = 1; i < LV.length; i++) if (this.stars >= LV[i]) l = i + 1; return l; };
  P.nChairs = function () { return 2 + 2 * (this.has('cad1') + this.has('cad2') + this.has('cad3')); };
  P.nSeats = function () { return 1 + this.has('reu1') + this.has('reu2') + this.has('reu3'); };
  P.nRecep = function () { return this.has('rec1') + this.has('rec2'); };
  P.rent = function () { var s = 0; for (var k in RENT) if (this.bought[k]) s += RENT[k]; return s * (1 + 0.1 * (this.level() - 1)); };
  P.pay = function () { return 6 + 4 * this.level(); };
  P.avail = function (pd) { return (!pd.req || this.bought[pd.req]) && !this.bought[pd.id]; };
  P.visiblePads = function () { var a = []; for (var i = 0; i < PADS.length && a.length < 4; i++) if (this.avail(PADS[i])) a.push(PADS[i]); return a; };
  P.inside = function (x, z) { var k, r; for (k in RECTS) { if (k === 'east' && !this.has('ala_e') || k === 'door_e' && !this.has('ala_e')) continue; if (k === 'west' && !this.has('ala_o') || k === 'door_w' && !this.has('ala_o')) continue; r = RECTS[k]; if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return true; } return false; };
  P.rooms = function () { var a = ['lobby']; if (this.has('ala_e')) a.push('east'); if (this.has('ala_o')) a.push('west'); return a; };
  P.input = function (x, z) { var l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; } this.mv.x = x; this.mv.z = z; };
  P.addStar = function (n) { var l0 = this.level(); this.stars += n; this.starsGained += n; this.pend += n / 5; if (this.level() > l0) this.ev.push({ t: 'level', lv: this.level() }); this.ev.push({ t: 'star', n: n }); };
  P.freeChair = function () { var used = {}; this.vis.forEach(function (v) { if (v.chair >= 0) used[v.chair] = 1; }); for (var i = 0; i < this.nChairs(); i++) if (!used[i]) return i; return -1; };
  P.freeQueue = function () { var used = {}; this.vis.forEach(function (v) { if (v.q >= 0) used[v.q] = 1; }); for (var i = 0; i < QUEUE.length; i++) if (!used[i]) return i; return -1; };
  P.freeSeat = function () { var used = {}; this.vis.forEach(function (v) { if (v.seat >= 0) used[v.seat] = 1; }); for (var i = 0; i < this.nSeats(); i++) if (!used[i]) return i; return -1; };
  P.spawn = function () {
    var c = this.freeChair(), q = c < 0 ? this.freeQueue() : -1; if (c < 0 && q < 0) return false;
    var v = { id: this.nid++, x: OUT[0] + (this.rnd() - 0.5) * 2, z: OUT[1], st: 'enter', chair: c, q: q, seat: -1, pat: 55, prog: 0, tm: 0, look: Math.floor(this.rnd() * 6), tx: 0, tz: 0, served: false };
    this.setTarget(v); this.vis.push(v); return true;
  };
  P.setTarget = function (v) {
    if (v.st === 'enter') { v.tx = DOOR[0]; v.tz = DOOR[1] - 0.6; }
    else if (v.st === 'wait') { var s = v.chair >= 0 ? CHAIRS[v.chair] : QUEUE[v.q]; v.tx = s[0]; v.tz = s[1]; }
    else if (v.st === 'desk') { v.tx = DESK[0]; v.tz = DESK[1]; }
    else if (v.st === 'go' || v.st === 'meet') { var m = SEATS[v.seat]; v.tx = m[0]; v.tz = m[1] + 0.9; }
    else { v.tx = DOOR[0]; v.tz = DOOR[1]; }
  };
  P.moveV = function (v, dt) {
    var dx = v.tx - v.x, dz = v.tz - v.z, d = Math.hypot(dx, dz), sp = 2.4 * dt; if (d <= sp) { v.x = v.tx; v.z = v.tz; return true; } v.x += dx / d * sp; v.z += dz / d * sp; return false;
  };
  P.leave = function (v, angry) { v.st = angry ? 'angry' : 'leave'; v.chair = -1; v.q = -1; if (v.seat >= 0) { v.seat = -1; } this.setTarget(v); if (this.serving === v) { this.serving = null; this.serveP = 0; } };
  P.step = function (dt) {
    var i, v; this.t += dt;
    // jogador
    var sp = 5.6 * dt, nx = this.p.x + this.mv.x * sp, nz = this.p.z + this.mv.z * sp;
    if (this.inside(nx, nz)) { this.p.x = nx; this.p.z = nz; } else if (this.inside(nx, this.p.z)) this.p.x = nx; else if (this.inside(this.p.x, nz)) this.p.z = nz;
    // visitantes
    this.spawnT -= dt; if (this.spawnT <= 0) { var iv = Math.max(2.4, 7.5 - this.level() * 0.55); this.spawnT = iv * (0.8 + this.rnd() * 0.4); if (!this.fire || this.fire.t > 0) this.spawn(); }
    var messMul = this.mess.length > 8 ? 2.2 : 1;
    var atDesk = Math.hypot(this.p.x - STAFF[0], this.p.z - STAFF[1]) < 1.7;
    var rate = (atDesk ? 1.6 : 0) + this.nRecep();
    if (!this.serving) {
      var cand = null; this.vis.forEach(function (w) { if (w.st === 'wait' && w.arr && !w.served && (!cand || w.pat < cand.pat)) cand = w; });
      if (cand && this.freeSeat() >= 0 && rate > 0) { cand.seat = this.freeSeat(); cand.st = 'desk'; cand.chair = -1; cand.q = -1; this.setTarget(cand); this.serving = cand; this.serveP = 0; }
    }
    for (i = this.vis.length - 1; i >= 0; i--) {
      v = this.vis[i];
      if (v.st === 'enter') { if (this.moveV(v, dt)) { v.st = 'wait'; v.arr = false; this.setTarget(v); } }
      else if (v.st === 'wait') { if (!v.arr) { if (this.moveV(v, dt)) v.arr = true; } v.pat -= dt * messMul * (this.fire ? 1.5 : 1); if (v.pat <= 0) { this.lost++; this.ev.push({ t: 'angry', id: v.id }); this.leave(v, true); } }
      else if (v.st === 'desk') {
        if (!v.arr) { if (this.moveV(v, dt)) { v.arr = true; } }
        else if (this.serving === v && rate > 0) { this.serveP += rate * dt / 3; if (this.serveP >= 1) { this.serving = null; this.serveP = 0; v.st = 'go'; v.arr = false; this.setTarget(v); this.served++; this.ev.push({ t: 'served', id: v.id }); } }
      }
      else if (v.st === 'go') { if (this.moveV(v, dt)) { v.st = 'meet'; v.tm = 9 + this.rnd() * 3; } }
      else if (v.st === 'meet') { v.tm -= dt; if (v.tm <= 0) { var g = this.pay(); this.money += g; this.earned += g; this.addStar(1); this.ev.push({ t: 'pay', v: g, x: v.x, z: v.z }); if (this.rnd() < 0.5) { this.mess.push({ id: this.nid++, x: SEATS[v.seat][0] + (this.rnd() - 0.5) * 1.6, z: SEATS[v.seat][1] + 1.6 + this.rnd() * 1.5, k: Math.floor(this.rnd() * 3) }); } v.seat = -1; v.st = 'leave'; this.setTarget(v); } }
      else if (v.st === 'leave' || v.st === 'angry') { if (v.tz === DOOR[1] && Math.abs(v.tx - DOOR[0]) < 1e-6 && v.z !== OUT[1]) { if (this.moveV(v, dt)) { v.tx = OUT[0]; v.tz = OUT[1]; } } else if (this.moveV(v, dt)) this.vis.splice(i, 1); }
    }
    // lixo
    for (i = this.mess.length - 1; i >= 0; i--) { var m = this.mess[i]; if (Math.hypot(this.p.x - m.x, this.p.z - m.z) < 1.0) { this.mess.splice(i, 1); this.money += 2; this.ev.push({ t: 'clean', x: m.x, z: m.z }); } }
    // faxineiros
    while (this.cleaners.length < this.has('lim1') + this.has('lim2')) this.cleaners.push({ x: STAFF[0] + 1, z: STAFF[1], tgt: null });
    var self = this; this.cleaners.forEach(function (c) {
      if (!c.tgt || self.mess.indexOf(c.tgt) < 0) { c.tgt = null; var bd = 1e9; self.mess.forEach(function (mm) { var taken = self.cleaners.some(function (o) { return o !== c && o.tgt === mm; }); var d = Math.hypot(mm.x - c.x, mm.z - c.z); if (!taken && d < bd) { bd = d; c.tgt = mm; } }); }
      if (c.tgt) { var dx = c.tgt.x - c.x, dz = c.tgt.z - c.z, d = Math.hypot(dx, dz); if (d < 0.5) { self.mess.splice(self.mess.indexOf(c.tgt), 1); self.money += 2; self.ev.push({ t: 'clean', x: c.tgt.x, z: c.tgt.z }); c.tgt = null; } else { c.x += dx / d * 3.2 * dt; c.z += dz / d * 3.2 * dt; } }
      else { var hx = STAFF[0] + 1 - c.x, hz = STAFF[1] - c.z, hd = Math.hypot(hx, hz); if (hd > 0.1) { c.x += hx / hd * 2 * dt; c.z += hz / hd * 2 * dt; } }
    });
    // incendio
    if (this.level() >= 2) {
      if (!this.fire) { this.fireT -= dt; if (this.fireT <= 0) { var rr = this.rooms(), rk = RECTS[rr[Math.floor(this.rnd() * rr.length)]]; this.fire = { x: rk[0] + 1.5 + this.rnd() * (rk[1] - rk[0] - 3), z: rk[2] + 1.2 + this.rnd() * (rk[3] - rk[2] - 3), t: 28, prog: 0 }; this.ev.push({ t: 'fire' }); } }
      else { var f = this.fire; f.t -= dt; if (Math.hypot(this.p.x - f.x, this.p.z - f.z) < 1.8) f.prog += dt / 2.4; else f.prog = Math.max(0, f.prog - dt * 0.3);
        if (f.prog >= 1) { this.fire = null; this.fireT = 70 + this.rnd() * 40; var b = 20 * this.level(); this.money += b; this.addStar(3); this.ev.push({ t: 'fireout', v: b }); }
        else if (f.t <= 0) { var loss = Math.floor(this.money * 0.12); this.money -= loss; this.fire = null; this.fireT = 70 + this.rnd() * 40; this.vis.forEach(function (w) { w.pat -= 12; }); this.ev.push({ t: 'firelost', v: loss }); } }
    }
    // aluguel
    var rr2 = this.rent() * dt; if (rr2 > 0) { this.money += rr2; this.earned += rr2; }
    // pads
    var vp = this.visiblePads(), lvl = this.level();
    for (i = 0; i < vp.length; i++) { var pd = vp[i], px = padPos(i); if (lvl < pd.lv) continue; if (Math.hypot(this.p.x - px[0], this.p.z - px[1]) < 1.15 && this.money > 0) {
      var paid = this.paid[pd.id] || 0, amt = Math.min(this.money, Math.max(25, pd.cost / 1.4) * dt, pd.cost - paid); this.money -= amt; this.paid[pd.id] = paid + amt; if (this.paid[pd.id] >= pd.cost - 1e-6) { this.bought[pd.id] = 1; delete this.paid[pd.id]; this.ev.push({ t: 'buy', id: pd.id }); } } }
  };
  function padPos(i) { return [-5.4 + i * 3.6, -4.35]; }
  Office.padPos = padPos;
  P.offline = function (sec) { sec = Math.max(0, Math.min(8 * 3600, sec)); if (sec < 30) return 0; var g = this.rent() * sec; this.money += g; this.earned += g; return g; };
  P.save = function () { return { m: this.money, s: this.stars, b: this.bought, pd: this.paid, pend: this.pend, ts: Date.now(), sv: this.served }; };
  P.load = function (d) { try { this.money = +d.m; this.stars = d.s | 0; this.bought = d.b || {}; this.paid = d.pd || {}; this.pend = +d.pend || 0; this.served = d.sv | 0; if (!isFinite(this.money)) return false; return d.ts ? (Date.now() - d.ts) / 1000 : 0; } catch (e) { return false; } };
  root.Office = Office;
})(typeof window !== 'undefined' ? window : globalThis);
