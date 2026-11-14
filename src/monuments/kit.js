// Modelling kit for the site dioramas: procedural textures, materials and architectural parts.
// Convention: each diorama fits a disc of radius 1 around the origin; y = 0 is nominal ground / sea level.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- maths
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export function n2(x, y) { // value noise 0..1
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash(i, j), hash(i + 1, j), u), lerp(hash(i, j + 1), hash(i + 1, j + 1), u), v);
}
export const fbm = (x, y) => n2(x, y) * 0.5 + n2(x * 2.1, y * 2.1) * 0.3 + n2(x * 4.3, y * 4.3) * 0.2;
export const hill = (x, z, cx, cz, r, h) => h * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r));
// elliptical distance (1 at the edge of the ellipse)
export function ell(x, z, cx, cz, rx, rz, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dz = z - cz;
  return Math.hypot((dx * c + dz * s) / rx, (-dx * s + dz * c) / rz);
}
export function rng(seed = 1) { let s = seed * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

// ---------------------------------------------------------------- textures
function canvasTex(size, draw, repeat = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const speckle = (g, s, n, a, dark = true) => {
  const r = rng(n);
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${dark ? '40,30,20' : '255,250,240'},${r() * a})`;
    g.fillRect(r() * s, r() * s, 1 + r() * 2.5, 1 + r() * 2.5);
  }
};
const blotches = (g, s, n, a, seed) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * s, y = r() * s, rad = 8 + r() * 40;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() > 0.5;
    gr.addColorStop(0, `rgba(${dark ? '60,45,30' : '255,255,245'},${a * r()})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    // wrap so the tile repeats without seams
    if (x < rad) { g.translate(s, 0); g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.translate(-s, 0); }
    if (y < rad) { g.translate(0, s); g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.translate(0, -s); }
  }
};
function ashlar(base, mortar, rows, jitter, seed) {
  return canvasTex(256, (g, s) => {
    const r = rng(seed), rh = s / rows;
    g.fillStyle = mortar; g.fillRect(0, 0, s, s);
    const c = new THREE.Color(base), hsl = {}; c.getHSL(hsl);
    for (let j = 0; j < rows; j++) {
      let x = -r() * 40;
      while (x < s) {
        const w = rh * (1.3 + r() * 1.5);
        const col = new THREE.Color().setHSL(hsl.h + (r() - 0.5) * 0.02, hsl.s * (0.8 + r() * 0.4), hsl.l + (r() - 0.5) * jitter);
        g.fillStyle = '#' + col.getHexString();
        g.fillRect(x + 1, j * rh + 1, w - 2, rh - 2);
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 1, j * rh + 1, w - 2, 2); // lit top edge
        g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x + 1, (j + 1) * rh - 3, w - 2, 2); // shaded bottom edge
        x += w;
      }
    }
    blotches(g, s, 26, 0.16, seed + 3); speckle(g, s, 900, 0.18);
  });
}
const TEX = {};
const tex = (k, f) => (TEX[k] ||= f());
export const T = {
  limestone: () => tex('lime', () => ashlar(0xd9c79f, '#8f7f62', 8, 0.1, 3)),
  honey: () => tex('honey', () => ashlar(0xcda873, '#7d6744', 8, 0.12, 5)),
  grey: () => tex('grey', () => ashlar(0xa9a294, '#6a655c', 9, 0.1, 7)),
  rubble: () => tex('rubble', () => ashlar(0xa89d88, '#857a69', 44, 0.16, 9)),
  cobble: () => tex('cobble', () => ashlar(0xb3a58c, '#6b5f4c', 18, 0.14, 15)),
  brick: () => tex('brick', () => canvasTex(256, (g, s) => { // mortared rubble with red brick lacing courses
    g.drawImage(T.rubble().image, 0, 0);
    const r = rng(61);
    for (const y0 of [40, 126, 212]) for (let j = 0; j < 3; j++) { let x = -r() * 20; while (x < s) { const w = 18 + r() * 8; g.fillStyle = `hsl(${12 + r() * 8},${45 + r() * 15}%,${36 + r() * 12}%)`; g.fillRect(x + 1, y0 + j * 7 + 1, w - 2, 5); x += w; } }
  })),
  karst: () => tex('karst', () => canvasTex(512, (g, s) => { // weathered grey limestone: soft mottling, a few faint beds, tapering runoff streaks, cracks
    g.fillStyle = '#b9b0a2'; g.fillRect(0, 0, s, s);
    blotches(g, s, 160, 0.2, 71);
    const r = rng(67);
    g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { // faint wavy bedding
      const y0 = (i + 0.3 + r() * 0.4) * s / 5; g.strokeStyle = `rgba(70,60,50,${0.12 + r() * 0.12})`; g.beginPath();
      for (let x = 0; x <= s; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.02 + i) * 5 + Math.sin(x * 0.07 + i * 3) * 2);
      g.stroke();
    }
    for (let i = 0; i < 64; i++) { // runoff: each streak one tapering shape fading downward, drawn in soft overlaid passes
      const x = r() * s, y0 = r() * s * 0.6, len = 90 + r() * 300, w = 3 + r() * 10, rust = r() > 0.3, al = 0.1 + r() * 0.12, wob = (r() - 0.5) * 10;
      for (let pass = 0; pass < 3; pass++) {
        const ww = w * (1 - pass * 0.3), gr = g.createLinearGradient(0, y0, 0, y0 + len);
        gr.addColorStop(0, rust ? `rgba(172,86,46,${al})` : `rgba(44,40,36,${al * 0.8})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - ww, y0); g.lineTo(x + ww, y0); g.quadraticCurveTo(x + ww * 0.5 + wob, y0 + len * 0.5, x + wob, y0 + len); g.quadraticCurveTo(x - ww * 0.5 + wob, y0 + len * 0.5, x - ww, y0); g.fill();
      }
    }
    for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(40,34,28,${0.25 + r() * 0.2})`; g.lineWidth = 0.8 + r(); g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 14; y += 12 + r() * 22; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 9; i++) { const x = r() * s, y = r() * s, rad = 20 + r() * 50, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(176,104,62,${0.1 + r() * 0.14})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    speckle(g, s, 2600, 0.14);
  })),
  concrete: () => tex('concrete', () => canvasTex(256, (g, s) => { // Roman concrete core: brown-grey matrix, small aggregate
    g.fillStyle = '#84766a'; g.fillRect(0, 0, s, s);
    const r = rng(11);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `hsl(${24 + r() * 16},${8 + r() * 12}%,${30 + r() * 34}%)`; g.beginPath(); g.arc(r() * s, r() * s, 0.8 + r() * 2.2, 0, 7); g.fill(); }
    for (let j = 0; j < 9; j++) { g.fillStyle = 'rgba(40,30,20,0.16)'; g.fillRect(0, j * s / 9 + r() * 6, s, 2); }
    blotches(g, s, 40, 0.22, 13);
  })),
  marble: () => tex('marble', () => canvasTex(256, (g, s) => {
    g.fillStyle = '#efe6d3'; g.fillRect(0, 0, s, s);
    blotches(g, s, 40, 0.14, 17);
    const r = rng(19);
    g.strokeStyle = 'rgba(150,135,110,0.25)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * s, y = 0; g.moveTo(x, y); while (y < s) { x += (r() - 0.5) * 26; y += 14 + r() * 20; g.lineTo(x, y); } g.stroke(); }
    speckle(g, s, 500, 0.12);
  })),
  shaft: () => tex('shaft', () => canvasTex(256, (g, s) => { // column drums: marble with horizontal joints
    g.fillStyle = '#ece2cc'; g.fillRect(0, 0, s, s);
    blotches(g, s, 30, 0.16, 23);
    for (let j = 0; j < 4; j++) { g.fillStyle = 'rgba(90,75,55,0.26)'; g.fillRect(0, j * s / 4 + 6 * (j % 2), s, 2); }
    // weather streaks
    const r = rng(29);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(110,90,60,${0.05 + r() * 0.1})`; g.fillRect(r() * s, 0, 2 + r() * 5, s); }
    speckle(g, s, 400, 0.12);
  })),
  flutes: () => tex('flutes', () => { // bump map: 20 flutes around a shaft
    const t = canvasTex(256, (g, s) => {
      const n = 20, w = s / n;
      for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * w, 0, (i + 1) * w, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#555'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(i * w, 0, w + 1, s); }
    });
    t.colorSpace = THREE.NoColorSpace; return t;
  }),
  basalt: () => tex('basalt', () => canvasTex(256, (g, s) => { // polygonal dark paving
    g.fillStyle = '#26262a'; g.fillRect(0, 0, s, s);
    const r = rng(31), n = 7, c = s / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = i * c + (j % 2) * c * 0.5, y = j * c;
      g.fillStyle = `hsl(${220 + r() * 30},${4 + r() * 6}%,${26 + r() * 16}%)`;
      g.beginPath();
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + r() * 0.5, rad = c * (0.42 + r() * 0.12); g.lineTo(x + Math.cos(a) * rad + c / 2, y + Math.sin(a) * rad + c / 2); }
      g.fill();
    }
    speckle(g, s, 500, 0.15, false);
  })),
  paving: () => tex('paving', () => ashlar(0xcfc3a6, '#8a7d66', 6, 0.12, 37)),
  ground: () => tex('ground', () => canvasTex(256, (g, s) => { // greyscale detail multiplied into vertex colours
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s);
    speckle(g, s, 3200, 0.26); speckle(g, s, 1200, 0.26, false);
  }, 5)),
  strata: () => tex('strata', () => canvasTex(256, (g, s) => { // layered cliff rock, greyscale-ish
    const r = rng(43); let y = 0;
    while (y < s) { const h = 6 + r() * 22; g.fillStyle = `hsl(28,${10 + r() * 18}%,${58 + r() * 30}%)`; g.fillRect(0, y, s, h); g.fillStyle = 'rgba(50,35,25,0.4)'; g.fillRect(0, y + h - 2, s, 2); y += h; }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,30,20,${0.1 + r() * 0.2})`; g.fillRect(r() * s, r() * s, 2, 8 + r() * 40); }
    blotches(g, s, 40, 0.25, 47);
  }, 1)),
  tiles: () => tex('tiles', () => canvasTex(128, (g, s) => {
    g.fillStyle = '#a84f33'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 8; i++) { const gr = g.createLinearGradient(i * 16, 0, i * 16 + 16, 0); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.5, 'rgba(255,200,160,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = gr; g.fillRect(i * 16, 0, 16, s); }
    for (let j = 0; j < 6; j++) { g.fillStyle = 'rgba(60,20,10,0.4)'; g.fillRect(0, j * s / 6, s, 2); }
  })),
  mosaic: () => tex('mosaic', () => canvasTex(256, (g, s) => {
    g.fillStyle = '#e9dfc6'; g.fillRect(0, 0, s, s);
    const cols = ['#7a2f22', '#2f4a5c', '#c29a3b', '#3d3a36'];
    g.lineWidth = 10; g.strokeStyle = cols[0]; g.strokeRect(10, 10, s - 20, s - 20);
    g.lineWidth = 4; g.strokeStyle = cols[3]; g.strokeRect(24, 24, s - 48, s - 48);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const x = 44 + i * 34 + 17, y = 44 + j * 34 + 17;
      g.fillStyle = cols[(i + j) % 4]; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 14, y); g.lineTo(x, y + 14); g.lineTo(x - 14, y); g.fill();
      g.fillStyle = '#e9dfc6'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    }
    // tesserae grid
    g.strokeStyle = 'rgba(60,50,40,0.25)'; g.lineWidth = 1;
    for (let i = 0; i < s; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
  })),
  water: () => tex('water', () => { // ripple bump
    const t = canvasTex(256, (g, s) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
      const r = rng(53);
      for (let i = 0; i < 260; i++) { const x = r() * s, y = r() * s, w = 10 + r() * 30; g.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.15 + r() * 0.25})`; g.lineWidth = 1 + r() * 1.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3 - r() * 3, x + w, y); g.stroke(); }
    }, 6);
    t.colorSpace = THREE.NoColorSpace; return t;
  }),
};

// ---------------------------------------------------------------- materials
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const stone = (k, o = {}) => std({ map: T[k](), bumpMap: T[k](), bumpScale: 1.6, ...o });
const MATS = {};
const mat = (k, f) => (MATS[k] ||= f());
export const M = {
  get limestone() { return mat('limestone', () => stone('limestone')); },
  get limestoneDS() { return mat('limestoneDS', () => stone('limestone', { side: THREE.DoubleSide })); },
  get honey() { return mat('honey', () => stone('honey')); },
  get honeyDS() { return mat('honeyDS', () => stone('honey', { side: THREE.DoubleSide })); },
  get grey() { return mat('grey', () => stone('grey')); },
  get rubble() { return mat('rubble', () => stone('rubble')); },
  get rubbleDS() { return mat('rubbleDS', () => stone('rubble', { side: THREE.DoubleSide })); },
  get concrete() { return mat('concrete', () => stone('concrete', { bumpScale: 2.5 })); },
  get capital() { return mat('capital', () => std({ map: T.marble(), color: 0xe9dcc3, roughness: 0.7, flatShading: true })); },
  get weathered() { return mat('weathered', () => std({ map: T.marble(), color: 0xdccfb4, roughness: 0.8 })); },
  get karst() { return mat('karst', () => std({ map: T.karst(), bumpMap: T.karst(), bumpScale: 0.8, side: THREE.DoubleSide })); },
  get relief() { return mat('relief', () => std({ color: 0xd8cdb8, roughness: 0.9 })); },
  get karstFlat() { return mat('karstFlat', () => std({ map: T.karst(), roughness: 0.9 })); },
  get karstDark() { return mat('karstDark', () => std({ map: T.karst(), color: 0x6d6258 })); },
  get brick() { return mat('brick', () => stone('brick')); },
  get brickDS() { return mat('brickDS', () => stone('brick', { side: THREE.DoubleSide })); },
  get cobble() { return mat('cobble', () => stone('cobble')); },
  get greyGranite() { return mat('greyGranite', () => std({ map: T.marble(), color: 0xa39a96, roughness: 0.45 })); },
  get reed() { return mat('reed', () => std({ color: 0x8a9a4e, flatShading: true })); },
  get oak() { return mat('oak', () => std({ color: 0x5f7a3a, flatShading: true })); },
  get marble() { return mat('marble', () => std({ map: T.marble(), roughness: 0.6 })); },
  get shaft() { return mat('shaft', () => std({ map: T.shaft(), bumpMap: T.flutes(), bumpScale: 2.2, roughness: 0.62 })); },
  get shaftWarm() { return mat('shaftWarm', () => std({ map: T.shaft(), bumpMap: T.flutes(), bumpScale: 2.2, color: 0xdccaa6, roughness: 0.75 })); },
  get granite() { return mat('granite', () => std({ map: T.concrete(), color: 0xc9a9a0, roughness: 0.5 })); },
  get basalt() { return mat('basalt', () => stone('basalt', { roughness: 0.7 })); },
  get paving() { return mat('paving', () => stone('paving')); },
  get strata() { return mat('strata', () => std({ map: T.strata(), bumpMap: T.strata(), bumpScale: 3, color: 0xd9b49a, flatShading: true })); },
  get rock() { return mat('rock', () => std({ map: T.strata(), color: 0xcbbba2, flatShading: true })); },
  get tiles() { return mat('tiles', () => std({ map: T.tiles(), roughness: 0.8 })); },
  get mosaic() { return mat('mosaic', () => std({ map: T.mosaic(), roughness: 0.55 })); },
  get plaster() { return mat('plaster', () => std({ color: 0xe9dcc2, map: T.ground() })); },
  get dark() { return mat('dark', () => std({ color: 0x1d1712 })); },
  get wood() { return mat('wood', () => std({ color: 0x6b4a2b, roughness: 0.75 })); },
  get bronze() { return mat('bronze', () => std({ color: 0xb98a3c, roughness: 0.35, metalness: 0.85 })); },
  get trunk() { return mat('trunk', () => std({ color: 0x5b4632 })); },
  get olive() { return mat('olive', () => std({ color: 0x7c8f62, flatShading: true })); },
  get pine() { return mat('pine', () => std({ color: 0x3f6a36, flatShading: true })); },
  get cypress() { return mat('cypress', () => std({ color: 0x2f4f2f, flatShading: true })); },
  get citrus() { return mat('citrus', () => std({ color: 0x2f6b2c, flatShading: true })); },
  get shrub() { return mat('shrub', () => std({ color: 0x56743a, flatShading: true })); },
  get orange() { return mat('orange', () => std({ color: 0xf08a1c, roughness: 0.5 })); },
  get skin() { return mat('skin', () => std({ color: 0xd9a37c })); },
  get figure() { return mat('figure', () => std({ color: 0xe3d2b0, roughness: 0.8 })); },
  get white() { return mat('white', () => std({ color: 0xf5f1e6 })); },
  get sail() { return mat('sail', () => std({ color: 0xc9412f, side: THREE.DoubleSide })); },
  get purple() { return mat('purple', () => std({ color: 0x7a2c8f, side: THREE.DoubleSide })); },
  get gold() { return mat('gold', () => std({ color: 0xe0b040, roughness: 0.3, metalness: 0.9 })); },
  get saffron() { return mat('saffron', () => std({ color: 0x9a5ad6, emissive: 0x2a0f4a })); },
  get water() { return mat('water', () => new THREE.MeshStandardMaterial({ color: 0x2f9db0, transparent: true, opacity: 0.8, roughness: 0.12, metalness: 0.25, bumpMap: T.water(), bumpScale: 1.2 })); },
  get river() { return mat('river', () => new THREE.MeshStandardMaterial({ color: 0x4f9fae, roughness: 0.15, metalness: 0.2, bumpMap: T.water(), bumpScale: 1 })); },
  cloth(i) { const c = [0xb23a2e, 0x2f5f8a, 0xe8e0cf, 0xd9a02a, 0x4a7a4a, 0x7a4a8a][i % 6]; return mat('cloth' + (i % 6), () => std({ color: c })); },
};

// ---------------------------------------------------------------- primitives
const TS = 0.3; // one texture tile spans this many model units
export function put(g, geo, material, x = 0, y = 0, z = 0, ry = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.y = ry;
  g.add(m); return m;
}
function boxGeo(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / TS, uv.getY(i) * dims[f][1] / TS); }
  return geo;
}
// box resting on y
export const B = (g, material, w, h, d, x = 0, y = 0, z = 0, ry = 0) => put(g, boxGeo(w, h, d), material, x, y + h / 2, z, ry);
export function cyl(g, material, rt, rb, h, x = 0, y = 0, z = 0, seg = 16, open = false) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), uv = geo.attributes.uv;
  const n = (seg + 1) * 2; // side vertices only
  for (let i = 0; i < n; i++) uv.setXY(i, uv.getX(i) * 6.283 * Math.max(rt, rb) / TS, uv.getY(i) * h / TS);
  return put(g, geo, material, x, y + h / 2, z);
}

// classical column with base, fluted shaft and capital
const colGeo = {};
export function col(g, x, z, h, o = {}) {
  const { r = 0.021, y = 0, style = 'cor', broken = false, shaft = M.shaft, cap = M.capital, bracket = 0, seed = 1 } = o;
  const grp = new THREE.Group(); grp.position.set(x, y, z); g.add(grp);
  const bh = r * 0.7, ch = style === 'cor' ? r * 2.3 : r * 1.0;
  const hs = Math.max(0.01, (broken ? h : h - ch) - bh);
  B(grp, cap, r * 2.7, r * 0.3, r * 2.7, 0, 0, 0);
  put(grp, colGeo.base ||= new THREE.CylinderGeometry(1.08, 1.3, 1, 14), cap, 0, r * 0.3 + bh * 0.3, 0).scale.set(r, bh * 0.6, r);
  const s = put(grp, colGeo.shaft ||= new THREE.CylinderGeometry(0.86, 1, 1, 16, 1, false), shaft, 0, bh + hs / 2, 0);
  s.scale.set(r, hs, r); s.rotation.y = seed * 1.7;
  if (broken) { // jagged break
    const t = put(grp, colGeo.brk ||= new THREE.CylinderGeometry(0.8, 0.86, 1, 7), M.weathered, r * 0.04, bh + hs + r * 0.1, 0);
    t.scale.set(r, r * 0.35, r); t.rotation.set(0.22, seed, 0.16);
  } else if (style === 'cor') {
    put(grp, colGeo.bell ||= new THREE.CylinderGeometry(1.25, 0.88, 1, 12), cap, 0, bh + hs + ch * 0.42, 0).scale.set(r, ch * 0.84, r);
    const ring = put(grp, colGeo.ring ||= new THREE.TorusGeometry(0.95, 0.14, 6, 14), cap, 0, bh + hs + ch * 0.06, 0);
    ring.scale.setScalar(r); ring.rotation.x = Math.PI / 2;
    for (let tier = 0; tier < 2; tier++) for (let k = 0; k < 8; k++) { // two rings of acanthus leaves
      const a = (k + tier * 0.5) / 8 * 6.283, rr = r * (1.05 + tier * 0.22);
      const leaf = put(grp, colGeo.leaf ||= new THREE.ConeGeometry(0.3, 1, 4), cap, Math.cos(a) * rr, bh + hs + ch * (0.24 + tier * 0.3), Math.sin(a) * rr);
      leaf.scale.set(r, ch * 0.42, r * 0.5); leaf.rotation.set(0, -a + Math.PI / 2, 0); leaf.rotateX(0.45 + tier * 0.15);
    }
    for (let k = 0; k < 4; k++) { // corner volutes under the abacus
      const a = k * Math.PI / 2 + Math.PI / 4;
      const v = put(grp, colGeo.vol ||= new THREE.SphereGeometry(0.33, 8, 6), cap, Math.cos(a) * r * 1.38, bh + hs + ch * 0.72, Math.sin(a) * r * 1.38);
      v.scale.set(r, r, r * 0.45); v.rotation.y = -a + Math.PI / 2;
    }
    B(grp, cap, r * 2.7, ch * 0.12, r * 2.7, 0, bh + hs + ch * 0.86, 0);
    B(grp, cap, r * 2.5, ch * 0.05, r * 2.5, 0, bh + hs + ch * 0.81, 0);
  } else {
    put(grp, colGeo.ech ||= new THREE.CylinderGeometry(1.35, 0.88, 1, 14), cap, 0, bh + hs + ch * 0.3, 0).scale.set(r, ch * 0.6, r);
    B(grp, cap, r * 2.9, ch * 0.4, r * 2.9, 0, bh + hs + ch * 0.6, 0);
  }
  if (bracket && !broken) { // statue console on the shaft, facing +x (1) or -x (-1)
    B(grp, cap, r * 1.5, r * 0.5, r * 1.3, bracket * r * 1.3, bh + hs * 0.56, 0);
    B(grp, cap, r * 0.8, r * 0.5, r * 1.1, bracket * r * 1.1, bh + hs * 0.56 - r * 0.5, 0);
  }
  return grp;
}
// entablature block between two points at height y
export function beam(g, x1, z1, x2, z2, y, w = 0.055, h = 0.04, material = M.marble) {
  const len = Math.hypot(x2 - x1, z2 - z1) + w, ry = -Math.atan2(z2 - z1, x2 - x1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  B(g, material, len, h * 0.62, w, cx, y, cz, ry);
  B(g, material, len + w * 0.25, h * 0.38, w * 1.3, cx, y + h * 0.62, cz, ry); // cornice
}
export function drums(g, x, z, n, r = 0.021, seed = 1, y = 0, material = M.weathered) { // fallen column drums
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) {
    const len = r * (1.5 + rnd() * 2.5);
    const m = put(g, colGeo.drum ||= new THREE.CylinderGeometry(1, 1, 1, 12), material, x + (rnd() - 0.5) * r * 9, y + r, z + (rnd() - 0.5) * r * 9);
    m.scale.set(r, len, r); m.rotation.set(Math.PI / 2, 0, rnd() * 3.1);
  }
}
export function rubble(g, x, z, n, spread, size, material = M.limestone, seed = 1, yf = () => 0) { // scattered blocks
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) {
    const px = x + (rnd() - 0.5) * spread, pz = z + (rnd() - 0.5) * spread, s = size * (0.6 + rnd());
    const m = B(g, material, s * (1 + rnd()), s * 0.7, s, px, yf(px, pz) - s * 0.1, pz, rnd() * 3);
    m.rotation.z = (rnd() - 0.5) * 0.3;
  }
}
// wall with round-headed openings, facing +z, centred on x; openings: [{x, w, h}] (h = height of arch crown)
export function archWall(g, material, w, h, t, openings, x = 0, y = 0, z = 0, ry = 0) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of openings) {
    const p = new THREE.Path(), r = o.w / 2, sill = o.sill || 0;
    p.moveTo(o.x - r, sill); p.lineTo(o.x - r, o.h - r); p.absarc(o.x, o.h - r, r, Math.PI, 0, true); p.lineTo(o.x + r, sill); p.closePath();
    s.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -t / 2);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TS, uv.getY(i) / TS);
  return put(g, geo, material, x, y, z, ry);
}
// barrel-vaulted hall along z: two side walls and a half-cylinder roof (open ends)
export function vault(g, material, w, len, wallH, x = 0, y = 0, z = 0, ry = 0, ends = 1) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp);
  const t = Math.max(0.012, w * 0.12);
  B(grp, material, t, wallH, len, -w / 2 + t / 2, 0, 0); B(grp, material, t, wallH, len, w / 2 - t / 2, 0, 0);
  const geo = new THREE.CylinderGeometry(w / 2, w / 2, len, 14, 1, true, -Math.PI / 2, Math.PI);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 1.57 / TS, uv.getY(i) * len / TS);
  const roof = put(grp, geo, material, 0, wallH, 0); roof.rotation.x = -Math.PI / 2;
  const end = (z, door) => { // end wall rising to a round head under the barrel
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, wallH); sh.absarc(0, wallH, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
    if (door) { const p = new THREE.Path(), r = w * 0.2, hh = wallH * 0.8; p.moveTo(-r, 0); p.lineTo(-r, hh - r); p.absarc(0, hh - r, r, Math.PI, 0, true); p.lineTo(r, 0); p.closePath(); sh.holes.push(p); }
    const eg = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 10 }); eg.translate(0, 0, -t / 2);
    const eu = eg.attributes.uv; for (let i = 0; i < eu.count; i++) eu.setXY(i, eu.getX(i) / TS, eu.getY(i) / TS);
    put(grp, eg, material, 0, 0, z);
  };
  if (ends) end(len / 2 - t / 2, true); // front, with a door
  if (ends > 1) end(-len / 2 + t / 2, false);
  return grp;
}
// theatre seating: stepped lathe + radial stairways. Opens toward +z.
export function cavea(g, { r0 = 0.16, r1 = 0.55, rows = 10, arc = Math.PI, stairs = 5, material = M.limestone, ruin = 0, x = 0, y = 0, z = 0, ry = 0 } = {}) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp);
  const dr = (r1 - r0) / rows, dy = dr * 0.62, pts = [new THREE.Vector2(r0, 0)];
  for (let i = 0; i < rows; i++) pts.push(new THREE.Vector2(r0 + i * dr, (i + 1) * dy), new THREE.Vector2(r0 + (i + 1) * dr, (i + 1) * dy));
  pts.push(new THREE.Vector2(r1 + dr * 0.6, rows * dy));
  const geo = new THREE.LatheGeometry(pts, 48, Math.PI - arc / 2, arc);
  { // outer retaining wall in coursed masonry
    const ro = r1 + dr * 0.6, hw = rows * dy, wg = new THREE.CylinderGeometry(ro, ro, hw, 48, 1, true, Math.PI - arc / 2, arc), wu = wg.attributes.uv;
    for (let i = 0; i < wu.count; i++) wu.setXY(i, wu.getX(i) * arc * ro / TS, wu.getY(i) * hw / TS);
    put(grp, wg, material === M.honey ? M.honeyDS : material === M.limestone ? M.limestoneDS : M.rubbleDS, 0, hw / 2, 0);
  }
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * arc * r1 / TS, uv.getY(i) * 3);
  const ds = material === M.limestone ? M.limestoneDS : material === M.honey ? M.honeyDS : M.rubbleDS;
  put(grp, geo, ds);
  // stairways (two half-steps per row) in a paler stone
  for (let s = 0; s < stairs; s++) {
    const a = -arc / 2 + arc * (s + 0.5) / stairs + Math.PI / 2;
    for (let i = 0; i < rows; i++) {
      const rr = r0 + (i + 0.25) * dr;
      const m = B(grp, M.marble, dr * 0.52, dy * 0.5, 0.03, Math.cos(a) * rr, (i + 1) * dy - dy * 0.5 + 0.001, -Math.sin(a) * rr, a);
      m.scale.y = 1;
    }
  }
  // orchestra
  const o = put(grp, new THREE.CircleGeometry(r0, 32), M.paving, 0, 0.004, 0); o.rotation.x = -Math.PI / 2;
  // end (analemma) walls: stepped, following the seat profile, so no underside shows
  for (const sgn of [-1, 1]) {
    const a = Math.PI / 2 + sgn * arc / 2, sh = new THREE.Shape();
    sh.moveTo(r0, 0); for (let i = 0; i < rows; i++) { sh.lineTo(r0 + i * dr, (i + 1) * dy + 0.004); sh.lineTo(r0 + (i + 1) * dr, (i + 1) * dy + 0.004); }
    sh.lineTo(r1 + dr * 0.62, rows * dy + 0.004); sh.lineTo(r1 + dr * 0.62, 0); sh.closePath();
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.024, bevelEnabled: false }); eg.translate(0, 0, -0.012);
    const eu = eg.attributes.uv; for (let i = 0; i < eu.count; i++) eu.setXY(i, eu.getX(i) / TS, eu.getY(i) / TS);
    put(grp, eg, material, 0, 0, 0, a);
  }
  grp.userData = { top: rows * dy, dr, dy };
  return grp;
}

// ---------------------------------------------------------------- nature and people
const geoCache = {};
const ico = (d = 0) => (geoCache['ico' + d] ||= new THREE.IcosahedronGeometry(1, d));
export function tree(g, kind, x, z, s = 1, y = 0, seed = 1) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = seed * 2.4; grp.scale.setScalar(s * 0.72); g.add(grp);
  const trunk = (h, r = 0.012) => { const m = put(grp, geoCache.trunk ||= new THREE.CylinderGeometry(0.7, 1, 1, 6), M.trunk, 0, h / 2, 0); m.scale.set(r, h, r); return m; };
  if (kind === 'cypress') { trunk(0.05, 0.01); put(grp, geoCache.cyp ||= new THREE.ConeGeometry(1, 1, 7), M.cypress, 0, 0.19, 0).scale.set(0.035, 0.32, 0.035); }
  else if (kind === 'pine') { // umbrella pine
    trunk(0.17, 0.013);
    for (const [dx, dy, dz, r] of [[0, 0.2, 0, 0.085], [0.05, 0.185, 0.03, 0.06], [-0.045, 0.19, -0.03, 0.06]]) put(grp, ico(1), M.pine, dx, dy, dz).scale.set(r, r * 0.5, r);
  } else if (kind === 'olive') {
    trunk(0.07, 0.016);
    for (const [dx, dy, dz, r] of [[0, 0.1, 0, 0.065], [0.045, 0.085, 0.02, 0.045], [-0.04, 0.09, -0.025, 0.05], [0.0, 0.085, 0.05, 0.04]]) put(grp, ico(1), M.olive, dx, dy, dz).scale.set(r, r * 0.75, r);
  } else if (kind === 'citrus') {
    trunk(0.04, 0.01);
    put(grp, ico(1), M.citrus, 0, 0.075, 0).scale.setScalar(0.05);
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + seed; put(grp, geoCache.fruit ||= new THREE.SphereGeometry(1, 6, 5), M.orange, Math.cos(a) * 0.045, 0.06 + 0.012 * (k % 3), Math.sin(a) * 0.045).scale.setScalar(0.009); }
  } else if (kind === 'palm') {
    const t = trunk(0.22, 0.011); t.rotation.z = 0.06;
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; const f = put(grp, geoCache.frond ||= new THREE.ConeGeometry(0.018, 0.13, 4), M.pine, Math.cos(a) * 0.05, 0.215, Math.sin(a) * 0.05); f.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9); f.scale.z = 0.4; }
  } else if (kind === 'oak') { // scrub oak / carob: low round crown
    trunk(0.05, 0.014);
    for (const [dx, dy, dz, r] of [[0, 0.085, 0, 0.07], [0.04, 0.07, 0.03, 0.05], [-0.045, 0.075, -0.02, 0.055]]) put(grp, ico(1), M.oak, dx, dy, dz).scale.set(r, r * 0.8, r);
  } else if (kind === 'cedar') { // layered conifer of the uplands
    trunk(0.08, 0.012);
    for (let k = 0; k < 3; k++) put(grp, geoCache.cyp ||= new THREE.ConeGeometry(1, 1, 7), M.cypress, 0, 0.1 + k * 0.065, 0).scale.set(0.075 - k * 0.02, 0.11, 0.075 - k * 0.02);
  } else if (kind === 'reed') {
    for (let k = 0; k < 5; k++) { const b = put(grp, geoCache.cyp ||= new THREE.ConeGeometry(1, 1, 7), M.reed, Math.cos(k * 2.4) * 0.012, 0.03, Math.sin(k * 2.4) * 0.012); b.scale.set(0.006, 0.06 + (k % 3) * 0.012, 0.006); b.rotation.z = (k - 2) * 0.12; }
  } else { // shrub
    put(grp, ico(0), M.shrub, 0, 0.02, 0).scale.set(0.035, 0.026, 0.035);
  }
  return grp;
}
export function scatter(g, kind, n, area, Y, seed = 1, sMin = 0.7, sMax = 1.2, ok = () => true) { // area: [x0, z0, x1, z1]
  const rnd = rng(seed); let placed = 0;
  for (let i = 0; i < n * 6 && placed < n; i++) {
    const x = lerp(area[0], area[2], rnd()), z = lerp(area[1], area[3], rnd());
    if (Math.hypot(x, z) > 0.93 || !ok(x, z)) continue;
    tree(g, Array.isArray(kind) ? kind[Math.floor(rnd() * kind.length)] : kind, x, z, lerp(sMin, sMax, rnd()), Y(x, z) - 0.004, i);
    placed++;
  }
}
export function person(g, x, z, y = 0, i = 0, s = 1) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.scale.setScalar(s); g.add(grp);
  put(grp, geoCache.body ||= new THREE.CapsuleGeometry(0.008, 0.02, 3, 6), M.cloth(i), 0, 0.02, 0);
  put(grp, geoCache.head ||= new THREE.SphereGeometry(0.0065, 6, 5), M.skin, 0, 0.043, 0);
  return grp;
}
export function boulder(g, x, y, z, s, seed = 1, material = M.rock) {
  const m = put(g, geoCache.boulder ||= new THREE.DodecahedronGeometry(1, 0), material, x, y, z);
  m.scale.set(s * (0.8 + hash(seed, 1) * 0.6), s * (0.5 + hash(seed, 2) * 0.5), s * (0.8 + hash(seed, 3) * 0.6)); m.rotation.set(seed, seed * 2.3, seed * 0.7);
  return m;
}
export function galley(sailMat = M.sail, s = 1) {
  const g = new THREE.Group();
  const hull = put(g, new THREE.SphereGeometry(0.5, 14, 8), M.wood, 0, 0.03, 0); hull.scale.set(1.5, 0.3, 0.32);
  const deck = B(g, M.trunk, 1.1, 0.02, 0.22, 0, 0.1, 0);
  put(g, new THREE.ConeGeometry(0.05, 0.36, 6), M.bronze, 0.86, 0.04, 0).rotation.z = -Math.PI / 2; // ram
  const stern = put(g, new THREE.TorusGeometry(0.17, 0.03, 6, 10, Math.PI), M.wood, -0.7, 0.17, 0); stern.rotation.z = Math.PI / 2.4;
  put(g, new THREE.CylinderGeometry(0.018, 0.02, 0.75, 6), M.wood, 0.05, 0.47, 0);
  put(g, new THREE.CylinderGeometry(0.012, 0.012, 0.66, 6), M.wood, 0.05, 0.78, 0).rotation.x = Math.PI / 2;
  const sg = new THREE.PlaneGeometry(0.62, 0.42, 6, 1), sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.09 * Math.cos(sp.getX(i) * 4.2));
  sg.computeVertexNormals();
  put(g, sg, sailMat, 0.1, 0.56, 0, Math.PI / 2);
  for (let i = 0; i < 7; i++) for (const sd of [-1, 1]) {
    const oar = put(g, new THREE.CylinderGeometry(0.007, 0.007, 0.36, 4), M.wood, -0.45 + i * 0.15, 0.03, sd * 0.25); oar.rotation.x = sd * 1.1;
  }
  g.scale.setScalar(s);
  return g;
}

// ---------------------------------------------------------------- more building parts
const dsOf = (m) => (m === M.honey ? M.honeyDS : m === M.limestone ? M.limestoneDS : m === M.rubble ? M.rubbleDS : m === M.brick ? M.brickDS : m);
// half-cylinder apse shell, concave side facing +z
export function apse(g, material, r, h, x = 0, y = 0, z = 0, ry = 0) {
  const geo = new THREE.CylinderGeometry(r, r, h, 16, 1, true, Math.PI / 2, Math.PI), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.14 * r / TS, uv.getY(i) * h / TS);
  return put(g, geo, dsOf(material), x, y + h / 2, z, ry);
}
// triangular-prism roof / pediment block, ridge along z
export function gable(g, material, w, len, h, x = 0, y = 0, z = 0, ry = 0) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TS * 2, uv.getY(i) / TS * 2);
  return put(g, geo, material, x, y, z, ry);
}
export function sarcophagus(g, x, z, y = 0, s = 1, ry = 0, material = M.limestone) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; grp.scale.setScalar(s); g.add(grp);
  B(grp, material, 0.05, 0.012, 0.085, 0, 0, 0); B(grp, material, 0.04, 0.03, 0.075, 0, 0.012, 0);
  gable(grp, material, 0.048, 0.082, 0.018, 0, 0.042, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(grp, material, 0.01, 0.014, 0.01, sx * 0.02, 0.042, sz * 0.037); // acroteria
  return grp;
}
export function house(g, x, z, y, w, d, h, ry = 0, material = M.plaster) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp);
  B(grp, material, w, h, d, 0, 0, 0);
  gable(grp, M.tiles, w * 1.12, d * 1.08, w * 0.3, 0, h, 0);
  B(grp, M.dark, w * 0.18, h * 0.5, 0.004, 0, 0, d / 2); B(grp, M.dark, w * 0.14, h * 0.2, 0.004, w * 0.28, h * 0.5, d / 2); B(grp, M.dark, w * 0.14, h * 0.2, 0.004, -w * 0.28, h * 0.5, d / 2);
  return grp;
}
// fortification: wall along a polyline with towers at the vertices and a crenellated top
export function curtain(g, material, pts, h, t = 0.025, o = {}) {
  const { closed = true, tower = 'square', tr = 0.035, th = h * 1.35, Y = () => 0, skip = [], merlons = true } = o;
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % n];
    if (!skip.includes(i)) {
      const len = Math.hypot(x2 - x1, z2 - z1), ry = -Math.atan2(z2 - z1, x2 - x1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, y = Math.min(Y(x1, z1), Y(x2, z2), Y(cx, cz)) - 0.01;
      B(g, material, len, h, t, cx, y, cz, ry);
      const m = Math.max(2, Math.round(len / 0.017));
      if (merlons) for (let k = 0; k < m; k += 2) { const f = (k + 0.5) / m - 0.5; B(g, material, len / m, 0.007, t, cx + Math.cos(-ry) * f * len, y + h, cz + Math.sin(-ry) * f * len, ry); }
      else for (let k = 0; k < 4; k++) { const f = (k + 0.5) / 4 - 0.5, hh = h * 0.4 * Math.max(0, fbm(cx * 9 + k * 1.7, cz * 9 + i) - 0.25); if (hh > 0.002) B(g, material, len / 4, hh, t, cx + Math.cos(-ry) * f * len, y + h, cz + Math.sin(-ry) * f * len, ry); } // a broken, uneven top
    }
  }
  if (tower) for (const [x, z] of pts) {
    const y = Y(x, z) - 0.01;
    if (tower === 'round') { cyl(g, material, tr, tr * 1.05, th, x, y, z, 12); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; B(g, material, tr * 0.55, 0.012, tr * 0.35, x + Math.cos(a) * tr * 0.82, y + th, z + Math.sin(a) * tr * 0.82, -a + Math.PI / 2); } }
    else { B(g, material, tr * 2, th, tr * 2, x, y, z); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) B(g, material, tr * 0.36, 0.008, tr * 0.36, x + sx * tr * 0.8, y + th, z + sz * tr * 0.8); }
  }
}
// near-vertical rock face (a displaced sheet), facing +z, spanning x0..x1 and y0..y1 at depth z
export function cliff(g, x0, x1, y0, y1, z, seed = 1, amp = 0.035, material = M.strata, ry = 0) {
  const nx = 36, ny = 14, geo = new THREE.PlaneGeometry(x1 - x0, y1 - y0, nx, ny), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const ledge = Math.sin(y * 34 + seed) * 0.4 + Math.sin(y * 71 + seed * 2) * 0.25;
    p.setZ(i, (fbm(x * 5 + seed, y * 5) - 0.5) * amp * 2 + ledge * amp * 0.5 + (y / (y1 - y0)) * -amp * 1.2);
    uv.setXY(i, uv.getX(i) * (x1 - x0) / TS, uv.getY(i) * (y1 - y0) / TS);
  }
  geo.computeVertexNormals();
  const m = put(g, geo, material, (x0 + x1) / 2, (y0 + y1) / 2, z, ry);
  return m;
}
export function stork(g, x, y, z) { // nest and bird
  cyl(g, M.trunk, 0.03, 0.018, 0.014, x, y, z, 8);
  put(g, geoCache.sbody ||= new THREE.SphereGeometry(1, 8, 6), M.white, x, y + 0.03, z).scale.set(0.012, 0.01, 0.02);
  put(g, geoCache.sneck ||= new THREE.CylinderGeometry(1, 1, 1, 5), M.white, x, y + 0.045, z + 0.014).scale.set(0.003, 0.03, 0.003);
  put(g, geoCache.sbeak ||= new THREE.ConeGeometry(1, 1, 4), M.orange, x, y + 0.058, z + 0.024).scale.set(0.003, 0.018, 0.003);
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) put(g, geoCache.sneck, M.orange, x + s * 0.004, y + 0.015, z).scale.set(0.0015, 0.02, 0.0015);
}

// rock skin lining a sinkhole: follows the contour e(x,z) = level around (cx,cz), stepped into ledges.
// yTop(x,z) gives the rim height; the skin runs down to yBot. Overhang > 0 leans the top inward (Cehennem).
export function pitSkin(g, e, cx, cz, yTop, yBot, o = {}) {
  const { level = 0.97, rmax = 1.2, seg = 160, tiers = 4, step = 0.022, amp = 0.014, material = M.karst, overhang = 0, seed = 1, mask = null, cap = 0.014 } = o;
  const pos = [], uv = [], idx = [], rows = tiers * 2 + 1;
  let arc = 0, px = null, pz = null;
  for (let k = 0; k <= seg; k++) {
    const a = (k % seg) / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    let lo = 0, hi = rmax; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (e(cx + ca * m, cz + sa * m) < level) lo = m; else hi = m; }
    const R = lo, x0 = cx + ca * R, z0 = cz + sa * R, top = yTop(cx + ca * (R + cap + 0.014), cz + sa * (R + cap + 0.014)) + 0.004; // rim height, sampled on the plateau just beyond the cap
    if (px !== null) arc += Math.hypot(x0 - px, z0 - pz); px = x0; pz = z0;
    for (let j = 0; j < rows; j++) {
      const t = j / (rows - 1), tier = Math.floor((j + 1) / 2); // pairs of rows make a vertical face then a ledge
      let inset = 0; for (let q = 1; q <= tier; q++) inset += step * 2 * Math.max(0, fbm(a * 2.3 + seed + q * 5.1, q * 1.3) - 0.15); // ledges of uneven width that pinch out
      inset += -overhang * (1 - t) * 2 + (fbm(a * 5 + seed, t * 2.5) - 0.5) * amp * 2 + Math.sin(a * 9 + seed) * amp * 0.5;
      if (j === 0) inset = -cap; // lip cap laid over the rim
      const r = Math.max(0.01, R - inset), yy = j === 0 ? top + 0.002 : top + (yBot - top) * (t + (j % 2 ? (fbm(a * 3 + j, seed) - 0.5) * 0.5 / rows : 0));
      pos.push(cx + ca * r, yy, cz + sa * r); uv.push(arc / TS * 0.42, (1 - t) * (top - yBot) / TS * 0.42);
    }
  }
  for (let k = 0; k < seg; k++) { if (mask && !mask((k + 0.5) / seg * Math.PI * 2)) continue; for (let j = 0; j < rows - 1; j++) { const a0 = k * rows + j, b0 = a0 + rows; idx.push(a0, a0 + 1, b0, b0, a0 + 1, b0 + 1); } }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return put(g, geo, material);
}
// ring of voussoirs around a round-headed opening (stands proud of an archWall face), in the wall's local frame
export function archRing(g, material, w, hCrown, t, x = 0, y = 0, z = 0, ry = 0, n = 9) {
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp);
  const r = w / 2, cy = hCrown - r, d = Math.max(0.012, w * 0.16);
  for (let k = 0; k < n; k++) { const a = Math.PI * (k + 0.5) / n; const v = B(grp, material, d, (Math.PI * r / n) * 1.05, t, Math.cos(a) * (r + d / 2), cy + Math.sin(a) * (r + d / 2) - (Math.PI * r / n) * 0.52, 0); v.rotation.z = a; }
  for (const s of [-1, 1]) B(grp, material, d * 1.5, d * 0.7, t * 1.05, s * (r + d / 2), cy - d * 0.7, 0); // imposts
  return grp;
}
export function railing(g, pts, Y, h = 0.022, material = M.wood) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[i + 1], len = Math.hypot(x2 - x1, z2 - z1), ry = -Math.atan2(z2 - z1, x2 - x1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, y = Math.max(Y(x1, z1), Y(x2, z2));
    B(g, material, 0.004, h, 0.004, x1, Y(x1, z1), z1); B(g, material, len, 0.003, 0.003, cx, y + h, cz, ry); B(g, material, len, 0.003, 0.003, cx, y + h * 0.55, cz, ry);
  }
}
export function lion(g, x, z, y = 0, ry = 0, s = 1) { // crouching fountain lion on a pedestal, basin in front
  const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; grp.scale.setScalar(s); g.add(grp);
  B(grp, M.limestone, 0.034, 0.03, 0.06, 0, 0, 0);
  put(grp, geoCache.lbody ||= new THREE.SphereGeometry(1, 10, 8), M.weathered, 0, 0.042, -0.006).scale.set(0.012, 0.012, 0.024);
  put(grp, geoCache.lbody, M.weathered, 0, 0.052, 0.014).scale.set(0.013, 0.014, 0.012); // mane
  put(grp, geoCache.lbody, M.weathered, 0, 0.056, 0.024).scale.set(0.008, 0.008, 0.009); // head
  for (const sx of [-1, 1]) B(grp, M.weathered, 0.006, 0.006, 0.018, sx * 0.008, 0.03, 0.02);
  B(grp, M.limestone, 0.04, 0.014, 0.022, 0, 0, 0.042); B(grp, M.river, 0.03, 0.002, 0.014, 0, 0.014, 0.042);
  return grp;
}

// ---------------------------------------------------------------- sculpted base
const SKIRT = -0.3, BOTTOM = -0.5;
export const BASE_DEPTH = -BOTTOM;
const PAL = {
  grass: new THREE.Color(0x7d9450), grass2: new THREE.Color(0x9aa35e), dry: new THREE.Color(0xb7a970), earth: new THREE.Color(0xb39a6c),
  sand: new THREE.Color(0xe4d3a2), rock: new THREE.Color(0xa99780), red: new THREE.Color(0xa86a4c), seabed: new THREE.Color(0x3d7f86), deep: new THREE.Color(0x1f5a70),
};
/**
 * Terrain disc with relief. opts.h(x,z) -> height; opts.water: sea at y=0 where h<0;
 * opts.tint(x,z,y,slope,color) may recolour. Returns the height sampler.
 */
export function base(g, opts = {}) {
  const { h = () => 0.02, water = false, tint, dry = 0.35, N = 88 } = opts;
  const Y = (x, z) => { const r = Math.hypot(x, z); if (r > 0.999) { x *= 0.999 / r; z *= 0.999 / r; } return h(x, z); };
  const pos = [], colr = [], uv = [], idx = [], c = new THREE.Color();
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    let x = (i / N) * 2 - 1, z = (j / N) * 2 - 1; const r = Math.hypot(x, z);
    if (r > 1) { x /= r; z /= r; }
    const y = Y(x, z), e = 0.012;
    const slope = Math.hypot(Y(x + e, z) - Y(x - e, z), Y(x, z + e) - Y(x, z - e)) / (2 * e);
    const n = fbm(x * 3.1 + 7, z * 3.1 + 3), n1 = n2(x * 9, z * 9);
    c.copy(PAL.grass).lerp(PAL.grass2, n1).lerp(PAL.dry, sm(0.35, 0.7, n) * dry * 2).lerp(PAL.earth, sm(0.55, 0.8, n2(x * 5 + 20, z * 5)) * 0.6);
    c.lerp(PAL.rock, sm(0.7, 1.5, slope));
    if (water) { c.lerp(PAL.sand, 1 - sm(0.004, 0.03, y)); if (y < 0) c.copy(PAL.sand).lerp(PAL.seabed, sm(0, -0.035, y)).lerp(PAL.deep, sm(-0.03, -0.12, y)); }
    if (tint) tint(x, z, y, slope, c, PAL);
    pos.push(x, y, z); colr.push(c.r, c.g, c.b); uv.push(x, z);
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; idx.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: T.ground(), roughness: 0.95 }));
  land.userData.keep = true; land.receiveShadow = true; land.castShadow = true; g.add(land);

  // skirt: the cut edge of the block, coloured as soil/rock strata (or water where the sea meets the edge)
  const sp = [], sc = [], si = [], su = [], S = 120, soil = new THREE.Color(0xb59a72), sub = new THREE.Color(0x8a6f52), sea = new THREE.Color(0x4fb0c0), seaD = new THREE.Color(0x2a7890);
  for (let k = 0; k <= S; k++) {
    const a = (k / S) * Math.PI * 2, x = Math.cos(a), z = Math.sin(a), yl = Y(x, z), wet = water && yl < 0, top = wet ? 0 : yl;
    sp.push(x, top, z, x, SKIRT, z); su.push(k / S * 12, top * 2, k / S * 12, SKIRT * 2);
    const t = wet ? sea : soil, b = wet ? seaD : sub; sc.push(t.r, t.g, t.b, b.r, b.g, b.b);
    if (k < S) si.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
  sg.setIndex(si); sg.computeVertexNormals();
  const skirt = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ vertexColors: true, map: T.strata(), roughness: 0.9, side: THREE.DoubleSide }));
  skirt.userData.keep = true; g.add(skirt);

  if (water) {
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.997, 72), M.water);
    w.rotation.x = -Math.PI / 2; w.position.y = 0; w.userData.keep = true; w.renderOrder = 1; g.add(w);
  }
  // turned bronze-and-walnut stand
  const prof = [[1.0, SKIRT], [1.035, SKIRT], [1.045, SKIRT - 0.02], [1.03, SKIRT - 0.04]].map(([r, y]) => new THREE.Vector2(r, y));
  const ring = new THREE.Mesh(new THREE.LatheGeometry(prof.reverse(), 72), M.bronze); ring.userData.keep = true; g.add(ring);
  const prof2 = [[1.03, SKIRT - 0.04], [1.07, SKIRT - 0.06], [1.085, SKIRT - 0.12], [1.07, SKIRT - 0.15], [1.1, BOTTOM + 0.02], [1.1, BOTTOM], [0, BOTTOM]].map(([r, y]) => new THREE.Vector2(r, y));
  const stand = new THREE.Mesh(new THREE.LatheGeometry(prof2.reverse(), 72), new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.5 })); stand.userData.keep = true; stand.castShadow = true; g.add(stand);
  return Y;
}

// ---------------------------------------------------------------- bake: merge everything by material
export function bake(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), buckets = new Map(), keep = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.keep) { keep.push(o); return; }
    let geo = o.geometry.clone();
    if (geo.index) geo = geo.toNonIndexed();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    (buckets.get(o.material) || buckets.set(o.material, []).get(o.material)).push(geo);
  });
  const out = new THREE.Group();
  for (const o of keep) { o.applyMatrix4(new THREE.Matrix4()); out.add(o); }
  for (const [material, geos] of buckets) {
    const m = new THREE.Mesh(mergeGeometries(geos, false), material);
    m.castShadow = !material.transparent; m.receiveShadow = true;
    out.add(m);
  }
  return out;
}
