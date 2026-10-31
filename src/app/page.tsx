import Link from "next/link";
import {
  budapestDistricts,
  company,
  DISCLOSURE_FREIGHT,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FAQ,
  FREIGHT_VAT_RATE,
  freightProfiles,
  guides,
  HERO,
  allMaterials,
  materialGroups,
  MIERT_HIVJON,
  MIN_ORDER_M3,
  PERMIT_NOTICE,
  quoteOnlyAreas,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import {
  CalculatorCta,
  formatFt,
  IconArrowRight,
  IconMapPinned,
  IconPhone,
  MailLink,
  PhoneLink,
} from "@/lib/ui";
import { faqJsonLd, JsonLd } from "@/lib/meta";
import FaqAccordion from "@/components/FaqAccordion";
import Section from "@/components/Section";
import HeroConfigurator from "@/components/HeroConfigurator";
import MaterialPile from "@/components/MaterialPile";
import { withBasePath } from "@/lib/basepath";
import { GrossPriceBanner } from "@/components/MaterialLedger";
import MaterialIndex from "@/components/MaterialIndex";
import OrderSteps from "@/components/OrderSteps";
import AreaFinder from "@/components/AreaFinder";

export default function HomePage() {
  const freightMinNet = Math.min(...freightProfiles.flatMap((p) => p.bands.map((b) => b.netFee)));

  // Ténysor — minden érték az adatmodellből vagy a V1/V2 meglévő állításaiból.
  const facts = [
    { value: `${MIN_ORDER_M3}–${SINGLE_TRIP_MAX_M3} m³`, label: "egy fuvarban, saját teherautóval" },
    { value: "Gyakran aznap", label: "kiszállítás Budafok környékén" },
    {
      value: `${budapestDistricts.length} kerület + Érd`,
      label: "irányítószám-alapú fuvardíjjal",
    },
    { value: "Bruttó árak", label: "az anyagárak az ÁFÁ-t tartalmazzák" },
  ];

  const featuredGuides = [
    "mennyi-soder-kell",
    "mennyibe-kerul-a-soder",
    "mennyi-ido-a-soder-szallitas",
  ]
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter((g): g is (typeof guides)[number] => Boolean(g));

  return (
    <>
      {/* ─── Hero: üzenet + anyag-rétegrend ─── */}
      {/* data-call-region="hero": a hero hívógombjának call_location-je (metrics-plan §5) */}
      <section
        data-call-region="hero"
        className="on-dark relative isolate overflow-hidden bg-surface-dark text-on-dark"
      >
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgb(249_115_22_/_0.30),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgb(177_84_58_/_0.35),transparent_50%)]"
        />
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 md:px-6 md:pt-16 md:pb-12 lg:pt-20">
          {/* Felső sor: a cím nyitott, széles tördelést kap; a leírás és a
              terület jobbra, alsó élre zárva. A mozgás sorrendje a figyelem
              útja: cím → értékígéret → következő lépés (a pult). */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="min-w-0 lg:col-span-8">
              <p className="rise label-strata text-amber">
                <span className="whitespace-nowrap">{company.hours.short}</span>
              </p>
              <h1 className="rise rise-2 mt-5 max-w-[14ch] font-display text-[2.5rem] leading-[0.96] font-bold tracking-display text-balance sm:text-[3.5rem] lg:max-w-none lg:text-[4.5rem] xl:text-[5rem]">
                {HERO.title}
              </h1>
            </div>
            <div className="min-w-0 lg:col-span-4 lg:pb-3">
              <p className="rise rise-3 max-w-[44ch] text-lg leading-relaxed text-on-dark-muted">
                {HERO.lead}
              </p>
              <div className="rise rise-3 hero-areas mt-4">
                <span className="hero-area-pill">
                  <IconMapPinned size={13} />
                  Budapest mind a {budapestDistricts.length} kerülete
                </span>
                <span className="hero-area-pill">
                  <IconMapPinned size={13} />
                  Érd
                </span>
              </div>
            </div>
          </div>

          {/* Rendelőpult: anyag (kupacválasztó) → változat, mennyiség → irányítószám
              → élő tájékoztató ár → kalkulátor. */}
          <div className="rise rise-4 mt-8 lg:mt-12">
            <HeroConfigurator
              action={withBasePath("/arkalkulator/")}
              piles={Object.fromEntries(
                materialGroups.map((g) => [g.slug, <MaterialPile key={g.slug} tone={g.tone} id={`pult-${g.slug}`} />]),
              )}
            />
          </div>
          <p className="mt-3 max-w-[80ch] text-[0.8125rem] leading-relaxed text-on-dark-muted lg:mt-6">
            {DISCLOSURE_GROSS} {DISCLOSURE_FREIGHT} {DISCLOSURE_PRICE}
          </p>
        </div>

        {/* Ténysor — homok sáv a hero alján.
            A <dl> KÖZVETLENÜL tartalmazza a dt/dd párokat burkoló <div>-eket:
            a <dl> > <div> > <div> > dt/dd beágyazás WCAG 1.3.1 sértés lenne. */}
        <div className="bg-surface-muted text-text">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 md:grid-cols-4 md:px-6">
            {facts.map((f, i) => (
              <div
                key={f.value}
                className={`fact-cell py-4 pr-4 md:py-6 ${i % 2 === 1 ? "pl-4 md:pl-5" : ""} ${
                  i >= 2 ? "border-t border-border-strong/60 md:border-t-0" : ""
                } ${i === 2 ? "md:pl-5" : ""}`}
              >
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="num block font-display text-heading-sm font-bold md:text-heading-md">
                    {f.value}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-text-muted">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── Anyag-index: valódi anyagfotók, bruttó induló ár ─── */}
      <section id="anyagok-arak" aria-labelledby="anyagok-arak-cim" className="bg-page text-text">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-24">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="min-w-0 lg:col-span-7">
              <p className="label-strata text-brand-deep">Anyagok és árak</p>
              <h2
                id="anyagok-arak-cim"
                className="mt-3 font-display text-[2rem] leading-[1.04] font-bold tracking-display text-balance md:text-heading-lg"
              >
                Hat anyag, {allMaterials.length} tétel — bruttó Ft/m³ árakkal
              </h2>
            </div>
            <div className="min-w-0 lg:col-span-5">
              <GrossPriceBanner />
            </div>
          </div>
          <div className="mt-8 md:mt-12">
            <MaterialIndex />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/arak" className="btn btn-outline">
              Teljes bruttó árlista, mind a {allMaterials.length} tétel
              <IconArrowRight size={17} className="btn-icon btn-icon-move" />
            </Link>
            <p className="text-sm text-text-muted">
              Ami nincs a listán, arról telefonon egyeztetünk:{" "}
              <PhoneLink className="num link whitespace-nowrap" />
            </p>
          </div>
        </div>
      </section>

      {/* ─── Szállítunk a címére? — irányítószám-kereső a főoldalon ─── */}
      <section id="terulet" aria-labelledby="terulet-cim" className="bg-surface-muted text-text">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-6 md:py-24 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-5">
            <p className="label-strata text-brand-deep">Hol szállítunk</p>
            <h2
              id="terulet-cim"
              className="mt-3 font-display text-[2rem] leading-[1.04] font-bold tracking-display text-balance md:text-heading-lg"
            >
              Szállítunk a címére?
            </h2>
            <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-text-muted">
              Budapest mind a {budapestDistricts.length} kerülete és Érd. A fuvardíj alapja
              mindig a szállítási cím irányítószáma — írja be, és megmondjuk.
            </p>
            <dl className="delivery-facts">
              <div>
                <dt>Fuvardíj</dt>
                <dd>
                  {freightProfiles.length} díjprofil, nettó{" "}
                  <strong className="num">{formatFt(freightMinNet)}</strong>-tól, +{" "}
                  {Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA
                </dd>
              </div>
              <div>
                <dt>Egy fuvar</dt>
                <dd>
                  legfeljebb <strong className="num">{SINGLE_TRIP_MAX_M3} m³</strong> — felette
                  többfuvaros, egyedi ajánlat
                </dd>
              </div>
              <div>
                <dt>Behajtás</dt>
                <dd>{PERMIT_NOTICE}</dd>
              </div>
              <div>
                <dt>Egyeztetéssel</dt>
                <dd>{quoteOnlyAreas.map((x) => x.name).join(", ")}</dd>
              </div>
            </dl>
          </div>
          <div className="min-w-0 lg:col-span-7">
            <AreaFinder compact />
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href="/teruletek" className="link font-semibold">
                Minden kerület és irányítószám
              </Link>
              <Link href="/szallitas" className="link font-semibold">
                Fuvardíjak irányítószám szerint
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Rendelés menete — tömör, vízszintes útvonal (desktop) ─── */}
      <section id="rendeles" aria-labelledby="rendeles-cim" className="bg-page text-text">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="label-strata text-brand-deep">Így működik</p>
              <h2
                id="rendeles-cim"
                className="mt-3 font-display text-[2rem] leading-[1.04] font-bold tracking-display md:text-heading-lg"
              >
                Rendelés menete
              </h2>
            </div>
            <p className="max-w-[44ch] text-[1.0625rem] leading-relaxed text-text-muted">
              Kérdése van az anyagról vagy a mennyiségről? Hívjon:{" "}
              <PhoneLink className="num link whitespace-nowrap" />
            </p>
          </div>
          <div className="mt-10 md:mt-14">
            <OrderSteps />
          </div>
        </div>
      </section>

      {/* ─── Buda Konténer — testvér üzletág (zöld: funkcionális megkülönböztetés) ─── */}
      <section aria-labelledby="hulladek-cim" className="border-y border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-6">
          <div className="flex gap-4">
            <span
              aria-hidden="true"
              className="mt-1.5 hidden h-10 w-1 shrink-0 rounded-full bg-petrol sm:block"
            />
            <div>
              <h2 id="hulladek-cim" className="font-display text-heading-sm font-bold">
                Építési törmelék, sitt, zöldhulladék? Erre van a Buda Konténer.
              </h2>
              <p className="mt-1.5 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
                {company.waste.pitch} A hulladékszállítás{" "}
                <strong className="font-semibold text-ink">külön üzletág</strong> — itt, a
                Sóderárak oldalon csak ömlesztett építőanyagot rendelhet.
              </p>
            </div>
          </div>
          <a
            href={company.waste.url}
            className="btn shrink-0 border-[1.5px] border-petrol text-petrol-deep hover:bg-petrol hover:text-surface"
          >
            {company.waste.domain}
          </a>
        </div>
      </section>

      {/* ─── GYIK + útmutatók ─── */}
      <Section
        headingLevel={2}
        id="gyik"
        tone="muted"
        layout="split"
        kicker="Gyakori kérdések"
        title="Bruttó ár, fuvar, mennyiség"
        lead="A legtöbb kérdés az árak természetéről, a fuvarról és az időpontról szól — íme a válaszok."
      >
        <JsonLd data={faqJsonLd([...FAQ])} />
        <FaqAccordion />
        <nav aria-label="Útmutatók" className="mt-8 md:mt-10">
          <h3 className="text-sm font-medium text-ink-soft">Részletesebben az útmutatókban</h3>
          <ul className="mt-3 border-t border-line">
            {featuredGuides.map((g) => (
              <li key={g.slug} className="border-b border-line">
                <Link
                  href={`/utmutatok/${g.slug}`}
                  className="group flex min-h-12 items-center justify-between gap-4 py-3 font-medium hover:text-brand-deep"
                >
                  {g.title}
                  <span
                    aria-hidden="true"
                    className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-deep"
                  >
                    ›
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/utmutatok"
                className="inline-flex min-h-12 items-center font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark"
              >
                Összes útmutató ({guides.length})
              </Link>
            </li>
          </ul>
        </nav>
      </Section>

      {/* ─── Miért hívjon minket? — jóváhagyott ügyfélszöveg; a sötét lezárás
           első fele (a hívás-CTA a közvetlenül utána következő záró blokkban
           áll, így nincs két versengő elsődleges gomb). ─── */}
      <section
        id="miert-hivjon"
        aria-labelledby="miert-hivjon-cim"
        className="on-dark relative isolate overflow-hidden bg-surface-dark text-on-dark"
      >
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-20" />
        <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-8 px-4 pt-12 pb-10 md:px-6 md:pt-24 md:pb-16 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <p className="label-strata text-amber">Miért mi</p>
            <h2
              id="miert-hivjon-cim"
              className="mt-3 font-display text-[2rem] leading-[1.04] font-bold tracking-display text-balance md:text-heading-lg"
            >
              {MIERT_HIVJON.title}
            </h2>
            <p className="mt-5 max-w-[48ch] border-l-4 border-accent pl-4 font-display text-heading-sm leading-snug font-medium">
              {MIERT_HIVJON.lead}
            </p>
            <p className="mt-4 max-w-[58ch] text-[1.0625rem] leading-relaxed text-on-dark-muted">
              {MIERT_HIVJON.body}
            </p>
            <p className="mt-4 max-w-[58ch] text-[1.0625rem] leading-relaxed text-on-dark-muted">
              {MIERT_HIVJON.closing}
            </p>
          </div>
          <div className="min-w-0 lg:col-span-6 lg:pt-12">
            <h3 className="font-display text-heading-sm font-bold">{MIERT_HIVJON.listTitle}</h3>
            <ul className="promise-list">
              {MIERT_HIVJON.list.map((item, i) => (
                <li key={item}>
                  <span aria-hidden="true" className="promise-num num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Záró hívás: sötét lezárás, a footerrel egy tömbben ─── */}
      <section
        data-call-region="zaro_cta"
        aria-labelledby="zaro-cim"
        className="on-dark relative isolate overflow-hidden bg-surface-dark text-on-dark"
      >
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-20" />
        <div className="mx-auto grid max-w-6xl gap-8 border-t border-on-dark/15 px-4 py-12 md:grid-cols-12 md:gap-10 md:px-6 md:py-20">
          <div className="min-w-0 md:col-span-6">
            <p className="label-strata text-amber">Rendelés</p>
            <h2
              id="zaro-cim"
              className="mt-3 font-display text-[2.25rem] leading-[1.02] font-bold tracking-display text-balance md:text-display"
            >
              Rendelne? Hívjon, és egyeztetjük a részleteket.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-on-dark-muted">
              Mondja el, milyen anyagra, mennyire és melyik irányítószámra van szüksége.
              Az árat és a szállítás időpontját telefonon pontosítjuk, előre tájékozódni
              pedig az árkalkulátorral tud — onnan rendelési igényt is küldhet.
            </p>
          </div>
          <div className="min-w-0 md:col-span-6 md:self-end">
            <PhoneLink className="num group flex items-center justify-between gap-4 border-y border-on-dark/25 py-5 font-display text-[2rem] font-bold tracking-tight transition-colors hover:text-amber sm:text-[2.5rem] lg:text-[3.25rem]">
              {company.phone.display}
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-on-dark transition-transform duration-[var(--dur-ui)] group-hover:-rotate-12 group-hover:scale-105"
              >
                <IconPhone size={24} />
              </span>
            </PhoneLink>
            <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-on-dark-muted">Nyitvatartás</dt>
                <dd className="mt-1 font-semibold">
                  {company.hours.days}
                  <br />
                  {company.hours.time}
                </dd>
              </div>
              <div>
                <dt className="text-on-dark-muted">Fuvardíjak</dt>
                <dd className="mt-1 font-semibold">
                  <Link
                    href="/szallitas"
                    className="inline-flex items-center gap-1 font-medium text-amber underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
                  >
                    Irányítószám szerint
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-on-dark-muted">E-mail</dt>
                <dd className="mt-1 font-semibold break-all">
                  <MailLink className="underline decoration-on-dark/30 underline-offset-4 hover:decoration-on-dark" />
                </dd>
              </div>
            </dl>
            <CalculatorCta className="btn btn-outline-cream mt-6 md:mt-7">
              Inkább előbb kiszámolom: árkalkulátor
              <IconArrowRight size={18} className="btn-icon btn-icon-move" />
            </CalculatorCta>
          </div>
        </div>
      </section>
    </>
  );
}
