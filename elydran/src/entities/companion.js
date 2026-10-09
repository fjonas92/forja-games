// Criatura companheira: segue o herói e usa a própria habilidade nos inimigos
import { CREATURES } from '../data/creatures.js';
import { creatureStats } from '../systems/progression.js';
import { drawCreature } from '../gfx/sprites.js';
import { Projectile } from '../systems/combat.js';
import { Audio } from '../systems/audio.js';

export class Companion {
  constructor(data, x, y) { this.data = data; this.x = x; this.y = y; this.r = 5; this.face = 1; this.cd = 1; this.t = Math.random() * 5; this.hurtT = 0; this.burstLeft = 0; this.burstT = 0; }
  get def() { return CREATURES[this.data.id]; }
  get stats() { return creatureStats(this.data); }
  get fainted() { return this.data.hp <= 0; }
  update(dt, g) {
    this.t += dt; this.cd -= dt; this.hurtT -= dt;
    const p = g.player, back = p.aim + Math.PI, tx = p.x + Math.cos(back) * 16 + Math.sin(this.t * 1.3) * 3, ty = p.y + Math.sin(back) * 10 + 2;
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    if (d > 260) { this.x = tx; this.y = ty; } // ficou muito para trás: aparece junto
    else if (d > 3) { const sp = Math.min(d * 5, 150); this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; if (Math.abs(dx) > 2) this.face = dx > 0 ? 1 : -1; }
    if (this.fainted || g.locked) return;
    const sk = this.def.skill;
    // rajada (Ignifox solta várias faíscas seguidas)
    if (this.burstLeft > 0) { this.burstT -= dt; if (this.burstT <= 0) { this.fire(g, this.burstTarget); this.burstLeft--; this.burstT = 0.12; } return; }
    if (this.cd > 0) return;
    let best = null, bd = sk.range;
    for (const e of g.enemies) { if (e.hp <= 0) continue; const dd = Math.hypot(e.x - this.x, e.y - this.y); if (dd < bd) { bd = dd; best = e; } }
    if (!best) return;
    this.face = best.x > this.x ? 1 : -1; this.cd = sk.cooldown;
    if (sk.burst) { this.burstLeft = sk.burst; this.burstT = 0; this.burstTarget = best; } else this.fire(g, best);
  }
  fire(g, target) {
    if (!target || target.hp <= 0) return;
    const sk = this.def.skill, a = Math.atan2(target.y - 6 - (this.y - 8), target.x - this.x);
    g.projectiles.push(new Projectile({ kind: sk.id, x: this.x + this.face * 6, y: this.y - 8, vx: Math.cos(a) * sk.speed, vy: Math.sin(a) * sk.speed, friendly: true, pet: true, homing: sk.id === 'ember', target, power: sk.power, attack: this.stats.attack, element: this.def.element, heal: sk.heal || 0, life: 1.2 }));
    sk.id === 'ember' ? Audio.ember() : Audio.bubble();
  }
  hurt(dmg, g) {
    if (this.hurtT > 0 || this.fainted) return;
    this.data.hp = Math.max(0, this.data.hp - Math.max(1, dmg - this.stats.defense * 0.4 | 0)); this.hurtT = 0.8;
    if (this.fainted) g.toast(this.def.name + ' desmaiou! Use uma Fruta-Lume ou descanse num cristal.', '#ffb03a');
  }
  draw(ctx, cam) {
    const d = this.def, evolved = !CREATURES[this.data.id].evolution && this.data.id !== 'brasek' && this.data.id !== 'cristarta';
    ctx.save(); if (this.fainted) ctx.globalAlpha = 0.45; else if (this.hurtT > 0 && Math.floor(this.t * 20) % 2) ctx.globalAlpha = 0.5;
    drawCreature(ctx, d.look, this.x - cam.x, this.y - cam.y, this.face, this.fainted ? 0 : this.t, d.size, evolved);
    ctx.restore();
    if (!this.fainted && d.element === 'fire' && Math.random() < 0.3) { ctx.fillStyle = '#ffb03a'; ctx.fillRect(Math.round(this.x - cam.x - this.face * 8 + Math.random() * 4), Math.round(this.y - cam.y - 10 - Math.random() * 6), 1, 1); }
  }
}
