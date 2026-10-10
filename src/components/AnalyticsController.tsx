"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  initCallTracking,
  initScrollDepthTracking,
  loadGa4,
  readConsent,
  recordConsent,
  sendPageView,
} from "@/lib/analytics";

/** Consent, GA4 és call tracking csak akkor tölt be, ha a mérés konfigurált. */
export default function AnalyticsController() {
  const pathname = usePathname();
  const [decision, setDecision] = useState<"granted" | "denied" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const saved = readConsent();
    setDecision(saved);
    if (saved === "granted") loadGa4();
  }, []);

  useEffect(() => initCallTracking(), []);
  useEffect(() => initScrollDepthTracking(), []);

  useEffect(() => {
    if (ready && decision === "granted") sendPageView(pathname);
  }, [pathname, ready, decision]);

  if (!ready || decision !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Hozzájárulás a mérésekhez"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-md border border-line bg-paper p-4 shadow-pop sm:inset-x-6"
    >
      <p className="text-sm leading-relaxed text-ink">
        Az oldal méréseket használ (Google Analytics 4), hogy látjuk, mely anyagok és
        útmutatók segítenek. A hívás- és ajánlatkérés-gombok működése ettől független.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            recordConsent("granted");
            setDecision("granted");
          }}
          className="min-h-11 rounded-sm bg-brand-dark px-4 py-2 text-sm font-semibold text-paper shadow-card transition-colors hover:bg-brand-deep"
        >
          Elfogadom
        </button>
        <button
          type="button"
          onClick={() => {
            recordConsent("denied");
            setDecision("denied");
          }}
          className="min-h-11 rounded-sm border border-line bg-sand px-4 py-2 text-sm font-semibold"
        >
          Elutasítom
        </button>
        <a
          href="/adatvedelem"
          className="px-2 py-2 text-sm font-medium text-brand-deep underline underline-offset-2"
        >
          Adatkezelési tájékoztató
        </a>
      </div>
    </div>
  );
}
