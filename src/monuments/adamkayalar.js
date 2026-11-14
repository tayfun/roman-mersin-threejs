// Adamkayalar: the Şeytan Deresi gorge. Nine rock-cut niches with eighteen figures (eleven men, four women,
// two children, an ibex) look out from the cliff, with two eagles on a pediment.
import * as THREE from 'three';
import { M, B, put, tree, scatter, person, base, sm, fbm, cliff, gable, boulder } from './kit.js';

export default function adamkayalar(g) {
  const mid = (x) => 0.12 + 0.1 * Math.sin(x * 2.3 + 0.4); // canyon axis
  const Y = base(g, {
    dry: 0.6,
    h: (x, z) => {
      const d = z - mid(x), n = fbm(x * 3, z * 3 + 2) * 0.05;
      const north = 0.42 + n + sm(-0.2, -1, z) * 0.06, south = 0.1 + n;
      if (d < -0.2) return north;
      if (d > 0.22) return lerpTo(south, -0.28, 1 - sm(0.22, 0.4, d));
      const floor = -0.3 + Math.abs(d) * 0.25 + fbm(x * 8, z * 8) * 0.02;
      return d < 0 ? Math.max(floor, north - sm(-0.2, -0.13, d) * 0.9) : floor;
    },
    tint: (x, z, y, s, c, P) => {
      const d = z - mid(x);
      if (Math.abs(d) < 0.05 && y < -0.22) c.copy(P.sand).multiplyScalar(0.92); // dry stream bed
      else if (y < 0.35 && d < 0.3 && d > -0.22) c.copy(P.rock).lerp(P.red, fbm(x * 6, y * 20) * 0.35);
    },
  });
  function lerpTo(a, b, t) { return a + (b - a) * t; }
  // the carved cliff: a near-vertical face following the canyon bend
  const segs = 5;
  for (let k = 0; k < segs; k++) {
    const x0 = -0.8 + k * 1.6 / segs, x1 = x0 + 1.6 / segs + 0.02, xm = (x0 + x1) / 2;
    const ry = -Math.atan(0.23 * Math.cos(xm * 2.3 + 0.4));
    cliff(g, x0 - xm, x1 - xm, -0.3, 0.44, 0, k + 1, 0.03, M.strata, 0).position.set(xm, 0.07, mid(xm) - 0.17);
    g.children[g.children.length - 1].rotation.y = ry;
  }
  // niches: [x, y, width, kind]
  const niches = [[-0.62, 0.02, 0.15, 'banquet'], [-0.44, 0.06, 0.1, 'soldier'], [-0.3, 0.0, 0.13, 'couple'], [-0.13, 0.08, 0.16, 'banquet2'], [0.05, 0.02, 0.1, 'soldier'],
    [0.19, 0.1, 0.13, 'family'], [0.36, 0.03, 0.1, 'woman'], [0.5, 0.09, 0.12, 'ibex'], [0.66, 0.03, 0.1, 'man']];
  const fig = (grp, x, h, y = 0, w = 0.012) => { put(grp, new THREE.CapsuleGeometry(w, h - w * 2, 3, 8), M.figure, x, y + h / 2 + 0.004, 0.012); put(grp, new THREE.SphereGeometry(w * 0.85, 8, 6), M.figure, x, y + h + w * 0.6, 0.014); };
  niches.forEach(([x, y, w, kind], i) => {
    const z = mid(x) - 0.145, n = new THREE.Group(); n.position.set(x, y, z); n.rotation.y = -Math.atan(0.23 * Math.cos(x * 2.3 + 0.4)); g.add(n);
    const h = kind.startsWith('banquet') ? 0.1 : 0.13;
    B(n, M.dark, w, h, 0.01, 0, 0, -0.006); // recess
    B(n, M.limestone, w + 0.03, 0.012, 0.03, 0, -0.012, 0.004); // sill
    for (const s of [-1, 1]) B(n, M.limestone, 0.014, h, 0.022, s * (w / 2 + 0.007), 0, 0.002); // pilasters
    B(n, M.limestone, w + 0.04, 0.012, 0.028, 0, h, 0.004);
    if (i % 2 === 0) { const p = gable(n, M.limestone, w + 0.04, 0.02, 0.035, 0, h + 0.012, 0.004); p.rotation.y = 0; }
    if (kind === 'banquet' || kind === 'banquet2') {
      B(n, M.figure, w * 0.8, 0.018, 0.016, 0, 0.012, 0.01); // the couch
      const rec = put(n, new THREE.CapsuleGeometry(0.011, w * 0.42, 3, 8), M.figure, -w * 0.05, 0.042, 0.014); rec.rotation.z = Math.PI / 2 - 0.2;
      put(n, new THREE.SphereGeometry(0.01, 8, 6), M.figure, w * 0.24, 0.066, 0.015);
      fig(n, -w * 0.36, 0.06, 0.004, 0.009); if (kind === 'banquet2') { fig(n, w * 0.4, 0.045, 0.004, 0.008); fig(n, -w * 0.2, 0.04, 0.03, 0.007); }
    } else if (kind === 'soldier') {
      fig(n, 0, 0.1); const spear = B(n, M.figure, 0.004, 0.12, 0.004, 0.028, 0.004, 0.014); spear.rotation.z = -0.06;
      put(n, new THREE.CylinderGeometry(0.014, 0.014, 0.004, 10), M.figure, -0.022, 0.06, 0.02).rotation.x = Math.PI / 2; // shield
    } else if (kind === 'couple') { fig(n, -0.028, 0.1); fig(n, 0.028, 0.09, 0, 0.011); }
    else if (kind === 'family') { fig(n, -0.035, 0.1); fig(n, 0.0, 0.092, 0, 0.011); fig(n, 0.036, 0.055, 0, 0.008); }
    else if (kind === 'woman') { fig(n, 0, 0.095, 0, 0.012); }
    else if (kind === 'man') { fig(n, 0, 0.1); }
    else if (kind === 'ibex') {
      fig(n, -0.032, 0.095);
      const ib = new THREE.Group(); ib.position.set(0.022, 0.03, 0.014); n.add(ib);
      B(ib, M.figure, 0.045, 0.02, 0.01, 0, 0, 0); for (const sx of [-0.016, 0.016]) B(ib, M.figure, 0.005, 0.03, 0.006, sx, -0.03, 0);
      B(ib, M.figure, 0.014, 0.014, 0.01, 0.026, 0.016, 0);
      for (const s of [0, 1]) { const horn = put(ib, new THREE.TorusGeometry(0.014, 0.0025, 4, 8, 1.8), M.figure, 0.022, 0.036, 0.002 + s * 0.004); horn.rotation.z = 0.6; }
    }
    if (i === 3) for (const s of [-1, 1]) { // the two Roman eagles on the pediment
      const e = put(n, new THREE.ConeGeometry(0.009, 0.026, 5), M.figure, s * 0.04, h + 0.036, 0.012); e.rotation.z = s * 0.2;
      put(n, new THREE.SphereGeometry(0.006, 6, 5), M.figure, s * 0.04, h + 0.052, 0.014);
    }
  });
  // boulders and scree in the stream bed, oleander and pines
  for (let k = 0; k < 16; k++) { const x = -0.85 + k * 0.11 + Math.sin(k * 3) * 0.03, z = mid(x) + Math.sin(k * 1.9) * 0.05; if (Math.hypot(x, z) < 0.94) boulder(g, x, Y(x, z) + 0.01, z, 0.02 + (k % 3) * 0.012, k); }
  scatter(g, ['shrub', 'shrub', 'olive'], 14, [-0.9, -0.1, 0.9, 0.45], Y, 4, 0.7, 1.1, (x, z) => Math.abs(z - mid(x)) < 0.14 && Math.abs(z - mid(x)) > 0.03);
  scatter(g, ['pine', 'pine', 'shrub', 'olive'], 26, [-0.95, -0.95, 0.95, -0.15], Y, 6, 0.9, 1.4, (x, z) => z - mid(x) < -0.26);
  scatter(g, ['pine', 'shrub', 'olive', 'shrub'], 20, [-0.95, 0.4, 0.95, 0.95], Y, 8, 0.8, 1.2, (x, z) => z - mid(x) > 0.42);
  // the rough path on the south rim, with visitors looking across; one climber on the scree
  for (let k = 0; k < 14; k++) { const x = -0.7 + k * 0.1, z = mid(x) + 0.47; if (Math.hypot(x, z) < 0.93) B(g, M.limestone, 0.04, 0.005, 0.02, x, Y(x, z) + 0.001, z, 0.3 * Math.sin(k)); }
  for (const [x, dz, i] of [[-0.2, 0.45, 0], [-0.15, 0.46, 1], [0.3, 0.44, 2], [0.1, 0.02, 3], [-0.4, 0.0, 4]]) person(g, x, mid(x) + dz, Y(x, mid(x) + dz) + 0.004, i);
}
