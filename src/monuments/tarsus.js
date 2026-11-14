// Tarsus: the buried city seen through its windows. Hero: Cleopatra's Gate with the road running through it.
// Behind: the basalt street in its excavation pit, the concrete mass of Donuktaş, the bath wall,
// St Paul's well among old houses, the Cydnus with the three-arched bridge and Cleopatra's barge.
import * as THREE from 'three';
import { M, B, put, col, drums, rubble, tree, scatter, person, base, sm, fbm, archWall, archRing, cyl, house, galley, railing } from './kit.js';

export default function tarsus(g) {
  const SA = -0.35, SX = 0.08, SZ = -0.08; // street azimuth and centre
  const along = (x, z) => (x - SX) * Math.sin(SA) + (z - SZ) * Math.cos(SA), across = (x, z) => (x - SX) * Math.cos(SA) - (z - SZ) * Math.sin(SA);
  const TW = 0.15, TL = 0.38, inPit = (x, z, m = 0) => Math.abs(across(x, z)) < TW + m && Math.abs(along(x, z)) < TL + m;
  const RC = (z) => 0.66 + 0.05 * Math.sin(z * 3.2);
  const river = (x, z) => x - RC(z);
  const GX = -0.34, GZ = 0.5, GR = 0.18;
  const town = (x, z) => Math.hypot(x + 0.62, z - 0.05) < 0.3;
  const Y = base(g, {
    water: true, dry: 0.5,
    h: (x, z) => {
      let y = 0.1 + fbm(x * 2 + 1, z * 2) * 0.012;
      y -= (1 - sm(TW + 0.006, TW + 0.03, Math.abs(across(x, z)))) * (1 - sm(TL + 0.006, TL + 0.03, Math.abs(along(x, z)))) * 0.092; // the drop falls under the retaining walls // excavation pit: the Roman level lies well below today's
      y -= (1 - sm(0.07, 0.2, Math.abs(river(x, z)))) * 0.125;
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (inPit(x, z, 0.07) && !inPit(x, z)) c.copy(P.sand).lerp(P.rock, 0.4); // modern paved apron round the pit
      if (inPit(x, z)) c.lerp(P.earth, 0.85);
      const rdx = GX + (z - GZ) * Math.tan(GR) - sm(0.34, 0.0, z) * 0.16; if (Math.abs(x - rdx) < 0.045 && z > 0.02 && y > 0.05) c.lerp(P.sand, 0.85); // the road through the gate, on into the old town
      if (town(x, z)) c.lerp(P.earth, 0.55).lerp(P.rock, 0.25);
      if (y > 0 && y < 0.03) c.lerp(P.sand, 0.6);
    },
  });
  // ---- Cleopatra's Gate: one round arch between thick piers; ashlar below, rubble above, ragged top
  const gg = new THREE.Group(); gg.position.set(GX, Y(GX, GZ) - 0.006, GZ); gg.rotation.y = GR; g.add(gg);
  const GW = 0.42, GH = 0.3, GT = 0.22, OW = 0.19, OH = 0.235;
  archWall(gg, M.limestone, GW, GH, GT, [{ x: 0, w: OW, h: OH }], 0, 0, 0);
  for (const s of [-1, 1]) archRing(gg, M.limestone, OW, OH, 0.012, 0, 0, s * (GT / 2 + 0.004), 0, 11);
  for (const s of [-1, 1]) { B(gg, M.limestone, 0.125, 0.014, GT + 0.02, s * (GW / 2 - 0.058), OH - OW / 2 - 0.014, 0); B(gg, M.limestone, 0.13, 0.03, GT + 0.03, s * (GW / 2 - 0.058), 0, 0); } // imposts, plinths
  [[-0.13, 0.03, 0.17], [0.03, 0.045, 0.2], [0.16, 0.022, 0.1], [-0.04, 0.02, 0.12]].forEach(([x, hh, w], k) => B(gg, M.limestone, w, hh, GT - 0.012 - (k % 2) * 0.03, x, k === 3 ? GH + 0.03 : GH, 0, (k - 1.5) * 0.02)); // eroded upper courses, in low uneven lumps
  for (const s of [-1, 1]) [0.16, 0.09].forEach((hh, k) => B(gg, M.limestone, 0.075, hh, 0.12, s * (GW / 2 + 0.037 + k * 0.075), 0, 0)); // city-wall stubs stepping down
  // ---- the Roman street in its pit: cambered polygonal basalt, drain, stylobates, column bases and stumps
  const st = new THREE.Group(); st.position.set(SX, 0.014, SZ); st.rotation.y = SA; g.add(st);
  B(st, M.basalt, 0.17, 0.012, TL * 2 - 0.02, 0, 0, 0); B(st, M.basalt, 0.1, 0.006, TL * 2 - 0.02, 0, 0.012, 0); B(st, M.grey, 0.016, 0.004, TL * 2 - 0.02, 0, 0.018, 0);
  for (const s of [-1, 1]) {
    B(st, M.limestone, 0.03, 0.02, TL * 2 - 0.02, s * 0.1, 0, 0);
    for (let i = 0; i < 9; i++) {
      const tall = (s < 0 && i === 2) || (s > 0 && i === 6);
      col(st, s * 0.1, -TL + 0.06 + i * 0.09, tall ? 0.11 : 0.018 + (i % 3) * 0.012, { y: 0.02, r: 0.013, broken: true, shaft: M.weathered, cap: M.weathered, seed: i });
    }
    put(st, new THREE.PlaneGeometry(0.028, 0.26), M.mosaic, s * 0.132, 0.004, s * 0.1).rotation.x = -Math.PI / 2; // portico mosaic
    B(st, M.rubble, 0.056, 0.102, TL * 2 + 0.09, s * (TW + 0.017), -0.008, 0); B(st, M.limestone, 0.062, 0.006, TL * 2 + 0.096, s * (TW + 0.017), 0.094, 0); // retaining walls of the excavation, with a kerb
  }
  for (const s of [-1, 1]) { B(st, M.rubble, TW * 2, 0.102, 0.056, 0, -0.008, s * (TL + 0.017)); B(st, M.limestone, TW * 2 + 0.09, 0.006, 0.062, 0, 0.094, s * (TL + 0.017)); }
  const cap = put(st, new THREE.CylinderGeometry(0.02, 0.013, 0.026, 10), M.weathered, 0.06, 0.03, 0.2); cap.rotation.set(1.3, 0.3, 0);
  drums(st, -0.05, -0.2, 3, 0.013, 3, 0.014);
  for (let k = 0; k < 7; k++) B(st, M.limestone, 0.05, 0.008, 0.016, -TW + 0.03, 0.094 - 0.006 - k * 0.012, TL - 0.03 - k * 0.016); // stair down into the pit
  const rim = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]) { const lx = a * (TW + 0.055), lz = b * (TL + 0.055); rim.push([SX + lx * Math.cos(SA) + lz * Math.sin(SA), SZ - lx * Math.sin(SA) + lz * Math.cos(SA)]); }
  for (let k = 0; k < 4; k++) { const [x1, z1] = rim[k], [x2, z2] = rim[k + 1], n = 6; const pts = []; for (let i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n, z1 + (z2 - z1) * i / n]); railing(g, pts, () => 0.112, 0.02, M.dark); }
  // ---- Donuktaş: the stripped concrete core of a giant temple — thick walls in broken stretches, some ashlar facing left at the foot
  const dx = -0.02, dz = -0.66, dy = Y(dx, dz) - 0.01, dg = new THREE.Group(); dg.position.set(dx, dy, dz); dg.rotation.y = 0.1; g.add(dg);
  const run = (x0, x1, z, hh, t = 0.1) => { B(dg, M.concrete, x1 - x0, hh, t, (x0 + x1) / 2, 0, z, 0.012 * Math.sin(x0 * 40)); const n = Math.round((x1 - x0) / 0.05); for (let k = 0; k < n; k++) { const lx = x0 + (k + 0.5) * (x1 - x0) / n, lump = put(dg, new THREE.DodecahedronGeometry(0.03, 0), M.concrete, lx, hh + 0.004, z + Math.sin(k * 2.3) * 0.02); lump.scale.set(1.2, 0.35 + (k % 3) * 0.12, 1.5); lump.rotation.y = k; } }; // eroded, rounded top
  const slump = (x0, dir, z, hh) => [0.75, 0.5, 0.28, 0.12].forEach((f, k) => B(dg, M.concrete, 0.035, hh * f, 0.1 - k * 0.012, x0 + dir * (k + 0.5) * 0.035, 0, z)); // a collapse stepping down to rubble
  run(-0.42, 0.36, -0.14, 0.2); // north wall: one long level mass
  run(-0.42, -0.02, 0.14, 0.2); slump(-0.02, 1, 0.14, 0.2); slump(0.2, -1, 0.14, 0.19); run(0.2, 0.36, 0.14, 0.19); // south wall with a wide breach
  run(-0.47, -0.37, 0, 0.2, 0.38); B(dg, M.concrete, 0.1, 0.19, 0.16, 0.36, 0, -0.07); [0.12, 0.06].forEach((hh, k) => B(dg, M.concrete, 0.09 - k * 0.02, hh, 0.05, 0.36, 0, 0.03 + k * 0.05));
  B(dg, M.concrete, 0.36, 0.09, 0.12, -0.1, 0, 0); B(dg, M.concrete, 0.14, 0.13, 0.1, 0.18, 0, 0.0);
  B(dg, M.limestone, 0.36, 0.045, 0.012, -0.22, 0, 0.196); B(dg, M.limestone, 0.2, 0.022, 0.012, -0.28, 0.045, 0.196); // surviving facing courses
  rubble(dg, 0.11, 0.17, 6, 0.1, 0.024, M.concrete, 5); rubble(dg, -0.3, 0.23, 3, 0.06, 0.02, M.marble, 8);
  for (const [x, z, hh] of [[-0.3, -0.14, 0.215], [0.05, -0.14, 0.215], [0.33, 0.14, 0.205], [-0.2, 0.14, 0.215], [-0.42, 0.05, 0.215], [0.2, -0.14, 0.215]]) tree(dg, 'shrub', x, z, 1, hh, x * 9);
  // ---- Roman bath ("Altından Geçme"): a thick mass of mortared rubble with brick bands; people walk under its arch
  const bx = -0.71, bz = -0.37, by = Y(bx, bz) - 0.01, bg = new THREE.Group(); bg.position.set(bx, by, bz); bg.rotation.y = 0.5; g.add(bg);
  archWall(bg, M.brick, 0.34, 0.26, 0.09, [{ x: -0.03, w: 0.11, h: 0.16 }], 0, 0, 0);
  for (const s of [-1, 1]) archRing(bg, M.brick, 0.11, 0.16, 0.01, -0.03, 0, s * 0.049, 0, 9);
  [[-0.13, 0.07, 0.09], [-0.045, 0.055, 0.07], [0.02, 0.018, 0.06], [0.09, 0.034, 0.08]].forEach(([x, hh, w]) => B(bg, M.brick, w, hh, 0.085, x, 0.26, 0)); // broken top, high at one end
  [[0.02, 0.2], [0.04, 0.215], [0.065, 0.225]].forEach(([dz, y]) => B(bg, M.brick, 0.2, 0.016, 0.03, -0.03, y, 0.045 + dz)); // corbelled springing of the fallen vault
  B(bg, M.brick, 0.07, 0.15, 0.16, 0.2, 0, 0.06); rubble(bg, 0, 0.14, 5, 0.2, 0.024, M.brick, 3);
  // ---- St Paul's well in its small paved court, and the two-storey houses of the old town with jettied bays
  const wx = -0.6, wz = 0.08, wy = Y(wx, wz);
  B(g, M.paving, 0.17, 0.006, 0.15, wx, wy - 0.002, wz); for (const [x, z, w, d] of [[0, -0.075, 0.17, 0.012], [-0.085, 0, 0.012, 0.15]]) B(g, M.limestone, w, 0.03, d, wx + x, wy, wz + z);
  cyl(g, M.limestone, 0.036, 0.04, 0.035, wx, wy, wz, 14); put(g, new THREE.CircleGeometry(0.027, 14), M.dark, wx, wy + 0.036, wz).rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) B(g, M.wood, 0.007, 0.075, 0.007, wx + s * 0.042, wy, wz); B(g, M.wood, 0.1, 0.007, 0.012, wx, wy + 0.075, wz); cyl(g, M.wood, 0.008, 0.008, 0.05, wx, wy + 0.05, wz, 6).rotation.z = Math.PI / 2;
  [[-0.8, 0.12, 0.2, 0.09, 0.11, 0.11], [-0.74, -0.06, 0.2, 0.08, 0.1, 0.095], [-0.66, -0.06, 0.2, 0.075, 0.1, 0.12], [-0.76, 0.3, 0.1, 0.1, 0.09, 0.09], [-0.5, -0.14, -0.4, 0.08, 0.095, 0.1], [-0.86, -0.24, 0.3, 0.085, 0.1, 0.085]].forEach(([x, z, r, hw, hd, hh]) => {
    const y = Y(x, z) - 0.005, h = house(g, x, z, y, hw, hd, hh, r); B(h, M.honey, hw + 0.004, hh * 0.42, hd + 0.004, 0, 0, 0); B(h, M.dark, hw * 0.2, hh * 0.3, 0.004, hw * 0.2, 0, hd / 2 + 0.003);
    B(h, M.wood, hw * 0.9, hh * 0.4, 0.03, 0, hh * 0.5, hd / 2 + 0.014); for (const wx of [-0.25, 0, 0.25]) B(h, M.dark, hw * 0.16, hh * 0.18, 0.003, wx * hw, hh * 0.62, hd / 2 + 0.03); // jettied timber bay
  });
  // ---- the Cydnus, the bridge of Justinian, and Cleopatra's barge coming upstream
  const rz = 0.2, rx = RC(rz);
  archWall(g, M.limestone, 0.32, 0.075, 0.07, [{ x: -0.095, w: 0.066, h: 0.052 }, { x: 0, w: 0.082, h: 0.06 }, { x: 0.095, w: 0.066, h: 0.052 }], rx, -0.01, rz, 0);
  B(g, M.paving, 0.32, 0.008, 0.07, rx, 0.065, rz); for (const s of [-1, 1]) B(g, M.limestone, 0.32, 0.014, 0.008, rx, 0.073, rz + s * 0.033);
  for (const k of [-0.048, 0.048]) for (const s of [-1, 1]) { const cw = put(g, new THREE.CylinderGeometry(0.016, 0.018, 0.05, 3), M.limestone, rx + k, 0.014, rz + s * 0.045); cw.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; }
  const barge = galley(M.purple, 0.19); barge.position.set(RC(-0.25), 0.0, -0.25); barge.rotation.y = Math.PI / 2 + 0.12; g.add(barge);
  B(g, M.gold, 0.035, 0.022, 0.045, RC(-0.14) + 0.005, 0.022, -0.135);
  for (let k = 0; k < 12; k++) { const z = -0.85 + k * 0.15, x = RC(z) + (k % 2 ? 0.17 : -0.17); if (Math.hypot(x, z) < 0.93 && Math.abs(z - rz) > 0.08) tree(g, 'reed', x, z, 1.2, Y(x, z), k); }
  // ---- an orange grove in one quarter; palms and a few cypresses as accents (kept clear of the gate)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = 0.26 + i * 0.1 + (j % 2) * 0.02, z = 0.5 + j * 0.1 + (i % 2) * 0.02; if (Math.hypot(x, z) < 0.9 && Math.abs(river(x, z)) > 0.2) tree(g, 'citrus', x, z, 1.25, Y(x, z), i * 3 + j); }
  for (const [x, z] of [[0.46, 0.3], [0.9, -0.05], [-0.83, 0.38], [0.46, -0.36], [0.02, 0.84]]) tree(g, 'palm', x, z, 1.15, Y(x, z), x * 7);
  for (const [x, z] of [[-0.5, -0.82], [-0.92, -0.05]]) tree(g, 'cypress', x, z, 1.1, Y(x, z), z * 3);
  scatter(g, ['olive', 'shrub', 'oak'], 9, [-0.95, -0.95, 0.5, 0.95], Y, 21, 0.8, 1.1, (x, z) => !inPit(x, z, 0.1) && Math.hypot(x - dx, z - dz) > 0.5 && Math.hypot(x - GX, z - GZ) > 0.34 && !town(x, z) && Math.hypot(x - bx, z - bz) > 0.25 && !(x > 0.12 && z > 0.42) && !(Math.abs(x - GX) < 0.2 && z > 0.3));
  for (const [x, z, i] of [[0.06, -0.02, 0], [0.12, -0.2, 2], [0.02, 0.14, 4], [GX - 0.01, GZ + 0.02, 3], [GX + 0.05, GZ + 0.2, 1], [GX - 0.1, GZ - 0.22, 0], [GX - 0.02, GZ + 0.34, 2], [wx + 0.06, wz + 0.03, 4], [bx - 0.02, bz + 0.02, 5], [0.2, -0.46, 5]]) person(g, x, z, Y(x, z) + (inPit(x, z) ? 0.03 : 0.002), i);
  person(g, rx, rz, 0.073, 1);
}
