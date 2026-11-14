// Anemurium: a roofless town of grey mortared rubble on the east-facing slope of the cape.
// Theatre (seats on the hill, opening east) and odeon face to face; the great bath with its mosaic palaestra;
// sea wall and beach; and beyond the city wall, a hillside of barrel-vaulted house-tombs.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, hill, sm, lerp, fbm, archWall, archRing, vault, cavea, apse, curtain } from './kit.js';

export default function anemurium(g) {
  const TH = { x: -0.34, z: -0.02, r0: 0.07, r1: 0.26, rows: 9, y: 0.19 }, top = (TH.r1 - TH.r0) * 0.62;
  const shore = (z) => 0.6 + 0.07 * Math.sin(z * 3.1 + 1) + fbm(z * 4, 3) * 0.05;
  const Y = base(g, {
    water: true, dry: 0.8,
    h: (x, z) => {
      let y = 0.035 + sm(0.35, -1.0, x) * 0.27 + fbm(x * 2.4, z * 2.4 + 8) * 0.022;
      y += hill(x, z, 0.1, 0.86, 0.17, 0.21); // the cape: a crag standing clear of the town
      const pd = Math.max(Math.abs(x - 0.3) / 0.17, Math.abs(z - 0.42) / 0.16); if (pd < 1.3) y = lerp(0.062, y, sm(1.0, 1.3, pd)); // level court of the palaestra
      y -= sm(shore(z) - 0.05, shore(z) + 0.2, x) * 0.22;
      const d = Math.hypot(x - TH.x, z - TH.z);
      if (d < TH.r1 + 0.03 && x < TH.x + 0.04) y = Math.min(y, TH.y - 0.01 + Math.max(0, (d - TH.r0) / (TH.r1 - TH.r0)) * top);
      else if (d < TH.r0 + 0.1) y = lerp(TH.y - 0.01, y, sm(TH.r0, TH.r0 + 0.1, d));
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      c.lerp(P.rock, 0.25 + sm(0.04, 0.12, hill(x, z, 0.1, 0.86, 0.17, 0.21)) * 0.6);
      if (Math.abs(x - 0.3 - 0.03 * Math.sin(z * 5)) < 0.026 && z > -0.9 && z < 0.24 && y > 0.02) c.setHex(0xcfc6b2); // the paved main street
      if (x > shore(z) - 0.13 && y > 0) c.lerp(P.sand, sm(shore(z) - 0.13, shore(z) - 0.04, x)); // beach
    },
  });
  // ---- theatre on the slope, opening east toward the odeon and the sea; upper rows robbed
  cavea(g, { ...TH, arc: Math.PI * 1.04, stairs: 4, ry: Math.PI / 2, material: M.limestone });
  for (let k = 0; k < 11; k++) { const a = Math.PI * (0.48 + 1.04 * (k + 0.5) / 11), r = TH.r1 + 0.012; if (k % 3) B(g, M.rubble, 0.06, 0.012 + (k * 7 % 4) * 0.01, 0.03, TH.x + Math.cos(a) * r, TH.y + top - 0.006, TH.z + Math.sin(a) * r, -a + Math.PI / 2); }
  B(g, M.rubble, 0.03, 0.045, 0.34, TH.x + TH.r0 + 0.05, Y(TH.x + TH.r0 + 0.05, TH.z) - 0.006, TH.z); // stage footing
  // ---- odeon / council chamber facing it: small seating inside a tall rubble shell, lower and broken toward the sea
  const ox = 0.0, oz = -0.04, oy = Y(ox, oz) - 0.006, og = new THREE.Group(); og.position.set(ox, oy, oz); g.add(og);
  cavea(og, { r0: 0.045, r1: 0.14, rows: 7, arc: Math.PI, stairs: 3, ry: -Math.PI / 2, material: M.limestone });
  [[0.02, 0.085], [0.09, 0.06], [-0.06, 0.07]].forEach(([z, hh], k) => B(og, M.rubble, 0.022, hh, 0.1 + (k === 0 ? 0.02 : 0), 0.165, 0, -0.1 + k * 0.105)); // east wall, ragged
  [[-0.11, 0.16, 0.1], [0.0, 0.12, 0.12], [0.11, 0.075, 0.1]].forEach(([x, hh, w]) => B(og, M.rubble, w, hh, 0.022, x, 0, -0.17)); [[-0.1, 0.13, 0.12], [0.02, 0.09, 0.12], [0.12, 0.05, 0.08]].forEach(([x, hh, w]) => B(og, M.rubble, w, hh, 0.022, x, 0, 0.17)); // long walls stepping down toward the sea
  archWall(og, M.rubble, 0.34, 0.15, 0.022, [-0.1, 0, 0.1].map((x) => ({ x, w: 0.055, h: 0.1 })), -0.155, 0, 0, Math.PI / 2);
  for (const x of [-0.1, 0, 0.1]) archRing(og, M.brick, 0.055, 0.1, 0.006, x, 0, 0, 0, 7).position.set(-0.168, 0, -x), og.children[og.children.length - 1].rotation.y = Math.PI / 2;
  put(og, new THREE.PlaneGeometry(0.08, 0.08), M.mosaic, -0.08, 0.008, 0).rotation.x = -Math.PI / 2;
  // ---- the great bath: three tall vaulted halls behind an arcaded front, one vault half fallen, an apse; mosaic palaestra
  const bx = 0.0, bz = 0.42, by = 0.054, bg = new THREE.Group(); bg.position.set(bx, by, bz); bg.rotation.y = -Math.PI / 2; g.add(bg); // local -z now faces east
  const HW = 0.115, WH = 0.21;
  [0.26, 0.26, 0.13].forEach((len, k) => vault(bg, M.rubbleDS, HW, len, WH, -HW + k * HW, 0, (0.26 - len) / 2, 0, 0));
  [[-HW, 0.27], [0, 0.24], [HW, 0.2]].forEach(([x, hh]) => B(bg, M.rubble, HW + 0.004, hh, 0.022, x, 0, 0.13)); // back wall, broken to different heights
  for (const z of [-0.07, 0.0, 0.07]) { B(bg, M.dark, 0.004, 0.06, 0.03, HW * 1.5 + 0.001, 0.09, z); archRing(bg, M.brick, 0.03, 0.15, 0.004, 0, 0, 0, 0, 7).position.set(HW * 1.5 + 0.003, 0, z); bg.children[bg.children.length - 1].rotation.y = Math.PI / 2; } // arched windows in the south flank
  archWall(bg, M.rubble, HW * 3 + 0.01, WH + 0.03, 0.024, [-HW, 0, HW].map((x) => ({ x, w: 0.07, h: 0.15 })).concat([-HW, 0, HW].map((x) => ({ x, w: 0.03, h: 0.2, sill: 0.165 }))), 0, 0, -0.13);
  for (const x of [-HW, 0, HW]) archRing(bg, M.brick, 0.07, 0.15, 0.006, x, 0, -0.144, 0, 9);
  [[-HW * 1.1, 0.05, 0.1], [-0.02, 0.025, 0.08], [HW * 0.9, 0.012, 0.07]].forEach(([x, hh, w]) => B(bg, M.rubble, w, hh, 0.024, x, WH + 0.03, -0.13)); // the front survives to uneven heights
  apse(bg, M.rubble, 0.05, 0.14, -HW * 1.5 - 0.01, 0, 0.04, Math.PI / 2);
  rubble(bg, HW, -0.02, 6, 0.1, 0.022, M.rubble, 4);
  const pz = -0.27, py0 = 0.004;
  put(bg, new THREE.PlaneGeometry(0.28, 0.2), M.mosaic, 0.0, py0 + 0.006, pz).rotation.x = -Math.PI / 2;
  for (const [x, z, w, d] of [[0, -0.108, 0.32, 0.014], [-0.155, 0, 0.014, 0.22], [0.155, 0, 0.014, 0.22]]) B(bg, M.rubble, w, 0.04, d, x, 0, pz + z);
  for (let i = 0; i < 7; i++) col(bg, -0.126 + i * 0.042, pz - 0.085, i === 2 || i === 3 || i === 5 ? 0.13 : 0.025, { y: py0, r: 0.009, broken: !(i === 2 || i === 3 || i === 5), shaft: M.weathered });
  for (let i = 0; i < 4; i++) col(bg, -0.126, pz - 0.04 + i * 0.042, i === 1 ? 0.13 : 0.025, { y: py0, r: 0.009, broken: i !== 1, shaft: M.weathered });
  // ---- shore: continuous sea wall with breaches, a small beach bath, an early church
  const sw = []; for (let k = 0; k <= 10; k++) { const z = -0.5 + k * 0.105; sw.push([shore(z) - 0.085, z]); }
  curtain(g, M.rubble, sw, 0.045, 0.02, { closed: false, tower: false, Y, skip: [3, 7], merlons: false });
  vault(g, M.rubbleDS, 0.08, 0.13, 0.08, 0.42, Y(0.42, -0.22) - 0.006, -0.22, Math.PI / 2, 2); vault(g, M.rubbleDS, 0.07, 0.11, 0.07, 0.42, Y(0.42, -0.135) - 0.006, -0.135, Math.PI / 2, 1);
  const cx = 0.4, cz = 0.12, cy = Y(cx, cz) - 0.006;
  apse(g, M.rubble, 0.045, 0.1, cx + 0.07, cy, cz, -Math.PI / 2); B(g, M.rubble, 0.16, 0.06, 0.014, cx - 0.01, cy, cz - 0.047); B(g, M.rubble, 0.16, 0.04, 0.014, cx - 0.01, cy, cz + 0.047);
  // ---- city wall climbing the slope, dividing the living from the dead
  const wp = []; for (let k = 0; k <= 6; k++) wp.push([0.48 - k * 0.22, -0.4 - 0.03 * Math.sin(k * 1.3)]);
  curtain(g, M.rubble, wp, 0.06, 0.02, { closed: false, tower: false, Y, skip: [2], merlons: false });
  wp.forEach(([x, z], k) => B(g, M.rubble, 0.044, [0.085, 0.05, 0.09, 0.035, 0.075, 0.06, 0.08][k], 0.044, x, Y(x, z) - 0.01, z)); // towers broken to different heights
  // ---- necropolis: barrel-vaulted house-tombs, some two-storeyed, some with a walled forecourt
  let n = 0; const placed = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++, n++) {
    const x = -0.82 + i * 0.165 + (j % 2) * 0.08 + Math.sin(n * 3.3) * 0.04, z = -0.53 - j * 0.105 - Math.cos(n * 2.1) * 0.03;
    const w = 0.052 + (n % 3) * 0.01;
    if (Math.hypot(x, z) > 0.92 || x > 0.5 || placed.some(([px, pz, pw]) => Math.hypot(x - px, z - pz) < (w + pw) * 0.95)) continue;
    placed.push([x, z, w]);
    const y = Y(x, z) - 0.01, ry = Math.PI / 2 + 0.5 * Math.sin(n * 1.7), big = n % 4 === 0;
    const t = vault(g, M.rubbleDS, w, w * 1.35, big ? 0.05 : 0.036, x, y, z, ry, 2);
    if (big) vault(t, M.rubbleDS, w * 0.8, w * 1.0, 0.03, 0, 0.05 + w / 2 - 0.006, -w * 0.12, 0, 2); // upper chamber
    if (n % 3 === 1) { B(t, M.rubble, w * 1.3, 0.02, 0.01, 0, 0, w * 1.25); for (const s of [-1, 1]) B(t, M.rubble, 0.01, 0.02, w * 0.6, s * w * 0.65, 0, w * 0.97); } // forecourt
  }
  // ---- citadel on the cape; aqueduct channel contouring the upper slope, on arches where it crosses a gully
  const cp = [[-0.08, 0.78], [0.0, 0.75], [0.1, 0.765], [0.2, 0.75], [0.28, 0.79]]; // medieval curtain on the crag's landward shoulder
  curtain(g, M.rubble, cp, 0.05, 0.018, { closed: false, tower: false, Y });
  for (const k of [1, 3]) { const [x, z] = cp[k], y = Y(x, z) - 0.01; B(g, M.rubble, 0.05, 0.09, 0.05, x, y, z, 0.2); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(g, M.rubble, 0.012, 0.008, 0.012, x + sx * 0.018, y + 0.09, z + sz * 0.018, 0.2); }
  { const ky = Y(0.1, 0.86) - 0.012; B(g, M.rubble, 0.075, 0.14, 0.065, 0.1, ky, 0.86, 0.3); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1]]) B(g, M.rubble, 0.014, 0.01, 0.014, 0.1 + sx * 0.028, ky + 0.14, 0.86 + sz * 0.024, 0.3); B(g, M.dark, 0.012, 0.03, 0.003, 0.092, ky + 0.07, 0.892, 0.3); } // the keep on the summit
  const aq = []; for (let k = 0; k <= 8; k++) aq.push([-0.74 + 0.03 * Math.sin(k), -0.36 + k * 0.1]);
  curtain(g, M.rubble, aq.filter(([x, z]) => Math.hypot(x, z) < 0.92), 0.022, 0.014, { closed: false, tower: false, Y, skip: [4], merlons: false });
  archWall(g, M.rubble, 0.11, 0.05, 0.016, [{ x: -0.025, w: 0.03, h: 0.036 }, { x: 0.025, w: 0.03, h: 0.036 }], -0.725, Y(-0.725, 0.09) - 0.02, 0.09, Math.PI / 2);
  for (let k = 0; k < 11; k++) {
    const x = 0.22 + (k % 2) * 0.15 + Math.sin(k * 2.1) * 0.012, z = -0.34 + Math.floor(k / 2) * 0.1 + (k % 2) * 0.03, w = 0.07 + (k % 3) * 0.012, d = 0.06 + (k % 2) * 0.015, y = Y(x, z) - 0.006, hg = new THREE.Group(); hg.position.set(x, y, z); hg.rotation.y = 0.1 * Math.sin(k); g.add(hg);
    B(hg, M.rubble, w, 0.02 + (k % 4) * 0.01, 0.01, 0, 0, -d / 2); B(hg, M.rubble, w, 0.016 + (k % 3) * 0.008, 0.01, 0, 0, d / 2); B(hg, M.rubble, 0.01, 0.035 - (k % 3) * 0.008, d, -w / 2, 0, 0); B(hg, M.rubble, 0.01, 0.02, d * 0.6, w / 2, 0, -d * 0.2); if (k % 4 === 1) B(hg, M.rubble, 0.01, 0.02, d, 0, 0, 0);
  }
  vault(g, M.rubbleDS, 0.075, 0.12, 0.075, -0.06, Y(-0.06, -0.3) - 0.006, -0.3, Math.PI / 2, 2); vault(g, M.rubbleDS, 0.06, 0.1, 0.06, -0.06, Y(-0.06, -0.225) - 0.006, -0.225, Math.PI / 2, 1);
  rubble(g, 0.22, 0.12, 8, 0.4, 0.02, M.rubble, 5, Y);
  // ---- a bare, scrubby headland: maquis and the odd olive
  scatter(g, ['shrub', 'shrub', 'shrub', 'olive'], 26, [-0.95, -0.4, 0.5, 0.95], Y, 9, 0.6, 0.85, (x, z) => !(x > -0.2 && x < 0.5 && z > 0.58) && Y(x, z) > 0.04 && Math.hypot(x - TH.x, z - TH.z) > 0.33 && Math.hypot(x - ox, z - oz) > 0.24 && !(x > -0.2 && x < 0.5 && z > 0.2 && z < 0.62) && !(x > 0.14 && x < 0.46 && z < 0.2) && Math.hypot(x - cx, z - cz) > 0.13 && Math.abs(x - 0.3) > 0.04);
  for (const [x, z, i] of [[-0.24, -0.02, 0], [-0.2, 0.02, 1], [0.3, 0.44, 2], [0.31, -0.1, 3], [0.26, 0.38, 4], [-0.2, -0.62, 5], [0.56, 0.3, 2], [0.3, -0.5, 1]]) person(g, x, z, Y(x, z) + 0.004, i);
}
