/* Falzinho Games: login, save na nuvem e ranking compartilhados pelos jogos novos.
   Uso: FG.init('pebolim'); FG.mountBar(el); FG.cloudSave(data); FG.cloudLoad(); FG.report(pontos, venceu); FG.top(); */
(function () {
  var SB_URL = 'https://lephzateozhdiyvgpgly.supabase.co';
  var SB_KEY = 'sb_publishable_fy4N7G17i5zsKJREatUEcQ_LrAEuKoc';
  var FG = window.FG = { sb: null, user: null, game: '', q: [], loading: false, onChange: null, status: '' };

  function ptErr(m) {
    m = String(m || '');
    if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/already registered|already been registered/i.test(m)) return 'Esse e-mail já tem conta. Use "Entrar".';
    if (/Password should be|at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (/valid email|invalid format|Unable to validate/i.test(m)) return 'Digite um e-mail válido.';
    if (/not confirmed/i.test(m)) return 'Confirme seu e-mail primeiro (veja a caixa de entrada e o spam).';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Espere um pouco e tente de novo.';
    return 'Não deu certo agora. Tente de novo em instantes.';
  }
  FG.ptErr = ptErr;

  FG.init = function (game, onChange) {
    FG.game = game; FG.onChange = onChange || null;
    FG.ready(function () { });
  };
  FG.ready = function (cb) {
    if (FG.sb) return cb && cb(FG.sb);
    if (cb) FG.q.push(cb);
    if (window.supabase && window.supabase.createClient) return make();
    if (FG.loading) return;
    FG.loading = true;
    var sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    sc.onload = function () { FG.loading = false; make(); };
    sc.onerror = function () { FG.loading = false; FG.status = 'Sem conexão'; emit(); };
    document.head.appendChild(sc);
  };
  function make() {
    if (FG.sb) return;
    FG.sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    FG.sb.auth.onAuthStateChange(function (ev, sess) {
      var u = sess && sess.user ? sess.user : null, was = FG.user && FG.user.id;
      FG.user = u; emit();
      if (u && u.id !== was && FG.onLogin) setTimeout(function () { FG.onLogin(u); }, 0);
    });
    FG.sb.auth.getSession().then(function (r) {
      if (r.data && r.data.session && !FG.user) { FG.user = r.data.session.user; emit(); if (FG.onLogin) FG.onLogin(FG.user); }
    });
    var q = FG.q; FG.q = []; q.forEach(function (f) { f(FG.sb); });
  }
  function emit() { renderBars(); if (FG.onChange) FG.onChange(FG.user); }

  FG.nome = function () {
    if (!FG.user) return 'Visitante';
    var m = (FG.user.user_metadata && FG.user.user_metadata.nome) || (FG.user.email || 'Jogador').split('@')[0];
    return String(m).replace(/[<>]/g, '').slice(0, 14) || 'Jogador';
  };

  FG.signIn = function (email, pass) {
    return new Promise(function (res) {
      FG.ready(async function (sb) {
        try { var r = await sb.auth.signInWithPassword({ email: email, password: pass }); res(r.error ? { err: ptErr(r.error.message) } : {}); }
        catch (e) { res({ err: 'Sem conexão. Tente de novo.' }); }
      });
    });
  };
  FG.signUp = function (email, pass) {
    return new Promise(function (res) {
      FG.ready(async function (sb) {
        try {
          var r = await sb.auth.signUp({ email: email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } });
          if (r.error) res({ err: ptErr(r.error.message) });
          else res(r.data.session ? {} : { info: 'Conta criada! Confirme pelo link que enviamos para o seu e-mail (veja o spam) e depois entre.' });
        } catch (e) { res({ err: 'Sem conexão. Tente de novo.' }); }
      });
    });
  };
  FG.forgot = function (email) {
    return new Promise(function (res) {
      FG.ready(async function (sb) {
        try { var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); res(r.error ? { err: ptErr(r.error.message) } : { info: 'Enviamos um link para redefinir a senha no seu e-mail.' }); }
        catch (e) { res({ err: 'Sem conexão. Tente de novo.' }); }
      });
    });
  };
  FG.signOut = function () {
    return new Promise(function (res) {
      FG.ready(async function (sb) { try { await sb.auth.signOut(); } catch (e) { } FG.user = null; emit(); res(); });
    });
  };

  /* ---- save na nuvem (tabela fg_saves) ---- */
  FG.cloudSave = async function (data) {
    if (!FG.sb || !FG.user) return false;
    var r = await FG.sb.from('fg_saves').upsert({ user_id: FG.user.id, game: FG.game, data: JSON.parse(JSON.stringify(data)), updated_at: new Date().toISOString() });
    FG.status = r.error ? 'Não salvou na nuvem' : 'Salvo na nuvem'; renderBars();
    return !r.error;
  };
  FG.cloudLoad = async function () {
    if (!FG.sb || !FG.user) return null;
    var r = await FG.sb.from('fg_saves').select('data').eq('user_id', FG.user.id).eq('game', FG.game).maybeSingle();
    return r.error || !r.data ? null : r.data.data;
  };
  var pushT = null;
  FG.schedulePush = function (getData) { if (!FG.user) return; clearTimeout(pushT); pushT = setTimeout(function () { FG.cloudSave(getData()); }, 1800); };

  /* ---- ranking (funcoes fg_reportar / fg_top) ---- */
  FG.report = async function (pontos, venceu) {
    if (!FG.sb || !FG.user) return { err: 'login' };
    var r = await FG.sb.rpc('fg_reportar', { p_game: FG.game, p_pontos: Math.max(0, Math.min(100, Math.round(pontos))), p_vitoria: !!venceu, p_nome: FG.nome() });
    return r.error ? { err: r.error.message } : {};
  };
  FG.top = async function (n) {
    return new Promise(function (res) {
      FG.ready(async function (sb) {
        var r = await sb.rpc('fg_top', { p_game: FG.game, p_limite: n || 50 });
        res(r.error ? [] : (r.data || []));
      });
    });
  };

  /* ---- interface: barra de conta + janela de login ---- */
  var css = '.fgbar{display:flex;align-items:center;gap:8px;font:600 13px system-ui,sans-serif;color:inherit}' +
    '.fgbar button{font:inherit;font-weight:700;background:#FF8A3D;color:#1A1209;border:0;border-radius:8px;padding:7px 12px;cursor:pointer}' +
    '.fgbar .fgsub{background:transparent;color:inherit;border:1px solid rgba(255,255,255,.35)}' +
    '.fgbar .fgst{opacity:.7;font-weight:500}' +
    '.fgmod{position:fixed;inset:0;z-index:200;background:rgba(5,8,15,.78);display:grid;place-items:center;padding:16px;font-family:system-ui,sans-serif}' +
    '.fgmod .fgbox{background:#171c2b;color:#eef1f7;border:1px solid #2b3447;border-radius:14px;padding:20px;width:min(380px,100%);display:grid;gap:10px}' +
    '.fgmod h3{margin:0;font-size:20px}.fgmod p{margin:0;color:#9aa5ba;font-size:14px}' +
    '.fgmod input{font:inherit;padding:11px 12px;border-radius:9px;border:1px solid #34405a;background:#0f1320;color:#fff;width:100%}' +
    '.fgmod .fgrow{display:flex;gap:8px;flex-wrap:wrap}.fgmod .fgrow button{flex:1;font:inherit;font-weight:700;border:0;border-radius:9px;padding:11px;cursor:pointer;background:#FF8A3D;color:#1A1209}' +
    '.fgmod .fgrow .alt{background:#2b3447;color:#eef1f7}.fgmod .fgmsg{min-height:18px;color:#ffc83d;font-size:13px}.fgmod .lnk{background:none;border:0;color:#9aa5ba;font:inherit;font-size:13px;text-align:left;cursor:pointer;padding:0;text-decoration:underline}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var bars = [];
  FG.mountBar = function (el) { bars.push(el); renderBars(); };
  function renderBars() {
    bars.forEach(function (el) {
      if (FG.user) el.innerHTML = '<div class="fgbar"><span>👤 ' + FG.nome() + '</span><span class="fgst">' + (FG.status || '') + '</span><button class="fgsub" data-fg="out">Sair</button></div>';
      else el.innerHTML = '<div class="fgbar"><button data-fg="in">Entrar / criar conta</button></div>';
      var b = el.querySelector('[data-fg]');
      if (b) b.onclick = function () { if (b.dataset.fg === 'in') FG.openAuth(); else FG.signOut(); };
    });
  }
  FG.openAuth = function (msg) {
    if (document.querySelector('.fgmod')) return;
    var m = document.createElement('div'); m.className = 'fgmod';
    m.innerHTML = '<div class="fgbox"><h3>Sua conta</h3><p>' + (msg || 'Entre para salvar o jogo na nuvem e aparecer no ranking.') + '</p>' +
      '<input id="fgE" type="email" placeholder="E-mail" autocomplete="email" maxlength="80"><input id="fgP" type="password" placeholder="Senha (mínimo 6 caracteres)" autocomplete="current-password" maxlength="72">' +
      '<div class="fgmsg" id="fgM"></div><div class="fgrow"><button id="fgIn">Entrar</button><button class="alt" id="fgUp">Criar conta</button></div>' +
      '<button class="lnk" id="fgF">Esqueci a senha</button><button class="lnk" id="fgX">Fechar</button></div>';
    document.body.appendChild(m);
    var $ = function (i) { return m.querySelector('#' + i); }, say = function (t) { $('fgM').textContent = t || ''; };
    $('fgX').onclick = function () { m.remove(); };
    $('fgIn').onclick = async function () {
      var e = $('fgE').value.trim(), p = $('fgP').value; if (!e || !p) return say('Preencha e-mail e senha.');
      say('Aguarde...'); var r = await FG.signIn(e, p); if (r.err) say(r.err); else m.remove();
    };
    $('fgUp').onclick = async function () {
      var e = $('fgE').value.trim(), p = $('fgP').value; if (!e || !p) return say('Preencha e-mail e senha.');
      if (p.length < 6) return say('A senha precisa ter pelo menos 6 caracteres.');
      say('Aguarde...'); var r = await FG.signUp(e, p); if (r.err) say(r.err); else if (r.info) say(r.info); else m.remove();
    };
    $('fgF').onclick = async function () {
      var e = $('fgE').value.trim(); if (!e) return say('Digite seu e-mail acima e toque de novo.');
      say('Aguarde...'); var r = await FG.forgot(e); say(r.err || r.info);
    };
  };

  /* ---- ranking em tela: FG.showRanking(titulo) ---- */
  FG.showRanking = async function (titulo) {
    var m = document.createElement('div'); m.className = 'fgmod';
    m.innerHTML = '<div class="fgbox" style="max-height:88vh;overflow:auto"><h3>' + (titulo || 'Ranking geral') + '</h3><p>Pontos acumulados de todas as partidas.</p><div id="fgR" style="font-size:14px">Carregando...</div><button class="lnk" id="fgX">Fechar</button></div>';
    document.body.appendChild(m); m.querySelector('#fgX').onclick = function () { m.remove(); };
    var rows = await FG.top(50), el = m.querySelector('#fgR');
    if (!rows.length) { el.textContent = 'Ninguém no ranking ainda. Seja o primeiro!'; return; }
    el.innerHTML = '<table style="width:100%;border-collapse:collapse"><tr style="color:#9aa5ba;text-align:left"><th>#</th><th>Jogador</th><th style="text-align:right">Pontos</th><th style="text-align:right">V</th></tr>' +
      rows.map(function (r) {
        return '<tr style="' + (r.eu ? 'background:rgba(255,138,61,.18);font-weight:700' : '') + '"><td style="padding:5px 4px">' + r.posicao + '</td><td>' + String(r.nome).replace(/[<>&]/g, '') + '</td><td style="text-align:right">' + r.pontos + '</td><td style="text-align:right">' + r.vitorias + '</td></tr>';
      }).join('') + '</table>';
  };
})();
