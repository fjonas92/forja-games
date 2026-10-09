// HUD: vida, energia, experiência, criatura ativa, moedas, missão e barra do chefe
import { VIEW_W, VIEW_H } from '../config.js';
import { text, panel, bar, keyHint } from './text.js';
import { drawCreature, drawIcon, charFrame } from '../gfx/sprites.js';
import { CREATURES, ELEMENTS, xpToNext } from '../data/creatures.js';

export function drawHUD(ctx, g, t) {
  const p = g.player, s = p.stats;
  // herói
  panel(ctx, 4, 4, 128, 40);
  ctx.fillStyle = '#2a2048'; ctx.fillRect(9, 9, 22, 22); ctx.drawImage(charFrame('hero', 'down', 0), 0, 0, 16, 14, 11, 12, 16, 14);
  ctx.strokeStyle = '#f0c04a'; ctx.strokeRect(9.5, 9.5, 21, 21);
  text(ctx, 'Nv ' + p.level, 20, 33, { size: 7, align: 'center', col: '#ffe27a' });
  text(ctx, 'Kael', 36, 8, { size: 8, col: '#fff' });
  bar(ctx, 36, 19, 90, 6, p.hp / s.maxHp, p.hp / s.maxHp < 0.3 ? '#ff4f6a' : '#e8424f');
  text(ctx, Math.ceil(p.hp) + '/' + s.maxHp, 81, 18, { size: 6, align: 'center' });
  bar(ctx, 36, 28, 90, 4, p.mp / s.maxMp, '#4dc3ff');
  bar(ctx, 36, 36, 90, 2, p.xp / xpToNext(p.level), '#ffe27a', '#2a2048');
  // criatura ativa
  const pet = g.pet;
  if (pet) {
    const c = pet.data, d = CREATURES[c.id], cs = pet.stats, el = ELEMENTS[d.element];
    panel(ctx, 4, 47, 100, 26);
    ctx.save(); ctx.beginPath(); ctx.rect(8, 51, 18, 18); ctx.clip(); ctx.fillStyle = '#2a2048'; ctx.fillRect(8, 51, 18, 18);
    drawCreature(ctx, d.look, 17, 67, 1, pet.fainted ? 0 : t, 0.85, !d.evolution); ctx.restore();
    text(ctx, d.name, 30, 50, { size: 7, col: pet.fainted ? '#8a8098' : '#fff' });
    text(ctx, 'Nv ' + c.level, 99, 50, { size: 6, align: 'right', col: el.color });
    bar(ctx, 30, 60, 68, 4, c.hp / cs.maxHp, '#7ad94a');
    bar(ctx, 30, 67, 68, 2, c.xp / xpToNext(c.level), '#ffe27a', '#2a2048');
    if (g.party.length > 1) keyHint(ctx, g.input.label('swap'), 'trocar', 8, 76);
  }
  // moedas e fragmentos
  panel(ctx, VIEW_W - 68, 4, 64, g.inv.count('shard') || g.quests.step('main') === 'shards' ? 30 : 18);
  drawIcon(ctx, 'coin', VIEW_W - 58, 13); text(ctx, String(g.inv.coins), VIEW_W - 50, 9, { col: '#ffe27a' });
  if (g.inv.count('shard') || g.quests.step('main') === 'shards') { drawIcon(ctx, 'shard', VIEW_W - 58, 25); text(ctx, g.inv.count('shard') + '/3', VIEW_W - 50, 21, { col: '#9fe8ff' }); }
  // missão atual
  const q = g.quests.text('main');
  if (q && !g.boss) {
    const qy = g.input.lastDevice === 'touch' ? 90 : VIEW_H - 19; // no toque o analógico fica embaixo
    ctx.font = 'bold 7px "Pixelify Sans", monospace'; const w = Math.min(230, ctx.measureText(q).width + 20);
    ctx.fillStyle = 'rgba(18,12,28,.72)'; ctx.fillRect(4, qy, w, 15); ctx.fillStyle = '#f0c04a'; ctx.fillRect(4, qy, 2, 15);
    text(ctx, '!', 10, qy + 3, { size: 7, col: '#f0c04a' }); text(ctx, q.length > 52 ? q.slice(0, 50) + '…' : q, 16, qy + 3, { size: 7 });
  }
  // barra do chefe
  if (g.boss && g.boss.hp > 0 && g.boss.state !== 'sleep') {
    const b = g.boss, w = 200, x = (VIEW_W - w) / 2;
    text(ctx, b.d.name.toUpperCase(), VIEW_W / 2, 6, { size: 8, align: 'center', col: b.phase > 1 ? '#ff9ae8' : '#bff3ff' });
    bar(ctx, x, 17, w, 6, b.hp / b.maxHp, b.phase > 1 ? '#d83a8a' : '#a8243a', '#2a1a24');
  }
  // avisos rápidos
  g.toasts.forEach((m, i) => {
    const a = Math.min(1, m.t * 4, (m.life - m.t) * 2); ctx.globalAlpha = a;
    ctx.font = 'bold 8px "Pixelify Sans", monospace'; const w = ctx.measureText(m.s).width + 16, y = 46 + i * 15;
    ctx.fillStyle = 'rgba(18,12,28,.85)'; ctx.fillRect(VIEW_W / 2 - w / 2, y, w, 13); ctx.fillStyle = m.col; ctx.fillRect(VIEW_W / 2 - w / 2, y, w, 1);
    text(ctx, m.s, VIEW_W / 2, y + 3, { align: 'center', col: m.col }); ctx.globalAlpha = 1;
  });
  // nome da região ao entrar
  if (g.regionT > 0) {
    ctx.globalAlpha = Math.max(0, Math.min(1, g.regionT * 1.2, (3.2 - g.regionT) * 2));
    text(ctx, '~ ' + g.map.name + ' ~', VIEW_W / 2, 92, { size: 14, align: 'center', col: '#ffe9b0' }); ctx.globalAlpha = 1;
  }
  // dica de interação
  if (g.prompt && g.mode === 'play') { const pr = g.prompt; let px = pr.x - g.cam.x, py = pr.y - g.cam.y - 34; if (g.r3d) { const q = g.r3d.project(pr.x, pr.y, 2.5); px = q.x; py = q.y; } keyHint(ctx, g.input.label('interact'), pr.label, px, py, 'center'); }
}
