import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  budapestDistricts,
  company,
  findMaterialGroup,
  materialGroups,
  MIN_ORDER_M3,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { formatFt, IconDroplets, IconPlus, minPrice, PhoneLink } from "@/lib/ui";
import { withBasePath } from "@/lib/basepath";
import { MaterialItemRows, GrossPriceBanner } from "@/components/MaterialLedger";
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
  const min = minPrice(group.items);
  return pageMeta({
    title: `${group.name} szállítás Budapestre és Érdre`,
    description: `${group.name}: ${group.short}. ${
      min ? `Bruttó ár már ${formatFt(min)}/m³-től (ÁFÁ-val).` : "Ár egyeztetés után."
    } Kiszállítás Budapest mind a ${budapestDistricts.length} kerületébe és Érdre; a szállítási díjat az árkalkulátor számolja ki.`,
    path: `/anyagok/${group.slug}`,
  });
}

/** Tárgyeset (a V1-ben vak „-ot" toldalék hibát okozott: „murvaot", „földot"). */
const ACCUSATIVE: Record<string, string> = {
  soder: "sódert",
  homok: "homokot",
  kavics: "kavicsot",
  murva: "murvát",
  andezit: "andezitet",
  fold: "földet",
};

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ anyag: string }>;
}) {
  const { anyag } = await params;
  const group = findMaterialGroup(anyag);
  if (!group) notFound();

  const min = minPrice(group.items);
  const acc = ACCUSATIVE[group.slug] ?? group.name.toLowerCase();

  const materialFaq = [
    {
      q: `Mennyi a ${group.name.toLowerCase()} ára?`,
      a:
        min !== null
          ? `A ${group.name.toLowerCase()} ára a frakciótól függ, bruttó ${formatFt(min)}/m³-től — az ár az ÁFÁ-t tartalmazza, rá nem kerül még egyszer ÁFA. A fuvar díja külön, nettó értékben, az irányítószám és a mennyiség szerint.`
          : `A ${group.name.toLowerCase()} árát egyeztetés után adjuk — hívja a ${company.phone.display} számot, vagy küldjön rendelési igényt.`,
    },
    {
      q: `Szállítanak ${acc} Budapest minden kerületébe és Érdre?`,
      a: `Igen. ${group.name} kiszállítása Budapest mind a ${budapestDistricts.length} kerületébe és Érdre megoldható. A pontos szállítási díjat az árkalkulátor számolja ki; a Budapest I. kerületi Vár területén külön engedély és előzetes egyeztetés szükséges.`,
    },
    {
      q: `Mekkora mennyiségben lehet ${acc} rendelni?`,
      a: `Minimum rendelés ${MIN_ORDER_M3} m³, egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³. 10 m³ feletti mennyiséghez kérjen egyedi, többfuvaros ajánlatot.`,
    },
    ...(group.washed || group.washSummary
      ? [
          {
            q: `Mosott a ${group.name.toLowerCase()}?`,
            a: `${group.washSummary ?? group.washed!.detail} ${group.items
              .filter((i) => i.washNote)
              .map((i) => `${i.name}: ${i.washNote!.detail}`)
              .join(" ")} A jelölés terméktulajdonság, nem tanúsítvány.`.replace(/\s+/g, " "),
          },
        ]
      : []),
  ];

  return (
    <Section kicker="Anyagok" title={`${group.name} szállítás`} lead={group.description}>
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
            {/* Stilizált illusztráció — nem fotó (az alt is ezt mondja). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath(group.texture)}
              alt={group.textureAlt}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-sm border border-line object-cover"
            />
            <div className="min-w-0">
              <h2 className="font-display text-heading-md font-bold">Tételek és bruttó árak</h2>
              <p className="num text-sm text-ink-soft">
                {group.items.length} tétel
                {min !== null ? `, bruttó ${formatFt(min)}/m³-től` : ""}
              </p>
            </div>
          </div>

          {(group.washed || group.washSummary) && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-petrol-soft/50 px-3.5 py-2 text-sm font-semibold text-petrol-deep">
              <IconDroplets size={16} />
              {group.washSummary ?? group.washed!.label}
            </p>
          )}

          <GrossPriceBanner className="mt-5" />

          <MaterialItemRows items={group.items} className="mt-5" />

          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Tájékoztató ár. A végleges ajánlatot egyeztetés után adjuk. A fuvar díja
            külön, nettó értékben, a szállítási cím irányítószáma szerint.
          </p>
          <FractionLegend />

          <h2 className="mt-12 font-display text-heading-md font-bold">
            Gyakori kérdések — {group.name.toLowerCase()}
          </h2>
          <div className="mt-4 border-t border-ink/80">
            {materialFaq.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium hover:text-brand-deep">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong transition-transform group-open:rotate-45"
                  >
                    <IconPlus size={14} />
                  </span>
                </summary>
                <p className="details-body max-w-[68ch] pb-5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        <aside className="min-w-0 space-y-8 lg:col-span-4">
          <div className="rounded-sm border border-line-strong bg-sand p-6">
            <h2 className="font-display text-heading-sm font-bold">Mennyibe kerül kiszállítva?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Anyag, mennyiség, irányítószám — és látja a bruttó anyagárat, a nettó
              fuvardíjat, a fuvar ÁFÁ-ját és a teljes bruttó összeget.
            </p>
            <Link
              href={`/arkalkulator?anyag=${group.items[0]?.slug ?? ""}`}
              className="btn btn-primary mt-4 w-full"
            >
              Árkalkulátor indítása
            </Link>
            <PhoneLink className="num btn btn-outline mt-3 w-full" />
          </div>

          <nav aria-label="Egyéb anyagcsoportok">
            <h2 className="text-sm font-medium text-ink-soft">Egyéb anyagcsoportok</h2>
            <ul className="mt-2 border-t border-line">
              {materialGroups
                .filter((g) => g.slug !== group.slug)
                .map((g) => (
                  <li key={g.slug} className="border-b border-line">
                    <Link
                      href={`/anyagok/${g.slug}`}
                      className="group flex min-h-12 items-center justify-between gap-3 py-2 font-medium hover:text-brand-deep"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={withBasePath(g.texture)}
                          alt=""
                          width={28}
                          height={28}
                          className="h-7 w-7 shrink-0 rounded-full border border-line object-cover"
                        />
                        <span className="truncate">{g.name}</span>
                      </span>
                      <span aria-hidden="true" className="text-ink-faint group-hover:text-brand-deep">
                        ›
                      </span>
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
