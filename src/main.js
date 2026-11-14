import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { WORLD, lonLatToXZ, metresToY } from './geo.js';
import { loadHeights, makeSampler, coastDistance, buildTerrain, buildSea } from './terrain.js';
import { buildMonument, galley } from './monuments.js';
import { SITES, ROADS, SOURCES } from './sites.js';
import NARRATION from './narration.json';
import RIVERS from './rivers.json';
import { Sound } from './audio.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer / scene ----------
const LOW = new URLSearchParams(location.search).get('q') === 'low';
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
} catch (e) {
  $('#loading').textContent = 'This map needs WebGL, which this browser or device could not start.';
  throw e;
}
renderer.setPixelRatio(LOW ? 1 : Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = !LOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbfd6e6, 0.0016);
scene.background = new THREE.Color(0xbfd6e6);

const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 4000);
camera.position.set(-40, 420, 380);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
controls.minDistance = 2.5;
controls.maxDistance = 950;
controls.zoomSpeed = 0.9;
controls.screenSpacePanning = false;
controls.autoRotateSpeed = 0.5;

const hemi = new THREE.HemisphereLight(0xdcecff, 0x8a7a5a, 0.85);
const sun = new THREE.DirectionalLight(0xfff2dc, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);

// sky dome with a soft horizon gradient and a sun disc
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1800, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop,uHorizon,uSunDir,uSunCol; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y,0.0,1.0); vec3 c = mix(uHorizon,uTop,pow(h,0.45));
        c = mix(c, uTop*0.22, smoothstep(0.02,-0.4,vDir.y)); // the map floats over deep blue
        float s = max(dot(normalize(vDir),uSunDir),0.0); c += uSunCol*(pow(s,600.0)*1.5 + pow(s,12.0)*0.35);
        gl_FragColor = vec4(c,1.0); }`,
  }),
);
scene.add(sky);

// ---------- state ----------
const state = { selected: -1, hovered: -1, tour: false, dusk: 0, duskTarget: 0, roads: true, started: false };
const sound = new Sound();
const siteObjs = [];
let sampleH = () => 0;
let sea, roadGroup, roadMats = [], riverMat, trees, ships = [], clouds = [], mapLabels = [];
const groundY = (x, z) => metresToY(Math.max(sampleH(x, z), 0));

// ---------- build world ----------
async function init() {
  // fonts are baked into canvas textures and measured for label layout, so wait for them (briefly)
  const fonts = document.fonts ? Promise.all([document.fonts.load('600 96px Cinzel'), document.fonts.load('italic 500 96px "EB Garamond"')]) : Promise.resolve();
  const [heights] = await Promise.all([
    loadHeights(import.meta.env.BASE_URL + 'heightmap.png'),
    Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).catch(() => {}),
  ]);
  sampleH = makeSampler(heights);
  const dist = coastDistance(heights);
  const terrain = buildTerrain(heights, dist, LOW ? 2 : 1);
  scene.add(terrain.group);
  sea = buildSea(heights, dist);
  scene.add(sea);
  buildSites();
  buildRivers();
  buildRoads();
  trees = buildTrees();
  buildShips();
  buildClouds();
  buildMapLabels();
  buildUI();
  applyLighting();
  resize();
  controls.target.set(8, 0, 22);
  $('#loading').textContent = '';
  for (const b of document.querySelectorAll('#intro button')) b.disabled = false;
  renderer.setAnimationLoop(frame);
  window.__ready = true;
  const fromHash = SITES.findIndex((s) => '#' + s.id === location.hash);
  if (fromHash >= 0) { begin(false, true); select(fromHash, { instant: true }); }
}

function buildSites() {
  SITES.forEach((s, i) => {
    const [x, z] = lonLatToXZ(s.lon, s.lat);
    const y = groundY(x, z);
    const root = new THREE.Group();
    root.position.set(x, y, z);
    const model = buildMonument(s.model);
    model.position.y = 0.42;
    root.add(model);
    // beacon
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.06, 5, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    beam.position.y = 3.6;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.3, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false, fog: false }),
    );
    ring.renderOrder = 1; ring.rotation.x = -Math.PI / 2; ring.position.y = 0.24;
    const lamp = new THREE.PointLight(0xffb060, 0, 9, 1.6);
    lamp.position.y = 1.4;
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 2.4, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.9; hit.userData.site = i;
    root.add(beam, ring, lamp, hit);
    scene.add(root);

    const el = document.createElement('div');
    el.className = 'label';
    el.innerHTML = `<span class="num">${i + 1}</span><span class="txt">${s.name}<small>${s.modern.split(' · ')[0]}</small></span>`;
    el.addEventListener('click', () => select(i));
    // labels sit above the canvas: pass zooming through to the map
    el.addEventListener('wheel', (e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
    el.addEventListener('pointerenter', () => { state.hovered = i; });
    el.addEventListener('pointerleave', () => { if (state.hovered === i) state.hovered = -1; });
    $('#labels').appendChild(el);
    siteObjs.push({ site: s, root, model, beam, ring, lamp, hit, el, pos: new THREE.Vector3(x, y, z), scale: 1, w: 0 });
  });
}

function buildRivers() {
  // valley-floor traces from the DEM (tools/trace_rivers.py)
  riverMat = new LineMaterial({ color: 0x3f9fc4, linewidth: 3, transparent: true, opacity: 0.95, depthWrite: false });
  for (const pts of Object.values(RIVERS)) {
    const flat = [];
    const curve = new THREE.CatmullRomCurve3(pts.map(([lon, lat]) => { const [x, z] = lonLatToXZ(lon, lat); return new THREE.Vector3(x, 0, z); }));
    for (const p of curve.getSpacedPoints(pts.length * 4)) flat.push(p.x, groundY(p.x, p.z) + 0.05, p.z);
    const line = new Line2(new LineGeometry().setPositions(flat), riverMat);
    line.renderOrder = 1;
    scene.add(line);
  }
}

function buildRoads() {
  roadGroup = new THREE.Group();
  // screen-space lines so the roads read at every zoom without becoming motorways up close
  const mk = (color, px, opacity) => new LineMaterial({ color, linewidth: px, transparent: true, opacity, depthWrite: false });
  roadMats = [mk(0x6e2418, 5.5, 0.8), mk(0xfff0c4, 2.6, 1)];
  const ms = new THREE.MeshStandardMaterial({ color: 0xf4ecd9, roughness: 0.6 });
  const msGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.3, 8);
  for (const r of ROADS) {
    const pts = r.pts.map(([lon, lat]) => { const [x, z] = lonLatToXZ(lon, lat); return new THREE.Vector3(x, 0, z); });
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const len = curve.getLength(), n = Math.round(len * 3);
    const draped = curve.getSpacedPoints(n).map((p) => { p.y = groundY(p.x, p.z) + 0.07; return p; });
    const flat = draped.flatMap((p) => [p.x, p.y, p.z]);
    roadMats.forEach((m, k) => {
      // lift the pale centre line a little so it never z-fights its dark casing
      const line = new Line2(new LineGeometry().setPositions(k ? flat.map((v, q) => (q % 3 === 1 ? v + 0.05 : v)) : flat), m);
      line.renderOrder = 2 + k;
      roadGroup.add(line);
    });
    // a milestone every Roman mile would be a forest; one every ~8 km
    for (let d = 4; d < len - 2; d += 8) {
      const p = draped[Math.round((d / len) * n)];
      const m = new THREE.Mesh(msGeo, ms);
      m.position.set(p.x + 0.12, p.y + 0.1, p.z); m.castShadow = true;
      roadGroup.add(m);
    }
  }
  scene.add(roadGroup);
}

function buildTrees() {
  // scatter pines/olives around each site so close-ups have life; purely decorative
  const geo = new THREE.ConeGeometry(0.05, 0.17, 5); geo.translate(0, 0.085, 0);
  const per = LOW ? 260 : 650;
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), per * SITES.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  let n = 0, seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const o of siteObjs) {
    for (let k = 0; k < per * 3 && n < (siteObjs.indexOf(o) + 1) * per; k++) {
      const a = rnd() * 6.283, r = 1.7 + Math.pow(rnd(), 1.4) * 13; // dense near the site, thinning out
      const x = o.pos.x + Math.cos(a) * r, z = o.pos.z + Math.sin(a) * r;
      const h = sampleH(x, z);
      if (h < 6 || h > 1900 || rnd() > 0.35 + 0.65 * Math.min(1, h / 500) || siteObjs.some((s) => Math.hypot(s.pos.x - x, s.pos.z - z) < 1.6)) continue;
      const s = 0.6 + rnd() * 0.9;
      p.set(x, metresToY(h) - 0.01, z); sc.set(s * (0.7 + rnd() * 0.6), s, s * (0.7 + rnd() * 0.6));
      mesh.setMatrixAt(n, m4.compose(p, q, sc));
      mesh.setColorAt(n, col.setHSL(0.27 + rnd() * 0.08, 0.35 + rnd() * 0.2, 0.2 + rnd() * 0.12));
      n++;
    }
  }
  mesh.count = n; mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

function buildShips() {
  const routes = [
    { c: [20, 62], rx: 34, rz: 9, speed: 0.045, phase: 0, sail: 0xc9412f },
    { c: [-58, 78], rx: 22, rz: 6, speed: -0.06, phase: 2, sail: 0xe9dcc0 },
    { c: [82, 48], rx: 14, rz: 7, speed: 0.07, phase: 4, sail: 0x7a2c8f },
  ];
  for (const r of routes) {
    const s = galley(r.sail);
    s.scale.setScalar(2.4);
    s.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    scene.add(s);
    ships.push({ obj: s, ...r });
  }
}

function buildClouds() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grd.addColorStop(0, 'rgba(255,255,255,.95)'); grd.addColorStop(0.5, 'rgba(255,255,255,.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 9; i++) {
    const grp = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
      sp.scale.set(16 + 10 * Math.sin(i * 3 + k), 7 + 2 * Math.cos(k * 2 + i), 1);
      sp.position.set((k - 2) * 6, Math.sin(k * 1.7 + i) * 1.2, Math.cos(k * 2.3 + i) * 4);
      grp.add(sp);
    }
    grp.position.set(-WORLD.w / 2 + ((i * 53) % WORLD.w), 15 + (i % 3) * 2.5, -70 + ((i * 37) % 95));
    scene.add(grp); clouds.push(grp);
  }
}

function buildMapLabels() {
  // engraved, map-style names lying on the landscape
  const defs = [
    ['MARE INTERNVM', 34.45, 36.2, 15, 0.1, 0x16384f, 0.5],
    ['TAVRVS MONS', 34.35, 37.1, 11, 0.42, 0x2a1c0e, 0.8],
    ['CILICIA TRACHEIA', 33.2, 36.36, 8, -0.2, 0x2a1c0e, 0.75],
    ['CILICIA PEDIAS', 34.98, 36.72, 6.5, 0.3, 0x2a1c0e, 0.7],
    ['Calycadnus fl.', 33.6, 36.52, 3.2, 0.5, 0x16384f, 0.75],
    ['Lamos fl.', 34.12, 36.66, 2.4, 0.9, 0x16384f, 0.75],
    ['Cydnus fl.', 34.94, 37.02, 2.6, -1.2, 0x16384f, 0.75],
    ['Pylae Ciliciae', 34.66, 37.3, 3.6, 0, 0x5a1a10, 0.75],
    ['CYPRVS ↓', 33.35, 35.95, 5, 0, 0x16384f, 0.5],
  ];
  for (const [text, lon, lat, size, rot, color, op] of defs) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = `${text === text.toUpperCase() ? '600' : 'italic 500'} 96px ${text === text.toUpperCase() ? 'Cinzel, "Trajan Pro", Georgia, serif' : '"EB Garamond", Georgia, serif'}`;
    g.font = font;
    const sp = text === text.toUpperCase() ? 26 : 4;
    const wpx = [...text].reduce((a, ch) => a + g.measureText(ch).width + sp, 0) + 40;
    c.width = Math.ceil(wpx); c.height = 140;
    g.font = font; g.fillStyle = '#' + new THREE.Color(color).getHexString(); g.textBaseline = 'middle';
    let x = 20; for (const ch of text) { g.fillText(ch, x, 74); x += g.measureText(ch).width + sp; }
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry((size * c.width) / 140, size),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, depthTest: false, depthWrite: false, fog: false }),
    );
    const [px, pz] = lonLatToXZ(lon, lat);
    m.rotation.set(-Math.PI / 2, 0, rot);
    m.position.set(px, groundY(px, pz) + 1.2, pz);
    m.renderOrder = 5; m.userData.op = op;
    scene.add(m); mapLabels.push(m);
  }
}

// ---------- lighting (day <-> golden hour) ----------
const L = {
  top: [new THREE.Color(0x3f86d6), new THREE.Color(0x44629f)],
  horizon: [new THREE.Color(0xc4dcec), new THREE.Color(0xf4d2b2)],
  sun: [new THREE.Color(0xfff2dc), new THREE.Color(0xffb46e)],
  hemiSky: [new THREE.Color(0xdcecff), new THREE.Color(0xb9c2e6)],
  hemiGround: [new THREE.Color(0x8a7a5a), new THREE.Color(0x8a6a4a)],
  shallow: [new THREE.Color(0x5fd0c8), new THREE.Color(0x6fc2b4)],
  deep: [new THREE.Color(0x0d4470), new THREE.Color(0x14406e)],
};
const sunDir = new THREE.Vector3();
function applyLighting() {
  const t = state.dusk;
  const mix = (k, out) => out.copy(L[k][0]).lerp(L[k][1], t);
  const elev = THREE.MathUtils.lerp(0.9, 0.32, t), az = THREE.MathUtils.lerp(-2.2, -2.75, t);
  sunDir.set(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az)).normalize();
  mix('sun', sun.color); sun.intensity = THREE.MathUtils.lerp(2.5, 2.9, t);
  mix('hemiSky', hemi.color); mix('hemiGround', hemi.groundColor); hemi.intensity = THREE.MathUtils.lerp(0.85, 0.7, t);
  const u = sky.material.uniforms;
  mix('top', u.uTop.value); mix('horizon', u.uHorizon.value); u.uSunDir.value.copy(sunDir); u.uSunCol.value.copy(sun.color);
  scene.fog.color.copy(u.uHorizon.value); scene.fog.density = THREE.MathUtils.lerp(0.0016, 0.002, t);
  if (sea) {
    const su = sea.material.uniforms;
    mix('shallow', su.uShallow.value); mix('deep', su.uDeep.value); su.uSun.value.copy(sun.color);
    su.uLight.value = THREE.MathUtils.lerp(1, 0.92, t);
    su.fogColor.value.copy(scene.fog.color); su.fogDensity.value = scene.fog.density;
  }
  for (const o of siteObjs) { o.lamp.intensity = t * 2.2; o.lamp.visible = t > 0.01; }
  renderer.toneMappingExposure = THREE.MathUtils.lerp(1.05, 1.15, t);
}

// ---------- camera flights ----------
let flight = null;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(target, camPos, dur = 2.4, onDone) {
  if (reduceMotion) dur = 0.01;
  flight = { t: 0, dur, fromT: controls.target.clone(), toT: target.clone(), fromP: camera.position.clone(), toP: camPos.clone(), onDone };
  controls.autoRotate = false;
}
const OVERVIEW = { target: new THREE.Vector3(8, 0, 22), pos: new THREE.Vector3(-18, 118, 196) };
function overviewPose() {
  // pull back further on narrow screens so the whole coast fits
  const k = Math.max(1, 1.62 / camera.aspect);
  const off = OVERVIEW.pos.clone().sub(OVERVIEW.target);
  if (camera.aspect < 1) off.set(0, 190, 130); // portrait: look more steeply down
  return { target: OVERVIEW.target, pos: OVERVIEW.target.clone().add(off.multiplyScalar(k)) };
}

function select(i, { instant = false, fromTour = false } = {}) {
  if (i < 0 || i >= SITES.length) return;
  if (!fromTour && state.tour) stopTour();
  state.selected = i;
  const o = siteObjs[i];
  renderPanel(i);
  history.replaceState(null, '', '#' + o.site.id);
  // approach from the sea side (south), keeping roughly the current bearing
  const cur = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  const az = THREE.MathUtils.clamp(cur, -0.9, 0.9);
  const dist = 6.2, polar = THREE.MathUtils.degToRad(62);
  const narrow = innerWidth < 760;
  const target = o.pos.clone(); target.y += 0.75;
  if (narrow) target.y -= 1.1; // leave room for the bottom sheet
  const pos = target.clone().add(new THREE.Vector3(Math.sin(az) * Math.sin(polar), Math.cos(polar), Math.cos(az) * Math.sin(polar)).multiplyScalar(dist));
  sound.play('whoosh', 0.35);
  flyTo(target, pos, instant ? 0.01 : 2.6, () => { controls.autoRotate = !reduceMotion; sound.play('chime', 0.3); });
  narrate(o.site.id);
}

function deselect() {
  if (state.tour) stopTour();
  state.selected = -1;
  $('#panel').hidden = true; document.body.classList.remove('panel-open');
  for (const b of document.querySelectorAll('#sitelist button')) b.classList.remove('active');
  history.replaceState(null, '', location.pathname + location.search);
  controls.autoRotate = false;
  sound.stopVoice(); hideCaption();
}

function goHome() {
  if (state.tour) stopTour();
  deselect();
  const p = overviewPose();
  sound.play('whoosh', 0.3);
  flyTo(p.target, p.pos, 2.4);
}

// ---------- narration ----------
let captionTimer = 0, narrateToken = 0;
function hideCaption() { $('#caption').hidden = true; clearTimeout(captionTimer); }
async function narrate(key, onEnd) {
  const text = NARRATION[key];
  const mine = ++narrateToken;
  hideCaption();
  const dur = await sound.narrate(key, () => { hideCaption(); onEnd && onEnd(); });
  if (mine !== narrateToken || (dur === false && sound.enabled)) return; // superseded by a newer narration
  $('#caption').textContent = text; $('#caption').hidden = false;
  // without sound the script is shown as a caption for a reading-time interval, and the tour still advances
  if (!dur) captionTimer = setTimeout(() => { hideCaption(); onEnd && onEnd(); }, 3500 + text.length * 45);
}

// ---------- tour ----------
function startTour() {
  state.tour = true;
  $('#btn-tour').textContent = '■ Stop tour'; $('#btn-tour').classList.add('on');
  tourStep(state.selected >= 0 ? state.selected : 0);
}
function tourStep(i) {
  if (!state.tour) return;
  select(i, { fromTour: true });
  // select() already started narration; re-arm it with an advance callback
  narrate(SITES[i].id, () => {
    captionTimer = setTimeout(() => { if (state.tour) (i + 1 < SITES.length ? tourStep(i + 1) : (stopTour(), goHome())); }, 2500);
  });
}
function stopTour() {
  state.tour = false; clearTimeout(captionTimer);
  $('#btn-tour').textContent = '▶ Tour'; $('#btn-tour').classList.remove('on');
}

// ---------- UI ----------
function renderPanel(i) {
  const s = SITES[i];
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  $('#panel-body').innerHTML = `
    <div class="eyebrow">Site ${i + 1} of ${SITES.length}</div>
    <h2>${esc(s.name)}</h2>
    <div class="modern">today: ${esc(s.modern)}</div>
    <button class="listen" id="listen">♪ Listen</button>
    <div class="tagline">${esc(s.tagline)}</div>
    <div class="chips">${s.era.map((e) => `<span>${esc(e)}</span>`).join('')}</div>
    ${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>Look for</h3><ul>${s.look.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <div class="fun">${esc(s.fun)}</div>
    <h3>How we know</h3><p class="evidence">${esc(s.evidence)}</p>
    <h3>Sources</h3><ul class="src">${s.sources.map((k) => `<li><a href="${SOURCES[k].url}" target="_blank" rel="noopener">${esc(SOURCES[k].label)}</a></li>`).join('')}</ul>
    <div class="coords">${s.lat.toFixed(4)}° N, ${s.lon.toFixed(4)}° E · <a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=15/${s.lat}/${s.lon}" target="_blank" rel="noopener">open map</a></div>`;
  $('#panel-body').scrollTop = 0;
  $('#listen').onclick = async () => { if (state.tour) stopTour(); if (!sound.enabled) await setSound(true); narrate(s.id); };
  $('#counter').textContent = `${i + 1} / ${SITES.length}`;
  const panel = $('#panel');
  panel.hidden = false; panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
  document.body.classList.add('panel-open');
  document.querySelectorAll('#sitelist button').forEach((b, k) => b.classList.toggle('active', k === i));
}

async function setSound(on) {
  if (on) await sound.enable(); else sound.disable();
  const b = $('#btn-sound');
  b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '🔊 Sound' : '🔇 Sound';
  if (!on) { hideCaption(); if (state.tour) stopTour(); }
}

function begin(withSound, skipFlight = false) {
  if (state.started) return;
  state.started = true;
  $('#intro').classList.add('gone');
  if (withSound) setSound(true).then(() => narrate('intro'));
  if (!skipFlight) { const p = overviewPose(); flyTo(p.target, p.pos, 4.2); }
}

function buildUI() {
  const list = $('#sitelist');
  SITES.forEach((s, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<span class="n">${i + 1}</span><span class="t">${s.name}</span>`;
    b.title = `${s.name} — ${s.modern}`;
    b.onclick = () => select(i);
    list.appendChild(b);
  });
  if (matchMedia('(pointer: coarse)').matches) $('#hint').textContent = 'Drag to orbit · pinch to zoom · two fingers to pan · tap a beacon';
  $('#begin-sound').onclick = () => begin(true);
  $('#begin-quiet').onclick = () => begin(false);
  $('#panel-close').onclick = deselect;
  const step = (d) => select((state.selected + d + SITES.length) % SITES.length);
  $('#prev').onclick = () => step(-1);
  $('#next').onclick = () => step(1);
  $('#btn-home').onclick = goHome;
  $('#btn-tour').onclick = () => (state.tour ? stopTour() : startTour());
  $('#btn-sound').onclick = () => setSound(!sound.enabled);
  const toggleDusk = () => {
    state.duskTarget = state.duskTarget ? 0 : 1;
    $('#btn-dusk').setAttribute('aria-pressed', String(!!state.duskTarget));
    $('#btn-dusk').textContent = state.duskTarget ? '☾ Golden hour' : '☀ Day';
  };
  $('#btn-dusk').onclick = toggleDusk;
  const toggleRoads = () => { state.roads = !state.roads; roadGroup.visible = state.roads; $('#btn-roads').setAttribute('aria-pressed', String(state.roads)); };
  $('#btn-roads').onclick = toggleRoads;

  addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea') || e.metaKey || e.ctrlKey) return;
    if (!state.started) { if (e.key === 'Enter' && !e.target.closest('button, a')) begin(false); return; }
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Escape') (state.selected >= 0 ? deselect() : goHome());
    else if (k === 'h') goHome();
    else if (k === 't') $('#btn-tour').click();
    else if (k === 'm') $('#btn-sound').click();
    else if (k === 'g') toggleDusk();
    else if (k === 'r') toggleRoads();
    else if (/^[0-9]$/.test(k)) select(k === '0' ? 9 : +k - 1);
  });

  // picking
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(siteObjs.map((o) => o.hit), false)[0];
    return hit ? hit.object.userData.site : -1;
  };
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { state.hovered = pick(e); canvas.classList.toggle('hover', state.hovered >= 0); } });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const i = pick(e);
    if (i >= 0) select(i);
  });
  controls.addEventListener('start', () => { flight = null; controls.autoRotate = false; });
  addEventListener('resize', resize);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  for (const o of siteObjs) o.w = 0;
  for (const m of [...roadMats, riverMat]) m && m.resolution.set(w, h);
}

// drop shadows and retina resolution if the device cannot keep up
let slowFrames = 0, frames = 0, degraded = LOW;
function adaptQuality(dt) {
  if (degraded || !state.started || ++frames < 20) return;
  slowFrames = dt > 0.05 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
  if (slowFrames > 40) { degraded = true; renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; sun.castShadow = false; resize(); }
}

// ---------- frame ----------
const clock = new THREE.Clock();
const v = new THREE.Vector3();
function frame() {
  const rawDt = clock.getDelta(), dt = Math.min(rawDt, 0.05), t = clock.elapsedTime;
  adaptQuality(rawDt);

  if (flight) {
    flight.t += Math.min(rawDt, 0.5) / flight.dur;
    const k = ease(Math.min(flight.t, 1));
    controls.target.lerpVectors(flight.fromT, flight.toT, k);
    camera.position.lerpVectors(flight.fromP, flight.toP, k);
    camera.position.y += Math.sin(k * Math.PI) * Math.min(40, flight.fromP.distanceTo(flight.toP) * 0.18); // arc
    if (flight.t >= 1) { const f = flight; flight = null; f.onDone && f.onDone(); }
  }
  // keep the target on the map and the camera above the ground
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -WORLD.w / 2, WORLD.w / 2);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -WORLD.d / 2, WORLD.d / 2);
  controls.update();
  const floor = groundY(camera.position.x, camera.position.z) + 1.2;
  if (camera.position.y < floor) camera.position.y = floor;

  if (Math.abs(state.dusk - state.duskTarget) > 0.001) {
    state.dusk += Math.sign(state.duskTarget - state.dusk) * Math.min(dt * 0.7, Math.abs(state.duskTarget - state.dusk));
    applyLighting();
  }

  // sun + shadow frustum follow the view
  const dist = camera.position.distanceTo(controls.target);
  const sh = THREE.MathUtils.clamp(dist * 0.6, 8, 90);
  sun.target.position.copy(controls.target);
  sun.position.copy(controls.target).addScaledVector(sunDir, 300);
  const sc = sun.shadow.camera;
  if (Math.abs(sc.right - sh) > 0.5) { sc.left = -sh; sc.right = sh; sc.top = sh; sc.bottom = -sh; sc.near = 50; sc.far = 600; sc.updateProjectionMatrix(); }
  sky.position.copy(camera.position);

  // keep depth precision when far out, so draped roads and rivers do not flicker against the terrain
  const near = THREE.MathUtils.clamp(dist * 0.02, 0.3, 12);
  if (Math.abs(camera.near - near) > 0.05) { camera.near = near; camera.updateProjectionMatrix(); }
  sea.material.uniforms.uTime.value = t;
  // thin the haze when pulled far back (phones), so the whole map stays readable
  const fogD = THREE.MathUtils.lerp(0.0016, 0.002, state.dusk) * Math.min(1, 240 / dist);
  scene.fog.density = fogD; sea.material.uniforms.fogDensity.value = fogD;

  // sites: scale with distance so they read from afar, pulse beacons
  const W = innerWidth, H = innerHeight;
  const placed = [];
  const order = siteObjs.map((_, i) => i).sort((a, b) => (b === state.selected) - (a === state.selected) || (b === state.hovered) - (a === state.hovered) || a - b);
  for (const o of siteObjs) {
    const i = siteObjs.indexOf(o);
    const d = camera.position.distanceTo(o.pos);
    const active = i === state.selected, hov = i === state.hovered;
    const target = THREE.MathUtils.clamp(d / 40, 0.8, 2.3) * (hov && !active ? 1.12 : 1);
    o.scale += (target - o.scale) * Math.min(1, dt * 8);
    o.root.scale.setScalar(o.scale);
    o.beam.material.opacity = (0.35 + 0.2 * Math.sin(t * 2 + i)) * THREE.MathUtils.smoothstep(d, 6, 45);
    o.beam.visible = !active;
    o.ring.scale.setScalar(1 + 0.08 * Math.sin(t * 2.5 + i) + (hov ? 0.12 : 0));
    o.ring.material.opacity = active ? 0.95 : 0.55;
    o.ring.material.color.setHex(active ? 0xff6a3d : 0xffd98a);
  }
  for (const i of order) {
    const o = siteObjs[i];
    v.copy(o.pos); v.y += (i === state.selected ? 2.0 : 2.5) * o.scale;
    v.project(camera);
    const behind = v.z > 1;
    const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
    if (!o.w) { o.el.classList.remove('compact'); o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; }
    let compact = false;
    const rect = (w) => [x - w / 2 - 4, y - o.h - 4, x + w / 2 + 4, y + 4];
    let r = rect(o.w);
    const hits = (r) => placed.some((p) => r[0] < p[2] && r[2] > p[0] && r[1] < p[3] && r[3] > p[1]);
    if (hits(r) && i !== state.selected && i !== state.hovered) { compact = true; r = rect(30); }
    placed.push(r);
    o.el.classList.toggle('compact', compact);
    o.el.classList.toggle('active', i === state.selected);
    o.el.classList.toggle('hidden', behind || !state.started);
    o.el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    o.el.style.zIndex = i === state.selected || i === state.hovered ? 3 : compact ? 1 : 2;
  }

  // ships, clouds, engraved labels
  for (const s of ships) {
    const a = s.phase + t * s.speed;
    s.obj.position.set(s.c[0] + Math.cos(a) * s.rx, 0.12 + Math.sin(t * 1.3 + s.phase) * 0.05, s.c[1] + Math.sin(a) * s.rz);
    const dx = -Math.sin(a) * s.rx * Math.sign(s.speed), dz = Math.cos(a) * s.rz * Math.sign(s.speed);
    s.obj.rotation.y = Math.atan2(-dz, dx);
    s.obj.rotation.z = Math.sin(t * 1.1 + s.phase) * 0.04;
    s.obj.scale.setScalar(THREE.MathUtils.clamp(camera.position.distanceTo(s.obj.position) / 50, 1.2, 3.2));
  }
  for (const c of clouds) { c.position.x += dt * 0.9; if (c.position.x > WORLD.w / 2 + 30) c.position.x = -WORLD.w / 2 - 30; c.visible = camera.position.y > 14; }
  const lf = THREE.MathUtils.smoothstep(dist, 22, 70);
  if (trees) trees.visible = dist < 70;
  for (const m of mapLabels) { m.material.opacity = m.userData.op * lf; m.visible = lf > 0.01; }

  // compass + ambience mix
  const az = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  $('#needle').style.transform = `rotate(${az}rad)`;
  if (sound.enabled) {
    const elevHere = sampleH(controls.target.x, controls.target.z);
    let coast = elevHere <= 1 ? 1 : 0;
    if (!coast) for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; if (sampleH(controls.target.x + Math.cos(a) * 6, controls.target.z + Math.sin(a) * 6) <= 1) { coast = 0.75; break; } }
    const near = 1 - THREE.MathUtils.smoothstep(dist, 25, 140);
    sound.setMix({ sea: coast * (0.25 + 0.75 * near), hills: (1 - coast * 0.8) * near, music: 0.45 + 0.55 * (1 - near) });
  }

  renderer.render(scene, camera);
}

init().catch((e) => { console.error(e); $('#loading').textContent = 'Could not load the map: ' + e.message; });
