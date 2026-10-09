// Entrada: teclado, controle (Gamepad API) e toque, tudo convertido nas mesmas ações
const KEYS = {
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  attack: ['Space', 'KeyJ'], dodge: ['ShiftLeft', 'ShiftRight', 'KeyK'], interact: ['KeyE', 'Enter'], special: ['KeyQ', 'KeyL'],
  swap: ['Tab'], inventory: ['KeyI'], map: ['KeyM'], pause: ['Escape', 'KeyP'], back: ['Backspace', 'Escape']
};
// botões no padrão "standard" do navegador (Xbox: A B X Y · PlayStation: ✕ ○ □ △)
const PAD = { attack: [0], dodge: [1], interact: [2], special: [3], swap: [4, 5], inventory: [6, 7], map: [8], pause: [9], up: [12], down: [13], left: [14], right: [15], back: [1] };
const ACTIONS = Object.keys(KEYS);

export class Input {
  constructor() {
    this.keys = new Set(); this.held = {}; this.prev = {}; this.axis = { x: 0, y: 0 };
    this.touch = { x: 0, y: 0, btn: {} }; this.lastDevice = 'keyboard'; this.padName = '';
    ACTIONS.forEach(a => { this.held[a] = false; this.prev[a] = false; });
    try { if (matchMedia('(pointer: coarse)').matches) this.lastDevice = 'touch'; } catch (e) {}
    addEventListener('keydown', e => {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      this.keys.add(e.code); this.lastDevice = 'keyboard';
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('gamepadconnected', e => { this.padName = e.gamepad.id; this.lastDevice = 'gamepad'; this.connected = true; this.onPad && this.onPad(true, e.gamepad.id); });
    addEventListener('gamepaddisconnected', () => {
      const left = [...(navigator.getGamepads ? navigator.getGamepads() : [])].some(p => p && p.connected);
      if (!left) { this.connected = false; if (this.lastDevice === 'gamepad') this.lastDevice = 'keyboard'; this.onPad && this.onPad(false, ''); }
    });
    addEventListener('pointerdown', e => { if (e.pointerType === 'touch') this.lastDevice = 'touch'; });
    this.yaw = 0; this.zoomAxis = 0; this.rotate = false; this.connected = false; this.onPad = null;
  }
  // vibração do controle (quando o navegador permite)
  rumble(ms = 150, strong = 0.7, weak = 0.4) {
    if (this.lastDevice !== 'gamepad') return;
    try { for (const p of navigator.getGamepads()) { if (p && p.connected && p.vibrationActuator) { p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }); break; } } } catch (e) {}
  }
  // chamado uma vez por quadro, antes da lógica
  poll() {
    ACTIONS.forEach(a => { this.prev[a] = this.held[a]; this.held[a] = KEYS[a].some(k => this.keys.has(k)) || !!this.touch.btn[a]; });
    let camX = (this.keys.has('KeyC') ? 1 : 0) - (this.keys.has('KeyZ') ? 1 : 0), camY = 0;
    let ax = (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0), ay = (this.held.down ? 1 : 0) - (this.held.up ? 1 : 0);
    if (this.touch.x || this.touch.y) { ax = this.touch.x; ay = this.touch.y; }
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = i => i >= 0 && p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
      let any = false;
      ACTIONS.forEach(a => { if (PAD[a] && PAD[a].some(b)) { this.held[a] = true; any = true; } });
      const dz = (x, y, d = 0.2) => { const m = Math.hypot(x, y); if (m < d) return [0, 0]; const k = Math.min(1, (m - d) / (1 - d)) / m; return [x * k, y * k]; };
      const [sx, sy] = dz(p.axes[0] || 0, p.axes[1] || 0);
      if (sx || sy) { ax = sx; ay = sy; any = true; }
      if (p.mapping === 'standard' || p.axes.length >= 4) { const [cx, cy] = dz(p.axes[2] || 0, p.axes[3] || 0, 0.25); camX += cx; camY = cy; if (cx || cy) any = true; }
      if (b(12) || b(13) || b(14) || b(15)) { ax = (b(15) ? 1 : 0) - (b(14) ? 1 : 0); ay = (b(13) ? 1 : 0) - (b(12) ? 1 : 0); }
      // stick também navega nos menus
      if (sy < -0.6) this.held.up = true; if (sy > 0.6) this.held.down = true; if (sx < -0.6) this.held.left = true; if (sx > 0.6) this.held.right = true;
      if (any) { this.lastDevice = 'gamepad'; this.padName = p.id; }
      if (!this.connected) { this.connected = true; this.onPad && this.onPad(true, p.id); }
      break;
    }
    // câmera: gira com o analógico direito (ou Z / C) e o zoom com cima e baixo dele
    this.yaw += Math.max(-1, Math.min(1, camX)) * (1 / 60) * 2.2; if (this.yaw > Math.PI) this.yaw -= Math.PI * 2; else if (this.yaw < -Math.PI) this.yaw += Math.PI * 2; this.zoomAxis = camY;
    if (this.keys.has('KeyZ') && this.keys.has('KeyC')) this.yaw = 0;
    const l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; }
    // com a câmera girada, "para cima" é sempre para onde a câmera olha
    if (this.rotate && this.yaw) { const c = Math.cos(this.yaw), s = Math.sin(this.yaw), rx = ax * c + ay * s, ry = -ax * s + ay * c; ax = rx; ay = ry; }
    this.axis.x = ax; this.axis.y = ay;
  }
  pressed(a) { return this.held[a] && !this.prev[a]; }
  // rótulo do botão conforme o aparelho em uso, para as dicas na tela
  label(a) {
    const kb = { attack: 'Espaço', dodge: 'Shift', interact: 'E', special: 'Q', swap: 'Tab', inventory: 'I', map: 'M', pause: 'Esc', back: 'Esc' };
    const ps = /playstation|dualshock|dualsense|054c/i.test(this.padName);
    const gp = ps ? { attack: '✕', dodge: '○', interact: '□', special: '△', swap: 'L1/R1', inventory: 'L2/R2', map: 'Select', pause: 'Start', back: '○' }
      : { attack: 'A', dodge: 'B', interact: 'X', special: 'Y', swap: 'LB/RB', inventory: 'LT/RT', map: 'View', pause: 'Menu', back: 'B' };
    if (this.lastDevice === 'touch') return { attack: '⚔', dodge: '»', interact: '✋', special: '✦', swap: '⇄', inventory: '🎒', map: '🗺', pause: '❚❚', back: '✕' }[a];
    return (this.lastDevice === 'gamepad' ? gp : kb)[a];
  }
  // controles de toque (só aparecem em telas de toque)
  bindTouch(root) {
    const stick = root.querySelector('.stick'), knob = root.querySelector('.knob');
    let id = null, cx = 0, cy = 0;
    const move = (x, y) => { let dx = x - cx, dy = y - cy; const m = 44, l = Math.hypot(dx, dy); if (l > m) { dx *= m / l; dy *= m / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.touch.x = Math.abs(dx) > 8 ? dx / m : 0; this.touch.y = Math.abs(dy) > 8 ? dy / m : 0; };
    stick.addEventListener('pointerdown', e => { id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; stick.setPointerCapture(id); move(e.clientX, e.clientY); this.lastDevice = 'touch'; e.preventDefault(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === id) move(e.clientX, e.clientY); });
    const end = e => { if (e.pointerId !== id) return; id = null; this.touch.x = this.touch.y = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    root.querySelectorAll('[data-act]').forEach(b => {
      const a = b.dataset.act;
      b.addEventListener('pointerdown', e => { this.touch.btn[a] = true; this.lastDevice = 'touch'; b.classList.add('on'); e.preventDefault(); });
      const up = () => { this.touch.btn[a] = false; b.classList.remove('on'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    });
  }
}
