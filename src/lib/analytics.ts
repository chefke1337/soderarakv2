/**
 * Mérési réteg — GA4 + Search Console + call-tracking.
 *
 * SZABÁLYOK:
 *  - Minden mérés env-vezérelt: env nélkül a site mérés nélkül fut (Lighthouse 90+ megmarad).
 *    Statikus exportnál a NEXT_PUBLIC_* varok a build időpontban égődnek be.
 *  - A GA4 script csak hozzájárulás után tölt be (consent mode: default denied).
 *  - Call-tracking: egyetlen delegált kattintás-figyelő minden tel: linkre — a gombokat
 *    a legközelebbi [data-call-region] attribútum jelöli (lásd docs/metrics-plan.md).
 *  - Kitalált mérési azonosító tilos: a GA_ID és a GSC token env-ből jön.
 */

import { company } from "@/content/site";

/** GA4 mérési azonosító, pl. "G-XXXXXXX". Null = mérés kikapcsolva. */
export const GA_ID = process.env.NEXT_PUBLIC_GA4_ID ?? null;

/** "1" esetén debug_view jelzés megy a GA4-be (NEXT_PUBLIC_GA4_DEBUG=1). */
export const GA_DEBUG = process.env.NEXT_PUBLIC_GA4_DEBUG === "1";

/** Search Console HTML-tag verifikáció content értéke. Undefined = nincs meta tag. */
export const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

/* ─── Hozzájárulás (consent) ─── */

const CONSENT_KEY = "ga-consent-v1";
export type ConsentValue = "granted" | "denied";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null; // privát mód / kvóta: nem kritikus
  }
}

function writeConsent(v: ConsentValue): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // privát mód: elhallgatjuk
  }
}

type ConsentMap = Record<string, string>;

function consentUpdate(v: ConsentValue): void {
  window.gtag?.("consent", "update", {
    analytics_storage: v,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    personalization_storage: "denied",
    functionality_storage: "denied",
    security_storage: "granted",
  } satisfies ConsentMap);
}

/** Consent mode v2 alapállapot: minden tárolás tiltva, amíg nincs válasz. */
function applyDefaultConsent(): void {
  window.gtag?.("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    personalization_storage: "denied",
    functionality_storage: "denied",
    security_storage: "granted",
    wait_for_update: "500",
  } satisfies ConsentMap);
}

/** Visszavonásnál a korábbi _ga és _gcl előtagú cookie-k törlése. */
function wipeGaCookies(): void {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name && (name.startsWith("_ga") || name.startsWith("_gcl"))) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}

/** Consent-döntés rögzítése: mentés + consent mode frissítés + GA4 indítás tiltásnál. */
export function recordConsent(v: ConsentValue): void {
  writeConsent(v);
  consentUpdate(v);
  if (v === "denied") wipeGaCookies();
  else loadGa4();
}

/* ─── GA4 betöltő ─── */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    _ga4Loaded?: boolean;
  }
}

export function loadGa4(): void {
  if (!GA_ID || typeof window === "undefined") return;
  if (window._ga4Loaded) return; // dupla betöltés elleni védelem
  window._ga4Loaded = true;

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;

  applyDefaultConsent();

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  const config: Record<string, unknown> = {
    anonymize_ip: true,
    transport_type: "beacon",
  };
  if (GA_DEBUG) config.debug_mode = true;
  gtag("config", GA_ID, config);
}

/** SPA-navigációnál kézi page_view (Next App Router nem küld automatikusat). */
export function sendPageView(path: string): void {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
  });
}

/* ─── Ajánlatkérés-konverzió ─── */

/** Kalkulátor lead: quote_request esemény a mailto megnyitása előtt. */
export function trackQuoteRequest(d: {
  material: string;
  m3: number;
  settlement: string;
  zone: string;
}): void {
  window.gtag?.("event", "quote_request", d);
}

/* ─── Kalkulátor mikro-konverzió ─── */
/**
 * arkalkulator_submit: mikro-konverzió — a látogató ELSŐ, saját módosítása után
 * először áll össze teljes tájékoztató összegzés (anyag + zóna + fuvar) a kalkulátorban.
 * A pillanatot a kalkulátor useState-effektje jelzi; oldalletöltésenként egyszer megy,
 * a visszaállított piszkozat (localStorage) önmagában NEM váltja ki.
 * Adatvédelem: ugyanaz a paraméter-készlet, mint a quote_request-nél (slug, mennyiség,
 * zóna-id) — NINCS személyes adat; consent előtt néma (nincs window.gtag).
 */
export function sendArkalkulatorSubmit(d: {
  material: string;
  m3: number;
  settlement: string;
  zone: string;
}): void {
  window.gtag?.("event", "arkalkulator_submit", d);
}

/* ─── Scroll-mélység ─── */
/**
 * Route-onkénti olvasási mélység: scroll_depth esemény GA4-be, százalék-sávosan
 * (25/50/75/90/100), sávonként egyszer, route-váltásnál nullázódó számlálóval.
 * Adatvédelem: NEM személyes adat — csak a route útvonala, egy százalék-bucket
 * és a viewport-törpöltség megy; cookie-t nem ír. A sávok a CTA-pozíciók
 * adat-alapú igazításához kellenek (melyik tartalomrészig olvasnak mobilon).
 */
const SCROLL_BUCKETS = [25, 50, 75, 90, 100] as const;

export function initScrollDepthTracking(): () => void {
  let route = "";
  let maxPercent = 0;
  const fired = new Set<number>();

  function routeKey(): string {
    const p = window.location.pathname;
    return p.length > 1 ? p.replace(/\/+$/, "") : p;
  }

  function onScroll(): void {
    if (!window.gtag) return; // GA nélkül (vagy consent előtt) teljesen néma
    const r = routeKey();
    if (r !== route) {
      route = r;
      maxPercent = 0;
      fired.clear();
    }
    const se = document.scrollingElement;
    const scrollable = se ? se.scrollHeight - window.innerHeight : 0;
    const percent =
      scrollable <= 0
        ? 100 // nem görgethető oldal = az egészen látta
        : Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
    if (percent <= maxPercent) return; // csak az eddigi maximumot követjük
    maxPercent = percent;
    const mobil = window.innerWidth < 640;
    for (const bucket of SCROLL_BUCKETS) {
      if (percent >= bucket && !fired.has(bucket)) {
        fired.add(bucket);
        // percent STRING-ként megy: a GA4 numerikus paramétert csak metrikaként
        // tartja meg — dimenzióként (route → percent bontás, Explore) csak a
        // kis kardinalitású string törhető. Lásd docs/metrics-plan.md §11.
        window.gtag?.("event", "scroll_depth", { route, percent: String(bucket), mobil });
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/* ─── Call-tracking ─── */
/**
 * Régiók (data-call-region): header_topbar, header_nav, header_mobile_menu,
 * mobile_call_bar, hero, zaro_cta, contact_page, calculator_form,
 * calculator_error_recovery, quote_form_success, footer, not_found, rolunk,
 * szallitas, telepules_oldal, faq_accordion, guide_body, arak_cta. Ismeretlen hely: "unknown".
 */

/**
 * Delegált kattintás-figyelő: minden tel: linkről call_click esemény megy a GA4-be.
 * A gomb helyét a legközelebbi [data-call-region] ős adja (pl. hero, footer, mobile_call_bar).
 * Egyszer kell meghívni (Analytics kliens komponens); a visszaadott függvény a lecsatolás.
 */
export function initCallTracking(): () => void {
  function onClick(e: MouseEvent): void {
    const target = e.target as Element | null;
    const anchor = target?.closest?.("a[href^='tel:']");
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    const region =
      anchor.closest("[data-call-region]")?.getAttribute("data-call-region") ??
      "unknown";
    const label = (anchor.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    window.gtag?.("event", "call_click", {
      call_location: region,
      phone_number: company.phone.raw,
      link_text: label,
      link_url: href,
    });
  }
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
