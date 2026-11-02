"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { budapestDistricts, quoteOnlyAreas, tariffedAreas } from "@/content/site";

const Map = dynamic(() => import("@/components/LefedettsegTerkep"), {
  ssr: false,
  loading: () => null,
});

/**
 * A térkép betöltése hálózati/chunk-hibára (pl. CSS_CHUNK_LOAD_FAILED,
 * ChunkLoadError) elbukhat — ez React render-hiba, amit csak egy class
 * komponens error boundary tud elkapni. Hiba esetén a lefedettségi lista
 * mellett egyszerű üzenet jelenik meg, nem dől el tőle az egész oldal.
 */
class MapErrorBoundary extends Component<
  { height: number; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Lefedettségi térkép betöltési hiba:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="status"
          style={{ "--map-h": `${this.props.height}px` } as React.CSSProperties}
          className="flex h-[min(var(--map-h),72vw)] w-full items-center justify-center rounded-sm border border-line-strong bg-sand p-6 text-center text-sm text-ink-soft"
        >
          A térkép most nem tölthető be. A lefedettség és a fuvardíjak alább
          olvashatók.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LefedettsegTerkepLazy({
  height = 420,
  legend = true,
}: {
  height?: number;
  legend?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldLoad) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "300px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div>
      <div
        ref={hostRef}
        style={{ "--map-h": `${height}px` } as React.CSSProperties}
        className="min-h-[min(var(--map-h),72vw)]"
      >
        {shouldLoad ? (
          <MapErrorBoundary height={height}>
            <Map height={height} />
          </MapErrorBoundary>
        ) : (
          <div
            role="status"
            style={{ "--map-h": `${height}px` } as React.CSSProperties}
            className="flex h-[min(var(--map-h),72vw)] w-full items-center justify-center rounded-sm border border-line-strong bg-sand text-sm text-ink-soft"
          >
            Térkép betöltése…
          </div>
        )}
      </div>

      {legend && (
        /* A jelmagyarázat a térképtől függetlenül is látszik (chunk-hiba esetén is). */
        <>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full border-2 border-surface bg-surface-accent"
              />
              <span>
                <span className="font-medium">Ide szállítunk</span>
                <span className="num block text-ink-soft">
                  Budapest mind a {budapestDistricts.length} kerülete (római szám), Érd
                  és {tariffedAreas.filter((a) => !/kerület|Érd/.test(a.name)).length} kiemelt
                  városrész — a szállítási díjat az árkalkulátor számolja ki
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full border-2 border-surface bg-ink-faint"
              />
              <span>
                <span className="font-medium">Egyedi szállítási egyeztetés</span>
                <span className="num block text-ink-soft">
                  {quoteOnlyAreas.length} település — ezekhez jelenleg nincs
                  feltüntetett fuvardíj
                </span>
              </span>
            </li>
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            A térkép csak áttekintés: a kerületeket a hozzávetőleges
            középpontjuk jelöli, nem irányítószám- vagy kerülethatár. A jelölésre
            kattintva a terület oldala nyílik. A pontos szállítási díjért használja az
            árkalkulátort, vagy kérjen telefonos egyeztetést.
          </p>
        </>
      )}
    </div>
  );
}
