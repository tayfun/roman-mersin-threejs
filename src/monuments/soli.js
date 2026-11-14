// Soli-Pompeiopolis: the colonnaded street running south to the Roman-concrete harbour, Soli Höyük beside it.
// North is -z. Most columns stand free; only a few short runs keep their architrave.
import * as THREE from 'three';
import { M, B, put, col, beam, rubble, tree, person, base, sm, lerp, fbm, ell, galley, cyl, house, railing } from './kit.js';

export default function soli(g) {
  const basin = (x, z) => ell(x, z, 0, 0.7, 0.3, 0.2);
  const tell = (x, z) => ell(x, z, -0.56, 0.2, 0.2, 0.17, 0.3);
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.04 + fbm(x * 2 + 5, z * 2) * 0.018 - sm(0.5, 0.74, z + fbm(x * 3, 1) * 0.06) * 0.17;
      y = lerp(-0.06, y, sm(0.8, 1.08, basin(x, z))); // harbour basin
      const t = tell(x, z); // Soli Höyük: a steep-sided, flat-topped mound
      if (t < 1.2) y = Math.max(y, 0.04 + 0.14 * (1 - sm(0.55, 1.15, t)) + fbm(x * 9, z * 9) * 0.008);
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (Math.abs(x) < 0.24 && z < 0.5 && y > 0.01) c.lerp(P.earth, 0.75);
      const t = tell(x, z); if (t < 1.15 && t > 0.5) c.lerp(P.earth, 0.6);
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
      if (!up && i % 3 === 0) { // the fallen shaft lies where it toppled, outward from the street
        for (let k = 0; k < 4; k++) { const d = put(g, new THREE.CylinderGeometry(R * 0.95, R * 0.95, 0.045, 12), M.weathered, s * (X + 0.16 + k * 0.052), Y(s * (X + 0.2), z) + R * 0.9, z + (k % 2) * 0.008 - 0.004); d.rotation.z = Math.PI / 2; d.rotation.y = 0.1 * (k - 1.5); }
      }
    }
  }
  // surviving architrave: three short runs only, one block slipped onto the paving
  for (const [s, a, b] of [[-1, 0, 2], [-1, 5, 7], [1, 4, 6]]) beam(g, s * X, z0 + a * dz, s * X, z0 + b * dz, yc + H, R * 2.7, 0.022, M.capital);
  const slab = B(g, M.capital, 0.11, 0.022, 0.04, -X + 0.085, gy + 0.004, z0 + 9 * dz, 0.5); slab.rotation.z = 0.12;
  const fallenCap = put(g, new THREE.CylinderGeometry(R * 1.3, R * 0.9, R * 2.2, 10), M.capital, X - 0.06, gy + 0.02, z0 + 7.3 * dz); fallenCap.rotation.set(1.2, 0.4, 0);
  rubble(g, -X - 0.05, z0 + 15 * dz, 4, 0.08, 0.016, M.weathered, 4, Y); rubble(g, X + 0.06, z0 + 10.5 * dz, 5, 0.1, 0.016, M.weathered, 6, Y);
  // landing steps from the street end down to the quay
  for (let k = 0; k < 4; k++) B(g, M.limestone, 0.32 - k * 0.02, 0.012, 0.03, 0, gy - 0.012 - k * 0.012, z0 + L - 0.01 + k * 0.03);
  // harbour: two broad moles springing from the shore and curving in to an entrance; the east one largely lost
  const quayZ = 0.53;
  B(g, M.limestone, 0.62, 0.035, 0.035, 0, -0.012, quayZ); B(g, M.concrete, 0.62, 0.006, 0.05, 0, 0.022, quayZ);
  for (const s of [-1, 1]) {
    const n = 11;
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1), a = t * 1.9, x = s * (0.29 + 0.02 * Math.sin(a) - 0.2 * sm(0.45, 1, t)), z = quayZ + 0.02 + t * 0.36 - 0.05 * sm(0.6, 1, t);
      const t2 = (k + 1) / (n - 1), x2 = s * (0.29 + 0.02 * Math.sin(t2 * 1.9) - 0.2 * sm(0.45, 1, t2)), z2 = quayZ + 0.02 + t2 * 0.36 - 0.05 * sm(0.6, 1, t2);
      const lost = s > 0 && (k === 4 || k === 5 || k === 8), ry = -Math.atan2(z2 - z, x2 - x);
      if (Math.hypot(x, z) > 0.94) continue;
      B(g, M.limestone, 0.05, lost ? 0.012 : 0.04, 0.056, x, lost ? -0.03 : -0.018, z, ry);
      if (!lost) B(g, M.concrete, 0.052, 0.006, 0.05, x, 0.022, z, ry);
    }
  }
  cyl(g, M.limestone, 0.022, 0.028, 0.07, -0.085, 0.022, 0.86, 10); cyl(g, M.capital, 0.014, 0.018, 0.02, -0.085, 0.092, 0.86, 8); // lighthouse stub on the west mole head
  const ship = galley(M.sail, 0.11); ship.position.set(0.06, 0.0, 0.7); ship.rotation.y = 1.2; g.add(ship);
  const boat = galley(M.white, 0.07); boat.position.set(-0.12, 0.0, 0.64); boat.rotation.y = 0.2; g.add(boat);
  // the mound's excavation: stepped trenches with pale section walls
  for (const [x, z, w, d, r] of [[-0.58, 0.16, 0.1, 0.08, 0.3], [-0.5, 0.25, 0.07, 0.06, 0.3], [-0.66, 0.26, 0.05, 0.07, 0.3]]) {
    const y = Y(x, z);
    B(g, M.dark, w, 0.003, d, x, y - 0.001, z, r);
    for (const [dx, dzz, ww, dd] of [[0, -d / 2, w + 0.012, 0.008], [0, d / 2, w + 0.012, 0.008], [-w / 2, 0, 0.008, d], [w / 2, 0, 0.008, d]]) { const c = Math.cos(-r), sn = Math.sin(-r); B(g, M.plaster, ww, 0.01, dd, x + dx * c - dzz * sn, y - 0.004, z + dx * sn + dzz * c, r); }
  }
  railing(g, [[-0.42, 0.06], [-0.36, 0.2], [-0.4, 0.34]], Y, 0.018);
  // citrus groves either side (the site lies among orchards); cypress and palm accents; Mezitli's houses at the back
  for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) {
    const x = -0.86 + i * 0.1, z = -0.62 + j * 0.105; if (Math.hypot(x, z) < 0.9 && tell(x, z) > 1.5) tree(g, 'citrus', x, z, 1.25, Y(x, z), i * 7 + j);
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) {
    const x = 0.62 + i * 0.095, z = -0.5 + j * 0.105; if (Math.hypot(x, z) < 0.9) tree(g, 'citrus', x, z, 1.25, Y(x, z), i * 5 + j * 3);
  }
  for (const [x, z] of [[-0.42, -0.74], [0.42, -0.72], [0.44, 0.36], [-0.34, 0.44], [0.47, -0.2]]) tree(g, 'cypress', x, z, 1.2, Y(x, z), x * 9);
  for (const [x, z] of [[0.42, 0.47], [0.72, 0.36]]) tree(g, 'palm', x, z, 1.1, Y(x, z), z * 5);
  for (const [x, z, r] of [[-0.24, -0.9, 0], [0.0, -0.94, 0], [0.26, -0.9, 0]]) { B(g, M.plaster, 0.16, 0.07 + Math.abs(x) * 0.08, 0.07, x, Y(x, z) - 0.004, z, r); for (let k = 0; k < 3; k++) B(g, M.dark, 0.022, 0.014, 0.003, x - 0.045 + k * 0.045, Y(x, z) + 0.03, z + 0.036); }
  for (const [x, z, i] of [[0.02, -0.62, 0], [-0.03, -0.57, 1], [0.05, -0.1, 2], [0.0, 0.3, 3], [-0.04, 0.34, 4], [-0.56, 0.2, 5], [0.1, 0.5, 1]]) person(g, x, z, Y(x, z) + (Math.abs(x) < 0.12 && z < 0.48 ? 0.008 : 0.002), i);
}
