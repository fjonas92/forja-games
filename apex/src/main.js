import { CIRCUITS, TEAMS, NATIONS, HELMETS, SPONSORS, DIFFS } from './data.js';
import { buildTrack } from './trackgen.js';
import { RaceCore } from './racecore.js';
import { buildProfile, AIDriver } from './ai.js';
import { View, QUALITY } from './render.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { UI, esc } from './ui.js';
import * as C from './career.js';

const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('gl');
const coarse = matchMedia('(pointer:coarse)').matches;

const S = {
  settings: C.loadSettings(), career: C.loadCareer(), mode: 'menu', paused: false, race: null, result: null, stack: [],
  quick: { circuit: 0, team: 'nordic', laps: 3 },
  draft: { pilot: { name: 'Piloto', nat: 'BR', number: 7, h1: '#f4f4f4', h2: '#d91e2b', hs: 0 }, teamId: null, tname: 'Minha Equipe', pv: null },
  garageTab: 'paint', stTab: 'd', cfg: null, tracks: {}, lastScreen: '',
};
window.__apex = S;
S.settings.laps = S.settings.laps || 3;

// ---------- escala da interface ----------
const root = $('ui'), hud = $('hud');
function fit() {
  const w = stage.clientWidth || 960;
  stage.style.setProperty('--u', String(w / 960));
  if (S.view) S.view.resize(canvas.clientWidth || w, canvas.clientHeight || w * 9 / 16);
}
new ResizeObserver(fit).observe(stage);
document.addEventListener('fullscreenchange', fit);

// ---------- modulos ----------
S.input = new Input();
S.sfx = new Sfx(); S.sfx.on = S.settings.sound;
const qName = () => S.settings.quality === 'auto' ? (coarse ? 'medium' : 'high') : S.settings.quality;
try { S.view = new View(canvas, qName()); } catch (e) { $('loading').innerHTML = '<div style="text-align:center;padding:20px;font-size:18px">Seu navegador não conseguiu iniciar o 3D (WebGL).<br><small>Tente outro navegador ou atualize o aparelho.</small></div>'; throw e; }
fit();
S.input.auto = S.settings.auto;
if (S.settings.tilt) S.input.enableTilt(true);

const app = {
  get settings() { return S.settings; }, get career() { return S.career; }, get input() { return S.input; }, get sfx() { return S.sfx; }, get quick() { return S.quick; }, get draft() { return S.draft; },
  get garageTab() { return S.garageTab; }, get stTab() { return S.stTab; }, get result() { return S.result; }, get race() { return S.race; },
  getTrack(i) { return S.tracks[i] || (S.tracks[i] = buildTrack(CIRCUITS[i])); },
  playerTeamObj() { return C.playerTeam(S.career); },
  careerEntries() { const c = S.career; return C.buildEntries(c.pilot, c.team, c.car, c.upg, c.customName, c.team === 'custom'); },
  setText(k, v) { if (k === 'name') S.draft.pilot.name = v; if (k === 'tname') S.draft.tname = v; },
  previewTeam(id) { S.draft.pv = id; refreshPreview(); },
  onScreen(s) { onScreen(s); },
  optText(k) { const o = OPT[k]; return o.fmt(o.get()); },
  cycle(k, d) { const o = OPT[k], l = o.list(), i = l.findIndex(x => x === o.get()); o.set(l[((i < 0 ? 0 : i) + d + l.length) % l.length]); refreshPreview(); },
  act(a, d, el) { act(a, d, el); },
};
const ui = S.ui = new UI(root, app);

// ---------- opcoes (ciclicas) ----------
const bool = (get, set) => ({ list: () => [true, false], get, set, fmt: v => v ? 'Ligado' : 'Desligado' });
const OPT = {
  quality: { list: () => ['auto', 'low', 'medium', 'high'], get: () => S.settings.quality, set: v => { S.settings.quality = v; C.saveSettings(S.settings); S.view.setQuality(qName()); }, fmt: v => ({ auto: 'Automática', low: 'Baixa', medium: 'Média', high: 'Alta' }[v]) },
  diff: { list: () => DIFFS.map(d => d.id), get: () => S.settings.diff, set: v => { S.settings.diff = v; C.saveSettings(S.settings); }, fmt: v => DIFFS.find(d => d.id === v).name },
  sound: bool(() => S.settings.sound, v => { S.settings.sound = v; S.sfx.setOn(v); C.saveSettings(S.settings); }),
  auto: bool(() => S.settings.auto, v => { S.settings.auto = v; S.input.auto = v; C.saveSettings(S.settings); }),
  tilt: bool(() => S.settings.tilt, v => { S.settings.tilt = v; S.input.enableTilt(v).then(ok => { if (!ok && v) { S.settings.tilt = false; ui.render(); } }); C.saveSettings(S.settings); }),
  cam: { list: () => [0, 1, 2], get: () => S.settings.cam, set: v => { S.settings.cam = v; C.saveSettings(S.settings); }, fmt: v => ['Traseira', 'Alta', 'Capô'][v] },
  unit: { list: () => ['kmh', 'mph'], get: () => S.settings.speedUnit, set: v => { S.settings.speedUnit = v; C.saveSettings(S.settings); }, fmt: v => v === 'kmh' ? 'km/h' : 'mph' },
  touch: { list: () => ['auto', 'on', 'off'], get: () => S.settings.touch, set: v => { S.settings.touch = v; C.saveSettings(S.settings); }, fmt: v => ({ auto: 'Automático', on: 'Sempre', off: 'Escondidos' }[v]) },
  qlaps: { list: () => [2, 3, 5, 8], get: () => S.settings.laps, set: v => { S.settings.laps = v; C.saveSettings(S.settings); }, fmt: v => v + ' voltas' },
  qteam: { list: () => TEAMS.map(t => t.id), get: () => S.quick.team, set: v => { S.quick.team = v; }, fmt: v => TEAMS.find(t => t.id === v).name },
  nat: { list: () => NATIONS.map(n => n[0]), get: () => S.draft.pilot.nat, set: v => { S.draft.pilot.nat = v; }, fmt: v => v + '  ' + NATIONS.find(n => n[0] === v)[1] },
  num: { list: () => Array.from({ length: 99 }, (_, i) => i + 1), get: () => S.draft.pilot.number, set: v => { S.draft.pilot.number = v; }, fmt: v => '#' + v },
  hs: { list: () => HELMETS.map((_, i) => i), get: () => S.draft.pilot.hs, set: v => { S.draft.pilot.hs = v; }, fmt: v => HELMETS[v] },
  sp0: { list: () => SPONSORS.map((_, i) => i), get: () => S.career.car.sp[0], set: v => { S.career.car.sp[0] = v; C.saveCareer(S.career); }, fmt: v => SPONSORS[v] },
  sp1: { list: () => SPONSORS.map((_, i) => i), get: () => S.career.car.sp[1], set: v => { S.career.car.sp[1] = v; C.saveCareer(S.career); }, fmt: v => SPONSORS[v] },
  wing: { list: () => [-2, -1, 0, 1, 2], get: () => S.career.car.wing, set: v => { S.career.car.wing = v; C.saveCareer(S.career); }, fmt: v => ['Muito baixa', 'Baixa', 'Equilibrada', 'Alta', 'Muito alta'][v + 2] },
};

// ---------- previa 3D ----------
const MENU = ['title', 'quick', 'pilot', 'teams', 'hub', 'garage', 'standings', 'settings', 'help'];
function onScreen(s) {
  S.lastScreen = s;
  if (S.mode !== 'menu') return;
  S.sfx.music(true);
  if (MENU.includes(s)) { if (S.view.mode !== 'garage') S.view.showGarage(); refreshPreview(); }
}
function carOpts() {
  const sc = S.lastScreen, d = S.draft;
  let team, pilot, car = null, sp = [SPONSORS[0], SPONSORS[1]];
  if (sc === 'pilot' || sc === 'teams') {
    pilot = d.pilot; const id = sc === 'teams' ? (d.pv || d.teamId || 'vortex') : 'silvano';
    team = id === 'custom' ? TEAMS[TEAMS.length - 1] : TEAMS.find(t => t.id === id);
  } else if (S.career && ['hub', 'garage', 'standings', 'title', 'settings', 'help'].includes(sc)) {
    pilot = S.career.pilot; car = S.career.car; team = TEAMS[0]; sp = [SPONSORS[car.sp[0]], SPONSORS[car.sp[1]]];
  } else {
    const t = TEAMS.find(t => t.id === S.quick.team) || TEAMS[0]; team = t; pilot = S.career ? S.career.pilot : d.pilot;
  }
  return { c1: car ? car.c1 : team.c1, c2: car ? car.c2 : team.c2, number: pilot.number, helmet: { c1: pilot.h1, c2: pilot.h2, style: pilot.hs }, sponsors: sp };
}
function refreshPreview() {
  if (S.mode !== 'menu' || S.view.mode !== 'garage') return;
  S.view.setGarageCar(carOpts());
}

// ---------- acoes de menu ----------
function sanitizeName(n) { n = String(n || '').replace(/[<>]/g, '').trim(); return n || 'Piloto'; }
function go(name, push = true) { if (push && ui.screen && ui.screen !== name) S.stack.push(ui.screen); ui.go(name); }
function back() {
  const s = ui.screen;
  if (s === 'title' || s === 'hub' || s === 'results') return;
  if (s === 'pause') return resume();
  const p = S.stack.pop(); if (p) ui.go(p); else ui.go(S.career ? 'hub' : 'title');
}
function act(a, d, el) {
  const sfx = S.sfx;
  switch (a) {
    case 'continue': S.stack = ['title']; ui.go('hub'); break;
    case 'newcareer': S.draft.teamId = null; S.draft.pv = null; S.stack = ['title']; ui.go('pilot'); break;
    case 'quick': go('quick'); break;
    case 'settings': go('settings'); break;
    case 'help': go('help'); break;
    case 'standings': go('standings'); break;
    case 'garage': go('garage'); break;
    case 'back': back(); break;
    case 'pickcircuit': S.quick.circuit = +d.v; ui.render(); break;
    case 'qstart': startRace({ kind: 'quick', ci: S.quick.circuit }); break;
    case 'pilotnext': S.draft.pilot.name = sanitizeName(S.draft.pilot.name); go('teams'); break;
    case 'pickteam': S.draft.teamId = d.v; S.draft.pv = d.v; ui.render(); break;
    case 'teamok': {
      if (!S.draft.teamId) break;
      const nm = String(S.draft.tname || '').replace(/[<>]/g, '').trim() || 'Minha Equipe';
      S.career = C.newCareer(Object.assign({}, S.draft.pilot), S.draft.teamId, nm); C.saveCareer(S.career);
      S.stack = ['title']; ui.go('hub'); break;
    }
    case 'race': startRace({ kind: 'career', ci: S.career.round }); break;
    case 'col': {
      if (d.k === 'h1' || d.k === 'h2') S.draft.pilot[d.k] = d.v;
      else { S.career.car[d.k] = d.v; C.saveCareer(S.career); }
      ui.render(); refreshPreview(); break;
    }
    case 'gtab': S.garageTab = d.v; ui.render(); break;
    case 'sttab': S.stTab = d.v; ui.render(); break;
    case 'buy': if (C.buyUpgrade(S.career, d.v)) { C.saveCareer(S.career); sfx.fanfare && sfx.beep(880, .12, .2); } ui.render(); break;
    case 'menu': C.saveCareer(S.career); S.stack = []; ui.go('title'); break;
    case 'resume': resume(); break;
    case 'restart': startRace(S.cfg); break;
    case 'quit': quitRace(); break;
    case 'again': startRace(S.cfg); break;
    case 'resultok': finishResultScreen(); break;
  }
}

// ---------- corrida ----------
const H = {
  pos: $('hPos'), lap: $('hLap'), tower: $('tower'), times: $('hTimes'), speed: $('hSpeed'), n: $('hSpeed').querySelector('.n'), rpm: $('rpm'), gear: $('hGear'),
  tyre: $('hTyre').querySelector('i'), mini: $('hMini'), lights: [...$('lights').children], lightsBox: $('lights'), msg: $('hMsg'), slip: $('hSlip'), pad: $('hPad'),
};
for (let i = 0; i < 16; i++) H.rpm.appendChild(document.createElement('i'));
const rpmEls = [...H.rpm.children];
let miniCache = null, msgT = 0, hudT = 0, towerT = 0, lastHud = {}, finishT = 0, resetCd = 0, perfAcc = 0, perfN = 0, perfLow = 0;

function msg(text, ms = 1600, color = '#fff') { H.msg.textContent = text; H.msg.style.color = color; H.msg.classList.add('show'); msgT = ms / 1000; }

async function startRace(cfg) {
  if (!cfg) return;
  S.cfg = cfg; S.mode = 'race'; S.paused = false; S.result = null; S.sfx.music(false);
  ui.clear(); S.stack = [];
  const ld = $('loading'); ld.hidden = false; ld.querySelector('small').textContent = CIRCUITS[cfg.ci].name;
  await new Promise(r => setTimeout(r, 60));
  const settings = S.settings, diff = DIFFS.find(d => d.id === settings.diff) || DIFFS[1];
  let entries;
  if (cfg.kind === 'career') { const c = S.career; entries = C.buildEntries(c.pilot, c.team, c.car, c.upg, c.customName, c.team === 'custom'); }
  else {
    const p = S.career ? S.career.pilot : S.draft.pilot;
    entries = C.buildEntries({ name: sanitizeName(p.name), nat: p.nat, number: p.number, h1: p.h1, h2: p.h2, hs: p.hs }, S.quick.team, { c1: TEAMS.find(t => t.id === S.quick.team).c1, c2: TEAMS.find(t => t.id === S.quick.team).c2, sp: [0, 1], wing: 0 }, {}, 'Minha Equipe', false);
  }
  S.entries = entries;
  const track = app.getTrack(cfg.ci);
  try { S.view.loadTrack(track); } catch (e) { console.error(e); }
  S.race = new RaceCore(track, entries, settings.laps, diff.skill, (Date.now() & 0xffff));
  S.view.spawnCars(S.race.cars, entries);
  S.view.camInit = false;
  miniCache = null; lastHud = {}; finishT = 0; resetCd = 0;
  hud.hidden = false; H.lightsBox.style.display = 'flex'; H.lights.forEach(l => l.classList.remove('on'));
  H.slip.classList.remove('show'); H.msg.classList.remove('show');
  S.camMode = settings.cam; S.input.captureKeys = true; S.input.steer = 0; flushEdges();
  updateTouchVis();
  ld.hidden = true;
  S.sfx.start();
}
function flushEdges() { for (const k of ['camera', 'pause', 'reset', 'confirm', 'back', 'alt', 'mute']) S.input.edge(k); }
function updateTouchVis() {
  const s = S.settings.touch, dev = S.input.lastDevice;
  const show = S.mode === 'race' && !S.paused && (s === 'on' || (s === 'auto' && coarse && dev !== 'pad'));
  $('touch').hidden = !show; document.body.classList.toggle('tv', show);
}
function pauseGame() { if (S.mode !== 'race' || S.paused || !S.race || S.race.done) return; S.paused = true; S.stack = []; ui.go('pause'); updateTouchVis(); }
function resume() { S.paused = false; ui.clear(); flushEdges(); updateTouchVis(); }
function quitRace() {
  S.mode = 'menu'; S.paused = false; S.race = null; hud.hidden = true; $('touch').hidden = true; S.input.captureKeys = false;
  S.view.clearRace(); S.stack = []; S.view.mode = 'none'; ui.go(S.cfg && S.cfg.kind === 'career' ? 'hub' : 'title'); S.sfx.update(null, 0, true);
}
function finishResultScreen() {
  const wasCareer = S.cfg.kind === 'career';
  S.mode = 'menu'; S.race = null; hud.hidden = true; S.input.captureKeys = false; S.view.clearRace(); S.view.mode = 'none'; S.sfx.update(null, 0, true);
  S.stack = []; ui.go(wasCareer ? 'hub' : 'title');
}

function onRaceEvent(e, race) {
  const p = race.player, sfx = S.sfx;
  switch (e.type) {
    case 'light': H.lights.forEach((l, i) => l.classList.toggle('on', i < e.n)); if (e.n > 0) sfx.beep(520, .14, .22, 'square'); break;
    case 'go': H.lights.forEach(l => l.classList.remove('on')); sfx.beep(1040, .5, .25, 'square'); msg('LARGOU!', 1100, '#7be37b'); setTimeout(() => { H.lightsBox.style.display = 'none'; }, 900); break;
    case 'lap': if (e.car === p && e.lap < race.laps) msg('VOLTA ' + (e.lap + 1) + ' / ' + race.laps, 1400); break;
    case 'best': if (e.car === p) { msg('MELHOR VOLTA  ' + C.fmtTime(e.time), 1800, '#c78bff'); sfx.beep(1320, .15, .18, 'triangle'); } break;
    case 'wall': if (e.car === p) { sfx.thud(e.force); S.input.rumble(0.9, 0.5, 120 + 200 * e.force); S.view.shake = Math.max(S.view.shake, 0.25 * e.force); } break;
    case 'crash': sfx.thud(e.force * 0.6); S.input.rumble(0.5, 0.8, 120); break;
    case 'finish': if (e.car === p) { sfx.fanfare(); msg(e.car.finishPos === 1 ? 'VITÓRIA!' : 'BANDEIRADA  P' + e.car.finishPos, 3000, '#ffc83d'); } break;
    case 'done': onRaceDone(race); break;
  }
}

function onRaceDone(race) {
  const ranking = race.ranking, R = { ranking };
  if (S.cfg.kind === 'career' && S.career) {
    const ent = S.entries;
    R.career = C.applyResult(S.career, ranking);
    if (R.career.endSeason) R.season = C.endSeason(S.career, ent);
    C.saveCareer(S.career);
  }
  S.result = R; S.sfx.update(null, 0, true);
  hud.hidden = true; $('touch').hidden = true;
  ui.go('results');
}

// ---------- HUD ----------
function setTxt(el, key, v) { if (lastHud[key] !== v) { lastHud[key] = v; el.textContent = v; } }
function drawMini(race, p) {
  const cv = H.mini, g = cv.getContext('2d'), t = race.t, W = cv.width, Hh = cv.height;
  if (!miniCache) {
    let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
    for (let i = 0; i < t.n; i++) { minx = Math.min(minx, t.x[i]); maxx = Math.max(maxx, t.x[i]); minz = Math.min(minz, t.z[i]); maxz = Math.max(maxz, t.z[i]); }
    const s = Math.min((W - 24) / (maxx - minx), (Hh - 24) / (maxz - minz)), ox = (W - (maxx - minx) * s) / 2 - minx * s, oz = (Hh - (maxz - minz) * s) / 2 - minz * s;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = Hh; const o = oc.getContext('2d');
    o.lineJoin = 'round'; o.lineCap = 'round';
    for (const [w, col] of [[11, 'rgba(0,0,0,.6)'], [6, '#dfe6ff']]) {
      o.lineWidth = w; o.strokeStyle = col; o.beginPath();
      for (let i = 0; i <= t.n; i += 2) { const k = i % t.n; const px = ox + t.x[k] * s, py = oz + t.z[k] * s; i ? o.lineTo(px, py) : o.moveTo(px, py); }
      o.closePath(); o.stroke();
    }
    o.fillStyle = '#ff3b30'; o.fillRect(ox + t.x[0] * s - 3, oz + t.z[0] * s - 3, 7, 7);
    miniCache = { oc, s, ox, oz };
  }
  g.clearRect(0, 0, W, Hh); g.drawImage(miniCache.oc, 0, 0);
  for (const c of race.cars) {
    const px = miniCache.ox + c.x * miniCache.s, py = miniCache.oz + c.z * miniCache.s;
    g.fillStyle = c.isPlayer ? '#ffc83d' : c.c1; g.beginPath(); g.arc(px, py, c.isPlayer ? 8 : 5, 0, 7); g.fill();
    if (c.isPlayer) { g.strokeStyle = '#000'; g.lineWidth = 2; g.stroke(); }
  }
}
function updateHud(race, dt) {
  const p = race.player; if (!p) return;
  setTxt(H.pos.firstChild, 'pos', String(p.pos || 1));
  H.pos.querySelector('small').textContent = '/' + race.cars.length;
  const lapN = Math.max(1, Math.min(race.laps, p.lap + 1));
  setTxt(H.lap, 'lap', 'VOLTA ' + lapN + '/' + race.laps);
  const kmh = Math.abs(p.v) * (S.settings.speedUnit === 'mph' ? 2.23694 : 3.6);
  setTxt(H.n, 'spd', String(Math.round(kmh)));
  H.speed.querySelector('.u').firstChild.nodeValue = (S.settings.speedUnit === 'mph' ? 'MPH ' : 'KM/H ');
  setTxt(H.gear, 'gear', p.v < -0.5 ? 'R' : p.v < 1 ? 'N' : String(p.gear || 1));
  const on = Math.round((p.rpm || 0) * rpmEls.length);
  if (lastHud.rpm !== on) { lastHud.rpm = on; rpmEls.forEach((e, i) => { e.className = i < on ? 'on' + (i > 12 ? ' r' : i > 9 ? ' y' : '') : ''; }); }
  const w = Math.round(p.wear * 100);
  if (lastHud.wear !== w) { lastHud.wear = w; H.tyre.style.width = Math.max(0, (p.wear - 0.5) * 200) + '%'; H.tyre.style.background = p.wear > 0.85 ? '#7be37b' : p.wear > 0.7 ? '#ffd23f' : '#ff5a4d'; }
  const cur = Math.max(0, race.raceTime - p.lapStart);
  const html = '<b>' + (race.phase === 'race' ? C.fmtTime(p.finished ? p.lapTimes[p.lapTimes.length - 1] || 0 : cur) : '0:00.000') + '</b><small>MELHOR ' + (p.best ? C.fmtTime(p.best) : '--') + '</small>';
  if (lastHud.times !== html) { lastHud.times = html; H.times.innerHTML = html; }
  H.slip.classList.toggle('show', (p.slipstream || 0) > 0.25 && race.phase === 'race');
  towerT -= dt; if (towerT <= 0) { towerT = 0.4; drawTower(race, p); }
  drawMini(race, p);
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) H.msg.classList.remove('show'); }
  const pad = S.input.lastDevice === 'pad';
  setTxt(H.pad, 'pad', pad ? '' : '');
}
function drawTower(race, p) {
  const ord = race.order, rows = [];
  const top = ord.slice(0, 8);
  if (!top.includes(p)) top.push(p);
  for (const c of top) {
    const gap = c === ord[0] ? '' : ' ' + (c.prog > ord[0].prog - 1 ? '' : '');
    rows.push('<div class="' + (c.isPlayer ? 'me' : '') + '"><i style="background:' + c.c1 + '"></i><span>' + (c.pos) + '</span><span>' + esc(c.name.split(' ').pop().toUpperCase().slice(0, 10)) + '</span></div>');
  }
  const h = rows.join('');
  if (lastHud.tower !== h) { lastHud.tower = h; H.tower.innerHTML = h; }
}

// ---------- loop ----------
let last = performance.now();
let acc = 0;
function raceFrame(dt) {
  const race = S.race, inp = S.input, view = S.view;
  if (!race) return;
  if (!S.paused) {
    if (inp.edge('pause')) { pauseGame(); }
    if (inp.edge('camera')) { S.camMode = (S.camMode + 1) % 3; msg(['CÂMERA TRASEIRA', 'CÂMERA ALTA', 'CÂMERA CAPÔ'][S.camMode], 900); }
    if (inp.edge('reset') && race.phase === 'race' && resetCd <= 0) {
      const p = race.player; if (p && !p.finished) { p.place(race.t, ((p.lastS % race.t.length) + race.t.length) % race.t.length, 0); p.v = Math.min(p.v, 25); resetCd = 3; msg('REPOSICIONADO', 900); }
    }
    inp.edge('confirm'); inp.edge('back'); inp.edge('alt');
  }
  resetCd = Math.max(0, resetCd - dt);
  if (!S.paused) {
    // fisica em passos fixos
    acc += dt; let steps = 0; const H0 = 1 / 120;
    const p = race.player;
    const v = p ? Math.abs(p.v) : 0;
    let pin = { steer: inp.steer, throttle: inp.throttle, brake: inp.brake };
    if (S.autopilot && p && !p.finished) { // gancho de teste: IA dirige o carro do jogador
      if (!S.apDrv || S.apDrv.r !== p) S.apDrv = new AIDriver(p, race.t, buildProfile(race.t, p.spec, 0.97), Math.random);
      pin = S.apDrv.drive(H0, race.cars, p.prog, 1);
    }
    while (acc >= H0 && steps < 8) {
      const ev = race.step(H0, pin);
      for (const e of ev) onRaceEvent(e, race);
      acc -= H0; steps++;
    }
    if (steps >= 8) acc = 0;
    if (race.player) { race.player.str = pin.steer; }
    if (race.done || (p && p.finished)) finishT += dt;
  }
  const p = race.player || race.cars[0];
  view.syncCars(race.cars, S.paused ? 0 : dt);
  const orbit = race.phase === 'countdown' ? Math.max(0, 1 - race.cd / 3.6) * 2.4 : (p.finished ? Math.min(3.0, finishT * 0.45) : 0);
  view.shake *= Math.pow(0.02, dt);
  view.updateCamera(p, S.camMode, dt, { orbit, shake: view.shake });
  view.followSun(p.x, p.y, p.z);
  if (!S.paused) { updateHud(race, dt); S.sfx.update(p, S.input.throttle, false); } else S.sfx.update(null, 0, true);
}

function menuFrame(dt) {
  const inp = S.input, view = S.view;
  if (view.mode === 'garage') view.updateGarage(dt, S.lastScreen === 'pilot' ? 'helmet' : 'car');
}
function uiNav(dt) {
  const inp = S.input, a = document.activeElement;
  const typing = a && a.tagName === 'INPUT';
  const dir = inp.navDir(dt);
  if (dir && !(typing && (dir === 'left' || dir === 'right'))) { ui.navigate(dir); S.sfx.tick && S.sfx.start(); }
  if (inp.edge('confirm')) ui.confirm();
  if (inp.edge('back') || inp.edge('pause')) { if (typing && !inp.keys.has('Escape')) { /* ignore */ } else if (ui.screen === 'pause') resume(); else back(); }
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; if (dt <= 0) return;
  S.input.update(dt);
  if (S.mode === 'race') {
    raceFrame(dt);
    if (S.paused || (S.race && S.race.done)) uiNav(dt);
    // desempenho: reduz qualidade se estiver ruim (so no modo automatico)
    if (!S.paused && S.settings.quality === 'auto' && S.view.qn !== 'low') {
      perfAcc += dt; perfN++;
      if (perfAcc > 4) { const fps = perfN / perfAcc; perfAcc = 0; perfN = 0; if (fps < 40) { perfLow++; if (perfLow >= 2) { perfLow = 0; const nq = S.view.qn === 'high' ? 'medium' : 'low'; S.view.setQuality(nq); msg('Qualidade reduzida', 1200); } } else perfLow = 0; }
    }
  } else { menuFrame(dt); uiNav(dt); }
  updateTouchVisThrottled();
  S.view.render();
}
let tvT = 0; function updateTouchVisThrottled() { tvT++; if (tvT % 20 === 0) updateTouchVis(); }

// ---------- eventos globais ----------
S.input.bindTouch({ left: $('tL'), right: $('tR'), gas: $('tG'), brake: $('tB') });
$('tP').addEventListener('click', () => pauseGame());
$('tC').addEventListener('click', () => { S.camMode = (S.camMode + 1) % 3; });
const unlock = () => { S.sfx.start(); if (S.mode === 'menu') S.sfx.music(true); };
addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
addEventListener('keydown', e => {
  const a = document.activeElement;
  if (S.mode === 'race' && !S.paused) return;
  if ((e.code === 'Enter' || e.code === 'Space') && a && a.classList && a.classList.contains('cyc')) { e.preventDefault(); app.cycle(a.dataset.k, 1); ui.render(); }
  if (e.code === 'Enter' && a && a.classList && a.classList.contains('card')) { /* botao nativo */ }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
addEventListener('blur', () => pauseGame());
S.input.on((k, v) => {
  if (k === 'pad') $('padstatus').innerHTML = v ? 'Controle conectado: <b>' + esc(S.input.padName.replace(/\(.*$/, '').slice(0, 40)) + '</b>. Use o analógico, RT e LT.' : 'Controle desconectado.';
  if (k === 'device') { updateTouchVis(); if (ui.screen === 'title') ui.render(); }
});
$('btnFull').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else { await stage.requestFullscreen(); try { await screen.orientation.lock('landscape'); } catch (_) { } }
  } catch (_) { }
});
if (coarse) $('btnFull').textContent = '⛶';

// ---------- inicio ----------
for (let i = 0; i < CIRCUITS.length; i++) app.getTrack(i);
requestAnimationFrame(() => {
  $('loading').hidden = true;
  ui.go('title');
  last = performance.now(); requestAnimationFrame(frame);
});
