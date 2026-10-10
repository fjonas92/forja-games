/* Logica da Minha Fazendinha (sem graficos), testavel em node. */
(function (root) {
  var MW = 30, MH = 22, T = 48;
  var CROPS = {
    trigo: { nome: 'Trigo', dias: 2, compra: 8, venda: 22, cor: '#e8c24a' },
    milho: { nome: 'Milho', dias: 3, compra: 15, venda: 40, cor: '#f2d23c' },
    tomate: { nome: 'Tomate', dias: 4, compra: 25, venda: 68, cor: '#e8402f' },
    morango: { nome: 'Morango', dias: 5, compra: 50, venda: 130, cor: '#ff5c8a' }
  };
  var OVO = 14;
  // tipos de tile: 0 grama, 1 agua, 2 arvore, 3 casa, 4 loja, 5 caminho, 6 cerca, 7 porta, 8 balcao
  function buildMap() {
    var m = new Array(MW * MH).fill(0), i, x, y;
    function set(x, y, v) { if (x >= 0 && y >= 0 && x < MW && y < MH) m[y * MW + x] = v; }
    for (x = 0; x < MW; x++) { set(x, 0, 2); set(x, MH - 1, 2); if (x % 2 === 0) { set(x, 1, 2); set(x, MH - 2, 2); } }
    for (y = 0; y < MH; y++) { set(0, y, 2); set(MW - 1, y, 2); if (y % 2 === 0) { set(1, y, 2); set(MW - 2, y, 2); } }
    for (y = 2; y <= 4; y++) for (x = 3; x <= 7; x++) set(x, y, 3);
    for (y = 2; y <= 4; y++) for (x = 22; x <= 26; x++) set(x, y, 4);
    for (x = 5; x <= 24; x++) set(x, 6, 5);
    for (y = 6; y <= 6; y++) { set(5, y, 5); set(24, y, 5); }
    set(5, 5, 7); set(24, 5, 8);
    // lagoa
    for (y = 14; y <= 19; y++) for (x = 22; x <= 27; x++) { var dx = (x - 24.5) / 3.2, dy = (y - 16.5) / 3.0; if (dx * dx + dy * dy <= 1) set(x, y, 1); }
    // algumas arvores soltas
    var tr = [[4, 9], [3, 12], [5, 16], [9, 19], [18, 19], [20, 18], [27, 9], [28, 12], [3, 17]];
    tr.forEach(function (p) { set(p[0], p[1], 2); });
    // cerca do galinheiro
    for (x = 10; x <= 15; x++) { set(x, 2, 6); set(x, 4, 6); }
    set(10, 3, 6); set(15, 3, 6);
    return m;
  }
  var MAP = buildMap();
  function solid(t) { return t === 1 || t === 2 || t === 3 || t === 4 || t === 6 || t === 7 || t === 8; }

  function novo() {
    return { v: 1, dia: 1, hora: 6, ouro: 60, agua: 12, maxAgua: 12, chuva: false,
      sementes: { trigo: 5, milho: 3, tomate: 0, morango: 0 }, colheita: { trigo: 0, milho: 0, tomate: 0, morango: 0 }, ovos: 0,
      solo: {}, plantas: {}, galinhas: [{ x: 11.5, y: 3.5, ovo: false }, { x: 13.5, y: 3.5, ovo: false }, { x: 12.5, y: 3.2, ovo: false }],
      px: 6 * T, py: 7.2 * T, ganho: 0, t: Date.now() };
  }
  function idx(x, y) { return y * MW + x; }
  function tipo(x, y) { return x < 0 || y < 0 || x >= MW || y >= MH ? 2 : MAP[idx(x, y)]; }

  // acoes: devolve {ok, msg}
  function arar(s, x, y) {
    if (tipo(x, y) !== 0) return { ok: false, msg: 'Aqui não dá para arar.' };
    var k = idx(x, y); if (s.solo[k]) return { ok: false, msg: 'Já está arado.' };
    s.solo[k] = 1; return { ok: true, sfx: 'dig' };
  }
  function regar(s, x, y) {
    var t = tipo(x, y);
    if (t === 1) { s.agua = s.maxAgua; return { ok: true, msg: 'Regador cheio!', sfx: 'splash' }; }
    var k = idx(x, y);
    if (!s.solo[k]) return { ok: false, msg: 'Ara a terra primeiro.' };
    if (s.solo[k] === 2) return { ok: false, msg: 'Já está molhado.' };
    if (s.agua <= 0) return { ok: false, msg: 'Regador vazio. Encha na lagoa.' };
    s.agua--; s.solo[k] = 2; return { ok: true, sfx: 'splash' };
  }
  function plantar(s, x, y, tipoSem) {
    var k = idx(x, y);
    if (!s.solo[k]) return { ok: false, msg: 'Ara a terra antes de plantar.' };
    if (s.plantas[k]) return { ok: false, msg: 'Já tem planta aqui.' };
    if (!s.sementes[tipoSem]) return { ok: false, msg: 'Sem sementes de ' + CROPS[tipoSem].nome.toLowerCase() + '.' };
    s.sementes[tipoSem]--; s.plantas[k] = { t: tipoSem, idade: 0 }; return { ok: true, sfx: 'plant' };
  }
  function pronta(p) { return p && p.idade >= CROPS[p.t].dias; }
  function colher(s, x, y) {
    var k = idx(x, y), p = s.plantas[k];
    if (!p) return { ok: false };
    if (!pronta(p)) return { ok: false, msg: 'Ainda não está pronto.' };
    s.colheita[p.t]++; delete s.plantas[k]; return { ok: true, msg: '+1 ' + CROPS[p.t].nome, sfx: 'pick' };
  }
  function comprar(s, tp, n) {
    var c = CROPS[tp], custo = c.compra * n;
    if (s.ouro < custo) return { ok: false, msg: 'Ouro insuficiente.' };
    s.ouro -= custo; s.sementes[tp] += n; return { ok: true };
  }
  function vender(s, tp) {
    var n, v;
    if (tp === 'ovos') { n = s.ovos; v = n * OVO; s.ovos = 0; }
    else { n = s.colheita[tp]; v = n * CROPS[tp].venda; s.colheita[tp] = 0; }
    s.ouro += v; s.ganho += v; return { ok: n > 0, n: n, v: v };
  }
  function venderTudo(s) {
    var tot = 0, k; for (k in CROPS) tot += vender(s, k).v; tot += vender(s, 'ovos').v; return tot;
  }
  function dormir(s, chuvaProb) {
    var k, p;
    for (k in s.plantas) { p = s.plantas[k]; if (s.solo[k] === 2 || s.chuva) p.idade++; }
    for (k in s.solo) s.solo[k] = 1;
    s.dia++; s.hora = 6; s.agua = s.maxAgua;
    s.chuva = Math.random() < (chuvaProb === undefined ? 0.2 : chuvaProb);
    if (s.chuva) for (k in s.solo) s.solo[k] = 2;
    s.galinhas.forEach(function (g) { g.ovo = true; });
    s.t = Date.now();
  }
  function estagio(p) { var d = CROPS[p.t].dias; return Math.min(3, Math.floor(p.idade / d * 3.999)); }
  function valido(d) { return d && d.v === 1 && d.solo && d.plantas && d.sementes && d.colheita; }
  function solidoPx(px, py) { return solid(tipo(Math.floor(px / T), Math.floor(py / T))); }
  function podeIr(x, y, r) { return !(solidoPx(x - r, y - r) || solidoPx(x + r, y - r) || solidoPx(x - r, y + r) || solidoPx(x + r, y + r)); }

  root.Farm = { MW: MW, MH: MH, T: T, CROPS: CROPS, OVO: OVO, MAP: MAP, novo: novo, tipo: tipo, idx: idx, arar: arar, regar: regar, plantar: plantar, colher: colher, comprar: comprar, vender: vender, venderTudo: venderTudo, dormir: dormir, pronta: pronta, estagio: estagio, valido: valido, podeIr: podeIr, solid: solid };
})(typeof window !== 'undefined' ? window : globalThis);
