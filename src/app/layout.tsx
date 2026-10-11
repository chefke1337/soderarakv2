import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileCallBar from "@/components/MobileCallBar";
import ScrollSensor from "@/components/ScrollSensor";
import { AnalyticsBanner } from "@/components/Analytics";
import { absoluteUrl, company, DISCLOSURE_NET, DISCLOSURE_PRICE, settlements } from "@/content/site";
import { GSC_VERIFICATION } from "@/lib/analytics";
import { JsonLd } from "@/lib/meta";
import { SHARE } from "@/lib/share";

export const viewport: Viewport = {
  themeColor: "#fbf8f2",
};

// Display-típus: Space Grotesk (geometrikus groteszk, tiszta vágások — a visszajelzés szerinti
// szecessziós szerifs helyett). Latin-ext: teljes magyar karakterkészlet.
// preload: MINDKÉT fonton KI — mért regresszió (2026-10-03 A/B, 2/2 konzisztens):
// a preload linkek priority:High-jal a CSS elé rendeződnek a kérés-sorban, így
// FCP 0.9→1.8s, LCP 2.0→3.5s (pontszám 95→90). A TBT/CLS javulás (190→40ms, 0,07→0)
// ellenére a súlyozott pontszám rosszabb — tehát a font-preload NEM nyertes.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-grotesk",
  // display "swap" — a mért A/B (2026-10-03) szerint az "optional" NEM veszi le a
  // LCP betű-láncát (LCP 1809–1959 mindkét esetben, pontszám 95 = változatlan),
  // cserébe lassú kapcsolaton fallback-fejsorokat okozna → a swap a nyertes.
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "optional",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  // Csak az origin: a Next a fájl-konvenciós metaadat-útvonalakhoz (opengraph-image)
  // maga teszi hozzá a basePath-ot — különben /soderarakv2/soderarakv2/… lenne.
  metadataBase: new URL(new URL(company.site.url).origin),
  // A default a főoldalé (a page.tsx nem ad saját metaadatot): a megosztási
  // előnézettel azonos szöveg, mert az export-QA og:title = title és
  // twitter:description = description egyezést követel.
  title: {
    default: SHARE.title,
    template: "%s | Sóderárak",
  },
  description: SHARE.description,
  alternates: { canonical: absoluteUrl("/") },
  // V2 = alternatív preview: ne versenyezzen az eredeti oldallal a keresőben.
  // (A noindex nem hozzáférés-védelem; a robots.txt szándékosan NEM tilt,
  // különben a keresők nem látnák ezt a meta-jelzést.)
  robots: { index: false, follow: true },
  ...(GSC_VERIFICATION
    ? { verification: { google: GSC_VERIFICATION } }
    : {}),
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: SHARE.siteName,
    url: `${company.site.url}/`,
    title: SHARE.title,
    description: SHARE.description,
    images: [SHARE.image],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE.title,
    description: SHARE.description,
    images: [{ url: SHARE.image.url, width: SHARE.image.width, height: SHARE.image.height, alt: SHARE.image.alt }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${company.site.url}/#business`,
  name: `${company.site.name} — ${company.name}`,
  telephone: company.phone.display,
  email: company.email,
  url: `${company.site.url}/`,
  image: `${company.site.url}/icon.svg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: company.address.street,
    postalCode: company.address.postalCode,
    addressLocality: company.address.city,
    addressCountry: "HU",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      ...company.hours.schema,
    },
  ],
  areaServed: settlements.map(({ name }) => ({ "@type": "Place", name })),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <Header />
        <main id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
        <MobileCallBar />
        <ScrollSensor />
        <AnalyticsBanner />
        <JsonLd data={jsonLd} />
        <p className="sr-only">
          {DISCLOSURE_PRICE} {DISCLOSURE_NET}
        </p>
      </body>
    </html>
  );
}
