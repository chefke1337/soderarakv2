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
    <div aria-hidden="true" className="ground relative h-16 md:h-[4.5rem] lg:h-20">
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
      {/* Rétegfeliratok (lg+; tableten túl szűk a sáv) */}
      <div className="pointer-events-none absolute inset-0 z-[2] hidden lg:block">
        <div className="relative mx-auto h-full max-w-6xl px-6">
          <span className="strata-label strata-label--above bottom-full mb-1.5">Ágyazat 2/4</span>
          <span className="strata-label top-[20.6%] -translate-y-1/2">Teherhordó réteg 0/22</span>
          <span className="strata-label top-[48%] -translate-y-1/2">Fagyvédő réteg 0/56</span>
          <span className="strata-label top-[74%] -translate-y-1/2">Tömörített altalaj</span>
        </div>
      </div>
    </div>
  );
}
