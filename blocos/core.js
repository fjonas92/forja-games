/* Motor do Blocos Cristal (sem graficos). Tabuleiro 8x8, 3 pecas por rodada, limpa linhas e colunas. */
(function (root) {
  var N = 8;
  var BASE = {
    dot: [[0, 0]], i2: [[0, 0], [0, 1]], i3: [[0, 0], [0, 1], [0, 2]], i4: [[0, 0], [0, 1], [0, 2], [0, 3]], i5: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    sq2: [[0, 0], [0, 1], [1, 0], [1, 1]], sq3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], r23: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
    l2: [[0, 0], [1, 0], [1, 1]], l3: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], t3: [[0, 0], [0, 1], [0, 2], [1, 1]], s4: [[0, 1], [0, 2], [1, 0], [1, 1]], z4: [[0, 0], [0, 1], [1, 1], [1, 2]], l4: [[0, 0], [1, 0], [2, 0], [2, 1]]
  };
  var WEIGHT = { dot: 1, i2: 3, i3: 3, i4: 2, i5: 1, sq2: 3, sq3: 1, r23: 2, l2: 3, l3: 1, t3: 2, s4: 2, z4: 2, l4: 3 };
  function norm(cells) { var mr = 99, mc = 99; cells.forEach(function (p) { mr = Math.min(mr, p[0]); mc = Math.min(mc, p[1]); }); return cells.map(function (p) { return [p[0] - mr, p[1] - mc]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }); }
  function rot(cells) { return norm(cells.map(function (p) { return [p[1], -p[0]]; })); }
  var SHAPES = [], seen = {};
  Object.keys(BASE).forEach(function (k) {
    var c = norm(BASE[k]);
    for (var i = 0; i < 4; i++) { var key = JSON.stringify(c); if (!seen[key]) { seen[key] = 1; SHAPES.push({ id: k + i, cells: c, w: WEIGHT[k] }); } c = rot(c); }
  });
  SHAPES.forEach(function (s) { var h = 0, w = 0; s.cells.forEach(function (p) { h = Math.max(h, p[0] + 1); w = Math.max(w, p[1] + 1); }); s.h = h; s.wd = w; });

  function Game(opts) {
    opts = opts || {}; this.rnd = opts.rnd || Math.random; this.N = N;
    this.board = []; for (var r = 0; r < N; r++) { this.board.push([]); for (var c = 0; c < N; c++) this.board[r].push(0); }
    this.tray = [null, null, null]; this.score = 0; this.combo = 0; this.moves = 0; this.over = false; this.lines = 0; this.bestCombo = 0;
    this.refill();
  }
  Game.prototype.canPlace = function (shape, r, c) {
    for (var i = 0; i < shape.cells.length; i++) { var rr = r + shape.cells[i][0], cc = c + shape.cells[i][1]; if (rr < 0 || cc < 0 || rr >= N || cc >= N || this.board[rr][cc]) return false; }
    return true;
  };
  Game.prototype.fitsAnywhere = function (shape) { for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (this.canPlace(shape, r, c)) return true; return false; };
  Game.prototype.pickShape = function () {
    var tot = 0, i; for (i = 0; i < SHAPES.length; i++) tot += SHAPES[i].w;
    var x = this.rnd() * tot; for (i = 0; i < SHAPES.length; i++) { x -= SHAPES[i].w; if (x <= 0) return SHAPES[i]; } return SHAPES[0];
  };
  Game.prototype.refill = function () {
    for (var tries = 0; tries < 40; tries++) {
      var t = [this.pickShape(), this.pickShape(), this.pickShape()], ok = false;
      for (var i = 0; i < 3; i++) if (this.fitsAnywhere(t[i])) ok = true;
      if (ok || tries === 39) { this.tray = t.map(function (s, k) { return { shape: s, color: Math.floor(this.rnd() * 7) }; }, this); break; }
    }
    this.checkOver();
  };
  Game.prototype.checkOver = function () {
    for (var i = 0; i < 3; i++) if (this.tray[i] && this.fitsAnywhere(this.tray[i].shape)) { this.over = false; return false; }
    this.over = true; return true;
  };
  Game.prototype.place = function (slot, r, c) {
    var p = this.tray[slot]; if (this.over || !p || !this.canPlace(p.shape, r, c)) return null;
    var placed = [], i, j;
    for (i = 0; i < p.shape.cells.length; i++) { var rr = r + p.shape.cells[i][0], cc = c + p.shape.cells[i][1]; this.board[rr][cc] = p.color + 1; placed.push([rr, cc, p.color]); }
    var rows = [], cols = [];
    for (i = 0; i < N; i++) { var fr = true, fc = true; for (j = 0; j < N; j++) { if (!this.board[i][j]) fr = false; if (!this.board[j][i]) fc = false; } if (fr) rows.push(i); if (fc) cols.push(i); }
    var cleared = [], seenC = {};
    rows.forEach(function (rw) { for (var k = 0; k < N; k++) { var key = rw * 8 + k; if (!seenC[key]) { seenC[key] = 1; cleared.push([rw, k, this.board[rw][k] - 1]); } } }, this);
    cols.forEach(function (cl) { for (var k = 0; k < N; k++) { var key = k * 8 + cl; if (!seenC[key]) { seenC[key] = 1; cleared.push([k, cl, this.board[k][cl] - 1]); } } }, this);
    cleared.forEach(function (q) { this.board[q[0]][q[1]] = 0; }, this);
    var L = rows.length + cols.length; this.combo = L > 0 ? this.combo + 1 : 0; this.bestCombo = Math.max(this.bestCombo, this.combo);
    var gained = placed.length + (L > 0 ? 10 * (L * (L + 1) / 2) * this.combo : 0), perfect = false;
    if (L > 0) { perfect = true; for (i = 0; i < N && perfect; i++) for (j = 0; j < N; j++) if (this.board[i][j]) { perfect = false; break; } if (perfect) gained += 100; }
    this.score += gained; this.lines += L; this.moves++; this.tray[slot] = null;
    if (!this.tray[0] && !this.tray[1] && !this.tray[2]) this.refill(); else this.checkOver();
    return { placed: placed, cleared: cleared, rows: rows, cols: cols, lines: L, gained: gained, combo: this.combo, perfect: perfect, over: this.over };
  };
  Game.prototype.save = function () { return { b: this.board.map(function (r) { return r.slice(); }), t: this.tray.map(function (p) { return p ? { id: p.shape.id, c: p.color } : null; }), s: this.score, cb: this.combo, m: this.moves, l: this.lines, bc: this.bestCombo }; };
  Game.prototype.load = function (d) {
    try {
      this.board = d.b.map(function (r) { return r.slice(); });
      this.tray = d.t.map(function (p) { if (!p) return null; for (var i = 0; i < SHAPES.length; i++) if (SHAPES[i].id === p.id) return { shape: SHAPES[i], color: p.c }; return null; });
      this.score = d.s | 0; this.combo = d.cb | 0; this.moves = d.m | 0; this.lines = d.l | 0; this.bestCombo = d.bc | 0; this.over = false;
      if (!this.tray[0] && !this.tray[1] && !this.tray[2]) this.refill(); else this.checkOver(); return true;
    } catch (e) { return false; }
  };
  root.Blocos = { Game: Game, SHAPES: SHAPES, N: N };
})(typeof window !== 'undefined' ? window : globalThis);
