// Canytelis (Kanlıdivane): a town on the lip of a great sinkhole whose pale limestone walls run red with staining.
// The Olban tower and four roofless basilicas stand on the edge; family reliefs are cut in the wall below the tower;
// the Aba temple-tomb and sarcophagi lie to the north. North is -z.
import * as THREE from 'three';
import { M, B, put, col, rubble, tree, scatter, person, base, sm, fbm, ell, archWall, archRing, apse, gable, sarcophagus, boulder, pitSkin, hill } from './kit.js';

export default function kanlidivane(g) {
  const PX = 0.0, PZ = 0.04;
  const pit = (x, z) => ell(x, z, PX, PZ, 0.56, 0.43, 0.15) + (fbm(x * 2.3 + 4, z * 2.3) - 0.5) * 0.34 - 0.07 * Math.exp(-((x - 0.42) ** 2 + (z - 0.34) ** 2) / 0.02);
  const rim = (a, lvl = 1.0) => { let lo = 0, hi = 1.2; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (pit(PX + Math.cos(a) * m, PZ + Math.sin(a) * m) < lvl) lo = m; else hi = m; } return [PX + Math.cos(a) * lo, PZ + Math.sin(a) * lo, lo]; };
  const ground = (x, z) => 0.08 + fbm(x * 2.5 + 2, z * 2.5) * 0.025 + hill(x, z, 0.74, -0.52, 0.16, 0.05);
  const Y = base(g, {
    dry: 0.7,
    h: (x, z) => {
      const e = pit(x, z), gr = ground(x, z);
      if (e >= 1.0) return gr;
      const floor = -0.42 + fbm(x * 4, z * 4 + 5) * 0.04 + sm(0.4, 0.9, e) * 0.1; // talus at the foot of the walls
      return Math.min(gr, floor + sm(0.93, 1.0, e) * 0.56);
    },
    tint: (x, z, y, s, c, P) => {
      const e = pit(x, z);
      c.lerp(P.rock, 0.35 + (fbm(x * 7, z * 7) > 0.6 ? 0.4 : 0)); // bare grey karst showing through
      if (e < 1.22 && e >= 1.0) c.copy(P.rock).lerp(P.sand, 0.3); // bare rock lip
      if (e < 1.0) { c.copy(P.rock).lerp(P.red, 0.3); if (y < -0.3) c.copy(P.grass).lerp(P.earth, 0.35); }
    },
  });
  // ---- the sinkhole walls: stepped ledges of pale limestone, rust-red and black with runoff
  pitSkin(g, pit, PX, PZ, Y, -0.4, { level: 0.985, tiers: 4, step: 0.024, amp: 0.02, seed: 3 });
  for (let k = 0; k < 16; k++) { const a = k * 0.41 + 0.2, [x, z, r] = rim(a, 0.78 + (k % 3) * 0.05); boulder(g, x, -0.37 + (k % 2) * 0.02, z, 0.03 + (k % 4) * 0.01, k, M.karstFlat); } // talus blocks
  for (let k = 0; k < 12; k++) { const a = k * 0.53 + 0.1, [x, z] = rim(a, 0.93); tree(g, 'shrub', x, z, 0.8, -0.1 - (k % 3) * 0.08, k); } // bushes on the ledges
  const onLip = (a, off) => { const [x, z, r] = rim(a, 1.0); return [PX + Math.cos(a) * (r + off), PZ + Math.sin(a) * (r + off)]; };
  // ---- the Olban tower: squat, three storeys of polygonal masonry, broken top, right on the edge
  const TA = 2.72, [tx, tz] = onLip(TA, 0.09), ty = Y(tx, tz) - 0.008, tg = new THREE.Group(); tg.position.set(tx, ty, tz); tg.rotation.y = 0.3; g.add(tg);
  B(tg, M.limestone, 0.19, 0.02, 0.14, 0, 0, 0); B(tg, M.limestone, 0.17, 0.24, 0.12, 0, 0.02, 0);
  for (let k = 1; k < 3; k++) B(tg, M.weathered, 0.176, 0.006, 0.126, 0, 0.02 + k * 0.08, 0);
  [[-0.06, -0.035, 0.04], [0.0, -0.035, 0.022], [0.06, -0.035, 0.03], [-0.06, 0.035, 0.018]].forEach(([x, z, hh]) => B(tg, M.limestone, 0.05, hh, 0.05, x, 0.26, z));
  B(tg, M.dark, 0.03, 0.05, 0.004, 0.03, 0.02, 0.061); for (let k = 0; k < 2; k++) B(tg, M.dark, 0.01, 0.03, 0.004, -0.03 + k * 0.06, 0.13 + k * 0.07, 0.061);
  B(tg, M.marble, 0.05, 0.026, 0.004, -0.04, 0.085, 0.0615); // the dedication of Teukros to Zeus
  B(tg, M.weathered, 0.016, 0.016, 0.004, 0.07, 0.21, 0.0615); // triskeles block
  rubble(tg, 0.0, 0.11, 4, 0.14, 0.022, M.limestone, 3);
  // ---- reliefs cut in the wall below the tower: a family of six in a framed niche; a single figure further round
  const niche = (a, depth, w, hh, n) => {
    const [x, z] = rim(a, 0.96), ng = new THREE.Group(); ng.position.set(x, depth, z); ng.rotation.y = -a + Math.PI / 2 + Math.PI; g.add(ng);
    B(ng, M.relief, w + 0.03, hh + 0.03, 0.02, 0, -0.015, 0); B(ng, M.karstDark, w, hh, 0.006, 0, 0, 0.009);
    for (let k = 0; k < n; k++) { const seated = n === 6 && k < 2, fh = seated ? hh * 0.62 : hh * (k > 3 ? 0.5 : 0.8), fx = -w / 2 + (k + 0.5) * w / n; const f = put(ng, new THREE.CapsuleGeometry(w / n * 0.3, fh - w / n * 0.6, 3, 8), M.relief, fx, fh / 2 + 0.003, 0.014); f.scale.z = 0.5; put(ng, new THREE.SphereGeometry(w / n * 0.26, 8, 6), M.relief, fx, fh + w / n * 0.2, 0.014).scale.z = 0.6; if (seated) B(ng, M.relief, w / n * 0.8, fh * 0.35, 0.008, fx, 0.003, 0.012); }
  };
  niche(TA + 0.12, -0.1, 0.2, 0.1, 6); niche(TA + 0.75, -0.12, 0.05, 0.085, 1);
  // ---- basilicas on the lip, apses to the east
  function basilica(a, off, L, W, H, kind) {
    const [x, z] = onLip(a, off), b = new THREE.Group(); b.position.set(x, Y(x, z) - 0.008, z); b.rotation.y = kind === 'IV' ? 0.1 : (a * 3 % 0.4) - 0.2; g.add(b);
    const win = (n, top, sill) => Array.from({ length: n }, (_, k) => ({ x: -L / 2 + (k + 0.5) * L / n, w: L / (n * 2.1), h: top, sill }));
    if (kind === 'IV') { // the best preserved: two tiers of arched windows, east end standing two storeys high
      archWall(b, M.limestone, L, H, 0.022, win(5, H * 0.45, H * 0.18).concat(win(5, H * 0.88, H * 0.62)), 0, 0, -W / 2);
      archWall(b, M.limestone, L * 0.7, H * 0.8, 0.022, win(3, H * 0.45, H * 0.18), -L * 0.15, 0, W / 2);
      apse(b, M.limestone, W * 0.3, H * 1.02, L / 2, 0, 0, -Math.PI / 2);
      const dome = put(b, new THREE.SphereGeometry(W * 0.3, 14, 8, Math.PI / 2, Math.PI, 0, Math.PI / 2.6), M.limestoneDS, L / 2, H * 1.02, 0); dome.rotation.y = -Math.PI / 2; // broken semi-dome
      for (const s of [-1, 1]) { archWall(b, M.limestone, W * 0.34, H * 1.05, 0.022, [{ x: 0, w: W * 0.1, h: H * 0.42, sill: H * 0.18 }, { x: 0, w: W * 0.1, h: H * 0.9, sill: H * 0.66 }], L / 2, 0, s * W * 0.33, Math.PI / 2); B(b, M.limestone, 0.09, H * 0.95, 0.02, L / 2 + 0.045, 0, s * W * 0.5); } // two-storey side chambers
      for (const xx of [-0.03, 0.03]) B(b, M.dark, 0.012, 0.03, 0.004, L / 2 + W * 0.3 + 0.002, H * 0.45, xx).rotation.y = Math.PI / 2;
      archWall(b, M.limestone, W, H * 0.75, 0.022, [{ x: 0, w: W * 0.2, h: H * 0.5 }, { x: -W * 0.3, w: W * 0.13, h: H * 0.4 }, { x: W * 0.3, w: W * 0.13, h: H * 0.4 }], -L / 2, 0, 0, Math.PI / 2);
      for (const zz of [-W * 0.3, 0.02, W * 0.3]) B(b, M.limestone, 0.022, 0.03 + Math.abs(zz) * 0.2, W * 0.2, -L / 2, H * 0.75, zz);
      for (let k = 0; k < 5; k++) for (const s of [-1, 1]) col(b, -L / 2 + (k + 1) * L / 6, s * W * 0.2, k % 2 ? H * 0.5 : 0.03, { r: 0.009, broken: k % 2 === 0, shaft: M.weathered, seed: k });
    } else {
      const hs = kind === 'apse' ? [0.5, 0.25] : [0.75, 0.45];
      archWall(b, M.limestone, L, H * hs[0], 0.02, kind === 'apse' ? [] : win(4, H * hs[0] * 0.8, H * hs[0] * 0.35), 0, 0, -W / 2);
      B(b, M.limestone, L * (kind === 'apse' ? 0.4 : 0.8), H * hs[1], 0.02, -L * 0.1, 0, W / 2);
      apse(b, M.limestone, W * 0.3, H * (kind === 'apse' ? 1 : 0.8), L / 2, 0, 0, -Math.PI / 2);
      for (const s of [-1, 1]) B(b, M.limestone, 0.02, H * 0.7, W * 0.2, L / 2, 0, s * W * 0.4);
      if (kind === 'narthex') { B(b, M.limestone, 0.02, H * 0.5, W, -L / 2, 0, 0); B(b, M.limestone, 0.02, H * 0.3, W, -L / 2 - 0.06, 0, 0); }
      for (let k = 0; k < 3; k++) for (const s of [-1, 1]) col(b, -L / 2 + (k + 1) * L / 4, s * W * 0.2, 0.025 + (k % 2) * 0.03, { r: 0.008, broken: true, shaft: M.weathered, seed: k });
    }
    rubble(b, 0, 0, 5, W, 0.018, M.limestone, a * 10);
    return [x, z];
  }
  const B4 = basilica(-1.5, 0.13, 0.3, 0.19, 0.2, 'IV');
  const B2 = basilica(TA + 0.55, 0.12, 0.22, 0.15, 0.13, 'narthex'); // the church beside the tower
  const B3 = basilica(0.0, 0.16, 0.2, 0.14, 0.12, 'plain');
  const B1 = basilica(1.25, 0.12, 0.2, 0.14, 0.13, 'apse');
  // ---- Aba's temple-tomb on its knoll: closed ashlar cella, corner pilasters, arched door, gabled roof
  const ax = 0.74, az = -0.52, ag = new THREE.Group(); ag.position.set(ax, Y(ax, az) - 0.006, az); ag.rotation.y = 0.5; g.add(ag);
  B(ag, M.limestone, 0.17, 0.02, 0.2, 0, 0, 0); B(ag, M.limestone, 0.14, 0.13, 0.17, 0, 0.02, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(ag, M.weathered, 0.02, 0.13, 0.02, sx * 0.066, 0.02, sz * 0.081);
  B(ag, M.weathered, 0.155, 0.014, 0.185, 0, 0.15, 0); gable(ag, M.limestone, 0.16, 0.19, 0.045, 0, 0.164, 0);
  archWall(ag, M.weathered, 0.06, 0.085, 0.006, [{ x: 0, w: 0.036, h: 0.07 }], 0, 0.02, 0.087); B(ag, M.dark, 0.036, 0.06, 0.003, 0, 0.02, 0.086);
  // ---- northern necropolis: sarcophagi; house ruins, a cistern mouth and rock outcrops on the plateau
  for (let k = 0; k < 8; k++) { const x = 0.2 + k * 0.075, z = -0.84 + Math.abs(k - 3) * 0.03 + (k % 2) * 0.05; if (Math.hypot(x, z) < 0.92) sarcophagus(g, x, z, Y(x, z) - 0.004, 0.95, k * 0.5); }
  [[-0.5, -0.66, 0.3, 0.14, 0.11], [-0.72, -0.3, 0.1, 0.1, 0.13], [0.72, 0.52, 0.6, 0.12, 0.09], [0.4, 0.78, 0.2, 0.16, 0.08], [-0.42, 0.74, -0.2, 0.11, 0.12]].forEach(([x, z, r, w, d], k) => {
    const y = Y(x, z) - 0.006, hg = new THREE.Group(); hg.position.set(x, y, z); hg.rotation.y = r; g.add(hg);
    B(hg, M.rubble, w, 0.03 + (k % 3) * 0.015, 0.014, 0, 0, -d / 2); B(hg, M.rubble, 0.014, 0.05 - (k % 2) * 0.02, d, w / 2, 0, 0); if (k % 2) B(hg, M.rubble, w * 0.6, 0.025, 0.014, -w * 0.2, 0, d / 2); else B(hg, M.rubble, 0.014, 0.03, d * 0.5, -w / 2, 0, -d * 0.25);
  });
  for (let k = 0; k < 14; k++) { const a = k * 0.47, r = 0.72 + (k % 3) * 0.07, x = Math.cos(a) * r, z = Math.sin(a) * r; if (pit(x, z) > 1.25) boulder(g, x, Y(x, z) + 0.004, z, 0.018 + (k % 3) * 0.008, k + 5, M.karstFlat); }
  // ---- fig and carob on the floor; low maquis and olives above, kept off the sightlines
  const blds = [[tx, tz, 0.16], B4.concat(0.24), B2.concat(0.18), B3.concat(0.17), B1.concat(0.17), [ax, az, 0.17]];
  scatter(g, ['oak', 'oak', 'shrub'], 7, [-0.3, -0.18, 0.32, 0.26], Y, 5, 0.6, 0.85, (x, z) => pit(x, z) < 0.5);
  scatter(g, ['shrub', 'shrub', 'olive'], 24, [-0.95, -0.95, 0.95, 0.95], Y, 9, 0.55, 0.8, (x, z) => pit(x, z) > 1.3 && blds.every(([bx, bz, r]) => Math.hypot(x - bx, z - bz) > r) && !(z > 0.45 && Math.abs(x) < 0.5));
  for (const [x, z, i] of [[tx + 0.1, tz + 0.1, 0], [tx + 0.14, tz + 0.08, 1], [B4[0] - 0.05, B4[1] + 0.02, 3], [0.05, 0.0, 4], [ax - 0.1, az + 0.1, 5], [0.3, 0.62, 2]]) person(g, x, z, Y(x, z) + 0.003, i, 0.8);
}
