// Conta e save na nuvem (Supabase, mesmo projeto dos outros jogos do site).
// A carreira continua salva no aparelho; logado, ela tambem vai para a tabela apex_data.
const SB_URL = 'https://lephzateozhdiyvgpgly.supabase.co';
const SB_KEY = 'sb_publishable_fy4N7G17i5zsKJREatUEcQ_LrAEuKoc';

export function ptErr(m) {
  m = String(m || '');
  if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/already registered|already been registered/i.test(m)) return 'Esse e-mail já tem conta. Use "Entrar".';
  if (/Password should be|at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/valid email|invalid format|Unable to validate/i.test(m)) return 'Digite um e-mail válido.';
  if (/not confirmed/i.test(m)) return 'Confirme seu e-mail primeiro (veja a caixa de entrada e o spam).';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  return 'Não deu certo agora. Tente de novo em instantes.';
}

export class Cloud {
  constructor() { this.sb = null; this.user = null; this.status = ''; this.t = null; this.loading = false; this.q = []; this.onChange = null; this.adopt = null; this.getLocal = null; }

  // carrega a biblioteca so uma vez (no inicio, para restaurar a sessao)
  ready(cb) {
    if (this.sb) return cb && cb(this.sb);
    if (cb) this.q.push(cb);
    if (window.supabase && window.supabase.createClient) return this._make();
    if (this.loading) return;
    this.loading = true;
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    sc.onload = () => { this.loading = false; this._make(); };
    sc.onerror = () => { this.loading = false; this.status = 'Sem conexão com o servidor'; this._emit(); };
    document.head.appendChild(sc);
  }
  _make() {
    if (this.sb) return;
    this.sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    this.sb.auth.onAuthStateChange((ev, sess) => {
      const u = sess && sess.user ? sess.user : null, was = this.user && this.user.id;
      this.user = u; this._emit();
      if (u && u.id !== was) setTimeout(() => this.syncDown(), 0);
    });
    this.sb.auth.getSession().then(r => { if (r.data && r.data.session && !this.user) { this.user = r.data.session.user; this._emit(); this.syncDown(); } });
    const q = this.q; this.q = []; q.forEach(f => f(this.sb));
  }
  _emit() { if (this.onChange) this.onChange(); }

  async signIn(email, pass) {
    return new Promise(res => this.ready(async sb => {
      try { const { error } = await sb.auth.signInWithPassword({ email, password: pass }); res(error ? { err: ptErr(error.message) } : {}); }
      catch (e) { res({ err: 'Sem conexão. Tente de novo.' }); }
    }));
  }
  async signUp(email, pass) {
    return new Promise(res => this.ready(async sb => {
      try {
        const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) res({ err: ptErr(error.message) });
        else res(data.session ? {} : { info: 'Conta criada! Confirme pelo link que enviamos para o seu e-mail (veja o spam) e depois entre.' });
      } catch (e) { res({ err: 'Sem conexão. Tente de novo.' }); }
    }));
  }
  async forgot(email) {
    return new Promise(res => this.ready(async sb => {
      try { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); res(error ? { err: ptErr(error.message) } : { info: 'Enviamos um link para redefinir a senha no seu e-mail.' }); }
      catch (e) { res({ err: 'Sem conexão. Tente de novo.' }); }
    }));
  }
  async signOut() {
    clearTimeout(this.t);
    const ok = await this.pushNow();
    return new Promise(res => this.ready(async sb => { try { await sb.auth.signOut(); } catch (e) { } this.user = null; this.status = ''; this._emit(); res(ok); }));
  }

  // ---- save ----
  schedulePush() { if (!this.user) return; clearTimeout(this.t); this.t = setTimeout(() => this.pushNow(), 1500); }
  async pushNow() {
    if (!this.sb || !this.user) return true;
    const c = this.getLocal && this.getLocal(); if (!c) return true;
    const { error } = await this.sb.from('apex_data').upsert({ user_id: this.user.id, career: JSON.parse(JSON.stringify(c)), updated_at: new Date().toISOString() });
    this.status = error ? 'Não salvou na nuvem' : 'Salvo na nuvem'; this._emit(); return !error;
  }
  // ao entrar: o save mais novo (nuvem ou aparelho) vence
  async syncDown() {
    if (!this.sb || !this.user) return;
    this.status = 'Sincronizando...'; this._emit();
    const { data, error } = await this.sb.from('apex_data').select('career').eq('user_id', this.user.id).maybeSingle();
    if (error) { this.status = 'Não consegui sincronizar'; this._emit(); return; }
    const local = this.getLocal && this.getLocal(), cloud = data && data.career && data.career.v === 1 ? data.career : null;
    if (cloud && (!local || (cloud.ts || 0) > (local.ts || 0))) { this.adopt && this.adopt(cloud); this.status = 'Carreira carregada da nuvem'; this._emit(); return; }
    await this.pushNow();
  }
}
