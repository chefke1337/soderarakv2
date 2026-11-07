"""Hero „talaj": a térkő (viakolor) ALATTI rétegrend metszete
→ public/hero/terko-retegrend.svg

Felülről lefelé (ügyfél referenciaképe szerint):
  ágyazat 2/4 · teherhordó réteg 0/22 · fagyvédő réteg 0/56 ·
  tömörített altalaj (egyenes határ) · természetes talaj
Megjelenés: „renderelt" metszet — árnyalt, rakott szögletes szemek
(fény-árnyék, vetett árnyék), finom zaj-textúra a mátrixban (feTurbulence),
rétegenkénti függőleges tónusátmenet, a vágási él alatt mélységárnyék.
A szemek csempézett mintában, varratmentes illesztéssel → kis fájl.
Determinisztikus: python3 scripts/build-hero-ground.py
A feliratok NEM itt vannak, hanem HTML-ben (page.tsx), hogy élesek maradjanak.
"""
import math
import random

W, H = 2400, 80
TW = 360
R = random.Random(20261107)
defs, body = [], []

BED = (0, 7)
BASE = (7, 19)
FROST = (26, 25)
SOIL = (51, 17)
NAT = (68, 12)


def n(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def lingrad(gid, stops, x2="0", y2="1"):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity={chr(34)}{a}{chr(34)}" if a is not None else ""}/>' for o, c, a in stops)
    defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>')


# kő-árnyalatok: fény balra fent, árnyék jobbra lent
STONE_LIGHT = [("#ece7df", "#c9c1b5"), ("#e2dbd0", "#bdb3a5"), ("#d8d0c4", "#b0a596"), ("#f1ede6", "#d0c8bc")]
STONE_WARM = [("#e8dcc2", "#bfa984"), ("#ddcfb1", "#b29b74"), ("#efe5cf", "#c9b590"), ("#d3c2a0", "#a89069")]
for i, (a, b) in enumerate(STONE_LIGHT):
    lingrad(f"sl{i}", [(0, a, None), (1, b, None)], "1", "1")
for i, (a, b) in enumerate(STONE_WARM):
    lingrad(f"sw{i}", [(0, a, None), (1, b, None)], "1", "1")

# zaj-textúra (mátrix szemcsézet)
defs.append('<filter id="grain" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="7" stitchTiles="stitch"/>'
            '<feColorMatrix values="0 0 0 0 .18  0 0 0 0 .14  0 0 0 0 .1  0 0 0 1.1 -.42"/></filter>')


def stone_pts(cx, cy, r):
    k = R.randint(5, 7)
    a0 = R.uniform(0, math.tau)
    sq = R.uniform(0.62, 0.92)
    pts = []
    for i in range(k):
        a = a0 + i * math.tau / k + R.uniform(-0.3, 0.3)
        rr = r * R.uniform(0.72, 1.04)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * sq))
    return pts


def path(pts, dx=0.0, dy=0.0):
    return "M" + "L".join(f"{n(x + dx)} {n(y + dy)}" for x, y in pts) + "Z"


def aggregate(pid, layer, cell, rmin, rmax, grads, matrix_top, matrix_bot, edge):
    y0, h = layer
    lingrad(f"{pid}m", [(0, matrix_top, None), (1, matrix_bot, None)])
    els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="url(#{pid}m)"/>',
           f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#grain)" opacity=".55"/>']
    stones = []
    y, row = y0 + cell * 0.45, 0
    while y < y0 + h + rmax * 0.4:
        x = (cell * 0.5) * (row % 2)
        while x < TW:
            cx = x + R.uniform(-cell * 0.28, cell * 0.28)
            cy = y + R.uniform(-cell * 0.22, cell * 0.22)
            stones.append((cx, cy, R.uniform(rmin, rmax), R.choice(grads)))
            x += cell
        y += cell * 0.78
        row += 1
    shadows, faces = [], []
    for cx, cy, r, g in stones:
        pts = stone_pts(cx, cy, r)
        for off in (0, -TW, TW):
            if cx + off + r < 0 or cx + off - r > TW:
                continue
            shadows.append(f'<path d="{path(pts, off + r * .18, r * .22)}"/>')
            faces.append(f'<path d="{path(pts, off)}" fill="url(#{g})"/>')
    els.append(f'<g fill="#2b2019" fill-opacity=".28">{"".join(shadows)}</g>')
    els.append(f'<g stroke="{edge}" stroke-opacity=".55" stroke-width=".4" stroke-linejoin="round">{"".join(faces)}</g>')
    defs.append(f'<clipPath id="{pid}c"><rect y="{y0}" width="{TW}" height="{h}"/></clipPath>')
    defs.append(f'<pattern id="{pid}" width="{TW}" height="{H}" patternUnits="userSpaceOnUse"><g clip-path="url(#{pid}c)">{"".join(els)}</g></pattern>')
    body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#{pid})"/>')


# 1) ágyazat 2/4 — finom, sűrű szemcse
y0, h = BED
lingrad("bedg", [(0, "#e3d4b2", None), (1, "#cdbb93", None)])
els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="url(#bedg)"/>',
       f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#grain)" opacity=".7"/>']
for _ in range(int(TW * h * 0.22)):
    c = R.choice(["#9c8760", "#b39f77", "#f3ead6"])
    els.append(f'<circle cx="{n(R.uniform(0, TW))}" cy="{n(R.uniform(y0 + .5, y0 + h - .5))}" r="{n(R.uniform(.3, .6))}" fill="{c}"/>')
defs.append(f'<pattern id="bed" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">{"".join(els)}</pattern>')
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#bed)"/>')

# 2) teherhordó 0/22 — kisebb, világos szürke zúzottkő
aggregate("base", BASE, 4.4, 1.6, 2.6, [f"sl{i}" for i in range(4)], "#b9b0a3", "#a3988a", "#6f655b")
# 3) fagyvédő 0/56 — nagyobb, meleg tónusú szemek
aggregate("frost", FROST, 7.6, 2.9, 4.8, [f"sw{i}" for i in range(4)], "#a8987c", "#94826a", "#5e4f3c")

# 4) tömörített altalaj — finom 45°-os vonalkázás + zaj
y0, h = SOIL
lingrad("soilg", [(0, "#86695a", None), (1, "#72584a", None)])
els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="url(#soilg)"/>',
       f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#grain)" opacity=".6"/>']
step = 3.6  # a csempeszélesség (360) osztója → nincs varrat
x = -h
hatch = []
while x < TW + h:
    hatch.append(f"M{n(x)} {y0 + h}L{n(x + h)} {y0}")
    x += step
els.append(f'<path d="{"".join(hatch)}" stroke="#5a4438" stroke-opacity=".55" stroke-width=".55"/>')
defs.append(f'<clipPath id="soilc"><rect y="{y0}" width="{TW}" height="{h}"/></clipPath>')
defs.append(f'<pattern id="soil" width="{TW}" height="{H}" patternUnits="userSpaceOnUse"><g clip-path="url(#soilc)">{"".join(els)}</g></pattern>')
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#soil)"/>')

# 5) természetes talaj — sötétülő átmenet, egy halk hullám
y0, h = NAT
lingrad("natg", [(0, "#5f4739", None), (1, "#3f2f26", None)])
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#natg)"/>')
pts = [(x, y0 + 6 + 1.8 * math.sin(x / W * math.pi * 5.3) + .9 * math.sin(x / W * math.pi * 13.1 + 1.2)) for x in range(0, W + 1, 40)]
d = f"M0 {n(pts[0][1])}" + "".join(f"L{x} {n(y)}" for x, y in pts[1:])
body.append(f'<path d="{d}" fill="none" stroke="#86695a" stroke-opacity=".45" stroke-width=".7"/>')

# mélységárnyék a vágási él alatt + réteghatárok
lingrad("cut", [(0, "#2b2019", .32), (1, "#2b2019", 0)])
body.append(f'<rect y="0" width="{W}" height="9" fill="url(#cut)"/>')
for yy, op, sw in ((BASE[0], .3, .5), (FROST[0], .32, .5), (SOIL[0], .75, .9), (NAT[0], .4, .6)):
    body.append(f'<path d="M0 {yy}H{W}" stroke="#2b2019" stroke-opacity="{op}" stroke-width="{sw}"/>')
body.append(f'<path d="M0 .45H{W}" stroke="#2b2019" stroke-opacity=".6" stroke-width=".9"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>')
open("public/hero/terko-retegrend.svg", "w").write(svg)
print(len(svg))
