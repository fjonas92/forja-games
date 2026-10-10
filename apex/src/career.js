import { TEAMS, POINTS, PRIZE, CIRCUITS, UPGRADE_COST, MAX_UPG, SPONSORS } from './data.js';
import { makeSpec } from './physics.js';

const KEY = 'apex_save_v1', SKEY = 'apex_settings_v1';
const NUMS = [1, 44, 16, 55, 4, 81, 14, 63, 3, 11, 18, 23, 27, 31, 10, 77];

export const COLORS = ['#d91e2b', '#ff8a1f', '#f6c500', '#1f9d55', '#12b5b0', '#1c4ed8', '#7a3fd0', '#ff5da2', '#f4f4f4', '#b9c2cc', '#1a1a1f', '#8b5a2b'];

export const defaultSettings = () => ({ quality: 'auto', diff: 'normal', laps: 3, sound: true, auto: false, tilt: false, cam: 0, touch: 'auto', speedUnit: 'kmh' });

export function loadSettings() {
  try { return Object.assign(defaultSettings(), JSON.parse(localStorage.getItem(SKEY) || '{}')); } catch (e) { return defaultSettings(); }
}
export function saveSettings(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { } }

export function loadCareer() {
  try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); return c && c.v === 1 ? c : null; } catch (e) { return null; }
}
let saveHook = null;
export function setSaveHook(f) { saveHook = f; }
// quiet=true: grava sem carimbar a hora nem avisar a nuvem (usado ao baixar o save da nuvem)
export function saveCareer(c, quiet) { try { if (!quiet && c) c.ts = Date.now(); localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { } if (!quiet && saveHook) saveHook(c); }
export function deleteCareer() { try { localStorage.removeItem(KEY); } catch (e) { } }

export function newCareer(pilot, teamId, customName) {
  const base = teamId === 'custom' ? TEAMS[TEAMS.length - 1] : TEAMS.find(t => t.id === teamId);
  return {
    v: 1, pilot, team: teamId, customName: customName || 'Minha Equipe',
    car: { c1: base.c1, c2: base.c2, sp: [0, 1], wing: 0 },
    upg: { motor: 0, aero: 0, brake: 0, tyre: 0 },
    credits: 600, season: 1, round: 0, pts: {}, tpts: {}, wins: 0, podiums: 0, races: 0, titles: 0, history: [],
  };
}

export function teamList(career) {
  // lista de 8 equipes; a equipe propria (custom) substitui a mais fraca
  return TEAMS.map(t => {
    if (career && career.team === 'custom' && t.id === TEAMS[TEAMS.length - 1].id) return Object.assign({}, t, { id: 'custom', name: career.customName, c1: career.car.c1, c2: career.car.c2 });
    return t;
  });
}

export function playerTeam(career) { return teamList(career).find(t => t.id === career.team); }

// monta as 16 entradas de uma corrida
export function buildEntries(pilot, teamId, car, upg, customName, customTeam) {
  const teams = TEAMS.map(t => (customTeam && t.id === TEAMS[TEAMS.length - 1].id) ? Object.assign({}, t, { id: 'custom', name: customName }) : t);
  const entries = []; let n = 0;
  for (const t of teams) {
    for (let k = 0; k < 2; k++) {
      const isP = t.id === teamId && k === 1;
      const num = NUMS[n++];
      if (isP) {
        const spec = makeSpec(t, upg, car.wing || 0);
        entries.push({ id: 'player', name: pilot.name || 'Jogador', nat: pilot.nat, teamId: t.id, number: pilot.number || 7, c1: car.c1, c2: car.c2, isPlayer: true, spec, helmet: { c1: pilot.h1, c2: pilot.h2, style: pilot.hs }, sponsors: [SPONSORS[car.sp[0]], SPONSORS[car.sp[1]]], tag: t.name });
      } else {
        entries.push({ id: t.id + '-' + k, name: t.drivers[k], teamId: t.id, number: num, c1: t.c1, c2: t.c2, isPlayer: false, spec: makeSpec(t, {}, 0), helmet: { c1: '#ffffff', c2: t.c1, style: (n + k) % 3 }, sponsors: [SPONSORS[(n * 3) % 10], SPONSORS[(n * 3 + 4) % 10]], tag: t.name });
      }
    }
  }
  return entries;
}

export function applyResult(career, ranking) {
  const out = { pts: 0, pos: 0, credits: 0, rows: [] };
  ranking.forEach((c, i) => {
    const p = POINTS[i] || 0;
    career.pts[c.id] = (career.pts[c.id] || 0) + p;
    career.tpts[c.teamId] = (career.tpts[c.teamId] || 0) + p;
    out.rows.push({ id: c.id, pts: p });
    if (c.isPlayer) { out.pos = i + 1; out.pts = p; }
  });
  out.credits = PRIZE[out.pos - 1] || 20;
  career.credits += out.credits;
  career.pod = career.pod || {}; career.pos = career.pos || [career.wins || 0, 0, 0];
  ranking.slice(0, 3).forEach((c, i) => { const a = career.pod[c.id] || (career.pod[c.id] = [0, 0, 0]); a[i]++; if (c.isPlayer) career.pos[i]++; });
  career.races++;
  if (out.pos === 1) career.wins++;
  if (out.pos <= 3) career.podiums++;
  career.history.push({ season: career.season, round: career.round, circuit: CIRCUITS[career.round].id, pos: out.pos });
  career.round++;
  out.endSeason = career.round >= CIRCUITS.length;
  return out;
}

export function standings(career, entries) {
  const d = entries.map(e => ({ id: e.id, name: e.name, team: e.tag, teamId: e.teamId, c1: e.c1, isPlayer: e.isPlayer, pts: career.pts[e.id] || 0, pod: (career.pod && career.pod[e.id]) || [0, 0, 0] }));
  d.sort((a, b) => b.pts - a.pts || (a.isPlayer ? -1 : 0));
  const tmap = {}; for (const e of entries) tmap[e.teamId] = { id: e.teamId, name: e.tag, c1: e.c1, pts: career.tpts[e.teamId] || 0 };
  const t = Object.values(tmap).sort((a, b) => b.pts - a.pts);
  return { drivers: d, teams: t };
}

export function endSeason(career, entries) {
  const st = standings(career, entries);
  const champ = st.drivers[0].isPlayer;
  if (champ) career.titles++;
  const bonus = champ ? 3000 : 600 + Math.max(0, 8 - st.drivers.findIndex(x => x.isPlayer)) * 100;
  career.credits += bonus;
  career.season++; career.round = 0; career.pts = {}; career.tpts = {}; career.pod = {};
  return { champ, bonus, pos: st.drivers.findIndex(x => x.isPlayer) + 1 };
}

export function upgradeCost(career, id) { const l = career.upg[id]; return l >= MAX_UPG ? null : UPGRADE_COST(l); }
export function buyUpgrade(career, id) {
  const c = upgradeCost(career, id);
  if (c == null || career.credits < c) return false;
  career.credits -= c; career.upg[id]++; return true;
}

export function fmtTime(t) {
  if (!isFinite(t) || t <= 0) return '--:--.---';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3);
}
