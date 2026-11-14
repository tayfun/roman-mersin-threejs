import math, os, sys, io, urllib.request, ssl
import numpy as np
from PIL import Image
W,S,E,N = 32.35, 35.85, 35.35, 37.50
Z=9
out_dir, tile_dir = sys.argv[1], sys.argv[2]
def tx(lon): return (lon+180)/360*2**Z
def ty(lat):
    r=math.radians(lat); return (1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**Z
x0,x1=int(tx(W)),int(tx(E)); y0,y1=int(ty(N)),int(ty(S))
mos=np.zeros(((y1-y0+1)*256,(x1-x0+1)*256),dtype=np.float32)
for x in range(x0,x1+1):
    for y in range(y0,y1+1):
        p=f"{tile_dir}/{Z}_{x}_{y}.png"
        if not os.path.exists(p):
            os.system(f"curl -sS -o {p} https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png")
        a=np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
        h=a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
        mos[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=h
# resample to equirect grid
GW,GH=800,574
lons=W+(np.arange(GW)+0.0)/(GW-1)*(E-W)
lats=N-(np.arange(GH)+0.0)/(GH-1)*(N-S)
px=((lons+180)/360*2**Z-x0)*256
r=np.radians(lats); py=((1-np.log(np.tan(r)+1/np.cos(r))/math.pi)/2*2**Z-y0)*256
PX,PY=np.meshgrid(px,py)
xi=np.clip(np.floor(PX).astype(int),0,mos.shape[1]-2); yi=np.clip(np.floor(PY).astype(int),0,mos.shape[0]-2)
fx=PX-xi; fy=PY-yi
h=(mos[yi,xi]*(1-fx)*(1-fy)+mos[yi,xi+1]*fx*(1-fy)+mos[yi+1,xi]*(1-fx)*fy+mos[yi+1,xi+1]*fx*fy)
print(h.min(),h.max(), (h>0).mean())
v=np.clip(h+3000,0,65535).astype(np.uint16)
rgb=np.zeros((GH,GW,3),dtype=np.uint8); rgb[:,:,0]=v>>8; rgb[:,:,1]=v&255
Image.fromarray(rgb).save(f"{out_dir}/heightmap.png",optimize=True)
# preview
pv=np.clip((h+200)/3500*255,0,255).astype(np.uint8); Image.fromarray(pv).save(f"{out_dir}/preview.png")
