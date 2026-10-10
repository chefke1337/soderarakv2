"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { zones } from "@/content/site";

/* A jelmagyarázat színei — szinkronban a ZonaTerkep.tsx zoneColors-szal
   (itt külön, hogy a lista a térkép-chunk betöltése NÉLKÜL is látsszon). */
const LEGEND: Record<string, { stroke: string; fill: string }> = {
  mag: { stroke: "#b4532f", fill: "rgba(180, 83, 47, 0.30)" },
  kozel: { stroke: "#b08a4c", fill: "rgba(217, 183, 122, 0.34)" },
  tavolabbi: { stroke: "#9a8a6c", fill: "rgba(201, 184, 150, 0.32)" },
};
const ezer = (n: number) => (n / 1000).toLocaleString("hu-HU");

const ZonaTerkepMap = dynamic(() => import("@/components/ZonaTerkep"), {
  ssr: false,
  loading: () => null,
});

/**
 * A térkép betöltése hálózati/chunk-hibára (pl. CSS_CHUNK_LOAD_FAILED,
 * ChunkLoadError) elbukhat — ez React render-hiba, amit csak egy class
 * komponens error boundary tud elkapni (hook-alapú megfelelője nincs).
 * Hiba esetén a zónalista mellett egyszerű üzenetet mutatunk, nem dől el
 * tőle az egész oldal.
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
    console.error("Zónatérkép betöltési hiba:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="status"
          style={{ "--map-h": `${this.props.height}px` } as React.CSSProperties}
          className="h-[min(var(--map-h),72vw)] flex w-full items-center justify-center rounded-sm border border-line-strong bg-sand p-6 text-center text-sm text-ink-soft"
        >
          A térkép most nem tölthető be. A szállítási zónák és a fuvarárak alább olvashatók.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ZonaTerkepLazy({ height = 420 }: { height?: number }) {
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
      <div ref={hostRef} style={{ "--map-h": `${height}px` } as React.CSSProperties} className="min-h-[min(var(--map-h),72vw)]">
        {shouldLoad ? (
          <MapErrorBoundary height={height}>
            <ZonaTerkepMap height={height} />
          </MapErrorBoundary>
        ) : (
          <div
            role="status"
            style={{ "--map-h": `${height}px` } as React.CSSProperties}
            className="h-[min(var(--map-h),72vw)] flex w-full items-center justify-center rounded-sm border border-line-strong bg-sand text-sm text-ink-soft"
          >
            Térkép betöltése…
          </div>
        )}
      </div>
      {/* Jelmagyarázat + zónalista: a térképtől függetlenül mindig látszik
          (V1-ben a hibaüzenet erre hivatkozott, de a lista a térképpel együtt tűnt el). */}
      <ul className="num mt-3 grid gap-2 text-sm sm:grid-cols-3">
        {zones.map((z) => (
          <li key={z.id} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1 inline-block h-3 w-3 shrink-0 rounded-[2px] border-2"
              style={{ borderColor: LEGEND[z.id].stroke, background: LEGEND[z.id].fill }}
            />
            <span>
              <span className="font-medium">{z.name}</span>
              <span className="block text-ink-soft">
                {z.leadTime}, fuvar {ezer(z.fuelMin)}–{ezer(z.fuelMax)} ezer Ft
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        A zónák összefüggő, tájékoztató jellegű sávok a telephely körül — nem jogi
        határok. Fuvarár: nettó, egy fuvarra; a végleges díjat egyeztetés után adjuk.
      </p>
    </div>
  );
}
