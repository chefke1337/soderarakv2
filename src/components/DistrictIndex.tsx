import Link from "next/link";
import { freightProfiles, romanDistrict, serviceAreas } from "@/content/site";
import { budapestDistrictAreas, DISTRICT_AREAS_SOURCE } from "@/content/districts";

/**
 * Budapest kerületei és városrészei — az ügyfél listája, statikus, teljesen
 * kiírt szövegként (SEO: minden városrész neve indexelhető, nem lenyitott
 * tartalomban). Díjat NEM a városrész ad: a kerület sorában csak az
 * irányítószámok szerepelnek, a díj a díjlistában / kalkulátorban van.
 * A megosztott városrészek minden kerületnél ott vannak, ahol a lista adja.
 */
export default function DistrictIndex() {
  return (
    <section aria-labelledby="kerulet-index-cim">
      <h2 id="kerulet-index-cim" className="font-display text-heading-md font-bold">
        Budapest kerületei és városrészei
      </h2>
      <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
        Mind a 23 kerületbe szállítunk sódert, homokot, kavicsot, murvát, andezitet és
        földet. A fuvardíjat a szállítási cím irányítószáma határozza meg — a városrész
        csak tájékoztat, hogy melyik kerületről van szó.
      </p>
      <ol className="district-index mt-6">
        {budapestDistrictAreas.map((d) => {
          const codes = freightProfiles
            .filter((p) => p.municipalityId === "budapest" && p.districtId === d.id)
            .flatMap((p) => [...p.postalCodes]);
          const page = serviceAreas.find(
            (a) => a.freight.kind === "profile" && a.freight.districtId === d.id && /kerület/.test(a.name),
          );
          const title = `Budapest ${romanDistrict(d.id)} kerület${d.name ? ` – ${d.name}` : ""}`;
          return (
            <li key={d.id} id={`kerulet-${d.id}`} className="district-index-item">
              <h3 className="font-display text-[1.0625rem] font-bold">
                {page ? (
                  <Link href={`/teruletek/${page.slug}`} className="hover:text-brand-dark">
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text">{d.areas.join(", ")}</p>
              {codes.length > 0 && (
                <p className="num mt-1.5 text-xs leading-relaxed text-text-muted">
                  Irányítószámok: {codes.join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-text-muted">{DISTRICT_AREAS_SOURCE}</p>
    </section>
  );
}
