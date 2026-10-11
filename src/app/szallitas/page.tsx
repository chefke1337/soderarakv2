import type { Metadata } from "next";
import { company, zones, RENDELES_LEPESEK, DISCLOSURE_PRICE } from "@/content/site";
import { PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Szállítás — sóder és ömlesztett anyag fuvarozás Budafokról",
  description:
    "Platós, billencs és konténeres szállítás Budafokról. Fuvar: Budafok környékén 12–22 e Ft, a közeli településeken 18–32 e Ft, a távolabb 25–45 e Ft.",
  path: "/szallitas",
});

export default function SzallitasPage() {
  return (
    <Section
      kicker="Szállítás"
      title="Saját flottával, zónánként egyeztetett fuvarárral"
      lead="Nem fuvarozót közvetítünk: saját autóinkkal szállítunk. A fuvar díja a mennyiségtől és a zónától függ — minden ár nettó, tájékoztató jellegű."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Szállítás", path: "/szallitas" },
        ])}
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          <div>
            <h2 className="font-display text-heading-md font-bold">Zónák és fuvarárak</h2>
            <div className="mt-4 overflow-x-auto border-t border-ink/80" role="region" aria-label="Szállítási zónák és fuvarárak táblázata" tabIndex={0}>
              <table className="w-full md:min-w-[560px] block md:table text-sm">
                <thead className="sr-only md:not-sr-only md:table-header-group">
                  <tr className="border-b border-line text-left text-sm text-ink-soft">
                    <th scope="col" className="pr-4 py-3.5 font-semibold">Zóna</th>
                    <th scope="col" className="pr-4 py-3.5 font-semibold">Terület</th>
                    <th scope="col" className="pr-4 py-3.5 font-semibold">Fuvar (nettó)</th>
                    <th scope="col" className="pr-4 py-3.5 font-semibold">Kiszállás</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group">
                  {zones.map((z) => (
                    <tr key={z.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-3.5 align-top md:table-row md:py-0">
                      <td className="pr-4 font-semibold md:table-cell md:py-3.5 md:font-medium">{z.name}</td>
                      <td className="order-3 w-full pr-4 text-ink-soft md:order-none md:table-cell md:w-auto md:py-3.5">{z.area}</td>
                      <td className="num order-2 font-semibold whitespace-nowrap md:order-none md:table-cell md:py-3.5 md:pr-4">
                        {(z.fuelMin / 1000).toLocaleString("hu-HU")}–
                        {(z.fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft
                      </td>
                      <td className="order-4 w-full pr-4 text-ink-soft md:order-none md:table-cell md:w-auto md:py-3.5"><span className="md:hidden">Kiszállás: </span>{z.leadTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-soft">{DISCLOSURE_PRICE}</p>
          </div>

          <div>
            <h2 className="font-display text-heading-md font-bold">Mivel szállítunk?</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <li className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Platós autó</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Nagyobb tétel kiszállításához szabadon lerakható anyagnál.
                </p>
              </li>
              <li className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Billencs (billenő plató)</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Gyors lerakás pontos helyre — sóderhez, murvához, földhöz.
                </p>
              </li>
              <li className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Konténeres kivitel</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Keskenyebb helyekre, szigorúbb lerakási igény esetén.
                </p>
              </li>
              <li className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Depó — telephelyi átvétel</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Saját autóval vagy utánfutóval is átvehető az anyag a
                  budafoki telephelyen ({company.hours.short}).
                </p>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-heading-md font-bold">Mennyiségi keretek</h2>
            <ul className="mt-4 border-t border-line text-[0.9375rem] leading-relaxed">
              <li className="border-b border-line py-3.5">
                <strong>Minimum rendelés 4 m³.</strong> Ennél kisebb mennyiségről
                érdemes telefonon egyeztetni.
              </li>
              <li className="border-b border-line py-3.5">
                <strong>Egy fuvarban legfeljebb 23 m³.</strong> Nagyobb mennyiséget
                több fuvarban szállítunk — erre külön egyeztetés szükséges.
              </li>
              <li className="border-b border-line py-3.5">
                <strong>A fuvar ára függ</strong> az egyszerre szállított mennyiségtől,
                a gyakoriságtól és a helyszíni terepviszonyoktól.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-heading-md font-bold">A kiszállítás menete</h2>
            <ol className="mt-4 border-t border-line">
              {RENDELES_LEPESEK.map((s, i) => (
                <li key={s.title} className="flex gap-4 border-b border-line py-4">
                  <span aria-hidden="true" className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink font-display text-sm font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{s.text}</p>
                    {s.note && <p className="mt-2 border-l-4 border-accent pl-3 text-sm">{s.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28">
          <div data-call-region="szallitas" className="rounded-sm border border-line-strong bg-sand p-6">
            <p className="text-sm font-medium text-ink-soft">
              Gyors kiszállás
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Budafok környékén — Budapest XXII. és XI. kerület vonalán — a kiszállás
              gyakran aznap megtörténik.
            </p>
            <PhoneLink className="num mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-brand-dark px-5 font-semibold text-paper transition-colors hover:bg-brand-deep" />
          </div>
          <div className="border-t border-ink/80 pt-4">
            <p className="text-sm font-medium text-ink-soft">
              Telephely
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {company.address.full}
              <br />
              {company.hours.short}
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
