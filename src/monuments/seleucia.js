// Seleucia ad Calycadnum (Silifke): the temple podium with its single standing column and stork's nest,
// the castle on its long ridge to the west, the Tekir Ambarı cistern between castle and town,
// rock-cut tombs in the ridge's southern scarp, and the seven-arched bridge over the Calycadnus to the north.
// North is -z, as on the map.
import * as THREE from 'three';
import { M, B, put, col, drums, rubble, tree, scatter, person, base, hill, sm, fbm, ell, archWall, house, curtain, stork, cyl, sarcophagus } from './kit.js';

export default function seleucia(g) {
  const rz = (x) => -0.62 + 0.06 * Math.sin(x * 2.4 + 0.5); // river axis
  const CX = -0.5, CZ = 0.08; // castle ridge
  const ridge = (x, z) => ell(x, z, CX, CZ, 0.28, 0.14, -0.12);
  const south = (x, z) => sm(CZ + 0.04, CZ + 0.1, z) * sm(0.25, 0.17, Math.abs(x - CX)); // where the tomb scarp is cut
  const CI = { x: -0.13, z: -0.1, w: 0.22, d: 0.115, depth: 0.1, top: 0.128 };
  const cist = (x, z) => Math.max(Math.abs(x - CI.x) / (CI.w / 2), Math.abs(z - CI.z) / (CI.d / 2));
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      const r = ridge(x, z);
      let y = 0.07 + fbm(x * 2 + 9, z * 2) * 0.02 + hill(x, z, CI.x, CI.z, 0.2, 0.056);
      y += 0.27 * (1 - sm(0.85, 1.55, r)) * sm(0.99, 0.84, Math.hypot(x, z)); // flat-topped ridge that dies out before the rim
      y -= 0.022 * sm(1.0, 1.08, r) * sm(1.22, 1.12, r); // dry moat at the foot of the walls
      y += 0.05 * sm(1.5, 1.44, r) * sm(1.2, 1.36, r) * south(x, z); // a rock step on the south flank
      y -= (1 - sm(0.11, 0.23, Math.abs(z - rz(x)))) * 0.15;
      if (cist(x, z) < 1.02) y = Math.min(y, CI.top - CI.depth);
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      const r = ridge(x, z);
      if (Math.abs(x - 0.3) < 0.02 && z > -0.95 && z < 0.9 && y > 0.02) c.lerp(P.sand, 0.7); // road to the bridge
      if (r < 1.22 && r > 0.98) c.copy(P.rock).lerp(P.earth, 0.3); // moat and the rock under the walls
      else if (r < 1.55 && s > 0.5) c.lerp(P.rock, 0.5);
      if (y > 0 && y < 0.03) c.lerp(P.sand, 0.5);
    },
  });
  // ---- temple of "Jupiter": 8 x 14 peripteros on a 2 m podium; one column stands, the rest are bases, stumps and drums
  const tx = 0.2, tz = 0.28, ty = Y(tx, tz) - 0.012, tg = new THREE.Group(); tg.position.set(tx, ty, tz); tg.rotation.y = 0.08; g.add(tg);
  const W = 0.64, D = 0.36, P0 = 0.11;
  B(tg, M.limestone, W + 0.08, 0.04, D + 0.08, 0, 0, 0); B(tg, M.limestone, W + 0.045, 0.04, D + 0.045, 0, 0.04, 0); B(tg, M.marble, W + 0.015, 0.03, D + 0.015, 0, 0.08, 0);
  for (let k = 0; k < 5; k++) B(tg, M.limestone, 0.028, P0 - k * 0.022, D * 0.62, W / 2 + 0.03 + k * 0.028, 0, 0); // east steps
  for (const [x, z, w, d, hh] of [[-0.04, -0.105, 0.4, 0.02, 0.07], [-0.08, 0.105, 0.3, 0.02, 0.05], [-0.24, 0, 0.02, 0.23, 0.06], [0.1, 0, 0.02, 0.1, 0.045]]) B(tg, M.limestone, w, hh, d, x, P0, z); // cella wall stubs
  const sx = W / 13, sz = D / 7;
  for (let i = 0; i < 14; i++) for (let j = 0; j < 8; j++) {
    if (i > 0 && i < 13 && j > 0 && j < 7) continue;
    const x = -W / 2 + i * sx, z = -D / 2 + j * sz, k = i * 8 + j;
    if (j === 7 && i === 4) { col(tg, x, z, 0.31, { y: P0, r: 0.024 }); stork(tg, x, P0 + 0.315, z); }
    else if (j === 7 && (i === 3 || i === 5 || i === 6)) col(tg, x, z, [0.13, 0.16, 0.09][i === 3 ? 0 : i - 4], { y: P0, r: 0.024, broken: true, seed: i });
    else if (k % 9 === 0) col(tg, x, z, [0.03, 0.075, 0.05, 0.11][(k / 9) % 4], { y: P0, r: 0.024, broken: true, seed: k });
    else if (k % 5 !== 1) B(tg, M.weathered, 0.058, 0.012, 0.058, x, P0, z); // most positions keep only a base
  }
  B(tg, M.capital, 0.11, 0.035, 0.05, -W / 2 + 5.5 * sx, P0, D / 2 - 0.06, 0.3); // a fallen architrave block on the stylobate
  drums(tg, 0.02, 0.32, 5, 0.024, 4, 0); drums(tg, -0.32, 0.3, 3, 0.024, 6, 0); drums(tg, 0.1, -0.03, 2, 0.024, 9, P0);
  rubble(tg, 0.12, 0.0, 6, 0.3, 0.026, M.weathered, 3, () => P0);
  const cg = new THREE.Group(); cg.position.set(-0.2, 0.03, 0.31); cg.rotation.set(1.25, 0.2, 0.3); tg.add(cg); // a fallen Corinthian capital
  put(cg, new THREE.CylinderGeometry(0.03, 0.021, 0.045, 10), M.capital, 0, 0, 0); B(cg, M.capital, 0.066, 0.008, 0.066, 0, 0.022, 0);
  // ---- castle: a long oval enceinte on the ridge, towers of unequal height, two stretches fallen
  const cp = [], NT = 11;
  for (let k = 0; k < NT; k++) { const a = k / NT * 6.283 + 0.2, c = Math.cos(-0.12), s = Math.sin(-0.12), ex = Math.cos(a) * 0.225, ez = Math.sin(a) * 0.085; cp.push([CX + ex * c - ez * s, CZ + ex * s + ez * c]); }
  curtain(g, M.limestone, cp, 0.055, 0.018, { tower: false, Y, skip: [3, 8] });
  cp.forEach(([x, z], k) => {
    const y = Y(x, z) - 0.01, hh = [0.085, 0.07, 0.095, 0.04, 0.08, 0.1, 0.075, 0.09, 0.045, 0.085, 0.07][k];
    if (k % 4 === 1) { B(g, M.limestone, 0.042, hh, 0.042, x, y, z, -0.12); if (hh > 0.06) for (const [sx2, sz2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(g, M.limestone, 0.012, 0.01, 0.012, x + sx2 * 0.015, y + hh, z + sz2 * 0.015, -0.12); }
    else { cyl(g, M.limestone, 0.021, 0.023, hh, x, y, z, 12); if (hh > 0.06) for (let m = 0; m < 5; m++) { const a = m / 5 * 6.283; B(g, M.limestone, 0.012, 0.01, 0.008, x + Math.cos(a) * 0.017, y + hh, z + Math.sin(a) * 0.017, -a + Math.PI / 2); } }
  });
  B(g, M.rubble, 0.1, 0.04, 0.05, CX + 0.02, Y(CX, CZ) - 0.005, CZ, -0.12); B(g, M.rubble, 0.05, 0.03, 0.07, CX - 0.1, Y(CX, CZ) - 0.005, CZ + 0.01, -0.12); // inner ruins
  // ---- rock-cut tombs: the scarp on the ridge's south flank, faced in grey limestone, with dark chamber mouths at two levels
  const face = (x) => { let lo = CZ + 0.1, hi = CZ + 0.4; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (ridge(x, m) < 1.47) lo = m; else hi = m; } return lo; };
  const fp = [], fu = [], fi = [], FN = 28, x0 = CX - 0.2, x1 = CX + 0.2;
  for (let j = 0; j <= 3; j++) for (let i = 0; i <= FN; i++) { const x = x0 + (x1 - x0) * i / FN, z = face(x), yb = Y(x, z + 0.035) - 0.008, yt = yb + 0.07 + fbm(x * 9, 3) * 0.02; fp.push(x, yb + (yt - yb) * j / 3, z + 0.012 - j * 0.008 + (fbm(x * 12, j * 3) - 0.5) * 0.008); fu.push(x * 1.4, j * 0.05); }
  for (let j = 0; j < 3; j++) for (let i = 0; i < FN; i++) { const a = j * (FN + 1) + i; fi.push(a, a + 1, a + FN + 1, a + 1, a + FN + 2, a + FN + 1); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2)); fg.setIndex(fi); fg.computeVertexNormals(); put(g, fg, M.karst);
  for (let k = 0; k < 6; k++) {
    const x = CX - 0.15 + k * 0.06, z = face(x) + 0.013, y = Y(x, z + 0.035) + 0.006 + (k % 2) * 0.022;
    B(g, M.dark, 0.024, 0.03, 0.004, x, y, z); B(g, M.karstFlat, 0.034, 0.006, 0.008, x, y + 0.03, z); // chamber mouth and its lintel
    if (k % 3 === 0) { const arc = put(g, new THREE.TorusGeometry(0.014, 0.004, 4, 8, Math.PI), M.karstFlat, x, y + 0.03, z + 0.001); arc.scale.y = 0.8; }
  }
  sarcophagus(g, CX - 0.06, face(CX - 0.06) + 0.06, Y(CX - 0.06, face(CX - 0.06) + 0.06) - 0.004, 0.75, 1.4, M.karstFlat); sarcophagus(g, CX + 0.1, face(CX + 0.1) + 0.055, Y(CX + 0.1, face(CX + 0.1) + 0.055) - 0.004, 0.7, 1.7, M.karstFlat);
  // ---- Tekir Ambarı: a dry rectangular reservoir cut in the rock and lined in ashlar, niches in its walls, stair on the east
  const fy = CI.top - CI.depth;
  B(g, M.paving, CI.w, 0.006, CI.d, CI.x, fy - 0.002, CI.z);
  for (const [x, z, w, d] of [[0, -CI.d / 2, CI.w + 0.02, 0.012], [0, CI.d / 2, CI.w + 0.02, 0.012], [-CI.w / 2, 0, 0.012, CI.d], [CI.w / 2, 0, 0.012, CI.d]]) {
    B(g, M.limestone, w, CI.depth + 0.008, d, CI.x + x, fy, CI.z + z); B(g, M.weathered, w + 0.012, 0.007, d + 0.014, CI.x + x, fy + CI.depth + 0.008, CI.z + z); // lining and coping
  }
  for (let k = 0; k < 8; k++) { const nx = CI.x - CI.w / 2 + (k + 0.5) * CI.w / 8; B(g, M.dark, 0.014, 0.05, 0.003, nx, fy + 0.02, CI.z - CI.d / 2 + 0.0075); const a = put(g, new THREE.CircleGeometry(0.007, 8, 0, Math.PI), M.dark, nx, fy + 0.07, CI.z - CI.d / 2 + 0.0076); }
  for (let k = 0; k < 5; k++) B(g, M.dark, 0.003, 0.05, 0.012, CI.x - CI.w / 2 + 0.0075, fy + 0.02, CI.z - CI.d / 2 + (k + 0.5) * CI.d / 5);
  for (let k = 0; k < 10; k++) B(g, M.limestone, 0.022, 0.006 + k * 0.0095, 0.0105, CI.x + CI.w / 2 - 0.017, fy, CI.z + CI.d / 2 - 0.012 - k * 0.0105); // the stair down the east wall
  // ---- the bridge (AD 77-78, much rebuilt): seven arches on cutwater piers, the middle span widest, deck humped
  const bx = 0.3, bz = rz(bx), spans = [[-0.228, 0.04], [-0.158, 0.05], [-0.084, 0.058], [0, 0.08], [0.084, 0.058], [0.158, 0.05], [0.228, 0.04]];
  archWall(g, M.limestone, 0.56, 0.1, 0.07, spans.map(([x, w]) => ({ x, w, h: 0.05 + w * 0.5 })), bx, -0.012, bz, Math.PI / 2);
  for (let k = 0; k < 9; k++) { const t = (k - 4) / 4, len = 0.068; B(g, M.paving, 0.062, 0.006, len, bx, 0.086 + 0.01 * (1 - t * t), bz + (k - 4) * 0.066, 0).rotation.x = t * 0.09; }
  for (const s of [-1, 1]) for (let k = 0; k < 9; k++) { const t = (k - 4) / 4; B(g, M.limestone, 0.005, 0.011, 0.068, bx + s * 0.033, 0.09 + 0.01 * (1 - t * t), bz + (k - 4) * 0.066).rotation.x = t * 0.09; }
  for (const k of [-0.193, -0.121, -0.046, 0.046, 0.121, 0.193]) for (const s of [-1, 1]) { const cw = put(g, new THREE.CylinderGeometry(0.016, 0.018, 0.06, 3), M.limestone, bx + s * 0.046, 0.018, bz + k); cw.rotation.y = s > 0 ? 0 : Math.PI; }
  // ---- Silifke crowds round the ruin: a tight block east of the temple, a cluster at the north bridgehead
  const hs = [[0.62, -0.2], [0.72, -0.08], [0.6, -0.02], [0.75, 0.1], [0.62, 0.14], [0.8, -0.24], [0.66, -0.34], [0.84, 0.0], [0.72, 0.26],
    [0.74, 0.5], [0.62, 0.62], [0.82, 0.3], [-0.3, 0.82], [-0.52, 0.66], [0.42, -0.88], [0.52, -0.82], [0.18, -0.88], [0.1, -0.8], [0.3, -0.92]];
  hs.forEach(([x, z], k) => { if (Math.hypot(x, z) < 0.92) house(g, x, z, Y(x, z) - 0.005, 0.06 + (k % 3) * 0.01, 0.065 + (k % 2) * 0.015, k % 6 === 2 ? 0.075 : 0.042 + (k % 4) * 0.009, (k % 5) * 0.35 - 0.6); });
  // ---- reeds on the banks; cypresses as framing; pines and scrub on the ridge's flanks (kept off the tombs)
  for (let k = 0; k < 16; k++) { const x = -0.9 + k * 0.118, z = rz(x) + (k % 2 ? 0.2 : -0.19); if (Math.abs(x - bx) > 0.08 && Math.hypot(x, z) < 0.93) tree(g, 'reed', x, z, 1.2, Y(x, z), k); }
  for (const [x, z] of [[0.86, 0.4], [-0.86, -0.3], [-0.78, -0.4], [0.9, -0.36]]) tree(g, 'cypress', x, z, 1.1, Y(x, z), x * 5);
  scatter(g, ['olive', 'pine', 'shrub'], 12, [-0.95, -0.5, 0.95, 0.95], Y, 31, 0.75, 1.1, (x, z) => !(Math.abs(x - tx) < 0.5 && z > -0.02 && z < 0.72) && cist(x, z) > 1.7 && ridge(x, z) > 1.75 && Y(x, z) > 0.05 && Math.abs(x - 0.3) > 0.06 && !hs.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 0.09) && !(Math.abs(x - CX) < 0.26 && z > CZ));
  scatter(g, ['pine', 'shrub', 'oak', 'shrub'], 16, [-0.92, -0.2, -0.1, 0.34], Y, 12, 0.6, 0.95, (x, z) => ridge(x, z) > 1.25 && ridge(x, z) < 1.8 && south(x, z) < 0.05 && cist(x, z) > 1.5);
  for (const [x, z, i] of [[0.3, 0.02, 3], [0.0, 0.56, 4], [0.07, 0.6, 1], [CI.x + 0.15, CI.z + 0.03, 5], [CX, CZ + 0.02, 3], [CX + 0.02, face(CX + 0.02) + 0.07, 0]]) person(g, x, z, Y(x, z) + 0.003, i);
  person(g, bx, bz - 0.05, 0.1, 0); person(g, bx, bz + 0.12, 0.096, 2);
}
