// One stylised diorama per site, composed from the standing remains listed in SOURCES.md.
import * as THREE from 'three';
import { bake } from './kit.js';
import soli from './soli.js';
import elaiussa from './elaiussa.js';
import tarsus from './tarsus.js';
import seleucia from './seleucia.js';
import diocaesarea from './diocaesarea.js';
import anemurium from './anemurium.js';
import kanlidivane from './kanlidivane.js';
import cennet from './cennet.js';
import adamkayalar from './adamkayalar.js';
import korykos from './korykos.js';

export { galley, BASE_DEPTH } from './kit.js';
export const BUILDERS = { soli, elaiussa, tarsus, seleucia, diocaesarea, anemurium, kanlidivane, cennet, adamkayalar, korykos };

export function buildMonument(kind) {
  const g = new THREE.Group();
  (BUILDERS[kind] || BUILDERS.soli)(g);
  return bake(g);
}
