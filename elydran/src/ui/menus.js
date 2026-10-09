// Telas e menus. Todos funcionam com teclado, controle e toque (cima/baixo/esquerda/direita + confirmar/voltar)
import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { text, wrap, panel, bar, keyHint } from './text.js';
import { drawIcon, drawCreature, drawCrystal } from '../gfx/sprites.js';
import { ITEMS } from '../data/items.js';
import { CREATURES, ELEMENTS, xpToNext } from '../data/creatures.js';
import { QUESTS } from '../data/quests.js';
import { creatureStats } from '../systems/progression.js';
import { T } from '../world/maps.js';
import { Audio } from '../systems/audio.js';

const nav = (g, n, axis) => { const i = g.input, a = axis === 'h' ? ['left', 'right'] : ['up', 'down']; if (i.pressed(a[0])) { Audio.select(); return (g.ui.sel - 1 + n) % n; } if (i.pressed(a[1])) { Audio.select(); return (g.ui.sel + 1) % n; } return g.ui.sel; };
const ok = g => g.input.pressed('interact') || g.input.pressed('attack');
const back = g => g.input.pressed('back') || g.input.pressed('dodge');

/* ---------- Abertura ---------- */
export function drawTitle(ctx, g, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#120a2e'); sky.addColorStop(0.55, '#3a2a7a'); sky.addColorStop(1, '#8a5ab8');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (let i = 0; i < 70; i++) { const x = (i * 97) % VIEW_W, y = (i * 53) % 150, k = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); ctx.fillStyle = `rgba(255,255,255,${k * 0.8})`; ctx.fillRect(x, y, 1, 1); }
  // ilhas flutuantes
  const isl = (x, y, w, c1, c2, sp) => { const yy = y + Math.sin(t * sp + x) * 3; ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x + w * 0.3, yy + w * 0.8); ctx.lineTo(x - w * 0.2, yy + w * 1.1); ctx.fill(); ctx.fillStyle = c1; ctx.fillRect(x - w, yy - 4, w * 2, 5); };
  isl(70, 120, 30, '#4a8a5a', '#2a1a3a', 0.8); isl(410, 100, 40, '#4a8a5a', '#2a1a3a', 0.6); isl(300, 60, 16, '#3a7a4a', '#24162f', 1.1);
  // montanhas e castelo
  ctx.fillStyle = '#24163e'; ctx.beginPath(); ctx.moveTo(0, 230); [[60, 170], [120, 210], [190, 150], [250, 200], [330, 160], [400, 205], [480, 175], [480, 270], [0, 270]].forEach(([a, b]) => ctx.lineTo(a, b)); ctx.fill();
  ctx.fillStyle = '#1a0f2e'; [[392, 150, 16, 70], [382, 170, 8, 50], [418, 166, 10, 54], [404, 130, 6, 30]].forEach(([a, b, w, h]) => { ctx.fillRect(a, b, w, h); ctx.beginPath(); ctx.moveTo(a - 2, b); ctx.lineTo(a + w / 2, b - 14); ctx.lineTo(a + w + 2, b); ctx.fill(); });
  ctx.fillStyle = '#ffd37a'; [[396, 170], [406, 190], [386, 188], [422, 180]].forEach(([a, b]) => ctx.fillRect(a, b, 2, 3));
  ctx.fillStyle = '#140a24'; ctx.fillRect(0, 238, VIEW_W, 32);
  drawCrystal(ctx, 240, 250, t, true);
  // logotipo
  const glow = 0.6 + Math.sin(t * 2) * 0.2;
  ctx.save(); ctx.shadowColor = `rgba(127,214,255,${glow})`; ctx.shadowBlur = 12;
  text(ctx, 'ELYDRAN', VIEW_W / 2, 30, { size: 40, align: 'center', col: '#e9f6ff', shadowCol: '#2a1a5a' }); ctx.restore();
  text(ctx, '— Lendas do Cristal —', VIEW_W / 2, 74, { size: 11, align: 'center', col: '#ffd37a' });
  const opts = g.titleOpts(); g.ui.sel = Math.min(g.ui.sel, opts.length - 1);
  opts.forEach((o, i) => { const y = 112 + i * 18, on = i === g.ui.sel; if (on) { ctx.fillStyle = 'rgba(240,192,74,.18)'; ctx.fillRect(VIEW_W / 2 - 70, y - 3, 140, 15); text(ctx, '▶', VIEW_W / 2 - 64, y, { size: 9, col: '#f0c04a' }); } text(ctx, o.label, VIEW_W / 2, y, { size: 10, align: 'center', col: on ? '#ffe27a' : '#d8cfee' }); });
  text(ctx, g.input.lastDevice === 'gamepad' ? 'Controle conectado' : 'Teclado, controle ou toque', VIEW_W / 2, VIEW_H - 12, { size: 7, align: 'center', col: '#b8a8d8' });
  text(ctx, 'v0.1', VIEW_W - 6, VIEW_H - 12, { size: 7, align: 'right', col: '#8a7aa8' });
}
export function updateTitle(g) { const opts = g.titleOpts(); g.ui.sel = nav(g, opts.length); if (ok(g) || g.input.pressed('pause')) { Audio.select(); opts[g.ui.sel].fn(); } }

/* ---------- Controles ---------- */
export function drawControls(ctx, g) {
  panel(ctx, 70, 30, 340, 210); text(ctx, 'Controles', VIEW_W / 2, 40, { size: 12, align: 'center', col: '#ffe27a' });
  const rows = [['Mover', 'WASD / setas', 'Analógico / direcional'], ['Atacar', 'Espaço', 'A / ✕'], ['Esquivar', 'Shift', 'B / ○'], ['Interagir', 'E', 'X / □'], ['Pulso de Cristal', 'Q', 'Y / △'], ['Trocar criatura', 'Tab', 'LB / RB'], ['Inventário', 'I', 'LT / RT'], ['Mapa', 'M', 'View / Select'], ['Pausar', 'Esc', 'Menu / Start']];
  text(ctx, 'Teclado', 230, 60, { size: 7, col: '#9fe8ff' }); text(ctx, 'Controle', 320, 60, { size: 7, col: '#9fe8ff' });
  rows.forEach(([a, k, p], i) => { const y = 72 + i * 16; text(ctx, a, 90, y, { size: 8 }); text(ctx, k, 230, y, { size: 8, col: '#ffe27a' }); text(ctx, p, 320, y, { size: 8, col: '#ffe27a' }); });
  keyHint(ctx, g.input.label('back'), 'Voltar', VIEW_W / 2, 222, 'center');
}
export function updateControls(g) { if (back(g) || ok(g) || g.input.pressed('pause')) { Audio.select(); g.closeOverlay(); } }

/* ---------- Diálogo ---------- */
export function drawDialog(ctx, g, t) {
  const d = g.dialog; if (!d) return; const [name, line] = d.lines[d.i];
  panel(ctx, 20, VIEW_H - 74, VIEW_W - 40, 64);
  ctx.fillStyle = '#c9a24a'; ctx.fillRect(30, VIEW_H - 82, Math.min(150, name.length * 6 + 16), 14); text(ctx, name, 38, VIEW_H - 80, { size: 8, col: '#120c1c', shadow: false });
  const shown = line.slice(0, Math.floor(d.chars)), lines = wrap(ctx, shown, VIEW_W - 72, 9);
  lines.slice(0, 4).forEach((l, i) => text(ctx, l, 34, VIEW_H - 62 + i * 12, { size: 9 }));
  if (d.chars >= line.length && Math.floor(t * 3) % 2) text(ctx, '▼', VIEW_W - 36, VIEW_H - 22, { size: 8, col: '#f0c04a' });
}
export function updateDialog(g, dt) {
  const d = g.dialog, line = d.lines[d.i][1], before = Math.floor(d.chars);
  d.chars = Math.min(line.length, d.chars + dt * 55); if (Math.floor(d.chars) !== before && Math.floor(d.chars) % 3 === 0) Audio.talk();
  if (ok(g) || back(g)) { if (d.chars < line.length) d.chars = line.length; else g.nextLine(); }
}

/* ---------- Loja ---------- */
const SHOP = ['potion', 'ether', 'berry'];
export function drawShop(ctx, g) {
  panel(ctx, 110, 50, 260, 150); text(ctx, 'Loja da Lina', VIEW_W / 2, 58, { size: 11, align: 'center', col: '#ffe27a' });
  drawIcon(ctx, 'coin', 128, 82); text(ctx, String(g.inv.coins), 136, 78, { col: '#ffe27a' });
  SHOP.forEach((id, i) => { const it = ITEMS[id], y = 98 + i * 24, on = g.ui.sel === i; if (on) { ctx.fillStyle = 'rgba(240,192,74,.15)'; ctx.fillRect(120, y - 4, 240, 22); } drawIcon(ctx, it.icon, 134, y + 7); text(ctx, it.name, 146, y, { size: 8, col: on ? '#ffe27a' : '#fff' }); text(ctx, it.desc, 146, y + 9, { size: 6, col: '#b8a8d8' }); text(ctx, it.price + ' moedas', 352, y + 2, { size: 7, align: 'right', col: g.inv.coins >= it.price ? '#ffe27a' : '#ff6a6a' }); text(ctx, 'tem ' + g.inv.count(id), 352, y + 11, { size: 6, align: 'right', col: '#b8a8d8' }); });
  keyHint(ctx, g.input.label('interact'), 'Comprar', 160, 182, 'center'); keyHint(ctx, g.input.label('back'), 'Sair', 320, 182, 'center');
}
export function updateShop(g) {
  g.ui.sel = nav(g, SHOP.length);
  if (ok(g)) { const id = SHOP[g.ui.sel], it = ITEMS[id]; if (g.inv.coins >= it.price) { g.inv.coins -= it.price; g.inv.add(id); Audio.coin(); } else { Audio.hurt(); g.toast('Moedas insuficientes', '#ff6a6a'); } }
  if (back(g)) { Audio.select(); g.closeOverlay(); }
}

/* ---------- Inventário (itens, criaturas e missões) ---------- */
const TABS = ['Itens', 'Criaturas', 'Missões'];
export function drawMenu(ctx, g, t) {
  panel(ctx, 30, 18, VIEW_W - 60, VIEW_H - 36);
  TABS.forEach((n, i) => { const x = 60 + i * 120, on = g.ui.tab === i; text(ctx, n, x + 40, 26, { size: 10, align: 'center', col: on ? '#ffe27a' : '#9a8ab8' }); if (on) { ctx.fillStyle = '#f0c04a'; ctx.fillRect(x + 10, 40, 60, 1); } });
  text(ctx, '◀ ' + g.input.label('swap') + ' ▶', VIEW_W - 44, 28, { size: 6, align: 'right', col: '#8a7aa8' });
  if (g.ui.tab === 0) {
    const list = g.inv.list();
    if (!list.length) text(ctx, 'Sua bolsa está vazia.', VIEW_W / 2, 110, { size: 8, align: 'center', col: '#9a8ab8' });
    list.forEach((id, i) => { const it = ITEMS[id], y = 50 + i * 19, on = g.ui.sel === i; if (on) { ctx.fillStyle = 'rgba(240,192,74,.15)'; ctx.fillRect(44, y - 3, 200, 18); } drawIcon(ctx, it.icon, 56, y + 6); text(ctx, it.name + (g.player.weapon === id ? ' (equipada)' : ''), 68, y, { size: 8, col: on ? '#ffe27a' : '#fff' }); text(ctx, 'x' + g.inv.count(id), 236, y, { size: 8, align: 'right', col: '#b8a8d8' }); });
    const id = list[g.ui.sel]; if (id) { const it = ITEMS[id]; panel(ctx, 256, 50, 186, 90, { bg: 'rgba(18,12,28,.9)' }); text(ctx, it.name, 266, 58, { size: 9, col: '#ffe27a' }); wrap(ctx, it.desc, 166, 8).forEach((l, i) => text(ctx, l, 266, 74 + i * 11, { size: 8 })); if (it.kind !== 'quest') keyHint(ctx, g.input.label('interact'), it.kind === 'weapon' ? 'Equipar' : 'Usar', 266, 124); }
    const p = g.player, s = p.stats; text(ctx, `Ataque ${s.attack}   Defesa ${s.defense}   Vida ${Math.ceil(p.hp)}/${s.maxHp}   Energia ${Math.floor(p.mp)}/${s.maxMp}`, VIEW_W / 2, VIEW_H - 32, { size: 7, align: 'center', col: '#b8a8d8' });
  } else if (g.ui.tab === 1) {
    g.party.forEach((c, i) => {
      const d = CREATURES[c.id], st = creatureStats(c), y = 50 + i * 54, on = g.ui.sel === i, el = ELEMENTS[d.element];
      panel(ctx, 44, y, VIEW_W - 88, 50, { bg: on ? 'rgba(60,44,90,.95)' : 'rgba(18,12,28,.9)', border: on ? '#f0c04a' : '#6a5a8a' });
      drawCreature(ctx, d.look, 72, y + 40, 1, t, 1.5, !d.evolution);
      text(ctx, d.name + (g.activePet === i ? '  ★ ativa' : ''), 100, y + 6, { size: 9, col: '#ffe27a' });
      text(ctx, el.name + ' · ' + d.rarity + ' · Nv ' + c.level, 100, y + 18, { size: 7, col: el.color });
      text(ctx, `Vida ${Math.ceil(c.hp)}/${st.maxHp}  Ataque ${st.attack}  Defesa ${st.defense}  Vínculo ${c.bond}`, 100, y + 28, { size: 7 });
      bar(ctx, 100, y + 40, 120, 3, c.xp / xpToNext(c.level), '#ffe27a', '#2a2048');
      text(ctx, d.evolution ? 'Evolui no nível ' + d.evolution.requiredLevel : 'Forma final', 228, y + 38, { size: 6, col: '#9a8ab8' });
      text(ctx, d.skill.name, VIEW_W - 56, y + 6, { size: 7, align: 'right', col: '#9fe8ff' });
    });
    if (g.party.length > 1) keyHint(ctx, g.input.label('interact'), 'Deixar ativa', VIEW_W / 2, VIEW_H - 34, 'center');
  } else {
    let y = 52;
    for (const q of Object.keys(g.quests.state)) {
      const Q = QUESTS[q], cur = g.quests.state[q];
      text(ctx, Q.name + (g.quests.done(q) ? ' ✓' : ''), 50, y, { size: 9, col: g.quests.done(q) ? '#7ad94a' : '#ffe27a' }); y += 13;
      Q.steps.forEach((s, i) => { if (i > cur) return; text(ctx, (i < cur ? '✓ ' : '• ') + s.text, 58, y, { size: 7, col: i < cur ? '#8a7aa8' : '#fff' }); y += 11; });
      y += 8;
    }
  }
  keyHint(ctx, g.input.label('back'), 'Fechar', VIEW_W - 50, VIEW_H - 32, 'right');
}
export function updateMenu(g) {
  const i = g.input;
  if (i.pressed('left')) { g.ui.tab = (g.ui.tab + 2) % 3; g.ui.sel = 0; Audio.select(); }
  if (i.pressed('right') || i.pressed('swap')) { g.ui.tab = (g.ui.tab + 1) % 3; g.ui.sel = 0; Audio.select(); }
  if (g.ui.tab === 0) {
    const list = g.inv.list(); if (list.length) g.ui.sel = Math.min(nav(g, list.length), list.length - 1);
    if (ok(g) && list[g.ui.sel]) g.useItem(list[g.ui.sel]);
  } else if (g.ui.tab === 1) {
    g.ui.sel = nav(g, g.party.length);
    if (ok(g)) g.setActivePet(g.ui.sel);
  }
  if (back(g) || i.pressed('inventory') || i.pressed('pause')) { Audio.select(); g.closeOverlay(); }
}

/* ---------- Mapa ---------- */
const MAPCOL = { [T.GRASS]: '#5fb04a', [T.GRASS2]: '#4a943e', [T.TALL]: '#4a943e', [T.FLOWER]: '#5fb04a', [T.MOSS]: '#3a7a3e', [T.PATH]: '#c9a06a', [T.COBBLE]: '#9a9aa8', [T.WATER]: '#3a9ad8', [T.SAND]: '#e8d39a', [T.BRIDGE]: '#8a5530', [T.STONE]: '#5a5478', [T.VOID]: '#0b0718', [T.CLIFF]: '#3a2a2a' };
export function drawMap(ctx, g, t) {
  const m = g.map, s = Math.min((VIEW_W - 80) / m.w, (VIEW_H - 70) / m.h), w = m.w * s, h = m.h * s, x0 = (VIEW_W - w) / 2, y0 = 40;
  panel(ctx, x0 - 10, 14, w + 20, h + 40); text(ctx, m.name, VIEW_W / 2, 22, { size: 10, align: 'center', col: '#ffe27a' });
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { ctx.fillStyle = MAPCOL[m.get(x, y)] || '#333'; ctx.fillRect(x0 + x * s, y0 + y * s, Math.ceil(s), Math.ceil(s)); }
  ctx.fillStyle = 'rgba(20,50,25,.55)'; for (const o of m.objects) if (o.type === 'tree') ctx.fillRect(x0 + o.x / TILE * s - s * 0.8, y0 + o.y / TILE * s - s * 1.4, s * 1.6, s * 1.4);
  ctx.fillStyle = '#a83a2a'; for (const o of m.objects) if (o.type === 'house') ctx.fillRect(x0 + (o.x / TILE - o.wt / 2) * s, y0 + (o.y / TILE - 3) * s, o.wt * s, 3 * s);
  const mark = (x, y, col, r) => { ctx.fillStyle = '#120c1c'; ctx.fillRect(x0 + x / TILE * s - r - 1, y0 + y / TILE * s - r - 1, r * 2 + 2, r * 2 + 2); ctx.fillStyle = col; ctx.fillRect(x0 + x / TILE * s - r, y0 + y / TILE * s - r, r * 2, r * 2); };
  m.saves.forEach(sv => mark(sv.x, sv.y, '#7fd6ff', 2));
  m.chests.forEach(c => { if (!g.flags[c.id]) mark(c.x, c.y, '#f0c04a', 2); });
  g.npcs.forEach(n => mark(n.x, n.y, '#ffffff', 1.5));
  for (const tg of g.questTargets()) if (Math.floor(t * 3) % 2) mark(tg.x, tg.y, '#ff4fd8', 2.5);
  mark(g.player.x, g.player.y, '#ffe27a', 2.5);
  const lg = [['#ffe27a', 'Você'], ['#7fd6ff', 'Cristal (salvar)'], ['#f0c04a', 'Baú'], ['#ff4fd8', 'Objetivo']];
  lg.forEach(([c, n], i) => { const lx = x0 + i * (w / 4); ctx.fillStyle = c; ctx.fillRect(lx, y0 + h + 6, 5, 5); text(ctx, n, lx + 8, y0 + h + 4, { size: 6 }); });
}
export function updateMap(g) { if (back(g) || g.input.pressed('map') || g.input.pressed('pause') || ok(g)) { Audio.select(); g.closeOverlay(); } }

/* ---------- Pausa ---------- */
export function drawPause(ctx, g) {
  ctx.fillStyle = 'rgba(10,6,20,.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const opts = g.pauseOpts(); panel(ctx, VIEW_W / 2 - 80, 54, 160, 30 + opts.length * 18);
  text(ctx, 'Pausa', VIEW_W / 2, 62, { size: 11, align: 'center', col: '#ffe27a' });
  opts.forEach((o, i) => { const y = 82 + i * 18, on = g.ui.sel === i; if (on) { ctx.fillStyle = 'rgba(240,192,74,.18)'; ctx.fillRect(VIEW_W / 2 - 70, y - 3, 140, 15); } text(ctx, o.label, VIEW_W / 2, y, { size: 9, align: 'center', col: on ? '#ffe27a' : '#fff' }); });
}
export function updatePause(g) { const opts = g.pauseOpts(); g.ui.sel = nav(g, opts.length); if (ok(g)) { Audio.select(); opts[g.ui.sel].fn(); } else if (back(g) || g.input.pressed('pause')) { Audio.select(); g.closeOverlay(); } }

/* ---------- Evolução ---------- */
export function drawEvolve(ctx, g, t) {
  const e = g.evo, k = e.t;
  ctx.fillStyle = `rgba(10,6,20,${Math.min(0.85, k)})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const swap = k < 2.6 ? Math.floor(k * (2 + k * 4)) % 2 : 1, id = swap ? e.to : e.from, d = CREATURES[id];
  const glow = ctx.createRadialGradient(VIEW_W / 2, 140, 4, VIEW_W / 2, 140, 90); glow.addColorStop(0, `rgba(255,240,200,${k < 2.6 ? 0.5 : 0.25})`); glow.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 40, VIEW_W, 200);
  ctx.save(); if (k < 2.6 && swap === 0) ctx.globalAlpha = 0.8;
  drawCreature(ctx, d.look, VIEW_W / 2, 165, 1, t, 3.2 * (d.size || 1) / 1.2, !d.evolution); ctx.restore();
  text(ctx, k < 2.6 ? 'O que está acontecendo com ' + CREATURES[e.from].name + '?' : CREATURES[e.from].name + ' evoluiu para ' + d.name + '!', VIEW_W / 2, 196, { size: 11, align: 'center', col: '#ffe27a' });
  if (k >= 2.6) { text(ctx, 'Nova habilidade: ' + d.skill.name, VIEW_W / 2, 214, { size: 8, align: 'center', col: '#9fe8ff' }); keyHint(ctx, g.input.label('interact'), 'Continuar', VIEW_W / 2, 236, 'center'); }
}
export function updateEvolve(g, dt) { g.evo.t += dt; if (g.evo.t > 2.6 && g.evo.t - dt <= 2.6) Audio.levelUp(); if (g.evo.t > 3 && (ok(g) || back(g))) g.closeOverlay(); }

/* ---------- Derrota e vitória ---------- */
export function drawOver(ctx, g) {
  ctx.fillStyle = 'rgba(30,6,16,.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'Você caiu...', VIEW_W / 2, 88, { size: 18, align: 'center', col: '#ff8a9a' });
  text(ctx, 'Seus companheiros te levaram de volta ao último cristal.', VIEW_W / 2, 118, { size: 8, align: 'center' });
  text(ctx, 'Você perdeu metade das moedas.', VIEW_W / 2, 132, { size: 8, align: 'center', col: '#ffe27a' });
  keyHint(ctx, g.input.label('interact'), 'Levantar', VIEW_W / 2, 160, 'center');
}
export function updateOver(g) { if (ok(g)) g.respawn(); }
export function drawVictory(ctx, g, t) {
  ctx.fillStyle = 'rgba(10,6,30,.78)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawCrystal(ctx, VIEW_W / 2, 120, t, true);
  text(ctx, 'O Cristal de Aurora brilha outra vez!', VIEW_W / 2, 132, { size: 12, align: 'center', col: '#bff3ff' });
  const mins = Math.floor(g.playTime / 60);
  text(ctx, `Nível ${g.player.level} · ${g.party.length} criatura${g.party.length > 1 ? 's' : ''} · ${mins} min de jogo`, VIEW_W / 2, 152, { size: 8, align: 'center' });
  text(ctx, 'Obrigado por jogar a demo de ELYDRAN: Lendas do Cristal.', VIEW_W / 2, 172, { size: 8, align: 'center', col: '#ffe27a' });
  text(ctx, 'Novas regiões, criaturas e transformações estão a caminho.', VIEW_W / 2, 184, { size: 7, align: 'center', col: '#b8a8d8' });
  keyHint(ctx, g.input.label('interact'), 'Continuar explorando', VIEW_W / 2, 210, 'center');
}
export function updateVictory(g) { if (ok(g)) { g.closeOverlay(); Audio.playMusic('victory'); } }
