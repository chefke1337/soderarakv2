"use client";

import { useEffect, useRef, useState } from "react";
import { RENDELES_LEPESEK } from "@/content/site";
import { IconTruck } from "@/lib/ui";

/**
 * Rendelés menete — karakteres 01–05 idővonal.
 *
 * Megjelenés: egyszeri, IntersectionObserver-rel indítva. FAIL-SAFE: a
 * szerveren renderelt állapot LÁTHATÓ („static"). Csak akkor kerül rejtett
 * („pending") állapotba, ha a JS fut, a mozgás engedélyezett ÉS a lista még
 * a képernyő alatt van; ráadásul egy biztonsági időzítő mindenképp
 * megjeleníti. Nem scrollpozícióhoz kötött „teljesítési állapot".
 */
type Phase = "static" | "pending" | "in";

export default function OrderRoute() {
  const ref = useRef<HTMLOListElement>(null);
  const [phase, setPhase] = useState<Phase>("static");
  const last = RENDELES_LEPESEK.length - 1;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    // Már látható? Akkor nincs mit animálni (nem villantunk).
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    setPhase("pending");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPhase("in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    // Biztonsági háló: ha a trigger valamiért nem fut le, a tartalom akkor is megjelenik
    const safety = window.setTimeout(() => setPhase((p) => (p === "pending" ? "in" : p)), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <ol ref={ref} data-phase={phase} className="order-route relative">
      {RENDELES_LEPESEK.map((step, i) => (
        <li
          key={step.title}
          style={{ "--i": i } as React.CSSProperties}
          className="route-step relative grid grid-cols-[2.75rem_1rem_minmax(0,1fr)] gap-x-2.5 pb-8 last:pb-0 md:grid-cols-[6rem_1.75rem_minmax(0,1fr)] md:gap-x-5 md:pb-12"
        >
          {/* vonalszakasz ehhez a csomóponttól a következőig (a sín közepén) */}
          {i < last && (
            <span
              aria-hidden="true"
              className="route-seg absolute top-[1.5rem] -bottom-2.5 left-[calc(2.75rem+0.625rem+0.5rem-1.5px)] w-[3px] rounded-full bg-accent/55 md:top-[2.25rem] md:-bottom-5 md:left-[calc(6rem+1.25rem+0.875rem-1.5px)]"
            />
          )}
          {/* nagy numerál */}
          <span
            aria-hidden="true"
            className={`num font-display text-[2.125rem] leading-none font-bold tracking-tight md:text-[4.25rem] ${
              i === last ? "text-accent" : "text-accent-deep/85"
            }`}
          >
            {String(i + 1).padStart(2, "0")}
          </span>

          {/* sín: csomópont + a következő lépésig tartó vonalszakasz */}
          <span aria-hidden="true" className="relative flex justify-center">
            <span
              className={`relative z-10 mt-2.5 block h-3.5 w-3.5 rounded-full ring-4 ring-page md:mt-5 md:h-4 md:w-4 ${
                i === last ? "bg-accent" : "border-[3px] border-accent bg-page"
              }`}
            />
          </span>

          <div className="pt-0.5 md:pt-2.5">
            <h3 className="font-display text-heading-sm font-bold text-balance md:text-heading-md">
              <span className="sr-only">{i + 1}. lépés: </span>
              {step.title}
            </h3>
            <p className="mt-2 max-w-[60ch] text-[1rem] leading-relaxed text-text-muted md:text-[1.0625rem]">
              {step.text}
            </p>
            {step.note && (
              <p className="mt-4 flex max-w-[60ch] gap-3 rounded-[var(--radius-md)] border-l-4 border-accent bg-surface px-4 py-3 text-[0.9375rem] leading-relaxed text-text shadow-card">
                <IconTruck size={20} className="mt-0.5 shrink-0 text-accent-deep" />
                <span>{step.note}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
