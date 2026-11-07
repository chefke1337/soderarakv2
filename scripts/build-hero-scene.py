"""Hero építkezés-jelenet (oldalnézet) a lerakott térkő TETEJÉRE
→ public/hero/epitkezes.svg  (jelenet, talpvonal y = G = a térkősor teteje)
→ public/hero/terko-sor.svg  (lerakott térkősor oldalnézetben, csempe)

Ügyfél-irány (2026-11-07): markoló nincs; a térkő jobbról a szélesség 65%-án
lerakva; rajta egy teljes és egy megbontott, majdnem elfogyott raklap térkő,
egy kupac homok (benne lapát) és egy raklapnak támasztott seprű.

EGY LÉPTÉK az egész jelenetre: 0,8 egység / cm
  térkő 20×6 cm → 16×4,8 · EUR-raklap 120 cm hossz, 14,4 cm magas → 96×11,5
  raklapnyi térkő 10 sor (≈ 60 cm) · seprű 140 cm nyél, 35 cm fej
  homokkupac ≈ 1 m³: Ø ~1,9 m, ~0,55 m magas
A lerakott térkősor csempéje ugyanebben a léptékben (16×4,8), így a raklapon
lévő és a lerakott elemek pontosan egyforma méretűek.
Futtatás: python3 scripts/build-hero-scene.py
"""
import math
import random

R = random.Random(11)
U = 0.8                      # egység / cm
PL, PT = 20 * U, 6 * U       # térkő hossz, vastagság (oldalnézet)

# ── lerakott térkősor csempe ───────────────────────────────────────────────
tile = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {PL} {PT}" width="{PL}" height="{PT}" preserveAspectRatio="none">'
        '<defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9aaac"/><stop offset="1" stop-color="#808184"/></linearGradient></defs>'
        f'<rect width="{PL}" height="{PT}" fill="#cdb68c"/>'
        f'<rect x=".35" width="{PL-.7}" height="{PT}" rx=".7" fill="url(#p)"/>'
        f'<rect x=".9" y=".35" width="{PL-1.8}" height=".55" rx=".25" fill="#d0d1d3" opacity=".85"/>'
        '</svg>')
open("public/hero/terko-sor.svg", "w").write(tile)

# ── jelenet ────────────────────────────────────────────────────────────────
W, H = 440, 124
G = H - 0.5
defs = (
    '<linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9aaac"/><stop offset="1" stop-color="#828386"/></linearGradient>'
    '<linearGradient id="pv2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fa0a3"/><stop offset="1" stop-color="#78797c"/></linearGradient>'
    '<linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d2a06a"/><stop offset="1" stop-color="#a87342"/></linearGradient>'
    '<linearGradient id="wk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a67446"/><stop offset="1" stop-color="#7f552d"/></linearGradient>'
    '<linearGradient id="hd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6a46c"/><stop offset="1" stop-color="#9c6b3a"/></linearGradient>'
    '<linearGradient id="sand" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#efd79c"/><stop offset=".5" stop-color="#ddb96b"/><stop offset="1" stop-color="#b48c45"/></linearGradient>'
    '<linearGradient id="wrap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset=".6" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>'
    '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e9296"/><stop offset=".5" stop-color="#c9cdd0"/><stop offset="1" stop-color="#6f7377"/></linearGradient>'
    '<radialGradient id="sh"><stop offset="0" stop-color="#2b2019" stop-opacity=".3"/><stop offset="1" stop-color="#2b2019" stop-opacity="0"/></radialGradient>'
)
P = []
add = P.append
f1 = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")

PAL_W, PAL_H = 120 * U, 14.4 * U


def pallet(x):
    deck, block, bottom = 2.2 * U, 9.8 * U, 2.2 * U
    add(f'<rect x="{f1(x)}" y="{f1(G-PAL_H)}" width="{f1(PAL_W)}" height="{f1(deck)}" rx=".4" fill="url(#wd)"/>')
    for bx in (x, x + PAL_W / 2 - 7.2, x + PAL_W - 14.4):
        add(f'<rect x="{f1(bx)}" y="{f1(G-PAL_H+deck)}" width="14.4" height="{f1(block)}" fill="url(#wk)"/>')
    add(f'<rect x="{f1(x)}" y="{f1(G-bottom)}" width="{f1(PAL_W)}" height="{f1(bottom)}" fill="url(#wd)"/>')
    add(f'<rect x="{f1(x)}" y="{f1(G-PAL_H)}" width="{f1(PAL_W)}" height=".5" fill="#f0c995" opacity=".7"/>')


def paver(x, y, w=PL, tone="pv", rot=0.0):
    tr = f' transform="rotate({rot} {f1(x + w/2)} {f1(y + PT/2)})"' if rot else ""
    add(f'<g{tr}><rect x="{f1(x)}" y="{f1(y)}" width="{f1(w-.35)}" height="{f1(PT-.3)}" rx=".7" fill="url(#{tone})"/>'
        f'<rect x="{f1(x+.5)}" y="{f1(y+.3)}" width="{f1(w-1.35)}" height=".5" rx=".25" fill="#d0d1d3" opacity=".8"/></g>')


def stack(x, courses, layout=None):
    """layout: soronként a jelen lévő elemek indexei (None = teljes sor)"""
    base = G - PAL_H
    n = int(PAL_W // PL)  # 6 elem / sor
    for r in range(courses):
        y = base - (r + 1) * PT
        off = 0 if r % 2 == 0 else PL / 2
        idx = layout[r] if layout else None
        # eltolt kötés: páratlan sor fél elemmel indul
        pieces = []
        if off:
            pieces.append((x, PL / 2))
            for i in range(n - 1):
                pieces.append((x + PL / 2 + i * PL, PL))
            pieces.append((x + PL / 2 + (n - 1) * PL, PL / 2))
        else:
            pieces = [(x + i * PL, PL) for i in range(n)]
        for k, (px, w) in enumerate(pieces):
            if idx is not None and k not in idx:
                continue
            paver(px, y, w, "pv" if (r + k) % 3 else "pv2")
    return base - courses * PT


# talajárnyékok
for cx, rx in ((86, 56), (220, 54), (362, 78), (16, 14)):
    add(f'<ellipse cx="{cx}" cy="{f1(G)}" rx="{rx}" ry="2.4" fill="url(#sh)"/>')

# 1) TELJES raklap — 10 sor, zsugorfólia + pántok
fx = 38
pallet(fx)
top = stack(fx, 10)
add(f'<rect x="{f1(fx-.4)}" y="{f1(top-.6)}" width="{f1(PAL_W+.8)}" height="{f1(G-PAL_H-top+.6)}" rx="1.2" fill="url(#wrap)" stroke="#ffffff" stroke-opacity=".35" stroke-width=".5"/>')
for d in (14, 30, 52):
    add(f'<path d="M{f1(fx+d)} {f1(top)} l{f1(18)} {f1(G-PAL_H-top)}" stroke="#fff" stroke-opacity=".12" stroke-width="1.2"/>')
for sx in (fx + 22, fx + PAL_W - 24):
    add(f'<rect x="{f1(sx)}" y="{f1(top-.8)}" width="1.3" height="{f1(G-PAL_H-top+.8)}" fill="#2e4d72" opacity=".9"/>')
add(f'<rect x="{f1(fx-.4)}" y="{f1(top + 4.5*PT)}" width="{f1(PAL_W+.8)}" height="1.2" fill="#2e4d72" opacity=".85"/>')

# 2) SEPRŰ — fej laposan a térkövön, nyél a teljes raklap bal felső sarkának dőlve
head_l, head_w = 1.5, 35 * U * .8          # utcai seprű feje ~28 cm
hx, hy = head_l + head_w / 2, G - 3.6
cx_, cy_ = fx - .6, top + 6                  # érintési pont a raklap sarkán
L = 120 * U * .9                             # nyél ~ 108 cm (látható rész)
dx, dy = cx_ - hx, cy_ - hy
n_ = math.hypot(dx, dy)
ex, ey = hx + dx / n_ * L, hy + dy / n_ * L
add(f'<path d="M{f1(hx)} {f1(hy)} L{f1(ex)} {f1(ey)}" stroke="url(#hd)" stroke-width="2.1" stroke-linecap="round"/>')
add(f'<circle cx="{f1(ex)}" cy="{f1(ey)}" r="1.3" fill="#3a3531"/>')
add(f'<path d="M{f1(hx-2.2)} {f1(hy-1.6)} L{f1(hx+2.2)} {f1(hy-1.6)} L{f1(hx+1.2)} {f1(hy-5.5)} L{f1(hx-1.2)} {f1(hy-5.5)} Z" fill="#4a443e"/>')  # nyéltartó
add(f'<rect x="{f1(head_l)}" y="{f1(G-6.8)}" width="{f1(head_w)}" height="3.4" rx="1.2" fill="#3b4a3f"/>')          # seprűtest
add(f'<rect x="{f1(head_l+.4)}" y="{f1(G-6.6)}" width="{f1(head_w-.8)}" height=".7" rx=".3" fill="#5f7363" opacity=".8"/>')
add(f'<path d="M{f1(head_l+.6)} {f1(G-3.4)} H{f1(head_l+head_w-.6)} L{f1(head_l+head_w+.6)} {f1(G)} H{f1(head_l-.6)} Z" fill="#6a5a42"/>')  # sörte
for i in range(22):
    x = head_l + .8 + i * (head_w - 1.6) / 21
    add(f'<path d="M{f1(x)} {f1(G-3.2)} L{f1(x + (i-11)*.05)} {f1(G-.2)}" stroke="#4b3e2d" stroke-width=".3" opacity=".8"/>')

# 3) MEGBONTOTT, majdnem elfogyott raklap — pár elem maradt, egy kivett elem ferdén
ox = 172
pallet(ox)
stack(ox, 2, layout=[{0, 1, 2, 3}, {0, 1, 2}])
paver(ox + 4 * PL + 3, G - PAL_H - PT - 1.2, PL, "pv2", rot=-14)   # kiemelt, megdöntött elem
# elvágott pánt-végek
add(f'<path d="M{f1(ox+PAL_W-3)} {f1(G-PAL_H)} q5 -5 2 -10 q-3 -4 2 -8" fill="none" stroke="#2e4d72" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>')
add(f'<path d="M{f1(ox+2)} {f1(G-PAL_H)} q-4 -3 -2 -7" fill="none" stroke="#2e4d72" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>')

# 4) HOMOKKUPAC (~1 m³) + lapát benne
sx0, sx1, sh = 290, 438, 44
pk = 0.46
pts = []
for i in range(61):
    t = i / 60
    x = sx0 + (sx1 - sx0) * t
    u = abs(t - pk) / (1 - pk if t > pk else pk)
    y = G - sh * (1 - min(1, u) ** 1.85) ** 1.45 + 0.5 * math.sin(t * 23) * (1 - u)
    pts.append((x, y))
d = f"M{sx0} {f1(G)}" + "".join(f"L{f1(x)} {f1(y)}" for x, y in pts) + f"L{sx1} {f1(G)}Z"
add(f'<clipPath id="sc"><path d="{d}"/></clipPath>')
add(f'<path d="{d}" fill="url(#sand)"/>')
grains = "".join(f'<circle cx="{f1(R.uniform(sx0, sx1))}" cy="{f1(R.uniform(G-sh, G))}" r="{f1(R.uniform(.22,.48))}" fill="{R.choice(["#b88a3a", "#f4e2b2", "#c99f4c", "#a87f3a"])}"/>' for _ in range(420))
add(f'<g clip-path="url(#sc)">{grains}'
    f'<rect x="{sx0}" y="{f1(G-sh)}" width="{sx1-sx0}" height="{sh}" fill="none"/>'
    f'<path d="M{f1(sx0 + (sx1-sx0)*pk)} {f1(G-sh)} L{sx1} {f1(G)} H{f1(sx0 + (sx1-sx0)*pk)} Z" fill="#7a5520" opacity=".12"/></g>')
add(f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1" clip-path="url(#sc)"/>')
# lapát: nyél + lapátfej a homokba szúrva
lx, ly = sx0 + (sx1 - sx0) * 0.66, G - sh * 0.62
add(f'<path d="M{f1(lx)} {f1(ly)} L{f1(lx+22)} {f1(ly-62)}" stroke="url(#hd)" stroke-width="2" stroke-linecap="round"/>')
# T-fogantyú a nyél végén (merőleges rövid rúd)
add(f'<path d="M{f1(lx+22-3.2)} {f1(ly-62-1.1)} L{f1(lx+22+3.2)} {f1(ly-62+1.1)}" stroke="#3a3531" stroke-width="1.8" stroke-linecap="round"/>')
add(f'<g transform="rotate(19.5 {f1(lx)} {f1(ly)})"><path d="M{f1(lx-4.2)} {f1(ly)} h8.4 l-.6 9 q-3.6 3 -7.2 0 Z" fill="url(#steel)"/></g>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{defs}</defs>{"".join(P)}</svg>')
open("public/hero/epitkezes.svg", "w").write(svg)
print(len(svg), "jelenet; 1 egység =", 1 / U, "cm; csempe", PL, "x", PT)
