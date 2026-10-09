// Falas dos personagens. Cada função recebe o estado do jogo e devolve a lista de falas
// Uma fala ['*', 'nome'] não aparece: ela dispara uma ação em scenes/game.js (action)
const at = (g, id) => g.quests.atLeast('main', id);

export const DIALOGUES = {
  elder: g => {
    const s = g.quests.step('main');
    if (s === 'talk_elder') return [
      ['Ancião Thaleo', 'Kael! Que bom que você acordou. Ontem à noite choveu cristal do céu, e desde então tudo ficou estranho.'],
      ['Ancião Thaleo', 'Algo despertou no Poço Gosmento, ao noroeste da vila. Uma gosma imensa já tomou a ponte para a floresta.'],
      ['Ancião Thaleo', 'Antes de descer, se prepare. Pegue uma espada com o Bruno e colha 3 Frutas-Lume nos arbustos.'],
      ['Ancião Thaleo', 'Brasek vai com você. Tome estas poções. E lembre: os cristais de luz salvam a sua jornada.'],
      ['*', 'talk_elder']
    ];
    if (s === 'prepare') return [['Ancião Thaleo', `Espada com o Bruno e 3 Frutas-Lume (você tem ${g.inv.count('berry')}). Depois desça ao Poço Gosmento.`]];
    if (s === 'pit' || s === 'slime') return [['Ancião Thaleo', 'O Poço Gosmento fica ao noroeste, depois da casa da Lina. Aquela gosma é o Slime Ancestral. Cuidado com os pulos dele.']];
    if (s === 'forest') return [['Ancião Thaleo', 'Você acabou com o Slime Ancestral! A ponte está livre. Siga para a Floresta de Aurora, a leste.']];
    if (at(g, 'forest') && !g.quests.done('main')) return [['Ancião Thaleo', 'A floresta é perigosa, mas Aurora conta com você. Descanse nos cristais quando precisar.']];
    return [['Ancião Thaleo', 'Os Cristais Elementais... então a lenda era verdade. Vá com cuidado, Kael. Esta é só a primeira das lendas.']];
  },
  merchant: () => [['Lina, a Mercadora', 'Olá, aventureiro! Quer dar uma olhada nas minhas poções?'], ['*', 'shop']],
  smith: g => {
    if (g.inv.count('sword_iron') || g.player.weapon !== 'none') return [['Bruno, o Ferreiro', 'Dizem que na floresta existe uma lâmina feita de cristal puro... Boa sorte!']];
    return [['Bruno, o Ferreiro', 'Descer ao poço de mãos vazias? Nem pensar. Leve esta espada!'], ['*', 'give_sword']];
  },
  kid: g => {
    const f = g.quests.step('friend');
    if (f === 'find' || !g.quests.started('friend')) return [['Mira', 'Ontem eu ouvi um choro perto do lago leste da floresta... parecia uma criaturinha presa!'], ['*', 'start_friend']];
    if (f === 'done') return [['Mira', 'Você salvou a Cristarta! Ela tem cara de quem adora um abraço.']];
    return [['Mira', 'A criaturinha está perto do lago leste. Cuidado com os Gotalins!']];
  },
  guard: g => g.flags.slimeDown
    ? [['Guarda Oren', 'A ponte está livre graças a você! A floresta fica a leste. Use Shift (ou B no controle) para esquivar dos ataques.']]
    : [['Guarda Oren', 'A gosma bloqueou a ponte! Dizem que vem do Poço Gosmento. Use Shift (ou B no controle) para esquivar dos golpes quando for lá.']],
  goo: () => [['Gosma', 'Uma parede de gosma verde bloqueia a ponte. Nem a espada corta. A fonte dela deve estar no Poço Gosmento.']],
  laylla: g => {
    const s = g.quests.step('main');
    if (g.map.phase) return [['Laylla', g.flags[g.map.gateFlag] ? (g.flags[g.map.phase.id + 'Down'] ? 'Conseguimos! O portal está aberto, Kael. Vamos em frente.' : 'O portão abriu. O chefe espera lá na frente: use poções antes de entrar.') : g.map.phase.tip]];
    if (g.map.id === 'ruins') {
      if (g.flags.knightDown) return [['Laylla', 'Conseguimos! Aquela tábua fala de cinco cristais, Kael. Isso é maior do que a gente imaginava.']];
      if (s === 'key') return [['Laylla', 'Cuidado com os espinhos no chão do salão: eles sobem em ritmo, dá pra passar entre eles. A chave deve estar na ala oeste.']];
      if (s === 'runes') return [['Laylla', 'A ala leste tem três runas e uma tábua. Leia a tábua antes de tocar em qualquer coisa.']];
      return [['Laylla', 'O Cavaleiro dorme no salão ao norte. Segura firme, ele bate forte e vem em sequência. Eu fico de olho aqui.']];
    }
    if (s === 'forest' || s === 'laylla') return [
      ['Laylla', 'Ei! Você é o Kael, né? Eu sou a Laylla, ranger da Floresta de Aurora. Vi a chuva de cristal também.'],
      ['Laylla', 'Os espinhos tomaram o Santuário, ao norte. O Guardião Espinheiro acordou e a barreira só quebra com 3 Fragmentos de Cristal.'],
      ['Laylla', 'Procure em baús, nas ruínas e nos monstros mais fortes. O Lobo Alfa carrega um. Eu vou abrindo caminho por aqui.'],
      ['*', 'laylla_meet']
    ];
    if (s === 'shards') return [['Laylla', `Você tem ${g.inv.count('shard')} de 3 fragmentos. Tem baú no lago sul e outro nas ruínas a nordeste. Fique de olho no Lobo Alfa!`]];
    if (s === 'thorn' || s === 'thornboss') return [['Laylla', 'A barreira abriu! O Santuário Espinhoso fica no extremo norte. O Guardião é lento, mas as raízes pegam de surpresa.']];
    if (s === 'ruins') return [['Laylla', 'Olha! A escadaria das Ruínas Esquecidas apareceu a nordeste, onde ficam os pilares. Eu vou na frente e te encontro lá.']];
    return [['Laylla', 'Boa sorte nas ruínas, Kael. Eu te alcanço.']];
  },
  seal: g => {
    if (at(g, 'thorn')) return [['*', 'enter_sanctuary']];
    return [['Selo de Espinhos', 'Uma barreira de espinhos bloqueia a entrada. Ela parece reagir aos Fragmentos de Cristal...']];
  },
  trapped: () => [['Cristarta', '...!! (A criaturinha treme. Derrote os Gotalins em volta dela!)']],
  gate_a: () => [['Portão de Pedra', 'Um portão de pedra com uma fechadura em forma de chave. Fechado.']],
  gate_b: () => [['Portão de Runas', 'O portão está selado por três runas. A resposta deve estar em alguma tábua.']],
  tablet_runes: () => [
    ['Tábua antiga', 'Primeiro a luz do mar, depois a chama que consome, por fim a folha que renasce.'],
    ['Tábua antiga', 'Quem errar a ordem verá as runas se apagarem.']
  ],
  tablet_clue: () => [
    ['Tábua antiga', 'Cinco cristais sustentam Elydran: Gelo, Fogo e três outros que dormem em terras distantes.'],
    ['Tábua antiga', 'O primeiro desperta ao norte, nas montanhas de gelo. Quem o encontrar deve se preparar para o frio.']
  ]
};
