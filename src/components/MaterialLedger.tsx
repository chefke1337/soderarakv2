import Link from "next/link";
import { materialGroups, type MaterialGroup, type MaterialItem } from "@/content/site";
import { formatFt, IconCalculator, IconPlus, minPrice } from "@/lib/ui";
import FractionScale, { parseFraction } from "@/components/FractionScale";
import MaterialGrain, { MATERIAL_COLOR } from "@/components/MaterialGrain";

/** Egy anyagcsoport teljes szemcse-tartománya a tételek frakcióiból (pl. „0–24 mm"). */
function groupRange(g: MaterialGroup): string | undefined {
  const ranges = g.items.map((i) => parseFraction(i.fraction)).filter(Boolean) as [number, number][];
  if (!ranges.length) return undefined;
  const a = Math.min(...ranges.map((r) => r[0]));
  const b = Math.max(...ranges.map((r) => r[1]));
  return `${a}–${b} mm`;
}

/**
 * Anyagok + árlista EGY blokkban (a V1 kártyarács + ár-accordion helyett).
 * Natív <details>: JS nélkül nyílik, billentyűzettel kezelhető.
 * Sor: textúra · név · szemcse-tartomány · induló ár · lenyitás.
 * Lenyitva: minden tétel felhasználással, frakció-skálával, árral és
 * közvetlen kalkulátor-linkkel (az anyag előre kiválasztva).
 */
export default function MaterialLedger({
  openAll = false,
  headingLevel = 3,
}: {
  openAll?: boolean;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";

  return (
    <div className="space-y-2.5">
      {materialGroups.map((g) => {
        const min = minPrice(g.items);
        const range = groupRange(g);
        return (
          <details
            key={g.slug}
            id={`anyag-${g.slug}`}
            open={openAll}
            className="mat-card group relative overflow-hidden rounded-[var(--radius-md)] border border-border/70 bg-surface shadow-card"
            style={{ "--mat": MATERIAL_COLOR[g.tone].base } as React.CSSProperties}
          >
            <summary className="mat-summary grid min-h-[5.5rem] cursor-pointer list-none grid-cols-[4.5rem_minmax(0,1fr)_auto] items-stretch md:min-h-[6.5rem] md:grid-cols-[7.5rem_minmax(0,1.25fr)_minmax(0,1fr)_10rem_7.5rem]">
              {/* teljes magasságú anyagpanel: a kártya „képe" */}
              <span aria-hidden="true" className="mat-panel relative row-span-2 block overflow-hidden md:row-span-1">
                <span className="mat-grain absolute inset-0">
                  <MaterialGrain tone={g.tone} id={`ledger-${g.slug}`} />
                </span>
              </span>
              <span className="min-w-0 self-center py-4 pr-2 pl-4 md:pl-6">
                <H className="font-display text-heading-sm font-bold">{g.name}</H>
                <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{g.short}</span>
              </span>

              <span className="hidden self-center pr-4 md:block">
                {range ? (
                  <>
                    <FractionScale fraction={range} />
                    <span className="num mt-1.5 block text-xs text-ink-soft">
                      {range} · {g.items.length} tétel
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-ink-soft">Frakció nélkül · {g.items.length} tétel</span>
                )}
              </span>

              <span className="num self-center py-4 pr-4 text-right md:pr-5">
                {min !== null ? (
                  <>
                    <span className="block font-display text-heading-sm font-bold">{formatFt(min)}</span>
                    <span className="block text-xs text-ink-soft">-tól / m³ nettó</span>
                  </>
                ) : (
                  <span className="block text-sm font-medium text-ink-soft">egyeztetés után</span>
                )}
              </span>

              {/* egyértelmű nyitás-jelző: felirat + ikon (mobilon a második sorban) */}
              <span className="col-span-2 col-start-2 flex items-center justify-between gap-2 border-t border-border/60 py-2.5 pr-4 pl-4 text-sm font-semibold text-accent-deep md:col-span-1 md:col-start-auto md:justify-end md:border-t-0 md:border-l md:py-0 md:pr-5 md:pl-4">
                <span className="mat-toggle-label">
                  <span className="group-open:hidden">Tételek</span>
                  <span className="hidden group-open:inline">Bezárás</span>
                </span>
                <span
                  aria-hidden="true"
                  className="mat-toggle flex h-8 w-8 items-center justify-center rounded-full bg-page text-ink group-open:rotate-45 group-open:bg-accent group-open:text-on-dark"
                >
                  <IconPlus size={16} />
                </span>
              </span>
            </summary>

            <div className="details-body border-t border-border/60 px-4 pt-5 pb-6 md:pr-8 md:pl-[9rem]">
              <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">{g.description}</p>

              <MaterialItemRows items={g.items} className="mt-4" />

              <Link
                href={`/anyagok/${g.slug}`}
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark"
              >
                {g.name}: részletes leírás és felhasználás
              </Link>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** Tétel-sorok: név + felhasználás · frakció-skála · nettó ár · kalkulátor-link. */
export function MaterialItemRows({
  items,
  className = "",
}: {
  items: MaterialItem[];
  className?: string;
}) {
  return (
    <ul className={`divide-y divide-line rounded-sm border border-line bg-paper ${className}`}>
      {items.map((item) => (
        <li
          key={item.slug}
          className="grid gap-x-6 gap-y-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] md:items-center"
        >
          <div className="min-w-0">
            <p className="font-semibold">
              {item.name}
              {item.note && (
                <span className="ml-2 text-xs font-medium text-ink-soft">{item.note.toLowerCase()}</span>
              )}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-ink-soft">{item.use}</p>
          </div>

          <div className="min-w-0 sm:col-span-2 md:col-span-1">
            {item.fraction ? (
              <>
                <FractionScale fraction={item.fraction} />
                <p className="num mt-1 text-xs text-ink-soft">{item.fraction}</p>
              </>
            ) : (
              <p className="text-xs text-ink-soft">Frakció nélkül</p>
            )}
          </div>

          <p className="num font-display text-lg font-bold sm:row-start-1 sm:col-start-2 sm:text-right md:row-start-auto md:col-start-auto">
            {item.priceNet !== null ? formatFt(item.priceNet) : (
              <span className="font-sans text-sm font-medium text-ink-soft">egyeztetés után</span>
            )}
          </p>

          <Link
            href={`/arkalkulator?anyag=${item.slug}`}
            aria-label={`${item.name}: ár kiszámítása a kalkulátorban`}
            className="inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-sm border border-line-strong px-3 text-sm font-semibold transition-colors hover:border-ink hover:bg-sand md:justify-self-end"
          >
            <IconCalculator size={16} />
            Számolás
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Oszlopfejléc a MaterialLedger fölé (desktopon). */
export function LedgerHeader() {
  return (
    <div
      aria-hidden="true"
      className="mb-3 hidden items-end text-xs font-medium text-ink-soft md:grid md:grid-cols-[7.5rem_minmax(0,1.25fr)_minmax(0,1fr)_10rem_7.5rem] [&>span:nth-child(2)]:pl-6 [&>span:nth-child(4)]:pr-5"
    >
      <span />
      <span>Anyag</span>
      <span>Szemcseméret, 0–64 mm skálán</span>
      <span className="text-right">Nettó ár</span>
      <span />
    </div>
  );
}
