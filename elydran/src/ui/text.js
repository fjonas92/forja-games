// Texto em pixel e painéis no estilo do jogo
import { FONT } from '../config.js';

export function text(ctx, s, x, y, o) {
  o = o || {}; ctx.font = (o.bold === false ? '' : 'bold ') + (o.size || 8) + 'px ' + FONT;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'top';
  if (o.shadow !== false) { ctx.fillStyle = o.shadowCol || '#120c1c'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
  ctx.fillStyle = o.col || '#f3ecff'; ctx.fillText(s, Math.round(x), Math.round(y));
}
// quebra o texto em linhas que cabem na largura
export function wrap(ctx, s, w, size) {
  ctx.font = 'bold ' + (size || 8) + 'px ' + FONT;
  const out = []; let line = '';
  for (const word of String(s).split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out;
}
// painel com moldura dourada (inspirado nas telas de RPG)
export function panel(ctx, x, y, w, h, o) {
  o = o || {}; x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#120c1c'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = o.bg || 'rgba(26,20,44,.94)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = o.border || '#c9a24a'; ctx.lineWidth = 1; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.strokeStyle = 'rgba(201,162,74,.35)'; ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  ctx.fillStyle = o.border || '#f0c04a'; [[x + 1, y + 1], [x + w - 4, y + 1], [x + 1, y + h - 4], [x + w - 4, y + h - 4]].forEach(([a, b]) => ctx.fillRect(a, b, 3, 3));
}
export function bar(ctx, x, y, w, h, k, col, bg) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#120c1c'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg || '#3a2a44'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, k))), h);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, k))), 1);
}
// botão de dica (ex.: [E] Falar)
export function keyHint(ctx, key, label, x, y, align) {
  ctx.font = 'bold 8px ' + FONT; const kw = Math.max(9, ctx.measureText(key).width + 6), lw = ctx.measureText(label).width;
  let sx = align === 'center' ? x - (kw + 4 + lw) / 2 : align === 'right' ? x - kw - 4 - lw : x;
  sx = Math.round(sx); y = Math.round(y);
  ctx.fillStyle = '#120c1c'; ctx.fillRect(sx - 1, y - 1, kw + 2, 12); ctx.fillStyle = '#f0c04a'; ctx.fillRect(sx, y, kw, 10);
  text(ctx, key, sx + kw / 2, y + 1, { align: 'center', col: '#120c1c', shadow: false });
  text(ctx, label, sx + kw + 4, y + 1);
}
