// Elaiussa Sebaste: theatre cut into the hill above the coast road, agora and baths below,
// the old island (now a sand-joined peninsula), a promontory temple, aqueduct and necropolis.
import * as THREE from 'three';
import { M, B, put, col, beam, drums, rubble, tree, scatter, person, base, hill, sm, fbm, ell, cavea, archWall, vault, cyl } from './kit.js';

export default function elaiussa(g) {
  const TH = { x: -0.08, z: -0.2, r0: 0.12, r1: 0.42, rows: 10, y: 0.085 };
  const top = TH.rows * ((TH.r1 - TH.r0) / TH.rows) * 0.62;
  const Y = base(g, {
    water: true,
    h: (x, z) => {
      let y = 0.05 + fbm(x * 2.3, z * 2.3 + 4) * 0.02;
      y += hill(x, z, -0.08, -0.62, 0.5, 0.36) + hill(x, z, 0.62, -0.5, 0.3, 0.14); // theatre hill, necropolis ridge
      y += hill(x, z, -0.72, 0.33, 0.17, 0.11); // temple promontory
      // shoreline with two bays, and the former island tied to the shore by a sandbar
      const shore = 0.47 + 0.1 * Math.sin(x * 4.2 + 0.8) + fbm(x * 4, 2) * 0.05;
      y -= sm(shore - 0.06, shore + 0.16, z) * 0.2;
      y = Math.max(y, hill(x, z, 0.33, 0.76, 0.15, 0.085) - 0.015);
      y = Math.max(y, 0.012 - ell(x, z, 0.3, 0.6, 0.06, 0.12) * 0.03);
      // the cavea is cut into the slope
      const d = Math.hypot(x - TH.x, z - TH.z);
      if (d < TH.r1 + 0.05) y = Math.min(y, TH.y - 0.012 + Math.max(0, (d - TH.r0) / (TH.r1 - TH.r0)) * top);
      return y;
    },
    tint: (x, z, y, s, c, P) => { if (Math.abs(z - 0.3 - 0.05 * Math.sin(x * 3)) < 0.022 && y > 0.01) c.lerp(P.sand, 0.8); }, // coast road
  });
  // theatre: a little more than a half-circle; lower tiers re-set by the excavators, upper tiers ruinous
  const th = cavea(g, { ...TH, arc: Math.PI * 1.12, stairs: 5, material: M.limestone });
  for (let k = 0; k < 9; k++) { // broken upper edge
    const a = Math.PI * (-0.06 + 1.12 * (k + 0.5) / 9), r = TH.r1 + 0.02;
    B(g, M.rubble, 0.09, 0.02 + (k * 13 % 5) * 0.012, 0.035, TH.x + Math.cos(a) * r, TH.y + top - 0.01, TH.z - Math.sin(a) * r, a + Math.PI / 2);
  }
  // stage building: foundations, a few column stumps of the scaenae frons
  const sz = TH.z + 0.2;
  B(g, M.limestone, 0.56, 0.05, 0.035, TH.x, TH.y - 0.02, sz); B(g, M.rubble, 0.6, 0.08, 0.03, TH.x, TH.y - 0.02, sz + 0.07);
  for (const sx of [-1, 1]) B(g, M.rubble, 0.03, 0.11, 0.1, TH.x + sx * 0.3, TH.y - 0.02, sz + 0.035);
  for (let i = 0; i < 6; i++) col(g, TH.x - 0.22 + i * 0.088, sz + 0.035, i % 3 === 1 ? 0.2 : 0.06 + (i % 2) * 0.03, { y: TH.y + 0.02, r: 0.018, broken: i % 3 !== 1 });
  drums(g, TH.x + 0.1, sz - 0.07, 3, 0.018, 4, TH.y);
  // agora: walled court with the Byzantine church built into it, lion-fountain bases at the entrance
  const ax = 0.36, az = 0.1, ay = Y(ax, az);
  B(g, M.paving, 0.36, 0.01, 0.3, ax, ay - 0.004, az);
  for (const [x, z, w, d, hh] of [[0, -0.15, 0.38, 0.02, 0.07], [0, 0.15, 0.38, 0.02, 0.04], [-0.19, 0, 0.02, 0.3, 0.06], [0.19, 0, 0.02, 0.3, 0.09]]) B(g, M.limestone, w, hh, d, ax + x, ay, az + z);
  const apse = cyl(g, M.honeyDS, 0.07, 0.07, 0.11, ax + 0.05, ay, az - 0.02, 14, true); apse.geometry = new THREE.CylinderGeometry(0.07, 0.07, 0.11, 14, 1, true, 0, Math.PI); apse.rotation.y = Math.PI / 2;
  B(g, M.honey, 0.02, 0.09, 0.14, ax - 0.09, ay, az - 0.02); B(g, M.honey, 0.14, 0.07, 0.02, ax - 0.02, ay, az - 0.09); B(g, M.honey, 0.14, 0.05, 0.02, ax - 0.02, ay, az + 0.05);
  put(g, new THREE.PlaneGeometry(0.1, 0.1), M.mosaic, ax - 0.02, ay + 0.008, az - 0.02).rotation.x = -Math.PI / 2;
  for (const sx of [-1, 1]) { B(g, M.marble, 0.035, 0.03, 0.05, ax + sx * 0.06, ay, az + 0.19); put(g, new THREE.SphereGeometry(0.016, 8, 6), M.marble, ax + sx * 0.06, ay + 0.045, az + 0.2).scale.set(1, 0.9, 1.5); }
  for (let i = 0; i < 5; i++) col(g, ax - 0.15 + i * 0.075, az + 0.12, i === 1 || i === 2 ? 0.16 : 0.04, { y: ay, r: 0.014, broken: !(i === 1 || i === 2) });
  // harbour baths: vaulted halls in rubble-and-brick, half fallen
  const bx = -0.42, bz = 0.2, by = Y(bx, bz);
  vault(g, M.rubbleDS, 0.11, 0.2, 0.08, bx, by, bz, 0.15); vault(g, M.rubbleDS, 0.09, 0.14, 0.07, bx + 0.11, by, bz + 0.02, 0.15, 0);
  B(g, M.rubble, 0.14, 0.1, 0.02, bx - 0.11, by, bz - 0.05, 0.15); B(g, M.rubble, 0.02, 0.06, 0.16, bx - 0.17, by, bz + 0.02, 0.15);
  rubble(g, bx + 0.05, bz + 0.13, 7, 0.16, 0.025, M.rubble, 9, Y);
  // promontory temple: podium, two Corinthian columns standing of 6 x 12
  const tx = -0.72, tz = 0.33, ty = Y(tx, tz) - 0.01;
  B(g, M.limestone, 0.2, 0.035, 0.32, tx, ty, tz, 0.5); B(g, M.marble, 0.17, 0.02, 0.29, tx, ty + 0.035, tz, 0.5);
  col(g, tx - 0.02, tz + 0.11, 0.26, { y: ty + 0.055, r: 0.02 }); col(g, tx + 0.045, tz + 0.085, 0.26, { y: ty + 0.055, r: 0.02 });
  beam(g, tx - 0.02, tz + 0.11, tx + 0.045, tz + 0.085, ty + 0.315, 0.05, 0.035);
  for (const [dx, dz] of [[-0.08, -0.05], [-0.03, -0.12], [0.06, -0.04], [0.02, 0.02]]) col(g, tx + dx, tz + dz, 0.04, { y: ty + 0.055, r: 0.02, broken: true });
  drums(g, tx + 0.12, tz - 0.02, 4, 0.02, 7, Y(tx + 0.12, tz - 0.02));
  // aqueduct from the Lamos, striding in from the east
  for (let k = 0; k < 2; k++) {
    const x = 0.62 + k * 0.26, z = -0.12 - k * 0.07, y = Y(x, z) - 0.02;
    archWall(g, M.honey, 0.26, 0.2 - k * 0.03, 0.035, [{ x: -0.085, w: 0.06, h: 0.15 - k * 0.03 }, { x: 0, w: 0.06, h: 0.15 - k * 0.03 }, { x: 0.085, w: 0.06, h: 0.15 - k * 0.03 }], x, y, z, 0.27);
  }
  // peninsula (the original island): bath and cistern ruins, breakwater
  const py = Y(0.33, 0.76);
  B(g, M.rubble, 0.1, 0.04, 0.07, 0.31, py - 0.01, 0.74, 0.4); B(g, M.rubble, 0.06, 0.06, 0.02, 0.37, py - 0.01, 0.78, 0.4);
  for (let k = 0; k < 5; k++) B(g, M.concrete, 0.05, 0.03, 0.035, 0.12 - k * 0.045, -0.015, 0.84 + k * 0.012, 0.2 * k);
  // necropolis: gabled house-tombs along the ridge road
  for (let i = 0; i < 9; i++) {
    const x = 0.42 + (i % 5) * 0.105 + (i > 4 ? 0.04 : 0), z = -0.62 + Math.floor(i / 5) * 0.14 + (i % 2) * 0.03;
    if (Math.hypot(x, z) > 0.92) continue;
    const y = Y(x, z) - 0.008, w = 0.055 + (i % 3) * 0.008, ry = 0.2 + i * 0.3;
    B(g, M.limestone, w, 0.05, w * 1.25, x, y, z, ry);
    const roof = put(g, new THREE.CylinderGeometry(w * 0.66, w * 0.66, w * 1.3, 3), M.limestone, x, y + 0.05 + w * 0.33 * 0.5, z, ry);
    roof.rotation.x = Math.PI / 2; roof.scale.y = 1; roof.scale.z = 0.5; roof.position.y = y + 0.05 + w * 0.16;
    B(g, M.dark, w * 0.3, 0.03, 0.004, x + Math.sin(ry) * w * 0.63, y, z + Math.cos(ry) * w * 0.63, ry);
  }
  // lemon groves between temple and baths; olives on the hill
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = -0.66 + i * 0.085, z = -0.02 + j * 0.085; tree(g, 'citrus', x, z, 1, Y(x, z), i + j * 5); }
  scatter(g, ['olive', 'olive', 'shrub', 'pine'], 26, [-0.95, -0.95, 0.95, 0.1], Y, 5, 0.7, 1.2, (x, z) => Math.hypot(x - TH.x, z - TH.z) > TH.r1 + 0.1 && !(x > 0.38 && z < -0.4) && Y(x, z) > 0.03);
  scatter(g, 'shrub', 10, [-0.3, 0.3, 0.9, 0.9], Y, 8, 0.6, 1, (x, z) => Y(x, z) > 0.02);
  for (const [x, z, i] of [[TH.x, TH.z + 0.02, 0], [TH.x + 0.04, TH.z + 0.05, 2], [TH.x - 0.2, TH.z - 0.12, 3], [0.3, 0.2, 4], [-0.1, 0.3, 1], [-0.68, 0.4, 5]]) person(g, x, z, Y(x, z) + (i === 3 ? 0.11 : 0.004), i);
}
