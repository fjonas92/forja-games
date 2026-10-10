// Entrada unificada: teclado, joystick (Gamepad API) e toque. Tambem navegacao de menus.
const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
};

export class Input {
  constructor() {
    this.keys = new Set();
    this.lastDevice = 'kb';
    this.pad = null;
    this.padName = '';
    this.touch = { left: false, right: false, gas: false, brake: false };
    this.touchActive = false;
    this.steerRaw = 0;       // [-1,1] bruto do dispositivo (+ direita)
    this.steer = 0;          // suavizado
    this.throttle = 0; this.brake = 0;
    this.auto = false;       // acelerar automatico
    this.tilt = false; this.tiltVal = 0;
    this._edge = {};         // acoes (borda de subida)
    this._prevBtn = {};
    this._nav = null; this._navT = 0; this._navHeld = null;
    this.listeners = [];
    this.onDeviceChange = null;
    addEventListener('keydown', e => {
      if (e.repeat) { if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && this.captureKeys) e.preventDefault(); return; }
      this.keys.add(e.code); this._setDev('kb');
      if (this.captureKeys && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      const a = { KeyC: 'camera', KeyP: 'pause', Escape: 'pause', KeyR: 'reset', KeyV: 'camera', KeyM: 'mute', KeyB: 'pit', KeyE: 'pit' }[e.code];
      if (a) this._edge[a] = true;
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); });
    addEventListener('gamepadconnected', e => { this.pad = e.gamepad; this.padName = e.gamepad.id; this._setDev('pad'); this._fire('pad', true); });
    addEventListener('gamepaddisconnected', () => { this.pad = null; this._fire('pad', false); });
    addEventListener('deviceorientation', e => {
      if (!this.tilt) return;
      const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let v = ang === 90 ? e.beta : ang === 270 || ang === -90 ? -e.beta : e.gamma;
      if (v == null) return;
      this.tiltVal = Math.max(-1, Math.min(1, v / 28));
    });
    this.captureKeys = false;
  }
  _setDev(d) { if (this.lastDevice !== d) { this.lastDevice = d; this._fire('device', d); } }
  on(fn) { this.listeners.push(fn); }
  _fire(k, v) { for (const f of this.listeners) f(k, v); }
  edge(name) { const v = this._edge[name]; this._edge[name] = false; return !!v; }

  async enableTilt(on) {
    if (on && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') on = false; } catch (e) { on = false; }
    }
    this.tilt = on; if (!on) this.tiltVal = 0; return on;
  }

  // liga botoes de toque (elementos DOM)
  bindTouch(map) {
    for (const [k, el] of Object.entries(map)) {
      const set = v => { this.touch[k] = v; if (v) { this.touchActive = true; this._setDev('touch'); } el.classList.toggle('on', v); };
      el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) { } set(true); });
      const up = e => { e.preventDefault(); set(false); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', () => set(false));
      el.addEventListener('contextmenu', e => e.preventDefault());
    }
  }

  rumble(strong, weak, ms) {
    const p = this._gp();
    if (p && p.vibrationActuator && p.vibrationActuator.playEffect) {
      try { p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }); } catch (_) { }
    } else if (this.lastDevice === 'touch' && navigator.vibrate) { try { navigator.vibrate(Math.min(ms, 80)); } catch (_) { } }
  }

  _gp() {
    const l = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of l) if (p && p.connected) { if (!this.pad || this.pad.index !== p.index) { this.pad = p; this.padName = p.id; } return p; }
    return null;
  }

  btn(p, i) { const b = p.buttons[i]; return b ? (b.pressed || b.value > 0.5) : false; }

  // chamada 1x por quadro
  update(dt) {
    const k = this.keys, any = a => KEYMAP[a].some(c => k.has(c));
    let steer = 0, thr = 0, brk = 0, usedPad = false;
    const p = this._gp();
    const pe = {}; // acoes do joystick nesse quadro
    if (p) {
      const dz = 0.14;
      let ax = p.axes[0] || 0; ax = Math.abs(ax) < dz ? 0 : Math.sign(ax) * (Math.abs(ax) - dz) / (1 - dz);
      const rt = p.buttons[7] ? p.buttons[7].value : 0, lt = p.buttons[6] ? p.buttons[6].value : 0;
      const dl = this.btn(p, 14), dr = this.btn(p, 15);
      const padSteer = ax || (dr ? 1 : dl ? -1 : 0);
      const padThr = Math.max(rt, this.btn(p, 0) ? 1 : 0, this.btn(p, 5) ? 1 : 0);
      const padBrk = Math.max(lt, this.btn(p, 2) ? 1 : 0, this.btn(p, 1) ? 1 : 0, this.btn(p, 4) ? 1 : 0);
      const names = { 3: 'camera', 9: 'pause', 8: 'reset', 12: 'pit', 0: 'confirm', 1: 'back', 2: 'alt' };
      for (const [i, n] of Object.entries(names)) {
        const d = this.btn(p, +i), was = this._prevBtn[i]; this._prevBtn[i] = d;
        if (d && !was) pe[n] = true;
      }
      if (Math.abs(padSteer) > 0.05 || padThr > 0.05 || padBrk > 0.05 || Object.keys(pe).length) this._setDev('pad');
      if (this.lastDevice === 'pad') { steer = padSteer; thr = padThr; brk = padBrk; usedPad = true; }
      // navegacao de menu
      let ny = p.axes[1] || 0, nx = p.axes[0] || 0;
      let dir = null;
      if (this.btn(p, 12) || ny < -0.6) dir = 'up'; else if (this.btn(p, 13) || ny > 0.6) dir = 'down'; else if (dl || nx < -0.6) dir = 'left'; else if (dr || nx > 0.6) dir = 'right';
      this._padDir = dir;
    }
    for (const n of ['camera', 'pause', 'reset', 'confirm', 'back', 'alt', 'pit']) if (pe[n]) this._edge[n] = true;
    if (!usedPad) {
      steer = (any('right') ? 1 : 0) - (any('left') ? 1 : 0);
      thr = any('up') ? 1 : 0; brk = any('down') ? 1 : 0;
      if (k.has('Space')) brk = 1;
      if (this.touchActive && this.lastDevice === 'touch') {
        steer = (this.touch.right ? 1 : 0) - (this.touch.left ? 1 : 0);
        thr = this.touch.gas ? 1 : 0; brk = this.touch.brake ? 1 : 0;
        if (this.tilt) steer = this.tiltVal;
      }
      if (this.auto && !brk) thr = 1;
    }
    this.steerRaw = steer; this.throttle = thr; this.brake = brk;
    // suavizacao do volante (digital sobe devagar, volta rapido)
    const digital = !usedPad && !this.tilt;
    const rate = digital ? (Math.abs(steer) > Math.abs(this.steer) && Math.sign(steer) === Math.sign(this.steer) || this.steer === 0 ? 6.5 : 11) : 22;
    this.steer += (steer - this.steer) * Math.min(1, rate * dt);
    if (Math.abs(this.steer) < 0.003 && steer === 0) this.steer = 0;
  }

  // direcao de navegacao de menu (com repeticao). retorna 'up'|'down'|'left'|'right'|null
  navDir(dt) {
    let dir = null;
    const k = this.keys;
    if (k.has('ArrowUp')) dir = 'up'; else if (k.has('ArrowDown')) dir = 'down'; else if (k.has('ArrowLeft')) dir = 'left'; else if (k.has('ArrowRight')) dir = 'right';
    if (!dir && this._padDir) dir = this._padDir;
    if (!dir) { this._navHeld = null; this._navT = 0; return null; }
    if (dir !== this._navHeld) { this._navHeld = dir; this._navT = 0.32; return dir; }
    this._navT -= dt;
    if (this._navT <= 0) { this._navT = 0.11; return dir; }
    return null;
  }
}
