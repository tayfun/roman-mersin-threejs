// Diocaesarea (Uzuncaburç): Temple of Zeus Olbios, the colonnaded street with its ceremonial gate,
// the Tyche temple at its west end, the three-arched north gate, the tall tower and the theatre.
import * as THREE from 'three';
import { M, B, put, col, beam, drums, rubble, tree, scatter, person, base, hill, sm, fbm, archWall, house, cavea, apse } from './kit.js';

export default function diocaesarea(g) {
  const TH = { x: 0.66, z: 0.3, r0: 0.07, r1: 0.24, rows: 8, y: 0.06 }, top = (TH.r1 - TH.r0) * 0.62;
  const Y = base(g, {
    dry: 0.25,
    h: (x, z) => {
      let y = 0.07 + fbm(x * 2.2 + 3, z * 2.2) * 0.035 + hill(x, z, 0.75, 0.45, 0.3, 0.2) + hill(x, z, -0.7, 0.7, 0.3, 0.08);
      const d = Math.hypot(x - TH.x, z - TH.z);
      if (d < TH.r1 + 0.04) y = Math.min(y, TH.y - 0.01 + Math.max(0, (d - TH.r0) / (TH.r1 - TH.r0)) * top);
      return y;
    },
    tint: (x, z, y, s, c, P) => { if ((Math.abs(z + 0.12) < 0.03 && x > -0.8 && x < 0.85) || (Math.abs(x - 0.02) < 0.028 && z < -0.12 && z > -0.9)) c.lerp(P.earth, 0.85); },
  });
  const SZ = -0.12; // street axis
  // colonnaded street paving
  B(g, M.paving, 1.5, 0.008, 0.06, 0.0, Y(0, SZ) - 0.004, SZ);
  // Temple of Zeus Olbios: 6 x 12 Corinthian peripteros, thirty-odd columns standing, no roof
  const tx = -0.2, tz = 0.22, ty = Y(tx, tz) - 0.01, tg = new THREE.Group(); tg.position.set(tx, ty, tz); g.add(tg);
  const W = 0.66, D = 0.3, sx = W / 11, sz = D / 5, H = 0.36;
  B(tg, M.limestone, W + 0.09, 0.02, D + 0.09, 0, 0, 0); B(tg, M.limestone, W + 0.06, 0.02, D + 0.06, 0, 0.02, 0); B(tg, M.marble, W + 0.03, 0.02, D + 0.03, 0, 0.04, 0);
  const down = new Set(['0-5', '4-0', '5-0', '11-2', '9-5']);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
    if (i > 0 && i < 11 && j > 0 && j < 5) continue;
    const x = -W / 2 + i * sx, z = -D / 2 + j * sz, up = !down.has(i + '-' + j), capless = (i * 5 + j * 3) % 4 === 0;
    col(tg, x, z, up ? (capless ? H * 0.9 : H) : 0.06, { y: 0.06, r: 0.019, broken: !up || capless, seed: i + j });
  }
  for (const [a, b, j] of [[1, 3, 0], [6, 8, 0], [1, 4, 5], [6, 8, 5]]) beam(tg, -W / 2 + a * sx, -D / 2 + j * sz, -W / 2 + b * sx, -D / 2 + j * sz, 0.06 + H, 0.05, 0.035);
  // the 5th-century church built inside: apse at the east end, wall between the columns
  apse(tg, M.rubble, 0.085, 0.16, W / 2 - 0.1, 0.06, 0, -Math.PI / 2);
  B(tg, M.rubble, W * 0.6, 0.07, 0.016, -0.05, 0.06, -D / 2 + sz * 0.6); B(tg, M.rubble, W * 0.5, 0.05, 0.016, -0.1, 0.06, D / 2 - sz * 0.6);
  drums(tg, -0.05, 0.25, 5, 0.019, 3, 0); rubble(tg, 0.3, 0.26, 6, 0.2, 0.028, M.marble, 5);
  // ceremonial gate across the street: five tall columns with statue consoles, architrave over two bays
  const gx = 0.42, gyy = Y(gx, SZ) - 0.006;
  for (let i = 0; i < 6; i++) { const z = SZ - 0.19 + i * 0.076, up = i !== 3; col(g, gx, z, up ? 0.4 : 0.07, { y: gyy, r: 0.02, broken: !up, bracket: up ? 1 : 0, seed: i }); }
  beam(g, gx, SZ - 0.19, gx, SZ - 0.114, gyy + 0.4, 0.05, 0.036); beam(g, gx, SZ + 0.114, gx, SZ + 0.19, gyy + 0.4, 0.05, 0.036);
  // Temple of Tyche at the west end: five columns with their architrave, on a podium; cella set back
  const yx = -0.8, yy = Y(yx, SZ) - 0.008;
  B(g, M.limestone, 0.1, 0.03, 0.36, yx, yy, SZ);
  for (let i = 0; i < 6; i++) if (i !== 4) col(g, yx, SZ - 0.15 + i * 0.06, 0.34, { y: yy + 0.03, r: 0.018, shaft: M.granite });
  beam(g, yx, SZ - 0.15, yx, SZ + 0.03, yy + 0.37, 0.045, 0.034);
  B(g, M.limestone, 0.1, 0.07, 0.1, yx - 0.02, Y(yx, SZ - 0.3), SZ - 0.3);
  // north gate: three arches, the middle one larger
  const nx = 0.02, nz = -0.58, ny = Y(nx, nz) - 0.008;
  archWall(g, M.limestone, 0.4, 0.26, 0.06, [{ x: -0.13, w: 0.07, h: 0.13 }, { x: 0, w: 0.11, h: 0.19 }, { x: 0.13, w: 0.07, h: 0.13 }], nx, ny, nz);
  B(g, M.limestone, 0.43, 0.02, 0.075, nx, ny + 0.26, nz);
  for (const s of [-1, 1]) B(g, M.rubble, 0.16, 0.08 + s * 0.02, 0.03, nx + s * 0.29, ny, nz);
  // the "tall tower" that names the village: Hellenistic, in close-fitting ashlar
  const ox = 0.6, oz = -0.62, oy = Y(ox, oz) - 0.008;
  B(g, M.honey, 0.13, 0.5, 0.11, ox, oy, oz, 0.2);
  for (let k = 1; k < 5; k++) B(g, M.limestone, 0.14, 0.008, 0.12, ox, oy + k * 0.1, oz, 0.2);
  for (let k = 0; k < 4; k++) B(g, M.dark, 0.016, 0.03, 0.004, ox + 0.012 + Math.sin(0.2) * 0.056, oy + 0.15 + k * 0.1, oz + Math.cos(0.2) * 0.056, 0.2);
  B(g, M.dark, 0.03, 0.05, 0.004, ox + 0.011, oy, oz + 0.055, 0.2);
  for (const [sx2, sz2] of [[-1, -1], [1, -1], [1, 1]]) B(g, M.honey, 0.03, 0.03, 0.03, ox + sx2 * 0.045, oy + 0.5, oz + sz2 * 0.038, 0.2); // ragged top
  // theatre in a hollow (reign of Marcus Aurelius and Lucius Verus), opening north-west toward the street
  cavea(g, { ...TH, arc: Math.PI * 1.02, stairs: 4, ry: Math.PI * 0.9 });
  B(g, M.rubble, 0.3, 0.04, 0.03, TH.x - 0.03, TH.y - 0.01, TH.z - 0.12, -0.3);
  // village houses among the ruins, and the upland pines
  for (const [x, z, r] of [[-0.45, -0.5, 0.2], [-0.62, -0.38, -0.3], [-0.3, -0.72, 0.1], [0.25, 0.72, 0.3], [-0.1, 0.72, -0.1]]) house(g, x, z, Y(x, z) - 0.005, 0.11, 0.12, 0.075, r, M.limestone);
  scatter(g, ['pine', 'pine', 'pine', 'shrub'], 34, [-0.95, -0.95, 0.95, 0.95], Y, 7, 0.9, 1.4, (x, z) => Math.abs(z - SZ) > 0.09 && !(Math.abs(x - tx) < 0.45 && Math.abs(z - tz) < 0.28) && Math.hypot(x - TH.x, z - TH.z) > 0.31 && Math.hypot(x - nx, z - nz) > 0.28 && Math.hypot(x - ox, z - oz) > 0.14 && Math.abs(x - 0.02) > 0.07);
  for (const [x, z, i] of [[0.1, SZ, 0], [0.15, SZ + 0.02, 1], [0.38, SZ - 0.02, 2], [-0.25, 0.47, 3], [-0.6, SZ, 4], [0.02, -0.5, 5], [0.62, 0.27, 2]]) person(g, x, z, Y(x, z) + 0.002, i);
}
