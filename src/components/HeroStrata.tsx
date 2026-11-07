import { materialGroups } from "@/content/site";
import { withBasePath } from "@/lib/basepath";

/**
 * Hero „rétegszelvény": a forgalmazott anyagcsoportok meglévő textúrafotói
 * (catalog.ts `photo`) egymásra rétegezve, mint egy fúrómag metszete —
 * mellette hajszálvonalas jelmagyarázat az anyag nevével.
 *
 * Csak a fotóval rendelkező csoportok kerülnek ide: az andezitnek nincs
 * ellenőrzött fotója (catalog.ts), ezért nem kap helyettesítő képet.
 *
 * A képek rögzített rácsban ülnek (nincs layout shift), NEM lusta betöltésűek
 * (a hero látható része), és nincs rajtuk animáció.
 */

// Rétegvastagság (fr) — szándékosan nem egyforma, a szelvény-hatás miatt.
const LAYER: Record<string, number> = { homok: 5, soder: 6, kavics: 4, murva: 4, fold: 5 };
// Fentről lefelé: finomtól a durváig, alul a föld.
const ORDER = ["homok", "soder", "kavics", "murva", "fold"];

export default function HeroStrata({ className = "" }: { className?: string }) {
  const layers = ORDER.map((slug) => materialGroups.find((g) => g.slug === slug)).filter(
    (g): g is (typeof materialGroups)[number] & { photo: { src: string; position: string } } =>
      Boolean(g?.photo),
  );

  return (
    // Díszítő illusztráció: a nevek a lenti anyagkatalógusban linkként is
    // szerepelnek, ezért képernyőolvasónak nem ismételjük meg őket.
    <div aria-hidden="true" className={`hero-strata ${className}`}>
      <ol
        className="grid h-full border-y border-ink/70"
        style={{ gridTemplateRows: layers.map((g) => `${LAYER[g.slug] ?? 4}fr`).join(" ") }}
      >
        {layers.map((g, i) => (
          <li
            key={g.slug}
            className={`grid min-h-0 grid-cols-[minmax(0,1fr)_6.5rem] sm:grid-cols-[minmax(0,1fr)_8rem] ${
              i > 0 ? "border-t border-ink/25" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- statikus export; a kis
                webp-forrásokon a next/image nem optimalizálna */}
            <img
              src={withBasePath(g.photo.src)}
              alt=""
              width={400}
              height={360}
              decoding="async"
              fetchPriority={i < 2 ? "high" : "auto"}
              className="block h-full min-h-0 w-full object-cover"
              style={{ objectPosition: g.photo.position }}
            />
            <span className="flex items-start gap-2 border-l border-ink/70 pt-2 pl-3 text-sm font-semibold text-ink">
              <span aria-hidden="true" className="num mt-px text-xs font-medium text-ink-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              {g.name}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
