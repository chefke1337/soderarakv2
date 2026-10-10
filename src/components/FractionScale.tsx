/**
 * Frakció-skála: egy tétel szemcsemérete (pl. „0–24 mm") egy közös,
 * rostasor-szerű mm-skálán (0 · 4 · 8 · 16 · 32 · 64). A skála
 * négyzetgyökös, így a 0–1 mm-es homok és a 30–65 mm-es kulékavics
 * egyaránt olvasható. Csak valós `fraction` adatból rajzol.
 */

const MAX_MM = 64;
export const SIEVE_TICKS = [0, 4, 8, 16, 32, 64] as const;

export function parseFraction(fraction?: string): [number, number] | null {
  if (!fraction) return null;
  const m = fraction.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const a = Number(m[1].replace(",", "."));
  const b = Number(m[2].replace(",", "."));
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
}

/** 0–1 közötti pozíció a négyzetgyökös skálán. */
export function scalePos(mm: number): number {
  return Math.sqrt(Math.min(Math.max(mm, 0), MAX_MM) / MAX_MM);
}

export default function FractionScale({
  fraction,
  showTicks = false,
  className = "",
}: {
  fraction?: string;
  showTicks?: boolean;
  className?: string;
}) {
  const range = parseFraction(fraction);
  if (!range) return null;
  const [a, b] = range;
  const left = scalePos(a) * 100;
  const width = Math.max((scalePos(b) - scalePos(a)) * 100, 2.5);

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`Szemcseméret: ${fraction}`}
        className="relative h-2 rounded-full bg-sand-deep/70"
      >
        {SIEVE_TICKS.slice(1, -1).map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className="absolute top-0 h-full w-px bg-paper/80"
            style={{ left: `${scalePos(t) * 100}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className="absolute top-0 h-full rounded-full bg-clay"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      {showTicks && (
        <div aria-hidden="true" className="num relative mt-1 h-4 text-[0.6875rem] text-ink-faint">
          {SIEVE_TICKS.map((t, i) => (
            <span
              key={t}
              className="absolute"
              style={{
                left: `${scalePos(t) * 100}%`,
                transform: i === 0 ? "none" : i === SIEVE_TICKS.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {t}
              {i === SIEVE_TICKS.length - 1 ? " mm" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Rövid magyarázat a skála olvasásához (aloldalakon). */
export function FractionLegend() {
  return (
    <div className="mt-8 max-w-md">
      <p className="text-sm font-medium">Hogyan olvassa a szemcse-skálát?</p>
      <FractionScale fraction="0–16 mm" showTicks className="mt-3" />
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        A sáv a frakció szemcseméretét mutatja milliméterben (itt 0–16 mm).
        A skála a kis méreteket széthúzza, hogy a finom homok és a durva
        kulékavics is összevethető legyen.
      </p>
    </div>
  );
}
