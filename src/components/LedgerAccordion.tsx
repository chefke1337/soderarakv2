"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type LedgerAccordionEntry = {
  /** A kártya azonosítója (horgony is, pl. `anyag-soder`). */
  id: string;
  /** Zárt állapotban is látható fejléc-tartalom (csak inline elemek). */
  header: React.ReactNode;
  /** Nyitáskor megjelenő panel. */
  panel: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * Árlista-accordion (ügyfél, 2026-11-02): alapból MINDEN kategória zárt,
 * egyszerre legfeljebb egy lehet nyitva, a nyitott ismételt kattintásra
 * bezárul.
 *
 * Hozzáférhetőség: WAI-ARIA accordion minta — címsorba ágyazott valódi
 * <button>, `aria-expanded`, `aria-controls` → panel, a panel `role=region`
 * a gombra hivatkozva. A zárt panel `hidden`: tartalma nem fókuszálható.
 *
 * Görgetés: ha a nyitás egy FELETTE lévő, hosszú nyitott kategóriát zár be,
 * a lap tartalma összeugrana, és a kattintott sor kicsúszna a képből. Ezért
 * a kattintott gomb képernyő-pozícióját a váltás után visszaállítjuk.
 */
export default function LedgerAccordion({
  entries,
  headingLevel = 3,
  cardClassName = "",
  buttonClassName = "",
  panelClassName = "",
}: {
  entries: LedgerAccordionEntry[];
  headingLevel?: 2 | 3;
  cardClassName?: string;
  buttonClassName?: string;
  panelClassName?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const anchor = useRef<{ el: HTMLElement; top: number } | null>(null);
  const H = headingLevel === 2 ? "h2" : "h3";

  // Horgonyos link (pl. /arak#anyag-soder) a megfelelő kategóriát nyitja.
  useEffect(() => {
    const open = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && entries.some((e) => e.id === hash)) setOpenId(hash);
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [entries]);

  useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    anchor.current = null;
    const delta = a.el.getBoundingClientRect().top - a.top;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" as ScrollBehavior });
  }, [openId]);

  return (
    <div className="space-y-2.5">
      {entries.map((e) => {
        const open = openId === e.id;
        const btnId = `${e.id}-gomb`;
        const panelId = `${e.id}-tetelek`;
        return (
          <div key={e.id} id={e.id} data-open={open} className={cardClassName} style={e.style}>
            <H className="m-0">
              <button
                type="button"
                id={btnId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={(ev) => {
                  anchor.current = {
                    el: ev.currentTarget,
                    top: ev.currentTarget.getBoundingClientRect().top,
                  };
                  setOpenId(open ? null : e.id);
                }}
                className={buttonClassName}
              >
                {e.header}
              </button>
            </H>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!open}
              className={panelClassName}
            >
              {e.panel}
            </div>
          </div>
        );
      })}
    </div>
  );
}
