import type { Metadata } from "next";
import Link from "next/link";
import { LEGACY_GROUP_SLUGS } from "@/content/site";
import { withBasePath } from "@/lib/basepath";
import { pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

/**
 * ÖRÖKÖLT ÚTVONAL: /anyagok/bazalt → /anyagok/andezit
 *
 * A V3-ban a Bazalt kategória helyére a Nógrádkövesdi andezit került. A régi
 * útvonal NEM maradhat törött linkként, viszont statikus exportban (GitHub
 * Pages) nincs szerveroldali 301 — ezért ez az oldal:
 *  - `noindex, follow` (nem versenyez az új oldallal a keresőben),
 *  - meta refresh + látható, kattintható link (JS nélkül is működik).
 */
const TARGET = `/anyagok/${LEGACY_GROUP_SLUGS.bazalt}`;

export const metadata: Metadata = {
  ...pageMeta({
    title: "Bazalt helyett andezit",
    description:
      "A Bazalt kategória helyére a nógrádkövesdi andezit került a kínálatunkban. Átirányítjuk az andezit oldalára, ahol a frakciók és a bruttó árak megtalálhatók.",
    path: "/anyagok/bazalt",
  }),
  // Csak „noindex": így az Export QA sem indexelhetőként kezeli (az oldal
  // szándékosan kimarad a sitemapből). A követés alapértelmezetten megmarad.
  robots: { index: false },
};

export default function LegacyBazaltPage() {
  const href = withBasePath(`${TARGET}/`);
  return (
    <>
      {/* Statikus exportban ez a leggyorsabb, JS-független átirányítás. */}
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <Section
        kicker="Átnevezett kategória"
        title="A Bazalt helyére az Andezit került"
        lead="A kínálatunkban nógrádkövesdi andezit szerepel. Átirányítjuk az andezit oldalára — ha nem történik semmi, kattintson az alábbi linkre."
      >
        <Link href={TARGET} className="btn btn-primary">
          Tovább az Andezit oldalra
        </Link>
      </Section>
    </>
  );
}
