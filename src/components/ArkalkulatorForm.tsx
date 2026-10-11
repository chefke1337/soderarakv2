"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allMaterials,
  company,
  DISCLOSURE_PRICE,
  findFreightTier,
  findZone,
  MAX_ORDER_VOLUME,
  materialGroups,
  MIN_ORDER_VOLUME,
  settlements,
  zones,
} from "@/content/site";
import { formatFt } from "@/lib/ui";
import FractionScale from "@/components/FractionScale";
import { sendArkalkulatorSubmit, trackQuoteRequest } from "@/lib/analytics";

type Draft = {
  materialSlug: string;
  m3: number;
  settlementSlug: string;
  name: string;
  phone: string;
};

const DRAFT_KEY = "arkalkulator-draft-v1";

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (typeof d !== "object" || d === null) return null;
    return d;
  } catch {
    return null; // sérült piszkozat → csendes eldobás
  }
}

function saveDraft(d: Draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // privát mód / kvóta: nem kritikus, elhallgatjuk
  }
}

/** Hungarian-ish phone: optional +36/06 prefix, 7–15 digits total. */
function isValidPhone(v: string): boolean {
  const digits = v.replace(/\D/g, "");
  return (
    /^[+\d][\d\s\-().]{6,19}$/.test(v.trim()) &&
    digits.length >= 7 &&
    digits.length <= 15
  );
}

export default function ArkalkulatorForm() {
  const [materialSlug, setMaterialSlug] = useState("soder-0-24");
  const [m3, setM3] = useState<number>(8);
  const [settlementSlug, setSettlementSlug] = useState("budafok");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean }>({});
  const [submitState, setSubmitState] = useState<"idle" | "opening" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [restored, setRestored] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [calcTouched, setCalcTouched] = useState(false);

  // Piszkozat visszaállítása csak kliensoldalon (SSR-kompatibilis)
  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    // Régi, azóta megszűnt anyag-/településazonosító a piszkozatból: csendesen
    // eldobjuk, marad az alapérték (nem jelenik meg "üres" vagy hibás állapot).
    if (d.materialSlug && allMaterials.some((i) => i.slug === d.materialSlug)) {
      setMaterialSlug(d.materialSlug);
    }
    if (
      typeof d.m3 === "number" &&
      Number.isInteger(d.m3) &&
      d.m3 >= MIN_ORDER_VOLUME &&
      d.m3 <= MAX_ORDER_VOLUME
    ) {
      setM3(d.m3);
    }
    if (d.settlementSlug && settlements.some((s) => s.slug === d.settlementSlug)) {
      setSettlementSlug(d.settlementSlug);
    }
    if (d.name) setName(d.name);
    if (d.phone) setPhone(d.phone);
    setRestored(true);
  }, []);

  // V2: előtöltés az árlistáról / anyagválasztóból érkezve (?anyag=<tétel-slug>).
  // A piszkozat utáni effektben fut, így az URL-ben kért anyag élvez elsőbbséget.
  useEffect(() => {
    try {
      const wanted = new URLSearchParams(window.location.search).get("anyag");
      if (wanted && materialGroups.some((g) => g.items.some((i) => i.slug === wanted))) {
        setMaterialSlug(wanted);
      }
    } catch {
      // érvénytelen URL: marad az alapértelmezett / visszaállított anyag
    }
  }, []);

  const material = useMemo(
    () => materialGroups.flatMap((g) => g.items).find((i) => i.slug === materialSlug),
    [materialSlug],
  );
  const settlement = useMemo(
    () => settlements.find((s) => s.slug === settlementSlug),
    [settlementSlug],
  );
  const zone = settlement ? findZone(settlement.zone) : null;

  // Állapot mentése minden változásnál
  useEffect(() => {
    saveDraft({ materialSlug, m3, settlementSlug, name, phone });
  }, [materialSlug, m3, settlementSlug, name, phone]);

  const nameValid = name.trim().length >= 2;
  const phoneValid = isValidPhone(phone);
  const formValid = nameValid && phoneValid;

  // Mennyiségi fuvardíj-sáv a kiválasztott zónában — a slider 1–20 közötti
  // egész értékeken mindig talál sávot (a site.ts tiers 1–20-at lefedi),
  // de a lookup típusa szerint elvben hiányozhat, ezért védetten kezeljük.
  const tier = useMemo(() => (zone ? findFreightTier(zone.id, m3) : undefined), [zone, m3]);

  const estimate = useMemo(() => {
    if (!material || !zone || !tier) return null;
    const materialTotal =
      material.priceNet !== null ? material.priceNet * m3 : null;
    return {
      materialTotal,
      freightFee: tier.fee,
      needsNegotiation: tier.needsNegotiation ?? false,
      tierLabel: `${tier.minQty}–${tier.maxQty} m³`,
      total: materialTotal !== null ? materialTotal + tier.fee : null,
    };
  }, [material, zone, tier, m3]);

  // Mikro-konverzió: az első SAJÁT módosítás után először teljes az összegzés
  // (material + zone) → arkalkulator_submit, oldalletöltésenként egyszer.
  // A calcTouched kapu kell: mountoláskor a default értékekkel is teljes lenne
  // az összegzés — az nem konverzió. A localStorage-ből visszaállított piszkozat
  // szintén NEM váltja ki (az nem felhasználói tevékenység).
  // (Az estimate DEKLARÁCIÓJA UTÁN kell lennie — dep-array render közben értékelődik ki.)
  useEffect(() => {
    if (!calcTouched || submittedOnce || !estimate || !material || !zone) return;
    sendArkalkulatorSubmit({
      material: material.slug,
      m3: Number(m3),
      settlement: settlement?.slug ?? "?",
      zone: zone.id,
    });
    setSubmittedOnce(true);
  }, [calcTouched, submittedOnce, estimate, material, zone, m3, settlement]);

  function buildMailto(): string {
    const subject = `Ajánlatkérés: ${material?.name ?? "anyag"} ${m3} m³ — ${settlement?.name ?? ""}`;
    const rows: string[] = [];
    rows.push("Ajánlatkérés a soderarak.hu árkalkulátorából:");
    rows.push("");
    rows.push(`Anyag: ${material?.name ?? "?"}${material?.fraction ? ` (${material.fraction})` : ""}`);
    rows.push(`Mennyiség: ${m3} m³`);
    rows.push(`Helyszín: ${settlement?.name ?? "?"} (${zone?.name ?? "?"})`);
    rows.push("");
    if (estimate) {
      if (estimate.materialTotal !== null) {
        rows.push(`Tájékoztató anyagár: ${formatFt(estimate.materialTotal)} nettó`);
        rows.push(`Tájékoztató fuvar (${estimate.tierLabel} sáv): ${formatFt(estimate.freightFee)} nettó`);
        rows.push(`Tájékoztató összesen: ${formatFt(estimate.total ?? 0)} nettó (ÁFA nélkül)`);
      } else {
        rows.push("Anyagár: egyeztetés után (az árlista nem tartalmaz árat)");
        rows.push(`Tájékoztató fuvar (${estimate.tierLabel} sáv): ${formatFt(estimate.freightFee)} nettó`);
      }
      if (estimate.needsNegotiation) {
        rows.push("Ez a mennyiség külön egyeztetést igényel. A fenti összeg tájékoztató jellegű.");
      }
    }
    rows.push("");
    rows.push(`Név: ${name.trim()}`);
    rows.push(`Telefon: ${phone.trim()}`);
    rows.push("");
    rows.push(DISCLAIMER_TEXT);
    return `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(rows.join("\n"))}`;
  }

  async function copySummary() {
    const text = [
      `Ajánlatkérés — ${company.site.name}`,
      `Anyag: ${material?.name ?? "?"}`,
      `Mennyiség: ${m3} m³`,
      `Helyszín: ${settlement?.name ?? "?"}`,
      `Név: ${name.trim()}`,
      `Telefon: ${phone.trim()}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setSubmitState("error");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    setSubmitCount((count) => count + 1);
    if (!formValid) return;
    try {
      trackQuoteRequest({
        material: material?.slug ?? "?",
        m3: Number(m3),
        settlement: settlement?.slug ?? "?",
        zone: zone?.id ?? "?",
      });
      window.location.href = buildMailto();
      setSubmitState("opening");
    } catch {
      setSubmitState("error");
    }
  }

  const showNameError = touched.name && !nameValid;
  const showPhoneError = touched.phone && !phoneValid;

  const field =
    "mt-2 w-full rounded-sm border border-line-strong bg-paper px-3.5 py-3 text-base transition-colors hover:border-ink focus-visible:border-ink";

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ─── Számítás: pontosan 3 input ─── */}
      <section aria-labelledby="kalk-cim" className="lg:col-span-7">
        <h2 id="kalk-cim" className="font-display text-heading-md font-bold">
          Számoljon három lépésben
        </h2>

        <ol className="mt-6 border-t border-ink/80">
          <li className="border-b border-line py-6">
            <label htmlFor="anyag" className="flex items-baseline gap-3 font-semibold">
              <span aria-hidden="true" className="num text-sm text-ink-faint">1</span>
              Anyag
            </label>
            <select
              id="anyag"
              value={materialSlug}
              onChange={(e) => {
                setCalcTouched(true);
                setMaterialSlug(e.target.value);
              }}
              className={field}
            >
              {materialGroups.map((g) => (
                <optgroup key={g.slug} label={g.name}>
                  {g.items.map((i) => (
                    <option key={i.slug} value={i.slug}>
                      {i.name}
                      {i.priceNet !== null ? ` — ${formatFt(i.priceNet)}/m³` : " — ár egyeztetés után"}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {material && (
              <div className="mt-3 grid gap-3 rounded-sm bg-sand px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
                <p className="text-sm leading-snug text-ink-soft">{material.use}</p>
                {material.fraction ? (
                  <div>
                    <FractionScale fraction={material.fraction} showTicks />
                  </div>
                ) : null}
              </div>
            )}
          </li>

          <li className="border-b border-line py-6">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="m3-slider" className="flex items-baseline gap-3 font-semibold">
                <span aria-hidden="true" className="num text-sm text-ink-faint">2</span>
                Mennyiség (m³)
              </label>
              <output
                htmlFor="m3-slider"
                aria-hidden="true"
                className="num font-display text-[1.375rem] leading-none font-bold text-ink"
              >
                {m3}
              </output>
            </div>
            <input
              id="m3-slider"
              type="range"
              name="mennyiseg"
              min={MIN_ORDER_VOLUME}
              max={MAX_ORDER_VOLUME}
              step={1}
              value={m3}
              onChange={(e) => {
                setCalcTouched(true);
                setM3(Number(e.target.value));
              }}
              aria-valuetext={`${m3} köbméter`}
              aria-describedby="mennyiseg-info"
              className="qty-slider mt-3"
            />
            <div
              aria-hidden="true"
              className="num mt-1 flex justify-between text-xs text-ink-faint"
            >
              <span>{MIN_ORDER_VOLUME} m³</span>
              <span>{MAX_ORDER_VOLUME} m³</span>
            </div>
            <p id="mennyiseg-info" className="mt-2 text-sm text-ink-soft">
              Minimum rendelés {MIN_ORDER_VOLUME} m³; egy fuvarban legfeljebb{" "}
              {MAX_ORDER_VOLUME} m³ szállítható.
            </p>
          </li>

          <li className="py-6">
            <label htmlFor="telepules" className="flex items-baseline gap-3 font-semibold">
              <span aria-hidden="true" className="num text-sm text-ink-faint">3</span>
              Helyszín (település)
            </label>
            <select
              id="telepules"
              value={settlementSlug}
              onChange={(e) => {
                setCalcTouched(true);
                setSettlementSlug(e.target.value);
              }}
              aria-describedby="zona-info"
              className={field}
            >
              {zones.map((z) => (
                <optgroup key={z.id} label={z.name}>
                  {settlements
                    .filter((s) => s.zone === z.id)
                    .map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {zone && tier && (
              <p id="zona-info" className="mt-2 text-sm text-ink-soft">
                Zóna: <span className="font-medium text-ink">{zone.name}</span>, fuvar{" "}
                {m3} m³-re{" "}
                <span className="num font-medium text-ink">{formatFt(tier.fee)}</span>
                {tier.needsNegotiation ? " (külön egyeztetés szükséges)" : ""}
                , kiszállás {zone.leadTime}.
              </p>
            )}
          </li>
        </ol>
      </section>

      {/* ─── Eredmény ─── */}
      <section
        data-call-region="calculator_form"
        aria-labelledby="eredmeny-cim"
        className="h-fit lg:sticky lg:top-28 lg:col-span-5"
      >
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-pop">
          <div className="on-dark relative bg-surface-dark px-5 pt-6 pb-5 text-on-dark md:px-7">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5"><span className="flex-1 bg-mat-homok" /><span className="flex-1 bg-mat-soder" /><span className="flex-1 bg-accent" /><span className="flex-1 bg-mat-fold" /></div>
            <h2 id="eredmeny-cim" className="font-display text-heading-sm font-bold">
              Tájékoztató összegzés
            </h2>

            {material && zone && estimate ? (
              <>
                <dl aria-live="polite" aria-atomic="true" className="num mt-4 space-y-3 text-[0.9375rem]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-on-dark-muted">
                      {material.name}
                      {material.fraction ? ` (${material.fraction})` : ""} × {m3} m³
                    </dt>
                    <dd className="text-right font-semibold whitespace-nowrap">
                      {estimate.materialTotal !== null ? (
                        formatFt(estimate.materialTotal)
                      ) : (
                        <span className="text-on-dark-muted">egyeztetés után</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-on-dark/20 pt-3">
                    <dt className="text-on-dark-muted">
                      Fuvar — {zone.name}
                      <span className="block text-xs">{estimate.tierLabel} sáv</span>
                    </dt>
                    <dd className="text-right font-semibold whitespace-nowrap">
                      {formatFt(estimate.freightFee)}
                    </dd>
                  </div>
                  <div className="border-t-2 border-on-dark/60 pt-3">
                    <dt className="font-semibold">Összesen (nettó)</dt>
                    <dd key={`${estimate.total}-${m3}`} className="mt-1 swap-in font-display text-[1.375rem] leading-tight font-bold tracking-tight whitespace-nowrap text-amber min-[400px]:text-[1.625rem] md:text-[2.125rem]">
                      {estimate.total !== null ? (
                        formatFt(estimate.total)
                      ) : (
                        <span className="text-lg">egyeztetés után</span>
                      )}
                    </dd>
                  </div>
                </dl>
                {estimate.needsNegotiation && (
                  <p
                    role="status"
                    className="mt-3 rounded-sm border border-amber/50 bg-amber/10 px-3 py-2 text-xs leading-relaxed font-medium text-amber"
                  >
                    Ez a mennyiség külön egyeztetést igényel. A megjelenített összeg tájékoztató jellegű.
                  </p>
                )}
              </>
            ) : (
              <p role="status" className="mt-4 text-sm text-on-dark-muted">
                Válasszon anyagot és települést az összegzéshez.
              </p>
            )}

            <p className="mt-4 rounded-sm bg-surface-dark-2 px-3 py-2 text-xs leading-relaxed font-medium text-on-dark-muted">
              {DISCLOSURE_PRICE} Az árak nettó értékek, ÁFA nélkül.
            </p>
            {restored && (
              <p className="mt-3 text-xs text-on-dark-muted">
                Korábban megkezdett számítás visszaállítva.
              </p>
            )}
          </div>

          {/* ─── Lead űrlap ─── */}
          <form onSubmit={handleSubmit} noValidate className="px-5 pt-6 pb-6 md:px-7">
            <p className="font-semibold">Kérjen ajánlatot — hívunk vagy válaszolunk</p>

            {submitCount > 0 && !formValid && (
              <p id="quote-validation-summary" role="alert" className="mt-3 text-sm font-medium text-red-700">
                Ellenőrizze a nevet és a telefonszámot az ajánlatkérés elküldése előtt.
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="nev" className="block text-sm font-medium">
                  Név <span aria-hidden="true" className="text-brand-dark">*</span>
                </label>
                <input
                  id="nev"
                  name="nev"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  aria-invalid={showNameError}
                  aria-describedby={[
                    showNameError ? "nev-hiba" : null,
                    submitCount > 0 && !formValid ? "quote-validation-summary" : null,
                  ].filter(Boolean).join(" ") || undefined}
                  className={`mt-1.5 w-full rounded-sm border bg-paper px-3.5 py-3 transition-colors hover:border-ink focus-visible:border-ink ${
                    showNameError ? "border-red-700" : "border-line-strong"
                  }`}
                />
                {showNameError && (
                  <p id="nev-hiba" role="alert" className="mt-1 text-xs text-red-700">
                    Kérjük, adja meg a nevét (legalább 2 karakter).
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="telefon" className="block text-sm font-medium">
                  Telefon <span aria-hidden="true" className="text-brand-dark">*</span>
                </label>
                <input
                  id="telefon"
                  name="telefon"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="+36 30 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  aria-invalid={showPhoneError}
                  aria-describedby={[
                    showPhoneError ? "telefon-hiba" : null,
                    submitCount > 0 && !formValid ? "quote-validation-summary" : null,
                  ].filter(Boolean).join(" ") || undefined}
                  className={`num mt-1.5 w-full rounded-sm border bg-paper px-3.5 py-3 transition-colors hover:border-ink focus-visible:border-ink ${
                    showPhoneError ? "border-red-700" : "border-line-strong"
                  }`}
                />
                {showPhoneError && (
                  <p id="telefon-hiba" role="alert" className="mt-1 text-xs text-red-700">
                    Kérjük, érvényes telefonszámot adjon meg (pl. +36 30 123 4567).
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-lg btn-primary mt-5 w-full"
            >
              Ajánlatkérés elküldése
            </button>

            {submitState === "opening" && (
              <div
                data-call-region="quote_form_success"
                role="status"
                className="mt-4 rounded-sm border border-moss/40 bg-moss/10 p-3 text-xs leading-relaxed"
              >
                <p className="font-semibold text-moss">Megnyitjuk az e-mail kliensét…</p>
                <p className="mt-1 text-ink-soft">
                  Ha nem történik semmi, másolja le az összegzést, vagy hívjon minket:{" "}
                  <a href={`tel:${company.phone.raw}`} className="num font-semibold">
                    {company.phone.display}
                  </a>
                </p>
                <button
                  type="button"
                  onClick={copySummary}
                  className="mt-2 min-h-10 rounded-sm border border-line-strong bg-paper px-3 font-semibold"
                >
                  {copied ? "Kimásolva ✓" : "Összegzés másolása"}
                </button>
              </div>
            )}
            {submitState === "error" && (
              <div
                data-call-region="calculator_error_recovery"
                role="alert"
                className="mt-4 rounded-sm border border-red-700/40 bg-red-50 p-3 text-xs leading-relaxed"
              >
                <p className="font-semibold text-red-700">
                  Nem sikerült megnyitni az e-mail klienst.
                </p>
                <p className="mt-1 text-ink-soft">
                  Hívjon minket közvetlenül:{" "}
                  <a href={`tel:${company.phone.raw}`} className="num font-semibold">
                    {company.phone.display}
                  </a>{" "}
                  ({company.hours.short}), vagy írjon ide: {company.email}.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Az űrlap az e-mail kliensét nyitja meg a megadott adatokkal az
              info@soderarak.hu címre. A piszkozat az Ön eszközén marad.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

const DISCLAIMER_TEXT =
  "Tájékoztató ár. A végleges ajánlatot egyeztetés után adjuk.";
