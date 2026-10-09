// Moradores (NPCs) e itens no chão
import { drawChar, drawIcon } from '../gfx/sprites.js';
import { moveEntity } from '../world/tilemap.js';
import { rand } from '../utils/math.js';

export class NPC {
  constructor(d) { Object.assign(this, d); this.hx = d.x; this.hy = d.y; this.r = 6; this.t = Math.random() * 5; this.st = rand(1, 3); this.vx = 0; this.vy = 0; this.walkT = 0; this.baseDir = d.dir; }
  update(dt, g) {
    this.t += dt; this.st -= dt; let moving = false;
    if (g.talkingTo === this) { const p = g.player, dx = p.x - this.x, dy = p.y - this.y; this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); return; }
    if (this.wander) {
      if (this.st <= 0) { this.st = rand(1.5, 3.5); const a = rand(0, 6.28), go = Math.random() < 0.6; this.vx = go ? Math.cos(a) * 22 : 0; this.vy = go ? Math.sin(a) * 22 : 0; if (Math.hypot(this.hx - this.x, this.hy - this.y) > this.wander) { const b = Math.atan2(this.hy - this.y, this.hx - this.x); this.vx = Math.cos(b) * 22; this.vy = Math.sin(b) * 22; } }
      if (this.st > 1) { const ox = this.x, oy = this.y; moveEntity(g.map, this, this.vx * dt, this.vy * dt); moving = Math.hypot(this.x - ox, this.y - oy) > 0.05; if (moving) this.dir = Math.abs(this.vx) > Math.abs(this.vy) ? (this.vx > 0 ? 'right' : 'left') : (this.vy > 0 ? 'down' : 'up'); }
    } else this.dir = this.baseDir;
    this.walkT = moving ? this.walkT + dt * 7 : 0;
  }
  draw(ctx, cam) { drawChar(ctx, this.pal, this.x - cam.x, this.y - cam.y, this.dir, this.walkT ? Math.floor(this.walkT) % 4 : 0); }
}

export class Pickup {
  constructor(kind, x, y, n) { this.kind = kind; this.n = n || 1; this.x = x; this.y = y; this.vx = rand(-40, 40); this.vy = rand(-40, 40); this.t = 0; this.z = 0; this.vz = rand(60, 90); }
  update(dt, g) {
    this.t += dt; this.z += this.vz * dt; this.vz -= 260 * dt; if (this.z < 0) { this.z = 0; this.vz = -this.vz * 0.35; }
    this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.9; this.vy *= 0.9;
    const p = g.player, dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
    if (this.t > 0.35 && d < 46) { this.x += dx / d * 150 * dt; this.y += dy / d * 150 * dt; }
    if (this.t > 0.35 && d < 8) { g.collect(this); this.dead = true; }
  }
  draw(ctx, cam) { const x = this.x - cam.x, y = this.y - cam.y - this.z - 4 + Math.sin(this.t * 5) * 0.8; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(Math.round(this.x - cam.x - 3), Math.round(this.y - cam.y), 6, 2); drawIcon(ctx, this.kind === 'coin' ? 'coin' : this.kind, x, y); }
}
