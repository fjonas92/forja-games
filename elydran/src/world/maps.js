// Mapas do mundo. Gerados por código com semente fixa, então são sempre iguais
import { rng } from '../utils/math.js';
import { TILE } from '../config.js';

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
  m.rect(15, 11, 25, 19, T.COBBLE);
  for (let y = 14; y <= 16; y++) for (let x = 30; x <= 36; x++) m.set(x, y, x >= 31 && x <= 35 ? T.BRIDGE : T.PATH); // ponte sobre o rio
  sprinkle(m, r, T.GRASS, T.FLOWER, 0.05); sprinkle(m, r, T.GRASS2, T.TALL, 0.05);
  // casas: [tile x, tile y da base, largura, telhado]
  [[18, 7, 6, 'blue', 'Casa do Ancião'], [5, 9, 5, 'red', 'Loja da Lina'], [26, 9, 5, 'gold', 'Forja do Bruno'], [10, 21, 5, 'green', ''], [24, 22, 5, 'red', '']].forEach(([hx, hy, w, roof, label], i) => {
    const x = hx * TILE, y = hy * TILE;
    m.objects.push({ type: 'house', x: x + (w * TILE) / 2, y, wt: w, roof, seed: i, label, solid: { x: x + 4, y: y - 38, w: w * TILE - 8, h: 38 } });
    for (let yy = hy - 3; yy < hy; yy++) for (let xx = hx; xx < hx + w; xx++) if (m.get(xx, yy) === T.PATH || m.get(xx, yy) === T.COBBLE) m.set(xx, yy, T.GRASS);
  });
  m.objects.push({ type: 'fountain', x: tx(20), y: tx(15) + 4, solid: { x: tx(20) - 16, y: tx(15) - 6, w: 32, h: 12 } });
  [[16, 12], [24, 12], [16, 18], [24, 18], [30, 14], [30, 17]].forEach(([a, b]) => m.objects.push({ type: 'lamp', x: tx(a), y: tx(b) + 6, solid: { x: tx(a) - 2, y: tx(b) + 2, w: 4, h: 4 } }));
  m.objects.push({ type: 'sign', x: tx(38), y: tx(13) + 4, text: '→ Floresta de Aurora', solid: { x: tx(38) - 2, y: tx(13), w: 4, h: 4 } });
  [[13, 17], [27, 17], [11, 14], [30, 21]].forEach(([a, b]) => m.bushes.push({ x: tx(a), y: tx(b) + 6, kind: 'bush' }));
  m.saves.push({ x: tx(24), y: tx(13) + 2 });
  m.npcs.push({ id: 'elder', pal: 'elder', name: 'Ancião Thaleo', x: tx(20), y: tx(9) + 8, dir: 'down', wander: 0 });
  m.npcs.push({ id: 'merchant', pal: 'merchant', name: 'Lina', x: tx(8), y: tx(10) + 10, dir: 'down', wander: 0 });
  m.npcs.push({ id: 'smith', pal: 'smith', name: 'Bruno', x: tx(28), y: tx(10) + 10, dir: 'down', wander: 0 });
  m.npcs.push({ id: 'kid', pal: 'kid', name: 'Mira', x: tx(17), y: tx(17), dir: 'right', wander: 28 });
  m.npcs.push({ id: 'guard', pal: 'guard', name: 'Oren', x: tx(37), y: tx(16) + 4, dir: 'left', wander: 0 });
  border(m, r, ['green', 'green', 'autumn', 'pine'], [(x, y) => x === m.w - 1 && y >= 14 && y <= 16]);
  scatterTrees(m, r, 0.22, ['green', 'autumn', 'green', 'pine'], [[20, 15, 9], [8, 12, 5], [28, 12, 5], [20, 6, 4], [12, 22, 5], [26, 22, 5], [36, 15, 4], [7, 24, 7]]);
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
  // inimigos: [tipo, tile x, tile y, especial]
  [['gotalim', 14, 24], ['gotalim', 19, 21], ['gotalim', 26, 26], ['fungo', 30, 20], ['fungo', 36, 26], ['gotalim', 9, 18],
   ['fungo', 31, 12], ['lobo', 35, 9], ['fungo', 44, 13], ['lobo', 50, 11], ['gotalim', 22, 32], ['fungo', 19, 36], ['lobo', 15, 42, 'shard'],
   ['gotalim', 40, 28], ['fungo', 27, 40], ['lobo', 40, 18]].forEach(([k, a, b, sp]) => m.spawns.push({ kind: k, x: tx(a), y: tx(b), special: sp || null }));
  // Cristarta presa perto do lago leste, cercada de Gotalins
  m.specials.push({ id: 'trapped', x: tx(48), y: tx(31) + 2, r: 16 });
  [[46, 29], [50, 29], [46, 33], [50, 33]].forEach(([a, b]) => m.spawns.push({ kind: 'gotalim', x: tx(a), y: tx(b), special: 'guard_cristarta' }));
  m.exits.push({ rect: { x: 0, y: 23 * TILE, w: 6, h: 3 * TILE }, to: 'village', tx: tx(40) - 6, ty: tx(15) });
  m.exits.push({ rect: { x: 31 * TILE, y: 0, w: 5 * TILE, h: 6 }, to: 'sanctuary', tx: tx(13), ty: tx(16), needSeal: true });
  m.start = { x: tx(2), y: tx(24) };
  return m;
}

/* ---------- Santuário do Cristal (arena do chefe) ---------- */
function sanctuary() {
  const m = base('Santuário do Cristal', 26, 19, 'sanctuary', T.VOID), r = rng(7);
  m.disc(13, 9.5, 8.8, T.STONE); m.rect(11, 15, 15, 18, T.STONE);
  for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.STONE && r() < 0.12) m.tiles[i] = T.COBBLE;
  [[7, 4], [19, 4], [5, 10], [21, 10], [7, 15], [19, 15]].forEach(([a, b], i) => m.objects.push({ type: 'pillar', x: tx(a), y: tx(b) + 6, broken: i % 3 === 2, solid: { x: tx(a) - 6, y: tx(b), w: 12, h: 6 } }));
  m.objects.push({ type: 'bigcrystal', x: tx(13), y: tx(2) + 10, solid: { x: tx(13) - 16, y: tx(2) - 4, w: 32, h: 14 } });
  m.spawns.push({ kind: 'golem', x: tx(13), y: tx(8), special: 'boss' });
  m.exits.push({ rect: { x: 11 * TILE, y: m.h * TILE - 6, w: 5 * TILE, h: 6 }, to: 'forest', tx: tx(33), ty: tx(6), lockDuringBoss: true });
  m.start = { x: tx(13), y: tx(16) };
  return m;
}

const BUILDERS = { village, forest, sanctuary };
const cache = {};
export function getMap(id) { if (!cache[id]) { cache[id] = BUILDERS[id](); cache[id].id = id; } return cache[id]; }
