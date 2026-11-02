import Link from "next/link";
import {
  DISCLOSURE_GROSS,
  materialGroups,
  type MaterialGroup,
  type MaterialItem,
  groupWashed,
  itemWash,
  WASHED_KAVICS,
  WASHED_SODER,
} from "@/content/site";
import { formatFt, IconCalculator, IconDroplets, IconPlus, minPrice } from "@/lib/ui";
import FractionScale, { parseFraction } from "@/components/FractionScale";
import MaterialGrain, { MATERIAL_COLOR } from "@/components/MaterialGrain";
import { withBasePath } from "@/lib/basepath";
import LedgerAccordion, { type LedgerAccordionEntry } from "@/components/LedgerAccordion";

/** Egy anyagcsoport teljes szemcse-tartománya a tételek frakcióiból. */
function groupRange(g: MaterialGroup): string | undefined {
  const ranges = g.items
    .map((i) => parseFraction(i.fraction))
    .filter(Boolean) as [number, number][];
  if (!ranges.length) return undefined;
  const a = Math.min(...ranges.map((r) => r[0]));
  const b = Math.max(...ranges.map((r) => r[1]));
  return `${a}–${b} mm`;
}

/**
 * Anyagok + BRUTTÓ árlista egy blokkban.
 * Accordion (ügyfél, 2026-11-02): alapból minden kategória zárt, egyszerre
 * egy nyitható — lásd `LedgerAccordion`. A fejléc zárt állapotban is mutatja
 * a nevet, a mosottság pontos összefoglalóját, a szemcse-tartományt és az
 * induló bruttó árat; lenyitva minden tétel felhasználással, frakció-skálával,
 * bruttó árral és közvetlen kalkulátor-linkkel.
 *
 * Ahol nincs ellenőrzött anyagfotó (andezit), a stilizált szemcseminta
 * jelenik meg — régi fotót NEM adunk ki más anyag hiteles fotójaként.
 */
export default function MaterialLedger({
  headingLevel = 3,
}: {
  headingLevel?: 2 | 3;
}) {
  const entries: LedgerAccordionEntry[] = materialGroups.map((g) => {
    const min = minPrice(g.items);
    const range = groupRange(g);
    const w = groupWashed(g);
    return {
      id: `anyag-${g.slug}`,
      style: { "--mat": MATERIAL_COLOR[g.tone].base } as React.CSSProperties,
      header: (
        <>
          {/* teljes magasságú anyagpanel: a kártya „képe" (dekoratív — a név mellette áll) */}
          <span aria-hidden="true" className="mat-panel relative block overflow-hidden bg-[var(--mat)]">
            <span className="mat-grain absolute inset-0">
              {g.photo ? (
                /* statikus export, unoptimized képek: a next/image itt nem ad hozzá semmit */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={withBasePath(g.photo.src)}
                  alt=""
                  width={360}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: g.photo.position }}
                />
              ) : (
                <MaterialGrain tone={g.tone} id={`ledger-${g.slug}`} scale={1.15} />
              )}
            </span>
          </span>

          <span className="block min-w-0 self-center py-3.5 pr-2 pl-3.5 md:py-4 md:pl-6">
            <span className="block font-display text-heading-sm font-bold">{g.name}</span>
            <span className="mt-0.5 block text-sm leading-snug font-normal text-ink-soft">{g.short}</span>
            {w && w.scope === "group" && (
              <span className="badge-washed mt-1.5">
                <IconDroplets size={11} />
                <span>{w.mark.label}</span>
              </span>
            )}
          </span>

          <span className="hidden self-center pr-4 md:block">
            {range ? (
              <>
                <FractionScale fraction={range} />
                <span className="num mt-1.5 block text-xs font-normal text-ink-soft">
                  {range} · {g.items.length} tétel
                </span>
              </>
            ) : (
              <span className="text-xs font-normal text-ink-soft">
                Frakció nélkül · {g.items.length} tétel
              </span>
            )}
          </span>

          {/* Mobilon ár + nyitásjelző egy oszlopban; md+-on a wrapper
              „eltűnik" (contents), a két cella saját hasáb. */}
          <span className="flex flex-col items-end justify-between gap-2 py-3.5 pr-3.5 md:contents">
            <span className="num block text-right md:self-center md:py-4 md:pr-5">
              {min !== null ? (
                <>
                  <span className="block font-display text-heading-sm font-bold">{formatFt(min)}</span>
                  <span className="block text-xs font-normal text-ink-soft">-tól / m³ bruttó</span>
                </>
              ) : (
                <span className="block text-sm font-medium text-ink-soft">egyeztetés után</span>
              )}
            </span>

            <span className="flex items-center gap-2 text-sm font-semibold text-accent-deep md:justify-end md:self-stretch md:border-l md:border-border/60 md:pr-5 md:pl-4">
              <span className="mat-toggle-label">
                <span className="group-data-[open=true]:hidden">Tételek</span>
                <span className="hidden group-data-[open=true]:inline">Bezárás</span>
              </span>
              <span
                aria-hidden="true"
                className="mat-toggle flex h-8 w-8 items-center justify-center rounded-full bg-page text-ink group-data-[open=true]:rotate-45 group-data-[open=true]:bg-accent group-data-[open=true]:text-on-dark"
              >
                <IconPlus size={16} />
              </span>
            </span>
          </span>
        </>
      ),
      panel: (
        <>
          <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            {g.description}
          </p>
          {w && w.scope === "some" && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-petrol-soft/50 px-3 py-1.5 text-xs font-semibold text-petrol-deep">
              <IconDroplets size={14} />
              {w.summary}
            </p>
          )}

          <MaterialItemRows items={g.items} className="mt-4" />

          <Link
            href={`/anyagok/${g.slug}`}
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark"
          >
            {g.name}: részletes leírás és felhasználás
          </Link>
        </>
      ),
    };
  });

  return (
    <LedgerAccordion
      entries={entries}
      headingLevel={headingLevel}
      cardClassName="mat-card group relative overflow-hidden rounded-[var(--radius-md)] border border-border/70 bg-surface shadow-card"
      buttonClassName="mat-summary grid min-h-[5.5rem] w-full cursor-pointer grid-cols-[3.75rem_minmax(0,1fr)_auto] items-stretch text-left md:min-h-[6.5rem] md:grid-cols-[7.5rem_minmax(0,1.25fr)_minmax(0,1fr)_10.5rem_7.5rem]"
      panelClassName="details-body border-t border-border/60 px-4 pt-5 pb-6 md:pr-8 md:pl-[9rem]"
    />
  );
}

/** Tétel-sorok: név + jelölés + felhasználás · frakció-skála · BRUTTÓ ár · kalkulátor-link. */
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
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-semibold">
              {item.name}
              {item.qualifier && (
                <span className="text-xs font-medium text-ink-soft">{item.qualifier}</span>
              )}
              <WashBadge item={item} />
              {item.unclassified && item.qualifier !== "osztályozatlan" && <span className="badge-plain">osztályozatlan</span>}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-ink-soft">{item.use}</p>
            {item.washNote && (
              <p className="mt-1 text-sm leading-snug font-medium text-ink">{item.washNote.detail}</p>
            )}
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

          <p className="num sm:row-start-1 sm:col-start-2 sm:text-right md:row-start-auto md:col-start-auto">
            {item.priceGross !== null ? (
              <>
                <span className="block font-display text-lg font-bold">
                  {formatFt(item.priceGross)}
                </span>
                <span className="block text-xs text-ink-soft">bruttó / m³</span>
              </>
            ) : (
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
      className="mb-3 hidden items-end text-xs font-medium text-ink-soft md:grid md:grid-cols-[7.5rem_minmax(0,1.25fr)_minmax(0,1fr)_10.5rem_7.5rem] [&>span:nth-child(2)]:pl-6 [&>span:nth-child(4)]:pr-5"
    >
      <span />
      <span>Anyag</span>
      <span>Szemcseméret, 0–64 mm skálán</span>
      <span className="text-right">Bruttó ár / m³</span>
      <span />
    </div>
  );
}

/** Jól látható árjelölés-sáv az árlisták fölé. */
export function GrossPriceBanner({ className = "" }: { className?: string }) {
  return (
    <p
      className={`gross-banner ${className}`}
      // A felirat jogi/üzleti jelentőségű: minden árlistán meg kell jelennie.
    >
      <span aria-hidden="true" className="gross-banner-mark">
        ÁFA
      </span>
      <span>
        <strong className="font-semibold">{DISCLOSURE_GROSS}</strong> A fuvar díja ettől
        külön, nettó értékben számolódik — a fuvardíjra jön az ÁFA.
      </span>
    </p>
  );
}

/**
 * Minőségi blokk az anyaglistánál. Ügyfél, 2026-11-02: a töltősóder NEM
 * mosott, a kulé csak egyszer mosott — ezért itt nincs általános „minden
 * anyag mosott" állítás, csak a pontos, tételszintű összefoglaló.
 */
export function WashedQualityNote({ className = "" }: { className?: string }) {
  return (
    <section aria-labelledby="minoseg-cim" className={`quality-note ${className}`}>
      <span aria-hidden="true" className="quality-note-mark">
        <IconDroplets size={20} />
      </span>
      <div className="min-w-0">
        <h2 id="minoseg-cim" className="font-display text-heading-xs font-bold">
          {WASHED_SODER.label.replace(/ sóder$/, "")} sóderfrakciók és{" "}
          {WASHED_KAVICS.label.replace(/^Jó minőségű, /, "")}
        </h2>
        <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-text-muted">
          A rostált sóderfrakciók (0–4-től 0–24-ig) és az osztályozott kavicsok vizes
          osztályozási eljáráson mennek keresztül. A{" "}
          <strong className="font-semibold text-text">töltősóder nem mosott</strong>. A{" "}
          <strong className="font-semibold text-text">kulé egyszer mosott</strong>: egyszeri
          mosáson átesett, de nem olyan tiszta, mint az osztályozott kavicsok.
        </p>
        <Link href="/rolunk" className="link mt-2 inline-block text-sm font-semibold">
          Rólunk – Minőség minden szemcsében
        </Link>
      </div>
    </section>
  );
}

/** Tételszintű mosottság-badge: mosott / egyszer mosott / nem mosott. */
export function WashBadge({
  item,
  className = "",
}: {
  item: Pick<MaterialItem, "washed" | "washNote">;
  className?: string;
}) {
  const w = itemWash(item);
  if (!w) return null;
  if (w.kind === "washed") {
    return (
      <span className={`badge-washed ${className}`}>
        <IconDroplets size={11} />
        {w.label}
      </span>
    );
  }
  return (
    <span className={`badge-wash-note ${className}`} data-kind={w.kind} title={w.detail}>
      {w.label}
    </span>
  );
}
