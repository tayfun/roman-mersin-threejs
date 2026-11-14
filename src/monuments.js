import * as THREE from 'three';

// Stylised miniature dioramas of each site. They are deliberately "museum model" pieces:
// recognisable silhouettes built from what actually stands on the ground, not to scale.
// Each fits roughly inside a disc of radius 1.

const M = {
  marble: new THREE.MeshStandardMaterial({ color: 0xf4ecd9, roughness: 0.6 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xcdb98f, roughness: 0.85 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x8f7d5e, roughness: 0.9 }),
  rock: new THREE.MeshStandardMaterial({ color: 0xa8957a, roughness: 1, flatShading: true }),
  redrock: new THREE.MeshStandardMaterial({ color: 0xa5674a, roughness: 1, flatShading: true, side: THREE.DoubleSide }),
  earth: new THREE.MeshStandardMaterial({ color: 0xb9a871, roughness: 1 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x6f8a45, roughness: 1 }),
  tree: new THREE.MeshStandardMaterial({ color: 0x3f6a36, roughness: 1, flatShading: true }),
  sea: new THREE.MeshStandardMaterial({ color: 0x2f8fa6, roughness: 0.25, metalness: 0.1 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0xb98a3c, roughness: 0.35, metalness: 0.8 }),
  shadow: new THREE.MeshStandardMaterial({ color: 0x2c2218, roughness: 1 }),
  roof: new THREE.MeshStandardMaterial({ color: 0xb9603f, roughness: 0.8 }),
};

const add = (g, geo, mat, x = 0, y = 0, z = 0, ry = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = true;
  g.add(m); return m;
};
const box = (g, mat, w, h, d, x, y, z, ry) => add(g, new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, ry);

const shaftGeo = new THREE.CylinderGeometry(0.036, 0.044, 1, 10);
const capGeo = new THREE.CylinderGeometry(0.07, 0.04, 0.07, 8);
function column(g, x, z, h = 0.5, { broken = false, y = 0, mat = M.marble } = {}) {
  const s = add(g, shaftGeo, mat, x, y + h / 2, z);
  s.scale.set(1, h, 1);
  if (!broken) add(g, capGeo, mat, x, y + h + 0.035, z);
  box(g, mat, 0.11, 0.03, 0.11, x, y, z);
}

function archGeo(w, h, d, span, rise) {
  // wall with a round-headed opening, extruded along z
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  const o = new THREE.Path();
  o.moveTo(-span / 2, 0); o.lineTo(-span / 2, rise - span / 2);
  o.absarc(0, rise - span / 2, span / 2, Math.PI, 0, true);
  o.lineTo(span / 2, 0); o.closePath();
  s.holes.push(o);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -d / 2);
  return geo;
}

function cavea(g, r0, r1, rows, arc, mat = M.stone) {
  // stepped seating: a lathe of a staircase profile
  const pts = [new THREE.Vector2(r0, 0)];
  const dr = (r1 - r0) / rows, dy = dr * 0.72;
  for (let i = 0; i < rows; i++) {
    pts.push(new THREE.Vector2(r0 + i * dr, (i + 1) * dy), new THREE.Vector2(r0 + (i + 1) * dr, (i + 1) * dy));
  }
  pts.push(new THREE.Vector2(r1 + 0.03, rows * dy), new THREE.Vector2(r1 + 0.03, 0));
  const geo = new THREE.LatheGeometry(pts, 36, -arc / 2 - Math.PI / 2, arc);
  const m = new THREE.Mesh(geo, mat.clone());
  m.material.side = THREE.DoubleSide;
  m.castShadow = true;
  g.add(m);
  // orchestra floor
  const orch = add(g, new THREE.CircleGeometry(r0, 28), M.marble, 0, 0.012, 0);
  orch.rotation.x = -Math.PI / 2;
  return m;
}

function tree(g, x, z, s = 1) {
  return add(g, new THREE.ConeGeometry(0.07 * s, 0.22 * s, 6), M.tree, x, 0.13 * s, z);
}
function cypress(g, x, z, s = 1) {
  return add(g, new THREE.ConeGeometry(0.035 * s, 0.3 * s, 6), M.tree, x, 0.16 * s, z);
}
function rocks(g, n, r, seed = 1, mat = M.rock) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed, rr = r * (0.92 + 0.12 * Math.sin(i * 7.3 + seed));
    const m = add(g, new THREE.DodecahedronGeometry(0.06 + 0.035 * Math.abs(Math.sin(i * 3.1 + seed)), 0), mat, Math.cos(a) * rr, 0.03, Math.sin(a) * rr);
    m.rotation.set(i, i * 2, i * 3);
  }
}

function seaSegment(g, zCut) {
  // the part of the plinth top lying seaward (z > zCut)
  const r = 0.985, a0 = Math.asin(zCut / r);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, r, Math.PI + a0, 2 * Math.PI - a0, false);
  sh.closePath();
  const m = add(g, new THREE.ShapeGeometry(sh, 32), M.sea, 0, 0.012, 0);
  m.rotation.x = -Math.PI / 2; m.castShadow = false;
  return m;
}

function waterBand(g, c0, c1, alongX = true) {
  // a river crossing the plinth: the strip c0 < z < c1 (or x, if !alongX) clipped to the disc
  const r = 0.985, pts = [];
  const a0 = Math.asin(c0 / r), a1 = Math.asin(c1 / r);
  for (let k = 0; k <= 8; k++) { const a = a0 + (a1 - a0) * (k / 8); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let k = 0; k <= 8; k++) { const a = Math.PI - a1 + (a1 - a0) * (k / 8); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const sh = new THREE.Shape(pts.map(([u, v]) => (alongX ? new THREE.Vector2(u, -v) : new THREE.Vector2(v, -u))));
  const m = add(g, new THREE.ShapeGeometry(sh), M.sea, 0, 0.012, 0);
  m.rotation.x = -Math.PI / 2; m.castShadow = false;
  return m;
}

function plinth(g, top = M.earth, h = 0.1) {
  add(g, new THREE.CylinderGeometry(1.0, 1.06, h, 48), top, 0, -h / 2, 0).castShadow = false;
  add(g, new THREE.TorusGeometry(1.03, 0.035, 8, 64), M.bronze, 0, -0.01, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(1.08, 1.12, 0.3, 48), M.shadow, 0, -h - 0.15, 0);
}

function sinkholePlinth(g, rx, rz, depth) {
  // a raised drum with a real pit cut into it
  const H = depth + 0.06;
  const pts = [
    new THREE.Vector2(0.001, -H + 0.02), new THREE.Vector2(0.78, -H + 0.02), new THREE.Vector2(0.96, -H * 0.55),
    new THREE.Vector2(0.9, -H * 0.2), new THREE.Vector2(1.0, 0),
  ];
  const pit = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), M.redrock);
  pit.scale.set(rx, 1, rz);
  g.add(pit);
  // ground ring around the pit
  const ring = new THREE.Shape(); ring.absarc(0, 0, 1.0, 0, Math.PI * 2);
  const hole = new THREE.Path(); hole.absellipse(0, 0, rx, rz, 0, Math.PI * 2);
  ring.holes.push(hole);
  const top = add(g, new THREE.ShapeGeometry(ring, 48), M.earth, 0, 0, 0);
  top.rotation.x = -Math.PI / 2; top.castShadow = false; top.receiveShadow = true;
  add(g, new THREE.CylinderGeometry(1.0, 1.06, H, 48, 1, true), M.earth, 0, -H / 2, 0);
  add(g, new THREE.TorusGeometry(1.03, 0.035, 8, 64), M.bronze, 0, -0.01, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(1.08, 1.12, 0.3, 48), M.shadow, 0, -H - 0.15, 0);
  // green floor
  const fl = add(g, new THREE.CircleGeometry(0.78, 24), M.grass, 0, -H + 0.03, 0);
  fl.rotation.x = -Math.PI / 2; fl.scale.set(rx, rz, 1);
}

function ruinTemple(g, nx, nz, sp, h, x0 = 0, z0 = 0, standing = () => true, stumpEvery = 1) {
  const w = (nx - 1) * sp, d = (nz - 1) * sp;
  box(g, M.stone, w + 0.2, 0.06, d + 0.2, x0, 0, z0);
  box(g, M.marble, w + 0.13, 0.04, d + 0.13, x0, 0.06, z0);
  let k = 0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    if (i > 0 && i < nx - 1 && j > 0 && j < nz - 1) continue;
    const up = standing(k++);
    if (!up && (k - 1) % stumpEvery) continue; // most fallen columns leave nothing above the podium
    column(g, x0 - w / 2 + i * sp, z0 - d / 2 + j * sp, up ? h : h * 0.3, { broken: !up, y: 0.1 });
  }
  return { w, d };
}

const BUILD = {
  soli(g) {
    plinth(g);
    // the colonnaded street running down to the harbour
    box(g, M.stone, 0.36, 0.02, 1.62, 0, 0, -0.12);
    const up = [1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1];
    for (let i = 0; i < 13; i++) {
      const z = -0.9 + i * 0.125;
      for (const sx of [-1, 1]) {
        const standing = up[(i + (sx > 0 ? 3 : 0)) % up.length];
        column(g, sx * 0.24, z, standing ? 0.5 : 0.12 + 0.05 * (i % 3), { broken: !standing });
        if (standing) box(g, M.marble, 0.05, 0.035, 0.05, sx * 0.19, 0.27, z); // statue console
      }
    }
    for (const [sx, z0, n] of [[-1, -0.9, 3], [1, -0.4, 2], [-1, 0.35, 3]]) box(g, M.marble, 0.09, 0.05, 0.125 * (n - 1) + 0.1, sx * 0.24, 0.57, z0 + 0.0625 * (n - 1));
    // harbour basin with two moles
    seaSegment(g, 0.7);
    for (const sx of [-1, 1]) add(g, new THREE.TorusGeometry(0.3, 0.03, 6, 16, Math.PI / 2.4), M.stone, sx * 0.02, 0.03, 0.68, 0).rotation.set(Math.PI / 2, 0, sx > 0 ? 0 : Math.PI / 2);
    // the old mound
    add(g, new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.grass, 0.62, 0, -0.1).scale.y = 0.45;
    cypress(g, -0.6, -0.4); cypress(g, -0.7, 0.0); tree(g, -0.55, 0.25);
  },

  elaiussa(g) {
    plinth(g);
    // hill the theatre is cut into
    add(g, new THREE.SphereGeometry(0.75, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.grass, 0, -0.02, -0.5).scale.set(1.1, 0.36, 0.6);
    const th = new THREE.Group(); th.position.set(0, 0.02, -0.12); g.add(th);
    cavea(th, 0.16, 0.56, 9, Math.PI * 1.12); // slightly more than a half-circle, as excavated
    box(th, M.stone, 0.75, 0.16, 0.08, 0, 0, 0.2); // stage building stump
    for (let i = 0; i < 5; i++) column(th, -0.28 + i * 0.14, 0.13, 0.22 + (i % 2) * 0.05, { broken: i % 2 === 0 });
    // coast, island-turned-peninsula with a temple
    seaSegment(g, 0.52);
    add(g, new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.earth, 0.45, 0, 0.62).scale.set(1.3, 0.4, 0.8);
    box(g, M.earth, 0.12, 0.03, 0.2, 0.42, 0, 0.45);
    for (let i = 0; i < 6; i++) {
      // aqueduct arches from the Lamos
      add(g, archGeo(0.15, 0.2, 0.05, 0.1, 0.15), M.stone, -0.9 + i * 0.15 + 0.3, 0, 0.36, 0);
    }
    column(g, 0.45, 0.66, 0.2, { y: 0.07 }); column(g, 0.52, 0.66, 0.2, { y: 0.07 });
    tree(g, -0.7, -0.2); tree(g, 0.72, -0.25); tree(g, 0.6, -0.5, 0.8);
  },

  kanlidivane(g) {
    sinkholePlinth(g, 0.52, 0.42, 0.5);
    // Olban tower on the SW rim
    box(g, M.stone, 0.16, 0.5, 0.16, -0.55, 0, 0.5);
    box(g, M.dark, 0.04, 0.08, 0.02, -0.55, 0.3, 0.585);
    // basilicas on the rim (roofless naves with apses)
    for (const [x, z, ry] of [[0.68, 0.1, 0.2], [0.1, -0.68, 1.6], [-0.66, -0.2, -0.3], [0.0, 0.68, 1.5]]) {
      const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b);
      box(b, M.stone, 0.03, 0.26, 0.4, -0.11, 0, 0); box(b, M.stone, 0.03, 0.2, 0.4, 0.11, 0, 0);
      add(b, archGeo(0.25, 0.3, 0.03, 0.1, 0.17), M.stone, 0, 0, 0.2);
      const apse = add(b, new THREE.CylinderGeometry(0.11, 0.11, 0.26, 12, 1, true, 0, Math.PI), M.stone, 0, 0.13, -0.2, Math.PI / 2);
      apse.material = M.stone.clone(); apse.material.side = THREE.DoubleSide;
    }
    // Aba temple-tomb to the north
    const t = new THREE.Group(); t.position.set(0.55, 0, -0.62); g.add(t);
    box(t, M.marble, 0.2, 0.18, 0.24, 0, 0, 0);
    const roof = add(t, new THREE.CylinderGeometry(0.001, 0.15, 0.08, 4), M.marble, 0, 0.22, 0, Math.PI / 4);
    roof.scale.set(1, 1, 1.2);
    tree(g, 0.1, 0.05, 0.9).position.y = -0.4; tree(g, -0.12, -0.08, 0.8).position.y = -0.42;
    rocks(g, 9, 0.9, 2);
  },

  cennet(g) {
    sinkholePlinth(g, 0.62, 0.36, 0.48); // Cennet: long, with a floor you can walk down to
    // Cehennem: small sheer shaft beside it
    const pit = add(g, new THREE.CylinderGeometry(0.13, 0.1, 0.5, 16, 1, true), M.shadow, 0.5, -0.19, -0.6);
    pit.material = M.shadow.clone(); pit.material.side = THREE.BackSide;
    add(g, new THREE.CircleGeometry(0.13, 16), M.shadow, 0.5, 0.004, -0.6).rotation.x = -Math.PI / 2;
    add(g, new THREE.TorusGeometry(0.14, 0.025, 6, 16), M.redrock, 0.5, 0.01, -0.6).rotation.x = Math.PI / 2;
    // temple of Zeus on the rim, later a church
    const t = new THREE.Group(); t.position.set(-0.3, 0, 0.62); t.rotation.y = 0.2; g.add(t);
    box(t, M.stone, 0.42, 0.22, 0.03, 0, 0, -0.1); box(t, M.stone, 0.03, 0.22, 0.2, -0.2, 0, 0); box(t, M.stone, 0.03, 0.16, 0.2, 0.2, 0, 0);
    for (let i = 0; i < 4; i++) column(t, -0.15 + i * 0.1, 0.12, 0.22, { broken: i === 2 });
    // chapel at the cave mouth, on the floor
    const c = new THREE.Group(); c.position.set(0.3, -0.5, 0.02); g.add(c);
    box(c, M.stone, 0.14, 0.1, 0.1, 0, 0, 0);
    add(c, new THREE.ConeGeometry(0.1, 0.06, 4), M.roof, 0, 0.13, 0, Math.PI / 4);
    add(g, new THREE.SphereGeometry(0.09, 10, 8), M.shadow, 0.48, -0.47, 0.02); // cave mouth
    tree(g, -0.2, 0, 0.9).position.y = -0.4; tree(g, 0.0, 0.1, 0.8).position.y = -0.42; tree(g, -0.35, -0.05, 0.7).position.y = -0.43;
    // saffron crocuses, per Strabo
    const croc = new THREE.MeshStandardMaterial({ color: 0x9a5ad6, emissive: 0x3a1466 });
    for (let i = 0; i < 14; i++) add(g, new THREE.ConeGeometry(0.018, 0.05, 5), croc, -0.75 + 0.1 * (i % 5) + 0.03 * i, 0.025, -0.45 - 0.07 * (i % 3));
    rocks(g, 7, 0.92, 4);
  },

  adamkayalar(g) {
    plinth(g, M.earth);
    // canyon: two rock walls and a dry stream bed
    const cliff = add(g, new THREE.BoxGeometry(1.5, 1.0, 0.4, 6, 4, 2), M.rock, 0, 0.5, -0.38);
    const p = cliff.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const front = p.getZ(i) > 0.19;
      p.setXYZ(i, p.getX(i) + (front ? 0 : Math.sin(i * 12.9) * 0.05), p.getY(i) + (p.getY(i) > 0.45 ? Math.sin(i * 4.7) * 0.08 : 0), p.getZ(i) + (front ? 0 : Math.sin(i * 7.1) * 0.05));
    }
    cliff.geometry.computeVertexNormals();
    add(g, new THREE.BoxGeometry(1.3, 0.3, 0.3), M.rock, 0.1, 0.15, 0.7, 0.15);
    box(g, M.stone, 1.7, 0.012, 0.16, 0, 0, 0.3, 0.1);
    // nine niches, with figures
    const fig = new THREE.MeshStandardMaterial({ color: 0xe6d6b4, roughness: 0.8 });
    let n = 0;
    for (let row = 0; row < 2; row++) for (let i = 0; i < (row ? 4 : 5); i++, n++) {
      const x = -0.56 + i * 0.28 + row * 0.14, y = 0.2 + row * 0.38;
      box(g, M.shadow, 0.2, 0.24, 0.02, x, y, -0.175);
      const ped = add(g, new THREE.CylinderGeometry(0.001, 0.13, 0.07, 3), M.rock, x, y + 0.28, -0.17, 0);
      ped.rotation.set(Math.PI / 2, Math.PI / 2, 0); ped.scale.set(0.3, 1, 1);
      const count = n % 3 === 0 ? 3 : 2;
      for (let k = 0; k < count; k++) {
        const fx = x - 0.05 * (count - 1) / 1 * 0.8 + k * 0.075, fh = n === 4 && k === 1 ? 0.09 : 0.15;
        add(g, new THREE.CapsuleGeometry(0.022, fh - 0.04, 3, 6), fig, fx, y + 0.02 + fh / 2, -0.155);
      }
    }
    tree(g, 0.6, 0.72, 0.8).position.y += 0.3; tree(g, -0.4, 0.75, 0.7).position.y += 0.28; cypress(g, -0.82, -0.1);
  },

  korykos(g) {
    plinth(g, M.sea, 0.1);
    // shore
    const land = add(g, new THREE.CircleGeometry(0.985, 40, 0, Math.PI), M.earth, 0, 0.012, -0.12);
    land.rotation.x = -Math.PI / 2; land.castShadow = false; land.scale.y = 0.86;
    const beach = add(g, new THREE.BoxGeometry(1.9, 0.02, 0.1), M.marble, 0, 0.012, -0.1); beach.material = new THREE.MeshStandardMaterial({ color: 0xe8d9a8 });
    // land castle (medieval, of Roman spolia) with the reused Roman gate
    const lc = new THREE.Group(); lc.position.set(-0.42, 0, -0.32); g.add(lc);
    for (const [x, z, w, d] of [[0, -0.2, 0.5, 0.04], [0, 0.2, 0.5, 0.04], [-0.25, 0, 0.04, 0.44], [0.25, 0, 0.04, 0.44]]) box(lc, M.stone, w, 0.18, d, x, 0, z);
    for (const [x, z] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]) box(lc, M.stone, 0.1, 0.26, 0.1, x, 0, z);
    add(lc, archGeo(0.2, 0.28, 0.07, 0.09, 0.19), M.marble, 0.27, 0, 0, Math.PI / 2);
    // necropolis: sarcophagi
    for (let i = 0; i < 7; i++) {
      const x = 0.15 + (i % 4) * 0.17, z = -0.3 - Math.floor(i / 4) * 0.2 - (i % 2) * 0.05;
      box(g, M.marble, 0.09, 0.05, 0.05, x, 0.012, z, 0.3 * i);
      const lid = add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.09, 3), M.marble, x, 0.08, z, 0.3 * i); lid.rotation.z = Math.PI / 2;
    }
    // sea castle on its islet
    const sc = new THREE.Group(); sc.position.set(0.22, 0, 0.5); g.add(sc);
    add(sc, new THREE.CylinderGeometry(0.3, 0.34, 0.05, 20), M.rock, 0, 0.025, 0);
    const wall = add(sc, new THREE.CylinderGeometry(0.25, 0.25, 0.16, 20, 1, true), M.stone, 0, 0.13, 0);
    wall.material = M.stone.clone(); wall.material.side = THREE.DoubleSide;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      add(sc, new THREE.CylinderGeometry(0.045, 0.05, 0.25, 8), M.stone, Math.cos(a) * 0.25, 0.17, Math.sin(a) * 0.25);
    }
    // a Roman patrol galley
    const ship = galley(); ship.scale.setScalar(0.35); ship.position.set(-0.45, 0.02, 0.45); ship.rotation.y = 0.5; g.add(ship);
  },

  seleucia(g) {
    plinth(g);
    // river Calycadnus and the bridge
    waterBand(g, 0.3, 0.6);
    const br = new THREE.Group(); br.position.set(0.1, 0, 0.45); br.rotation.y = Math.PI / 2; br.scale.set(1.25, 1.5, 1.25); g.add(br);
    for (let i = 0; i < 5; i++) add(br, archGeo(0.13, 0.13, 0.08, 0.09, 0.1), M.stone, -0.26 + i * 0.13, 0, 0);
    box(br, M.stone, 0.75, 0.02, 0.1, 0, 0.13, 0);
    // temple podium: one column standing, with its stork
    // 14 x 8 peripteros, of which one column stands
    const { w, d } = ruinTemple(g, 14, 8, 0.075, 0.5, -0.05, -0.3, (k) => k === 7, 6);
    const cx = -0.05 - w / 2, cz = -0.3 + d / 2; // k = 7 is the front-left corner column
    add(g, new THREE.CylinderGeometry(0.055, 0.04, 0.03, 8), M.dark, cx, 0.69, cz); // nest
    add(g, new THREE.ConeGeometry(0.02, 0.09, 5), M.marble, cx, 0.75, cz).castShadow = false; // stork
    // castle hill behind
    add(g, new THREE.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.grass, -0.62, 0, -0.55).scale.y = 0.7;
    add(g, new THREE.CylinderGeometry(0.14, 0.15, 0.07, 10), M.stone, -0.62, 0.22, -0.55);
    cypress(g, 0.55, -0.4); cypress(g, 0.68, -0.25); tree(g, 0.6, 0.0); tree(g, -0.7, 0.75, 0.8);
  },

  diocaesarea(g) {
    plinth(g, M.grass);
    // temple of Zeus Olbios: 6 x 12, most columns up
    ruinTemple(g, 6, 12, 0.1, 0.42, -0.25, 0.1, (k) => ![4, 9, 17, 22, 23, 29].includes(k));
    // the tall Hellenistic tower
    box(g, M.stone, 0.17, 0.75, 0.14, 0.2, 0, -0.72);
    for (let i = 1; i < 5; i++) box(g, M.dark, 0.18, 0.012, 0.15, 0.2, i * 0.15, -0.72);
    // monumental gate on the colonnaded street
    add(g, archGeo(0.5, 0.42, 0.07, 0.16, 0.3), M.marble, 0.42, 0, 0.25, Math.PI / 2);
    box(g, M.stone, 0.9, 0.012, 0.12, 0.42, 0, 0.25);
    for (let i = 0; i < 5; i++) column(g, 0.55 + i * 0.09, 0.36, 0.3, { broken: i > 2 });
    // Tyche temple: five tall monoliths and an architrave
    for (let i = 0; i < 5; i++) column(g, 0.2 + i * 0.09, 0.75, 0.4);
    box(g, M.marble, 0.42, 0.04, 0.06, 0.38, 0.47, 0.75);
    // theatre in the slope
    const th = new THREE.Group(); th.position.set(0.72, 0.0, -0.25); th.rotation.y = -Math.PI / 2; th.scale.setScalar(0.5); g.add(th);
    cavea(th, 0.16, 0.5, 7, Math.PI);
    tree(g, -0.75, -0.4); tree(g, -0.6, -0.62, 1.2); tree(g, -0.82, 0.3); tree(g, 0.0, -0.8, 1.1); tree(g, -0.3, 0.88, 0.9);
  },

  anemurium(g) {
    plinth(g);
    // slope behind, sea in front
    add(g, new THREE.SphereGeometry(0.6, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.rock, -0.05, -0.02, -0.72).scale.set(1.3, 0.42, 0.42);
    seaSegment(g, 0.5);
    // odeon (small, once roofed) facing the theatre
    const od = new THREE.Group(); od.position.set(-0.05, 0, -0.05); od.rotation.y = Math.PI; od.scale.setScalar(0.42); g.add(od);
    cavea(od, 0.14, 0.45, 6, Math.PI);
    box(od, M.stone, 1.0, 0.4, 0.05, 0, 0, 0.3);
    const th = new THREE.Group(); th.position.set(-0.05, 0.04, -0.42); th.scale.setScalar(0.62); g.add(th);
    cavea(th, 0.16, 0.5, 8, Math.PI);
    // baths: vaulted halls
    for (const [x, z, n] of [[0.5, 0.12, 3], [-0.6, 0.2, 2]]) {
      for (let i = 0; i < n; i++) {
        const v = add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.3, 12, 1, false, 0, Math.PI), M.stone, x + i * 0.15 - 0.15, 0.14, z);
        v.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        box(g, M.stone, 0.15, 0.14, 0.3, x + i * 0.15 - 0.15, 0, z);
      }
    }
    // necropolis: barrel-vaulted house tombs up the slope
    for (let i = 0; i < 12; i++) {
      const x = -0.8 + (i % 6) * 0.2 + (i > 5 ? 0.6 : 0), z = -0.2 - Math.floor(i / 6) * 0.14 + (i % 2) * 0.05 + (i > 5 ? 0.25 : -0.45);
      const y = z < -0.5 ? 0.12 : 0;
      box(g, M.dark, 0.08, 0.05, 0.1, x, y, z);
      const v = add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8, 1, false, 0, Math.PI), M.dark, x, y + 0.05, z);
      v.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    }
    box(g, M.stone, 1.5, 0.08, 0.03, 0, 0, 0.42); // sea wall
  },

  tarsus(g) {
    plinth(g);
    // basalt-paved street with drain line and colonnade bases
    const basalt = new THREE.MeshStandardMaterial({ color: 0x4b4a50, roughness: 0.8 });
    box(g, basalt, 0.26, 0.02, 1.85, 0, 0, 0);
    box(g, M.stone, 0.03, 0.025, 1.85, 0, 0, 0);
    for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) column(g, sx * 0.19, -0.75 + i * 0.16, i % 4 === 1 ? 0.3 : 0.07, { broken: i % 4 !== 1 });
    // Cleopatra's Gate
    add(g, archGeo(0.62, 0.5, 0.16, 0.24, 0.36), M.stone, 0, 0, 0.72);
    // Donuktaş: giant concrete temple platform
    box(g, M.dark, 0.5, 0.2, 0.85, 0.62, 0, -0.1);
    box(g, M.dark, 0.38, 0.1, 0.6, 0.62, 0.2, -0.1);
    // river Cydnus and Cleopatra's barge with its purple sail
    waterBand(g, -0.78, -0.48, false);
    const barge = galley(0x7a2c8f, 0xd9b24a); barge.scale.setScalar(0.4); barge.position.set(-0.62, 0.03, 0.15); barge.rotation.y = Math.PI / 2; g.add(barge);
    cypress(g, -0.3, -0.6); cypress(g, -0.32, 0.35); tree(g, 0.35, 0.55);
  },
};

export function galley(sailColor = 0xc9412f, hullColor = 0x6b4a2b) {
  const g = new THREE.Group();
  const hullM = new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.7 });
  const hull = add(g, new THREE.SphereGeometry(0.5, 12, 8), hullM, 0, 0.02, 0);
  hull.scale.set(1.5, 0.28, 0.32);
  add(g, new THREE.ConeGeometry(0.06, 0.4, 6), hullM, 0.85, 0.06, 0).rotation.z = -Math.PI / 2; // ram
  const stern = add(g, new THREE.TorusGeometry(0.16, 0.035, 6, 10, Math.PI), hullM, -0.72, 0.16, 0); stern.rotation.z = Math.PI / 2.4;
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), hullM, 0.05, 0.45, 0);
  const sail = add(g, new THREE.PlaneGeometry(0.62, 0.42, 4, 1), new THREE.MeshStandardMaterial({ color: sailColor, side: THREE.DoubleSide, roughness: 0.9 }), 0.09, 0.55, 0);
  sail.rotation.y = Math.PI / 2;
  const sp = sail.geometry.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.08 * Math.cos(sp.getX(i) * 4));
  sail.geometry.computeVertexNormals();
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const oar = add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.36, 4), hullM, -0.45 + i * 0.18, 0.02, s * 0.25);
    oar.rotation.x = s * 1.1; oar.userData.oar = s;
  }
  return g;
}

export function buildMonument(kind) {
  const g = new THREE.Group();
  (BUILD[kind] || BUILD.soli)(g);
  g.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return g;
}
