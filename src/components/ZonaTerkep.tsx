"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { company, depot, settlements, zones } from "@/content/site";
// Leaflet CSS-e globálisan importálva: src/app/globals.css — lásd ott a
// komment az okáról (dinamikus CSS-chunk helyett a fő bundle-ben kell lennie).

/** Zónaszínek — V2 földszín-rámpa (agyag → homok → por). */
export const zoneColors: Record<string, { stroke: string; fill: string }> = {
  mag: { stroke: "#b4532f", fill: "rgba(180, 83, 47, 0.30)" },
  kozel: { stroke: "#b08a4c", fill: "rgba(217, 183, 122, 0.34)" },
  tavolabbi: { stroke: "#9a8a6c", fill: "rgba(201, 184, 150, 0.32)" },
};

export const fmtEzer = (min: number, max: number) =>
  `${(min / 1000).toLocaleString("hu-HU")}–${(max / 1000).toLocaleString("hu-HU")}`;

export default function ZonaTerkep({ height = 420 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);

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
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> közreműködők',
          maxZoom: 18,
          detectRetina: true,
        }).addTo(map);

        L.control.scale({ imperial: false }).addTo(map);

        const group = L.layerGroup().addTo(map);

        // Zónakörvonalak — egy zóna több, egymástól elvált részből állhat
        // (pl. a szigeti települések a Dunán át). Minden rész ugyanazt a tooltipet kapja.
        for (const z of zones) {
          const style = zoneColors[z.id];
          for (const ring of z.polygon) {
            const poly = L.polygon(ring, {
              color: style.stroke,
              weight: 2,
              fillColor: style.fill,
              fillOpacity: 1,
            }).addTo(group);

            poly.bindTooltip(
              `<strong>${z.name}</strong><br/>Fuvar: ${fmtEzer(z.fuelMin, z.fuelMax)} ezer Ft nettó<br/><small>Tájékoztató zónahatár, nem jogi határ.</small>`,
              { sticky: true },
            );
            poly.on("mouseover", () => poly.setStyle({ weight: 3.5 }));
            poly.on("mouseout", () => poly.setStyle({ weight: 2 }));
          }
        }

        // Kiszolgált települések saját jelölése (site.ts) — az OSM-alap feliratai
        // zoomfüggők, ezért a szolgáltatási terület nevei külön, mindig látható
        // (nem csak hoverre megjelenő) címkét kapnak. A XXII. kerület nem pont:
        // Budafok, Budatétény és Nagytétény jelöli.
        for (const s of settlements) {
          if (s.slug === "budapest-22-kerulet") continue;
          const name = s.name.replace(/\s*\(.*\)$/, "");
          L.circleMarker(s.latlng, {
            radius: 4,
            color: "#fffaf1",
            weight: 1.5,
            fillColor: "#24211d",
            fillOpacity: 1,
          })
            .addTo(group)
            .bindTooltip(name, {
              permanent: true,
              direction: ["budafok", "diosd", "erd", "torokbalint"].includes(s.slug) ? "left" : "right",
              offset: [0, 0],
              className: "city-label",
            });
        }

        // Telephely-jelölő
        L.marker(depot.latlng, {
          title: depot.label,
          alt: depot.label,
          icon: L.divIcon({
            className: "",
            html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#c2410c;border:3px solid #fbf8f2;box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><div style="transform:rotate(45deg);color:#fbf8f2;font:700 13px/1 system-ui">★</div></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -30],
          }),
        })
          .addTo(group)
          .bindPopup(
            `<strong>Telephely — Sóderárak</strong><br/>${company.address.full}<br/>${company.hours.short} · <a href="tel:${company.phone.raw}">${company.phone.display}</a>`,
          );

        // A keretezés a tényleges zónákra illeszkedik, nem beégetett nézetre.
        const points = zones.flatMap((z) => z.polygon.flat());
        if (points.length > 0) {
          map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 12 });
        }

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
        style={{ height }}
        className="w-full overflow-hidden rounded-sm border border-line-strong bg-sand"
        role="region"
        aria-label="Interaktív szállítási zónatérkép. A zónák és a hozzájuk tartozó tájékoztató fuvarárak az alábbi listában is olvashatók."
      />
    </div>
  );
}
