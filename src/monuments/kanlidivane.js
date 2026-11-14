// Canytelis (Kanlıdivane): a town around the lip of a sinkhole — the Olban tower on the south-west rim,
// roofless basilicas on the edge, family reliefs in the cliff, the Aba temple-tomb and sarcophagi to the north.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, sm, fbm, ell, archWall, apse, gable, sarcophagus, boulder } from './kit.js';

export default function kanlidivane(g) {
  const pit = (x, z) => ell(x, z, 0.0, 0.05, 0.43, 0.33, 0.15) + (fbm(x * 5, z * 5) - 0.5) * 0.14;
  const Y = base(g, {
    dry: 0.6,
    h: (x, z) => {
      const e = pit(x, z), ground = 0.08 + fbm(x * 2.5 + 2, z * 2.5) * 0.03;
      const floor = -0.3 + fbm(x * 4, z * 4 + 5) * 0.05 + sm(0.45, 0.85, e) * 0.07; // talus at the foot of the walls
      return e < 1.02 ? Math.min(ground, floor + sm(0.86, 1.02, e) * 0.4) : ground;
    },
    tint: (x, z, y, s, c, P) => {
      const e = pit(x, z);
      if (e < 1.05 && y < 0.07) { c.copy(P.red).lerp(P.rock, fbm(x * 9, y * 30) * 0.7); if (s < 0.6 && y < -0.2) c.copy(P.grass).lerp(P.earth, 0.3); } // red-stained walls, green floor
    },
  });
  // Olban tower (Hellenistic), dedicated to Zeus by Teukros
  const tx = -0.5, tz = 0.4, ty = Y(tx, tz) - 0.008;
  B(g, M.grey, 0.14, 0.44, 0.12, tx, ty, tz, 0.25);
  for (let k = 1; k < 4; k++) B(g, M.limestone, 0.15, 0.007, 0.13, tx, ty + k * 0.11, tz, 0.25);
  B(g, M.dark, 0.03, 0.055, 0.004, tx + Math.sin(0.25) * 0.061, ty, tz + Math.cos(0.25) * 0.061, 0.25);
  for (let k = 0; k < 3; k++) B(g, M.dark, 0.012, 0.03, 0.004, tx + Math.sin(0.25) * 0.061 + 0.02, ty + 0.16 + k * 0.1, tz + Math.cos(0.25) * 0.061, 0.25);
  B(g, M.marble, 0.05, 0.03, 0.004, tx + Math.sin(0.25) * 0.062 - 0.03, ty + 0.2, tz + Math.cos(0.25) * 0.062, 0.25); // the inscription block
  for (const [sx, sz] of [[-1, -1], [1, 1], [-1, 1]]) B(g, M.grey, 0.04, 0.035, 0.035, tx + sx * 0.045, ty + 0.44, tz + sz * 0.04, 0.25);
  // basilicas on the rim. Basilica IV (north) keeps its full height with arcaded walls
  function basilica(x, z, ry, L, W, H, ruin) {
    const b = new THREE.Group(); b.position.set(x, Y(x, z) - 0.008, z); b.rotation.y = ry; g.add(b);
    const arches = (n, w) => Array.from({ length: n }, (_, k) => ({ x: -L / 2 + (k + 0.5) * L / n, w, h: H * 0.72, sill: H * 0.38 }));
    archWall(b, M.limestone, L, H, 0.02, ruin ? [] : arches(5, L / 9), 0, 0, -W / 2);
    archWall(b, M.limestone, L, H * (ruin ? 0.5 : 0.85), 0.02, ruin ? [] : arches(5, L / 9), 0, 0, W / 2);
    apse(b, M.limestone, W * 0.32, H * 0.95, L / 2, 0, 0, -Math.PI / 2);
    B(b, M.limestone, 0.02, H * 0.9, W * 0.3, L / 2, 0, -W * 0.35); B(b, M.limestone, 0.02, H * 0.6, W * 0.3, L / 2, 0, W * 0.35);
    archWall(b, M.limestone, W, H * (ruin ? 0.4 : 1.1), 0.02, [{ x: 0, w: W * 0.2, h: H * 0.5 }, { x: -W * 0.3, w: W * 0.12, h: H * 0.4 }, { x: W * 0.3, w: W * 0.12, h: H * 0.4 }], -L / 2, 0, 0, Math.PI / 2);
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) col(b, -L / 2 + (k + 1) * L / 5, s * W * 0.2, ruin || k % 2 ? 0.03 : H * 0.6, { r: 0.01, broken: ruin || k % 2 === 1, seed: k });
    rubble(b, 0, 0, 5, W, 0.02, M.limestone, x * 10);
  }
  basilica(0.12, -0.5, 0.12, 0.32, 0.2, 0.2, false);
  basilica(0.62, 0.1, 1.5, 0.24, 0.16, 0.12, true);
  basilica(-0.05, 0.58, 0.05, 0.24, 0.15, 0.1, true);
  basilica(-0.63, -0.12, 1.4, 0.22, 0.15, 0.13, false);
  // reliefs in the sinkhole wall: a family of six in a framed niche, and a soldier
  const rx = 0.08, rz = -0.27;
  B(g, M.marble, 0.15, 0.085, 0.012, rx, -0.14, rz, 0); B(g, M.dark, 0.13, 0.065, 0.004, rx, -0.13, rz + 0.007);
  for (let k = 0; k < 6; k++) put(g, new THREE.CapsuleGeometry(0.007, 0.03 - (k > 3 ? 0.012 : 0), 3, 6), M.figure, rx - 0.05 + k * 0.02, -0.105 - (k > 3 ? 0.006 : 0), rz + 0.01);
  B(g, M.marble, 0.04, 0.07, 0.01, -0.2, -0.12, -0.245, 0.3); put(g, new THREE.CapsuleGeometry(0.008, 0.035, 3, 6), M.figure, -0.198, -0.085, -0.238);
  // stair down
  for (let k = 0; k < 12; k++) { const t = k / 11, x = 0.38 - t * 0.12, z = 0.25 - t * 0.05; B(g, M.limestone, 0.03, 0.01, 0.018, x, Y(x, z) + 0.002, z, 0.9); }
  // Aba's temple-tomb: a little prostyle temple with pediment
  const ax = 0.6, az = -0.62, ay = Y(ax, az) - 0.008, ag = new THREE.Group(); ag.position.set(ax, ay, az); ag.rotation.y = 0.5; g.add(ag);
  B(ag, M.limestone, 0.13, 0.02, 0.17, 0, 0, 0); B(ag, M.limestone, 0.1, 0.11, 0.11, 0, 0.02, -0.02);
  for (const s of [-1, 1]) col(ag, s * 0.035, 0.065, 0.11, { y: 0.02, r: 0.009 });
  B(ag, M.limestone, 0.11, 0.015, 0.155, 0, 0.13, 0); gable(ag, M.limestone, 0.12, 0.16, 0.035, 0, 0.145, 0);
  B(ag, M.dark, 0.03, 0.06, 0.004, 0, 0.02, 0.036);
  // sarcophagi of the northern necropolis and house ruins on the plateau
  for (let k = 0; k < 7; k++) { const x = 0.28 + k * 0.085, z = -0.8 + Math.abs(k - 3) * 0.035; if (Math.hypot(x, z) < 0.92) sarcophagus(g, x, z, Y(x, z) - 0.004, 1.1, k * 0.5); }
  for (const [x, z, r] of [[-0.55, -0.55, 0.3], [-0.4, -0.7, 0.1], [0.72, 0.5, 0.6], [0.45, 0.7, 0.2], [-0.75, 0.2, 0]]) {
    const y = Y(x, z) - 0.006; B(g, M.rubble, 0.14, 0.045, 0.016, x, y, z, r); B(g, M.rubble, 0.016, 0.06, 0.12, x + 0.06, y, z + 0.05, r); B(g, M.rubble, 0.1, 0.03, 0.016, x - 0.01, y, z + 0.1, r);
  }
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + 0.3, x = 0.0 + Math.cos(a) * 0.47, z = 0.05 + Math.sin(a) * 0.38; boulder(g, x, Y(x, z) + 0.005, z, 0.025, k); }
  // fig and carob trees on the floor; maquis above
  scatter(g, ['olive', 'pine', 'shrub'], 12, [-0.3, -0.15, 0.3, 0.25], Y, 5, 0.8, 1.3, (x, z) => pit(x, z) < 0.55);
  scatter(g, ['shrub', 'olive', 'shrub', 'pine'], 34, [-0.95, -0.95, 0.95, 0.95], Y, 9, 0.7, 1.1, (x, z) => pit(x, z) > 1.25 && Math.hypot(x - tx, z - tz) > 0.13 && Math.hypot(x - 0.12, z + 0.5) > 0.24 && Math.hypot(x - ax, z - az) > 0.14);
  for (const [x, z, i] of [[0.44, 0.3, 0], [0.47, 0.33, 1], [-0.42, 0.42, 2], [0.1, -0.36, 3], [0.05, -0.1, 4], [0.5, -0.6, 5]]) person(g, x, z, Y(x, z) + 0.003, i);
}
