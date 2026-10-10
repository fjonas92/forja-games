/* Motor do Pebolim (sem graficos). Mesa W x H, time 0 (esquerda, voce) chuta para a direita; time 1 (direita) para a esquerda. */
(function (root) {
  var W = 1040, H = 600, BR = 10, FR = 16, GOAL = 200;
  var ROLES = { gk: { n: 1, sp: 0, range: 100 }, def: { n: 2, sp: 160, range: 100 }, mid: { n: 5, sp: 105, range: 60 }, att: { n: 3, sp: 150, range: 85 } };
  var LAYOUT = [[0, 'gk', 0.08], [0, 'def', 0.20], [1, 'att', 0.32], [0, 'mid', 0.44], [1, 'mid', 0.56], [0, 'att', 0.68], [1, 'def', 0.80], [1, 'gk', 0.92]];
  var DIFF = { facil: { maxv: 330, err: 34, delay: 0.28, pred: 0.0 }, normal: { maxv: 480, err: 15, delay: 0.14, pred: 0.08 }, dificil: { maxv: 660, err: 4, delay: 0.05, pred: 0.17 } };

  function Rod(team, role, fx) {
    var r = ROLES[role], off = [];
    for (var i = 0; i < r.n; i++) off.push((i - (r.n - 1) / 2) * r.sp);
    this.team = team; this.role = role; this.dir = team === 0 ? 1 : -1; this.x = fx * W; this.off = off; this.range = r.range;
    this.y = H / 2; this.ty = H / 2; this.vy = 0; this.maxv = 520; this.swing = 0; this.swingDir = 0; this.cool = 0; this.shift = 0; this.fvx = 0; this.ai = 0;
  }
  Rod.prototype.figs = function () {
    var a = [];
    for (var i = 0; i < this.off.length; i++) a.push([this.x + this.dir * this.shift, this.y + this.off[i]]);
    return a;
  };
  Rod.prototype.kick = function () { if (this.cool <= 0 && this.swingDir === 0) { this.swingDir = 1; this.swing = 0; this.cool = 0.38; return true; } return false; };

  function Sim(opts) {
    opts = opts || {};
    this.W = W; this.H = H; this.BR = BR; this.FR = FR; this.GOAL = GOAL;
    this.target = opts.target || 5; this.diff = DIFF[opts.diff || 'normal'] || DIFF.normal;
    this.aiTeams = opts.aiTeams || [1]; this.rods = [];
    for (var i = 0; i < LAYOUT.length; i++) this.rods.push(new Rod(LAYOUT[i][0], LAYOUT[i][1], LAYOUT[i][2]));
    this.score = [0, 0]; this.t = 0; this.over = false; this.winner = -1; this.events = []; this.freeze = 0; this.stillT = 0;
    this.rnd = opts.rnd || Math.random;
    this.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    var self = this; this.rods.forEach(function (r) { r.ai = self.aiTeams.indexOf(r.team) >= 0 ? 1 : 0; if (r.ai) r.maxv = self.diff.maxv; });
    this.kickoff(this.rnd() < 0.5 ? 0 : 1);
  }
  Sim.prototype.kickoff = function (toward) {
    var b = this.ball; b.x = W / 2; b.y = H / 2 + (this.rnd() - 0.5) * 80; b.vx = 0; b.vy = 0; this.freeze = 1.1; this.kickTo = toward; this.stillT = 0;
  };
  Sim.prototype.teamRods = function (team) { return this.rods.filter(function (r) { return r.team === team; }); };

  // escolhe a barra do time (voce) mais util para a bola
  Sim.prototype.bestRod = function (team) {
    var dir = team === 0 ? 1 : -1, b = this.ball, best = null, bd = 1e9, rs = this.teamRods(team);
    for (var i = 0; i < rs.length; i++) { var d = (b.x - rs[i].x) * dir; if (d >= -30 && d < bd) { bd = d; best = rs[i]; } }
    return best || rs.filter(function (r) { return r.role === 'gk'; })[0];
  };

  Sim.prototype.aiControl = function (dt) {
    var b = this.ball, D = this.diff;
    for (var i = 0; i < this.rods.length; i++) {
      var r = this.rods[i]; if (!r.ai) continue;
      var py = b.y + b.vy * D.pred, ahead = (b.x - r.x) * r.dir;
      var best = 0, bd = 1e9;
      for (var k = 0; k < r.off.length; k++) { var dd = Math.abs(py - r.off[k] - r.y); if (dd < bd) { bd = dd; best = k; } }
      var want = py - r.off[best];
      if (r.role === 'gk') want = py * 0.85 + H / 2 * 0.15;
      else if (ahead < -40) want = H / 2 + (py - H / 2) * 0.35; // bola ja passou: reposiciona
      r.aiErr = r.aiErr === undefined || this.t - (r.aiErrT || 0) > 0.5 ? (this.rnd() - 0.5) * 2 * D.err : r.aiErr;
      if (this.t - (r.aiErrT || 0) > 0.5) r.aiErrT = this.t;
      r.ty = want + r.aiErr * (ahead < 0 ? 0.4 : 1);
      // chute
      var fy = r.y + r.off[best], fx = r.x + r.dir * r.shift;
      if (ahead >= -4 && ahead < 44 && Math.abs(b.y - fy) < 30 && r.cool <= 0 && (this.t - (r.aiLook || 0)) > D.delay) {
        r.aiLook = this.t; if (r.kick()) { /* chute */ }
      }
      if (ahead > 60 || ahead < -40) r.aiLook = this.t;
    }
  };

  Sim.prototype.step = function (dt) {
    if (this.over) return;
    this.events.length = 0; this.t += dt;
    if (this.freeze > 0) { this.freeze -= dt; this.moveRods(dt); if (this.freeze <= 0) { this.ball.vx = (this.kickTo === 0 ? -1 : 1) * 90; this.ball.vy = (this.rnd() - 0.5) * 120; } return; }
    this.aiControl(dt); this.moveRods(dt);
    var n = 4, h = dt / n;
    for (var s = 0; s < n; s++) this.moveBall(h);
    // bola parada demais: saque novo
    var sp = Math.hypot(this.ball.vx, this.ball.vy);
    this.stillT = sp < 20 ? this.stillT + dt : 0;
    if (this.stillT > 2.5) { this.ball.vx = (this.rnd() < 0.5 ? -1 : 1) * 260; this.ball.vy = (this.rnd() - 0.5) * 260; this.stillT = 0; }
  };

  Sim.prototype.moveRods = function (dt) {
    for (var i = 0; i < this.rods.length; i++) {
      var r = this.rods[i];
      var lim = r.range, ty = Math.max(H / 2 - lim, Math.min(H / 2 + lim, r.ty));
      var d = ty - r.y, mx = r.maxv * dt, mv = Math.max(-mx, Math.min(mx, d));
      r.vy = mv / dt; r.y += mv;
      r.cool = Math.max(0, r.cool - dt);
      // chute: vai 36 px a frente em 0.08 s e volta em 0.16 s
      var old = r.shift;
      if (r.swingDir === 1) { r.swing += dt / 0.08; if (r.swing >= 1) { r.swing = 1; r.swingDir = -1; } r.shift = 38 * r.swing; }
      else if (r.swingDir === -1) { r.swing -= dt / 0.16; if (r.swing <= 0) { r.swing = 0; r.swingDir = 0; } r.shift = 38 * r.swing; }
      r.fvx = r.dir * (r.shift - old) / dt;
    }
  };

  Sim.prototype.moveBall = function (h) {
    var b = this.ball;
    b.x += b.vx * h; b.y += b.vy * h;
    var fr = Math.exp(-0.30 * h); b.vx *= fr; b.vy *= fr;
    var sp = Math.hypot(b.vx, b.vy); if (sp > 1250) { b.vx *= 1250 / sp; b.vy *= 1250 / sp; }
    // bonecos
    for (var i = 0; i < this.rods.length; i++) {
      var r = this.rods[i];
      if (Math.abs(b.x - r.x) > 70) continue;
      var fg = r.figs();
      for (var k = 0; k < fg.length; k++) {
        var dx = b.x - fg[k][0], dy = b.y - fg[k][1], d = Math.hypot(dx, dy), m = FR + BR;
        if (d < m && d > 1e-6) {
          var nx = dx / d, ny = dy / d; b.x = fg[k][0] + nx * m; b.y = fg[k][1] + ny * m;
          // r.fvx = velocidade do pe no eixo x (ja com o sinal do time), r.vy = velocidade da barra em y
          var rvx = b.vx - r.fvx, rvy = b.vy - r.vy, vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            var e = r.swingDir === 1 ? 0.95 : 0.5;
            b.vx += -(1 + e) * vn * nx; b.vy += -(1 + e) * vn * ny;
            if (r.swingDir === 1) { b.vx += r.dir * 240; this.events.push({ t: 'kick', power: Math.min(1, Math.hypot(b.vx, b.vy) / 900) }); }
            else this.events.push({ t: 'touch', power: Math.min(1, Math.abs(vn) / 500) });
          }
        }
      }
    }
    // paredes e gols
    var half = GOAL / 2, top = H / 2 - half, bot = H / 2 + half;
    if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy) * 0.85; this.events.push({ t: 'wall' }); }
    if (b.y > H - BR) { b.y = H - BR; b.vy = -Math.abs(b.vy) * 0.85; this.events.push({ t: 'wall' }); }
    var posts = [[0, top], [0, bot], [W, top], [W, bot]];
    for (var p = 0; p < 4; p++) {
      var qx = b.x - posts[p][0], qy = b.y - posts[p][1], qd = Math.hypot(qx, qy), pm = BR + 5;
      if (qd < pm && qd > 1e-6) {
        var ux = qx / qd, uy = qy / qd; b.x = posts[p][0] + ux * pm; b.y = posts[p][1] + uy * pm;
        var dn = b.vx * ux + b.vy * uy; if (dn < 0) { b.vx -= 1.7 * dn * ux; b.vy -= 1.7 * dn * uy; this.events.push({ t: 'wall' }); }
      }
    }
    var inMouth = b.y > top && b.y < bot;
    if (!inMouth) {
      if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx) * 0.85; this.events.push({ t: 'wall' }); }
      if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx) * 0.85; this.events.push({ t: 'wall' }); }
    } else {
      if (b.x < -BR * 1.5) this.goal(1);
      else if (b.x > W + BR * 1.5) this.goal(0);
    }
  };

  Sim.prototype.goal = function (team) {
    this.score[team]++; this.events.push({ t: 'goal', team: team });
    if (this.score[team] >= this.target) { this.over = true; this.winner = team; this.events.push({ t: 'end', winner: team }); return; }
    this.kickoff(team === 0 ? 1 : 0);
  };

  root.Foos = { Sim: Sim, W: W, H: H, BR: BR, FR: FR, GOAL: GOAL, DIFF: DIFF };
})(typeof window !== 'undefined' ? window : globalThis);
