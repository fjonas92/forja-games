// Geracao procedural da linha central do circuito (sem dependencias, roda no node tambem).
export const DS = 3;          // espacamento entre pontos (m)
export const KERB = 1.5;      // largura do zebra
export const VERGE = 9;       // grama ate o muro (alem do zebra, ver D)

function resample(pts, n) {
  const m = pts.length;
  const cum = [0];
  for (let i = 1; i <= m; i++) {
    const a = pts[i - 1], b = pts[i % m];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[m], out = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / n) * total;
    while (cum[k + 1] < s) k++;
    const a = pts[k], b = pts[(k + 1) % m];
    const f = (s - cum[k]) / Math.max(1e-9, cum[k + 1] - cum[k]);
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return { pts: out, total };
}

function perimeter(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return s;
}

function minRadius(p) {
  const n = p.length; let best = 1e9;
  const g = 2;
  for (let i = 0; i < n; i++) {
    const a = p[(i - g + n) % n], b = p[i], c = p[(i + g) % n];
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
    const area2 = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
    if (area2 < 1e-6) continue;
    const R = (ab * bc * ca) / (2 * area2);
    if (R < best) best = R;
  }
  return best;
}

export function buildTrack(c) {
  const M = 1800;
  let raw = [];
  for (let i = 0; i < M; i++) {
    const th = (i / M) * Math.PI * 2;
    let r = 1;
    const T = c.tech != null ? c.tech : 1.7;
    for (const [k, a, ph] of c.harm) r += a * T * Math.sin(k * th + ph);
    for (const [t0, dep, wid] of c.hp) {
      let d = Math.atan2(Math.sin(th - t0), Math.cos(th - t0));
      r -= dep * (1 + (T - 1) * 0.5) * Math.exp(-((d / wid) ** 2));
    }
    r = Math.max(0.28, r);
    raw.push([r * Math.cos(th) * c.sx, r * Math.sin(th)]);
  }
  let sc = c.len / perimeter(raw);
  raw = raw.map(p => [p[0] * sc, p[1] * sc]);
  const n = Math.round(c.len / DS);
  let pts = resample(raw, n).pts;
  const rmin = c.rmin || 38;
  // suaviza ate nenhuma curva ser mais fechada que rmin
  for (let it = 0; it < 900; it++) {
    if (it % 4 === 0 && minRadius(pts) >= rmin) break;
    const q = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[i], d = pts[(i + 1) % n];
      q[i] = [b[0] * 0.5 + (a[0] + d[0]) * 0.25, b[1] * 0.5 + (a[1] + d[1]) * 0.25];
    }
    pts = q;
  }
  // restaura o comprimento e reamostra
  const res = resample(pts, n);
  sc = c.len / res.total;
  pts = res.pts.map(p => [p[0] * sc, p[1] * sc]);
  const ds = perimeter(pts) / n;
  // tangente / curvatura
  const hd = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    hd[i] = Math.atan2(b[0] - a[0], b[1] - a[1]); // forward = (sin, cos) em (x,z)
  }
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  let curv = new Array(n);
  for (let i = 0; i < n; i++) curv[i] = -wrap(hd[(i + 1) % n] - hd[(i - 1 + n) % n]) / (2 * ds); // + = curva para a direita
  // suaviza curvatura
  for (let k = 0; k < 3; k++) {
    const q = curv.slice();
    for (let i = 0; i < n; i++) q[i] = (curv[(i - 1 + n) % n] + curv[i] * 2 + curv[(i + 1) % n]) / 4;
    curv = q;
  }
  // reta mais longa -> linha de largada
  const STR = 0.0035;
  let bestLen = 0, bestStart = 0;
  for (let i = 0; i < n; i++) {
    if (Math.abs(curv[i]) < STR && Math.abs(curv[(i - 1 + n) % n]) >= STR) {
      let l = 0; while (l < n && Math.abs(curv[(i + l) % n]) < STR) l++;
      if (l > bestLen) { bestLen = l; bestStart = i; }
    }
  }
  const off = (bestStart + Math.round(bestLen * 0.4)) % n;
  pts = pts.map((_, i) => pts[(i + off) % n]);
  const cv = curv.map((_, i) => curv[(i + off) % n]);
  const hdg = hd.map((_, i) => hd[(i + off) % n]);
  // alturas
  const ph = [c.len % 7, c.len % 5, c.len % 3, c.len % 11];
  const H = (c.h || 3) * 2.4;
  const y = new Array(n);
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    y[i] = H * (0.5 + 0.2 * Math.sin(th + ph[0]) + 0.15 * Math.sin(2 * th + ph[1]) + 0.1 * Math.sin(3 * th + ph[2]) + 0.05 * Math.sin(5 * th + ph[3]));
  }
  // centro de massa p/ recentrar
  let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
  const t = {
    n, ds, length: ds * n, w: c.w, kerb: KERB, D: c.w + KERB + VERGE,
    x: new Float32Array(n), z: new Float32Array(n), y: new Float32Array(n),
    hdg: new Float32Array(n), curv: new Float32Array(n),
    tx: new Float32Array(n), tz: new Float32Array(n), rx: new Float32Array(n), rz: new Float32Array(n),
    cfg: c,
  };
  for (let i = 0; i < n; i++) {
    t.x[i] = pts[i][0] - cx; t.z[i] = pts[i][1] - cz; t.y[i] = y[i]; t.hdg[i] = hdg[i]; t.curv[i] = cv[i];
    t.tx[i] = Math.sin(hdg[i]); t.tz[i] = Math.cos(hdg[i]);
    t.rx[i] = -t.tz[i]; t.rz[i] = t.tx[i];
  }
  t.minR = 1 / Math.max(1e-6, Math.max(...cv.map(Math.abs)));
  // menor distancia entre trechos nao vizinhos
  let gap = 1e9;
  for (let i = 0; i < n; i += 2) for (let j = i + 70; j < n; j += 2) {
    if (n - (j - i) < 70) continue;
    const d = Math.hypot(t.x[i] - t.x[j], t.z[i] - t.z[j]);
    if (d < gap) gap = d;
  }
  t.gap = gap;
  t.straight = bestLen * ds;
  let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.hypot(t.x[i], t.z[i]));
  t.extent = mx;
  return t;
}

// posicao a s metros (s pode ser negativo) com deslocamento lateral
export function pointAt(t, s, lat = 0) {
  const n = t.n;
  let f = s / t.ds; let i = Math.floor(f); const k = f - i;
  i = ((i % n) + n) % n; const j = (i + 1) % n;
  const x = t.x[i] + (t.x[j] - t.x[i]) * k, z = t.z[i] + (t.z[j] - t.z[i]) * k, y = t.y[i] + (t.y[j] - t.y[i]) * k;
  const rx = t.rx[i] + (t.rx[j] - t.rx[i]) * k, rz = t.rz[i] + (t.rz[j] - t.rz[i]) * k;
  const hd = t.hdg[i]; // aproximacao boa o suficiente
  return { x: x + rx * lat, z: z + rz * lat, y, hdg: hd };
}

// localiza a posicao (x,z) na pista. hint: indice anterior (ou -1 p/ busca global)
export function locate(t, px, pz, hint, out) {
  const n = t.n; let bi = 0, bd = 1e18;
  if (hint < 0) {
    for (let i = 0; i < n; i += 3) { const d = (t.x[i] - px) ** 2 + (t.z[i] - pz) ** 2; if (d < bd) { bd = d; bi = i; } }
    hint = bi; bd = 1e18;
  }
  for (let k = -14; k <= 14; k++) {
    const i = (hint + k + n) % n;
    const d = (t.x[i] - px) ** 2 + (t.z[i] - pz) ** 2;
    if (d < bd) { bd = d; bi = i; }
  }
  const i = bi;
  const dx = px - t.x[i], dz = pz - t.z[i];
  const along = dx * t.tx[i] + dz * t.tz[i];
  const lat = dx * t.rx[i] + dz * t.rz[i];
  out.i = i; out.lat = lat; out.along = along; out.s = i * t.ds + along; out.y = t.y[i];
  return out;
}
