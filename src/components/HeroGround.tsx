import { withBasePath } from "@/lib/basepath";

/**
 * Hero „talaj": a térkő (viakolor) ALATTI rétegrend absztrakt, grafikus
 * metszete — lapos „terrazzo + raszter" stílus, nem fotó- vagy rajzhű.
 * Forrás: public/hero/terko-retegrend.svg (generátor:
 * scripts/build-hero-ground.py). Felülről lefelé: ágyazat 2/4 · teherhordó
 * 0/22 · fagyvédő 0/56 · tömörített altalaj · természetes talaj
 * (arány 7:19:25:17:12 — össz. 80 egység).
 * Díszítő elem: aria-hidden, nincs JS/animáció; rögzített magasság
 * (64/72/80 px) → nincs layout shift. Szélességben „slice" (vágás, nem torzítás).
 */

export default function HeroGround() {
  return (
    <div aria-hidden="true" className="ground h-16 md:h-[4.5rem] lg:h-20">
      {/* eslint-disable-next-line @next/next/no-img-element -- statikus export, előre generált SVG */}
      <img
        src={withBasePath("/hero/terko-retegrend.svg")}
        alt=""
        width={2400}
        height={80}
        loading="lazy"
        decoding="async"
        className="block h-full w-full object-cover object-left"
      />
    </div>
  );
}
