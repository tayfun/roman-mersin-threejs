// Anemurium: a roofless Roman town on the east-facing slope of the cape — theatre and odeon face to face,
// the great bath with its mosaic palaestra, the sea wall, and a hillside of vaulted house-tombs.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, hill, sm, fbm, archWall, vault, cavea, apse, curtain } from './kit.js';

export default function anemurium(g) {
  const TH = { x: -0.42, z: 0.0, r0: 0.08, r1: 0.27, rows: 9, y: 0.2 }, top = (TH.r1 - TH.r0) * 0.62;
  const Y = base(g, {
    water: true, dry: 0.7,
    h: (x, z) => {
      const shore = 0.6 + 0.07 * Math.sin(z * 3.1 + 1) + fbm(z * 4, 3) * 0.05;
      let y = 0.035 + sm(0.35, -1.0, x) * 0.5 + fbm(x * 2.4, z * 2.4 + 8) * 0.03;
      y += hill(x, z, 0.1, 0.92, 0.36, 0.34); // the cape and its citadel
      y -= sm(shore - 0.05, shore + 0.2, x) * 0.22;
      const d = Math.hypot(x - TH.x, z - TH.z);
      if (d < TH.r1 + 0.04) y = Math.min(y, TH.y - 0.01 + Math.max(0, (d - TH.r0) / (TH.r1 - TH.r0)) * top);
      return y;
    },
    tint: (x, z, y, s, c, P) => { if (Math.abs(x - 0.33) < 0.02 && z > -0.9 && z < 0.5 && y > 0.02) c.lerp(P.earth, 0.8); },
  });
  // theatre on the slope, opening east toward the sea
  cavea(g, { ...TH, arc: Math.PI * 1.05, stairs: 4, ry: Math.PI / 2, material: M.limestone });
  B(g, M.rubble, 0.03, 0.05, 0.4, TH.x + 0.13, TH.y - 0.02, TH.z);
  // odeon / bouleuterion facing it: a small roofed hall, its shell still standing
  const ox = -0.1, oz = 0.0, oy = Y(ox, oz) - 0.006, og = new THREE.Group(); og.position.set(ox, oy, oz); g.add(og);
  cavea(og, { r0: 0.04, r1: 0.12, rows: 6, arc: Math.PI, stairs: 3, ry: -Math.PI / 2, material: M.limestone });
  for (const [x, z, w, d, hh] of [[0.13, 0, 0.022, 0.32, 0.17], [-0.0, -0.16, 0.28, 0.022, 0.15], [-0.0, 0.16, 0.28, 0.022, 0.13]]) B(og, M.rubble, w, hh, d, x, 0, z);
  archWall(og, M.rubble, 0.32, 0.14, 0.022, [{ x: -0.09, w: 0.05, h: 0.09 }, { x: 0, w: 0.05, h: 0.09 }, { x: 0.09, w: 0.05, h: 0.09 }], -0.14, 0, 0, Math.PI / 2);
  put(og, new THREE.PlaneGeometry(0.07, 0.07), M.mosaic, -0.06, 0.007, 0).rotation.x = -Math.PI / 2;
  // the great bath (III 2 B): three tall vaulted halls and the palaestra with its mosaic floor
  const bx = 0.12, bz = 0.36, by = Y(bx, bz) - 0.008;
  for (let k = 0; k < 3; k++) vault(g, M.rubbleDS, 0.1, 0.26 - k * 0.03, 0.15, bx - 0.11 + k * 0.105, by, bz + k * 0.012, Math.PI / 2 * 0, k === 1 ? 1 : 1);
  B(g, M.rubble, 0.34, 0.2, 0.025, bx, by, bz - 0.15);
  const py = Y(bx + 0.02, bz - 0.33) - 0.004;
  put(g, new THREE.PlaneGeometry(0.26, 0.2), M.mosaic, bx + 0.02, py + 0.008, bz - 0.3).rotation.x = -Math.PI / 2;
  for (const [x, z, w, d] of [[0, -0.105, 0.3, 0.014], [-0.145, 0, 0.014, 0.21], [0.145, 0, 0.014, 0.21]]) B(g, M.rubble, w, 0.035, d, bx + 0.02 + x, py, bz - 0.3 + z);
  for (let i = 0; i < 5; i++) col(g, bx - 0.09 + i * 0.055, bz - 0.2, i === 2 ? 0.14 : 0.03, { y: py, r: 0.011, broken: i !== 2 });
  // shore: sea wall, a small beach bath, an early church
  for (let k = 0; k < 7; k++) { const z = -0.55 + k * 0.17, x = 0.54 + 0.07 * Math.sin(z * 3.1 + 1); B(g, M.rubble, 0.02, 0.05 + (k % 2) * 0.02, 0.15, x, Y(x, z) - 0.01, z, 0.2 * Math.cos(z * 3.1 + 1)); }
  vault(g, M.rubbleDS, 0.075, 0.13, 0.07, 0.42, Y(0.42, -0.25) - 0.006, -0.25, Math.PI / 2); vault(g, M.rubbleDS, 0.065, 0.11, 0.06, 0.42, Y(0.42, -0.17) - 0.006, -0.17, Math.PI / 2, 0);
  const cx = 0.38, cz = 0.12, cy = Y(cx, cz) - 0.006;
  apse(g, M.rubble, 0.045, 0.09, cx + 0.07, cy, cz, -Math.PI / 2); B(g, M.rubble, 0.16, 0.05, 0.014, cx - 0.01, cy, cz - 0.047); B(g, M.rubble, 0.16, 0.035, 0.014, cx - 0.01, cy, cz + 0.047);
  // city wall climbing the slope, dividing the town from the city of the dead
  const wp = []; for (let k = 0; k <= 6; k++) { const x = 0.5 - k * 0.22; wp.push([x, -0.4 - 0.03 * Math.sin(k * 1.3)]); }
  curtain(g, M.rubble, wp, 0.06, 0.02, { closed: false, tower: 'square', tr: 0.024, th: 0.085, Y });
  // necropolis: barrel-vaulted house tombs, some with a forecourt or an upper storey
  let n = 0;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++, n++) {
    const x = -0.8 + i * 0.165 + (j % 2) * 0.07 + Math.sin(n * 3.3) * 0.02, z = -0.52 - j * 0.105 - Math.cos(n * 2.1) * 0.015;
    if (Math.hypot(x, z) > 0.93 || x > 0.5) continue;
    const y = Y(x, z) - 0.008, w = 0.05 + (n % 3) * 0.008;
    vault(g, n % 4 === 0 ? M.limestoneDS : M.rubbleDS, w, w * 1.3, 0.03 + (n % 5 === 0 ? 0.03 : 0), x, y, z, Math.PI / 2 + 0.2 * Math.sin(n), 1);
    if (n % 3 === 0) B(g, M.rubble, 0.012, 0.022, w * 1.2, x + w * 1.1, Y(x + w, z) - 0.008, z);
  }
  // citadel on the cape
  const cp = [[-0.08, 0.72], [0.1, 0.66], [0.28, 0.76], [0.26, 0.92], [0.0, 0.93]].filter(([x, z]) => Math.hypot(x, z) < 0.97);
  curtain(g, M.rubble, cp, 0.06, 0.02, { tower: 'square', tr: 0.028, th: 0.1, Y });
  // aqueduct channel contouring the upper slope
  for (let k = 0; k < 9; k++) { const z = -0.38 + k * 0.1, x = -0.78 + 0.03 * Math.sin(k); if (Math.hypot(x, z) < 0.93) B(g, M.rubble, 0.016, 0.03, 0.09, x, Y(x, z) - 0.004, z, 0.1 * Math.cos(k)); }
  rubble(g, 0.2, 0.05, 10, 0.5, 0.025, M.rubble, 5, Y);
  scatter(g, ['shrub', 'shrub', 'olive'], 40, [-0.95, -0.95, 0.5, 0.95], Y, 9, 0.7, 1.1, (x, z) => Y(x, z) > 0.04 && Math.hypot(x - TH.x, z - TH.z) > 0.32 && Math.hypot(x - ox, z - oz) > 0.2 && !(Math.abs(x - bx) < 0.24 && Math.abs(z - 0.2) < 0.36) && z > -0.42);
  for (const [x, z, i] of [[-0.3, 0.0, 0], [-0.26, 0.04, 1], [0.14, 0.08, 2], [0.33, -0.1, 3], [0.33, 0.3, 4], [-0.2, -0.6, 5], [0.56, 0.3, 2]]) person(g, x, z, Y(x, z) + 0.004, i);
}
