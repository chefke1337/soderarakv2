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
  itemWash,
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
  romanDistrict,
  SINGLE_TRIP_MAX_M3,
  type CastleAnswer,
  type MunicipalityId,
  groupWashed,
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
import { WashBadge } from "@/components/MaterialLedger";
import { trackQuoteRequest, sendArkalkulatorSubmit } from "@/lib/analytics";

/* ──────────────────── Piszkozat (CSAK a számítás, nem a kapcsolat) ──────────────────── */

// v4 (2026-11-02): új kulcs — a korábbi, 8 m³-es alapállapotú piszkozatok így
// nem töltődnek vissza észrevétlenül.
const DRAFT_KEY = "arkalkulator-draft-v4";
const LEGACY_DRAFT_KEYS = ["arkalkulator-draft-v3"];

/** Új, paraméter nélküli kalkuláció és visszaállítás alapértéke (ügyfél, 2026-11-02). */
export const DEFAULT_M3 = MIN_ORDER_M3;

type Draft = {
  itemSlug: string;
  m3: number;
  municipalityId: MunicipalityId | "";
  districtId: number | null;
  postalCode: string;
};

function loadDraft(): Partial<Draft> | null {
  try {
    for (const k of LEGACY_DRAFT_KEYS) window.localStorage.removeItem(k);
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

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // nem kritikus
  }
}

/* ──────────────────────────────── Komponens ──────────────────────────────── */

type Step = 1 | 2 | 3 | 4 | 5;
const STEPS: Step[] = [1, 2, 3, 4, 5];
const STEP_LABELS: Record<Step, string> = {
  1: "Anyag",
  2: "Mennyiség",
  3: "Cím",
  4: "Összesítés",
  5: "Adatok",
};
const NO_VISITS: Record<Step, boolean> = { 1: true, 2: false, 3: false, 4: false, 5: false };

/**
 * Árkalkulátor — valódi, egyszerre EGY lépéses folyamat (ügyfél, 2026-11-02):
 *  1. anyag → 2. mennyiség (alap 1 m³) → 3. szállítási cím → [Tovább] →
 *  4. összesítés → [Megrendelem] → 5. személyes adatok és beküldés.
 *
 * Mindig CSAK az aktuális lépés van a DOM-ban: a jövőbeli lépések nem
 * látszanak, nem fókuszálhatók, és a lépésjelzőből sem érhetők el, amíg az
 * előző lépések kötelező adatai hiányoznak. Az állapot a komponensben él,
 * így előre- és visszalépéskor minden választás megmarad.
 */
export default function ArkalkulatorForm() {
  /* ── Számítás állapota ── */
  const [groupSlug, setGroupSlug] = useState("soder");
  const [itemSlug, setItemSlug] = useState("");
  const [m3, setM3] = useState(DEFAULT_M3);
  const [overLimit, setOverLimit] = useState(false);
  const [municipalityId, setMunicipalityId] = useState<MunicipalityId | "">("budapest");
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [castleAnswer, setCastleAnswer] = useState<CastleAnswer>("");

  /* ── Lépések ── */
  const [step, setStep] = useState<Step>(1);
  const [visited, setVisited] = useState<Record<Step, boolean>>(NO_VISITS);
  const [stepTried, setStepTried] = useState<Record<number, boolean>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedByUser = useRef(false);

  /* ── Kapcsolat / beküldés ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [note, setNote] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const idemKey = useRef<string>("");
  const inFlight = useRef(false);
  const uid = useId();
  const ids = {
    variants: `${uid}-variants`,
    district: `${uid}-kerulet`,
    postal: `${uid}-isz`,
    address: `${uid}-cim`,
    castle: `${uid}-var`,
    name: `${uid}-nev`,
    email: `${uid}-email`,
    phone: `${uid}-tel`,
    privacy: `${uid}-adatkezeles`,
  };

  /* ── Piszkozat visszaállítása (csak kliensen, SSR-barát) ── */
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const d = loadDraft();
    let any = false;
    if (d) {
      const resolved = resolveItemSlug(d.itemSlug);
      if (resolved) {
        setItemSlug(resolved);
        const g = materialGroups.find((x) => x.items.some((i) => i.slug === resolved));
        if (g) setGroupSlug(g.slug);
        any = true;
      }
      if (
        typeof d.m3 === "number" &&
        Number.isInteger(d.m3) &&
        d.m3 >= MIN_ORDER_M3 &&
        d.m3 <= SINGLE_TRIP_MAX_M3
      ) {
        setM3(d.m3);
        if (d.m3 !== DEFAULT_M3) any = true;
      }
      if (d.municipalityId && municipalities.some((mm) => mm.id === d.municipalityId)) {
        setMunicipalityId(d.municipalityId);
        if (d.municipalityId !== "budapest") setDistrictId(null);
      }
      if (typeof d.districtId === "number" && budapestDistricts.some((x) => x.id === d.districtId)) {
        setDistrictId(d.districtId);
        any = true;
      }
      if (typeof d.postalCode === "string" && isPostalCodeShape(d.postalCode)) {
        setPostalCode(normalizePostalCode(d.postalCode));
        any = true;
      }
    }

    /* Szándékos előválasztó link (dokumentált): ?anyag=<tétel-slug>, ?m3=<1–10>,
       ?irsz=<irányítószám>. Az URL felülírja a piszkozatot. */
    try {
      const params = new URLSearchParams(window.location.search);
      const wanted = resolveItemSlug(params.get("anyag"));
      if (wanted) {
        setItemSlug(wanted);
        const g = materialGroups.find((x) => x.items.some((i) => i.slug === wanted));
        if (g) setGroupSlug(g.slug);
      }
      const m3Param = Number(params.get("m3"));
      if (params.has("m3") && Number.isInteger(m3Param) && m3Param >= MIN_ORDER_M3 && m3Param <= SINGLE_TRIP_MAX_M3) {
        setM3(m3Param);
      }
      const zip = normalizePostalCode(params.get("irsz") ?? "");
      const profile = isPostalCodeShape(zip) ? findProfileByPostalCode(zip) : undefined;
      if (profile) {
        setMunicipalityId(profile.municipalityId);
        setDistrictId(profile.municipalityId === "budapest" ? (profile.districtId ?? null) : null);
        setPostalCode(zip);
      }
    } catch {
      // érvénytelen URL: marad az alapértelmezett / visszaállított állapot
    }
    setRestored(any);
  }, []);

  const group = materialGroups.find((g) => g.slug === groupSlug) ?? materialGroups[0]!;
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

  /* ── Lépésenkénti érvényesség ── */
  const itemValid = Boolean(item) && group.items.some((i) => i.slug === itemSlug);
  const districtValid = municipalityId !== "" && (municipalityId !== "budapest" || districtId !== null);
  const postalValid = isPostalCodeShape(postalCode);
  const postalMismatch = quote.freightResult.kind === "mismatch";
  const addressValid = address.trim().length >= 4;
  const castleValid = !isCastleDistrict || castleAnswer !== "";
  const addressStepValid = districtValid && postalValid && !postalMismatch && addressValid && castleValid;
  const stepValid: Record<Step, boolean> = {
    1: itemValid,
    2: m3 >= MIN_ORDER_M3 && m3 <= SINGLE_TRIP_MAX_M3,
    3: addressStepValid,
    4: true,
    5: true,
  };
  /** Egy lépés akkor érhető el, ha már járt ott, és MINDEN előző lépés érvényes. */
  const reachable = (s: Step) => visited[s] && STEPS.filter((x) => x < s).every((x) => stepValid[x]);

  /* Ha egy korábbi lépés érvénytelenné válik (pl. anyagváltás), a későbbi
     lépésen maradás a kötelező adatok megkerülése volna → visszalépünk. */
  useEffect(() => {
    const firstInvalid = STEPS.find((x) => x < step && !stepValid[x]);
    if (firstInvalid) setStep(firstInvalid);
  });

  /* ── Mikro-konverzió: első teljes összegzés SAJÁT módosítás után ── */
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current || !movedByUser.current || step < 4) return;
    if (quote.freightResult.kind !== "ok" || !item) return;
    reported.current = true;
    sendArkalkulatorSubmit({
      material: item.slug,
      m3,
      settlement: postalCode,
      zone: quote.freightResult.profile.id,
    });
  }, [quote, item, m3, postalCode, step]);

  /* ── Lépésváltás: fókusz + görgetés a lépés elejére (sticky header-rel) ── */
  // A fókuszt a DOM-commit UTÁN állítjuk: a lépésváltás lecseréli a panelt
  // (benne a megnyomott gombbal), a böngésző ilyenkor a <body>-ra ejtheti a fókuszt.
  const pendingFocus = useRef<string | null>(null);
  const goToStep = useCallback((next: Step) => {
    movedByUser.current = true;
    pendingFocus.current = "heading";
    setStep(next);
    setVisited((v) => ({ ...v, [next]: true }));
  }, []);

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    if (root) {
      // Csak akkor görgetünk, ha a lépés teteje nincs a látható sávban.
      const top = root.getBoundingClientRect().top;
      const headerOffset = parseFloat(getComputedStyle(root).scrollMarginTop) || 0;
      if (top < headerOffset - 4 || top > window.innerHeight * 0.45) {
        root.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const focusField = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "auto" });
    el.focus({ preventScroll: true });
  };

  function tryNext(from: Step) {
    setStepTried((t) => ({ ...t, [from]: true }));
    if (from === 1 && !itemValid) {
      const first = document.querySelector<HTMLInputElement>(`#${CSS.escape(ids.variants)} input`);
      first?.focus();
      return;
    }
    if (from === 3 && !addressStepValid) {
      setTouched((t) => ({ ...t, postalCode: true, address: true }));
      if (!districtValid) return focusField(ids.district);
      if (!postalValid || postalMismatch) return focusField(ids.postal);
      if (!addressValid) return focusField(ids.address);
      if (!castleValid) {
        const radio = document.querySelector<HTMLInputElement>(`input[name="${CSS.escape(ids.castle)}"]`);
        radio?.focus();
        return;
      }
      return;
    }
    goToStep((from + 1) as Step);
  }

  /* ── Teljes visszaállítás: új kalkuláció ── */
  function resetAll() {
    clearDraft();
    try {
      const url = new URL(window.location.href);
      if (url.search) {
        url.search = "";
        window.history.replaceState(null, "", url.toString());
      }
    } catch {
      // nem kritikus
    }
    setGroupSlug("soder");
    setItemSlug("");
    setM3(DEFAULT_M3);
    setOverLimit(false);
    setMunicipalityId("budapest");
    setDistrictId(null);
    setPostalCode("");
    setAddress("");
    setCastleAnswer("");
    setName("");
    setEmail("");
    setPhone("");
    setPreferredDate("");
    setNote("");
    setPrivacy(false);
    setHoneypot("");
    setTouched({});
    setStepTried({});
    setSubmitAttempts(0);
    setOutcome(null);
    setServerErrors({});
    setRestored(false);
    idemKey.current = "";
    setVisited(NO_VISITS);
    pendingFocus.current = "heading";
    setStep(1);
  }

  /* ── Kapcsolati adatok validációja ── */
  const nameValid = name.trim().length >= 2;
  const emailValid = isValidEmail(email);
  const phoneValid = isValidPhone(phone);
  const contactValid = nameValid && emailValid && phoneValid && privacy;
  const err = (field: string, ok: boolean) => (touched[field] || submitAttempts > 0) && !ok;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempts((n) => n + 1);
    setTouched((t) => ({ ...t, name: true, email: true, phone: true, privacy: true }));
    setServerErrors({});
    if (!contactValid) {
      if (!nameValid) return focusField(ids.name);
      if (!emailValid) return focusField(ids.email);
      if (!phoneValid) return focusField(ids.phone);
      return focusField(ids.privacy);
    }
    // Biztonsági háló: a cím-lépés adatai nélkül nincs beküldés.
    if (!itemValid || !addressStepValid) {
      goToStep(itemValid ? 3 : 1);
      return;
    }
    if (submitting || inFlight.current) return;

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
      // A 10 m³ feletti igényt a levélben is jelezzük (a mennyiség mező 1–10 m³).
      note: (overLimit
        ? `[Több mint ${SINGLE_TRIP_MAX_M3} m³ szükséges — többfuvaros egyeztetés kell.]\n${note.trim()}`
        : note.trim()
      ).slice(0, 2000),
      website: honeypot,
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
        .flatMap((p) => [...p.postalCodes]);
    }
    if (municipalityId === "erd") {
      return freightProfiles.filter((p) => p.id === "erd").flatMap((p) => [...p.postalCodes]);
    }
    return [];
  }, [municipalityId, districtId]);

  const placeLabel =
    municipalityId === "budapest"
      ? `Budapest${districtId ? ` ${romanDistrict(districtId)} kerület` : ""}`
      : municipalities.find((mm) => mm.id === municipalityId)?.name ?? "";
  const addressLine = `${postalCode} ${placeLabel}, ${address.trim()}`;

  const postalErr = (touched.postalCode || stepTried[3]) && (!postalValid || postalMismatch);
  const addressErr = (touched.address || stepTried[3]) && !addressValid;
  const districtErr = stepTried[3] && !districtValid;
  const castleErr = stepTried[3] && !castleValid;
  const serverAddressError = ["postalCode", "address", "districtId", "municipalityId", "castleAnswer", "materialSlug", "m3"].some(
    (k) => serverErrors[k],
  );

  return (
    <div ref={rootRef} className="calc-flow mx-auto max-w-3xl scroll-mt-28">
      <StepRail step={step} reachable={reachable} visited={visited} onJump={goToStep} />

      {restored && step === 1 && (
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
          <span>Korábban megkezdett számítás visszaállítva.</span>
          <button type="button" onClick={resetAll} className="link inline-flex min-h-11 items-center font-semibold">
            Új kalkuláció
          </button>
        </p>
      )}

      {/* ═══════════ 1. Anyag ═══════════ */}
      {step === 1 && (
        <StepPanel index={1} title="Melyik anyagra van szüksége?" headingRef={headingRef}>
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
                    // A korábbi frakció másik csoportban nem érvényes → új választás kell.
                    if (!g.items.some((i) => i.slug === itemSlug)) setItemSlug("");
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

          {groupWashed(group)?.scope === "some" && (
            <p className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-petrol-soft/50 px-3 py-1.5 text-xs font-semibold text-petrol-deep">
              <IconDroplets size={14} />
              {groupWashed(group)!.summary}
            </p>
          )}

          <fieldset
            id={ids.variants}
            className="mt-4"
            aria-describedby={stepTried[1] && !itemValid ? `${uid}-variant-hiba` : undefined}
          >
            <legend className="text-sm font-semibold text-text-muted">
              Termékváltozat — bruttó Ft/m³{" "}
              <span aria-hidden="true" className="text-accent-deep">
                *
              </span>
            </legend>
            {stepTried[1] && !itemValid && (
              <p id={`${uid}-variant-hiba`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                Kérjük, válasszon termékváltozatot.
              </p>
            )}
            <ul className="mt-2.5 space-y-2">
              {group.items.map((i) => {
                const selected = i.slug === itemSlug;
                const w = itemWash(i);
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
                          <WashBadge item={i} />
                          {i.unclassified && i.qualifier !== "osztályozatlan" && <span className="badge-plain">osztályozatlan</span>}
                        </span>
                        <span className="mt-1 block text-sm leading-snug text-text-muted">{i.use}</span>
                        {w && w.kind !== "washed" && (
                          <span className="mt-1 block text-sm leading-snug font-medium text-text">
                            {w.detail}
                          </span>
                        )}
                        {i.fraction && (
                          <span className="mt-2 block max-w-[16rem]">
                            <FractionScale fraction={i.fraction} />
                            <span className="num mt-1 block text-xs text-text-muted">{i.fraction}</span>
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

          <StepNav onNext={() => tryNext(1)} nextLabel="Tovább: mennyiség" />
        </StepPanel>
      )}

      {/* ═══════════ 2. Mennyiség ═══════════ */}
      {step === 2 && (
        <StepPanel index={2} title="Mennyi anyagra van szüksége?" headingRef={headingRef}>
          {item && (
            <p className="mb-4 text-sm text-text-muted">
              Kiválasztva: <strong className="font-semibold text-text">{group.name} — {item.name}</strong>
            </p>
          )}
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

            <p id={`${uid}-m3-info`} className="mt-3 text-sm leading-relaxed text-text-muted">
              Minimum rendelés {MIN_ORDER_M3} m³. Egy fuvarban legfeljebb{" "}
              <strong className="font-semibold text-text">{SINGLE_TRIP_MAX_M3} m³</strong>{" "}
              szállítható.
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

          <StepNav onBack={() => goToStep(1)} onNext={() => tryNext(2)} nextLabel="Tovább: szállítási cím" />
        </StepPanel>
      )}

      {/* ═══════════ 3. Szállítási cím ═══════════ */}
      {step === 3 && (
        <StepPanel index={3} title="Hová szállítsunk?" headingRef={headingRef}>
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
                    if (municipalityId !== mm.id) {
                      setMunicipalityId(mm.id);
                      setDistrictId(null);
                      setCastleAnswer("");
                    }
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
                <label htmlFor={ids.district} className="block text-sm font-semibold">
                  Kerület{" "}
                  <span aria-hidden="true" className="text-accent-deep">
                    *
                  </span>
                </label>
                <select
                  id={ids.district}
                  value={districtId ?? ""}
                  onChange={(e) => {
                    movedByUser.current = true;
                    setDistrictId(e.target.value ? Number(e.target.value) : null);
                    setCastleAnswer("");
                  }}
                  aria-invalid={districtErr}
                  aria-describedby={districtErr ? `${ids.district}-hiba` : undefined}
                  className={districtErr ? fieldErr : field}
                >
                  <option value="">Válasszon kerületet…</option>
                  {budapestDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {districtErr && (
                  <p id={`${ids.district}-hiba`} role="alert" className="mt-1 text-xs font-medium text-red-700">
                    Kérjük, válassza ki a kerületet.
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor={ids.postal} className="block text-sm font-semibold">
                Irányítószám{" "}
                <span aria-hidden="true" className="text-accent-deep">
                  *
                </span>
              </label>
              <input
                id={ids.postal}
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
                onBlur={() => setTouched((t) => ({ ...t, postalCode: true }))}
                aria-invalid={postalErr}
                aria-describedby={`${ids.postal}-info${postalErr ? ` ${ids.postal}-hiba` : ""}`}
                className={`num ${postalErr ? fieldErr : field}`}
              />
              <p id={`${ids.postal}-info`} className="mt-1.5 text-xs leading-relaxed text-text-muted">
                {selectedCodeSets.length
                  ? `Érvényes kódok: ${selectedCodeSets.join(", ")}`
                  : "Négy számjegy, a szállítási cím irányítószáma."}
              </p>
              {postalErr && (
                <p id={`${ids.postal}-hiba`} role="alert" className="mt-1 text-xs font-medium text-red-700">
                  {!postalValid
                    ? "Az irányítószám négy számjegy (például 1221)."
                    : "Ez az irányítószám nem a kiválasztott településhez vagy kerülethez tartozik — kérjük, javítsa."}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor={ids.address} className="block text-sm font-semibold">
              Utca, házszám{" "}
              <span aria-hidden="true" className="text-accent-deep">
                *
              </span>
            </label>
            <input
              id={ids.address}
              type="text"
              autoComplete="street-address"
              placeholder="Utca, házszám"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              aria-invalid={addressErr}
              aria-describedby={addressErr ? `${ids.address}-hiba` : undefined}
              className={addressErr ? fieldErr : field}
            />
            {addressErr && (
              <p id={`${ids.address}-hiba`} role="alert" className="mt-1 text-xs font-medium text-red-700">
                Kérjük, adja meg a szállítási címet (utca, házszám).
              </p>
            )}
          </div>

          {/* ── Behajtási engedély ── */}
          <div className="permit mt-5">
            <p className="text-sm leading-relaxed">{PERMIT_NOTICE}</p>

            {isCastleDistrict && (
              <fieldset
                className="mt-4 border-t border-border-strong pt-4"
                aria-describedby={castleErr ? `${ids.castle}-hiba` : undefined}
              >
                <legend className="font-display text-[1.0625rem] font-bold">
                  {CASTLE_QUESTION}{" "}
                  <span aria-hidden="true" className="text-accent-deep">
                    *
                  </span>
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
                        name={ids.castle}
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
                {castleErr && (
                  <p id={`${ids.castle}-hiba`} role="alert" className="mt-2 text-xs font-medium text-red-700">
                    Kérjük, válaszoljon (a „Nem tudom” is megfelelő).
                  </p>
                )}
              </fieldset>
            )}
          </div>

          <StepNav onBack={() => goToStep(2)} onNext={() => tryNext(3)} nextLabel="Tovább: összesítés" />
        </StepPanel>
      )}

      {/* ═══════════ 4. Összesítés ═══════════ */}
      {step === 4 && (
        <StepPanel index={4} title="Összesítés" headingRef={headingRef}>
          <dl className="summary-list">
            <SummaryRow label="Anyag" value={item ? `${group.name} — ${item.name}` : "—"} onEdit={() => goToStep(1)} />
            <SummaryRow
              label="Mennyiség"
              value={overLimit ? `${SINGLE_TRIP_MAX_M3} m³ felett (többfuvaros egyeztetés)` : `${m3} m³`}
              onEdit={() => goToStep(2)}
            />
            <SummaryRow label="Szállítási cím" value={addressLine} onEdit={() => goToStep(3)} />
            {isCastleDistrict && (
              <SummaryRow
                label="Vár területe"
                value={castleAnswer === "igen" ? "Igen" : castleAnswer === "nem" ? "Nem" : "Nem tudom"}
                onEdit={() => goToStep(3)}
              />
            )}
          </dl>

          <div className="mt-5" aria-labelledby="osszesito-cim" role="group">
            <QuoteReceipt item={item} quote={quote} overLimit={overLimit} />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-text-muted">{ORDER_INTENT_NOTICE}</p>

          <div className="step-nav">
            <button type="button" onClick={() => goToStep(5)} className="btn btn-lg btn-primary">
              Megrendelem
              <IconArrowRight size={18} className="btn-icon btn-icon-move" />
            </button>
            <button type="button" onClick={() => goToStep(3)} className="btn btn-outline">
              Vissza / Adatok módosítása
            </button>
          </div>
        </StepPanel>
      )}

      {/* ═══════════ 5. Személyes adatok és beküldés ═══════════ */}
      {step === 5 && (
        <StepPanel index={5} title="Kapcsolattartási adatok" headingRef={headingRef}>
          {/* Kompakt rendelési emlékeztető */}
          <div className="order-reminder" data-call-region="calculator_form">
            <p className="text-xs font-bold tracking-[0.14em] text-text-muted uppercase">Az Ön rendelése</p>
            <p className="mt-1 font-semibold">
              {item ? `${group.name} — ${item.name}` : "—"} ·{" "}
              <span className="num">{overLimit ? `${SINGLE_TRIP_MAX_M3} m³ felett` : `${m3} m³`}</span>
            </p>
            <p className="num mt-0.5 text-sm text-text-muted">{addressLine}</p>
            <p className="mt-2 text-sm">
              Teljes bruttó tájékoztató összeg:{" "}
              <strong className="num font-display text-[1.0625rem] font-bold text-accent-deep">
                {quote.totalGross !== null ? formatFt(quote.totalGross) : "egyeztetés után"}
              </strong>
            </p>
            <button type="button" onClick={() => goToStep(4)} className="link mt-1 inline-flex min-h-11 items-center text-sm font-semibold">
              Vissza az összesítéshez
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-labelledby="step-5-cim" className="mt-5">
            {/* Spam-csapda: képernyőn és felolvasóban sem jelenik meg. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={`${uid}-web`}>Weboldal (hagyja üresen)</label>
              <input
                id={`${uid}-web`}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            <p className="text-sm leading-relaxed text-text-muted">{ORDER_INTENT_NOTICE}</p>

            {!ORDER_ENDPOINT_CONFIGURED && (
              <p className="mock-banner mt-3">
                <strong className="font-semibold">A beküldés nincs konfigurálva.</strong> Ebben a
                környezetben nincs beállítva beküldési végpont, ezért a küldés nem fog
                megtörténni. Kérjük, hívjon minket:{" "}
                <a href={`tel:${company.phone.raw}`} className="num font-semibold whitespace-nowrap underline">
                  {company.phone.display}
                </a>
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  id={ids.name}
                  label="Név"
                  required
                  value={name}
                  onChange={setName}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  invalid={err("name", nameValid) || Boolean(serverErrors.name)}
                  error={serverErrors.name ?? "Kérjük, adja meg a nevét (legalább 2 karakter)."}
                  autoComplete="name"
                />
              </div>
              <Field
                id={ids.email}
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
                id={ids.phone}
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
              <div className="sm:col-span-2">
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
                id={ids.privacy}
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

            {serverAddressError && (
              <div role="alert" className="mt-3 text-sm font-medium text-red-700">
                <p>A rendelési adatokban hibát találtunk — kérjük, ellenőrizze az anyagot és a címet.</p>
                <button type="button" onClick={() => goToStep(3)} className="link mt-1 inline-flex min-h-11 items-center font-semibold">
                  Cím módosítása
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || outcome?.status === "sent"}
              className="btn btn-lg btn-primary mt-5 w-full"
            >
              {submitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Küldés folyamatban…
                </>
              ) : (
                <>
                  {ORDER_INTENT_CTA}
                  <IconArrowRight size={18} className="btn-icon btn-icon-move" />
                </>
              )}
            </button>

            <div aria-live="polite" aria-atomic="true" className="mt-4 empty:mt-0">
              {outcome && <Outcome outcome={outcome} />}
            </div>

            {outcome?.status === "sent" ? (
              <button type="button" onClick={resetAll} className="btn btn-outline mt-4">
                Új kalkuláció
              </button>
            ) : (
              <div className="mt-4">
                <button type="button" onClick={() => goToStep(4)} className="btn btn-outline">
                  Vissza
                </button>
              </div>
            )}

            <p className="mt-4 text-xs leading-relaxed text-text-muted">
              A beküldés nem végleges megrendelés. Kérdés esetén hívjon:{" "}
              <a href={`tel:${company.phone.raw}`} className="num font-semibold whitespace-nowrap">
                {company.phone.display}
              </a>{" "}
              ({company.hours.short}).
            </p>
          </form>
        </StepPanel>
      )}
    </div>
  );
}

/* ──────────────────────────── Részkomponensek ──────────────────────────── */

function StepRail({
  step,
  reachable,
  visited,
  onJump,
}: {
  step: Step;
  reachable: (s: Step) => boolean;
  visited: Record<Step, boolean>;
  onJump: (s: Step) => void;
}) {
  return (
    <nav aria-label="Kalkulátor lépései" className="step-rail">
      <ol>
        {STEPS.map((s) => {
          const current = step === s;
          const canJump = !current && reachable(s);
          const state = current ? "current" : visited[s] && reachable(s) ? "done" : "todo";
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onJump(s)}
                disabled={!canJump && !current}
                aria-current={current ? "step" : undefined}
                aria-label={`${s}. lépés: ${STEP_LABELS[s]}${state === "done" ? " (kész)" : ""}`}
                data-state={state}
                className="step-dot"
              >
                <span aria-hidden="true" className="step-num">
                  {state === "done" ? <IconCheck size={13} /> : s}
                </span>
                <span aria-hidden="true" className="step-label">
                  {STEP_LABELS[s]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepPanel({
  index,
  title,
  headingRef,
  children,
}: {
  index: Step;
  title: string;
  headingRef: React.Ref<HTMLHeadingElement>;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${index}-cim`} className="step-panel step-enter" data-active="true" data-step={index}>
      <h2
        id={`step-${index}-cim`}
        ref={headingRef}
        tabIndex={-1}
        className="step-title font-display text-heading-md font-bold"
      >
        <span aria-hidden="true" className="num step-title-num">
          {index}
        </span>
        <span>
          <span className="sr-only">
            {index}. lépés az 5-ből:{" "}
          </span>
          {title}
        </span>
      </h2>
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
  return (
    <div className="step-nav">
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

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="summary-row">
      <dt className="text-xs font-semibold text-text-muted">{label}</dt>
      <dd className="min-w-0 font-semibold">{value}</dd>
      <dd className="justify-self-end">
        <button type="button" onClick={onEdit} className="link inline-flex min-h-11 items-center text-sm font-semibold">
          Módosítás<span className="sr-only">: {label.toLowerCase()}</span>
        </button>
      </dd>
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
              : "Rendelési igényét továbbítottuk"}
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
