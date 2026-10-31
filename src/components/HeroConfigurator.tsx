"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  company,
  findProfileByPostalCode,
  isPostalCodeShape,
  materialGroups,
  MIN_ORDER_M3,
  normalizePostalCode,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { computeQuote } from "@/lib/quote";
import { formatFt, IconArrowRight, IconCheck, IconDroplets, IconPhone, minPrice } from "@/lib/ui";

/**
 * Hero „rendelőpult" (V3.2 — Material Precision).
 *
 * A fő út első három lépése egy helyen: 1) anyag (a kupacsor maga a
 * választó), 2) változat + mennyiség, 3) irányítószám — és közben ÉLŐ,
 * tájékoztató számítás ugyanazzal a modullal, mint a kalkulátor
 * (src/lib/quote.ts). Kitalált összeg nincs: ismeretlen irányítószám,
 * 10 m³ felett vagy Vár-ügy esetén a sor kimondja, hogy egyeztetés kell.
 *
 * Progresszív: a szerver egy sima GET-űrlapot renderel minden változattal
 * (JS nélkül is a kalkulátorra visz). Hidratálás után a kupacok választóként
 * szűrik a változatlistát. A kupacgrafikákat a szerver rendereli (`piles`),
 * így a sziluett-generátor nem kerül a kliens-bundle-be.
 */

type Props = {
  /** basePath-tal ellátott űrlapcél (a szerver adja; a kliens nem ismeri a basePath-ot). */
  action: string;
  /** Szerveren renderelt kupacgrafikák, csoport-slug szerint. */
  piles: Record<string, React.ReactNode>;
};

const DEFAULT_ITEM = "soder-0-24";

export default function HeroConfigurator({ action, piles }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [groupSlug, setGroupSlug] = useState("soder");
  const [itemSlug, setItemSlug] = useState(DEFAULT_ITEM);
  const [m3, setM3] = useState("8");
  const [irsz, setIrsz] = useState("");
  const spotRef = useRef<HTMLUListElement>(null);

  useEffect(() => setHydrated(true), []);

  /* Spotlight (React Bits „SpotlightCard" mintája, átdolgozva): EGY delegált
     pointermove-kezelő a sávon, rAF-ciklus nélkül — csak CSS-változókat ír a
     kártyára; csak finom mutatós eszközön, reduced-motion alatt nincs. */
  useEffect(() => {
    const ul = spotRef.current;
    if (!ul) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".pick");
      if (!card || !ul.contains(card)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    ul.addEventListener("pointermove", onMove);
    return () => ul.removeEventListener("pointermove", onMove);
  }, []);

  const group = materialGroups.find((g) => g.slug === groupSlug) ?? materialGroups[0]!;
  const item = group.items.find((i) => i.slug === itemSlug) ?? group.items[0]!;
  const overLimit = m3 === "tobb";
  const qty = overLimit ? SINGLE_TRIP_MAX_M3 + 1 : Number(m3);
  const code = normalizePostalCode(irsz);
  const profile = isPostalCodeShape(code) ? findProfileByPostalCode(code) : undefined;

  const quote = useMemo(
    () =>
      computeQuote({
        item,
        m3: qty,
        freight: {
          municipalityId: profile?.municipalityId ?? "budapest",
          districtId: profile?.municipalityId === "budapest" ? (profile.districtId ?? null) : null,
          postalCode: profile ? code : "",
          m3: qty,
        },
        castleAnswer: "",
      }),
    [item, qty, profile, code],
  );

  function pickGroup(slug: string) {
    const g = materialGroups.find((x) => x.slug === slug);
    if (!g) return;
    setGroupSlug(slug);
    // A sóder alapértelmezése a leggyakoribb 0–24; máshol a csoport első tétele.
    setItemSlug(slug === "soder" ? DEFAULT_ITEM : g.items[0]!.slug);
  }

  /* ── Tájékoztató sorok (csak jóváhagyott adatból) ── */
  const materialLine = overLimit
    ? `${SINGLE_TRIP_MAX_M3} m³ felett: többfuvaros, egyedi ajánlat`
    : quote.material.subtotalGross !== null
      ? `${m3} m³ × ${formatFt(item.priceGross!)} = ${formatFt(quote.material.subtotalGross)}`
      : "Anyagár egyeztetés után";
  const freightLine = !code
    ? "Az irányítószám alapján"
    : !isPostalCodeShape(code)
      ? "Négyjegyű irányítószám kell"
      : !profile
        ? "Egyedi egyeztetés (nincs jóváhagyott tarifa)"
        : quote.freight
          ? `${formatFt(quote.freight.gross)} (${formatFt(quote.freight.net)} nettó + ÁFA)`
          : "Egyedi egyeztetés ehhez a mennyiséghez";
  const castle = profile?.districtId === 1 && profile.municipalityId === "budapest";
  const total =
    !overLimit && quote.freight && quote.material.subtotalGross !== null && !castle
      ? quote.material.subtotalGross + quote.freight.gross
      : null;
  const totalNote =
    total !== null
      ? "tájékoztató, bruttó"
      : castle
        ? "I. kerület: a Vár miatt a kalkulátorban pontosítjuk"
        : !code
          ? "adja meg az irányítószámot"
          : "egyeztetés után";

  return (
    <form action={action} method="get" aria-labelledby="pult-cim" className="bench">
      <h2 id="pult-cim" className="sr-only">
        Gyors árszámítás: anyag, mennyiség, irányítószám
      </h2>

      {/* ── 1. Anyag: a kupacsor maga a választó ── */}
      <fieldset className="bench-step">
        <legend className="bench-label">
          <span className="bench-num">1</span> Anyag
          <span className="bench-hint">bruttó Ft/m³-től</span>
        </legend>
        <ul ref={spotRef} className="pick-rail" role="list">
          {materialGroups.map((g, i) => {
            const min = minPrice(g.items);
            const active = hydrated && g.slug === groupSlug;
            const washed = g.washed ?? g.items.find((x) => x.washed)?.washed;
            return (
              <li key={g.slug} className="heap-in" style={{ "--i": i } as React.CSSProperties}>
                <button
                  type="button"
                  className="pick"
                  aria-pressed={active}
                  data-active={active}
                  onClick={() => pickGroup(g.slug)}
                >
                  <span aria-hidden="true" className="pick-pile">
                    {piles[g.slug]}
                  </span>
                  <span className="pick-name">{g.name}</span>
                  <span className="pick-price num">
                    {min !== null ? `${formatFt(min)}-tól` : "egyeztetés után"}
                  </span>
                  {washed && (
                    <span className="pick-mark">
                      <IconDroplets size={11} />
                      {g.washed ? "mosott" : "mosott frakciók"}
                    </span>
                  )}
                  <span aria-hidden="true" className="pick-check">
                    <IconCheck size={13} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* ── 2–3. Változat, mennyiség, irányítószám ── */}
      <div className="bench-fields">
        <div className="bench-field bench-field-variant">
          <label htmlFor="gy-anyag" className="bench-label">
            <span className="bench-num">2</span> Változat
          </label>
          <select
            id="gy-anyag"
            name="anyag"
            value={itemSlug}
            onChange={(e) => {
              const v = e.target.value;
              setItemSlug(v);
              const g = materialGroups.find((x) => x.items.some((i) => i.slug === v));
              if (g) setGroupSlug(g.slug);
            }}
          >
            {(hydrated ? [group] : materialGroups).map((g) => (
              <optgroup key={g.slug} label={g.name}>
                {g.items.map((i) => (
                  <option key={i.slug} value={i.slug}>
                    {i.name}
                    {i.priceGross !== null ? ` — ${formatFt(i.priceGross)}/m³` : " — egyeztetés után"}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="bench-field">
          <label htmlFor="gy-m3" className="bench-label">
            Mennyiség
          </label>
          <select id="gy-m3" name="m3" value={m3} onChange={(e) => setM3(e.target.value)}>
            {Array.from({ length: SINGLE_TRIP_MAX_M3 - MIN_ORDER_M3 + 1 }, (_, i) => MIN_ORDER_M3 + i).map((q) => (
              <option key={q} value={q}>
                {q} m³
              </option>
            ))}
            <option value="tobb">{SINGLE_TRIP_MAX_M3} m³ felett</option>
          </select>
        </div>

        <div className="bench-field">
          <label htmlFor="gy-irsz" className="bench-label">
            <span className="bench-num">3</span> Irányítószám
          </label>
          <input
            id="gy-irsz"
            name="irsz"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="pl. 1221"
            value={irsz}
            onChange={(e) => setIrsz(normalizePostalCode(e.target.value))}
            className="num"
          />
        </div>
      </div>

      {/* ── Élő tájékoztató számítás + következő lépés ── */}
      <div className="bench-foot">
        <dl className="bench-readout" aria-live="polite">
          <div>
            <dt>Anyag, bruttó</dt>
            <dd key={materialLine} className="num value-flash">
              {materialLine}
            </dd>
          </div>
          <div>
            <dt>Fuvar, bruttó</dt>
            <dd key={freightLine} className="num value-flash">
              {freightLine}
            </dd>
          </div>
          <div className="bench-total">
            <dt>Összesen</dt>
            <dd key={`${total}-${totalNote}`} className="num value-flash">
              <strong>{total !== null ? formatFt(total) : "—"}</strong>
              <span>{totalNote}</span>
            </dd>
          </div>
        </dl>
        <div className="bench-cta">
          <button type="submit" className="btn btn-lg btn-primary w-full">
            Pontos ár a kalkulátorban
            <IconArrowRight size={18} className="btn-icon btn-icon-move" />
          </button>
          <p className="bench-call">
            <span>Inkább elmondaná?</span>{" "}
            <a
              href={`tel:${company.phone.raw}`}
              className="num inline-flex min-h-11 items-center gap-1.5 font-semibold whitespace-nowrap text-accent-deep underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              <IconPhone size={15} />
              {company.phone.display}
            </a>
          </p>
        </div>
      </div>
    </form>
  );
}
