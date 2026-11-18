"""Build the map's terrain assets from open data.

  python3 tools/build_terrain_data.py            (needs: pip install rasterio numpy pillow)

Inputs, read straight from their public cloud-optimised GeoTIFFs (only the overview levels needed):
  * Copernicus GLO-30 DEM (30 m), (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018,
    provided under COPERNICUS by the European Union and ESA.
  * ESA WorldCover 10 m 2021 v200, (c) ESA WorldCover project / Contains modified Copernicus Sentinel data (2021),
    CC BY 4.0.
  * Sentinel-2 cloudless 2017 by EOX IT Services GmbH (https://s2maps.eu), contains modified Copernicus
    Sentinel data 2017, CC BY 4.0.

Outputs in public/:
  heightmap.png          GRID_W x GRID_H, 16-bit elevation (m + 3000) in R (high byte) and G (low byte)
  terrain-normal.jpg     TEX_W x TEX_H world-space normals (x east, y up, z south) at the map's vertical exaggeration
  terrain-color.jpg      TEX_W x TEX_H ground colour from Sentinel-2 imagery with modern features painted out
  landcover.png          GRID_W x GRID_H fractions: R tree cover, G shrubland, B cropland (drives the 3D trees)
  (-lo variants of the two jpgs at half size for ?q=low)

Modern land use is translated back towards antiquity: built-up land, dam reservoirs and greenhouse sheeting are
painted over with the colour of the farmland and scrub around them. Everything else is as the satellites see it.
Remote reads are cached in tools/.cache (delete it to refetch).
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
TEX_W = 4096; TEX_H = round(TEX_W / ASPECT)
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


def cached(name, fn):
    p = os.path.join(os.environ.get('S2_CACHE', os.path.join(ROOT, 'tools', '.cache')), name + '.npy')
    if os.path.exists(p): return np.load(p)
    a = fn(); os.makedirs(os.path.dirname(p), exist_ok=True); np.save(p, a); return a


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


def satellite(w, h, cache):
    """Sentinel-2 cloudless 2017 (EOX, CC BY 4.0) web-mercator tiles, resampled to the map's lon/lat grid"""
    import urllib.request
    Z = 11
    tx = lambda lon: (lon + 180) / 360 * 2 ** Z
    ty = lambda lat: (1 - np.log(np.tan(np.radians(lat)) + 1 / np.cos(np.radians(lat))) / math.pi) / 2 * 2 ** Z
    x0, x1, y0, y1 = int(tx(W)), int(tx(E)), int(ty(N)), int(ty(S))
    os.makedirs(cache, exist_ok=True)
    mos = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256, 3), np.uint8)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            p = os.path.join(cache, f's2_{Z}_{x}_{y}.jpg')
            if not os.path.exists(p):
                url = f'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2017_3857/default/g/{Z}/{y}/{x}.jpg'
                req = urllib.request.Request(url, headers={'User-Agent': 'terrain-build/1.0'})
                with urllib.request.urlopen(req, timeout=60) as r, open(p, 'wb') as f: f.write(r.read())
            mos[(y - y0) * 256:(y - y0 + 1) * 256, (x - x0) * 256:(x - x0 + 1) * 256] = np.asarray(Image.open(p).convert('RGB'))
    px = (tx(W + (np.arange(w) + 0.5) / w * (E - W)) - x0) * 256
    py = (ty(N - (np.arange(h) + 0.5) / h * (N - S)) - y0) * 256
    xi = np.clip(px.astype(int), 0, mos.shape[1] - 2); yi = np.clip(py.astype(int), 0, mos.shape[0] - 2)
    fx = (px - xi)[None, :, None]; fy = (py - yi)[:, None, None]
    m = mos.astype(np.float32) / 255
    a = m[yi][:, xi]; b = m[yi][:, xi + 1]; c = m[yi + 1][:, xi]; d = m[yi + 1][:, xi + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy


def infill(img, bad, r=6, iters=12):
    """replace bad pixels by a blur of the good ones around them, growing inward"""
    img = img.copy(); bad = bad.copy()
    for _ in range(iters):
        if not bad.any(): break
        g = (~bad).astype(np.float32); wsum = box(g, r)
        ok = bad & (wsum > 0.08)
        for k in range(3):
            v = box(img[..., k] * g, r) / np.maximum(wsum, 1e-6)
            img[..., k][ok] = v[ok]
        bad &= ~ok
    return img


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
    hg = cached(f'dem{GRID_W}', lambda: dem(GRID_W, GRID_H))
    ht = cached(f'dem{TEX_W}', lambda: dem(TEX_W, TEX_H))
    print('WorldCover')
    lc = cached(f'wc{TEX_W}', lambda: worldcover(TEX_W, TEX_H))
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
    hs = ht
    dx = (np.roll(hs, -1, 1) - np.roll(hs, 1, 1)) / (2 * cx) * VEX
    dz = (np.roll(hs, -1, 0) - np.roll(hs, 1, 0)) / (2 * cz) * VEX
    dx[:, [0, -1]] = 0; dz[[0, -1], :] = 0
    # alluvial plains are flat: the DEM's field-and-rooftop noise there would otherwise shade as lumps
    calm = np.clip((box(np.hypot(dx, dz) / VEX, 4) - 0.012) / 0.05, 0.15, 1)
    dx *= calm; dz *= calm
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
    built = lc == 50; lake = (lc == 80) | (lc == 0)
    bad = land & (built | lake)
    lc = fill_classes(lc, bad)
    lc[sea] = 0

    # Ground colour: Sentinel-2 cloudless imagery, with what is modern taken out. Towns, reservoirs and
    # greenhouse sheeting (very bright, colourless patches in farmland) are filled in from their surroundings.
    print('Sentinel-2')
    sat = satellite(TEX_W, TEX_H, os.environ.get('S2_CACHE', os.path.join(ROOT, 'tools', '.cache')))
    lum = sat.mean(-1); chroma = sat.max(-1) - sat.min(-1)
    glass = (lc == 40) & (lum > 0.5) & (chroma < 0.09) & (ht < 400)
    modern = built | lake | (box(glass.astype(np.float32), 1) > 0.2)
    modern = land & (box(modern.astype(np.float32), 2) > 0.1)  # include the grey fringe of suburbs and roads
    # paint them with the colour of the farmland, pasture and scrub around them (not forest, not sea),
    # then give the smooth fill back the grain of fields
    src = (land & ~modern & np.isin(lc, (20, 30, 40))).astype(np.float32)
    col = sat.copy()
    for R in (24, 80):
        wsum = box(src, R); todo = modern & (wsum > 0.02) if R == 24 else modern & ~done
        for k in range(3): col[..., k][todo] = (box(sat[..., k] * src, R) / np.maximum(wsum, 1e-6))[todo]
        done = modern & (wsum > 0.02) if R == 24 else modern
    grain = (noise(TEX_H, TEX_W, 4, 21) - 0.5) * 0.22 + (noise(TEX_H, TEX_W, 14, 22) - 0.5) * 0.16
    col[modern] *= (1 + grain[modern])[:, None]
    # the plains: today's ruler-straight parcels (and an airfield) soften into a mottled patchwork of fields
    plain = land & ((lc == 40) & (ht < 250) | np.isin(lc, (30, 40, 50, 60)) & (ht < 60)) & ~modern
    soft = np.stack([box(box(col[..., k], 5), 5) for k in range(3)], -1)
    mosaic = (noise(TEX_H, TEX_W, 7, 31) - 0.5) * 0.2 + (noise(TEX_H, TEX_W, 22, 32) - 0.5) * 0.14
    col[plain] = soft[plain] * (1 + mosaic[plain])[:, None]
    # grade: lift the mosaic's dark tones a little and warm it towards a summer afternoon
    col = np.clip(col, 0, 1) ** 0.9
    g = col.mean(-1, keepdims=True); col = np.clip(g + (col - g) * 0.82, 0, 1)  # the summer mosaic is very orange
    col *= np.array([0.97, 1.0, 0.98], np.float32)
    # the mosaic carries its own terrain shadows and the scene lights it again: open up the darkest tones
    lum2 = col.mean(-1, keepdims=True); col += np.clip(0.3 - lum2, 0, 1) * 0.45
    col -= np.clip(lum2 - 0.66, 0, 1) * 0.55  # and hold back the glare of the bare limestone plateau
    # the high Taurus is pale grey limestone and scree, not the ochre of a low-sun mosaic
    alp = np.clip((box(ht, 2) - 2200) / 500, 0, 1)[..., None] * 0.6
    grey = col.mean(-1, keepdims=True) * np.array([0.98, 0.99, 1.02], np.float32) * 1.12
    col = col * (1 - alp) + np.clip(grey, 0, 1) * alp
    slope = np.hypot(dx, dz) / VEX
    def C(hexv): return np.array([(hexv >> 16) & 255, (hexv >> 8) & 255, hexv & 255], np.float32) / 255
    # permanent snow patches on the highest, gentlest ground of the Bolkar range
    north = np.clip(0.5 + dz / np.maximum(np.hypot(dx, dz), 1e-4) * -0.5, 0, 1)  # 1 on north-facing slopes
    snow = np.clip((box(ht, 2) - 2750) / 400, 0, 1) * np.clip(1.3 - slope * 1.2, 0, 1) * (0.35 + 0.65 * north) * (noise(TEX_H, TEX_W, 6, 9) > 0.42)
    col = col * (1 - snow[..., None] * 0.8) + C(0xf4f4f0) * snow[..., None] * 0.8
    shore = land & (ht < 3) & (box(sea.astype(np.float32), 2) > 0.05)
    col[shore] = col[shore] * 0.45 + C(0xd9cba0) * 0.55
    col[sea] = C(0xcdbf8f)  # under the water plane: pale sand shelf
    cimg = Image.fromarray(np.clip(col * 255, 0, 255).astype(np.uint8))
    cimg.save(os.path.join(OUT, 'terrain-color.jpg'), quality=84)
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
