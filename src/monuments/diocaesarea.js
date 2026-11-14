// Diocaesarea (Uzuncaburç): Temple of Zeus Olbios, the colonnaded street with its column-gate at the east,
// the Tyche temple at the west end, the three-arched gate to the north-west, the tall tower and the theatre.
import * as THREE from 'three';
import { M, B, put, col, beam, drums, rubble, tree, scatter, person, base, hill, sm, lerp, fbm, archWall, archRing, house, cavea, apse, cyl, sarcophagus } from './kit.js';

export default function diocaesarea(g) {
  const TH = { x: 0.56, z: 0.38, r0: 0.07, r1: 0.24, rows: 9, y: 0.07 }, top = (TH.r1 - TH.r0) * 0.62, TR = -0.6;
  const SZ = -0.1, NG = { x: -0.44, z: -0.58 }, TO = { x: 0.5, z: -0.56 };
  const open = (x, z) => { const dx = x - TH.x, dz = z - TH.z; return dx * Math.sin(TR) + dz * Math.cos(TR) > 0.02; }; // the side the theatre opens to
  const Y = base(g, {
    dry: 0.3,
    h: (x, z) => {
      let y = 0.07 + fbm(x * 2.2 + 3, z * 2.2) * 0.03 + hill(x, z, 0.82, 0.22, 0.26, 0.16) + hill(x, z, -0.75, 0.75, 0.3, 0.06);
      const d = Math.hypot(x - TH.x, z - TH.z);
      if (open(x, z)) { if (d < TH.r1 + 0.14) y = lerp(TH.y - 0.012, y, sm(TH.r1 + 0.02, TH.r1 + 0.14, d)); } // level ground before the orchestra and stage
      else if (d < TH.r1) y = Math.min(y, TH.y - 0.01 + Math.max(0, (d - TH.r0) / (TH.r1 - TH.r0)) * top);
      else if (d < TH.r1 + 0.16) y = Math.min(y, lerp(TH.y + top - 0.01, y, sm(TH.r1, TH.r1 + 0.16, d)));
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (Math.abs(z - SZ) < 0.05 && x > -0.86 && x < 0.9) c.lerp(P.earth, 0.85);
      const t = sm(SZ, NG.z, z), px = lerp(-0.72, NG.x, t); if (z < SZ && z > -0.95 && Math.abs(x - px) < 0.04) c.lerp(P.sand, 0.8); // lane up to the north-west gate
      c.lerp(P.rock, fbm(x * 6 + 2, z * 6) > 0.62 ? 0.5 : 0); // limestone showing through the upland turf
    },
  });
  // ---- colonnaded street: paving, a few columns and many stumps along both kerbs, a small fountain house
  B(g, M.paving, 1.62, 0.008, 0.085, 0.02, Y(0, SZ) - 0.004, SZ);
  for (let i = 0; i < 16; i++) for (const s of [-1, 1]) {
    const x = -0.66 + i * 0.075 + (s > 0 ? 0.03 : 0), z = SZ + s * 0.058, k = i * 2 + (s > 0 ? 1 : 0);
    if (Math.abs(x - 0.5) < 0.06 || k % 3 === 0) continue;
    col(g, x, z, k % 7 === 1 ? 0.17 : 0.02 + (k % 4) * 0.012, { y: Y(x, z) - 0.004, r: 0.01, broken: true, shaft: M.shaftWarm, cap: M.weathered, seed: k });
  }
  const fy = Y(0.12, SZ - 0.13) - 0.006;
  for (const [x, z, w, d, hh] of [[0, -0.045, 0.16, 0.018, 0.085], [-0.08, 0, 0.018, 0.09, 0.07], [0.08, 0, 0.018, 0.09, 0.05]]) B(g, M.limestone, w, hh, d, 0.12 + x, fy, SZ - 0.14 + z);
  B(g, M.limestone, 0.14, 0.022, 0.05, 0.12, fy, SZ - 0.115); B(g, M.karstDark, 0.12, 0.004, 0.035, 0.12, fy + 0.02, SZ - 0.115);
  // ---- Temple of Zeus Olbios: 6 x 12 peripteros in weathered local limestone; shafts stand, few capitals, no roof
  const tx = -0.16, tz = 0.24, ty = Y(tx, tz) - 0.01, tg = new THREE.Group(); tg.position.set(tx, ty, tz); g.add(tg);
  const W = 0.68, D = 0.3, sx = W / 11, sz = D / 5, H = 0.3, R = 0.0135;
  B(tg, M.limestone, W + 0.1, 0.02, D + 0.1, 0, 0, 0); B(tg, M.limestone, W + 0.07, 0.02, D + 0.07, 0, 0.02, 0); B(tg, M.weathered, W + 0.04, 0.02, D + 0.04, 0, 0.04, 0);
  const down = new Set(['0-5', '4-0', '5-0', '11-2', '9-5']), capped = new Set(['2-5', '3-5', '7-5', '1-0', '8-0', '11-4']);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
    if (i > 0 && i < 11 && j > 0 && j < 5) continue;
    const x = -W / 2 + i * sx, z = -D / 2 + j * sz, key = i + '-' + j, up = !down.has(key), cp = capped.has(key);
    col(tg, x, z, up ? (cp ? H : H * (0.8 + ((i * 5 + j * 3) % 4) * 0.045)) : 0.05, { y: 0.06, r: R, broken: !cp, shaft: M.shaftWarm, cap: M.weathered, seed: i + j });
  }
  beam(tg, -W / 2 + 2 * sx, D / 2, -W / 2 + 3 * sx, D / 2, 0.06 + H, 0.036, 0.024, M.weathered);
  // the church built into it: apse at the east end, rubble walls between the columns, west doorway
  apse(tg, M.limestone, 0.09, 0.105, W / 2 - 0.09, 0.06, 0, -Math.PI / 2); B(tg, M.limestone, 0.016, 0.03, 0.07, W / 2 - 0.002, 0.165, 0.03);
  for (const [a, b, j, hh] of [[2, 5, 0, 0.12], [6, 9, 0, 0.08], [3, 6, 5, 0.06]]) B(tg, M.limestone, (b - a) * sx, hh, 0.014, -W / 2 + (a + b) / 2 * sx, 0.06, -D / 2 + j * sz);
  archWall(tg, M.limestone, D * 0.7, 0.13, 0.014, [{ x: 0, w: 0.05, h: 0.09 }], -W / 2 + sx * 0.5, 0.06, 0, Math.PI / 2);
  drums(tg, -0.1, -0.24, 5, R, 3, 0); drums(tg, 0.3, 0.26, 3, R, 8, 0); rubble(tg, 0.36, -0.22, 6, 0.16, 0.022, M.weathered, 5);
  // ---- ceremonial gate at the east end of the street: five tall columns with statue consoles, one stump
  const gx = 0.5, gyy = Y(gx, SZ) - 0.006;
  for (let i = 0; i < 6; i++) { const z = SZ - 0.19 + i * 0.076, up = i !== 3; col(g, gx, z, up ? 0.25 : 0.05, { y: gyy, r: 0.014, broken: !up, bracket: up ? -1 : 0, shaft: M.shaftWarm, seed: i }); }
  beam(g, gx, SZ - 0.19, gx, SZ - 0.114, gyy + 0.25, 0.04, 0.026, M.weathered); beam(g, gx, SZ + 0.114, gx, SZ + 0.19, gyy + 0.25, 0.04, 0.026, M.weathered);
  // ---- Temple of Tyche at the west end: five smooth granite columns under one architrave, on a podium; cella footing behind
  const yx = -0.78, yy = Y(yx, SZ) - 0.008;
  B(g, M.limestone, 0.14, 0.035, 0.34, yx, yy, SZ);
  for (let i = 0; i < 5; i++) col(g, yx + 0.03, SZ - 0.12 + i * 0.06, 0.215, { y: yy + 0.035, r: 0.013, shaft: M.greyGranite, seed: i });
  beam(g, yx + 0.03, SZ - 0.12, yx + 0.03, SZ + 0.12, yy + 0.25, 0.036, 0.026, M.weathered);
  for (const [x, z, w, d] of [[-0.07, -0.1, 0.1, 0.014], [-0.07, 0.1, 0.1, 0.014], [-0.12, 0, 0.014, 0.2]]) B(g, M.limestone, w, 0.05, d, yx + x, Y(yx - 0.07, SZ) - 0.006, SZ + z);
  // ---- the north-west gate: three arches, the middle one larger, cornice, wall stubs stepping away
  const ng = new THREE.Group(); ng.position.set(NG.x, Y(NG.x, NG.z) - 0.008, NG.z); ng.rotation.y = 0.25; g.add(ng);
  archWall(ng, M.limestone, 0.44, 0.27, 0.07, [{ x: -0.14, w: 0.075, h: 0.14 }, { x: 0, w: 0.115, h: 0.2 }, { x: 0.14, w: 0.075, h: 0.14 }], 0, 0, 0);
  for (const s of [-1, 1]) { archRing(ng, M.weathered, 0.115, 0.2, 0.01, 0, 0, s * 0.04, 0, 9); archRing(ng, M.weathered, 0.075, 0.14, 0.01, -0.14, 0, s * 0.04, 0, 7); archRing(ng, M.weathered, 0.075, 0.14, 0.01, 0.14, 0, s * 0.04, 0, 7); }
  B(ng, M.limestone, 0.3, 0.02, 0.09, -0.07, 0.27, 0); B(ng, M.limestone, 0.16, 0.03, 0.07, -0.13, 0.29, 0); // cornice survives on one side only
  for (const s of [-1, 1]) [0.16, 0.1, 0.05].forEach((hh, k) => B(ng, M.limestone, 0.09, hh, 0.04, s * (0.265 + k * 0.09), 0, 0));
  // ---- the "tall tower": a massive Hellenistic keep, five storeys of close-fitting ashlar, parapet broken
  const og = new THREE.Group(); og.position.set(TO.x, Y(TO.x, TO.z) - 0.008, TO.z); og.rotation.y = 0.2; g.add(og);
  const TWd = 0.28, TDp = 0.23, THt = 0.52;
  B(og, M.limestone, TWd + 0.02, 0.03, TDp + 0.02, 0, 0, 0); B(og, M.limestone, TWd, THt, TDp, 0, 0.03, 0);
  for (let k = 1; k < 5; k++) B(og, M.weathered, TWd + 0.008, 0.007, TDp + 0.008, 0, 0.03 + k * THt / 5, 0);
  for (let k = 0; k < 5; k++) { if (k) B(og, M.dark, 0.012, 0.035, 0.004, 0.05 - (k % 2) * 0.1, 0.06 + k * THt / 5, TDp / 2 + 0.001); B(og, M.dark, 0.004, 0.035, 0.012, -TWd / 2 - 0.001, 0.06 + k * THt / 5, 0.04 - (k % 2) * 0.08); }
  B(og, M.dark, 0.04, 0.065, 0.004, 0, 0.03, TDp / 2 + 0.001);
  [[-0.09, -0.075, 0.1, 0.08, 0.07], [0.02, -0.085, 0.12, 0.06, 0.045], [-0.105, 0.03, 0.07, 0.13, 0.04], [0.1, -0.03, 0.08, 0.09, 0.02]].forEach(([x, z, w, d, hh]) => B(og, M.limestone, w, hh, d, x, 0.03 + THt, z)); // parapet broken down from one corner
  rubble(og, 0.05, 0.19, 6, 0.2, 0.026, M.limestone, 7);
  // ---- theatre in its hollow (AD 161-169), opening toward the south-west; footing of the stage building
  cavea(g, { ...TH, arc: Math.PI * 1.02, stairs: 4, ry: TR });
  const sgx = TH.x + Math.sin(TR) * (TH.r0 + 0.07), sgz = TH.z + Math.cos(TR) * (TH.r0 + 0.07);
  B(g, M.limestone, 0.34, 0.05, 0.03, sgx, TH.y - 0.012, sgz, TR); B(g, M.limestone, 0.38, 0.022, 0.05, sgx + Math.sin(TR) * 0.045, TH.y - 0.012, sgz + Math.cos(TR) * 0.045, TR);
  for (const k of [-0.1, -0.03, 0.03, 0.1]) B(g, M.limestone, 0.016, 0.085, 0.032, sgx + Math.cos(TR) * k, TH.y - 0.012, sgz - Math.sin(TR) * k, TR); // door jambs of the stage building
  // ---- the village among the ruins; scrub oak, juniper and cedar of the uplands, kept behind the monuments
  [[-0.52, -0.32, 0.2], [-0.62, -0.4, -0.3], [-0.2, -0.72, 0.1], [0.2, -0.56, 0.3], [0.14, -0.72, -0.1], [0.84, -0.3, 0.4], [-0.72, -0.5, 0.1]].forEach(([x, z, r], k) => house(g, x, z, Y(x, z) - 0.005, 0.065 + (k % 3) * 0.012, 0.075 + (k % 2) * 0.02, 0.042 + (k % 3) * 0.01, r, k % 2 ? M.limestone : M.plaster));
  const wallLine = (pts) => pts.slice(1).forEach(([x2, z2], k) => { const [x1, z1] = pts[k], len = Math.hypot(x2 - x1, z2 - z1); B(g, M.rubble, len, 0.014, 0.012, (x1 + x2) / 2, Y((x1 + x2) / 2, (z1 + z2) / 2) - 0.003, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1)); });
  wallLine([[-0.7, 0.62], [-0.4, 0.7], [-0.1, 0.66], [0.2, 0.74]]); wallLine([[-0.4, 0.7], [-0.44, 0.88]]); wallLine([[-0.1, 0.66], [-0.06, 0.86]]); // dry-stone field walls
  for (const [x, z, r] of [[-0.42, 0.58, 0.3], [0.05, 0.56, 1.2], [0.24, 0.6, 0.5]]) sarcophagus(g, x, z, Y(x, z) - 0.004, 0.9, r);
  drums(g, -0.2, 0.56, 4, R, 14, Y(-0.2, 0.56)); for (const [x, z] of [[-0.56, 0.8], [-0.24, 0.8], [0.08, 0.8], [0.34, 0.84]]) tree(g, 'olive', x, z, 0.9, Y(x, z), x * 9);
  const pt = new THREE.Group(); pt.position.set(-0.6, Y(-0.6, 0.5) - 0.006, 0.5); pt.rotation.y = 0.3; g.add(pt); // Hellenistic tower-tomb with a pyramid roof on the rise to the south
  B(pt, M.limestone, 0.08, 0.012, 0.08, 0, 0, 0); B(pt, M.limestone, 0.066, 0.1, 0.066, 0, 0.012, 0); B(pt, M.weathered, 0.074, 0.008, 0.074, 0, 0.112, 0); put(pt, new THREE.ConeGeometry(0.05, 0.05, 4), M.limestone, 0, 0.145, 0).rotation.y = Math.PI / 4;
  const clear = (x, z) => Math.abs(z - SZ) > 0.12 && !(Math.abs(x - tx) < 0.48 && Math.abs(z - tz) < 0.3) && !(z > 0.36) && Math.hypot(x - TH.x, z - TH.z) > 0.36 && Math.hypot(x - NG.x, z - NG.z) > 0.33 && Math.hypot(x - TO.x, z - TO.z) > 0.3 && Math.hypot(x - yx, z - SZ) > 0.24 && !(Math.abs(x - 0.12) < 0.14 && z < SZ && z > -0.36);
  scatter(g, ['oak', 'cedar', 'oak', 'shrub', 'shrub'], 22, [-0.95, -0.95, 0.95, 0.95], Y, 7, 0.7, 1.05, clear);
  for (const [x, z, i] of [[0.1, SZ, 0], [0.16, SZ + 0.02, 1], [0.44, SZ - 0.02, 2], [-0.2, 0.48, 3], [-0.62, SZ, 4], [NG.x + 0.03, NG.z + 0.1, 5], [TH.x - 0.02, TH.z + 0.02, 2], [TO.x - 0.02, TO.z + 0.16, 0]]) person(g, x, z, Y(x, z) + 0.002, i);
}
