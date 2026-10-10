import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { company, findMaterialGroup, materialGroups } from "@/content/site";
import { formatFt, IconPlus, PhoneLink } from "@/lib/ui";
import { withBasePath } from "@/lib/basepath";
import { MaterialItemRows } from "@/components/MaterialLedger";
import { FractionLegend } from "@/components/FractionScale";
import { breadcrumbJsonLd, faqJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export function generateStaticParams() {
  return materialGroups.map((g) => ({ anyag: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ anyag: string }>;
}): Promise<Metadata> {
  const { anyag } = await params;
  const group = findMaterialGroup(anyag);
  if (!group) return {};
  const priced = group.items.filter((i) => i.priceNet !== null);
  const min = priced.length
    ? Math.min(...priced.map((i) => i.priceNet as number))
    : null;
  return pageMeta({
    title: `${group.name} szállítás Budapest XXII. kerület és környéke`,
    description: `${group.name}: ${group.short}. ${
      min ? `Nettó ár már ${formatFt(min)}/m³-től.` : "Ár egyeztetés után."
    } Kiszállítás Budafokról a XI. kerületbe, Érdre, Diósdra, Törökbálintra és környékére.`,
    path: `/anyagok/${group.slug}`,
  });
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ anyag: string }>;
}) {
  const { anyag } = await params;
  const group = findMaterialGroup(anyag);
  if (!group) notFound();

  const min = (() => {
    const priced = group.items.filter((i) => i.priceNet !== null);
    return priced.length ? Math.min(...priced.map((i) => i.priceNet as number)) : null;
  })();

  // Tárgyeset (V1 hiba volt: vak „-ot" toldalék → „murvaot", „földot")
  const ACCUSATIVE: Record<string, string> = {
    soder: "sódert",
    homok: "homokot",
    kavics: "kavicsot",
    murva: "murvát",
    bazalt: "bazaltot",
    fold: "földet",
  };
  const acc = ACCUSATIVE[group.slug] ?? group.name.toLowerCase();

  const materialFaq = [
    {
      q: `Mennyi a ${group.name.toLowerCase()} ára?`,
      a:
        min !== null
          ? `A ${group.name.toLowerCase()} ára a frakciótól függ, nettó ${formatFt(min)}/m³-től. Az árak tájékoztató jellegűek, ÁFA nélkül; a fuvar díja külön.`
          : `A ${group.name.toLowerCase()} árát egyeztetés után adjuk — hívja a ${company.phone.display} számot, vagy kérjen ajánlatot.`,
    },
    {
      q: `Szállítanak ${acc} Érdre, Diósdra, Törökbálintra?`,
      a: `Igen. ${group.name} kiszállítása a teljes szolgáltatási területre megoldható: Budapest XXII. és XI. kerülete, Érd, Diósd, Törökbálint, Csepel, Szigetszentmiklós és a távolabbi települések. A fuvar díja zónánként eltér.`,
    },
    {
      q: `Mekkora mennyiségben lehet ${acc} rendelni?`,
      a: "Minimum rendelés 4 m³, egy fuvarban legfeljebb 23 m³. Nagyobb mennyiség több fuvarban szállítható — erről egyeztetés után állapodunk meg.",
    },
  ];

  return (
    <Section
      kicker="Anyagok"
      title={`${group.name} szállítás`}
      lead={group.description}
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Anyagok", path: "/anyagok" },
          { name: group.name, path: `/anyagok/${group.slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(materialFaq)} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <div className="flex items-center gap-4">
            <img
              src={withBasePath(group.texture)}
              alt={group.textureAlt}
              width={64}
              height={64}
              className="h-16 w-16 rounded-sm border border-line object-cover"
            />
            <div>
              <h2 className="font-display text-heading-md font-bold">Tételek és árak</h2>
              <p className="num text-sm text-ink-soft">
                {group.items.length} tétel{min !== null ? `, nettó ${formatFt(min)}/m³-től` : ""}
              </p>
            </div>
          </div>
          <MaterialItemRows items={group.items} className="mt-5" />
          <p className="mt-3 text-sm text-ink-soft">
            Tájékoztató ár. A végleges ajánlatot egyeztetés után adjuk. A fuvar
            díja külön, a szállítási zóna szerint.
          </p>
          <FractionLegend />

          {/* A GYIK eddig csak JSON-LD-ben élt — V2-ben látható is (a strukturált adat így a látható tartalmat írja le) */}
          <h2 className="mt-12 font-display text-heading-md font-bold">Gyakori kérdések — {group.name.toLowerCase()}</h2>
          <div className="mt-4 border-t border-ink/80">
            {materialFaq.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium hover:text-brand-deep">
                  {f.q}
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong transition-transform group-open:rotate-45">
                    <IconPlus size={14} />
                  </span>
                </summary>
                <p className="details-body max-w-[68ch] pb-5 text-[0.9375rem] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <aside className="min-w-0 space-y-8 lg:col-span-4">
          <div className="rounded-sm border border-line-strong bg-sand p-6">
            <h2 className="font-display text-heading-sm font-bold">Mennyibe kerül kiszállítva?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Számolja ki anyagra, mennyiségre és helyszínre — három mező, azonnali
              tájékoztató ár.
            </p>
            <Link
              href={`/arkalkulator?anyag=${group.items[0]?.slug ?? ""}`}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-brand-dark px-5 font-semibold text-paper transition-colors hover:bg-brand-deep"
            >
              Árkalkulátor indítása
            </Link>
            <PhoneLink className="num mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-ink/70 px-5 font-semibold transition-colors hover:bg-ink hover:text-paper" />
          </div>
          <nav aria-label="Egyéb anyagcsoportok">
            <h2 className="text-sm font-medium text-ink-soft">Egyéb anyagcsoportok</h2>
            <ul className="mt-2 border-t border-line">
              {materialGroups
                .filter((g) => g.slug !== group.slug)
                .map((g) => (
                  <li key={g.slug} className="border-b border-line">
                    <Link href={`/anyagok/${g.slug}`} className="group flex min-h-12 items-center justify-between gap-3 py-2 font-medium hover:text-brand-deep">
                      <span className="flex items-center gap-3">
                        <img src={withBasePath(g.texture)} alt="" width={28} height={28} className="h-7 w-7 rounded-full border border-line object-cover" />
                        {g.name}
                      </span>
                      <span aria-hidden="true" className="text-ink-faint group-hover:text-brand-deep">›</span>
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
