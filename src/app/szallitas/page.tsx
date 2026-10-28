import type { Metadata } from "next";
import Link from "next/link";
import {
  budapestDistricts,
  CASTLE_QUESTION,
  DISCLOSURE_PRICE,
  freightProfiles,
  FREIGHT_VAT_RATE,
  MIN_ORDER_M3,
  MULTI_TRIP_NOTICE,
  PERMIT_NOTICE,
  profileMaxM3,
  quoteOnlyAreas,
  RENDELES_LEPESEK,
  SINGLE_TRIP_MAX_M3,
  UNSUPPORTED_NOTICE,
} from "@/content/site";
import { formatFt, IconAlert, IconArrowRight, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import PostalTariffTable from "@/components/PostalTariffTable";

const freightMinNet = Math.min(...freightProfiles.flatMap((p) => p.bands.map((b) => b.netFee)));

export const metadata: Metadata = pageMeta({
  title: "Szállítás — fuvardíjak irányítószám szerint, nettó",
  description: `Billencs és konténeres szállítás saját flottával Budapest mind a ${budapestDistricts.length} kerületébe és Érdre. A fuvardíj az irányítószámtól és a mennyiségtől függ, négy sávban (≤2, 2–5, 5–7, 7–10 m³), nettó ${formatFt(freightMinNet)}-tól. Egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³.`,
  path: "/szallitas",
});

/** Azok a profilok, amelyeknél nagyobb mennyiségre nincs tarifa. */
const limitedProfiles = freightProfiles.filter(
  (p) => profileMaxM3(p) < SINGLE_TRIP_MAX_M3,
);

export default function SzallitasPage() {
  return (
    <Section
      kicker="Szállítás"
      title="Saját flottával, irányítószám szerinti fuvardíjjal"
      lead="Nem fuvarozót közvetítünk: saját autóinkkal szállítunk. A fuvar díját a szállítási cím irányítószáma és a szállított mennyiség határozza meg — minden fuvardíj nettó érték, tájékoztató jellegű."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Szállítás", path: "/szallitas" },
        ])}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          {/* ── Hogyan áll össze a díj ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">Hogyan áll össze a díj?</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              <li className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
                <p className="num font-display text-heading-sm font-bold text-accent-deep">01</p>
                <p className="mt-1 font-semibold">Anyag — bruttó</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Az anyagár bruttó Ft/m³, az ÁFÁ-t tartalmazza. Erre nem kerül még
                  egyszer ÁFA.
                </p>
              </li>
              <li className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
                <p className="num font-display text-heading-sm font-bold text-accent-deep">02</p>
                <p className="mt-1 font-semibold">Fuvar — nettó</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  A fuvardíj nettó, az irányítószám és a mennyiségi sáv szerint.
                </p>
              </li>
              <li className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
                <p className="num font-display text-heading-sm font-bold text-accent-deep">03</p>
                <p className="mt-1 font-semibold">
                  Fuvar ÁFA — {Math.round(FREIGHT_VAT_RATE * 100)}%
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  A nettó fuvardíjra ÁFA jön; a teljes bruttó összeg a kettő együtt.
                </p>
              </li>
            </ol>
            <Link href="/arkalkulator" className="btn btn-primary mt-5">
              Számolja ki az árkalkulátorral
              <IconArrowRight size={17} className="btn-icon btn-icon-move" />
            </Link>
          </div>

          {/* ── Sávhatárok ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">Mennyiségi sávok</h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
              A sávok felső határa zárt: a pontosan a határhoz tartozó mennyiség az adott
              sávba esik. Nincs átfedés és nincs rés a sávok között.
            </p>
            <ul className="num mt-4 grid gap-2 sm:grid-cols-4">
              {[
                { label: "≤ 2 m³", note: "legfeljebb 2 m³" },
                { label: "2–5 m³", note: "2 felett, 5-ig" },
                { label: "5–7 m³", note: "5 felett, 7-ig" },
                { label: "7–10 m³", note: "7 felett, 10-ig" },
              ].map((b) => (
                <li
                  key={b.label}
                  className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2.5"
                >
                  <p className="font-display font-bold">{b.label}</p>
                  <p className="font-sans text-xs text-ink-soft">{b.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex gap-2.5 rounded-sm border border-accent/45 bg-brand-soft px-3.5 py-3 text-sm leading-relaxed text-accent-deep">
              <IconAlert size={16} className="mt-0.5 shrink-0" />
              <span>
                A Budapest I. kerület sávjai eltérnek: ≤2, 2–5 és 5–8 m³. Ahol egy
                kerülethez nagyobb mennyiségre nincs tarifa, ott egyedi egyeztetés
                szükséges — kitalált árat nem adunk.
              </span>
            </p>
          </div>

          {/* ── Kereshető díjlista ── */}
          <div>
            <h2 id="fuvardijak" className="font-display text-heading-md font-bold">
              Fuvardíjak irányítószám szerint
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
              {freightProfiles.length} díjprofil. A kerület kiválasztása önmagában nem
              határozza meg a díjat — a fuvardíj alapja mindig a konkrét irányítószám.
            </p>
            <div className="mt-5">
              <PostalTariffTable />
            </div>
          </div>

          {/* ── Behajtási engedély ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">Behajtási engedély</h2>
            <p className="mt-3 max-w-[66ch] rounded-sm border-l-4 border-accent bg-page px-4 py-3.5 text-[0.9375rem] leading-relaxed">
              {PERMIT_NOTICE}
            </p>
            <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-surface p-4 md:p-5">
              <p className="font-semibold">I. kerület — a kalkulátor rákérdez:</p>
              <p className="num mt-1 font-display text-heading-xs font-bold">
                „{CASTLE_QUESTION}”
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Válasz: Igen · Nem · Nem tudom. Az „Igen” és a „Nem tudom” esetén külön
                egyeztetés szükséges: az engedély díja még nem ismert, ezért garantált
                végösszeget nem mutatunk — az ismert tételeket és a még nem ismert
                engedélydíjat külön jelezzük. A Várhoz tartozást nem döntjük el
                irányítószám alapján.
              </p>
            </div>
          </div>

          {/* ── Mennyiségi keretek ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">Mennyiségi keretek</h2>
            <ul className="mt-4 border-t border-line text-[0.9375rem] leading-relaxed">
              <li className="border-b border-line py-3.5">
                <strong>Minimum rendelés {MIN_ORDER_M3} m³.</strong> Ennél kisebb
                mennyiségről érdemes telefonon egyeztetni.
              </li>
              <li className="border-b border-line py-3.5">
                <strong>Egy fuvarban legfeljebb {SINGLE_TRIP_MAX_M3} m³.</strong>{" "}
                {MULTI_TRIP_NOTICE} Nagyobb mennyiség több fuvarban szállítható — a
                többfuvaros díjat egyeztetés után adjuk.
              </li>
              {limitedProfiles.length > 0 && (
                <li className="border-b border-line py-3.5">
                  <strong>Kerületi felső korlátok.</strong>{" "}
                  {limitedProfiles
                    .map((p) => `${p.label}: ${profileMaxM3(p)} m³`)
                    .join(" · ")}{" "}
                  — a felett egyedi egyeztetés.
                </li>
              )}
              <li className="border-b border-line py-3.5">
                <strong>Nem támogatott irányítószám.</strong> {UNSUPPORTED_NOTICE} A
                korábbi vidéki településekhez ({quoteOnlyAreas.map((a) => a.name).join(", ")})
                jelenleg nincs új tarifánk.
              </li>
            </ul>
          </div>

          {/* ── Mivel szállítunk ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">Mivel szállítunk?</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <li className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Billencs (billenő plató)</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Gyors lerakás pontos helyre — sóderhez, murvához, földhöz.
                </p>
              </li>
              <li className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Konténeres kivitel</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Keskenyebb helyekre, szigorúbb lerakási igény esetén.
                </p>
              </li>
            </ul>
          </div>

          {/* ── A kiszállítás menete ── */}
          <div>
            <h2 className="font-display text-heading-md font-bold">A kiszállítás menete</h2>
            <ol className="mt-4 border-t border-line">
              {RENDELES_LEPESEK.map((s, i) => (
                <li key={s.title} className="flex gap-4 border-b border-line py-4">
                  <span
                    aria-hidden="true"
                    className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink font-display text-sm font-bold"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                    {s.note && (
                      <p className="mt-2 border-l-4 border-accent pl-3 text-sm leading-relaxed">
                        {s.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft">{DISCLOSURE_PRICE}</p>
        </div>

        <aside className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28">
          <div
            data-call-region="szallitas"
            className="rounded-[var(--radius-md)] border border-line-strong bg-sand p-6"
          >
            <p className="text-sm font-medium text-ink-soft">Gyors kiszállás</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Budafok környékén a kiszállás gyakran aznap megtörténik. Budapest többi
              kerületében és Érden egyeztetett időpontban szállítunk.
            </p>
            <PhoneLink className="num btn btn-primary mt-4 w-full" />
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
            <p className="text-sm font-medium text-ink-soft">Legalacsonyabb fuvardíj</p>
            <p className="num mt-1 font-display text-heading-md font-bold">
              {formatFt(freightMinNet)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              nettó, egy fuvarra, ≤2 m³ sávban — a tényleges díj az irányítószámtól
              függ.
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
