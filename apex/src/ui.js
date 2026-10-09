// Menus em DOM (teclado, joystick e toque navegam do mesmo jeito).
import { CIRCUITS, TEAMS, NATIONS, HELMETS, SPONSORS, THEMES, UPGRADES, MAX_UPG, POINTS } from './data.js';
import { COLORS, standings, upgradeCost, fmtTime, teamList, buildEntries } from './career.js';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (v, a = 0.9, b = 1.08) => Math.max(0.06, Math.min(1, (v - a) / (b - a)));
const DIFFN = ['', 'Fácil', 'Média', 'Difícil', 'Extrema'];

export class UI {
  constructor(root, app) {
    this.root = root; this.app = app; this.screen = ''; this.cur = null; this.curId = null;
    root.addEventListener('click', e => this.onClick(e));
    root.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.txt) app.setText(t.dataset.txt, t.value); });
    root.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('.nav'); if (t) this.setCur(t, false); });
  }

  setCur(el, focus = true) {
    if (this.cur && this.cur !== el) this.cur.classList.remove('focus');
    this.cur = el; this.curId = el.dataset.id || null; el.classList.add('focus');
    if (focus && document.activeElement !== el) { try { el.focus({ preventScroll: true }); } catch (_) { } }
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) { }
    if (el.dataset.pv) this.app.previewTeam(el.dataset.pv);
  }

  navEls() { return [...this.root.querySelectorAll('.nav')].filter(e => e.offsetParent !== null && !e.disabled); }

  navigate(dir) {
    const els = this.navEls(); if (!els.length) return;
    let cur = this.cur && els.includes(this.cur) ? this.cur : null;
    if (!cur) { this.setCur(els[0]); return; }
    if ((dir === 'left' || dir === 'right') && cur.classList.contains('cyc')) { this.app.cycle(cur.dataset.k, dir === 'left' ? -1 : 1); this.render(); return; }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bs = 1e9;
    for (const el of els) {
      if (el === cur) continue;
      const q = el.getBoundingClientRect(), ex = q.left + q.width / 2, ey = q.top + q.height / 2, dx = ex - cx, dy = ey - cy;
      let prim, sec;
      if (dir === 'down') { if (dy < r.height * 0.3) continue; prim = dy; sec = Math.abs(dx); }
      else if (dir === 'up') { if (-dy < r.height * 0.3) continue; prim = -dy; sec = Math.abs(dx); }
      else if (dir === 'right') { if (dx < r.width * 0.25) continue; prim = dx; sec = Math.abs(dy); }
      else { if (-dx < r.width * 0.25) continue; prim = -dx; sec = Math.abs(dy); }
      const s = prim + sec * 2.4;
      if (s < bs) { bs = s; best = el; }
    }
    if (best) this.setCur(best);
  }
  confirm() { if (this.cur && this.cur.isConnected) this.cur.click(); }

  onClick(e) {
    const a = e.target.closest('[data-act]');
    const cyc = e.target.closest('.cyc');
    if (cyc && (!a || a.dataset.act !== 'cyc')) { this.app.cycle(cyc.dataset.k, 1); this.render(); this.app.sfx.tick(); return; }
    if (!a) return;
    this.app.sfx.start && this.app.sfx.start();
    if (a.dataset.act === 'cyc') { this.app.cycle(a.dataset.k, +a.dataset.d); this.render(); this.app.sfx.tick(); return; }
    this.app.act(a.dataset.act, a.dataset, a);
  }

  // ---------- render ----------
  go(name, data) { this.screen = name; this.data = data || this.data; this.cur = null; this.render(true); }
  clear() { this.root.innerHTML = ''; this.screen = ''; this.cur = null; }
  render(first) {
    const fn = this['s_' + this.screen]; if (!fn) { this.root.innerHTML = ''; return; }
    const keep = this.curId, sc = this.root.querySelector('.panel') ? this.root.querySelector('.panel').scrollTop : 0;
    this.root.innerHTML = fn.call(this);
    const p = this.root.querySelector('.panel'); if (p) p.scrollTop = sc;
    const els = this.navEls();
    let t = keep && els.find(e => e.dataset.id === keep);
    if (!t) t = els.find(e => e.dataset.def !== undefined) || els[0];
    if (t && (first || keep)) this.setCur(t, !first || this.app.input.lastDevice !== 'touch');
    if (this.after) this.after();
    this.app.onScreen && this.app.onScreen(this.screen);
  }

  // helpers
  cyc(k, id) { return `<div class="cyc nav" tabindex="0" data-id="${id || k}" data-k="${k}"><button data-act="cyc" data-k="${k}" data-d="-1" tabindex="-1" type="button">&#8249;</button><span>${esc(this.app.optText(k))}</span><button data-act="cyc" data-k="${k}" data-d="1" tabindex="-1" type="button">&#8250;</button></div>`; }
  btn(act, text, cls = '', extra = '', id) { return `<button class="btn nav ${cls}" type="button" data-act="${act}" data-id="${id || act + (extra.match(/data-v="([^"]*)"/) || [, ''])[1]}" ${extra}>${text}</button>`; }
  swatches(key, cur) { return `<div class="sw">${COLORS.map(c => `<button class="nav ${c === cur ? 'sel' : ''}" type="button" data-act="col" data-k="${key}" data-v="${c}" data-id="${key}${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>`; }
  pips(n) { return `<span class="pips">${Array.from({ length: MAX_UPG }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; }
  teamBars(t) {
    const rows = [['Motor', t.power], ['Aero', t.aero], ['Pneus', t.grip], ['Freios', t.brake]];
    return `<div class="bars">${rows.map(r => `<span>${r[0]}</span><div class="bar2"><i style="width:${Math.round(norm(r[1]) * 100)}%"></i></div>`).join('')}</div>`;
  }

  // ---------- telas ----------
  s_title() {
    const a = this.app, hasSave = !!a.career;
    const dev = a.input.lastDevice;
    const hint = dev === 'pad' ? 'Joystick detectado: direcional para navegar, A confirma, B volta.' : dev === 'touch' ? 'Toque nas opções. Gire o celular e use tela cheia para jogar melhor.' : 'Use as setas e Enter, o mouse ou conecte um joystick.';
    return `<div class="panel left">
      <div class="big-logo">APEX</div><div class="sub">CAMPEONATO MUNDIAL DE VELOCIDADE</div>
      ${hasSave ? this.btn('continue', 'Continuar carreira', 'primary', 'data-def') : ''}
      ${hasSave ? this.btn('newcareer', 'Nova carreira') : this.btn('newcareer', 'Iniciar carreira', 'primary', 'data-def')}
      ${this.btn('quick', 'Corrida rápida')}
      ${this.btn('settings', 'Opções')}
      ${this.btn('account', a.cloud.user ? 'Minha conta (salvando na nuvem)' : 'Criar conta para salvar o jogo')}
      ${this.btn('help', 'Controles')}
      <div class="hint">${hint}</div></div>`;
  }

  s_account() {
    const cl = this.app.cloud, st = cl.status ? `<div class="hint">${esc(cl.status)}</div>` : '';
    if (cl.user) {
      return `<div class="panel">
        <h2 class="t">Minha conta</h2>
        <p>Logado como <b>${esc(cl.user.email || '')}</b></p>
        <p class="hint">Sua carreira é salva na nuvem a cada corrida e compra. Entre com a mesma conta em outro aparelho para continuar de onde parou.</p>
        ${st}<div class="hint" id="acMsg"></div>
        ${this.app.career ? this.btn('savenow', 'Salvar agora', 'primary', 'data-def') : ''}
        ${this.btn('logout', 'Sair da conta')}
        ${this.btn('back', 'Voltar', '', this.app.career ? '' : 'data-def')}</div>`;
    }
    return `<div class="panel">
      <h2 class="t">Conta</h2>
      <p class="hint">Crie uma conta (a mesma do site Falzinho Games) para guardar sua carreira na nuvem e continuar em qualquer aparelho.</p>
      <div class="lbl">E-mail</div><input class="txt nav" id="acEmail" data-id="acEmail" type="email" maxlength="80" autocomplete="email" spellcheck="false">
      <div class="lbl">Senha (mínimo 6 caracteres)</div><input class="txt nav" id="acPass" data-id="acPass" type="password" maxlength="72" autocomplete="current-password">
      <div class="hint" id="acMsg">${esc(cl.status)}</div>
      ${this.btn('login', 'Entrar', 'primary', 'data-def')}
      ${this.btn('signup', 'Criar conta')}
      ${this.btn('forgot', 'Esqueci a senha')}
      ${this.btn('back', 'Voltar')}</div>`;
  }

  s_help() {
    return `<div class="panel">
      <h2 class="t">Controles</h2>
      <table class="tb">
        <tr><th>Ação</th><th>Teclado</th><th>Joystick</th></tr>
        <tr><td>Virar</td><td><span class="kbd">←</span> <span class="kbd">→</span> ou A D</td><td>Analógico</td></tr>
        <tr><td>Acelerar</td><td><span class="kbd">↑</span> ou W</td><td>RT / R2 ou A</td></tr>
        <tr><td>Frear</td><td><span class="kbd">↓</span> S Espaço</td><td>LT / L2 ou X</td></tr>
        <tr><td>Câmera</td><td>C</td><td>Y</td></tr>
        <tr><td>Pausa</td><td>P / Esc</td><td>Start</td></tr>
        <tr><td>Reposicionar</td><td>R</td><td>Select</td></tr>
      </table>
      <p class="hint">No celular: ◀ ▶ viram o carro, ACELERA e FREIO ficam à direita. Nas opções dá para ligar o acelerador automático e virar o carro inclinando o aparelho.</p>
      <p class="hint">Dica: atrás de outro carro você pega a aspiração e ganha velocidade. Pneus gastam em curvas fortes, freadas e na grama.</p>
      ${this.btn('back', 'Voltar', '', 'data-def')}</div>`;
  }

  s_settings() {
    return `<div class="panel">
      <h2 class="t">Opções</h2>
      <div class="lbl">Qualidade gráfica</div>${this.cyc('quality')}
      <div class="lbl">Dificuldade da IA</div>${this.cyc('diff')}
      <div class="lbl">Som</div>${this.cyc('sound')}
      <div class="lbl">Acelerar automaticamente (celular)</div>${this.cyc('auto')}
      <div class="lbl">Virar inclinando o celular</div>${this.cyc('tilt')}
      <div class="lbl">Câmera inicial</div>${this.cyc('cam')}
      <div class="lbl">Unidade de velocidade</div>${this.cyc('unit')}
      <div class="lbl">Botões na tela</div>${this.cyc('touch')}
      ${this.btn('back', 'Voltar', 'primary', 'data-def')}</div>`;
  }

  // ----- corrida rapida
  s_quick() {
    const a = this.app, q = a.quick;
    const cards = CIRCUITS.map((c, i) => `<button class="card nav ${i === q.circuit ? 'sel' : ''}" type="button" data-act="pickcircuit" data-v="${i}" data-id="ck${i}" ${i === q.circuit ? 'data-def' : ''}>
      <b>${esc(c.name)}</b><small><span class="dot" style="background:${THEMES[c.theme].sky[0]}"></span>${c.country} · ${(c.len / 1000).toFixed(1)} km · ${DIFFN[c.diff]}</small><canvas width="112" height="80" data-ol="${i}"></canvas></button>`).join('');
    return `<div class="panel wide" style="width:62%">
      <h2 class="t">Corrida rápida</h2>
      <div class="grid" style="grid-template-columns:repeat(3,1fr)">${cards}</div>
      <div class="row" style="margin-top:8px">
        <div><div class="lbl">Voltas</div>${this.cyc('qlaps')}</div>
        <div><div class="lbl">Dificuldade</div>${this.cyc('diff')}</div>
        <div><div class="lbl">Equipe</div>${this.cyc('qteam')}</div>
      </div>
      <div class="row" style="margin-top:6px">${this.btn('back', 'Voltar')}${this.btn('qstart', 'Largar!', 'primary')}</div></div>`;
  }

  // ----- carreira: piloto
  s_pilot() {
    const d = this.app.draft.pilot;
    return `<div class="panel">
      <h2 class="t">Seu piloto</h2>
      <div class="lbl">Nome</div><input class="txt nav" data-id="name" data-txt="name" maxlength="14" value="${esc(d.name)}" autocomplete="off" spellcheck="false">
      <div class="row"><div><div class="lbl">Nacionalidade</div>${this.cyc('nat')}</div><div><div class="lbl">Número</div>${this.cyc('num')}</div></div>
      <div class="lbl">Capacete: cor principal</div>${this.swatches('h1', d.h1)}
      <div class="lbl">Capacete: cor da faixa</div>${this.swatches('h2', d.h2)}
      <div class="lbl">Estilo</div>${this.cyc('hs')}
      ${this.btn('back', 'Voltar', '', '', 'back')}
      ${this.btn('pilotnext', 'Escolher equipe', 'primary', 'data-def')}</div>`;
  }

  // ----- carreira: equipes
  s_teams() {
    const a = this.app, dr = a.draft;
    const cards = TEAMS.map((t, i) => {
      const last = i === TEAMS.length - 1;
      return `<button class="card nav ${dr.teamId === t.id ? 'sel' : ''}" type="button" data-act="pickteam" data-v="${t.id}" data-pv="${t.id}" data-id="t${t.id}" ${i === 0 ? 'data-def' : ''}>
        <b><span class="dot" style="background:${t.c1}"></span>${esc(t.name)}</b><small>${esc(t.drivers[0])} + você</small>${this.teamBars(t)}</button>`;
    }).join('');
    return `<div class="panel" style="width:55%">
      <h2 class="t">Escolha sua equipe</h2>
      <div class="grid" style="grid-template-columns:repeat(2,1fr)">${cards}
        <button class="card nav ${dr.teamId === 'custom' ? 'sel' : ''}" type="button" data-act="pickteam" data-v="custom" data-pv="custom" data-id="tcustom" style="grid-column:1/3"><b>+ Criar equipe própria</b><small>Entra no lugar da equipe mais fraca. Menos potência no início, mas é você quem manda.</small></button></div>
      ${dr.teamId === 'custom' ? `<div class="lbl">Nome da equipe</div><input class="txt nav" data-id="tname" data-txt="tname" maxlength="18" value="${esc(dr.tname)}" autocomplete="off" spellcheck="false">` : ''}
      <div class="row" style="margin-top:8px">${this.btn('back', 'Voltar')}${this.btn('teamok', 'Começar carreira', 'primary', dr.teamId ? '' : 'disabled')}</div></div>`;
  }

  // ----- hub da carreira
  s_hub() {
    const a = this.app, c = a.career, t = a.playerTeamObj(), ci = CIRCUITS[Math.min(c.round, CIRCUITS.length - 1)];
    const st = standings(c, a.careerEntries());
    const pi = st.drivers.findIndex(x => x.isPlayer) + 1;
    return `<div class="panel">
      <h2 class="t">Temporada ${c.season}</h2>
      <div class="sub"><span class="dot" style="background:${t.c1}"></span>${esc(c.pilot.name)} #${c.pilot.number} · ${esc(t.name)}</div>
      <div class="card" style="cursor:default;margin-bottom:8px"><small>PRÓXIMA CORRIDA · ETAPA ${c.round + 1} DE ${CIRCUITS.length}</small>
        <b style="font-size:calc(var(--u)*24px)">${esc(ci.name)}</b><small><span class="dot" style="background:${THEMES[ci.theme].sky[0]}"></span>${ci.country} · ${(ci.len / 1000).toFixed(1)} km · ${a.settings.laps} voltas</small><canvas width="112" height="80" data-ol="${CIRCUITS.indexOf(ci)}" style="width:calc(var(--u)*90px);height:calc(var(--u)*64px)"></canvas></div>
      <div class="row"><div><small class="sub">Posição</small><br><b class="gold" style="font-size:calc(var(--u)*26px)">${pi}º</b> <small class="sub">${(c.pts.player || 0)} pts</small></div>
        <div><small class="sub">Créditos</small><br><b class="gold" style="font-size:calc(var(--u)*26px)">${c.credits}</b></div>
        <div><small class="sub">Vitórias</small><br><b style="font-size:calc(var(--u)*26px)">${c.wins}</b> <small class="sub">· ${c.titles} título(s)</small></div></div>
      ${this.btn('race', 'Largar!', 'primary', 'data-def')}
      ${this.btn('garage', 'Garagem e evolução')}
      ${this.btn('standings', 'Classificação')}
      ${this.btn('settings', 'Opções')}
      ${this.btn('account', this.app.cloud.user ? 'Minha conta (nuvem)' : 'Criar conta / salvar na nuvem')}
      ${this.btn('menu', 'Salvar e sair')}</div>`;
  }

  // ----- garagem
  s_garage() {
    const a = this.app, c = a.career, tab = a.garageTab;
    const tabs = [['paint', 'Pintura'], ['spons', 'Patrocínio'], ['setup', 'Asas'], ['upg', 'Evolução']];
    let body = '';
    if (tab === 'paint') body = `<div class="lbl">Cor principal</div>${this.swatches('c1', c.car.c1)}<div class="lbl">Cor secundária</div>${this.swatches('c2', c.car.c2)}`;
    else if (tab === 'spons') body = `<div class="lbl">Patrocinador 1</div>${this.cyc('sp0')}<div class="lbl">Patrocinador 2</div>${this.cyc('sp1')}`;
    else if (tab === 'setup') body = `<div class="lbl">Ajuste das asas</div>${this.cyc('wing')}<p class="hint">Mais asa gruda o carro nas curvas rápidas, mas perde velocidade final. Menos asa é bom em pistas com retas longas.</p>`;
    else body = `<div class="sub">Créditos: <b class="gold">${c.credits}</b></div>` + UPGRADES.map(u => {
      const lv = c.upg[u.id], cost = upgradeCost(c, u.id);
      return `<div class="card" style="cursor:default;margin-bottom:6px"><b>${u.name} ${this.pips(lv)}</b><small>${u.desc}</small><div style="margin-top:4px">${cost == null ? '<span class="pill">MÁXIMO</span>' : this.btn('buy', `Evoluir · ${cost}`, 'small', `data-v="${u.id}" ${c.credits < cost ? 'disabled' : ''}`)}</div></div>`;
    }).join('');
    return `<div class="panel">
      <h2 class="t">Garagem</h2>
      <div class="tabs">${tabs.map(t => `<button class="btn nav ${tab === t[0] ? 'sel' : ''}" type="button" data-act="gtab" data-v="${t[0]}" data-id="gt${t[0]}">${t[1]}</button>`).join('')}</div>
      ${body}
      ${this.btn('back', 'Voltar', 'primary', '', 'back')}</div>`;
  }

  s_standings() {
    const a = this.app, c = a.career, st = standings(c, a.careerEntries()), tab = a.stTab;
    const rows = tab === 'd'
      ? st.drivers.map((d, i) => `<tr class="${d.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot" style="background:${d.c1}"></span>${esc(d.name)}</td><td>${esc(d.team)}</td><td class="r">${d.pts}</td></tr>`).join('')
      : st.teams.map((d, i) => `<tr class="${d.id === c.team ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot" style="background:${d.c1}"></span>${esc(d.name)}</td><td></td><td class="r">${d.pts}</td></tr>`).join('');
    return `<div class="panel">
      <h2 class="t">Classificação</h2>
      <div class="tabs"><button class="btn nav ${tab === 'd' ? 'sel' : ''}" type="button" data-act="sttab" data-v="d" data-id="std">Pilotos</button><button class="btn nav ${tab === 't' ? 'sel' : ''}" type="button" data-act="sttab" data-v="t" data-id="stt">Equipes</button></div>
      <table class="tb"><tr><th>#</th><th>${tab === 'd' ? 'Piloto' : 'Equipe'}</th><th>${tab === 'd' ? 'Equipe' : ''}</th><th class="r">Pts</th></tr>${rows}</table>
      ${this.btn('back', 'Voltar', 'primary', 'data-def')}</div>`;
  }

  s_pause() {
    return `<div class="panel center" style="width:36%"><h2 class="t">Pausa</h2>
      ${this.btn('resume', 'Continuar', 'primary', 'data-def')}${this.btn('restart', 'Reiniciar corrida')}${this.btn('settings', 'Opções')}${this.btn('quit', 'Sair da corrida')}</div>`;
  }

  s_results() {
    const a = this.app, R = a.result, rk = R.ranking, win = rk[0];
    const lapsT = a.race ? a.race.laps : 0;
    const rows = rk.map((c, i) => {
      let tm;
      if (c.finished) tm = i === 0 ? fmtTime(c.finishTime) : '+' + (c.finishTime - win.finishTime).toFixed(3);
      else tm = lapsT - c.lap > 0 && c.lap < lapsT ? '+' + (lapsT - c.lap) + ' volta' + (lapsT - c.lap > 1 ? 's' : '') : '--';
      const pts = R.career ? (POINTS[i] || 0) : '';
      return `<tr class="${c.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot" style="background:${c.c1}"></span>${esc(c.name)}</td><td>${esc(c.tag)}</td><td class="r">${tm}</td><td class="r">${c.best ? fmtTime(c.best) : '--'}</td>${R.career ? `<td class="r">${pts}</td>` : ''}</tr>`;
    }).join('');
    const me = rk.findIndex(c => c.isPlayer) + 1;
    const head = me === 1 ? 'VITÓRIA!' : me <= 3 ? 'PÓDIO!' : 'Fim da corrida';
    const extra = R.career ? `<div class="sub">${me}º lugar · <b class="gold">+${R.career.pts} pts</b> · <b class="gold">+${R.career.credits} créditos</b>${R.season ? `<br><b class="gold">${R.season.champ ? 'CAMPEÃO DA TEMPORADA! ' : 'Fim da temporada: ' + R.season.pos + 'º lugar. '}Bônus +${R.season.bonus}</b>` : ''}</div>` : `<div class="sub">${me}º lugar</div>`;
    return `<div class="panel wide" style="width:68%;left:2.5%">
      <h2 class="t">${head}</h2>${extra}
      <table class="tb"><tr><th>#</th><th>Piloto</th><th>Equipe</th><th class="r">Tempo</th><th class="r">Melhor volta</th>${R.career ? '<th class="r">Pts</th>' : ''}</tr>${rows}</table>
      <div class="row" style="margin-top:8px">${R.career ? this.btn('resultok', 'Continuar', 'primary', 'data-def') : this.btn('again', 'Correr de novo', 'primary', 'data-def') + this.btn('resultok', 'Menu')}</div></div>`;
  }

  // desenhos dos tracados
  after() {
    for (const cv of this.root.querySelectorAll('canvas[data-ol]')) {
      const t = this.app.getTrack(+cv.dataset.ol); if (!t) continue;
      const g = cv.getContext('2d'), W = cv.width, H = cv.height;
      let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
      for (let i = 0; i < t.n; i++) { minx = Math.min(minx, t.x[i]); maxx = Math.max(maxx, t.x[i]); minz = Math.min(minz, t.z[i]); maxz = Math.max(maxz, t.z[i]); }
      const s = Math.min((W - 12) / (maxx - minx), (H - 12) / (maxz - minz)), ox = (W - (maxx - minx) * s) / 2, oz = (H - (maxz - minz) * s) / 2;
      g.clearRect(0, 0, W, H); g.lineWidth = 6; g.lineJoin = 'round'; g.strokeStyle = '#e8edff'; g.beginPath();
      for (let i = 0; i <= t.n; i += 3) { const k = i % t.n, px = ox + (t.x[k] - minx) * s, py = oz + (t.z[k] - minz) * s; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.stroke();
      g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(ox + (t.x[0] - minx) * s, oz + (t.z[0] - minz) * s, 6, 0, 7); g.fill();
    }
  }
}
