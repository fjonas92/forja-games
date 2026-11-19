# -*- coding: utf-8 -*-
# Atualiza content.py com a versão atual do site (20 jogos) e adiciona guias.
from content import GAMES as G0, GUIAS as GU0

G = {g["slug"]: g for g in G0}

def jogo(slug, nome, genero, lead, sobre, como, dicas, recursos, faq, guias):
    return dict(slug=slug, nome=nome, genero=genero, lead=lead, sobre=sobre, como=como, dicas=dicas, recursos=recursos, faq=faq, guias=guias)

# ---- atualizações dos jogos que mudaram ----
G["tampinhas"].update(
  lead="Futebol de botão em 3D com 550 clubes e seleções, Copa do Mundo de 48, Champions League, Libertadores, campeonatos e 18 bolas.",
  sobre=["Tampinhas é um jogo de futebol de botão em 3D para jogar no navegador. Em vez de teclas, você usa o dedo ou o mouse: puxa o botão para trás como um estilingue e solta para chutar.",
         "Dá para jogar um amistoso contra o computador ou com um amigo no mesmo aparelho, e também Copa do Mundo no formato de 2026 (48 seleções), Libertadores, Champions League no formato atual, Copa rápida e campeonatos de pontos corridos, com 28 ligas e mais de 500 clubes.",
         "Com uma conta, você pode criar uma sala online, mandar o código para um amigo e disputar o ranking da semana, do mês, da temporada e geral. Em Meus times você cria o seu próprio time de tampinha."],
  como=["Toque em um botão do seu time.",
        "Puxe para trás, como um estilingue. Quanto mais você puxar, mais forte é o chute.",
        "Olhe a seta: ela mostra para onde o chute vai.",
        "Solte para chutar. Depois que tudo para de se mexer, a vez passa para o outro time.",
        "Você tem 15 segundos por jogada. Vence quem fizer mais gols antes do tempo acabar, ou quem fizer 2, 3 ou 5 gols primeiro, se você escolher a partida por gols."],
  dicas=["No celular, deixe na horizontal e use o botão de tela cheia.",
         "Não puxe sempre com força máxima. Chutes mais leves dão mais controle.",
         "Use a seta de direção para acertar o ângulo antes de soltar.",
         "Gol direto na saída de bola não vale: é falta e a posse vai para o adversário.",
         "O replay em câmera lenta depois de cada gol pode ser desligado nas Configurações."],
  recursos=["Amistoso contra o computador ou em 2 no mesmo aparelho","Copa do Mundo de 48 seleções, Libertadores e Champions League","Campeonatos de pontos corridos com 28 ligas","Salas online com código e ranking","18 bolas para escolher","Replay em câmera lenta","Meus times: crie o seu time de tampinha"],
  faq=[("Como chuto mais forte?","Puxe o botão mais para trás antes de soltar. Quanto maior o puxão, mais forte o chute."),
       ("O que acontece no empate do mata-mata?","Vai para a prorrogação. Se continuar empatado, vale o gol de ouro: quem marcar primeiro vence."),
       ("Dá para jogar com um amigo?","Sim. No mesmo aparelho, pelo Amistoso, ou online, criando uma sala e mandando o código."),
       ("Preciso de conta?","Não para jogar. Com uma conta, seus times e o ranking online ficam salvos.")])
G["mestre-do-taco"].update(
  sobre=["Mestre do Taco é um jogo de sinuca para o navegador. Você mira, puxa a barra de força e tenta encaçapar as bolas, em dois estilos: Bola 8 e Sinuca Brasileira.",
         "Dá para jogar contra o computador, em dupla no mesmo aparelho, online com um amigo ou no treino livre, só com a mesa. A mesa pode ser vista em 3D, com câmeras de TV, atrás da bola e de cima, ou no visual 2D, mais leve para aparelhos simples.",
         "Com uma conta, suas vitórias e a partida em andamento ficam salvas."],
  recursos=["Bola 8 e Sinuca Brasileira","Contra o computador (5 níveis), em dupla ou online com código de sala","Treino livre","Câmeras 3D e visual 2D","Linhas de trajetória","Partida salva na conta"])
G["mente-em-jogo"].update(
  sobre=["Mente em Jogo é o quiz do Falzinho Games. São mais de 400 perguntas em 18 categorias e 5 níveis de dificuldade, para testar o quanto você sabe de verdade.",
         "O jogo tem cinco modos: Milionário, Relâmpago, Sobrevivência, Desafio Diário e Duelo. Com uma conta, suas respostas certas da semana entram no ranking."],
  recursos=["Mais de 400 perguntas, 18 categorias, 5 níveis","Milionário com 20 ou 30 perguntas","Relâmpago de 60 segundos","Sobrevivência com 3 vidas","Desafio Diário com 10 perguntas para todos","Duelo para 2 jogadores no mesmo aparelho","Ranking semanal"])

# ---- jogos novos (info pages) ----
G["xadrez"] = jogo("xadrez","Xadrez 3D","Xadrez · Estratégia",
  "Tabuleiro em 3D que gira na sua mão: jogue contra o computador em 3 níveis ou com um amigo no mesmo aparelho.",
  ["Xadrez 3D é um tabuleiro de xadrez em três dimensões para o navegador. Você pode girar a câmera, aproximar a visão e jogar contra o computador ou contra um amigo no mesmo aparelho.",
   "O jogo segue as regras completas do xadrez, incluindo roque, en passant, promoção, xeque-mate, afogamento, repetição de posição e material insuficiente. No fim da partida você pode copiar ou baixar o PGN para analisar em outros programas de xadrez."],
  ["Toque ou clique em uma peça sua. Pontos verdes mostram as casas para onde ela pode ir, e anéis mostram capturas.","Toque na casa de destino para mover.","Arraste o tabuleiro para girar a câmera.","Use a roda do mouse, ou dois dedos no celular, para aproximar.","Escolha o nível do computador ou chame um amigo para jogar no mesmo aparelho."],
  ["Comece no Fácil para pegar o ritmo e suba de nível aos poucos.","Use os pontos verdes e os anéis para conferir as jogadas antes de mover.","Gire a câmera para ver o tabuleiro pelo lado do adversário e notar ameaças.","Copie o PGN das suas partidas para estudar os erros."],
  ["Regras completas do xadrez","Computador em 3 níveis: o Fácil erra de propósito, o Médio pensa dois lances à frente e o Difícil calcula mais fundo","Dois jogadores no mesmo aparelho, com câmera que gira para o lado de quem joga","PGN para copiar ou baixar","Vitórias, derrotas e empates salvos no navegador"],
  [("O jogo tem todas as regras?","Sim: roque, en passant, promoção, xeque-mate, afogamento, repetição e material insuficiente."),("Dá para jogar com um amigo?","Sim, no mesmo aparelho. A câmera gira sozinha para o lado de quem joga, e dá para desligar isso."),("O computador é difícil?","São três níveis. O Fácil erra de propósito e o Difícil calcula mais fundo que o Médio."),("Meus resultados ficam salvos?","As vitórias, derrotas e empates contra o computador ficam salvos neste navegador.")],
  ["xadrez-regras-especiais","jogar-no-celular"])
G["elydran"] = jogo("elydran","ELYDRAN: Lendas do Cristal","RPG de ação · Lendas do Cristal",
  "Explore a vila e a floresta, lute em tempo real, evolua suas criaturas companheiras e enfrente os guardiões. Teclado, controle ou toque.",
  ["ELYDRAN: Lendas do Cristal é um RPG de ação em 3D que roda no navegador. Uma chuva de cristais acordou criaturas antigas, e você joga como Kael, ao lado da raposinha de brasa Brasek e da ranger Laylla.",
   "A aventura passa pela Vila Aurora, pela Floresta de Aurora e pelas Ruínas Esquecidas, com chefes como o Slime Ancestral, o Guardião Espinheiro e o Cavaleiro de Pedra, até a primeira pista dos Cristais Elementais.",
   "O combate é em tempo real, com espada, esquiva e o Pulso de Cristal. Suas criaturas lutam ao seu lado, sobem de nível e evoluem. O jogo é uma demo na versão 0.1 e recebe novidades."],
  ["Mova o personagem com WASD ou as setas.","Ataque com Espaço e esquive com Shift.","Converse e interaja com E.","Use o Pulso de Cristal com Q.","Troque de criatura com Tab, abra o inventário com I e o mapa com M.","Salve o jogo nos cristais de luz, ou deixe o salvamento automático ao trocar de região."],
  ["Use a esquiva para fugir dos golpes dos chefes antes de atacar.","Guarde o Pulso de Cristal para quando o inimigo estiver perto de você.","Evolua suas criaturas companheiras, porque elas lutam ao seu lado.","Se o aparelho ficar lento, o botão 3D volta para o modo 2D clássico."],
  ["Combate em tempo real com espada, esquiva e Pulso de Cristal","Criaturas companheiras que sobem de nível e evoluem","Vila Aurora, Floresta de Aurora e Ruínas Esquecidas","Teclado, controle de videogame ou toque no celular","Salvamento nos cristais de luz e ao trocar de região"],
  [("Posso jogar no celular?","Sim. Aparecem um analógico e botões na tela, e funciona melhor com o aparelho na horizontal e em tela cheia."),("Dá para jogar com controle?","Sim. Conecte um controle e aperte qualquer botão para ele ser detectado."),("O jogo está completo?","É uma demo na versão 0.1 e recebe novidades."),("Meu progresso é salvo?","Sim, nos cristais de luz e automaticamente ao trocar de região.")],
  ["elydran-controles-e-dicas","jogar-no-celular"])
G["apex"] = jogo("apex","APEX","Corrida 3D · Campeonato",
  "Crie seu piloto, escolha a equipe, evolua o carro e dispute 14 circuitos em 3D contra 15 rivais. Teclado, joystick ou toque no celular.",
  ["APEX é um campeonato de corrida em 3D que roda direto no navegador. Você cria o seu piloto, escolhe uma das 8 equipes (ou monta a sua) e disputa uma temporada com 14 circuitos inéditos contra mais 15 carros.",
   "Entre uma corrida e outra você ganha créditos e evolui motor, aerodinâmica, freios e pneus, além de personalizar pintura, patrocinadores e asas. Equipes, pilotos e pistas são todos fictícios."],
  ["Escolha o seu piloto e a equipe.","Acelere com a seta para cima ou W e vire com as setas ou A e D.","No celular, use os botões na tela ou incline o aparelho.","Conecte um joystick, se tiver, e aperte qualquer botão para ele ser detectado.","Termine a corrida, ganhe créditos e invista no carro."],
  ["Use a aspiração, ficando atrás de um carro, para ultrapassar nas retas.","Freie antes das curvas em vez de durante.","Invista créditos em freios e pneus, e não só em motor.","Gire o celular para a horizontal e use a tela cheia."],
  ["8 equipes ou a sua própria","14 circuitos e 15 rivais","Evolução de motor, aerodinâmica, freios e pneus","Personalização de pintura, patrocinadores e asas","Teclado, joystick ou toque","Carreira salva na conta"],
  [("As equipes e pistas são reais?","Não. Equipes, pilotos e pistas são todos fictícios."),("Dá para jogar no celular?","Sim, com botões na tela ou inclinando o aparelho, de preferência na horizontal."),("O que é aspiração?","É ficar logo atrás de outro carro para ganhar velocidade e ultrapassar nas retas."),("Meu progresso fica salvo?","Sim, com uma conta, a sua carreira fica salva.")],
  ["apex-dicas-de-pilotagem","jogar-no-celular"])
G["moto"] = jogo("moto","TURBO MOTO","Corrida de moto 3D · Campeonato",
  "Escolha seu piloto e a equipe, evolua a moto, enfrente a chuva e dispute 14 circuitos em 3D contra 15 rivais.",
  ["TURBO MOTO é um campeonato de corrida de moto em 3D no navegador. Você cria o piloto, escolhe uma das 8 equipes (ou monta a sua) e disputa uma temporada com 14 circuitos inéditos contra mais 15 motos, inclusive com pista molhada.",
   "As corridas rendem créditos para evoluir motor, aerodinâmica, freios e pneus e para personalizar pintura, patrocinadores e carenagem. Equipes, pilotos e pistas são fictícios. Com uma conta, a carreira fica salva."],
  ["Escolha o piloto e a equipe.","Acelere com a seta para cima ou W e incline com as setas ou A e D.","No celular, use os botões na tela.","Aproveite o turbo quando ele estiver disponível e freie antes das curvas.","Ganhe créditos e evolua a moto."],
  ["Use a aspiração, ficando atrás de outra moto, para ultrapassar nas retas.","Com chuva, freie mais cedo.","Equilibre os upgrades entre motor e freios.","Jogue na horizontal e em tela cheia no celular."],
  ["8 equipes ou a sua própria","14 circuitos e 15 rivais","Chuva","Evolução da moto e personalização","Teclado, joystick ou toque","Carreira salva na conta"],
  [("É parecido com o APEX?","Tem a mesma estrutura de campeonato, mas com motos."),("As equipes são reais?","Não, tudo é fictício."),("Funciona no celular?","Sim, com botões na tela."),("Preciso de conta?","Para guardar a carreira, sim.")],
  ["apex-dicas-de-pilotagem","jogar-no-celular"])
G["laylla"] = jogo("laylla","Laylla e os Cristais","Plataforma 3D · Aventura",
  "Ajude a Laylla a pular entre ilhas flutuantes, pisar nas gelinhas, achar estrelas escondidas e trazer os cristais de volta.",
  ["Laylla e os Cristais é um jogo de plataforma em 3D, colorido e iluminado. Os quatro Cristais Solares caíram nas ilhas flutuantes e a Laylla precisa pular de ilha em ilha, vencer as gelinhas e trazer a luz de volta ao céu.",
   "São quatro fases com plataformas móveis e gelinhas para pisar. Em cada fase há três estrelas grandes escondidas. Você começa com 3 vidas e o progresso fica salvo na conta."],
  ["Ande com WASD ou as setas.","Pule com Espaço. Aperte de novo no ar para o pulo duplo.","Dê o giro com Shift ou J.","Gire a câmera com Q e E.","No celular, encoste na metade esquerda para o joystick e use PULAR e GIRO na direita."],
  ["Pise nas gelinhas para derrotá-las.","Procure as três estrelas grandes de cada fase.","Use o pulo duplo para alcançar ilhas mais distantes.","Gire a câmera para ver o que está escondido atrás das plataformas."],
  ["Quatro fases em ilhas flutuantes","Pulo duplo e giro","Três estrelas grandes por fase","Teclado, controle ou toque","Progresso salvo na conta"],
  [("Dá para jogar no celular?","Sim, com joystick e botões na tela."),("Como derroto as gelinhas?","Pisando nelas."),("O jogo salva?","Com uma conta, o progresso fica salvo."),("Quantas fases são?","Quatro, e cada uma tem três estrelas grandes para achar.")],
  ["jogar-no-celular"])
G["corrida"] = jogo("corrida","Corrida dos Heróis","Corrida infinita 3D · Aventura",
  "Corra em 3D por 5 fases, desvie, pule e deslize, junte moedas e use o poder especial de cada herói.",
  ["Corrida dos Heróis é um jogo de corrida infinita em 3D no navegador. Você corre pela cidade, desvia de tudo, junta moedas e atravessa as fases com um dos quatro heróis.",
   "Cada herói tem um poder: pulo duplo e ímã de moedas (Laylla), raio em alta velocidade (Palito Trovão), corações-bomba (Super Bela) e cabeçada que arrebenta tudo (Super Cabeção). A cada 1.000 metros você entra numa fase nova, com cenário e velocidade diferentes."],
  ["Escolha o herói.","Troque de faixa com A e D ou as setas.","Pule com W, seta para cima ou Espaço, e deslize com S ou seta para baixo.","Use o poder com E ou Shift.","No celular, deslize o dedo para os lados, para cima (pular) e para baixo (deslizar)."],
  ["Escolha o herói pelo poder que combina com o seu estilo.","Junte moedas para aumentar os pontos do ranking.","Guarde o poder para trechos difíceis.","Olhe um pouco à frente em vez de olhar para o personagem."],
  ["Quatro heróis com poderes diferentes","5 fases, com mudança a cada 1.000 metros","Moedas e ranking","Teclado, controle ou toque"],
  [("Como ganho pontos?","Cada corrida rende pontos pela distância e pelas moedas."),("Preciso de conta?","Para entrar no ranking, sim."),("Quantas fases tem?","Cinco, trocando a cada 1.000 metros."),("Funciona no celular?","Sim, com gestos de deslizar.")],
  ["jogar-no-celular"])
G["blocos"] = jogo("blocos","Blocos Cristal 3D","Quebra-cabeça 3D · Combos",
  "Arraste peças de cristal para o tabuleiro, complete linhas e colunas para explodir tudo e encadeie combos.",
  ["Blocos Cristal 3D é um quebra-cabeça de blocos em 3D no navegador. O tabuleiro é 8x8 e você arrasta peças de cristal até ele, completando linhas e colunas inteiras para explodir os cristais.",
   "Quanto mais linhas você completa em sequência, maior o combo. O jogo acaba quando nenhuma peça couber. O recorde e a partida em andamento ficam salvos."],
  ["Toque em uma peça embaixo e arraste até o tabuleiro.","Solte para encaixar.","Complete linhas ou colunas inteiras para explodir.","Encadeie combos para pontuar mais.","Jogue de novo quando não couber mais nenhuma peça."],
  ["Deixe espaço livre para as peças grandes.","Planeje duas jogadas à frente para encadear combos.","Evite criar buracos isolados no tabuleiro.","Compare o seu recorde no ranking."],
  ["Tabuleiro 8x8","Combos","Recorde e ranking","Mouse ou toque","Partida salva"],
  [("Quando o jogo acaba?","Quando nenhuma peça cabe no tabuleiro."),("Funciona no celular?","Sim, com o toque."),("O recorde fica salvo?","Sim. Com uma conta, ele vai para o ranking geral."),("Qual o tamanho do tabuleiro?","O tabuleiro é 8x8.")],
  ["jogar-no-celular"])
G["fazenda3d"] = jogo("fazenda3d","Império da Fazenda 3D","Fazenda · Idle 3D",
  "Plante, colha, compre animais, contrate fazendeiros robôs e peça chuva. A fazenda continua rendendo enquanto você está fora.",
  ["Império da Fazenda 3D é um jogo de fazenda em 3D em que você toca para plantar e colher, desbloqueia sementes de trigo até a planta mágica, compra galinhas, vacas, ovelhas e porcos, e automatiza os canteiros com fazendeiros robôs.",
   "Você também pode pedir chuva para acelerar tudo. A fazenda continua rendendo enquanto você está fora, e o progresso fica salvo."],
  ["Toque em um canteiro vazio para plantar e em um canteiro pronto para colher.","Toque em uma planta crescendo para acelerar um pouquinho.","Use as abas da loja para comprar sementes, terrenos, animais, melhorias e bônus.","Contrate fazendeiros robôs para automatizar.","Volte depois para colher o que a fazenda rendeu."],
  ["Reinvista o dinheiro nas melhorias que aumentam a renda por segundo.","Automatize os canteiros o quanto antes.","Use a chuva quando tiver vários canteiros plantados.","Cada conquista nova rende pontos para o ranking."],
  ["Sementes de trigo até a planta mágica","Galinhas, vacas, ovelhas e porcos","Fazendeiros robôs","Chuva","Renda enquanto você está fora","Ranking geral"],
  [("A fazenda rende quando eu saio?","Sim, ela continua rendendo enquanto você está fora."),("Preciso de conta?","Para guardar na nuvem e entrar no ranking, sim."),("O que é a chuva?","Um bônus que acelera a fazenda."),("Funciona no celular?","Sim, com toque.")],
  ["fazenda-idle-dicas","jogar-no-celular"])
G["escritorio"] = jogo("escritorio","Meu Escritório 3D","Simulação 3D · Gerência",
  "Atenda visitantes, limpe a bagunça, apague incêndios, contrate funcionários e expanda o prédio alugando salas.",
  ["Meu Escritório 3D é um jogo de simulação em 3D: você começa com uma recepção pequena, atende visitantes, limpa o que eles deixam para trás e apaga incêndios.",
   "Com o dinheiro, contrata recepcionistas e faxineiros, abre novas salas de reunião e aluga salas para inquilinos. Cada visitante atendido rende dinheiro e estrelas, e as estrelas viram pontos no ranking."],
  ["Ande com WASD ou as setas, com o analógico no controle ou arrastando o dedo no celular.","Fique no círculo atrás do balcão para atender os visitantes.","Encoste no lixo para limpar.","Fique perto do fogo até apagar.","Fique em cima de uma plaquinha no chão para comprar: o dinheiro é pago aos poucos até completar."],
  ["Contrate ajudantes cedo para você não precisar fazer tudo.","Apague incêndios logo, para não atrapalhar os visitantes.","Expanda o prédio em etapas.","As estrelas ganhas viram pontos no ranking."],
  ["Recepção, limpeza e incêndios","Contratação de funcionários","Novas salas e aluguel para inquilinos","Teclado, controle ou toque","Progresso salvo"],
  [("Como ganho dinheiro?","Atendendo os visitantes na recepção."),("Para que servem as estrelas?","Elas viram pontos no ranking geral."),("Dá para jogar no celular?","Sim, arrastando o dedo na tela."),("O progresso é salvo?","Sim, com conta ele fica salvo na nuvem.")],
  ["jogar-no-celular"])
G["damas"] = jogo("damas","Damas 3D","Tabuleiro 3D · Estratégia",
  "Damas brasileiras em 3D, com captura obrigatória, dama voadora e computador em três níveis.",
  ["Damas 3D é um jogo de damas em 3D no navegador, com as regras brasileiras: captura obrigatória com lei da maioria, peças que capturam para trás e dama voadora.",
   "Você joga contra o computador em três níveis ou com um amigo no mesmo aparelho, no mouse ou no toque. A partida em andamento e as vitórias ficam salvas."],
  ["Toque em uma peça sua.","Toque na casa verde para onde quer ir.","Se houver captura, ela é obrigatória, e você deve capturar o maior número de peças possível.","Leve uma peça até a última fileira para virar dama.","A dama anda quantas casas quiser na diagonal."],
  ["Antes de mover, confira se o adversário terá uma captura obrigatória a seu favor.","Mantenha as peças das laterais, que são mais difíceis de capturar.","Planeje a promoção de uma dama.","Comece no nível fácil e suba aos poucos."],
  ["Regras brasileiras","Computador em três níveis ou amigo no mesmo aparelho","Mouse ou toque","Ranking","Partida salva"],
  [("A captura é obrigatória?","Sim, e vale a lei da maioria: você deve pegar o maior número possível de peças."),("As peças capturam para trás?","Sim, nas regras brasileiras."),("O que é a dama voadora?","A dama anda quantas casas quiser na diagonal."),("Os pontos do ranking?","Vitórias contra o computador rendem pontos, e mais nos níveis difíceis.")],
  ["damas-brasileiras-regras","jogar-no-celular"])
G["fazendinha"] = jogo("fazendinha","Minha Fazendinha","Fazenda · Relaxante",
  "Arar a terra, plantar, regar, colher e vender na loja. Cuide das galinhas e salve sua fazenda na nuvem.",
  ["Em Minha Fazendinha você cuida da própria roça: ara a terra com a enxada, planta trigo, milho, tomate e morango, rega todo dia e colhe quando estiver pronto.",
   "Venda tudo no balcão da loja, compre sementes melhores e cuide das galinhas, que botam ovos todo dia. Há dias de chuva e o ciclo do dia: dormir na casa passa o dia, e as plantas regadas crescem durante a noite."],
  ["Ande com as setas ou WASD.","Use a ferramenta com Espaço ou E. Troque de ferramenta com as teclas de 1 a 6, ou Q.","Pegue água na lagoa para encher o regador.","Chegue perto do balcão da loja para comprar e vender.","Chegue perto da porta da casa para dormir e passar o dia."],
  ["Regue todas as plantas antes de dormir, porque elas crescem durante a noite.","Venda a colheita e compre sementes melhores.","Cuide das galinhas todo dia para ter ovos.","Entre na conta para o jogo ficar salvo na nuvem."],
  ["Trigo, milho, tomate e morango","Loja para comprar e vender","Galinhas e ovos","Dias de chuva","Salvo neste aparelho e na nuvem"],
  [("Como passo o dia?","Chegando perto da porta da casa para dormir."),("Onde encho o regador?","Na lagoa."),("O jogo salva?","Salva neste aparelho. Entrando na conta, também na nuvem."),("Funciona no celular?","Sim, com joystick e botão AGIR na tela.")],
  ["fazenda-idle-dicas","jogar-no-celular"])
G["pebolim"] = jogo("pebolim","Pebolim","Mesa · Esportes",
  "Controle as barras, defenda e faça gols contra a IA em 3 dificuldades. Os pontos entram no ranking geral.",
  ["Pebolim é um jogo de pebolim para o navegador. Você controla as barras do seu time azul, defende o gol e tenta marcar contra a IA em três dificuldades: Fácil, Normal e Difícil.",
   "O primeiro a fazer 5 gols vence. Os pontos de cada partida entram no ranking geral de jogadores."],
  ["Mova a barra com as setas para cima e para baixo, ou W e S.","Chute com Espaço.","Troque de barra com as setas para os lados, ou A e D.","No celular, arraste o dedo na mesa para mover a barra e toque em CHUTAR.","No modo Auto, a barra mais perto da bola é escolhida sozinha."],
  ["Use o modo Auto no começo e depois assuma o controle das barras.","Defenda primeiro, ataque depois.","Suba a dificuldade quando estiver ganhando fácil.","Entre na conta para os pontos irem para o ranking."],
  ["Três dificuldades","Primeiro a fazer 5 gols","Modo Auto","Ranking geral"],
  [("Como funcionam os pontos?","Cada gol seu vale 2 pontos. Vencer dá +10, com bônus de +2 no Normal e +5 no Difícil."),("Preciso de conta?","Para o ranking, sim. Sem conta você joga normalmente, mas os pontos não são registrados."),("Dá para jogar no celular?","Sim."),("Qual a dificuldade?","Fácil, Normal e Difícil.")],
  ["jogar-no-celular"])
G["cruzadas"] = jogo("cruzadas","Palavras Cruzadas","Palavras · Raciocínio",
  "Grade nova a cada partida, com dicas de letra, verificação de erros e o desafio do dia igual para todo mundo.",
  ["Palavras Cruzadas gera uma grade nova a cada partida, com dicas de letra e verificação de erros. Também há o desafio do dia, igual para todo mundo.",
   "As respostas não levam acento nem cedilha."],
  ["Toque em uma casa e digite.","Toque de novo na mesma casa para trocar entre horizontal e vertical.","Use as dicas de letra quando travar.","Use a verificação de erros para conferir.","Volte todo dia para o desafio do dia."],
  ["Comece pelas palavras que você tem certeza.","Use as letras cruzadas para descobrir as palavras difíceis.","Lembre que não se usa acento nem cedilha.","Use as dicas com moderação."],
  ["Grade nova a cada partida","Dicas de letra","Verificação de erros","Desafio do dia"],
  [("Preciso digitar acento?","Não. As respostas não levam acento nem cedilha."),("Como troco a direção?","Tocando de novo na mesma casa."),("O desafio do dia é igual para todos?","Sim."),("Funciona no celular?","Sim.")],
  ["jogar-no-celular"])
G["cartas"] = jogo("cartas","Cartas","Truco · Blackjack · Poker",
  "Truco, Blackjack e Poker Texas Hold'em contra a IA, com fichas virtuais e ranking geral.",
  ["Cartas reúne três clássicos: Truco (uma contra uma, até 12 pontos, com manilhas e pedidos de truco, seis, nove e doze), Blackjack e Poker Texas Hold'em contra a IA.",
   "Fichas e pontos são virtuais, sem dinheiro de verdade. Os pontos das vitórias alimentam o ranking geral: o Truco vale 15 pontos, o Poker 20, e cada mão ganha no Blackjack vale 2 (4 em blackjack natural)."],
  ["Escolha o jogo: Truco, Blackjack ou Poker.","No Truco, o baralho tem 40 cartas e a carta virada define a manilha.","Vence a mão quem ganhar duas das três rodadas.","No Blackjack, chegue o mais perto de 21 sem estourar.","No Poker, jogue Texas Hold'em contra a IA com fichas virtuais."],
  ["No Truco, guarde as cartas fortes para as rodadas decisivas.","Peça truco quando tiver manilha.","No Blackjack, o risco de estourar cresce rápido conforme a sua mão passa de 12.","As fichas são virtuais, então use para treinar."],
  ["Truco com truco, seis, nove e doze","Blackjack","Poker Texas Hold'em","Fichas virtuais","Ranking geral"],
  [("Tem dinheiro de verdade?","Não. Fichas e pontos são virtuais."),("Como definem a manilha no Truco?","A carta virada define a manilha: é a seguinte na ordem."),("Quem vence a mão no Truco?","Quem ganhar duas das três rodadas. Em empate de rodada, vale quem venceu a primeira."),("Preciso de conta?","Para os pontos irem para o ranking, sim.")],
  ["truco-regras-basicas","jogar-no-celular"])

GAMES_ORDER = ["atelon","novo-mundo","master-fut","tampinhas","mestre-do-taco","mente-em-jogo","xadrez","elydran","apex","moto","laylla","corrida","blocos","fazenda3d","escritorio","damas","fazendinha","pebolim","cruzadas","cartas"]
GAMES = [G[s] for s in GAMES_ORDER]

# ---- guias ----
Gd = {g["slug"]: g for g in GU0}
Gd["tampinhas-como-jogar"].update(desc="Aprenda a chutar, entenda a vez de jogar e conheça os modos de Tampinhas, o futebol de botão 3D do navegador.")
Gd["tampinhas-como-jogar"]["corpo"][2] = ("Os modos de jogo",["No Amistoso você enfrenta o computador ou um amigo no mesmo aparelho. A Copa do Mundo segue o formato de 2026, com 48 seleções, 12 grupos e 16 avos de final. A Libertadores tem 32 clubes e a Champions League usa o formato atual, com fase de liga de 36 clubes. Há também a Copa rápida, com 16 times.","Se o jogo empatar no mata-mata, vai para a prorrogação e, se continuar empatado, vale o gol de ouro, em que o primeiro a marcar vence. O Campeonato de pontos corridos tem 28 ligas e mais de 500 clubes, e nele o empate vale 1 ponto."])
Gd["tampinhas-como-jogar"]["corpo"][3] = ("Online e seu time",["Em Meus times você monta o seu próprio time de tampinha. Com uma conta, você cria uma sala online, manda o código para um amigo e as vitórias contam no ranking da semana, do mês, da temporada e geral."])
Gd["mente-em-jogo-modos"]["desc"] = "Conheça os modos Milionário, Relâmpago, Sobrevivência, Desafio Diário e Duelo do quiz Mente em Jogo."

def g(slug, jogo_, titulo, desc, corpo):
    Gd[slug] = dict(slug=slug, jogo=jogo_, titulo=titulo, desc=desc, corpo=corpo)

g("xadrez-regras-especiais","xadrez","Xadrez: roque, en passant, promoção e outras regras especiais","As regras especiais do xadrez que mais geram dúvidas, e como elas funcionam no Xadrez 3D.",
 [("Roque",["O roque é uma jogada em que o rei anda duas casas em direção a uma torre e a torre pula para o outro lado do rei. Só pode ser feito se o rei e a torre ainda não se moveram, se não há peças entre eles, e se o rei não está em xeque nem passa por casas atacadas."]),
  ("En passant",["Se um peão avança duas casas e para ao lado de um peão adversário, esse adversário pode capturá-lo como se ele tivesse andado só uma casa. Isso só vale na jogada logo em seguida."]),
  ("Promoção",["Quando um peão chega à última fileira, ele é promovido. No Xadrez 3D aparece uma janela para você escolher entre dama, torre, bispo ou cavalo."]),
  ("Como a partida termina",["Há xeque-mate, quando o rei está em xeque sem saída, e empate por afogamento, quando o jogador não tem jogada legal mas não está em xeque. O jogo também reconhece empate por repetição de posição e por material insuficiente."]),
  ("PGN",["Ao final da partida, você pode copiar ou baixar o PGN, um formato de texto que programas de xadrez entendem, para analisar os seus lances."])])
g("damas-brasileiras-regras","damas","Damas brasileiras: as regras que valem no Damas 3D","Captura obrigatória, lei da maioria e dama voadora: as regras principais das damas brasileiras.",
 [("Como mover",["No jogo, você toca em uma peça sua e depois na casa verde para onde quer ir. As peças andam na diagonal."]),
  ("Captura obrigatória",["Se houver uma captura possível, você é obrigado a fazê-la. Vale a lei da maioria: se houver mais de um caminho, você deve escolher o que captura o maior número de peças."]),
  ("Captura para trás",["Nas regras brasileiras, as peças comuns também podem capturar para trás."]),
  ("Dama",["A peça que chega à última fileira vira dama. A dama é voadora: anda quantas casas quiser na diagonal."]),
  ("Contra quem jogar",["Você pode jogar contra o computador em três níveis ou com um amigo no mesmo aparelho. Vitórias contra o computador rendem pontos para o ranking, e mais nos níveis difíceis."])])
g("truco-regras-basicas","cartas","Truco: regras básicas para jogar o Truco do Falzinho Games","Baralho, manilha, rodadas e os pedidos de truco, seis, nove e doze explicados de forma simples.",
 [("Baralho e força das cartas",["O Truco usa um baralho de 40 cartas. Fora as manilhas, a ordem de força vai do mais forte para o mais fraco: 3, 2, A, K, J, Q, 7, 6, 5 e 4."]),
  ("A manilha",["A carta virada define a manilha: é a carta seguinte na ordem. As manilhas são as mais fortes do jogo, e entre elas a ordem de naipes, do mais fraco ao mais forte, é ouros, espadas, copas e paus."]),
  ("Rodadas",["Cada mão tem até três rodadas. Vence a mão quem ganhar duas delas. Se uma rodada empatar, vale quem venceu a primeira."]),
  ("Truco, seis, nove e doze",["Durante a mão, você pode pedir truco para aumentar o valor da mão, e o adversário pode aceitar, correr ou aumentar. Os pedidos seguem a ordem truco, seis, nove e doze. O jogo vai até 12 pontos."]),
  ("Pontos no ranking",["No Falzinho Games, vencer uma partida de Truco vale 15 pontos no ranking geral. As fichas e os pontos são virtuais, sem dinheiro de verdade."])])
g("elydran-controles-e-dicas","elydran","ELYDRAN: controles e dicas para a primeira hora","Controles de teclado, controle e toque do ELYDRAN, e dicas para começar bem a aventura.",
 [("Controles no teclado",["Mova com WASD ou as setas. Ataque com Espaço, esquive com Shift, interaja e converse com E, use o Pulso de Cristal com Q e troque de criatura com Tab. O inventário abre com I, o mapa com M e a pausa com Esc. Gire a câmera com Z e C e use a roda do mouse para o zoom."]),
  ("No controle e no celular",["Com controle de videogame, conecte e aperte qualquer botão para ele ser detectado. No celular, aparecem um analógico e botões na tela, e o jogo funciona melhor na horizontal e em tela cheia."]),
  ("Combate",["O combate é em tempo real. Alterne entre ataque com espada e esquiva, e use o Pulso de Cristal como habilidade especial. Suas criaturas lutam ao seu lado, sobem de nível e evoluem."]),
  ("Salvar o progresso",["O jogo salva nos cristais de luz e automaticamente ao trocar de região."]),
  ("Se o jogo ficar lento",["Use o botão 3D no canto da tela para voltar ao modo 2D clássico."])])
g("apex-dicas-de-pilotagem","apex","APEX e TURBO MOTO: dicas de pilotagem","Aspiração, freada, upgrades e outras dicas para ganhar mais corridas no APEX e no TURBO MOTO.",
 [("Aprenda a usar a aspiração",["Ficar logo atrás de outro veículo diminui a resistência do ar e dá velocidade extra. Use isso nas retas para ultrapassar."]),
  ("Frear antes da curva",["O erro mais comum é frear tarde. Reduza a velocidade antes da curva e acelere na saída."]),
  ("Upgrades",["Entre as corridas você ganha créditos para melhorar motor, aerodinâmica, freios e pneus. Não coloque tudo no motor: freios e pneus ajudam nas curvas e nas freadas."]),
  ("Controles",["No teclado, acelere com a seta para cima ou W e vire com as setas ou A e D. No celular, use os botões na tela ou incline o aparelho. Joysticks de videogame também funcionam."]),
  ("No celular",["Deixe o aparelho na horizontal e use a tela cheia, para ver a pista inteira."])])
g("fazenda-idle-dicas","fazenda3d","Jogos de fazenda: dicas para o Império da Fazenda 3D e a Minha Fazendinha","Dicas para crescer mais rápido nos dois jogos de fazenda do Falzinho Games.",
 [("Império da Fazenda 3D: automatize cedo",["Contratar fazendeiros robôs libera você de plantar e colher manualmente. A fazenda continua rendendo mesmo quando você está fora."]),
  ("Reinvista",["Use o dinheiro nas melhorias que aumentam a renda por segundo, e desbloqueie sementes melhores, terrenos e animais."]),
  ("Chuva",["Peça chuva quando tiver muitos canteiros plantados para acelerar a colheita."]),
  ("Minha Fazendinha: o ciclo do dia",["Regue as plantas antes de dormir, porque elas crescem durante a noite. Para dormir, chegue perto da porta da casa."]),
  ("Venda e melhore",["Venda a colheita no balcão da loja e compre sementes melhores. Cuide das galinhas para ter ovos todo dia."])])
GUIAS = list(Gd.values())
ORDER = ["tampinhas-como-jogar","tampinhas-dicas","sinuca-regras","sinuca-mirar-forca","mente-em-jogo-modos","mente-em-jogo-milionario","xadrez-regras-especiais","damas-brasileiras-regras","truco-regras-basicas","elydran-controles-e-dicas","apex-dicas-de-pilotagem","fazenda-idle-dicas","atelon-primeiros-passos","novo-mundo-planejar-cidade","master-fut-comecar-carreira","jogar-no-celular"]
GUIAS = [Gd[s] for s in ORDER]
