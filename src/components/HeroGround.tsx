import { withBasePath } from "@/lib/basepath";

/**
 * Hero „talaj": a térkő (viakolor) ALATTI rétegrend metszete, VALÓDI
 * anyagfotókból (a katalógus meglévő fotói, scripts/build-hero-ground.py
 * készíti belőlük a varratmentes csempéket — public/hero/talaj-*.webp).
 *
 * Felülről lefelé, az ügyfél referenciaképe szerint:
 *   ágyazat 2/4 · teherhordó réteg 0/22 · fagyvédő réteg 0/56 ·
 *   tömörített altalaj (egyenes, határozott határ) · természetes talaj
 *
 * Arányok rögzítettek (7:19:25:17:12 — össz. 80), a sáv magassága
 * 64/72/80 px; a feliratok (lg+) a rétegek közepéhez igazodnak.
 * Díszítő elem: aria-hidden, nincs JS, nincs animáció, nincs layout shift.
 */
const LAYERS = [
  { key: "agyazat", fr: 7, w: 960, h: 12 },
  { key: "teherhordo", fr: 19, w: 960, h: 24 },
  { key: "fagyvedo", fr: 25, w: 960, h: 30 },
  { key: "altalaj", fr: 17, w: 960, h: 22 },
  { key: "termeszetes", fr: 12, w: 960, h: 18 },
] as const;

export default function HeroGround() {
  return (
    <div aria-hidden="true" className="ground relative h-16 md:h-[4.5rem] lg:h-20">
      <div
        className="grid h-full"
        style={{ gridTemplateRows: LAYERS.map((l) => `${l.fr}fr`).join(" ") }}
      >
        {LAYERS.map((l) => (
          <div
            key={l.key}
            className={`ground-layer ground-layer--${l.key}`}
            style={{
              backgroundImage: `url(${withBasePath(`/hero/talaj-${l.key}.webp`)})`,
              backgroundSize: `${l.w}px ${l.h}px`,
            }}
          />
        ))}
      </div>
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
