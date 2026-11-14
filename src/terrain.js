import * as THREE from 'three';
import { GRID, HEIGHT_OFFSET, WORLD, metresToY } from './geo.js';

// Loads the real-elevation heightmap (see tools/build_heightmap.py) and builds land + sea.
export async function loadHeights(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = GRID.w; c.height = GRID.h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, GRID.w, GRID.h).data;
  const h = new Float32Array(GRID.w * GRID.h);
  for (let i = 0; i < h.length; i++) h[i] = px[i * 4] * 256 + px[i * 4 + 1] - HEIGHT_OFFSET;
  return h;
}

export function makeSampler(heights) {
  // bilinear elevation in metres at world x,z
  return (x, z) => {
    const u = (x / WORLD.w + 0.5) * (GRID.w - 1);
    const v = (z / WORLD.d + 0.5) * (GRID.h - 1);
    const x0 = Math.max(0, Math.min(GRID.w - 2, Math.floor(u)));
    const y0 = Math.max(0, Math.min(GRID.h - 2, Math.floor(v)));
    const fx = Math.min(1, Math.max(0, u - x0)), fy = Math.min(1, Math.max(0, v - y0));
    const i = y0 * GRID.w + x0;
    return heights[i] * (1 - fx) * (1 - fy) + heights[i + 1] * fx * (1 - fy)
      + heights[i + GRID.w] * (1 - fx) * fy + heights[i + GRID.w + 1] * fx * fy;
  };
}

const C = (hex) => new THREE.Color(hex);
const RAMP = [
  [-400, C(0x1c3d55)], [-60, C(0x3d7f8a)], [-4, C(0xcdbf8f)],
  [1, C(0xd4c594)], [25, C(0xb7b676)], [120, C(0x93a35a)], [450, C(0x74894a)],
  [1000, C(0x55723f)], [1500, C(0x6c7a4c)], [1900, C(0x9a9069)], [2400, C(0xa39c8c)],
  [2800, C(0xcfcdc6)], [3100, C(0xf6f5f0)],
];
const ROCK = C(0x9a8c74);
function rampColor(h, out) {
  if (h <= RAMP[0][0]) return out.copy(RAMP[0][1]);
  for (let i = 1; i < RAMP.length; i++) {
    if (h <= RAMP[i][0]) {
      const t = (h - RAMP[i - 1][0]) / (RAMP[i][0] - RAMP[i - 1][0]);
      return out.copy(RAMP[i - 1][1]).lerp(RAMP[i][1], t);
    }
  }
  return out.copy(RAMP[RAMP.length - 1][1]);
}
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

// Distance (km) from each water cell to the nearest land cell (two-pass chamfer transform).
// Used instead of the DEM's bathymetry, which has tile seams offshore.
export function coastDistance(heights) {
  const { w, h } = GRID, d = new Float32Array(w * h);
  const km = WORLD.w / (w - 1), a = km, b = km * 1.414;
  for (let i = 0; i < d.length; i++) d[i] = heights[i] >= 0.5 ? 0 : 1e6;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i; let v = d[k];
    if (i > 0) v = Math.min(v, d[k - 1] + a);
    if (j > 0) { v = Math.min(v, d[k - w] + a); if (i > 0) v = Math.min(v, d[k - w - 1] + b); if (i < w - 1) v = Math.min(v, d[k - w + 1] + b); }
    d[k] = v;
  }
  for (let j = h - 1; j >= 0; j--) for (let i = w - 1; i >= 0; i--) {
    const k = j * w + i; let v = d[k];
    if (i < w - 1) v = Math.min(v, d[k + 1] + a);
    if (j < h - 1) { v = Math.min(v, d[k + w] + a); if (i < w - 1) v = Math.min(v, d[k + w + 1] + b); if (i > 0) v = Math.min(v, d[k + w - 1] + b); }
    d[k] = v;
  }
  return d;
}

export function buildTerrain(heights0, dist, step = 1) {
  // optional decimation for low-power devices
  const w = Math.floor((GRID.w - 1) / step) + 1, h = Math.floor((GRID.h - 1) / step) + 1;
  const heights = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k0 = j * step * GRID.w + i * step;
    heights[j * w + i] = heights0[k0] >= 0.5 ? heights0[k0] : -Math.min(400, dist[k0] * 28) - 1;
  }
  const geo = new THREE.PlaneGeometry(WORLD.w, WORLD.d, w - 1, h - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  const cell = WORLD.w / (w - 1) * 1000; // metres
  const hash2 = (i, j) => hash(i * step, j * step);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      const m = heights[k];
      pos.setY(k, m < 0.5 ? metresToY(m) - 0.04 : metresToY(m));
      // slope from neighbours → bare rock on steep ground
      const l = heights[k - (i > 0 ? 1 : 0)], r = heights[k + (i < w - 1 ? 1 : 0)];
      const u = heights[k - (j > 0 ? w : 0)], d = heights[k + (j < h - 1 ? w : 0)];
      const slope = Math.hypot(r - l, d - u) / (2 * cell);
      rampColor(m, tmp);
      if (m > 1) {
        tmp.lerp(ROCK, THREE.MathUtils.smoothstep(slope, 0.28, 0.75) * 0.75);
        // the plateau behind the Taurus is drier steppe than the seaward slopes
        const inland = THREE.MathUtils.smoothstep(-j / h + 0.42 + (i / w) * 0.18, 0, 0.25);
        if (m > 900 && m < 2300) tmp.lerp(C(0xb3a273), inland * 0.55);
        const n = (hash2(i, j) - 0.5) * 0.07 + (hash2(i >> 3, j >> 3) - 0.5) * 0.05;
        tmp.offsetHSL(0, 0, n);
      }
      col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  // close-range ground detail: the DEM cells are ~330 m, so add procedural grain and scrub when zoomed in
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWp;
        float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float dd = length(cameraPosition - vWp);
        float fade = 1.0 - smoothstep(18.0, 110.0, dd);
        float n = vn(vWp.xz*1.1)*0.45 + vn(vWp.xz*4.7)*0.33 + vn(vWp.xz*19.0)*0.22;
        diffuseColor.rgb *= mix(1.0, 0.74 + 0.52*n, fade);
        float veg = smoothstep(0.03, 0.12, vWp.y) * (1.0 - smoothstep(4.2, 5.2, vWp.y));
        float scrub = smoothstep(0.55, 0.75, vn(vWp.xz*34.0)) * smoothstep(0.35, 0.6, vn(vWp.xz*2.3+7.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.27, 0.13), scrub*veg*0.55*(1.0 - smoothstep(10.0, 45.0, dd)));`);
  };
  const land = new THREE.Mesh(geo, mat);
  land.receiveShadow = true;

  // table-model plinth under the terrain
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(WORLD.w + 5, 5, WORLD.d + 5),
    new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.7 }),
  );
  base.position.y = -3.9;
  const g = new THREE.Group();
  g.add(land, base);
  return { group: g, land };
}

export function buildSea(heights, dist) {
  const { w, h } = GRID;
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const m = heights[i];
    data[i * 4] = m < 0.5 ? Math.min(255, (dist[i] / 14) * 255) : 0; // depth proxy: distance offshore
    data[i * 4 + 1] = m >= 0.5 ? 255 : 0; // land mask
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.flipY = true;
  tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 }, uMap: { value: tex },
      uShallow: { value: new THREE.Color(0x5fd0c8) }, uDeep: { value: new THREE.Color(0x0d4470) },
      uSun: { value: new THREE.Color(0xffffff) }, uLight: { value: 1 },
      fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vWorld;
      void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uLight, fogDensity; uniform sampler2D uMap;
      uniform vec3 uShallow, uDeep, uSun, fogColor;
      varying vec2 vUv; varying vec3 vWorld;
      float wave(vec2 p){ return sin(p.x*1.7+uTime*0.9)*sin(p.y*2.1-uTime*0.7) + 0.5*sin(p.x*4.3-uTime*1.3+p.y*3.1); }
      void main(){
        vec4 m = texture2D(uMap, vUv);
        float depth = m.r, land = m.g;
        vec3 c = mix(uShallow, uDeep, smoothstep(0.0, 0.55, depth));
        float wv = wave(vWorld.xz*0.9) + 1.5*wave(vWorld.xz*0.12);
        c += 0.022*wv;
        // sun glitter
        vec3 v = normalize(cameraPosition - vWorld);
        float d = length(cameraPosition - vWorld);
        float gl = pow(max(0.0, wave(vWorld.xz*6.0+3.0)*wave(vWorld.zx*3.7-1.0)*0.5+0.5), 9.0) * (0.3+0.7*pow(1.0-v.y,2.0));
        c += uSun * gl * 0.28 * (1.0 - smoothstep(8.0, 45.0, d)); // fades out before it can alias
        // surf line breathing against the shore
        float shore = smoothstep(0.15, 0.6, land);
        float foam = smoothstep(0.55, 0.9, shore + 0.18*sin(uTime*1.4 + vWorld.x*1.3 + vWorld.z*1.7)) * (1.0-smoothstep(0.9,1.0,land));
        c = mix(c, vec3(1.0), foam*0.75);
        c *= uLight;
        float a = mix(0.62, 0.97, smoothstep(0.0, 0.12, depth));
        c = mix(c, fogColor, 1.0 - exp(-fogDensity*fogDensity*d*d));
        gl_FragColor = vec4(c, a);
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.w, WORLD.d), mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.02;
  return sea;
}
