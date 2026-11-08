"""Szekcióhatár „kavicsperem" maszk (src/app/v3-lower.css, --lx-seam-mask).

Determinisztikus: egy vízszintesen ismételhető, TW×H px-es SVG-csempe,
fekete kitöltéssel (maszkként használjuk — a színt a CSS adja). Alul
teljes sáv, fölötte egymásba csúszó, lapított kavicsok (különböző méret,
enyhe forgatás), legfelül néhány szétszórt apró szem.
Futtatás: python3 scripts/build-seam-pebbles.py  → kiírja a data URI-t.
"""
import math, random, urllib.parse

TW, H = 320, 28
rnd = random.Random(20261108)
shapes = []   # maszk: kitöltött kavicsformák
shade = []    # árnyalás: semleges, áttetsző alsó árnyékív + felső csillanás

def stone(cx, cy, rx, ry, rot, detail=True):
    for dx in (-TW, 0, TW):  # varratmentes csempe
        x = cx + dx
        if -rx - 2 < x < TW + rx + 2:
            t = f"transform='rotate({rot:.0f} {x:.1f} {cy:.1f})'"
            shapes.append(f"<ellipse cx='{x:.1f}' cy='{cy:.1f}' rx='{rx:.1f}' ry='{ry:.1f}' {t}/>")
            if detail:
                # alsó félív (árnyék) és bal-felső csillanás
                shade.append(
                    f"<path d='M{x-rx:.1f} {cy:.1f}A{rx:.1f} {ry:.1f} 0 0 0 {x+rx:.1f} {cy:.1f}' {t}/>"
                )
                shade.append(
                    f"<ellipse cx='{x-rx*0.3:.1f}' cy='{cy-ry*0.45:.1f}' rx='{rx*0.38:.1f}' ry='{ry*0.22:.1f}' {t}/>"
                )

# hátsó, nagyobb kavicsok (ritkábban), elöl kisebbek sűrűn
x = 0.0
while x < TW:
    rx = rnd.uniform(7, 17); ry = rx * rnd.uniform(0.45, 0.7)
    stone(x + rx * 0.6, H - 3 - ry * rnd.uniform(0.35, 0.8), rx, ry, rnd.uniform(-14, 14))
    x += rx * rnd.uniform(1.0, 1.6)
x = rnd.uniform(0, 8)
while x < TW:
    rx = rnd.uniform(3, 8); ry = rx * rnd.uniform(0.5, 0.8)
    stone(x, H - 2 - ry * rnd.uniform(0.2, 0.6), rx, ry, rnd.uniform(-20, 20), detail=rx > 6)
    x += rx * rnd.uniform(1.3, 2.2)
for _ in range(9):  # szórt apró szemek
    r = rnd.uniform(0.9, 2.0)
    stone(rnd.uniform(0, TW), rnd.uniform(H * 0.25, H * 0.62), r * 1.2, r, rnd.uniform(-30, 30), detail=False)

svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='{TW}' height='{H}' viewBox='0 0 {TW} {H}'>"
       f"<rect y='{H-3}' width='{TW}' height='3'/>" + "".join(shapes) + "</svg>")
uri = "data:image/svg+xml," + urllib.parse.quote(svg, safe=" =:/',.()-")
paths = [x for x in shade if x.startswith("<path")]
hl = [x for x in shade if x.startswith("<ellipse")]
svg2 = (f"<svg xmlns='http://www.w3.org/2000/svg' width='{TW}' height='{H}' viewBox='0 0 {TW} {H}'>"
        f"<g fill='none' stroke='rgb(40,25,10)' stroke-opacity='.22' stroke-width='1.2'>" + "".join(paths) + "</g>"
        f"<g fill='rgb(255,255,255)' fill-opacity='.3'>" + "".join(hl) + "</g></svg>")
uri2 = "data:image/svg+xml," + urllib.parse.quote(svg2, safe=" =:/',.()-")
print(f'url("{uri}")')
print(f'url("{uri2}")')
print(len(uri), len(uri2), "bytes")
