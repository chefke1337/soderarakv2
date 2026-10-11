import { absoluteUrl } from "@/content/site";

/**
 * Főoldali linkmegosztási előnézet (Open Graph + Twitter/X).
 * A borítókép statikus fájl (public/), a scripts/share-image.mjs állítja elő —
 * új tartalomnál új fájlnév, hogy a platform-cache-ek ne a régit mutassák.
 */
export const SHARE = {
  siteName: "Sóder Árak",
  title: "Sóder Árak – sóder, homok, kavics, murva, bazalt és föld",
  description:
    "Anyagárak, rendelés 1–20 m³ között és szállítási díjak egy helyen. Válasszon anyagot, számoljon az árkalkulátorral, és egyeztessük a kiszállítás részleteit!",
  image: {
    url: absoluteUrl("/soderarak-share-v3.png"),
    width: 1200,
    height: 630,
    alt: "Sóder Árak — építőanyagok, átlátható árak: sóder, homok, kavics, murva, bazalt és termőföld fotói",
    type: "image/png",
  },
} as const;
