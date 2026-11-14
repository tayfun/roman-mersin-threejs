// Adamkayalar: the Şeytan Deresi gorge. Nine niches cut into the grey limestone cliff hold eighteen figures in
// relief — eleven men, four women, two children and an ibex — with two eagles on a pediment.
import * as THREE from 'three';
import { M, B, put, tree, scatter, person, base, sm, lerp, fbm, boulder } from './kit.js';

export default function adamkayalar(g) {
  const mid = (x) => 0.12 + 0.1 * Math.sin(x * 2.3 + 0.4); // canyon axis
  const FACE = -0.17, NORTH = (x) => 0.45 + 0.045 * Math.sin(x * 3.1 + 1) + 0.02 * Math.sin(x * 7.3); // the plateau edge rises and falls
  const tilt = (x) => -Math.atan(0.23 * Math.cos(x * 2.3 + 0.4));
  // the nine niches: [x, y, width, height, kind, top]  (top: 0 flat, 1 gable, 2 arched)
  const niches = [[-0.66, 0.1, 0.13, 0.105, 'banquet', 0], [-0.5, 0.17, 0.07, 0.125, 'soldier', 1], [-0.345, 0.085, 0.105, 0.12, 'couple', 2], [-0.165, 0.16, 0.145, 0.115, 'banquet2', 1], [0.005, 0.09, 0.07, 0.125, 'soldier', 0],
    [0.165, 0.175, 0.13, 0.12, 'family', 2], [0.33, 0.1, 0.095, 0.12, 'men', 0], [0.49, 0.18, 0.115, 0.12, 'ibex', 0], [0.655, 0.115, 0.095, 0.12, 'men', 2]];
  const DEPTH = 0.028;
  const dent = (x, y) => { let d = 0; for (const [nx, ny, w, h] of niches) d = Math.max(d, sm(w / 2 + 0.014, w / 2 + 0.002, Math.abs(x - nx)) * sm(ny - 0.014, ny - 0.002, y) * sm(ny + h + 0.014, ny + h + 0.002, y)); return d; };
  const dentNear = (x, y) => { let d = 0; for (const [nx, ny, w, h] of niches) d = Math.max(d, sm(w / 2 + 0.04, w / 2 + 0.008, Math.abs(x - nx)) * sm(ny - 0.04, ny - 0.008, y) * sm(ny + h + 0.05, ny + h + 0.01, y)); return d; };
  const Y = base(g, {
    dry: 0.7,
    h: (x, z) => {
      const d = z - mid(x), n = fbm(x * 3, z * 3 + 2) * 0.04;
      const north = NORTH(x) + n * sm(-0.26, -0.4, d) + sm(-0.2, -1, z) * 0.05, south = 0.1 + n;
      if (d < -0.26) return north;
      if (d > 0.22) return lerp(south, -0.28, 1 - sm(0.22, 0.4, d));
      const floor = -0.3 + Math.abs(d) * 0.25 + fbm(x * 8, z * 8) * 0.02;
      return d < 0 ? Math.max(floor, north - sm(-0.26, -0.215, d) * 0.9) : floor; // the plateau edge sits behind the carved face
    },
    tint: (x, z, y, s, c, P) => {
      const d = z - mid(x);
      c.lerp(P.rock, 0.3);
      if (Math.abs(d) < 0.05 && y < -0.22) c.copy(P.sand).multiplyScalar(0.92); // dry stream bed
      else if (y < 0.4 && d < 0.42 && d > -0.27) c.copy(P.rock).lerp(P.sand, 0.2 + fbm(x * 9, z * 9) * 0.3); // bare rock of the gorge sides
    },
  });
  // ---- the cliff: one continuous sheet following the bend of the gorge. The niches are real recesses in it,
  // a natural rock terrace bulges out below them, and fissures break the face between the groups.
  const nx = 220, ny = 60, y0 = -0.31, pos = [], uv = [], idx = [];
  const fissures = [-0.82, -0.29, 0.085, 0.41, 0.8];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    let x = lerp(-0.985, 0.985, i / nx); const top = NORTH(x) + 0.012, y = lerp(y0, top, j / ny), dn = dent(x, y);
    const band = sm(0.04, 0.08, y) * (1 - sm(0.3, 0.36, y)), amp = lerp(0.03, 0.01, band);
    let z = mid(x) + FACE + (fbm(x * 6 + 1, y * 6) - 0.5) * amp * 2 + (fbm(x * 17, y * 9 + 4) - 0.5) * amp * 0.8;
    z -= sm(0.3, top, y) * 0.035 + (y > top - 0.05 ? fbm(x * 11, 3) * 0.03 : 0); // the top breaks back in steps
    z += sm(-0.1, -0.3, y) * 0.05; // foot of the cliff
    z += 0.05 * sm(0.0, 0.05, y) * sm(0.085, 0.065, y) * (0.6 + fbm(x * 7, 9) * 0.8); // the rock terrace people stand on
    for (const fx of fissures) z -= 0.035 * Math.exp(-((x - fx - Math.sin(y * 9) * 0.01) ** 2) / 0.00025) * (1 - dn);
    z = lerp(z, mid(x) + FACE, sm(0.0, 0.25, dentNear(x, y))); // the rock is dressed flat round each niche
    z = lerp(z, mid(x) + FACE - DEPTH, dn);
    z -= sm(0.9, 0.985, Math.abs(x)) * 0.13; // both ends turn back into the hillside
    const r = Math.hypot(x, z); if (r > 0.992) { x *= 0.992 / r; z *= 0.992 / r; }
    pos.push(x, y, z); uv.push(x * 1.15, y * 1.15);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 1, a + 1, a + nx + 2, a + nx + 1); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cg.setIndex(idx); cg.computeVertexNormals();
  put(g, cg, M.karst);
  // ---- figures in relief: a few parts each, flattened against the rock, in a plain pale stone
  const R = M.relief;
  const CYL = new THREE.CylinderGeometry(0.78, 1, 1, 10), SPH = new THREE.SphereGeometry(1, 10, 8), BELL = new THREE.CylinderGeometry(0.5, 1.25, 1, 12);
  const part = (grp, geo, x, y, sx, sy, rz = 0) => { const m = put(grp, geo, R, x, y, 0.006); m.scale.set(sx, sy, sx * 0.5); m.rotation.z = rz; return m; };
  const feet = (grp, x, y, h) => { for (const s of [-1, 1]) B(grp, R, h * 0.07, h * 0.035, 0.008, x + s * h * 0.055, y, 0.006); };
  const man = (grp, x, h, y = 0) => { // a himation wrapped across the body, one arm in its sling
    feet(grp, x, y, h); part(grp, CYL, x, y + h * 0.42, h * 0.13, h * 0.74); part(grp, SPH, x, y + h * 0.75, h * 0.125, h * 0.045); // shoulders
    part(grp, SPH, x, y + h * 0.9, h * 0.078, h * 0.09);
    const fold = B(grp, R, h * 0.045, h * 0.52, 0.004, x - h * 0.01, y + h * 0.32, 0.012); fold.rotation.z = 0.5; B(grp, R, h * 0.25, h * 0.02, 0.004, x, y + h * 0.1, 0.012); // diagonal fold, hem
  };
  const woman = (grp, x, h, y = 0) => { // floor-length flared dress, veil over head and shoulders
    part(grp, BELL, x, y + h * 0.36, h * 0.16, h * 0.72); part(grp, SPH, x, y + h * 0.86, h * 0.07, h * 0.08);
    const veil = put(grp, SPH, R, x, y + h * 0.82, 0.004); veil.scale.set(h * 0.13, h * 0.17, h * 0.035);
  };
  const child = (grp, x, h, y = 0) => { feet(grp, x, y, h); part(grp, CYL, x, y + h * 0.36, h * 0.16, h * 0.62); part(grp, SPH, x, y + h * 0.82, h * 0.13, h * 0.14); };
  const soldier = (grp, x, h) => {
    for (const s of [-1, 1]) part(grp, CYL, x + s * h * 0.06, h * 0.2, h * 0.04, h * 0.4); // bare legs under a short tunic
    part(grp, BELL, x, h * 0.55, h * 0.13, h * 0.34); B(grp, R, h * 0.3, h * 0.07, 0.006, x, h * 0.73, 0.009); part(grp, SPH, x, h * 0.88, h * 0.08, h * 0.09);
    B(grp, R, h * 0.028, h * 0.1, 0.005, x, h * 0.98, 0.007); // helmet crest
    const spear = B(grp, R, 0.0032, h * 1.1, 0.004, x + h * 0.25, 0, 0.008); spear.rotation.z = -0.04;
    const sh = put(grp, new THREE.CylinderGeometry(h * 0.16, h * 0.16, 0.005, 18), R, x - h * 0.2, h * 0.52, 0.012); sh.rotation.x = Math.PI / 2;
  };
  const banquet = (grp, w, kid) => {
    B(grp, R, w * 0.7, 0.01, 0.012, w * 0.06, 0.03, 0.008); for (const s of [-1, 1]) B(grp, R, 0.007, 0.03, 0.01, w * 0.06 + s * w * 0.32, 0, 0.008); // kline with turned legs
    B(grp, R, w * 0.18, 0.012, 0.012, w * 0.31, 0.04, 0.009); // cushion
    part(grp, CYL, -w * 0.02, 0.05, 0.011, w * 0.4, Math.PI / 2); // legs stretched out
    part(grp, CYL, w * 0.21, 0.07, 0.013, 0.056, -0.62); part(grp, SPH, w * 0.26, 0.102, 0.0105, 0.0115); // torso propped on the left elbow
    B(grp, R, 0.012, 0.007, 0.006, w * 0.12, 0.078, 0.011); // cup held out
    woman(grp, -w * 0.38, 0.078, 0.004); // the wife seated at the foot of the couch
    if (kid) child(grp, w * 0.43, 0.05, 0.0); // a child standing by the head of the couch
  };
  const eagle = (grp, x, y, s) => { // an eagle as acroterion: upright body, wings drooping, head turned inward
    const b = put(grp, SPH, R, x, y + 0.014, 0.006); b.scale.set(0.007, 0.014, 0.005);
    for (const d of [-1, 1]) { const wg = put(grp, SPH, R, x + d * 0.009, y + 0.012, 0.005); wg.scale.set(0.0045, 0.013, 0.003); wg.rotation.z = d * 0.35; }
    put(grp, SPH, R, x + s * 0.002, y + 0.03, 0.006).scale.setScalar(0.0045); const bk = put(grp, new THREE.ConeGeometry(0.002, 0.007, 4), R, x + s * 0.007, y + 0.03, 0.006); bk.rotation.z = -s * Math.PI / 2;
  };
  niches.forEach(([x, y, w, h, kind, top]) => {
    const n = new THREE.Group(); n.position.set(x, y, mid(x) + FACE - DEPTH + 0.004); n.rotation.y = tilt(x); g.add(n);
    B(n, M.karstDark, w + 0.006, h + 0.006, 0.003, 0, -0.003, 0); // shadowed back of the recess
    const lip = 0.006, out = DEPTH - 0.006; // a thin dressed margin, flush with the rock surface
    for (const s of [-1, 1]) B(n, M.karstFlat, lip, h + lip, 0.003, s * (w / 2 + lip / 2), 0, out);
    B(n, M.karstFlat, w + lip * 2, lip, 0.003, 0, -lip, out); B(n, M.karstFlat, w + lip * 2, lip, 0.003, 0, h, out);
    if (top === 1) { const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.012, 0); sh.lineTo(w / 2 + 0.012, 0); sh.lineTo(0, 0.03); sh.closePath(); put(n, new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }), M.karstFlat, 0, h + lip, out - 0.003); }
    if (top === 2) { const arc = put(n, new THREE.TorusGeometry(w / 2, 0.005, 5, 14, Math.PI), M.karstFlat, 0, h, out); arc.scale.y = 0.3; }
    if (kind === 'banquet') banquet(n, w, false);
    else if (kind === 'banquet2') { banquet(n, w, true); for (const s of [-1, 1]) { const eg = new THREE.Group(); eg.position.set(s * (w / 2 + 0.002), h + lip + 0.004, out); eg.scale.setScalar(1.6); n.add(eg); eagle(eg, 0, 0, -s); } }
    else if (kind === 'soldier') soldier(n, -0.005, h * 0.8);
    else if (kind === 'couple') { man(n, -0.026, h * 0.86); woman(n, 0.027, h * 0.76); }
    else if (kind === 'family') { man(n, -0.04, h * 0.86); woman(n, 0.006, h * 0.76); child(n, 0.045, h * 0.44); }
    else if (kind === 'men') { man(n, -0.023, h * 0.86); man(n, 0.024, h * 0.8); }
    else if (kind === 'ibex') {
      man(n, -0.032, h * 0.86);
      const ib = new THREE.Group(); ib.position.set(0.025, 0.036, 0.008); n.add(ib);
      const body = put(ib, SPH, R, 0, 0, 0); body.scale.set(0.024, 0.011, 0.006); for (const sx of [-0.015, -0.007, 0.01, 0.017]) B(ib, R, 0.004, 0.032, 0.004, sx, -0.036, 0);
      const neck = B(ib, R, 0.008, 0.02, 0.005, 0.02, 0.004, 0); neck.rotation.z = -0.5; put(ib, SPH, R, 0.029, 0.022, 0).scale.set(0.008, 0.006, 0.004);
      for (const s of [0, 1]) { const horn = put(ib, new THREE.TorusGeometry(0.014, 0.002, 4, 10, 2.0), R, 0.02, 0.03, 0.001 + s * 0.003); horn.rotation.z = 0.5; }
    }
  });
  // ---- visitors on the rock terrace below the reliefs (the figures are about life-size)
  for (const [x, i] of [[-0.42, 0], [0.25, 3], [0.58, 4]]) person(g, x, mid(x) + FACE + 0.035, 0.066, i, 1.25);
  for (const [x, y] of [[-0.86, 0.3], [-0.58, 0.37], [-0.3, 0.4], [0.085, 0.38], [0.41, 0.36], [0.8, 0.3], [-0.4, -0.08], [0.2, -0.1], [0.6, -0.06]]) { // caper bushes hanging from cracks
    const z = mid(x) + FACE + 0.006; for (let k = 0; k < 3; k++) put(g, new THREE.IcosahedronGeometry(0.014 - k * 0.003, 0), M.shrub, x + (k - 1) * 0.012, y - k * 0.014, z + 0.004).scale.set(1.3, 0.8, 0.6);
  }
  // ---- stream bed boulders and oleander; outcrops and scree on the south bank; pines on the plateau; low maquis on the near rim
  for (let k = 0; k < 16; k++) { const x = -0.85 + k * 0.11 + Math.sin(k * 3) * 0.03, z = mid(x) + Math.sin(k * 1.9) * 0.05; if (Math.hypot(x, z) < 0.94) boulder(g, x, Y(x, z) + 0.01, z, 0.02 + (k % 3) * 0.012, k, M.karstFlat); }
  for (let k = 0; k < 22; k++) { const x = -0.88 + k * 0.083, z = mid(x) + 0.2 + (k % 4) * 0.045; if (Math.hypot(x, z) < 0.93) boulder(g, x, Y(x, z) + 0.004, z, 0.016 + (k % 5) * 0.009, k + 20, M.karstFlat); }
  scatter(g, ['shrub', 'reed', 'shrub'], 12, [-0.9, -0.1, 0.9, 0.45], Y, 4, 0.7, 1.0, (x, z) => Math.abs(z - mid(x)) < 0.14 && Math.abs(z - mid(x)) > 0.03);
  scatter(g, ['pine', 'oak', 'shrub', 'olive'], 20, [-0.95, -0.95, 0.95, -0.15], Y, 6, 0.8, 1.2, (x, z) => z - mid(x) < -0.34);
  scatter(g, ['shrub', 'shrub', 'oak'], 16, [-0.95, 0.4, 0.95, 0.95], Y, 8, 0.5, 0.75, (x, z) => z - mid(x) > 0.44 && (Math.abs(x) > 0.62 || z - mid(x) > 0.62));
  for (let k = 0; k < 22; k++) { const x = -0.7 + k * 0.065, z = mid(x) + 0.5 + Math.sin(k) * 0.015; if (Math.hypot(x, z) < 0.93) B(g, M.limestone, 0.022, 0.004, 0.014, x, Y(x, z) + 0.001, z, 0.3 * Math.sin(k)); } // the rough path
  for (const [x, dz, i] of [[-0.2, 0.47, 1], [-0.15, 0.48, 2], [0.3, 0.46, 5], [0.1, 0.02, 3]]) person(g, x, mid(x) + dz, Y(x, mid(x) + dz) + 0.004, i);
}
