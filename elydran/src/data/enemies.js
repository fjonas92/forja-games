// Inimigos e chefe. ai: tipo de comportamento em entities/enemy.js
export const ENEMIES = {
  gotalim: { name: 'Gotalim', element: 'water', ai: 'hop', hp: 22, attack: 7, defense: 2, speed: 46, xp: 7, coins: [1, 3], r: 6, color: '#3aa0ff', drops: [['potion', 0.12]] },
  fungo: { name: 'Fungo', element: 'nature', ai: 'spitter', hp: 30, attack: 8, defense: 3, speed: 30, xp: 10, coins: [2, 4], r: 6, color: '#d8463a', drops: [['potion', 0.15], ['ether', 0.1]] },
  lobo: { name: 'Lobo Sombrio', element: 'shadow', ai: 'dasher', hp: 46, attack: 12, defense: 5, speed: 64, xp: 18, coins: [3, 7], r: 7, color: '#5b4a8a', drops: [['potion', 0.2], ['ether', 0.12]] },
  golem: { name: 'Golem Guardião', element: 'crystal', ai: 'boss', hp: 980, attack: 17, defense: 12, speed: 34, xp: 160, coins: [60, 60], r: 15, color: '#7fd6ff', drops: [] }
};
