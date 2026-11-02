import { absoluteUrl } from "@/content/site";

/**
 * Főoldali linkmegosztási előnézet (Open Graph + Twitter/X).
 * A borítókép statikus fájl (public/), a scripts/share-image.mjs állítja elő —
 * új tartalomnál új fájlnév, hogy a platform-cache-ek ne a régit mutassák.
 */
export const SHARE = {
  siteName: "Sóder Árak",
  title: "Sóder Árak – sóder, homok, kavics, murva, andezit és föld",
  description:
    "Bruttó anyagárak, rendelés 1–10 m³ között és szállítási díj az árkalkulátorban. Válasszon anyagot, számoljon az árkalkulátorral, és küldjön rendelési igényt!",
  image: {
    url: absoluteUrl("/soderarak-share-v4.png"),
    width: 1200,
    height: 630,
    alt: "Sóder Árak — építőanyagok, átlátható árak: sóder, kavics, homok, murva és termőföld fotói",
    type: "image/png",
  },
} as const;
