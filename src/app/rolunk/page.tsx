import type { Metadata } from "next";
import { company } from "@/content/site";
import { PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Rólunk — Bau-Kont Logisztik Kft., ömlesztett anyag üzletág",
  description:
    "A Bau-Kont Logisztik Kft. Sóderárak üzletága ömlesztett építőanyagok értékesítésével és szállításával foglalkozik Budafokról, Budapest XXII. kerületéből.",
  path: "/rolunk",
});

export default function RolunkPage() {
  return (
    <Section
      kicker="Rólunk"
      title="Bau-Kont Logisztik Kft. — Sóderárak üzletág"
      lead="Ömlesztett építőanyagok értékesítése és szállítása Budafokról, Budapest XXII. kerületéből, a XI. kerületbe és a környező településekre."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Rólunk", path: "/rolunk" },
        ])}
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <div className="rounded-md border border-line bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Amit csinálunk</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              A {company.name} ömlesztett anyag üzletága sódert, homokot,
              kavicsot, murvát, bazaltot és földet értékesít és szállít
              lakossági és céges megrendelőknek. Megrendeléseinek teljesítéséhez
              több méretű és felépítményű teherautó áll rendelkezésre: billencs
              és konténeres kivitelben.
            </p>
          </div>

          <div className="rounded-md border border-line bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Két üzletág, két oldal</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-brand/30 bg-brand-soft p-4">
                <p className="font-semibold">Sóderárak — ez az oldal</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Ömlesztett építőanyag: sóder, homok, kavics, murva, bazalt,
                  föld. Rendelés telefonon vagy ajánlatkéréssel.
                </p>
              </div>
              <div className="rounded-md border border-line bg-sand p-4">
                <p className="font-semibold">Buda Konténer — hulladék</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Építési törmelék, sitt, vegyes és zöldhulladék konténer:{" "}
                  <a href={company.waste.url} className="font-medium underline underline-offset-2">
                    {company.waste.domain}
                  </a>
                  . A hulladékszállítás külön üzletág.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-line bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Amiben megbízhat</h2>
            <ul className="mt-4 space-y-3">
              {company.capabilities.map((c) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed">
                  <span aria-hidden="true" className="text-moss">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28">
          <div className="rounded-md border border-line bg-sand p-6 shadow-card">
            <p className="text-sm font-medium text-ink-soft">
              Cégadatok
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-ink-soft">Név</dt>
                <dd className="font-medium">{company.name}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Ügyfélfogadás</dt>
                <dd className="font-medium">
                  {company.hours.days}, {company.hours.time}
                </dd>
              </div>
              <div data-call-region="rolunk">
                <dt className="text-ink-soft">Telefon</dt>
                <dd className="font-medium">
                  <PhoneLink className="hover:text-brand-dark" />
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">E-mail</dt>
                <dd className="font-medium">{company.email}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </Section>
  );
}
