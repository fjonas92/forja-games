// Pixel art feita pelo próprio código: personagens a partir de "desenhos em texto" e o resto com formas simples
import { rng } from '../utils/math.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

/* ---------- Personagens (herói e moradores) ---------- */
// metade esquerda (8 colunas) espelhada para frente e costas; lado desenhado inteiro
const FRONT = ['......kk', '....kkhh', '...khhhh', '..khhhhh', '..khhhHh', '..khHsss', '..khsess', '...kssss', '....kSSS', '...kbbww', '..kbgbww', '..ksbwwl', '..kkbLgL', '...kbppp', '...kbppp'];
const BACK = ['......kk', '....kkhh', '...khhhh', '..khhhhh', '..khhHhh', '..khhhhH', '..khHhhh', '...khhhh', '....kkhh', '...kbbbb', '..kbgbbb', '..ksbbbb', '..kkbBBB', '...kBBBB', '...kbBBB'];
const SIDE = ['......kkkk......', '....kkhhhhk.....', '...khhhhhhhk....', '..khhhhhhhhhk...', '..khhhhhHhhhk...', '..khhhhsssshk...', '..khhhssssesk...', '...khhsssssk....', '....kkSSSSk.....', '....kbbwwwk.....', '...kbbgwwwk.....', '...kbbbwwsk.....', '...kbbkgLk......', '....kbpppk......', '....kbpppk......'];
const mirror = rows => rows.map(r => r + r.split('').reverse().join(''));

export const PALETTES = {
  hero: { k: '#1a1424', h: '#2b1d2a', H: '#171019', s: '#f2c9a0', S: '#cf9a74', e: '#1a1424', b: '#2f56c4', B: '#1d3478', w: '#ece9f4', g: '#f0c04a', L: '#4e2c18', l: '#7a4a2a', p: '#1f2a55' },
  elder: { k: '#1a1424', h: '#e9e6ef', H: '#b7b3c4', s: '#e8bf98', S: '#c7976f', e: '#1a1424', b: '#3c7a4a', B: '#24502f', w: '#d9cfa8', g: '#e0b048', L: '#4e2c18', l: '#7a4a2a', p: '#2e5a38' },
  merchant: { k: '#1a1424', h: '#d8462e', H: '#962a1c', s: '#f6d2ad', S: '#d6a27a', e: '#1a1424', b: '#7b3fa8', B: '#4f2470', w: '#f3e6c9', g: '#f0c04a', L: '#5a2e1a', l: '#8a5530', p: '#5a2e86' },
  smith: { k: '#1a1424', h: '#2a1a12', H: '#140c08', s: '#a8693f', S: '#82502e', e: '#1a1424', b: '#6a4a2e', B: '#46301c', w: '#c9b79c', g: '#b9b9c4', L: '#3a2414', l: '#6a4024', p: '#3d3a46' },
  kid: { k: '#1a1424', h: '#ff8fbf', H: '#d0558c', s: '#f6d2ad', S: '#d6a27a', e: '#1a1424', b: '#ffcc4d', B: '#d69a1e', w: '#fff6e8', g: '#7ad94a', L: '#5a2e1a', l: '#8a5530', p: '#3a6fd6' },
  guard: { k: '#1a1424', h: '#9aa4b8', H: '#6a7488', s: '#e8bf98', S: '#c7976f', e: '#1a1424', b: '#8a2a2a', B: '#5a1818', w: '#b8c0d0', g: '#e0b048', L: '#3a2414', l: '#6a4024', p: '#3a3a4a' },
  laylla: { k: '#1a1424', h: '#b8461f', H: '#7e2c12', s: '#f2c9a0', S: '#cf9a74', e: '#1a1424', b: '#1f8f8a', B: '#14605f', w: '#f6f1e4', g: '#f0c04a', L: '#4e2c18', l: '#7a4a2a', p: '#3b3a5c' }
};

function paint(g, rows, pal, ox, oy) { rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r[x]; if (c !== '.' && pal[c]) px(g, ox + x, oy + y, 1, 1, pal[c]); } }); }
// pernas desenhadas à parte, para animar a caminhada nas 4 direções
function legs(g, pal, dir, f) {
  const step = [0, 1, 0, -1][f];
  const leg = (x, dy) => { px(g, x - 1, 15 + Math.min(0, dy), 4, 6, pal.k); px(g, x, 15, 2, 3 + dy, pal.p); px(g, x, 18 + dy, 2, 2, pal.L); };
  if (dir === 'side') { leg(6 + step, 0); leg(8 - step, 0); }
  else { leg(5, step > 0 ? -1 : 0); leg(9, step < 0 ? -1 : 0); }
}
const charCache = new Map();
// devolve o quadro do personagem (16x22) para direção e passo de caminhada
export function charFrame(palName, dir, f) {
  const key = palName + dir + f; let c = charCache.get(key); if (c) return c;
  const pal = PALETTES[palName]; let g; [c, g] = mk(16, 22);
  legs(g, pal, dir, f);
  paint(g, dir === 'down' ? mirror(FRONT) : dir === 'up' ? mirror(BACK) : SIDE, pal, 0, f % 2 ? 1 : 0);
  if (dir === 'down') { px(g, 5, 6 + (f % 2), 1, 1, '#fff'); px(g, 10, 6 + (f % 2), 1, 1, '#fff'); }
  charCache.set(key, c); return c;
}
export function drawChar(ctx, palName, x, y, dir, f, flip) {
  const d = dir === 'left' || dir === 'right' ? 'side' : dir, c = charFrame(palName, d, f);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), 6, 2.5, 0, 0, 7); ctx.fill();
  if (flip || dir === 'left') { ctx.save(); ctx.translate(Math.round(x) + 8, Math.round(y) - 21); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); }
  else ctx.drawImage(c, Math.round(x) - 8, Math.round(y) - 21);
}

/* ---------- Espada e golpe ---------- */
export function drawSword(ctx, x, y, ang, kind) {
  const len = kind === 'sword_crystal' ? 13 : kind === 'sword_iron' ? 11 : 8;
  const blade = kind === 'sword_crystal' ? '#9fe8ff' : kind === 'sword_iron' ? '#d9dde8' : '#8a5a32';
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
  ctx.fillStyle = '#1a1424'; ctx.fillRect(1, -2, len + 2, 4);
  ctx.fillStyle = blade; ctx.fillRect(2, -1, len, 2);
  if (kind !== 'none') { ctx.fillStyle = '#fff'; ctx.fillRect(3, -1, len - 3, 1); ctx.fillStyle = '#f0c04a'; ctx.fillRect(0, -3, 2, 6); }
  ctx.fillStyle = '#5a2e1a'; ctx.fillRect(-3, -1, 3, 2);
  ctx.restore();
}
export function drawSlash(ctx, x, y, ang, t, crystal) {
  const k = t / 0.18; if (k > 1) return;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = crystal ? '#bff3ff' : '#fff7d6'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 15, ang - 1.1 + k * 0.4, ang + 1.1 * k + 0.2); ctx.stroke();
  ctx.strokeStyle = crystal ? '#4dc3ff' : '#ffb03a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 18, ang - 0.9, ang + 0.9 * k); ctx.stroke();
  ctx.restore();
}

/* ---------- Criaturas companheiras ---------- */
export function drawFox(ctx, x, y, face, t, s, evolved) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face < 0 ? -s : s, s);
  const bob = Math.sin(t * 10) * 0.8;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2, 0, 0, 7); ctx.fill();
  // cauda de fogo
  const tails = evolved ? 3 : 1;
  for (let i = 0; i < tails; i++) {
    const a = -0.6 - i * 0.45 + Math.sin(t * 8 + i) * 0.15;
    for (let j = 0; j < 4; j++) { ctx.fillStyle = ['#c22e1b', '#ff7a2a', '#ffb03a', '#ffe27a'][j]; ctx.beginPath(); ctx.ellipse(-6 + Math.cos(a) * (3 + j), -6 + Math.sin(a) * (3 + j) + bob, 4 - j * 0.8, 2.5 - j * 0.4, a, 0, 7); ctx.fill(); }
  }
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.ellipse(0, -5 + bob, 6.5, 4.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(0, -5 + bob, 5.5, 3.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff1d6'; ctx.beginPath(); ctx.ellipse(2.5, -4 + bob, 2.5, 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1424'; [-3, 2].forEach(lx => ctx.fillRect(lx, -2 + bob, 2, 2 + (Math.sin(t * 14 + lx) > 0 ? 0 : 0)));
  // cabeça
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.arc(5, -10 + bob, 4.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(5, -10 + bob, 3.6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, -12 + bob); ctx.lineTo(3, -17 + bob); ctx.lineTo(5.5, -13 + bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(5.5, -13 + bob); ctx.lineTo(8, -17 + bob); ctx.lineTo(8.5, -11 + bob); ctx.fill();
  ctx.fillStyle = '#fff1d6'; ctx.fillRect(6, -9 + bob, 3, 2);
  ctx.fillStyle = '#1a1424'; ctx.fillRect(6, -11 + bob, 1, 1); ctx.fillRect(9, -9 + bob, 1, 1);
  if (evolved) { ctx.fillStyle = '#ffe27a'; ctx.fillRect(4, -15 + bob, 1, 2); ctx.fillRect(7, -16 + bob, 1, 2); }
  ctx.restore();
}
export function drawTurtle(ctx, x, y, face, t, s, evolved) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face < 0 ? -s : s, s);
  const bob = Math.sin(t * 6) * 0.6, step = Math.sin(t * 9) > 0 ? 1 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a6ea8'; [[-5, step], [3, 1 - step]].forEach(([lx, d]) => ctx.fillRect(lx, -3 + d, 3, 3));
  ctx.fillStyle = '#5ab8e8'; ctx.beginPath(); ctx.arc(8, -5 + bob, 3, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1424'; ctx.fillRect(9, -6 + bob, 1, 1);
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.ellipse(0, -6 + bob, 7.5, 5.5, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-7.5, -6 + bob, 15, 2);
  ctx.fillStyle = evolved ? '#3b7fd0' : '#4dc3ff'; ctx.beginPath(); ctx.ellipse(0, -6 + bob, 6.5, 4.5, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#bff3ff'; [[-3, -8], [1, -9], [4, -7]].forEach(([a, b]) => ctx.fillRect(a, b + bob, 2, 2));
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-2, -10 + bob, 2, 1);
  if (evolved) { ctx.fillStyle = '#9fe8ff'; ctx.beginPath(); ctx.moveTo(-1, -10 + bob); ctx.lineTo(1, -15 + bob); ctx.lineTo(3, -10 + bob); ctx.fill(); }
  ctx.restore();
}
export function drawCreature(ctx, look, x, y, face, t, s, evolved) { (look === 'turtle' ? drawTurtle : drawFox)(ctx, x, y, face, t, s, evolved); }

/* ---------- Inimigos ---------- */
export function drawSlime(ctx, x, y, t, hop, hurt, col) {
  const sq = hop > 0 ? 1 - hop * 0.25 : 1 + Math.sin(t * 6) * 0.06, lift = hop > 0 ? Math.sin(hop * Math.PI) * 6 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 7 - lift * 0.3, 2.5, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(Math.round(x), Math.round(y - lift)); ctx.scale(1 / sq, sq);
  ctx.fillStyle = '#10264a'; ctx.beginPath(); ctx.ellipse(0, -5, 8, 6.5, 0, Math.PI, 0); ctx.ellipse(0, -5, 8, 3, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = hurt ? '#ffffff' : col; ctx.beginPath(); ctx.ellipse(0, -5, 7, 5.5, 0, Math.PI, 0); ctx.ellipse(0, -5, 7, 2.2, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-4, -9, 2, 2); ctx.fillRect(-2, -10, 2, 1);
  ctx.fillStyle = '#0b1530'; ctx.fillRect(-3, -6, 2, 2); ctx.fillRect(2, -6, 2, 2);
  ctx.restore();
}
export function drawFungo(ctx, x, y, t, hurt, charge) {
  const b = Math.sin(t * 7) * 0.7;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 6, 2.2, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = '#1a1424'; ctx.fillRect(-4, -8, 8, 8); ctx.fillStyle = hurt ? '#fff' : '#f1e3c4'; ctx.fillRect(-3, -7, 6, 7);
  ctx.fillStyle = '#1a1424'; ctx.fillRect(-2, -5, 1, 2); ctx.fillRect(1, -5, 1, 2);
  const cs = 1 + charge * 0.2;
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.ellipse(0, -9 + b, 8.5 * cs, 6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-8.5 * cs, -10 + b, 17 * cs, 2);
  ctx.fillStyle = hurt ? '#fff' : '#d8463a'; ctx.beginPath(); ctx.ellipse(0, -9 + b, 7.5 * cs, 5, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffe9d6'; [[-4, -11], [1, -13], [4, -10]].forEach(([a, c]) => ctx.fillRect(a, c + b, 2, 2));
  ctx.restore();
}
export function drawWolf(ctx, x, y, face, t, hurt, dash) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face < 0 ? -1 : 1, 1);
  const run = Math.sin(t * (dash ? 26 : 12)) * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.5, 0, 0, 7); ctx.fill();
  const body = hurt ? '#fff' : '#3b2f5e', fur = hurt ? '#fff' : '#5b4a8a';
  ctx.fillStyle = '#120c20'; ctx.fillRect(-6 + run, -4, 2, 4); ctx.fillRect(4 - run, -4, 2, 4);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -7, 8, 4.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(-1, -9, 6, 2.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-13, -12 + run * 0.5); ctx.lineTo(-7, -5); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(5, -11); ctx.lineTo(12, -8); ctx.lineTo(11, -5); ctx.lineTo(5, -4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(5, -11); ctx.lineTo(6, -16); ctx.lineTo(9, -10); ctx.fill();
  ctx.fillStyle = '#ff4fd8'; ctx.fillRect(8, -9, 2, 1);
  if (dash) { ctx.fillStyle = 'rgba(167,123,255,.35)'; ctx.fillRect(-18, -10, 8, 1); ctx.fillRect(-20, -6, 10, 1); }
  ctx.restore();
}
export function drawGolem(ctx, x, y, t, hurt, phase, windup) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const b = Math.sin(t * 2.5) * 1.2, arm = windup > 0 ? -windup * 10 : Math.sin(t * 2.5) * 2;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 6, 0, 0, 7); ctx.fill();
  const st = hurt ? '#ffffff' : '#5a6684', st2 = hurt ? '#ffffff' : '#3d4660', cr = phase > 1 ? '#ff7ae0' : '#7fd6ff';
  const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([a, c2], i) => (i ? ctx.lineTo(a, c2) : ctx.moveTo(a, c2))); ctx.closePath(); ctx.fill(); };
  // pernas
  poly([[-12, 0], [-6, 0], [-5, -10], [-13, -10]], st2); poly([[6, 0], [12, 0], [13, -10], [5, -10]], st2);
  // braços
  poly([[-16, -26 + arm], [-26, -18 + arm], [-24, -4 + arm], [-16, -8 + arm]], st2); poly([[16, -26 + arm], [26, -18 + arm], [24, -4 + arm], [16, -8 + arm]], st2);
  poly([[-27, -6 + arm], [-21, -6 + arm], [-22, 0 + arm], [-28, -1 + arm]], cr); poly([[27, -6 + arm], [21, -6 + arm], [22, 0 + arm], [28, -1 + arm]], cr);
  // tronco
  poly([[-16, -8 + b], [16, -8 + b], [19, -28 + b], [8, -38 + b], [-8, -38 + b], [-19, -28 + b]], '#1a1424');
  poly([[-14, -9 + b], [14, -9 + b], [17, -27 + b], [7, -36 + b], [-7, -36 + b], [-17, -27 + b]], st);
  poly([[-14, -9 + b], [-2, -9 + b], [-6, -22 + b], [-17, -27 + b]], st2);
  // cristais nas costas
  [[-10, -36, 9], [0, -40, 13], [10, -35, 8]].forEach(([cx, cy, h]) => poly([[cx - 3, cy + b], [cx, cy - h + b], [cx + 3, cy + b]], cr));
  // núcleo e olhos
  const glow = 0.6 + Math.sin(t * 5) * 0.4;
  ctx.fillStyle = cr; ctx.globalAlpha = 0.35 * glow; ctx.beginPath(); ctx.arc(0, -20 + b, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  poly([[0, -26 + b], [5, -20 + b], [0, -14 + b], [-5, -20 + b]], cr);
  ctx.fillStyle = '#fff'; ctx.fillRect(-1, -22 + b, 2, 2);
  ctx.fillStyle = phase > 1 ? '#ff4fd8' : '#ffe27a'; ctx.fillRect(-6, -31 + b, 3, 2); ctx.fillRect(3, -31 + b, 3, 2);
  ctx.restore();
}

/* ---------- Objetos do cenário ---------- */
const objCache = new Map();
function cached(key, w, h, draw) { let c = objCache.get(key); if (!c) { const [cv, g] = mk(w, h); draw(g); objCache.set(key, cv); c = cv; } return c; }

const TREE_COL = {
  green: ['#173d24', '#24602e', '#33803a', '#4ea044', '#7cc35a'],
  dark: ['#0f2a1f', '#173f2c', '#22553a', '#2f6e47', '#4d8f5c'],
  autumn: ['#4a2a12', '#8a4a1a', '#c8742a', '#e8a23a', '#ffd37a'],
  pink: ['#5a2246', '#9a3a72', '#d0609a', '#f08ab8', '#ffc2dc'],
  pine: ['#0f2a22', '#174033', '#1f5944', '#2c7457', '#4c9a72']
};
export function treeSprite(kind, seed) {
  return cached('tree' + kind + seed, 44, 56, g => {
    const r = rng(seed * 977 + 13), C = TREE_COL[kind] || TREE_COL.green;
    px(g, 19, 36, 7, 16, '#1a1424'); px(g, 20, 36, 5, 16, '#6b3d22'); px(g, 20, 36, 2, 16, '#8a5530'); px(g, 17, 50, 11, 3, '#4e2c18');
    if (kind === 'pine') {
      for (let i = 0; i < 4; i++) { const w = 10 + i * 5, yy = 6 + i * 9; [[0, C[0]], [1, C[2]], [2, C[3]]].forEach(([o, col]) => { g.fillStyle = col; g.beginPath(); g.moveTo(22, yy - 6 + o); g.lineTo(22 + w - o * 2, yy + 12 - o); g.lineTo(22 - w + o * 2, yy + 12 - o); g.fill(); }); }
      return;
    }
    const blobs = []; for (let i = 0; i < 7; i++) blobs.push([22 + (r() - 0.5) * 22, 20 + (r() - 0.5) * 18, 8 + r() * 6]);
    blobs.sort((a, b) => a[1] - b[1]);
    [[0, 1.5, 2], [1, 0, 1], [2, -1, 0], [3, -2.5, -1]].forEach(([ci, oy, grow]) => { g.fillStyle = C[ci]; blobs.forEach(([x, y, rr]) => { g.beginPath(); g.arc(x - (ci > 1 ? ci - 1 : 0), y + oy, rr + grow - ci * 1.2, 0, 7); g.fill(); }); });
    g.fillStyle = C[4]; for (let i = 0; i < 26; i++) { const [x, y, rr] = blobs[Math.floor(r() * blobs.length)]; px(g, Math.round(x - rr * 0.6 + r() * rr * 0.6), Math.round(y - rr * 0.6 + r() * rr * 0.5), 2, 1, C[4]); }
    if (kind === 'pink') for (let i = 0; i < 10; i++) px(g, Math.round(8 + r() * 28), Math.round(8 + r() * 28), 1, 1, '#fff');
  });
}
export function houseSprite(wt, roof, seed) {
  const W = wt * 16, H = 80;
  return cached('house' + wt + roof + seed, W, H, g => {
    const R = { red: ['#6a1e1a', '#a83a2a', '#d0583a'], blue: ['#1a2a4a', '#2f4f7a', '#4a72a8'], green: ['#1f3a22', '#2f5a34', '#4a7a46'], gold: ['#6a4a12', '#b8862a', '#e8b64a'] }[roof] || ['#6a1e1a', '#a83a2a', '#d0583a'];
    // parede de madeira
    px(g, 4, 40, W - 8, 38, '#1a1424'); px(g, 5, 41, W - 10, 36, '#8a5a32');
    for (let y = 44; y < 76; y += 5) px(g, 5, y, W - 10, 1, '#6b4224');
    px(g, 5, 41, 3, 36, '#5a3418'); px(g, W - 8, 41, 3, 36, '#5a3418');
    // pedra na base
    px(g, 5, 70, W - 10, 7, '#7a7f8c'); for (let x = 6; x < W - 8; x += 7) px(g, x, 70, 1, 7, '#55596a');
    // porta e janelas
    const dx = Math.floor(W / 2) - 6; px(g, dx - 1, 55, 14, 22, '#1a1424'); px(g, dx, 56, 12, 21, '#5a2e1a'); px(g, dx + 6, 56, 1, 21, '#3a1c0e'); px(g, dx + 9, 66, 2, 2, '#f0c04a');
    [10, W - 24].forEach(wx => { px(g, wx - 1, 49, 14, 12, '#1a1424'); px(g, wx, 50, 12, 10, '#ffd37a'); px(g, wx + 5, 50, 2, 10, '#5a3418'); px(g, wx, 54, 12, 2, '#5a3418'); px(g, wx, 50, 12, 2, '#fff1b8'); });
    // telhado
    g.fillStyle = '#1a1424'; g.beginPath(); g.moveTo(0, 44); g.lineTo(W / 2, 4); g.lineTo(W, 44); g.fill();
    g.fillStyle = R[1]; g.beginPath(); g.moveTo(3, 42); g.lineTo(W / 2, 7); g.lineTo(W - 3, 42); g.fill();
    g.fillStyle = R[0]; for (let y = 12; y < 42; y += 5) { const half = (y - 7) / 35 * (W / 2 - 3); px(g, Math.round(W / 2 - half), y, Math.round(half * 2), 1, R[0]); }
    g.fillStyle = R[2]; g.beginPath(); g.moveTo(W / 2, 7); g.lineTo(W / 2 - 4, 13); g.lineTo(W / 2 + 4, 13); g.fill();
    // chaminé
    px(g, W - 26, 12, 8, 18, '#1a1424'); px(g, W - 25, 13, 6, 17, '#8a8f9c'); px(g, W - 25, 13, 6, 2, '#55596a');
  });
}
export function drawSmoke(ctx, x, y, t) { for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.fillStyle = `rgba(220,220,230,${0.45 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 6 + i) * 3, y - k * 18, 2 + k * 3, 0, 7); ctx.fill(); } }

export function drawCrystal(ctx, x, y, t, big, color, dim) {
  const s = big ? 2 : 1, glow = dim ? 0.15 : 0.5 + Math.sin(t * 3) * 0.25, col = color || '#7fd6ff';
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const grd = ctx.createRadialGradient(0, -10 * s, 2, 0, -10 * s, 26 * s); grd.addColorStop(0, `rgba(160,230,255,${glow})`); grd.addColorStop(1, 'rgba(160,230,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(-26 * s, -36 * s, 52 * s, 52 * s);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 9 * s, 3 * s, 0, 0, 7); ctx.fill();
  const float = big ? 0 : Math.sin(t * 2) * 1.5;
  const shard = (ox, h, w, c1, c2) => { ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.moveTo(ox - w - 1, float); ctx.lineTo(ox, -h - 1 + float); ctx.lineTo(ox + w + 1, float); ctx.fill(); ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(ox - w, float); ctx.lineTo(ox, -h + float); ctx.lineTo(ox + w, float); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(ox, -h + float); ctx.lineTo(ox + w, float); ctx.lineTo(ox, float); ctx.fill(); };
  const c1 = dim ? '#556070' : col, c2 = dim ? '#3a4250' : '#3b7fd0';
  shard(-5 * s, 9 * s, 3 * s, c1, c2); shard(5 * s, 11 * s, 3 * s, c1, c2); shard(0, 18 * s, 4 * s, c1, c2);
  if (!dim) { ctx.fillStyle = '#fff'; ctx.fillRect(-1, Math.round(-14 * s + float), 1, 4 * s); }
  ctx.restore();
}

export function drawChest(ctx, x, y, open) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-8, -1, 16, 3);
  px(ctx, -8, -11, 16, 11, '#1a1424'); px(ctx, -7, -10, 14, 9, '#8a5530'); px(ctx, -7, -6, 14, 1, '#5a2e1a');
  if (open) { px(ctx, -8, -15, 16, 5, '#1a1424'); px(ctx, -7, -14, 14, 3, '#5a2e1a'); px(ctx, -6, -11, 12, 2, '#ffe27a'); }
  else { px(ctx, -8, -14, 16, 5, '#1a1424'); px(ctx, -7, -13, 14, 3, '#a86a3a'); px(ctx, -1, -9, 2, 3, '#f0c04a'); }
  px(ctx, -7, -10, 1, 9, '#f0c04a'); px(ctx, 6, -10, 1, 9, '#f0c04a');
  ctx.restore();
}
export function drawSign(ctx, x, y) { px(ctx, x - 1, y - 12, 3, 12, '#4e2c18'); px(ctx, x - 7, y - 16, 14, 8, '#1a1424'); px(ctx, x - 6, y - 15, 12, 6, '#a86a3a'); px(ctx, x - 4, y - 13, 8, 1, '#5a2e1a'); px(ctx, x - 4, y - 11, 6, 1, '#5a2e1a'); }
export function drawLamp(ctx, x, y, t) {
  px(ctx, x - 1, y - 20, 2, 20, '#2a2a3a'); px(ctx, x - 3, y - 24, 6, 5, '#1a1424'); px(ctx, x - 2, y - 23, 4, 3, '#ffe27a');
  const g = ctx.createRadialGradient(x, y - 22, 1, x, y - 22, 18); g.addColorStop(0, `rgba(255,220,120,${0.35 + Math.sin(t * 4) * 0.05})`); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 18, y - 40, 36, 36);
}
export function drawFountain(ctx, x, y, t) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.ellipse(0, -4, 20, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#8a8f9c'; ctx.beginPath(); ctx.ellipse(0, -5, 19, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a8ad0'; ctx.beginPath(); ctx.ellipse(0, -6, 15, 6.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.6; ctx.fillRect(Math.round(Math.cos(a) * 10), Math.round(-6 + Math.sin(a) * 4), 3, 1); }
  px(ctx, -3, -22, 6, 16, '#1a1424'); px(ctx, -2, -21, 4, 15, '#a8adb8');
  for (let i = 0; i < 6; i++) { const k = (t * 1.2 + i / 6) % 1; ctx.fillStyle = `rgba(160,220,255,${1 - k})`; ctx.fillRect(Math.round(Math.cos(i) * k * 9), Math.round(-23 - Math.sin(k * Math.PI) * 6 + k * 14), 1, 2); }
  ctx.restore();
}
export function drawRock(ctx, x, y, s) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 2.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-6, -7); ctx.lineTo(1, -10); ctx.lineTo(7, -6); ctx.lineTo(8, 0); ctx.fill();
  ctx.fillStyle = '#7a7f8c'; ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(-5, -6); ctx.lineTo(1, -9); ctx.lineTo(6, -5); ctx.lineTo(7, -1); ctx.fill();
  ctx.fillStyle = '#a8adb8'; ctx.fillRect(-3, -7, 4, 2); ctx.fillStyle = '#55596a'; ctx.fillRect(2, -3, 4, 2);
  ctx.restore();
}
export function drawPillar(ctx, x, y, broken) {
  const h = broken ? 18 : 34;
  px(ctx, x - 7, y - 4, 14, 4, '#1a1424'); px(ctx, x - 6, y - 4, 12, 3, '#8a8f9c');
  px(ctx, x - 5, y - h, 10, h - 3, '#1a1424'); px(ctx, x - 4, y - h + 1, 8, h - 4, '#b8bcc8'); px(ctx, x + 1, y - h + 1, 3, h - 4, '#8a8f9c');
  if (!broken) { px(ctx, x - 7, y - h - 4, 14, 5, '#1a1424'); px(ctx, x - 6, y - h - 3, 12, 3, '#a8adb8'); }
  else { px(ctx, x - 5, y - h - 2, 4, 3, '#1a1424'); px(ctx, x - 4, y - h - 1, 3, 2, '#b8bcc8'); }
  px(ctx, x - 4, y - h + 6, 3, 2, '#4ea044'); px(ctx, x + 2, y - h + 14, 2, 3, '#33803a');
}
export function drawBush(ctx, x, y, kind) {
  const c = kind === 'berry' ? ['#173d24', '#2f6e3a', '#4ea044'] : ['#173d24', '#24602e', '#4ea044'];
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, 8, 2.5, 0, 0, 7); ctx.fill();
  [[0, 0], [1, -1], [2, -2]].forEach(([i, o]) => { ctx.fillStyle = c[i]; [[-4, -5], [3, -5], [0, -8]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(x + a, y + b + o, 5 - i, 0, 7); ctx.fill(); }); });
  if (kind === 'berry') { ctx.fillStyle = '#ffd23f'; [[-4, -7], [3, -9], [1, -4]].forEach(([a, b]) => ctx.fillRect(x + a, y + b, 2, 2)); }
}
export function drawMushroomGlow(ctx, x, y, t, col) {
  const g = 0.5 + Math.sin(t * 2 + x) * 0.3, c = col || '#4dc3ff';
  const grd = ctx.createRadialGradient(x, y - 4, 1, x, y - 4, 12); grd.addColorStop(0, `rgba(120,220,255,${0.35 * g})`); grd.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = grd; ctx.fillRect(x - 12, y - 16, 24, 24);
  px(ctx, x - 1, y - 5, 2, 5, '#d8e8f0'); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - 5, 4, 2.5, 0, Math.PI, 0); ctx.fill();
}
export function drawPortal(ctx, x, y, t, open) {
  ctx.save(); ctx.translate(x, y);
  px(ctx, -22, -40, 8, 40, '#1a1424'); px(ctx, 14, -40, 8, 40, '#1a1424'); px(ctx, -21, -39, 6, 39, '#b8bcc8'); px(ctx, 15, -39, 6, 39, '#b8bcc8');
  px(ctx, -24, -46, 48, 8, '#1a1424'); px(ctx, -23, -45, 46, 6, '#d0d4de'); px(ctx, -4, -44, 8, 4, '#7fd6ff');
  const grd = ctx.createLinearGradient(0, -38, 0, 0);
  if (open) { grd.addColorStop(0, 'rgba(127,214,255,.9)'); grd.addColorStop(1, 'rgba(162,61,255,.6)'); }
  else { grd.addColorStop(0, `rgba(255,240,180,${0.35 + Math.sin(t * 3) * 0.15})`); grd.addColorStop(1, 'rgba(255,240,180,.1)'); }
  ctx.fillStyle = grd; ctx.fillRect(-14, -38, 28, 38);
  if (open) for (let i = 0; i < 6; i++) { const k = (t * 0.7 + i / 6) % 1; ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.fillRect(Math.round(Math.sin(i * 2.3) * 10), Math.round(-k * 36), 1, 3); }
  else { ctx.strokeStyle = 'rgba(255,240,180,.8)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14, -8 - i * 9); ctx.lineTo(14, -12 - i * 9); ctx.stroke(); } }
  ctx.restore();
}

/* ---------- Ícones (inventário e HUD) ---------- */
export function drawIcon(ctx, kind, x, y) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  if (kind === 'potion' || kind === 'ether') {
    const c = kind === 'potion' ? '#ff4f6a' : '#4dc3ff';
    px(ctx, -3, -8, 6, 2, '#1a1424'); px(ctx, -2, -7, 4, 2, '#a86a3a');
    ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.arc(0, -1, 5, 0, 7); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -1, 4, 0, 7); ctx.fill();
    px(ctx, -2, -3, 2, 2, '#fff');
  } else if (kind === 'berry') { ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, 7); ctx.fill(); px(ctx, -1, -6, 2, 3, '#4ea044'); px(ctx, -2, -2, 1, 1, '#fff'); }
  else if (kind === 'shard') { ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0); ctx.fill(); ctx.fillStyle = '#7fd6ff'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.fill(); px(ctx, -1, -4, 1, 4, '#fff'); }
  else if (kind === 'sword' || kind === 'sword2') { drawSword(ctx, -6, 6, -Math.PI / 4, kind === 'sword2' ? 'sword_crystal' : 'sword_iron'); }
  else if (kind === 'key') { px(ctx, -5, -2, 5, 5, '#1a1424'); px(ctx, -4, -1, 3, 3, '#f0c04a'); px(ctx, -3, 0, 1, 1, '#1a1424'); px(ctx, 0, -1, 7, 3, '#1a1424'); px(ctx, 0, 0, 6, 1, '#f0c04a'); px(ctx, 4, 1, 2, 3, '#1a1424'); px(ctx, 4, 1, 1, 2, '#f0c04a'); }
  else if (kind === 'coin') { ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#f0c04a'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill(); px(ctx, -1, -2, 1, 3, '#fff1b8'); }
  ctx.restore();
}
