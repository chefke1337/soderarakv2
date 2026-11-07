"""Hero építkezés-jelenet (oldalnézet) a rétegrend-sáv TETEJÉRE
→ public/hero/epitkezes.svg

Generikus, márkajelzés nélküli grafika: lánctalpas markoló (kanállal az
ágyazatba nyúlva), raklapon rakott térkő, mellette pár lerakott térkőelem.
Talpvonal: y = 120 (a sáv felső éle). Lapos, puha árnyalású stílus.
Futtatás: python3 scripts/build-hero-scene.py
"""
W, H = 600, 122
G = 120  # talpvonal

parts = []
add = parts.append

defs = """
<linearGradient id="yb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b43c"/><stop offset="1" stop-color="#d6921f"/></linearGradient>
<linearGradient id="yd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99a26"/><stop offset="1" stop-color="#b87a14"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb6bf"/><stop offset="1" stop-color="#5f7680"/></linearGradient>
<linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3a4a6"/><stop offset="1" stop-color="#7f8083"/></linearGradient>
<linearGradient id="pv2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#999a9d"/><stop offset="1" stop-color="#76777a"/></linearGradient>
<linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c48e55"/><stop offset="1" stop-color="#9a6a37"/></linearGradient>
<radialGradient id="sh"><stop offset="0" stop-color="#2b2019" stop-opacity=".35"/><stop offset="1" stop-color="#2b2019" stop-opacity="0"/></radialGradient>
"""

# ── talajárnyékok
for cx, rx in ((190, 92), (385, 62), (520, 52)):
    add(f'<ellipse cx="{cx}" cy="{G}" rx="{rx}" ry="3.2" fill="url(#sh)"/>')

# ── MARKOLÓ (balra néz, a kanál a talajban)
ex = 110
# lánctalp
add(f'<rect x="{ex+40}" y="{G-18}" width="150" height="18" rx="9" fill="#2f2b28"/>')
add(f'<rect x="{ex+44}" y="{G-15}" width="142" height="12" rx="6" fill="#45403b"/>')
for i in range(6):
    add(f'<circle cx="{ex+56+i*25.2}" cy="{G-9}" r="4.2" fill="#5b554f"/><circle cx="{ex+56+i*25.2}" cy="{G-9}" r="1.6" fill="#2f2b28"/>')
# forgózsámoly
add(f'<rect x="{ex+70}" y="{G-24}" width="96" height="7" rx="2" fill="#3a3531"/>')
# felsőkocsi + ellensúly
add(f'<path d="M{ex+66} {G-24} V{G-50} Q{ex+66} {G-54} {ex+70} {G-54} H{ex+190} Q{ex+198} {G-54} {ex+198} {G-44} V{G-30} Q{ex+198} {G-24} {ex+190} {G-24} Z" fill="url(#yb)"/>')
add(f'<rect x="{ex+176}" y="{G-54}" width="22" height="30" rx="5" fill="url(#yd)"/>')
add(f'<rect x="{ex+120}" y="{G-46}" width="44" height="3" rx="1.5" fill="#b87a14" opacity=".7"/>')
add(f'<rect x="{ex+120}" y="{G-40}" width="44" height="3" rx="1.5" fill="#b87a14" opacity=".7"/>')
# kipufogó
add(f'<rect x="{ex+158}" y="{G-62}" width="3.5" height="9" rx="1" fill="#3a3531"/>')
# fülke
add(f'<path d="M{ex+70} {G-54} V{G-92} Q{ex+70} {G-98} {ex+76} {G-98} H{ex+104} Q{ex+112} {G-98} {ex+114} {G-90} L{ex+118} {G-54} Z" fill="url(#yb)"/>')
add(f'<path d="M{ex+76} {G-58} V{G-90} Q{ex+76} {G-93} {ex+79} {G-93} H{ex+102} Q{ex+107} {G-93} {ex+108} {G-88} L{ex+111} {G-58} Z" fill="url(#gl)"/>')
add(f'<path d="M{ex+80} {G-90} L{ex+92} {G-90} L{ex+84} {G-62} L{ex+80} {G-62} Z" fill="#fff" opacity=".18"/>')
# gém (fülke elől → csukló), kar (csukló → kanál)
bx, by = ex + 64, G - 44          # gémtő
jx, jy = ex - 6, G - 104          # gém-kar csukló
kx, ky = ex - 52, G - 30          # kar vége (kanálcsukló)
add(f'<path d="M{bx} {by-6} Q{ex+30} {G-112} {jx-4} {jy-5} L{jx+6} {jy+6} Q{ex+34} {G-96} {bx+2} {by+8} Z" fill="url(#yb)"/>')
add(f'<path d="M{jx-4} {jy-3} L{jx+5} {jy+4} L{kx+5} {ky+3} L{kx-4} {ky-2} Z" fill="url(#yd)"/>')
# hidraulika-hengerek
add(f'<path d="M{ex+70} {G-34} L{ex+22} {G-88}" stroke="#4a4540" stroke-width="3.2" stroke-linecap="round"/>')
add(f'<path d="M{jx+2} {jy-6} L{kx+14} {ky-26}" stroke="#4a4540" stroke-width="2.6" stroke-linecap="round"/>')
for x, y in ((jx+1, jy+1), (bx+1, by+1), (kx, ky)):
    add(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#3a3531"/><circle cx="{x}" cy="{y}" r="1.2" fill="#8c8580"/>')
# kanál (a talajba nyúlva, fogakkal)
add(f'<path d="M{kx-2} {ky-6} Q{kx+16} {ky+2} {kx+12} {ky+20} L{kx-6} {G+1} L{kx-14} {G-1} Q{kx-18} {ky+6} {kx-2} {ky-6} Z" fill="#3f3a35"/>')
for i in range(3):
    add(f'<path d="M{kx-13+i*3.2} {G-1} l1.4 3 l1.4 -3 Z" fill="#2f2b28"/>')
# kanálban kiemelt anyag
add(f'<path d="M{kx-10} {ky+3} Q{kx} {ky-3} {kx+9} {ky+6} Q{kx+2} {ky+10} {kx-8} {ky+9} Z" fill="#b9a37f"/>')

# ── RAKLAP RAKOTT TÉRKŐVEL
px, pw = 340, 92
# raklap: fedőlapok, tuskók, talpdeszka
add(f'<rect x="{px}" y="{G-11}" width="{pw}" height="3.5" rx=".6" fill="url(#wd)"/>')
for bxp in (px + 2, px + pw / 2 - 6, px + pw - 14):
    add(f'<rect x="{bxp}" y="{G-7.5}" width="12" height="5.5" fill="#8d5e31"/>')
add(f'<rect x="{px}" y="{G-2.2}" width="{pw}" height="2.2" fill="#a47240"/>')
# térkősorok (5 sor), fugákkal, eltolva
rows, rh = 6, 7.2
for r in range(rows):
    y = G - 11 - (r + 1) * rh
    add(f'<rect x="{px+2}" y="{y}" width="{pw-4}" height="{rh-0.6}" rx="1.2" fill="url(#{"pv" if r % 2 else "pv2"})"/>')
    add(f'<rect x="{px+3}" y="{y+.5}" width="{pw-6}" height=".9" rx=".4" fill="#c3c4c6" opacity=".7"/>')
    off = 0 if r % 2 else 11
    x = px + 2 + 22 + off
    while x < px + pw - 6:
        add(f'<rect x="{x:.1f}" y="{y}" width=".9" height="{rh-0.6}" fill="#5f6063"/>')
        x += 22
# pántok
for sx in (px + 18, px + pw - 20):
    add(f'<rect x="{sx}" y="{G-11-rows*rh-0.6}" width="1.6" height="{rows*rh+1.2}" fill="#2f4a6b" opacity=".85"/>')

# ── LERAKOTT TÉRKŐELEMEK
for x, y, w, h in ((470, G-7, 21, 7), (493, G-7, 21, 7), (516, G-7, 21, 7), (481, G-14, 21, 7), (548, G-7, 21, 7)):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h-.5}" rx="1.4" fill="url(#pv)"/>')
    add(f'<rect x="{x+1}" y="{y+.5}" width="{w-2}" height=".9" rx=".4" fill="#c3c4c6" opacity=".7"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
       f'<defs>{defs}</defs>{"".join(parts)}</svg>')
open("public/hero/epitkezes.svg", "w").write(svg.replace("\n", ""))
print(len(svg))
