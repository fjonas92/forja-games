/* Motor de Damas (regras brasileiras): 8x8, captura obrigatoria com lei da maioria, peca captura para tras, dama voadora. Sem graficos. */
(function (root) {
  var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function initial() { var b = new Array(64).fill(0), r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) b[r * 8 + c] = -1; else if (r > 4) b[r * 8 + c] = 1; } return b; }
  function inb(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
  function side(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }
  // capturas a partir de sq: devolve lista de {path, caps}
  function capSeqs(b, sq, s, king) {
    var out = [], r0 = (sq / 8) | 0, c0 = sq % 8; var piece = b[sq]; b[sq] = 0;
    (function dfs(r, c, path, caps) {
      var any = false, d, k, rr, cc, i;
      for (d = 0; d < 4; d++) {
        var dr = DIRS[d][0], dc = DIRS[d][1];
        if (!king) {
          rr = r + dr; cc = c + dc; var r2 = r + 2 * dr, c2 = c + 2 * dc;
          if (inb(r2, c2) && side(b[rr * 8 + cc]) === -s && caps.indexOf(rr * 8 + cc) < 0 && !b[r2 * 8 + c2]) { any = true; dfs(r2, c2, path.concat([r2 * 8 + c2]), caps.concat([rr * 8 + cc])); }
        } else {
          rr = r + dr; cc = c + dc;
          while (inb(rr, cc) && !b[rr * 8 + cc]) { rr += dr; cc += dc; }
          if (!inb(rr, cc) || side(b[rr * 8 + cc]) !== -s || caps.indexOf(rr * 8 + cc) >= 0) continue;
          var cs = rr * 8 + cc, lr = rr + dr, lc = cc + dc;
          while (inb(lr, lc) && !b[lr * 8 + lc]) { any = true; dfs(lr, lc, path.concat([lr * 8 + lc]), caps.concat([cs])); lr += dr; lc += dc; }
        }
      }
      if (!any && caps.length) out.push({ path: path, caps: caps });
    })(r0, c0, [], []);
    b[sq] = piece; return out;
  }
  function simple(b, sq, s, king) {
    var out = [], r = (sq / 8) | 0, c = sq % 8, d, rr, cc;
    for (d = 0; d < 4; d++) {
      var dr = DIRS[d][0], dc = DIRS[d][1];
      if (!king) { if (dr !== -s) continue; rr = r + dr; cc = c + dc; if (inb(rr, cc) && !b[rr * 8 + cc]) out.push({ path: [rr * 8 + cc], caps: [] }); }
      else { rr = r + dr; cc = c + dc; while (inb(rr, cc) && !b[rr * 8 + cc]) { out.push({ path: [rr * 8 + cc], caps: [] }); rr += dr; cc += dc; } }
    }
    return out;
  }
  function legal(b, s) {
    var caps = [], sq, mv, best = 0, i;
    for (sq = 0; sq < 64; sq++) if (side(b[sq]) === s) { var k = Math.abs(b[sq]) === 2; capSeqs(b, sq, s, k).forEach(function (m) { caps.push({ from: sq, path: m.path, to: m.path[m.path.length - 1], caps: m.caps }); }); }
    if (caps.length) { for (i = 0; i < caps.length; i++) best = Math.max(best, caps[i].caps.length); return caps.filter(function (m) { return m.caps.length === best; }); }
    var res = []; for (sq = 0; sq < 64; sq++) if (side(b[sq]) === s) { var kk = Math.abs(b[sq]) === 2; simple(b, sq, s, kk).forEach(function (m) { res.push({ from: sq, path: m.path, to: m.path[0], caps: [] }); }); }
    return res;
  }
  function apply(b, m) {
    var nb = b.slice(), p = nb[m.from]; nb[m.from] = 0; m.caps.forEach(function (q) { nb[q] = 0; });
    var tr = (m.to / 8) | 0; if (Math.abs(p) === 1 && ((p > 0 && tr === 0) || (p < 0 && tr === 7))) p = p * 2; nb[m.to] = p; return nb;
  }
  // avaliacao do ponto de vista de s
  function evalB(b, s) {
    var sc = 0, sq, v, r, c, m, mine = 0, his = 0;
    for (sq = 0; sq < 64; sq++) { v = b[sq]; if (!v) continue; r = (sq / 8) | 0; c = sq % 8; m = side(v); var val = Math.abs(v) === 2 ? 330 : 100 + (m === 1 ? (7 - r) : r) * 4; if (Math.abs(v) === 1 && ((m === 1 && r === 7) || (m === -1 && r === 0))) val += 8; if (c === 0 || c === 7) val += 3; if (Math.abs(v) === 2) { val += 10 - (Math.abs(3.5 - r) + Math.abs(3.5 - c)) * 1.5; } if (m === s) { sc += val; mine++; } else { sc -= val; his++; } }
    return sc;
  }
  function search(b, s, depth, alpha, beta, ctx) {
    var ms = legal(b, s); ctx.n++;
    if (!ms.length) return -100000 - depth;
    if (depth <= 0 && !ms[0].caps.length) return evalB(b, s);
    if (depth <= -3) return evalB(b, s);
    ms.sort(function (x, y) { return y.caps.length - x.caps.length; });
    var best = -1e9;
    for (var i = 0; i < ms.length; i++) { var v = -search(apply(b, ms[i]), -s, depth - 1, -beta, -alpha, ctx); if (v > best) best = v; if (best > alpha) alpha = best; if (alpha >= beta) break; if (ctx.n > ctx.lim) break; }
    return best;
  }
  var LEVELS = { facil: { d: 2, noise: 90, lim: 6000 }, normal: { d: 5, noise: 12, lim: 60000 }, dificil: { d: 7, noise: 0, lim: 200000 } };
  function Game(opts) {
    opts = opts || {}; this.rnd = opts.rnd || Math.random; this.b = initial(); this.turn = 1; this.over = false; this.winner = 0; this.hist = []; this.kingMoves = 0; this.nmoves = 0; this.reason = '';
  }
  Game.prototype.moves = function () { return this.over ? [] : legal(this.b, this.turn); };
  Game.prototype.play = function (m) {
    var p = this.b[m.from]; this.hist.push({ b: this.b.slice(), turn: this.turn, km: this.kingMoves, nm: this.nmoves });
    this.b = apply(this.b, m); this.nmoves++;
    if (Math.abs(p) === 2 && !m.caps.length) this.kingMoves++; else this.kingMoves = 0;
    this.turn = -this.turn; this.check(); return true;
  };
  Game.prototype.check = function () {
    var ms = legal(this.b, this.turn); if (!ms.length) { this.over = true; this.winner = -this.turn; this.reason = 'sem jogadas'; return; }
    if (this.kingMoves >= 40) { this.over = true; this.winner = 0; this.reason = '20 lances só com damas'; return; }
    var a = 0, bb = 0; this.b.forEach(function (v) { if (v > 0) a++; else if (v < 0) bb++; }); if (a === 1 && bb === 1 && this.b.every(function (v) { return Math.abs(v) !== 1; }) && this.nmoves > 0 && this.kingMoves >= 10) { this.over = true; this.winner = 0; this.reason = 'dama contra dama'; }
  };
  Game.prototype.undo = function () { if (!this.hist.length) return false; var h = this.hist.pop(); this.b = h.b; this.turn = h.turn; this.kingMoves = h.km; this.nmoves = h.nm; this.over = false; this.winner = 0; return true; };
  Game.prototype.count = function (s) { var n = 0; this.b.forEach(function (v) { if (side(v) === s) n++; }); return n; };
  Game.prototype.ai = function (level) {
    var L = LEVELS[level] || LEVELS.normal, ms = this.moves(); if (!ms.length) return null; if (ms.length === 1) return ms[0];
    var best = null, bv = -1e9, ctx = { n: 0, lim: L.lim }, s = this.turn, self = this;
    ms.slice().sort(function (x, y) { return y.caps.length - x.caps.length; }).forEach(function (m) { var v = -search(apply(self.b, m), -s, L.d - 1, -1e9, 1e9, ctx) + (self.rnd() - 0.5) * 2 * L.noise; if (v > bv) { bv = v; best = m; } });
    return best;
  };
  Game.prototype.save = function () { return { b: this.b.slice(), t: this.turn, km: this.kingMoves, nm: this.nmoves }; };
  Game.prototype.load = function (d) { if (!d || !d.b || d.b.length !== 64) return false; this.b = d.b.slice(); this.turn = d.t === -1 ? -1 : 1; this.kingMoves = d.km | 0; this.nmoves = d.nm | 0; this.hist = []; this.over = false; this.winner = 0; this.check(); return true; };
  root.Damas = { Game: Game, initial: initial, legal: legal, apply: apply, LEVELS: LEVELS };
})(typeof window !== 'undefined' ? window : globalThis);
