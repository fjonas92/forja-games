import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTrackWorld } from './trackmesh.js';
import { makeCar } from './carmodel.js';
import { THEMES } from './data.js';

const SKY_V = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`;
const SKY_F = `varying vec3 vDir; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uNight;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHor, uTop, pow(h, 0.5));
  if (d.y < 0.0) col = uHor;
  float s = max(dot(d, normalize(uSun)), 0.0);
  col += uSunCol * (pow(s, 900.0) * 6.0 + pow(s, 14.0) * 0.22 + pow(s, 3.0) * 0.06);
  if (uNight > 0.5 && d.y > 0.0) { vec2 g = floor(d.xz / (d.y + 0.2) * 90.0); float st = step(0.9975, h21(g)); col += vec3(st) * smoothstep(0.1, 0.5, d.y); }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const PART_V = `attribute float aSize; attribute float aAlpha; attribute vec3 aCol; varying float vA; varying vec3 vC; uniform float uScale;
void main(){ vA = aAlpha; vC = aCol; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
const PART_F = `varying float vA; varying vec3 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = smoothstep(0.5, 0.05, d) * vA; gl_FragColor = vec4(vC, a); }`;

// acabamento: vinheta, contraste e saturacao (so no modo alto)
const GRADE = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.3 }, uSat: { value: 1.1 }, uCon: { value: 1.05 }, uTint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uVig; uniform float uSat; uniform float uCon; uniform vec3 uTint;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722)); vec3 col = mix(vec3(l), c.rgb, uSat);
    col = (col - 0.18) * uCon + 0.18; col *= uTint; vec2 d = vUv - 0.5; col *= 1.0 - uVig * smoothstep(0.25, 0.85, length(d) * 1.35); gl_FragColor = vec4(max(col, 0.0), c.a); }`,
};

export const QUALITY = {
  low:    { pr: 1,   shadow: 0,    bloom: false, aa: false, scenery: 'low',    msaa: 0 },
  medium: { pr: 1.5, shadow: 1024, bloom: false, aa: true,  scenery: 'medium', msaa: 0 },
  high:   { pr: 2,   shadow: 2048, bloom: true,  aa: true,  scenery: 'high',   msaa: 4 },
};

const TYRE_COL = { S: '#ffd23f', W: '#3aa0ff' };

export class View {
  constructor(canvas, qualityName) {
    this.canvas = canvas;
    this.qn = qualityName; this.q = QUALITY[qualityName];
    const q = this.q;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: q.aa && !q.bloom, powerPreference: 'high-performance', alpha: false });
    const r = this.renderer;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = q.shadow > 0; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.3, 6000);
    // ambiente p/ reflexos do carro
    const pm = new THREE.PMREMGenerator(r);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    // luzes
    this.hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6b7a4a, 0.85); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2dc, 1.8); this.sun.castShadow = q.shadow > 0;
    this.sun.shadow.mapSize.set(q.shadow || 1, q.shadow || 1);
    const sc = this.sun.shadow.camera; sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 1; sc.far = 400;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.6;
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.sunDir = new THREE.Vector3(-0.5, 0.75, 0.4).normalize();
    // ceu
    this.skyMat = new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: this.sunDir.clone() }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 } } });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), this.skyMat); this.sky.renderOrder = -10; this.sky.frustumCulled = false; this.scene.add(this.sky);
    this.world = null; this.cars = new Map(); this.carRoot = new THREE.Group(); this.scene.add(this.carRoot);
    this.mode = 'none';
    this.camYaw = 0; this.camPos = new THREE.Vector3(); this.camInit = false; this.shake = 0; this.camMode = 0;
    this._initParticles(); this._initRain();
    this.rain = 0; this.wetV = 0;
    this._garage = null;
    this.composer = null; this.bloom = null;
    this.resize(canvas.clientWidth || 960, canvas.clientHeight || 540);
  }

  setQuality(name) {
    this.qn = name; this.q = QUALITY[name];
    const r = this.renderer;
    r.shadowMap.enabled = this.q.shadow > 0; this.sun.castShadow = this.q.shadow > 0;
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    this.sun.shadow.mapSize.set(this.q.shadow || 1, this.q.shadow || 1);
    this.scene.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.needsUpdate = true); } });
    this._buildComposer(); this.resize(this.w, this.h);
  }

  _buildComposer() {
    if (this.composer) { this.composer.dispose && this.composer.dispose(); this.composer = null; }
    if (!this.q.bloom) return;
    const r = this.renderer, w = this.w || 960, h = this.h || 540, pr = Math.min(devicePixelRatio, this.q.pr);
    const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: this.q.msaa });
    const c = new EffectComposer(r, rt); c.setPixelRatio(pr); c.setSize(w, h);
    c.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.28, 0.7, 0.92); c.addPass(this.bloom);
    this.grade = new ShaderPass(GRADE); c.addPass(this.grade);
    c.addPass(new OutputPass());
    this.composer = c;
  }

  resize(w, h) {
    this.w = w; this.h = h;
    const pr = Math.min(devicePixelRatio || 1, this.q.pr);
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.q.bloom && !this.composer) this._buildComposer();
    if (this.composer) { this.composer.setPixelRatio(pr); this.composer.setSize(w, h); }
  }

  render() {
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
  }

  // ---------- particulas ----------
  _initParticles() {
    const N = 360; this.pN = N; this.pi = 0;
    const g = new THREE.BufferGeometry();
    this.pPos = new Float32Array(N * 3); this.pSize = new Float32Array(N); this.pAlpha = new Float32Array(N); this.pCol = new Float32Array(N * 3);
    this.pVel = new Float32Array(N * 3); this.pLife = new Float32Array(N); this.pMax = new Float32Array(N); this.pS0 = new Float32Array(N);
    g.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.pAlpha, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(this.pCol, 3));
    const m = new THREE.ShaderMaterial({ vertexShader: PART_V, fragmentShader: PART_F, transparent: true, depthWrite: false, uniforms: { uScale: { value: 600 } } });
    this.parts = new THREE.Points(g, m); this.parts.frustumCulled = false; this.parts.renderOrder = 4; this.scene.add(this.parts);
    this.pLife.fill(0);
  }
  emit(x, y, z, vx, vy, vz, life, size, r, g, b) {
    const i = this.pi = (this.pi + 1) % this.pN;
    this.pPos[i * 3] = x; this.pPos[i * 3 + 1] = y; this.pPos[i * 3 + 2] = z;
    this.pVel[i * 3] = vx; this.pVel[i * 3 + 1] = vy; this.pVel[i * 3 + 2] = vz;
    this.pLife[i] = life; this.pMax[i] = life; this.pS0[i] = size; this.pCol[i * 3] = r; this.pCol[i * 3 + 1] = g; this.pCol[i * 3 + 2] = b;
  }
  _updParticles(dt) {
    for (let i = 0; i < this.pN; i++) {
      if (this.pLife[i] <= 0) { this.pAlpha[i] = 0; continue; }
      this.pLife[i] -= dt; const k = 1 - this.pLife[i] / this.pMax[i];
      this.pPos[i * 3] += this.pVel[i * 3] * dt; this.pPos[i * 3 + 1] += this.pVel[i * 3 + 1] * dt; this.pPos[i * 3 + 2] += this.pVel[i * 3 + 2] * dt;
      this.pSize[i] = this.pS0[i] * (1 + k * 2.2); this.pAlpha[i] = Math.max(0, (1 - k)) * 0.5;
    }
    const a = this.parts.geometry.attributes; a.position.needsUpdate = a.aSize.needsUpdate = a.aAlpha.needsUpdate = a.aCol.needsUpdate = true;
    this.parts.material.uniforms.uScale.value = this.h * 0.28 * (this.renderer.getPixelRatio());
  }

  // ---------- chuva ----------
  _initRain() {
    const N = 1100; this.rN = N;
    this.rPos = new Float32Array(N * 6); this.rOff = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { this.rOff[i * 3] = (Math.random() - 0.5) * 60; this.rOff[i * 3 + 1] = Math.random() * 30; this.rOff[i * 3 + 2] = (Math.random() - 0.5) * 60; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.rPos, 3));
    this.rainMat = new THREE.LineBasicMaterial({ color: 0xc9d8e8, transparent: true, opacity: 0.4, depthWrite: false, fog: false });
    this.rainMesh = new THREE.LineSegments(g, this.rainMat); this.rainMesh.frustumCulled = false; this.rainMesh.renderOrder = 6; this.rainMesh.visible = false; this.scene.add(this.rainMesh);
    this._gc = new THREE.Color();
  }
  // chuva (0..1) e umidade da pista (0..1): ajusta ceu, neblina, luz, asfalto e gotas
  setWeather(rain, wet, dt) {
    const th = this.th; this.rain = rain; this.wetV = wet;
    if (!th || this.mode !== 'race') { this.rainMesh.visible = false; return; }
    const lum = c => 0.3 * c.r + 0.59 * c.g + 0.11 * c.b, k = Math.min(1, rain * 0.7), gc = this._gc;
    const grey = (hex, out, f) => { out.set(hex); const l = lum(out) * f; out.lerp(gc.setRGB(l * 0.92, l * 0.97, l * 1.05), k); };
    grey(th.fog, this.scene.fog.color, 0.85); this.scene.fog.density = th.fogD * (1 + 1.8 * rain);
    grey(th.sky[0], this.skyMat.uniforms.uTop.value, 0.7); grey(th.sky[1], this.skyMat.uniforms.uHor.value, 0.85);
    this.skyMat.uniforms.uSunCol.value.set(th.sunCol).multiplyScalar((th.night ? 0.25 : 1) * (1 - 0.9 * rain));
    this.sun.intensity = th.sun * (1 - 0.55 * rain); this.hemi.intensity = (th.night ? 1.0 : 0.9) * (1 + 0.1 * rain);
    const am = this.world && this.world.userData.asMat;
    if (am) { am.roughness = 0.92 - 0.55 * wet; am.metalness = 0.1 * wet; am.color.setScalar(1 - 0.42 * wet); am.envMap = wet > 0.02 ? this.env : null; am.envMapIntensity = 0.28 * wet; }
    if (this.grade) { this.grade.uniforms.uSat.value = 1.1 - 0.3 * rain; this.grade.uniforms.uTint.value.set(1 - 0.05 * rain, 1 - 0.02 * rain, 1 + 0.04 * rain); }
    // gotas em volta da camera
    const cam = this.camera.position, n = Math.floor(this.rN * Math.min(1, rain * 1.2)), snow = !!th.snowy;
    this.rainMesh.visible = n > 0; this.rainMesh.geometry.setDrawRange(0, n * 2);
    this.rainMat.opacity = (snow ? 0.8 : 0.42) * Math.min(1, rain * 1.4); this.rainMat.color.set(snow ? 0xffffff : th.night ? 0x8fa6c8 : 0xc9d8e8);
    const sp = snow ? 6 : 42, len = snow ? 0.08 : 0.045, o = this.rOff, P = this.rPos;
    for (let i = 0; i < n; i++) {
      let x = o[i * 3], y = o[i * 3 + 1] - sp * dt, z = o[i * 3 + 2];
      if (y < 0) { y += 30; x = (Math.random() - 0.5) * 60; z = (Math.random() - 0.5) * 60; }
      o[i * 3] = x; o[i * 3 + 1] = y; o[i * 3 + 2] = z;
      const wx = cam.x + x, wy = cam.y - 8 + y, wz = cam.z + z, j = i * 6;
      P[j] = wx; P[j + 1] = wy; P[j + 2] = wz; P[j + 3] = wx + (snow ? 0.02 : 0.3) * len * sp; P[j + 4] = wy + len * sp; P[j + 5] = wz;
    }
    this.rainMesh.geometry.attributes.position.needsUpdate = true;
  }

  // ---------- corrida ----------
  loadTrack(track) {
    this.clearRace();
    this.mode = 'race'; this._hideGarage();
    const th = THEMES[track.cfg.theme];
    this.th = th; this.track = track;
    this.world = buildTrackWorld(track, { quality: this.q.scenery });
    this.scene.add(this.world);
    this.skyMat.uniforms.uTop.value.set(th.sky[0]); this.skyMat.uniforms.uHor.value.set(th.sky[1]);
    this.skyMat.uniforms.uSunCol.value.set(th.sunCol).multiplyScalar(th.night ? 0.25 : 1);
    this.skyMat.uniforms.uNight.value = th.night ? 1 : 0;
    this.sunDir.set(th.night ? 0.3 : -0.45, th.night ? 0.55 : 0.72, th.night ? -0.6 : 0.5).normalize();
    this.skyMat.uniforms.uSun.value.copy(this.sunDir);
    this.scene.fog = new THREE.FogExp2(th.fog, th.fogD);
    this.scene.background = null;
    this.sun.color.set(th.sunCol); this.sun.intensity = th.sun;
    this.hemi.color.set(th.sky[0]); this.hemi.groundColor.set(th.ground); this.hemi.intensity = th.night ? 1.0 : 0.9;
    this.renderer.toneMappingExposure = th.night ? 1.5 : 1.0;
    if (!this.headlight) { this.headlight = new THREE.PointLight(0xfff0d0, 0, 90, 1.4); this.scene.add(this.headlight); }
    this.headlight.intensity = th.night ? 130 : 0;
    if (this.bloom) { this.bloom.strength = th.night ? 0.45 : 0.22; this.bloom.threshold = th.night ? 0.9 : 0.95; }
    this.camInit = false;
    this.rain = 0; this.wetV = 0; this.rainMesh.visible = false;
    if (this.grade) { this.grade.uniforms.uSat.value = 1.1; this.grade.uniforms.uTint.value.set(1, 1, 1); }
  }
  clearRace() {
    if (this.world) {
      this.scene.remove(this.world);
      this.world.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); } });
      this.world = null;
    }
    for (const c of this.cars.values()) this.carRoot.remove(c.group);
    this.cars.clear(); this.pLife.fill(0); if (this.rainMesh) this.rainMesh.visible = false;
    if (this._podium) { this.scene.remove(this._podium.group); this._podium.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this._podium = null; }
  }
  _prepCar(api) {
    api.group.traverse(o => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) { m.envMap = this.env; m.envMapIntensity = this.th && this.th.night ? 0.25 : 0.9; } }); } });
  }
  spawnCars(racers, entries) {
    for (const r of racers) {
      const e = entries.find(x => x.id === r.id);
      const api = makeCar({ c1: r.c1, c2: r.c2, number: r.number, helmet: r.helmet, sponsors: e ? e.sponsors : null, paint: e ? e.paint : null, tyreBand: r.tyre === 'W' ? TYRE_COL.W : TYRE_COL.S });
      this._prepCar(api);
      this.carRoot.add(api.group); this.cars.set(r.id, api);
      api.group.position.set(r.x, r.y, r.z);
    }
  }
  syncCars(racers, dt) {
    const t = this.track;
    for (const r of racers) {
      const api = this.cars.get(r.id); if (!api) continue;
      api.group.position.set(r.x, r.y, r.z);
      api.group.rotation.y = r.yaw - r.slipS * Math.sign(r.yawRate || 1) * 0.12;
      const i = r.idx, j = (i + 4) % t.n;
      const slope = Math.atan2(t.y[j] - t.y[i], 4 * t.ds);
      api.body.rotation.x = r.pitch - slope;
      api.body.rotation.z = -r.roll;
      api.body.position.y = r.surf === 1 ? Math.sin(performance.now() * 0.09 + r.number) * 0.012 * Math.min(1, r.v / 40) : 0;
      if (api._tyre !== r.tyre) { api._tyre = r.tyre; api.setTyre(TYRE_COL[r.tyre] || TYRE_COL.S); }
      api.spin(r.v * dt);
      api.steer(-r.str * 0.42);
      api.setBrake(r.brakeOn);
      // fumaca / poeira
      if (r.v > 8 && this._camDist(r) < 90) {
        const smoke = (r.slipS > 0.35 || (r.brakeOn && r.v > 55 && Math.abs(r.str) > 0.5));
        const grass = r.surf === 2 && r.v > 12;
        const spray = this.wetV > 0.25 && r.v > 25 && !smoke && !grass;
        if (spray) {
          const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
          for (const sx of [-0.97, 0.97]) if (Math.random() < 0.5 * this.wetV) this.emit(r.x - fx * 1.7 + (-fz) * sx, r.y + 0.25, r.z - fz * 1.7 + fx * sx, -fx * r.v * 0.12 + (Math.random() - .5), 1.2 + Math.random(), -fz * r.v * 0.12 + (Math.random() - .5), 0.7, 1.7, 0.8, 0.84, 0.9);
        }
        if (smoke || grass) {
          const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
          for (const sx of [-0.97, 0.97]) {
            const px = r.x - fx * 1.55 + (-fz) * sx, pz = r.z - fz * 1.55 + fx * sx;
            if (Math.random() < 0.55) {
              if (grass) this.emit(px, r.y + 0.2, pz, (Math.random() - .5) * 3, 1.5 + Math.random() * 2, (Math.random() - .5) * 3, 0.9, 1.6, 0.45, 0.4, 0.28);
              else this.emit(px, r.y + 0.15, pz, (Math.random() - .5) * 1.2, 0.8, (Math.random() - .5) * 1.2, 0.9, 1.8, 0.85, 0.85, 0.88);
            }
          }
        }
      }
      if (r.hit > 0.05) {
        for (let k = 0; k < 14; k++) this.emit(r.x, r.y + 0.5, r.z, (Math.random() - .5) * 14, Math.random() * 6, (Math.random() - .5) * 14, 0.45, 0.35, 1, 0.75, 0.3);
      }
    }
    this._updParticles(dt);
  }
  _camDist(r) { const c = this.camera.position; return Math.hypot(c.x - r.x, c.z - r.z); }

  // sol e sombras seguem o alvo
  followSun(x, y, z) {
    this.sun.position.set(x + this.sunDir.x * 150, y + this.sunDir.y * 150, z + this.sunDir.z * 150);
    this.sun.target.position.set(x, y, z); this.sun.target.updateMatrixWorld();
    if (this.headlight && this.headlight.intensity > 0 && this.camera) {
      const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw);
      this.headlight.position.set(x + fx * 14, y + 7, z + fz * 14);
    }
  }

  // modos: 0 perseguicao, 1 alta, 2 capo
  updateCamera(r, mode, dt, extra = {}) {
    const cam = this.camera, v = Math.abs(r.v);
    const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
    // yaw da camera atrasa um pouco
    if (!this.camInit) { this.camYaw = r.yaw; this.camPos.set(r.x - fx * 8, r.y + 3, r.z - fz * 8); this.camInit = true; }
    let da = r.yaw - this.camYaw; da = Math.atan2(Math.sin(da), Math.cos(da));
    const kYaw = mode === 2 ? 40 : 6.5;
    this.camYaw += da * (1 - Math.exp(-dt * kYaw));
    const cy = this.camYaw, cfx = Math.sin(cy), cfz = Math.cos(cy);
    let fov = 66 + Math.min(1, v / 85) * 16, px, py, pz, lx, ly, lz;
    const orbit = extra.orbit || 0;
    if (mode === 2) {
      px = r.x + fx * 0.15; py = r.y + 1.12; pz = r.z + fz * 0.15; lx = r.x + fx * 40; ly = r.y + 0.9; lz = r.z + fz * 40; fov += 4;
      this.camPos.set(px, py, pz);
    } else {
      const back = mode === 1 ? 12.5 : 8.2, up = mode === 1 ? 5.2 : 3.0;
      const a = cy + orbit;
      const dx = -Math.sin(a) * back, dz = -Math.cos(a) * back;
      const tx = r.x + dx, ty = r.y + up + Math.min(1, v / 85) * 0.5, tz = r.z + dz;
      const k = 1 - Math.exp(-dt * 12);
      this.camPos.x += (tx - this.camPos.x) * k; this.camPos.y += (ty - this.camPos.y) * k; this.camPos.z += (tz - this.camPos.z) * k;
      px = this.camPos.x; py = this.camPos.y; pz = this.camPos.z;
      lx = r.x + cfx * 11; ly = r.y + 1.0; lz = r.z + cfz * 11;
    }
    const sh = (r.surf >= 1 ? 0.012 * Math.min(1, v / 50) : 0) + Math.min(0.03, v * 0.00018) * (r.surf >= 1 ? 1 : 0.4) + (extra.shake || 0);
    cam.position.set(px + (Math.random() - .5) * sh, py + (Math.random() - .5) * sh, pz + (Math.random() - .5) * sh);
    cam.lookAt(lx, ly, lz);
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix();
    this.sky.position.copy(cam.position); this.sky.scale.setScalar(3000);
    // esconde o capacete do jogador no capo
    const api = this.cars.get(r.id); if (api) api.body.visible = true;
  }

  // ---------- garagem (vitrine) ----------
  showGarage() {
    this.clearRace(); this.mode = 'garage';
    if (!this._garage) {
      const g = new THREE.Group();
      const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x14161d, roughness: 0.28, metalness: 0.6 }));
      floor.receiveShadow = true; g.add(floor);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0x232733, roughness: 0.35, metalness: 0.7 }));
      plate.position.y = 0.09; plate.receiveShadow = true; g.add(plate);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.04, 8, 80).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3b30 })); ring.position.y = 0.19; g.add(ring);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 7, 0.25), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x4ab3ff : 0xff5da2 }));
        bar.position.set(Math.cos(a) * 18, 3.5, Math.sin(a) * 18); g.add(bar);
      }
      const wallM = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 14, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x0c0e14, roughness: 0.9, side: THREE.BackSide }));
      wallM.position.y = 7; g.add(wallM);
      this._garage = { group: g, car: null, t: 0, sig: '' };
    }
    this.scene.add(this._garage.group);
    this.sky.visible = false; this.parts.visible = false;
    this.scene.fog = null; this.scene.background = new THREE.Color(0x07090f);
    this.hemi.color.set(0xa8bcff); this.hemi.groundColor.set(0x2a2a38); this.hemi.intensity = 1.1;
    this.sun.color.set(0xfff0dc); this.sun.intensity = 2.8; this.sunDir.set(-0.4, 0.8, 0.5).normalize();
    this.followSun(0, 0, 0);
    this.renderer.toneMappingExposure = 1.05;
    this.th = null;
    if (this.bloom) { this.bloom.strength = 0.5; this.bloom.threshold = 0.85; }
  }
  // ---------- podio (fim da corrida) ----------
  showPodium(list) {
    this.clearRace(); this.mode = 'podium'; this._hideGarage();
    const T = THREE, g = new T.Group(), std = (c, m = 0.3, ro = 0.45) => new T.MeshStandardMaterial({ color: c, metalness: m, roughness: ro });
    const floor = new T.Mesh(new T.CircleGeometry(40, 64).rotateX(-Math.PI / 2), std(0x14161d, 0.6, 0.28)); floor.receiveShadow = true; g.add(floor);
    const wall = new T.Mesh(new T.CylinderGeometry(24, 24, 16, 48, 1, true), new T.MeshStandardMaterial({ color: 0x0c0e14, roughness: 0.9, side: T.BackSide })); wall.position.y = 8; g.add(wall);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, bar = new T.Mesh(new T.BoxGeometry(0.25, 9, 0.25), new T.MeshBasicMaterial({ color: i % 2 ? 0x4ab3ff : 0xff5da2 })); bar.position.set(Math.cos(a) * 20, 4.5, Math.sin(a) * 20 - 2); g.add(bar); }
    const label = (txt, big) => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); x.font = '700 ' + (big ? 62 : 52) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,.85)'; x.strokeText(txt, 256, 64); x.fillStyle = big ? '#ffd24a' : '#fff'; x.fillText(txt, 256, 64); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(3.2, 0.8, 1); s.renderOrder = 8; return s; };
    const steps = [{ x: 0, h: 1.3, col: 0xf2c200, n: '1' }, { x: -2.5, h: 0.9, col: 0xc3cad6, n: '2' }, { x: 2.5, h: 0.6, col: 0xcd7f32, n: '3' }];
    const figs = [];
    list.forEach((p, i) => {
      const st = steps[i]; if (!st) return;
      const step = new T.Mesh(new T.BoxGeometry(2.2, st.h, 2), std(st.col, 0.5, 0.35)); step.position.set(st.x, st.h / 2, 0); step.castShadow = step.receiveShadow = true; g.add(step);
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.font = '700 100px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1a1a22'; x.fillText(st.n, 64, 70); const tx = new T.CanvasTexture(cv);
      const num = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), new T.MeshBasicMaterial({ map: tx, transparent: true })); num.position.set(st.x, st.h * 0.55, 1.01); g.add(num);
      // piloto
      const f = new T.Group(); f.position.set(st.x, st.h, 0.1);
      const dark = std(0x1a1a22, 0.1, 0.7), suit = std(p.c1, 0.2, 0.5), skin = std(0xd9a577, 0, 0.7), hc1 = std((p.helmet && p.helmet.c1) || '#ffffff', 0.2, 0.3), hc2 = std((p.helmet && p.helmet.c2) || p.c1, 0.2, 0.3);
      for (const s of [-1, 1]) { const leg = new T.Mesh(new T.CapsuleGeometry(0.11, 0.55, 4, 8), dark); leg.position.set(s * 0.15, 0.4, 0); f.add(leg); }
      const torso = new T.Mesh(new T.CapsuleGeometry(0.27, 0.4, 6, 12), suit); torso.scale.z = 0.65; torso.position.y = 1.05; torso.castShadow = true; f.add(torso);
      const belt = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.1, 16), hc2); belt.scale.z = 0.65; belt.position.y = 0.82; f.add(belt);
      const head = new T.Mesh(new T.SphereGeometry(0.27, 20, 16), hc1); head.position.y = 1.72; head.castShadow = true; f.add(head);
      const stripe = new T.Mesh(new T.TorusGeometry(0.272, 0.04, 6, 24), hc2); stripe.rotation.x = Math.PI / 2; stripe.position.y = 1.8; f.add(stripe);
      const visor = new T.Mesh(new T.SphereGeometry(0.275, 16, 8, -0.9, 1.8, 1.15, 0.5), std(0x0b0d14, 0.9, 0.1)); visor.position.y = 1.72; f.add(visor);
      const arms = [];
      for (const s of [-1, 1]) {
        const piv = new T.Group(); piv.position.set(s * 0.36, 1.3, 0); const arm = new T.Mesh(new T.CapsuleGeometry(0.08, 0.5, 4, 8), suit); arm.position.y = 0.32; piv.add(arm);
        const hand = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), skin); hand.position.y = 0.66; piv.add(hand);
        piv.rotation.z = i === 0 ? s * 0.28 : -s * 0.9; f.add(piv); arms.push(piv);
      }
      let trophy = null;
      if (i === 0) {
        trophy = new T.Group(); const gold = new T.MeshStandardMaterial({ color: 0xffc928, metalness: 1, roughness: 0.22, emissive: 0x553a00, side: T.DoubleSide });
        const cup = new T.Mesh(new T.LatheGeometry([[0.05, 0], [0.12, 0.08], [0.27, 0.3], [0.3, 0.46], [0.26, 0.46], [0.22, 0.3], [0.08, 0.13], [0.05, 0]].map(q => new T.Vector2(q[0], q[1])), 24), gold); cup.position.y = 0.22; trophy.add(cup);
        const stem = new T.Mesh(new T.CylinderGeometry(0.045, 0.06, 0.24, 10), gold); stem.position.y = 0.12; trophy.add(stem);
        const base = new T.Mesh(new T.CylinderGeometry(0.2, 0.22, 0.07, 18), gold); base.position.y = 0.035; trophy.add(base);
        for (const s of [-1, 1]) { const h = new T.Mesh(new T.TorusGeometry(0.1, 0.022, 6, 14, Math.PI), gold); h.position.set(s * 0.3, 0.52, 0); h.rotation.z = s * -Math.PI / 2 + (s > 0 ? Math.PI : 0); trophy.add(h); }
        trophy.position.set(0, 1.95, 0); trophy.scale.setScalar(1.25); f.add(trophy);
      }
      f.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const lb = label(p.name, i === 0); lb.position.set(st.x, st.h + (i === 0 ? 3.15 : 2.5), 0.1); g.add(lb);
      g.add(f); figs.push({ f, arms, trophy, y0: st.h, ph: i * 1.7 });
      // carro ao fundo
      const api = makeCar({ c1: p.c1, c2: p.c2, number: p.number, helmet: p.helmet, sponsors: null }); this.th = null; this._prepCar(api);
      api.group.position.set(st.x * 2.1, 0, -6.2 + (i === 0 ? -1.2 : 0)); api.group.rotation.y = i === 0 ? 0 : (i === 1 ? 0.55 : -0.55); api.group.scale.setScalar(0.95);
      api.group.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(api.group);
    });
    this.scene.add(g);
    this._podium = { group: g, figs, t: 0, spot: new THREE.PointLight(0xffe2a0, 110, 40, 1.4) }; this._podium.spot.position.set(0, 6, 4); g.add(this._podium.spot);
    this.sky.visible = false; this.parts.visible = true;
    this.scene.fog = null; this.scene.background = new THREE.Color(0x07090f);
    this.hemi.color.set(0xa8bcff); this.hemi.groundColor.set(0x2a2a38); this.hemi.intensity = 1.1;
    this.sun.color.set(0xfff0dc); this.sun.intensity = 2.6; this.sunDir.set(-0.4, 0.8, 0.6).normalize();
    this.followSun(0, 0, 0); this.renderer.toneMappingExposure = 1.05;
    if (this.bloom) { this.bloom.strength = 0.45; this.bloom.threshold = 0.85; }
  }
  updatePodium(dt) {
    const P = this._podium; if (!P) return; P.t += dt;
    P.figs.forEach((o, i) => {
      const w = Math.sin(P.t * 5 + o.ph) * 0.18;
      o.arms[0].rotation.z = (i === 0 ? -0.28 : 0.9) + w * (i === 0 ? 0.15 : 1); o.arms[1].rotation.z = (i === 0 ? 0.28 : -0.9) - w * (i === 0 ? 0.15 : 1);
      o.f.position.y = o.y0 + Math.abs(Math.sin(P.t * 3.2 + o.ph)) * (i === 0 ? 0.08 : 0.12);
      if (o.trophy) o.trophy.rotation.y = P.t * 1.2;
    });
    for (let k = 0; k < 2; k++) { const c = [[1, .8, .2], [1, .3, .5], [.3, .7, 1], [.4, 1, .5]][(Math.random() * 4) | 0]; this.emit((Math.random() - .5) * 10, 7 + Math.random() * 2, (Math.random() - .5) * 5, (Math.random() - .5) * 0.8, -2.2 - Math.random(), (Math.random() - .5) * 0.8, 3, 0.16, c[0], c[1], c[2]); }
    this._updParticles(dt);
    const cam = this.camera; cam.fov = 40; cam.position.set(Math.sin(P.t * 0.3) * 1.6, 2.5, 10.8); cam.lookAt(0, 0.9, 0); cam.updateProjectionMatrix();
  }
  _hideGarage() { if (this.headlight) this.headlight.intensity = 0; if (this._garage) this.scene.remove(this._garage.group); this.sky.visible = true; this.parts.visible = true; }
  setGarageCar(o) {
    const G = this._garage; if (!G) return;
    const sig = JSON.stringify(o);
    if (G.sig === sig) return; G.sig = sig;
    if (G.car) { G.group.remove(G.car.group); }
    const api = makeCar(o); this._prepCar(api); api.group.position.y = 0.18; G.group.add(api.group); G.car = api;
    api.group.traverse(m => { if (m.isMesh) m.castShadow = true; });
  }
  updateGarage(dt, focus) {
    const G = this._garage; if (!G || !G.car) return;
    G.t += dt;
    G.car.group.rotation.y = G.t * 0.35;
    const cam = this.camera, r = focus === 'helmet' ? 2.6 : 8.2, h = focus === 'helmet' ? 1.5 : 2.6;
    const ox = focus === 'helmet' ? -0.9 : -2.6;
    cam.position.set(Math.sin(0.4) * r + ox, h, Math.cos(0.4) * r); cam.lookAt(ox, focus === 'helmet' ? 0.75 : 0.65, 0);
    cam.fov = 38; cam.updateProjectionMatrix();
  }
}
