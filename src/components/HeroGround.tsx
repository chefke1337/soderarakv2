import { withBasePath } from "@/lib/basepath";

/**
 * Hero „talaj": a térkő (viakolor) ALATTI rétegrend absztrakt, grafikus
 * metszete — lapos „terrazzo + raszter" stílus, nem fotó- vagy rajzhű.
 * Forrás: public/hero/terko-retegrend.svg (generátor:
 * scripts/build-hero-ground.py). Felülről lefelé: ágyazat 2/4 · teherhordó
 * 0/22 · fagyvédő 0/56 · tömörített altalaj · természetes talaj
 * (arány 7:19:25:17:12 — össz. 80 egység).
 * Díszítő elem: aria-hidden, nincs JS/animáció; rögzített magasság
 * (32/36/40 px — ügyfél: fele akkora) → nincs layout shift. Az alja a
 * talajrétegeknél a ténysor színébe fakul (.ground::after); a láblécben
 * (fadeTo="dark") a sötét lábléc színébe (globális, minden oldalon). Szélességben „slice" (vágás, nem torzítás).
 */

export default function HeroGround({ fadeTo = "sand" }: { fadeTo?: "sand" | "dark" }) {
  return (
    <div aria-hidden="true" className={`ground relative h-8 md:h-9 lg:h-10${fadeTo === "dark" ? " ground--dark" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- statikus export, előre generált SVG */}
      <img
        src={withBasePath("/hero/terko-retegrend.svg")}
        alt=""
        width={6000}
        height={80}
        loading="lazy"
        decoding="async"
        className="block h-full w-full object-cover object-left"
      />
    </div>
  );
}
