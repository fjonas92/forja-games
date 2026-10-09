// Inimigos com comportamentos diferentes e o chefe Golem Guardião
import { ENEMIES } from '../data/enemies.js';
import { drawSlime, drawFungo, drawWolf, drawGolem } from '../gfx/sprites.js';
import { moveEntity } from '../world/tilemap.js';
import { calcDamage, Projectile } from '../systems/combat.js';
import { Audio } from '../systems/audio.js';
import { rand } from '../utils/math.js';

export class Enemy {
  constructor(kind, x, y, special, level) {
    const d = ENEMIES[kind], k = 1 + ((level || 1) - 1) * 0.12;
    Object.assign(this, { kind, d, x, y, hx: x, hy: y, special, r: d.r, element: d.element, maxHp: Math.round(d.hp * k), attack: Math.round(d.attack * k), def: d.defense, speed: d.speed,
      t: Math.random() * 5, hurtT: 0, kbx: 0, kby: 0, state: 'idle', st: rand(0.5, 2), face: 1, hop: 0, vx: 0, vy: 0, charge: 0, contactCd: 0 });
    if (special === 'shard') { this.maxHp = Math.round(this.maxHp * 1.8); this.attack += 3; this.r += 2; this.alpha = true; }
    this.hp = this.maxHp;
  }
  update(dt, g) {
    this.t += dt; this.hurtT -= dt; this.st -= dt; this.contactCd -= dt;
    const p = g.player, dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy), aggro = d < (this.alpha ? 140 : 110) && p.hp > 0;
    let mx = 0, my = 0;
    const ai = this.d.ai;
    if (ai === 'hop') {
      if (this.hop > 0) { this.hop -= dt / 0.45; mx = this.vx; my = this.vy; if (this.hop <= 0) { this.hop = 0; this.st = aggro ? rand(0.4, 0.8) : rand(1, 2.5); } }
      else if (this.st <= 0) {
        const a = aggro ? Math.atan2(dy, dx) + rand(-0.3, 0.3) : rand(0, 6.28);
        const back = Math.hypot(this.hx - this.x, this.hy - this.y) > 60 && !aggro;
        const aa = back ? Math.atan2(this.hy - this.y, this.hx - this.x) : a;
        this.vx = Math.cos(aa) * this.speed * 1.6; this.vy = Math.sin(aa) * this.speed * 1.6; this.hop = 1;
      }
    } else if (ai === 'spitter') {
      if (this.state === 'charge') { this.charge = Math.min(1, this.charge + dt / 0.5); if (this.charge >= 1) { this.state = 'idle'; this.charge = 0; this.st = rand(1.8, 2.6); const a = Math.atan2(dy - 4, dx);
        g.projectiles.push(new Projectile({ kind: 'spore', x: this.x, y: this.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, friendly: false, attack: this.attack, element: this.element, life: 2 })); } }
      else if (aggro) {
        const want = d < 55 ? -1 : d > 85 ? 1 : 0; mx = dx / d * this.speed * want; my = dy / d * this.speed * want;
        if (this.st <= 0) { this.state = 'charge'; this.charge = 0; }
      } else if (this.st <= 0) { this.st = rand(1, 3); const a = rand(0, 6.28); this.vx = Math.cos(a) * this.speed * 0.6; this.vy = Math.sin(a) * this.speed * 0.6; }
      if (!aggro && this.state === 'idle') { mx = this.vx; my = this.vy; if (this.st < 1) mx = my = 0; }
    } else if (ai === 'dasher') {
      if (this.state === 'windup') { this.charge += dt; if (this.charge > 0.45) { this.state = 'dash'; this.charge = 0; const a = Math.atan2(dy, dx); this.vx = Math.cos(a) * 230; this.vy = Math.sin(a) * 230; } }
      else if (this.state === 'dash') { this.charge += dt; mx = this.vx; my = this.vy; if (this.charge > 0.32) { this.state = 'idle'; this.charge = 0; this.st = rand(1.1, 1.8); } }
      else if (aggro) { if (d > 34) { mx = dx / d * this.speed; my = dy / d * this.speed; } if (d < 80 && this.st <= 0) { this.state = 'windup'; this.charge = 0; } }
      else if (this.st <= 0) { this.st = rand(1.5, 3); const a = rand(0, 6.28); this.vx = Math.cos(a) * this.speed * 0.5; this.vy = Math.sin(a) * this.speed * 0.5; }
      if (!aggro && this.state === 'idle' && this.st > 1) { mx = this.vx; my = this.vy; }
    }
    if (Math.abs(mx) > 1) this.face = mx > 0 ? 1 : -1; else if (aggro) this.face = dx > 0 ? 1 : -1;
    mx += this.kbx; my += this.kby; this.kbx *= 0.8; this.kby *= 0.8;
    moveEntity(g.map, this, mx * dt, my * dt);
    // dano por contato
    if (d < this.r + p.r + 3 && this.contactCd <= 0 && (ai !== 'hop' || this.hop < 0.5)) {
      const { dmg } = calcDamage(this.attack * (this.state === 'dash' ? 1.4 : 1), p.stats.defense, 1, this.element, null);
      if (p.hurt(dmg, g, dx / (d || 1) * 160, dy / (d || 1) * 160)) this.contactCd = 0.8;
    }
    const pet = g.pet; if (pet && !pet.fainted && Math.hypot(pet.x - this.x, pet.y - this.y) < this.r + 6 && this.contactCd <= 0) { pet.hurt(this.attack, g); this.contactCd = 0.8; }
  }
  damage(dmg, g, kx, ky, mult) {
    if (this.hp <= 0) return;
    this.hp -= dmg; this.hurtT = 0.12; this.kbx = kx || 0; this.kby = ky || 0;
    if (this.state === 'windup' || this.state === 'charge') { this.state = 'idle'; this.charge = 0; this.st = 0.6; } // golpe interrompe o ataque
    g.fx.text(this.x, this.y - 18, dmg, mult > 1 ? '#ffd23f' : mult < 1 ? '#a8adb8' : '#ffffff', mult > 1);
    g.fx.burst(this.x, this.y - 6, this.d.color, 5, 50, 0.35); Audio.hit();
    if (this.hp <= 0) g.onEnemyKilled(this);
  }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y, hurt = this.hurtT > 0;
    if (this.alpha) { ctx.save(); ctx.translate(x, y); ctx.scale(1.35, 1.35); ctx.translate(-x, -y); }
    if (this.kind === 'gotalim') drawSlime(ctx, x, y, this.t, this.hop, hurt, this.d.color);
    else if (this.kind === 'fungo') drawFungo(ctx, x, y, this.t, hurt, this.charge);
    else if (this.kind === 'lobo') { drawWolf(ctx, x, y, this.face, this.t, hurt, this.state === 'dash'); if (this.state === 'windup') { ctx.fillStyle = 'rgba(255,79,216,.9)'; ctx.fillRect(Math.round(x - 1), Math.round(y - 22), 2, 4); } }
    if (this.alpha) ctx.restore();
    if (this.hp < this.maxHp) { const w = 16, k = this.hp / this.maxHp; ctx.fillStyle = '#1a1424'; ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y + 3), w + 2, 4); ctx.fillStyle = '#ff4f6a'; ctx.fillRect(Math.round(x - w / 2), Math.round(y + 4), Math.round(w * k), 2); }
  }
}

/* ---------- Chefe: Golem Guardião ---------- */
export class Boss extends Enemy {
  constructor(x, y) { super('golem', x, y, 'boss'); this.boss = true; this.r = 15; this.state = 'sleep'; this.st = 1.4; this.phase = 1; this.windup = 0; this.summoned = false; this.target = null; this.attacks = 0; }
  update(dt, g) {
    this.t += dt; this.hurtT -= dt; this.st -= dt; this.contactCd -= dt;
    const p = g.player, dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
    if (this.state === 'sleep') { if (this.st <= 0) { this.state = 'idle'; this.st = 1; g.toast('O Golem Guardião despertou!', '#7fd6ff'); Audio.slam(); g.fx.shake = 6; } return; }
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) { this.phase = 2; this.speed *= 1.35; g.toast('O Golem está enfurecido!', '#ff7ae0'); g.fx.flash = 0.6; g.fx.flashCol = '#ff7ae0'; Audio.slam(); this.state = 'idle'; this.st = 0.8; }
    if (this.phase === 2 && !this.summoned && this.hp < this.maxHp * 0.4) { this.summoned = true; for (let i = 0; i < 3; i++) g.spawnEnemy('gotalim', this.x + Math.cos(i * 2.1) * 34, this.y + Math.sin(i * 2.1) * 26); }
    let mx = 0, my = 0;
    if (this.state === 'idle') {
      if (d > 40) { mx = dx / d * this.speed; my = dy / d * this.speed; }
      if (this.st <= 0) {
        this.attacks++;
        const opts = this.phase === 1 ? ['slam', 'shards', 'slam'] : ['slam', 'shards', 'charge', 'shards'];
        this.state = opts[this.attacks % opts.length]; this.windup = 0; this.charge = 0;
        if (this.state === 'slam') this.target = { x: p.x, y: p.y };
      }
    } else if (this.state === 'slam') {
      this.windup = Math.min(1, this.windup + dt / (this.phase === 1 ? 0.95 : 0.7));
      const tx = this.target.x - this.x, ty = this.target.y - this.y, td = Math.hypot(tx, ty); if (td > 24) { mx = tx / td * this.speed * 1.5; my = ty / td * this.speed * 1.5; }
      if (this.windup >= 1) {
        Audio.slam(); g.fx.shake = 8; g.fx.burst(this.target.x, this.target.y, '#9fe8ff', 20, 110, 0.6);
        if (Math.hypot(p.x - this.target.x, p.y - this.target.y) < 42) { const { dmg } = calcDamage(this.attack * 1.6, p.stats.defense, 1, 'crystal', null); p.hurt(dmg, g, (p.x - this.target.x) * 4, (p.y - this.target.y) * 4); }
        if (this.phase === 2) this.shardRing(g, 8, 0.3);
        this.state = 'idle'; this.windup = 0; this.st = this.phase === 1 ? 1.6 : 1.1;
      }
    } else if (this.state === 'shards') {
      this.charge += dt;
      if (this.charge > 0.5 && this.charge - dt <= 0.5) this.shardRing(g, this.phase === 1 ? 10 : 14, 0);
      if (this.phase === 2 && this.charge > 1.1 && this.charge - dt <= 1.1) this.shardRing(g, 14, Math.PI / 14);
      if (this.charge > 1.5) { this.state = 'idle'; this.st = 1.3; }
    } else if (this.state === 'charge') {
      this.charge += dt;
      if (this.charge < 0.6) { this.windup = this.charge / 0.6; const a = Math.atan2(dy, dx); this.vx = Math.cos(a) * 240; this.vy = Math.sin(a) * 240; }
      else if (this.charge < 1.25) { this.windup = 0; mx = this.vx; my = this.vy; if (Math.random() < 0.5) g.fx.burst(this.x, this.y, '#ff7ae0', 2, 30, 0.3); }
      else { this.state = 'idle'; this.st = 1.4; }
    }
    if (Math.abs(mx) > 1) this.face = mx > 0 ? 1 : -1;
    mx += this.kbx * 0.2; my += this.kby * 0.2; this.kbx *= 0.8; this.kby *= 0.8;
    moveEntity(g.map, this, mx * dt, my * dt);
    if (d < this.r + p.r + 4 && this.contactCd <= 0) { const { dmg } = calcDamage(this.attack * (this.state === 'charge' ? 1.5 : 1), p.stats.defense, 1, 'crystal', null); if (p.hurt(dmg, g, dx / (d || 1) * 220, dy / (d || 1) * 220)) this.contactCd = 1; }
  }
  shardRing(g, n, off) { Audio.magic(); for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2; g.projectiles.push(new Projectile({ kind: 'shardp', x: this.x, y: this.y - 20, vx: Math.cos(a) * 105, vy: Math.sin(a) * 105, friendly: false, attack: this.attack, element: 'crystal', life: 3, col: this.phase > 1 ? '#ff7ae0' : '#7fd6ff' })); } }
  damage(dmg, g, kx, ky, mult) { if (this.state === 'sleep') return; if (this.state === 'charge' || this.state === 'slam') { const keep = this.state; super.damage(dmg, g, kx, ky, mult); if (this.hp > 0) this.state = keep; return; } super.damage(dmg, g, kx, ky, mult); }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y;
    if (this.state === 'slam' && this.target) { const tx = this.target.x - cam.x, ty = this.target.y - cam.y; ctx.strokeStyle = `rgba(255,90,90,${0.4 + this.windup * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tx, ty, 42, 22, 0, 0, 7); ctx.stroke(); ctx.fillStyle = `rgba(255,60,60,${this.windup * 0.25})`; ctx.beginPath(); ctx.ellipse(tx, ty, 42 * this.windup, 22 * this.windup, 0, 0, 7); ctx.fill(); }
    if (this.state === 'sleep') ctx.globalAlpha = 0.75;
    drawGolem(ctx, x, y, this.t, this.hurtT > 0, this.phase, this.state === 'slam' ? this.windup : this.state === 'charge' ? this.windup : 0);
    ctx.globalAlpha = 1;
  }
}
