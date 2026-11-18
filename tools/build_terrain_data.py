"""Build the map's terrain assets from open data.

  python3 tools/build_terrain_data.py            (needs: pip install rasterio numpy pillow)

Inputs, read straight from their public cloud-optimised GeoTIFFs (only the overview levels needed):
  * Copernicus GLO-30 DEM (30 m), (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018,
    provided under COPERNICUS by the European Union and ESA.
  * ESA WorldCover 10 m 2021 v200, (c) ESA WorldCover project / Contains modified Copernicus Sentinel data (2021),
    CC BY 4.0.

Outputs in public/:
  heightmap.png          GRID_W x GRID_H, 16-bit elevation (m + 3000) in R (high byte) and G (low byte)
  terrain-normal.jpg     TEX_W x TEX_H world-space normals (x east, y up, z south) at the map's vertical exaggeration
  terrain-color.jpg      TEX_W x TEX_H ground colour from land cover, elevation, slope and aspect (no baked lighting)
  landcover.png          GRID_W x GRID_H fractions: R tree cover, G shrubland, B cropland (drives the 3D trees)
  (-lo variants of the two jpgs at half size for ?q=low)

Modern land use is translated back towards antiquity: built-up land and dam reservoirs are repainted as the
farmland, scrub or valley floor around them. Everything else (forest belts, maquis, farmed plains, bare limestone
karst, the Göksu delta lagoons) follows the satellite classification.
"""
import os, sys, math
import numpy as np
from PIL import Image, ImageFilter
import rasterio
from rasterio.merge import merge
from rasterio.enums import Resampling

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'public')
W, S, E, N = 32.35, 35.85, 35.35, 37.5
KM_LAT = 111.2
KM_LON = KM_LAT * math.cos(math.radians((N + S) / 2))
ASPECT = (E - W) * KM_LON / ((N - S) * KM_LAT)
GRID_W = 1024; GRID_H = round(GRID_W / ASPECT)
TEX_W = 3072; TEX_H = round(TEX_W / ASPECT)
VEX = 2.0
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
os.environ.setdefault('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif')
os.environ.setdefault('GDAL_HTTP_MULTIRANGE', 'YES')
os.environ.setdefault('GDAL_HTTP_MERGE_CONSECUTIVE_RANGES', 'YES')


def mosaic(urls, w, h, resampling, nodata):
    srcs = []
    for u in urls:
        try: srcs.append(rasterio.open(u))
        except Exception as e: print('  (missing)', u.rsplit('/', 1)[-1])
    res = ((E - W) / w, (N - S) / h)
    arr, _ = merge(srcs, bounds=(W, S, E, N), res=res, resampling=resampling, nodata=nodata)
    for s in srcs: s.close()
    a = arr[0]
    return a[:h, :w]


def dem(w, h):
    urls = []
    for lat in (35, 36, 37):
        for lon in (32, 33, 34, 35):
            n = f'Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM'
            urls.append(f'/vsicurl/https://copernicus-dem-30m.s3.amazonaws.com/{n}/{n}.tif')
    a = mosaic(urls, w, h, Resampling.average, -32767).astype(np.float32)
    # cells on tile edges can come back empty: fill them from their neighbours so seams do not become trenches;
    # what stays empty after a few passes is open sea with no tile at all
    for _ in range(4):
        bad = a < -1000
        if not bad.any(): break
        v = np.where(bad, 0, a); m = (~bad).astype(np.float32)
        sv, sm = box(v, 1) * 9, box(m, 1) * 9
        fill = bad & (sm > 0.5)
        a[fill] = (sv / np.maximum(sm, 1e-6))[fill]
    a[a < -1000] = 0
    return a


def worldcover(w, h):
    urls = [f'/vsicurl/https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{t}_Map.tif'
            for t in ('N33E030', 'N33E033', 'N36E030', 'N36E033')]
    return mosaic(urls, w, h, Resampling.mode, 0)


def box(a, r):
    """box blur with radius r (cells) via cumulative sums, edge-clamped"""
    p = np.pad(a, r, mode='edge').astype(np.float64)
    c = p.cumsum(0); c = np.vstack([np.zeros((1, c.shape[1])), c]); p = (c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1)
    c = p.cumsum(1); c = np.hstack([np.zeros((c.shape[0], 1)), c]); return ((c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)).astype(np.float32)


def fill_classes(lc, bad, iters=60):
    """replace 'bad' cells by the most common good class among neighbours, growing inward"""
    lc = lc.copy(); bad = bad.copy()
    for _ in range(iters):
        if not bad.any(): break
        votes = {}
        for c in (10, 20, 30, 40, 60, 90):
            m = ((lc == c) & ~bad).astype(np.float32)
            votes[c] = box(m, 2)
        stack = np.stack([votes[c] for c in votes]); keys = np.array(list(votes))
        arg = stack.argmax(0); score = stack.max(0)
        take = bad & (score > 0)
        lc[take] = keys[arg][take]; bad = bad & ~take
    lc[bad] = 40
    return lc


def noise(h, w, scale, seed):
    rng = np.random.default_rng(seed)
    g = rng.random((h // scale + 2, w // scale + 2)).astype(np.float32)
    return np.asarray(Image.fromarray(g).resize((w + scale * 2, h + scale * 2), Image.BICUBIC))[scale:scale + h, scale:scale + w]


def main():
    print('DEM', GRID_W, 'x', GRID_H, 'and', TEX_W, 'x', TEX_H)
    hg = dem(GRID_W, GRID_H)
    ht = dem(TEX_W, TEX_H)
    print('WorldCover')
    lc = worldcover(TEX_W, TEX_H)
    # Land and water come from the satellite classification, not from "below half a metre": the delta plains
    # lie that low and would otherwise flood. Water here is sea or a coastal lagoon; inland lakes are dams.
    f = TEX_W // GRID_W
    wet_t = ((lc == 80) | (lc == 0)) & (ht < 6)
    wet_g = np.zeros((GRID_H, GRID_W), bool)
    wg = wet_t[:GRID_H * f, :GRID_W * f].reshape(GRID_H, f, GRID_W, f).mean((1, 3)) >= 0.5
    wet_g[:wg.shape[0], :wg.shape[1]] = wg; wet_g[wg.shape[0]:] = wet_g[wg.shape[0] - 1]
    hg = np.where(wet_g, 0, np.maximum(hg, 1.0)).astype(np.float32)
    ht = np.where(wet_t, 0, np.maximum(ht, 1.0)).astype(np.float32)
    print('  elevation', hg.min(), hg.max(), 'land', (hg > 0.5).mean())
    v = np.clip(hg + 3000, 0, 65535).astype(np.uint16)
    rgb = np.zeros((GRID_H, GRID_W, 3), np.uint8); rgb[..., 0] = v >> 8; rgb[..., 1] = v & 255
    Image.fromarray(rgb).save(os.path.join(OUT, 'heightmap.png'), optimize=True)

    # world-space normals at the map's exaggeration; 1 texel = cell metres
    cx = (E - W) * KM_LON * 1000 / TEX_W; cz = (N - S) * KM_LAT * 1000 / TEX_H
    hs = box(ht, 1)
    dx = (np.roll(hs, -1, 1) - np.roll(hs, 1, 1)) / (2 * cx) * VEX
    dz = (np.roll(hs, -1, 0) - np.roll(hs, 1, 0)) / (2 * cz) * VEX
    dx[:, [0, -1]] = 0; dz[[0, -1], :] = 0
    nrm = np.stack([-dx, np.ones_like(dx), -dz], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    sea = ht <= 0.5
    nrm[sea] = (0, 1, 0)
    nimg = Image.fromarray(np.clip((nrm * 0.5 + 0.5) * 255 + 0.5, 0, 255).astype(np.uint8))
    nimg.save(os.path.join(OUT, 'terrain-normal.jpg'), quality=90)
    nimg.resize((TEX_W // 2, TEX_H // 2), Image.LANCZOS).save(os.path.join(OUT, 'terrain-normal-lo.jpg'), quality=88)

    land = ~sea
    print('  classes', {int(c): round(float((lc[land] == c).mean()), 3) for c in np.unique(lc[land])})
    # back to antiquity: towns, reservoirs and no-data on land become the surrounding cover;
    # low-lying water within reach of the coast (the Göksu delta lagoons) is kept as water
    bad = land & ((lc == 50) | (lc == 0) | (lc == 80))
    lc = fill_classes(lc, bad)
    lc[sea] = 0

    # slope (unexaggerated) and a smoothed elevation for colour belts
    slope = np.hypot(dx, dz) / VEX
    hsm = box(ht, 3)
    n1, n2, n3 = noise(TEX_H, TEX_W, 64, 1), noise(TEX_H, TEX_W, 12, 2), noise(TEX_H, TEX_W, 3, 3)
    col = np.zeros((TEX_H, TEX_W, 3), np.float32)
    def C(hexv): return np.array([(hexv >> 16) & 255, (hexv >> 8) & 255, hexv & 255], np.float32) / 255
    def put(mask, a, b, t):
        t = np.clip(t, 0, 1)[mask][:, None]
        col[mask] = C(a) * (1 - t) + C(b) * t
    hi = np.clip((hsm - 300) / 1500, 0, 1)  # 0 lowland .. 1 high Taurus
    # 10 tree cover: Turkish red pine low, darker cedar / fir / juniper higher
    put(lc == 10, 0x4b6a35, 0x36503a, hi * 0.9 + (n2 - 0.5) * 0.3)
    # 20 shrubland: maquis on the coast, greyer garrigue / phrygana inland and higher
    put(lc == 20, 0x7b8a4e, 0x99956a, hi + (n2 - 0.5) * 0.5)
    # 30 grassland: dry summer pasture, alpine meadows high up
    put(lc == 30, 0xb9a676, 0xa89c7c, hi + (n2 - 0.5) * 0.25)
    # 40 cropland: patchwork of green and harvested fields on the plains
    put(lc == 40, 0x96a35a, 0xc5b277, n3 * 0.9 + n2 * 0.3 - 0.1)
    # 60 bare / sparse: limestone karst, pale screes
    put(lc == 60, 0xc9bc98, 0xb8b2a2, hi + (n2 - 0.5) * 0.4)
    put(lc == 70, 0xf2f1ec, 0xf2f1ec, n2)
    put(lc == 80, 0x4f8f93, 0x5f9e98, n2)  # delta lagoons
    put(lc == 90, 0x6e8c58, 0x7f9a60, n2)
    put(lc == 100, 0x9d9c84, 0x9d9c84, n2)
    # steep ground shows rock through any cover; sand along the shore
    rock = np.clip((slope - 0.45) / 0.5, 0, 0.65)[..., None]
    col = col * (1 - rock) + C(0xa89a80) * rock
    shore = land & (ht < 4) & (lc != 80) & (lc != 10)
    near_sea = box(sea.astype(np.float32), 2) > 0.02
    col[shore & near_sea] = col[shore & near_sea] * 0.3 + C(0xd8c99a) * 0.7
    # broad tonal variation so large areas are not flat swatches
    col *= (0.96 + 0.08 * n1)[..., None] * (0.95 + 0.1 * n3)[..., None]
    col[sea] = C(0xcdbf8f)  # under the water plane: pale sand shelf
    cimg = Image.fromarray(np.clip(col * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    cimg.save(os.path.join(OUT, 'terrain-color.jpg'), quality=86)
    cimg.resize((TEX_W // 2, TEX_H // 2), Image.LANCZOS).save(os.path.join(OUT, 'terrain-color-lo.jpg'), quality=85)

    # cover fractions per mesh cell for the instanced trees (3 x 3 texels per cell)
    def frac(c):
        m = (lc == c).astype(np.float32)[:GRID_H * f, :GRID_W * f]
        return m.reshape(GRID_H, f, GRID_W, f).mean((1, 3))
    fr = np.stack([frac(10), frac(20), frac(40)], -1)
    pad = np.zeros((GRID_H, GRID_W, 3), np.float32); pad[:fr.shape[0], :fr.shape[1]] = fr
    Image.fromarray((pad * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, 'landcover.png'), optimize=True)
    print('  tree cover on land', round(float(pad[..., 0][hg > 0.5].mean()), 3))
    print('GRID', GRID_W, GRID_H)


if __name__ == '__main__':
    main()
