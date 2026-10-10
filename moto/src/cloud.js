// Conta e save na nuvem usando o login compartilhado do site (fg.js, tabela fg_saves, jogo "moto").
export function ptErr(m) { return window.FG ? window.FG.ptErr(m) : 'Não deu certo agora.'; }

export class Cloud {
  constructor() { this.onChange = null; this.adopt = null; this.getLocal = null; this.t = null; this._ok = false; }
  get user() { return window.FG ? window.FG.user : null; }
  get status() { return window.FG ? window.FG.status : ''; }
  set status(v) { if (window.FG) window.FG.status = v; }
  ready(cb) {
    const FG = window.FG; if (!FG) return;
    if (!this._ok) { this._ok = true; FG.init('moto', () => { if (this.onChange) this.onChange(); }); FG.onLogin = () => this.syncDown(); }
    FG.ready(cb);
  }
  signIn(e, p) { return window.FG.signIn(e, p); }
  signUp(e, p) { return window.FG.signUp(e, p); }
  forgot(e) { return window.FG.forgot(e); }
  async signOut() { const ok = await this.pushNow(); await window.FG.signOut(); return ok; }
  schedulePush() { if (!this.user) return; clearTimeout(this.t); this.t = setTimeout(() => this.pushNow(), 1500); }
  async pushNow() {
    const c = this.getLocal && this.getLocal(); if (!window.FG || !this.user || !c) return true;
    const ok = await window.FG.cloudSave(c); if (this.onChange) this.onChange(); return ok;
  }
  // ao entrar: o save mais novo (nuvem ou aparelho) vence
  async syncDown() {
    if (!this.user) return;
    const cloud = await window.FG.cloudLoad(), local = this.getLocal && this.getLocal();
    if (cloud && cloud.v === 1 && (!local || (cloud.ts || 0) > (local.ts || 0))) { this.adopt && this.adopt(cloud); window.FG.status = 'Carreira carregada da nuvem'; if (this.onChange) this.onChange(); return; }
    await this.pushNow();
  }
}
