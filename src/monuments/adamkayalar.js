// Adamkayalar: the Şeytan Deresi gorge. Nine niches cut into the grey limestone cliff hold eighteen figures in
// relief — eleven men, four women, two children and an ibex — with two eagles on a pediment.
import * as THREE from 'three';
import { M, B, put, tree, scatter, person, base, sm, lerp, fbm, boulder } from './kit.js';

export default function adamkayalar(g) {
  const mid = (x) => 0.12 + 0.1 * Math.sin(x * 2.3 + 0.4); // canyon axis
  const FACE = -0.17, NORTH = 0.46;
  const Y = base(g, {
    dry: 0.7,
    h: (x, z) => {
      const d = z - mid(x), n = fbm(x * 3, z * 3 + 2) * 0.04;
      const north = NORTH + n + sm(-0.2, -1, z) * 0.05, south = 0.1 + n;
      if (d < -0.26) return north;
      if (d > 0.22) return lerp(south, -0.28, 1 - sm(0.22, 0.4, d));
      const floor = -0.3 + Math.abs(d) * 0.25 + fbm(x * 8, z * 8) * 0.02;
      return d < 0 ? Math.max(floor, north - sm(-0.26, -0.215, d) * 0.9) : floor; // the plateau edge sits behind the carved face
    },
    tint: (x, z, y, s, c, P) => {
      const d = z - mid(x);
      c.lerp(P.rock, 0.3);
      if (Math.abs(d) < 0.05 && y < -0.22) c.copy(P.sand).multiplyScalar(0.92); // dry stream bed
      else if (y < 0.4 && d < 0.3 && d > -0.27) c.copy(P.rock).lerp(P.sand, 0.25);
    },
  });
  // ---- the cliff: one continuous sheet following the bend of the gorge, from stream bed to plateau, clipped to the disc
  const nx = 110, ny = 22, y0 = -0.31, y1 = NORTH + 0.012, pos = [], uv = [], idx = [];
  const inBand = (y) => sm(0.02, 0.07, y) * (1 - sm(0.3, 0.36, y)); // kept smoother where the niches are cut
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    let x = lerp(-0.985, 0.985, i / nx); const y = lerp(y0, y1, j / ny);
    const amp = lerp(0.03, 0.008, inBand(y));
    let z = mid(x) + FACE + (fbm(x * 6 + 1, y * 6) - 0.5) * amp * 2 + (Math.sin(y * 31 + x * 2) * 0.4 + Math.sin(y * 67) * 0.25) * amp * 0.5 - sm(0.25, 0.46, y) * 0.03 + sm(-0.12, -0.3, y) * 0.05;
    const r = Math.hypot(x, z); if (r > 0.992) { x *= 0.992 / r; z *= 0.992 / r; }
    pos.push(x, y, z); uv.push(x * 2.2, y * 2.2);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 1, a + 1, a + nx + 2, a + nx + 1); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cg.setIndex(idx); cg.computeVertexNormals();
  put(g, cg, M.karst);
  // ---- figures in relief: built from a few parts, flattened against the rock, the same stone a shade lighter
  const R = M.relief;
  const part = (grp, geo, x, y, sx, sy, rz = 0) => { const m = put(grp, geo, R, x, y, 0.004); m.scale.set(sx, sy, sx * 0.5); m.rotation.z = rz; return m; };
  const CYL = new THREE.CylinderGeometry(0.8, 1, 1, 10), SPH = new THREE.SphereGeometry(1, 10, 8), BELL = new THREE.CylinderGeometry(0.62, 1.15, 1, 10);
  const man = (grp, x, h, y = 0) => { part(grp, CYL, x, y + h * 0.4, h * 0.14, h * 0.8); part(grp, SPH, x, y + h * 0.74, h * 0.19, h * 0.07); part(grp, SPH, x, y + h * 0.9, h * 0.085, h * 0.095); const arm = B(grp, R, h * 0.2, h * 0.05, 0.004, x + h * 0.02, y + h * 0.55, 0.008); arm.rotation.z = 0.5; };
  const woman = (grp, x, h, y = 0) => { part(grp, BELL, x, y + h * 0.37, h * 0.15, h * 0.74); part(grp, SPH, x, y + h * 0.7, h * 0.16, h * 0.07); part(grp, SPH, x, y + h * 0.87, h * 0.08, h * 0.09); part(grp, SPH, x, y + h * 0.9, h * 0.115, h * 0.1).scale.z = h * 0.04; };
  const soldier = (grp, x, h) => {
    for (const s of [-1, 1]) part(grp, CYL, x + s * h * 0.06, h * 0.2, h * 0.045, h * 0.4); // bare legs under a short tunic
    part(grp, BELL, x, h * 0.56, h * 0.15, h * 0.36); part(grp, SPH, x, h * 0.75, h * 0.18, h * 0.06); part(grp, SPH, x, h * 0.89, h * 0.085, h * 0.09);
    B(grp, R, h * 0.03, h * 0.09, 0.005, x, h * 0.99, 0.005); // helmet crest
    const spear = B(grp, R, 0.0035, h * 1.12, 0.004, x + h * 0.26, 0, 0.006); spear.rotation.z = -0.04;
    const sh = put(grp, new THREE.CylinderGeometry(h * 0.16, h * 0.16, 0.005, 18), R, x - h * 0.2, h * 0.52, 0.01); sh.rotation.x = Math.PI / 2;
  };
  const banquet = (grp, w, child) => {
    B(grp, R, w * 0.74, 0.012, 0.012, w * 0.04, 0.03, 0.006); for (const s of [-1, 1]) B(grp, R, 0.008, 0.03, 0.01, w * 0.04 + s * w * 0.33, 0, 0.006); // kline with turned legs
    B(grp, R, w * 0.2, 0.012, 0.012, w * 0.3, 0.042, 0.007); // cushion
    part(grp, CYL, -w * 0.05, 0.054, 0.012, w * 0.42, Math.PI / 2); // legs stretched out
    part(grp, CYL, w * 0.19, 0.074, 0.014, 0.06, -0.62); part(grp, SPH, w * 0.24, 0.108, 0.011, 0.012); // torso propped on the left elbow, head
    B(grp, R, 0.012, 0.008, 0.006, w * 0.1, 0.082, 0.009); // cup held out
    woman(grp, -w * 0.36, 0.075, 0.03); // the wife seated at the foot of the couch
    if (child) man(grp, -w * 0.12, 0.05, 0.0);
  };
  const eagle = (grp, x, y, s) => { part(grp, SPH, x, y, 0.009, 0.014); for (const d of [-1, 1]) { const wg = B(grp, R, 0.02, 0.008, 0.004, x + d * 0.012, y + 0.004, 0.006); wg.rotation.z = d * 0.6; } part(grp, SPH, x + s * 0.002, y + 0.017, 0.005, 0.005); const bk = put(grp, new THREE.ConeGeometry(0.0025, 0.008, 4), R, x + s * 0.008, y + 0.017, 0.006); bk.rotation.z = -s * Math.PI / 2; };
  // ---- the nine niches: [x, y, width, height, kind, gable]
  const niches = [[-0.66, 0.1, 0.13, 0.115, 'banquet', 0], [-0.5, 0.15, 0.075, 0.14, 'soldier', 1], [-0.345, 0.09, 0.105, 0.135, 'couple', 0], [-0.165, 0.15, 0.14, 0.125, 'banquet2', 1], [0.005, 0.1, 0.075, 0.14, 'soldier', 0],
    [0.165, 0.16, 0.125, 0.135, 'family', 1], [0.33, 0.1, 0.1, 0.135, 'men', 2], [0.49, 0.16, 0.115, 0.135, 'ibex', 0], [0.655, 0.11, 0.1, 0.135, 'men', 1]];
  niches.forEach(([x, y, w, h, kind, top], i) => {
    const n = new THREE.Group(); n.position.set(x, y, mid(x) + FACE + 0.012); n.rotation.y = -Math.atan(0.23 * Math.cos(x * 2.3 + 0.4)); g.add(n);
    B(n, M.karstFlat, w + 0.05, h + 0.05 + (top === 1 ? 0.03 : 0), 0.02, 0, -0.022, -0.012); // dressed panel the niche is cut into
    B(n, M.karstDark, w, h, 0.004, 0, 0, 0.0); // the shadowed back of the recess
    for (const s of [-1, 1]) B(n, M.karstFlat, 0.012, h + 0.004, 0.012, s * (w / 2 + 0.006), 0, 0.002);
    B(n, M.karstFlat, w + 0.03, 0.01, 0.014, 0, -0.01, 0.003); B(n, M.karstFlat, w + 0.03, 0.01, 0.013, 0, h, 0.002);
    if (top === 1) { const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.016, 0); sh.lineTo(w / 2 + 0.016, 0); sh.lineTo(0, 0.032); sh.closePath(); put(n, new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false }), M.karstFlat, 0, h + 0.01, -0.004); }
    if (top === 2) { const arc = put(n, new THREE.TorusGeometry(w / 2, 0.007, 5, 12, Math.PI), M.karstFlat, 0, h - 0.004, 0.004); arc.scale.y = 0.35; }
    if (kind === 'banquet') banquet(n, w, false);
    else if (kind === 'banquet2') { banquet(n, w, true); eagle(n, -0.03, h + 0.021, 1); eagle(n, 0.03, h + 0.021, -1); }
    else if (kind === 'soldier') soldier(n, -0.006, 0.108);
    else if (kind === 'couple') { man(n, -0.026, 0.112); woman(n, 0.027, 0.104); }
    else if (kind === 'family') { man(n, -0.036, 0.112); woman(n, 0.008, 0.104); man(n, 0.044, 0.06); }
    else if (kind === 'men') { man(n, -0.024, 0.112); man(n, 0.025, 0.106); }
    else if (kind === 'ibex') {
      man(n, -0.032, 0.11);
      const ib = new THREE.Group(); ib.position.set(0.025, 0.036, 0.006); n.add(ib);
      part(ib, SPH, 0, 0, 0.024, 0.011); for (const sx of [-0.015, -0.007, 0.01, 0.017]) B(ib, R, 0.004, 0.032, 0.004, sx, -0.036, 0);
      const neck = B(ib, R, 0.008, 0.02, 0.005, 0.02, 0.004, 0); neck.rotation.z = -0.5; part(ib, SPH, 0.029, 0.022, 0.008, 0.006);
      for (const s of [0, 1]) { const horn = put(ib, new THREE.TorusGeometry(0.014, 0.002, 4, 10, 2.0), R, 0.02, 0.03, 0.002 + s * 0.003); horn.rotation.z = 0.5; }
    }
  });
  // ---- a ledge runs below the reliefs; people climb down to stand beside them
  for (let k = 0; k < 13; k++) { const x = -0.72 + k * 0.118, z = mid(x) + FACE + 0.03; B(g, M.karstFlat, 0.125, 0.014, 0.05, x, 0.058 + Math.sin(k * 1.7) * 0.006, z, -Math.atan(0.23 * Math.cos(x * 2.3 + 0.4))); }
  for (const [x, i] of [[-0.42, 0], [0.24, 3], [0.57, 4]]) person(g, x, mid(x) + FACE + 0.04, 0.072, i, 0.95);
  for (const [x, y] of [[-0.82, 0.3], [-0.57, 0.36], [-0.25, 0.33], [0.08, 0.34], [0.41, 0.33], [0.78, 0.25], [-0.4, -0.08], [0.2, -0.1], [0.6, -0.06]]) tree(g, 'shrub', x, mid(x) + FACE + 0.012, 0.8, y, x * 11); // scrub rooted in cracks
  // ---- stream bed boulders and oleander; pines on the plateau; low maquis on the near rim so the reliefs stay in view
  for (let k = 0; k < 16; k++) { const x = -0.85 + k * 0.11 + Math.sin(k * 3) * 0.03, z = mid(x) + Math.sin(k * 1.9) * 0.05; if (Math.hypot(x, z) < 0.94) boulder(g, x, Y(x, z) + 0.01, z, 0.02 + (k % 3) * 0.012, k, M.karstFlat); }
  scatter(g, ['shrub', 'reed', 'shrub'], 12, [-0.9, -0.1, 0.9, 0.45], Y, 4, 0.7, 1.0, (x, z) => Math.abs(z - mid(x)) < 0.14 && Math.abs(z - mid(x)) > 0.03);
  scatter(g, ['pine', 'oak', 'shrub', 'olive'], 20, [-0.95, -0.95, 0.95, -0.15], Y, 6, 0.8, 1.2, (x, z) => z - mid(x) < -0.32);
  scatter(g, ['shrub', 'shrub', 'oak'], 16, [-0.95, 0.4, 0.95, 0.95], Y, 8, 0.5, 0.75, (x, z) => z - mid(x) > 0.44 && (Math.abs(x) > 0.62 || z - mid(x) > 0.62));
  for (let k = 0; k < 22; k++) { const x = -0.7 + k * 0.065, z = mid(x) + 0.5 + Math.sin(k) * 0.015; if (Math.hypot(x, z) < 0.93) B(g, M.limestone, 0.022, 0.004, 0.014, x, Y(x, z) + 0.001, z, 0.3 * Math.sin(k)); } // the rough path
  for (const [x, dz, i] of [[-0.2, 0.47, 1], [-0.15, 0.48, 2], [0.3, 0.46, 5], [0.1, 0.02, 3]]) person(g, x, mid(x) + dz, Y(x, mid(x) + dz) + 0.004, i);
}
