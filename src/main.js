import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { WORLD, GRID, lonLatToXZ, metresToY } from './geo.js';
import { loadHeights, makeSampler, coastDistance, buildTerrain, buildSea } from './terrain.js';
import { buildMonument, galley, BASE_DEPTH } from './monuments/index.js';
import { SITES, ROADS, SOURCES } from './sites.js';
import { UI, SITES_TR, NARRATION } from './i18n.js';
import RIVERS from './rivers.json';
import { Sound } from './audio.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');

// ---------- language ----------
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
let lang = new URLSearchParams(location.search).get('lang') || store.get('lang') || ((navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');
if (!UI[lang]) lang = 'en';
const T = () => UI[lang];
// a site with its texts in the current language (coordinates, model and sources are shared)
const loc = (s) => (lang === 'tr' ? { ...s, ...SITES_TR[s.id] } : s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer / scene ----------
const LOW = new URLSearchParams(location.search).get('q') === 'low';
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
} catch (e) {
  $('#loading').textContent = T().noWebgl;
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
controls.minDistance = 0.4; // close enough to walk among the figures of a diorama
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
const state = { paused: false, selected: -1, hovered: -1, tour: false, dusk: 0, duskTarget: 0, roads: true, started: false };
const sound = new Sound();
const siteObjs = [];
const GROUNDED = 0.012; // model height at which a diorama's own ground is flush with the map
let sampleH = () => 0;
let sea, roadGroup, roadMats = [], riverMat, riverGhost, trees, ships = [], clouds = [], mapLabels = [];
const groundY = (x, z) => metresToY(Math.max(sampleH(x, z), 0));

// ---------- build world ----------
async function init() {
  // fonts are baked into canvas textures and measured for label layout, so wait for them (briefly)
  const fonts = document.fonts ? Promise.all([document.fonts.load('600 96px Cinzel'), document.fonts.load('italic 500 96px "EB Garamond"')]) : Promise.resolve();
  const [heights, , cover] = await Promise.all([
    loadHeights(import.meta.env.BASE_URL + 'heightmap.png'),
    Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).catch(() => {}),
    loadLandcover(import.meta.env.BASE_URL + 'landcover.png'),
  ]);
  // level a small terrace under each site (flat to ~1.3 km, easing back to the real slope by ~2.6 km), so the
  // places can sit in the landscape at ground level instead of on a raised stand
  for (const s of SITES) {
    const [x, z] = lonLatToXZ(s.lon, s.lat), ci = (x / WORLD.w + 0.5) * (GRID.w - 1), cj = (z / WORLD.d + 0.5) * (GRID.h - 1);
    const kx = WORLD.w / (GRID.w - 1), kz = WORLD.d / (GRID.h - 1), R = 2.7;
    const h0 = Math.max(1, heights[Math.round(cj) * GRID.w + Math.round(ci)]);
    for (let j = Math.max(0, Math.floor(cj - R / kz)); j <= Math.min(GRID.h - 1, Math.ceil(cj + R / kz)); j++)
      for (let i = Math.max(0, Math.floor(ci - R / kx)); i <= Math.min(GRID.w - 1, Math.ceil(ci + R / kx)); i++) {
        const k = j * GRID.w + i, d = Math.hypot((i - ci) * kx, (j - cj) * kz);
        if (heights[k] >= 0.5) heights[k] += (h0 - heights[k]) * (1 - THREE.MathUtils.smoothstep(d, 1.3, 2.6)); // the sea stays sea
      }
  }
  sampleH = makeSampler(heights);
  const dist = coastDistance(heights);
  const terrain = buildTerrain(heights, dist, LOW ? 2 : 1, LOW, cover);
  scene.add(terrain.group);
  sea = buildSea(heights, dist);
  scene.add(sea);
  buildSites();
  buildRivers();
  buildRoads();
  trees = buildTrees(cover);
  buildShips();
  buildClouds();
  buildMapLabels();
  buildUI();
  state.ready = true;
  setLang(lang);
  applyLighting();
  resize();
  controls.target.set(8, 0, 22);
  $('#loading').textContent = '';
  for (const b of document.querySelectorAll('#intro button')) b.disabled = false;
  $('#begin-sound').focus({ preventScroll: true });
  renderer.setAnimationLoop(frame);
  window.__ready = true;
  // test hook: look at lon/lat from azimuth (deg, 0 = from the south), elevation (deg) and distance (km)
  window.__pose = ([lon, lat], az, el, d) => {
    if (state.tour) stopTour(); if (state.selected >= 0) deselect(); hideCaption(); flight = null; controls.autoRotate = false;
    const [x, z] = lonLatToXZ(lon, lat), A = THREE.MathUtils.degToRad(az), E = THREE.MathUtils.degToRad(el);
    controls.target.set(x, groundY(x, z), z);
    camera.position.set(x + Math.sin(A) * Math.cos(E) * d, groundY(x, z) + Math.sin(E) * d, z + Math.cos(A) * Math.cos(E) * d);
    controls.update();
  };
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
    model.position.y = GROUNDED; // sunk to ground level; rises on its stand when selected (see frame)
    root.add(model);
    // beacon
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.06, 5, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    beam.position.y = 3.6;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.26, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, depthTest: false, fog: false }),
    );
    ring.renderOrder = 1; ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
    const lamp = new THREE.PointLight(0xffb060, 0, 9, 1.6);
    lamp.position.y = 1.4;
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 2.4, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.9; hit.userData.site = i;
    root.add(beam, ring, lamp, hit);
    scene.add(root);

    const el = document.createElement('div');
    el.className = 'label';
    el.innerHTML = `<span class="num">${i + 1}</span><span class="txt"></span>`;
    el.addEventListener('click', () => select(i));
    // labels sit above the canvas: pass zooming through to the map
    el.addEventListener('wheel', (e) => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, { passive: false });
    el.addEventListener('pointerenter', () => { state.hovered = i; });
    el.addEventListener('pointerleave', () => { if (state.hovered === i) state.hovered = -1; });
    $('#labels').appendChild(el);
    siteObjs.push({ site: s, root, model, beam, ring, lamp, hit, el, pos: new THREE.Vector3(x, y, z), scale: 1, w: 0, lift: 0 });
  });
}

function buildRivers() {
  // valley-floor traces from the DEM (tools/trace_rivers.py)
  riverMat = new LineMaterial({ color: 0x3f9fc4, linewidth: 3, transparent: true, opacity: 0.95, depthWrite: false });
  // a faint second pass shows a river's course where a ridge hides its gorge
  const ghost = new LineMaterial({ color: 0x3f9fc4, linewidth: 2, transparent: true, opacity: 0.28, depthWrite: false, depthTest: false });
  riverGhost = ghost;
  for (const pts of Object.values(RIVERS)) {
    const flat = [];
    // the traces step from cell to cell; every third point through a spline gives a natural course
    const thin = pts.filter((_, k) => k % 3 === 0 || k === pts.length - 1);
    const curve = new THREE.CatmullRomCurve3(thin.map(([lon, lat]) => { const [x, z] = lonLatToXZ(lon, lat); return new THREE.Vector3(x, 0, z); }));
    for (const p of curve.getSpacedPoints(pts.length * 10)) flat.push(p.x, groundY(p.x, p.z) + 0.08, p.z);
    const line = new Line2(new LineGeometry().setPositions(flat), riverMat);
    line.renderOrder = 1;
    scene.add(line, new Line2(line.geometry, ghost));
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

// Trees for the map itself, placed from ESA WorldCover 2021 (public/landcover.png: tree, shrub and cropland
// fractions per terrain cell) and chosen by the real vegetation belts of the Cilician Taurus: Turkish red pine
// (Pinus brutia) up to ~1,000 m, black pine above it, Taurus cedar and Cilician fir in the high belt
// (~1,300-2,000 m), juniper scattered towards the treeline; olives and carobs among the lowland fields, maquis
// on the scrub. Trees are drawn in map chunks, one instanced mesh per species per chunk, and only the chunks
// near the camera are shown.
function treeGeometries() {
  const part = (geo, rgb, matrix) => {
    geo = geo.index ? geo.toNonIndexed() : geo; geo.deleteAttribute('uv'); if (matrix) geo.applyMatrix4(matrix);
    const n = geo.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 3) { const k = 0.82 + 0.36 * Math.abs(Math.sin(i * 12.9898 + rgb[1] * 78.2)); for (let v = 0; v < 3; v++) c.set([rgb[0] * k, rgb[1] * k, rgb[2] * k], (i + v) * 3); } // per-face tone
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); geo.computeVertexNormals();
    return geo;
  };
  const T = (x, y, z, sx, sy = sx, sz = sx, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
  const LEAF = [1, 1, 1], BARK = [1.7, 0.75, 0.75]; // bark is over-driven so the green instance tint still leaves it brown
  const bole = (h, r) => part(new THREE.CylinderGeometry(r * 0.6, r, h, 4, 1, true), BARK, T(0, h / 2, 0, 1));
  const blob = (x, y, z, r, flat, ry = 0) => part(new THREE.IcosahedronGeometry(1, 0), LEAF, T(x, y, z, r, r * flat, r, ry));
  const cone = (y, r, h, seg = 6) => part(new THREE.ConeGeometry(r, h, seg, 1, true), LEAF, T(0, y, 0, 1));
  return {
    // red pine: tall clean trunk under an irregular, open, rounded crown
    brutia: mergeGeometries([bole(0.06, 0.008), blob(0, 0.075, 0, 0.032, 0.8), blob(0.018, 0.062, 0.01, 0.022, 0.75, 1), blob(-0.016, 0.066, -0.012, 0.022, 0.75, 2)]),
    // black pine: denser, more conical crown
    nigra: mergeGeometries([bole(0.04, 0.008), cone(0.07, 0.034, 0.08, 6), blob(0, 0.098, 0, 0.018, 1.1)]),
    // Taurus cedar: flat layered tiers, broad
    cedar: mergeGeometries([bole(0.035, 0.009), cone(0.045, 0.05, 0.03, 7), cone(0.07, 0.04, 0.03, 7), cone(0.093, 0.028, 0.028, 7), cone(0.112, 0.014, 0.026, 6)]),
    // Cilician fir: narrow dark spire
    fir: mergeGeometries([bole(0.02, 0.006), cone(0.06, 0.024, 0.1, 6), cone(0.095, 0.015, 0.06, 6)]),
    // olive / carob / juniper / maquis: low rounded bush-trees (scaled per instance)
    olive: mergeGeometries([bole(0.02, 0.008), blob(0, 0.032, 0, 0.026, 0.7), blob(0.016, 0.028, 0.008, 0.017, 0.7, 1.3)]),
  };
}
async function loadLandcover(url) {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = GRID.w; c.height = GRID.h;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, GRID.w, GRID.h).data;
}
function buildTrees(cover) {
  const geos = treeGeometries(), group = new THREE.Group(), chunks = [];
  const material = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true, vertexColors: true });
  // trees shrink to nothing towards the edge of the drawn radius instead of stopping on a line
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uTreeC = treeFade.c; sh.uniforms.uTreeR = treeFade.r;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uTreeC; uniform float uTreeR;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n transformed *= 1.0 - smoothstep(uTreeR * 0.6, uTreeR, distance(instanceMatrix[3].xz, uTreeC.xz));\n#endif');
  };
  // hue, saturation, lightness per species (instance tint over the vertex tones)
  // crowns are kept a little darker than the forest floor colour so woods read as mass, not sparkle
  const tint = { brutia: [0.27, 0.42, 0.15], nigra: [0.3, 0.4, 0.12], cedar: [0.38, 0.32, 0.13], fir: [0.4, 0.4, 0.1], olive: [0.21, 0.2, 0.19], carob: [0.28, 0.45, 0.15], juniper: [0.33, 0.25, 0.16], maquis: [0.25, 0.35, 0.17] };
  const geoOf = { brutia: 'brutia', nigra: 'nigra', cedar: 'cedar', fir: 'fir', olive: 'olive', carob: 'olive', juniper: 'olive', maquis: 'olive' };
  const CH = 32, cx = Math.ceil(GRID.w / CH), cz = Math.ceil(GRID.h / CH); // chunks of 32 x 32 cells (~8 km)
  const dens = LOW ? 0.45 : 1; // trees per fully forested cell (~260 m)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const cellW = WORLD.w / (GRID.w - 1), cellD = WORLD.d / (GRID.h - 1);
  for (let bz = 0; bz < cz; bz++) for (let bx = 0; bx < cx; bx++) {
    const list = {};
    const add = (kind, x, z, y, s) => (list[kind] ||= []).push(x, y, z, s);
    for (let j = bz * CH; j < Math.min(GRID.h, (bz + 1) * CH); j++) for (let i = bx * CH; i < Math.min(GRID.w, (bx + 1) * CH); i++) {
      const k = (j * GRID.w + i) * 4, tree = cover[k] / 255, shrub = cover[k + 1] / 255, crop = cover[k + 2] / 255;
      // clumped: stands and clearings rather than an even sprinkle
      const clump = 0.35 + 1.3 * (0.5 + 0.5 * Math.sin(i * 0.37 + Math.sin(j * 0.23) * 2.1) * Math.cos(j * 0.31 + Math.sin(i * 0.19) * 1.7));
      let n = (tree * (0.6 + 3.2 * tree) * 1.5 + shrub * 0.9 + crop * 0.15) * dens * clump;
      for (; n > 0; n--) {
        if (n < 1 && rnd() > n) break;
        const x = (i + rnd() - 0.5) * cellW - WORLD.w / 2, z = (j + rnd() - 0.5) * cellD - WORLD.d / 2, h = sampleH(x, z);
        if (h < 2 || siteObjs.some((o) => Math.abs(o.pos.x - x) < 1.6 && Math.abs(o.pos.z - z) < 1.6)) continue;
        const u = rnd(), r = rnd() * (tree + shrub + crop);
        let kind;
        if (r < tree) { // forest, by altitude belt (with some overlap)
          const e = h + (rnd() - 0.5) * 300;
          kind = h < 110 ? (u < 0.6 ? 'olive' : 'carob') // tree cover on the plains is orchard, not forest
            : e < 350 ? (u < 0.45 ? 'brutia' : u < 0.85 ? 'maquis' : 'carob') // coastal slopes: pine over dense maquis
            : e < 1000 ? (u < 0.9 ? 'brutia' : 'carob') : e < 1350 ? (u < 0.6 ? 'nigra' : 'brutia') : e < 2000 ? (u < 0.45 ? 'cedar' : u < 0.75 ? 'fir' : u < 0.9 ? 'nigra' : 'juniper') : 'juniper';
        } else if (r < tree + shrub) kind = h < 900 ? 'maquis' : 'juniper';
        else kind = h < 500 ? (u < 0.7 ? 'olive' : 'carob') : 'olive';
        const s = (kind === 'maquis' ? 0.75 : kind === 'juniper' ? 0.8 : 1.25) * (0.5 + rnd() * rnd() * 1.4);
        add(kind, x, z, metresToY(h) - 0.004, s);
      }
    }
    const meshes = [];
    for (const kind in list) {
      const a = list[kind], cnt = a.length / 4, t = tint[kind];
      const mesh = new THREE.InstancedMesh(geos[geoOf[kind]], material, cnt);
      for (let k = 0; k < cnt; k++) {
        const s = a[k * 4 + 3];
        p.set(a[k * 4], a[k * 4 + 1], a[k * 4 + 2]); sc.set(s * (0.85 + rnd() * 0.3), s * (0.9 + rnd() * 0.25), s * (0.85 + rnd() * 0.3));
        mesh.setMatrixAt(k, m4.compose(p, q.setFromAxisAngle(up, rnd() * 6.283), sc));
        mesh.setColorAt(k, col.setHSL(t[0] + (rnd() - 0.5) * 0.04, t[1] + (rnd() - 0.5) * 0.1, t[2] + (rnd() - 0.5) * 0.05));
      }
      mesh.castShadow = !LOW; mesh.receiveShadow = false;
      mesh.computeBoundingSphere();
      meshes.push(mesh); group.add(mesh);
    }
    if (meshes.length) chunks.push({ meshes, x: ((bx + 0.5) * CH) * cellW - WORLD.w / 2, z: ((bz + 0.5) * CH) * cellD - WORLD.d / 2 });
  }
  scene.add(group);
  group.userData.chunks = chunks;
  return group;
}
const treeFade = { c: { value: new THREE.Vector3() }, r: { value: 20 } };
// show only the tree chunks around the point the camera looks at (and none from far out)
function updateTrees(dist) {
  if (!trees) return;
  // beyond ~40 km a tree is smaller than a pixel and the forest colour of the ground carries the canopy
  const r = Math.min(28, 10 + dist * 0.4) * (degraded ? 0.6 : 1), tx = controls.target.x, tz = controls.target.z, on = dist < 58;
  treeFade.c.value.copy(controls.target); treeFade.r.value = r;
  for (const c of trees.userData.chunks) { const v = on && Math.hypot(c.x - tx, c.z - tz) < r + 6; for (const m of c.meshes) m.visible = v; }
}

function buildShips() {
  const routes = [
    { c: [20, 62], rx: 34, rz: 9, speed: 0.045, phase: 0, sail: 0xc9412f },
    { c: [-58, 78], rx: 22, rz: 6, speed: -0.06, phase: 2, sail: 0xe9dcc0 },
    { c: [82, 48], rx: 14, rz: 7, speed: 0.07, phase: 4, sail: 0x7a2c8f },
  ];
  for (const r of routes) {
    const s = galley(new THREE.MeshStandardMaterial({ color: r.sail, side: THREE.DoubleSide, roughness: 0.9 }));
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
    ['AD CYPRVM', 33.35, 35.95, 4.5, 0, 0x16384f, 0.5],
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
  shallow: [new THREE.Color(0x63b3b0), new THREE.Color(0x6fb0a6)],
  deep: [new THREE.Color(0x0d4470), new THREE.Color(0x14406e)],
};
const sunDir = new THREE.Vector3();
function applyLighting() {
  const t = state.dusk;
  const mix = (k, out) => out.copy(L[k][0]).lerp(L[k][1], t);
  const elev = THREE.MathUtils.lerp(0.85, 0.32, t), az = THREE.MathUtils.lerp(-0.95, -1.35, t); // from the south-west, so the seaward faces are lit
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
const OVERVIEW = { target: new THREE.Vector3(8, 0, 22), pos: new THREE.Vector3(-18, 130, 216) };
function overviewPose() {
  // pull back further on narrow screens so the whole coast fits
  const k = Math.max(1, 1.76 / camera.aspect);
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
  const view = o.site.view || {};
  const az = view.az !== undefined ? view.az : THREE.MathUtils.clamp(cur, -0.7, 0.7);
  const dist = view.dist || 4.6, polar = THREE.MathUtils.degToRad(view.polar || 60);
  const target = o.pos.clone(); target.y += 0.7;
  const pos = target.clone().add(new THREE.Vector3(Math.sin(az) * Math.sin(polar), Math.cos(polar), Math.cos(az) * Math.sin(polar)).multiplyScalar(dist));
  sound.play('whoosh', 0.35);
  flyTo(target, pos, instant ? 0.01 : 2.6, () => { controls.autoRotate = !reduceMotion; sound.play('chime', 0.3); });
  narrate(o.site.id);
}

function deselect() {
  if (state.tour) stopTour();
  state.selected = -1;
  $('#panel').hidden = true; document.body.classList.remove('panel-open');
  applyViewOffset();
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
let narrateToken = 0, current = null;
// one pending step (caption timeout or tour advance) that can be held while the page is in the background
let pending = null;
const cancelLater = () => { if (pending) { clearTimeout(pending.id); pending = null; } };
const arm = () => { pending.at = performance.now(); pending.id = setTimeout(() => { const fn = pending.fn; pending = null; fn(); }, pending.ms); };
const later = (fn, ms) => { cancelLater(); pending = { fn, ms }; if (!state.paused) arm(); };
function hideCaption() { $('#caption').hidden = true; cancelLater(); current = null; }
// say the current line again — after the language or the sound setting changed under it
function renarrate() { if (current) narrate(current.key, current.onEnd); }
async function narrate(key, onEnd) {
  const text = NARRATION[lang][key];
  const mine = ++narrateToken;
  hideCaption();
  current = { key, onEnd };
  const dur = await sound.narrate(key, () => { hideCaption(); onEnd && onEnd(); });
  if (mine !== narrateToken) return; // superseded by a newer narration
  $('#caption').textContent = text; $('#caption').hidden = false;
  // without sound (off, or the clip failed to load) the script is shown as a caption for a reading-time interval, and the tour still advances
  if (!dur) later(() => { hideCaption(); onEnd && onEnd(); }, 3500 + text.length * 45);
}

// ---------- tour ----------
function setTourButton() { $('#btn-tour').textContent = state.tour ? T().stopTour : T().tour; $('#btn-tour').classList.toggle('on', state.tour); }
function startTour() {
  state.tour = true; setTourButton();
  tourStep(state.selected >= 0 ? state.selected : 0);
}
function tourStep(i) {
  if (!state.tour) return;
  select(i, { fromTour: true });
  // select() already started narration; re-arm it with an advance callback
  narrate(SITES[i].id, () => {
    later(() => { if (state.tour) (i + 1 < SITES.length ? tourStep(i + 1) : (stopTour(), goHome())); }, 2500);
  });
}
function stopTour() {
  state.tour = false; cancelLater(); setTourButton();
}

// ---------- UI ----------
function renderPanel(i, keepScroll = false) {
  const s = loc(SITES[i]), t = T();
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  $('#panel-body').innerHTML = `
    <h2>${esc(s.name)}</h2>
    <div class="modern">${t.today}: ${esc(s.modern)}</div>
    <button class="listen" id="listen">${t.listen}</button>
    <div class="tagline">${esc(s.tagline)}</div>
    <div class="chips">${s.era.map((e) => `<span>${esc(e)}</span>`).join('')}</div>
    ${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>${t.lookFor}</h3><ul>${s.look.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <div class="fun">${esc(s.fun)}</div>
    <h3>${t.howWeKnow}</h3><p class="evidence">${esc(s.evidence)}</p>
    <h3>${t.sources}</h3><ul class="src">${s.sources.map((k) => `<li><a href="${SOURCES[k].url}" target="_blank" rel="noopener">${esc(SOURCES[k].label)}</a></li>`).join('')}</ul>
    <div class="coords">${s.lat.toFixed(4)}° N, ${s.lon.toFixed(4)}° E · <a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=15/${s.lat}/${s.lon}" target="_blank" rel="noopener">${t.openMap}</a></div>`;
  if (!keepScroll) $('#panel-body').scrollTop = 0;
  $('#listen').onclick = async () => { if (state.tour) stopTour(); if (!sound.enabled) await setSound(true); narrate(s.id); };
  $('#counter').textContent = `${i + 1} / ${SITES.length}`;
  const panel = $('#panel');
  panel.hidden = false; if (!keepScroll) { panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = ''; }
  document.body.classList.add('panel-open');
  applyViewOffset();
  document.querySelectorAll('#sitelist button').forEach((b, k) => b.classList.toggle('active', k === i));
}

async function setSound(on) {
  if (on) on = (await sound.enable().catch(() => false)) !== false && sound.enabled; else sound.disable();
  const b = $('#btn-sound');
  b.setAttribute('aria-pressed', String(on)); b.textContent = (on ? '🔊 ' : '🔇 ') + T().sound;
  renarrate(); // a line in progress carries on: spoken when sound is on, as a timed caption when it is off
}

function setLang(to) {
  lang = to; store.set('lang', to); sound.lang = to;
  const t = T(), set = (sel, text) => { $(sel).textContent = text; };
  document.documentElement.lang = to; document.title = t.docTitle;
  set('#title .sub', t.sub); set('#intro-eyebrow', t.introEyebrow); set('#intro-text', t.introText);
  set('#begin-sound', t.beginSound); set('#begin-quiet', t.beginQuiet); set('#intro-lang', t.langIntro);
  if (!state.ready) set('#loading', t.loading);
  set('#hint', matchMedia('(pointer: coarse)').matches ? t.hintTouch : t.hint);
  set('#prev', t.prev); set('#next', t.next); set('#north', t.north); set('#legend-src', t.sources); set('#btn-roads', t.roads); set('#btn-lang', t.langBtn);
  set('#btn-dusk', state.duskTarget ? t.dusk : t.day); set('#btn-sound', (sound.enabled ? '🔊 ' : '🔇 ') + t.sound); setTourButton();
  $('#btn-home').innerHTML = `⌂ <span class="wide">${t.overview}</span><span class="narrow">${t.map}</span>`;
  $('#legend-text').innerHTML = `${t.legend}<span class="wide">${t.legendLong}</span>.`;
  const attrs = { '#btn-tour': t.tTour, '#btn-sound': t.tSound, '#btn-dusk': t.tDusk, '#btn-roads': t.tRoads, '#btn-home': t.tHome, '#btn-lang': t.tLang, '#compass': t.northTitle };
  for (const k in attrs) $(k).title = attrs[k];
  const aria = { '#panel-close': t.close, '#prev': t.prevAria, '#next': t.nextAria, '#sitelist': t.sitesAria, '#toolbar': t.controlsAria, '#scene': t.canvasAria };
  for (const k in aria) $(k).setAttribute('aria-label', aria[k]);
  const btns = document.querySelectorAll('#sitelist button');
  SITES.forEach((raw, i) => {
    const s = loc(raw);
    if (btns[i]) { btns[i].querySelector('.t').textContent = s.name; btns[i].title = `${s.name} — ${s.modern}`; }
    if (siteObjs[i]) siteObjs[i].el.querySelector('.txt').innerHTML = `${s.name}<small>${s.modern.split(' · ')[0]}</small>`;
  });
  if (state.selected >= 0) renderPanel(state.selected, true);
  renarrate();
}

// entering starts the guided tour (after the spoken or captioned welcome); a deep link goes straight to its site instead
function begin(withSound, direct = false) {
  if (state.started) return;
  state.started = true;
  $('#intro').classList.add('gone');
  for (const el of document.querySelectorAll('[inert]')) el.inert = false;
  $('#intro').inert = true; document.activeElement && document.activeElement.blur();
  if (direct) return;
  state.tour = true; setTourButton();
  const welcome = () => narrate('intro', () => { if (state.tour) tourStep(0); });
  if (withSound) setSound(true).then(welcome); else welcome();
  const p = overviewPose(); flyTo(p.target, p.pos, 4.2);
}

function buildUI() {
  const list = $('#sitelist');
  SITES.forEach((s, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<span class="n">${i + 1}</span><span class="t"></span>`;
    b.onclick = () => select(i);
    list.appendChild(b);
  });
  const toggleLang = () => setLang(lang === 'tr' ? 'en' : 'tr');
  $('#btn-lang').onclick = toggleLang;
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
    $('#btn-dusk').textContent = state.duskTarget ? T().dusk : T().day;
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
    else if (k === 'l') toggleLang();
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
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); $('#legend').textContent = T().lost; });
  addEventListener('resize', resize);
}

// with the panel open, shift the projection so the selected diorama sits in the free space:
// left of the side panel on wide screens, above the bottom sheet (a third of the height) on phones
function applyViewOffset() {
  const w = innerWidth, h = innerHeight, open = !$('#panel').hidden;
  if (open && w > 760) camera.setViewOffset(w, h, Math.min(213, w * 0.17), 0, w, h);
  else if (open) camera.setViewOffset(w, h, 0, $('#panel').offsetHeight / 2, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  applyViewOffset();
  controls.maxDistance = Math.max(450, overviewPose().pos.distanceTo(OVERVIEW.target) * 1.15);
  for (const o of siteObjs) o.w = 0;
  for (const m of [...roadMats, riverMat, riverGhost]) m && m.resolution.set(w, h);
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

// In a hidden tab (another tab in front, window minimised) nothing is drawn, played or advanced; everything picks up where it left off.
function setPaused(p) {
  if (p === state.paused || !state.ready) return;
  state.paused = p;
  if (p) {
    renderer.setAnimationLoop(null); clock.stop(); sound.pause();
    if (pending) { clearTimeout(pending.id); pending.ms = Math.max(0, pending.ms - (performance.now() - pending.at)); }
  } else {
    clock.start(); renderer.setAnimationLoop(frame); sound.resume();
    if (pending) arm();
  }
}
const checkPaused = () => setPaused(document.hidden);
window.__audioState = () => (sound.ctx ? sound.ctx.state : 'none');
document.addEventListener('visibilitychange', checkPaused);
const v = new THREE.Vector3();
function frame() {
  const rawDt = clock.getDelta(), dt = Math.min(rawDt, 0.05), t = clock.elapsedTime;
  window.__frames = (window.__frames || 0) + 1; // lets tests see that the loop is running
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
  const sh = THREE.MathUtils.clamp(dist * 0.6, 1.2, 90);
  sun.target.position.copy(controls.target);
  sun.position.copy(controls.target).addScaledVector(sunDir, 300);
  const sc = sun.shadow.camera;
  if (Math.abs(sc.right - sh) > 0.5) { sc.left = -sh; sc.right = sh; sc.top = sh; sc.bottom = -sh; sc.near = 50; sc.far = 600; sc.updateProjectionMatrix(); }
  sky.position.copy(camera.position);

  // keep depth precision when far out, so draped roads and rivers do not flicker against the terrain
  const near = THREE.MathUtils.clamp(dist * 0.02, 0.02, 12);
  if (Math.abs(camera.near - near) > camera.near * 0.1) { camera.near = near; camera.updateProjectionMatrix(); }
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
    const target = Math.max(active ? 1.15 : 0, THREE.MathUtils.clamp(d / 40, 0.8, 2.3)) * (hov && !active ? 1.12 : 1);
    o.scale += (target - o.scale) * Math.min(1, dt * 8);
    o.root.scale.setScalar(o.scale);
    o.lift += ((active ? 1 : 0) - o.lift) * Math.min(1, dt * 3.5);
    o.model.position.y = GROUNDED + (BASE_DEPTH - GROUNDED) * o.lift * o.lift * (3 - 2 * o.lift);
    o.beam.material.opacity = (0.35 + 0.2 * Math.sin(t * 2 + i)) * THREE.MathUtils.smoothstep(d, 6, 45);
    o.beam.visible = !active;
    o.ring.scale.setScalar(1 + 0.08 * Math.sin(t * 2.5 + i) + (hov ? 0.12 : 0));
    o.ring.material.opacity = active ? 0.95 : 0.55;
    o.ring.material.color.setHex(active ? 0xff6a3d : 0xffd98a);
  }
  for (const i of order) {
    const o = siteObjs[i];
    v.copy(o.pos); v.y += (i === state.selected ? 2.2 : 1.85) * o.scale;
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
  for (const c of clouds) { c.position.x += dt * 0.9; if (c.position.x > WORLD.w / 2 + 30) c.position.x = -WORLD.w / 2 - 30; c.visible = camera.position.y > 14 && dist < 150; /* from far out a cloud reads as a hole in the map */ }
  const lf = THREE.MathUtils.smoothstep(dist, 22, 70);
  updateTrees(dist);
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

// the language can be chosen while the terrain is still loading
$('#intro-lang').onclick = () => setLang(lang === 'tr' ? 'en' : 'tr');
setLang(lang);
init().catch((e) => { console.error(e); $('#loading').textContent = T().loadFail + e.message; });
