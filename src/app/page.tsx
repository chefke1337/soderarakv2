import Link from "next/link";
import {
  company,
  DISCLOSURE_NET,
  DISCLOSURE_PRICE,
  FAQ,
  guides,
  MIERT_HIVJON,
  settlements,
  zones,
} from "@/content/site";
import { CalculatorCta, formatFt, IconArrowRight, IconCheck, IconPhone, PhoneLink } from "@/lib/ui";
import { faqJsonLd, JsonLd } from "@/lib/meta";
import FaqAccordion from "@/components/FaqAccordion";
import Section from "@/components/Section";
import MaterialStrata from "@/components/MaterialStrata";
import CalculatorEntry from "@/components/CalculatorEntry";
import OrderRoute from "@/components/OrderRoute";
import MaterialLedger, { LedgerHeader } from "@/components/MaterialLedger";
import ZonaTerkepLazy from "@/components/ZonaTerkepLazy";

export default function HomePage() {
  // Ténysor — minden érték a site.ts-ből / a V1 ténysávjából (nincs új állítás)
  const facts = [
    { value: "4–23 m³", label: "egy fuvarban, saját teherautóval" },
    { value: "Gyakran aznap", label: "kiszállítás Budafok környékén" },
    { value: `${settlements.length} település`, label: "három szállítási zónában" },
    { value: "15+ év", label: "tapasztalat az ömlesztett anyag szállításában" },
  ];

  const featuredGuides = ["mennyi-soder-kell", "mennyibe-kerul-a-soder", "mennyi-ido-a-soder-szallitas"]
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter((g): g is (typeof guides)[number] => Boolean(g));

  return (
    <>
      {/* ─── Hero: üzenet + anyag-rétegrend ─── */}
      {/* data-call-region="hero": a hero hívógombjának call_location-je (metrics-plan §5) */}
      <section data-call-region="hero" className="on-dark relative isolate overflow-hidden bg-surface-dark text-on-dark">
        {/* Háttér a V1 hero alapján: egységes sötét alap + szemcse + két lágy,
            teljes szélességű meleg radiális derítés. Nincs külön színmező (az
            V2.1-ben jobb oldalon „elcsúszott" sávnak hatott), nincs animált folt. */}
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgb(249_115_22_/_0.30),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgb(177_84_58_/_0.35),transparent_50%)]"
        />
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 md:px-6 md:pt-16 md:pb-14 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="rise label-strata text-amber">
                <span className="whitespace-nowrap">{company.hours.short}</span>
              </p>
              <h1 className="rise rise-2 mt-5 font-display text-[2.625rem] leading-[0.98] font-bold tracking-display text-balance sm:text-display md:text-display-xl">
                Sóder, homok, kavics, murva, bazalt, föld szállítása
              </h1>
              <p className="rise rise-3 mt-6 max-w-[52ch] text-lg leading-relaxed text-on-dark-muted">
                Ömlesztett építőanyag{" "}
                <strong className="hero-area font-semibold text-on-dark">
                  Budapest XXII. és XI. kerületébe, Érdre, Diósdra, Törökbálintra
                  és környékére
                </strong>
                . Mondja el telefonon, mire
                van szüksége — Budafok környékén gyakran még aznap szállítunk.
              </p>
              <div className="rise rise-4 mt-8 flex flex-col gap-3 sm:flex-row">
                <PhoneLink className="num btn btn-lg btn-primary">
                  <IconPhone size={21} className="btn-icon" />
                  {company.phone.display}
                </PhoneLink>
                <CalculatorCta className="btn btn-lg btn-outline-cream">
                  Árkalkulátor indítása
                  <IconArrowRight size={18} className="btn-icon btn-icon-move" />
                </CalculatorCta>
              </div>
              <p className="rise rise-4 mt-5 max-w-[60ch] text-[0.8125rem] leading-relaxed text-on-dark-muted">
                {DISCLOSURE_PRICE} {DISCLOSURE_NET}
              </p>
            </div>

            <div className="lg:col-span-5">
              <MaterialStrata />
            </div>
          </div>
        </div>

        {/* Ténysor — homok sáv a hero alján */}
        <dl className="bg-surface-muted text-text">
          <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 md:grid-cols-4 md:px-6">
            {facts.map((f, i) => (
              <div
                key={f.value}
                className={`py-5 pr-4 md:py-6 ${i % 2 === 1 ? "border-l border-border-strong/60 pl-4" : ""} ${i >= 2 ? "border-t border-border-strong/60 md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-5" : ""} ${i % 2 === 1 ? "md:pl-5" : ""}`}
              >
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="num block font-display text-heading-sm font-bold md:text-heading-md">{f.value}</span>
                  <span className="mt-1 block text-sm leading-snug text-text-muted">{f.label}</span>
                </dd>
              </div>
            ))}
          </div>
        </dl>
      </section>

      {/* ─── Anyagok + árlista — egy blokk ─── */}
      <Section
        headingLevel={2}
        id="anyagok-arak"
        kicker="Anyagok és árak"
        title="Minden tétel, szemcsemérettel és nettó árral"
        lead={
          <>
            Nyissa le az anyagot: látja a frakciót a közös mm-skálán, a
            felhasználást és a köbméterárat. Ami nincs a listán, arról
            telefonon egyeztetünk.
          </>
        }
      >
        <LedgerHeader />
        <MaterialLedger />
        <p className="mt-4 text-sm text-ink-soft">{DISCLOSURE_NET}</p>
      </Section>

      {/* ─── Kalkulátor-belépő (terrakotta) ─── */}
      <CalculatorEntry />

      {/* ─── Rendelés menete — valódi sorrend, ezért számozott ─── */}
      <Section
        headingLevel={2}
        id="rendeles"
        layout="split"
        kicker="Így működik"
        title="Rendelés menete"
      >
        <OrderRoute />
      </Section>

      {/* ─── Hol szállítunk ─── */}
      <Section
        headingLevel={2}
        id="terulet"
        tone="muted"
        kicker="Hol szállítunk"
        title="Budapest délnyugati kapujától a környező településekig"
        lead="Három zóna, egyeztetett fuvardíjjal. Nem található a listában? Kérdezzen rá telefonon."
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            {/* Valódi, interaktív térkép (nagyítás, mozgatás, településcímkék) a
                korábbi statikus vázlat helyett — lustán töltődik, nem lassít. */}
            <div className="rounded-[var(--radius-lg)] bg-surface p-3 shadow-pop">
              <ZonaTerkepLazy height={420} />
            </div>
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand-dark" />
              <span>
                Telephely: {company.address.full} A XXII. kerületet Budafok,
                Budatétény és Nagytétény jelöli.
              </span>
            </p>
          </div>

          <div className="lg:col-span-6">
            <ol className="border-t-2 border-text">
              {zones.map((z, i) => {
                const list = settlements.filter((s) => s.zone === z.id);
                return (
                  <li key={z.id} className="grid grid-cols-[2rem_1fr] gap-x-4 border-b border-line py-5">
                    <span aria-hidden="true" className={`num flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${["bg-[#b4532f] text-on-dark", "bg-[#d9b77a] text-text", "bg-[#cbbfa9] text-text"][i]}`}>
                      {i + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-display text-heading-xs font-bold">{z.name}</h3>
                        <p className="num font-display text-heading-sm font-bold">
                          {formatFt(z.fuelMin).replace(" Ft", "")}–{formatFt(z.fuelMax)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        Fuvar nettó, egy fuvarra · kiszállás: {z.leadTime}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        {list.map((s, j) => (
                          <span key={s.slug}>
                            <Link href={`/teruletek/${s.slug}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                              {s.name}
                            </Link>
                            {j < list.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm text-ink-soft">
              Fuvarárak tájékoztató jellegűek, nettó értékek. {DISCLOSURE_PRICE}
            </p>
            <Link
              href="/teruletek"
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark"
            >
              Összes település és zóna részletesen
            </Link>
          </div>
        </div>
      </Section>

      {/* ─── Miért hívjon minket? — jóváhagyott ügyfélszöveg (site.ts MIERT_HIVJON) ─── */}
      <section id="miert-hivjon" aria-labelledby="miert-hivjon-cim" className="bg-page text-text">
        <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-8 px-4 py-14 md:px-6 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="label-strata text-brand-deep">Miért mi</p>
            <h2 id="miert-hivjon-cim" className="mt-3 font-display text-[2rem] leading-[1.06] font-bold tracking-display text-balance md:text-heading-lg">
              {MIERT_HIVJON.title}
            </h2>
            <p className="mt-5 max-w-[52ch] font-display text-heading-sm leading-snug font-medium text-text">
              {MIERT_HIVJON.lead}
            </p>
            <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-relaxed text-text-muted">
              {MIERT_HIVJON.body}
            </p>
          </div>

          <div className="order-last lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-2">
            <div className="border-t border-border-strong pt-6" data-call-region="miert_hivjon">
              <p className="max-w-[56ch] text-[1.0625rem] leading-relaxed">{MIERT_HIVJON.closing}</p>
              <PhoneLink className="num btn btn-lg btn-primary mt-5">
                <IconPhone size={20} className="btn-icon" />
                Hívjon minket: {company.phone.display}
              </PhoneLink>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:pt-14">
            <div className="on-dark rounded-[var(--radius-lg)] bg-surface-dark p-6 text-on-dark shadow-pop md:p-8">
              <h3 className="font-display text-heading-sm font-bold">{MIERT_HIVJON.listTitle}</h3>
              <ul className="mt-4">
                {MIERT_HIVJON.list.map((item) => (
                  <li key={item} className="flex gap-3.5 border-b border-on-dark/15 py-3.5 last:border-0 last:pb-0">
                    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
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

      {/* ─── Buda Konténer — testvér üzletág (zöld: funkcionális megkülönböztetés) ─── */}
      <section aria-labelledby="hulladek-cim" className="border-y border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-6">
          <div className="flex gap-4">
            <span aria-hidden="true" className="mt-1.5 hidden h-10 w-1 shrink-0 rounded-full bg-petrol sm:block" />
            <div>
              <h2 id="hulladek-cim" className="font-display text-heading-sm font-bold">
                Építési törmelék, sitt, zöldhulladék? Erre van a Buda Konténer.
              </h2>
              <p className="mt-1.5 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
                {company.waste.pitch} A hulladékszállítás{" "}
                <strong className="font-semibold text-ink">külön üzletág</strong> — itt, a Sóderárak
                oldalon csak ömlesztett építőanyagot rendelhet.
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
        title="Mennyiség, fuvar, időpont"
        lead="A legtöbb kérdés mennyiségről, fuvarról és időpontról szól — íme a válaszok."
      >
        <JsonLd data={faqJsonLd([...FAQ])} />
        <FaqAccordion />
        <nav aria-label="Útmutatók" className="mt-10">
          <h3 className="text-sm font-medium text-ink-soft">Részletesebben az útmutatókban</h3>
          <ul className="mt-3 border-t border-line">
            {featuredGuides.map((g) => (
              <li key={g.slug} className="border-b border-line">
                <Link href={`/utmutatok/${g.slug}`} className="group flex min-h-12 items-center justify-between gap-4 py-3 font-medium hover:text-brand-deep">
                  {g.title}
                  <span aria-hidden="true" className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-deep">›</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/utmutatok" className="inline-flex min-h-12 items-center font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark">
                Összes útmutató ({guides.length})
              </Link>
            </li>
          </ul>
        </nav>
      </Section>

      {/* ─── Záró hívás: sötét lezárás, a footerrel egy tömbben ─── */}
      {/* data-call-region="zaro_cta": külön régió a hero-tól (metrics-plan §5). */}
      <section data-call-region="zaro_cta" aria-labelledby="zaro-cim" className="on-dark relative isolate overflow-hidden bg-surface-dark text-on-dark">
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-20" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-12 md:px-6 md:py-24">
          <div className="md:col-span-6">
            <p className="label-strata text-amber">Rendelés</p>
            <h2 id="zaro-cim" className="mt-3 font-display text-[2.25rem] leading-[1.02] font-bold tracking-display text-balance md:text-display">
              Rendelne? Hívjon, és egyeztetjük a részleteket.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-on-dark-muted">
              Mondja el, milyen anyagra, mennyire és hová van szüksége. Az árat és
              a szállítás időpontját telefonon pontosítjuk, előre tájékozódni
              pedig az árkalkulátorral tud.
            </p>
          </div>
          <div className="md:col-span-6 md:self-end">
            <PhoneLink className="num group flex items-center justify-between gap-4 border-y border-on-dark/25 py-5 font-display text-[2rem] font-bold tracking-tight transition-colors hover:text-amber sm:text-[2.5rem] lg:text-[3.25rem]">
              {company.phone.display}
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-on-dark transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105">
                <IconPhone size={24} />
              </span>
            </PhoneLink>
            <p className="mt-4 text-sm text-on-dark-muted">
              {company.hours.days}, {company.hours.time} · {company.address.full}
            </p>
            <CalculatorCta className="btn btn-outline-cream mt-6">
              Inkább előbb kiszámolom: árkalkulátor
              <IconArrowRight size={18} className="btn-icon btn-icon-move" />
            </CalculatorCta>
          </div>
        </div>
      </section>
    </>
  );
}
