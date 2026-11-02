import type { Metadata } from "next";
import Link from "next/link";
import {
  budapestDistricts,
  CASTLE_QUESTION,
  DISCLOSURE_PRICE,
  FREIGHT_PUBLIC_NOTICE,
  FREIGHT_VAT_RATE,
  MIN_ORDER_M3,
  MULTI_TRIP_NOTICE,
  PERMIT_NOTICE,
  quoteOnlyAreas,
  RENDELES_LEPESEK,
  SINGLE_TRIP_MAX_M3,
  SZALLITAS_INTRO,
  UNSUPPORTED_NOTICE,
} from "@/content/site";
import { IconArrowRight, IconCalculator, IconCheck, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Szállítás — sóder, homok, kavics, murva, andezit és föld házhoz",
  description: `Ömlesztett építőanyagok gyors és megbízható házhoz szállítása Budapest mind a ${budapestDistricts.length} kerületébe és Érdre, lakossági és vállalkozói megrendelésre. Egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³; a pontos szállítási díjat az árkalkulátor számolja ki.`,
  path: "/szallitas",
});

export default function SzallitasPage() {
  return (
    <Section
      kicker="Házhoz szállítás"
      title={SZALLITAS_INTRO.title}
      lead={SZALLITAS_INTRO.paragraphs[0]}
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Szállítás", path: "/szallitas" },
        ])}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          {/* ── Bevezető: jóváhagyott ügyfélszöveg (2026-11-02) ── */}
          <div className="ship-intro">
            <p className="max-w-[62ch] text-[1.0625rem] leading-relaxed text-ink-soft">
              {SZALLITAS_INTRO.paragraphs[1]}
            </p>
            <h2 className="mt-7 font-display text-heading-sm font-bold">
              {SZALLITAS_INTRO.listTitle}
            </h2>
            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {SZALLITAS_INTRO.list.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3 text-[0.9375rem] leading-snug font-medium"
                >
                  <IconCheck size={18} className="mt-0.5 shrink-0 text-accent-deep" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
              Az aznapi kiszállítás a szabad kapacitástól függ — telefonon egyeztetjük. Egy
              fuvarban legfeljebb {SINGLE_TRIP_MAX_M3} m³ szállítható; ennél nagyobb mennyiség
              több fuvarban, egyeztetés után.
            </p>
          </div>

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
                  A szállítási díj nettó; az összeget a kalkulátor a megadott címre és
                  mennyiségre számolja ki.
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

          {/* ── Szállítási díj: nyilvános díjtábla helyett (ügyfél, 2026-11-02) ── */}
          <div id="fuvardijak" className="scroll-mt-28 rounded-[var(--radius-md)] border border-border-strong bg-surface p-5 md:p-6">
            <h2 className="font-display text-heading-md font-bold">Szállítási díj</h2>
            <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed">{FREIGHT_PUBLIC_NOTICE}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/arkalkulator" className="btn btn-primary">
                <IconCalculator size={17} />
                Árkalkulátor
              </Link>
              <PhoneLink className="num btn btn-outline" />
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
              <li className="border-b border-line py-3.5">
                <strong>Egyes címeknél kisebb a fuvaronkénti keret.</strong> Ha a megadott
                címre és mennyiségre nincs egyfuvaros díj, a kalkulátor egyedi egyeztetést
                jelez — kitalált árat nem adunk.
              </li>
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
            <p className="text-sm font-medium text-ink-soft">Szállítási díj</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Az anyag, a mennyiség és a cím megadása után a kalkulátor kiszámolja a nettó
              szállítási díjat, az ÁFÁ-t és a teljes bruttó tájékoztató összeget.
            </p>
            <Link href="/arkalkulator" className="btn btn-outline mt-4 w-full">
              Árkalkulátor
              <IconArrowRight size={17} className="btn-icon btn-icon-move" />
            </Link>
          </div>
        </aside>
      </div>
    </Section>
  );
}
