import { PHASES } from './phases.js';
// Missões. Cada etapa tem um texto e uma condição verificada pelo QuestSystem
// Campanha: Fase 1 (O Despertar), Fase 2 (Floresta de Aurora), Fase 3 (As Ruínas Esquecidas)
export const QUESTS = {
  main: {
    name: 'A Lenda do Cristal',
    steps: [
      { id: 'talk_elder', text: 'Fale com o Ancião Thaleo na praça da vila.' },
      { id: 'prepare', text: 'Pegue a espada com o Bruno e colha 3 Frutas-Lume.' },
      { id: 'pit', text: 'Entre no Poço Gosmento, a noroeste da vila.' },
      { id: 'slime', text: 'Derrote o Slime Ancestral.' },
      { id: 'forest', text: 'Atravesse a ponte e entre na Floresta de Aurora.' },
      { id: 'laylla', text: 'Procure a ranger Laylla na floresta.' },
      { id: 'shards', text: 'Encontre 3 Fragmentos de Cristal na floresta.', need: 3 },
      { id: 'thorn', text: 'Entre no Santuário Espinhoso, ao norte da floresta.' },
      { id: 'thornboss', text: 'Derrote o Guardião Espinheiro.' },
      { id: 'ruins', text: 'Explore as Ruínas Esquecidas, a nordeste da floresta.' },
      { id: 'key', text: 'Encontre a Chave de Pedra e abra o portão.' },
      { id: 'runes', text: 'Acenda as 3 runas na ordem certa.' },
      { id: 'knight', text: 'Derrote o Cavaleiro de Pedra.' },
      ...PHASES.flatMap(f => [{ id: f.id, text: 'Fase ' + f.n + ': ' + f.quest }, { id: f.id + 'boss', text: f.questBoss }]),
      { id: 'done', text: 'A luz voltou a Elydran. Fim da lenda!' }
    ]
  },
  friend: {
    name: 'Amigo Perdido',
    steps: [
      { id: 'find', text: 'Mira ouviu um choro perto do lago leste da floresta.' },
      { id: 'free', text: 'Derrote os Gotalins que cercam a criatura.' },
      { id: 'done', text: 'Cristarta agora faz parte da sua equipe! (troque com Tab / LB)' }
    ]
  }
};
