"""Hero „talaj": térkő-rétegrend metszet (statikus SVG) → public/hero/terko-retegrend.svg

Felülről lefelé (az ügyfél referenciaképe szerint): beton térkő, ágyazat,
teherhordó réteg, fagyvédő réteg, tömörített altalaj (egyenes határ), alatta a
természetes, hullámos talajrétegek. Determinisztikus (seed), újrafuttatható.
"""
import math, random  # noqa: E401
W, H = 2400, 176
R = random.Random(20261107)
o = []
def f(x): return f"{x:.1f}".rstrip("0").rstrip(".")

# rétegek (y, magasság)
PAVE_Y, PAVE_H = 0, 20
BED_Y, BED_H = 20, 8
BASE_Y, BASE_H = 28, 30
FROST_Y, FROST_H = 58, 38
SOIL_Y, SOIL_H = 96, 26
NAT_Y = 122

TW = 320  # mintacsempe szélessége — a szemcsék csempézve (kis fájlméret)
defs = []
def speckle(y, h, n, cols, kind, size):
    n = int(n * TW / W)
    global o
    keep, o = o, []
    for _ in range(n):
        x = R.uniform(0, TW); yy = R.uniform(y + 1, y + h - 1)
        c = R.choice(cols)
        if kind == "dot":
            o.append(f'<circle cx="{f(x)}" cy="{f(yy)}" r="{f(R.uniform(*size))}" fill="{c}"/>')
        else:  # rövid zúzottkő-szilánk
            L = R.uniform(*size); a = R.uniform(0, math.pi)
            dx, dy = math.cos(a) * L / 2, math.sin(a) * L / 2
            o.append(f'<path d="M{f(x-dx)} {f(yy-dy)}L{f(x+dx)} {f(yy+dy)}" stroke="{c}" stroke-width="{f(R.uniform(0.9,1.6))}" stroke-linecap="round"/>')
    pid = f"p{len(defs)}"
    defs.append(f'<pattern id="{pid}" width="{TW}" height="{H}" patternUnits="userSpaceOnUse">' + "".join(o) + "</pattern>")
    o = keep
    o.append(f'<rect y="{y}" width="{W}" height="{h}" fill="url(#{pid})"/>')

# ágyazat 2/4
o.append(f'<rect y="{BED_Y}" width="{W}" height="{BED_H}" fill="#c8b48c"/>')
speckle(BED_Y, BED_H, 1400, ["#a38f68", "#8f7c58", "#e0d0ad"], "dot", (0.5, 0.9))
# teherhordó 0/22
o.append(f'<rect y="{BASE_Y}" width="{W}" height="{BASE_H}" fill="#e7d9cf"/>')
speckle(BASE_Y, BASE_H, 900, ["#7b6a62", "#a08e85", "#5f514b"], "dash", (1.6, 3.6))
speckle(BASE_Y, BASE_H, 900, ["#b9a69b", "#cdbcb1"], "dot", (0.5, 1.0))
# fagyvédő 0/56
o.append(f'<rect y="{FROST_Y}" width="{W}" height="{FROST_H}" fill="#e3d0a8"/>')
speckle(FROST_Y, FROST_H, 1100, ["#5c4a36", "#7a6449", "#46382a"], "dash", (2.6, 5.4))
speckle(FROST_Y, FROST_H, 700, ["#c4ad80", "#b49b6c"], "dot", (0.6, 1.2))
# tömörített altalaj — egyenes felső határ, finom tömörítési vonalak
o.append(f'<rect y="{SOIL_Y}" width="{W}" height="{SOIL_H}" fill="#7a5f4f"/>')
for i, yy in enumerate((SOIL_Y + 7, SOIL_Y + 14, SOIL_Y + 21)):
    x = R.uniform(0, 60)
    while x < W:
        L = R.uniform(18, 60)
        o.append(f'<path d="M{f(x)} {yy}h{f(L)}" stroke="#6a5144" stroke-width="1"/>')
        x += L + R.uniform(14, 40)
o.append(f'<path d="M0 {SOIL_Y}H{W}" stroke="#4f3b30" stroke-width="1.2"/>')

# természetes, hullámos rétegek
def wave(y0, amp, ph, f1, f2):
    pts = [(x, y0 + amp*math.sin(x/W*math.pi*f1+ph) + amp*0.45*math.sin(x/W*math.pi*f2+ph*1.7)) for x in range(0, W+1, 48)]
    d = f"M0 {f(pts[0][1])}"
    for i in range(1, len(pts)):
        (x0, a), (x1, b) = pts[i-1], pts[i]
        d += f" Q{x0} {f(a)} {f((x0+x1)/2)} {f((a+b)/2)}"
    return d + f" T{W} {f(pts[-1][1])}"
o.append(f'<rect y="{NAT_Y}" width="{W}" height="{H-NAT_Y}" fill="#5e4535"/>')
for (y0, amp, ph, f1, f2), fill in zip(
    [(NAT_Y + 14, 5, 0.3, 3.2, 7.9), (NAT_Y + 30, 5, 1.4, 3.8, 8.3), (NAT_Y + 44, 4, 2.6, 4.6, 9.2)],
    ["#553d2f", "#4b3529", "#412e24"]):
    d = wave(y0, amp, ph, f1, f2)
    o.append(f'<path d="{d} L{W} {H} L0 {H}Z" fill="{fill}"/>')
    o.append(f'<path d="{d}" fill="none" stroke="#7a5f4f" stroke-opacity=".55" stroke-width="1"/>')

# beton térkő — lekerekített sarkú kövek fugával
x = -R.uniform(0, 40)
while x < W:
    w = 104
    tone = R.choice(["#8e9093", "#94969a", "#888a8e", "#9a9c9f"])
    o.append(f'<rect x="{f(x+2)}" y="{PAVE_Y+1}" width="{w-4}" height="{PAVE_H-1}" rx="4" fill="{tone}"/>')
    o.append(f'<path d="M{f(x+6)} {PAVE_Y+2.2}h{w-12}" stroke="#b7b9bc" stroke-width="1.2" stroke-linecap="round"/>')
    x += w

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       + "<defs>" + "".join(defs) + "</defs>" + "".join(o) + "</svg>")
open("public/hero/terko-retegrend.svg", "w").write(svg)
print(len(svg))
