// Seleucia ad Calycadnum (Silifke): the temple podium with its single standing column and stork's nest,
// the castle on its long ridge to the west, the Tekir Ambarı cistern between castle and town,
// and the bridge over the Calycadnus to the north. North is -z, as on the map.
import * as THREE from 'three';
import { M, B, put, col, beam, drums, rubble, tree, scatter, person, base, sm, fbm, ell, archWall, house, curtain, stork, cliff } from './kit.js';

export default function seleucia(g) {
  const rz = (x) => -0.62 + 0.06 * Math.sin(x * 2.4 + 0.5); // river axis
  const CX = -0.52, CZ = 0.1; // castle ridge
  const ridge = (x, z) => ell(x, z, CX, CZ, 0.34, 0.15, -0.12);
  const CI = { x: -0.1, z: -0.26, w: 0.27, d: 0.14, depth: 0.11 };
  const cist = (x, z) => Math.max(Math.abs(x - CI.x) / (CI.w / 2), Math.abs(z - CI.z) / (CI.d / 2));
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.07 + fbm(x * 2 + 9, z * 2) * 0.02;
      y += 0.27 * (1 - sm(0.7, 1.75, ridge(x, z))); // flat-topped ridge
      y -= (1 - sm(0.11, 0.23, Math.abs(z - rz(x)))) * 0.15;
      if (cist(x, z) < 1.02) y = Math.min(y, 0.075 - CI.depth);
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (Math.abs(x - 0.3) < 0.02 && z > -0.95 && z < 0.9 && y > 0.02) c.lerp(P.sand, 0.7); // road to the bridge
      if (ridge(x, z) < 1.25 && ridge(x, z) > 1.02) c.lerp(P.earth, 0.5); // dry moat
      if (y > 0 && y < 0.03) c.lerp(P.sand, 0.5);
    },
  });
  // temple of "Jupiter": 8 x 14 peripteros on a 2 m podium; one column stands, the rest are stumps and drums
  const tx = 0.2, tz = 0.28, ty = Y(tx, tz) - 0.012, tg = new THREE.Group(); tg.position.set(tx, ty, tz); tg.rotation.y = 0.08; g.add(tg);
  const W = 0.64, D = 0.36, P0 = 0.11;
  B(tg, M.limestone, W + 0.08, 0.04, D + 0.08, 0, 0, 0); B(tg, M.limestone, W + 0.045, 0.04, D + 0.045, 0, 0.04, 0); B(tg, M.marble, W + 0.015, 0.03, D + 0.015, 0, 0.08, 0);
  for (let k = 0; k < 5; k++) B(tg, M.limestone, 0.028, P0 - k * 0.022, D * 0.62, W / 2 + 0.03 + k * 0.028, 0, 0); // east steps
  // cella: ashlar wall stubs outlining pronaos and naos
  for (const [x, z, w, d, hh] of [[-0.04, -0.105, 0.4, 0.02, 0.07], [-0.08, 0.105, 0.3, 0.02, 0.05], [-0.24, 0, 0.02, 0.23, 0.06], [0.1, 0, 0.02, 0.1, 0.045]]) B(tg, M.limestone, w, hh, d, x, P0, z);
  const sx = W / 13, sz = D / 7;
  for (let i = 0; i < 14; i++) for (let j = 0; j < 8; j++) {
    if (i > 0 && i < 13 && j > 0 && j < 7) continue;
    const x = -W / 2 + i * sx, z = -D / 2 + j * sz, k = i * 8 + j;
    if (j === 7 && i === 4) { col(tg, x, z, 0.31, { y: P0, r: 0.024 }); stork(tg, x, P0 + 0.315, z); }
    else if (j === 7 && (i === 3 || i === 5 || i === 6)) col(tg, x, z, [0.13, 0.16, 0.09][i === 3 ? 0 : i - 4], { y: P0, r: 0.024, broken: true, seed: i });
    else if (k % 4 === 0) col(tg, x, z, 0.035 + (k % 3) * 0.02, { y: P0, r: 0.024, broken: true, seed: k });
    else if (k % 3 === 0) B(tg, M.marble, 0.055, 0.01, 0.055, x, P0, z);
  }
  B(tg, M.marble, 0.11, 0.035, 0.05, -W / 2 + 5.5 * sx, P0, D / 2 - 0.06, 0.3); // a fallen architrave block on the stylobate
  drums(tg, 0.02, 0.32, 6, 0.024, 4, 0); drums(tg, -0.32, 0.3, 3, 0.024, 6, 0); drums(tg, 0.1, -0.03, 3, 0.024, 9, P0);
  rubble(tg, 0.12, 0.0, 6, 0.3, 0.03, M.marble, 3, () => P0);
  const capital = put(tg, new THREE.CylinderGeometry(0.04, 0.024, 0.05, 10), M.marble, -0.18, 0.025, 0.3); capital.rotation.set(0.5, 0, 0.3);
  // castle: a long oval enceinte with slim towers on the ridge, part ruined, dry moat at its foot
  const cp = [], NT = 15;
  for (let k = 0; k < NT; k++) { const a = k / NT * 6.283, c = Math.cos(-0.12), s = Math.sin(-0.12), ex = Math.cos(a) * 0.255, ez = Math.sin(a) * 0.09; cp.push([CX + ex * c - ez * s, CZ + ex * s + ez * c]); }
  curtain(g, M.limestone, cp, 0.06, 0.018, { tower: false, Y, skip: [4, 11] });
  cp.forEach(([x, z], k) => {
    const y = Y(x, z) - 0.01, hh = k === 4 || k === 12 ? 0.05 : 0.085;
    if (k % 4 === 1) B(g, M.limestone, 0.04, hh, 0.04, x, y, z, -0.12);
    else { const t = put(g, new THREE.CylinderGeometry(0.018, 0.02, hh, 12), M.limestone, x, y + hh / 2, z); t.geometry.attributes.uv.needsUpdate = true; }
  });
  B(g, M.rubble, 0.1, 0.045, 0.06, CX + 0.02, Y(CX, CZ) - 0.005, CZ, -0.12); B(g, M.rubble, 0.05, 0.03, 0.08, CX - 0.1, Y(CX, CZ) - 0.005, CZ + 0.01, -0.12); // inner ruins
  // rock-cut tombs in a scarp on the camera-facing flank of the ridge
  const sc = cliff(g, -0.17, 0.17, 0, 0.085, 0, 3, 0.012, M.rock); sc.position.set(CX + 0.02, 0.16, CZ + 0.2); sc.rotation.y = -0.1;
  for (let k = 0; k < 5; k++) {
    const x = CX - 0.1 + k * 0.06, z = CZ + 0.212 - (x - CX) * 0.1;
    archWall(g, M.limestone, 0.042, 0.055, 0.008, [{ x: 0, w: 0.022, h: 0.04 }], x, 0.128 + (k % 2) * 0.008, z, -0.1);
    B(g, M.dark, 0.026, 0.042, 0.004, x, 0.128 + (k % 2) * 0.008, z - 0.003, -0.1);
  }
  // Tekir Ambarı: rectangular rock-cut reservoir lined in ashlar, with a turning stair in the east corner
  const fy = 0.075 - CI.depth, ry = Y(CI.x, CI.z - 0.2) - 0.0;
  B(g, M.paving, CI.w, 0.006, CI.d, CI.x, fy - 0.002, CI.z);
  for (const [x, z, w, d] of [[0, -CI.d / 2, CI.w + 0.02, 0.012], [0, CI.d / 2, CI.w + 0.02, 0.012], [-CI.w / 2, 0, 0.012, CI.d], [CI.w / 2, 0, 0.012, CI.d]]) {
    B(g, M.limestone, w, CI.depth + 0.012, d, CI.x + x, fy, CI.z + z);
    B(g, M.marble, w + 0.012, 0.008, d + 0.012, CI.x + x, fy + CI.depth + 0.012, CI.z + z); // coping
  }
  for (let k = 0; k < 5; k++) B(g, M.limestone, 0.012, CI.depth, 0.008, CI.x - 0.1 + k * 0.05, fy, CI.z - CI.d / 2 + 0.009); // pilaster strips
  for (let k = 0; k < 9; k++) { const a = k * 0.55, st = B(g, M.marble, 0.03, 0.006, 0.014, CI.x + CI.w / 2 - 0.03 + Math.cos(a) * 0.012, fy + CI.depth - k * 0.012, CI.z + CI.d / 2 - 0.03 + Math.sin(a) * 0.012, -a); st.castShadow = true; }
  // the bridge (AD 77-78, much rebuilt): arches on cutwater piers, the middle span widest, deck slightly humped
  const bx = 0.3, bz = rz(bx);
  archWall(g, M.limestone, 0.5, 0.1, 0.075, [{ x: -0.185, w: 0.055, h: 0.07 }, { x: -0.1, w: 0.065, h: 0.078 }, { x: 0, w: 0.085, h: 0.088 }, { x: 0.1, w: 0.065, h: 0.078 }, { x: 0.185, w: 0.055, h: 0.07 }], bx, -0.012, bz, Math.PI / 2);
  for (const [dz, len, y] of [[-0.17, 0.2, 0.088], [0, 0.16, 0.094], [0.17, 0.2, 0.088]]) B(g, M.paving, 0.08, 0.008, len, bx, y, bz + dz);
  for (const s of [-1, 1]) B(g, M.limestone, 0.008, 0.02, 0.54, bx + s * 0.038, 0.094, bz);
  for (const k of [-0.145, -0.05, 0.05, 0.145]) for (const s of [-1, 1]) { const cw = put(g, new THREE.CylinderGeometry(0.02, 0.022, 0.07, 3), M.limestone, bx + s * 0.05, 0.022, bz + k); cw.rotation.y = s > 0 ? 0 : Math.PI; }
  // Silifke crowds round the ruin: two tight blocks of houses, and more across the river
  const hs = [[0.62, -0.2], [0.72, -0.08], [0.6, -0.02], [0.75, 0.1], [0.62, 0.14], [0.8, -0.24], [0.5, -0.32], [0.66, -0.36], [0.48, -0.12],
    [-0.62, 0.52], [-0.52, 0.62], [-0.7, 0.4], [-0.42, 0.74], [0.74, 0.5], [0.62, 0.62], [0.82, 0.3], [-0.3, 0.82], [0.5, -0.86], [0.1, -0.86], [-0.2, -0.88]];
  hs.forEach(([x, z], k) => { if (Math.hypot(x, z) < 0.91) house(g, x, z, Y(x, z) - 0.005, 0.06 + (k % 3) * 0.01, 0.065 + (k % 2) * 0.015, 0.042 + (k % 4) * 0.009, (k % 5) * 0.35 - 0.6); });
  // reeds on the banks; cypresses only as framing; pines on the ridge flanks
  for (let k = 0; k < 16; k++) { const x = -0.9 + k * 0.118, z = rz(x) + (k % 2 ? 0.2 : -0.19); if (Math.abs(x - bx) > 0.08 && Math.hypot(x, z) < 0.93) tree(g, 'shrub', x, z, 0.9, Y(x, z), k); }
  for (const [x, z] of [[0.82, 0.36], [0.74, 0.46], [-0.86, -0.3], [-0.78, -0.4], [0.86, -0.42]]) tree(g, 'cypress', x, z, 1.05, Y(x, z), x * 5);
  scatter(g, ['olive', 'pine', 'shrub'], 16, [-0.95, -0.5, 0.95, 0.95], Y, 31, 0.75, 1.1, (x, z) => !(Math.abs(x - tx) < 0.5 && z > -0.02 && z < 0.72) && cist(x, z) > 1.6 && ridge(x, z) > 1.3 && Y(x, z) > 0.05 && Math.abs(x - 0.3) > 0.06 && !hs.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 0.09));
  scatter(g, ['pine', 'shrub'], 7, [-0.9, -0.1, -0.15, 0.4], Y, 12, 0.7, 1, (x, z) => ridge(x, z) > 1.25 && ridge(x, z) < 1.9 && z < CZ + 0.1);
  for (const [x, z, i] of [[bx, bz - 0.05, 0], [bx, bz + 0.1, 2], [0.3, 0.02, 3], [0.0, 0.56, 4], [0.07, 0.6, 1], [CI.x + 0.2, CI.z + 0.02, 5], [CX, CZ + 0.02, 3]]) person(g, x, z, Math.abs(x - bx) < 0.01 && Math.abs(z - bz) < 0.2 ? 0.098 : Y(x, z) + 0.003, i);
}
