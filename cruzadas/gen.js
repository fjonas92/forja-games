/* Gerador de palavras cruzadas (sem graficos), testavel em node. */
(function (root) {
  var BANK = [
    // Brasil
    ['SALVADOR', 'Capital da Bahia'], ['BRASILIA', 'Capital federal do Brasil'], ['AMAZONAS', 'Maior estado do Brasil'], ['CARNAVAL', 'Festa popular de fevereiro'], ['FAROFA', 'Acompanha a feijoada, feita de mandioca'],
    ['CAPOEIRA', 'Luta e dança de origem afro-brasileira'], ['SAMBA', 'Ritmo típico do carnaval'], ['PELE', 'Rei do futebol'], ['PANTANAL', 'Maior planície alagada do mundo'], ['CAJU', 'Fruta com a castanha do lado de fora'],
    ['ACAI', 'Fruta roxa do Norte, servida na tigela'], ['TAPIOCA', 'Beiju de goma de mandioca'], ['MANDIOCA', 'Também chamada de aipim ou macaxeira'], ['PELOURINHO', 'Centro histórico de Salvador'], ['IPE', 'Árvore de flores amarelas, símbolo nacional'],
    ['SERTAO', 'Região seca do Nordeste'], ['JANGADA', 'Barco simples de pescadores nordestinos'], ['BERIMBAU', 'Instrumento de um arco só usado na capoeira'], ['FORRO', 'Dança de São João'], ['CANGACO', 'Banditismo do sertão, de Lampião'],
    // animais
    ['ONCA', 'Felino pintado, o maior das Américas'], ['ARARA', 'Ave colorida que imita sons'], ['TUCANO', 'Ave de bico grande e colorido'], ['JACARE', 'Réptil que vive nos rios'], ['BOTO', 'Golfinho do rio Amazonas'],
    ['TATU', 'Animal que se enrola em uma bola'], ['PREGUICA', 'Animal lentíssimo que vive nas árvores'], ['CAPIVARA', 'Maior roedor do mundo'], ['LOBO', 'Parente selvagem do cachorro'], ['GIRAFA', 'Tem o pescoço mais longo'],
    ['ELEFANTE', 'Maior animal terrestre'], ['GOLFINHO', 'Mamífero marinho inteligente'], ['TARTARUGA', 'Carrega a casa nas costas'], ['BORBOLETA', 'Era lagarta antes'], ['COELHO', 'Orelhudo que adora cenoura'],
    ['LEAO', 'Rei da selva'], ['MACACO', 'Primata que pula de galho em galho'], ['PINGUIM', 'Ave que não voa e vive no gelo'], ['CAVALO', 'Animal de montaria'], ['GALINHA', 'Bota ovos na fazenda'],
    // comida
    ['FEIJOADA', 'Prato com feijão preto e carnes'], ['PIZZA', 'Comida italiana redonda'], ['BRIGADEIRO', 'Doce de festa infantil'], ['CHURRASCO', 'Carne na brasa'], ['PAO', 'Feito de farinha, vai à mesa no café'],
    ['QUEIJO', 'Derivado do leite'], ['BANANA', 'Fruta amarela dos macacos'], ['LARANJA', 'Fruta cítrica, rica em vitamina C'], ['MORANGO', 'Fruta vermelha com sementes por fora'], ['MELANCIA', 'Fruta grande, verde por fora e vermelha por dentro'],
    ['TOMATE', 'Vermelho, serve para fazer molho'], ['CENOURA', 'Raiz laranja que coelhos adoram'], ['ARROZ', 'Grão que combina com feijão'], ['CHOCOLATE', 'Doce feito de cacau'], ['SORVETE', 'Sobremesa gelada'],
    // esportes e jogos
    ['FUTEBOL', 'Esporte mais popular do Brasil'], ['GOLEIRO', 'Defende o gol'], ['PEBOLIM', 'Jogo de mesa com bonecos em barras'], ['BASQUETE', 'Esporte da cesta'], ['VOLEI', 'Esporte com rede e bola leve'],
    ['NATACAO', 'Esporte aquático de piscina'], ['XADREZ', 'Jogo de tabuleiro com rei e rainha'], ['TRUCO', 'Jogo de cartas de blefe e gritos'], ['DAMAS', 'Jogo de tabuleiro com peças redondas'], ['CORRIDA', 'Esporte de velocidade'],
    ['TENIS', 'Esporte de raquete e quadra'], ['JUDO', 'Arte marcial japonesa'], ['SURFE', 'Esporte de ondas'], ['GOL', 'Vibração do futebol'], ['COPA', 'Torneio mundial de seleções'],
    // natureza
    ['FLORESTA', 'Mata densa'], ['MONTANHA', 'Grande elevação de terra'], ['VULCAO', 'Montanha que expele lava'], ['OCEANO', 'Maior que o mar'], ['CACHOEIRA', 'Queda d’água'],
    ['ARCOIRIS', 'Aparece depois da chuva com sol'], ['TROVAO', 'Barulho do raio'], ['NUVEM', 'Flutua no céu e traz a chuva'], ['PRAIA', 'Areia e mar'], ['DESERTO', 'Lugar seco e de muita areia'],
    ['ESTRELA', 'Brilha à noite'], ['PLANETA', 'Terra, Marte, Vênus'], ['LUA', 'Satélite natural da Terra'], ['SOL', 'Nossa estrela'], ['ILHA', 'Terra cercada de água'],
    // tecnologia
    ['TECLADO', 'Tem letras e fica em frente ao monitor'], ['INTERNET', 'Rede mundial de computadores'], ['CELULAR', 'Telefone que cabe no bolso'], ['PROGRAMA', 'Software'], ['SENHA', 'Segredo para entrar na conta'],
    ['JOGO', 'Diversão no Falzinho Games'], ['MOUSE', 'Dispositivo que move a setinha'], ['SITE', 'Página na internet'], ['PIXEL', 'Menor ponto de uma imagem'], ['ROBO', 'Máquina que imita ações humanas'],
    ['PYTHON', 'Linguagem de programação com nome de cobra'], ['LOGIN', 'Entrar na conta'], ['VIDEO', 'Imagens em movimento'], ['MUSICA', 'Arte dos sons'], ['FILME', 'Obra do cinema']
  ];

  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function tentar(words, r) {
    var cells = {}, placed = [];
    function key(x, y) { return x + ',' + y; }
    function can(w, x, y, dx, dy) {
      var i, cx, cy, cross = 0;
      if (cells[key(x - dx, y - dy)] || cells[key(x + dx * w.length, y + dy * w.length)]) return -1;
      for (i = 0; i < w.length; i++) {
        cx = x + dx * i; cy = y + dy * i; var c = cells[key(cx, cy)];
        if (c) { if (c !== w[i]) return -1; cross++; if (placed.some(function (p) { return p.dx === dx && ((dx && p.y === cy && cx >= p.x && cx < p.x + p.w.length) || (dy && p.x === cx && cy >= p.y && cy < p.y + p.w.length)); })) return -1; }
        else { // vizinhos laterais precisam estar vazios
          if (cells[key(cx + dy, cy + dx)] || cells[key(cx - dy, cy - dx)]) return -1;
        }
      }
      return cross;
    }
    var first = words[0];
    placed.push({ w: first[0], clue: first[1], x: 0, y: 0, dx: 1, dy: 0 });
    for (var i = 0; i < first[0].length; i++) cells[key(i, 0)] = first[0][i];
    for (var wi = 1; wi < words.length; wi++) {
      var w = words[wi][0], best = null, bs = -1, opts = [];
      for (var pi = 0; pi < placed.length; pi++) {
        var p = placed[pi], ndx = p.dx ? 0 : 1, ndy = p.dx ? 1 : 0;
        for (var a = 0; a < p.w.length; a++) for (var b = 0; b < w.length; b++) if (p.w[a] === w[b]) {
          var x = p.x + p.dx * a - ndx * b, y = p.y + p.dy * a - ndy * b, cr = can(w, x, y, ndx, ndy);
          if (cr >= 1) opts.push({ x: x, y: y, dx: ndx, dy: ndy, s: cr + r() * 0.5 });
        }
      }
      opts.forEach(function (o) { if (o.s > bs) { bs = o.s; best = o; } });
      if (best) {
        placed.push({ w: w, clue: words[wi][1], x: best.x, y: best.y, dx: best.dx, dy: best.dy });
        for (var k = 0; k < w.length; k++) cells[key(best.x + best.dx * k, best.y + best.dy * k)] = w[k];
      }
    }
    return placed;
  }

  function gerar(seed, alvo) {
    alvo = alvo || 14; var r = rng(seed), bestP = null, bs = -1e9;
    for (var tr = 0; tr < 250; tr++) {
      var pool = shuffle(BANK, r).slice(0, 34).sort(function (a, b) { return b[0].length - a[0].length; });
      var pl = tentar(pool, r).slice(0, alvo);
      var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      pl.forEach(function (p) { minx = Math.min(minx, p.x); miny = Math.min(miny, p.y); maxx = Math.max(maxx, p.x + p.dx * (p.w.length - 1)); maxy = Math.max(maxy, p.y + p.dy * (p.w.length - 1)); });
      var w = maxx - minx + 1, h = maxy - miny + 1, n = pl.length;
      var score = n * 10 - Math.max(w, h) * 6 - Math.abs(w - h) * 2 + (w <= 15 && h <= 15 ? 20 : -50);
      if (score > bs) { bs = score; bestP = { pl: pl, minx: minx, miny: miny, w: w, h: h }; }
    }
    var pl2 = bestP.pl.slice(0, Math.max(alvo, 1)); // mantem as primeiras (as maiores e as que cruzam)
    // recalcula caixa
    var minx2 = 1e9, miny2 = 1e9, maxx2 = -1e9, maxy2 = -1e9;
    pl2.forEach(function (p) { minx2 = Math.min(minx2, p.x); miny2 = Math.min(miny2, p.y); maxx2 = Math.max(maxx2, p.x + p.dx * (p.w.length - 1)); maxy2 = Math.max(maxy2, p.y + p.dy * (p.w.length - 1)); });
    var W = maxx2 - minx2 + 1, H = maxy2 - miny2 + 1;
    var grid = []; for (var y = 0; y < H; y++) { grid.push(new Array(W).fill('')); }
    // filtra palavras que perderam o cruzamento (ficaram soltas)
    var words = pl2.map(function (p, i) { return { id: i, w: p.w, clue: p.clue, x: p.x - minx2, y: p.y - miny2, dir: p.dx ? 'A' : 'D' }; });
    words.forEach(function (p) { for (var k = 0; k < p.w.length; k++) grid[p.y + (p.dir === 'D' ? k : 0)][p.x + (p.dir === 'A' ? k : 0)] = p.w[k]; });
    // numeracao
    var num = {}, n = 0;
    words.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; }).forEach(function (p) { var k = p.x + ',' + p.y; if (!num[k]) num[k] = ++n; p.n = num[k]; });
    return { W: W, H: H, grid: grid, words: words, seed: seed };
  }
  root.Cruz = { gerar: gerar, BANK: BANK };
})(typeof window !== 'undefined' ? window : globalThis);
