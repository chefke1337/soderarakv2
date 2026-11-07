"""Hero építkezés-jelenet (oldalnézet) a lerakott térkő TETEJÉRE
→ public/hero/epitkezes.svg   (jelenet, talpvonal y = 120 = a térkő teteje)
→ public/hero/terko-sor.svg   (lerakott térkősor oldalnézetben, csempe)

Ügyfél-irány (2026-11-07 20:21): markoló nincs; a térkő jobbról a szélesség
65%-án lerakva; rajta egy teljes és egy megbontott, majdnem elfogyott raklap
térkő, egy kupac homok és egy odatámasztott seprű. Generikus, márkajel nélkül.
Lépték: a térkő 20×8 cm-es elem → 35×14 egység (≈ 5,7 mm/egység, mint a rétegsáv).
Futtatás: python3 scripts/build-hero-scene.py
"""
import math
import random

R = random.Random(7)

# ── térkősor-csempe (oldalnézet): 1 elem + fuga ───────────────────────────
PW, PH = 35, 14
tile = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {PW} {PH}" width="{PW}" height="{PH}" preserveAspectRatio="none">'
        '<defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6a7a9"/><stop offset="1" stop-color="#7c7d80"/></linearGradient></defs>'
        f'<rect width="{PW}" height="{PH}" fill="#cdb68c"/>'               # fugahomok
        f'<rect x=".6" y=".4" width="{PW-1.2}" height="{PH-.4}" rx="1.6" fill="url(#p)"/>'
        f'<rect x="1.6" y=".9" width="{PW-3.2}" height="1.1" rx=".5" fill="#c9cacc" opacity=".8"/>'
        f'<rect x=".6" y="{PH-2.2}" width="{PW-1.2}" height="1.8" fill="#5f6063" opacity=".35"/>'
        '</svg>')
open("public/hero/terko-sor.svg", "w").write(tile)

# ── jelenet ────────────────────────────────────────────────────────────────
W, H, G = 440, 122, 120
defs = (
    '<linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3a4a6"/><stop offset="1" stop-color="#7f8083"/></linearGradient>'
    '<linearGradient id="pv2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#999a9d"/><stop offset="1" stop-color="#76777a"/></linearGradient>'
    '<linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c48e55"/><stop offset="1" stop-color="#9a6a37"/></linearGradient>'
    '<linearGradient id="hd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98551"/><stop offset="1" stop-color="#8f5f2e"/></linearGradient>'
    '<linearGradient id="sand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ead08e"/><stop offset=".55" stop-color="#dcb767"/><stop offset="1" stop-color="#b8924a"/></linearGradient>'
    '<radialGradient id="sh"><stop offset="0" stop-color="#2b2019" stop-opacity=".32"/><stop offset="1" stop-color="#2b2019" stop-opacity="0"/></radialGradient>'
)
P = []
add = P.append


def pallet(x, w):
    add(f'<rect x="{x}" y="{G-11}" width="{w}" height="3.5" rx=".6" fill="url(#wd)"/>')
    for bx in (x + 2, x + w / 2 - 6, x + w - 14):
        add(f'<rect x="{bx:.1f}" y="{G-7.5}" width="12" height="5.5" fill="#8d5e31"/>')
    add(f'<rect x="{x}" y="{G-2.2}" width="{w}" height="2.2" fill="#a47240"/>')


def course(x, w, y, rh, k, joints_from=None, joints_to=None):
    add(f'<rect x="{x}" y="{y:.1f}" width="{w}" height="{rh-.6:.1f}" rx="1.2" fill="url(#{"pv" if k % 2 else "pv2"})"/>')
    add(f'<rect x="{x+1}" y="{y+.5:.1f}" width="{w-2}" height=".9" rx=".4" fill="#c3c4c6" opacity=".7"/>')
    off = 0 if k % 2 else 11
    j = x + 22 + off
    while j < x + w - 4:
        add(f'<rect x="{j:.1f}" y="{y:.1f}" width=".9" height="{rh-.6:.1f}" fill="#5f6063"/>')
        j += 22


# talajárnyékok
for cx, rx in ((92, 62), (222, 58), (360, 72), (30, 16)):
    add(f'<ellipse cx="{cx}" cy="{G}" rx="{rx}" ry="3" fill="url(#sh)"/>')

# 1) TELJES raklap (x 44–140): 7 sor, pántolva, fóliasarok
px, pw, rh = 44, 96, 7.2
pallet(px, pw)
for r in range(7):
    course(px + 2, pw - 4, G - 11 - (r + 1) * rh, rh, r)
top = G - 11 - 7 * rh
for sx in (px + 18, px + pw - 20):
    add(f'<rect x="{sx}" y="{top-.6:.1f}" width="1.6" height="{7*rh+1.2:.1f}" fill="#2f4a6b" opacity=".85"/>')
add(f'<path d="M{px+2} {top:.1f} h{pw-4} v6 Q{px+pw/2} {top+3:.1f} {px+2} {top+6:.1f} Z" fill="#ffffff" opacity=".18"/>')  # zsugorfólia-fény

# 2) SEPRŰ a teljes raklapnak támasztva (bal oldalán)
hx0, hy0, hx1, hy1 = 14, G - 6, 46, top + 8
add(f'<path d="M{hx0} {hy0} L{hx1} {hy1:.1f}" stroke="url(#hd)" stroke-width="2.4" stroke-linecap="round"/>')
ang = math.degrees(math.atan2(hy1 - hy0, hx1 - hx0))
add(f'<g transform="translate({hx0} {hy0}) rotate({ang + 90:.1f})">'
    '<rect x="-12" y="-2.2" width="24" height="4" rx="1.2" fill="#3a3531"/>'      # seprűfej (fa/műanyag)
    '<path d="M-11.5 1.8 H11.5 L12.5 8.5 H-12.5 Z" fill="#5b4a37"/>'              # sűrű sörte
    + "".join(f'<path d="M{-11 + i*1.15:.2f} 2 V8.3" stroke="#3f3226" stroke-width=".35" opacity=".7"/>' for i in range(20))
    + "</g>")

# 3) MEGBONTOTT, majdnem elfogyott raklap (x 176–272): 1 hiányos sor + kiszedett elem
qx, qw = 176, 96
pallet(qx, qw)
y1 = G - 11 - rh
for i, bx in enumerate((qx + 2, qx + 24)):
    add(f'<rect x="{bx}" y="{y1:.1f}" width="21.2" height="{rh-.6:.1f}" rx="1.2" fill="url(#pv)"/>')
    add(f'<rect x="{bx+1}" y="{y1+.5:.1f}" width="19.2" height=".9" rx=".4" fill="#c3c4c6" opacity=".7"/>')
# egy elem ferdén a sor tetején
add(f'<g transform="translate({qx+30} {y1-3:.1f}) rotate(-9)"><rect width="21" height="6.6" rx="1.2" fill="url(#pv2)"/>'
    '<rect x="1" y=".5" width="19" height=".9" rx=".4" fill="#c3c4c6" opacity=".7"/></g>')
# elvágott pánt a raklap mellett
add(f'<path d="M{qx+qw-6} {G-11} q6 -8 1 -14 q-4 -5 3 -9" fill="none" stroke="#2f4a6b" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>')

# 4) HOMOKKUPAC (x 300–425)
sx0, sx1, sh = 298, 426, 34
pts = []
for i in range(0, 41):
    t = i / 40
    x = sx0 + (sx1 - sx0) * t
    u = abs(t - 0.47) / (0.53 if t > 0.47 else 0.47)
    y = G - sh * (1 - min(1, u) ** 1.9) ** 1.35
    pts.append((x, y))
d = f"M{sx0} {G}" + "".join(f"L{x:.1f} {y:.1f}" for x, y in pts) + f"L{sx1} {G}Z"
add(f'<path d="{d}" fill="url(#sand)"/>')
add(f'<clipPath id="sc"><path d="{d}"/></clipPath>')
grains = "".join(f'<circle cx="{R.uniform(sx0, sx1):.1f}" cy="{R.uniform(G-sh, G):.1f}" r="{R.uniform(.25,.55):.2f}" fill="{R.choice(["#b88a3a", "#f1dca6", "#c99f4c"])}"/>' for _ in range(260))
add(f'<g clip-path="url(#sc)">{grains}</g>')
add(f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.2" clip-path="url(#sc)"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{defs}</defs>{"".join(P)}</svg>')
open("public/hero/epitkezes.svg", "w").write(svg)
print(len(svg), len(tile))
