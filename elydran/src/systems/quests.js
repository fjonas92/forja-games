// QuestSystem: etapa atual de cada missão
import { QUESTS } from '../data/quests.js';

export class Quests {
  constructor(data) { this.state = {}; if (data) for (const k in data) if (QUESTS[k] && typeof data[k] === 'number') this.state[k] = Math.max(0, Math.min(QUESTS[k].steps.length - 1, data[k])); if (this.state.main == null) this.state.main = 0; }
  started(q) { return this.state[q] != null; }
  start(q) { if (!this.started(q)) { this.state[q] = 0; return true; } return false; }
  step(q) { return this.started(q) ? QUESTS[q].steps[this.state[q]].id : null; }
  text(q) { return this.started(q) ? QUESTS[q].steps[this.state[q]].text : ''; }
  // avança só se estiver na etapa indicada (evita pular etapas)
  advance(q, from) { if (this.step(q) !== from) return false; this.state[q] = Math.min(QUESTS[q].steps.length - 1, this.state[q] + 1); return true; }
  idx(q, id) { return QUESTS[q].steps.findIndex(s => s.id === id); }
  // já chegou nessa etapa (ou passou dela)?
  atLeast(q, id) { return this.started(q) && this.state[q] >= this.idx(q, id); }
  done(q) { return this.step(q) === 'done'; }
  active() { return Object.keys(this.state).filter(q => !this.done(q) || q === 'main'); }
  toJSON() { return { ...this.state }; }
}
