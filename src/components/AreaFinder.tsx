"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  budapestDistricts,
  company,
  findProfileByPostalCode,
  freightProfiles,
  isPostalCodeShape,
  quoteOnlyAreas,
  ROMAN,
  romanDistrict,
  serviceAreas,
  UNSUPPORTED_NOTICE,
} from "@/content/site";
import { IconArrowRight, IconPhone } from "@/lib/ui";

/**
 * Kereshető területlista: kerület (római vagy arab számmal), kiemelt
 * terület neve (Budafok, Újbuda, Csepel…) és irányítószám szerint,
 * ékezetfüggetlenül. Csak jóváhagyott adatból dolgozik (freight.ts,
 * serviceAreas) — városrészt, határt vagy díjat nem talál ki.
 * Egy városrész-találat tájékoztató: a díjat mindig az irányítószám dönti el.
 */

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Egy kerületen belüli eltérő díjprofil (pl. XI. 1112, 1118) — az alap
 *  profil azonosítója „-alap" végű, ha a kerületnek több profilja van. */
function isSeparateProfile(p: { id: string; municipalityId: string; districtId?: number }): boolean {
  const siblings = freightProfiles.filter(
    (q) => q.municipalityId === p.municipalityId && q.districtId === p.districtId,
  );
  return siblings.length > 1 && !p.id.endsWith("-alap");
}

type DistrictEntry = {
  key: string;
  title: string;
  /** A kerülethez rendelt kiemelt területek nevei (pl. Újbuda, Albertfalva). */
  aliases: string[];
  /** Díjprofilonként csoportosított irányítószámok. */
  groups: { codes: readonly string[]; separate: boolean; split?: boolean }[];
  districtId: number | null;
};

const ENTRIES: DistrictEntry[] = [
  ...budapestDistricts.map((d) => {
    const profiles = freightProfiles.filter(
      (p) => p.municipalityId === "budapest" && p.districtId === d.id,
    );
    return {
      key: `bp-${d.id}`,
      title: `Budapest ${romanDistrict(d.id)} kerület`,
      aliases: serviceAreas
        .filter((a) => a.freight.kind === "profile" && a.freight.districtId === d.id)
        .map((a) => a.name.replace(/\s*\(Budapest [^)]*\)/, ""))
        .filter((n) => !/^Budapest /.test(n)),
      groups: profiles.map((p) => ({ codes: p.postalCodes, separate: isSeparateProfile(p), split: profiles.length > 1 })),
      districtId: d.id,
    };
  }),
  {
    key: "erd",
    title: "Érd",
    aliases: [],
    groups: freightProfiles
      .filter((p) => p.municipalityId === "erd")
      .map((p) => ({ codes: p.postalCodes, separate: false })),
    districtId: null,
  },
];

function matches(entry: DistrictEntry, q: string): boolean {
  if (!q) return true;
  const tokens = q.split(" ").filter((t) => t && t !== "kerulet" && t !== "ker" && t !== "budapest" && t !== "bp");
  if (!tokens.length) return entry.districtId !== null; // „budapest", „kerület" → minden kerület

  return tokens.every((t) => {
    if (/^\d+$/.test(t)) {
      if (t.length <= 2) return entry.districtId === Number(t);
      return entry.groups.some((g) => g.codes.some((c) => c.startsWith(t)));
    }
    const romanIdx = ROMAN.findIndex((r) => norm(r) === t);
    if (romanIdx >= 0) return entry.districtId === romanIdx + 1;
    // „Budapest" nélkül: különben minden „bud…" kezdetű keresés minden kerületet adna.
    const hay = norm([entry.title.replace(/^Budapest /, ""), ...entry.aliases].join(" "));
    return t.length >= 2 && hay.includes(t);
  });
}

export default function AreaFinder() {
  const [query, setQuery] = useState("");
  const uid = useId();
  const q = norm(query);
  const digits = query.replace(/\D/g, "");
  const exactZip = /^\s*\d{4}\s*$/.test(query) && isPostalCodeShape(digits) ? digits : "";
  const exactProfile = exactZip ? findProfileByPostalCode(exactZip) : undefined;

  const results = useMemo(() => ENTRIES.filter((e) => matches(e, q)), [q]);
  const quoteHits = useMemo(
    () => (q ? quoteOnlyAreas.filter((a) => norm(a.name).includes(q)) : quoteOnlyAreas),
    [q],
  );
  const total = results.length + (q ? quoteHits.length : 0);

  return (
    <div className="area-finder">
      <div className="area-search">
        <label htmlFor={`${uid}-q`} className="block font-display text-heading-xs font-bold">
          Keresés kerületre, területre vagy irányítószámra
        </label>
        <div className="area-search-field">
          <input
            id={`${uid}-q`}
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="pl. XI. kerület, Budafok, 1118"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={`${uid}-hint ${uid}-count`}
          />
          {query && (
            <button type="button" className="area-clear" onClick={() => setQuery("")}>
              Törlés
            </button>
          )}
        </div>
        <p id={`${uid}-hint`} className="mt-2 text-sm leading-relaxed text-text-muted">
          Ékezet nélkül is kereshet. Egy terület vagy kerület találata tájékoztató — a
          konkrét fuvardíjat mindig a szállítási cím irányítószáma határozza meg.
        </p>
        <p id={`${uid}-count`} aria-live="polite" className="sr-only">
          {q ? `${total} találat` : ""}
        </p>
      </div>

      {/* Pontos irányítószám: közvetlen válasz + kalkulátor */}
      {exactZip && (
        <div className={`area-zip-result ${exactProfile ? "" : "area-zip-unknown"}`} role="status">
          {exactProfile ? (
            <>
              <p className="num font-display text-heading-sm font-bold">
                {exactZip} — {exactProfile.municipalityId === "erd" ? "Érd" : `Budapest ${romanDistrict(exactProfile.districtId!)} kerület`}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Jóváhagyott, irányítószám-alapú fuvardíjunk van ide.
                {isSeparateProfile(exactProfile) &&
                  ` Ez az irányítószám a kerületen belül külön díjprofilba tartozik (${exactProfile.postalCodes.join(", ")}).`}
              </p>
              <Link href={`/arkalkulator/?irsz=${exactZip}`} className="btn btn-primary mt-3">
                Fuvardíj kiszámítása: {exactZip}
                <IconArrowRight size={17} className="btn-icon btn-icon-move" />
              </Link>
            </>
          ) : (
            <>
              <p className="num font-display text-heading-sm font-bold">
                {exactZip} — nincs jóváhagyott tarifa
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {UNSUPPORTED_NOTICE} Kérjük, hívjon, és megnézzük, tudunk-e szállítani.
              </p>
              <a href={`tel:${company.phone.raw}`} className="num btn btn-outline mt-3">
                <IconPhone size={17} className="btn-icon" />
                {company.phone.display}
              </a>
            </>
          )}
        </div>
      )}

      {/* Kerületek és Érd */}
      {results.length > 0 && (
        <ul className="area-list">
          {results.map((e) => (
            <li key={e.key}>
              <details className="area-row" open={Boolean(q) && results.length <= 3}>
                <summary>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.0625rem] font-bold">{e.title}</span>
                    {e.aliases.length > 0 && (
                      <span className="block text-sm text-text-muted">{e.aliases.join(" · ")}</span>
                    )}
                  </span>
                  <span className="num shrink-0 text-xs font-semibold text-text-muted">
                    {e.groups.reduce((n, g) => n + g.codes.length, 0)} irányítószám
                  </span>
                </summary>
                <div className="area-row-body">
                  {e.groups.map((g, i) => (
                    <div key={i} className={i > 0 ? "mt-3" : undefined}>
                      {g.split && (
                        <p className={`mb-1.5 text-xs font-semibold ${g.separate ? "text-accent-deep" : "text-text-muted"}`}>
                          {g.separate ? "Külön díjprofil" : "A kerület többi irányítószáma"}
                        </p>
                      )}
                      <ul className="area-zips" aria-label={`${e.title} irányítószámai`}>
                        {g.codes.map((c) => (
                          <li key={c}>
                            <Link
                              href={`/arkalkulator/?irsz=${c}`}
                              className="area-zip num"
                              aria-label={`${c}: fuvardíj kiszámítása`}
                            >
                              {c}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="mt-3 text-xs leading-relaxed text-text-muted">
                    Válasszon irányítószámot: a kalkulátor ezzel előtöltve nyílik meg.
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {/* Egyedi egyeztetés */}
      {quoteHits.length > 0 && (
        <div className="area-quote">
          <p className="font-semibold">Egyedi egyeztetéssel</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{UNSUPPORTED_NOTICE}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {quoteHits.map((a) => (
              <li key={a.slug}>
                <Link href={`/teruletek/${a.slug}`} className="area-chip">
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nincs találat */}
      {q && total === 0 && !exactZip && (
        <div className="area-empty" role="status">
          <p className="font-display text-heading-xs font-bold">Nincs találat erre: „{query.trim()}”</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            Próbálja kerületszámmal (pl. „11” vagy „XI”), vagy írja be a szállítási cím
            négyjegyű irányítószámát. Ha a cím nincs a listán, hívjon — egyedi
            egyeztetéssel sok helyre szállítunk.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline" onClick={() => setQuery("")}>
              Keresés törlése
            </button>
            <a href={`tel:${company.phone.raw}`} className="num btn btn-outline">
              <IconPhone size={17} className="btn-icon" />
              {company.phone.display}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
