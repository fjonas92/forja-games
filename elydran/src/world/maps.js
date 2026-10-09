// Mapas do mundo. Gerados por código com semente fixa, então são sempre iguais
import { rng } from '../utils/math.js';
import { TILE } from '../config.js';
import { PHASES } from '../data/phases.js';

// tipos de chão
export const T = { GRASS: 0, GRASS2: 1, PATH: 2, COBBLE: 3, WATER: 4, SAND: 5, TALL: 6, FLOWER: 7, BRIDGE: 8, STONE: 9, VOID: 10, CLIFF: 11, MOSS: 12 };
export const SOLID_TILES = new Set([T.WATER, T.VOID, T.CLIFF]);

function base(name, w, h, theme, fill) {
  const m = { name, w, h, theme, tiles: new Uint8Array(w * h).fill(fill), objects: [], npcs: [], spawns: [], chests: [], exits: [], saves: [], bushes: [], specials: [] };
  m.get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? T.VOID : m.tiles[y * w + x]);
  m.set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) m.tiles[y * w + x] = t; };
  m.rect = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m.set(x, y, t); };
  m.disc = (cx, cy, r, t) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) m.set(x, y, t); };
  // caminho largo entre pontos (em tiles)
  m.path = (pts, t, wd) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2; for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n; m.disc(x, y, wd, t); } } };
  return m;
}
const tx = t => t * TILE + TILE / 2;
const tree = (m, x, y, kind, seed) => m.objects.push({ type: 'tree', x, y, kind, seed, solid: { x: x - 6, y: y - 6, w: 12, h: 6 } });
// árvores espalhadas onde for grama, sem cobrir caminhos e áreas livres
function scatterTrees(m, r, density, kinds, keepFree) {
  for (let y = 1; y < m.h - 1; y += 2) for (let x = 1; x < m.w - 1; x += 2) {
    if (r() > density) continue;
    const px = x * TILE + r() * TILE * 1.6, py = y * TILE + r() * TILE * 1.6 + 8;
    const cx = Math.floor(px / TILE), cy = Math.floor(py / TILE); let ok = true;
    for (let yy = cy - 1; yy <= cy + 1 && ok; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) { const t = m.get(xx, yy); if (t !== T.GRASS && t !== T.GRASS2 && t !== T.MOSS && t !== T.TALL) { ok = false; break; } }
    if (ok && keepFree.some(([fx, fy, fr]) => (cx - fx) ** 2 + (cy - fy) ** 2 < fr * fr)) ok = false;
    if (ok) tree(m, px, py, kinds[Math.floor(r() * kinds.length)], Math.floor(r() * 9));
  }
}
function border(m, r, kinds, gaps) {
  for (let x = 0; x < m.w; x++) for (const y of [0, m.h - 1]) if (!gaps.some(g => g(x, y))) tree(m, tx(x) + (r() - 0.5) * 6, tx(y) + 10, kinds[Math.floor(r() * kinds.length)], Math.floor(r() * 9));
  for (let y = 1; y < m.h - 1; y++) for (const x of [0, m.w - 1]) if (!gaps.some(g => g(x, y))) tree(m, tx(x) + (r() - 0.5) * 6, tx(y) + 10, kinds[Math.floor(r() * kinds.length)], Math.floor(r() * 9));
  // muro invisível na borda para ninguém sair do mapa por entre as árvores
  for (let x = 0; x < m.w; x++) for (const y of [0, m.h - 1]) if (!gaps.some(g => g(x, y))) m.objects.push({ type: 'block', solid: { x: x * TILE, y: y * TILE, w: TILE, h: TILE } });
  for (let y = 0; y < m.h; y++) for (const x of [0, m.w - 1]) if (!gaps.some(g => g(x, y))) m.objects.push({ type: 'block', solid: { x: x * TILE, y: y * TILE, w: TILE, h: TILE } });
}
function sprinkle(m, r, from, to, chance) { for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === from && r() < chance) m.tiles[i] = to; }

/* ---------- Vila Aurora ---------- */
function village() {
  const m = base('Vila Aurora', 42, 30, 'day', T.GRASS), r = rng(11);
  sprinkle(m, r, T.GRASS, T.GRASS2, 0.35);
  // rio a leste com ponte e lago ao sul
  for (let y = 0; y < m.h; y++) { const x = 33 + Math.round(Math.sin(y * 0.35) * 1.2); m.rect(x - 1, y, x + 1, y, T.WATER); m.set(x - 2, y, T.SAND); m.set(x + 2, y, T.SAND); }
  m.disc(7, 24, 4.2, T.WATER); m.disc(7, 24, 5.2, T.SAND); m.disc(7, 24, 4.2, T.WATER);
  // praça e caminhos
  m.path([[20, 15], [41, 15]], T.PATH, 1.1);
  m.path([[20, 15], [20, 4]], T.PATH, 1); m.path([[20, 15], [8, 15], [8, 9]], T.PATH, 1); m.path([[20, 15], [20, 26]], T.PATH, 1); m.path([[28, 15], [28, 9]], T.PATH, 1);
  m.path([[15, 12], [13, 5]], T.PATH, 1);
  m.rect(15, 11, 25, 19, T.COBBLE);
  for (let y = 14; y <= 16; y++) for (let x = 30; x <= 36; x++) m.set(x, y, x >= 31 && x <= 35 ? T.BRIDGE : T.PATH); // ponte sobre o rio
  sprinkle(m, r, T.GRASS, T.FLOWER, 0.05); sprinkle(m, r, T.GRASS2, T.TALL, 0.05);
  // casas: [tile x, tile y da base, largura, telhado]
  [[18, 7, 6, 'blue', 'Casa do Ancião'], [5, 9, 5, 'red', 'Loja da Lina'], [26, 9, 5, 'gold', 'Forja do Bruno'], [10, 21, 5, 'green', ''], [24, 22, 5, 'red', '']].forEach(([hx, hy, w, roof, label], i) => {
    const x = hx * TILE, y = hy * TILE;
    m.objects.push({ type: 'house', x: x + (w * TILE) / 2, y, wt: w, roof, seed: i, label, solid: { x: x + 4, y: y - 38, w: w * TILE - 8, h: 38 } });
    for (let yy = hy - 3; yy < hy; yy++) for (let xx = hx; xx < hx + w; xx++) if (m.get(xx, yy) === T.PATH || m.get(xx, yy) === T.COBBLE) m.set(xx, yy, T.GRASS);
  });
  m.objects.push({ type: 'fountain', x: tx(20), y: tx(15) + 4, solid: { x: tx(20) - 17, y: tx(15) - 15, w: 34, h: 30 } });
  [[16, 12], [24, 12], [16, 18], [24, 18], [30, 14], [30, 17]].forEach(([a, b]) => m.objects.push({ type: 'lamp', x: tx(a), y: tx(b) + 6, solid: { x: tx(a) - 2, y: tx(b) + 2, w: 4, h: 4 } }));
  m.objects.push({ type: 'sign', x: tx(38), y: tx(13) + 4, text: '→ Floresta de Aurora', solid: { x: tx(38) - 2, y: tx(13), w: 4, h: 4 } });
  [[13, 17], [27, 17], [11, 14], [30, 21], [6, 18]].forEach(([a, b]) => m.bushes.push({ x: tx(a), y: tx(b) + 6, kind: 'berry' }));
  [[34, 10], [4, 14]].forEach(([a, b]) => m.bushes.push({ x: tx(a), y: tx(b) + 6, kind: 'bush' }));
  m.saves.push({ x: tx(24), y: tx(13) + 2 });
  m.npcs.push({ id: 'elder', pal: 'elder', name: 'Ancião Thaleo', x: tx(20), y: tx(9) + 8, dir: 'down', wander: 0 });
  m.npcs.push({ id: 'merchant', pal: 'merchant', name: 'Lina', x: tx(8), y: tx(10) + 10, dir: 'down', wander: 0 });
  m.npcs.push({ id: 'smith', pal: 'smith', name: 'Bruno', x: tx(28), y: tx(10) + 10, dir: 'down', wander: 0 });
  m.npcs.push({ id: 'kid', pal: 'kid', name: 'Mira', x: tx(17), y: tx(17), dir: 'right', wander: 28 });
  m.npcs.push({ id: 'guard', pal: 'guard', name: 'Oren', x: tx(38), y: tx(17) + 4, dir: 'left', wander: 0 });
  // poço gosmento (entrada do chefe da fase 1) e a gosma que bloqueia a ponte até o Slime cair
  m.objects.push({ type: 'hole', x: tx(13), y: tx(4) + 8, col: '#58d98a', label: 'Poço Gosmento' });
  m.objects.push({ type: 'gate', style: 'goo', flag: 'slimeDown', x: tx(36), y: tx(15) + 14, solid: { x: 36 * TILE, y: 13 * TILE + 8, w: 16, h: 52 } });
  m.exits.push({ rect: { x: tx(13) - 12, y: tx(4) - 2, w: 24, h: 14 }, to: 'slimepit', tx: tx(13), ty: tx(15), needStep: 'pit', msg: 'Antes de descer ao poço, fale com o Ancião e se prepare.' });
  border(m, r, ['green', 'green', 'autumn', 'pine'], [(x, y) => x === m.w - 1 && y >= 14 && y <= 16]);
  scatterTrees(m, r, 0.22, ['green', 'autumn', 'green', 'pine'], [[20, 15, 9], [8, 12, 5], [28, 12, 5], [20, 6, 4], [13, 5, 3], [12, 22, 5], [26, 22, 5], [36, 15, 4], [7, 24, 7]]);
  m.exits.push({ rect: { x: (m.w - 1) * TILE + 6, y: 14 * TILE, w: 10, h: 3 * TILE }, to: 'forest', tx: tx(1) + 6, ty: tx(24) });
  m.start = { x: tx(21), y: tx(11) };
  return m;
}

/* ---------- Floresta de Aurora ---------- */
function forest() {
  const m = base('Floresta de Aurora', 66, 50, 'forest', T.GRASS2), r = rng(29);
  sprinkle(m, r, T.GRASS2, T.MOSS, 0.3); sprinkle(m, r, T.GRASS2, T.GRASS, 0.2);
  // lagos
  m.disc(54, 31, 5.5, T.SAND); m.disc(54, 31, 4.6, T.WATER); m.disc(57, 28, 3, T.WATER);
  m.disc(10, 9, 3.6, T.SAND); m.disc(10, 9, 2.8, T.WATER);
  // trilhas
  m.path([[0, 24], [9, 24], [16, 20], [24, 24], [33, 24]], T.PATH, 1);
  m.path([[33, 24], [33, 14], [33, 4]], T.PATH, 1);
  m.path([[33, 24], [42, 27], [47, 30]], T.PATH, 0.9);
  m.path([[24, 24], [22, 34], [16, 40]], T.PATH, 0.9);
  m.path([[33, 14], [46, 11], [52, 10]], T.PATH, 0.9);
  m.path([[9, 24], [9, 14]], T.PATH, 0.8);
  // clareiras
  m.disc(33, 4, 4.5, T.STONE); m.disc(52, 10, 4.5, T.MOSS); m.disc(16, 40, 4.5, T.GRASS); m.disc(8, 24, 3.4, T.GRASS); m.disc(33, 24, 3, T.GRASS);
  sprinkle(m, r, T.GRASS2, T.TALL, 0.06); sprinkle(m, r, T.GRASS, T.FLOWER, 0.04);
  border(m, r, ['dark', 'pine', 'dark', 'green'], [(x, y) => x === 0 && y >= 23 && y <= 25, (x, y) => y === 0 && x >= 31 && x <= 35]);
  scatterTrees(m, r, 0.48, ['dark', 'green', 'pine', 'dark', 'autumn'], [[33, 4, 6], [52, 10, 6], [16, 40, 6], [8, 24, 5], [33, 24, 5], [47, 30, 4], [10, 9, 5], [54, 31, 7]]);
  // ruínas a nordeste
  [[49, 7, 0], [55, 7, 1], [49, 13, 1], [55, 13, 0], [52, 6, 0]].forEach(([a, b, br]) => m.objects.push({ type: 'pillar', x: tx(a), y: tx(b) + 6, broken: !!br, solid: { x: tx(a) - 6, y: tx(b), w: 12, h: 6 } }));
  // selo do santuário (portal) ao norte
  m.objects.push({ type: 'portal', x: tx(33), y: tx(2) + 10, solid: { x: tx(33) - 24, y: tx(2) - 2, w: 10, h: 12 }, solid2: { x: tx(33) + 14, y: tx(2) - 2, w: 10, h: 12 } });
  m.specials.push({ id: 'seal', x: tx(33), y: tx(3) + 4, r: 18 });
  // cogumelos que brilham e pedras
  for (let i = 0; i < 46; i++) { const x = 2 + r() * (m.w - 4), y = 2 + r() * (m.h - 4), t = m.get(Math.floor(x), Math.floor(y)); if (t === T.GRASS2 || t === T.MOSS) m.objects.push({ type: 'glowshroom', x: x * TILE, y: y * TILE, col: r() < 0.3 ? '#a77bff' : '#4dc3ff' }); }
  for (let i = 0; i < 14; i++) { const x = 2 + r() * (m.w - 4), y = 2 + r() * (m.h - 4), t = m.get(Math.floor(x), Math.floor(y)); if (t === T.GRASS2 || t === T.MOSS || t === T.GRASS) m.objects.push({ type: 'rock', x: x * TILE, y: y * TILE, s: 0.8 + r() * 0.5, solid: { x: x * TILE - 7, y: y * TILE - 5, w: 14, h: 5 } }); }
  // baús
  m.chests.push({ id: 'f_chest1', x: tx(16), y: tx(40), items: [['shard', 1], ['potion', 2]] });
  m.chests.push({ id: 'f_chest2', x: tx(52), y: tx(9), items: [['sword_crystal', 1], ['shard', 1]] });
  m.chests.push({ id: 'f_chest3', x: tx(10), y: tx(14), items: [['ether', 2], ['berry', 2]] });
  [[12, 27], [27, 21], [38, 28], [20, 37], [44, 12], [30, 10]].forEach(([a, b]) => m.bushes.push({ x: tx(a), y: tx(b) + 6, kind: 'berry' }));
  m.saves.push({ x: tx(6), y: tx(22) });
  m.npcs.push({ id: 'laylla', pal: 'laylla', name: 'Laylla', x: tx(5), y: tx(26), dir: 'right', wander: 0 });
  // inimigos: [tipo, tile x, tile y, especial]
  [['gotalim', 14, 24], ['gotalim', 19, 21], ['gotalim', 26, 26], ['fungo', 30, 20], ['fungo', 36, 26], ['gotalim', 9, 18],
   ['fungo', 31, 12], ['lobo', 35, 9], ['fungo', 44, 13], ['lobo', 50, 11], ['gotalim', 22, 32], ['fungo', 19, 36], ['lobo', 15, 42, 'shard'],
   ['gotalim', 40, 28], ['fungo', 27, 40], ['lobo', 40, 18]].forEach(([k, a, b, sp]) => m.spawns.push({ kind: k, x: tx(a), y: tx(b), special: sp || null }));
  // Cristarta presa perto do lago leste, cercada de Gotalins
  m.specials.push({ id: 'trapped', x: tx(48), y: tx(31) + 2, r: 16 });
  [[46, 29], [50, 29], [46, 33], [50, 33]].forEach(([a, b]) => m.spawns.push({ kind: 'gotalim', x: tx(a), y: tx(b), special: 'guard_cristarta' }));
  m.exits.push({ rect: { x: 0, y: 23 * TILE, w: 6, h: 3 * TILE }, to: 'village', tx: tx(40) - 6, ty: tx(15) });
  m.exits.push({ rect: { x: 31 * TILE, y: 0, w: 5 * TILE, h: 6 }, to: 'sanctuary', tx: tx(13), ty: tx(16), needStep: 'thorn', msg: 'Uma barreira de espinhos bloqueia a entrada. Reúna 3 Fragmentos de Cristal.' });
  // escadaria das Ruínas Esquecidas, selada até o Guardião Espinheiro cair
  m.objects.push({ type: 'hole', x: tx(52), y: tx(12) + 8, col: '#ffb03a', label: 'Ruínas Esquecidas' });
  m.exits.push({ rect: { x: tx(52) - 12, y: tx(12) - 2, w: 24, h: 14 }, to: 'ruins', tx: tx(22), ty: tx(32), needFlag: 'thornDown', msg: 'Uma escadaria antiga... coberta de espinhos. O guardião ainda vive.' });
  m.start = { x: tx(2), y: tx(24) };
  return m;
}

/* ---------- Santuário do Cristal (arena do chefe) ---------- */
function sanctuary() {
  const m = base('Santuário Espinhoso', 26, 19, 'sanctuary', T.VOID), r = rng(7);
  m.disc(13, 9.5, 8.8, T.STONE); m.rect(11, 15, 15, 18, T.STONE);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.STONE && r() < 0.12) m.tiles[i] = T.COBBLE;
  [[7, 4], [19, 4], [5, 10], [21, 10], [7, 15], [19, 15]].forEach(([a, b], i) => m.objects.push({ type: 'pillar', x: tx(a), y: tx(b) + 6, broken: i % 3 === 2, solid: { x: tx(a) - 6, y: tx(b), w: 12, h: 6 } }));
  m.objects.push({ type: 'bigcrystal', x: tx(13), y: tx(2) + 10, solid: { x: tx(13) - 16, y: tx(2) - 4, w: 32, h: 14 } });
  m.spawns.push({ kind: 'espinheiro', x: tx(13), y: tx(8), special: 'boss', flag: 'thornDown' });
  m.exits.push({ rect: { x: 11 * TILE, y: m.h * TILE - 6, w: 5 * TILE, h: 6 }, to: 'forest', tx: tx(33), ty: tx(6), lockDuringBoss: true });
  m.start = { x: tx(13), y: tx(16) };
  return m;
}


/* ---------- Poço Gosmento (arena do Slime Ancestral, fase 1) ---------- */
function slimepit() {
  const m = base('Poço Gosmento', 26, 19, 'sanctuary', T.VOID), r = rng(19);
  m.disc(13, 9.5, 8.8, T.STONE); m.rect(11, 15, 15, 18, T.STONE);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.STONE && r() < 0.14) m.tiles[i] = T.MOSS;
  [[6, 7], [20, 7], [5, 12], [21, 12]].forEach(([a, b], i) => m.objects.push({ type: 'rock', x: tx(a), y: tx(b), s: 1.1 + i * 0.1, solid: { x: tx(a) - 7, y: tx(b) - 5, w: 14, h: 5 } }));
  [[8, 5], [18, 5], [4, 9], [22, 9], [8, 14], [18, 14]].forEach(([a, b], i) => m.objects.push({ type: 'pillar', x: tx(a), y: tx(b) + 6, broken: i % 2 === 1, solid: { x: tx(a) - 6, y: tx(b), w: 12, h: 6 } }));
  for (let i = 0; i < 16; i++) { const a = r() * 6.28, d = 3 + r() * 5.5; m.objects.push({ type: 'glowshroom', x: (13 + Math.cos(a) * d) * TILE, y: (9.5 + Math.sin(a) * d * 0.8) * TILE, col: '#58d98a' }); }
  m.objects.push({ type: 'hole', x: tx(13), y: tx(17) + 8, col: '#58d98a', label: 'Subida para a vila', exitOnly: true });
  m.chests.push({ id: 'pit_chest', x: tx(13), y: tx(14), items: [['potion', 2], ['berry', 2]] });
  m.spawns.push({ kind: 'slimeboss', x: tx(13), y: tx(7), special: 'boss', flag: 'slimeDown' });
  m.exits.push({ rect: { x: 11 * TILE, y: m.h * TILE - 6, w: 5 * TILE, h: 6 }, to: 'village', tx: tx(13), ty: tx(6), lockDuringBoss: true });
  m.start = { x: tx(13), y: tx(16) };
  return m;
}

/* ---------- As Ruínas Esquecidas (fase 3) ---------- */
function ruins() {
  const m = base('Ruínas Esquecidas', 44, 38, 'sanctuary', T.VOID), r = rng(31);
  // salão de entrada, corredor, salão das armadilhas, corredor selado e salão do Cavaleiro
  m.rect(17, 29, 27, 35, T.STONE); m.rect(21, 22, 23, 28, T.STONE); m.rect(14, 13, 30, 21, T.STONE); m.rect(21, 10, 23, 12, T.STONE); m.rect(14, 2, 30, 9, T.STONE);
  // ala oeste (chave) e ala leste (runas, atrás do portão de pedra)
  m.rect(11, 16, 13, 18, T.STONE); m.rect(3, 14, 10, 20, T.STONE); m.rect(31, 16, 33, 18, T.STONE); m.rect(34, 14, 41, 20, T.STONE);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.STONE && r() < 0.16) m.tiles[i] = T.COBBLE;
  const pil = (a, b, br) => m.objects.push({ type: 'pillar', x: tx(a), y: tx(b) + 6, broken: !!br, solid: { x: tx(a) - 6, y: tx(b), w: 12, h: 6 } });
  [[18, 30], [26, 30], [18, 34, 1], [26, 34]].forEach(([a, b, br]) => pil(a, b, br));
  [[15, 14], [29, 14], [15, 20, 1], [29, 20], [22, 17]].forEach(([a, b, br]) => pil(a, b, br));
  [[15, 3], [29, 3], [15, 8, 1], [29, 8], [22, 3]].forEach(([a, b, br]) => pil(a, b, br));
  [[4, 15], [10, 19, 1]].forEach(([a, b, br]) => pil(a, b, br)); [[35, 15], [40, 19, 1]].forEach(([a, b, br]) => pil(a, b, br));
  [[20, 31], [24, 31], [16, 15], [28, 15], [16, 4], [28, 4]].forEach(([a, b]) => m.objects.push({ type: 'lamp', x: tx(a), y: tx(b) + 6, solid: { x: tx(a) - 2, y: tx(b) + 2, w: 4, h: 4 } }));
  for (let i = 0; i < 18; i++) { const x = 3 + r() * 38, y = 3 + r() * 32, t = m.get(Math.floor(x), Math.floor(y)); if (t === T.STONE || t === T.COBBLE) m.objects.push({ type: 'glowshroom', x: x * TILE, y: y * TILE, col: r() < 0.5 ? '#ffb03a' : '#a77bff' }); }
  // armadilhas de espinhos no salão central: ligam e desligam em ritmo
  let k = 0;
  for (let y = 14; y <= 20; y++) for (let x = 15; x <= 29; x++) { if ((x + y * 2) % 5 === 0 && !(x === 22 && y === 17) && Math.abs(x - 22) > 1) m.objects.push({ type: 'spikes', x: tx(x), y: tx(y) + 8, off: (k++ % 4) * 0.75 }); }
  // portões: o leste abre com a chave, o norte com as runas
  m.objects.push({ type: 'gate', style: 'stone', flag: 'gate_a', id: 'gate_a', x: tx(32), y: tx(18) + 8, solid: { x: 32 * TILE, y: 16 * TILE, w: 16, h: 48 } });
  m.objects.push({ type: 'gate', style: 'stone', flag: 'gate_b', id: 'gate_b', x: tx(22), y: tx(11) + 8, solid: { x: 21 * TILE, y: 11 * TILE, w: 48, h: 16 } });
  // runas (o jogador ativa na ordem azul, vermelha, verde) e a tábua com a dica
  [['#4dc3ff', 36], ['#7ad94a', 38], ['#ff5a4a', 40]].forEach(([col, a], i) => {
    m.objects.push({ type: 'rune', x: tx(a), y: tx(16) + 6, col, idx: i, solid: { x: tx(a) - 5, y: tx(16), w: 10, h: 6 } });
    m.specials.push({ id: 'rune', idx: i, col, x: tx(a), y: tx(16) + 6, r: 18 });
  });
  m.objects.push({ type: 'tablet', x: tx(38), y: tx(19) + 4, solid: { x: tx(38) - 6, y: tx(19), w: 12, h: 4 } });
  m.specials.push({ id: 'talk', talk: 'tablet_runes', x: tx(38), y: tx(19) + 4, r: 22, label: 'Ler' });
  m.objects.push({ type: 'tablet', x: tx(22), y: tx(2) + 12, solid: { x: tx(22) - 6, y: tx(2) + 8, w: 12, h: 4 } });
  m.specials.push({ id: 'talk', talk: 'tablet_clue', x: tx(22), y: tx(2) + 12, r: 22, label: 'Ler', needFlag: 'knightDown' });
  // baús e inimigos
  m.chests.push({ id: 'r_key', x: tx(5), y: tx(16), items: [['key_ruin', 1]] });
  m.chests.push({ id: 'r_chest2', x: tx(40), y: tx(15), items: [['ether', 2], ['potion', 2]] });
  m.chests.push({ id: 'r_chest3', x: tx(16), y: tx(5), items: [['potion', 3]] });
  m.saves.push({ x: tx(22), y: tx(33) }); m.saves.push({ x: tx(22), y: tx(20) });
  m.npcs.push({ id: 'laylla', pal: 'laylla', name: 'Laylla', x: tx(24), y: tx(33), dir: 'left', wander: 0 });
  [['fungo', 19, 32], ['fungo', 25, 32], ['lobo', 18, 16], ['gotalim', 27, 18], ['fungo', 22, 14], ['lobo', 26, 20], ['gotalim', 6, 15], ['gotalim', 8, 18], ['lobo', 6, 19], ['fungo', 9, 15],
   ['fungo', 37, 18], ['gotalim', 40, 18], ['lobo', 36, 14]].forEach(([kd, a, b]) => m.spawns.push({ kind: kd, x: tx(a), y: tx(b) }));
  m.spawns.push({ kind: 'cavaleiro', x: tx(22), y: tx(6), special: 'boss', flag: 'knightDown' });
  m.objects.push({ type: 'hole', x: tx(26), y: tx(4) + 8, col: '#9fe8ff', label: 'Descida para as Montanhas de Gelo', exitOnly: true });
  m.exits.push({ rect: { x: 25 * TILE, y: 3 * TILE, w: 2 * TILE, h: 2 * TILE }, to: 'p4', needFlag: 'knightDown', msg: 'Uma passagem se abrirá quando o Cavaleiro cair.', lockDuringBoss: true });
  m.exits.push({ rect: { x: 21 * TILE, y: 36 * TILE - 8, w: 3 * TILE, h: 6 }, to: 'forest', tx: tx(52), ty: tx(14), lockDuringBoss: true });
  m.start = { x: tx(22), y: tx(32) };
  return m;
}

/* ---------- Fases 4 a 15: geradas a partir de data/phases.js ---------- */
const WALKABLE = new Set([T.GRASS, T.GRASS2, T.PATH, T.COBBLE, T.SAND, T.TALL, T.FLOWER, T.BRIDGE, T.STONE, T.MOSS]);
// acha um ponto livre (tile andável, sem objeto sólido por perto, longe de pontos proibidos)
function freeSpot(m, r, x0, y0, x1, y1, avoid, tiles) {
  for (let i = 0; i < 300; i++) {
    const cx = Math.floor(x0 + r() * (x1 - x0 + 1)), cy = Math.floor(y0 + r() * (y1 - y0 + 1));
    const t = m.get(cx, cy); if (tiles ? !tiles.has(t) : !WALKABLE.has(t)) continue;
    const px = cx * TILE + 8, py = cy * TILE + 8;
    if (avoid.some(([ax, ay, ar]) => (cx - ax) ** 2 + (cy - ay) ** 2 < ar * ar)) continue;
    if (m.objects.some(o => o.solid && Math.abs(o.solid.x + o.solid.w / 2 - px) < o.solid.w / 2 + 12 && Math.abs(o.solid.y + o.solid.h / 2 - py) < o.solid.h / 2 + 12)) continue;
    let ok = true; for (let yy = cy - 1; yy <= cy + 1 && ok; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) if (!WALKABLE.has(m.get(xx, yy))) { ok = false; break; }
    if (!ok) continue;
    return [px, py];
  }
  return null;
}
function phaseCommon(m, def, r, zone, avoid, chestZones, lay, saves) {
  const id = def.id;
  // monstros: o número cresce um pouco com a fase
  const n = 11 + Math.min(6, def.n - 4);
  for (let i = 0; i < n; i++) { const p = freeSpot(m, r, ...zone, avoid); if (p) { m.spawns.push({ kind: def.mobs[i % def.mobs.length], x: p[0], y: p[1] }); avoid.push([Math.floor(p[0] / TILE), Math.floor(p[1] / TILE), 2]); } }
  const loot = [[['potion', 2]], [['ether', 2], ['berry', 2]], [['potion', 3], ['ether', 1]]];
  chestZones.forEach((z, i) => { const p = freeSpot(m, r, ...z, avoid); if (p) m.chests.push({ id: id + '_c' + (i + 1), x: p[0], y: p[1], items: loot[i % 3] }); });
  saves.forEach(([a, b]) => m.saves.push({ x: tx(a), y: tx(b) }));
  m.npcs.push({ id: 'laylla', pal: 'laylla', name: 'Laylla', x: tx(lay[0]), y: tx(lay[1]), dir: lay[2] || 'right', wander: 0 });
  m.spawns.push({ kind: def.boss, x: m.bossAt[0], y: m.bossAt[1], special: 'boss', flag: id + 'Down' });
  m.gateFlag = id + '_open'; m.phase = def; m.envMod = def.env || null;
  // portal para a próxima fase (a última fase não tem)
  if (def.n < 15) {
    const [hx, hy] = m.holeAt;
    m.objects.push({ type: 'hole', x: hx, y: hy + 8, col: def.crystal ? '#ffe27a' : '#9fe8ff', label: 'Próxima fase', exitOnly: true });
    m.exits.push({ rect: { x: hx - 16, y: hy - 16, w: 32, h: 32 }, to: 'p' + (def.n + 1), needFlag: id + 'Down', msg: 'O portal só abre depois de derrotar o chefe.', lockDuringBoss: true });
  }
  return m;
}
function fieldMap(def, r) {
  const m = base(def.name, 48, 34, def.theme, T.GRASS);
  sprinkle(m, r, T.GRASS, T.GRASS2, 0.35);
  for (let i = 0; i < def.pools; i++) m.disc(7 + r() * 24, 3 + r() * 28, 1.6 + r() * 2.2, T.WATER);
  m.path([[3, 17], [12, 12], [22, 21], [30, 15], [33, 17]], T.PATH, 1.3);
  m.disc(3, 17, 3.2, T.PATH);
  m.disc(41, 17, 7.5, T.STONE);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.STONE && r() < 0.16) m.tiles[i] = T.COBBLE;
  // paredão de rocha com um portão que só abre quando os monstros acabam
  m.rect(34, 0, 34, 15, T.CLIFF); m.rect(34, 19, 34, 33, T.CLIFF); m.rect(34, 16, 34, 18, T.PATH);
  m.objects.push({ type: 'gate', style: 'stone', flag: def.id + '_open', id: 'gate', x: tx(34), y: tx(17) + 8, solid: { x: 34 * TILE, y: 16 * TILE, w: 16, h: 48 } });
  border(m, r, def.trees, []);
  scatterTrees(m, r, def.density, def.trees, [[3, 17, 5], [34, 17, 3], [41, 17, 9]]);
  for (let i = 0; i < 18; i++) { const x = 4 + r() * 28, y = 3 + r() * 28; if (m.get(Math.floor(x), Math.floor(y)) !== T.WATER) m.objects.push({ type: def.theme === 'volcano' ? 'rock' : (r() < 0.5 ? 'rock' : 'glowshroom'), x: x * TILE, y: y * TILE, s: 0.8 + r() * 0.6, col: def.theme === 'swamp' ? '#9acb4a' : '#7fd6ff', solid: { x: x * TILE - 7, y: y * TILE - 5, w: 14, h: 5 } }); }
  m.start = { x: tx(3), y: tx(17) }; m.bossAt = [tx(41), tx(17)]; m.holeAt = [tx(45), tx(17)];
  return phaseCommon(m, def, r, [7, 3, 32, 30], [[3, 17, 7], [33, 17, 3]], [[6, 3, 14, 10], [14, 22, 28, 30], [24, 4, 32, 12]], [5, 19], [[6, 16], [31, 17]]);
}
function dungeonMap(def, r) {
  const m = base(def.name, 42, 42, 'sanctuary', T.VOID);
  m.rect(14, 34, 26, 40, T.STONE); m.rect(19, 28, 21, 33, T.STONE); m.rect(8, 15, 32, 27, T.STONE); m.rect(19, 10, 21, 14, T.STONE); m.rect(8, 1, 32, 9, T.STONE);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.STONE && r() < 0.16) m.tiles[i] = r() < 0.5 ? T.COBBLE : T.MOSS;
  const sty = def.pillar || 'rock';
  const pil = (a, b, br) => m.objects.push({ type: 'pillar', style: sty, x: tx(a), y: tx(b) + 6, broken: !!br, solid: { x: tx(a) - 6, y: tx(b), w: 12, h: 6 } });
  [[16, 36], [24, 36, 1], [10, 17], [30, 17, 1], [10, 25], [30, 25], [16, 21], [26, 21, 1], [10, 3], [30, 3], [10, 8, 1], [30, 8], [20, 3]].forEach(([a, b, br]) => pil(a, b, br));
  [[17, 38], [23, 38], [12, 16], [28, 16], [12, 26], [28, 26], [12, 3], [28, 3]].forEach(([a, b]) => m.objects.push({ type: 'lamp', x: tx(a), y: tx(b) + 6, solid: { x: tx(a) - 2, y: tx(b) + 2, w: 4, h: 4 } }));
  for (let i = 0; i < 20; i++) { const x = 8 + r() * 25, y = 2 + r() * 38, t = m.get(Math.floor(x), Math.floor(y)); if (t === T.STONE || t === T.COBBLE || t === T.MOSS) m.objects.push({ type: 'glowshroom', x: x * TILE, y: y * TILE, col: r() < 0.5 ? '#ffb03a' : '#a77bff' }); }
  if (def.spikes) { let k = 0; for (let y = 16; y <= 26; y++) for (let x = 9; x <= 31; x++) { if ((x + y * 2) % 6 === 0 && Math.abs(x - 20) > 2 && !(x === 16 && y === 21) && !(x === 26 && y === 21)) m.objects.push({ type: 'spikes', x: tx(x), y: tx(y) + 8, off: (k++ % 4) * 0.75 }); } }
  m.objects.push({ type: 'gate', style: 'stone', flag: def.id + '_open', id: 'gate', x: tx(20), y: tx(11) + 8, solid: { x: 19 * TILE, y: 11 * TILE, w: 48, h: 16 } });
  m.start = { x: tx(20), y: tx(39) }; m.bossAt = [tx(20), tx(5)]; m.holeAt = [tx(20), tx(1) + 8];
  return phaseCommon(m, def, r, [9, 16, 31, 26], [[20, 39, 4], [20, 21, 3]], [[9, 16, 14, 26], [26, 16, 31, 26], [10, 2, 30, 8]], [24, 38, 'left'], [[20, 33], [20, 14]]);
}
function skyMap(def, r) {
  const m = base(def.name, 48, 36, 'sky', T.VOID);
  const isl = [[5, 18, 4.2], [14, 9, 4], [14, 27, 4], [24, 18, 5], [33, 8, 4], [33, 28, 4], [42, 18, 5.6]];
  isl.forEach(([x, y, rr], i) => { m.disc(x, y, rr, T.GRASS); if (i === 6) m.disc(x, y, rr - 0.6, T.STONE); });
  [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]].forEach(([a, b]) => m.path([[isl[a][0], isl[a][1]], [isl[b][0], isl[b][1]]], T.BRIDGE, 0.9));
  m.path([[24, 18], [42, 18]], T.BRIDGE, 0.9);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.GRASS && r() < 0.3) m.tiles[i] = T.GRASS2;
  m.objects.push({ type: 'gate', style: 'stone', flag: def.id + '_open', id: 'gate', x: tx(34), y: tx(18) + 8, solid: { x: 34 * TILE, y: 17 * TILE, w: 16, h: 48 } });
  for (let i = 0; i < 26; i++) { const k = isl[Math.floor(r() * 6)], a = r() * 6.28, d = r() * k[2] * 0.8; const x = k[0] + Math.cos(a) * d, y = k[1] + Math.sin(a) * d; if (m.get(Math.floor(x), Math.floor(y)) === T.GRASS || m.get(Math.floor(x), Math.floor(y)) === T.GRASS2) m.objects.push({ type: 'glowshroom', x: x * TILE, y: y * TILE, col: r() < 0.5 ? '#bff3ff' : '#ffe27a' }); }
  [[10, 7], [18, 11], [20, 30], [28, 21], [37, 6], [37, 30]].forEach(([a, b], i) => { if (WALKABLE.has(m.get(a, b))) m.objects.push({ type: 'rock', x: tx(a), y: tx(b), s: 1, solid: { x: tx(a) - 7, y: tx(b) - 5, w: 14, h: 5 } }); });
  m.start = { x: tx(5), y: tx(18) }; m.bossAt = [tx(42), tx(18)]; m.holeAt = [tx(46), tx(18)];
  // monstros nas ilhas do meio; baús nas ilhas laterais
  const zone = [[11, 6, 17, 12], [11, 24, 17, 30], [20, 14, 29, 22], [30, 5, 36, 11], [30, 25, 36, 31]];
  const n = 13;
  for (let i = 0; i < n; i++) { const z = zone[i % zone.length], p = freeSpot(m, r, ...z, [[24, 18, 1]]); if (p) m.spawns.push({ kind: def.mobs[i % def.mobs.length], x: p[0], y: p[1] }); }
  const loot = [[['potion', 2]], [['ether', 2], ['berry', 2]], [['potion', 3], ['ether', 1]]];
  [[30, 5, 36, 11], [30, 25, 36, 31], [11, 6, 17, 12]].forEach((z, i) => { const p = freeSpot(m, r, ...z, [[24, 18, 1]]); if (p) m.chests.push({ id: def.id + '_c' + (i + 1), x: p[0], y: p[1], items: loot[i] }); });
  m.saves.push({ x: tx(7), y: tx(18) }); m.saves.push({ x: tx(30), y: tx(18) });
  m.npcs.push({ id: 'laylla', pal: 'laylla', name: 'Laylla', x: tx(6), y: tx(20), dir: 'right', wander: 0 });
  m.spawns.push({ kind: def.boss, x: m.bossAt[0], y: m.bossAt[1], special: 'boss', flag: def.id + 'Down' });
  m.phase = def; m.gateFlag = def.id + '_open'; m.envMod = def.env || null;
  const [hx, hy] = m.holeAt;
  m.objects.push({ type: 'hole', x: hx, y: hy + 8, col: '#9fe8ff', label: 'Próxima fase', exitOnly: true });
  m.exits.push({ rect: { x: hx - 16, y: hy - 16, w: 32, h: 32 }, to: 'p' + (def.n + 1), needFlag: def.id + 'Down', msg: 'O portal só abre depois de derrotar o chefe.', lockDuringBoss: true });
  return m;
}
const PHASE_BUILDERS = {};
for (const def of PHASES) PHASE_BUILDERS[def.id] = () => { const r = rng(100 + def.n * 7); return def.type === 'field' ? fieldMap(def, r) : def.type === 'sky' ? skyMap(def, r) : dungeonMap(def, r); };

const BUILDERS = { village, forest, sanctuary, slimepit, ruins, ...PHASE_BUILDERS };
const cache = {};
export function getMap(id) { if (!cache[id]) { cache[id] = BUILDERS[id](); cache[id].id = id; } return cache[id]; }
