// Roman figures for the dioramas. Each is built 1 unit tall (feet at y = 0, facing +z, so the figure's
// left is +x) from draped cloth shells over a simple body, then scaled down. Dress follows the usual
// reconstructions: tunic with clavi under a toga carried on the LEFT shoulder with sinus and balteus;
// matron in stola, institia and palla; legionary in lorica segmentata with scutum on the left arm and
// gladius on the right hip; labourer in an exomis; traveller in a paenula; and, this being the Greek
// East, townsmen in a himation over a dyed chiton.
import * as THREE from 'three';
import { put } from './kit.js';

export const FIG_H = 0.066;
const PI = Math.PI;
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const geos = {}, mats = {};
const G = (k, f) => (geos[k] ||= f());
const mt = (k, color, o = {}) => (mats[k] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...o }));
const cloth = (k, color) => mt(k, color, { side: THREE.DoubleSide });
const F = {
  get toga() { return cloth('toga', 0xf4eedd); }, get tunic() { return cloth('tunic', 0xe4d8bc); }, get purple() { return cloth('purple', 0x6e2148); },
  get red() { return cloth('red', 0xa32a22); }, get undyed() { return cloth('undyed', 0xa08257); }, get cloak() { return cloth('cloak', 0x5b4737); },
  get steel() { return mt('steel', 0xc9cdd1, { roughness: 0.42, metalness: 0.3 }); }, get brass() { return mt('brass', 0xd9ad45, { roughness: 0.45, metalness: 0.3 }); },
  get leather() { return mt('leather', 0x5b3a22); }, get redLeather() { return mt('redLeather', 0x7c2a1e); }, get wood() { return mt('figwood', 0x6d4c2c); },
  get terracotta() { return mt('terracotta', 0xb5653a); }, get straw() { return cloth('straw', 0xd8bd7a); }, get felt() { return cloth('felt', 0xa98c62); }, get mail() { return mt('mail', 0x8f959b, { roughness: 0.6, metalness: 0.25 }); }, get auxShield() { return mt('auxShield', 0x2f5a7a, { roughness: 0.7 }); }, get sole() { return mt('sole', 0x7a5636); }, get dark() { return mt('eye', 0x2a1d16, { roughness: 0.6 }); },
  get scutum() { return mt('scutum', 0xa02620, { roughness: 0.7, side: THREE.DoubleSide }); },
  skin(n) { return mt('skin' + n, [0xdcab86, 0xc98f66, 0xb57a52][n]); },
  hair(n) { return mt('hair' + n, [0x2e2018, 0x4a3323, 0x1c1512, 0x9d978f][n]); },
  dye(n) { n = ((n % 7) + 7) % 7; return cloth('dye' + n, [0xc98a2b, 0x2f6a8c, 0x5f8a56, 0xa8455e, 0x3f8f8a, 0xd0b060, 0x8c4a2c][n]); },
};

// body silhouette: radius by height, used for every garment so layers sit on one another
const BODY = [[0, 0.19], [0.1, 0.176], [0.42, 0.132], [0.56, 0.126], [0.7, 0.15], [0.79, 0.166], [0.835, 0.12], [0.862, 0.05]];
function prof(y, P = BODY) {
  if (y <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (y <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (y - P[i - 1][0]) / (P[i][0] - P[i - 1][0]));
  return P[P.length - 1][1];
}
const DEPTH = 0.74; // bodies are deeper side to side than front to back
const onBody = (th, y, r) => [r * Math.sin(th), y, r * Math.cos(th) * DEPTH];

// a cloth shell wrapped round the body: th runs from the front (0) towards the figure's left (+), top/bot/rad are functions
function drape(key, { t0 = -PI, t1 = PI, top, bot, rad, n = 20, m = 8 }) {
  return G(key, () => {
    const pos = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const th = lerp(t0, t1, i / n), yb = bot(th), yt = top(th);
      for (let j = 0; j <= m; j++) { const y = lerp(yb, yt, j / m); pos.push(...onBody(th, y, rad(th, y, j / m))); }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * (m + 1) + j, b = a + m + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
// a rolled edge of cloth following a line over the body
function roll(key, f, t0, t1, r, closed = false) {
  return G(key, () => {
    const pts = [];
    for (let i = 0; i < (closed ? 28 : 29); i++) { const th = lerp(t0, t1, i / 28); pts.push(new THREE.Vector3(...onBody(th, ...f(th)))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), 28, r, 4, closed);
  });
}
const pleats = (th, y, hem, depth, count = 11) => 1 + depth * Math.sin(th * count) * clamp01((0.62 - y) / (0.62 - hem));

export function person(g, x, z, y = 0, i = 0, s = 1) {
  const grp = new THREE.Group(), h1 = hash(x * 91.7 + i, z * 57.3), h2 = hash(z * 33.1, x * 71.9 + i), h3 = hash(x * 13.3 + z * 7.7, i + 2.5), type = ((i % 6) + 6) % 6;
  grp.position.set(x, y, z); grp.scale.setScalar(FIG_H * s * (0.94 + h2 * 0.12)); grp.rotation.y = h1 * PI * 2; g.add(grp);
  let par = grp;
  const P = (geo, material, px = 0, py = 0, pz = 0) => put(par, geo, material, px, py, pz);
  const up = (fn) => { const hg = new THREE.Group(); hg.position.y = 0.034; grp.add(hg); par = hg; fn(); par = grp; }; // everything on the head sits on a raised neck
  const sph = G('sph', () => new THREE.SphereGeometry(1, 8, 6));
  const skin = F.skin(Math.floor(h3 * 3));
  const ball = (material, px, py, pz, sx, sy = sx, sz = sx) => { const m = P(sph, material, px, py, pz); m.scale.set(sx, sy, sz); return m; };
  const limb = (material, r, a, b) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
    const m = P(G('limb' + r, () => new THREE.CapsuleGeometry(r, 1, 2, 6)), material, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.scale.y = len / (1 + 2 * r); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
  };
  // shoulder → elbow in a sleeve (or bare), elbow → wrist bare, and a hand; sd = +1 is the figure's left
  const arm = (sd, sleeve, e, h, sleeveR = 0.043) => {
    const S = [sd * 0.168, 0.775, 0], E = [S[0] + sd * e[0], e[1], e[2]], H = [S[0] + sd * h[0], h[1], h[2]];
    limb(sleeve || skin, sleeve ? sleeveR : 0.032, S, E); limb(skin, sleeve ? 0.029 : 0.031, E, H); ball(skin, H[0], H[1], H[2], 0.036, 0.04, 0.034); if (!sleeve) ball(skin, E[0], E[1], E[2], 0.0315);
    return H;
  };

  // ---- garments
  const longTunic = (material, depth = 0.05, hem = 0.035) => P(drape('long' + depth + hem, { top: () => 0.862, bot: () => hem, rad: (th, yy) => prof(yy) * pleats(th, yy, hem, depth), m: 8 }), material);
  const shortTunic = (material, hem = 0.36, depth = 0.05) => P(drape('short' + hem, { top: () => 0.862, bot: () => hem, rad: (th, yy) => (yy < 0.56 ? lerp(0.17, 0.127, (yy - hem) / (0.56 - hem)) : prof(yy)) * pleats(th, yy, hem, depth, 9), m: 9 }), material);
  const sleeveCap = (material, sd) => ball(material, sd * 0.158, 0.782, 0, 0.046, 0.046, 0.052);
  const belt = (material, by = 0.565, r = 0.131, thick = 0.017) => { const b = P(G('belt' + thick, () => new THREE.TorusGeometry(1, thick / 0.131, 6, 18)), material, 0, by, 0); b.rotation.x = PI / 2; b.scale.set(r, r * DEPTH, r); };
  const shoesUnderHem = (material) => { for (const sd of [-1, 1]) { limb(skin, 0.032, [sd * 0.07, 0.2, 0.02], [sd * 0.07, 0.05, 0.05]); ball(material, sd * 0.07, 0.026, 0.085, 0.038, 0.028, 0.08).rotation.y = sd * -0.12; } };
  const legs = (kind) => { // 'sandal' | 'caliga' | 'boot'
    for (const sd of [-1, 1]) {
      const fx = sd * 0.072, shoe = kind === 'boot' ? F.leather : skin;
      limb(skin, 0.042, [sd * 0.066, 0.42, 0], [fx, 0.07, 0]);
      ball(skin, fx, 0.28, -0.006, 0.044, 0.085, 0.046); // calf
      ball(shoe, fx, 0.034, 0.04, 0.038, 0.028, 0.084).rotation.y = sd * -0.12;
      ball(F.sole, fx, 0.006, 0.04, 0.041, 0.007, 0.09).rotation.y = sd * -0.12;
      if (kind === 'boot') { ball(F.leather, fx, 0.085, 0.0, 0.047, 0.05, 0.05); continue; } // soft ankle boot
      for (const [sz, sy] of [[0.085, 0.048], [0.035, 0.056]]) P(G('strap', () => new THREE.BoxGeometry(0.074, 0.01, 0.014)), F.leather, fx, sy, sz);
      P(G('strapL', () => new THREE.BoxGeometry(0.012, 0.01, 0.1)), F.leather, fx, 0.062, 0.06); // strap down the instep
      for (const wy of kind === 'caliga' ? [0.08, 0.108] : [0.085]) { const w = P(G('wrap', () => new THREE.TorusGeometry(0.044, 0.006, 4, 10)), F.leather, fx, wy, 0); w.rotation.x = PI / 2; }
    }
  };
  // toga / himation / palla: a mantle carried on the left shoulder, passing under the right arm
  const edge = (lo, hi) => (th) => lerp(lo, hi, Math.pow((Math.sin(th) + 1) / 2, 0.75));
  const mantle = (key, material, { lo = 0.5, hi = 0.84, hem = 0.07, lift = 0.1, out = 0.028, border = null, roll: rr = 0.008 }) => {
    const top = edge(lo, hi), bot = (th) => hem + lift * clamp01(Math.cos(th + 0.9)) ** 2; // hem rises at the right front, showing the tunic
    const rad = (th, yy, v = 0) => prof(yy) + out * (1 - 0.5 * v * v) + 0.012 * (1 - v * v) * Math.sin(17 * yy + 2.2 * th) + 0.006 * Math.sin(9 * th);
    P(drape(key, { top, bot, rad, m: 8, n: 24 }), material);
    // balteus: the upper edge folded over into a broad band rather than a cord
    P(drape(key + 'fold', { top: (th) => top(th) + 0.006, bot: (th) => top(th) - 0.05, rad: (th, yy) => rad(th, yy, 0.9) + 0.011, m: 2, n: 24 }), material);
    if (border) P(drape(key + 'bT', { top: (th) => top(th) - 0.012, bot: (th) => top(th) - 0.04, rad: (th, yy) => rad(th, yy, 0.9) + 0.017, m: 1, n: 24 }), border);
    return { top, rad };
  };
  // sinus: the deep curved fold of the imperial toga hanging from the right hip across the knees
  const sinus = (material, border) => {
    const A0 = -1.75, A1 = 1.45, top = (th) => lerp(0.47, 0.66, (Math.sin(th * 0.9) + 1) / 2), sag = (th) => (0.2 + 0.1 * Math.cos(th * 0.8)) * Math.sqrt(Math.sin(PI * clamp01((th - A0) / (A1 - A0))) + 0.02);
    const e = (th) => Math.sqrt(Math.sin(PI * clamp01((th - A0) / (A1 - A0))) + 0.001);
    const rad = (th, yy, v) => prof(yy) + 0.034 + (0.02 + 0.03 * (1 - v)) * e(th) + 0.006 * Math.sin(20 * yy + th);
    P(drape('sinus', { t0: A0, t1: A1, top, bot: (th) => top(th) - sag(th), rad, m: 6, n: 26 }), material);
  };
  const overLeftArm = (material, border, len = 0.42, panel = true) => { // lacinia: the end of the mantle falling in folds from the left forearm
    if (!panel) return;
    ball(material, 0.2, 0.632, 0.13, 0.042, 0.034, 0.09); // cloth gathered over the forearm
    const mk = (key, l, b) => G(key, () => {
      const geo = new THREE.PlaneGeometry(0.1, l, 12, 5), p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const u = p.getX(k) / 0.1 + 0.5, v = 0.5 - p.getY(k) / l; // v: 0 at the arm, 1 at the hem
        p.setZ(k, (0.02 + 0.022 * v) * Math.sin(u * 14 + v * 1.5));
        p.setX(k, p.getX(k) * (1 - 0.45 * v) + 0.02 * v * v);
        p.setY(k, p.getY(k) - (b ? 0 : 0.03 * v * Math.sin(u * PI)));
      }
      geo.computeVertexNormals(); return geo;
    });
    const fall = P(mk('lacinia' + len, len, false), material, 0.2, 0.625 - len / 2, 0.125); fall.rotation.set(0, PI / 2 - 0.2, 0.03);
  };

  // ---- heads
  const head = (o) => up(() => head0(o));
  const head0 = ({ hair = -1, bald = false, beard = false, woman = false, veiled = false, helmet = false } = {}) => {
    ball(skin, 0, 0.928, 0, 0.079, 0.09, 0.084);
    P(G('neck', () => new THREE.CylinderGeometry(0.036, 0.044, 0.1, 8)), skin, 0, 0.84, 0);
    ball(skin, 0, 0.92, 0.084, 0.012, 0.02, 0.014);
    for (const sd of [-1, 1]) { ball(F.dark, sd * 0.031, 0.94, 0.074, 0.0105, 0.008, 0.007); ball(skin, sd * 0.08, 0.925, 0.004, 0.012, 0.02, 0.014); }
    P(G('mouth', () => new THREE.BoxGeometry(0.032, 0.007, 0.01)), mt('mouth', 0x7a3b30), 0, 0.888, 0.077);
    const hm = F.hair(hair < 0 ? Math.floor(h2 * 3) : hair);
    const nape = () => { const n = P(G('nape', () => new THREE.SphereGeometry(1, 10, 3, PI * 1.08, PI * 0.84, PI * 0.45, PI * 0.24)), hm, 0, 0.932, -0.008); n.scale.set(0.085, 0.092, 0.09); };
    if (helmet) { /* hair hidden */ } else if (!bald) {
      const cap = P(G('hair', () => new THREE.SphereGeometry(1, 12, 6, 0, PI * 2, 0, PI * 0.46)), hm, 0, 0.94, -0.014); cap.scale.set(0.085, 0.088, 0.09); cap.rotation.x = -0.12 - h1 * 0.2; // hairline varies
      if (!veiled) nape();
      if (!woman && h1 > 0.35) for (let k = -2; k <= 2; k++) ball(hm, k * 0.027, 0.988 - Math.abs(k) * 0.012, 0.056 - Math.abs(k) * 0.012, 0.02, 0.013, 0.014); // short combed-forward locks
    } else nape(); // bald crown, hair behind the ears
    if (woman) { // centre parting, hair drawn back over the ears into a knot
      for (const sd of [-1, 1]) ball(hm, sd * 0.046, 0.955, 0.0, 0.044, 0.05, 0.078);
      if (!veiled) ball(hm, 0, 0.93, -0.095, 0.045, 0.04, 0.04);
    }
    if (beard) { const b = P(G('beard', () => new THREE.SphereGeometry(1, 10, 3, PI * 0.2, PI * 0.6, PI * 0.64, PI * 0.3)), hair === 3 ? hm : mt('beard', 0x6b5140), 0, 0.93, 0.0); b.scale.set(0.0805, 0.094, 0.0865); }
  };
  const veil = (material) => up(() => veil0(material));
  const veil0 = (material) => { // mantle drawn over the head and falling to the shoulders
    const v = P(G('veil', () => new THREE.SphereGeometry(1, 14, 8, PI * 0.8, PI * 1.4, 0, PI * 0.62)), material, 0, 0.93, -0.012); v.scale.set(0.106, 0.116, 0.112);
    P(drape('veilFall', { t0: PI * 0.42, t1: PI * 1.58, top: () => 0.955, bot: () => 0.74, rad: (th, yy) => lerp(0.205, 0.114, Math.sqrt((yy - 0.74) / 0.215)) + 0.006 * Math.sin(th * 8), m: 5, n: 14 }), material);
  };

  if (type === 0 || type === 4) {
    const greek = type === 0 && h1 > 0.5; // a townsman of the Greek East: himation over a dyed chiton
    const priest = type === 4 && h2 > 0.6; // sacrificing capite velato
    const border = type === 4 ? F.purple : null;
    longTunic(greek ? F.dye(Math.floor(h3 * 7)) : F.tunic, 0.04, greek ? 0.06 : 0.1);
    if (!greek) for (const sd of [-1]) for (const zz of [1]) P(drape('clavus' + sd + zz, { t0: (zz > 0 ? 0 : PI) + sd * 0.42 - 0.07, t1: (zz > 0 ? 0 : PI) + sd * 0.42 + 0.07, top: () => 0.79, bot: () => 0.105, rad: (th, yy) => prof(yy) * 1.02 + 0.006, m: 8, n: 2 }), F.purple); // clavi
    const mat = greek ? F.dye(Math.floor(h3 * 7) + 3) : F.toga;
    mantle(greek ? 'himation' : 'toga', mat, greek ? { hem: 0.2, lift: 0.06, lo: 0.52 } : { border, hem: 0.035, lift: 0.035 });
    if (!greek) sinus(mat, null);
    overLeftArm(mat, border, greek ? 0.3 : 0.44);
    sleeveCap(greek ? F.dye(Math.floor(h3 * 7)) : F.tunic, -1);
    head({ hair: type === 4 ? 3 : -1, bald: type === 4 && !priest && h3 > 0.55, beard: greek });
    if (priest) veil(mat);
    arm(1, mat, [0.03, 0.6, 0.07], [0.04, 0.63, 0.2], 0.05);
    if (type === 4) {
      const H = arm(-1, F.tunic, [0.09, 0.7, 0.12], priest ? [0.12, 0.66, 0.26] : [-0.05, 0.7, 0.2]);
      if (priest) { const pat = P(G('patera', () => new THREE.CylinderGeometry(0.06, 0.035, 0.018, 10)), F.brass, H[0], H[1] + 0.03, H[2] + 0.02); pat.rotation.x = 0.2; } // libation dish
      else { const sc = P(G('scroll', () => new THREE.CylinderGeometry(0.02, 0.02, 0.15, 7)), F.toga, H[0], H[1] + 0.02, H[2] + 0.02); sc.rotation.z = -0.9; }
      shoesUnderHem(F.leather);
    } else {
      if (greek) { const H = arm(-1, F.dye(Math.floor(h3 * 7)), [0.04, 0.6, 0.05], [0.07, 0.56, 0.2]); P(G('staff', () => new THREE.CylinderGeometry(0.013, 0.016, 0.98, 6)), F.wood, H[0], 0.49, H[2] + 0.02); }
      else arm(-1, F.tunic, [0.035, 0.58, 0.03], [0.03, 0.43, 0.08]);
      shoesUnderHem(F.leather);
    }
  } else if (type === 1) {
    const c = Math.floor(h2 * 7), stola = F.dye(c), palla = F.dye(c + 2 + Math.floor(h1 * 3));
    longTunic(stola, 0.075, 0.03);
    P(drape('institia', { top: () => 0.085, bot: () => 0.025, rad: (th, yy) => prof(yy) * pleats(th, yy, 0.03, 0.075) + 0.006, m: 1 }), palla); // the stola's hem band
    belt(F.brass, 0.655, 0.146, 0.011);
    mantle('palla', palla, { hem: 0.3, lift: 0.1, lo: 0.5, out: 0.042 });
    overLeftArm(palla, null, 0.3, false);
    head({ woman: true, veiled: h3 > 0.35 });
    if (h3 > 0.35) veil(palla);
    up(() => { for (const sd of [-1, 1]) ball(F.brass, sd * 0.083, 0.895, 0.01, 0.011); }); // earrings
    arm(1, palla, [0.02, 0.6, 0.08], [-0.05, 0.64, 0.19], 0.05);
    sleeveCap(stola, -1);
    const H = arm(-1, stola, [0.035, 0.6, 0.04], h1 > 0.5 ? [0.05, 0.5, 0.17] : [0.03, 0.44, 0.07]);
    if (h1 > 0.5) { ball(F.terracotta, H[0], H[1] + 0.02, H[2] + 0.05, 0.05, 0.06, 0.05); P(G('jugNeck', () => new THREE.CylinderGeometry(0.02, 0.026, 0.07, 7)), F.terracotta, H[0], H[1] + 0.1, H[2] + 0.05); } // small jug
    shoesUnderHem(F.leather);
  } else if (type === 2) {
    shortTunic(F.red, 0.33); legs('caliga');
    const aux = h3 < 0.45; // Cilicia was garrisoned by auxiliaries: mail shirt, oval shield and thrusting spear
    if (aux) {
      P(drape('mail', { top: () => 0.862, bot: () => 0.41, rad: (th, yy) => prof(yy) + 0.02 + (yy < 0.52 ? 0.035 * (0.52 - yy) / 0.11 : 0), m: 10, n: 22 }), F.mail);
      for (const sd of [-1, 1]) ball(F.mail, sd * 0.165, 0.79, 0, 0.06, 0.04, 0.066); // shoulder doubling
    } else {
      // lorica segmentata: girth hoops, breast and shoulder plates
      for (let k = 0; k < 6; k++) { const y0 = 0.5 + k * 0.047; P(drape('hoop' + k, { top: () => y0 + 0.052, bot: () => y0, rad: (th, yy) => prof(yy) + 0.03 - (yy - y0) * 0.36, m: 1, n: 20 }), F.steel); }
      P(drape('breast', { top: () => 0.86, bot: () => 0.775, rad: (th, yy) => prof(yy) + 0.02, m: 3, n: 20 }), F.steel);
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) ball(F.steel, sd * (0.15 + k * 0.022), 0.815 - k * 0.022, 0, 0.066 - k * 0.004, 0.022, 0.085 - k * 0.006);
    }
    ball(F.red, 0, 0.862, 0.01, 0.06, 0.022, 0.058); // focale, the neck scarf
    belt(F.leather, 0.5, 0.152, 0.02);
    for (let k = -2; k <= 2; k++) { P(G('apron', () => new THREE.BoxGeometry(0.016, 0.14, 0.01)), F.leather, k * 0.027, 0.42, 0.12); ball(F.brass, k * 0.027, 0.355, 0.122, 0.011); }
    for (let k = -3; k <= 3; k++) ball(F.brass, Math.sin(k * 0.3) * 0.155, 0.5, Math.cos(k * 0.3) * 0.155 * DEPTH + 0.012, 0.012); // belt plates
    head({ helmet: true });
    up(() => { // imperial-Gallic helmet: bowl, brow band, cheek pieces, flared neck guard
      const hl = P(G('helm', () => new THREE.SphereGeometry(1, 12, 6, 0, PI * 2, 0, PI * 0.47)), F.steel, 0, 0.955, -0.004); hl.scale.set(0.09, 0.09, 0.096);
      const brow = P(G('brow', () => new THREE.TorusGeometry(0.09, 0.01, 5, 14, PI)), F.brass, 0, 0.952, 0.004); brow.rotation.x = -PI / 2 + 0.12;
      const back = P(G('helmBack', () => new THREE.SphereGeometry(1, 10, 4, PI * 1.02, PI * 0.96, PI * 0.46, PI * 0.3)), F.steel, 0, 0.955, -0.004); back.scale.set(0.09, 0.09, 0.096);
      const ng = ball(F.steel, 0, 0.872, -0.078, 0.066, 0.01, 0.04); ng.rotation.x = -0.85; // neck guard flaring from the bowl
      for (const sd of [-1, 1]) ball(F.mail, sd * 0.077, 0.915, 0.028, 0.007, 0.044, 0.034); // cheek pieces lying on the jaw
      ball(F.brass, 0, 1.05, -0.004, 0.013, 0.016, 0.013);
    });
    // scutum on the left arm
    arm(1, F.red, [0.04, 0.6, 0.04], [0.05, 0.55, 0.12]);
    const thc = 0.95, SR = 0.24, sc = [0.265 - SR * Math.sin(thc), 0.5, 0.15 - SR * Math.cos(thc)];
    const seg = (key, r, hgt, arc, material, dy = 0, off = 0) => P(G(key, () => new THREE.CylinderGeometry(r, r, hgt, 10, 1, true, thc + off - arc / 2, arc)), material, sc[0], sc[1] + dy, sc[2]);
    if (aux) { // flat oval shield with a central boss
      const ov = P(G('oval', () => new THREE.CylinderGeometry(1, 1, 0.02, 16)), F.auxShield, 0.25, 0.5, 0.13); ov.rotation.set(PI / 2, 0, -thc, 'YXZ'); ov.rotation.y = thc; ov.rotation.z = 0; ov.scale.set(0.15, 1, 0.3);
      const rim = P(G('ovalRim', () => new THREE.TorusGeometry(1, 0.035, 4, 18)), F.brass, 0.25, 0.5, 0.13); rim.rotation.y = thc; rim.scale.set(0.15, 0.3, 0.3);
      ball(F.brass, 0.25 + 0.02 * Math.sin(thc), 0.5, 0.13 + 0.02 * Math.cos(thc), 0.035);
    } else {
    seg('scutum', SR, 0.6, 1.1, F.scutum);
    for (const dy of [-0.29, 0.29]) seg('scRim' + dy, SR + 0.003, 0.025, 1.12, F.brass, dy);
    for (const off of [-0.55, 0.55]) seg('scEdge' + off, SR + 0.003, 0.6, 0.05, F.brass, 0, off);
    seg('scTab', SR + 0.004, 0.11, 0.2, F.brass); // plate behind the boss
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const arc = 0.3 - k * 0.055; seg('scWing' + sd + k, SR + 0.004, 0.02, arc, F.brass, 0.085 - k * 0.032, sd * (0.11 + arc / 2)); } // eagle wings
    for (const dy of [-1, 1]) { seg('scBolt' + dy, SR + 0.004, 0.15, 0.03, F.brass, dy * 0.15); seg('scBarb' + dy, SR + 0.004, 0.02, 0.12, F.brass, dy * 0.2); seg('scBarb2' + dy, SR + 0.004, 0.02, 0.07, F.brass, dy * 0.235); } // thunderbolts
    ball(F.steel, sc[0] + (SR + 0.01) * Math.sin(thc), 0.5, sc[2] + (SR + 0.01) * Math.cos(thc), 0.04);
    }
    // pilum grounded in the right hand, gladius high on the right hip
    const H = arm(-1, F.red, [0.05, 0.62, 0.05], [0.1, 0.6, 0.14]);
    if (aux) { P(G('hasta', () => new THREE.CylinderGeometry(0.012, 0.012, 1.25, 6)), F.wood, H[0], 0.625, H[2] + 0.01); const tip = P(G('hastaTip', () => new THREE.ConeGeometry(0.024, 0.12, 4)), F.steel, H[0], 1.31, H[2] + 0.01); tip.scale.z = 0.4; }
    else {
      P(G('pilumShaft', () => new THREE.CylinderGeometry(0.013, 0.013, 0.86, 6)), F.wood, H[0], 0.43, H[2] + 0.01);
      P(G('pilumBlock', () => new THREE.BoxGeometry(0.04, 0.07, 0.04)), F.wood, H[0], 0.88, H[2] + 0.01);
      P(G('pilumShank', () => new THREE.CylinderGeometry(0.006, 0.006, 0.4, 5)), F.steel, H[0], 1.1, H[2] + 0.01);
      P(G('pilumTip', () => new THREE.ConeGeometry(0.014, 0.06, 4)), F.steel, H[0], 1.33, H[2] + 0.01);
    }
    const gl = P(G('gladius', () => new THREE.BoxGeometry(0.03, 0.26, 0.05)), F.leather, -0.175, 0.41, -0.01); gl.rotation.x = 0.18;
    ball(F.brass, -0.175, 0.265, -0.035, 0.022); ball(F.wood, -0.175, 0.575, 0.02, 0.022, 0.03, 0.022);
    P(roll('baldric', (th) => { const yy = lerp(0.52, 0.83, Math.pow((Math.sin(th) + 1) / 2, 0.8)); return [yy, prof(yy) + 0.034]; }, -PI, PI, 0.011, true), F.leather); // baldric from the left shoulder to the sword
  } else if (type === 3) {
    // exomis: a work tunic pinned on the left shoulder only, the right shoulder and chest bare
    legs('sandal');
    P(G('torso', () => new THREE.LatheGeometry(BODY.filter(([yy]) => yy >= 0.42).map(([yy, r]) => new THREE.Vector2(r * 0.94, yy)), 12)), skin).scale.z = DEPTH;
    const cl = h2 > 0.5 ? F.undyed : F.dye(6), top = (th) => lerp(0.6, 0.85, Math.pow(clamp01((Math.sin(th - 0.25) + 1) / 2), 1.6));
    P(drape('exomis', { top, bot: () => 0.34, rad: (th, yy) => (yy < 0.56 ? lerp(0.172, 0.13, (yy - 0.34) / 0.22) : prof(yy) + 0.004) * pleats(th, yy, 0.34, 0.05, 9), m: 9 }), cl);
    P(roll('exomisRoll', (th) => [top(th), prof(top(th)) + 0.004], -PI, PI, 0.007, true), cl);
    belt(F.leather, 0.555, 0.134, 0.014);
    head({ beard: h3 > 0.5 });
    const load = h1 > 0.45;
    if (load) { // amphora carried upright against the chest in both arms
      const am = new THREE.Group(); am.position.set(0.03, 0.62, 0.2); am.rotation.set(0.22, 0, -0.12); grp.add(am);
      put(am, G('amphora', () => new THREE.LatheGeometry([[0, -0.2], [0.016, -0.185], [0.024, -0.14], [0.062, -0.07], [0.085, 0.01], [0.082, 0.075], [0.05, 0.125], [0.03, 0.145], [0.027, 0.225], [0.042, 0.232], [0.042, 0.25], [0.025, 0.25]].map(([r, yy]) => new THREE.Vector2(r, yy)), 12)), F.terracotta);
      for (const sd of [-1, 1]) { const hd = put(am, G('amHandle', () => new THREE.TorusGeometry(0.05, 0.01, 5, 8, PI)), F.terracotta, sd * 0.03, 0.165, 0); hd.rotation.z = sd * -PI / 2; }
      arm(1, null, [0.05, 0.6, 0.1], [-0.04, 0.6, 0.27]); arm(-1, null, [0.05, 0.58, 0.1], [-0.06, 0.52, 0.27]);
    } else { // mattock over the shoulder
      const H = arm(-1, null, [0.05, 0.62, 0.08], [0.02, 0.74, 0.17]);
      const tool = new THREE.Group(); tool.position.set(H[0] - 0.012, H[1], H[2]); tool.rotation.x = -0.95; grp.add(tool); // haft runs up and back over the shoulder
      put(tool, G('haft', () => new THREE.CylinderGeometry(0.012, 0.012, 0.72, 6)), F.wood, 0, 0.26, 0);
      put(tool, G('mattock', () => new THREE.BoxGeometry(0.075, 0.012, 0.1)), F.steel, 0, 0.6, -0.05).rotation.x = 0.5;
      arm(1, null, [0.04, 0.6, 0.03], [0.03, 0.45, 0.08]);
    }
    if (h2 < 0.6) up(() => { const cap = P(G('pileus', () => new THREE.SphereGeometry(1, 12, 6, 0, PI * 2, 0, PI * 0.5)), F.felt, 0, 0.962, -0.008); cap.scale.set(0.088, 0.135, 0.092); }); // pileus, the workman's egg-shaped felt cap
  } else {
    // traveller: paenula (closed bell cloak, pointed front, hood on the back), boots, staff and satchel
    shortTunic(F.undyed, 0.36); legs('boot');
    const ck = h2 > 0.5 ? F.cloak : F.dye(h2 > 0.25 ? 2 : 6);
    const CL = [[0.25, 0.235], [0.45, 0.222], [0.66, 0.2], [0.79, 0.188], [0.85, 0.13], [0.878, 0.05]];
    P(drape('paenula', { top: () => 0.878, bot: (th) => 0.34 - 0.09 * clamp01(Math.cos(th)) ** 3 - 0.05 * clamp01(-Math.cos(th)) ** 3, rad: (th, yy) => prof(yy, CL) * (1 + 0.075 * Math.sin(th * 8) * clamp01((0.8 - yy) / 0.45)), m: 10 }), ck).scale.z = 1.12;
    ball(ck, 0, 0.84, -0.095, 0.07, 0.04, 0.05); // hood bunched at the nape
    P(roll('paenulaNeck', () => [0.868, 0.075], -PI, PI, 0.022, true), ck);
    head({ hair: h1 > 0.5 ? -1 : 3, beard: h3 > 0.4 });
    if (h3 > 0.5) up(() => { const brim = P(G('petasos', () => new THREE.CylinderGeometry(0.17, 0.18, 0.012, 14)), F.straw, 0, 1.0, 0); brim.rotation.x = -0.06; ball(F.straw, 0, 1.005, 0, 0.085, 0.045, 0.085); }); // petasos, the traveller's hat
    const H = arm(-1, ck, [0.07, 0.62, 0.09], [0.12, 0.66, 0.19], 0.05);
    P(G('walkstaff', () => new THREE.CylinderGeometry(0.014, 0.018, 1.08, 6)), F.wood, H[0], 0.54, H[2] + 0.01);
    P(roll('satStrap', (th) => { const yy = lerp(0.47, 0.845, Math.pow((1 - Math.sin(th)) / 2, 0.8)); return [yy, prof(yy, CL) * 1.005 + 0.003]; }, -PI, PI, 0.007, true), F.leather).scale.z = 1.12; // strap from the right shoulder to the bag on the left hip
    P(G('satchel', () => new THREE.BoxGeometry(0.03, 0.11, 0.14)), F.leather, 0.232, 0.43, 0.02);
    P(G('satFlap', () => new THREE.BoxGeometry(0.034, 0.06, 0.146)), F.sole, 0.234, 0.457, 0.02);
  }
  return grp;
}
