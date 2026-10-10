/* Motor de cartas: Poker (Texas hold'em, 1x1), Truco (1x1) e Blackjack. Sem graficos. */
(function (root) {
  var SUITS = ['♦', '♠', '♥', '♣']; // 0 ouros, 1 espadas, 2 copas, 3 paus
  var RN = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  function rname(r) { return RN[r] || String(r); }
  function shuffle(a, rnd) { rnd = rnd || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function deck52() { var d = []; for (var s = 0; s < 4; s++) for (var r = 2; r <= 14; r++) d.push({ r: r, s: s }); return d; }

  /* ---------- POKER ---------- */
  function eval5(c) {
    var rs = c.map(function (x) { return x.r; }).sort(function (a, b) { return b - a; }), fl = c.every(function (x) { return x.s === c[0].s; });
    var cnt = {}; rs.forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; });
    var gr = Object.keys(cnt).map(function (r) { return [cnt[r], +r]; }).sort(function (a, b) { return b[0] - a[0] || b[1] - a[1]; });
    var uniq = rs.filter(function (r, i) { return rs.indexOf(r) === i; }), st = 0;
    if (uniq.length === 5) { if (uniq[0] - uniq[4] === 4) st = uniq[0]; else if (uniq[0] === 14 && uniq[1] === 5) st = 5; }
    var cat, k;
    if (st && fl) { cat = 8; k = [st]; } else if (gr[0][0] === 4) { cat = 7; k = [gr[0][1], gr[1][1]]; } else if (gr[0][0] === 3 && gr[1][0] === 2) { cat = 6; k = [gr[0][1], gr[1][1]]; }
    else if (fl) { cat = 5; k = rs; } else if (st) { cat = 4; k = [st]; } else if (gr[0][0] === 3) { cat = 3; k = gr.map(function (g) { return g[1]; }); }
    else if (gr[0][0] === 2 && gr[1][0] === 2) { cat = 2; k = gr.map(function (g) { return g[1]; }); } else if (gr[0][0] === 2) { cat = 1; k = gr.map(function (g) { return g[1]; }); } else { cat = 0; k = rs; }
    var v = cat; for (var i = 0; i < 5; i++) v = v * 15 + (k[i] || 0); return v;
  }
  function best7(cards) {
    var n = cards.length, b = -1, i, j, k, l, m;
    if (n === 5) return eval5(cards);
    for (i = 0; i < n - 4; i++) for (j = i + 1; j < n - 3; j++) for (k = j + 1; k < n - 2; k++) for (l = k + 1; l < n - 1; l++) for (m = l + 1; m < n; m++) {
      var v = eval5([cards[i], cards[j], cards[k], cards[l], cards[m]]); if (v > b) b = v;
    }
    return b;
  }
  var CATN = ['Carta alta', 'Par', 'Dois pares', 'Trinca', 'Sequência', 'Flush', 'Full house', 'Quadra', 'Straight flush'];
  function catOf(v) { var c = v; for (var i = 0; i < 5; i++) c = Math.floor(c / 15); return c; }

  function Poker(opts) {
    opts = opts || {}; this.rnd = opts.rnd || Math.random; this.blind = opts.blind || 20;
    this.stack = [opts.stack || 1000, opts.stack || 1000]; this.dealer = this.rnd() < 0.5 ? 0 : 1; this.hands = 0; this.matchOver = false; this.log = [];
  }
  Poker.prototype.deal = function () {
    if (this.stack[0] <= 0 || this.stack[1] <= 0) { this.matchOver = true; return; }
    this.hands++; this.dealer = 1 - this.dealer; var d = shuffle(deck52(), this.rnd);
    this.deck = d; this.hole = [[d.pop(), d.pop()], [d.pop(), d.pop()]]; this.board = []; this.pot = 0; this.bet = [0, 0]; this.street = 0; this.acted = [false, false]; this.over = false; this.res = null; this.minRaise = this.blind;
    var sb = this.dealer, bb = 1 - sb; this.put(sb, Math.floor(this.blind / 2)); this.put(bb, this.blind); this.turn = sb; this.lastAct = null;
  };
  Poker.prototype.put = function (p, n) { n = Math.min(n, this.stack[p]); this.stack[p] -= n; this.bet[p] += n; };
  Poker.prototype.total = function () { return this.pot + this.bet[0] + this.bet[1]; };
  Poker.prototype.toCall = function (p) { return Math.max(0, Math.min(this.bet[1 - p] - this.bet[p], this.stack[p])); };
  Poker.prototype.maxRaiseTo = function (p) { return Math.min(this.bet[p] + this.stack[p], this.bet[1 - p] + this.stack[1 - p]); };
  Poker.prototype.minRaiseTo = function (p) { return Math.min(this.maxRaiseTo(p), Math.max(this.bet[0], this.bet[1]) + this.minRaise); };
  Poker.prototype.canRaise = function (p) { return this.maxRaiseTo(p) > Math.max(this.bet[0], this.bet[1]) && this.stack[1 - p] > 0 && this.stack[p] > this.toCall(p); };
  Poker.prototype.act = function (p, a, to) {
    if (this.over || p !== this.turn) return false;
    var o = 1 - p;
    if (a === 'fold') { this.lastAct = { p: p, a: 'fold' }; this.finish(o, 'fold'); return true; }
    if (a === 'call') { var c = this.toCall(p); this.put(p, c); this.acted[p] = true; this.lastAct = { p: p, a: c ? 'call' : 'check', n: c }; }
    else if (a === 'raise') {
      if (!this.canRaise(p)) return this.act(p, 'call');
      to = Math.max(this.minRaiseTo(p), Math.min(to, this.maxRaiseTo(p)));
      var prevMax = Math.max(this.bet[0], this.bet[1]); this.minRaise = Math.max(this.minRaise, to - prevMax);
      this.put(p, to - this.bet[p]); this.acted[p] = true; this.acted[o] = false; this.lastAct = { p: p, a: this.stack[p] === 0 ? 'allin' : 'raise', n: to };
    } else return false;
    // fim da rodada de apostas?
    if (this.acted[0] && this.acted[1] && this.bet[0] === this.bet[1]) { this.nextStreet(); return true; }
    if (this.bet[0] !== this.bet[1] && (this.stack[0] === 0 || this.stack[1] === 0) && this.acted[p] && this.toCall(o) === 0) { this.nextStreet(); return true; }
    this.turn = o; return true;
  };
  Poker.prototype.nextStreet = function () {
    // devolve excesso se houver all-in com apostas desiguais
    if (this.bet[0] !== this.bet[1]) { var hi = this.bet[0] > this.bet[1] ? 0 : 1, ex = Math.abs(this.bet[0] - this.bet[1]); this.bet[hi] -= ex; this.stack[hi] += ex; }
    this.pot += this.bet[0] + this.bet[1]; this.bet = [0, 0]; this.acted = [false, false]; this.minRaise = this.blind;
    if (this.street >= 3) { this.showdown(); return; }
    this.street++; var n = this.street === 1 ? 3 : 1; for (var i = 0; i < n; i++) this.board.push(this.deck.pop());
    if (this.stack[0] === 0 || this.stack[1] === 0) { this.nextStreet(); return; }
    this.turn = 1 - this.dealer;
  };
  Poker.prototype.showdown = function () {
    var v0 = best7(this.hole[0].concat(this.board)), v1 = best7(this.hole[1].concat(this.board));
    this.v = [v0, v1];
    if (v0 > v1) this.finish(0, 'showdown'); else if (v1 > v0) this.finish(1, 'showdown'); else this.finish(-1, 'showdown');
  };
  Poker.prototype.finish = function (w, how) {
    var tot = this.total(); this.over = true;
    if (w === -1) { var h = Math.floor(tot / 2); this.stack[0] += h + (this.bet[0] ? 0 : 0); this.stack[1] += tot - h; }
    else this.stack[w] += tot;
    this.bet = [0, 0]; this.pot = 0; this.res = { w: w, how: how, total: tot };
    if (this.stack[0] <= 0 || this.stack[1] <= 0) this.matchOver = true;
  };
  // estrategia simples da IA
  Poker.prototype.strength = function (p) {
    var h = this.hole[p], a = Math.max(h[0].r, h[1].r), b = Math.min(h[0].r, h[1].r);
    if (this.board.length === 0) {
      var s = (a + b) / 28 * 0.6; if (a === b) s = 0.5 + a / 28; if (h[0].s === h[1].s) s += 0.06; if (a - b === 1) s += 0.04; return Math.min(1, s);
    }
    var v = best7(h.concat(this.board)), c = catOf(v), s2 = [0.2, 0.42, 0.62, 0.72, 0.8, 0.85, 0.92, 0.97, 1][c];
    if (c === 1) { var bp = this.board.map(function (x) { return x.r; }); var pr = Math.floor(v / Math.pow(15, 4)) % 15; if (bp.indexOf(pr) >= 0 && h[0].r !== pr && h[1].r !== pr) s2 = 0.28; else if (pr >= 11) s2 = 0.5; }
    if (c === 0) { s2 = 0.12 + a / 14 * 0.1; }
    return s2;
  };
  Poker.prototype.ai = function (p, level) {
    level = level || 1; var s = this.strength(p) + (this.rnd() - 0.5) * 0.18 * (level === 0 ? 2 : 1), tc = this.toCall(p), pot = this.total(), r = this.rnd();
    var odds = tc / Math.max(1, pot + tc);
    if (tc === 0) {
      if (s > 0.7 && this.canRaise(p)) return { a: 'raise', to: Math.max(this.minRaiseTo(p), Math.max(this.bet[0], this.bet[1]) + Math.floor(pot * (0.5 + this.rnd() * 0.5))) };
      if (s > 0.45 && r < 0.4 && this.canRaise(p)) return { a: 'raise', to: this.minRaiseTo(p) + Math.floor(pot * 0.3) };
      if (r < 0.08 && this.canRaise(p)) return { a: 'raise', to: this.minRaiseTo(p) + Math.floor(pot * 0.5) };
      return { a: 'call' };
    }
    if (s > 0.85 && this.canRaise(p)) return { a: 'raise', to: Math.max(this.minRaiseTo(p), this.bet[1 - p] + Math.floor((pot + tc) * 0.8)) };
    if (s > 0.62 && r < 0.35 && this.canRaise(p)) return { a: 'raise', to: this.minRaiseTo(p) };
    if (s + 0.12 > odds * 1.6) return { a: 'call' };
    if (this.street === 0 && tc <= this.blind && s > 0.3) return { a: 'call' };
    return { a: 'fold' };
  };

  /* ---------- TRUCO ---------- */
  var TORD = [4, 5, 6, 7, 12, 11, 13, 14, 2, 3]; // fraca -> forte (Q=12,J=11,K=13,A=14)
  function truDeck() { var d = []; for (var s = 0; s < 4; s++) TORD.forEach(function (r) { d.push({ r: r, s: s }); }); return d; }
  function Truco(opts) { opts = opts || {}; this.rnd = opts.rnd || Math.random; this.target = opts.target || 12; this.score = [0, 0]; this.mao = this.rnd() < 0.5 ? 0 : 1; this.over = false; this.winner = -1; this.hands = 0; }
  Truco.prototype.newHand = function () {
    this.hands++; this.mao = 1 - this.mao; var d = shuffle(truDeck(), this.rnd); this.vira = d.pop();
    this.manilha = TORD[(TORD.indexOf(this.vira.r) + 1) % TORD.length];
    this.cards = [[d.pop(), d.pop(), d.pop()], [d.pop(), d.pop(), d.pop()]]; this.table = [null, null]; this.rounds = []; this.value = 1; this.lastRaiser = -1; this.pending = null; this.turn = this.mao; this.lead = this.mao; this.handOver = false; this.handRes = null; this.log = null;
  };
  Truco.prototype.power = function (c) { return c.r === this.manilha ? 100 + c.s : TORD.indexOf(c.r); };
  Truco.prototype.play = function (p, i) {
    if (this.handOver || this.pending || p !== this.turn || !this.cards[p][i]) return false;
    this.table[p] = this.cards[p].splice(i, 1)[0];
    if (this.table[1 - p]) this.endRound(); else this.turn = 1 - p;
    return true;
  };
  Truco.prototype.endRound = function () {
    var a = this.power(this.table[0]), b = this.power(this.table[1]), w = a > b ? 0 : (b > a ? 1 : -1);
    this.rounds.push(w); this.roundCards = [this.table[0], this.table[1]]; this.table = [null, null];
    var r = this.rounds, res = null, n = r.length;
    if (n === 2) {
      if (r[0] !== -1 && (r[1] === r[0] || r[1] === -1)) res = r[0];
      else if (r[0] === -1 && r[1] !== -1) res = r[1];
    } else if (n === 3) { res = r[2] !== -1 ? r[2] : (r[0] !== -1 ? r[0] : this.mao); }
    if (res !== null) { this.endHand(res, false); return; }
    this.turn = w === -1 ? this.mao : w; this.lead = this.turn;
  };
  Truco.prototype.endHand = function (w, ran) {
    this.handOver = true; this.handRes = { w: w, pts: this.value, ran: ran }; this.score[w] += this.value; this.pending = null;
    if (this.score[w] >= this.target) { this.over = true; this.winner = w; }
  };
  var NEXTV = { 1: 3, 3: 6, 6: 9, 9: 12 };
  Truco.prototype.canCall = function (p) { return !this.handOver && !this.pending && this.turn === p && this.value < 12 && this.lastRaiser !== p; };
  Truco.prototype.call = function (p) { if (!this.canCall(p)) return false; this.pending = { from: p, to: NEXTV[this.value] }; return true; };
  Truco.prototype.respond = function (p, r) {
    if (!this.pending || this.pending.from === p || this.handOver) return false;
    var pd = this.pending;
    if (r === 'run') { this.pending = null; this.endHand(pd.from, true); return true; }
    this.value = pd.to; this.lastRaiser = pd.from; this.pending = null;
    if (r === 'raise') { if (this.value >= 12) return true; this.lastRaiser = p; this.pending = { from: p, to: NEXTV[this.value] }; }
    return true;
  };
  Truco.prototype.handStrength = function (p) {
    var self = this, cs = this.cards[p].concat(this.table[p] ? [this.table[p]] : []); var pw = cs.map(function (c) { return self.power(c); }).sort(function (a, b) { return b - a; });
    var s = 0; pw.forEach(function (x, i) { var v = x >= 100 ? 0.55 + (x - 100) * 0.1 : x / 9 * 0.4; s += v * [0.5, 0.3, 0.2][i]; }); return s;
  };
  Truco.prototype.aiRespond = function (p) {
    var s = this.handStrength(p), w = 0; this.rounds.forEach(function (x) { if (x === p) w++; else if (x === 1 - p) w--; });
    s += w * 0.12 + (this.rnd() - 0.5) * 0.2; var v = this.pending.to;
    if (s > 0.62 && v < 12 && this.rnd() < 0.35) return 'raise';
    if (s > 0.36 - (v >= 9 ? 0 : 0.04) + (v - 3) * 0.015) return 'accept';
    return 'run';
  };
  Truco.prototype.aiMove = function (p) {
    // retorna {t:'call'} | {t:'play', i}
    var s = this.handStrength(p), cs = this.cards[p], self = this, opp = this.table[1 - p], won = 0;
    this.rounds.forEach(function (x) { if (x === p) won++; });
    if (this.canCall(p) && this.value < 12) { var want = (s > 0.6 && this.rnd() < 0.5) || (s > 0.5 && won >= 1 && this.rnd() < 0.5) || this.rnd() < 0.04; if (want && this.score[1 - p] < this.target - 1 + 1) return { t: 'call' }; }
    var idx = cs.map(function (c, i) { return { i: i, pw: self.power(c) }; }).sort(function (a, b) { return a.pw - b.pw; });
    if (opp) { var opw = this.power(opp), win = idx.filter(function (x) { return x.pw > opw; }); if (win.length) return { t: 'play', i: win[0].i }; return { t: 'play', i: idx[0].i }; }
    if (this.rounds.length === 0) return { t: 'play', i: s > 0.5 ? idx[idx.length - 1].i : idx[Math.floor(idx.length / 2)].i };
    return { t: 'play', i: idx[idx.length - 1].i };
  };

  /* ---------- BLACKJACK ---------- */
  function bjVal(h) { var t = 0, a = 0; h.forEach(function (c) { if (c.r === 14) { a++; t += 11; } else t += c.r >= 10 ? 10 : c.r; }); while (t > 21 && a > 0) { t -= 10; a--; } return t; }
  function Blackjack(opts) { opts = opts || {}; this.rnd = opts.rnd || Math.random; this.chips = opts.chips || 500; this.phase = 'bet'; this.shoe = []; }
  Blackjack.prototype.draw = function () { if (this.shoe.length < 20) { this.shoe = []; for (var i = 0; i < 4; i++) this.shoe = this.shoe.concat(deck52()); shuffle(this.shoe, this.rnd); } return this.shoe.pop(); };
  Blackjack.prototype.start = function (bet) {
    if (this.phase !== 'bet' || bet < 1 || bet > this.chips) return false;
    this.bet = bet; this.chips -= bet; this.player = [this.draw(), this.draw()]; this.dealer = [this.draw(), this.draw()]; this.doubled = false; this.res = null; this.phase = 'play';
    var pb = bjVal(this.player) === 21, db = bjVal(this.dealer) === 21;
    if (pb || db) this.settle(pb && db ? 'push' : (pb ? 'blackjack' : 'lose')); return true;
  };
  Blackjack.prototype.hit = function () { if (this.phase !== 'play') return; this.player.push(this.draw()); var v = bjVal(this.player); if (v > 21) this.settle('lose'); else if (v === 21) this.stand(); };
  Blackjack.prototype.canDouble = function () { return this.phase === 'play' && this.player.length === 2 && this.chips >= this.bet; };
  Blackjack.prototype.dbl = function () { if (!this.canDouble()) return; this.chips -= this.bet; this.bet *= 2; this.doubled = true; this.player.push(this.draw()); if (bjVal(this.player) > 21) this.settle('lose'); else this.stand(); };
  Blackjack.prototype.stand = function () {
    if (this.phase !== 'play') return; while (bjVal(this.dealer) < 17) this.dealer.push(this.draw());
    var p = bjVal(this.player), d = bjVal(this.dealer); this.settle(d > 21 || p > d ? 'win' : (p === d ? 'push' : 'lose'));
  };
  Blackjack.prototype.settle = function (r) {
    this.res = r; this.phase = 'bet';
    if (r === 'win') this.chips += this.bet * 2; else if (r === 'push') this.chips += this.bet; else if (r === 'blackjack') this.chips += Math.floor(this.bet * 2.5);
  };

  root.Cards = { Poker: Poker, Truco: Truco, Blackjack: Blackjack, bjVal: bjVal, best7: best7, eval5: eval5, catOf: catOf, CATN: CATN, SUITS: SUITS, rname: rname };
})(typeof window !== 'undefined' ? window : globalThis);
