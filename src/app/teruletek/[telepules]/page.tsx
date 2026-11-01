import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  bandLabel,
  company,
  areaPages,
  CASTLE_DISTRICT_ID,
  districtAreaPages,
  findAreaPage,
  freightProfiles,
  FREIGHT_VAT_RATE,
  MIN_ORDER_M3,
  materialGroups,
  PERMIT_NOTICE,
  profileMaxM3,
  romanDistrict,
  serviceAreas,
  SINGLE_TRIP_MAX_M3,
  UNSUPPORTED_NOTICE,
  type FreightProfile,
  type AreaPage,
} from "@/content/site";
import { formatFt, IconArrowRight, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, faqJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import { districtAreas } from "@/content/districts";

export function generateStaticParams() {
  return areaPages.map((s) => ({ telepules: s.slug }));
}

/** A területhez tartozó díjprofil(ok) — egy kerülethez több is lehet (XI.). */
function profilesFor(area: AreaPage): FreightProfile[] {
  if (area.freight.kind !== "profile") return [];
  const f = area.freight;
  return freightProfiles.filter(
    (p) =>
      p.municipalityId === f.municipalityId &&
      (f.districtId === undefined || p.districtId === f.districtId),
  );
}

function freightRangeLabel(profiles: FreightProfile[]): string | null {
  if (!profiles.length) return null;
  const fees = profiles.flatMap((p) => p.bands.map((b) => b.netFee));
  return `${formatFt(Math.min(...fees))}–${formatFt(Math.max(...fees))}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ telepules: string }>;
}): Promise<Metadata> {
  const { telepules } = await params;
  const area = findAreaPage(telepules);
  if (!area) return {};
  const profiles = profilesFor(area);
  const range = freightRangeLabel(profiles);
  return pageMeta({
    title: `Sóder szállítás ${area.name} — bruttó anyagár, nettó fuvar`,
    description: range
      ? `Sóder, homok, kavics, murva, andezit és föld szállítás ${area.name} területére. Fuvar nettó ${range} az irányítószám és a mennyiség szerint; az anyagárak bruttók. Hívás: ${company.phone.display}.`
      : `Sóder, homok, kavics, murva, andezit és föld szállítás ${area.name} területére egyedi szállítási egyeztetéssel. Hívás: ${company.phone.display}.`,
    path: `/teruletek/${area.slug}`,
  });
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ telepules: string }>;
}) {
  const { telepules } = await params;
  const area = findAreaPage(telepules);
  if (!area) notFound();

  const profiles = profilesFor(area);
  const district =
    area.freight.kind === "profile" && area.freight.districtId
      ? districtAreas(area.freight.districtId)
      : undefined;
  const hasTariff = profiles.length > 0;
  const range = freightRangeLabel(profiles);
  const allCodes = profiles.flatMap((p) => [...p.postalCodes]);
  const districtId = area.freight.kind === "profile" ? area.freight.districtId : undefined;
  const isDistrictPage = districtAreaPages.some((d) => d.slug === area.slug);
  // Kerületi oldalon a szomszédos sorszámú kerületek oldalai; egyébként a kiemelt területek.
  const others: AreaPage[] = isDistrictPage && districtId
    ? [...districtAreaPages, ...serviceAreas.filter((a) => /kerület/.test(a.name))]
        .filter((x) => x.slug !== area.slug && x.freight.kind === "profile" && x.freight.districtId !== undefined)
        .sort((a, b) => {
          const da = a.freight.kind === "profile" ? Math.abs((a.freight.districtId ?? 0) - districtId) : 99;
          const db = b.freight.kind === "profile" ? Math.abs((b.freight.districtId ?? 0) - districtId) : 99;
          return da - db;
        })
        .slice(0, 6)
    : serviceAreas.filter((x) => x.slug !== area.slug).slice(0, 8);
  const maxM3 = profiles.length ? Math.max(...profiles.map((p) => profileMaxM3(p))) : SINGLE_TRIP_MAX_M3;

  const areaFaq = [
    {
      q: `Mennyibe kerül a szállítás ${area.name} területére?`,
      a: hasTariff
        ? `A fuvar díja az irányítószámtól és a szállított mennyiségtől függ: ${area.name} esetén nettó ${range}, egy fuvarra. A nettó fuvardíjra ${Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön. Az anyagár ettől külön, bruttó Ft/m³ — rá nem kerül még egyszer ÁFA.`
        : `${UNSUPPORTED_NOTICE} ${area.name} területére jelenleg nincs feltüntetett fuvardíjunk — a korábbi zónás díjakat nem alkalmazzuk automatikusan. Kérjük, hívjon minket a ${company.phone.display} számon.`,
    },
    {
      q: `Mennyire gyors a kiszállás ${area.name}?`,
      a:
        area.slug === "budafok" ||
        area.slug === "budateteny" ||
        area.slug === "nagyteteny" ||
        area.slug === "budapest-22-kerulet"
          ? `Budafok környékén a kiszállás gyakran aznap megtörténik. Hívás: ${company.phone.display}.`
          : `Egyeztetett időpontban szállítunk. Hívás: ${company.phone.display}.`,
    },
    ...(hasTariff
      ? [
          {
            q: `Mennyi anyagot visznek ki egy fuvarral ${area.name} területére?`,
            a:
              maxM3 < SINGLE_TRIP_MAX_M3
                ? `Ide egy fuvarral legfeljebb ${maxM3} m³ szállítható a feltüntetett díjjal; ${maxM3} m³ felett egyedi egyeztetés szükséges. Minimum rendelés ${MIN_ORDER_M3} m³.`
                : `Egy fuvarral legfeljebb ${SINGLE_TRIP_MAX_M3} m³; 10 m³ felett többfuvaros, egyedi ajánlatot adunk. Minimum rendelés ${MIN_ORDER_M3} m³.`,
          },
          {
            q: `Melyik irányítószámokra érvényes a díj?`,
            a: `${allCodes.join(", ")}. A fuvardíjat mindig a szállítási cím pontos irányítószáma határozza meg${profiles.length > 1 ? " — ebben a kerületben nem minden irányítószám tartozik ugyanabba a díjprofilba" : ""}.`,
          },
        ]
      : []),
    ...(districtId === CASTLE_DISTRICT_ID
      ? [
          {
            q: "Szállítanak a Várba?",
            a: `${PERMIT_NOTICE} Ha a cím a Vár területén van, mindenképpen egyeztessen előre telefonon: ${company.phone.display}.`,
          },
        ]
      : []),
    {
      q: `Milyen anyagokat szállítanak ${area.name} területére?`,
      a: `Jó minőségű, mosott sódert (töltősódert és 0–4-től 0–24-ig), bányahomokot és 0–1 homokot, jó minőségű, mosott kavicsot és kulét, murvát, nógrádkövesdi andezitet, töltő- és termőföldet. Minimum rendelés ${MIN_ORDER_M3} m³, egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Ömlesztett anyag szállítás — ${area.name}`,
    url: `${company.site.url}/teruletek/${area.slug}/`,
    areaServed: { "@type": districtId ? "AdministrativeArea" : "Place", name: area.name },
    provider: { "@id": `${company.site.url}/#business` },
  };

  return (
    <Section
      kicker={
        hasTariff
          ? `Irányítószám-alapú fuvardíj${allCodes.length ? ` · ${allCodes.join(", ")}` : ""}`
          : "Egyedi szállítási egyeztetés"
      }
      title={`Sóder szállítás ${area.name}`}
      lead={
        hasTariff
          ? `A fuvar díját az irányítószám és a szállított mennyiség határozza meg — ${area.name} esetén nettó ${range}, egy fuvarra. Az anyagárak bruttó árak, az ÁFÁ-t tartalmazzák.`
          : `${UNSUPPORTED_NOTICE} ${area.name} területére jelenleg nincs feltüntetett fuvardíjunk — a díjat egyeztetés után adjuk.`
      }
    >
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Területek", path: "/teruletek" },
          { name: area.name, path: `/teruletek/${area.slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(areaFaq)} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          {/* ── Fuvardíj-sávok vagy egyeztetés ── */}
          {hasTariff ? (
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-card md:p-6">
              <h2 className="font-display text-heading-sm font-bold">
                Fuvardíj-sávok — nettó, egy fuvarra
              </h2>
              {profiles.map((p) => {
                const maxM3 = profileMaxM3(p);
                return (
                  <div key={p.id} className="mt-4 border-t border-line pt-4 first:mt-3">
                    <p className="num text-sm font-semibold">
                      {p.label}
                      <span className="block font-sans text-xs font-normal text-ink-soft">
                        {p.postalCodes.join(", ")}
                      </span>
                    </p>
                    <dl className="num mt-2.5 grid gap-2 sm:grid-cols-2">
                      {p.bands.map((b) => (
                        <div
                          key={b.upTo}
                          className="flex items-baseline justify-between gap-3 rounded-sm bg-surface-muted px-3 py-2"
                        >
                          <dt className="text-xs font-semibold text-ink-soft">
                            {bandLabel(p, b)}
                          </dt>
                          <dd className="font-display text-[0.9375rem] font-bold whitespace-nowrap">
                            {formatFt(b.netFee)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {maxM3 < SINGLE_TRIP_MAX_M3 && (
                      <p className="mt-2 text-xs font-semibold text-accent-deep">
                        {maxM3} m³ felett egyedi egyeztetés szükséges.
                      </p>
                    )}
                  </div>
                );
              })}
              <p className="mt-4 text-xs leading-relaxed text-ink-soft">
                A nettó fuvardíjra {Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön.{" "}
                {PERMIT_NOTICE}
              </p>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-accent/45 bg-brand-soft p-5 md:p-6">
              <h2 className="font-display text-heading-sm font-bold text-accent-deep">
                Egyedi szállítási egyeztetés
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-accent-deep">
                {area.name} területére a V3 árlistában nincs feltüntetett fuvardíj. A
                korábbi háromzónás díjakat nem alkalmazzuk automatikusan — a fuvar
                díját telefonos egyeztetés után adjuk meg. Az anyagárak változatlanul
                bruttó Ft/m³ értékek.
              </p>
              <PhoneLink className="num btn btn-primary mt-4" />
            </div>
          )}

          {/* ── A kerület városrészei (ügyfél listája; tájékoztató, nem díjképző) ── */}
          {district && (
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-card md:p-6">
              <h2 className="font-display text-heading-sm font-bold">
                Városrészek a {romanDistrict(district.id)} kerületben
                {district.name ? ` (${district.name})` : ""}
              </h2>
              <p className="mt-3 text-sm leading-relaxed">{district.areas.join(", ")}</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                A fuvardíjat a szállítási cím irányítószáma határozza meg, nem a városrész.
              </p>
              <Link
                href={`/teruletek#kerulet-${district.id}`}
                className="link mt-1 inline-flex min-h-11 items-center text-sm font-semibold"
              >
                Minden kerület és városrész →
              </Link>
            </div>
          )}

          {/* ── Anyagok ── */}
          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-card md:p-6">
            <h2 className="font-display text-heading-sm font-bold">
              Amit {area.name} területére szállítunk
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {materialGroups.map((g) => (
                <li
                  key={g.slug}
                  className="rounded-sm border border-line bg-sand/60 px-4 py-3 text-sm"
                >
                  <Link
                    href={`/anyagok/${g.slug}`}
                    className="inline-flex min-h-11 items-center font-semibold hover:text-brand-dark"
                  >
                    {g.name} →
                  </Link>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                    {g.short}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              Minimum rendelés {MIN_ORDER_M3} m³, egy fuvarban legfeljebb{" "}
              {SINGLE_TRIP_MAX_M3} m³. Tájékoztató ár — a végleges ajánlatot egyeztetés
              után adjuk.
            </p>
          </div>

          {/* ── További területek ── */}
          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-card md:p-6">
            <h2 className="font-display text-heading-sm font-bold">
              {isDistrictPage ? "További kerületek" : "További területek"}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/teruletek/${o.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-line bg-sand px-3 text-sm hover:border-brand"
                  >
                    {o.shortName}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/teruletek"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-deep underline underline-offset-2"
            >
              Minden kerület és terület →
            </Link>
          </div>

          {/* ── GYIK ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">
              Gyakori kérdések — {area.name}
            </h2>
            <dl className="mt-4 border-t border-ink/80">
              {areaFaq.map((f) => (
                <div key={f.q} className="border-b border-line py-4">
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-1 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <aside className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28">
          <div
            data-call-region="telepules_oldal"
            className="rounded-[var(--radius-md)] border border-line bg-sand p-6 shadow-card"
          >
            <p className="text-sm font-medium text-ink-soft">Ár {area.name} területére</p>
            <p className="num mt-2 font-display text-heading-md font-bold text-brand-dark">
              {hasTariff ? range : "Egyeztetés után"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {hasTariff
                ? "nettó fuvardíj egy fuvarra, az irányítószám és a mennyiség szerint"
                : "a fuvar díját telefonos egyeztetés után adjuk meg"}
            </p>
            <Link href="/arkalkulator" className="btn btn-primary mt-4 w-full">
              Árkalkulátor
              <IconArrowRight size={17} className="btn-icon btn-icon-move" />
            </Link>
            <PhoneLink className="num btn btn-outline mt-3 w-full" />
          </div>

          {area.freight.kind === "profile" && area.freight.districtId && (
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
              <p className="text-sm font-medium text-ink-soft">Kerület</p>
              <p className="mt-1 font-display text-heading-sm font-bold">
                Budapest {romanDistrict(area.freight.districtId)} kerület
              </p>
              <p className="num mt-2 text-xs leading-relaxed text-ink-soft">
                Irányítószámok: {allCodes.join(", ")}
              </p>
              <Link
                href="/szallitas#fuvardijak"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-deep underline underline-offset-2"
              >
                Teljes díjlista →
              </Link>
            </div>
          )}

          <nav aria-label="Hasznos útmutatók" className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
            <h2 className="text-sm font-medium text-ink-soft">Hasznos útmutatók</h2>
            <ul className="mt-2 text-sm">
              {[
                ["mennyi-soder-kell", "Mennyi sóder kell?"],
                ["mennyibe-kerul-a-soder", "Mennyibe kerül a sóder?"],
                ["arkalkulator-hasznalata", "Árkalkulátor használata"],
              ].map(([slug, label]) => (
                <li key={slug}>
                  <Link
                    href={`/utmutatok/${slug}`}
                    className="inline-flex min-h-11 items-center font-medium hover:text-brand-dark"
                  >
                    {label} →
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </Section>
  );
}
