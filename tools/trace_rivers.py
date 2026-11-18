#!/usr/bin/env python3
"""Trace river courses along valley floors of the DEM.

No river vector data is bundled, so each river is a least-cost path (cost grows with
elevation) from an upstream point on the known river, via the ancient city on it, to the sea. This follows the real
valley at the DEM's ~260 m resolution; it is not a surveyed centreline.
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

def snap(lon, lat, r=4):
    """lowest cell near a point: the valley floor"""
    j, i = cell(lon, lat)
    win = H[j - r:j + r + 1, i - r:i + r + 1]
    dj, di = np.unravel_index(np.argmin(win), win.shape)
    return j - r + dj, i - r + di

def leg(src, goal=None):
    """least-cost path from src to goal, or to the nearest sea cell if goal is None"""
    dist = {src: 0.0}; prev = {}; pq = [(0.0, *src)]
    while pq:
        d, j, i = heapq.heappop(pq)
        # the mouth is open water (a 5 x 5 block of it), not the first lagoon cell on the plain
        if (goal is None and 2 <= j < gh - 2 and 2 <= i < gw - 2 and H[j - 2:j + 3, i - 2:i + 3].max() < 0.5) or (j, i) == goal:
            path = [(j, i)]
            while path[-1] in prev: path.append(prev[path[-1]])
            return path[::-1]
        if d > dist[(j, i)]: continue
        for dj in (-1, 0, 1):
            for di in (-1, 0, 1):
                if not (dj or di): continue
                y, x = j + dj, i + di
                if not (0 <= y < gh and 0 <= x < gw): continue
                nd = d + (1.414 if dj and di else 1.0) * (max(H[y, x], 0) + 3.0) ** 1.5
                if nd < dist.get((y, x), 1e30):
                    dist[(y, x)] = nd; prev[(y, x)] = (j, i); heapq.heappush(pq, (nd, y, x))

def trace(points):
    cells = [snap(*p) for p in points]
    path = []
    for a, b in zip(cells, cells[1:] + [None]):
        path += leg(a, b)[(1 if path else 0):]
    return [lonlat(*p) for p in path]

RIVERS = {
    "Calycadnus (Göksu)": [(32.95, 36.58), (33.20, 36.62), (33.935, 36.372)],  # Ermenek gorge, upstream of Mut, then Silifke bridge
    "Cydnus (Berdan)": [(34.80, 37.30), (34.85, 37.16), (34.905, 36.917)],     # above Tarsus, then through Tarsus
    "Lamos (Limonlu)": [(34.10, 36.72)],                       # Lamos canyon
}
out = {}
for name, start in RIVERS.items():
    p = trace(start)
    out[name] = p[::2] + [p[-1]]
    print(name, len(p), "cells; mouth at", p[-1])
json.dump(out, open(os.path.join(ROOT, "src", "rivers.json"), "w"), ensure_ascii=False)
