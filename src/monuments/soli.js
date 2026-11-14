// Soli-Pompeiopolis: the colonnaded street running south to the Roman-concrete harbour, Soli Höyük beside it.
// North is -z. Most columns stand free; only a few short runs keep their architrave.
import * as THREE from 'three';
import { M, B, put, col, beam, rubble, tree, person, base, sm, lerp, fbm, ell, galley, cyl, house, railing } from './kit.js';

export default function soli(g) {
  const basin = (x, z) => ell(x, z, 0, 0.7, 0.44, 0.23);
  const tell = (x, z) => ell(x, z, -0.6, 0.12, 0.27, 0.22, 0.3);
  const TR = [[-0.62, 0.08, 0.1, 0.08], [-0.52, 0.18, 0.07, 0.06], [-0.7, 0.2, 0.06, 0.07]]; // excavation trenches on the flat top
  const inTrench = (x, z) => TR.some(([tx, tz, w, d]) => Math.abs(x - tx) < w / 2 && Math.abs(z - tz) < d / 2);
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.04 + fbm(x * 2 + 5, z * 2) * 0.018 - sm(0.5, 0.74, z + fbm(x * 3, 1) * 0.06) * 0.17;
      y = lerp(-0.06, y, sm(0.8, 1.08, basin(x, z))); // harbour basin
      const t = tell(x, z); // Soli Höyük: a steep-sided, flat-topped mound
      if (t < 1.2) y = Math.max(y, 0.04 + 0.17 * (1 - sm(0.62, 1.12, t)) + fbm(x * 9, z * 9) * 0.006);
      if (inTrench(x, z)) y -= 0.032; // real pits
      if (t < 1.1 && x > -0.44 && Math.abs(z - 0.1) < 0.035) y = Math.min(y, 0.06 + Math.floor((-0.36 - x) / 0.03 + 4) * 0.028); // a stepped sounding cut down the east flank
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (Math.abs(x) < 0.24 && z < 0.5 && y > 0.01) c.lerp(P.earth, 0.75);
      const t = tell(x, z); if (t < 1.15 && t > 0.5) c.lerp(P.earth, 0.6); if (inTrench(x, z) || (t < 1.1 && x > -0.44 && Math.abs(z - 0.1) < 0.035)) c.copy(P.earth).multiplyScalar(0.8);
      if (z > 0.38 && y > 0 && y < 0.05) c.lerp(P.sand, 0.8); // beach
      if (Math.abs(x - 0.52 - 0.05 * Math.sin(z * 4)) < 0.016 && z < 0.45) c.lerp(P.sand, 0.7); // farm track
      if (basin(x, z) < 1 && y < 0) c.lerp(new THREE.Color(0x4fae9e), 0.35); // greener, shallower harbour water
    },
  });
  const X = 0.15, N = 19, dz = 0.07, z0 = -0.84, H = 0.29, R = 0.0175, gy = 0.047, zm = z0 + (N - 1) * dz / 2, L = N * dz + 0.04;
  // street: paved carriageway with a central drain; raised porticoes; robbed shop walls behind
  B(g, M.paving, 2 * X - 0.05, 0.012, L, 0, gy - 0.008, zm);
  B(g, M.grey, 0.012, 0.014, L, 0, gy - 0.008, zm);
  for (const s of [-1, 1]) {
    B(g, M.limestone, 0.09, 0.022, L, s * (X + 0.02), gy - 0.008, zm);
    const lens = [0.1, 0.16, 0.07, 0.2, 0.12, 0.09, 0.15];
    let z = z0 + 0.03;
    lens.forEach((len, k) => { if ((k + (s > 0 ? 1 : 0)) % 3) B(g, M.rubble, 0.016, 0.02 + (k * 37 % 5) * 0.009, len, s * (X + 0.075), gy, z + len / 2); if (k % 2) B(g, M.rubble, 0.07, 0.018 + (k % 3) * 0.008, 0.014, s * (X + 0.11), gy, z); z += len + 0.035; });
  }
  // which columns stand: west row a long continuous run, east row sparser; a few have lost their capitals
  const west = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0], east = [1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0];
  const capless = new Set(['-1:4', '-1:12', '1:5', '1:13', '-1:17']);
  const yc = gy + 0.014;
  for (const [s, row] of [[-1, west], [1, east]]) {
    for (let i = 0; i < N; i++) {
      const z = z0 + i * dz, up = row[i], bare = capless.has(s + ':' + i), cons = up && (s < 0 ? i % 2 === 0 || i < 9 : i % 2 === 1);
      col(g, s * X, z, up ? (bare ? H * 0.9 : H) : 0.03 + ((i * 7) % 4) * 0.02, { y: yc, r: R, broken: !up || bare, bracket: cons ? -s : 0, seed: i + s });
      if (cons && (i * 5 + (s > 0 ? 2 : 0)) % 6 === 0) { // a bust on its console
        const by = yc + R * 0.7 + (H - R * 3) * 0.56 + R * 0.5, bx = s * X - s * R * 1.35;
        B(g, M.weathered, 0.012, 0.016, 0.01, bx, by, z); put(g, new THREE.SphereGeometry(0.0065, 8, 6), M.weathered, bx, by + 0.022, z);
      }
      if (!up && i % 3 === 0) { // the fallen shaft lies where it toppled, outward from the street, its drums parted
        const n = 2 + (i * 7 + (s > 0 ? 1 : 0)) % 4, fa = ((i * 13) % 9 - 4) * 0.1;
        for (let k = 0; k < n; k++) {
          const dist = X + 0.15 + k * (0.05 + (k * i % 3) * 0.008), px = s * dist, pz = z + Math.sin(fa) * (dist - X) + ((k * 5 + i) % 3 - 1) * 0.008;
          if (Math.hypot(px, pz) > 0.9 || tell(px, pz) < 1.25) continue;
          const d = put(g, new THREE.CylinderGeometry(R * 0.95, R * 0.95, 0.044, 12), M.shaft, px, Y(px, pz) + R * 0.9, pz);
          if (k === n - 1 && i % 2) { d.position.y = Y(px, pz) + 0.022; } else { d.rotation.z = Math.PI / 2; d.rotation.y = fa * s + 0.12 * (k - 1.5); } // the odd drum stands on end
        }
        if (i % 2 === 0) { const c = put(g, new THREE.CylinderGeometry(R * 1.3, R * 0.9, R * 2.2, 10), M.capital, s * (X + 0.15 + n * 0.056), Y(s * (X + 0.3), z) + R, z + Math.sin(fa) * 0.2); c.rotation.z = Math.PI / 2 * s; }
      }
    }
  }
  // surviving architrave: three short runs only, one block slipped onto the paving
  for (const [s, a, b] of [[-1, 0, 2], [-1, 5, 7], [1, 4, 6]]) beam(g, s * X, z0 + a * dz, s * X, z0 + b * dz, yc + H, R * 2.7, 0.022, M.capital);
  const slab = B(g, M.capital, 0.11, 0.022, 0.04, -X + 0.085, gy + 0.004, z0 + 9 * dz, 0.5); slab.rotation.z = 0.12;
  const fallenCap = put(g, new THREE.CylinderGeometry(R * 1.3, R * 0.9, R * 2.2, 10), M.capital, X - 0.06, gy + 0.02, z0 + 7.3 * dz); fallenCap.rotation.set(1.2, 0.4, 0);
  rubble(g, -X - 0.05, z0 + 15 * dz, 4, 0.08, 0.016, M.weathered, 4, Y); rubble(g, X + 0.06, z0 + 10.5 * dz, 5, 0.1, 0.016, M.weathered, 6, Y);
  // landing steps from the street end down to the quay
  for (let k = 0; k < 4; k++) B(g, M.limestone, 0.2 - k * 0.012, 0.012, 0.026, 0, gy - 0.012 - k * 0.012, z0 + L - 0.012 + k * 0.026);
  // harbour: two broad moles springing from the shore and curving in to an entrance; the east one largely lost
  const quayZ = 0.52;
  for (let k = 0; k < 9; k++) { const a = Math.PI * (k + 0.5) / 9, x = Math.cos(a) * 0.44, z = quayZ + 0.065 - Math.sin(a) * 0.065; B(g, M.limestone, 0.105, 0.04, 0.04, x, -0.016, z, a - Math.PI / 2); B(g, M.concrete, 0.105, 0.006, 0.05, x, 0.022, z, a - Math.PI / 2); } // quay rounding the landward end
  const mole = (s, t) => [s * (0.44 + 0.015 * Math.sin(t * 2.4) - 0.3 * sm(0.5, 1, t)), quayZ + 0.06 + t * 0.34 - 0.06 * sm(0.62, 1, t)];
  for (const s of [-1, 1]) {
    const n = 18;
    for (let k = 0; k < n; k++) {
      const [x, z] = mole(s, k / (n - 1)), [x2, z2] = mole(s, (k + 1) / (n - 1)), ry = -Math.atan2(z2 - z, x2 - x), lost = s > 0 && (k > 5 && k < 10 || k === 13 || k === 14);
      if (Math.hypot(x, z) > 0.945) continue;
      if (lost) { if (k % 2) put(g, new THREE.DodecahedronGeometry(0.022, 0), M.concrete, x + 0.01 * Math.sin(k), -0.012, z); continue; } // only tumbled rubble at the waterline
      B(g, M.limestone, 0.05, 0.04, 0.07, x, -0.018, z, ry); B(g, M.concrete, 0.052, 0.006, 0.062, x, 0.022, z, ry);
    }
  }
  { const [lx, lz] = mole(-1, 1); cyl(g, M.limestone, 0.022, 0.028, 0.06, lx, 0.022, lz, 10); } // footing of the harbour light on the west mole head (a reconstruction)
  const ship = galley(M.sail, 0.12); ship.position.set(0.1, 0.0, 0.72); ship.rotation.y = 0.5; g.add(ship);
  const boat = galley(M.white, 0.075); boat.position.set(-0.2, 0.0, 0.66); boat.rotation.y = 0.2; g.add(boat);
  // the mound's excavation: spoil heap, a shade canopy over one trench, a ladder
  put(g, new THREE.ConeGeometry(0.035, 0.03, 8), M.plaster, -0.5, Y(-0.5, 0.05) + 0.012, 0.05);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(g, M.wood, 0.004, 0.05, 0.004, -0.62 + dx * 0.05, Y(-0.62, 0.08) + 0.03, 0.08 + dz * 0.04);
  B(g, M.white, 0.11, 0.003, 0.09, -0.62, Y(-0.62, 0.08) + 0.08, 0.08);
  B(g, M.wood, 0.006, 0.05, 0.003, -0.52, Y(-0.52, 0.18), 0.2).rotation.x = 0.3;
  railing(g, [[-0.32, -0.06], [-0.3, 0.1], [-0.33, 0.26]], Y, 0.018);
  // citrus groves either side (the site lies among orchards); cypress and palm accents; Mezitli's houses at the back
  for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) {
    const x = -0.86 + i * 0.1, z = -0.66 + j * 0.105; if (Math.hypot(x, z) < 0.9 && tell(x, z) > 1.35) tree(g, 'citrus', x, z, 1.25, Y(x, z), i * 7 + j);
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) {
    const x = 0.62 + i * 0.095, z = -0.5 + j * 0.105; if (Math.hypot(x, z) < 0.9) tree(g, 'citrus', x, z, 1.25, Y(x, z), i * 5 + j * 3);
  }
  for (const [x, z] of [[-0.36, -0.86], [0.36, -0.86], [0.5, 0.36], [0.47, -0.2]]) tree(g, 'cypress', x, z, 1.2, Y(x, z), x * 9);
  for (const [x, z] of [[0.42, 0.47], [0.72, 0.36]]) tree(g, 'palm', x, z, 1.1, Y(x, z), z * 5);
  house(g, -0.5, -0.76, Y(-0.5, -0.76) - 0.004, 0.08, 0.09, 0.05, 0.2); house(g, 0.5, -0.78, Y(0.5, -0.78) - 0.004, 0.075, 0.085, 0.048, -0.3);
  rubble(g, 0.0, z0 - 0.045, 6, 0.3, 0.02, M.limestone, 11, Y);
  // scrub and loose blocks so the ground is not bare
  for (let k = 0; k < 22; k++) { const x = -0.9 + ((k * 0.377) % 1) * 1.8, z = -0.3 + ((k * 0.619) % 1) * 0.72; if (Math.hypot(x, z) < 0.9 && Math.abs(x) > 0.3 && tell(x, z) > 1.3 && Y(x, z) > 0.03 && !(x > 0.56 && z < 0.2) && !(x < -0.36 && z < 0.0)) tree(g, k % 3 ? 'shrub' : 'reed', x, z, 0.9, Y(x, z), k); }
  for (const [x, z, i] of [[0.02, -0.62, 0], [-0.03, -0.57, 1], [0.05, -0.1, 2], [0.0, 0.3, 3], [-0.04, 0.34, 4], [-0.6, 0.0, 5], [0.06, 0.5, 1]]) person(g, x, z, Y(x, z) + (Math.abs(x) < 0.12 && z < 0.48 ? 0.008 : 0.002), i);
}
