// Elaiussa Sebaste: the theatre bedded in the hill and facing the sea, the agora with its two-apsed church below,
// harbour baths, the old island (now a sand-tied peninsula), the promontory temple, aqueduct and tomb avenue.
import * as THREE from 'three';
import { M, B, put, col, beam, drums, rubble, tree, scatter, person, base, hill, sm, lerp, fbm, ell, cavea, archWall, archRing, vault, cyl, apse, gable, sarcophagus, lion } from './kit.js';

export default function elaiussa(g) {
  const TH = { x: -0.06, z: -0.18, r0: 0.1, r1: 0.43, rows: 14, y: 0.09 };
  const dr = (TH.r1 - TH.r0) / TH.rows, dy = dr * 0.62, top = TH.rows * dy;
  const TP = { x: -0.68, z: 0.26 }; // temple platform
  const pen = (x, z) => ell(x, z, 0.28, 0.74, 0.36, 0.17, -0.2) + (fbm(x * 7, z * 7) - 0.5) * 0.3;
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.05 + fbm(x * 2.3, z * 2.3 + 4) * 0.02;
      y += hill(x, z, -0.06, -0.6, 0.5, 0.4) + hill(x, z, 0.66, -0.52, 0.3, 0.13); // theatre hill, necropolis ridge
      y = lerp(y, 0.13, 1 - sm(0.16, 0.28, Math.hypot(x - TP.x, z - TP.z))); // levelled temple terrace
      const shore = 0.46 + 0.09 * Math.sin(x * 4.2 + 0.8) + fbm(x * 4, 2) * 0.05;
      y -= sm(shore - 0.06, shore + 0.16, z) * 0.2;
      y = Math.max(y, 0.045 * (1 - sm(0.5, 1.1, pen(x, z))) - 0.012); // the former island
      y = Math.max(y, 0.02 - ell(x, z, 0.24, 0.56, 0.11, 0.13) * 0.03); // sandbar
      // the cavea lies in the slope: ground follows the seating, then blends back into the hill behind the top row
      const d = Math.hypot(x - TH.x, z - TH.z);
      if (d < TH.r1) y = Math.min(y, TH.y - 0.012 + Math.max(0, (d - TH.r0) / (TH.r1 - TH.r0)) * top);
      else if (d < TH.r1 + 0.22 && (z < TH.z + 0.05 || x < TH.x)) y = Math.min(y, lerp(TH.y + top - 0.012, y, sm(TH.r1, TH.r1 + 0.22, d)));
      // the stage and its side passages stand on level ground in front of the orchestra
      if (z > TH.z && z < TH.z + 0.34 && Math.abs(x - TH.x) < 0.5) y = Math.min(y, lerp(TH.y - 0.012, y, Math.max(sm(0.42, 0.5, Math.abs(x - TH.x)), sm(TH.z + 0.26, TH.z + 0.34, z))));
      return y;
    },
    tint: (x, z, y, s, c, P) => {
      if (Math.abs(z - 0.31 - 0.04 * Math.sin(x * 3)) < 0.026 && y > 0.012) c.copy(P.sand).multiplyScalar(0.95); // coast road
      if ((pen(x, z) < 1.2 || ell(x, z, 0.24, 0.56, 0.13, 0.16) < 1) && y > 0) c.lerp(P.sand, 0.8); // the island is buried in sand
      if (x > 0.36 && z < -0.36 && Math.abs(z + 0.5 - 0.1 * (x - 0.4)) < 0.02) c.lerp(P.earth, 0.8); // tomb avenue
    },
  });
  // ---- theatre: a little more than a half-circle, opening south to the road and the sea
  cavea(g, { ...TH, arc: Math.PI * 1.1, stairs: 6, material: M.limestone });
  for (let k = 0; k < 16; k++) { // the robbed upper rows: broken blocks along the rim
    const a = Math.PI * (-0.05 + 1.1 * (k + 0.5) / 16), r = TH.r1 + dr * 0.3;
    if (k % 3 === 0 || k === 7) B(g, M.limestone, 0.05 + (k % 4) * 0.02, 0.01 + (k * 13 % 5) * 0.01, 0.03, TH.x + Math.cos(a) * r, TH.y + top, TH.z - Math.sin(a) * r, a + Math.PI / 2);
  }
  // stage building: stage platform, its front with niches, the scaenae frons reduced to a wall stub with three doors
  const sz = TH.z + TH.r0 + 0.05, chord = 0.66;
  B(g, M.limestone, chord, 0.03, 0.08, TH.x, TH.y - 0.012, sz + 0.04);
  archWall(g, M.limestone, chord, 0.032, 0.012, [-0.24, -0.12, 0, 0.12, 0.24].map((x) => ({ x, w: 0.035, h: 0.026 })), TH.x, TH.y - 0.006, sz);
  archWall(g, M.limestone, chord + 0.04, 0.085, 0.03, [{ x: -0.18, w: 0.05, h: 0.065 }, { x: 0, w: 0.07, h: 0.075 }, { x: 0.18, w: 0.05, h: 0.065 }], TH.x, TH.y - 0.012, sz + 0.1);
  B(g, M.limestone, 0.16, 0.05, 0.03, TH.x - 0.27, TH.y + 0.073, sz + 0.1); B(g, M.limestone, 0.07, 0.03, 0.03, TH.x - 0.31, TH.y + 0.123, sz + 0.1); // one end of the scaenae wall stands higher
  for (const s of [-1, 1]) { B(g, M.limestone, 0.04, 0.1, 0.13, TH.x + s * (chord / 2 + 0.04), TH.y - 0.012, sz + 0.05); B(g, M.rubble, 0.1, 0.045, 0.03, TH.x + s * (chord / 2 + 0.1), TH.y - 0.012, sz + 0.1); }
  for (let i = 0; i < 6; i++) col(g, TH.x - 0.26 + i * 0.104, sz + 0.075, i === 4 ? 0.13 : 0.03 + (i % 2) * 0.025, { y: TH.y + 0.018, r: 0.012, broken: true, seed: i });
  drums(g, TH.x + 0.12, sz + 0.2, 4, 0.012, 4, Y(TH.x + 0.12, sz + 0.2)); rubble(g, TH.x - 0.2, sz + 0.2, 6, 0.2, 0.018, M.limestone, 3, Y);
  // ---- agora: walled court, lion fountains at the entrance, round shrine, and the church with an apse at each end
  const ax = 0.52, az = 0.06, ay = Y(ax, az) - 0.004;
  B(g, M.paving, 0.34, 0.01, 0.28, ax, ay, az);
  for (const [x, z, w, d, hh] of [[0, -0.14, 0.36, 0.02, 0.085], [0.07, 0.14, 0.2, 0.02, 0.04], [-0.17, -0.02, 0.02, 0.24, 0.06], [0.17, 0, 0.02, 0.28, 0.1]]) B(g, M.limestone, w, hh, d, ax + x, ay, az + z);
  const cz2 = az - 0.045; // the church: two long walls 0.1 apart, apse at each short end
  B(g, M.honey, 0.2, 0.085, 0.014, ax, ay, cz2 - 0.05); B(g, M.honey, 0.2, 0.04, 0.014, ax, ay, cz2 + 0.05);
  apse(g, M.honey, 0.05, 0.11, ax + 0.1, ay, cz2, -Math.PI / 2); apse(g, M.honey, 0.05, 0.07, ax - 0.1, ay, cz2, Math.PI / 2);
  put(g, new THREE.PlaneGeometry(0.19, 0.085), M.mosaic, ax, ay + 0.012, cz2).rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) col(g, ax - 0.06 + i * 0.04, cz2 + sd * 0.022, (i + (sd > 0 ? 1 : 0)) % 3 === 0 ? 0.06 : 0.018, { y: ay + 0.012, r: 0.005, broken: true, shaft: M.weathered });
  cyl(g, M.marble, 0.03, 0.032, 0.02, ax + 0.06, ay + 0.01, az + 0.08, 14); for (let k = 0; k < 5; k++) col(g, ax + 0.06 + Math.cos(k * 1.26) * 0.024, az + 0.08 + Math.sin(k * 1.26) * 0.024, k < 2 ? 0.07 : 0.02, { y: ay + 0.03, r: 0.005, broken: k >= 2 });
  for (const s of [-1, 1]) lion(g, ax - 0.09 + s * 0.045, az + 0.17, ay, 0, 1.5);
  // ---- harbour baths: tall rubble-and-brick walls with arched openings, one vault standing, an apse half fallen
  const bx = -0.32, bz = 0.16, by = Y(bx, bz) - 0.008, bg = new THREE.Group(); bg.position.set(bx, by, bz); bg.rotation.y = 0.12; g.add(bg);
  archWall(bg, M.brick, 0.3, 0.17, 0.03, [{ x: -0.08, w: 0.07, h: 0.12 }, { x: 0.06, w: 0.07, h: 0.12 }], 0, 0, -0.08);
  archRing(bg, M.brick, 0.07, 0.12, 0.034, -0.08, 0, -0.08, 0, 9); archRing(bg, M.brick, 0.07, 0.12, 0.034, 0.06, 0, -0.08, 0, 9);
  vault(bg, M.brickDS, 0.12, 0.16, 0.1, -0.08, 0, 0.0, 0, 0); B(bg, M.brick, 0.03, 0.13, 0.16, 0.14, 0, 0.0); B(bg, M.brick, 0.03, 0.07, 0.1, 0.02, 0, 0.03);
  apse(bg, M.brick, 0.055, 0.1, 0.07, 0, 0.09, Math.PI); rubble(bg, 0.06, 0.12, 7, 0.14, 0.02, M.brick, 9);
  // ---- promontory temple (6 x 12): podium on its terrace, two columns standing with their architrave
  const tg = new THREE.Group(); tg.position.set(TP.x, 0.122, TP.z); tg.rotation.y = 0.5; g.add(tg);
  B(tg, M.rubble, 0.215, 0.14, 0.355, 0, -0.14, 0); // terrace substructure
  B(tg, M.limestone, 0.2, 0.03, 0.34, 0, 0, 0); B(tg, M.marble, 0.17, 0.018, 0.31, 0, 0.03, 0);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 12; j++) {
    if (i > 0 && i < 5 && j > 0 && j < 11) continue;
    const x = -0.075 + i * 0.03, z = -0.143 + j * 0.026, k = i * 12 + j;
    if (j === 11 && (i === 1 || i === 2)) col(tg, x, z, 0.18, { y: 0.048, r: 0.0125 });
    else if (k % 3 === 0) col(tg, x, z, 0.02 + (k % 4) * 0.012, { y: 0.048, r: 0.0125, broken: true, seed: k });
  }
  beam(tg, -0.045, 0.143, -0.015, 0.143, 0.228, 0.034, 0.022, M.capital);
  drums(g, TP.x + 0.14, TP.z + 0.02, 4, 0.0125, 7, Y(TP.x + 0.14, TP.z + 0.02));
  // ---- aqueduct from the Lamos, ending in a broken pier
  for (let k = 0; k < 2; k++) {
    const x = 0.6 + k * 0.24, z = -0.2 - k * 0.05, y = Y(x, z) - 0.02;
    archWall(g, M.honey, 0.24, 0.2 - k * 0.03, 0.035, [-0.078, 0, 0.078].map((ox) => ({ x: ox, w: 0.056, h: 0.15 - k * 0.03 })), x, y, z, 0.2);
  }
  B(g, M.honey, 0.035, 0.12, 0.035, 0.44, Y(0.44, -0.17) - 0.02, -0.168, 0.2);
  // ---- the peninsula: sea wall, a cistern vault, bath ruin and the breakwater
  const py = Y(0.28, 0.74) - 0.008;
  B(g, M.rubble, 0.4, 0.035, 0.014, 0.28, py, 0.65, 0.2); B(g, M.rubble, 0.014, 0.045, 0.14, 0.5, py, 0.68, 0.2); B(g, M.rubble, 0.16, 0.03, 0.014, 0.12, py, 0.8, 0.2);
  vault(g, M.rubbleDS, 0.06, 0.1, 0.03, 0.2, py, 0.76, 1.3, 1); B(g, M.rubble, 0.1, 0.05, 0.08, 0.38, py, 0.78, 0.4); B(g, M.rubble, 0.07, 0.03, 0.05, 0.3, py, 0.7, 0.2);
  for (let i = 0; i < 7; i++) { const a = 0.4 + i * 0.3; col(g, 0.3 + Math.cos(a) * 0.1, 0.82 - Math.sin(a) * 0.05, i % 3 === 1 ? 0.07 : 0.025, { y: py, r: 0.006, broken: true, shaft: M.weathered }); } // curved portico of the Byzantine palace
  for (let k = 0; k < 8; k++) B(g, M.concrete, 0.042, 0.03, 0.035, 0.0 - k * 0.038, -0.02, 0.83 - k * 0.012, 0.3); // breakwater running out from the island
  // ---- necropolis: gabled house-tombs lining the avenue on the ridge, with sarcophagi between
  for (let i = 0; i < 9; i++) {
    const x = 0.42 + (i % 5) * 0.1, side = i < 5 ? -1 : 1, z = -0.5 + 0.1 * (x - 0.4) + side * 0.075;
    if (Math.hypot(x, z) > 0.9) continue;
    const t = new THREE.Group(); t.position.set(x, Y(x, z) - 0.01, z); t.rotation.y = side > 0 ? Math.PI : 0; g.add(t);
    const w = 0.058 + (i % 3) * 0.008;
    B(t, M.limestone, w + 0.012, 0.012, w * 1.3 + 0.012, 0, 0, 0); B(t, M.limestone, w, 0.055, w * 1.25, 0, 0.012, 0);
    gable(t, M.limestone, w * 1.1, w * 1.32, 0.022, 0, 0.067, 0);
    B(t, M.dark, w * 0.3, 0.032, 0.004, 0, 0.012, w * 0.63);
  }
  for (const [x, dzz, r] of [[0.47, 0.0, 0.2], [0.67, 0.005, -0.3], [0.86, -0.0, 0.5]]) { const z = -0.5 + 0.1 * (x - 0.4) + dzz; if (Math.hypot(x, z) < 0.9) sarcophagus(g, x, z, Y(x, z) - 0.004, 1.05, r + 1.5); }
  // ---- lemon groves between temple and baths; olives and maquis on the hill
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = -0.62 + i * 0.075, z = -0.02 + j * 0.075; tree(g, 'citrus', x, z, 1.1, Y(x, z), i + j * 5); }
  scatter(g, ['olive', 'olive', 'shrub', 'oak'], 22, [-0.95, -0.95, 0.95, 0.0], Y, 5, 0.75, 1.15, (x, z) => Math.hypot(x - TH.x, z - TH.z) > TH.r1 + 0.09 && !(x > 0.36 && z < -0.36) && Y(x, z) > 0.03 && !(Math.abs(x + 0.55) < 0.14 && z > -0.1));
  scatter(g, 'shrub', 9, [-0.95, 0.2, 0.95, 0.9], Y, 8, 0.6, 1, (x, z) => Y(x, z) > 0.02 && Math.hypot(x - bx, z - bz) > 0.24 && Math.hypot(x - TP.x, z - TP.z) > 0.2 && Math.abs(z - 0.31) > 0.05 && !(Math.abs(x - ax) < 0.22 && z < 0.26));
  const seat = (k, a) => [TH.x + Math.cos(a) * (TH.r0 + (k + 0.5) * dr), TH.z - Math.sin(a) * (TH.r0 + (k + 0.5) * dr), TH.y + (k + 1) * dy];
  for (const [k, a, i] of [[3, 1.2, 0], [3, 1.3, 2], [8, 2.1, 3], [6, 0.7, 4]]) { const [x, z, y] = seat(k, a); person(g, x, z, y, i); }
  for (const [x, z, i] of [[TH.x, TH.z + 0.02, 1], [TH.x + 0.05, TH.z + 0.05, 5], [0.2, 0.31, 0], [0.45, 0.2, 4], [TP.x + 0.02, TP.z + 0.2, 5], [0.28, 0.62, 2]]) person(g, x, z, Math.max(Y(x, z), TH.y - 0.012 > Y(x, z) ? Y(x, z) : Y(x, z)) + 0.004, i);
}
