"""Hero „talaj" — a térkő alatti rétegrend ABSZTRAKT, grafikus metszete
→ public/hero/terko-retegrend.svg

Stílus: lapos, plakátszerű grafika („terrazzo + raszter"), nem fotó- vagy
rajzhű. Felülről lefelé (az ügyfél referenciaképe szerint):
  ágyazat 2/4         — homokszín, sűrű, szabályos pontraszter
  teherhordó 0/22     — hűvös kőszín alap, kis lapos szögletes „chipek"
  fagyvédő 0/56       — meleg alap, nagyobb lapos chipek
  tömörített altalaj  — egyenes határ; fölül sűrű, lefelé ritkuló pontraszter
                        (a tömörödés grafikus jele)
  természetes talaj   — két lágy hullámsáv
Varratmentes csempék (a szélen átlógó elemek megduplázva). Determinisztikus.
Futtatás: python3 scripts/build-hero-ground.py
"""
import math
import random

W, H, TW = 2400, 80, 400
R = random.Random(20261107)
defs, body = [], []
BED, BASE, FROST, SOIL, NAT = (0, 7), (7, 19), (26, 25), (51, 17), (68, 12)


def n(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def pattern(pid, layer, els):
    y0, h = layer
    defs.append(f'<clipPath id="{pid}c"><rect y="{y0}" width="{TW}" height="{h}"/></clipPath>')
    defs.append(f'<pattern id="{pid}" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">'
                f'<g clip-path="url(#{pid}c)">{"".join(els)}</g></pattern>')
    body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#{pid})"/>')


def chip(cx, cy, r):
    k = R.randint(4, 6)
    a0 = R.uniform(0, math.tau)
    pts = []
    for i in range(k):
        a = a0 + i * math.tau / k + R.uniform(-0.4, 0.4)
        rr = r * R.uniform(0.65, 1.1)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * 0.8))
    return pts


def poly(pts, dx=0):
    return "M" + "L".join(f"{n(x + dx)} {n(y)}" for x, y in pts) + "Z"


def chips(layer, cell, rmin, rmax, colors, base):
    y0, h = layer
    els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="{base}"/>']
    y, row = y0 + cell * 0.55, 0
    while y < y0 + h + rmax * 0.3:
        x = cell * 0.5 * (row % 2)
        while x < TW:
            if R.random() < 0.86:  # levegős: nem minden cellában van chip
                cx, cy = x + R.uniform(-cell * .3, cell * .3), y + R.uniform(-cell * .2, cell * .2)
                r = R.uniform(rmin, rmax)
                pts, col = chip(cx, cy, r), R.choice(colors)
                for off in (0, -TW, TW):
                    if -r <= cx + off <= TW + r:
                        els.append(f'<path d="{poly(pts, off)}" fill="{col}"/>')
            x += cell
        y += cell * 0.8
        row += 1
    return els


def halftone(layer, step, rmax, rmin, color, base=None, top_dense=True, jitter=0.0):
    y0, h = layer
    els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="{base}"/>'] if base else []
    rows = int(h / step)
    for j in range(rows + 1):
        t = j / max(rows, 1)
        r = rmax + (rmin - rmax) * t if top_dense else rmin + (rmax - rmin) * t
        if r <= 0.05:
            continue
        y = y0 + step * 0.5 + j * step
        off = step * 0.5 * (j % 2)
        x = off
        while x < TW + step:
            els.append(f'<circle cx="{n(x + R.uniform(-jitter, jitter))}" cy="{n(y)}" r="{n(r)}" fill="{color}"/>')
            x += step
    return els


# 1) ágyazat — szabályos finom raszter
pattern("bed", BED, halftone(BED, 2.2, 0.55, 0.55, "#c4a46c", base="#e8d6ae"))
# 2) teherhordó 0/22 — kis hűvös chipek
pattern("base", BASE, chips(BASE, 5.2, 1.5, 2.4, ["#f2eee8", "#ddd6cb", "#a99f92", "#c9c1b5"], "#bdb4a7"))
# 3) fagyvédő 0/56 — nagyobb meleg chipek
pattern("frost", FROST, chips(FROST, 9.0, 2.8, 4.4, ["#efe1c2", "#d9c091", "#b1915f", "#8f7350"], "#c6a979"))
# 4) tömörített altalaj — fölül sűrű, lefelé ritkuló raszter
pattern("soil", SOIL, halftone(SOIL, 2.6, 1.05, 0.1, "#5f4334", base="#8b6a53"))
# 5) természetes talaj — lágy hullámsávok
y0, h = NAT
body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="#6b4e3c"/>')
for k, (yo, amp, fr, ph, col) in enumerate(((4.5, 1.6, 4.2, .4, "#5a4031"), (8.5, 1.3, 6.1, 2.1, "#4a3428"))):
    pts = [(x, y0 + yo + amp * math.sin(x / W * math.pi * fr + ph)) for x in range(0, W + 1, 30)]
    d = f"M0 {n(pts[0][1])}" + "".join(f"L{x} {n(y)}" for x, y in pts[1:])
    body.append(f'<path d="{d}L{W} {H}L0 {H}Z" fill="{col}"/>')

# réteghatárok: csak a tömörített altalaj fölött határozott egyenes
body.append(f'<path d="M0 {SOIL[0]}H{W}" stroke="#2b2019" stroke-opacity=".7" stroke-width="1"/>')
body.append(f'<path d="M0 .5H{W}" stroke="#2b2019" stroke-opacity=".5" stroke-width="1"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>')
open("public/hero/terko-retegrend.svg", "w").write(svg)
print(len(svg))
