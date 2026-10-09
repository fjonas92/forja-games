// Itens: consumíveis, equipamentos e itens de missão
export const ITEMS = {
  potion: { name: 'Poção de Vida', kind: 'consumable', desc: 'Recupera 45 de vida.', heal: 45, price: 12, icon: 'potion' },
  ether: { name: 'Éter Azul', kind: 'consumable', desc: 'Recupera 30 de energia.', mana: 30, price: 15, icon: 'ether' },
  berry: { name: 'Fruta-Lume', kind: 'consumable', desc: 'Cura 15 de vida de você e da sua criatura.', heal: 15, petHeal: 25, price: 6, icon: 'berry' },
  sword_iron: { name: 'Espada de Ferro', kind: 'weapon', desc: 'Espada simples, mas confiável. Ataque +4.', attack: 4, icon: 'sword' },
  sword_crystal: { name: 'Lâmina Cristalina', kind: 'weapon', desc: 'Forjada com cristal de Aurora. Ataque +11.', attack: 11, icon: 'sword2' },
  shard: { name: 'Fragmento de Cristal', kind: 'quest', desc: 'Pulsa com uma luz azul. O Ancião precisa de três.', icon: 'shard' }
};
