import Link from "next/link";
import { materialGroups, type MaterialGroup } from "@/content/site";
import { withBasePath } from "@/lib/basepath";
import { formatFt, IconArrowRight, IconDroplets, minPrice } from "@/lib/ui";
import FractionScale, { parseFraction } from "@/components/FractionScale";
import MaterialGrain from "@/components/MaterialGrain";

/**
 * Főoldali anyag-index (V3.3): a valódi anyagfotók a főszereplők — eddig csak
 * 80 px-es bélyegképként szerepeltek az árlistában. Csempénként: fotó (vagy
 * egyértelműen jelölt illusztráció), név, rövid leírás, szemcse-tartomány a
 * közös mm-skálán, jóváhagyott mosott-jelölés, induló BRUTTÓ ár, és egyetlen
 * egyértelmű link az anyag oldalára. A teljes, lenyitható tétel-lista az
 * /arak oldalon él — a főoldalról egy kattintás.
 *
 * A fotók kb. 400×360 px-esek: a csempe ezért legfeljebb ~370 px széles,
 * hogy ne nagyítsunk láthatóan rajtuk.
 */

function groupRange(g: MaterialGroup): string | undefined {
  const ranges = g.items.map((i) => parseFraction(i.fraction)).filter(Boolean) as [number, number][];
  if (!ranges.length) return undefined;
  return `${Math.min(...ranges.map((r) => r[0]))}–${Math.max(...ranges.map((r) => r[1]))} mm`;
}

export default function MaterialIndex() {
  return (
    <ul className="mat-index">
      {materialGroups.map((g, i) => {
        const min = minPrice(g.items);
        const range = groupRange(g);
        const mark = g.washed ?? g.items.find((x) => x.washed)?.washed;
        return (
          <li key={g.slug} className="mat-tile" style={{ "--i": i } as React.CSSProperties}>
            <div className="mat-tile-media">
              {g.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={withBasePath(g.photo.src)}
                  alt={`${g.name} — közeli fotó az anyagról`}
                  width={400}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: g.photo.position }}
                />
              ) : (
                <>
                  <span className="mat-tile-grain" role="img" aria-label={`${g.name} — stilizált szemcse-illusztráció (nincs ellenőrzött fotó)`}>
                    <MaterialGrain tone={g.tone} id={`index-${g.slug}`} scale={1.6} />
                  </span>
                  <span className="mat-tile-tag">Illusztráció</span>
                </>
              )}
              <span className="mat-tile-index num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mat-tile-body">
              <h3 className="font-display text-[1.375rem] leading-tight font-bold">
                <Link href={`/anyagok/${g.slug}`} className="mat-tile-link">
                  {g.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm leading-snug text-text-muted">{g.short}</p>
              {mark && (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="badge-washed">
                    <IconDroplets size={11} />
                    {mark.label}
                  </span>
                  {!g.washed && <span className="text-xs text-text-muted">a frakcionált tételekre</span>}
                </p>
              )}
              <div className="mat-tile-meta">
                <div className="min-w-0 flex-1">
                  {range ? (
                    <>
                      <FractionScale fraction={range} />
                      <p className="num mt-1 text-xs text-text-muted">
                        {range} · {g.items.length} tétel
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-text-muted">Frakció nélkül · {g.items.length} tétel</p>
                  )}
                </div>
                <p className="num shrink-0 text-right">
                  <span className="block font-display text-[1.375rem] leading-none font-bold">
                    {min !== null ? formatFt(min) : "Egyeztetés"}
                  </span>
                  <span className="mt-1 block text-xs text-text-muted">
                    {min !== null ? "-tól, bruttó / m³" : "után"}
                  </span>
                </p>
              </div>
              <span aria-hidden="true" className="mat-tile-go">
                Tételek és árak
                <IconArrowRight size={15} className="mat-tile-arrow" />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
