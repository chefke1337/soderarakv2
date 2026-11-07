"""Hero építkezés-jelenet (oldalnézet) a lerakott térkő TETEJÉRE
→ public/hero/epitkezes.svg  (jelenet; talpvonal y = G = a térkősor teteje)
→ public/hero/terko-sor.svg  (lerakott térkősor oldalnézetben, csempe)

Ügyfél-irány (2026-11-07): a térkő jobbról a szélesség 65%-án lerakva; rajta
egy teljes és egy megbontott, majdnem elfogyott raklap térkő, egy kupac homok
és egy odatámasztott seprű. Markoló nincs.

TÖRTÉNET / ELRENDEZÉS (balról jobbra, a munkafront felől):
  munkafront (35%) → megbontott raklap (épp innen rakják) → homokkupac (fuga-
  és ágyazóhomok, benne lapát) → teljes raklap → seprű a raklapnak dőlve
  (a kész felületen söprik be a fugahomokot).

EGY LÉPTÉK: 0,8 egység / cm (térkő 20×6 cm → 16×4,8; EUR-raklap 120×14,4 cm;
10 sor térkő ≈ 60 cm; seprű 140 cm; homok ≈ 1 m³).
FIZIKA:
  homokkupac: természetes rézsűszög ≈ 34° (száraz homok) → 1 m³-re
    r = ∛(3V / (π·tg34°)) ≈ 1,12 m, h ≈ 0,76 m; egyenes rézsű, lekerekített
    tető, homorúan kifutó láb, a lábnál szétpergett szemek.
  seprű: a feje a földön fekszik, a nyél a raklap felső élén támaszkodik
    (két alátámasztási pont, a súlypont közöttük).
  kiemelt térkő: egyik vége a raklap deszkáján, a másik a soron fekszik.
  fény balról-felülről → árnyék jobbra, kontaktárnyék minden talppontnál.
Futtatás: python3 scripts/build-hero-scene.py
"""
import math
import random

R = random.Random(20261107)
U = 0.8
PL, PT = 20 * U, 6 * U
f1 = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")

# ── lerakott térkősor csempe ───────────────────────────────────────────────
tile = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f1(PL)} {f1(PT)}" width="{f1(PL)}" height="{f1(PT)}" preserveAspectRatio="none">'
        '<defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#acadaf"/><stop offset=".2" stop-color="#9c9da0"/><stop offset="1" stop-color="#7c7d80"/></linearGradient></defs>'
        f'<rect width="{f1(PL)}" height="{f1(PT)}" fill="#cdb68c"/>'
        f'<rect x=".3" width="{f1(PL-.6)}" height="{f1(PT)}" rx=".6" fill="url(#p)"/>'
        f'<rect x=".8" y=".3" width="{f1(PL-1.6)}" height=".45" rx=".2" fill="#d6d7d9"/>'
        '</svg>')
open("public/hero/terko-sor.svg", "w").write(tile)

# ── jelenet ────────────────────────────────────────────────────────────────
W, H = 620, 100
G = H - 0.4
defs = [
    '<linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a873"/><stop offset="1" stop-color="#ad7845"/></linearGradient>',
    '<linearGradient id="wk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87648"/><stop offset="1" stop-color="#7a4f29"/></linearGradient>',
    '<linearGradient id="hd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e0b27a"/><stop offset="1" stop-color="#9c6b3a"/></linearGradient>',
    '<linearGradient id="wrap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".35" stop-color="#fff" stop-opacity=".07"/><stop offset=".55" stop-color="#fff" stop-opacity=".18"/><stop offset=".7" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>',
    '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d8287"/><stop offset=".45" stop-color="#d3d7da"/><stop offset="1" stop-color="#666b70"/></linearGradient>',
    # beton szemcsézet (térkő felület)
    '<filter id="conc" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="3"/>'
    '<feColorMatrix values="0 0 0 0 .25  0 0 0 0 .25  0 0 0 0 .26  0 0 0 1.4 -.62"/><feComposite in2="SourceGraphic" operator="in"/></filter>',
    # homok szemcsézet
    '<filter id="grit" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="2" seed="8"/>'
    '<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .12  0 0 0 1.6 -.66"/><feComposite in2="SourceGraphic" operator="in"/></filter>',
    '<filter id="gritl" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="2.1" numOctaves="1" seed="21"/>'
    '<feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .8  0 0 0 1.5 -.75"/><feComposite in2="SourceGraphic" operator="in"/></filter>',
    '<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>',
]
P = []
add = P.append
PAL_W, PAL_H = 120 * U, 14.4 * U
TONES = [("#b0b1b3", "#828386"), ("#a6a7aa", "#7a7b7e"), ("#a9a9a8", "#7f7f7d"), ("#a2a4a7", "#77797c")]
for i, (a, b) in enumerate(TONES):
    defs.append(f'<linearGradient id="t{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/><stop offset=".18" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')


def shadow(x0, x1, strength=.35, dy=0.0):
    """kontaktárnyék: fény balról → az árnyék jobbra nyúlik"""
    w = x1 - x0
    add(f'<ellipse cx="{f1(x0 + w*.56)}" cy="{f1(G + dy)}" rx="{f1(w*.55)}" ry="1.6" fill="#2b2019" opacity="{strength}" filter="url(#soft)"/>')


def pallet(x):
    deck, block, bottom = 2.2 * U, 9.8 * U, 2.2 * U
    y0 = G - PAL_H
    add(f'<rect x="{f1(x)}" y="{f1(y0)}" width="{f1(PAL_W)}" height="{f1(deck)}" fill="url(#wd)"/>')
    for bx in (x, x + PAL_W / 2 - 7.2, x + PAL_W - 14.4):
        add(f'<rect x="{f1(bx)}" y="{f1(y0+deck)}" width="14.4" height="{f1(block)}" fill="url(#wk)"/>')
        add(f'<rect x="{f1(bx+.6)}" y="{f1(y0+deck+1.4)}" width="13.2" height=".35" fill="#5e3c1e" opacity=".35"/>')
        for nx in (bx + 3, bx + 11.4):
            add(f'<circle cx="{f1(nx)}" cy="{f1(y0+deck/2)}" r=".35" fill="#4a4540"/>')
    add(f'<rect x="{f1(x)}" y="{f1(G-bottom)}" width="{f1(PAL_W)}" height="{f1(bottom)}" fill="url(#wd)"/>')
    # fa-erezet
    for yy in (y0 + .6, y0 + 1.2, G - bottom + .7):
        xx = x + R.uniform(2, 10)
        while xx < x + PAL_W - 8:
            L_ = R.uniform(8, 22)
            add(f'<path d="M{f1(xx)} {f1(yy)}h{f1(L_)}" stroke="#8a5a2c" stroke-width=".22" opacity=".55"/>')
            xx += L_ + R.uniform(4, 12)
    add(f'<rect x="{f1(x)}" y="{f1(y0)}" width="{f1(PAL_W)}" height=".45" fill="#f3d2a4" opacity=".8"/>')
    shadow(x, x + PAL_W, .4)


def paver(x, y, w=PL, rot=0.0, pivot=None):
    t = R.randrange(len(TONES))
    tr = ""
    if rot:
        px_, py_ = pivot if pivot else (x + w / 2, y + PT / 2)
        tr = f' transform="rotate({f1(rot)} {f1(px_)} {f1(py_)})"'
    add(f'<g{tr}><rect x="{f1(x)}" y="{f1(y)}" width="{f1(w-.3)}" height="{f1(PT-.25)}" rx=".7" fill="url(#t{t})"/>'
        f'<rect x="{f1(x+.45)}" y="{f1(y+.25)}" width="{f1(w-1.2)}" height=".42" rx=".2" fill="#dadbdd" opacity=".9"/>'
        f'<rect x="{f1(x)}" y="{f1(y + PT - 1.1)}" width="{f1(w-.3)}" height=".85" rx=".4" fill="#5d5e61" opacity=".35"/></g>')


def stack(x, courses, layout=None):
    base = G - PAL_H
    n = int(round(PAL_W / PL))
    for r in range(courses):
        y = base - (r + 1) * PT
        if r % 2:
            pieces = [(x, PL / 2)] + [(x + PL / 2 + i * PL, PL) for i in range(n - 1)] + [(x + PL / 2 + (n - 1) * PL, PL / 2)]
        else:
            pieces = [(x + i * PL, PL) for i in range(n)]
        for k, (px_, w) in enumerate(pieces):
            if layout is None or k in layout[r]:
                paver(px_, y, w)
    return base - courses * PT


# ── 1) MEGBONTOTT raklap (a munkafront mellett) ─────────────────────────────
ox = 6
pallet(ox)
stack(ox, 2, layout=[{0, 1, 2, 3}, {0, 1, 2}])
# kiemelt elem: bal vége a 2. soron (k=2 jobb széle), jobb vége a raklap deszkáján
lx0, ly0 = ox + 4 * PL - 3.0, G - PAL_H - PT                   # az alsó sor jobb végének teteje (alátámasztás)
rx1, ry1 = ox + PAL_W - 1.0, G - PAL_H                          # a deszka jobb vége
ang = math.degrees(math.atan2(ry1 - ly0, rx1 - lx0))
Lp = math.hypot(rx1 - lx0, ry1 - ly0)
add(f'<g transform="translate({f1(lx0)} {f1(ly0)}) rotate({f1(ang)})"><rect x="-1.5" y="{f1(-PT)}" width="{f1(PL)}" height="{f1(PT-.25)}" rx=".7" fill="url(#t1)"/>'
    f'<rect x="-1" y="{f1(-PT+.25)}" width="{f1(PL-1)}" height=".42" rx=".2" fill="#dadbdd" opacity=".9"/></g>')
# elvágott pántok a deszkán
add(f'<path d="M{f1(ox+PAL_W-5)} {f1(G-PAL_H)} c3 -2 4 -6 1 -8 s-1 -6 3 -7" fill="none" stroke="#2e4d72" stroke-width=".9" stroke-linecap="round"/>')
add(f'<path d="M{f1(ox+4)} {f1(G-PAL_H)} c-3 -1 -4 -4 -1 -6" fill="none" stroke="#2e4d72" stroke-width=".9" stroke-linecap="round"/>')

# ── 2) HOMOKKUPAC ≈ 1 m³, rézsű 34° ─────────────────────────────────────────
phi = math.radians(34)
r_m = (3 * 1.0 / (math.pi * math.tan(phi))) ** (1 / 3)        # ≈ 1,12 m
h_m = r_m * math.tan(phi)                                      # ≈ 0,76 m
rr, hh = r_m * 100 * U, h_m * 100 * U
cx = 128 + rr
crest = rr * 0.16            # lekerekített tető fél-szélessége
toe = rr * 0.10              # homorú láb kifutása
pts = []
for i in range(0, 121):
    x = cx - rr - toe + (2 * rr + 2 * toe) * i / 120
    dxa = abs(x - cx) * (1.0 if x < cx else 0.94)   # enyhe aszimmetria
    if dxa <= crest:
        y = hh - (dxa ** 2) / (2 * crest) * math.tan(phi)
    else:
        y = hh - crest / 2 * math.tan(phi) - (dxa - crest) * math.tan(phi)
    if dxa > rr - toe:                                  # homorú kifutás
        k = (dxa - (rr - toe)) / (2 * toe)
        y = max(0.0, (1 - min(1, k)) ** 2 * (math.tan(phi) * toe))
    y += 0.35 * math.sin(i * 0.9) * (y / hh)            # finom felszíni egyenetlenség
    pts.append((x, G - max(0.0, y)))
pd = f"M{f1(pts[0][0])} {f1(G)}" + "".join(f"L{f1(x)} {f1(y)}" for x, y in pts) + f"L{f1(pts[-1][0])} {f1(G)}Z"
defs.append('<linearGradient id="sandL" x1="0" y1="0" x2="1" y2="0">'
            f'<stop offset="0" stop-color="#e6cb8b"/><stop offset=".42" stop-color="#f0d9a2"/>'
            f'<stop offset=".5" stop-color="#e2c27c"/><stop offset=".62" stop-color="#d0a85c"/><stop offset="1" stop-color="#b08744"/></linearGradient>')
defs.append(f'<linearGradient id="sandV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a3d14" stop-opacity=".18"/></linearGradient>')
defs.append(f'<clipPath id="sc"><path d="{pd}"/></clipPath>')
shadow(cx - rr, cx + rr + toe, .32)
add(f'<path d="{pd}" fill="url(#sandL)"/>')
add(f'<g clip-path="url(#sc)"><rect x="{f1(cx-rr-toe)}" y="{f1(G-hh)}" width="{f1(2*rr+2*toe)}" height="{f1(hh)}" fill="url(#sandV)"/>'
    f'<rect x="{f1(cx-rr-toe)}" y="{f1(G-hh)}" width="{f1(2*rr+2*toe)}" height="{f1(hh)}" filter="url(#grit)"/>'
    f'<rect x="{f1(cx-rr-toe)}" y="{f1(G-hh)}" width="{f1(2*rr+2*toe)}" height="{f1(hh)}" filter="url(#gritl)" opacity=".8"/>'
    # lepergett csíkok a rézsűn (a gravitáció irányában, lejtővel párhuzamos)
    + "".join(f'<path d="M{f1(cx + s*(crest + R.uniform(2, rr*.6)))} {f1(G - hh*R.uniform(.35, .8))} l{f1(s*R.uniform(5,12))} {f1(R.uniform(5,12)*math.tan(phi))}" stroke="{"#f6e6bd" if s < 0 else "#9c7535"}" stroke-width=".5" opacity=".45" stroke-linecap="round"/>' for s in (-1, 1) for _ in range(7))
    + "</g>")
# szétpergett szemek a lábnál
for _ in range(60):
    side = R.choice((-1, 1))
    x = cx + side * (rr + toe + R.expovariate(1 / 3.2))
    add(f'<circle cx="{f1(x)}" cy="{f1(G - R.uniform(.1, .5))}" r="{f1(R.uniform(.18, .38))}" fill="{R.choice(["#d9b46a", "#c99f4c", "#ead09a"])}"/>')
# lapát a homokba szúrva (a fej a homokban, nyél ~ 65°)
sx = cx + rr * 0.35
sy = G - (hh - crest / 2 * math.tan(phi) - (rr * 0.35 - crest) * math.tan(phi)) + 3.5
la = math.radians(-66)
L_h = 96 * U
ex, ey = sx + math.cos(la) * L_h, sy + math.sin(la) * L_h
add(f'<path d="M{f1(sx)} {f1(sy)} L{f1(ex)} {f1(ey)}" stroke="url(#hd)" stroke-width="1.7" stroke-linecap="round"/>')
px_, py_ = -math.sin(la), math.cos(la)
add(f'<path d="M{f1(ex - px_*3)} {f1(ey - py_*3)} L{f1(ex + px_*3)} {f1(ey + py_*3)}" stroke="#2f2b28" stroke-width="1.6" stroke-linecap="round"/>')
add(f'<g clip-path="url(#sc)" opacity=".0"></g>')
# a lapátfej felső része látszik a homok fölött
add(f'<g transform="translate({f1(sx)} {f1(sy)}) rotate({f1(math.degrees(la) + 90)})"><path d="M-3.4 -1 h6.8 v4.2 h-6.8 Z" fill="url(#steel)"/></g>')

# ── 3) TELJES raklap ────────────────────────────────────────────────────────
fx = cx + rr + toe + 30
pallet(fx)
top = stack(fx, 10)
hgt = G - PAL_H - top
add(f'<path d="M{f1(fx-.5)} {f1(G-PAL_H+.6)} V{f1(top+1.2)} Q{f1(fx-.5)} {f1(top-.7)} {f1(fx+1.4)} {f1(top-.7)} H{f1(fx+PAL_W-1.4)} Q{f1(fx+PAL_W+.5)} {f1(top-.7)} {f1(fx+PAL_W+.5)} {f1(top+1.2)} V{f1(G-PAL_H+.6)} Z" fill="url(#wrap)" stroke="#fff" stroke-opacity=".4" stroke-width=".35"/>')
for d, wd in ((10, 1.2), (26, .6), (47, 1.6), (70, .7)):
    add(f'<path d="M{f1(fx+d)} {f1(top)} l{f1(hgt*.32)} {f1(hgt)}" stroke="#fff" stroke-opacity=".14" stroke-width="{wd}"/>')
for sxp in (fx + 22, fx + PAL_W - 24):
    add(f'<rect x="{f1(sxp)}" y="{f1(top-.9)}" width="1.1" height="{f1(hgt+.9)}" fill="#2e4d72"/>')
add(f'<rect x="{f1(fx-.5)}" y="{f1(top + 4.5*PT)}" width="{f1(PAL_W+1)}" height="1" fill="#2e4d72"/>')
# beton szemcsézet a köveken (a kötegre és a megbontott raklapra)
add(f'<rect x="{f1(fx)}" y="{f1(top)}" width="{f1(PAL_W)}" height="{f1(hgt)}" fill="#999" filter="url(#conc)" opacity=".55"/>')

# ── 4) SEPRŰ a teljes raklap jobb felső élének dőlve ─────────────────────────
corner = (fx + PAL_W + .5, top + .3)
head_w = 30 * U
hx = corner[0] + 30                         # a nyél talppontja (a fej közepe)
hy = G - 3.4
dx, dy = corner[0] - hx, corner[1] - hy
n_ = math.hypot(dx, dy)
Lb = 140 * U * .82
ex, ey = hx + dx / n_ * Lb, hy + dy / n_ * Lb
add(f'<path d="M{f1(hx)} {f1(hy)} L{f1(ex)} {f1(ey)}" stroke="url(#hd)" stroke-width="1.8" stroke-linecap="round"/>')
add(f'<circle cx="{f1(ex)}" cy="{f1(ey)}" r="1.1" fill="#3a3531"/>')
add(f'<path d="M{f1(hx-2)} {f1(hy-1.2)} H{f1(hx+2)} L{f1(hx+1.1)} {f1(hy-4.6)} H{f1(hx-1.1)} Z" fill="#4a443e"/>')
hl = hx - head_w / 2
add(f'<rect x="{f1(hl)}" y="{f1(G-6.2)}" width="{f1(head_w)}" height="3" rx="1" fill="#384539"/>')
add(f'<rect x="{f1(hl+.4)}" y="{f1(G-6)}" width="{f1(head_w-.8)}" height=".55" rx=".25" fill="#6a7f6d"/>')
add(f'<path d="M{f1(hl+.5)} {f1(G-3.2)} H{f1(hl+head_w-.5)} L{f1(hl+head_w+.7)} {f1(G)} H{f1(hl-.7)} Z" fill="#6e5c42"/>')
for i in range(26):
    x = hl + .7 + i * (head_w - 1.4) / 25
    add(f'<path d="M{f1(x)} {f1(G-3)} L{f1(x + (i-12.5)*.045)} {f1(G-.15)}" stroke="#46392a" stroke-width=".28" opacity=".85"/>')
shadow(hl - 1, hl + head_w + 1, .35)
# kontaktárnyék a raklapélen
add(f'<circle cx="{f1(corner[0]+.6)}" cy="{f1(corner[1]+1)}" r="1.4" fill="#2b2019" opacity=".25" filter="url(#soft)"/>')

W_used = int(hx + head_w / 2 + 8)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W_used} {H}" width="{W_used}" height="{H}">'
       f'<defs>{"".join(defs)}</defs>{"".join(P)}</svg>')
open("public/hero/epitkezes.svg", "w").write(svg)
print(len(svg), "W", W_used, "homok r", round(r_m, 2), "m h", round(h_m, 2), "m")
