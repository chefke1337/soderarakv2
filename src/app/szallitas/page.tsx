import type { Metadata } from "next";
import { zones, RENDELES_LEPESEK, DISCLOSURE_PRICE, MAX_ORDER_VOLUME, MIN_ORDER_VOLUME } from "@/content/site";
import { formatFt, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

const zoneRangeEzer = (z: (typeof zones)[number]) =>
  `${(z.fuelMin / 1000).toLocaleString("hu-HU")}–${(z.fuelMax / 1000).toLocaleString("hu-HU")} e Ft`;

export const metadata: Metadata = pageMeta({
  title: "Szállítás — sóder és ömlesztett anyag fuvarozás Budafokról",
  description: `Billencs és konténeres szállítás Budafokról. Fuvar: ${zones[0].name} ${zoneRangeEzer(zones[0])}, a közeli településeken ${zoneRangeEzer(zones[1])}, a távolabb ${zoneRangeEzer(zones[2])}.`,
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
            <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
              A fuvar díja a zónától és a szállított mennyiségtől függ. 12 m³
              felett a fuvar díja külön egyeztetés tárgya — az alábbi összeg
              ott csak tájékoztató.
            </p>
            <div className="mt-6 space-y-8">
              {zones.map((z) => (
                <div key={z.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/80 pb-2">
                    <h3 className="font-display text-heading-xs font-bold">{z.name}</h3>
                    <p className="text-sm text-ink-soft">{z.area} · kiszállás {z.leadTime}</p>
                  </div>
                  <div className="mt-3 overflow-x-auto" role="region" aria-label={`${z.name} fuvarárai mennyiség szerint`} tabIndex={0}>
                    <table className="num w-full min-w-[360px] text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-ink-soft">
                          <th scope="col" className="py-2 pr-4 font-medium">Mennyiség</th>
                          <th scope="col" className="py-2 text-right font-medium">Fuvar (nettó)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {z.freightTiers.map((t) => (
                          <tr key={`${t.minQty}-${t.maxQty}`} className="border-b border-line/70">
                            <td className="py-2 pr-4">
                              {t.minQty}–{t.maxQty} m³
                              {t.needsNegotiation && (
                                <span className="ml-2 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-deep">
                                  Egyeztetés
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right font-semibold">{formatFt(t.fee)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-ink-soft">{DISCLOSURE_PRICE}</p>
          </div>

          <div>
            <h2 className="font-display text-heading-md font-bold">Mivel szállítunk?</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
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
            </ul>
          </div>

          <div>
            <h2 className="font-display text-heading-md font-bold">Mennyiségi keretek</h2>
            <ul className="mt-4 border-t border-line text-[0.9375rem] leading-relaxed">
              <li className="border-b border-line py-3.5">
                <strong>Minimum rendelés {MIN_ORDER_VOLUME} m³.</strong> Ennél kisebb mennyiségről
                érdemes telefonon egyeztetni.
              </li>
              <li className="border-b border-line py-3.5">
                <strong>Egy fuvarban legfeljebb {MAX_ORDER_VOLUME} m³.</strong> 12 m³ felett a
                fuvar díja külön egyeztetés tárgya.
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
        </aside>
      </div>
    </Section>
  );
}
