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

// Ground colour and lighting detail come from textures built from satellite land cover and the 30 m DEM
// (tools/build_terrain_data.py); the mesh carries the large-scale relief.
export function buildTerrain(heights0, dist, step = 1, low = false) {
  // optional decimation for low-power devices
  const w = Math.floor((GRID.w - 1) / step) + 1, h = Math.floor((GRID.h - 1) / step) + 1;
  const geo = new THREE.PlaneGeometry(WORLD.w, WORLD.d, w - 1, h - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k0 = Math.min(GRID.h - 1, j * step) * GRID.w + Math.min(GRID.w - 1, i * step);
    const m = heights0[k0] >= 0.5 ? heights0[k0] : -Math.min(400, dist[k0] * 28) - 1;
    pos.setY(j * w + i, m < 0.5 ? metresToY(m) - 0.04 : metresToY(m));
  }
  geo.computeVertexNormals();
  const loader = new THREE.TextureLoader(), root = import.meta.env.BASE_URL, sfx = low ? '-lo' : '';
  const map = loader.load(`${root}terrain-color${sfx}.jpg`);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const normalMap = loader.load(`${root}terrain-normal${sfx}.jpg`);
  normalMap.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map, normalMap, normalMapType: THREE.ObjectSpaceNormalMap, roughness: 0.96, metalness: 0 });
  // close-range grain: the textures are ~65 m per texel, so add fine variation when zoomed in
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
      .replace('#include <map_fragment>', `#include <map_fragment>
        float dd = length(cameraPosition - vWp);
        float fade = 1.0 - smoothstep(6.0, 60.0, dd);
        float n = vn(vWp.xz*6.0)*0.5 + vn(vWp.xz*23.0)*0.3 + vn(vWp.xz*71.0)*0.2;
        diffuseColor.rgb *= mix(1.0, 0.86 + 0.28*n, fade);
        // close up, break the forest colour into crowns and the open ground into stony, tufted patches
        float near = 1.0 - smoothstep(4.0, 26.0, dd);
        float canopy = smoothstep(0.03, 0.11, diffuseColor.g - diffuseColor.r);
        float clump = vn(vWp.xz*31.0)*0.55 + vn(vWp.xz*97.0)*0.45;
        diffuseColor.rgb *= mix(1.0, 0.66 + 0.62*clump, canopy*near);
        float stone = smoothstep(0.62, 0.8, vn(vWp.xz*53.0 + 11.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*1.16 + 0.03, stone*(1.0 - canopy)*near*0.6);`);
  };
  // earth-coloured wall round the edge of the map, from the surface down to the plinth
  const edge = [];
  for (let i = 0; i < w; i++) edge.push(i);
  for (let j = 1; j < h; j++) edge.push(j * w + w - 1);
  for (let i = w - 2; i >= 0; i--) edge.push((h - 1) * w + i);
  for (let j = h - 2; j > 0; j--) edge.push(j * w);
  const sp = [], si = [];
  edge.forEach((k, n) => { sp.push(pos.getX(k), pos.getY(k), pos.getZ(k), pos.getX(k), -1.5, pos.getZ(k)); const a = n * 2, b = ((n + 1) % edge.length) * 2; si.push(a, b, a + 1, b, b + 1, a + 1); });
  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); skirtGeo.setIndex(si); skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, new THREE.MeshStandardMaterial({ color: 0x6b5a45, roughness: 1, side: THREE.DoubleSide }));
  const land = new THREE.Mesh(geo, mat);
  land.receiveShadow = true;

  // table-model plinth under the terrain
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(WORLD.w + 5, 5, WORLD.d + 5),
    new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.7 }),
  );
  base.position.y = -3.9;
  const g = new THREE.Group();
  g.add(land, skirt, base);
  return { group: g, land };
}

export function buildSea(heights, dist) {
  const { w, h } = GRID;
  const data = new Uint8Array(w * h * 4);
  // mean land height within ~4 km of each cell (two box passes): high beside mountains, near zero off plains
  const R = 16, relief = new Float32Array(w * h), tmp = new Float32Array(w * h);
  for (let j = 0; j < h; j++) { let s = 0; for (let i = -R; i < w; i++) { if (i + R < w) s += Math.max(0, heights[j * w + i + R]); if (i - R - 1 >= 0) s -= Math.max(0, heights[j * w + i - R - 1]); if (i >= 0) tmp[j * w + i] = s / (2 * R + 1); } }
  for (let i = 0; i < w; i++) { let s = 0; for (let j = -R; j < h; j++) { if (j + R < h) s += tmp[(j + R) * w + i]; if (j - R - 1 >= 0) s -= tmp[(j - R - 1) * w + i]; if (j >= 0) relief[j * w + i] = s / (2 * R + 1); } }
  for (let i = 0; i < w * h; i++) {
    const m = heights[i];
    // depth proxy: distance offshore, over a shelf that is narrow below steep coasts and wide off the deltas
    data[i * 4] = m < 0.5 ? Math.min(255, (dist[i] / (3.5 + 13 * Math.exp(-relief[i] / 70))) * 255) : 0;
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
        float d = length(cameraPosition - vWorld);
        c += 0.03*wave(vWorld.xz*0.9) * (1.0 - smoothstep(30.0, 110.0, d)); // ripples only where they resolve
        // sun glitter
        vec3 v = normalize(cameraPosition - vWorld);
        float gl = pow(max(0.0, wave(vWorld.xz*6.0+3.0)*wave(vWorld.zx*3.7-1.0)*0.5+0.5), 9.0) * (0.3+0.7*pow(1.0-v.y,2.0));
        c += uSun * gl * 0.12 * (1.0 - smoothstep(6.0, 30.0, d)); // fades out before it can alias
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
