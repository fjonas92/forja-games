/* Página "Jogar" da Falzinho Games: mostra o jogo dentro do site e mede quem joga e por quanto tempo.
   Eventos enviados ao Google Analytics 4 (respeitando o aviso de cookies):
   game_open (abriu a página do jogo), game_loaded (o jogo carregou), game_time (a cada 30 s de jogo com a aba visível, value = segundos)
   e game_close (ao sair, com o total de segundos jogados). No GA4: Relatórios > Engajamento > Eventos, filtrando por game_name. */
(function () {
  var box = document.getElementById('jogo');
  if (!box) return;
  var nome = box.getAttribute('data-nome'), slug = box.getAttribute('data-slug');
  var frame = document.getElementById('frame'), load = document.getElementById('carregando');
  var total = 0, tick = 0, fechou = false;
  function ev(name, extra) {
    try { var p = { game_name: nome, game_slug: slug }; for (var k in extra) p[k] = extra[k]; window.gtag && window.gtag('event', name, p); } catch (e) {}
  }
  ev('game_open');
  frame.addEventListener('load', function () { load.hidden = true; ev('game_loaded'); });
  /* conta o tempo só com a aba aberta e visível */
  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    total += 1; tick += 1;
    if (tick >= 30) { tick = 0; ev('game_time', { value: 30, total_seconds: total }); }
  }, 1000);
  function sair() { if (fechou) return; fechou = true; if (total > 0) ev('game_close', { value: total, total_seconds: total, transport_type: 'beacon' }); }
  window.addEventListener('pagehide', sair);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && total > 0) { ev('game_pause', { total_seconds: total, transport_type: 'beacon' }); } });
  var fs = document.getElementById('tela-cheia');
  if (fs) fs.addEventListener('click', function () {
    try { if (document.fullscreenElement) document.exitFullscreen(); else box.requestFullscreen(); } catch (e) {}
    ev('game_fullscreen');
  });
})();
