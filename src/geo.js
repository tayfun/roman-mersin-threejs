// Geographic frame shared by the heightmap builder (tools/build_heightmap.py) and the scene.
export const BOUNDS = { W: 32.35, S: 35.85, E: 35.35, N: 37.5 };
export const GRID = { w: 800, h: 574 };
export const HEIGHT_OFFSET = 3000; // metres added before 16-bit encoding
export const VEX = 2.6; // vertical exaggeration

const KM_LAT = 111.2;
const KM_LON = KM_LAT * Math.cos(((BOUNDS.N + BOUNDS.S) / 2) * Math.PI / 180);
export const WORLD = {
  w: (BOUNDS.E - BOUNDS.W) * KM_LON, // 1 world unit = 1 km
  d: (BOUNDS.N - BOUNDS.S) * KM_LAT,
};

export function lonLatToXZ(lon, lat) {
  return [
    ((lon - BOUNDS.W) / (BOUNDS.E - BOUNDS.W) - 0.5) * WORLD.w,
    ((BOUNDS.N - lat) / (BOUNDS.N - BOUNDS.S) - 0.5) * WORLD.d,
  ];
}
export const metresToY = (m) => (m / 1000) * VEX;
