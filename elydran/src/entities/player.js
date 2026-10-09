// Herói (Kael): movimento em 8 direções, espada, esquiva e habilidade especial
import { drawChar, drawSword, drawSlash } from '../gfx/sprites.js';
import { moveEntity } from '../world/tilemap.js';
import { heroStats } from '../systems/progression.js';
import { calcDamage, Projectile } from '../systems/combat.js';
import { Audio } from '../systems/audio.js';

const DIRS = ['right', 'down', 'left', 'up'];
export class Player {
  constructor(d) {
    Object.assign(this, { x: 0, y: 0, r: 5, dir: 'down', aim: Math.PI / 2, walkT: 0, moving: false, swingT: 9, attackCd: 0, dodgeT: 0, dodgeCd: 0, dodgeX: 0, dodgeY: 0, iframes: 0, kbx: 0, kby: 0, specialCd: 0, level: 1, xp: 0, weapon: 'none', hp: 100, mp: 40 });
    if (d) Object.assign(this, d);
    const s = this.stats; this.hp = Math.min(this.hp, s.maxHp); this.mp = Math.min(this.mp, s.maxMp);
  }
  get stats() { return heroStats(this); }
  update(dt, g) {
    const inp = g.input, s = this.stats;
    this.attackCd -= dt; this.dodgeCd -= dt; this.iframes -= dt; this.specialCd -= dt; this.swingT += dt;
    this.mp = Math.min(s.maxMp, this.mp + dt * 2.2);
    let mx = 0, my = 0;
    if (!g.locked) { mx = inp.axis.x; my = inp.axis.y; }
    if (Math.hypot(mx, my) > 0.15) { this.aim = Math.atan2(my, mx); this.dir = DIRS[((Math.round(this.aim / (Math.PI / 2)) % 4) + 4) % 4]; }
    // esquiva: rolamento rápido com invencibilidade curta
    if (!g.locked && inp.pressed('dodge') && this.dodgeCd <= 0) {
      const a = Math.hypot(mx, my) > 0.15 ? Math.atan2(my, mx) : this.aim;
      this.dodgeT = 0.22; this.dodgeCd = 0.55; this.iframes = Math.max(this.iframes, 0.3); this.dodgeX = Math.cos(a); this.dodgeY = Math.sin(a); Audio.dodge();
      g.fx.burst(this.x, this.y, 'rgba(255,255,255,.7)', 6, 40, 0.3);
    }
    let vx, vy;
    if (this.dodgeT > 0) { this.dodgeT -= dt; vx = this.dodgeX * 250; vy = this.dodgeY * 250; if (Math.random() < 0.6) g.fx.sparkle(this.x, this.y - 4, 'rgba(200,230,255,.8)'); }
    else { const slow = this.swingT < 0.15 ? 0.45 : 1; vx = mx * s.speed * slow; vy = my * s.speed * slow; }
    vx += this.kbx; vy += this.kby; this.kbx *= 0.82; this.kby *= 0.82;
    moveEntity(g.map, this, vx * dt, vy * dt, g.npcBlock);
    this.moving = Math.hypot(mx, my) > 0.15 && this.dodgeT <= 0;
    this.walkT = this.moving ? this.walkT + dt * 9 : 0;
    if (g.locked) return;
    // ataque com a espada (arco à frente)
    if (inp.pressed('attack') && this.attackCd <= 0) {
      this.swingT = 0; this.attackCd = 0.3; Audio.swing();
      const reach = this.weapon === 'none' ? 18 : 22, crystal = this.weapon === 'sword_crystal';
      for (const e of g.enemies) {
        if (e.hp <= 0) continue;
        const dx = e.x - this.x, dy = (e.y - 5) - (this.y - 6), d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - this.aim; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
        if (d < reach + e.r && (Math.abs(da) < 1.25 || d < e.r + 6)) {
          const { dmg, mult } = calcDamage(s.attack, e.def, 1, crystal ? 'crystal' : null, e.element);
          e.damage(dmg, g, Math.cos(this.aim) * 140, Math.sin(this.aim) * 140, mult);
        }
      }
      g.hitSprites(this.x + Math.cos(this.aim) * 14, this.y - 6 + Math.sin(this.aim) * 14);
    }
    // habilidade especial: Pulso de Cristal (gasta energia)
    if (inp.pressed('special')) {
      if (this.mp >= 20 && this.specialCd <= 0) {
        this.mp -= 20; this.specialCd = 1.2; Audio.magic(); g.fx.shake = 3;
        g.projectiles.push(new Projectile({ kind: 'nova', x: this.x, y: this.y - 6, vx: 0, vy: 0, life: 0.35 + ((this.bonus && this.bonus.crystals) || 0) * 0.05, r: 8, friendly: true, grow: 150 + ((this.bonus && this.bonus.crystals) || 0) * 25, power: 1.6 + ((this.bonus && this.bonus.crystals) || 0) * 0.3, attack: s.attack, element: 'crystal' }));
        g.fx.burst(this.x, this.y - 6, '#bff3ff', 18, 90, 0.5);
      } else if (this.mp < 20) g.toast('Energia insuficiente', '#9fe8ff');
    }
  }
  hurt(dmg, g, kx, ky) {
    if (this.iframes > 0 || this.hp <= 0) return false;
    this.hp -= dmg; this.iframes = 0.9; this.kbx = kx || 0; this.kby = ky || 0;
    g.fx.text(this.x, this.y - 22, '-' + dmg, '#ff6a6a'); g.fx.shake = 4; Audio.hurt(); g.input.rumble && g.input.rumble(220, 0.9, 0.5);
    if (this.hp <= 0) { this.hp = 0; g.onPlayerDown(); }
    return true;
  }
  draw(ctx, cam, t) {
    if (this.iframes > 0 && this.dodgeT <= 0 && Math.floor(t * 20) % 2) return;
    const x = this.x - cam.x, y = this.y - cam.y, f = this.moving ? Math.floor(this.walkT) % 4 : 0;
    const swinging = this.swingT < 0.18, sa = this.aim - 1.1 + (this.swingT / 0.18) * 2.2;
    const behind = swinging && Math.sin(sa) < -0.2;
    if (behind) drawSword(ctx, x + Math.cos(sa) * 3, y - 9 + Math.sin(sa) * 3, sa, this.weapon);
    if (this.dodgeT > 0) { ctx.save(); ctx.globalAlpha = 0.35; drawChar(ctx, 'hero', x - this.dodgeX * 8, y - this.dodgeY * 8, this.dir, f); ctx.restore(); }
    drawChar(ctx, 'hero', x, y, this.dir, f);
    if (swinging && !behind) drawSword(ctx, x + Math.cos(sa) * 3, y - 9 + Math.sin(sa) * 3, sa, this.weapon);
    if (swinging) drawSlash(ctx, x, y - 8, this.aim, this.swingT, this.weapon === 'sword_crystal');
    else if (this.weapon !== 'none') drawSword(ctx, x + (this.dir === 'left' ? 5 : -5), y - 6, this.dir === 'left' ? -2.3 : -0.85, this.weapon);
  }
}
