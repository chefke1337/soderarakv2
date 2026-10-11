"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { company, nav } from "@/content/site";
import { withBasePath } from "@/lib/basepath";

/**
 * Mobil menü — nyitás ÉS zárás átmenettel (a natív <details> zárni nem tud
 * animálni). Esc és kattintás kívül zár; útvonalváltáskor bezárul;
 * aria-expanded / aria-controls; reduced-motion alatt nincs átmenet.
 */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  // Nyitáskor a fókusz az első menüpontra kerül (billentyűzet, képernyőolvasó)
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a")?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="btn min-h-11 border-[1.5px] border-text/70 px-3.5 text-sm hover:bg-text hover:text-surface aria-expanded:bg-text aria-expanded:text-surface"
      >
        Menü
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span className={`absolute left-0 h-[2px] w-4 rounded bg-current transition-transform duration-[var(--dur-ui)] top-0 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute top-[5px] left-0 h-[2px] w-4 rounded bg-current transition-opacity duration-[var(--dur-ui)] ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-[2px] w-4 rounded bg-current transition-transform duration-[var(--dur-ui)] top-[10px] ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>

      <nav
        ref={panelRef}
        id={panelId}
        aria-label="Mobil navigáció"
        data-call-region="header_mobile_menu"
        data-open={open}
        className="menu-panel absolute top-full right-0 z-50 mt-3 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-pop ring-1 ring-black/10"
      >
        <span aria-hidden="true" className="block h-1.5 bg-[linear-gradient(90deg,var(--color-mat-homok)_0_20%,var(--color-mat-soder)_20%_40%,var(--color-mat-kavics)_40%_60%,var(--color-accent)_60%_80%,var(--color-mat-fold)_80%)]" />
        <ul className="px-4 py-1">
          {nav.map((item, i) => (
            <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
              <a
                href={withBasePath(`${item.href}/`)}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between border-b border-line/70 py-3 text-base font-medium hover:text-brand-deep"
              >
                {item.label}
                <span aria-hidden="true" className="text-ink-faint">›</span>
              </a>
            </li>
          ))}
          <li className="py-3" style={{ "--i": nav.length } as React.CSSProperties}>
            <a
              href={`tel:${company.phone.raw}`}
              tabIndex={open ? 0 : -1}
              className="num btn btn-primary w-full"
            >
              Hívás: {company.phone.display}
            </a>
            <p className="mt-2 text-center text-xs text-ink-soft">
              {company.hours.days}, {company.hours.time}
            </p>
          </li>
        </ul>
      </nav>
    </div>
  );
}
