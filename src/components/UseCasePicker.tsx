"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { allMaterials, company, findMaterialGroup } from "@/content/site";
import { formatFt, IconArrowRight, minPrice } from "@/lib/ui";
import FractionScale from "@/components/FractionScale";

/**
 * „Mire kell?" választó — feladat → ajánlott anyagok.
 * A párosítások KIZÁRÓLAG a meglévő tartalomból jönnek (site.ts FAQ
 * „Melyik anyagot válasszam?" és „Milyen sóder kell térkő alá?" válasz,
 * illetve a tételek saját `use` leírása) — új szakmai állítás nincs.
 */
type Pick = { item: string } | { group: string; label?: string };

const USE_CASES: { id: string; label: string; note: string; picks: Pick[] }[] = [
  {
    id: "beton",
    label: "Alapozás, beton",
    note: "Alapozáshoz és betonhoz sódert ajánlunk.",
    picks: [{ item: "soder-0-8" }, { item: "soder-0-16" }, { item: "soder-0-24" }],
  },
  {
    id: "falazas",
    label: "Falazás",
    note: "Falazáshoz finomabb 0/4-es sódert vagy homokot.",
    picks: [{ item: "soder-0-4" }, { item: "homok-natur" }, { item: "homok-0-1" }],
  },
  {
    id: "terko",
    label: "Térkő alá",
    note: "Ágyazatnak 0/4–0/8-as sóder; alatta tömörített alaprétegnek 0/24-es sóder vagy 0–20-as murva.",
    picks: [{ item: "soder-0-4" }, { item: "soder-0-8" }, { item: "soder-0-24" }, { item: "murva-0-20" }],
  },
  {
    id: "kocsibeallo",
    label: "Kocsibeálló",
    note: "Kocsibeállóhoz murvát vagy kulékavicsot szoktunk ajánlani.",
    picks: [{ group: "murva", label: "Murva" }, { item: "kulekavics-16-32" }, { item: "kulekavics-24-40" }],
  },
  {
    id: "kert",
    label: "Kertdekoráció",
    note: "Kertdekorációhoz kavicsot és kerti murvát.",
    picks: [{ item: "kavics-4-8" }, { item: "kavics-8-16" }, { item: "kerti-murva-5-12" }, { item: "kerti-murva-12-20" }],
  },
  {
    id: "feltoltes",
    label: "Feltöltés",
    note: "Feltöltéshez natúr- vagy daráltföldet; utak, parkok feltöltésére töltősódert.",
    picks: [{ item: "naturfold" }, { item: "daraltfold" }, { item: "tolto-soder" }],
  },
];

function resolve(p: Pick) {
  if ("item" in p) {
    const m = allMaterials.find((i) => i.slug === p.item);
    if (!m) return null;
    return {
      key: m.slug,
      name: m.name,
      fraction: m.fraction,
      price: m.priceNet,
      from: false,
      href: `/arkalkulator?anyag=${m.slug}`,
      cta: "Számolás",
    };
  }
  const g = findMaterialGroup(p.group);
  if (!g) return null;
  return {
    key: g.slug,
    name: p.label ?? g.name,
    fraction: undefined,
    price: minPrice(g.items),
    from: true,
    href: `/anyagok/${g.slug}`,
    cta: "Fajták",
  };
}

export default function UseCasePicker() {
  const [active, setActive] = useState(USE_CASES[0].id);
  const base = useId();
  const current = USE_CASES.find((u) => u.id === active) ?? USE_CASES[0];
  const rows = current.picks.map(resolve).filter((r): r is NonNullable<ReturnType<typeof resolve>> => r !== null);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <fieldset className="lg:col-span-5">
        <legend className="mb-3 text-sm font-medium text-on-dark-muted">Mit épít vagy javít?</legend>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-t lg:border-on-dark/20">
          {USE_CASES.map((u) => {
            const id = `${base}-${u.id}`;
            const checked = u.id === active;
            return (
              <div key={u.id} className="lg:border-b lg:border-on-dark/20">
                <input
                  type="radio"
                  id={id}
                  name={`${base}-use`}
                  value={u.id}
                  checked={checked}
                  onChange={() => setActive(u.id)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-full border border-on-dark/35 px-4 text-[0.9375rem] font-medium text-on-dark transition-[background-color,color,border-color,padding] duration-200 hover:border-on-dark peer-checked:border-amber peer-checked:bg-amber peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber lg:rounded-none lg:border-0 lg:px-2 lg:py-3.5 lg:text-heading-sm lg:hover:bg-white/5 lg:peer-checked:bg-transparent lg:peer-checked:pl-4 lg:peer-checked:text-amber"
                >
                  <span className="lg:font-display lg:font-bold">{u.label}</span>
                  <span
                    aria-hidden="true"
                    className={`hidden transition-transform duration-300 lg:block ${checked ? "translate-x-0 text-amber" : "-translate-x-2 text-transparent"}`}
                  >
                    <IconArrowRight size={18} />
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="lg:col-span-7" aria-live="polite">
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface text-text shadow-[0_30px_60px_-34px_rgb(0_0_0_/_0.7)]">
          <p key={`n-${active}`} className="swap-in border-b border-dashed border-line-strong bg-surface-muted/60 px-5 py-4 text-[0.9375rem] leading-relaxed">
            <span className="font-semibold">{current.label}:</span> {current.note}
          </p>
          <ul key={`l-${active}`} className="swap-in divide-y divide-line">
            {rows.map((r) => (
              <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_8rem_auto_auto]">
                <span className="font-semibold">{r.name}</span>
                <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                  {r.fraction ? (
                    <>
                      <FractionScale fraction={r.fraction} />
                      <span className="num mt-1 block text-xs text-ink-soft">{r.fraction}</span>
                    </>
                  ) : (
                    <span className="text-xs text-ink-soft">több frakció</span>
                  )}
                </span>
                <span className="num text-right font-display font-bold">
                  {r.price !== null ? (
                    <>
                      {formatFt(r.price)}
                      {r.from && <span className="font-sans text-xs font-normal text-ink-soft">-tól</span>}
                    </>
                  ) : (
                    <span className="font-sans text-sm font-medium text-ink-soft">egyeztetés után</span>
                  )}
                </span>
                <Link
                  href={r.href}
                  className="col-span-2 inline-flex min-h-11 items-center gap-1 justify-self-start text-sm font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark sm:col-span-1 sm:justify-self-end"
                >
                  {r.cta}
                  <span className="sr-only">: {r.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3.5 text-sm text-ink-soft">
            Nettó Ft/m³, ÁFA és fuvar nélkül. Ha bizonytalan, hívjon:{" "}
            <a href={`tel:${company.phone.raw}`} className="num font-semibold text-brand-deep underline underline-offset-2">
              {company.phone.display}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
