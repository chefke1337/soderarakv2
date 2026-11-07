"""Anyagtextúra-csempék (a kupacok színvilága: src/lib/grain.ts MATERIAL_COLOR)
CSS-változóként, data URI-ban → src/app/globals.css „anyagtextura" blokkja.

Használat a CSS-ben: var(--tex-soder) … var(--tex-fold); osztályok: .tex-<tone>.
A .label-strata kis ikonja a hat anyag textúrájából áll (globálisan, minden oldalon).
Determinisztikus. Futtatás: python3 scripts/build-material-textures.py
"""
import random
import re
from urllib.parse import quote

src = open("src/lib/grain.ts").read()
COL = {}
for tone, base, grains in re.findall(r'(\w+): \{ base: "(#[0-9a-f]{6})", grains: \[([^\]]*)\]', src):
    COL[tone] = (base, re.findall(r'#[0-9a-f]{6}', grains))
ORDER = ["soder", "homok", "kavics", "murva", "andezit", "fold"]   # a katalógus sorrendje
# szemcseméret a kupacok jellegét követi (homok finom, kavics gömbölyű, murva/andezit szögletes, föld rögös)
KIND = {"homok": ("c", 34, .28, .5), "soder": ("c", 26, .3, .9), "kavics": ("e", 14, .7, 1.3),
        "murva": ("p", 18, .5, 1.1), "andezit": ("p", 18, .5, 1.1), "fold": ("c", 22, .3, 1.0)}
W, H = 12, 8


def tile(tone, seed):
    R = random.Random(seed)
    base, grains = COL[tone]
    kind, n, rmin, rmax = KIND[tone]
    els = [f'<rect width="{W}" height="{H}" fill="{base}"/>']
    for _ in range(n):
        x, y, r, c = R.uniform(0, W), R.uniform(0, H), R.uniform(rmin, rmax), R.choice(grains)
        if kind == "c":
            els.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="{c}"/>')
        elif kind == "e":
            els.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r:.2f}" ry="{r*.7:.2f}" fill="{c}"/>')
        else:
            pts = " ".join(f"{x + r*R.uniform(.6,1.1)*__import__('math').cos(k*1.2566+R.uniform(-.3,.3)):.1f},{y + r*R.uniform(.6,1.1)*__import__('math').sin(k*1.2566+R.uniform(-.3,.3)):.1f}" for k in range(5))
            els.append(f'<polygon points="{pts}" fill="{c}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
           + "".join(els) + "</svg>")
    return "url(\"data:image/svg+xml," + quote(svg, safe=" =:/,.'-") .replace('"', "'") + "\")"


lines = ["/* anyagtextura:start — GENERÁLT (scripts/build-material-textures.py), ne kézzel szerkeszd */", ":root {"]
for i, t in enumerate(ORDER):
    lines.append(f"  --tex-{t}: {tile(t, 100 + i)};")
lines.append("}")
for t in ORDER:
    lines.append(f".tex-{t} {{ background: var(--tex-{t}) center / auto 100% repeat; }}")
lines.append("/* anyagtextura:end */")
block = "\n".join(lines)

css = open("src/app/globals.css").read()
if "/* anyagtextura:start" in css:
    css = re.sub(r"/\* anyagtextura:start.*?/\* anyagtextura:end \*/", block, css, flags=re.S)
else:
    css = css.rstrip() + "\n\n" + block + "\n"
open("src/app/globals.css", "w").write(css)
print(len(block))
