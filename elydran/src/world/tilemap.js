// Desenho do chão (feito uma vez por mapa) e colisões com tiles e objetos
import { TILE } from '../config.js';
import { T, SOLID_TILES } from './maps.js';
import { rng } from '../utils/math.js';

const GROUND = {
  day: { [T.GRASS]: ['#5fb04a', '#55a443', '#6cbd52'], [T.GRASS2]: ['#4e9c40', '#47913a', '#58a648'], [T.TALL]: ['#4e9c40'], [T.FLOWER]: ['#5fb04a'], [T.MOSS]: ['#4a8f3e'] },
  forest: { [T.GRASS]: ['#3f8a3c', '#3a8037', '#479442'], [T.GRASS2]: ['#2f6e35', '#2b6631', '#357a3a'], [T.TALL]: ['#2f6e35'], [T.FLOWER]: ['#3f8a3c'], [T.MOSS]: ['#2a5f3a', '#275836', '#2f6a40'] },
  sanctuary: {},
  ice: { [T.GRASS]: ['#e4eef8', '#d6e4f2', '#eef5fc'], [T.GRASS2]: ['#d3e1f0', '#c8d8ea', '#dce8f4'], [T.TALL]: ['#c8d8ea'], [T.FLOWER]: ['#e4eef8'], [T.MOSS]: ['#b8d0e4'],
    path: ['#9db6cf', '#90aac4', '#aac2d8'], cobble: ['#8aa4c0', '#7e98b4', '#96b0cc'], sand: ['#cfe0ee', '#c2d6e8'], stone: ['#6a86a8', '#5f7c9e', '#7692b4'], water: '#4cc0ee', tall: '#bcd4ea' },
  desert: { [T.GRASS]: ['#e0c27a', '#d8b86e', '#e8cc88'], [T.GRASS2]: ['#d4b366', '#cba85c', '#dcbe74'], [T.TALL]: ['#c8a458'], [T.FLOWER]: ['#e0c27a'], [T.MOSS]: ['#c9a35a'],
    path: ['#b88a54', '#ae804a', '#c2945e'], cobble: ['#c4a67a', '#b89a6e', '#d0b286'], sand: ['#f0dc9c', '#e6d08e'], stone: ['#9a7a4a', '#8e6e40', '#a68656'], water: '#3ab0b0', tall: '#b89a4a' },
  volcano: { [T.GRASS]: ['#3a2e2c', '#332826', '#443634'], [T.GRASS2]: ['#2c2220', '#251c1a', '#362a28'], [T.TALL]: ['#2c2220'], [T.FLOWER]: ['#3a2e2c'], [T.MOSS]: ['#4a2a22'],
    path: ['#5a4038', '#503832', '#654a42'], cobble: ['#4e4440', '#443c38', '#5a504a'], sand: ['#6a5040', '#5e4638'], stone: ['#3a3038', '#322a32', '#443a42'], water: '#ff6a1a', tall: '#5a3a30' },
  swamp: { [T.GRASS]: ['#4a5e32', '#42562c', '#52683a'], [T.GRASS2]: ['#3a4c28', '#344522', '#425630'], [T.TALL]: ['#3a4c28'], [T.FLOWER]: ['#4a5e32'], [T.MOSS]: ['#2e4a2a'],
    path: ['#6a5a3a', '#5e5032', '#756444'], cobble: ['#5a6458', '#4e584c', '#66705f'], sand: ['#8a8a56', '#7e7e4c'], stone: ['#44503f', '#3c4838', '#4d5a48'], water: '#4a6a3a', tall: '#5a7a3a' },
  corrupt: { [T.GRASS]: ['#3a2e4a', '#33283f', '#443758'], [T.GRASS2]: ['#2c2238', '#261e32', '#352a44'], [T.TALL]: ['#2c2238'], [T.FLOWER]: ['#3a2e4a'], [T.MOSS]: ['#48285a'],
    path: ['#6a4a5a', '#5e4252', '#785868'], cobble: ['#5a4c6a', '#4e4260', '#665878'], sand: ['#7a5a7a', '#6e506e'], stone: ['#4a3a66', '#42345c', '#54447a'], water: '#7a3ab8', tall: '#7a4aa8' },
  sky: { [T.GRASS]: ['#6ac86a', '#5cbc5e', '#78d478'], [T.GRASS2]: ['#58b45a', '#4ea852', '#64c066'], [T.TALL]: ['#58b45a'], [T.FLOWER]: ['#6ac86a'], [T.MOSS]: ['#4aa060'],
    path: ['#d8c8a0', '#cebe96', '#e2d2aa'], cobble: ['#c8c6d8', '#bcbace', '#d4d2e2'], sand: ['#efe2b0', '#e6d8a4'], stone: ['#b8b4cc', '#aca8c2', '#c4c0d6'], water: '#8ac8f0', tall: '#58b45a' }
};
const PATH = ['#c9a06a', '#bf955f', '#d1aa74'], COBBLE = ['#9a9aa8', '#8e8e9c', '#a6a6b4'], SAND = ['#e8d39a', '#dfc88c'], STONE = ['#4a4466', '#433e5e', '#524b70'];

function noisy(g, r, x, y, cols, n) { g.fillStyle = cols[0]; g.fillRect(x, y, TILE, TILE); for (let i = 0; i < n; i++) { g.fillStyle = cols[1 + Math.floor(r() * (cols.length - 1))] || cols[0]; g.fillRect(x + Math.floor(r() * 15), y + Math.floor(r() * 15), 2, 1); } }

export function renderGround(map) {
  const c = document.createElement('canvas'); c.width = map.w * TILE; c.height = map.h * TILE;
  const g = c.getContext('2d'), r = rng(map.w * 31 + map.h), pal = GROUND[map.theme] || GROUND.day, cPATH = pal.path || PATH, cCOB = pal.cobble || COBBLE, cSAND = pal.sand || SAND, cSTONE = pal.stone || STONE, cWAT = pal.water || (map.theme === 'forest' ? '#2a8aa8' : '#3a9ad8'), cTALL = pal.tall || (map.theme === 'forest' ? '#4e9a48' : '#7cc35a');
  const isW = (x, y) => map.get(x, y) === T.WATER;
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const t = map.get(x, y), X = x * TILE, Y = y * TILE;
    if (t === T.PATH) noisy(g, r, X, Y, cPATH, 6);
    else if (t === T.COBBLE) { noisy(g, r, X, Y, cCOB, 2); g.fillStyle = 'rgba(40,40,60,.35)'; const o = (y % 2) * 4; g.fillRect(X, Y + 7, TILE, 1); g.fillRect(X + o + 3, Y, 1, 7); g.fillRect(X + o + 11, Y + 8, 1, 8); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X + o + 4, Y + 1, 5, 1); }
    else if (t === T.SAND) noisy(g, r, X, Y, cSAND, 4);
    else if (t === T.WATER) { g.fillStyle = cWAT; g.fillRect(X, Y, TILE, TILE); g.fillStyle = 'rgba(0,30,80,.18)'; g.fillRect(X, Y + 8, TILE, 8); }
    else if (t === T.BRIDGE) { g.fillStyle = '#7a4a2a'; g.fillRect(X, Y, TILE, TILE); g.fillStyle = '#9a6234'; for (let i = 0; i < 4; i++) g.fillRect(X + i * 4, Y, 3, TILE); g.fillStyle = '#4e2c18'; g.fillRect(X, Y, TILE, 1); }
    else if (t === T.STONE || t === T.COBBLE && map.theme === 'sanctuary') { noisy(g, r, X, Y, cSTONE, 3); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X, Y + 15, TILE, 1); g.fillRect(X + 15, Y, 1, TILE); g.fillStyle = 'rgba(160,140,255,.08)'; g.fillRect(X + 1, Y + 1, 6, 1); }
    else if (t === T.VOID) { g.fillStyle = map.theme === 'sky' ? '#bfe0ff' : '#0b0718'; g.fillRect(X, Y, TILE, TILE); if (map.theme !== 'sky' && r() < 0.04) { g.fillStyle = '#d9c8ff'; g.fillRect(X + Math.floor(r() * 15), Y + Math.floor(r() * 15), 1, 1); } }
    else {
      const cols = pal[t] || pal[T.GRASS] || ['#5fb04a']; noisy(g, r, X, Y, cols.length > 1 ? cols : [cols[0], '#4a8f3e'], 5);
      if (t === T.TALL) { g.fillStyle = cTALL; for (let i = 0; i < 5; i++) { const gx = X + 1 + Math.floor(r() * 13), gy = Y + 4 + Math.floor(r() * 10); g.fillRect(gx, gy - 3, 1, 4); g.fillRect(gx + 2, gy - 2, 1, 3); } }
      if (t === T.FLOWER) { for (let i = 0; i < 3; i++) { g.fillStyle = ['#ffd23f', '#ff6fa8', '#ffffff', '#8ad0ff'][Math.floor(r() * 4)]; const fx = X + 2 + Math.floor(r() * 11), fy = Y + 2 + Math.floor(r() * 11); g.fillRect(fx, fy, 2, 2); g.fillStyle = '#2f6e35'; g.fillRect(fx, fy + 2, 1, 2); } }
      if (r() < 0.08) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X + Math.floor(r() * 12), Y + Math.floor(r() * 12), 3, 1); }
    }
    // borda clara onde a água encontra a terra
    if (t === T.WATER) { g.fillStyle = 'rgba(220,245,255,.55)'; if (!isW(x, y - 1)) g.fillRect(X, Y, TILE, 2); if (!isW(x - 1, y)) g.fillRect(X, Y, 1, TILE); if (!isW(x + 1, y)) g.fillRect(X + 15, Y, 1, TILE); }
    // sombra na beirada do vazio (santuário flutuante)
    if (t === T.VOID && map.theme !== 'sky' && map.get(x, y - 1) !== T.VOID && map.get(x, y - 1) !== undefined) { g.fillStyle = '#2a2244'; g.fillRect(X, Y, TILE, 6); g.fillStyle = '#1a1430'; g.fillRect(X, Y + 6, TILE, 4); }
  }
  return c;
}
// brilho animado da água desenhado a cada quadro (só o que está na tela)
export function drawWater(ctx, map, cam, t) {
  const x0 = Math.max(0, Math.floor(cam.x / TILE)), y0 = Math.max(0, Math.floor(cam.y / TILE)), x1 = Math.min(map.w - 1, x0 + 31), y1 = Math.min(map.h - 1, y0 + 18);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (map.get(x, y) !== T.WATER) continue;
    const k = Math.sin(t * 1.6 + x * 1.3 + y * 0.7);
    if (k > 0.55) ctx.fillRect(x * TILE + 3 + Math.round(k * 4) - cam.x, y * TILE + 6 + ((x + y) % 3) * 3 - cam.y, 4, 1);
  }
}

/* ---------- colisão ---------- */
export function blocked(map, x, y, r, ignoreObj) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE), y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (SOLID_TILES.has(map.get(tx, ty))) {
    const nx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE)), ny = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
    if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
  }
  if (!ignoreObj) for (const o of map.objects) for (const s of [o.solid, o.solid2]) {
    if (!s) continue;
    const nx = Math.max(s.x, Math.min(x, s.x + s.w)), ny = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
  }
  return false;
}
// move separando os eixos, para deslizar nas paredes
export function moveEntity(map, e, dx, dy, extra) {
  const hit = (x, y) => blocked(map, x, y, e.r) || (extra && extra(x, y));
  if (dx && !hit(e.x + dx, e.y)) e.x += dx; else if (dx) { const s = Math.sign(dx); for (let i = Math.abs(dx); i > 0.2; i -= 0.5) if (!hit(e.x + s * 0.5, e.y)) e.x += s * 0.5; else break; }
  if (dy && !hit(e.x, e.y + dy)) e.y += dy; else if (dy) { const s = Math.sign(dy); for (let i = Math.abs(dy); i > 0.2; i -= 0.5) if (!hit(e.x, e.y + s * 0.5)) e.y += s * 0.5; else break; }
}
