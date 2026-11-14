#!/usr/bin/env python3
"""Trace river courses along valley floors of the DEM.

No river vector data is bundled, so each river is a least-cost path (cost grows with
elevation) from an upstream point on the known river to the sea. This follows the real
valley at the DEM's ~330 m resolution; it is not a surveyed centreline.
Output: src/rivers.json  ->  {name: [[lon, lat], ...]}
"""
import heapq, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, S, E, N = 32.35, 35.85, 35.35, 37.50
a = np.asarray(Image.open(os.path.join(ROOT, "public", "heightmap.png")).convert("RGB")).astype(np.float64)
H = a[:, :, 0] * 256 + a[:, :, 1] - 3000
gh, gw = H.shape

def cell(lon, lat):
    return int(round((N - lat) / (N - S) * (gh - 1))), int(round((lon - W) / (E - W) * (gw - 1)))
def lonlat(j, i):
    return [round(W + i / (gw - 1) * (E - W), 4), round(N - j / (gh - 1) * (N - S), 4)]

def trace(start):
    sj, si = cell(*start)
    # snap the start to the lowest cell nearby (the valley floor)
    win = H[sj - 6:sj + 7, si - 6:si + 7]
    dj, di = np.unravel_index(np.argmin(win), win.shape)
    sj, si = sj - 6 + dj, si - 6 + di
    dist = {(sj, si): 0.0}; prev = {}; pq = [(0.0, sj, si)]
    while pq:
        d, j, i = heapq.heappop(pq)
        if H[j, i] < 0.5:  # reached the sea
            path = [(j, i)]
            while path[-1] in prev: path.append(prev[path[-1]])
            return [lonlat(*p) for p in reversed(path)]
        if d > dist[(j, i)]: continue
        for dj in (-1, 0, 1):
            for di in (-1, 0, 1):
                if not (dj or di): continue
                y, x = j + dj, i + di
                if not (0 <= y < gh and 0 <= x < gw): continue
                step = (1.414 if dj and di else 1.0) * (max(H[y, x], 0) + 3.0) ** 1.5
                nd = d + step
                if nd < dist.get((y, x), 1e30):
                    dist[(y, x)] = nd; prev[(y, x)] = (j, i); heapq.heappush(pq, (nd, y, x))

RIVERS = {
    "Calycadnus (Göksu)": (33.20, 36.62),   # upstream of Mut
    "Cydnus (Berdan)": (34.85, 37.16),      # above Tarsus
    "Lamos (Limonlu)": (34.10, 36.72),      # Lamos canyon
}
out = {}
for name, start in RIVERS.items():
    p = trace(start)
    out[name] = p[::2] + [p[-1]]
    print(name, len(p), "cells; mouth at", p[-1])
json.dump(out, open(os.path.join(ROOT, "src", "rivers.json"), "w"), ensure_ascii=False)
