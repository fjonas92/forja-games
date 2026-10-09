// Falas dos personagens. Cada função recebe o estado do jogo e devolve a lista de falas
export const DIALOGUES = {
  elder: g => {
    const s = g.quests.step('main');
    if (s === 'talk_elder') return [
      ['Ancião Thaleo', 'Kael! Que bom que você acordou. O Cristal de Aurora se apagou esta noite.'],
      ['Ancião Thaleo', 'Sem ele, as criaturas da floresta estão ficando agressivas e o selo do Santuário enfraquece.'],
      ['Ancião Thaleo', 'Vá até a Floresta de Aurora, a leste, e traga 3 Fragmentos de Cristal. Brasek irá com você.'],
      ['Ancião Thaleo', 'Tome esta poção. E lembre: toque nos cristais de luz para salvar sua jornada.'],
      ['*', 'talk_elder']
    ];
    if (s === 'shards') return [['Ancião Thaleo', `Você tem ${g.inv.count('shard')} de 3 fragmentos. Procure em baús, ruínas e com os monstros mais fortes.`]];
    if (s === 'return_elder') return [
      ['Ancião Thaleo', 'Os três fragmentos! Sinto o poder deles daqui.'],
      ['Ancião Thaleo', 'Com eles, o selo do Santuário vai se abrir. Fica no extremo norte da floresta.'],
      ['Ancião Thaleo', 'Lá dorme o Golem Guardião. Se ele acordou corrompido, só você pode detê-lo. Boa sorte.'],
      ['*', 'return_elder']
    ];
    if (s === 'done') return [['Ancião Thaleo', 'Aurora está salva graças a você e aos seus companheiros. Esta é só a primeira das lendas do cristal...']];
    return [['Ancião Thaleo', 'O Santuário fica no extremo norte da floresta. Fique forte antes de entrar.']];
  },
  merchant: () => [['Lina, a Mercadora', 'Olá, aventureiro! Quer dar uma olhada nas minhas poções?'], ['*', 'shop']],
  smith: g => {
    if (g.inv.count('sword_iron') || g.player.weapon !== 'none') return [['Bruno, o Ferreiro', 'Dizem que nas ruínas da floresta existe uma lâmina feita de cristal puro...']];
    return [['Bruno, o Ferreiro', 'Ir pra floresta de mãos vazias? Nem pensar. Leve esta espada!'], ['*', 'give_sword']];
  },
  kid: g => {
    const f = g.quests.step('friend');
    if (f === 'find' || !g.quests.started('friend')) return [['Mira', 'Ontem eu ouvi um choro perto do lago leste da floresta... parecia uma criaturinha presa!'], ['*', 'start_friend']];
    if (f === 'done') return [['Mira', 'Você salvou a Cristarta! Ela tem cara de quem adora um abraço.']];
    return [['Mira', 'A criaturinha está perto do lago leste. Cuidado com os Gotalins!']];
  },
  guard: () => [['Guarda Oren', 'A floresta fica a leste, pela ponte. Use Shift (ou B no controle) para esquivar dos ataques.']],
  seal: g => {
    if (g.quests.step('main') === 'sanctuary' || g.quests.step('main') === 'boss') return [['*', 'enter_sanctuary']];
    return [['Selo Antigo', 'Uma barreira de luz bloqueia a entrada. Parece reagir aos Fragmentos de Cristal...']];
  },
  trapped: () => [['Cristarta', '...!! (A criaturinha treme. Derrote os Gotalins à volta dela!)']]
};
