"use client";

import { useEffect, useRef } from "react";
import type { CircleMarker, Map as LeafletMap, LayerGroup } from "leaflet";
import { districtMapPoints, romanDistrict, serviceAreas } from "@/content/site";
// Leaflet CSS-e globálisan importálva: src/app/globals.css — lásd ott a
// kommentet az okáról (dinamikus CSS-chunk helyett a fő bundle-ben kell lennie).

/**
 * V3 LEFEDETTSÉGI TÉRKÉP.
 *
 * A V2 háromzónás, kiszínezett poligonos térképe megszűnt: a V3 árazás
 * irányítószám-alapú, és találomra rajzolt irányítószám-határokat NEM
 * jelenítünk meg. Ez a térkép kizárólag ÁTTEKINTÉS: a kiszolgált
 * területek jelölése. A konkrét tarifa a kereshető irányítószámos
 * díjlistából (PostalTariffTable) jön.
 *
 * Megőrzött szabályok: nincs telephely-/depópin, nincs személyes átvétel,
 * a térkép nem fed a headerre (`isolation: isolate` a konténeren),
 * OSM-attribúció a helyén, érintőképernyőn az egyujjas húzás az oldalé.
 */

/** Van-e a területhez jóváhagyott, irányítószám-alapú tarifa? */
const MARKER = {
  tariff: { fill: "#a8401a", ring: "#fffaf1" },
  quote: { fill: "#6e6457", ring: "#fffaf1" },
} as const;

/** Feliratirány a sűrű pontoknál, hogy a címkék ne fedjék egymást. */
const LABEL_DIR: Record<string, "left" | "right" | "top" | "bottom"> = {
  budafok: "left",
  budateteny: "left",
  nagyteteny: "bottom",
  "budapest-22-kerulet": "right",
  albertfalva: "left",
  "ujbuda-budapest-11-kerulet": "right",
  csepel: "right",
  torokbalint: "left",
  erd: "left",
  pusztazamor: "bottom",
  soskut: "top",
  diosd: "bottom",
};

/**
 * Feliratok fontossági sorrendje ütközés esetén (kisebb = fontosabb). Keskeny
 * térképen (mobil) a sűrű budafoki/XI. kerületi pontok feliratai egymásra
 * csúsznának — ilyenkor a kevésbé fontos felirat rejtve marad; a pont
 * koppintásra/kattintásra továbbra is megmutatja a nevét (popup), nagyításra
 * pedig a felirat visszajön.
 */
const LABEL_PRIORITY = [
  "erd",
  "diosd",
  "torokbalint",
  "tarnok",
  "soskut",
  "pusztazamor",
  // a 23 kerület (római számos felirat) — „kerulet-N" kulccsal
  ...Array.from({ length: 23 }, (_, i) => `kerulet-${i + 1}`),
  "budafok",
  "albertfalva",
  "budateteny",
  "nagyteteny",
];
/** A kerületi jelöléssel rendelkező kiemelt területek (XI., XXI., XXII.) kulcsa. */
const DISTRICT_AREA_SLUGS: Record<string, number> = {
  "ujbuda-budapest-11-kerulet": 11,
  csepel: 21,
  "budapest-22-kerulet": 22,
};
const labelRank = (key: string) => {
  const i = LABEL_PRIORITY.indexOf(DISTRICT_AREA_SLUGS[key] ? `kerulet-${DISTRICT_AREA_SLUGS[key]}` : key);
  return i < 0 ? LABEL_PRIORITY.length : i;
};

/** A Next a base path-ot a kliens-bundle-be is beírja; a popup sima HTML link. */
const BASE = process.env.__NEXT_ROUTER_BASEPATH ?? "";
const areaLink = (slug: string, text: string) =>
  `<a href="${BASE}/teruletek/${slug}/">${text} →</a>`;

export default function LefedettsegTerkep({ height = 420 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;

    // A térkép initje szándékosan halasztott: a csempék ne legyenek LCP-elemek,
    // a szövegtartalom azonnal rendereljen.
    const startInit = () => {
      (async () => {
        const L = await import("leaflet");
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
          // Érintőképernyőn az egyujjas húzás az oldalt görgesse, ne a térképet
          // (a +/− gombokkal ott is nagyítható).
          dragging: !L.Browser.mobile,
          zoomSnap: 0.25,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> közreműködők',
          maxZoom: 18,
          detectRetina: true,
        }).addTo(map);

        L.control.scale({ imperial: false }).addTo(map);

        const group = L.layerGroup().addTo(map);
        const labelled: { rank: number; marker: CircleMarker }[] = [];

        for (const area of serviceAreas) {
          const hasTariff = area.freight.kind === "profile";
          const style = hasTariff ? MARKER.tariff : MARKER.quote;
          const districtId = DISTRICT_AREA_SLUGS[area.slug];
          const name = districtId ? romanDistrict(districtId) : area.shortName;
          const marker = L.circleMarker(area.latlng, {
            radius: hasTariff ? 6 : 4.5,
            color: style.ring,
            weight: 1.5,
            fillColor: style.fill,
            fillOpacity: 1,
          })
            .addTo(group)
            .bindTooltip(name, {
              permanent: true,
              direction: LABEL_DIR[area.slug] ?? "right",
              offset: [0, 0],
              className: districtId ? "city-label district-label" : hasTariff ? "city-label" : "city-label city-label-quote",
            })
            .bindPopup(
              hasTariff
                ? `<strong>${area.name}</strong><br/>Irányítószám-alapú fuvardíj.<br/><small>A pontos díj a díjlistából, az irányítószám szerint.</small><br/>${areaLink(area.slug, "Díjak és tudnivalók")}`
                : `<strong>${area.name}</strong><br/>Egyedi szállítási egyeztetés szükséges.<br/><small>Ehhez a településhez jelenleg nincs feltüntetett fuvardíj.</small><br/>${areaLink(area.slug, "Részletek")}`,
            );
          labelled.push({ rank: labelRank(area.slug), marker });
        }

        // Minden további budapesti kerület: hozzávetőleges középpont, római számmal.
        for (const d of districtMapPoints) {
          const marker = L.circleMarker(d.latlng, {
            radius: 5.5,
            color: MARKER.tariff.ring,
            weight: 1.5,
            fillColor: MARKER.tariff.fill,
            fillOpacity: 1,
          })
            .addTo(group)
            .bindTooltip(d.label, {
              permanent: true,
              direction: "right",
              offset: [0, 0],
              className: "city-label district-label",
            })
            .bindPopup(
              `<strong>${d.name}</strong><br/>Irányítószám-alapú fuvardíj.<br/><small>Jelölés: a kerület hozzávetőleges középpontja — a díjat a pontos irányítószám adja.</small><br/>${areaLink(d.slug, "Díjak és tudnivalók")}`,
            );
          labelled.push({ rank: labelRank(`kerulet-${d.districtId}`), marker });
        }
        labelled.sort((a, b) => a.rank - b.rank);

        /** Ütköző vagy a térképről kilógó feliratok elrejtése, fontossági sorrendben. */
        const declutter = () => {
          const box = containerRef.current?.getBoundingClientRect();
          if (!box) return;
          const kept: DOMRect[] = [];
          for (const { marker } of labelled) {
            const el = marker.getTooltip()?.getElement();
            if (!el) continue;
            el.classList.remove("is-hidden");
            const r = el.getBoundingClientRect();
            const outside = r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom;
            const hit = kept.some(
              (k) => r.left < k.right + 2 && r.right > k.left - 2 && r.top < k.bottom + 1 && r.bottom > k.top - 1,
            );
            if (outside || hit) el.classList.add("is-hidden");
            else kept.push(r);
          }
        };
        // A Leaflet a feliratokat a nézetváltás UTÁN pozicionálja (lusta betöltésnél,
        // átméretezéskor egy képkockával később) — ezért a mérés a következő
        // képkockákra ütemezett, különben minden felirat egy pontban „ütközne".
        let declutterFrame = 0;
        const scheduleDeclutter = () => {
          cancelAnimationFrame(declutterFrame);
          declutterFrame = requestAnimationFrame(() => {
            declutterFrame = requestAnimationFrame(declutter);
          });
        };
        map.on("zoomend moveend resize", scheduleDeclutter);

        // A keretezés a tényleges jelölésekre illeszkedik, nem beégetett nézetre.
        const points = [...serviceAreas.map((a) => a.latlng), ...districtMapPoints.map((d) => d.latlng)];
        const bounds = L.latLngBounds(points);
        let fitting = false;
        let userMoved = false;
        const fit = () => {
          fitting = true;
          // A címkék alapból jobbra nyúlnak a ponttól → jobb oldalon több hely kell,
          // különben a szélső feliratok (XI., XXI. kerület) levágódnak.
          // Keskeny térképen kisebb margó: a kilógó feliratokat a declutter úgyis
          // elrejti, így mobilon nem zsugorodik feleslegesen a térkép.
          const narrow = (containerRef.current?.clientWidth ?? 600) < 520;
          map.fitBounds(bounds, {
            paddingTopLeft: narrow ? [14, 14] : [40, 30],
            paddingBottomRight: narrow ? [40, 14] : [104, 30],
            maxZoom: 12,
            animate: false,
          });
          fitting = false;
        };
        if (points.length > 0) fit();
        scheduleDeclutter();

        // A doboz méretváltozásakor (ablak, elforgatás, lusta betöltés) a Leaflet
        // alapból a bal felső sarkot tartja meg — ezért újraillesztünk, amíg a
        // felhasználó nem nagyított/mozgatott maga.
        map.on("movestart zoomstart", () => {
          if (!fitting) userMoved = true;
        });
        const ro = new ResizeObserver(() => {
          fitting = true;
          map.invalidateSize({ pan: false });
          fitting = false;
          if (!userMoved && points.length > 0) fit();
        });
        ro.observe(containerRef.current);
        roRef.current = ro;

        mapRef.current = map;
        layersRef.current = group;
      })();
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(startInit, { timeout: 250 });
    } else {
      idleId = window.setTimeout(startInit, 150);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
      roRef.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      {/* OSM csempék előcsatlakoztatása — a térkép gyorsabban épül */}
      <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="anonymous" />
      <div
        ref={containerRef}
        style={{ "--map-h": `${height}px` } as React.CSSProperties}
        className="h-[min(var(--map-h),90vw)] w-full overflow-hidden rounded-sm border border-line-strong bg-sand"
        role="region"
        aria-label="Áttekintő lefedettségi térkép a kiszolgált területekről. A konkrét fuvardíjak az irányítószámos díjlistában olvashatók."
      />
    </div>
  );
}
