// TURBO MOTO: dados do jogo. Tudo ficticio (equipes, pilotos e circuitos).
export const NATIONS = [
  ['BR','Brasil'],['AR','Argentina'],['US','Estados Unidos'],['GB','Reino Unido'],['DE','Alemanha'],['FR','Franca'],
  ['IT','Italia'],['ES','Espanha'],['PT','Portugal'],['NL','Holanda'],['JP','Japao'],['AU','Australia'],
  ['MX','Mexico'],['CA','Canada'],['FI','Finlandia'],['SE','Suecia'],['CH','Suica'],['BE','Belgica'],
  ['AT','Austria'],['DK','Dinamarca'],['PL','Polonia'],['CN','China'],['CO','Colombia'],['CL','Chile'],
];

export const SPONSORS = ['NOVA','KRONOS','ZEPHYR','AURUM','PULSAR','VIRTA','ORBITAL','HALCON','LUMEN','TITAN'];

export const HELMETS = ['Classico','Faixa','Listras','Metade','Estrela','Raio'];

// power: motor, aero: pressao aerodinamica, grip: pneus, brake: freios (todos ~0.9 a 1.06)
export const TEAMS = [
  { id:'vortex',  name:'Raio Veloz Racing',     c1:'#d91e2b', c2:'#f4f4f4', power:1.050, aero:1.04, grip:1.04, brake:1.03, drivers:['Rafa Torres','Dudu Lima'] },
  { id:'silvano', name:'Prata GP',        c1:'#b9c2cc', c2:'#1b2b44', power:1.040, aero:1.05, grip:1.02, brake:1.02, drivers:['Henrique Matos','Tomás Brandão'] },
  { id:'helix',   name:'Azulão Motors',  c1:'#1c4ed8', c2:'#ffd23f', power:1.020, aero:1.02, grip:1.03, brake:1.00, drivers:['Daniel Okoro','Andre Castillo'] },
  { id:'nordic',  name:'Laranja Fire',      c1:'#ff8a1f', c2:'#14213d', power:1.000, aero:1.01, grip:1.00, brake:1.01, drivers:['Elias Costa','Rafael Duarte'] },
  { id:'kestrel', name:'Falcão Verde',    c1:'#1f9d55', c2:'#f2f2f2', power:0.985, aero:0.99, grip:1.00, brake:0.99, drivers:['Pierre Lemos','Kenji Aoki'] },
  { id:'obsidian',name:'Onix Works',    c1:'#1a1a1f', c2:'#d4a017', power:0.970, aero:0.98, grip:0.98, brake:0.98, drivers:['Vitor Hale','Mateo Rios'] },
  { id:'aurora',  name:'Aurora Speed',       c1:'#12b5b0', c2:'#ff5da2', power:0.950, aero:0.96, grip:0.97, brake:0.97, drivers:['Sofia Lins','Gabriel Mota'] },
  { id:'pyra',    name:'Amarelinha Team',        c1:'#f6c500', c2:'#202020', power:0.930, aero:0.94, grip:0.95, brake:0.95, drivers:['Nico Baldassari','Leon Weber'] },
];

export const POINTS = [25,18,15,12,10,8,6,4,2,1];
export const PRIZE = [900,700,560,450,360,290,230,180,140,110,90,70,60,50,40,30];

// Temas visuais. sky: [topo, horizonte], fog, grass:[a,b], ground
export const THEMES = {
  coast:   { sky:['#3d8fe0','#cfe6f7'], fog:'#cfe6f7', fogD:0.00085, grass:['#7aa84a','#6a9640'], ground:'#d9c58a', sun:1.9, sunCol:'#fff2dc', scenery:['palm','palm','rock','bush'], water:true, mount:0 },
  city:    { sky:['#5aa0e8','#dbe9f5'], fog:'#d3e0ec', fogD:0.0009, grass:['#74a04a','#668e40'], ground:'#6f7a6a', sun:1.8, sunCol:'#fff6e6', scenery:['building','building','building','tree','lamp'], mount:0 },
  desert:  { sky:['#4b8fd8','#f2dcae'], fog:'#ecd7a8', fogD:0.0009, grass:['#d2b074','#c29f62'], ground:'#cfa965', sun:2.1, sunCol:'#fff0cf', scenery:['cactus','rock','rock','bush'], mount:1, mountCol:'#b8845a' },
  alps:    { sky:['#4f8fe0','#d6e8f6'], fog:'#d4e4f2', fogD:0.0009, grass:['#5e9a47','#528a3c'], ground:'#5e8f45', sun:1.8, sunCol:'#fff4e3', scenery:['pine','pine','pine','bush'], mount:1, mountCol:'#7d8794', snowcap:true },
  snow:    { snowy:true, sky:['#8fb5d8','#eaf1f7'], fog:'#e3ecf4', fogD:0.0014, grass:['#e8eef3','#d9e2ea'], ground:'#e8eef3', sun:1.5, sunCol:'#e8f1ff', scenery:['snowpine','snowpine','rock'], mount:1, mountCol:'#9fb0c2', snowcap:true },
  night:   { sky:['#050a1c','#1d2a52'], fog:'#0e1633', fogD:0.0011, grass:['#1d3a2a','#183223'], ground:'#16251d', sun:0.7, sunCol:'#9fb4ff', scenery:['building','building','lamp','lamp','tree'], night:true, mount:0 },
  forest:  { sky:['#5aa0d8','#d9ead6'], fog:'#cfe3cd', fogD:0.0012, grass:['#4f8a3c','#447a33'], ground:'#3f6f30', sun:1.7, sunCol:'#fff3d6', scenery:['pine','pine','tree','tree','bush'], mount:0 },
  sakura:  { sky:['#6fa8e6','#f6e1ea'], fog:'#efdbe4', fogD:0.0010, grass:['#78a84c','#6a9a42'], ground:'#72a048', sun:1.8, sunCol:'#fff0e6', scenery:['sakura','sakura','sakura','building','lamp'], mount:1, mountCol:'#6d7f9a', snowcap:true },
  speed:   { sky:['#3f86dc','#d4e6f6'], fog:'#cfe2f2', fogD:0.0007, grass:['#7aa84a','#6a9640'], ground:'#71a044', sun:2.0, sunCol:'#fff4e0', scenery:['tree','bush'], mount:0 },
  cliffs:  { sky:['#5b97d8','#e9d8c4'], fog:'#e0d3c4', fogD:0.0010, grass:['#8aa05a','#7a9250'], ground:'#a8946e', sun:1.9, sunCol:'#ffe8c8', scenery:['rock','rock','bush','pine'], water:true, mount:1, mountCol:'#9a7c62' },
  dusk:    { sky:['#2b3a78','#ff9a5a'], fog:'#d98a68', fogD:0.0010, grass:['#587a3a','#4d6e33'], ground:'#4a6a32', sun:1.1, sunCol:'#ff9a5a', scenery:['palm','building','lamp','tree'], mount:1, mountCol:'#5a4468' },
  canyon:  { sky:['#3a7fd0','#f4d2a4'], fog:'#ecc9a0', fogD:0.0010, grass:['#c07a4a','#b06c40'], ground:'#b8683c', sun:2.1, sunCol:'#ffe2bc', scenery:['rock','rock','cactus','bush'], mount:1, mountCol:'#a8512c' },
  volcano: { sky:['#2a2f45','#c8754a'], fog:'#8a6a5c', fogD:0.0014, grass:['#3a3a3e','#313136'], ground:'#2a2a2e', sun:1.3, sunCol:'#ffb27a', scenery:['rock','rock','rock','pine','lamp'], mount:1, mountCol:'#3b2a2a' },
  tropic:  { sky:['#2f9be0','#bfe8f2'], fog:'#bfe3ee', fogD:0.0009, grass:['#4da04a','#409240'], ground:'#e1cf92', sun:2.0, sunCol:'#fffbe8', scenery:['palm','palm','palm','bush','rock'], water:true, mount:0 },
};

// Circuitos: raio polar r(t)=1+sum(amp*sin(k t+ph)) - dips (hairpins). len em metros.
// h = amplitude de altura em metros; w = meia largura da pista
export const CIRCUITS = [
  { id:'azul',    name:'Costa Azul Moto Park',     country:'BR', theme:'coast',  len:3100, sx:1.35, w:7.6, h:3,  harm:[[2,.16,.4],[3,.10,1.7],[5,.05,2.2]],        hp:[[2.2,.30,.20]], diff:1 },
  { id:'vento',   name:'Circuito Cidade do Vento', country:'AR', theme:'city',   len:2500, sx:1.10, w:7.0, h:2,  harm:[[2,.14,.9],[3,.12,2.6],[4,.08,.3],[7,.03,1]], hp:[[0.8,.28,.16],[4.0,.22,.14]], diff:3 },
  { id:'dunas',   name:'Dunas Moto Arena',      country:'AE', theme:'desert', len:3600, sx:1.55, w:8.0, h:4,  harm:[[2,.20,2.0],[3,.08,.2],[4,.06,3.1]],         hp:[[5.2,.28,.22]], diff:2 },
  { id:'serra',   name:'Serra Alta Raceway',       country:'CH', theme:'alps',   len:3300, sx:1.20, w:7.4, h:9,  harm:[[2,.12,1.1],[3,.14,.5],[5,.07,1.9],[6,.04,.6]], hp:[[1.6,.26,.15],[3.9,.22,.15]], diff:4 },
  { id:'gelo',    name:'Lago Gelado GP',           country:'FI', theme:'snow',   len:2800, sx:1.30, w:7.4, h:3,  harm:[[2,.15,.2],[3,.11,2.8],[4,.07,1.4]],         hp:[[3.0,.28,.18]], diff:2 },
  { id:'noite',   name:'Neon Night Circuit',       country:'JP', theme:'night',  len:3000, sx:1.25, w:7.4, h:2,  harm:[[2,.13,1.6],[3,.12,.1],[4,.09,2.2],[6,.04,.9]], hp:[[0.5,.26,.16],[2.8,.22,.14],[5.1,.22,.15]], diff:4 },
  { id:'bosque',  name:'Bosque Verde Ring',        country:'DE', theme:'forest', len:3900, sx:1.40, w:7.4, h:6,  harm:[[2,.17,.7],[3,.12,2.0],[5,.06,.5],[7,.03,2.6]], hp:[[4.4,.26,.18]], diff:3 },
  { id:'sakura',  name:'Sakura Park Speedway',     country:'JP', theme:'sakura', len:2700, sx:1.15, w:7.2, h:3,  harm:[[2,.14,2.4],[3,.13,.7],[4,.06,1.6]],         hp:[[1.3,.27,.15],[3.6,.22,.15]], diff:3 },
  { id:'oval',    name:'Grande Velocidade Arena',  country:'US', theme:'speed',  len:2300, sx:1.75, w:8.4, h:1,  harm:[[2,.08,.3],[3,.05,1.1]],                     hp:[], diff:1 },
  { id:'penhasco',name:'Penhasco do Sol',          country:'PT', theme:'cliffs', len:3400, sx:1.35, w:7.4, h:7,  harm:[[2,.16,1.3],[3,.11,.4],[5,.06,2.5]],         hp:[[2.6,.28,.18]], diff:3 },
  { id:'ocaso',   name:'Ocaso Moto Club',       country:'ES', theme:'dusk',   len:3200, sx:1.30, w:7.4, h:4,  harm:[[2,.15,.1],[3,.12,1.4],[4,.08,2.9],[6,.04,.2]], hp:[[1.0,.25,.16],[4.6,.24,.16]], diff:4 },
  { id:'ilha',    name:'Ilha Tropical GP',         country:'AU', theme:'tropic', len:3500, sx:1.45, w:7.6, h:3,  harm:[[2,.18,1.9],[3,.10,.9],[5,.05,1.3]],         hp:[[3.4,.27,.2]], diff:2 },
  { id:'canion',  name:'Canion Vermelho GP',       country:'US', theme:'canyon', len:3700, sx:1.50, w:7.8, h:8,  harm:[[2,.18,.8],[3,.11,2.3],[4,.07,.6]],          hp:[[3.1,.30,.20]], diff:3 },
  { id:'vulcao',  name:'Vulcao Negro Circuit',     country:'IS', theme:'volcano',len:3000, sx:1.20, w:7.4, h:7,  harm:[[2,.14,1.8],[3,.13,.2],[5,.07,1.1],[6,.04,2.4]], hp:[[0.6,.27,.17],[3.7,.23,.15]], diff:4 },
];

export const LAPS_OPTIONS = [2,3,5,8];
export const DIFFS = [
  { id:'easy',   name:'Facil',    skill:0.90 },
  { id:'normal', name:'Normal',   skill:0.96 },
  { id:'hard',   name:'Dificil',  skill:1.00 },
];

export const UPGRADES = [
  { id:'motor',  name:'Motor',   desc:'Mais aceleracao e velocidade final' },
  { id:'aero',   name:'Aerodinamica', desc:'Mais aderencia em curvas rapidas' },
  { id:'brake',  name:'Freios',  desc:'Frenagens mais curtas' },
  { id:'tyre',   name:'Pneus',   desc:'Mais aderencia e menos desgaste' },
];
export const UPGRADE_COST = lvl => 400 + lvl * 350;
export const MAX_UPG = 5;

// Estilos de pintura (padrao desenhado sobre a cor principal/secundaria). Desbloqueio com creditos da carreira.
export const PAINTS = [
  { id:'solid',   name:'Lisa',            price:0 },
  { id:'stripe',  name:'Faixa central',   price:300 },
  { id:'twin',    name:'Faixas duplas',   price:350 },
  { id:'split',   name:'Meio a meio',     price:400 },
  { id:'dots',    name:'Pontos',          price:450 },
  { id:'chevron', name:'Setas',           price:500 },
  { id:'checker', name:'Xadrez',          price:550 },
  { id:'fade',    name:'Degrade',         price:650 },
  { id:'flame',   name:'Chamas',          price:800 },
  { id:'camo',    name:'Camuflagem',      price:900 },
  { id:'carbon',  name:'Carbono',         price:1200 },
  { id:'gold',    name:'Edicao Ouro',     price:2500 },
];
export const AI_PAINT = ['stripe','twin','chevron','split','fade','dots','checker','flame'];

// Clima: r0 = chuva no inicio, r1 = chuva no fim (0..1), t0/ramp = quando muda
export const WEATHERS = ['auto','dry','light','heavy','var'];
export const WX_NAME = { auto:'Sorteado', dry:'Seco', light:'Chuva fraca', heavy:'Chuva forte', var:'Variavel' };
