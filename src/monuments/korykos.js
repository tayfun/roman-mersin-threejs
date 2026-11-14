// Corycus (Kızkalesi): the land castle on the shore, built of the Roman city's stones around a Roman gate;
// the sea castle on its islet (both medieval); and the Roman necropolis of sarcophagi and rock tombs inland.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, hill, sm, fbm, archWall, apse, sarcophagus, curtain, cliff, galley, cyl } from './kit.js';

export default function korykos(g) {
  const IX = 0.38, IZ = 0.68;
  const Y = base(g, {
    water: true, dry: 0.6,
    h: (x, z) => {
      const shore = 0.3 + 0.07 * Math.sin(x * 3.3 + 0.6) + fbm(x * 4, 5) * 0.04;
      let y = 0.045 + fbm(x * 2.3 + 4, z * 2.3) * 0.02 + sm(-0.1, -0.9, z) * 0.16 + hill(x, z, 0.55, -0.45, 0.28, 0.1);
      y -= sm(shore - 0.04, shore + 0.2, z) * 0.22;
      return Math.max(y, hill(x, z, IX, IZ, 0.15, 0.06) - 0.022); // the islet
    },
    tint: (x, z, y, s, c, P) => { if (Math.abs(z + 0.02 - 0.06 * Math.sin(x * 3)) < 0.02 && y > 0.02) c.lerp(P.earth, 0.8); },
  });
  // land castle: double circuit, square towers, on the beach
  const cx = -0.38, cz = 0.16, o = [[-0.28, -0.17], [0.0, -0.19], [0.28, -0.17], [0.3, 0.02], [0.28, 0.15], [0.0, 0.17], [-0.28, 0.15], [-0.3, -0.02]].map(([x, z]) => [cx + x, cz + z]);
  curtain(g, M.limestone, o, 0.075, 0.022, { tower: 'square', tr: 0.03, th: 0.11, Y, skip: [2] });
  const inner = [[-0.19, -0.1], [0.19, -0.1], [0.19, 0.08], [-0.19, 0.08]].map(([x, z]) => [cx + x, cz + z]);
  curtain(g, M.honey, inner, 0.1, 0.022, { tower: 'square', tr: 0.032, th: 0.15, Y });
  // the Roman gate re-used in the east wall: a marble arch with its inscription band
  archWall(g, M.marble, 0.15, 0.15, 0.04, [{ x: 0, w: 0.07, h: 0.11 }], cx + 0.29, Y(cx + 0.29, cz - 0.08) - 0.008, cz - 0.08, Math.PI / 2);
  B(g, M.marble, 0.05, 0.016, 0.17, cx + 0.29, Y(cx + 0.29, cz - 0.08) + 0.142, cz - 0.08);
  // spolia in the walls: column drums laid as headers
  for (let k = 0; k < 9; k++) { const d = put(g, new THREE.CylinderGeometry(0.011, 0.011, 0.03, 8), M.marble, cx - 0.24 + k * 0.058, Y(cx, cz + 0.17) + 0.03 + (k % 2) * 0.018, cz + 0.17); d.rotation.x = Math.PI / 2; }
  // chapels inside
  const iy = Y(cx, cz) - 0.006;
  B(g, M.honey, 0.09, 0.06, 0.05, cx - 0.06, iy, cz - 0.02); apse(g, M.honey, 0.022, 0.06, cx - 0.01, iy, cz - 0.02, -Math.PI / 2);
  B(g, M.honey, 0.06, 0.05, 0.04, cx + 0.1, iy, cz + 0.03);
  // sea castle on the islet: eight towers, the keep tallest; medieval
  const sp = []; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.2; sp.push([IX + Math.cos(a) * 0.15, IZ + Math.sin(a) * 0.115]); }
  curtain(g, M.honey, sp, 0.075, 0.022, { tower: 'round', tr: 0.03, th: 0.115, Y: () => 0.03 });
  cyl(g, M.honey, 0.04, 0.043, 0.17, sp[5][0], 0.02, sp[5][1], 14); cyl(g, M.honey, 0.046, 0.046, 0.014, sp[5][0], 0.19, sp[5][1], 14);
  B(g, M.honey, 0.08, 0.05, 0.05, IX, 0.03, IZ);
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; put(g, new THREE.DodecahedronGeometry(0.02 + (k % 3) * 0.008, 0), M.rock, IX + Math.cos(a) * 0.19, 0.0, IZ + Math.sin(a) * 0.15); }
  // necropolis: rock outcrops with cut tomb doors, and the avenue of sarcophagi
  cliff(g, 0.25, 0.9, 0.08, 0.2, -0.52, 4, 0.02, M.rock);
  for (let k = 0; k < 6; k++) B(g, M.dark, 0.022, 0.03, 0.006, 0.34 + k * 0.09, 0.115 + (k % 2) * 0.02, -0.505);
  for (let k = 0; k < 14; k++) {
    const x = -0.75 + k * 0.115, z = -0.1 - 0.06 * Math.sin((x) * 3) + (k % 2 ? -0.075 : 0.07);
    if (Math.hypot(x, z) < 0.93) sarcophagus(g, x, z, Y(x, z) - 0.004, 1.1, 0.2 + (k % 3) * 0.4);
  }
  for (let k = 0; k < 6; k++) { const x = 0.2 + k * 0.1, z = -0.3 - (k % 2) * 0.07; sarcophagus(g, x, z, Y(x, z) - 0.004, 1, k * 0.7, M.rubble); }
  // an early Christian basilica north-east of the castle
  const bx = -0.5, bz = -0.5, by = Y(bx, bz) - 0.008;
  B(g, M.limestone, 0.26, 0.11, 0.018, bx, by, bz - 0.08); B(g, M.limestone, 0.2, 0.06, 0.018, bx - 0.03, by, bz + 0.08); apse(g, M.limestone, 0.06, 0.12, bx + 0.13, by, bz, -Math.PI / 2);
  for (let i = 0; i < 4; i++) col(g, bx - 0.09 + i * 0.055, bz, i % 2 ? 0.1 : 0.03, { y: by, r: 0.009, broken: !(i % 2) });
  rubble(g, bx, bz + 0.16, 6, 0.2, 0.022, M.limestone, 6, Y);
  // a Roman patrol galley, fishing boat, beach
  const ship = galley(M.sail, 0.2); ship.position.set(-0.3, 0.0, 0.72); ship.rotation.y = 0.35; g.add(ship);
  const boat = galley(M.white, 0.09); boat.position.set(0.72, 0.0, 0.42); boat.rotation.y = -0.5; g.add(boat);
  scatter(g, ['olive', 'shrub', 'pine', 'shrub'], 30, [-0.95, -0.95, 0.95, 0.2], Y, 15, 0.7, 1.2, (x, z) => Y(x, z) > 0.05 && Math.abs(z + 0.02 - 0.06 * Math.sin(x * 3)) > 0.13 && !(Math.abs(x - cx) < 0.36 && Math.abs(z - cz) < 0.24) && Math.hypot(x - bx, z - bz) > 0.2 && !(x > 0.15 && z < -0.25 && z > -0.45));
  for (const [x, z] of [[0.1, 0.22], [0.2, 0.2], [0.62, 0.17]]) tree(g, 'palm', x, z, 1, Y(x, z), x * 5);
  for (const [x, z, i] of [[-0.02, 0.27, 0], [0.05, 0.3, 1], [0.3, 0.27, 2], [-0.3, -0.03, 3], [0.2, -0.05, 4], [-0.38, 0.14, 5], [IX, IZ + 0.06, 2]]) person(g, x, z, Math.max(Y(x, z), 0.0) + 0.004, i);
}
