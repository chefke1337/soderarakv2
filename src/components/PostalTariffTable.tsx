"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  bandLabel,
  districtPageSlug,
  freightProfiles,
  FREIGHT_VAT_RATE,
  normalizePostalCode,
  PERMIT_NOTICE,
  profileMaxM3,
  SINGLE_TRIP_MAX_M3,
  type FreightProfile,
} from "@/content/site";
import { formatFt, IconAlert } from "@/lib/ui";

/**
 * Kereshető, irányítószám-alapú fuvardíjlista — a V3 árazás HITELES
 * megjelenítése (ugyanabból a `freightProfiles` adatmodellből, amiből a
 * kalkulátor számol).
 *
 * Minden összeg NETTÓ fuvardíj egy fuvarra. Minden profil a SAJÁT sávjait
 * mutatja (az I. kerületé például 5–8 m³-ig tart), ezért nincs fix
 * oszlopkiosztás — így egy sáv díja sosem jelenhet meg rossz sávfelirattal.
 * Ahol nincs tarifa nagyobb mennyiségre, ott „egyedi egyeztetés" szerepel.
 */
export default function PostalTariffTable() {
  const [query, setQuery] = useState("");
  const uid = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return freightProfiles;
    const digits = normalizePostalCode(q);
    return freightProfiles.filter((p) => {
      if (digits && p.postalCodes.some((c) => c.startsWith(digits))) return true;
      return p.label.toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="min-w-0 flex-1 basis-[16rem]">
          <label htmlFor={`${uid}-q`} className="block text-sm font-semibold">
            Keresés irányítószámra vagy kerületre
          </label>
          <input
            id={`${uid}-q`}
            type="search"
            placeholder="pl. 1221 vagy XI."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={`${uid}-count`}
            className="mt-1.5 w-full rounded-sm border border-border-strong bg-surface px-3.5 py-3 text-base transition-colors hover:border-text focus-visible:border-text"
          />
        </div>
        <p id={`${uid}-count`} aria-live="polite" className="num text-sm text-text-muted">
          {filtered.length} díjprofil
        </p>
      </div>

      <p className="mt-4 flex gap-2.5 rounded-sm border border-border-strong bg-surface-muted px-3.5 py-3 text-sm leading-relaxed">
        <IconAlert size={16} className="mt-0.5 shrink-0" />
        <span>
          Az összegek <strong className="font-semibold">nettó fuvardíjak</strong> egy
          fuvarra; rájuk {Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön. Egy fuvarban
          legfeljebb {SINGLE_TRIP_MAX_M3} m³ szállítható. {PERMIT_NOTICE}
        </span>
      </p>

      {filtered.length === 0 ? (
        <p
          role="status"
          className="mt-5 rounded-sm border border-accent/45 bg-brand-soft px-4 py-3 text-sm leading-relaxed text-accent-deep"
        >
          Erre a keresésre nincs feltüntetett díjprofil. Ehhez a címhez egyedi szállítási
          egyeztetés szükséges — kérjük, hívjon minket.
        </p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {filtered.map((p) => (
            <ProfileRow key={p.id} profile={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileRow({ profile }: { profile: FreightProfile }) {
  const maxM3 = profileMaxM3(profile);
  const limited = maxM3 < SINGLE_TRIP_MAX_M3;

  return (
    <li className="tariff-row">
      <div className="min-w-0">
        <p className="font-display text-heading-xs font-bold">
          {profile.municipalityId === "budapest" && profile.districtId ? (
            <Link
              href={`/teruletek/${districtPageSlug(profile.districtId)}`}
              className="underline-offset-4 hover:text-brand-dark hover:underline"
            >
              {profile.label}
            </Link>
          ) : (
            profile.label
          )}
        </p>
        <p className="num mt-1 text-sm leading-relaxed text-ink-soft">
          {profile.postalCodes.join(", ")}
        </p>
      </div>

      <dl className="tariff-bands">
        {profile.bands.map((b) => (
          <div key={b.upTo} className="tariff-band">
            <dt>{bandLabel(profile, b)}</dt>
            <dd className="num">{formatFt(b.netFee)}</dd>
          </div>
        ))}
        {limited && (
          <div className="tariff-band tariff-band-quote">
            <dt>{maxM3} m³ felett</dt>
            <dd>egyedi egyeztetés</dd>
          </div>
        )}
      </dl>
    </li>
  );
}
