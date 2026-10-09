// Missões. Cada etapa tem um texto e uma condição verificada pelo QuestSystem
export const QUESTS = {
  main: {
    name: 'O Cristal Apagado',
    steps: [
      { id: 'talk_elder', text: 'Fale com o Ancião Thaleo na praça da vila.' },
      { id: 'shards', text: 'Encontre 3 Fragmentos de Cristal na Floresta de Aurora.', need: 3 },
      { id: 'return_elder', text: 'Leve os fragmentos ao Ancião Thaleo.' },
      { id: 'sanctuary', text: 'Entre no Santuário do Cristal, ao norte da floresta.' },
      { id: 'boss', text: 'Derrote o Golem Guardião.' },
      { id: 'done', text: 'O Cristal de Aurora voltou a brilhar!' }
    ]
  },
  friend: {
    name: 'Amigo Perdido',
    steps: [
      { id: 'find', text: 'Mira ouviu um choro perto do lago leste da floresta.' },
      { id: 'free', text: 'Derrote os Gotalins que cercam a criatura.' },
      { id: 'done', text: 'Cristarta agora faz parte da sua equipe! (troque com ' + 'Tab / LB)' }
    ]
  }
};
