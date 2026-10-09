// Início do jogo: tela, laço principal em passo fixo, modo 3D (com volta para o 2D) e ajustes de tamanho
import { VIEW_W, VIEW_H } from './config.js';
import { Input } from './core/input.js';
import { Game } from './scenes/game.js';
import { Audio } from './systems/audio.js';
import { Effects } from './systems/combat.js';

const cv = document.getElementById('game'), ctx = cv.getContext('2d'), stage = document.getElementById('stage'), btnGfx = document.getElementById('btnGfx'), padStatus = document.getElementById('padstatus');
cv.width = VIEW_W; cv.height = VIEW_H; ctx.imageSmoothingEnabled = false;

const input = new Input();
input.bindTouch(document.getElementById('touch'));
const game = new Game(input);
window.__elydran = game; // ajuda nos testes pelo console

/* ---------- 3D (carrega sob demanda; se falhar, o jogo segue em 2D) ---------- */
let want3d = true; try { want3d = localStorage.getItem('elydran_gfx') !== '2d'; } catch (e) {}
let r3d = null, loading = null, failed = false;
const ensure3d = () => {
  if (r3d || loading || failed) return;
  loading = import('./gfx/render3d.js').then(mod => { r3d = new mod.Renderer3D(document.getElementById('game3d')); })
    .catch(e => { failed = true; console.warn('3D indisponível, usando o modo 2D:', e); game.toast('3D indisponível neste aparelho, usando 2D', '#ffb03a', 4); })
    .finally(() => { loading = null; refreshGfx(); });
};
const active3d = () => want3d && r3d && !failed;
const refreshGfx = () => { btnGfx.textContent = want3d && !failed ? '3D' : '2D'; btnGfx.setAttribute('aria-pressed', String(want3d && !failed)); };
game.gfx = {
  is3d: () => want3d && !failed,
  toggle: () => { want3d = !want3d; try { localStorage.setItem('elydran_gfx', want3d ? '3d' : '2d'); } catch (e) {} if (want3d) ensure3d(); refreshGfx(); }
};
btnGfx.addEventListener('click', () => { game.gfx.toggle(); btnGfx.blur(); });
if (want3d) ensure3d();
refreshGfx();

/* ---------- controle: avisos de conectar e desconectar ---------- */
const padName = id => /xbox|045e/i.test(id) ? 'Xbox' : /playstation|dualshock|dualsense|054c/i.test(id) ? 'PlayStation' : /switch|057e/i.test(id) ? 'Switch' : 'genérico';
input.onPad = (on, id) => {
  if (on) { padStatus.innerHTML = '🎮 Controle conectado: <b>' + padName(id || '') + '</b>'; game.toast('Controle conectado', '#7ad94a', 3); }
  else { padStatus.textContent = 'Controle desconectado. Conecte de novo e aperte qualquer botão.'; game.toast('Controle desconectado', '#ff9a6a', 3.5); if (game.mode === 'play') game.openOverlay('pause'); }
};

// o som só pode começar depois de um toque ou tecla
const unlock = () => { Audio.init(); if (game.mode === 'title') Audio.playIntro(); };
addEventListener('pointerdown', unlock, { once: false }); addEventListener('keydown', unlock, { once: false });

// salva automaticamente ao sair ou trocar de aba
addEventListener('pagehide', () => { if (game.mode !== 'title' && !game.boss) game.saveGame(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode === 'play') { if (!game.boss) game.saveGame(true); game.openOverlay('pause'); } });

let last = performance.now(), acc = 0; const STEP = 1 / 60;
function frame(now) {
  const real = Math.min(0.1, (now - last) / 1000); acc += real; last = now;
  const use3d = active3d() && game.mode !== 'title' && !(game.mode === 'controls' && game.prevMode === 'title') && !!game.map;
  Effects.mode3d = use3d; input.rotate = use3d;
  let n = 0; while (acc >= STEP && n < 5) { game.update(STEP); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  let on = use3d;
  if (use3d) { try { r3d.sync(game, real); r3d.render(); } catch (e) { console.error('Erro no 3D, voltando ao 2D', e); failed = true; on = false; Effects.mode3d = false; input.rotate = false; refreshGfx(); game.toast('Erro no 3D, voltando ao 2D', '#ffb03a', 4); } }
  game.r3d = on ? r3d : null;
  if (stage.classList.contains('m3d') !== on) stage.classList.toggle('m3d', on);
  if (stage.dataset.dev !== input.lastDevice) stage.dataset.dev = input.lastDevice;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  game.draw(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// botão de tela cheia
const goFull = () => {
  const st = document.getElementById('stage');
  try { if (document.fullscreenElement) document.exitFullscreen(); else st.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {}
};
document.getElementById('btnFull').addEventListener('click', goFull);
document.getElementById('btnFull2').addEventListener('click', goFull);
document.fonts && document.fonts.load('bold 10px "Pixelify Sans"').catch(() => {});
