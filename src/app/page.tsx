import Link from "next/link";
import {
  budapestDistricts,
  company,
  DISCLOSURE_FREIGHT,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FAQ,
  FREIGHT_VAT_RATE,
  guides,
  HERO,
  MIERT_HIVJON,
  MIN_ORDER_M3,
  PERMIT_NOTICE,
  quoteOnlyAreas,
  SINGLE_TRIP_MAX_M3,
  tariffedAreas,
} from "@/content/site";
import {
  CalculatorCta,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconMapPinned,
  IconPhone,
  IconTag,
  IconTruck,
  MailLink,
  PhoneLink,
} from "@/lib/ui";
import { faqJsonLd, JsonLd } from "@/lib/meta";
import { withBasePath } from "@/lib/basepath";
import FaqAccordion from "@/components/FaqAccordion";
import Section from "@/components/Section";
import MaterialHeaps from "@/components/MaterialHeaps";
import HeroGround from "@/components/HeroGround";
import CalculatorEntry from "@/components/CalculatorEntry";
import OrderRoute from "@/components/OrderRoute";
import MaterialLedger, { GrossPriceBanner, LedgerHeader } from "@/components/MaterialLedger";
import LefedettsegTerkepLazy from "@/components/LefedettsegTerkepLazy";

export default function HomePage() {
  // Ténysor — minden érték az adatmodellből vagy a V1/V2 meglévő állításaiból.
  const facts = [
    {
      icon: IconTruck,
      value: `${MIN_ORDER_M3}–${SINGLE_TRIP_MAX_M3} m³`,
      label: "egy fuvarban, saját teherautóval",
    },
    { icon: IconClock, value: "Gyakran aznap", label: "kiszállítás Budafok környékén" },
    {
      icon: IconMapPinned,
      value: `${budapestDistricts.length} kerület + Érd`,
      label: "minden kerületbe szállítunk",
    },
    { icon: IconTag, value: "Bruttó árak", label: "az anyagárak az ÁFÁ-t tartalmazzák" },
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
      {/* ─── Hero: cím · hívás · teherautó, alatta ténysor és kupacsor ─── */}
      {/* data-call-region="hero": a hero hívógombjának call_location-je (metrics-plan §5) */}
      <section
        data-call-region="hero"
        className="hero-x hero-k on-dark relative isolate overflow-hidden text-on-dark"
      >
        <div
          aria-hidden="true"
          className="hero-base absolute inset-0 -z-20 bg-[linear-gradient(180deg,#2b211b_0%,#221a15_55%,#1d1612_100%)]"
        />
        <div aria-hidden="true" className="hero-horizon pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64" />
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem]" />

        <div className="hero-k-inner mx-auto max-w-6xl px-4 pt-9 pb-10 md:px-6 md:pt-14 md:pb-12 lg:pt-16">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-12 lg:items-end lg:gap-12 xl:grid-cols-[minmax(0,28rem)_19rem] xl:gap-10 xl:items-center">
            <div className="min-w-0 lg:col-span-7 xl:col-span-1">
              <p className="hero-kicker rise text-sm font-semibold text-amber">
                <span className="whitespace-nowrap">Hívható: {company.hours.short}</span>
              </p>
              <h1 className="hero-k-title rise-solid mt-5 font-display text-[2.5rem] leading-[0.98] font-bold tracking-display text-balance sm:text-[3.5rem] lg:text-[4.25rem] xl:text-[4.25rem]">
                {HERO.title}
              </h1>
            </div>
            <div className="hero-k-call min-w-0 lg:col-span-5 lg:pb-2 xl:col-span-1 xl:pb-0">
              <p className="rise rise-3 max-w-[44ch] text-lg leading-relaxed text-on-dark-muted xl:text-[1.0625rem]">
                {HERO.lead}
              </p>
              <div className="rise rise-3 hero-areas mt-5">
                <span className="hero-area-pill">
                  <IconMapPinned size={13} />
                  Budapest mind a {budapestDistricts.length} kerülete
                </span>
                <span className="hero-area-pill">
                  <IconMapPinned size={13} />
                  Érd
                </span>
              </div>
              <div className="rise rise-4 mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <PhoneLink className="hero-k-phone num btn btn-lg btn-primary whitespace-nowrap">
                  <IconPhone size={21} className="btn-icon btn-icon-ring" />
                  {company.phone.display}
                </PhoneLink>
                <CalculatorCta className="btn btn-lg btn-outline-cream whitespace-nowrap">
                  Árkalkulátor indítása
                  <IconArrowRight size={18} className="btn-icon btn-icon-move" />
                </CalculatorCta>
              </div>
            </div>
          </div>

          {/* Teherautó: xl alatt a gombok alatt teljes szélességben (tableten
              széles, „mozivászon" kivágás), xl-től a hero jobb felén, a
              képernyő széléig kifutva. Díszítő kép. */}
          <div aria-hidden="true" className="hero-truck rise rise-3">
            <picture>
              {/* xl+: kiterjesztett, lágy szélű változat a hosszú átmenethez */}
              <source
                media="(min-width: 1280px)"
                srcSet={`${withBasePath("/hero/teherauto-800.webp")} 800w, ${withBasePath("/hero/teherauto-1600.webp")} 1600w`}
                sizes="48vw"
                width={1600}
                height={1102}
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- statikus export, előre méretezett webp */}
              <img
                src={withBasePath("/hero/teherauto-kozel-1200.webp")}
                srcSet={`${withBasePath("/hero/teherauto-kozel-720.webp")} 720w, ${withBasePath("/hero/teherauto-kozel-1200.webp")} 1200w`}
                sizes="100vw"
                width={1200}
                height={878}
                alt=""
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>

          {/* Ténysor — ikonos sáv a hero-ban. A <dl> KÖZVETLENÜL tartalmazza a
              dt/dd párokat burkoló <div>-eket (WCAG 1.3.1). */}
          <dl className="hero-facts rise rise-4 mt-9 grid grid-cols-2 gap-y-5 md:mt-12 lg:mt-14 lg:grid-cols-4">
            {facts.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.value} className="hero-fact flex items-start gap-3 pr-3 lg:px-6">
                  <span aria-hidden="true" className="hero-fact-icon">
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <dt className="sr-only">{f.label}</dt>
                    <dd>
                      <span className="num block font-display text-[1.0625rem] leading-tight font-bold text-on-dark md:text-lg">
                        {f.value}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-on-dark-muted md:text-sm">
                        {f.label}
                      </span>
                    </dd>
                  </span>
                </div>
              );
            })}
          </dl>

          {/* Mintasor: hat anyaghalom teljes szélességben */}
          <div className="mt-10 md:mt-12 lg:mt-14">
            <MaterialHeaps />
          </div>
          <p className="mt-3 max-w-[80ch] text-[0.8125rem] leading-relaxed text-on-dark-muted lg:mt-6">
            {DISCLOSURE_GROSS} {DISCLOSURE_FREIGHT} {DISCLOSURE_PRICE}
          </p>
        </div>

        {/* Talaj: a térkő alatti rétegrend metszete (lásd HeroGround). */}
        <HeroGround />
      </section>

      {/* ─── Anyagok + bruttó árlista — egy blokk ─── */}
      <Section
        headingLevel={2}
        id="anyagok-arak"
        className="lx lx-s1 lx-grid"
        kicker="Anyagok és árak"
        title="Minden tétel szemcsemérettel és bruttó árral"
        lead={
          <>
            Nyissa le az anyagot: látja a frakciót a közös mm-skálán, a felhasználást,
            a mosott-jelölést és a köbméterárat. Ami nincs a listán, arról telefonon
            egyeztetünk.
          </>
        }
      >
        <GrossPriceBanner className="mb-6" />
        <LedgerHeader />
        <MaterialLedger />
      </Section>

      {/* ─── Kalkulátor-belépő (terrakotta) ─── */}
      <CalculatorEntry />

      {/* ─── Rendelés menete ─── */}
      <Section
        headingLevel={2}
        id="rendeles"
        className="lx lx-s2"
        layout="split"
        kicker="Így működik"
        title="Rendelés menete"
        lead={
          <>
            Kérdése van az anyagról vagy a mennyiségről? Hívjon:{" "}
            <PhoneLink className="num link whitespace-nowrap" />
          </>
        }
      >
        <OrderRoute />
      </Section>

      {/* ─── Hol szállítunk — lefedettség ─── */}
      <Section
        headingLevel={2}
        id="terulet"
        tone="muted"
        className="lx lx-s3"
        kicker="Hol szállítunk"
        title="Budapest és Érd — minden kerületbe szállítunk"
        lead="A térkép a lefedettséget mutatja. A pontos szállítási díjért használja az árkalkulátort, vagy kérjen telefonos egyeztetést."
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-6">
            <div className="lx-map-frame rounded-[var(--radius-lg)] bg-surface p-3 shadow-pop">
              <LefedettsegTerkepLazy height={420} legend={false} />
            </div>
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-ink-soft">
              <span
                aria-hidden="true"
                className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-surface-accent"
              />
              <span>
                A jelölések a kiszolgált területeket mutatják, nem irányítószám-határokat.
              </span>
            </p>
          </div>

          <div className="min-w-0 lg:col-span-6">
            <dl className="border-t-2 border-text">
              <div className="border-b border-line py-4 md:py-5">
                <dt className="font-display text-heading-xs font-bold">
                  Szállítási díj — címre szabva
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Budapest mind a {budapestDistricts.length} kerülete és Érd. A szállítási
                  díjat az árkalkulátor számolja ki a megadott címre és mennyiségre; a nettó
                  díjra {Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön.
                </dd>
              </div>
              <div className="border-b border-line py-4 md:py-5">
                <dt className="font-display text-heading-xs font-bold">
                  Egy fuvarban legfeljebb {SINGLE_TRIP_MAX_M3} m³
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Nagyobb mennyiséghez kérjen egyedi, többfuvaros ajánlatot — a
                  többfuvaros díjat egyeztetés után adjuk.
                </dd>
              </div>
              <div className="border-b border-line py-4 md:py-5">
                <dt className="font-display text-heading-xs font-bold">Behajtási engedély</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{PERMIT_NOTICE}</dd>
              </div>
              <div className="border-b border-line py-4 md:py-5">
                <dt className="font-display text-heading-xs font-bold">Egyedi egyeztetés</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {quoteOnlyAreas.map((a) => a.name).join(", ")} — ezekhez a
                  településekhez jelenleg nincs feltüntetett fuvardíjunk. Ehhez a
                  címhez egyedi szállítási egyeztetés szükséges.
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/szallitas" className="btn btn-primary">
                Szállítás részletei
                <IconArrowRight size={17} className="btn-icon btn-icon-move" />
              </Link>
              <Link href="/teruletek" className="btn btn-outline">
                Kiszolgált területek ({tariffedAreas.length + quoteOnlyAreas.length})
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Miért hívjon minket? — jóváhagyott ügyfélszöveg ─── */}
      <section id="miert-hivjon" aria-labelledby="miert-hivjon-cim" className="lx lx-s2 bg-page text-text">
        <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-7 px-4 py-12 md:gap-y-8 md:px-6 md:py-24 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <p className="label-strata text-brand-deep">Miért mi</p>
            <h2
              id="miert-hivjon-cim"
              className="mt-3 font-display text-[2rem] leading-[1.06] font-bold tracking-display text-balance md:text-heading-lg"
            >
              {MIERT_HIVJON.title}
            </h2>
            <p className="mt-5 max-w-[52ch] border-l-4 border-accent pl-4 font-display text-heading-sm leading-snug font-medium text-text">
              {MIERT_HIVJON.lead}
            </p>
            <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-relaxed text-text-muted">
              {MIERT_HIVJON.body}
            </p>
          </div>

          <div className="order-last min-w-0 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-2">
            <div className="border-t border-border-strong pt-6" data-call-region="miert_hivjon">
              <p className="max-w-[56ch] text-[1.0625rem] leading-relaxed">
                {MIERT_HIVJON.closing}
              </p>
              <PhoneLink className="num btn btn-lg btn-primary mt-5">
                <IconPhone size={20} className="btn-icon" />
                Hívjon minket: {company.phone.display}
              </PhoneLink>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:pt-14">
            <div className="lx-panel on-dark rounded-[var(--radius-lg)] bg-surface-dark p-5 text-on-dark shadow-pop md:p-8">
              <h3 className="font-display text-heading-sm font-bold">{MIERT_HIVJON.listTitle}</h3>
              <ul className="mt-4">
                {MIERT_HIVJON.list.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3.5 border-b border-on-dark/15 py-3 last:border-0 last:pb-0 md:py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber"
                    >
                      <IconCheck size={15} />
                    </span>
                    <span className="text-[1.0625rem] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Ajánló: Buda Konténer (önálló reklám, nem a Sóderárak szolgáltatása;
             a petrol szín szándékosan különbözteti meg a saját kínálattól) ─── */}
      <aside aria-labelledby="hulladek-cim" className="border-y border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-6">
          <div className="flex gap-4">
            <span
              aria-hidden="true"
              className="mt-1.5 hidden h-12 w-1 shrink-0 rounded-full bg-petrol sm:block"
            />
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-petrol-deep">
                <span className="rounded-sm border border-petrol/40 px-1.5 py-0.5 text-xs font-bold tracking-wide uppercase">
                  Ajánló
                </span>
                {company.waste.kicker}
              </p>
              <h2 id="hulladek-cim" className="mt-1.5 font-display text-heading-sm font-bold text-balance">
                {company.waste.title}
              </h2>
              <p className="mt-1.5 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
                {company.waste.pitch}
              </p>
            </div>
          </div>
          <a
            href={company.waste.url}
            rel="noopener"
            className="btn shrink-0 border-[1.5px] border-petrol text-petrol-deep hover:bg-petrol hover:text-surface"
          >
            {company.waste.cta}
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (budakontener.hu)</span>
          </a>
        </div>
      </aside>

      {/* ─── GYIK + útmutatók ─── */}
      <Section
        headingLevel={2}
        id="gyik"
        tone="muted"
        className="lx lx-faq lx-grid"
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

      {/* ─── Záró hívás: sötét lezárás, a footerrel egy tömbben ─── */}
      <section
        data-call-region="zaro_cta"
        aria-labelledby="zaro-cim"
        className="on-dark relative isolate overflow-hidden bg-surface-dark text-on-dark"
      >
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-20" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-12 md:gap-10 md:px-6 md:py-24">
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
                <dt className="text-on-dark-muted">Telefonos elérhetőség</dt>
                <dd className="mt-1 font-semibold">
                  {company.hours.days}
                  <br />
                  {company.hours.time}
                </dd>
              </div>
              <div>
                <dt className="text-on-dark-muted">Szállítás</dt>
                <dd className="mt-1 font-semibold">
                  <Link
                    href="/szallitas"
                    className="inline-flex items-center gap-1 font-medium text-amber underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
                  >
                    Részletek
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
