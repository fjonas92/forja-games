/* Google Analytics 4 da Falzinho Games, com Modo de Consentimento:
   antes de a pessoa aceitar o aviso de cookies, nenhum cookie de estatística é gravado
   (o Google recebe só sinais anônimos, sem identificador). Depois do "Entendi", a medição fica completa. */
(function () {
  var ID = 'G-530W6CNWJR', KEY = 'forja_cookie_ok', ok = false;
  try { ok = !!localStorage.getItem(KEY); } catch (e) {}
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', { analytics_storage: ok ? 'granted' : 'denied', wait_for_update: 500 });
  gtag('js', new Date());
  gtag('config', ID);
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  // quando a pessoa clica em "Entendi" no aviso de cookies
  document.addEventListener('click', function (e) { if (e.target && e.target.id === 'ck-ok') gtag('consent', 'update', { analytics_storage: 'granted' }); });
})();
