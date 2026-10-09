// ProgressionSystem e CreatureSystem: experiência, níveis, atributos e evolução
import { CREATURES, xpToNext } from '../data/creatures.js';
import { ITEMS } from '../data/items.js';

// atributos do herói conforme o nível e a arma
export function heroStats(p) {
  const L = p.level, w = ITEMS[p.weapon], b = p.bonus || {};
  return { maxHp: 90 + L * 14 + (b.maxHp || 0), maxMp: 40 + L * 5, attack: 8 + L * 3 + (w ? w.attack : 0) + (b.attack || 0), defense: 4 + L * 2 + (b.defense || 0), speed: 92 };
}
// atributos da criatura conforme o nível
export function creatureStats(c) {
  const d = CREATURES[c.id], b = d.baseStats, L = c.level;
  return { maxHp: Math.round(b.hp + L * b.hp * 0.16), attack: Math.round(b.attack + L * b.attack * 0.14), defense: Math.round(b.defense + L * b.defense * 0.12), speed: b.speed };
}
export function newCreature(id, level) { const c = { id, level: level || 1, xp: 0, bond: 0, hp: 0 }; c.hp = creatureStats(c).maxHp; return c; }

// soma XP; devolve quantos níveis subiu
export function gainXp(obj, amount) {
  let ups = 0; obj.xp += amount;
  while (obj.xp >= xpToNext(obj.level)) { obj.xp -= xpToNext(obj.level); obj.level++; ups++; }
  return ups;
}
// a criatura evolui quando chega no nível pedido; devolve a nova forma ou null
export function checkEvolution(c) {
  const evo = CREATURES[c.id].evolution;
  if (evo && c.level >= evo.requiredLevel) { const from = c.id; c.id = evo.target; c.hp = creatureStats(c).maxHp; return { from, to: c.id }; }
  return null;
}
