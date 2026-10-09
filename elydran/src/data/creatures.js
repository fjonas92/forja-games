// Criaturas companheiras. Para adicionar uma nova: cadastrar aqui, desenhar em gfx/sprites.js e (se quiser) criar a habilidade em systems/combat.js
export const ELEMENTS = {
  fire: { name: 'Fogo', color: '#ff7a2a', strong: 'nature', weak: 'water' },
  water: { name: 'Água', color: '#4dc3ff', strong: 'fire', weak: 'nature' },
  nature: { name: 'Natureza', color: '#7ad94a', strong: 'water', weak: 'fire' },
  shadow: { name: 'Sombra', color: '#a77bff', strong: 'nature', weak: 'crystal' },
  crystal: { name: 'Cristal', color: '#9fe8ff', strong: 'shadow', weak: 'fire' }
};

export const CREATURES = {
  brasek: {
    id: 'brasek', name: 'Brasek', element: 'fire', rarity: 'comum', look: 'fox', size: 1,
    desc: 'Raposinha de brasa. Leal e curiosa, solta faíscas quando está feliz.',
    baseStats: { hp: 42, attack: 12, defense: 7, speed: 10 },
    evolution: { target: 'ignifox', requiredLevel: 5 },
    skill: { id: 'ember', name: 'Faísca', cooldown: 1.5, power: 1.0, speed: 190, range: 120 }
  },
  ignifox: {
    id: 'ignifox', name: 'Ignifox', element: 'fire', rarity: 'rara', look: 'fox', size: 1.35,
    desc: 'Forma evoluída de Brasek. A cauda vira uma chama viva de três pontas.',
    baseStats: { hp: 70, attack: 20, defense: 11, speed: 13 },
    evolution: null,
    skill: { id: 'ember', name: 'Rajada de Brasas', cooldown: 1.1, power: 1.0, speed: 220, range: 140, burst: 3 }
  },
  cristarta: {
    id: 'cristarta', name: 'Cristarta', element: 'water', rarity: 'incomum', look: 'turtle', size: 1,
    desc: 'Tartaruga de casco cristalino. Devagar, mas protege quem ama com bolhas de água.',
    baseStats: { hp: 60, attack: 9, defense: 14, speed: 7 },
    evolution: { target: 'abyssalis', requiredLevel: 6 },
    skill: { id: 'bubble', name: 'Bolha Curativa', cooldown: 2.4, power: 0.8, speed: 140, range: 110, heal: 6 }
  },
  abyssalis: {
    id: 'abyssalis', name: 'Abyssalis', element: 'water', rarity: 'rara', look: 'turtle', size: 1.35,
    desc: 'O casco de cristal brilha como o fundo do mar. Suas bolhas curam e derrubam inimigos.',
    baseStats: { hp: 95, attack: 15, defense: 20, speed: 9 },
    evolution: null,
    skill: { id: 'bubble', name: 'Maré de Cristal', cooldown: 1.9, power: 1.0, speed: 160, range: 130, heal: 10 }
  }
};

// XP necessária para o próximo nível (jogador e criaturas usam a mesma curva)
export const xpToNext = lvl => Math.round(20 + lvl * lvl * 8);
