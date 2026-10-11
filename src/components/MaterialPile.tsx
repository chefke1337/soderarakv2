import type { Tone } from "@/lib/grain";
import { PILE_H, PILE_W, pileSvg } from "@/lib/pile";

/**
 * Egy anyagkupac önálló SVG-sziluettként (src/lib/pile.ts).
 * Rögzített képarány (viewBox) → nincs layout shift, a szemcsék nem
 * torzulnak. A tartalom saját, determinisztikus adatból épül.
 */
export default function MaterialPile({ tone, id, className = "" }: { tone: Tone; id: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${PILE_W} ${PILE_H}`}
      className={`block h-auto w-full ${className}`}
      style={{ aspectRatio: `${PILE_W} / ${PILE_H}` }}
      dangerouslySetInnerHTML={{ __html: pileSvg(tone, id) }}
    />
  );
}
