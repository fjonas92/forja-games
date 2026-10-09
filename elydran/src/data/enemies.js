// Inimigos e chefe. ai: tipo de comportamento em entities/enemy.js
export const ENEMIES = {
  gotalim: { name: 'Gotalim', element: 'water', ai: 'hop', hp: 22, attack: 7, defense: 2, speed: 46, xp: 7, coins: [1, 3], r: 6, color: '#3aa0ff', drops: [['potion', 0.12]] },
  fungo: { name: 'Fungo', element: 'nature', ai: 'spitter', hp: 30, attack: 8, defense: 3, speed: 30, xp: 10, coins: [2, 4], r: 6, color: '#d8463a', drops: [['potion', 0.15], ['ether', 0.1]] },
  lobo: { name: 'Lobo Sombrio', element: 'shadow', ai: 'dasher', hp: 46, attack: 12, defense: 5, speed: 64, xp: 18, coins: [3, 7], r: 7, color: '#5b4a8a', drops: [['potion', 0.2], ['ether', 0.12]] },
  golem: { name: 'Golem Guardião', element: 'crystal', ai: 'boss', hp: 980, attack: 17, defense: 12, speed: 34, xp: 160, coins: [60, 60], r: 15, color: '#7fd6ff', drops: [] }
  ,
  slimeboss: { name: 'Slime Ancestral', element: 'water', ai: 'boss', hp: 520, attack: 10, defense: 4, speed: 30, xp: 90, coins: [30, 30], r: 16, color: '#58d98a', drops: [['potion', 1]] },
  espinheiro: { name: 'Guardião Espinheiro', element: 'nature', ai: 'boss', hp: 760, attack: 13, defense: 7, speed: 32, xp: 150, coins: [45, 45], r: 15, color: '#6fcf4a', drops: [['ether', 1]] },
  cavaleiro: { name: 'Cavaleiro de Pedra', element: 'crystal', ai: 'boss', hp: 980, attack: 17, defense: 12, speed: 38, xp: 240, coins: [70, 70], r: 14, color: '#d9a441', drops: [['potion', 1]] }
};

// Variantes dos inimigos básicos (mesmo comportamento, nome, cor e elemento novos). look: qual modelo usar.
const mob = (base, name, tint, element, o = {}) => ({ ...ENEMIES[base], look: base, name, color: tint, tint, element, ...o });
Object.assign(ENEMIES, {
  gelinho: mob('gotalim', 'Gotalim Gélido', '#aee6ff', 'water'),
  lobogelo: mob('lobo', 'Lobo Glacial', '#cfeeff', 'water', { hp: 52 }),
  espectro: mob('fungo', 'Espectro Gélido', '#9fd8ff', 'crystal'),
  cristalino: mob('fungo', 'Cristalino', '#c08aff', 'crystal', { hp: 34 }),
  morcego: mob('lobo', 'Morcego de Cristal', '#8a7aff', 'shadow', { hp: 40, speed: 72 }),
  escorpiao: mob('lobo', 'Escorpião', '#e0b050', 'nature', { hp: 50, attack: 13 }),
  cacto: mob('fungo', 'Cacto Atirador', '#6ad060', 'nature'),
  areia: mob('gotalim', 'Gosma de Areia', '#e8d08a', 'nature'),
  magmin: mob('gotalim', 'Magmin', '#ff6a2a', 'fire'),
  brasa: mob('fungo', 'Brasa Viva', '#ff8a3a', 'fire'),
  lobofogo: mob('lobo', 'Lobo de Fogo', '#ff5a2a', 'fire'),
  lodo: mob('gotalim', 'Lodo Tóxico', '#7a9a3a', 'nature'),
  sapo: mob('fungo', 'Sapo Venenoso', '#8ad04a', 'nature'),
  sombra: mob('lobo', 'Sombra', '#4a3a6a', 'shadow', { hp: 55 }),
  fungocorr: mob('fungo', 'Fungo Corrompido', '#a040c0', 'shadow'),
  lobocorr: mob('lobo', 'Lobo Corrompido', '#8a2aa0', 'shadow'),
  soldado: mob('lobo', 'Soldado Sombrio', '#6a2a3a', 'shadow', { hp: 60, attack: 15 }),
  nuvem: mob('gotalim', 'Nuvem Viva', '#e8f4ff', 'crystal'),
  raio: mob('fungo', 'Espírito do Raio', '#ffe27a', 'crystal')
});
// Chefes: model escolhe o modelo 3D, tint a cor, scale o tamanho
const boss = (name, element, hp, attack, defense, xp, color, model, tint, scale, r = 15) => ({ name, element, ai: 'boss', hp, attack, defense, speed: 34, xp, coins: [xp / 8 | 0, xp / 8 | 0], r, color, model, tint, scale, drops: [['potion', 1], ['ether', 1]] });
Object.assign(ENEMIES, {
  lobogelo_boss: boss('Lobo das Geadas', 'water', 1200, 15, 8, 260, '#bfe8ff', 'wolf', '#cfeeff', 3.4, 17),
  golemcristal: boss('Golem de Cristal', 'crystal', 1500, 18, 14, 320, '#c08aff', 'golem', '#c08aff', 1, 15),
  dragaoboreal: boss('Dragão Boreal', 'water', 1900, 20, 12, 420, '#7fd6ff', 'dragon', '#9fe8ff', 1, 17),
  escorpiaorei: boss('Escorpião-Rei', 'nature', 2100, 22, 12, 480, '#e0b050', 'scorpion', '#e0b050', 1, 17),
  sentinela: boss('Sentinela Solar', 'crystal', 2400, 24, 16, 560, '#ffd37a', 'knight', '#f0c04a', 1.25, 16),
  drakmor: boss('Drakmor, o Dragão de Magma', 'fire', 2800, 26, 16, 700, '#ff6a2a', 'dragon', '#ff6a2a', 1.15, 18),
  hidra: boss('Hidra Venenosa', 'nature', 3000, 27, 14, 760, '#8ad04a', 'hydra', '#8ad04a', 1, 17),
  espinheiro2: boss('Guardião Espinheiro Corrompido', 'shadow', 3300, 28, 18, 820, '#c060ff', 'thorn', '#b050e0', 1.15, 16),
  varkhan: boss('General Varkhan', 'shadow', 3700, 31, 20, 950, '#ff5a5a', 'knight', '#7a2a3a', 1.2, 16),
  colosso: boss('Colosso Celestial', 'crystal', 4200, 33, 24, 1100, '#fff0a0', 'golem', '#fff0a0', 1.45, 20),
  guardiao_gelo: boss('Guardião do Gelo', 'water', 1800, 28, 15, 300, '#7fd6ff', 'golem', '#7fd6ff', 1, 15),
  guardiao_fogo: boss('Guardião do Fogo', 'fire', 1800, 28, 15, 300, '#ff8a3a', 'golem', '#ff6a2a', 1, 15),
  guardiao_terra: boss('Guardião da Terra', 'nature', 1800, 28, 15, 300, '#8fe05a', 'thorn', '#9a7a3a', 1, 15),
  guardiao_vento: boss('Guardião do Vento', 'crystal', 1800, 28, 15, 300, '#d8ffe8', 'knight', '#9affc8', 1, 14),
  guardiao_luz: boss('Guardião da Luz', 'crystal', 1800, 28, 15, 300, '#fff0a0', 'golem', '#fff0a0', 1, 15),
  noxar: boss('Noxar, o Devorador de Luz', 'shadow', 6000, 38, 22, 2000, '#c080ff', 'noxar', '#c080ff', 1, 20)
});
