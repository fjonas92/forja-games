// SaveSystem: grava só os dados necessários (nunca objetos internos do jogo) e valida tudo ao carregar
import { SAVE_KEY, SAVE_VERSION } from '../config.js';
import { CREATURES } from '../data/creatures.js';
import { ITEMS } from '../data/items.js';

const num = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d);

export function serialize(g) {
  const p = g.player;
  return {
    version: SAVE_VERSION,
    player: { level: p.level, xp: p.xp, hp: Math.round(p.hp), mp: Math.round(p.mp), weapon: p.weapon, region: g.map.id, position: { x: Math.round(p.x), y: Math.round(p.y) } },
    inventory: g.inv.toJSON(),
    party: g.party.map(c => ({ id: c.id, level: c.level, xp: c.xp, bond: c.bond, hp: Math.round(c.hp) })),
    active: g.activePet,
    quests: g.quests.toJSON(),
    flags: { ...g.flags },
    playTime: Math.round(g.playTime),
    lastSavedAt: new Date().toISOString()
  };
}
export function save(g) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize(g))); return true; } catch (e) { return false; } }
export function hasSave() { return !!load(); }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// lê e corrige o salvamento; devolve null se estiver inválido
export function load() {
  let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; }
  if (!d || typeof d !== 'object' || !d.player) return null;
  if ((d.version | 0) > SAVE_VERSION) return null; // salvo por uma versão mais nova do jogo
  const p = d.player;
  const out = {
    player: { level: num(p.level, 1, 99, 1) | 0, xp: num(p.xp, 0, 1e6, 0), hp: num(p.hp, 1, 9999, 100), mp: num(p.mp, 0, 9999, 40), weapon: ITEMS[p.weapon] && ITEMS[p.weapon].kind === 'weapon' ? p.weapon : 'none',
      region: ['village', 'forest', 'sanctuary'].includes(p.region) ? p.region : 'village', position: p.position && { x: num(p.position.x, 0, 5000, 0), y: num(p.position.y, 0, 5000, 0) } },
    inventory: d.inventory || {},
    party: Array.isArray(d.party) ? d.party.filter(c => c && CREATURES[c.id]).slice(0, 6).map(c => ({ id: c.id, level: num(c.level, 1, 99, 1) | 0, xp: num(c.xp, 0, 1e6, 0), bond: num(c.bond, 0, 100, 0), hp: num(c.hp, 0, 9999, 1) })) : [],
    active: num(d.active, 0, 5, 0) | 0,
    quests: d.quests || {},
    flags: d.flags && typeof d.flags === 'object' ? Object.fromEntries(Object.entries(d.flags).filter(([k, v]) => /^[\w-]{1,40}$/.test(k) && (typeof v === 'boolean' || typeof v === 'number'))) : {},
    playTime: num(d.playTime, 0, 1e8, 0), lastSavedAt: String(d.lastSavedAt || '')
  };
  if (!out.party.length) out.party = [{ id: 'brasek', level: 1, xp: 0, bond: 0, hp: 50 }];
  if (out.active >= out.party.length) out.active = 0;
  if (out.player.region === 'sanctuary') out.player.region = 'forest', out.player.position = null; // nunca recomeça no meio da luta
  return out;
}
