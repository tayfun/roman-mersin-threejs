// The Corycian Cave. North is -z, and this site is viewed from the north (see `view.az` in sites.js) so that the
// cave mouth in Cennet's south wall faces the viewer. Cennet ("Heaven"): a collapsed cavern, a stair zig-zagging
// down its northern talus, the 5th-century chapel in front of the cave mouth. Cehennem ("Hell"): a sheer,
// overhanging shaft to the north. The temple of Zeus, turned church, on the southern rim above the cave.
import * as THREE from 'three';
import { M, B, put, rubble, tree, scatter, person, base, sm, lerp, fbm, ell, apse, boulder, pitSkin, railing } from './kit.js';

export default function cennet(g) {
  const CX = -0.14, CZ = 0.06, HX = 0.52, HZ = -0.5;
  const cen = (x, z) => ell(x, z, CX, CZ, 0.38, 0.48, -0.12) + (fbm(x * 3 + 3, z * 3) - 0.5) * 0.22;
  const ceh = (x, z) => ell(x, z, HX, HZ, 0.2, 0.165, 0.3) + (fbm(x * 6, z * 6) - 0.5) * 0.14;
  const north = (x, z) => sm(-0.12, -0.36, z - CZ); // 1 at the northern (descent) end
  const ground = (x, z) => 0.08 + fbm(x * 2.5, z * 2.5 + 6) * 0.025;
  const floorY = (x, z) => -0.2 - sm(-0.3, 0.42, z - CZ) * 0.22 + fbm(x * 5, z * 5) * 0.025; // falls southward to the cave
  const Y = base(g, {
    dry: 0.6,
    h: (x, z) => {
      const e = cen(x, z), f = ceh(x, z); let y = ground(x, z);
      if (e < 1.0) { const n = north(x, z), w0 = lerp(0.93, 0.3, n); y = Math.min(y, lerp(floorY(x, z), y, sm(w0, 1.0, e) ** lerp(1, 1.4, n))); } // sheer walls, but a talus slope at the north end
      if (f < 1.0) y = Math.min(y, -0.47 + sm(0.9, 1.0, f) * 0.56);
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      const e = cen(x, z), f = ceh(x, z);
      c.lerp(P.rock, 0.3);
      if ((e < 1.2 && e >= 1.0) || (f < 1.25 && f >= 1.0)) c.copy(P.rock).lerp(P.sand, 0.3);
      if (e < 1.0) { c.copy(P.rock).lerp(P.red, 0.25); if (s < 0.9) c.copy(P.grass).multiplyScalar(0.9).lerp(P.earth, north(x, z) * 0.5); }
      if (f < 1.0) c.copy(P.red).multiplyScalar(0.25 + sm(-0.47, 0.05, y) * 0.6);
    },
  });
  // ---- rock walls: stepped pale limestone with rust staining; left open where the talus runs down at the north
  pitSkin(g, cen, CX, CZ, Y, -0.44, { level: 0.985, tiers: 4, step: 0.02, amp: 0.02, seed: 2, mask: (a) => !(a > 3.75 && a < 5.5) });
  pitSkin(g, ceh, HX, HZ, Y, -0.47, { level: 0.99, tiers: 3, step: 0.004, amp: 0.012, seed: 7, overhang: 0.012, material: M.strata }); // Cehennem: red, sheer and undercut
  put(g, new THREE.CircleGeometry(0.2, 24), M.dark, HX, -0.455, HZ).rotation.x = -Math.PI / 2;
  // ---- the cave mouth: a wide low arch in the south wall, with an overhanging lip
  const mx = CX + 0.03, mz = CZ + 0.4, my = floorY(mx, mz) - 0.01;
  const mouth = put(g, new THREE.SphereGeometry(1, 18, 12), M.dark, mx, my, mz + 0.03); mouth.scale.set(0.17, 0.11, 0.09);
  for (let k = 0; k < 9; k++) { const a = Math.PI * (k + 0.5) / 9; boulder(g, mx + Math.cos(a) * 0.18, my + Math.sin(a) * 0.115, mz - 0.01, 0.03 + (k % 3) * 0.008, k + 2, M.karstFlat); }
  for (let k = 0; k < 5; k++) put(g, new THREE.ConeGeometry(0.008, 0.035, 5), M.karstFlat, mx - 0.08 + k * 0.04, my + 0.085 - Math.abs(k - 2) * 0.015, mz - 0.005).rotation.x = Math.PI; // stalactites
  // ---- chapel of the Virgin (built by Paulus, 5th c.) on the floor before the cave: roofless ashlar walls, apse to the east
  const cx = mx - 0.01, cz = mz - 0.17, cy = Y(cx, cz) - 0.008, cg = new THREE.Group(); cg.position.set(cx, cy, cz); cg.rotation.y = 0.1; g.add(cg);
  B(cg, M.limestone, 0.2, 0.1, 0.016, 0, 0, -0.065); B(cg, M.limestone, 0.2, 0.075, 0.016, 0, 0, 0.065); B(cg, M.limestone, 0.016, 0.12, 0.146, -0.1, 0, 0);
  apse(cg, M.limestone, 0.058, 0.11, 0.1, 0, 0, -Math.PI / 2);
  B(cg, M.dark, 0.004, 0.06, 0.03, -0.109, 0, 0); for (const xx of [-0.045, 0.025]) B(cg, M.dark, 0.02, 0.028, 0.004, xx, 0.05, -0.074);
  B(cg, M.paving, 0.19, 0.004, 0.12, 0, 0.001, 0);
  // ---- the stair: switchbacks down the northern talus, then a path across the floor to the chapel door
  const legs = [[-0.02, -0.34], [-0.3, -0.27], [-0.04, -0.2], [-0.28, -0.13], [-0.1, -0.06], [-0.2, 0.04], [cx - 0.14, cz + 0.0]];
  const onPath = (x, z) => legs.some(([px, pz], k) => { if (k === legs.length - 1) return false; const [qx, qz] = legs[k + 1], t = Math.max(0, Math.min(1, ((x - px) * (qx - px) + (z - pz) * (qz - pz)) / ((qx - px) ** 2 + (qz - pz) ** 2))); return Math.hypot(x - px - t * (qx - px), z - pz - t * (qz - pz)) < 0.075; });
  for (let k = 0; k < legs.length - 1; k++) {
    const [x1, z1] = legs[k], [x2, z2] = legs[k + 1], len = Math.hypot(x2 - x1, z2 - z1), n = Math.round(len / 0.024), ry = -Math.atan2(z2 - z1, x2 - x1);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; B(g, M.marble, 0.022, 0.008, 0.05, x, Y(x, z) + 0.003, z, ry); }
    B(g, M.limestone, 0.05, 0.014, 0.06, x2, Y(x2, z2) + 0.002, z2, ry); // landing
  }
  railing(g, [[0.06, -0.42], [0.0, -0.37], [-0.02, -0.34]], Y, 0.02);
  // ---- Cehennem: continuous railing round the lip and a cantilevered viewing deck
  const rail = []; for (let k = 0; k <= 22; k++) { const a = k / 22 * 6.283; let lo = 0, hi = 0.5; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (ceh(HX + Math.cos(a) * m, HZ + Math.sin(a) * m) < 1.12) lo = m; else hi = m; } const x = HX + Math.cos(a) * lo, z = HZ + Math.sin(a) * lo; if (Math.hypot(x, z) < 0.97) rail.push([x, z]); }
  railing(g, rail, Y, 0.022);
  const dk = new THREE.Group(); dk.position.set(HX - 0.19, Y(HX - 0.26, HZ + 0.02), HZ + 0.04); dk.rotation.y = 0.2; g.add(dk);
  B(dk, M.wood, 0.11, 0.006, 0.07, 0.02, 0, 0); for (const s of [-1, 1]) { B(dk, M.wood, 0.11, 0.003, 0.003, 0.02, 0.024, s * 0.034); for (let k = 0; k < 4; k++) B(dk, M.wood, 0.003, 0.024, 0.003, -0.03 + k * 0.033, 0, s * 0.034); } B(dk, M.wood, 0.003, 0.003, 0.07, 0.075, 0.024, 0);
  // ---- temple of Zeus on the southern rim, re-used as a church: polygonal walls of uneven height, apse added at the east
  const tx = CX + 0.06, tz = CZ + 0.66, ty = Y(tx, tz) - 0.008, tg = new THREE.Group(); tg.position.set(tx, ty, tz); tg.rotation.y = 0.1; g.add(tg);
  B(tg, M.limestone, 0.34, 0.014, 0.19, 0, 0, 0);
  [[-0.11, 0.13], [0.0, 0.1], [0.11, 0.115]].forEach(([x, hh]) => B(tg, M.grey, 0.11, hh, 0.02, x, 0.014, 0.078)); // south wall, best preserved
  [[-0.1, 0.06], [0.03, 0.04], [0.12, 0.07]].forEach(([x, hh]) => B(tg, M.grey, 0.1, hh, 0.02, x, 0.014, -0.078));
  B(tg, M.grey, 0.02, 0.11, 0.176, -0.16, 0.014, 0); apse(tg, M.rubble, 0.062, 0.1, 0.16, 0.014, 0, -Math.PI / 2);
  B(tg, M.marble, 0.02, 0.12, 0.028, -0.16, 0.014, -0.1); // the anta carrying the long list of names
  B(tg, M.dark, 0.004, 0.05, 0.03, -0.171, 0.014, 0.02);
  const drum = put(tg, new THREE.CylinderGeometry(0.012, 0.012, 0.04, 10), M.weathered, 0.02, 0.03, 0.0); drum.rotation.z = Math.PI / 2;
  rubble(tg, 0.05, -0.15, 6, 0.2, 0.02, M.grey, 4);
  // ---- saffron crocuses in drifts on the rim (Strabo: "the best saffron grows here")
  for (const [dx, dz, n] of [[0.42, 0.52, 12], [0.6, 0.3, 9], [-0.62, 0.5, 8]]) for (let k = 0; k < n; k++) {
    const x = dx + Math.sin(k * 2.4) * 0.07 * Math.sqrt(k / n), z = dz + Math.cos(k * 2.4) * 0.05 * Math.sqrt(k / n), y = Y(x, z);
    if (Math.hypot(x, z) > 0.93) continue;
    for (let p = 0; p < 3; p++) { const pt = put(g, new THREE.SphereGeometry(0.005, 5, 4), M.saffron, x + Math.cos(p * 2.1) * 0.004, y + 0.007, z + Math.sin(p * 2.1) * 0.004); pt.scale.set(0.7, 1.3, 0.7); }
    put(g, new THREE.SphereGeometry(0.0025, 5, 4), M.orange, x, y + 0.012, z);
  }
  for (let k = 0; k < 14; k++) { const a = k * 0.83 + Math.sin(k) * 0.3, r = 0.62 + (k % 4) * 0.07, x = Math.cos(a) * r, z = Math.sin(a) * r; if (cen(x, z) > 1.15 && ceh(x, z) > 1.3 && Math.hypot(x, z) < 0.93) boulder(g, x, Y(x, z) + 0.004, z, 0.015 + (k % 4) * 0.007, k + 3, M.karstFlat); }
  // ---- a low, dense canopy on the floor (kept off the stair, chapel and cave mouth); maquis on the rim; ledge shrubs
  scatter(g, ['oak', 'shrub', 'olive', 'shrub'], 26, [-0.42, -0.12, 0.16, 0.34], Y, 7, 0.45, 0.7, (x, z) => cen(x, z) < 0.62 && !onPath(x, z) && Math.hypot(x - cx, z - cz) > 0.16 && Math.hypot(x - mx, z - mz) > 0.18);
  scatter(g, ['shrub', 'olive', 'shrub', 'oak'], 30, [-0.95, -0.95, 0.95, 0.95], Y, 13, 0.5, 0.8, (x, z) => cen(x, z) > 1.25 && ceh(x, z) > 1.45 && !(Math.abs(x - tx) < 0.24 && Math.abs(z - tz) < 0.16) && !(z < -0.3 && x > 0.1 && x < 0.5));
  tree(g, 'pine', -0.62, -0.5, 1.1, Y(-0.62, -0.5), 3); tree(g, 'pine', 0.78, 0.12, 1.0, Y(0.78, 0.12), 5);
  for (const [x, z, i] of [[-0.16, -0.29, 0], [-0.17, -0.16, 1], [-0.15, -0.02, 2], [cx - 0.14, cz + 0.02, 3], [HX - 0.2, HZ + 0.04, 4], [HX - 0.16, HZ + 0.06, 5], [tx - 0.2, tz - 0.05, 1], [0.04, -0.4, 0]]) person(g, x, z, Y(x, z) + 0.008, i, 0.9);
}
