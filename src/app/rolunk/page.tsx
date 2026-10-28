import type { Metadata } from "next";
import Link from "next/link";
import {
  company,
  materialGroups,
  ROLUNK,
  WASHED_KAVICS,
  WASHED_SODER,
} from "@/content/site";
import { IconArrowRight, IconCheck, IconDroplets, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Rólunk – Minőség minden szemcsében",
  description:
    "Gondosan osztályozott, kiváló minőségű építőanyagok. Sóderünk, kavicsunk és homokunk vizes osztályozási eljáráson megy keresztül — egyenletes szemcseméret, megbízható minőség magánépítkezőknek és kivitelezőknek.",
  path: "/rolunk",
});

/** A mosottság-állítás CSAK ezekre a csoportokra terjed ki (ügyféladat). */
const WASHED_GROUPS = ["soder", "kavics", "homok"];

export default function RolunkPage() {
  const washedNames = materialGroups
    .filter((g) => WASHED_GROUPS.includes(g.slug))
    .map((g) => g.name);

  return (
    <Section kicker="Rólunk" title={ROLUNK.title}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Rólunk", path: "/rolunk" },
        ])}
      />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* ── Szerkesztett törzsszöveg ── */}
        <div className="min-w-0 lg:col-span-7">
          <p className="about-lede max-w-[46ch] text-text">{ROLUNK.paragraphs[0]}</p>

          <div className="about-body mt-7 max-w-[62ch] text-[1.0625rem] leading-relaxed text-text-muted">
            {ROLUNK.paragraphs.slice(1).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <p className="about-pull">{ROLUNK.pullQuote}</p>

          <div className="mt-8 border-t border-border-strong pt-6" data-call-region="rolunk_cta">
            <p className="font-display text-heading-sm font-bold">{ROLUNK.closing}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <PhoneLink className="num btn btn-primary" />
              <Link href="/arak" className="btn btn-outline">
                Bruttó árlista
                <IconArrowRight size={17} className="btn-icon btn-icon-move" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Minőség-lépcső + jelölések ── */}
        <aside className="min-w-0 space-y-6 lg:col-span-5">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-card md:p-6">
            <h2 className="font-display text-heading-sm font-bold">A vizes osztályozás</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Így lesz a bányaanyagból egyenletes, megbízható építőanyag.
            </p>
            <ol className="quality-steps mt-4">
              <li>
                <p className="font-semibold">Mosás</p>
                <p className="mt-0.5 text-sm leading-relaxed text-text-muted">
                  Az eljárás segít eltávolítani a nem kívánt szennyeződéseket.
                </p>
              </li>
              <li>
                <p className="font-semibold">Osztályozás</p>
                <p className="mt-0.5 text-sm leading-relaxed text-text-muted">
                  Szemcseméret szerinti szétválasztás — így lesz egyenletesebb a
                  frakció.
                </p>
              </li>
              <li>
                <p className="font-semibold">Megbízható minőség</p>
                <p className="mt-0.5 text-sm leading-relaxed text-text-muted">
                  Kiszámítható anyag betonozáshoz, alapozáshoz és burkolat alá.
                </p>
              </li>
            </ol>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-card md:p-6">
            <h2 className="font-display text-heading-sm font-bold">Mire vonatkozik a jelölés?</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              <li className="flex gap-3">
                <IconDroplets size={17} className="mt-0.5 shrink-0 text-petrol-deep" />
                <span>
                  <strong className="font-semibold">{WASHED_SODER.label}</strong> — a teljes
                  sóderkínálatra.
                </span>
              </li>
              <li className="flex gap-3">
                <IconDroplets size={17} className="mt-0.5 shrink-0 text-petrol-deep" />
                <span>
                  <strong className="font-semibold">{WASHED_KAVICS.label}</strong> — a
                  frakcionált kavicsokra.
                </span>
              </li>
              <li className="flex gap-3">
                <IconCheck size={17} className="mt-0.5 shrink-0 text-text-muted" />
                <span>
                  Vizes osztályozás: {washedNames.join(", ")}. Kivétel a{" "}
                  <strong className="font-semibold">kulé</strong>: nagy szemcseméretű,
                  osztályozatlan anyag.
                </span>
              </li>
              <li className="flex gap-3">
                <IconCheck size={17} className="mt-0.5 shrink-0 text-text-muted" />
                <span>
                  A mosottság-állítás <strong className="font-semibold">nem</strong> terjed
                  ki a földre, a murvára és az andezitre.
                </span>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-text-muted">
              A jelölés terméktulajdonság, nem tanúsítvány: külön minőségi garanciát
              nem vállalunk rá.
            </p>
          </div>

          {/* ── Cégadatok (impresszum-hivatkozás megőrizve) ── */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted p-5 md:p-6">
            <h2 className="text-sm font-semibold text-text-muted">Üzemeltető és cégadatok</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-text-muted">Név</dt>
                <dd className="font-medium">{company.name}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Üzletág</dt>
                <dd className="font-medium">{company.businessUnit}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Adószám</dt>
                <dd className="num font-medium">{company.legal.taxNumber}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Cégjegyzékszám</dt>
                <dd className="num font-medium">{company.legal.registrationNumber}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Ügyfélfogadás</dt>
                <dd className="font-medium">
                  {company.hours.days}, {company.hours.time}
                </dd>
              </div>
              <div data-call-region="rolunk">
                <dt className="text-text-muted">Telefon</dt>
                <dd className="font-medium">
                  <PhoneLink className="num hover:text-brand-dark" />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">E-mail</dt>
                <dd className="font-medium break-all">{company.email}</dd>
              </div>
            </dl>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link href="/impresszum" className="link">
                Impresszum
              </Link>
              <Link href="/adatvedelem" className="link">
                Adatkezelési tájékoztató
              </Link>
            </p>
          </div>

          {/* ── Két üzletág, két oldal ── */}
          <div className="rounded-[var(--radius-lg)] border border-petrol/30 bg-surface p-5 md:p-6">
            <h2 className="font-display text-heading-sm font-bold">Két üzletág, két oldal</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Ezen az oldalon ömlesztett építőanyagot rendelhet: sódert, homokot,
              kavicsot, murvát, andezitet és földet. A hulladékszállítás külön
              üzletág —{" "}
              <a
                href={company.waste.url}
                className="font-semibold text-petrol-deep underline underline-offset-2"
              >
                {company.waste.domain}
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
