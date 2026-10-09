// CombatSystem: dano, vantagem de elemento, empurrão, números flutuantes e projéteis
import { ELEMENTS } from '../data/creatures.js';
import { rand } from '../utils/math.js';

export function elementMult(atk, def) {
  if (!atk || !def) return 1;
  if (ELEMENTS[atk] && ELEMENTS[atk].strong === def) return 1.5;
  if (ELEMENTS[def] && ELEMENTS[def].strong === atk) return 0.7;
  return 1;
}
// dano = ataque × multiplicadores − defesa/2, com uma pequena variação
export function calcDamage(attack, defense, power, atkEl, defEl) {
  const m = elementMult(atkEl, defEl);
  const raw = attack * (power || 1) * m * rand(0.9, 1.1) - defense * 0.5;
  return { dmg: Math.max(1, Math.round(raw)), mult: m };
}

export class Effects {
  constructor() { this.texts = []; this.parts = []; this.shake = 0; this.flash = 0; this.flashCol = '#fff'; }
  text(x, y, s, col, big) { this.texts.push({ x, y, s: String(s), col: col || '#fff', t: 0, big: !!big }); }
  burst(x, y, col, n, spd, life) { for (let i = 0; i < (n || 8); i++) { const a = Math.random() * 6.28, v = rand(0.3, 1) * (spd || 60); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, t: 0, life: life || rand(0.3, 0.6), col, g: 60 }); } }
  sparkle(x, y, col) { this.parts.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-8, 8), vy: rand(-30, -10), t: 0, life: rand(0.4, 0.9), col, g: 0 }); }
  update(dt) {
    for (const p of this.texts) { p.t += dt; p.y -= dt * 22; }
    this.texts = this.texts.filter(p => p.t < 0.9);
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; }
    this.parts = this.parts.filter(p => p.t < p.life);
    this.shake = Math.max(0, this.shake - dt * 18); this.flash = Math.max(0, this.flash - dt * 2.5);
  }
  draw(ctx, cam, font) {
    for (const p of this.parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), 2, 2); }
    ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of this.texts) {
      ctx.globalAlpha = Math.min(1, 2.2 - p.t * 2.4); ctx.font = (p.big ? 'bold 11px ' : 'bold 9px ') + font;
      const x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y);
      ctx.fillStyle = '#1a1424'; ctx.fillText(p.s, x + 1, y + 1); ctx.fillText(p.s, x - 1, y); ctx.fillStyle = p.col; ctx.fillText(p.s, x, y);
    }
    ctx.globalAlpha = 1;
  }
}

// projéteis (faísca, bolha, esporo, estilhaço de cristal)
export class Projectile {
  constructor(o) { Object.assign(this, { t: 0, life: 1.4, r: 3, power: 1, pierce: false, hit: new Set() }, o); }
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.homing && this.target && this.target.hp > 0) { const a = Math.atan2(this.target.y - 6 - this.y, this.target.x - this.x), sp = Math.hypot(this.vx, this.vy); const cur = Math.atan2(this.vy, this.vx); let d = a - cur; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; const na = cur + Math.max(-4 * dt, Math.min(4 * dt, d)); this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp; } }
  get dead() { return this.t > this.life; }
  draw(ctx, cam, time) {
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    if (this.kind === 'ember') { ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff1b8'; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.fillStyle = 'rgba(255,120,40,.5)'; ctx.fillRect(Math.round(x - this.vx * 0.03), Math.round(y - this.vy * 0.03), 3, 3); }
    else if (this.kind === 'bubble') { ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4 + Math.sin(time * 12) * 0.6, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(77,195,255,.45)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 1, 1); }
    else if (this.kind === 'spore') { ctx.fillStyle = '#c8f070'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#6a8a2a'; ctx.fillRect(x - 1, y, 2, 1); }
    else if (this.kind === 'shardp') { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(this.vy, this.vx)); ctx.fillStyle = '#1a1424'; ctx.fillRect(-5, -2, 10, 4); ctx.fillStyle = this.col || '#7fd6ff'; ctx.fillRect(-4, -1, 8, 2); ctx.restore(); }
    else if (this.kind === 'nova') { ctx.strokeStyle = `rgba(160,235,255,${1 - this.t / this.life})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, this.r, 0, 7); ctx.stroke(); }
  }
}
