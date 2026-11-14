// Tarsus: the buried city seen through its windows. Hero: Cleopatra's Gate with the road running through it.
// Behind: the basalt street in its excavation pit, the concrete mass of Donuktaş, the bath wall,
// St Paul's well among old houses, the Cydnus with the three-arched bridge and Cleopatra's barge.
import * as THREE from 'three';
import { M, B, put, col, drums, rubble, tree, scatter, person, base, sm, fbm, archWall, archRing, cyl, house, galley, railing } from './kit.js';

export default function tarsus(g) {
  const SA = -0.35, SX = 0.08, SZ = -0.08; // street azimuth and centre
  const along = (x, z) => (x - SX) * Math.sin(SA) + (z - SZ) * Math.cos(SA), across = (x, z) => (x - SX) * Math.cos(SA) - (z - SZ) * Math.sin(SA);
  const TW = 0.15, TL = 0.42, inPit = (x, z, m = 0) => Math.abs(across(x, z)) < TW + m && Math.abs(along(x, z)) < TL + m;
  const river = (x, z) => x - (0.7 + 0.06 * Math.sin(z * 3.2));
  const GX = -0.34, GZ = 0.5, GR = 0.18;
  const town = (x, z) => Math.hypot(x + 0.62, z - 0.05) < 0.3;
  const Y = base(g, {
    water: true, dry: 0.5,
    h: (x, z) => {
      let y = 0.1 + fbm(x * 2 + 1, z * 2) * 0.012;
      y -= (1 - sm(TW - 0.004, TW + 0.006, Math.abs(across(x, z)))) * (1 - sm(TL - 0.004, TL + 0.006, Math.abs(along(x, z)))) * 0.092; // excavation pit: the Roman level lies well below today's
      y -= (1 - sm(0.07, 0.2, Math.abs(river(x, z)))) * 0.125;
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (inPit(x, z, 0.07) && !inPit(x, z)) c.copy(P.sand).lerp(P.rock, 0.4); // modern paved apron round the pit
      if (inPit(x, z)) c.lerp(P.earth, 0.85);
      const rd = Math.abs((x - GX) - (z - GZ) * Math.tan(GR)); if (rd < 0.045 && z > -0.02 && y > 0.05) c.lerp(P.sand, 0.85); // the road through the gate
      if (town(x, z)) c.lerp(P.earth, 0.55).lerp(P.rock, 0.25);
      if (y > 0 && y < 0.03) c.lerp(P.sand, 0.6);
    },
  });
  // ---- Cleopatra's Gate: one round arch between thick piers; ashlar below, rubble above, ragged top
  const gg = new THREE.Group(); gg.position.set(GX, Y(GX, GZ) - 0.006, GZ); gg.rotation.y = GR; g.add(gg);
  const GW = 0.42, GH = 0.3, GT = 0.15, OW = 0.19, OH = 0.235;
  archWall(gg, M.honey, GW, GH, GT, [{ x: 0, w: OW, h: OH }], 0, 0, 0);
  for (const s of [-1, 1]) archRing(gg, M.limestone, OW, OH, 0.012, 0, 0, s * (GT / 2 + 0.004), 0, 11);
  for (const s of [-1, 1]) { B(gg, M.limestone, 0.125, 0.014, GT + 0.02, s * (GW / 2 - 0.058), OH - OW / 2 - 0.014, 0); B(gg, M.honey, 0.13, 0.03, GT + 0.03, s * (GW / 2 - 0.058), 0, 0); } // imposts, plinths
  [[-0.17, 0.05, 0.08], [-0.08, 0.03, 0.1], [0.02, 0.06, 0.1], [0.12, 0.035, 0.09], [0.18, 0.02, 0.05]].forEach(([x, hh, w], k) => B(gg, M.rubble, w, hh, GT - 0.01 - (k % 2) * 0.02, x, GH, 0)); // eroded upper courses
  for (const s of [-1, 1]) [0.16, 0.115, 0.07].forEach((hh, k) => B(gg, M.honey, 0.08, hh, 0.1, s * (GW / 2 + 0.04 + k * 0.08), 0, 0)); // city-wall stubs stepping down
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
    B(st, M.rubble, 0.008, 0.094, TL * 2, s * (TW - 0.003), -0.006, 0); // cut sides of the excavation
  }
  for (const s of [-1, 1]) B(st, M.rubble, TW * 2, 0.094, 0.008, 0, -0.006, s * (TL - 0.003));
  const cap = put(st, new THREE.CylinderGeometry(0.02, 0.013, 0.026, 10), M.weathered, 0.06, 0.03, 0.2); cap.rotation.set(1.3, 0.3, 0);
  drums(st, -0.05, -0.2, 3, 0.013, 3, 0.014);
  for (let k = 0; k < 7; k++) B(st, M.limestone, 0.05, 0.008, 0.016, -TW + 0.03, 0.094 - 0.006 - k * 0.012, TL - 0.03 - k * 0.016); // stair down into the pit
  const rim = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]) { const lx = a * (TW + 0.012), lz = b * (TL + 0.012); rim.push([SX + lx * Math.cos(SA) + lz * Math.sin(SA), SZ - lx * Math.sin(SA) + lz * Math.cos(SA)]); }
  for (let k = 0; k < 4; k++) { const [x1, z1] = rim[k], [x2, z2] = rim[k + 1], n = 6; const pts = []; for (let i = 0; i <= n; i++) pts.push([x1 + (x2 - x1) * i / n, z1 + (z2 - z1) * i / n]); railing(g, pts, () => 0.104, 0.02, M.dark); }
  // ---- Donuktaş: the stripped concrete core of a giant temple — thick walls in broken stretches, some ashlar facing left at the foot
  const dx = 0.1, dz = -0.66, dy = Y(dx, dz) - 0.01, dg = new THREE.Group(); dg.position.set(dx, dy, dz); dg.rotation.y = 0.1; g.add(dg);
  const wall = (x0, x1, z, hs) => hs.forEach((hh, k) => { const w = (x1 - x0) / hs.length; if (hh) B(dg, M.concrete, w + 0.004, hh, 0.08, x0 + (k + 0.5) * w, 0, z, (k % 2 ? 0.02 : -0.02)); });
  wall(-0.4, 0.4, -0.13, [0.22, 0.24, 0.2, 0.23, 0.17, 0.21]); wall(-0.4, 0.4, 0.13, [0.2, 0.23, 0.14, 0, 0.19, 0.22]);
  [[-0.4, 0.21], [0.4, 0.16]].forEach(([x, hh]) => B(dg, M.concrete, 0.08, hh, 0.34, x, 0, 0));
  B(dg, M.concrete, 0.36, 0.1, 0.12, -0.08, 0, 0); B(dg, M.concrete, 0.14, 0.15, 0.1, 0.18, 0, 0.0);
  B(dg, M.limestone, 0.5, 0.045, 0.012, -0.12, 0, 0.176); B(dg, M.limestone, 0.26, 0.022, 0.012, -0.24, 0.045, 0.176); // surviving facing courses
  rubble(dg, 0.1, 0.22, 6, 0.2, 0.026, M.concrete, 5); rubble(dg, -0.3, 0.24, 3, 0.1, 0.022, M.marble, 8);
  for (const [x, z, hh] of [[-0.3, -0.13, 0.24], [0.05, -0.13, 0.23], [0.3, 0.13, 0.22], [-0.2, 0.13, 0.23]]) tree(dg, 'shrub', x, z, 1, hh, x * 9);
  // ---- Roman bath ("Altından Geçme"): a thick mass of mortared rubble with brick bands; people walk under its arch
  const bx = -0.66, bz = -0.42, by = Y(bx, bz) - 0.01, bg = new THREE.Group(); bg.position.set(bx, by, bz); bg.rotation.y = 0.5; g.add(bg);
  archWall(bg, M.brick, 0.34, 0.26, 0.09, [{ x: -0.03, w: 0.11, h: 0.16 }], 0, 0, 0);
  for (const s of [-1, 1]) archRing(bg, M.brick, 0.11, 0.16, 0.01, -0.03, 0, s * 0.049, 0, 9);
  [[-0.13, 0.04], [-0.02, 0.025], [0.1, 0.05]].forEach(([x, hh]) => B(bg, M.brick, 0.09, hh, 0.085, x, 0.26, 0)); // ragged top
  const spring = put(bg, new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10, 1, true, Math.PI * 1.5, Math.PI * 0.32), M.brickDS, 0.03, 0.17, 0.1); spring.rotation.z = Math.PI / 2; // stub of a fallen vault
  B(bg, M.brick, 0.07, 0.15, 0.16, 0.2, 0, 0.06); rubble(bg, 0, 0.14, 5, 0.2, 0.024, M.brick, 3);
  // ---- St Paul's well in its small paved court, and the two-storey houses of the old town with jettied bays
  const wx = -0.6, wz = 0.08, wy = Y(wx, wz);
  B(g, M.paving, 0.17, 0.006, 0.15, wx, wy - 0.002, wz); for (const [x, z, w, d] of [[0, -0.075, 0.17, 0.012], [-0.085, 0, 0.012, 0.15]]) B(g, M.limestone, w, 0.03, d, wx + x, wy, wz + z);
  cyl(g, M.limestone, 0.036, 0.04, 0.035, wx, wy, wz, 14); put(g, new THREE.CircleGeometry(0.027, 14), M.dark, wx, wy + 0.036, wz).rotation.x = -Math.PI / 2;
  for (const s of [-1, 1]) B(g, M.wood, 0.007, 0.075, 0.007, wx + s * 0.042, wy, wz); B(g, M.wood, 0.1, 0.007, 0.012, wx, wy + 0.075, wz); cyl(g, M.wood, 0.008, 0.008, 0.05, wx, wy + 0.05, wz, 6).rotation.z = Math.PI / 2;
  for (const [x, z, r] of [[-0.8, 0.12, 0.2], [-0.74, -0.08, 0.5], [-0.56, 0.27, -0.2], [-0.74, 0.3, 0.1], [-0.52, -0.12, -0.4], [-0.86, -0.22, 0.3], [-0.42, 0.2, 0.3]]) {
    const y = Y(x, z) - 0.005, h = house(g, x, z, y, 0.085, 0.1, 0.1, r);
    B(h, M.plaster, 0.09, 0.045, 0.03, 0, 0.05, 0.06); B(h, M.wood, 0.09, 0.006, 0.03, 0, 0.046, 0.06); B(h, M.dark, 0.05, 0.022, 0.003, 0, 0.062, 0.076); // upper bay on brackets
  }
  // ---- the Cydnus, the bridge of Justinian, and Cleopatra's barge coming upstream
  const rz = 0.34, rx = 0.7 + 0.06 * Math.sin(rz * 3.2);
  archWall(g, M.limestone, 0.4, 0.075, 0.07, [{ x: -0.115, w: 0.08, h: 0.055 }, { x: 0, w: 0.095, h: 0.062 }, { x: 0.115, w: 0.08, h: 0.055 }], rx, -0.01, rz, 0);
  B(g, M.paving, 0.4, 0.008, 0.07, rx, 0.065, rz); for (const s of [-1, 1]) B(g, M.limestone, 0.4, 0.016, 0.008, rx, 0.073, rz + s * 0.033);
  for (const k of [-0.058, 0.058]) for (const s of [-1, 1]) { const cw = put(g, new THREE.CylinderGeometry(0.018, 0.02, 0.05, 3), M.limestone, rx + k, 0.014, rz + s * 0.045); cw.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; }
  const barge = galley(M.purple, 0.19); barge.position.set(0.68, 0.0, -0.16); barge.rotation.y = Math.PI / 2 + 0.12; g.add(barge);
  B(g, M.gold, 0.035, 0.022, 0.045, 0.685, 0.022, -0.045); for (const s of [-1, 1]) B(g, M.gold, 0.003, 0.03, 0.003, 0.685 + s * 0.016, 0.022, -0.03);
  for (let k = 0; k < 12; k++) { const z = -0.85 + k * 0.15, x = 0.7 + 0.06 * Math.sin(z * 3.2) + (k % 2 ? 0.17 : -0.17); if (Math.hypot(x, z) < 0.93 && Math.abs(z - rz) > 0.08) tree(g, 'reed', x, z, 1.2, Y(x, z), k); }
  // ---- an orange grove in one quarter; palms and a few cypresses as accents (kept clear of the gate)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 0.2 + i * 0.1, z = 0.52 + j * 0.1; if (Math.hypot(x, z) < 0.9 && Math.abs(river(x, z)) > 0.2) tree(g, 'citrus', x, z, 1.25, Y(x, z), i * 3 + j); }
  for (const [x, z] of [[0.5, 0.2], [0.9, 0.05], [-0.9, 0.42], [0.46, -0.36], [-0.04, 0.86]]) tree(g, 'palm', x, z, 1.15, Y(x, z), x * 7);
  for (const [x, z] of [[-0.36, -0.84], [0.52, -0.78], [-0.92, -0.05]]) tree(g, 'cypress', x, z, 1.1, Y(x, z), z * 3);
  scatter(g, ['olive', 'shrub', 'oak'], 9, [-0.95, -0.95, 0.5, 0.95], Y, 21, 0.8, 1.1, (x, z) => !inPit(x, z, 0.1) && Math.hypot(x - dx, z - dz) > 0.5 && Math.hypot(x - GX, z - GZ) > 0.34 && !town(x, z) && Math.hypot(x - bx, z - bz) > 0.25 && !(x > 0.12 && z > 0.42) && !(Math.abs(x - GX) < 0.2 && z > 0.3));
  for (const [x, z, i] of [[0.06, -0.02, 0], [0.12, -0.2, 2], [0.02, 0.14, 4], [GX - 0.01, GZ + 0.02, 3], [GX + 0.05, GZ + 0.2, 1], [wx + 0.06, wz + 0.03, 4], [bx - 0.02, bz + 0.02, 5], [0.2, -0.46, 5]]) person(g, x, z, Y(x, z) + (inPit(x, z) ? 0.03 : 0.002), i);
  person(g, rx, rz, 0.073, 1);
}
