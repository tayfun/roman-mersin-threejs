// Seleucia ad Calycadnum (Silifke): the temple podium with its single standing column and stork's nest,
// the bridge over the Calycadnus, the castle hill, the rock-cut cistern and tombs.
import * as THREE from 'three';
import { M, B, put, col, drums, rubble, tree, scatter, person, base, hill, sm, fbm, archWall, house, curtain, stork, cliff } from './kit.js';

export default function seleucia(g) {
  const river = (x, z) => z - (0.55 + 0.08 * Math.sin(x * 2.4 + 0.5));
  const cist = (x, z) => Math.max(Math.abs(x - 0.52) / 0.14, Math.abs(z + 0.5) / 0.085);
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.07 + fbm(x * 2 + 9, z * 2) * 0.02 + hill(x, z, -0.58, -0.55, 0.3, 0.36);
      y -= (1 - sm(0.07, 0.17, Math.abs(river(x, z)))) * 0.14;
      y -= (1 - sm(0.9, 1.1, cist(x, z))) * 0.075; // Tekir Ambarı, cut down into the rock
      return y;
    },
    tint: (x, z, y, s, c, P) => { if (cist(x, z) < 1.15) c.lerp(P.rock, 0.9); if (Math.abs(x - 0.2) < 0.022 && z > -0.1 && z < 0.95 && y > 0.02) c.lerp(P.sand, 0.7); },
  });
  // temple of "Jupiter": 8 x 14 peripteros on a high podium; one column stands
  const tx = -0.12, tz = 0.02, ty = Y(tx, tz) - 0.012, tg = new THREE.Group(); tg.position.set(tx, ty, tz); tg.rotation.y = 0.1; g.add(tg);
  const W = 0.62, D = 0.34;
  B(tg, M.limestone, W + 0.06, 0.03, D + 0.06, 0, 0, 0); B(tg, M.limestone, W + 0.03, 0.03, D + 0.03, 0, 0.03, 0); B(tg, M.marble, W, 0.02, D, 0, 0.06, 0);
  for (let k = 0; k < 4; k++) B(tg, M.limestone, 0.03, 0.06 - k * 0.015, D * 0.7, W / 2 + 0.03 + k * 0.03, 0, 0); // east steps
  B(tg, M.rubble, W * 0.62, 0.035, 0.018, -0.02, 0.08, -D * 0.27); B(tg, M.rubble, W * 0.4, 0.025, 0.018, -0.08, 0.08, D * 0.27); // cella wall stubs
  const sx = W / 13, sz = D / 7;
  for (let i = 0; i < 14; i++) for (let j = 0; j < 8; j++) {
    if (i > 0 && i < 13 && j > 0 && j < 7) continue;
    const x = -W / 2 + i * sx + 0.0, z = -D / 2 + j * sz, k = i * 8 + j;
    if (i === 3 && j === 7) { col(tg, x, z, 0.5, { y: 0.08, r: 0.02 }); stork(tg, x, 0.585, z); }
    else if (k % 5 === 0) col(tg, x, z, 0.03 + (k % 3) * 0.02, { y: 0.08, r: 0.02, broken: true, seed: k });
    else if (k % 3 === 0) B(tg, M.marble, 0.05, 0.008, 0.05, x, 0.08, z);
  }
  drums(tg, 0.0, 0.3, 6, 0.02, 4, 0); drums(tg, -0.3, -0.28, 3, 0.02, 6, 0); rubble(tg, 0.15, 0.0, 6, 0.3, 0.03, M.marble, 3, () => 0.08);
  put(tg, new THREE.CylinderGeometry(0.036, 0.022, 0.04, 10), M.marble, 0.25, 0.02, 0.27).rotation.x = 0.4; // a fallen capital
  // castle hill: oval curtain wall with towers
  const cp = []; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; cp.push([-0.58 + Math.cos(a) * 0.2, -0.55 + Math.sin(a) * 0.13]); }
  curtain(g, M.honey, cp, 0.07, 0.022, { tower: 'round', tr: 0.03, th: 0.1, Y });
  cliff(g, -0.8, -0.38, 0.1, 0.3, -0.38, 3, 0.02, M.rock);
  for (let k = 0; k < 5; k++) B(g, M.dark, 0.022, 0.03, 0.006, -0.72 + k * 0.075, 0.15 + (k % 2) * 0.035, -0.36); // rock-cut tomb doors
  // Tekir Ambarı: rectangular rock-cut reservoir with a stair
  for (let k = 0; k < 5; k++) B(g, M.limestone, 0.02, 0.012, 0.03, 0.4 + k * 0.014, Y(0.52, -0.5) + 0.06 - k * 0.013, -0.44);
  B(g, M.limestone, 0.31, 0.012, 0.014, 0.52, Y(0.52, -0.62) - 0.004, -0.595);
  // bridge of AD 77-78 (much rebuilt): six arches on cutwater piers
  const bx = 0.2, bz = 0.55 + 0.08 * Math.sin(bx * 2.4 + 0.5);
  archWall(g, M.limestone, 0.5, 0.1, 0.075, [-0.2, -0.12, -0.04, 0.04, 0.12, 0.2].map((x) => ({ x, w: 0.062, h: 0.078 })), bx, -0.012, bz, Math.PI / 2);
  B(g, M.paving, 0.08, 0.008, 0.56, bx, 0.088, bz);
  for (const s of [-1, 1]) B(g, M.limestone, 0.008, 0.018, 0.56, bx + s * 0.038, 0.096, bz);
  for (const k of [-0.16, -0.08, 0, 0.08, 0.16]) { const cw = put(g, new THREE.CylinderGeometry(0.02, 0.02, 0.06, 3), M.limestone, bx - 0.05, 0.02, bz + k); cw.rotation.y = Math.PI; }
  // a few houses of the modern town, poplars and reeds along the river
  for (const [x, z, r] of [[0.45, 0.15, 0.1], [0.58, 0.28, -0.2], [0.7, 0.1, 0.4], [0.42, 0.3, 0], [-0.55, 0.25, 0.3], [-0.7, 0.12, -0.1], [0.5, 0.86, 0.2], [-0.2, 0.85, 0]]) house(g, x, z, Y(x, z) - 0.005, 0.09 + (x * 7 % 1) * 0.02, 0.1, 0.07, r);
  for (let k = 0; k < 9; k++) { const x = -0.85 + k * 0.2 + (k % 2) * 0.05, z = 0.55 + 0.08 * Math.sin(x * 2.4 + 0.5) - 0.17; if (Math.abs(x - bx) > 0.09 && Math.hypot(x, z) < 0.9) tree(g, 'cypress', x, z, 1.15, Y(x, z), k); }
  scatter(g, ['olive', 'pine', 'shrub'], 22, [-0.95, -0.95, 0.95, 0.3], Y, 31, 0.8, 1.2, (x, z) => Math.hypot(x - tx, z - tz) > 0.46 && cist(x, z) > 1.5 && Math.hypot(x + 0.58, z + 0.55) > 0.25 && Y(x, z) > 0.05);
  for (const [x, z, i] of [[0.2, 0.5, 0], [0.2, 0.62, 2], [0.25, 0.2, 3], [-0.05, 0.3, 4], [0.38, -0.44, 5]]) person(g, x, z, Math.abs(x - 0.2) < 0.01 && z > 0.4 ? 0.092 : Y(x, z), i);
}
