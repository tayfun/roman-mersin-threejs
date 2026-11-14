// Tarsus: the buried city seen through its windows — the basalt street in its excavation trench,
// Cleopatra's Gate, the Donuktaş temple platform, a bath wall, St Paul's well, the Cydnus and its bridge.
import * as THREE from 'three';
import { M, B, put, col, drums, rubble, tree, scatter, person, base, sm, fbm, archWall, cyl, house, galley, gable } from './kit.js';

export default function tarsus(g) {
  const SA = -0.5; // street azimuth
  const along = (x, z) => x * Math.sin(SA) + z * Math.cos(SA), across = (x, z) => x * Math.cos(SA) - z * Math.sin(SA);
  const inTrench = (x, z) => Math.abs(across(x + 0.12, z)) < 0.17 && Math.abs(along(x + 0.12, z) + 0.02) < 0.5;
  const river = (x, z) => x - (0.66 + 0.07 * Math.sin(z * 3.2));
  const Y = base(g, {
    water: true, dry: 0.5,
    h: (x, z) => {
      let y = 0.085 + fbm(x * 2 + 1, z * 2) * 0.015;
      const a = Math.abs(across(x + 0.12, z)), l = Math.abs(along(x + 0.12, z) + 0.02);
      y -= (1 - sm(0.15, 0.2, a)) * (1 - sm(0.47, 0.53, l)) * 0.055; // excavation trench: the Roman level lies below today's
      y -= (1 - sm(0.06, 0.14, Math.abs(river(x, z)))) * 0.15;
      return y;
    },
    tint: (x, z, y, s, c, P) => { if (inTrench(x, z)) c.lerp(P.earth, 0.8); if (Math.abs(z - 0.52) < 0.025 && x < 0.5 && x > -0.95) c.lerp(P.sand, 0.7); },
  });
  // the Roman street: polygonal basalt, cambered, with a covered drain; stylobates and column stumps
  const st = new THREE.Group(); st.position.set(-0.12, 0.03, 0); st.rotation.y = SA; g.add(st);
  B(st, M.basalt, 0.15, 0.012, 0.94, 0, 0, -0.02); B(st, M.grey, 0.02, 0.014, 0.94, 0, 0, -0.02);
  for (const s of [-1, 1]) {
    B(st, M.limestone, 0.035, 0.022, 0.94, s * 0.095, 0, -0.02);
    for (let i = 0; i < 10; i++) {
      const up = (i + (s > 0 ? 2 : 0)) % 5 === 1;
      col(st, s * 0.095, -0.44 + i * 0.094, up ? 0.24 : 0.03 + (i % 3) * 0.02, { y: 0.022, r: 0.016, broken: !up, seed: i });
    }
    put(st, new THREE.PlaneGeometry(0.05, 0.3), M.mosaic, s * 0.14, 0.006, s * 0.15).rotation.x = -Math.PI / 2; // portico mosaic
    B(st, M.rubble, 0.012, 0.04, 0.5, s * 0.168, 0, s * 0.1);
  }
  drums(st, 0.02, 0.1, 3, 0.016, 3, 0.012); rubble(st, -0.03, -0.3, 5, 0.12, 0.02, M.basalt, 2);
  // Cleopatra's Gate: one thick-piered arch, the road running through it
  const gx = -0.52, gz = 0.52, gy = Y(gx, gz) - 0.006;
  archWall(g, M.honey, 0.34, 0.27, 0.13, [{ x: 0, w: 0.13, h: 0.21 }], gx, gy, gz, Math.PI / 2);
  B(g, M.honey, 0.15, 0.02, 0.36, gx, gy + 0.27, gz); // cornice
  for (const s of [-1, 1]) B(g, M.rubble, 0.03, 0.09 - 0.02, 0.14, gx, gy, gz + s * 0.24); // stubs of the city wall
  // Donuktaş: the concrete core of a giant temple — an open-topped box of massive walls with an inner podium
  const dx = 0.2, dz = -0.58, dy = Y(dx, dz) - 0.01, dg = new THREE.Group(); dg.position.set(dx, dy, dz); dg.rotation.y = 0.12; g.add(dg);
  for (const [x, z, w, d, hh] of [[0, -0.13, 0.62, 0.05, 0.13], [0, 0.13, 0.62, 0.05, 0.11], [-0.285, 0, 0.05, 0.22, 0.12], [0.285, 0, 0.05, 0.22, 0.07]]) B(dg, M.concrete, w, hh, d, x, 0, z);
  B(dg, M.concrete, 0.34, 0.07, 0.15, -0.05, 0, 0); B(dg, M.concrete, 0.12, 0.1, 0.12, -0.2, 0, 0.0);
  rubble(dg, 0.2, 0.0, 6, 0.14, 0.03, M.concrete, 5);
  for (const [x, z] of [[-0.2, -0.13], [0.1, 0.13], [0.26, -0.1]]) tree(dg, 'shrub', x, z, 1, 0.12, x * 9);
  // Roman bath: one tall wall of rubble and brick with an arched opening
  const bx = -0.62, bz = -0.42, by = Y(bx, bz) - 0.01;
  archWall(g, M.rubble, 0.3, 0.2, 0.05, [{ x: -0.04, w: 0.09, h: 0.13 }, { x: 0.09, w: 0.04, h: 0.16, sill: 0.1 }], bx, by, bz, 0.3);
  B(g, M.rubble, 0.05, 0.12, 0.14, bx - 0.13, by, bz + 0.1, 0.3);
  // St Paul's well and the old town houses around it
  const wx = -0.5, wz = 0.12, wy = Y(wx, wz);
  cyl(g, M.limestone, 0.026, 0.028, 0.03, wx, wy - 0.005, wz, 12); put(g, new THREE.CircleGeometry(0.02, 12), M.dark, wx, wy + 0.026, wz).rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) B(g, M.wood, 0.006, 0.06, 0.006, wx + s * 0.03, wy, wz); B(g, M.wood, 0.075, 0.006, 0.01, wx, wy + 0.06, wz);
  house(g, -0.72, 0.18, Y(-0.72, 0.18) - 0.005, 0.11, 0.13, 0.085, 0.2); house(g, -0.6, 0.3, Y(-0.6, 0.3) - 0.005, 0.1, 0.1, 0.07, -0.3); house(g, -0.8, -0.05, Y(-0.8, -0.05) - 0.005, 0.09, 0.12, 0.08, 0.5);
  house(g, 0.3, 0.72, Y(0.3, 0.72) - 0.005, 0.1, 0.12, 0.075, 0.1); house(g, 0.16, 0.8, Y(0.16, 0.8) - 0.005, 0.09, 0.09, 0.07, -0.2);
  // the Cydnus with the bridge of Justinian, and Cleopatra's barge coming upstream
  const rz = 0.3, rx = 0.66 + 0.07 * Math.sin(rz * 3.2);
  archWall(g, M.limestone, 0.36, 0.085, 0.07, [{ x: -0.1, w: 0.075, h: 0.065 }, { x: 0, w: 0.085, h: 0.07 }, { x: 0.1, w: 0.075, h: 0.065 }], rx, -0.012, rz, 0);
  B(g, M.paving, 0.42, 0.008, 0.075, rx, 0.073, rz);
  for (const s of [-1, 1]) B(g, M.limestone, 0.42, 0.016, 0.008, rx, 0.081, rz + s * 0.035);
  const barge = galley(M.purple, 0.21); barge.position.set(0.63, 0.0, -0.2); barge.rotation.y = Math.PI / 2 + 0.15; g.add(barge);
  put(g, new THREE.BoxGeometry(0.05, 0.03, 0.035), M.gold, 0.635, 0.035, -0.1); // gilded stern canopy
  for (const [x, z] of [[-0.4, 0.75], [-0.25, 0.66], [0.45, 0.1], [0.5, -0.3], [0.86, 0.1], [0.9, -0.3], [-0.85, 0.45]]) tree(g, 'palm', x, z, 1, Y(x, z), x * 7);
  for (const [x, z] of [[-0.3, -0.75], [-0.1, -0.8], [0.52, 0.55], [-0.9, 0.2]]) tree(g, 'cypress', x, z, 1.1, Y(x, z), z * 3);
  scatter(g, ['citrus', 'olive', 'shrub'], 18, [-0.95, -0.95, 0.5, 0.95], Y, 21, 0.8, 1.1, (x, z) => !inTrench(x, z) && Math.hypot(x - dx, z - dz) > 0.38 && Math.hypot(x - gx, z - gz) > 0.22 && Math.abs(z - 0.52) > 0.06 && Math.hypot(x + 0.66, z - 0.14) > 0.2);
  for (const [x, z, i] of [[-0.1, 0.0, 0], [-0.16, 0.1, 1], [-0.02, -0.2, 2], [-0.52, 0.42, 3], [-0.47, 0.14, 4], [0.2, -0.4, 5], [0.62, 0.3, 1]]) person(g, x, z, i === 1 && x > 0.5 ? 0.081 : Y(x, z) + (inTrench(x, z) ? 0.012 : 0), i);
}
