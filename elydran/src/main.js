// Início do jogo: tela, laço principal em passo fixo e ajustes de tamanho
import { VIEW_W, VIEW_H } from './config.js';
import { Input } from './core/input.js';
import { Game } from './scenes/game.js';
import { Audio } from './systems/audio.js';

const cv = document.getElementById('game'), ctx = cv.getContext('2d');
cv.width = VIEW_W; cv.height = VIEW_H; ctx.imageSmoothingEnabled = false;

const input = new Input();
input.bindTouch(document.getElementById('touch'));
const game = new Game(input);
window.__elydran = game; // ajuda nos testes pelo console

// o som só pode começar depois de um toque ou tecla
const unlock = () => { Audio.init(); if (game.mode === 'title') Audio.playIntro(); };
addEventListener('pointerdown', unlock, { once: false }); addEventListener('keydown', unlock, { once: false });

// salva automaticamente ao sair ou trocar de aba
addEventListener('pagehide', () => { if (game.mode !== 'title' && !game.boss) game.saveGame(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode === 'play') { if (!game.boss) game.saveGame(true); game.openOverlay('pause'); } });

let last = performance.now(), acc = 0; const STEP = 1 / 60;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  let n = 0; while (acc >= STEP && n < 5) { game.update(STEP); acc -= STEP; n++; }
  if (n === 5) acc = 0;
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
