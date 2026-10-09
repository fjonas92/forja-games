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
    const look = this.d.look || this.kind;
    if (look === 'gotalim') drawSlime(ctx, x, y, this.t, this.hop, hurt, this.d.color);
    else if (look === 'fungo') drawFungo(ctx, x, y, this.t, hurt, this.charge);
    else if (look === 'lobo') { drawWolf(ctx, x, y, this.face, this.t, hurt, this.state === 'dash'); if (this.state === 'windup') { ctx.fillStyle = 'rgba(255,79,216,.9)'; ctx.fillRect(Math.round(x - 1), Math.round(y - 22), 2, 4); } }
    if (this.alpha) ctx.restore();
    if (this.hp < this.maxHp) { const w = 16, k = this.hp / this.maxHp; ctx.fillStyle = '#1a1424'; ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y + 3), w + 2, 4); ctx.fillStyle = '#ff4f6a'; ctx.fillRect(Math.round(x - w / 2), Math.round(y + 4), Math.round(w * k), 2); }
  }
}

/* ---------- Chefes ---------- */
// Cada chefe usa os mesmos golpes (pancada, rajada, investida), mas com números e estilo próprios.
// combo: pancadas seguidas por fase. mode: 'ring' = anel de projéteis, 'fan' = leque mirado.
const BOSSES = {
  lobogelo_boss: { wake: 'O Lobo das Geadas uivou!', wakeCol: '#bfe8ff', rage: 'A nevasca ficou mais forte!', cols: ['#bfe8ff', '#ffffff'], el: 'water', slamR: 44, slamMul: 1.4, ring: [8, 12], mode: 'fan', combo: [1, 2], summon: ['lobogelo', 2], twice: true, wakeDist: 0, hue: '' },
  golemcristal: { wake: 'O Golem de Cristal despertou!', wakeCol: '#c08aff', rage: 'Os cristais estão instáveis!', cols: ['#c08aff', '#ff7ae0'], el: 'crystal', slamR: 46, slamMul: 1.6, ring: [12, 16], mode: 'ring', combo: [0, 1], summon: ['cristalino', 3], twice: false, wakeDist: 0 },
  dragaoboreal: { wake: 'O Dragão Boreal rugiu!', wakeCol: '#7fd6ff', rage: 'O Dragão Boreal congelou o ar!', cols: ['#7fd6ff', '#ffffff'], el: 'water', slamR: 52, slamMul: 1.5, ring: [7, 11], mode: 'fan', combo: [0, 1], summon: ['espectro', 2], twice: false, wakeDist: 0 },
  escorpiaorei: { wake: 'O Escorpião-Rei saiu da areia!', wakeCol: '#e0b050', rage: 'O Escorpião-Rei está furioso!', cols: ['#e0b050', '#ff8a3a'], el: 'nature', slamR: 46, slamMul: 1.5, ring: [6, 10], mode: 'fan', combo: [1, 2], summon: ['escorpiao', 2], twice: true, wakeDist: 0 },
  sentinela: { wake: 'A Sentinela Solar acendeu!', wakeCol: '#ffd37a', rage: 'A Sentinela brilha como um sol!', cols: ['#ffd37a', '#ffffff'], el: 'crystal', slamR: 54, slamMul: 1.5, ring: [10, 16], mode: 'ring', combo: [0, 1], summon: ['areia', 2], twice: false, wakeDist: 130 },
  drakmor: { wake: 'Drakmor emergiu da lava!', wakeCol: '#ff8a3a', rage: 'Drakmor está em chamas!', cols: ['#ff8a3a', '#ff3a1a'], el: 'fire', slamR: 56, slamMul: 1.6, ring: [8, 14], mode: 'fan', combo: [1, 1], summon: ['magmin', 3], twice: true, wakeDist: 0 },
  hidra: { wake: 'A Hidra Venenosa ergueu as cabeças!', wakeCol: '#8ad04a', rage: 'A Hidra cuspiu veneno por todas as bocas!', cols: ['#8ad04a', '#d0ff5a'], el: 'nature', slamR: 46, slamMul: 1.4, ring: [12, 18], mode: 'ring', combo: [0, 1], summon: ['sapo', 2], twice: true, wakeDist: 0 },
  espinheiro2: { wake: 'O Guardião Corrompido despertou!', wakeCol: '#c060ff', rage: 'A corrupção tomou conta do Guardião!', cols: ['#c060ff', '#ff40a0'], el: 'shadow', slamR: 44, slamMul: 1.5, ring: [12, 16], mode: 'ring', combo: [1, 2], summon: ['fungocorr', 3], twice: false, wakeDist: 0 },
  varkhan: { wake: 'O General Varkhan desembainhou a espada!', wakeCol: '#ff5a5a', rage: 'Varkhan libertou a sua fúria!', cols: ['#ff5a5a', '#ff9a3a'], el: 'shadow', slamR: 52, slamMul: 1.6, ring: [7, 11], mode: 'fan', combo: [1, 2], summon: ['soldado', 2], twice: false, wakeDist: 140 },
  colosso: { wake: 'O Colosso Celestial despertou!', wakeCol: '#fff0a0', rage: 'O Colosso começou a brilhar!', cols: ['#fff0a0', '#ffffff'], el: 'crystal', slamR: 64, slamMul: 1.7, ring: [14, 20], mode: 'ring', combo: [0, 1], summon: ['nuvem', 3], twice: false, wakeDist: 0 },
  guardiao_gelo: { wake: 'O Guardião do Gelo se levantou!', wakeCol: '#7fd6ff', rage: 'O Guardião do Gelo congelou o salão!', cols: ['#7fd6ff', '#ffffff'], el: 'water', slamR: 44, slamMul: 1.5, ring: [8, 12], mode: 'ring', combo: [0, 1], summon: ['gelinho', 1], twice: false, wakeDist: 0 },
  guardiao_fogo: { wake: 'O Guardião do Fogo se levantou!', wakeCol: '#ff8a3a', rage: 'O salão pegou fogo!', cols: ['#ff8a3a', '#ff3a1a'], el: 'fire', slamR: 46, slamMul: 1.5, ring: [7, 11], mode: 'fan', combo: [0, 1], summon: ['magmin', 1], twice: false, wakeDist: 0 },
  guardiao_terra: { wake: 'O Guardião da Terra se levantou!', wakeCol: '#8fe05a', rage: 'O chão está tremendo!', cols: ['#8fe05a', '#c08a4a'], el: 'nature', slamR: 50, slamMul: 1.6, ring: [10, 14], mode: 'ring', combo: [1, 1], summon: ['sapo', 1], twice: false, wakeDist: 0 },
  guardiao_vento: { wake: 'O Guardião do Vento se levantou!', wakeCol: '#d8ffe8', rage: 'Um redemoinho se formou!', cols: ['#d8ffe8', '#9affc8'], el: 'crystal', slamR: 42, slamMul: 1.4, ring: [9, 13], mode: 'fan', combo: [1, 2], summon: ['nuvem', 1], twice: false, wakeDist: 0 },
  guardiao_luz: { wake: 'O Guardião da Luz se levantou!', wakeCol: '#fff0a0', rage: 'A luz ficou ofuscante!', cols: ['#fff0a0', '#ffffff'], el: 'crystal', slamR: 48, slamMul: 1.6, ring: [12, 18], mode: 'ring', combo: [0, 1], summon: ['raio', 1], twice: false, wakeDist: 0 },
  noxar: { wake: 'Noxar, o Devorador de Luz, despertou!', wakeCol: '#c080ff', rage: 'Noxar está devorando a luz!', cols: ['#c080ff', '#ffffff'], el: 'shadow', slamR: 60, slamMul: 1.7, ring: [14, 22], mode: 'ring', combo: [1, 2], summon: ['sombra', 3], twice: true, wakeDist: 0 },
  golem: { wake: 'O Golem Guardião despertou!', wakeCol: '#7fd6ff', rage: 'O Golem está enfurecido!', cols: ['#7fd6ff', '#ff7ae0'], el: 'crystal', slamR: 42, slamMul: 1.6, ring: [10, 14], mode: 'ring', combo: [0, 0], summon: ['gotalim', 3], twice: false, wakeDist: 0 },
  slimeboss: { wake: 'O Slime Ancestral despertou!', wakeCol: '#58d98a', rage: 'O Slime está se dividindo!', cols: ['#58d98a', '#d6ff5a'], el: 'water', slamR: 46, slamMul: 1.3, ring: [8, 12], mode: 'ring', combo: [0, 0], summon: ['gotalim', 3], twice: true, wakeDist: 0 },
  espinheiro: { wake: 'O Guardião Espinheiro despertou!', wakeCol: '#8fe05a', rage: 'As raízes enlouqueceram!', cols: ['#8fe05a', '#ff9a3a'], el: 'nature', slamR: 40, slamMul: 1.4, ring: [10, 14], mode: 'ring', combo: [0, 1], summon: ['fungo', 2], twice: false, wakeDist: 0 },
  cavaleiro: { wake: 'O Cavaleiro de Pedra despertou!', wakeCol: '#ffcf5a', rage: 'A lâmina do Cavaleiro pegou fogo!', cols: ['#ffcf5a', '#ff5a3a'], el: 'crystal', slamR: 50, slamMul: 1.5, ring: [5, 9], mode: 'fan', combo: [0, 1], summon: ['lobo', 1], twice: false, wakeDist: 120 }
};

export class Boss extends Enemy {
  constructor(kind, x, y) {
    super(kind, x, y, 'boss'); this.boss = true; this.cfg = BOSSES[kind] || BOSSES.golem; this.slamR = this.cfg.slamR; this.r = this.d.r;
    this.state = 'sleep'; this.st = 1.4; this.phase = 1; this.windup = 0; this.summons = 0; this.target = null; this.attacks = 0; this.comboLeft = 0; this.fast = false;
  }
  update(dt, g) {
    this.t += dt; this.hurtT -= dt; this.st -= dt; this.contactCd -= dt;
    const c = this.cfg, p = g.player, dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
    if (this.state === 'sleep') {
      if (c.wakeDist ? d < c.wakeDist : this.st <= 0) { this.state = 'idle'; this.st = 1; g.toast(c.wake, c.wakeCol); Audio.slam(); g.fx.shake = 6; }
      return;
    }
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) { this.phase = 2; this.speed *= 1.35; g.toast(c.rage, c.cols[1]); g.fx.flash = 0.6; g.fx.flashCol = c.cols[1]; Audio.slam(); this.state = 'idle'; this.st = 0.8; }
    const lim = this.summons === 0 ? 0.4 : 0.2;
    if (this.phase === 2 && this.summons < (c.twice ? 2 : 1) && this.hp < this.maxHp * lim) { this.summons++; for (let i = 0; i < c.summon[1]; i++) g.spawnEnemy(c.summon[0], this.x + Math.cos(i * 2.1) * 34, this.y + Math.sin(i * 2.1) * 26); }
    let mx = 0, my = 0;
    if (this.state === 'idle') {
      if (d > 40) { mx = dx / d * this.speed; my = dy / d * this.speed; }
      if (this.st <= 0) {
        this.attacks++;
        const opts = this.phase === 1 ? ['slam', 'shards', 'slam'] : ['slam', 'shards', 'charge', 'shards'];
        this.state = opts[this.attacks % opts.length]; this.windup = 0; this.charge = 0; this.fast = false;
        if (this.state === 'slam') { this.target = { x: p.x, y: p.y }; this.comboLeft = c.combo[this.phase - 1]; }
      }
    } else if (this.state === 'slam') {
      const base = this.phase === 1 ? 0.95 : 0.7;
      this.windup = Math.min(1, this.windup + dt / (this.fast ? base * 0.6 : base));
      const tx = this.target.x - this.x, ty = this.target.y - this.y, td = Math.hypot(tx, ty); if (td > 24) { mx = tx / td * this.speed * 1.5; my = ty / td * this.speed * 1.5; }
      if (this.windup >= 1) {
        Audio.slam(); g.fx.shake = 8; g.fx.burst(this.target.x, this.target.y, c.cols[0], 20, 110, 0.6);
        if (Math.hypot(p.x - this.target.x, p.y - this.target.y) < this.slamR) { const { dmg } = calcDamage(this.attack * c.slamMul, p.stats.defense, 1, c.el, null); p.hurt(dmg, g, (p.x - this.target.x) * 4, (p.y - this.target.y) * 4); }
        if (this.phase === 2) this.ring(g, 8, 0.3);
        if (this.comboLeft > 0) { this.comboLeft--; this.fast = true; this.windup = 0; this.target = { x: p.x, y: p.y }; }
        else { this.state = 'idle'; this.windup = 0; this.st = this.phase === 1 ? 1.6 : 1.1; }
      }
    } else if (this.state === 'shards') {
      this.charge += dt;
      if (this.charge > 0.5 && this.charge - dt <= 0.5) this.volley(g, 0);
      if (this.phase === 2 && this.charge > 1.1 && this.charge - dt <= 1.1) this.volley(g, 1);
      if (this.charge > 1.5) { this.state = 'idle'; this.st = 1.3; }
    } else if (this.state === 'charge') {
      this.charge += dt;
      if (this.charge < 0.6) { this.windup = this.charge / 0.6; const a = Math.atan2(dy, dx); this.vx = Math.cos(a) * 240; this.vy = Math.sin(a) * 240; }
      else if (this.charge < 1.25) { this.windup = 0; mx = this.vx; my = this.vy; if (Math.random() < 0.5) g.fx.burst(this.x, this.y, c.cols[1], 2, 30, 0.3); }
      else { this.state = 'idle'; this.st = 1.4; }
    }
    if (Math.abs(mx) > 1) this.face = mx > 0 ? 1 : -1;
    mx += this.kbx * 0.2; my += this.kby * 0.2; this.kbx *= 0.8; this.kby *= 0.8;
    moveEntity(g.map, this, mx * dt, my * dt);
    if (d < this.r + p.r + 4 && this.contactCd <= 0) { const { dmg } = calcDamage(this.attack * (this.state === 'charge' ? 1.5 : 1), p.stats.defense, 1, c.el, null); if (p.hurt(dmg, g, dx / (d || 1) * 220, dy / (d || 1) * 220)) this.contactCd = 1; }
  }
  // rajada: anel em volta do chefe ou leque mirado no jogador, dependendo do chefe
  volley(g, k) {
    const c = this.cfg, n = c.ring[this.phase - 1];
    if (c.mode === 'fan') { const p = g.player, a0 = Math.atan2(p.y - this.y, p.x - this.x), spread = 0.95; Audio.magic(); for (let i = 0; i < n; i++) this.shoot(g, a0 + (i - (n - 1) / 2) * (spread / Math.max(1, n - 1)) * 2, 125); }
    else this.ring(g, n, k ? Math.PI / n : 0);
  }
  ring(g, n, off) { Audio.magic(); for (let i = 0; i < n; i++) this.shoot(g, off + i / n * Math.PI * 2, 105); }
  shoot(g, a, sp) { g.projectiles.push(new Projectile({ kind: 'shardp', x: this.x, y: this.y - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, friendly: false, attack: this.attack, element: this.cfg.el, life: 3, col: this.cfg.cols[this.phase > 1 ? 1 : 0] })); }
  damage(dmg, g, kx, ky, mult) { if (this.state === 'sleep') return; if (this.state === 'charge' || this.state === 'slam') { const keep = this.state; super.damage(dmg, g, kx, ky, mult); if (this.hp > 0) this.state = keep; return; } super.damage(dmg, g, kx, ky, mult); }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y, R = this.slamR;
    if (this.state === 'slam' && this.target) { const tx = this.target.x - cam.x, ty = this.target.y - cam.y; ctx.strokeStyle = `rgba(255,90,90,${0.4 + this.windup * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tx, ty, R, R / 2, 0, 0, 7); ctx.stroke(); ctx.fillStyle = `rgba(255,60,60,${this.windup * 0.25})`; ctx.beginPath(); ctx.ellipse(tx, ty, R * this.windup, R / 2 * this.windup, 0, 0, 7); ctx.fill(); }
    if (this.state === 'sleep') ctx.globalAlpha = 0.75;
    if (this.kind === 'slimeboss') { ctx.save(); ctx.translate(x, y); ctx.scale(2.6, 2.6); ctx.translate(-x, -y); drawSlime(ctx, x, y, this.t, this.state === 'slam' ? 1 - this.windup : 0, this.hurtT > 0, this.d.color); ctx.restore(); }
    else {
      const HUE = { espinheiro: -75, cavaleiro: 165, lobogelo_boss: 20, golemcristal: 80, dragaoboreal: 0, escorpiaorei: 165, sentinela: 165, drakmor: 165, hidra: -60, espinheiro2: 60, varkhan: 200, colosso: 150, guardiao_gelo: 0, guardiao_fogo: 165, guardiao_terra: -70, guardiao_vento: -40, guardiao_luz: 150, noxar: 90 };
      const f = HUE[this.kind] !== undefined ? 'hue-rotate(' + HUE[this.kind] + 'deg) saturate(1.3)' : '';
      ctx.save(); if (f && 'filter' in ctx) ctx.filter = f;
      drawGolem(ctx, x, y, this.t, this.hurtT > 0, this.phase, this.state === 'slam' || this.state === 'charge' ? this.windup : 0); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
