// Dev tool: render one diorama on its own. /preview.html?m=soli&a=20&e=32&d=3.2&dusk=0
// (a = azimuth in degrees from south, e = elevation, d = distance). Drag to orbit.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildMonument, BASE_DEPTH } from './monuments/index.js';

const q = new URLSearchParams(location.search), num = (k, d) => (q.has(k) ? +q.get(k) : d);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa9c3d3);
const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
const dusk = num('dusk', 0);
scene.add(new THREE.HemisphereLight(dusk ? 0xb9c2e6 : 0xdcecff, dusk ? 0x8a6a4a : 0x8a7a5a, dusk ? 0.7 : 0.85));
const sun = new THREE.DirectionalLight(dusk ? 0xffb46e : 0xfff2dc, dusk ? 2.9 : 2.5);
const el = dusk ? 0.32 : 0.85, az = dusk ? -1.35 : -0.95; // same sun as the map (src/main.js)
sun.position.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(20);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.01;
Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 1, far: 50 });
scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshStandardMaterial({ color: 0x8f9c63, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -BASE_DEPTH; ground.receiveShadow = true; scene.add(ground);
const t0 = performance.now();
const model = buildMonument(q.get('m') || 'soli');
scene.add(model);
window.__stats = { ms: Math.round(performance.now() - t0), meshes: model.children.length, tris: 0 };
model.traverse((o) => { if (o.isMesh) window.__stats.tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
const a = THREE.MathUtils.degToRad(num('a', 20)), e = THREE.MathUtils.degToRad(num('e', 32)), d = num('d', 3.2);
const target = new THREE.Vector3(num('tx', 0), num('ty', 0.05), num('tz', 0));
camera.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(d).add(target);
const controls = new OrbitControls(camera, canvas); controls.target.copy(target); controls.update();
function draw() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.render(scene, camera); }
controls.addEventListener('change', draw); addEventListener('resize', draw);
draw(); requestAnimationFrame(() => { draw(); window.__ready = true; });
