"""Hero „talaj" — valódi anyagfotókból készített, varratmentesen ismételhető
textúracsempék a térkő alatti rétegrend metszetéhez.

Forrás: public/anyagok/arlista/*-foto.webp (a katalógus meglévő fotói).
Kimenet: public/hero/talaj-<réteg>.webp — a fotó adott méretre kicsinyítve,
mellé a tükörképe (vízszintesen varratmentes csempe), 2× felbontásban.
Futtatás: python3 scripts/build-hero-ground.py
"""
from PIL import Image, ImageEnhance, ImageOps

SRC = "public/anyagok/arlista/{}-foto.webp"
# réteg → (forrásfotó, CSS-csempeszélesség px, CSS-sávmagasság px, fényerő, kontraszt, telítettség)
# A sávmagasság a réteg legnagyobb megjelenített magassága (+tartalék): csak ez
# a középső csík kerül a csempébe → kis fájlméret.
LAYERS = {
    "agyazat": ("soder", 110, 12, 1.04, 1.0, 0.9),
    "teherhordo": ("murva", 170, 24, 1.0, 1.05, 1.0),
    "fagyvedo": ("kavics", 230, 30, 1.02, 1.05, 0.95),
    "altalaj": ("fold", 200, 22, 0.92, 1.15, 0.9),
    "termeszetes": ("fold", 260, 18, 0.7, 1.05, 0.85),
}

for name, (src, css_w, css_h, bri, con, sat) in LAYERS.items():
    im = Image.open(SRC.format(src)).convert("RGB")
    w = css_w * 2  # 2× DPR
    h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    ch = css_h * 2
    top = (h - ch) // 2
    im = im.crop((0, top, w, top + ch))
    im = ImageEnhance.Brightness(im).enhance(bri)
    im = ImageEnhance.Contrast(im).enhance(con)
    im = ImageEnhance.Color(im).enhance(sat)
    tile = Image.new("RGB", (w * 2, ch))
    tile.paste(im, (0, 0))
    tile.paste(ImageOps.mirror(im), (w, 0))
    out = f"public/hero/talaj-{name}.webp"
    tile.save(out, "WEBP", quality=78, method=6)
    print(out, tile.size)
