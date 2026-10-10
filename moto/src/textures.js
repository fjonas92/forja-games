import * as THREE from 'three';

let _aniso = 4;
export function setAniso(n) { _aniso = n; }

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function mk(c, rep = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = _aniso;
  return t;
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function asphaltTex() {
  const c = cv(512, 512), g = c.getContext('2d'), r = rnd(7);
  g.fillStyle = '#3b3d42'; g.fillRect(0, 0, 512, 512);
  const id = g.getImageData(0, 0, 512, 512), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 26;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.05;
  }
  g.putImageData(id, 0, 0);
  // faixas de borracha (linha ideal)
  for (const [x, a] of [[0.30, .10], [0.70, .10], [0.5, .05]]) {
    const gr = g.createLinearGradient((x - 0.12) * 512, 0, (x + 0.12) * 512, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(10,10,12,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  }
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},0.04)`; g.fillRect(r() * 512, r() * 512, r() * 40, r() * 3); }
  return mk(c);
}

export function grassTex(c1, c2) {
  const c = cv(512, 512), g = c.getContext('2d'), r = rnd(21);
  g.fillStyle = c1; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3500; i++) {
    g.fillStyle = r() > 0.5 ? c2 : 'rgba(255,255,255,0.05)';
    g.globalAlpha = 0.35;
    g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 10, 1 + r() * 6, r() * 3, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  // blocos amplos de variacao (evita repeticao evidente)
  for (let i = 0; i < 24; i++) {
    const x = r() * 512, y = r() * 512, rad = 60 + r() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() > 0.5;
    gr.addColorStop(0, dark ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return mk(c);
}

export function kerbTex() {
  const c = cv(64, 64), g = c.getContext('2d');
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#ff8a00'; g.fillRect(0, 0, 64, 32);
  return mk(c);
}

export function wallTex(sponsors) {
  const c = cv(1024, 64), g = c.getContext('2d');
  g.fillStyle = '#e9e9ec'; g.fillRect(0, 0, 1024, 64);
  const cols = ['#1c4ed8', '#d91e2b', '#111418', '#f6c500', '#1f9d55', '#ff8a1f', '#12b5b0', '#7a3fd0'];
  const bw = 1024 / sponsors.length;
  sponsors.forEach((s, i) => {
    g.fillStyle = cols[i % cols.length]; g.fillRect(i * bw + 3, 6, bw - 6, 52);
    g.fillStyle = (cols[i % cols.length] === '#f6c500') ? '#111' : '#fff';
    g.font = '900 34px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(s, i * bw + bw / 2, 34);
  });
  return mk(c);
}

export function crowdTex() {
  const c = cv(256, 128), g = c.getContext('2d'), r = rnd(5);
  g.fillStyle = '#2a2d35'; g.fillRect(0, 0, 256, 128);
  const cols = ['#e53935', '#fdd835', '#1e88e5', '#ffffff', '#43a047', '#fb8c00', '#8e24aa', '#212121', '#f48fb1'];
  for (let y = 4; y < 128; y += 7) for (let x = 2; x < 256; x += 6) {
    g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x + r() * 2, y, 4, 4);
    g.fillStyle = '#e0b894'; g.fillRect(x + 1 + r() * 2, y - 2, 2, 2);
  }
  return mk(c);
}

export function windowTex(night) {
  const c = cv(128, 128), g = c.getContext('2d'), r = rnd(11);
  g.fillStyle = night ? '#1a1d2b' : '#c9ced6'; g.fillRect(0, 0, 128, 128);
  for (let y = 6; y < 128; y += 16) for (let x = 6; x < 128; x += 16) {
    const lit = r() > 0.45;
    g.fillStyle = night ? (lit ? (r() > .5 ? '#ffe2a0' : '#9fd0ff') : '#0e1018') : (lit ? '#5b7ea3' : '#3c566f');
    g.fillRect(x, y, 10, 10);
  }
  const t = mk(c); return t;
}

export function windowEmissiveTex() {
  const c = cv(128, 128), g = c.getContext('2d'), r = rnd(11);
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  for (let y = 6; y < 128; y += 16) for (let x = 6; x < 128; x += 16) {
    const lit = r() > 0.45; r();
    if (lit) { g.fillStyle = r() > .5 ? '#ffe2a0' : '#9fd0ff'; g.fillRect(x, y, 10, 10); }
  }
  return mk(c);
}

export function checkerTex() {
  const c = cv(64, 64), g = c.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#fff' : '#111'; g.fillRect(x * 8, y * 8, 8, 8); }
  const t = mk(c); t.magFilter = THREE.NearestFilter; return t;
}

export function bannerTex(text) {
  const c = cv(1024, 128), g = c.getContext('2d');
  g.fillStyle = '#101216'; g.fillRect(0, 0, 1024, 128);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 64; x++) { g.fillStyle = (x + y) % 2 ? '#fff' : '#111'; g.fillRect(x * 16, y * 16 + (y ? 96 : 0), 16, 16); }
  g.font = '900 78px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ff8a00'; g.fillText(text, 512, 66);
  return mk(c, false);
}

export function cloudTex() {
  const c = cv(256, 128), g = c.getContext('2d'), r = rnd(3);
  for (let i = 0; i < 26; i++) {
    const x = 50 + r() * 156, y = 50 + r() * 28, rad = 18 + r() * 30;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return mk(c, false);
}

export function decalTex(text, bg, fg) {
  const c = cv(256, 64), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 64);
  g.fillStyle = fg; g.font = '900 44px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
  return mk(c, false);
}

export function numberTex(num, fg, bg) {
  const c = cv(128, 128), g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
  g.fillStyle = fg; g.font = '900 70px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(num), 64, 68);
  return mk(c, false);
}

// ---- estilos de pintura: textura desenhada em (u = em volta do carro, v = do bico para a traseira)
// topo do carro = u 0.5, lados = u 0.25 / 0.75, parte de baixo = u 0 / 1
export function liveryCanvas(id, c1, c2, W = 512, H = 512) {
  const c = cv(W, H), g = c.getContext('2d'), r = rnd(11), X = u => u * W, Y = v => v * H;
  const dark = id === 'carbon' ? '#14161b' : c1;
  g.fillStyle = id === 'gold' ? '#d9a521' : dark; g.fillRect(0, 0, W, H);
  const band = (u0, u1, col) => { g.fillStyle = col; g.fillRect(X(u0), 0, X(u1 - u0), H); };
  switch (id) {
    case 'stripe': band(0.43, 0.57, c2); band(0.405, 0.42, '#ffffff'); band(0.58, 0.595, '#ffffff'); break;
    case 'twin': band(0.36, 0.41, c2); band(0.59, 0.64, c2); band(0.46, 0.54, 'rgba(255,255,255,.85)'); break;
    case 'split': g.fillStyle = c2; g.fillRect(0, 0, W / 2, H); band(0.495, 0.505, '#fff'); break;
    case 'dots': for (let i = 0; i < 60; i++) { g.fillStyle = i % 3 ? c2 : '#ffffff'; g.beginPath(); g.arc(r() * W, r() * H, 10 + r() * 22, 0, 7); g.fill(); } break;
    case 'chevron': for (let k = 0; k < 6; k++) { const y = 0.1 + k * 0.15; g.lineWidth = H * 0.05; g.strokeStyle = k % 2 ? '#ffffff' : c2; g.beginPath(); g.moveTo(0, Y(y + 0.2)); g.lineTo(X(0.5), Y(y)); g.lineTo(W, Y(y + 0.2)); g.stroke(); } break;
    case 'checker': { const n = 16, cw = W / n, ch = H * 0.1; for (let row = 0; row < 3; row++) for (let i = 0; i < n; i++) { g.fillStyle = (i + row) % 2 ? '#111' : '#fff'; g.fillRect(i * cw, H * 0.3 + row * ch, cw + 1, ch + 1); } band(0.46, 0.54, c2); break; }
    case 'fade': { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c1); gr.addColorStop(0.45, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, W, H); break; }
    case 'flame': {
      g.fillStyle = c2; g.fillRect(0, 0, W, H * 0.06);
      for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) {
        const u0 = i / 12, wv = 1 / 12, tip = [0.38, 0.30, 0.20][k] + 0.08 * Math.sin(i * 2.3 + k);
        g.fillStyle = ['#ffcf3a', c2, '#ffffff'][k]; g.beginPath();
        g.moveTo(X(u0), 0); g.quadraticCurveTo(X(u0 + wv * 0.2), Y(tip * 0.6), X(u0 + wv * 0.55), Y(tip * (1 - k * 0.2))); g.quadraticCurveTo(X(u0 + wv * 0.85), Y(tip * 0.4), X(u0 + wv), 0); g.fill();
      }
      break;
    }
    case 'camo': for (let i = 0; i < 70; i++) { g.fillStyle = ['rgba(0,0,0,.35)', c2, 'rgba(255,255,255,.25)'][i % 3]; g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); for (let k = 0; k < 6; k++) g.lineTo(x + (r() - 0.5) * 110, y + (r() - 0.5) * 80); g.fill(); } break;
    case 'carbon': {
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2;
      for (let i = -H; i < W + H; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); g.beginPath(); g.moveTo(i, H); g.lineTo(i + H, 0); g.stroke(); }
      band(0.485, 0.515, c2); band(0.2, 0.215, c2); band(0.785, 0.8, c2); break;
    }
    case 'gold': {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#f6d56a'); gr.addColorStop(0.5, '#c8921a'); gr.addColorStop(1, '#f1c94e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      band(0.47, 0.53, '#1a1408'); band(0.455, 0.465, '#fff3b8'); band(0.535, 0.545, '#fff3b8'); break;
    }
  }
  return c;
}
export function liveryTex(id, c1, c2) {
  const t = new THREE.CanvasTexture(liveryCanvas(id, c1, c2));
  t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.wrapS = THREE.RepeatWrapping; t.anisotropy = _aniso; return t;
}
