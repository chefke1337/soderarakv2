import Link from "next/link";
import {
  company,
  DISCLOSURE_NET,
  DISCLOSURE_PRICE,
  FAQ,
  guides,
  RENDELES_LEPESEK,
  settlements,
  zones,
} from "@/content/site";
import { CalculatorCta, formatFt, IconCheck, IconPhone, PhoneLink } from "@/lib/ui";
import { faqJsonLd, JsonLd } from "@/lib/meta";
import FaqAccordion from "@/components/FaqAccordion";
import Section from "@/components/Section";
import PriceSlip from "@/components/PriceSlip";
import MaterialLedger, { LedgerHeader } from "@/components/MaterialLedger";
import UseCasePicker from "@/components/UseCasePicker";
import ZoneSketch from "@/components/ZoneSketch";

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
      {/* ─── Hero: üzenet + árjegyzék-szelvény ─── */}
      {/* data-call-region="hero": a hero hívógombjának call_location-je (metrics-plan §5) */}
      <section data-call-region="hero" className="relative isolate overflow-hidden border-b border-line bg-paper">
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-70" />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 -z-10 hidden w-[38%] bg-sand lg:block"
        />
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:px-6 md:pt-16 md:pb-16 lg:pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7 lg:pt-4">
              <p className="rise text-sm font-medium text-ink-soft">
                Telephely és depó Budafokon · {company.hours.short}
              </p>
              <h1 className="rise rise-2 mt-4 font-display text-[2.375rem] leading-[1.03] font-bold tracking-display text-balance sm:text-display md:text-display-xl">
                Sóder, homok, kavics, murva, bazalt, föld szállítása
              </h1>
              <p className="rise rise-3 mt-6 max-w-[54ch] text-lg leading-relaxed text-ink-soft">
                Ömlesztett építőanyag Budapest XXII. és XI. kerületébe, Érdre,
                Diósdra, Törökbálintra és környékére. Mondja el telefonon, mire
                van szüksége — Budafok környékén gyakran még aznap szállítunk.
              </p>
              <div className="rise rise-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <PhoneLink className="num group inline-flex min-h-14 items-center justify-center gap-3 rounded-sm bg-brand-dark px-6 text-lg font-semibold text-paper transition-colors hover:bg-brand-deep">
                  <IconPhone size={21} />
                  {company.phone.display}
                </PhoneLink>
                <CalculatorCta className="inline-flex min-h-14 items-center justify-center gap-2 rounded-sm border border-ink/70 bg-paper/60 px-6 text-lg font-semibold text-ink transition-colors hover:bg-ink hover:text-paper">
                  Árkalkulátor indítása
                </CalculatorCta>
              </div>
              <p className="rise rise-4 mt-4 max-w-[60ch] text-[0.8125rem] leading-relaxed text-ink-soft">
                {DISCLOSURE_PRICE} {DISCLOSURE_NET}
              </p>
            </div>

            <div className="lg:col-span-5">
              <PriceSlip />
            </div>
          </div>

          <dl className="mt-12 grid grid-cols-2 border-t border-ink/80 md:mt-16 md:grid-cols-4">
            {facts.map((f, i) => (
              <div
                key={f.value}
                className={`py-4 pr-4 md:py-5 ${i % 2 === 1 ? "pl-4 border-l border-line md:pl-5" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-5" : ""}`}
              >
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="num block font-display text-heading-sm font-bold md:text-heading-md">{f.value}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
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

      {/* ─── Mire kell? ─── */}
      <Section
        headingLevel={2}
        id="mire-kell"
        tone="sand"
        kicker="Anyagválasztó"
        title="Mire kell az anyag?"
        lead="Válassza ki a munkát, és megmutatjuk, mit szoktunk hozzá ajánlani — árral, szemcsemérettel."
      >
        <UseCasePicker />
      </Section>

      {/* ─── Rendelés menete — valódi sorrend, ezért számozott ─── */}
      <Section
        headingLevel={2}
        id="rendeles"
        kicker="Így működik"
        title="Négy lépés a sódertől a kiszállításig"
        lead="Nincs kosár, nincs bonyolultság: hívás, egyeztetés, szállítás, átvétel."
      >
        <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
          <span aria-hidden="true" className="absolute top-[1.125rem] right-0 left-0 hidden h-px bg-line-strong md:block" />
          {RENDELES_LEPESEK.map((step, i) => (
            <li key={step.title} className="relative grid grid-cols-[2.25rem_1fr] gap-x-4 md:block">
              <span
                aria-hidden="true"
                className="num relative flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-paper font-display text-sm font-bold"
              >
                {i + 1}
              </span>
              <div className="md:mt-5">
                <h3 className="font-display text-heading-xs font-bold">{step.title}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ─── Hol szállítunk ─── */}
      <Section
        headingLevel={2}
        id="terulet"
        tone="sand"
        kicker="Hol szállítunk"
        title="Budapest délnyugati kapujától a környező településekig"
        lead="Három zóna, egyeztetett fuvardíjjal. Nem található a listában? Kérdezzen rá telefonon."
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <figure className="lg:col-span-6">
            <div className="rounded-sm border border-line-strong bg-paper p-3">
              <ZoneSketch />
            </div>
            <figcaption className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[2px] bg-brand-dark" />
              Telephely: {company.address.full} Tájékoztató zónák, nem jogi határok.
            </figcaption>
          </figure>

          <div className="lg:col-span-6">
            <ol className="border-t border-ink/80">
              {zones.map((z, i) => {
                const list = settlements.filter((s) => s.zone === z.id);
                return (
                  <li key={z.id} className="grid grid-cols-[2rem_1fr] gap-x-4 border-b border-line py-5">
                    <span aria-hidden="true" className="num flex h-8 w-8 items-center justify-center rounded-full border border-ink font-display text-sm font-bold">
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

      {/* ─── Miért mi ─── */}
      <Section
        headingLevel={2}
        id="miert-mi"
        layout="split"
        kicker="Miért mi"
        title="15+ év tapasztalat, saját flotta, depó Budafokon"
        lead="Ön elmondja, mire van szüksége, mi pedig segítünk a megoldásban."
      >
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {company.capabilities.map((cap) => (
            <li key={cap} className="flex gap-3 border-b border-line py-3.5">
              <IconCheck size={18} className="mt-0.5 shrink-0 text-moss" />
              <span className="text-[0.9375rem] leading-relaxed">{cap}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
          A megrendelések teljesítéséhez platós, billencs és konténeres
          teherautók állnak rendelkezésre; saját autóval vagy utánfutóval a
          telephelyi depóból is elviheti az anyagot. Hívjon minket bizalommal,
          és egyeztessük a részleteket!
        </p>
      </Section>

      {/* ─── Buda Konténer — testvér üzletág (zöld: funkcionális megkülönböztetés) ─── */}
      <section aria-labelledby="hulladek-cim" className="border-b border-line bg-paper">
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
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm border border-petrol px-5 font-semibold text-petrol-deep transition-colors hover:bg-petrol hover:text-paper"
          >
            {company.waste.domain}
          </a>
        </div>
      </section>

      {/* ─── GYIK + útmutatók ─── */}
      <Section
        headingLevel={2}
        id="gyik"
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

      {/* ─── Záró hívás ─── */}
      {/* data-call-region="zaro_cta": külön régió a hero-tól (metrics-plan §5). */}
      <section data-call-region="zaro_cta" aria-labelledby="zaro-cim" className="cta-end relative isolate overflow-hidden bg-sand">
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-80" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-12 md:px-6 md:py-20">
          <div className="md:col-span-7">
            <h2 id="zaro-cim" className="font-display text-[1.875rem] leading-[1.08] font-bold tracking-display text-balance md:text-heading-lg">
              Rendelne? Hívjon, és egyeztetjük a részleteket.
            </h2>
            <p className="mt-4 max-w-[56ch] text-[1.0625rem] leading-relaxed text-ink-soft">
              Mondja el, milyen anyagra, mennyire és hová van szüksége. Az árat és
              a szállítás időpontját telefonon pontosítjuk, előre tájékozódni
              pedig az árkalkulátorral tud.
            </p>
          </div>
          <div className="md:col-span-5 md:self-end">
            <PhoneLink className="num group flex items-center justify-between gap-4 border-y border-ink py-4 font-display text-[1.75rem] font-bold tracking-tight transition-colors hover:text-brand-deep md:text-[2.125rem]">
              {company.phone.display}
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-dark text-paper transition-colors group-hover:bg-brand-deep">
                <IconPhone size={20} />
              </span>
            </PhoneLink>
            <p className="mt-3 text-sm text-ink-soft">
              {company.hours.days}, {company.hours.time} · {company.address.full}
            </p>
            <CalculatorCta className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark">
              Inkább előbb kiszámolom: árkalkulátor
            </CalculatorCta>
          </div>
        </div>
      </section>
    </>
  );
}
