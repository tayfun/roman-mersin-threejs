// Corycus (Kızkalesi). North is -z. The land castle stands at the east end of the beach, built of the Roman city's
// stones around a Roman gate; the sea castle sits on its islet to the south-west (both are medieval).
// Inland: the Roman necropolis — an avenue of sarcophagi and a rock scarp of cut tombs — and early Christian basilicas.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, hill, sm, fbm, ell, archWall, archRing, apse, gable, sarcophagus, curtain, galley, cyl, boulder, vault } from './kit.js';

export default function korykos(g) {
  const IX = -0.36, IZ = 0.58, CX = 0.36, CZ = 0.08, MX = CX + 0.4;
  const shore = (x) => 0.3 + 0.08 * Math.sin(x * 3.0 + 2.2) + fbm(x * 4, 5) * 0.03 - 0.11 * Math.exp(-(((x - IX) / 0.3) ** 2)); // a bay opens behind the islet
  const scarp = (x) => -0.44 - 0.04 * Math.sin(x * 4) - 0.03 * Math.sin(x * 9 + 1); // rock step of the necropolis
  const SH = (x) => 0.06 + fbm(x * 5 + 2, 7) * 0.07; // its height varies along its length
  const moat = (x, z) => Math.abs(x - MX) < 0.075 && z > CZ - 0.3 && z < 0.5;
  const Y = base(g, {
    water: true, dry: 0.65,
    h: (x, z) => {
      let y = 0.045 + fbm(x * 2.3 + 4, z * 2.3) * 0.018 + sm(-0.1, -0.9, z) * 0.05;
      if (x > -0.6 && x < 0.5) y += (SH(x) + fbm(x * 6, z * 6) * 0.02) * sm(scarp(x) + 0.012, scarp(x) - 0.012, z) * sm(-0.6, -0.4, x) * sm(0.5, 0.3, x) * sm(-0.98, -0.7, z);
      y -= sm(shore(x) - 0.05, shore(x) + 0.2, z) * 0.22;
      if (z > CZ - 0.25) y -= (1 - sm(0.022, 0.03, Math.abs(x - MX))) * 0.11; // the moat: a steep-sided rock cut on the landward side, open to the sea
      return Math.max(y, hill(x, z, IX, IZ, 0.175, 0.11) - 0.04 + fbm(x * 14, z * 14) * 0.006); // the islet, all but filled by its castle
    },
    tint: (x, z, y, s, c, P) => {
      c.lerp(P.rock, 0.2);
      if (Math.abs(z + 0.14 - 0.05 * Math.sin(x * 3)) < 0.022 && y > 0.02) c.lerp(P.earth, 0.85); // the tomb avenue
      if (z > shore(x) - 0.16 && y > 0) c.lerp(P.sand, sm(shore(x) - 0.16, shore(x) - 0.06, z)); // the beach
      if (Math.hypot(x - IX, z - IZ) < 0.24 && y > 0) c.copy(P.rock).lerp(P.sand, 0.25);
      if (Math.abs(x - MX) < 0.04 && z > CZ - 0.27 && y < 0.05) c.copy(P.rock);
    },
  });
  const slit = (grp, x, y, z, ry = 0) => B(grp, M.dark, 0.006, 0.026, 0.004, x, y, z, ry);
  // ---- land castle: double circuit of square towers on the sand, walls ragged at the top
  const o = [[-0.29, -0.2], [0.0, -0.21], [0.29, -0.2], [0.3, -0.02], [0.29, 0.17], [0.0, 0.18], [-0.29, 0.17], [-0.3, -0.02]].map(([x, z]) => [CX + x, CZ + z]);
  curtain(g, M.limestone, o, 0.095, 0.024, { tower: 'square', tr: 0.034, th: 0.14, Y, skip: [4] }); // the east half of the sea wall is built below, round the Roman gate
  const inner = [[-0.19, -0.11], [0.19, -0.11], [0.19, 0.08], [-0.19, 0.08]].map(([x, z]) => [CX + x, CZ + z]);
  curtain(g, M.limestone, inner, 0.125, 0.024, { tower: 'square', tr: 0.036, th: 0.185, Y });
  const sy = Y(CX, CZ + 0.18) - 0.008;
  for (let k = 0; k < 3; k++) slit(g, CX - 0.24 + k * 0.085, sy + 0.07, CZ + 0.188);
  for (const [x, z] of [o[4], o[6], inner[2], inner[3]]) slit(g, x, Y(x, z) + 0.07, z + 0.036);
  // the south (sea) curtain in two stretches either side of the Roman gate, with column drums built in as headers
  B(g, M.limestone, 0.075, 0.07, 0.024, CX + 0.245, sy, CZ + 0.176); B(g, M.limestone, 0.06, 0.07, 0.024, CX + 0.035, sy, CZ + 0.178);
  for (let j = 0; j < 2; j++) for (let k = 0; k < 7; k++) { const d = put(g, new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10), M.grey, CX - 0.26 + k * 0.034 + j * 0.017, sy + 0.035 + j * 0.024, CZ + 0.186); d.rotation.x = Math.PI / 2; } // column drums laid as headers in the wall face
  for (let k = 0; k < 3; k++) { const d = put(g, new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10), M.grey, o[6][0] - 0.012 + k * 0.012, sy + 0.05 + (k % 2) * 0.02, o[6][1] + 0.036); d.rotation.x = Math.PI / 2; }
  // ---- the Roman gate, re-used in the wall: voussoired arch between pilasters, cornice and inscription panel
  const gg = new THREE.Group(); gg.position.set(CX + 0.14, sy, CZ + 0.178); gg.scale.setScalar(1.25); g.add(gg);
  archWall(gg, M.honey, 0.13, 0.115, 0.045, [{ x: 0, w: 0.06, h: 0.085 }], 0, 0, 0);
  B(gg, M.dark, 0.058, 0.082, 0.004, 0, 0, -0.018); // the dark passage behind the arch
  archRing(gg, M.marble, 0.06, 0.085, 0.008, 0, 0, 0.024, 0, 9);
  for (const s of [-1, 1]) B(gg, M.marble, 0.014, 0.1, 0.008, s * 0.056, 0, 0.024);
  B(gg, M.weathered, 0.14, 0.008, 0.036, 0, 0.115, 0.004); B(gg, M.weathered, 0.07, 0.012, 0.004, 0, 0.098, 0.0245);
  for (let k = 0; k < 3; k++) B(gg, M.dark, 0.06, 0.0012, 0.001, 0, 0.1005 + k * 0.0035, 0.027); // lines of the inscription
  // chapels inside, and the mole that once ran out toward the island
  const iy = Y(CX, CZ) - 0.006;
  for (const [x, z, w] of [[-0.07, -0.03, 0.08], [0.09, 0.02, 0.06]]) { B(g, M.limestone, w, 0.05, 0.045, CX + x, iy, CZ + z); gable(g, M.tiles, 0.05, w + 0.008, 0.016, CX + x, iy + 0.05, CZ + z, Math.PI / 2); apse(g, M.limestone, 0.02, 0.05, CX + x + w / 2, iy, CZ + z, -Math.PI / 2); }
  for (let k = 0; k < 7; k++) { const t = (k + 1) / 11, x0 = CX - 0.3, z0 = shore(x0) + 0.03, x = x0 + (IX + 0.2 - x0) * t, z = z0 + (IZ - 0.06 - z0) * t; boulder(g, x, k > 3 ? -0.014 : -0.004, z, 0.018 + (k % 3) * 0.006, k, M.karstFlat); } // the old mole: broken, half drowned, stopping short of the island
  // ---- sea castle on the islet: straight south and west walls, a curved rampart to the north-east; eight unlike towers
  const SW = [IX - 0.13, IZ + 0.13], R = 0.26, sea = [], yI = 0.028;
  const pts = [SW, [SW[0] + R / 2, SW[1]], [SW[0] + R, SW[1]]]; for (let k = 1; k <= 4; k++) { const a = -k * Math.PI / 8; pts.push([SW[0] + Math.cos(a) * R, SW[1] + Math.sin(a) * R]); } pts.push([SW[0], SW[1] - R * 0.5]);
  curtain(g, M.honey, pts, 0.08, 0.024, { tower: false, Y: () => yI + 0.01 });
  pts.forEach(([x, z], k) => {
    const hh = [0.12, 0.1, 0.18, 0.11, 0.12, 0.1, 0.145, 0.11][k];
    if (k < 3) { B(g, M.honey, 0.064, hh, 0.064, x, yI, z); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1], [1, 0], [-1, 0]]) B(g, M.honey, 0.012, 0.008, 0.012, x + sx * 0.026, yI + hh, z + sz * 0.026); slit(g, x, yI + hh * 0.6, z + 0.033); }
    else { cyl(g, M.honey, 0.032, 0.035, hh, x, yI, z, 14); for (let m = 0; m < 8; m++) { const a = m / 8 * 6.283; B(g, M.honey, 0.011, 0.008, 0.008, x + Math.cos(a) * 0.028, yI + hh, z + Math.sin(a) * 0.028, -a + Math.PI / 2); } }
  });
  archWall(g, M.honey, 0.07, 0.08, 0.026, [{ x: 0, w: 0.03, h: 0.05 }], (pts[5][0] + pts[6][0]) / 2, yI, (pts[5][1] + pts[6][1]) / 2, Math.PI * 0.1); // gate on the landward side
  vault(g, M.honeyDS, 0.04, 0.07, 0.028, IX - 0.02, yI + 0.012, IZ + 0.02, 0.4, 2); // chapel inside
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; const bxx = IX + Math.cos(a) * 0.215, bzz = IZ + Math.sin(a) * 0.2; if (Math.hypot(bxx, bzz) < 0.9) put(g, new THREE.DodecahedronGeometry(0.016 + (k % 3) * 0.007, 0), M.karstFlat, bxx, 0.0, bzz); }
  // ---- necropolis: a rock scarp with cut tomb fronts and a warrior relief, and the avenue of sarcophagi below it
  const cpos = [], cuv = [], cidx = [], NX = 60, X0 = -0.52, X1 = 0.42;
  for (let j = 0; j <= 4; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i * (X1 - X0) / NX, yb = Y(x, scarp(x) + 0.05) - 0.012, yt = yb + (Y(x, scarp(x) - 0.03) + 0.004 - yb) * Math.min(1, i / 8, (NX - i) / 8); cpos.push(x, yb + (yt - yb) * j / 4, scarp(x) + 0.018 + (fbm(x * 9, j * 2) - 0.5) * 0.036 - j * 0.005 - (1 - Math.min(1, i / 8, (NX - i) / 8)) * 0.02); cuv.push(x * 1.3, j * 0.04); }
  for (let j = 0; j < 4; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i; cidx.push(a, a + 1, a + NX + 1, a + 1, a + NX + 2, a + NX + 1); }
  const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3)); cgeo.setAttribute('uv', new THREE.Float32BufferAttribute(cuv, 2)); cgeo.setIndex(cidx); cgeo.computeVertexNormals(); put(g, cgeo, M.karst);
  [[-0.4, 0.024, 0.032], [-0.29, 0.03, 0.04], [-0.2, 0.02, 0.03], [0.02, 0.034, 0.044], [0.12, 0.022, 0.032], [0.27, 0.028, 0.038]].forEach(([x, w, hh], k) => { // rock-cut chamber mouths, each different
    const z = scarp(x) + 0.021, y = Y(x, z + 0.04) + 0.004 + (k % 2) * 0.012;
    B(g, M.dark, w, hh, 0.004, x, y, z); B(g, M.karstFlat, w + 0.012, 0.005, 0.008, x, y + hh, z + 0.002);
    if (k % 3 === 1) { const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.008, 0); sh.lineTo(w / 2 + 0.008, 0); sh.lineTo(0, 0.014); sh.closePath(); put(g, new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }), M.karstFlat, x, y + hh + 0.005, z - 0.001); }
  });
  { const x = -0.09, z = scarp(x) + 0.022, y = Y(x, z + 0.04) + 0.008; // the armed warrior, sword raised, in an arched niche
    B(g, M.karstDark, 0.05, 0.06, 0.003, x, y, z); const arc = put(g, new THREE.TorusGeometry(0.025, 0.004, 4, 10, Math.PI), M.karstFlat, x, y + 0.06, z + 0.002);
    const f = put(g, new THREE.CapsuleGeometry(0.008, 0.026, 3, 8), M.relief, x, y + 0.024, z + 0.004); f.scale.z = 0.5; put(g, new THREE.SphereGeometry(0.007, 8, 6), M.relief, x, y + 0.05, z + 0.004).scale.z = 0.6;
    const arm = B(g, M.relief, 0.004, 0.02, 0.003, x + 0.011, y + 0.038, z + 0.004); arm.rotation.z = -0.7; const sword = B(g, M.relief, 0.003, 0.026, 0.002, x + 0.02, y + 0.05, z + 0.004); sword.rotation.z = 0.3; }
  for (let k = 0; k < 12; k++) { const x = X0 + 0.04 + k * 0.078, z = scarp(x) + 0.05 + (k % 3) * 0.012; boulder(g, x, Y(x, z) + 0.004, z, 0.014 + (k % 4) * 0.006, k, M.karstFlat); } // talus
  for (const x of [X0 + 0.01, X1 - 0.01]) boulder(g, x, Y(x, scarp(x) + 0.03) + 0.015, scarp(x) + 0.02, 0.045, x * 9, M.karstFlat); // a block closing each end
  for (let k = 0; k < 9; k++) { const x = X0 + 0.09 + k * 0.092; B(g, M.karstFlat, 0.06 + (k % 3) * 0.02, 0.006, 0.022, x, Y(x, scarp(x) + 0.05) + 0.03 + (k % 3) * 0.018, scarp(x) + 0.012, (k % 2 ? 0.05 : -0.05)); } // bedding ledges: thin slabs half embedded in the face
  let n = 0;
  for (let k = 0; k < 15; k++) for (const s of [-1, 1]) {
    const x = -0.82 + k * 0.118 + (s > 0 ? 0.05 : 0), z = -0.14 + 0.05 * Math.sin(x * 3) + s * (0.06 + (k % 3) * 0.012); n++;
    if (Math.hypot(x, z) > 0.93 || (Math.abs(x - CX) < 0.43 && z > CZ - 0.3) || moat(x, z)) continue;
    const sg = sarcophagus(g, x, z, Y(x, z) - 0.004, 0.8, (n % 4) * 0.25 - 0.3 + (s > 0 ? 0 : Math.PI));
    if (n % 5 === 0) sg.children[2].rotation.z = 0.5, sg.children[2].position.x = 0.02; // a lid prised off
  }
  // ---- early Christian basilicas north-east of the castle: three aisles, standing apse, one tall arcaded wall
  const bx = 0.64, bz = -0.47, by = Y(bx, bz) - 0.008, bg = new THREE.Group(); bg.position.set(bx, by, bz); bg.rotation.y = 0.1; bg.scale.setScalar(0.85); g.add(bg);
  archWall(bg, M.limestone, 0.3, 0.13, 0.018, [-0.1, -0.035, 0.03, 0.095].map((x) => ({ x, w: 0.03, h: 0.1, sill: 0.05 })), 0, 0, -0.09);
  B(bg, M.limestone, 0.22, 0.05, 0.018, -0.04, 0, 0.09); B(bg, M.limestone, 0.018, 0.07, 0.18, -0.15, 0, 0);
  apse(bg, M.limestone, 0.05, 0.11, 0.15, 0, 0, -Math.PI / 2); put(bg, new THREE.SphereGeometry(0.05, 12, 8, 0, Math.PI, 0, Math.PI / 2), M.limestoneDS, 0.15, 0.11, 0);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) col(bg, -0.11 + i * 0.05, s * 0.035, (i + (s > 0 ? 1 : 0)) % 3 === 0 ? 0.09 : 0.025, { r: 0.007, broken: (i + (s > 0 ? 1 : 0)) % 3 !== 0, shaft: M.weathered });
  rubble(bg, 0, 0.15, 6, 0.2, 0.018, M.limestone, 6);
  const b2 = new THREE.Group(); b2.position.set(0.76, Y(0.76, -0.24) - 0.008, -0.24); b2.rotation.y = -0.1; g.add(b2);
  apse(b2, M.limestone, 0.04, 0.09, 0.07, 0, 0, -Math.PI / 2); B(b2, M.limestone, 0.14, 0.05, 0.014, 0, 0, -0.045); B(b2, M.limestone, 0.1, 0.03, 0.014, -0.02, 0, 0.045);
  // ---- a Roman patrol galley and a fishing boat; low maquis, a few olives
  const ship = galley(M.sail, 0.13); ship.position.set(0.26, 0.0, 0.72); ship.rotation.y = 0.35; g.add(ship);
  const boat = galley(M.white, 0.075); boat.position.set(-0.72, 0.0, 0.46); boat.rotation.y = -0.5; g.add(boat);
  scatter(g, ['shrub', 'shrub', 'olive', 'oak'], 26, [-0.95, -0.95, 0.95, 0.2], Y, 15, 0.55, 0.8, (x, z) => Y(x, z) > 0.05 && Math.abs(z + 0.14 - 0.05 * Math.sin(x * 3)) > 0.13 && !(Math.abs(x - CX) < 0.42 && Math.abs(z - CZ) < 0.3) && Math.hypot(x - bx, z - bz) > 0.24 && !(x > -0.56 && x < 0.46 && z < scarp(x) + 0.12 && z > scarp(x) - 0.03));
  tree(g, 'palm', -0.2, 0.2, 0.9, Y(-0.2, 0.2), 3);
  for (const [x, z, i] of [[-0.3, 0.27, 0], [-0.22, 0.3, 1], [-0.5, 0.25, 2], [-0.3, -0.13, 3], [0.0, -0.12, 4], [CX + 0.14, CZ + 0.24, 5], [IX + 0.02, IZ - 0.02, 2], [-0.2, scarp(-0.2) + 0.07, 1]]) person(g, x, z, Math.max(Y(x, z), 0.0) + 0.004, i, 0.9);
}
