"use client";

import { useEffect, useRef } from "react";
import type { CircleMarker, Map as LeafletMap, LayerGroup } from "leaflet";
import { districtMapPoints, mapServiceAreas, MAP_DISTRICT_REPRESENTATIVE, romanDistrict } from "@/content/site";
// Leaflet CSS-e globálisan importálva: src/app/globals.css — lásd ott a
// kommentet az okáról (dinamikus CSS-chunk helyett a fő bundle-ben kell lennie).

/**
 * V3 LEFEDETTSÉGI TÉRKÉP.
 *
 * A V2 háromzónás, kiszínezett poligonos térképe megszűnt: a V3 árazás
 * irányítószám-alapú, és találomra rajzolt irányítószám-határokat NEM
 * jelenítünk meg. Ez a térkép kizárólag ÁTTEKINTÉS: a kiszolgált
 * területek jelölése. A konkrét szállítási díjat az árkalkulátor számolja.
 *
 * Megőrzött szabályok: nincs telephely-/depópin, nincs személyes átvétel,
 * a térkép nem fed a headerre (`isolation: isolate` a konténeren),
 * OSM-attribúció a helyén, érintőképernyőn az egyujjas húzás az oldalé.
 * Alaptérkép: saját rajz (nincs csempe, nincs idegen településnév).
 */

/** Van-e a területhez jóváhagyott, irányítószám-alapú tarifa? */
const MARKER = {
  tariff: { fill: "#a8401a", ring: "#fffaf1" },
  quote: { fill: "#6e6457", ring: "#fffaf1" },
} as const;

/** Feliratirány a sűrű pontoknál, hogy a címkék ne fedjék egymást. */
type Dir = "left" | "right" | "top" | "bottom";
const LABEL_DIR: Record<string, Dir> = {
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
  "kerulet-22", // Budafok (a XXII. kerületet képviseli)
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
};
const labelRank = (key: string) => {
  const d = DISTRICT_AREA_SLUGS[key] ?? MAP_DISTRICT_REPRESENTATIVE[key];
  const i = LABEL_PRIORITY.indexOf(d ? `kerulet-${d}` : key);
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

        // SAJÁT RAJZOLT ALAPTÉRKÉP (ügyfél, 2026-11-07): csempék helyett az OSM
        // közigazgatási határaiból, a Dunából és a főutakból egyszer előállított,
        // egyszerűsített adat (public/terkep/alap.json — scripts/terkep-adat.py).
        // Nincs rajta egyetlen településnév sem: feliratot csak a mi kiszolgált
        // területeink jelölései kapnak.
        map.attributionControl.addAttribution(
          'Alaptérkép: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> közreműködők',
        );
        try {
          const res = await fetch(`${BASE}/terkep/alap.json`);
          if (res.ok && !cancelled) {
            const data = (await res.json()) as Parameters<typeof L.geoJSON>[0];
            L.geoJSON(data, {
              interactive: false,
              style: (f) => {
                const k = f?.properties?.k as string;
                const served = f?.properties?.s === 1;
                if (k === "water") return { stroke: false, fillColor: "#b7d0db", fillOpacity: 1 };
                if (k === "road") return { color: "#d8bf96", weight: 1.3, opacity: 0.9, fill: false };
                if (k === "district")
                  return { color: "#d29a6a", weight: 0.8, opacity: 0.9, fillColor: "#f6dcc0", fillOpacity: 0.95 };
                return served
                  ? { color: "#d29a6a", weight: 0.9, opacity: 0.9, fillColor: "#f6dcc0", fillOpacity: 0.95 }
                  : { color: "#d9cdb8", weight: 0.7, opacity: 1, fillColor: "#ece4d5", fillOpacity: 1 };
              },
            }).addTo(map);
          }
        } catch {
          /* alaptérkép nélkül is működik: a jelölések és feliratok megjelennek */
        }

        L.control.scale({ imperial: false }).addTo(map);

        const group = L.layerGroup().addTo(map);
        type Label = { rank: number; marker: CircleMarker; text: string; className: string; dir: Dir };
        const labelled: Label[] = [];

        for (const area of mapServiceAreas()) {
          const hasTariff = area.freight.kind === "profile";
          const style = hasTariff ? MARKER.tariff : MARKER.quote;
          const districtId = DISTRICT_AREA_SLUGS[area.slug];
          const name = districtId ? romanDistrict(districtId) : area.shortName;
          const labelClass = districtId ? "city-label district-label" : hasTariff ? "city-label" : "city-label city-label-quote";
          const labelDir: Dir = LABEL_DIR[area.slug] ?? "right";
          const repDistrict = MAP_DISTRICT_REPRESENTATIVE[area.slug];
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
              direction: labelDir,
              offset: [0, 0],
              className: labelClass,
            })
            .bindPopup(
              hasTariff
                ? `<strong>${area.name}${repDistrict ? ` — Budapest ${romanDistrict(repDistrict)} kerület` : ""}</strong><br/>Ide szállítunk.<br/><small>A pontos szállítási díjat az árkalkulátor számolja ki.</small><br/>${areaLink(area.slug, "Tudnivalók")}`
                : `<strong>${area.name}</strong><br/>Egyedi szállítási egyeztetés szükséges.<br/><small>Ehhez a településhez jelenleg nincs feltüntetett fuvardíj.</small><br/>${areaLink(area.slug, "Részletek")}`,
            );
          labelled.push({ rank: labelRank(area.slug), marker, text: name, className: labelClass, dir: labelDir });
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
              `<strong>${d.name}</strong><br/>Ide szállítunk.<br/><small>Jelölés: a kerület hozzávetőleges középpontja. A pontos szállítási díjat az árkalkulátor számolja ki.</small><br/>${areaLink(d.slug, "Tudnivalók")}`,
            );
          labelled.push({ rank: labelRank(`kerulet-${d.districtId}`), marker, text: d.label, className: "city-label district-label", dir: "right" });
        }
        labelled.sort((a, b) => a.rank - b.rank);

        /**
         * Feliratok elhelyezése fontossági sorrendben: ha a felirat a kedvelt
         * oldalon ütközne (másik felirattal vagy jelölőponttal) vagy kilógna,
         * a pont másik oldalára kerül (jobb, bal, fent, lent). Csak ha egyik
         * oldalon sem fér el, marad rejtve (a pont popupja ekkor is megmutatja).
         *
         * A jelölt helyeket SZÁMOLJUK (pont koordinátája + a felirat mérete, a
         * Leaflet elhelyezési szabálya és a leaflet.css 6 px-es margója), nem a
         * DOM-ból olvassuk: újrakötés után a Leaflet aszinkron pozicionál
         * (reduced-motion alatt mérhetően később), így a DOM-mérés téves volt.
         */
        type Box = { left: number; top: number; right: number; bottom: number };
        const GAP = 6;
        const candidate = (x: number, y: number, w: number, h: number, dir: Dir): Box => {
          const left = dir === "right" ? x + GAP : dir === "left" ? x - w - GAP : x - w / 2;
          // „top": a Leaflet ~1–2 px-szel lejjebb rajzolja (mért), ezt modellezzük.
          const top = dir === "top" ? y - h - GAP + 2 : dir === "bottom" ? y + GAP : y - h / 2;
          return { left, top, right: left + w, bottom: top + h };
        };
        const setDir = (lb: Label, dir: Dir) => {
          const tip = lb.marker.getTooltip();
          if (tip && tip.options.direction === dir) return tip.getElement() ?? null;
          lb.marker.unbindTooltip();
          lb.marker.bindTooltip(lb.text, { permanent: true, direction: dir, offset: [0, 0], className: lb.className });
          return lb.marker.getTooltip()?.getElement() ?? null;
        };
        const declutter = () => {
          const host = containerRef.current;
          // (Leszerelés után — a késleltetett második kör már ne fusson.)
          if (!host || mapRef.current !== map) return;
          const W = host.clientWidth;
          const H = host.clientHeight;
          if (!W || !H) return;
          // Keskenyebb térképen tömörebb feliratok (CSS: .map-compact).
          host.classList.toggle("map-compact", W < 640);
          const pts = labelled.map((lb) => map.latLngToContainerPoint(lb.marker.getLatLng()));
          const dots: Box[] = labelled.map((lb, i) => {
            const r = lb.marker.getRadius() + 1;
            return { left: pts[i]!.x - r, top: pts[i]!.y - r, right: pts[i]!.x + r, bottom: pts[i]!.y + r };
          });
          const kept: Box[] = [];
          const hits = (a: Box, b: Box, pad = 0) =>
            a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + 1 && a.bottom > b.top - 1;
          labelled.forEach((lb, i) => {
            const el = lb.marker.getTooltip()?.getElement();
            if (!el) return;
            // (Ha az elem még nincs a DOM-ban, becsült méret — a következő futás pontosít.)
            const w = el.offsetWidth || lb.text.length * 7 + 8;
            const h = el.offsetHeight || 16;
            const { x, y } = pts[i]!;
            const order = [lb.dir, ...(["right", "left", "top", "bottom"] as Dir[]).filter((d) => d !== lb.dir)];
            let chosen: Dir | null = null;
            let box: Box | null = null;
            // 1. kör: se felirat, se jelölőpont ne takarja; 2. kör: pontot takarhat, feliratot nem.
            for (const avoidDots of [true, false]) {
              for (const dir of order) {
                const c = candidate(x, y, w, h, dir);
                const outside = c.left < 0 || c.top < 0 || c.right > W || c.bottom > H;
                if (outside || kept.some((k) => hits(c, k, 4))) continue;
                if (avoidDots && dots.some((d, j) => j !== i && hits(c, d))) continue;
                chosen = dir;
                box = c;
                break;
              }
              if (chosen) break;
            }
            const target = setDir(lb, chosen ?? lb.dir);
            if (chosen && box) {
              kept.push(box);
              target?.classList.remove("is-hidden");
            } else {
              target?.classList.add("is-hidden");
            }
          });
        };
        /**
         * Végső ellenőrzés a TÉNYLEGES (már elhelyezett) feliratokon: a Leaflet
         * nem egész pixelre rajzol, ezért a számolt és a valós hely tört pixellel
         * eltérhet. Ha két látható felirat mégis összeérne, a kevésbé fontos rejtve
         * marad — így átfedés biztosan nincs.
         */
        const verify = () => {
          if (mapRef.current !== map) return;
          const seen: DOMRect[] = [];
          const box = containerRef.current?.getBoundingClientRect();
          for (const lb of labelled) {
            const el = lb.marker.getTooltip()?.getElement();
            if (!el || el.classList.contains("is-hidden")) continue;
            const r = el.getBoundingClientRect();
            // még el nem helyezett felirat (a térkép bal felső sarkában) — nem ítélünk
            if (box && Math.abs(r.left - box.left) < 1 && Math.abs(r.top - box.top) < 1) continue;
            if (seen.some((k) => r.left < k.right && r.right > k.left && r.top < k.bottom && r.bottom > k.top)) {
              el.classList.add("is-hidden");
            } else {
              seen.push(r);
            }
          }
        };
        let declutterFrame = 0;
        let declutterTimer = 0;
        const scheduleDeclutter = () => {
          cancelAnimationFrame(declutterFrame);
          declutterFrame = requestAnimationFrame(() => {
            declutterFrame = requestAnimationFrame(declutter);
          });
          // Második kör, miután a Leaflet az újrakötött feliratokat is elhelyezte
          // (mérés a végleges felirat-méretekkel).
          window.clearTimeout(declutterTimer);
          declutterTimer = window.setTimeout(() => {
            declutter();
            // a második kör esetleges újrakötései is elhelyeződjenek
            declutterTimer = window.setTimeout(verify, 250);
          }, 350);
        };
        map.on("zoomend moveend resize", scheduleDeclutter);

        // A keretezés a tényleges jelölésekre illeszkedik, nem beégetett nézetre.
        const points = [...mapServiceAreas().map((a) => a.latlng), ...districtMapPoints.map((d) => d.latlng)];
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
            paddingTopLeft: narrow ? [14, 14] : [72, 30],
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
      <div
        ref={containerRef}
        style={{ "--map-h": `${height}px` } as React.CSSProperties}
        className="h-[min(var(--map-h),72vw)] w-full overflow-hidden rounded-sm border border-line-strong bg-[#ece4d5]"
        role="region"
        aria-label="Áttekintő lefedettségi térkép a kiszolgált területekről. A pontos szállítási díjat az árkalkulátor számolja ki."
      />
    </div>
  );
}
