// Soli-Pompeiopolis: the colonnaded street running south to the Roman-concrete harbour; Soli Höyük beside it.
import * as THREE from 'three';
import { M, B, put, col, beam, drums, rubble, tree, scatter, person, base, hill, sm, fbm, ell, galley, cyl } from './kit.js';

export default function soli(g) {
  const basin = (x, z) => ell(x, z, 0, 0.74, 0.3, 0.17);
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.035 + fbm(x * 2 + 5, z * 2) * 0.02 - sm(0.52, 0.78, z + fbm(x * 3, 1) * 0.08) * 0.16;
      y += hill(x, z, 0.62, -0.2, 0.2, 0.17); // Soli Höyük
      y = Math.min(y, -0.05 + sm(0.85, 1.05, basin(x, z)) * 0.1); // harbour basin
      return y;
    },
    tint: (x, z, y, s, c, P) => { if (Math.abs(x) < 0.2 && z < 0.5 && y > 0.01) c.lerp(P.earth, 0.7); },
  });
  const X = 0.115, N = 17, dz = 0.082, z0 = -0.86, H = 0.4, gy = 0.045;
  // street: paved carriageway with a central drain, raised porticoes either side
  B(g, M.paving, 0.19, 0.012, N * dz + 0.06, 0, gy - 0.008, z0 + (N - 1) * dz / 2);
  B(g, M.grey, 0.014, 0.014, N * dz + 0.06, 0, gy - 0.008, z0 + (N - 1) * dz / 2);
  for (const s of [-1, 1]) {
    B(g, M.limestone, 0.1, 0.022, N * dz + 0.06, s * (X + 0.035), gy - 0.008, z0 + (N - 1) * dz / 2); // stylobate + portico floor
    // shop walls behind the portico, mostly robbed out
    for (let k = 0; k < 6; k++) B(g, M.rubble, 0.02, 0.03 + (k * 37 % 5) * 0.012, 0.13, s * (X + 0.1), gy, z0 + 0.1 + k * 0.22 + (s > 0 ? 0.06 : 0));
    for (let k = 0; k < 5; k++) B(g, M.rubble, 0.09, 0.025 + (k % 3) * 0.012, 0.016, s * (X + 0.145), gy, z0 + 0.2 + k * 0.26);
  }
  // colonnades: which columns still stand (the northern and middle stretches survive best)
  const west = [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1], east = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0];
  for (const [s, row] of [[-1, west], [1, east]]) {
    for (let i = 0; i < N; i++) {
      const z = z0 + i * dz, up = row[i];
      col(g, s * X, z, up ? H : 0.05 + ((i * 7) % 4) * 0.035, { y: gy + 0.012, r: 0.02, broken: !up, bracket: up && i % 2 === 0 ? -s : 0, seed: i + s });
      if (up && row[i + 1]) beam(g, s * X, z, s * X, z + dz, gy + 0.012 + H, 0.05, 0.036);
    }
  }
  drums(g, -0.02, -0.33, 4, 0.02, 3, gy); drums(g, 0.03, 0.2, 5, 0.02, 5, gy); drums(g, -0.3, 0.1, 3, 0.02, 8, Y(-0.3, 0.1));
  rubble(g, 0.0, 0.42, 9, 0.3, 0.035, M.marble, 4, Y); rubble(g, 0.28, -0.5, 6, 0.2, 0.03, M.limestone, 6, Y);
  // harbour: two curved moles of Roman concrete and a quay
  for (const s of [-1, 1]) {
    const mole = put(g, new THREE.TorusGeometry(0.3, 0.03, 6, 26, Math.PI * 0.42), M.concrete, 0, 0.004, 0.74);
    mole.rotation.x = Math.PI / 2; mole.rotation.z = s > 0 ? -Math.PI * 0.03 : Math.PI * 0.61; mole.scale.set(1, 0.6, 0.5);
    cyl(g, M.concrete, 0.035, 0.04, 0.05, s * 0.075, -0.01, 0.905, 10); // mole heads
  }
  B(g, M.concrete, 0.44, 0.03, 0.03, 0, 0.0, 0.565);
  const ship = galley(M.sail, 0.16); ship.position.set(0.02, 0.0, 0.76); ship.rotation.y = 0.5; g.add(ship);
  const boat = galley(M.white, 0.1); boat.position.set(-0.55, 0.0, 0.84); boat.rotation.y = -0.4; g.add(boat);
  // the mound, with excavation trenches cut into its top
  for (const [x, z, w, d] of [[0.6, -0.22, 0.09, 0.07], [0.68, -0.14, 0.06, 0.06], [0.54, -0.13, 0.05, 0.08]]) {
    B(g, M.dark, w, 0.004, d, x, Y(x, z) - 0.002, z, 0.3);
    B(g, M.rubble, w + 0.012, 0.012, 0.008, x, Y(x, z) - 0.004, z - d / 2, 0.3);
  }
  // citrus groves west of the street (the site lies among orchards), a few cypresses and palms by the shore
  for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) {
    const x = -0.82 + i * 0.1, z = -0.5 + j * 0.11; if (Math.hypot(x, z) < 0.9) tree(g, 'citrus', x, z, 1.1, Y(x, z), i * 7 + j);
  }
  for (const [x, z] of [[-0.34, -0.74], [-0.3, -0.62], [0.33, -0.8], [0.36, 0.3], [0.86, -0.1]]) tree(g, 'cypress', x, z, 1, Y(x, z), x * 9);
  for (const [x, z] of [[-0.42, 0.42], [0.45, 0.47], [0.7, 0.38]]) tree(g, 'palm', x, z, 1, Y(x, z), z * 5);
  scatter(g, ['olive', 'shrub'], 14, [0.25, -0.7, 0.95, 0.4], Y, 12, 0.7, 1.1, (x, z) => Y(x, z) > 0.03 && Math.hypot(x - 0.62, z + 0.2) > 0.16);
  for (const [x, z, i] of [[0.02, -0.6, 0], [-0.04, -0.55, 1], [0.05, -0.1, 2], [0.0, 0.32, 3], [-0.03, 0.36, 4], [0.62, -0.19, 5]]) person(g, x, z, Y(x, z) + (Math.abs(x) < 0.1 ? 0.008 : 0), i);
}
