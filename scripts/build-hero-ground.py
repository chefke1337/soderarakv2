"""Hero „talaj": a térkő (viakolor) ALATTI rétegrend absztrakt metszete
→ public/hero/terko-retegrend.svg

Műszaki metszetrajz-logika, letisztítva (ügyfél referenciaképe szerint),
felülről lefelé:
  ágyazat (2/4)        — finom, egyenletes pontozás
  teherhordó (0/22)    — sűrűn rakott, kis szögletes zúzottkő-szemek
  fagyvédő (0/56)      — nagyobb szögletes szemek, finomabb hézagkitöltéssel
  tömörített altalaj   — egyenes határ, sűrű 45°-os vonalkázás (döngölt)
  természetes talaj    — sötétebb, egy halk hullámvonallal
A szemek mintacsempékben (zökkenőmentes illesztéssel) → kis fájlméret.
Determinisztikus (seed), újrafuttatható: python3 scripts/build-hero-ground.py
"""
import math
import random

W, H = 2400, 80
TW = 360  # mintacsempe szélessége
R = random.Random(20261107)
defs, body = [], []


def n(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


# rétegek: (y, magasság)
BED = (0, 6)
BASE = (6, 18)
FROST = (24, 24)
SOIL = (48, 18)
NAT = (66, 14)


def stone(cx, cy, r, sides=(5, 7)):
    k = R.randint(*sides)
    a0 = R.uniform(0, math.tau)
    pts = []
    for i in range(k):
        a = a0 + i * math.tau / k + R.uniform(-0.35, 0.35)
        rr = r * R.uniform(0.7, 1.05)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * R.uniform(0.75, 1.0)))
    return "M" + "L".join(f"{n(x)} {n(y)}" for x, y in pts) + "Z"


def aggregate(layer, cell, rmin, rmax, fills, stroke, matrix, fines):
    y0, h = layer
    els = [f'<rect width="{TW}" height="{H}" fill="{matrix}"/>']
    # finom hézagkitöltés (pontok)
    for _ in range(int(TW * h / (cell * cell) * fines)):
        els.append(f'<circle cx="{n(R.uniform(0, TW))}" cy="{n(R.uniform(y0, y0 + h))}" r="{n(R.uniform(0.25, 0.5))}" fill="{stroke}" fill-opacity=".45"/>')
    # szemek: jitterelt rács, a csempe szélén átlógók megduplázva (nincs varrat)
    y = y0 + cell * 0.5
    row = 0
    while y < y0 + h:
        x = (cell * 0.5) * (row % 2)
        while x < TW:
            cx, cy = x + R.uniform(-cell * 0.3, cell * 0.3), y + R.uniform(-cell * 0.25, cell * 0.25)
            r = R.uniform(rmin, rmax)
            d = stone(cx, cy, r)
            f = R.choice(fills)
            for off in (0, -TW, TW):
                if 0 <= cx + off + r and cx + off - r <= TW:
                    dd = d if off == 0 else _shift(d, off)
                    els.append(f'<path d="{dd}" fill="{f}" stroke="{stroke}" stroke-width=".45" stroke-linejoin="round"/>')
            x += cell
        y += cell * 0.82
        row += 1
    pid = f"g{len(defs)}"
    defs.append(f'<pattern id="{pid}" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">{"".join(els)}</pattern>')
    body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#{pid})"/>')


def _shift(d, off):
    out, num = [], ""
    toks = d.replace("M", " M ").replace("L", " L ").replace("Z", " Z ").split()
    i = 0
    res = []
    while i < len(toks):
        t = toks[i]
        if t in ("M", "L"):
            x, y = float(toks[i + 1]) + off, toks[i + 2]
            res.append(f"{t}{n(x)} {y}")
            i += 3
        else:
            res.append(t)
            i += 1
    return "".join(res)


# 1) ágyazat 2/4 — egyenletes finom pontozás
y0, h = BED
els = [f'<rect width="{TW}" height="{H}" fill="#d8c7a3"/>']
for _ in range(int(TW * h * 0.32)):
    els.append(f'<circle cx="{n(R.uniform(0, TW))}" cy="{n(R.uniform(y0 + .4, y0 + h - .4))}" r="{n(R.uniform(.28, .5))}" fill="{R.choice(["#a8936a", "#8f7b55", "#efe3c8"])}"/>')
defs.append(f'<pattern id="bed" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">{"".join(els)}</pattern>')
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#bed)"/>')

# 2) teherhordó 0/22 — kis szögletes szemek
aggregate(BASE, 4.6, 1.5, 2.5, ["#d9d2c8", "#cbc3b8", "#e3ddd4", "#bfb6aa"], "#7f746a", "#b7ab9c", 0.3)
# 3) fagyvédő 0/56 — nagyobb szemek
aggregate(FROST, 8.2, 2.8, 4.6, ["#d6c6a6", "#c9b796", "#ddd0b5", "#bca886"], "#6f5f48", "#a8977a", 0.25)

# 4) tömörített altalaj — 45°-os sűrű vonalkázás
y0, h = SOIL
els = [f'<rect width="{TW}" height="{H}" fill="#7e6352"/>']
step = 3.6  # a csempeszélesség (360) osztója → nincs varrat
x = -h
while x < TW + h:
    els.append(f'<path d="M{n(x)} {y0 + h}L{n(x + h)} {y0}" stroke="#6a5142" stroke-width=".7"/>')
    x += step
defs.append(f'<pattern id="soil" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">{"".join(els)}</pattern>')
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#soil)"/>')

# 5) természetes talaj — halk hullám
y0, h = NAT
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="#5d4536"/>')
pts = [(x, y0 + 7 + 2.2 * math.sin(x / W * math.pi * 5.3) + 1.1 * math.sin(x / W * math.pi * 13.1 + 1.2)) for x in range(0, W + 1, 40)]
d = f"M0 {n(pts[0][1])}" + "".join(f"L{x} {n(y)}" for x, y in pts[1:])
body.append(f'<path d="{d}L{W} {H}L0 {H}Z" fill="#513b2e"/>')
body.append(f'<path d="{d}" fill="none" stroke="#7e6352" stroke-opacity=".6" stroke-width=".8"/>')

# réteghatárok: hajszálvonalak; a tömörített altalaj felett határozottabb egyenes
for yy, op, sw in ((BASE[0], .35, .6), (FROST[0], .35, .6), (SOIL[0], .7, 1), (NAT[0], .45, .7)):
    body.append(f'<path d="M0 {yy}H{W}" stroke="#2b2019" stroke-opacity="{op}" stroke-width="{sw}"/>')
body.append(f'<path d="M0 .4H{W}" stroke="#2b2019" stroke-opacity=".55" stroke-width=".8"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" shape-rendering="geometricPrecision">'
       f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>')
open("public/hero/terko-retegrend.svg", "w").write(svg)
print(len(svg))
