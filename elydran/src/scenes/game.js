// Cena principal: junta mapa, entidades, sistemas e interface
import { VIEW_W, VIEW_H, TILE, FONT } from '../config.js';
import { getMap, T } from '../world/maps.js';
import { renderGround, drawWater, blocked } from '../world/tilemap.js';
import { Player } from '../entities/player.js';
import { Companion } from '../entities/companion.js';
import { Enemy, Boss } from '../entities/enemy.js';
import { NPC, Pickup } from '../entities/npc.js';
import { Effects, calcDamage } from '../systems/combat.js';
import { Inventory } from '../systems/inventory.js';
import { Quests } from '../systems/quests.js';
import { newCreature, gainXp, checkEvolution, creatureStats } from '../systems/progression.js';
import * as Save from '../systems/save.js';
import { Audio } from '../systems/audio.js';
import { ITEMS } from '../data/items.js';
import { CREATURES } from '../data/creatures.js';
import { DIALOGUES } from '../data/dialogues.js';
import * as S from '../gfx/sprites.js';
import { drawHUD } from '../ui/hud.js';
import * as M from '../ui/menus.js';
import { rand, randInt } from '../utils/math.js';

export class Game {
  constructor(input) {
    this.input = input; this.t = 0; this.mode = 'title'; this.ui = { sel: 0, tab: 0 }; this.toasts = []; this.fx = new Effects();
    this.cam = { x: 0, y: 0 }; this.prev = null; this.npcBlock = (x, y) => this.npcs && this.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 9);
    this.newState(); Audio.playIntro();
  }
  get locked() { return this.mode !== 'play'; }
  get pet() { return this.petObj; }

  /* ---------- começar, carregar e salvar ---------- */
  newState(data) {
    this.player = new Player(data && data.player);
    this.inv = new Inventory(data && data.inventory);
    this.quests = new Quests(data && data.quests);
    this.party = data ? data.party.map(c => ({ ...c })) : [newCreature('brasek', 1)];
    this.party.forEach(c => { c.hp = Math.min(c.hp, creatureStats(c).maxHp); });
    this.activePet = data ? data.active : 0; this.flags = data ? { ...data.flags } : {}; this.playTime = data ? data.playTime : 0;
  }
  startNew() {
    Save.clearSave(); this.newState(); Audio.stopIntro();
    this.player.hp = this.player.stats.maxHp; this.player.mp = this.player.stats.maxMp;
    this.loadMap('village'); this.mode = 'play';
    this.toast('Mova com WASD / setas ou o analógico', '#ffe27a', 5); this.toast('Fale com o Ancião Thaleo (aperte ' + this.input.label('interact') + ')', '#ffe27a', 6);
  }
  continueGame() {
    const d = Save.load(); if (!d) return this.startNew();
    this.newState(d); Audio.stopIntro();
    this.loadMap(d.player.region, d.player.position && d.player.position.x, d.player.position && d.player.position.y); this.mode = 'play';
    this.toast('Jornada carregada', '#7fd6ff');
  }
  saveGame(silent) { const ok = Save.save(this); if (!silent) this.toast(ok ? 'Jornada salva!' : 'Não foi possível salvar', ok ? '#7fd6ff' : '#ff6a6a'); return ok; }
  titleOpts() {
    const o = []; if (Save.hasSave()) o.push({ label: 'Continuar jornada', fn: () => this.continueGame() });
    o.push({ label: 'Nova jornada', fn: () => { if (Save.hasSave() && !this.confirmNew) { this.confirmNew = true; this.toast('Aperte de novo para apagar o jogo salvo e começar do zero', '#ff9a6a', 3); return; } this.confirmNew = false; this.startNew(); } });
    o.push({ label: 'Controles', fn: () => this.openOverlay('controls') });
    o.push({ label: Audio.on ? 'Som: ligado' : 'Som: desligado', fn: () => { Audio.setOn(!Audio.on); if (Audio.on) Audio.playIntro(); } });
    if (this.gfx) o.push({ label: 'Gráficos: ' + (this.gfx.is3d() ? '3D' : '2D'), fn: () => this.gfx.toggle() });
    return o;
  }
  pauseOpts() {
    const o = [{ label: 'Continuar', fn: () => this.closeOverlay() }];
    if (!this.boss) o.push({ label: 'Salvar jornada', fn: () => { this.saveGame(); this.closeOverlay(); } });
    o.push({ label: 'Inventário', fn: () => this.openOverlay('menu') }, { label: 'Mapa', fn: () => this.openOverlay('map') }, { label: 'Controles', fn: () => this.openOverlay('controls') });
    o.push({ label: Audio.on ? 'Som: ligado' : 'Som: desligado', fn: () => { Audio.setOn(!Audio.on); if (Audio.on) Audio.playMusic(this.musicFor()); } });
    if (this.gfx) o.push({ label: 'Gráficos: ' + (this.gfx.is3d() ? '3D' : '2D'), fn: () => this.gfx.toggle() });
    o.push({ label: 'Sair para a abertura', fn: () => { if (!this.boss) this.saveGame(true); this.mode = 'title'; this.ui.sel = 0; Audio.stopMusic(); Audio.playIntro(); } });
    return o;
  }
  openOverlay(m) { this.prevMode = this.mode === 'pause' || this.mode === 'title' ? this.mode : 'play'; this.mode = m; this.ui.sel = 0; if (m === 'menu') this.ui.tab = 0; }
  closeOverlay() { this.mode = this.prevMode && this.prevMode !== this.mode ? this.prevMode : 'play'; if (this.mode !== 'title' && this.mode !== 'pause') this.mode = 'play'; this.prevMode = null; this.ui.sel = 0; }

  /* ---------- mapas ---------- */
  musicFor() { const id = this.map.id; if (id === 'sanctuary') return this.flags.thornDown ? 'victory' : 'sanctuary'; if (id === 'slimepit') return this.flags.slimeDown ? 'forest' : 'sanctuary'; if (id === 'ruins') return 'sanctuary'; if (this.map.phase) return this.map.phase.music; return id; }
  loadMap(id, x, y) {
    const m = getMap(id); this.map = m; this.ground = m.groundCanvas || (m.groundCanvas = renderGround(m));
    const p = this.player; p.x = x != null ? x : m.start.x; p.y = y != null ? y : m.start.y;
    if (blocked(m, p.x, p.y, p.r)) { p.x = m.start.x; p.y = m.start.y; }
    this.npcs = m.npcs.map(d => new NPC(d)); this.enemies = []; this.projectiles = []; this.pickups = []; this.boss = null;
    for (const s of m.spawns) {
      if (s.special === 'shard' && this.flags.alphaDown) continue;
      if (s.special === 'guard_cristarta' && this.flags.cristarta) continue;
      if (s.special === 'boss') { if (this.flags[s.flag]) continue; const b = new Boss(s.kind, s.x, s.y); b.flag = s.flag; this.boss = b; this.enemies.push(b); continue; }
      const lvl = id === 'forest' ? 1 + Math.floor(Math.hypot(s.x - m.start.x, s.y - m.start.y) / 260) : id === 'ruins' ? 3 : m.phase ? m.phase.lvl : 1;
      this.enemies.push(new Enemy(s.kind, s.x, s.y, s.special, lvl));
    }
    m.bushes.forEach(b => { b.ready = true; });
    this.spawnPet(); this.regionT = 3.2; this.snapCam();
    this.refreshGates(); this.runeSeq = []; this.runeLit = this.flags.gate_b ? [true, true, true] : [false, false, false];
    const q = this.quests; if (id === 'slimepit') q.advance('main', 'pit'); else if (id === 'forest') q.advance('main', 'forest'); else if (id === 'sanctuary') q.advance('main', 'thorn'); else if (id === 'ruins') q.advance('main', 'ruins');
    this.applyCrystals(); if (m.phase && x == null) this.saveGame(true);
    Audio.playMusic(this.musicFor());
  }
  spawnPet() { const c = this.party[this.activePet]; this.petObj = c ? new Companion(c, this.player.x - 14, this.player.y + 4) : null; }
  setActivePet(i) { if (i === this.activePet || !this.party[i]) return; this.activePet = i; const old = this.petObj; this.spawnPet(); if (old) { this.petObj.x = old.x; this.petObj.y = old.y; } this.fx.burst(this.petObj.x, this.petObj.y - 6, '#fff', 12, 60); Audio.pickup(); this.toast(CREATURES[this.party[i].id].name + ', é com você!', '#ffe27a'); }
  spawnEnemy(kind, x, y) { const e = new Enemy(kind, x, y, null, 2); this.enemies.push(e); this.fx.burst(x, y, '#7fd6ff', 10, 60); }
  snapCam() { const p = this.player, m = this.map; this.cam.x = m.w * TILE <= VIEW_W ? (m.w * TILE - VIEW_W) / 2 : Math.max(0, Math.min(m.w * TILE - VIEW_W, p.x - VIEW_W / 2)); this.cam.y = m.h * TILE <= VIEW_H ? (m.h * TILE - VIEW_H) / 2 : Math.max(0, Math.min(m.h * TILE - VIEW_H, p.y - 8 - VIEW_H / 2)); }

  /* ---------- avisos e diálogos ---------- */
  toast(s, col, life) { if (this.toasts.some(t => t.s === s)) return; this.toasts.push({ s, col: col || '#fff', t: 0, life: life || 2.6 }); if (this.toasts.length > 4) this.toasts.shift(); }
  talk(lines) { this.dialog = { lines, i: 0, chars: 0 }; this.mode = 'dialog'; this.runActions(); }
  runActions() { const d = this.dialog; while (d && d.i < d.lines.length && d.lines[d.i][0] === '*') { this.action(d.lines[d.i][1]); d.i++; } if (d && d.i >= d.lines.length) { this.dialog = null; if (this.mode === 'dialog') this.mode = 'play'; this.talkingTo = null; } }
  nextLine() { this.dialog.i++; this.dialog.chars = 0; this.runActions(); }
  action(a) {
    if (a === 'talk_elder' && this.quests.advance('main', 'talk_elder')) { this.inv.add('potion', 2); this.toast('Recebeu 2 Poções de Vida', '#ff8a9a'); Audio.pickup(); this.checkPrepare(); }
    else if (a === 'laylla_meet') { if (this.quests.advance('main', 'laylla')) { this.toast('Laylla conhece a floresta e vai te guiar', '#7fd6ff', 4); Audio.pickup(); this.checkShards(); } }
    else if (a === 'shop') { this.dialog = null; this.mode = 'shop'; this.ui.sel = 0; this.prevMode = 'play'; }
    else if (a === 'give_sword') { this.inv.add('sword_iron'); this.player.weapon = 'sword_iron'; this.toast('Equipou a Espada de Ferro! Ataque +4', '#ffe27a', 3.5); Audio.chest(); this.checkPrepare(); }
    else if (a === 'start_friend') { if (this.quests.start('friend')) { this.toast('Nova missão: Amigo Perdido', '#ffe27a'); Audio.pickup(); } }
    else if (a === 'enter_sanctuary') { this.goTo('sanctuary', TILE * 13 + 8, TILE * 16 + 8); }
  }
  goTo(id, x, y) { if (id !== 'sanctuary' && id !== 'slimepit') this.saveGame(true); this.fade = { t: 0, id, x, y }; }
  // etapa 'prepare': espada na mão e 3 frutas na mochila
  checkPrepare() { if (this.quests.step('main') === 'prepare' && this.player.weapon !== 'none' && this.inv.count('berry') >= 3) { this.quests.advance('main', 'prepare'); this.toast('Tudo pronto! Desça ao Poço Gosmento, a noroeste.', '#7fd6ff', 4.5); Audio.chest(); } }
  // portões: abertos conforme as bandeiras do jogo (guarda a colisão original para poder fechar de novo em um jogo novo)
  refreshGates() { for (const o of this.map.objects) if (o.type === 'gate') { if (!o.solid0) o.solid0 = o.solid; o.open = !!this.flags[o.flag]; o.solid = o.open ? null : o.solid0; } }
  openGateA(o) {
    if (!this.inv.count('key_ruin')) return this.talk(DIALOGUES.gate_a());
    this.inv.remove('key_ruin'); this.flags.gate_a = true; this.refreshGates(); Audio.chest(); this.fx.burst(o.x, o.y - 10, '#ffe27a', 18, 70); this.toast('O portão de pedra se abriu!', '#ffe27a', 3.5); this.quests.advance('main', 'key');
  }
  // runas: azul, vermelha, verde (índices 0, 2, 1). Errar apaga tudo e dá um choque.
  touchRune(i) {
    if (this.runeLit[i]) return; const order = [0, 2, 1], sp = this.map.specials.find(s => s.id === 'rune' && s.idx === i);
    if (order[this.runeSeq.length] === i) {
      this.runeSeq.push(i); this.runeLit[i] = true; Audio.pickup(); this.fx.burst(sp.x, sp.y - 10, sp.col, 14, 60);
      if (this.runeSeq.length === 3) { this.flags.gate_b = true; this.refreshGates(); this.quests.advance('main', 'runes'); this.toast('O portão de runas se abriu!', '#7fd6ff', 4); Audio.chest(); this.fx.shake = 6; }
    } else { this.runeSeq = []; this.runeLit = [false, false, false]; this.toast('As runas se apagaram...', '#ff9a6a', 3); this.player.hurt(5, this, 0, 0); }
  }

  /* ---------- recompensas ---------- */
  onEnemyKilled(e) {
    this.fx.burst(e.x, e.y - 6, e.d.color, 16, 80, 0.6); this.fx.burst(e.x, e.y - 6, '#fff', 6, 40, 0.4);
    const xp = Math.round(e.d.xp * (e.alpha ? 2.5 : 1) * (1 + (e.maxHp / e.d.hp - 1)));
    this.giveXp(xp);
    const [c0, c1] = e.d.coins, n = randInt(c0, c1); for (let i = 0; i < Math.min(n, 6); i++) this.pickups.push(new Pickup('coin', e.x, e.y - 4, i === 0 ? n - Math.min(n, 6) + 1 : 1));
    for (const [id, ch] of e.d.drops) if (Math.random() < ch) this.pickups.push(new Pickup(id, e.x, e.y - 4));
    if (e.special === 'shard') { this.flags.alphaDown = true; this.pickups.push(new Pickup('shard', e.x, e.y - 4)); this.toast('O Lobo Alfa deixou cair um Fragmento!', '#9fe8ff'); }
    if (e.special === 'guard_cristarta' && !this.enemies.some(o => o !== e && o.hp > 0 && o.special === 'guard_cristarta')) this.rescueCristarta();
    if (e.boss) this.onBossDown(e);
    setTimeout(() => { this.enemies = this.enemies.filter(o => o !== e); }, 0);
  }
  giveXp(xp) {
    const p = this.player; this.fx.text(p.x, p.y - 30, '+' + xp + ' XP', '#ffe27a');
    if (gainXp(p, xp)) { const s = p.stats; p.hp = s.maxHp; p.mp = s.maxMp; Audio.levelUp(); this.toast('Kael subiu para o nível ' + p.level + '!', '#ffe27a', 3); this.fx.burst(p.x, p.y - 10, '#ffe27a', 24, 90, 0.8); }
    const c = this.party[this.activePet];
    if (c && c.hp > 0) {
      c.bond = Math.min(100, c.bond + 1);
      if (gainXp(c, Math.round(xp * 0.8))) {
        c.hp = creatureStats(c).maxHp; this.toast(CREATURES[c.id].name + ' subiu para o nível ' + c.level + '!', '#7ad94a', 3);
        const ev = checkEvolution(c); if (ev) { this.evo = { ...ev, t: 0 }; Audio.evolve(); this.prevMode = 'play'; this.mode = 'evolve'; this.spawnPetKeep(); }
      }
    }
    // as outras criaturas da equipe ganham uma parte da experiência
    this.party.forEach((o, i) => { if (i !== this.activePet && gainXp(o, Math.round(xp * 0.3))) { o.hp = creatureStats(o).maxHp; const ev = checkEvolution(o); if (ev && this.mode === 'play') { this.evo = { ...ev, t: 0 }; Audio.evolve(); this.prevMode = 'play'; this.mode = 'evolve'; } } });
  }
  spawnPetKeep() { const o = this.petObj; this.spawnPet(); if (o && this.petObj) { this.petObj.x = o.x; this.petObj.y = o.y; } }
  collect(pk) {
    if (pk.kind === 'coin') { this.inv.coins += pk.n; Audio.coin(); return; }
    this.inv.add(pk.kind, pk.n); Audio.pickup(); this.toast('+ ' + ITEMS[pk.kind].name, '#9fe8ff');
    if (pk.kind === 'shard') this.checkShards();
  }
  checkShards() { if (this.quests.step('main') === 'shards' && this.inv.count('shard') >= 3) { this.quests.advance('main', 'shards'); this.toast('3 fragmentos! A barreira de espinhos se abriu, ao norte.', '#7fd6ff', 4.5); Audio.chest(); this.saveGame(true); } }
  rescueCristarta() {
    if (this.flags.cristarta) return; this.flags.cristarta = true;
    this.quests.start('friend'); if (this.quests.step('friend') === 'find') this.quests.advance('friend', 'find'); this.quests.advance('friend', 'free');
    this.party.push(newCreature('cristarta', Math.max(2, this.player.level))); Audio.chest();
    this.toast('Cristarta entrou para a equipe!', '#4dc3ff', 4); this.toast('Troque de criatura com ' + this.input.label('swap'), '#4dc3ff', 5);
    const sp = this.map.specials.find(s => s.id === 'trapped'); if (sp) this.fx.burst(sp.x, sp.y - 6, '#bff3ff', 24, 80, 0.8);
  }
  checkGate() {
    const m = this.map, d = m.phase; if (this.flags[m.gateFlag]) return;
    if (this.enemies.some(e => e.hp > 0 && !e.boss)) return;
    this.flags[m.gateFlag] = true; this.refreshGates(); this.quests.advance('main', d.id);
    this.toast('O portão se abriu! O chefe espera adiante.', '#ffe27a', 4.5); Audio.chest(); this.fx.shake = 6; this.saveGame(true);
  }
  // cada Cristal conquistado dá um bônus permanente (Forma Suprema vale dois)
  applyCrystals() {
    const f = this.flags, u = (f.cr_p6 ? 1 : 0) + (f.cr_p9 ? 1 : 0) + (f.cr_p14 ? 2 : 0);
    this.player.bonus = { attack: u * 5, maxHp: u * 25, defense: u * 2, crystals: u };
  }
  giveCrystal(d) {
    this.flags['cr_' + d.id] = true; this.applyCrystals(); const p = this.player; p.hp = p.stats.maxHp; p.mp = p.stats.maxMp;
    this.toast(d.crystalName + ': seu poder aumentou!', '#ffe27a', 5); this.fx.burst(p.x, p.y - 10, '#ffe27a', 30, 100, 0.9);
  }
  endingFor(d) {
    const full = this.quests.done('friend');
    return { phase: 'FASE 15 CONCLUÍDA · A ÚLTIMA LUZ', title: d.victory.title, l1: full ? 'A luz voltou a Elydran. Kael, Laylla e Cristarta finalmente respiram em paz.' : 'A luz voltou a Elydran, mas ainda há criaturas esperando por ajuda.',
      l2: full ? 'Final completo: ninguém foi deixado para trás.' : 'Resgate Cristarta na Floresta de Aurora para ver o final completo.', l3: 'Obrigado por jogar ELYDRAN: Lendas do Cristal.' };
  }
  chainNext(b, kind) {
    const m = this.map, p = this.player;
    this.fx.burst(b.x, b.y - 8, b.d.color, 30, 100, 0.8); this.fx.flash = 0.7; this.fx.flashCol = '#fff'; this.fx.shake = 8; this.projectiles = [];
    this.enemies.forEach(e => { if (e !== b && e.hp > 0) e.hp = 0; });
    p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.25);
    this.toast('Um guardião caiu! O próximo desperta...', '#ffe27a', 3.5); Audio.chest();
    setTimeout(() => { if (this.map !== m) return; const nb = new Boss(kind, m.bossAt[0], m.bossAt[1]); nb.flag = b.flag; this.boss = nb; this.enemies.push(nb); this.fx.burst(nb.x, nb.y - 8, nb.d.color, 24, 90, 0.7); }, 1800);
  }
  onBossDown(b) {
    const def = this.map.phase;
    if (def && def.chain) { const i = def.chain.indexOf(b.kind); if (i >= 0 && i < def.chain.length - 1) return this.chainNext(b, def.chain[i + 1]); }
    const f = b.flag, q = this.quests; this.flags[f] = true; this.fx.flash = 1; this.fx.flashCol = '#bff3ff'; this.fx.shake = 10; Audio.stopMusic();
    this.projectiles = []; this.enemies.forEach(e => { if (e !== b && e.hp > 0) { e.hp = 0; this.fx.burst(e.x, e.y, '#7fd6ff', 8, 50); } });
    let v;
    if (f === 'slimeDown') { q.advance('main', 'slime'); v = { phase: 'FASE 1 CONCLUÍDA · O DESPERTAR', title: 'O Slime Ancestral foi derrotado!', l1: 'A gosma sumiu e a ponte para a Floresta de Aurora está livre.', l2: 'A próxima lenda espera do outro lado do rio.' }; }
    else if (f === 'thornDown') { q.advance('main', 'thornboss'); this.flags.bossDefeated = true; v = { phase: 'FASE 2 CONCLUÍDA · FLORESTA DE AURORA', title: 'O Guardião Espinheiro caiu!', l1: 'Os espinhos recuaram e uma escadaria apareceu a nordeste da floresta.', l2: 'As Ruínas Esquecidas guardam a próxima pista.' }; }
    else if (f === 'knightDown') { q.advance('main', 'knight'); v = { phase: 'FASE 3 CONCLUÍDA · RUÍNAS ESQUECIDAS', title: 'O Cavaleiro de Pedra desmoronou!', l1: 'Você achou a primeira pista dos Cristais Elementais (tábua ao norte).', l2: 'Uma passagem se abriu no fundo do salão: ela leva à Fase 4, as Montanhas de Gelo.' }; }
    else if (def) { q.advance('main', def.id + 'boss'); if (def.crystal) this.giveCrystal(def); v = def.final ? this.endingFor(def) : { phase: 'FASE ' + def.n + ' CONCLUÍDA · ' + def.name.toUpperCase(), title: def.victory.title, l1: def.victory.l1, l2: def.victory.l2 }; }
    setTimeout(() => { this.boss = null; this.refreshGates(); this.saveGame(true); this.victory = v; this.prevMode = 'play'; this.mode = 'victory'; Audio.chest(); Audio.playMusic('victory'); }, 2200);
  }
  useItem(id) {
    const it = ITEMS[id], p = this.player, s = p.stats, pet = this.party[this.activePet];
    if (it.kind === 'weapon') { p.weapon = id; this.toast('Equipou: ' + it.name, '#ffe27a'); Audio.select(); return; }
    if (it.kind !== 'consumable') return;
    if (it.heal && p.hp >= s.maxHp && !(it.petHeal && pet && pet.hp < creatureStats(pet).maxHp)) { this.toast('Vida já está cheia', '#b8a8d8'); return; }
    if (it.mana && !it.heal && p.mp >= s.maxMp) { this.toast('Energia já está cheia', '#b8a8d8'); return; }
    this.inv.remove(id); Audio.heal();
    if (it.heal) { p.hp = Math.min(s.maxHp, p.hp + it.heal); this.fx.text(p.x, p.y - 26, '+' + it.heal, '#7ad94a'); }
    if (it.mana) p.mp = Math.min(s.maxMp, p.mp + it.mana);
    if (it.petHeal && pet) { pet.hp = Math.min(creatureStats(pet).maxHp, pet.hp + it.petHeal); }
    this.fx.burst(p.x, p.y - 10, '#7ad94a', 12, 50);
  }
  onPlayerDown() { this.mode = 'over'; Audio.stopMusic(); Audio.hurt(); }
  respawn() {
    const d = Save.load(); this.inv.coins = Math.floor(this.inv.coins / 2);
    const p = this.player, s = p.stats; p.hp = s.maxHp; p.mp = s.maxMp; p.iframes = 2; this.party.forEach(c => { c.hp = creatureStats(c).maxHp; });
    const region = d ? d.player.region : 'village', pos = d && d.player.position;
    this.loadMap(region, pos && pos.x, pos && pos.y); this.mode = 'play';
  }

  /* ---------- interação (E / X) ---------- */
  findInteract() {
    const p = this.player, near = (x, y, r) => Math.hypot(x - p.x, y - p.y) < r;
    for (const n of this.npcs) if (near(n.x, n.y, 22)) return { label: 'Falar', x: n.x, y: n.y, fn: () => { this.talkingTo = n; this.talk(DIALOGUES[n.id](this)); } };
    for (const c of this.map.chests) if (!this.flags[c.id] && near(c.x, c.y, 22)) return { label: 'Abrir', x: c.x, y: c.y + 4, fn: () => this.openChest(c) };
    for (const sv of this.map.saves) if (near(sv.x, sv.y, 24)) return { label: 'Descansar e salvar', x: sv.x, y: sv.y, fn: () => this.restAt(sv) };
    for (const b of this.map.bushes) if (b.kind === 'berry' && b.ready && near(b.x, b.y, 18)) return { label: 'Colher', x: b.x, y: b.y + 6, fn: () => { b.ready = false; b.regrow = 60; this.inv.add('berry'); Audio.pickup(); this.toast('+ Fruta-Lume', '#ffd23f'); this.checkPrepare(); } };
    for (const o of this.map.objects) if (o.type === 'sign' && near(o.x, o.y, 20)) return { label: 'Ler', x: o.x, y: o.y + 6, fn: () => this.talk([['Placa', o.text]]) };
    for (const o of this.map.objects) if (o.type === 'gate' && !o.open && near(o.x, o.y, 32)) return { label: o.id === 'gate_a' ? 'Abrir portão' : 'Examinar', x: o.x, y: o.y, fn: () => (o.id === 'gate_a' ? this.openGateA(o) : this.talk(DIALOGUES[o.id || 'goo']())) };
    for (const sp of this.map.specials) {
      if (sp.id === 'talk' && (!sp.needFlag || this.flags[sp.needFlag]) && near(sp.x, sp.y, sp.r)) return { label: sp.label || 'Ler', x: sp.x, y: sp.y + 6, fn: () => this.talk(DIALOGUES[sp.talk](this)) };
      if (sp.id === 'rune' && !this.flags.gate_b && near(sp.x, sp.y, sp.r)) return { label: 'Tocar runa', x: sp.x, y: sp.y + 4, fn: () => this.touchRune(sp.idx) };
      if (sp.id === 'seal' && near(sp.x, sp.y, 30)) return { label: 'Examinar', x: sp.x, y: sp.y + 8, fn: () => this.talk(DIALOGUES.seal(this)) };
      if (sp.id === 'trapped' && !this.flags.cristarta && near(sp.x, sp.y, 26)) return { label: 'Falar', x: sp.x, y: sp.y + 6, fn: () => this.talk(DIALOGUES.trapped(this)) };
    }
    return null;
  }
  openChest(c) {
    this.flags[c.id] = true; Audio.chest(); this.fx.burst(c.x, c.y - 10, '#ffe27a', 16, 70);
    for (const [id, n] of c.items) {
      this.inv.add(id, n); this.toast('+ ' + ITEMS[id].name + (n > 1 ? ' x' + n : ''), ITEMS[id].kind === 'quest' ? '#9fe8ff' : '#ffe27a', 3.5);
      if (ITEMS[id].kind === 'weapon' && (ITEMS[id].attack > (ITEMS[this.player.weapon] ? ITEMS[this.player.weapon].attack : 0))) { this.player.weapon = id; this.toast('Equipou: ' + ITEMS[id].name, '#bff3ff', 3.5); }
    }
    this.checkShards();
  }
  restAt(sv) {
    const p = this.player, s = p.stats; p.hp = s.maxHp; p.mp = s.maxMp; this.party.forEach(c => { c.hp = creatureStats(c).maxHp; });
    this.fx.burst(sv.x, sv.y - 14, '#bff3ff', 20, 70); Audio.heal(); this.saveGame();
  }

  /* ---------- atualização ---------- */
  update(dt) {
    this.t += dt; this.input.poll(); const inp = this.input;
    for (const m of this.toasts) m.t += dt; this.toasts = this.toasts.filter(m => m.t < m.life);
    if (this.mode === 'title') return M.updateTitle(this);
    if (this.mode === 'controls') return M.updateControls(this);
    if (this.fade) { this.fade.t += dt; if (this.fade.t > 0.35 && !this.fade.done) { this.fade.done = true; this.loadMap(this.fade.id, this.fade.x, this.fade.y); } if (this.fade.t > 0.7) this.fade = null; return; }
    if (this.mode === 'dialog') M.updateDialog(this, dt);
    else if (this.mode === 'shop') return M.updateShop(this);
    else if (this.mode === 'menu') return M.updateMenu(this);
    else if (this.mode === 'map') return M.updateMap(this);
    else if (this.mode === 'pause') return M.updatePause(this);
    else if (this.mode === 'evolve') return M.updateEvolve(this, dt);
    else if (this.mode === 'over') return M.updateOver(this);
    else if (this.mode === 'victory') { M.updateVictory(this); }
    if (this.mode === 'play') {
      this.playTime += dt;
      if (inp.pressed('pause')) { this.openOverlay('pause'); Audio.select(); return; }
      if (inp.pressed('inventory')) { this.openOverlay('menu'); Audio.select(); return; }
      if (inp.pressed('map')) { this.openOverlay('map'); Audio.select(); return; }
      if (inp.pressed('swap') && this.party.length > 1) this.setActivePet((this.activePet + 1) % this.party.length);
      this.prompt = this.findInteract();
      if (this.prompt && inp.pressed('interact')) { Audio.select(); this.prompt.fn(); this.prompt = null; }
    }
    this.regionT = Math.max(0, (this.regionT || 0) - dt);
    const p = this.player; p.update(dt, this);
    if (this.petObj) this.petObj.update(dt, this);
    for (const n of this.npcs) n.update(dt, this);
    if (this.mode !== 'dialog') for (const e of this.enemies) if (e.hp > 0) e.update(dt, this);
    for (const b of this.map.bushes) if (!b.ready && (b.regrow -= dt) <= 0) b.ready = true;
    this.updateProjectiles(dt);
    for (const pk of this.pickups) pk.update(dt, this); this.pickups = this.pickups.filter(pk => !pk.dead);
    this.fx.update(dt);
    // missão: chegou perto da criatura presa
    if (!this.flags.cristarta) { const sp = this.map.specials.find(s => s.id === 'trapped'); if (sp && Math.hypot(sp.x - p.x, sp.y - p.y) < 80) { if (!this.quests.started('friend')) { this.quests.start('friend'); this.toast('Nova missão: Amigo Perdido', '#ffe27a'); } if (this.quests.advance('friend', 'find')) this.toast('Derrote os Gotalins que cercam a criatura!', '#4dc3ff', 3.5); } }
    if (this.quests.step('main') === 'prepare') this.checkPrepare();
    if (this.map.phase && this.mode === 'play') this.checkGate();
    // armadilhas de espinhos das ruínas: sobem em ritmo (o aviso vermelho vem antes)
    if (this.map.id === 'ruins' || this.map.phase) for (const o of this.map.objects) if (o.type === 'spikes') { const ph = (this.t + o.off) % 3; if (ph > 1.9 && p.dodgeT <= 0 && Math.hypot(p.x - o.x, p.y - o.y) < 9) p.hurt(7, this, (p.x - o.x) * 8, (p.y - o.y) * 8); }
    // saídas do mapa
    for (const ex of this.map.exits) {
      const r = ex.rect; if (p.x < r.x || p.x > r.x + r.w || p.y < r.y || p.y > r.y + r.h) continue;
      if ((ex.needStep && !this.quests.atLeast('main', ex.needStep)) || (ex.needFlag && !this.flags[ex.needFlag])) {
        const W = this.map.w * TILE, H = this.map.h * TILE, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        if (r.y <= 8) p.y = r.y + r.h + 4; else if (r.y + r.h >= H - 8) p.y = r.y - 4; else if (r.x <= 8) p.x = r.x + r.w + 4; else if (r.x + r.w >= W - 8) p.x = r.x - 4;
        else if (Math.abs(p.y - cy) * 2 > Math.abs(p.x - cx)) p.y += (p.y < cy ? -1 : 1) * 10; else p.x += (p.x < cx ? -1 : 1) * 10;
        this.toast(ex.msg || 'O caminho está bloqueado.', '#ff9a6a', 3.5); break;
      }
      if (ex.lockDuringBoss && this.boss && this.boss.hp > 0 && this.boss.state !== 'sleep') { p.y -= 6; this.toast('Uma barreira bloqueia a saída!', '#ff7ae0'); break; }
      this.goTo(ex.to, ex.tx, ex.ty); break;
    }
    // câmera suave
    const m = this.map, tx = m.w * TILE <= VIEW_W ? (m.w * TILE - VIEW_W) / 2 : Math.max(0, Math.min(m.w * TILE - VIEW_W, p.x - VIEW_W / 2)), ty = m.h * TILE <= VIEW_H ? (m.h * TILE - VIEW_H) / 2 : Math.max(0, Math.min(m.h * TILE - VIEW_H, p.y - 8 - VIEW_H / 2));
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 8); this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 8);
  }
  updateProjectiles(dt) {
    const p = this.player;
    for (const pr of this.projectiles) {
      pr.update(dt);
      if (pr.kind === 'nova') { pr.r += pr.grow * dt; for (const e of this.enemies) if (e.hp > 0 && !pr.hit.has(e) && Math.abs(Math.hypot(e.x - pr.x, e.y - 6 - pr.y) - pr.r) < 10 + e.r) { pr.hit.add(e); const { dmg, mult } = calcDamage(pr.attack, e.def, pr.power, pr.element, e.element); e.damage(dmg, this, (e.x - pr.x) * 3, (e.y - pr.y) * 3, mult); } continue; }
      if (blocked(this.map, pr.x, pr.y + 6, 2, true)) { pr.t = 99; this.fx.burst(pr.x, pr.y, '#fff', 3, 30, 0.2); continue; }
      if (pr.friendly) {
        for (const e of this.enemies) if (e.hp > 0 && Math.hypot(e.x - pr.x, e.y - 6 - pr.y) < e.r + pr.r + 2) {
          const { dmg, mult } = calcDamage(pr.attack, e.def, pr.power, pr.element, e.element); e.damage(dmg, this, pr.vx * 0.5, pr.vy * 0.5, mult); pr.t = 99;
          if (pr.heal) { p.hp = Math.min(p.stats.maxHp, p.hp + pr.heal); this.fx.text(p.x, p.y - 26, '+' + pr.heal, '#7ad94a'); }
          break;
        }
      } else if (Math.hypot(p.x - pr.x, p.y - 6 - pr.y) < p.r + pr.r + 1) {
        if (p.dodgeT > 0) continue; // na esquiva o projétil atravessa
        const { dmg } = calcDamage(pr.attack, p.stats.defense, 1, pr.element, null); p.hurt(dmg, this, pr.vx * 0.6, pr.vy * 0.6); pr.t = 99;
      }
    }
    this.projectiles = this.projectiles.filter(pr => !pr.dead);
  }
  hitSprites(x, y) { const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); if (this.map.get(tx, ty) === T.TALL) this.fx.burst(x, y + 6, '#7cc35a', 5, 40, 0.3); }
  questTargets() {
    const st = this.quests.step('main'), m = this.map, out = [], p = this.player;
    const npc = id => { const n = m.npcs.find(n => n.id === id); if (n) out.push(n); return !!n; };
    if (m.id === 'village') {
      if (st === 'talk_elder') npc('elder');
      else if (st === 'prepare') { if (p.weapon === 'none') npc('smith'); else { const b = m.bushes.find(b => b.kind === 'berry' && b.ready); if (b) out.push(b); } }
      else if (st === 'pit' || st === 'slime') { const h = m.objects.find(o => o.type === 'hole'); if (h) out.push(h); }
      else if (st === 'forest') out.push({ x: (m.w - 1) * TILE, y: 15 * TILE });
    } else if (m.id === 'forest') {
      if (st === 'forest' || st === 'laylla') npc('laylla');
      else if (st === 'shards') { m.chests.forEach(c => { if (!this.flags[c.id] && c.items.some(([i]) => i === 'shard')) out.push(c); }); if (!this.flags.alphaDown) { const s = m.spawns.find(s => s.special === 'shard'); if (s) out.push(s); } }
      else if (st === 'thorn' || st === 'thornboss') out.push({ x: 33 * TILE, y: 3 * TILE });
      else if (st === 'ruins') { const h = m.objects.find(o => o.type === 'hole'); if (h) out.push(h); }
      else if (this.flags.thornDown && !this.flags.knightDown && st !== 'done') { const h = m.objects.find(o => o.type === 'hole'); if (h) out.push(h); }
      if (this.quests.step('friend') && !this.quests.done('friend')) { const s = m.specials.find(s => s.id === 'trapped'); if (s) out.push(s); }
    } else if (m.id === 'ruins') {
      if (st === 'key') { const c = m.chests.find(c => c.id === 'r_key'); if (c && !this.flags.r_key) out.push(c); else { const g = m.objects.find(o => o.id === 'gate_a'); if (g) out.push(g); } }
      else if (st === 'runes') { const sp = m.specials.find(s => s.id === 'rune' && !this.runeLit[s.idx]); if (sp) out.push(sp); }
      else if (st === 'knight' && this.boss) out.push(this.boss);
      else if (this.flags.knightDown) { const h = m.objects.find(o => o.type === 'hole'); if (h) out.push(h); }
    } else if (m.phase) {
      if (!this.flags[m.gateFlag]) { let best = null, bd = 1e9; for (const e of this.enemies) if (e.hp > 0 && !e.boss) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } } if (best) out.push(best); }
      else if (this.boss && this.boss.hp > 0) out.push(this.boss);
      else { const h = m.objects.find(o => o.type === 'hole'); if (h) out.push(h); }
    }
    return out;
  }

  /* ---------- desenho ---------- */
  draw(ctx) {
    const t = this.t;
    if (this.mode === 'title' || (this.mode === 'controls' && this.prevMode === 'title')) { M.drawTitle(ctx, this, t); if (this.mode === 'controls') M.drawControls(ctx, this); this.drawToasts(ctx); return; }
    const cam = { x: Math.round(this.cam.x + (this.fx.shake ? rand(-this.fx.shake, this.fx.shake) : 0)), y: Math.round(this.cam.y + (this.fx.shake ? rand(-this.fx.shake, this.fx.shake) : 0)) };
    if (this.r3d) this.r3d.drawOverlay(ctx, this); // 3D: o mundo já foi desenhado no outro canvas, aqui vai só a interface por cima
    else {
      ctx.fillStyle = this.map.theme === 'sanctuary' ? '#0b0718' : '#173d24'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.drawImage(this.ground, -cam.x, -cam.y);
      drawWater(ctx, this.map, cam, t);
      this.drawWorld(ctx, cam, t);
      for (const pr of this.projectiles) pr.draw(ctx, cam, t);
      this.fx.draw(ctx, cam, FONT);
      this.drawLight(ctx, cam, t);
    }
    if (this.fx.flash > 0) { ctx.globalAlpha = Math.min(1, this.fx.flash); ctx.fillStyle = this.fx.flashCol; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1; }
    if (this.mode !== 'over') drawHUD(ctx, this, t);
    if (this.mode === 'dialog') M.drawDialog(ctx, this, t);
    else if (this.mode === 'shop') M.drawShop(ctx, this);
    else if (this.mode === 'menu') M.drawMenu(ctx, this, t);
    else if (this.mode === 'map') M.drawMap(ctx, this, t);
    else if (this.mode === 'pause') M.drawPause(ctx, this);
    else if (this.mode === 'controls') M.drawControls(ctx, this);
    else if (this.mode === 'evolve') M.drawEvolve(ctx, this, t);
    else if (this.mode === 'over') M.drawOver(ctx, this);
    else if (this.mode === 'victory') M.drawVictory(ctx, this, t);
    if (this.fade) { ctx.fillStyle = `rgba(8,4,16,${Math.min(1, this.fade.t < 0.35 ? this.fade.t / 0.35 : 1 - (this.fade.t - 0.35) / 0.35)})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }
  drawToasts(ctx) { if (!this.toasts.length) return; this.toasts.forEach((m, i) => { ctx.globalAlpha = Math.min(1, m.t * 4, (m.life - m.t) * 2); ctx.fillStyle = 'rgba(18,12,28,.85)'; ctx.fillRect(60, 196 + i * 14, VIEW_W - 120, 12); ctx.font = 'bold 8px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = m.col; ctx.fillText(m.s, VIEW_W / 2, 198 + i * 14); ctx.globalAlpha = 1; }); }
  drawWorld(ctx, cam, t) {
    const m = this.map, list = [], inView = (x, y, mg) => x > cam.x - mg && x < cam.x + VIEW_W + mg && y > cam.y - 20 && y < cam.y + VIEW_H + mg + 40;
    const p = this.player;
    for (const o of m.objects) { if (o.type === 'block' || !inView(o.x, o.y, o.type === 'house' ? 60 : 30)) continue; list.push({ y: o.type === 'glowshroom' ? o.y - 4 : o.y, d: () => this.drawObject(ctx, o, cam, t) }); }
    for (const b of m.bushes) if (inView(b.x, b.y, 20)) list.push({ y: b.y, d: () => S.drawBush(ctx, b.x - cam.x, b.y - cam.y, b.kind === 'berry' && b.ready ? 'berry' : 'bush') });
    for (const c of m.chests) if (inView(c.x, c.y, 20)) list.push({ y: c.y, d: () => S.drawChest(ctx, c.x - cam.x, c.y - cam.y, !!this.flags[c.id]) });
    for (const sv of m.saves) list.push({ y: sv.y, d: () => S.drawCrystal(ctx, sv.x - cam.x, sv.y - cam.y, t) });
    for (const sp of m.specials) if (sp.id === 'trapped' && !this.flags.cristarta) list.push({ y: sp.y, d: () => { S.drawTurtle(ctx, sp.x - cam.x, sp.y - cam.y, -1, t * 0.4, 1, false); ctx.strokeStyle = `rgba(160,235,255,${0.5 + Math.sin(t * 3) * 0.2})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sp.x - cam.x, sp.y - cam.y - 6, 11, 0, 7); ctx.stroke(); } });
    for (const n of this.npcs) list.push({ y: n.y, d: () => n.draw(ctx, cam) });
    for (const e of this.enemies) if (e.hp > 0 && inView(e.x, e.y, 40)) list.push({ y: e.y, d: () => e.draw(ctx, cam) });
    if (this.petObj) list.push({ y: this.petObj.y, d: () => this.petObj.draw(ctx, cam) });
    list.push({ y: p.y, d: () => p.draw(ctx, cam, t), player: true });
    for (const pk of this.pickups) list.push({ y: pk.y, d: () => pk.draw(ctx, cam) });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.d();
    // contorno do herói quando está atrás de árvore ou casa
    const hidden = m.objects.some(o => (o.type === 'tree' && p.y < o.y && p.y > o.y - 44 && Math.abs(p.x - o.x) < 16) || (o.type === 'house' && p.y < o.y - 38 && p.y > o.y - 80 && Math.abs(p.x - o.x) < o.wt * 8));
    if (hidden) { ctx.save(); ctx.globalAlpha = 0.45; p.draw(ctx, cam, t); ctx.restore(); }
  }
  drawObject(ctx, o, cam, t) {
    const x = o.x - cam.x, y = o.y - cam.y;
    if (o.type === 'tree') { const c = S.treeSprite(o.kind, o.seed); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 2, y - 1, 13, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(c, Math.round(x - 22), Math.round(y - 54)); }
    else if (o.type === 'house') { const c = S.houseSprite(o.wt, o.roof, o.seed); ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - 78)); S.drawSmoke(ctx, x + c.width / 2 - 22, y - 70, t + o.seed); }
    else if (o.type === 'fountain') S.drawFountain(ctx, x, y, t);
    else if (o.type === 'lamp') S.drawLamp(ctx, x, y, t);
    else if (o.type === 'sign') S.drawSign(ctx, x, y);
    else if (o.type === 'rock') S.drawRock(ctx, x, y, o.s);
    else if (o.type === 'pillar') S.drawPillar(ctx, x, y, o.broken);
    else if (o.type === 'glowshroom') S.drawMushroomGlow(ctx, x, y, t, o.col);
    else if (o.type === 'portal') { S.drawPortal(ctx, x, y, t, this.quests.atLeast('main', 'thorn')); }
    else if (o.type === 'hole') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 17, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#0b0718'; ctx.beginPath(); ctx.ellipse(x, y, 13, 6.5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = o.col; ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.25; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 14, 7.5, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (o.type === 'gate') { if (o.open) return; if (o.style === 'goo') { ctx.fillStyle = '#58d98a'; ctx.beginPath(); ctx.ellipse(x, y - 8, 11, 26, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9af0b4'; ctx.fillRect(x - 5, y - 24, 3, 8); } else { ctx.fillStyle = '#5a5478'; ctx.fillRect(o.solid0.x - cam.x, o.solid0.y - cam.y - 14, o.solid0.w, o.solid0.h + 14); ctx.fillStyle = '#8a82b0'; ctx.fillRect(o.solid0.x - cam.x + 2, o.solid0.y - cam.y - 12, o.solid0.w - 4, 3); } }
    else if (o.type === 'spikes') { const ph = (this.t + o.off) % 3, up = ph > 1.9, warn = ph > 1.3 && !up; ctx.fillStyle = '#1a1424'; ctx.fillRect(x - 5, y - 2, 10, 4); if (up) { ctx.fillStyle = '#d0d4de'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3 - 1.5, y); ctx.lineTo(x + k * 3, y - 8); ctx.lineTo(x + k * 3 + 1.5, y); ctx.fill(); } } else if (warn) { ctx.fillStyle = 'rgba(255,70,70,.7)'; ctx.fillRect(x - 4, y - 1, 8, 2); } }
    else if (o.type === 'rune') { const lit = this.runeLit && this.runeLit[o.idx]; ctx.fillStyle = '#4a4468'; ctx.fillRect(x - 5, y - 6, 10, 8); ctx.fillStyle = lit ? o.col : '#2a2440'; ctx.fillRect(x - 3, y - 12, 6, 6); if (lit) { ctx.globalAlpha = 0.3; ctx.fillRect(x - 6, y - 15, 12, 12); ctx.globalAlpha = 1; } }
    else if (o.type === 'tablet') { ctx.fillStyle = '#6a6488'; ctx.fillRect(x - 6, y - 14, 12, 14); ctx.fillStyle = '#8a82b0'; ctx.fillRect(x - 4, y - 12, 8, 2); ctx.fillRect(x - 4, y - 8, 6, 2); }
    else if (o.type === 'bigcrystal') S.drawCrystal(ctx, x, y, t, true, this.flags.bossDefeated ? '#9fe8ff' : null, !this.flags.bossDefeated);
  }
  // luz e clima de cada região
  drawLight(ctx, cam, t) {
    const th = this.map.theme;
    if (th === 'forest') {
      ctx.fillStyle = 'rgba(10,30,40,.28)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const bx = ((i * 157 - cam.x * 0.3) % (VIEW_W + 160) + VIEW_W + 160) % (VIEW_W + 160) - 80, a = 0.06 + Math.sin(t * 0.7 + i) * 0.02; const gr = ctx.createLinearGradient(bx, 0, bx + 60, VIEW_H); gr.addColorStop(0, `rgba(255,240,170,${a})`); gr.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 26, 0); ctx.lineTo(bx + 100, VIEW_H); ctx.lineTo(bx + 50, VIEW_H); ctx.fill(); }
      for (let i = 0; i < 28; i++) { const fx = ((i * 83.7 + Math.sin(t * 0.5 + i) * 30 - cam.x * 0.6) % VIEW_W + VIEW_W) % VIEW_W, fy = ((i * 47.3 + Math.cos(t * 0.4 + i * 2) * 20 - cam.y * 0.6) % VIEW_H + VIEW_H) % VIEW_H, k = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); ctx.fillStyle = `rgba(200,255,140,${0.5 * k})`; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1); ctx.fillStyle = `rgba(200,255,140,${0.12 * k})`; ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3); }
      ctx.restore();
    } else if (th === 'sanctuary') {
      const lit = this.flags.bossDefeated;
      const gr = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 60, VIEW_W / 2, VIEW_H / 2, 300); gr.addColorStop(0, 'rgba(40,20,80,0)'); gr.addColorStop(1, lit ? 'rgba(30,60,90,.45)' : 'rgba(40,10,60,.65)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 20; i++) { const k = (t * 0.15 + i / 20) % 1, x = (i * 71) % VIEW_W, y = VIEW_H - k * VIEW_H; ctx.fillStyle = lit ? `rgba(160,235,255,${0.5 * (1 - k)})` : `rgba(200,140,255,${0.4 * (1 - k)})`; ctx.fillRect(x, Math.round(y), 1, 2); } ctx.restore();
    } else {
      const gr = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, 320); gr.addColorStop(0, 'rgba(255,230,180,0)'); gr.addColorStop(1, 'rgba(60,30,40,.25)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
