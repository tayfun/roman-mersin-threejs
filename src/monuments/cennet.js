// The Corycian Cave: Cennet ("Heaven"), a collapsed cavern with a stair down to the chapel at the cave mouth;
// Cehennem ("Hell"), a sheer shaft beside it; and the temple of Zeus turned church on the southern rim.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, sm, fbm, ell, apse, gable, boulder } from './kit.js';

export default function cennet(g) {
  const cen = (x, z) => ell(x, z, -0.12, -0.02, 0.56, 0.3, 0.12) + (fbm(x * 5 + 3, z * 5) - 0.5) * 0.12;
  const ceh = (x, z) => ell(x, z, 0.63, -0.55, 0.14, 0.12) + (fbm(x * 9, z * 9) - 0.5) * 0.1;
  const Y = base(g, {
    dry: 0.55,
    h: (x, z) => {
      const ground = 0.08 + fbm(x * 2.5, z * 2.5 + 6) * 0.03, e = cen(x, z), f = ceh(x, z);
      let y = ground;
      if (e < 1.03) { const floor = -0.2 - sm(-0.5, 0.4, x) * 0.2 + fbm(x * 5, z * 5) * 0.04; y = Math.min(y, floor + sm(0.8, 1.03, e) * 0.5); } // floor falls toward the cave at the east end
      if (f < 1.05) y = Math.min(y, -0.44 + sm(0.75, 1.05, f) * 0.56);
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (y < 0.06) { c.copy(P.rock).lerp(P.red, fbm(x * 8, y * 25) * 0.5); if (s < 0.7 && y < -0.15 && ceh(x, z) > 1.1) c.copy(P.grass).multiplyScalar(0.85); }
      if (ceh(x, z) < 0.9) c.multiplyScalar(0.35 + sm(-0.44, 0, y) * 0.65);
    },
  });
  // the cave mouth at the deep east end, and the 5th-century chapel of the Virgin built in it by Paulus
  const mx = 0.33, mz = 0.0;
  const mouth = put(g, new THREE.SphereGeometry(0.11, 14, 10), M.dark, mx + 0.07, -0.38, mz); mouth.scale.set(0.8, 0.75, 1.3);
  const cg = new THREE.Group(); cg.position.set(mx - 0.06, Y(mx - 0.06, mz) - 0.008, mz); cg.rotation.y = 0.12; g.add(cg);
  B(cg, M.limestone, 0.13, 0.085, 0.014, 0, 0, -0.045); B(cg, M.limestone, 0.13, 0.085, 0.014, 0, 0, 0.045); B(cg, M.limestone, 0.014, 0.085, 0.1, -0.065, 0, 0);
  apse(cg, M.limestone, 0.04, 0.085, 0.065, 0, 0, -Math.PI / 2);
  gable(cg, M.tiles, 0.115, 0.14, 0.03, 0, 0.085, 0, Math.PI / 2);
  B(cg, M.dark, 0.004, 0.045, 0.022, -0.073, 0, 0); for (const s of [-1, 1]) B(cg, M.dark, 0.016, 0.022, 0.004, s * 0.03, 0.045, 0.053);
  // the long stair (about 300 steps) zig-zagging down from the west rim
  const pts = [[-0.72, -0.02], [-0.6, 0.06], [-0.5, -0.04], [-0.36, 0.05], [-0.2, -0.03], [-0.04, 0.04], [0.12, 0.0], [0.22, 0.0]];
  for (let k = 0; k < pts.length - 1; k++) {
    const [x1, z1] = pts[k], [x2, z2] = pts[k + 1], n = 7;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; B(g, M.limestone, 0.028, 0.009, 0.02, x, Y(x, z) + 0.002, z, -Math.atan2(z2 - z1, x2 - x1)); }
  }
  // Cehennem: railing and viewing platform
  B(g, M.wood, 0.1, 0.006, 0.05, 0.63, Y(0.63, -0.39), -0.4);
  for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, x = 0.63 + Math.cos(a) * 0.17, z = -0.55 + Math.sin(a) * 0.15; if (Math.hypot(x, z) < 0.96) B(g, M.wood, 0.005, 0.03, 0.005, x, Y(x, z), z); }
  // temple of Zeus on the southern rim: polygonal-masonry cella, re-used as a church (apse added at the east)
  const tx = -0.12, tz = 0.56, ty = Y(tx, tz) - 0.008, tg = new THREE.Group(); tg.position.set(tx, ty, tz); tg.rotation.y = 0.12; g.add(tg);
  B(tg, M.limestone, 0.4, 0.015, 0.22, 0, 0, 0);
  B(tg, M.grey, 0.36, 0.15, 0.02, 0, 0.015, -0.09); B(tg, M.grey, 0.36, 0.09, 0.02, 0, 0.015, 0.09); B(tg, M.grey, 0.02, 0.13, 0.2, -0.18, 0.015, 0);
  apse(tg, M.rubble, 0.075, 0.12, 0.18, 0.015, 0, -Math.PI / 2);
  B(tg, M.marble, 0.022, 0.13, 0.03, -0.18, 0.015, 0.11); // the anta carrying the long list of names
  for (let i = 0; i < 4; i++) col(tg, -0.12 + i * 0.07, 0.0, i === 1 ? 0.12 : 0.03, { y: 0.015, r: 0.01, broken: i !== 1 });
  B(tg, M.dark, 0.004, 0.06, 0.035, -0.191, 0.015, -0.02);
  rubble(tg, 0.1, 0.17, 6, 0.2, 0.025, M.grey, 4);
  // saffron crocuses on the rim (Strabo: "the best saffron grows here")
  for (let k = 0; k < 46; k++) { const x = 0.25 + (k % 9) * 0.035 + Math.sin(k * 2.2) * 0.012, z = 0.5 + Math.floor(k / 9) * 0.035 + Math.cos(k * 1.7) * 0.01; if (Math.hypot(x, z) < 0.93) put(g, new THREE.ConeGeometry(0.007, 0.018, 5), M.saffron, x, Y(x, z) + 0.008, z).rotation.x = Math.PI; }
  for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + 0.2, x = -0.12 + Math.cos(a) * 0.6, z = -0.02 + Math.sin(a) * 0.34; if (Math.hypot(x, z) < 0.92) boulder(g, x, Y(x, z) + 0.005, z, 0.028, k + 3); }
  scatter(g, ['olive', 'pine', 'shrub', 'shrub'], 16, [-0.5, -0.2, 0.25, 0.2], Y, 7, 0.9, 1.4, (x, z) => cen(x, z) < 0.6 && pts.every(([px, pz]) => Math.hypot(x - px, z - pz) > 0.06));
  scatter(g, ['shrub', 'olive', 'pine', 'shrub'], 40, [-0.95, -0.95, 0.95, 0.95], Y, 13, 0.7, 1.15, (x, z) => cen(x, z) > 1.2 && ceh(x, z) > 1.5 && !(Math.abs(x - tx) < 0.26 && Math.abs(z - tz) < 0.17) && !(x > 0.2 && z > 0.45));
  for (const [x, z, i] of [[-0.55, 0.01, 0], [-0.3, 0.01, 1], [-0.1, 0.0, 2], [0.2, 0.02, 3], [0.6, -0.4, 4], [0.66, -0.4, 5], [-0.2, 0.45, 1]]) person(g, x, z, Y(x, z) + 0.006, i);
}
