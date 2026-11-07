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
  // (A panel láthatósága — főleg reduced-motion alatt — egy-két képkockával a
  // nyitás után frissül; amíg nem fókuszálható, rövid ideig újrapróbáljuk.)
  useEffect(() => {
    if (!open) return;
    let tries = 0;
    let timer = 0;
    const id = requestAnimationFrame(function tryFocus() {
      const first = panelRef.current?.querySelector<HTMLElement>("a");
      first?.focus();
      if (first && document.activeElement !== first && tries++ < 12) {
        timer = window.setTimeout(tryFocus, 25);
      }
    });
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(timer);
    };
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
    // A panel a (sticky, ezért pozicionált) <header>-hez igazodik: teljes
    // szélességű lap a fejléc alsó vonala alatt, nem lebegő kártya.
    <div
      ref={rootRef}
      onBlur={(e) => {
        // Tabbal a menüből kilépve zárjon (ne maradjon nyitva fókusz nélkül).
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
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
        className="menu-panel absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-ink/25 bg-limestone shadow-[0_18px_30px_-24px_rgb(36_33_29/0.5)]"
      >
        <ul className="mx-auto max-w-6xl px-4 py-1 md:px-6">
          {nav.map((item, i) => (
            <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
              <a
                href={withBasePath(`${item.href}/`)}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between border-b border-ink/15 py-3 text-base font-medium hover:text-brand-deep"
              >
                {item.label}
                <span aria-hidden="true" className="text-ink-faint">→</span>
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
              {company.hours.sentence}
            </p>
          </li>
        </ul>
      </nav>
    </div>
  );
}
