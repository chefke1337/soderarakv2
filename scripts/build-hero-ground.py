"""Hero „talaj" — a térkő alatti rétegrend metszete VALÓS SZEMCSEMÉRETTEL
→ public/hero/terko-retegrend.svg

Lépték (az ügyfél referenciaképének rétegvastagságai alapján):
  80 egység ≈ 46 cm mélység → 1 egység ≈ 5,7 mm (lg-n 1 egység = 1 CSS px)
Rétegek felülről (egység / valós vastagság):
  ágyazat 2/4 közzúzalék   7  ≈ 4 cm   szem: 2–4 mm   → r 0,18–0,35
  teherhordó 0/22 zúzottkő 19 ≈ 11 cm  szem: 0–22 mm  → r ≤ 1,9 (+ finom rész)
  fagyvédő 0/56 zúzottkő   25 ≈ 14 cm  szem: 0–56 mm  → r ≤ 4,9 (+ finom rész)
  tömörített altalaj       17 ≈ 10 cm  tömör, finom morzsa
  természetes talaj        12          sötétebb, laza morzsa
Szemeloszlás: folytonos szemeloszlás közelítése (sok kicsi, kevés nagy —
r^-2,5 hatványeloszlás), átfedés-szűréssel rakva; szögletes zúzottkő-forma,
fény balra fent, saját kis vetett árnyék. Csempézett, varratmentes. Determinisztikus.
Futtatás: python3 scripts/build-hero-ground.py
"""
import math
import random

W, H, TW = 2400, 80, 300
R = random.Random(20261107)
defs, body = [], []
BED, BASE, FROST, SOIL, NAT = (0, 7), (7, 19), (26, 25), (51, 17), (68, 12)


def n(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def grad(gid, a, b):
    defs.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')


COOL = [("#eeebe6", "#b9b2a8"), ("#e1ddd6", "#a69e93"), ("#d4cec5", "#958c80"), ("#f3f1ed", "#c7c1b8")]
WARM = [("#ece0c8", "#b39e7d"), ("#e2d3b6", "#a48c69"), ("#d6c4a3", "#94795a"), ("#efe6d4", "#c2ad8b")]
for i, (a, b) in enumerate(COOL):
    grad(f"c{i}", a, b)
for i, (a, b) in enumerate(WARM):
    grad(f"w{i}", a, b)
# finom rész / homokszem-zaj: feTurbulence (kis fájl, sok „szem")
defs.append('<filter id="fines" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="5" stitchTiles="stitch"/>'
            '<feColorMatrix values="0 0 0 0 .17  0 0 0 0 .13  0 0 0 0 .1  0 0 0 1.3 -.5"/></filter>')
defs.append('<filter id="finesl" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="9" stitchTiles="stitch"/>'
            '<feColorMatrix values="0 0 0 0 1  0 0 0 0 .98  0 0 0 0 .94  0 0 0 1.3 -.62"/></filter>')


def sample_r(rmin, rmax, k=2.5):
    # P(r) ~ r^-k  (inverz transzformáció)
    u = R.random()
    a, b = rmin ** (1 - k), rmax ** (1 - k)
    return (a + u * (b - a)) ** (1 / (1 - k))


def stone(cx, cy, r):
    k = R.randint(5, 7)
    a0 = R.uniform(0, math.tau)
    sq = R.uniform(0.6, 0.9)
    return [(cx + math.cos(a0 + i * math.tau / k + R.uniform(-.3, .3)) * r * R.uniform(.75, 1.05),
             cy + math.sin(a0 + i * math.tau / k + R.uniform(-.3, .3)) * r * R.uniform(.75, 1.05) * sq) for i in range(k)]


def pth(pts, dx=0.0, dy=0.0):
    return "M" + "L".join(f"{n(x + dx)} {n(y + dy)}" for x, y in pts) + "Z"


def layer(pid, lay, matrix, fines, fine_cols, rmin, rmax, attempts, grads, fill_ratio):
    y0, h = lay
    els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="{matrix}"/>',
           f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#fines)"/>',
           f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#finesl)"/>']
    # finom rész (homok/kőliszt) — apró pontok
    for _ in range(fines):
        els.append(f'<circle cx="{n(R.uniform(0, TW))}" cy="{n(R.uniform(y0, y0 + h))}" r="{n(R.uniform(.12, .26))}" fill="{R.choice(fine_cols)}"/>')
    placed = []
    sizes = sorted((sample_r(rmin, rmax) for _ in range(attempts)), reverse=True)
    area, target = 0.0, TW * h * fill_ratio
    sh, fc = [], []
    for r in sizes:
        if area > target:
            break
        for _ in range(12):
            cx, cy = R.uniform(0, TW), R.uniform(y0 + r * .3, y0 + h - r * .3)
            ok = all((cx - x) ** 2 + (cy - y) ** 2 > (r + rr) ** 2 * 0.62 or abs(cx - x) > TW / 2 and ((cx - x - math.copysign(TW, cx - x)) ** 2 + (cy - y) ** 2 > (r + rr) ** 2 * 0.62)
                     for x, y, rr in placed)
            if ok:
                placed.append((cx, cy, r))
                area += math.pi * r * r * .75
                pts, g = stone(cx, cy, r), R.choice(grads)
                for off in (0, -TW, TW):
                    if -r <= cx + off <= TW + r:
                        if r > .5:
                            sh.append(f'<path d="{pth(pts, off + r * .16, r * .2)}"/>')
                        fc.append(f'<path d="{pth(pts, off)}" fill="url(#{g})"/>')
                break
    els.append(f'<g fill="#2b2019" fill-opacity=".3">{"".join(sh)}</g>')
    els.append(f'<g>{"".join(fc)}</g>')
    defs.append(f'<clipPath id="{pid}c"><rect y="{y0}" width="{TW}" height="{h}"/></clipPath>')
    defs.append(f'<pattern id="{pid}" width="{TW}" height="{H}" patternUnits="userSpaceOnUse"><g clip-path="url(#{pid}c)">{"".join(els)}</g></pattern>')
    body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#{pid})"/>')


def crumbs(pid, lay, base, cols, count, rmin, rmax):
    y0, h = lay
    els = [f'<rect y="{y0}" width="{TW}" height="{h}" fill="{base}"/>',
           f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#fines)"/>',
           f'<rect y="{y0}" width="{TW}" height="{h}" filter="url(#finesl)" opacity=".6"/>']
    for _ in range(count):
        els.append(f'<circle cx="{n(R.uniform(0, TW))}" cy="{n(R.uniform(y0, y0 + h))}" r="{n(R.uniform(rmin, rmax))}" fill="{R.choice(cols)}"/>')
    defs.append(f'<pattern id="{pid}" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">{"".join(els)}</pattern>')
    body.append(f'<rect y="{y0}" width="{W}" height="{h}" fill="url(#{pid})"/>')


# ágyazat 2/4: egyenletes, apró szemek (r 0,18–0,35), sűrűn
crumbs("bed", BED, "#cdb68c", ["#e9dcc0", "#a8916a", "#f3ead7", "#b9a37c", "#8f7955"], 900, .18, .35)
# teherhordó 0/22 — hűvös, világos zúzottkő
layer("base", BASE, "#b4aa9c", 0, ["#8f8578", "#d9d3ca", "#a39a8d"], .35, 1.9, 4000, [f"c{i}" for i in range(4)], .62)
# fagyvédő 0/56 — meleg bézs zúzottkő, nagyobb szemek
layer("frost", FROST, "#b9a37f", 0, ["#8c7556", "#d8c7a6", "#a28a66"], .4, 4.9, 3000, [f"w{i}" for i in range(4)], .6)
# tömörített altalaj — tömör, finom morzsa
crumbs("soil", SOIL, "#7d604e", ["#6a4f3f", "#8d705c", "#5d4436", "#96796a"], 500, .14, .38)
# természetes talaj — sötétebb, lazább, nagyobb rögök
crumbs("nat", NAT, "#5c4335", ["#4a3428", "#6c5142", "#3f2d23", "#76594a"], 260, .2, .7)

for yy, op in ((BASE[0], .3), (FROST[0], .3), (SOIL[0], .75), (NAT[0], .4)):
    body.append(f'<path d="M0 {yy}H{W}" stroke="#2b2019" stroke-opacity="{op}" stroke-width="{1 if yy == SOIL[0] else .6}"/>')
body.append(f'<path d="M0 .4H{W}" stroke="#2b2019" stroke-opacity=".45" stroke-width=".8"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>')
open("public/hero/terko-retegrend.svg", "w").write(svg)
print(len(svg))
