"""Hero „talaj" — valódi anyagfotókból készített, varratmentesen ismételhető
textúracsíkok a térkő alatti rétegrend metszetéhez.

Forrás: public/anyagok/arlista/*-foto.webp (a katalógus meglévő fotói).
Kimenet: public/hero/talaj-<réteg>.webp — 960 CSS px hosszú csík (2× felbontás),
a fotóból vett véletlen kivágásokból, átúsztatott illesztéssel „szőve"
(nincs tükrözés, nincs látható ismétlődő minta); a csík vége a elejébe
úsztat → vízszintesen varratmentesen csempézhető.
Determinisztikus (seed). Futtatás: python3 scripts/build-hero-ground.py
"""
import random

import numpy as np
from PIL import Image, ImageEnhance

SRC = "public/anyagok/arlista/{}-foto.webp"
STRIP_CSS = 960
# réteg → (forrásfotó, a fotó CSS-szélessége (szemcseméret), sávmagasság CSS px,
#          fényerő, kontraszt, telítettség)
LAYERS = {
    "agyazat": ("soder", 120, 12, 1.05, 1.0, 0.85),
    "teherhordo": ("murva", 190, 24, 1.0, 1.04, 0.95),
    "fagyvedo": ("soder", 210, 30, 0.97, 1.06, 0.95),
    "altalaj": ("fold", 230, 22, 1.0, 1.08, 0.9),
    "termeszetes": ("fold", 300, 18, 0.78, 1.0, 0.85),
}

R = random.Random(20261107)

for name, (src, photo_css, css_h, bri, con, sat) in LAYERS.items():
    im = Image.open(SRC.format(src)).convert("RGB")
    pw = photo_css * 2
    ph = round(im.height * pw / im.width)
    im = im.resize((pw, ph), Image.LANCZOS)
    im = ImageEnhance.Brightness(im).enhance(bri)
    im = ImageEnhance.Contrast(im).enhance(con)
    im = ImageEnhance.Color(im).enhance(sat)
    a = np.asarray(im).astype(np.float32)

    H = css_h * 2
    L = STRIP_CSS * 2
    cw = int(pw * 0.55)          # kivágás szélessége
    ov = int(cw * 0.35)          # átúsztatás
    step = cw - ov
    n = -(-(L + ov) // step) + 1
    total = step * n + ov
    out = np.zeros((H, total, 3), np.float32)
    wsum = np.zeros((1, total, 1), np.float32)
    ramp = np.ones(cw, np.float32)
    ramp[:ov] = np.linspace(0, 1, ov)
    ramp[-ov:] = np.linspace(1, 0, ov)
    for i in range(n):
        x = R.randint(0, pw - cw)
        y = R.randint(0, ph - H)
        crop = a[y:y + H, x:x + cw]
        x0 = i * step
        out[:, x0:x0 + cw] += crop * ramp[None, :, None]
        wsum[:, x0:x0 + cw] += ramp[None, :, None]
    out /= np.maximum(wsum, 1e-6)
    # varrat: a csík első `ov` oszlopa a [L, L+ov) szakaszba úsztat
    strip = out[:, :L].copy()
    tail = out[:, L:L + ov]
    k = np.linspace(1, 0, ov)[None, :, None]
    strip[:, :ov] = tail * k + strip[:, :ov] * (1 - k)
    img = Image.fromarray(np.clip(strip, 0, 255).astype(np.uint8))
    path = f"public/hero/talaj-{name}.webp"
    img.save(path, "WEBP", quality=80, method=6)
    print(path, img.size)
