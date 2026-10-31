"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  budapestDistricts,
  CASTLE_DISTRICT_ID,
  CASTLE_QUESTION,
  company,
  DISCLOSURE_GROSS,
  findProfileByPostalCode,
  freightProfiles,
  isPostalCodeShape,
  materialGroups,
  MIN_ORDER_M3,
  MULTI_TRIP_NOTICE,
  municipalities,
  normalizePostalCode,
  ORDER_INTENT_CTA,
  ORDER_INTENT_NOTICE,
  PERMIT_NOTICE,
  PRICING_VERSION,
  resolveItemSlug,
  SINGLE_TRIP_MAX_M3,
  type CastleAnswer,
  type MaterialGroup,
  type MunicipalityId,
} from "@/content/site";
import { computeQuote } from "@/lib/quote";
import { isValidEmail, isValidPhone } from "@/lib/order";
import {
  newIdempotencyKey,
  ORDER_ENDPOINT_CONFIGURED,
  submitOrderRequest,
  type SubmitOutcome,
} from "@/lib/order-client";
import { formatFt, IconArrowRight, IconCheck, IconDroplets, IconPhone } from "@/lib/ui";
import { MATERIAL_COLOR } from "@/components/MaterialGrain";
import FractionScale from "@/components/FractionScale";
import QuoteReceipt from "@/components/QuoteReceipt";
import { trackQuoteRequest, sendArkalkulatorSubmit } from "@/lib/analytics";

/* ──────────────────── Piszkozat (CSAK a számítás, nem a kapcsolat) ──────────────────── */

const DRAFT_KEY = "arkalkulator-draft-v3";

type Draft = {
  itemSlug: string;
  m3: number;
  municipalityId: MunicipalityId | "";
  districtId: number | null;
  postalCode: string;
};

function loadDraft(): Partial<Draft> | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    return d && typeof d === "object" ? d : null;
  } catch {
    return null; // sérült piszkozat → csendes eldobás
  }
}

function saveDraft(d: Draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // privát mód / kvóta: nem kritikus
  }
}

/* ──────────────────────────────── Komponens ──────────────────────────────── */

type Step = 1 | 2 | 3;

export default function ArkalkulatorForm() {
  /* ── Számítás állapota ── */
  const [groupSlug, setGroupSlug] = useState("soder");
  const [itemSlug, setItemSlug] = useState("soder-0-24");
  const [m3, setM3] = useState(8);
  const [overLimit, setOverLimit] = useState(false);
  const [municipalityId, setMunicipalityId] = useState<MunicipalityId | "">("budapest");
  const [districtId, setDistrictId] = useState<number | null>(22);
  const [postalCode, setPostalCode] = useState("");
  const [castleAnswer, setCastleAnswer] = useState<CastleAnswer>("");
  const [postalTouched, setPostalTouched] = useState(false);

  /* ── Lépések ── */
  const [step, setStep] = useState<Step>(1);
  const [visited, setVisited] = useState<Record<Step, boolean>>({ 1: true, 2: false, 3: false });
  const stepHeadingRefs = useRef<Record<number, HTMLHeadingElement | null>>({});
  const movedByUser = useRef(false);

  /* ── Kapcsolat / beküldés ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [note, setNote] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const idemKey = useRef<string>("");
  const inFlight = useRef(false);
  const uid = useId();

  /* ── Piszkozat visszaállítása (csak kliensen, SSR-barát) ── */
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    const resolved = resolveItemSlug(d.itemSlug);
    if (resolved) {
      setItemSlug(resolved);
      const g = materialGroups.find((x) => x.items.some((i) => i.slug === resolved));
      if (g) setGroupSlug(g.slug);
    }
    if (
      typeof d.m3 === "number" &&
      Number.isInteger(d.m3) &&
      d.m3 >= MIN_ORDER_M3 &&
      d.m3 <= SINGLE_TRIP_MAX_M3
    ) {
      setM3(d.m3);
    }
    if (d.municipalityId && municipalities.some((mm) => mm.id === d.municipalityId)) {
      setMunicipalityId(d.municipalityId);
      if (d.municipalityId !== "budapest") setDistrictId(null);
    }
    if (typeof d.districtId === "number" && budapestDistricts.some((x) => x.id === d.districtId)) {
      setDistrictId(d.districtId);
    }
    if (typeof d.postalCode === "string" && isPostalCodeShape(d.postalCode)) {
      setPostalCode(normalizePostalCode(d.postalCode));
    }
    setRestored(true);
  }, []);

  /* ── Előtöltés URL-ből ──
     ?anyag=<tétel-slug> (régi azonosító is) — az árlistáról és a hero gyors
     ajánlatából; ?m3=1–10 vagy ?m3=tobb; ?irsz=<4 számjegy>. Az irányítószám
     csak akkor választ települést/kerületet, ha jóváhagyott díjprofilhoz
     tartozik — egyébként csak a mezőt tölti, a választás a felhasználóé.
     Ha a hero már megadta az anyagot és a mennyiséget, a 3. lépésnél nyitunk. */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const wanted = resolveItemSlug(params.get("anyag"));
      if (wanted) {
        setItemSlug(wanted);
        const g = materialGroups.find((x) => x.items.some((i) => i.slug === wanted));
        if (g) setGroupSlug(g.slug);
      }

      const rawM3 = params.get("m3");
      const n = Number(rawM3);
      const m3Given = rawM3 === "tobb" || (Number.isInteger(n) && n >= MIN_ORDER_M3 && n <= SINGLE_TRIP_MAX_M3);
      if (rawM3 === "tobb") setOverLimit(true);
      else if (m3Given) {
        setM3(n);
        setOverLimit(false);
      }

      const rawIrsz = params.get("irsz");
      const irsz = rawIrsz && isPostalCodeShape(rawIrsz) ? normalizePostalCode(rawIrsz) : "";
      if (irsz) {
        setPostalCode(irsz);
        setPostalTouched(true);
        const profile = findProfileByPostalCode(irsz);
        if (profile) {
          setMunicipalityId(profile.municipalityId);
          setDistrictId(profile.municipalityId === "budapest" ? (profile.districtId ?? null) : null);
          setCastleAnswer("");
        }
      }

      if (wanted && (m3Given || irsz)) {
        setStep(3);
        setVisited({ 1: true, 2: true, 3: true });
      }
    } catch {
      // érvénytelen URL: marad az alapértelmezett / visszaállított állapot
    }
  }, []);

  const group: MaterialGroup =
    materialGroups.find((g) => g.slug === groupSlug) ?? materialGroups[0]!;
  const item = useMemo(
    () => materialGroups.flatMap((g) => g.items).find((i) => i.slug === itemSlug),
    [itemSlug],
  );

  useEffect(() => {
    saveDraft({ itemSlug, m3, municipalityId, districtId, postalCode });
  }, [itemSlug, m3, municipalityId, districtId, postalCode]);

  /* ── Hiteles számítás (ugyanaz a modul fut a szerveren is) ── */
  const quote = useMemo(
    () =>
      computeQuote({
        item,
        m3,
        freight: {
          municipalityId,
          districtId,
          postalCode,
          // 10 m³ felett nincs egyfuvaros tarifa → a modell egyedi ajánlatot jelez.
          m3: overLimit ? SINGLE_TRIP_MAX_M3 + 1 : m3,
        },
        castleAnswer,
      }),
    [item, m3, municipalityId, districtId, postalCode, castleAnswer, overLimit],
  );

  const isCastleDistrict = municipalityId === "budapest" && districtId === CASTLE_DISTRICT_ID;

  /* ── Mikro-konverzió: első teljes összegzés SAJÁT módosítás után ── */
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current || !movedByUser.current) return;
    if (quote.freightResult.kind !== "ok" || !item) return;
    reported.current = true;
    sendArkalkulatorSubmit({
      material: item.slug,
      m3,
      settlement: postalCode,
      zone: quote.freightResult.profile.id,
    });
  }, [quote, item, m3, postalCode]);

  /* ── Lépésváltás helyes fókuszkezeléssel ── */
  // A fókuszt NEM a kattintáskezelőben mozgatjuk: a lépésváltás elrejti az
  // előző panel tartalmát (benne a megnyomott gombbal), és a böngésző ilyenkor
  // a <body>-ra ejtheti a fókuszt — egy rAF-fel korábbi focus() hívást ez
  // felülírhat. Ezért a DOM-commit UTÁN, effektben fókuszálunk.
  const pendingFocus = useRef(false);
  const goToStep = useCallback((next: Step) => {
    movedByUser.current = true;
    pendingFocus.current = true;
    setStep(next);
    setVisited((v) => ({ ...v, [next]: true }));
  }, []);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    // A lépés címe tabIndex={-1}: képernyőolvasóval is követhető a váltás.
    stepHeadingRefs.current[step]?.focus();
  }, [step]);

  /* ── Űrlapvalidáció ── */
  const nameValid = name.trim().length >= 2;
  const emailValid = isValidEmail(email);
  const phoneValid = isValidPhone(phone);
  const addressValid = address.trim().length >= 4;
  const postalValid = isPostalCodeShape(postalCode);
  const districtValid = municipalityId !== "budapest" || districtId !== null;
  const canSubmit =
    nameValid && emailValid && phoneValid && addressValid && postalValid && districtValid && privacy;

  const err = (field: string, ok: boolean) => (touched[field] || submitAttempts > 0) && !ok;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempts((n) => n + 1);
    setTouched((t) => ({
      ...t,
      name: true,
      email: true,
      phone: true,
      address: true,
      postalCode: true,
      privacy: true,
    }));
    setPostalTouched(true);
    setServerErrors({});
    if (!canSubmit || submitting || inFlight.current) return;

    // Nincs beküldési végpont: e-mailes átadás, nem álcázott „siker".
    if (!ORDER_ENDPOINT_CONFIGURED) {
      setOutcome(null);
      setMailHandoff(true);
      window.location.href = mailtoHref;
      return;
    }

    // Dupla beküldés: egy kulcs az adott beküldésre; csak siker után újul.
    if (!idemKey.current) idemKey.current = newIdempotencyKey();
    inFlight.current = true;
    setSubmitting(true);
    setOutcome(null);

    try {
      trackQuoteRequest({
        material: item?.slug ?? "?",
        m3,
        settlement: postalCode,
        zone: quote.freightResult.kind === "ok" ? quote.freightResult.profile.id : "egyeztetes",
      });
    } catch {
      // mérés hibája nem akadályozza a beküldést
    }

    const result = await submitOrderRequest({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      materialSlug: itemSlug,
      m3,
      municipalityId: (municipalityId || "budapest") as MunicipalityId,
      districtId: municipalityId === "budapest" ? districtId : null,
      postalCode,
      address: address.trim(),
      preferredDate: preferredDate.trim(),
      castleAnswer,
      note: note.trim(),
      pricingVersion: PRICING_VERSION,
      clientTotalGross: quote.totalGross,
      idempotencyKey: idemKey.current,
      privacyAccepted: true,
    });

    setOutcome(result);
    if (result.status === "invalid") setServerErrors(result.errors);
    // Sikeres (vagy duplikált) beküldés után új kulcs kell a következőhöz.
    if (result.status === "sent") idemKey.current = "";
    setSubmitting(false);
    inFlight.current = false;
  }

  const field =
    "mt-1.5 w-full rounded-sm border border-border-strong bg-surface px-3.5 py-3 text-base transition-colors hover:border-text focus-visible:border-text";
  const fieldErr =
    "mt-1.5 w-full rounded-sm border border-red-700 bg-surface px-3.5 py-3 text-base transition-colors";

  const selectedCodeSets = useMemo(() => {
    if (municipalityId === "budapest" && districtId) {
      return freightProfiles
        .filter((p) => p.municipalityId === "budapest" && p.districtId === districtId)
        .map((p) => p.postalCodes.join(", "));
    }
    if (municipalityId === "erd") {
      return freightProfiles.filter((p) => p.id === "erd").map((p) => p.postalCodes.join(", "));
    }
    return [];
  }, [municipalityId, districtId]);

  /* ── E-mailes átadás, ha nincs beküldési végpont (statikus előnézet) ──
     Nem szimulálunk sikeres beküldést: a felhasználó SAJÁT levelezőprogramja
     nyílik meg az összesítővel kitöltve, és az igény csak akkor érkezik meg,
     ha ő elküldi. Adatot az oldal nem továbbít sehová. */
  const mailtoHref = useMemo(() => {
    const place =
      municipalityId === "budapest"
        ? `Budapest${districtId ? ` ${budapestDistricts.find((d) => d.id === districtId)?.label ?? ""}` : ""}`
        : municipalities.find((mm) => mm.id === municipalityId)?.name ?? "";
    const lines = [
      "Rendelési igény (tájékoztató árkalkuláció alapján)",
      "",
      `Anyag: ${item?.name ?? "—"} (${group.name})`,
      `Mennyiség: ${overLimit ? `${SINGLE_TRIP_MAX_M3} m³ felett — többfuvaros ajánlatot kérek` : `${m3} m³`}`,
      `Település: ${place.trim()}`,
      `Irányítószám: ${postalCode || "—"}`,
      `Szállítási cím: ${address.trim() || "—"}`,
      ...(isCastleDistrict ? [`Vár területén: ${castleAnswer || "nincs megadva"}`] : []),
      "",
      quote.material.subtotalGross !== null
        ? `Anyag bruttó részösszeg: ${formatFt(quote.material.subtotalGross)}`
        : "Anyag: egyeztetés után",
      quote.freight
        ? `Fuvar: ${formatFt(quote.freight.net)} nettó + ÁFA = ${formatFt(quote.freight.gross)} bruttó`
        : "Fuvar: egyedi egyeztetés",
      quote.totalGross !== null
        ? `Teljes bruttó tájékoztató összeg: ${formatFt(quote.totalGross)}`
        : "Teljes összeg: egyeztetés után",
      "",
      `Név: ${name.trim() || "—"}`,
      `Telefon: ${phone.trim() || "—"}`,
      `E-mail: ${email.trim() || "—"}`,
      `Kívánt időpont: ${preferredDate.trim() || "egyeztetés szerint"}`,
      ...(note.trim() ? ["", `Megjegyzés: ${note.trim()}`] : []),
      "",
      ORDER_INTENT_NOTICE,
      `Árazási verzió: ${PRICING_VERSION}`,
    ];
    const subject = `Rendelési igény — ${item?.name ?? "ömlesztett anyag"}, ${overLimit ? `${SINGLE_TRIP_MAX_M3}+ m³` : `${m3} m³`}`;
    return `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }, [
    municipalityId, districtId, item, group.name, overLimit, m3, postalCode, address,
    isCastleDistrict, castleAnswer, quote, name, phone, email, preferredDate, note,
  ]);
  const [mailHandoff, setMailHandoff] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ═══════════════════ Lépések ═══════════════════ */}
      <div className="min-w-0 lg:col-span-7">
        <StepRail step={step} visited={visited} onJump={goToStep} />

        {/* ── 1. Anyag ── */}
        <StepPanel
          index={1}
          active={step === 1}
          title="Melyik anyagra van szüksége?"
          summary={
            visited[1] && item
              ? `${item.name} · ${item.priceGross !== null ? `${formatFt(item.priceGross)}/m³ bruttó` : "egyeztetés után"}`
              : undefined
          }
          onEdit={() => goToStep(1)}
          headingRef={(el) => {
            stepHeadingRefs.current[1] = el;
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-text-muted">Anyagcsoport</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {materialGroups.map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  aria-pressed={g.slug === groupSlug}
                  onClick={() => {
                    movedByUser.current = true;
                    setGroupSlug(g.slug);
                    setItemSlug(g.items[0]!.slug);
                  }}
                  className="mat-chip"
                  data-active={g.slug === groupSlug}
                  style={{ "--mat": MATERIAL_COLOR[g.tone].base } as React.CSSProperties}
                >
                  <span aria-hidden="true" className="mat-chip-dot" />
                  {g.name}
                </button>
              ))}
            </div>
          </fieldset>

          {group.washed && (
            <p className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-petrol-soft/50 px-3 py-1.5 text-xs font-semibold text-petrol-deep">
              <IconDroplets size={14} />
              {group.washed.label}
            </p>
          )}

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-text-muted">
              Termékváltozat — bruttó Ft/m³
            </legend>
            <ul className="mt-2.5 space-y-2">
              {group.items.map((i) => {
                const selected = i.slug === itemSlug;
                return (
                  <li key={i.slug}>
                    <label className="variant-card" data-active={selected}>
                      <input
                        type="radio"
                        name={`${uid}-variant`}
                        value={i.slug}
                        checked={selected}
                        onChange={() => {
                          movedByUser.current = true;
                          setItemSlug(i.slug);
                        }}
                        className="variant-radio"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-display text-[1.0625rem] font-bold">{i.name}</span>
                          {i.qualifier && (
                            <span className="text-xs font-medium text-text-muted">{i.qualifier}</span>
                          )}
                          {i.washed && (
                            <span className="badge-washed">
                              <IconDroplets size={11} />
                              {i.washed.label}
                            </span>
                          )}
                          {i.unclassified && <span className="badge-plain">osztályozatlan</span>}
                        </span>
                        <span className="mt-1 block text-sm leading-snug text-text-muted">
                          {i.use}
                        </span>
                        {i.fraction && (
                          <span className="mt-2 block max-w-[16rem]">
                            <FractionScale fraction={i.fraction} />
                            <span className="num mt-1 block text-xs text-text-muted">
                              {i.fraction}
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="num shrink-0 text-right">
                        <span className="block font-display text-heading-sm font-bold whitespace-nowrap">
                          {i.priceGross !== null ? formatFt(i.priceGross) : "—"}
                        </span>
                        <span className="block text-xs text-text-muted">bruttó / m³</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <p className="mt-4 text-xs leading-relaxed text-text-muted">{DISCLOSURE_GROSS}</p>

          <StepNav onNext={() => goToStep(2)} nextLabel="Tovább: mennyiség" />
        </StepPanel>

        {/* ── 2. Mennyiség ── */}
        <StepPanel
          index={2}
          active={step === 2}
          title="Mennyi anyagra van szüksége?"
          summary={
            visited[2]
              ? overLimit
                ? `${SINGLE_TRIP_MAX_M3} m³ felett — többfuvaros, egyedi ajánlat`
                : `${m3} m³`
              : undefined
          }
          onEdit={() => goToStep(2)}
          headingRef={(el) => {
            stepHeadingRefs.current[2] = el;
          }}
        >
          <div className="qty-block">
            <div className="flex items-end justify-between gap-4">
              <label htmlFor={`${uid}-m3`} className="text-sm font-semibold text-text-muted">
                Mennyiség egy fuvarban
              </label>
              <p aria-hidden="true" className="num font-display text-[2.5rem] leading-none font-bold">
                {m3}
                <span className="ml-1 text-[1.25rem] font-semibold text-text-muted">m³</span>
              </p>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="qty-step"
                aria-label="Egy köbméterrel kevesebb"
                disabled={m3 <= MIN_ORDER_M3}
                onClick={() => {
                  movedByUser.current = true;
                  setM3((v) => Math.max(MIN_ORDER_M3, v - 1));
                }}
              >
                <span aria-hidden="true">−</span>
              </button>
              <input
                id={`${uid}-m3`}
                type="range"
                min={MIN_ORDER_M3}
                max={SINGLE_TRIP_MAX_M3}
                step={1}
                value={m3}
                onChange={(e) => {
                  movedByUser.current = true;
                  setM3(Number(e.target.value));
                }}
                aria-valuetext={`${m3} köbméter`}
                aria-describedby={`${uid}-m3-info`}
                className="qty-slider flex-1"
              />
              <button
                type="button"
                className="qty-step"
                aria-label="Egy köbméterrel több"
                disabled={m3 >= SINGLE_TRIP_MAX_M3}
                onClick={() => {
                  movedByUser.current = true;
                  setM3((v) => Math.min(SINGLE_TRIP_MAX_M3, v + 1));
                }}
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>

            <div aria-hidden="true" className="num mt-1 flex justify-between text-xs text-text-muted">
              <span>{MIN_ORDER_M3} m³</span>
              <span>{SINGLE_TRIP_MAX_M3} m³</span>
            </div>

            {/* A díjsávok láthatóan, az árazás logikájával egyezően */}
            <ul aria-hidden="true" className="num mt-3 grid grid-cols-4 gap-1 text-[0.6875rem]">
              {[
                { label: "≤ 2", hit: m3 <= 2 },
                { label: "2–5", hit: m3 > 2 && m3 <= 5 },
                { label: "5–7", hit: m3 > 5 && m3 <= 7 },
                { label: "7–10", hit: m3 > 7 },
              ].map((b) => (
                <li
                  key={b.label}
                  data-hit={b.hit}
                  className="band-pip rounded-sm px-1.5 py-1 text-center font-semibold"
                >
                  {b.label} m³
                </li>
              ))}
            </ul>

            <p id={`${uid}-m3-info`} className="mt-3 text-sm leading-relaxed text-text-muted">
              Minimum rendelés {MIN_ORDER_M3} m³. Egy fuvarban legfeljebb{" "}
              <strong className="font-semibold text-text">{SINGLE_TRIP_MAX_M3} m³</strong>{" "}
              szállítható — a fuvardíj sávja ez alapján dől el.
            </p>

            <label className="over-limit mt-4">
              <input
                type="checkbox"
                checked={overLimit}
                onChange={(e) => {
                  movedByUser.current = true;
                  setOverLimit(e.target.checked);
                }}
              />
              <span>
                <strong className="font-semibold">Több mint {SINGLE_TRIP_MAX_M3} m³ kell.</strong>{" "}
                {MULTI_TRIP_NOTICE} Nagyobb mennyiség több fuvarban szállítható; a többfuvaros
                díjat egyeztetés után adjuk.
              </span>
            </label>
          </div>

          <StepNav
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            nextLabel="Tovább: szállítási cím"
          />
        </StepPanel>

        {/* ── 3. Cím ── */}
        <StepPanel
          index={3}
          active={step === 3}
          title="Hová szállítsunk?"
          summary={visited[3] && postalCode ? `${postalCode}${address.trim() ? ` · ${address.trim()}` : ""}` : undefined}
          onEdit={() => goToStep(3)}
          headingRef={(el) => {
            stepHeadingRefs.current[3] = el;
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-text-muted">Település</legend>
            <div className="seg mt-2.5">
              {municipalities.map((mm) => (
                <button
                  key={mm.id}
                  type="button"
                  aria-pressed={municipalityId === mm.id}
                  data-active={municipalityId === mm.id}
                  onClick={() => {
                    movedByUser.current = true;
                    setMunicipalityId(mm.id);
                    setDistrictId(mm.id === "budapest" ? 22 : null);
                    setCastleAnswer("");
                  }}
                  className="seg-btn"
                >
                  {mm.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Más településre is szállítunk, de ahhoz egyedi szállítási egyeztetés
              szükséges — kérjük, hívjon minket.
            </p>
          </fieldset>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {municipalityId === "budapest" && (
              <div>
                <label htmlFor={`${uid}-kerulet`} className="block text-sm font-semibold">
                  Kerület{" "}
                  <span aria-hidden="true" className="text-accent-deep">
                    *
                  </span>
                </label>
                <select
                  id={`${uid}-kerulet`}
                  value={districtId ?? ""}
                  onChange={(e) => {
                    movedByUser.current = true;
                    setDistrictId(e.target.value ? Number(e.target.value) : null);
                    setCastleAnswer("");
                  }}
                  className={field}
                >
                  <option value="">Válasszon kerületet…</option>
                  {budapestDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                  A kerület kiválasztása nem helyettesíti az irányítószámot — azt külön,
                  kötelezően kérjük.
                </p>
              </div>
            )}

            <div>
              <label htmlFor={`${uid}-isz`} className="block text-sm font-semibold">
                Irányítószám{" "}
                <span aria-hidden="true" className="text-accent-deep">
                  *
                </span>
              </label>
              <input
                id={`${uid}-isz`}
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={4}
                placeholder="1221"
                value={postalCode}
                onChange={(e) => {
                  movedByUser.current = true;
                  setPostalCode(normalizePostalCode(e.target.value));
                }}
                onBlur={() => {
                  setPostalTouched(true);
                  setTouched((t) => ({ ...t, postalCode: true }));
                }}
                aria-invalid={postalTouched && !postalValid}
                aria-describedby={`${uid}-isz-info`}
                className={`num ${postalTouched && !postalValid ? fieldErr : field}`}
              />
              <p id={`${uid}-isz-info`} className="mt-1.5 text-xs leading-relaxed text-text-muted">
                {selectedCodeSets.length
                  ? `Érvényes kódok: ${selectedCodeSets.join(" · ")}`
                  : "Négy számjegy, a szállítási cím irányítószáma."}
              </p>
              {postalTouched && !postalValid && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                  Az irányítószám négy számjegy (például 1221).
                </p>
              )}
              {municipalityId === "budapest" && districtId === 11 && (
                <p className="mt-1.5 rounded-sm bg-surface-muted px-2.5 py-2 text-xs leading-relaxed">
                  A XI. kerületben az <strong className="num font-semibold">1112</strong> és{" "}
                  <strong className="num font-semibold">1118</strong> irányítószám eltérő
                  díjprofilba tartozik, mint a kerület többi kódja.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor={`${uid}-cim`} className="block text-sm font-semibold">
              Szállítási cím{" "}
              <span aria-hidden="true" className="text-accent-deep">
                *
              </span>
            </label>
            <input
              id={`${uid}-cim`}
              type="text"
              autoComplete="street-address"
              placeholder="Utca, házszám"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              aria-invalid={err("address", addressValid)}
              aria-describedby={err("address", addressValid) ? `${uid}-cim-hiba` : undefined}
              className={err("address", addressValid) ? fieldErr : field}
            />
            {err("address", addressValid) && (
              <p id={`${uid}-cim-hiba`} role="alert" className="mt-1 text-xs font-medium text-red-700">
                Kérjük, adja meg a szállítási címet (utca, házszám).
              </p>
            )}
          </div>

          {/* ── Behajtási engedély ── */}
          <div className="permit mt-5">
            <p className="text-sm leading-relaxed">{PERMIT_NOTICE}</p>

            {isCastleDistrict && (
              <fieldset className="mt-4 border-t border-border-strong pt-4">
                <legend className="font-display text-[1.0625rem] font-bold">
                  {CASTLE_QUESTION}
                </legend>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Ezt irányítószám alapján nem tudjuk eldönteni, ezért rákérdezünk.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["igen", "Igen"],
                      ["nem", "Nem"],
                      ["nem-tudom", "Nem tudom"],
                    ] as [CastleAnswer, string][]
                  ).map(([value, label]) => (
                    <label key={value} className="radio-pill" data-active={castleAnswer === value}>
                      <input
                        type="radio"
                        name={`${uid}-var`}
                        value={value}
                        checked={castleAnswer === value}
                        onChange={() => {
                          movedByUser.current = true;
                          setCastleAnswer(value);
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>

          <StepNav onBack={() => goToStep(2)} />

          <p className="mt-5 text-sm text-text-muted">
            Az árösszesítő jobbra (mobilon alább) frissül. Rendelési igényt az összesítő
            alatt küldhet.
          </p>
        </StepPanel>
      </div>

      {/* ═══════════════════ Összesítő + beküldés ═══════════════════ */}
      <section
        data-call-region="calculator_form"
        aria-labelledby="osszesito-cim"
        className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28 lg:col-span-5"
      >
        <QuoteReceipt item={item} quote={quote} overLimit={overLimit} />

        {restored && (
          <p className="text-xs text-text-muted">
            Korábban megkezdett számítás visszaállítva. A kapcsolati adatokat nem
            tároljuk az eszközén.
          </p>
        )}

        {/* ── Rendelési igény ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby={`${uid}-igeny-cim`}
          className="rounded-[var(--radius-lg)] border border-border-strong bg-surface p-5 md:p-6"
        >
          <h2 id={`${uid}-igeny-cim`} className="font-display text-heading-sm font-bold">
            Rendelési igény beküldése
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{ORDER_INTENT_NOTICE}</p>

          {!ORDER_ENDPOINT_CONFIGURED && (
            <div className="handoff-note mt-4">
              <p className="font-semibold">Az online beküldés ezen az oldalon még nem aktív.</p>
              <p className="mt-1">
                Töltse ki az adatokat, és a gomb a saját levelezőprogramjában nyit egy e-mailt
                az összesítővel a <span className="whitespace-nowrap">{company.email}</span> címre —
                az igény akkor érkezik meg, ha az e-mailt elküldi. Telefonon is leadhatja:{" "}
                <a href={`tel:${company.phone.raw}`} className="num font-semibold underline">
                  {company.phone.display}
                </a>
                .
              </p>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <Field
              id={`${uid}-nev`}
              label="Név"
              required
              value={name}
              onChange={setName}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              invalid={err("name", nameValid) || Boolean(serverErrors.name)}
              error={serverErrors.name ?? "Kérjük, adja meg a nevét (legalább 2 karakter)."}
              autoComplete="name"
            />
            <Field
              id={`${uid}-email`}
              label="E-mail"
              required
              type="email"
              inputMode="email"
              value={email}
              onChange={setEmail}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              invalid={err("email", emailValid) || Boolean(serverErrors.email)}
              error={serverErrors.email ?? "Kérjük, érvényes e-mail-címet adjon meg."}
              autoComplete="email"
              hint={`A rendelési igényt a ${company.email} címre küldjük; a válaszcím az Ön e-mail-címe lesz.`}
            />
            <Field
              id={`${uid}-tel`}
              label="Telefon"
              required
              type="tel"
              inputMode="tel"
              placeholder="+36 30 123 4567"
              value={phone}
              onChange={setPhone}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              invalid={err("phone", phoneValid) || Boolean(serverErrors.phone)}
              error={serverErrors.phone ?? "Kérjük, érvényes telefonszámot adjon meg."}
              autoComplete="tel"
              numeric
            />
            <Field
              id={`${uid}-datum`}
              label="Kívánt időpont"
              type="date"
              value={preferredDate}
              onChange={setPreferredDate}
              invalid={false}
              error=""
              hint="Nem kötelező — az időpontot egyeztetjük."
            />
            <div>
              <label htmlFor={`${uid}-megj`} className="block text-sm font-semibold">
                Megjegyzés
              </label>
              <textarea
                id={`${uid}-megj`}
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <label className="privacy mt-4">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              onBlur={() => setTouched((t) => ({ ...t, privacy: true }))}
              aria-invalid={err("privacy", privacy)}
            />
            <span className="text-sm leading-relaxed">
              Elolvastam és elfogadom az{" "}
              <Link href="/adatvedelem" className="link">
                adatkezelési tájékoztatót
              </Link>
              .{" "}
              <span aria-hidden="true" className="text-accent-deep">
                *
              </span>
            </span>
          </label>
          {err("privacy", privacy) && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-700">
              Az adatkezelési tájékoztató elfogadása szükséges.
            </p>
          )}

          {submitAttempts > 0 && !canSubmit && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              Kérjük, töltse ki a csillaggal jelölt mezőket, és adja meg az irányítószámot.
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-lg btn-primary mt-5 w-full">
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Küldés folyamatban…
              </>
            ) : (
              <>
                {ORDER_ENDPOINT_CONFIGURED ? ORDER_INTENT_CTA : `${ORDER_INTENT_CTA} e-mailben`}
                <IconArrowRight size={18} className="btn-icon btn-icon-move" />
              </>
            )}
          </button>

          <div aria-live="polite" aria-atomic="true" className="mt-4 empty:mt-0">
            {outcome && <Outcome outcome={outcome} />}
            {mailHandoff && !outcome && (
              <div className="outcome outcome-warn">
                <p className="font-semibold">Megnyitottuk a levelezőprogramját</p>
                <p className="mt-1">
                  Az összesítővel kitöltött e-mail akkor érkezik meg hozzánk, ha elküldi.
                  Ha nem nyílt meg semmi,{" "}
                  <a href={mailtoHref} className="font-semibold underline">
                    nyissa meg innen
                  </a>
                  , vagy hívjon:{" "}
                  <a href={`tel:${company.phone.raw}`} className="num font-semibold underline">
                    {company.phone.display}
                  </a>
                  .
                </p>
                <p className="mt-1.5">
                  Ez még <strong className="font-semibold">nem végleges megrendelés</strong>: a
                  részletek egyeztetése és visszaigazolásunk után válik véglegessé.
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-text-muted">
            A beküldés nem végleges megrendelés. Kérdés esetén hívjon:{" "}
            <a href={`tel:${company.phone.raw}`} className="num font-semibold">
              {company.phone.display}
            </a>{" "}
            ({company.hours.short}).
          </p>
        </form>
      </section>

      {/* Mobilon az összesítő a lépések alatt van: élő tájékoztató összeg +
          ugrás az összesítőhöz + hívás. (A globális mobilsáv itt rejtve.) */}
      <div className="calc-bar sm:hidden" data-call-region="calculator_bar">
        <div aria-live="polite" className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-text-muted">Tájékoztató összeg, bruttó</p>
          <p key={quote.totalGross ?? quote.totalBlockedReason ?? "x"} className="swap-in num truncate font-display text-[1.125rem] leading-tight font-bold">
            {quote.totalGross !== null
              ? formatFt(quote.totalGross)
              : quote.totalBlockedReason === "incomplete"
                ? "Irányítószám kell"
                : "Egyeztetés szükséges"}
          </p>
        </div>
        <button
          type="button"
          className="calc-bar-btn"
          onClick={() => {
            const el = document.getElementById("osszesito-cim");
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          }}
        >
          Összesítő
        </button>
        <a href={`tel:${company.phone.raw}`} className="calc-bar-call" aria-label={`Hívás: ${company.phone.display}`}>
          <IconPhone size={19} />
        </a>
      </div>
    </div>
  );
}

/* ──────────────────────────── Részkomponensek ──────────────────────────── */

const STEP_LABELS: Record<Step, string> = { 1: "Anyag", 2: "Mennyiség", 3: "Cím" };

function StepRail({
  step,
  visited,
  onJump,
}: {
  step: Step;
  visited: Record<Step, boolean>;
  onJump: (s: Step) => void;
}) {
  return (
    <nav aria-label="Kalkulátor lépései" className="step-rail">
      <ol>
        {([1, 2, 3] as Step[]).map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onJump(s)}
              aria-current={step === s ? "step" : undefined}
              data-state={step === s ? "current" : visited[s] ? "done" : "todo"}
              className="step-dot"
            >
              <span aria-hidden="true" className="step-num">
                {visited[s] && step !== s ? <IconCheck size={13} /> : s}
              </span>
              <span className="step-label">{STEP_LABELS[s]}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepPanel({
  index,
  active,
  title,
  headingRef,
  summary,
  onEdit,
  children,
}: {
  index: number;
  active: boolean;
  title: string;
  headingRef: (el: HTMLHeadingElement | null) => void;
  /** Összecsukott állapotban a már megadott választás (pl. „0–24 sóder”). */
  summary?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${index}-cim`}
      // A nem aktív lépés is a DOM-ban marad: a tartalom JS és animáció nélkül
      // is elérhető, csak az aktív lépés kap kiemelt felületet.
      className="step-panel"
      data-active={active}
    >
      <h2
        id={`step-${index}-cim`}
        ref={headingRef}
        tabIndex={-1}
        className="step-title font-display text-heading-md font-bold"
      >
        <span aria-hidden="true" className="num step-title-num">
          {index}
        </span>
        {title}
      </h2>
      {!active && summary && (
        <p className="step-summary">
          <span className="min-w-0">{summary}</span>
          {onEdit && (
            <button type="button" onClick={onEdit} className="step-edit">
              Módosítás<span className="sr-only">: {title}</span>
            </button>
          )}
        </p>
      )}
      <div className="step-body">{children}</div>
    </section>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  if (!onBack && !onNext) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {onNext && (
        <button type="button" onClick={onNext} className="btn btn-primary">
          {nextLabel ?? "Tovább"}
          <IconArrowRight size={17} className="btn-icon btn-icon-move" />
        </button>
      )}
      {onBack && (
        <button type="button" onClick={onBack} className="btn btn-outline">
          Vissza
        </button>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  invalid,
  error,
  required = false,
  type = "text",
  inputMode,
  placeholder,
  autoComplete,
  hint,
  numeric = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid: boolean;
  error: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  numeric?: boolean;
}) {
  const describedBy = [invalid && error ? `${id}-hiba` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-accent-deep">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={invalid}
        aria-describedby={describedBy || undefined}
        className={`${numeric ? "num " : ""}mt-1.5 w-full rounded-sm border bg-surface px-3.5 py-3 text-base transition-colors hover:border-text focus-visible:border-text ${
          invalid ? "border-red-700" : "border-border-strong"
        }`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-text-muted">
          {hint}
        </p>
      )}
      {invalid && error && (
        <p id={`${id}-hiba`} role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function Outcome({ outcome }: { outcome: SubmitOutcome }) {
  if (outcome.status === "sent") {
    return (
      <div
        data-call-region="order_intent_success"
        className={`outcome ${outcome.mock ? "outcome-mock" : "outcome-ok"}`}
      >
        <p className="font-semibold">
          {outcome.mock
            ? "MOCK MÓD — valódi e-mail NEM ment ki"
            : outcome.duplicate
              ? "Ezt az igényt már megkaptuk"
              : "Rendelési igény beérkezett"}
        </p>
        <p className="mt-1">{outcome.message}</p>
        {outcome.totalMismatch && (
          <p className="mt-1.5 font-medium">
            Megjegyzés: a szerveroldali, hiteles összeg eltér a képernyőn mutatottól —
            kollégánk az egyeztetésnél pontosítja.
          </p>
        )}
        <p className="mt-1.5">
          Ez még <strong className="font-semibold">nem végleges megrendelés</strong>: a
          részletek egyeztetése és visszaigazolásunk után válik véglegessé.
        </p>
      </div>
    );
  }

  const tone = outcome.status === "rate-limited" ? "outcome-warn" : "outcome-error";
  return (
    <div role="alert" className={`outcome ${tone}`} data-call-region="order_intent_error">
      <p className="font-semibold">
        {outcome.status === "timeout"
          ? "A beküldés időtúllépéssel leállt"
          : outcome.status === "rate-limited"
            ? "Túl sok beküldés"
            : outcome.status === "invalid"
              ? "Ellenőrizze az adatokat"
              : outcome.status === "not-configured"
                ? "A beküldés nincs konfigurálva"
                : "A beküldés nem sikerült"}
      </p>
      <p className="mt-1">{outcome.message}</p>
      <a
        href={`tel:${company.phone.raw}`}
        className="num mt-2 inline-flex items-center gap-2 font-semibold underline"
      >
        <IconPhone size={15} />
        {company.phone.display}
      </a>
    </div>
  );
}
