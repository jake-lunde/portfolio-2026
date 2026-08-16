"""Cut the ABOUT THIS MACHINE portrait mask from Jake's dither.

  python3 scripts/plaque-portrait.py public/nameplate.png

Reads a two-tone dither (blue ink on paper), writes public/plaque-portrait.png:
ink pixels opaque black, paper transparent. shell.module.css paints it in
--accent through mask-image, so the print follows theme and skin.
"""
import sys
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else 'public/nameplate.png'
im = Image.open(src).convert('RGB')
px = im.load()
w, h = im.size
out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
o = out.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if b - r > 60:  # the blue ink, however the paper is toned
            o[x, y] = (0, 0, 0, 255)
out.save('public/plaque-portrait.png', optimize=True)
print(w, h, '-> public/plaque-portrait.png')
