import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { company } from "@/content/site";
import type { MaterialGroup } from "@/content/site";
import LogoMark from "@/components/LogoMark";

/**
 * Közösségi (Open Graph) kártyák — 2026-11-21 „grafit" arculat.
 *
 * Egyetlen, egységes sötét elrendezés minden oldaltípusra (a weboldal sötét
 * témájához és új logójához igazítva): grafit alap, jobb felső meleg fény,
 * bal felül az S-embléma + „SÓDER ÁRAK / soderarak.hu" lockup, nagy fehér
 * cím narancs záróvonallal, alul legfeljebb három adatkártya és a
 * telefonszám. Kép: a flotta-fotó a kártya alján (alapértelmezés), anyag-
 * oldalakon az anyag fotója jobb oldalt. Minden üzleti adat a hívó oldaltól
 * (site.ts-ből) érkezik — a renderer nem talál ki értéket.
 *
 * A színek a `src/app/v3-dark.css` tokenjeinek másolatai (a renderer nem
 * olvas CSS-t): #131417 alap, #f1ede7 szöveg, #b5ada3 halvány, #fb7a1e /
 * #fb923c narancs.
 */

/** Dekoratív stíluskulcs (nem üzleti zónaadat — csak a címke szövegét választja). */
type OgZoneId = "mag" | "kozel" | "tavolabbi";

export const OG_SIZE = { width: 1200, height: 630 };

type Variant = "standard" | "materialIndex" | "material" | "areaIndex" | "settlement" | "guide" | "guideIndex" | "pricing" | "shipping" | "contact" | "company" | "notFound";

export type OgCardInput = {
  title: string;
  kicker?: string;
  highlight?: string;
  variant?: Variant;
  tone?: MaterialGroup["tone"];
  materials?: { name: string; tone: MaterialGroup["tone"] }[];
  guideTitles?: string[];
  subtitle?: string;
  count?: number;
  metricLabel?: string;
  metricValue?: string;
  zoneId?: OgZoneId;
  zoneName?: string;
  mapLabel?: string;
  leadTime?: string;
  contactPhone?: string;
  companyName?: string;
  companyUnit?: string;
  priceRange?: string;
  priceUnit?: string;
  priceCards?: { label: string; value: string; detail: string; tone: "amber" | "olive" | "stone" }[];
  zoneCards?: { label: string; area: string; price: string; id: OgZoneId }[];
  serviceSteps?: { number: string; title: string; detail: string }[];
  companyFacts?: { value: string; label: string }[];
  hours?: string;
};

const BG = "#131417";
const TEXT = "#f6f1ea";
const MUTED = "#c4bcb1";
const ORANGE = "#fb7a1e";
const ORANGE_SOFT = "#fdba74";

const KICKER: Record<Variant, string> = {
  standard: "ÖMLESZTETT ÉPÍTŐANYAG",
  materialIndex: "ANYAGOK · FRAKCIÓK · ÁRAK",
  material: "ANYAG",
  areaIndex: "KISZOLGÁLT TERÜLETEK",
  settlement: "HÁZHOZ SZÁLLÍTÁS",
  guide: "ÚTMUTATÓ",
  guideIndex: "ÚTMUTATÓK",
  pricing: "BRUTTÓ ÁRLISTA",
  shipping: "SZÁLLÍTÁS",
  contact: "KAPCSOLAT",
  company: "RÓLUNK",
  notFound: "404 · AZ OLDAL NEM TALÁLHATÓ",
};

const ZONE_LABEL: Record<OgZoneId, string> = {
  mag: "Kiszolgált terület",
  kozel: "Kiszolgált terület",
  tavolabbi: "Egyedi egyeztetés",
};

/* fotók build-időben, data URL-ként (a satori nem olvas webp-t; jpg-t igen) */
const photoCache = new Map<string, string>();
function photo(name: string): string {
  const hit = photoCache.get(name);
  if (hit) return hit;
  const buf = readFileSync(join(process.cwd(), "public", "og", `${name}.jpg`));
  const url = `data:image/jpeg;base64,${buf.toString("base64")}`;
  photoCache.set(name, url);
  return url;
}

type Chip = { label: string; value: string };

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]$/, "").trimEnd()}…`;
}

function chipsFor(input: OgCardInput): Chip[] {
  const v = input.variant ?? "standard";
  if (v === "pricing" && input.priceCards?.length) return input.priceCards.map((c) => ({ label: c.label, value: c.value }));
  if (v === "shipping" && input.serviceSteps?.length) return input.serviceSteps.map((s) => ({ label: `${s.number}. lépés`, value: s.title }));
  if (v === "company" && input.companyFacts?.length) return input.companyFacts.map((f) => ({ label: f.label, value: f.value }));
  if (v === "areaIndex" && input.zoneCards?.length) return input.zoneCards.map((z) => ({ label: z.label, value: z.area }));
  if (v === "materialIndex" && input.materials?.length) return [{ label: "Anyagok", value: input.materials.map((m) => m.name).join(" · ") }];
  if (v === "guideIndex" && input.guideTitles?.length) return input.guideTitles.slice(0, 2).map((t, i) => ({ label: `Útmutató ${i + 1}`, value: t }));
  const out: Chip[] = [];
  if (input.metricValue) out.push({ label: input.metricLabel ?? "Bruttó ár", value: input.metricValue });
  if (v === "settlement" && input.zoneId) out.push({ label: "Zóna", value: input.zoneName ?? ZONE_LABEL[input.zoneId] });
  if (input.leadTime) out.push({ label: "Szállítás", value: input.leadTime });
  if (input.priceRange) out.push({ label: input.priceUnit ?? "Ár", value: input.priceRange });
  if (input.highlight && !input.metricValue) out.push({ label: "Kiemelt", value: input.highlight });
  if (v === "contact") out.push({ label: "Hívható", value: input.hours ?? company.hours.short });
  return out;
}

function Lockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <LogoMark size={64} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", color: TEXT, fontFamily: "Grotesk", fontSize: 34, fontWeight: 700, letterSpacing: 0.4, lineHeight: 1 }}>SÓDER ÁRAK</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
          <div style={{ display: "flex", width: 22, height: 2, backgroundColor: ORANGE }} />
          <div style={{ display: "flex", color: MUTED, fontSize: 13, fontWeight: 600, letterSpacing: 4 }}>SODERARAK.HU</div>
          <div style={{ display: "flex", width: 22, height: 2, backgroundColor: ORANGE }} />
        </div>
      </div>
    </div>
  );
}

function OgDark({ input }: { input: OgCardInput }) {
  const v = input.variant ?? "standard";
  const material = v === "material" && input.tone ? input.tone : null;
  const chips = chipsFor(input).slice(0, 3);
  const titleSize = input.title.length > 40 ? 50 : input.title.length > 24 ? 58 : 68;
  const textWidth = material ? 620 : 600;
  const kicker = clip((input.kicker ?? KICKER[v]).toLocaleUpperCase("hu-HU"), 44);
  const subtitle = input.subtitle ? clip(input.subtitle, 150) : null;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", overflow: "hidden", backgroundColor: BG, color: TEXT, fontFamily: "Inter" }}>
      {/* kép */}
      {material ? (
        // eslint-disable-next-line @next/next/no-img-element -- satori-kép (OG renderer)
        <img src={photo(material)} width={560} height={630} alt="" style={{ position: "absolute", right: 0, top: 0, width: 560, height: 630, objectFit: "cover" }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- satori-kép (OG renderer)
        <img src={photo("flotta")} width={880} height={462} alt="" style={{ position: "absolute", left: 320, top: 168, width: 880, height: 462 }} />
      )}
      {/* olvashatósági fátylak */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: material ? `linear-gradient(90deg, ${BG} 0%, ${BG} 53%, rgba(19,20,23,0.5) 68%, rgba(19,20,23,0.05) 100%)` : `linear-gradient(90deg, ${BG} 0%, ${BG} 30%, rgba(19,20,23,0.78) 44%, rgba(19,20,23,0.2) 62%, rgba(19,20,23,0) 100%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(180deg, rgba(19,20,23,0.7) 0%, rgba(19,20,23,0) 26%, rgba(19,20,23,0) 70%, rgba(19,20,23,0.85) 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "radial-gradient(ellipse at 92% 0%, rgba(249,115,22,0.22), rgba(249,115,22,0) 48%)" }} />
      {/* felső narancs fényvonal */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, display: "flex", backgroundImage: "linear-gradient(90deg, #c2410c, #fb923c 50%, #c2410c)" }} />

      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 64px 46px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 10, backgroundColor: "#cc4a0e", color: "#fff", fontFamily: "Grotesk", fontSize: 22, fontWeight: 700 }}>
            {input.contactPhone ?? company.phone.display}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: textWidth }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: ORANGE_SOFT, fontSize: 17, fontWeight: 600, letterSpacing: 3 }}>
            <div style={{ display: "flex", width: 34, height: 3, backgroundColor: ORANGE }} />
            {kicker}
          </div>
          <div style={{ display: "flex", marginTop: 16, fontFamily: "Grotesk", fontSize: titleSize, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.5, color: TEXT }}>{input.title}</div>
          <div style={{ display: "flex", marginTop: 20, width: 96, height: 5, borderRadius: 4, backgroundImage: "linear-gradient(90deg, #c2410c, #fb923c)" }} />
          {subtitle ? <div style={{ display: "flex", marginTop: 18, color: MUTED, fontSize: 21, lineHeight: 1.38, width: textWidth - 40 }}>{subtitle}</div> : null}
        </div>

        <div style={{ display: "flex", alignItems: "stretch", gap: 14 }}>
          {chips.map((c) => (
            <div key={c.label + c.value} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, padding: "12px 18px", minWidth: 180, maxWidth: chips.length === 1 ? 720 : 340, borderRadius: 12, backgroundColor: "rgba(28,29,33,0.88)", border: "1px solid rgba(255,255,255,0.12)", borderTop: `3px solid ${ORANGE}` }}>
              <div style={{ display: "flex", color: MUTED, fontSize: 13, fontWeight: 600, letterSpacing: 1.5 }}>{c.label.toLocaleUpperCase("hu-HU")}</div>
              <div style={{ display: "flex", color: TEXT, fontFamily: "Grotesk", fontSize: 23, fontWeight: 700, lineHeight: 1.15 }}>{c.value}</div>
            </div>
          ))}
          {chips.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: MUTED, fontSize: 19, fontWeight: 600 }}>
              <div style={{ display: "flex", width: 40, height: 2, backgroundColor: ORANGE }} />
              {company.businessUnit} · {company.hours.short}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* betűk: Space Grotesk (címek) + Inter (szöveg), OFL — src/lib/og-fonts */
let fontCache: { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" }[] | null = null;
function fonts() {
  if (fontCache) return fontCache;
  const dir = join(process.cwd(), "src", "lib", "og-fonts");
  fontCache = [
    { name: "Grotesk", data: readFileSync(join(dir, "SpaceGrotesk-Bold.ttf")), weight: 700, style: "normal" },
    { name: "Inter", data: readFileSync(join(dir, "Inter-Regular.otf")), weight: 400, style: "normal" },
    { name: "Inter", data: readFileSync(join(dir, "Inter-SemiBold.otf")), weight: 600, style: "normal" },
  ];
  return fontCache;
}

export function ogCard(input: OgCardInput): ImageResponse {
  return new ImageResponse(<OgDark input={input} />, { ...OG_SIZE, fonts: fonts() });
}
