/* Laylla: nucleo do jogo (fisica, fases, inimigos). Sem graficos, testavel em node. */
(function (root) {
  var G = -34, JV = 12.4, JV2 = 10.5, SPEED = 7.4, PR = 0.42, PH = 1.3, DEATH = -22;

  /* ---------- construtor de fases ---------- */
  function Builder() { this.p = []; this.gems = []; this.stars = []; this.enemies = []; this.cps = []; this.h = 0; this.last = null; this.goal = null; this.start = null; this.deco = []; }
  Builder.prototype.add = function (x, y, z, r, o) { var q = { x: x, y: y, z: z, r: r, th: 3 }; if (o) for (var k in o) q[k] = o[k]; this.p.push(q); this.last = q; return q; };
  Builder.prototype.first = function (r) { this.start = { x: 0, y: 0, z: 0 }; return this.add(0, 0, 0, r); };
  Builder.prototype.isl = function (r, gap, dy, turn, o) {
    this.h += (turn || 0) * Math.PI / 180; var L = this.last, d = L.r + gap + r;
    return this.add(L.x + Math.sin(this.h) * d, L.y + (dy || 0), L.z - Math.cos(this.h) * d, r, o);
  };
  // plataforma que se move: ax 'x'|'z'|'y' (mundo), amp, spd (rad/s), ph
  Builder.prototype.side = function (q, dx, dy, dz, r) { var keep = this.last, n = this.add(q.x + dx, q.y + dy, q.z + dz, r); this.last = keep; n.side = true; return n; };
  Builder.prototype.mv = function (q, ax, amp, spd, ph) { q.mv = { ax: ax, amp: amp, spd: spd, ph: ph || 0 }; return q; };
  Builder.prototype.gemsOn = function (q, n, h, rad) { rad = rad === undefined ? q.r * 0.5 : rad; for (var i = 0; i < n; i++) { var a = i / n * 6.283; this.gems.push({ x: q.x + Math.cos(a) * rad, y: q.y + (h || 1), z: q.z + Math.sin(a) * rad, pl: q.mv ? this.p.indexOf(q) : -1 }); } };
  Builder.prototype.gemArc = function (a, b, n) { for (var i = 1; i <= n; i++) { var t = i / (n + 1); this.gems.push({ x: a.x + (b.x - a.x) * t, y: Math.max(a.y, b.y) + 1.1 + Math.sin(t * Math.PI) * 1.6, z: a.z + (b.z - a.z) * t, pl: -1 }); } };
  Builder.prototype.star = function (q, ox, oz, oy) { this.stars.push({ x: q.x + (ox || 0), y: q.y + (oy || 1.4), z: q.z + (oz || 0) }); };
  Builder.prototype.enemy = function (q, ax, amp, spd) { this.enemies.push({ x: q.x, y: q.y, z: q.z, ax: ax || 'x', amp: amp || q.r * 0.55, spd: spd || 1.1, ph: Math.random() * 6 }); };
  Builder.prototype.cp = function (q) { this.cps.push({ x: q.x, y: q.y, z: q.z }); };
  Builder.prototype.finish = function (name, sub, theme) {
    var L = this.last; this.goal = { x: L.x, y: L.y, z: L.z };
    return { name: name, sub: sub, theme: theme || 0, platforms: this.p, gems: this.gems, stars: this.stars, enemies: this.enemies, checkpoints: this.cps, goal: this.goal, start: this.start };
  };

  var LEVELS = [
    function () { // 1 Campo Brilhante
      var b = new Builder(), a = b.first(5);
      var s1 = b.isl(3, 2.2, 0.3, 0); b.gemsOn(s1, 5, 1);
      var s2 = b.isl(2.2, 2.6, 0.6, 18); b.gemsOn(s2, 3, 1, 0.8);
      var s3 = b.isl(4, 2.4, 0.4, -20); b.enemy(s3, 'x', 1.8, 1.2); b.cp(s3); b.gemsOn(s3, 6, 1);
      var s4 = b.isl(1.6, 3.2, 0.8, 10); var s5 = b.isl(1.6, 3.0, 0.8, -10); b.gemArc(s4, s5, 2);
      var s6 = b.isl(4.2, 2.6, 0.4, 22); b.enemy(s6, 'z', 2, 1.3); b.enemy(s6, 'x', 1.5, 1.7); b.gemsOn(s6, 6, 1);
      b.star(s6, 2.6, 2.0);
      var s7 = b.isl(2.4, 2.8, 1.0, -30); var s8 = b.isl(2.4, 2.8, 1.0, 10); b.star(s8, 0, 0);
      var s9 = b.isl(3.8, 2.8, 0.6, 20); b.cp(s9); b.enemy(s9, 'x', 1.7, 1.4); b.gemsOn(s9, 5, 1);
      var m1 = b.mv(b.isl(2.2, 1.7, 0, 0), 'x', 2.2, 1.1, 0);
      var s10 = b.isl(3.4, 1.7, 0, 0);
      var s11 = b.isl(2.2, 3.0, 0.8, 25); b.gemsOn(s11, 4, 1, 0.8); var s12 = b.isl(2.2, 3.0, 0.8, -25);
      var sx = b.side(s11, 3.0, -0.4, 5.5, 1.8); b.star(sx, 0, 0);
      var s13 = b.isl(5, 2.6, 0.8, -5);
      return b.finish('Campo Brilhante', 'Para aquecer: pule, colete e pise nas gelinhas.', 0);
    },
    function () { // 2 Ilhas do Ceu
      var b = new Builder(), a = b.first(4);
      var s1 = b.isl(2.6, 2.6, 0.4, 0); b.gemsOn(s1, 4, 1);
      var m1 = b.mv(b.isl(2.2, 1.8, 0, 15), 'z', 2.4, 1.0, 0);
      var s2 = b.isl(3.4, 1.8, 0.4, 0); b.cp(s2); b.enemy(s2, 'x', 1.6, 1.3); b.gemsOn(s2, 5, 1);
      var m2 = b.mv(b.isl(2.0, 1.8, 0.5, -30), 'y', 1.6, 1.0, 0);
      var s3 = b.isl(2.8, 2.0, 1.2, 0); b.gemsOn(s3, 4, 1.1, 1);
      b.star(s3, -1.5, -1.5);
      var s4 = b.isl(1.5, 3.4, 0.5, 20); var s5 = b.isl(1.5, 3.4, 0.5, 20); var s6 = b.isl(1.5, 3.4, 0.5, 20); b.gemArc(s4, s5, 2); b.gemArc(s5, s6, 2);
      var s7 = b.isl(4.2, 2.8, 0.6, 20); b.cp(s7); b.enemy(s7, 'x', 2.2, 1.6); b.enemy(s7, 'z', 2.2, 1.4); b.gemsOn(s7, 6, 1);
      var m3 = b.mv(b.isl(2.3, 1.8, 0.2, -50), 'x', 2.3, 1.2, 1);
      var m4 = b.mv(b.isl(2.3, 1.9, 0.2, 40), 'z', 2.2, 1.3, 2);
      var s8 = b.isl(3.0, 1.9, 0.4, -10); b.star(s8, 1.5, 1.5); b.enemy(s8, 'z', 1.2, 1.5);
      var sx = b.side(s8, -6, 1.2, -1.5, 1.7); b.star(sx, 0, 0);
      var s9 = b.isl(2.2, 3.0, 0.8, 30); var s10 = b.isl(2.2, 3.1, 0.9, -30); b.gemArc(s9, s10, 2);
      var s11 = b.isl(5, 2.8, 0.7, 0); b.cp(s11); b.gemsOn(s11, 6, 1);
      return b.finish('Ilhas do Céu', 'Plataformas que se mexem. Calma e timing.', 1);
    },
    function () { // 3 Espiral das Flores (subida)
      var b = new Builder(), a = b.first(4);
      var n = 14, last = a;
      for (var i = 0; i < n; i++) {
        var q = b.isl(i % 4 === 3 ? 3.4 : 2.1, 2.8, 1.25, 38, i % 5 === 4 ? {} : {});
        if (i % 4 === 3) { b.cp(q); b.enemy(q, i % 8 === 3 ? 'x' : 'z', 1.6, 1.4); b.gemsOn(q, 4, 1); } else b.gemsOn(q, 2, 1, 0.5);
        if (i === 5) b.star(q, 0, 0);
        if (i === 9) { var side = b.side(q, 4.5, 1.4, 0.5, 1.7); b.star(side, 0, 0); }
        if (i === 6 || i === 10) b.mv(q, 'y', 0, 0, 0);
      }
      var top = b.isl(4, 2.8, 1.2, 20); b.enemy(top, 'x', 1.8, 1.8); b.gemsOn(top, 6, 1);
      var bridge1 = b.mv(b.isl(2.0, 1.8, 0, 0), 'x', 2.4, 1.3, 0); var fin = b.isl(5, 1.8, 0, 0); b.cp(fin);
      var star3 = b.side(fin, 7.5, 0.6, -2, 1.9); b.star(star3, 0, 0);
      var bm = b.mv(b.side(fin, 3.8, 0.3, -0.8, 1.4), 'z', 1.8, 1.2, 0);
      return b.finish('Espiral das Flores', 'Suba até o topo sem olhar pra baixo.', 2);
    },
    function () { // 4 Torre de Cristal
      var b = new Builder(), a = b.first(4);
      var s1 = b.isl(2.2, 3.0, 0.8, 0); b.gemsOn(s1, 4, 1, 0.7);
      var m1 = b.mv(b.isl(2.0, 1.6, 0.2, 20), 'z', 2.6, 1.5, 0); var m2 = b.mv(b.isl(2.0, 1.6, 0.2, -20), 'x', 2.6, 1.6, 1.5);
      var s2 = b.isl(3.4, 1.7, 0.5, 0); b.cp(s2); b.enemy(s2, 'x', 1.6, 1.8); b.enemy(s2, 'z', 1.6, 2.0); b.gemsOn(s2, 6, 1);
      var t1 = b.isl(1.4, 3.5, 0.6, 30), t2 = b.isl(1.4, 3.6, 0.6, -30), t3 = b.isl(1.4, 3.7, 0.6, 30), t4 = b.isl(1.4, 3.6, 0.6, -30); b.gemArc(t1, t2, 2); b.gemArc(t3, t4, 2);
      var s3 = b.isl(4.2, 2.8, 0.5, 0); b.cp(s3); b.enemy(s3, 'x', 2.4, 2.0); b.enemy(s3, 'z', 2.4, 1.7); b.enemy(s3, 'x', 1.2, 2.4); b.star(s3, 0, 0.1);
      var e1 = b.mv(b.isl(2.2, 1.7, 1.0, 0), 'y', 2.4, 1.2, 0), e2 = b.mv(b.isl(2.2, 1.7, 1.2, 0), 'y', 2.4, 1.2, 2.2);
      var s4 = b.isl(3.2, 1.8, 0.8, 25); b.gemsOn(s4, 5, 1); b.enemy(s4, 'z', 1.6, 1.9);
      var side = b.side(s4, 6.5, 1.0, 0, 1.6); b.star(side, 0, 0);
      var u1 = b.mv(b.isl(1.8, 1.8, 0.3, -45), 'x', 2.8, 1.5, 0), u2 = b.mv(b.isl(1.8, 1.8, 0.3, 90), 'z', 2.8, 1.6, 1), u3 = b.mv(b.isl(1.8, 1.8, 0.3, -45), 'x', 2.8, 1.7, 2);
      var s5 = b.isl(3.4, 1.8, 0.6, 0); b.cp(s5); b.star(s5, 1.0, 1.0);
      var v1 = b.isl(1.3, 3.6, 0.8, 20), v2 = b.isl(1.3, 3.7, 0.8, -20), v3 = b.isl(1.3, 3.8, 0.8, 20); b.gemArc(v1, v2, 2); b.gemArc(v2, v3, 2);
      var top = b.isl(5.5, 3.0, 0.8, 0); b.enemy(top, 'x', 3, 2.0); b.enemy(top, 'z', 3, 2.2); b.gemsOn(top, 8, 1);
      return b.finish('Torre de Cristal', 'O desafio final. Vale todas as estrelas.', 3);
    }
  ];
  function buildLevel(n) { var seed = 1234 + n; var rs = Math.random; var s = seed; Math.random = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { return LEVELS[n](); } finally { Math.random = rs; } }

  /* ---------- simulacao ---------- */
  function Sim(level) {
    this.lv = level; this.t = 0; this.lives = 5; this.hp = 3; this.gems = 0; this.starsGot = [false, false, false].slice(0, level.stars.length).map(function () { return false; });
    this.gemGot = level.gems.map(function () { return false; }); this.enemies = level.enemies.map(function (e) { return { x: e.x, y: e.y, z: e.z, ax: e.ax, amp: e.amp, spd: e.spd, ph: e.ph, bx: e.x, bz: e.z, alive: true, dir: 1, squash: 0 }; });
    this.cp = { x: level.start.x, y: level.start.y, z: level.start.z }; this.cpIdx = -1;
    this.score = 0; this.done = false; this.over = false; this.events = []; this.plat = null;
    this.respawn(true);
  }
  Sim.prototype.platPos = function (q, t) {
    if (!q.mv) return { x: q.x, y: q.y, z: q.z };
    var o = Math.sin(t * q.mv.spd + q.mv.ph) * q.mv.amp, p = { x: q.x, y: q.y, z: q.z }; p[q.mv.ax] += o; return p;
  };
  Sim.prototype.respawn = function (first) {
    this.x = this.cp.x; this.y = this.cp.y + 0.6; this.z = this.cp.z; this.vx = this.vz = this.vy = 0; this.ground = false; this.jumps = 0; this.coyote = 0; this.buf = 0; this.inv = first ? 0 : 1.5; this.spin = 0; this.face = 0; this.hp = 3; this.plat = null;
  };
  Sim.prototype.hurt = function (kx, kz) {
    if (this.inv > 0 || this.done) return; this.hp--; this.inv = 1.6; this.events.push({ t: 'hurt' });
    var m = Math.hypot(kx, kz) || 1; this.vx = kx / m * 8; this.vz = kz / m * 8; this.vy = 9; this.ground = false; this.plat = null;
    if (this.hp <= 0) this.die();
  };
  Sim.prototype.die = function () {
    this.lives--; this.events.push({ t: 'die' });
    if (this.lives <= 0) { this.over = true; return; }
    this.respawn(false);
  };
  // mx,mz: direcao desejada no mundo (vetor, comprimento <=1). jumpPressed: borda. jumpHeld. spinPressed.
  Sim.prototype.step = function (dt, mx, mz, jumpPressed, jumpHeld, spinPressed) {
    if (this.done || this.over) return;
    this.events.length = 0; var prevT = this.t; this.t += dt;
    var L = this.lv, i, q;
    this.inv = Math.max(0, this.inv - dt); this.spin = Math.max(0, this.spin - dt);
    if (spinPressed && this.spin <= 0) { this.spin = 0.45; this.events.push({ t: 'spin' }); }
    // carrega pela plataforma
    var pp = null;
    if (this.plat !== null && this.plat >= 0) { q = L.platforms[this.plat]; var a0 = this.platPos(q, prevT), a1 = this.platPos(q, this.t); this.x += a1.x - a0.x; this.z += a1.z - a0.z; this.y += a1.y - a0.y; }
    // movimento horizontal
    var m = Math.hypot(mx, mz), sp = SPEED * (this.spin > 0 ? 1.15 : 1);
    var tx = m > 0.05 ? mx / Math.max(1, m) * sp : 0, tz = m > 0.05 ? mz / Math.max(1, m) * sp : 0;
    var acc = this.ground ? 60 : 26, k = Math.min(1, acc * dt);
    this.vx += (tx - this.vx) * k; this.vz += (tz - this.vz) * k;
    if (m > 0.2) this.face = Math.atan2(mx, mz);
    // pulo
    this.buf = Math.max(0, this.buf - dt); if (jumpPressed) this.buf = 0.14;
    this.coyote = this.ground ? 0.1 : Math.max(0, this.coyote - dt);
    if (this.buf > 0 && (this.ground || this.coyote > 0)) { this.vy = JV; this.ground = false; this.coyote = 0; this.buf = 0; this.jumps = 1; this.plat = null; this.events.push({ t: 'jump' }); }
    else if (this.buf > 0 && !this.ground && this.jumps < 2 && this.coyote <= 0) { this.vy = JV2; this.jumps = 2; this.buf = 0; this.events.push({ t: 'jump2' }); }
    if (!jumpHeld && this.vy > 4 && !this.ground) this.vy -= 90 * dt; // pulo variavel
    this.vy += G * dt; if (this.vy < -30) this.vy = -30;
    var oy = this.y; this.x += this.vx * dt; this.z += this.vz * dt; this.y += this.vy * dt;
    // colisoes
    var landed = null;
    for (i = 0; i < L.platforms.length; i++) {
      q = L.platforms[i]; pp = this.platPos(q, this.t); var top = pp.y, dx = this.x - pp.x, dz = this.z - pp.z, d = Math.hypot(dx, dz), R = q.r;
      if (this.y < top - q.th) continue;
      if (d < R + 0.1 && this.vy <= 0 && oy >= top - 0.3 - Math.max(0, (this.platPrevY(q, prevT) - top)) && this.y <= top + 0.02) { landed = i; this.y = top; }
      else if (this.y < top - 0.2 && d < R + PR) { var pu = (R + PR - d) / (d || 1); this.x += dx * pu; this.z += dz * pu; if (d < 1e-4) this.x += PR; }
    }
    if (landed !== null) {
      if (!this.ground) this.events.push({ t: 'land' });
      this.ground = true; this.vy = 0; this.jumps = 0; this.plat = landed;
    } else { if (this.ground) { this.coyote = 0.1; } this.ground = false; this.plat = null; }
    // gemas e estrelas
    var self = this;
    L.gems.forEach(function (g, gi) { if (self.gemGot[gi]) return; var gp = self.gemPos(g); if (Math.hypot(gp.x - self.x, gp.z - self.z) < 1.0 && Math.abs(gp.y - (self.y + 0.7)) < 1.3) { self.gemGot[gi] = true; self.gems++; self.score += 10; self.events.push({ t: 'gem', i: gi }); } });
    L.stars.forEach(function (s, si) { if (self.starsGot[si]) return; if (Math.hypot(s.x - self.x, s.z - self.z) < 1.2 && Math.abs(s.y - (self.y + 0.7)) < 1.4) { self.starsGot[si] = true; self.score += 200; self.events.push({ t: 'star', i: si }); } });
    L.checkpoints.forEach(function (c, ci) { if (ci > self.cpIdx && Math.hypot(c.x - self.x, c.z - self.z) < 1.8 && Math.abs(c.y - self.y) < 1.5) { self.cpIdx = ci; self.cp = { x: c.x, y: c.y, z: c.z }; self.events.push({ t: 'cp' }); } });
    // inimigos
    this.enemies.forEach(function (e) {
      if (!e.alive) { e.squash = Math.min(1, e.squash + dt * 4); return; }
      var o = Math.sin(self.t * e.spd + e.ph) * e.amp, px = e.ax === 'x' ? e.bx + o : e.bx, pz = e.ax === 'z' ? e.bz + o : e.bz; e.vx = (px - e.x) / Math.max(dt, 1e-4); e.x = px; e.z = pz;
      var dx = self.x - e.x, dz = self.z - e.z, dd = Math.hypot(dx, dz);
      if (dd < 0.95 && self.y < e.y + 1.3 && self.y + PH > e.y) {
        if (self.vy < -1 && self.y > e.y + 0.45) { e.alive = false; self.vy = jumpHeld ? 13 : 10.5; self.jumps = 1; self.score += 100; self.events.push({ t: 'stomp', x: e.x, y: e.y, z: e.z }); }
        else if (self.spin > 0) { e.alive = false; self.score += 100; self.events.push({ t: 'stomp', x: e.x, y: e.y, z: e.z }); }
        else self.hurt(dx, dz);
      }
    });
    // meta
    var g = L.goal; if (Math.hypot(g.x - this.x, g.z - this.z) < 1.8 && Math.abs(g.y - this.y) < 2) { this.done = true; this.events.push({ t: 'goal' }); }
    if (this.y < DEATH) { this.events.push({ t: 'fall' }); this.die(); }
  };
  Sim.prototype.platPrevY = function (q, t) { return q.mv && q.mv.ax === 'y' ? this.platPos(q, t).y : q.y; };
  Sim.prototype.gemPos = function (g) { return g.pl >= 0 ? (function (s) { var p = s.platPos(s.lv.platforms[g.pl], s.t), q = s.lv.platforms[g.pl]; return { x: g.x + (p.x - q.x), y: g.y + (p.y - q.y), z: g.z + (p.z - q.z) }; })(this) : g; };
  Sim.prototype.groundBelow = function () {
    var best = null, L = this.lv;
    for (var i = 0; i < L.platforms.length; i++) { var q = L.platforms[i], p = this.platPos(q, this.t); if (Math.hypot(this.x - p.x, this.z - p.z) < q.r && p.y <= this.y + 0.3 && p.y >= this.y - q.th - 30) if (best === null || p.y > best) best = p.y; }
    return best;
  };
  root.LL = { buildLevel: buildLevel, LEVELS: LEVELS, Sim: Sim, PR: PR, PH: PH, SPEED: SPEED, N: LEVELS.length };
})(typeof window !== 'undefined' ? window : globalThis);
