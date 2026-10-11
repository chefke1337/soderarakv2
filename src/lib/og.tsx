import { ImageResponse } from "next/og";
import { company } from "@/content/site";
import type { MaterialGroup, Zone } from "@/content/site";

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
  zoneId?: Zone["id"];
  zoneName?: string;
  mapLabel?: string;
  leadTime?: string;
  contactPhone?: string;
  companyName?: string;
  companyUnit?: string;
  priceRange?: string;
  priceUnit?: string;
  priceCards?: { label: string; value: string; detail: string; tone: "amber" | "olive" | "stone" }[];
  zoneCards?: { label: string; area: string; price: string; id: Zone["id"] }[];
  serviceSteps?: { number: string; title: string; detail: string }[];
  companyFacts?: { value: string; label: string }[];
  hours?: string;
};

const MATERIAL_STYLE: Record<NonNullable<OgCardInput["tone"]>, { paper: string; accent: string; ink: string; stone: string; glow: string }> = {
  soder: { paper: "#f2e9d8", accent: "#c2410c", ink: "#1c1917", stone: "#c2ad88", glow: "#f8f1e2" },
  homok: { paper: "#f6e8c8", accent: "#b45309", ink: "#1c1917", stone: "#d6b98a", glow: "#fbf4e0" },
  kavics: { paper: "#dfeae7", accent: "#0f766e", ink: "#12403b", stone: "#8fb8b1", glow: "#f0f6f4" },
  murva: { paper: "#eae8e1", accent: "#57534e", ink: "#1c1917", stone: "#a8a29e", glow: "#f5f4ef" },
  bazalt: { paper: "#292524", accent: "#f97316", ink: "#faf6ef", stone: "#57534e", glow: "#837f7a" },
  fold: { paper: "#e8ecd6", accent: "#3f6212", ink: "#1c1917", stone: "#a3b18a", glow: "#f4f7e6" },
};

const ZONE_STYLE: Record<NonNullable<OgCardInput["zoneId"]>, { accent: string; wash: string; label: string }> = {
  mag: { accent: "#c2410c", wash: "#ffedd5", label: "BUDAFOK ÉS KÖRNYÉKE" },
  kozel: { accent: "#ea580c", wash: "#fdf0e0", label: "KÖZELI AGGLOMERÁCIÓ" },
  tavolabbi: { accent: "#f97316", wash: "#fdf3e7", label: "TÁVOLABBI AGGLOMERÁCIÓ" },
};

const GRAIN_POINTS = [
  [34, 38, 46], [114, 32, 30], [206, 50, 52], [282, 42, 32],
  [66, 112, 35], [154, 104, 58], [258, 116, 42], [324, 132, 25],
  [28, 196, 42], [110, 184, 26], [204, 194, 48], [298, 208, 37],
  [72, 276, 38], [166, 278, 50], [266, 286, 30], [332, 286, 42],
] as const;
const FRAGMENT_POINTS = [
  [38, 46, 56], [132, 30, 36], [234, 44, 62], [306, 52, 40],
  [72, 128, 38], [174, 112, 68], [276, 128, 52],
  [28, 216, 54], [128, 208, 42], [230, 220, 58], [316, 228, 36],
  [76, 300, 42], [184, 292, 64], [286, 304, 50],
] as const;

const INK = "#1c1917";
const MUTED = "#57534e";
const PAPER = "#faf6ef";
const PRICE_TONE: Record<NonNullable<OgCardInput["priceCards"]>[number]["tone"], { bg: string; accent: string }> = {
  amber: { bg: "#ffedd5", accent: "#c2410c" },
  olive: { bg: "#eef2dc", accent: "#3f6212" },
  stone: { bg: "#e4efec", accent: "#0f766e" },
};

function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#1a1614", border: "2px solid #f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#f97316", fontSize: 28, fontWeight: 800 }}>S</div>
      <div style={{ display: "flex", flexDirection: "row", color: dark ? "#1c1917" : "#faf6ef", fontSize: 27, fontWeight: 750, letterSpacing: -0.4 }}>{company.site.name}</div>
    </div>
  );
}

function MaterialArtwork({ tone }: { tone: NonNullable<OgCardInput["tone"]> }) {
  const palette = MATERIAL_STYLE[tone];
  const angular = tone === "murva" || tone === "bazalt";
  const points = angular ? FRAGMENT_POINTS : GRAIN_POINTS;
  const shapeColor = [palette.stone, palette.glow, palette.accent];
  return (
    <div style={{ position: "absolute", right: 54, top: 130, display: "flex", flexDirection: "column", width: 390, height: 390, borderRadius: 30, overflow: "hidden", backgroundColor: palette.paper, backgroundImage: `radial-gradient(ellipse at 30% 24%, ${palette.glow}, ${palette.paper} 72%)`, border: `1px solid ${palette.accent}55` }}>
      <div style={{ position: "absolute", width: 310, height: 310, left: 40, top: 40, borderRadius: "50%", border: `1px solid ${palette.accent}66`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 238, height: 238, borderRadius: "50%", display: "flex", backgroundColor: palette.stone, backgroundImage: `radial-gradient(ellipse at 28% 23%, ${palette.glow}, ${palette.stone} 76%)`, border: `9px solid ${palette.paper}`, boxShadow: `0 20px 45px ${palette.ink}30` }} />
      </div>
      {points.map(([x, y, size], index) => (
        <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: size, height: angular ? size * 0.76 : size * 0.82, borderRadius: angular ? 8 : "50%", ...(angular ? { transform: `rotate(${index % 2 ? 28 : -18}deg)` } : {}), backgroundColor: shapeColor[index % shapeColor.length], border: `3px solid ${palette.paper}`, boxShadow: `0 6px 14px ${palette.ink}22` }} />
      ))}
      <div style={{ position: "absolute", left: 24, bottom: 20, display: "flex", color: palette.ink, fontSize: 12, fontWeight: 700, letterSpacing: 2.4 }}>ANYAGMINTA · {tone.toUpperCase()}</div>
    </div>
  );
}

function MaterialIndexCard({ input }: { input: OgCardInput }) {
  const materials = input.materials ?? [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: PAPER, color: INK, fontFamily: "sans-serif", padding: "46px 64px", backgroundImage: "radial-gradient(ellipse at 88% 14%, rgba(15,118,110,0.07), transparent 44%), radial-gradient(ellipse at 100% 58%, rgba(249,115,22,0.07), transparent 42%)" }}>
      <div style={{ position: "absolute", right: -80, top: -170, width: 500, height: 500, borderRadius: "50%", border: "1px solid #0f766e26" }} />
      <div style={{ position: "absolute", right: -20, top: -115, width: 390, height: 390, borderRadius: "50%", border: "1px solid #c2410c26" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 1030 }}>
          <BrandMark dark />
          <div style={{ display: "flex", color: "#c2410c", fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>ANYAGTÉRKÉP</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 510, display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", color: "#c2410c", fontSize: 16, fontWeight: 800, letterSpacing: 2.5 }}>VÁLASZTÉK · FRAKCIÓK · ÁRAK</div>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.4 }}>{input.title}</div>
            {input.subtitle ? <div style={{ display: "flex", color: "#57534e", fontSize: 19, lineHeight: 1.3 }}>{input.subtitle}</div> : null}
          </div>
          <div style={{ width: 420, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {materials.map((material, index) => {
              const palette = MATERIAL_STYLE[material.tone];
              return (
                <div key={material.tone} style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: 200, height: 112, padding: 14, borderRadius: 16, overflow: "hidden", backgroundColor: palette.paper, border: `1px solid ${palette.accent}55` }}>
                  <div style={{ position: "absolute", right: -17, top: -22, width: 100, height: 100, borderRadius: "50%", backgroundColor: palette.stone, border: `8px solid ${palette.glow}` }} />
                  <div style={{ position: "relative", display: "flex", color: palette.accent, fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>ANYAG · 0{index + 1}</div>
                  <div style={{ position: "relative", display: "flex", color: palette.ink, fontSize: 18, fontWeight: 800 }}>{material.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#57534e", fontSize: 16, fontWeight: 700 }}>
          <div style={{ width: 44, height: 2, backgroundColor: "#c2410c" }} />
          <div style={{ display: "flex" }}>{input.highlight ?? "Nettó árak · fuvar külön"}</div>
        </div>
      </div>
    </div>
  );
}

function MaterialCard({ input }: { input: OgCardInput }) {
  const tone = input.tone ?? "soder";
  const palette = MATERIAL_STYLE[tone];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: palette.paper, color: palette.ink, fontFamily: "sans-serif", padding: "46px 64px" }}>
      <div style={{ position: "absolute", right: -85, top: -190, width: 490, height: 490, borderRadius: "50%", border: `1px solid ${palette.accent}30` }} />
      <div style={{ position: "absolute", right: -28, top: -138, width: 390, height: 390, borderRadius: "50%", border: `1px solid ${palette.accent}30` }} />
      <MaterialArtwork tone={tone} />
      <div style={{ position: "relative", width: 720, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: 1030 }}><BrandMark dark />          <div style={{ display: "flex", color: palette.accent, fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>ANYAGKATALÓGUS</div>
</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div style={{ display: "flex", color: palette.accent, fontSize: 17, fontWeight: 800, letterSpacing: 3.5, textTransform: "uppercase" }}>{input.kicker ?? "ÖMlesztett anyag"}</div>
          <div style={{ display: "flex", maxWidth: 690, fontSize: input.title.length > 34 ? 59 : 72, lineHeight: 1.02, fontWeight: 800, letterSpacing: -2.5 }}>{input.title}</div>
          {input.subtitle ? <div style={{ display: "flex", maxWidth: 670, color: `${palette.ink}bb`, fontSize: 21, lineHeight: 1.3 }}>{input.subtitle}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><div style={{ display: "flex", color: palette.accent, fontSize: 12, fontWeight: 800, letterSpacing: 2.5 }}>{input.metricLabel ?? "NETTÓ ÁR"}</div><div style={{ display: "flex", color: palette.ink, fontSize: 31, fontWeight: 800 }}>{input.metricValue ?? input.highlight ?? "Ajánlat egyeztetés után"}</div></div>
          <div style={{ marginBottom: 4, height: 40, width: 1, backgroundColor: `${palette.ink}44` }} />
          <div style={{ display: "flex", color: `${palette.ink}bb`, fontSize: 16, fontWeight: 600 }}>{input.count ?? 0} tétel · Sóderárak</div>
        </div>
      </div>
    </div>
  );
}

function SettlementMap({ input }: { input: OgCardInput }) {
  const zone = ZONE_STYLE[input.zoneId ?? "mag"];
  const roads = [
    { left: 15, top: 95, width: 360, height: 9, rotate: -17 },
    { left: 3, top: 200, width: 420, height: 8, rotate: 12 },
    { left: 83, top: 12, width: 9, height: 340, rotate: 11 },
    { left: 257, top: -8, width: 8, height: 380, rotate: -13 },
    { left: 36, top: 260, width: 390, height: 7, rotate: -6 },
  ];
  return (
    <div style={{ position: "absolute", right: 56, top: 136, display: "flex", flexDirection: "column", width: 390, height: 360, borderRadius: 28, overflow: "hidden", backgroundColor: zone.wash, border: `1px solid ${zone.accent}55` }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 56% 46%, #ffffffaa, ${zone.wash} 74%)` }} />
      {roads.map((road, index) => <div key={index} style={{ position: "absolute", left: road.left, top: road.top, width: road.width, height: road.height, transform: `rotate(${road.rotate}deg)`, borderRadius: 20, backgroundColor: index % 2 === 0 ? "#ffffffa8" : `${zone.accent}2b` }} />)}
      <div style={{ position: "absolute", left: 70, top: 57, width: 220, height: 220, borderRadius: "50%", border: `1px solid ${zone.accent}4d`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 145, height: 145, borderRadius: "50%", border: `1px solid ${zone.accent}66`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", backgroundColor: zone.accent, border: "8px solid #faf6ef", boxShadow: `0 4px 18px ${zone.accent}55` }} /></div>
      </div>
      <div style={{ position: "absolute", left: 19, top: 18, display: "flex", fontSize: 11, fontWeight: 800, letterSpacing: 2.2, color: zone.accent }}>ZÓNATÉRKÉP · SEMATIKUS</div>
      <div style={{ position: "absolute", bottom: 22, left: 22, right: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1c1917", fontSize: 11, fontWeight: 800, letterSpacing: 1.3 }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#1a1614", border: "2px solid #fff" }} /><div style={{ display: "flex" }}>BUDAFOK</div></div>
        <div style={{ height: 2, flex: 1, margin: "0 10px", backgroundColor: zone.accent }} />
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, color: "#1c1917", fontSize: (input.mapLabel ?? input.title).length > 16 ? 9 : 11, fontWeight: 800, letterSpacing: (input.mapLabel ?? input.title).length > 16 ? 0.2 : 1.1 }}>
          <div style={{ display: "flex" }}>{input.mapLabel ?? input.title.toLocaleUpperCase("hu-HU")}</div><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: zone.accent, border: "2px solid #fff" }} />
        </div>
      </div>
    </div>
  );
}

function AreaIndexCard({ input }: { input: OgCardInput }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#faf6ef", color: "#1c1917", fontFamily: "sans-serif", padding: "46px 64px" }}>
      <div style={{ position: "absolute", right: 72, top: 106, width: 390, height: 390, borderRadius: "50%", backgroundColor: "#d9ebe7", border: "1px solid #0f766e33", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", backgroundColor: "#ffedd5", border: "1px solid #ea580c33", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 205, height: 205, borderRadius: "50%", backgroundColor: "#ffe7cc", border: "1px solid #c2410c44", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 68, height: 68, borderRadius: "50%", backgroundColor: "#1a1614", border: "12px solid #faf6ef", boxShadow: "0 10px 28px #00000033" }} /></div></div>
      </div>
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 1030 }}><BrandMark dark /><div style={{ display: "flex", flexDirection: "row", color: "#0f766e", fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>SZOLGÁLTATÁSI TERÜLET</div></div>
        <div style={{ width: 650, display: "flex", flexDirection: "column", gap: 15 }}><div style={{ display: "flex", color: "#0f766e", fontSize: 17, fontWeight: 800, letterSpacing: 3.2 }}>BUDAFOKRÓL · BUDAPEST DÉLNYUGAT</div><div style={{ display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.5 }}>{input.title}</div><div style={{ display: "flex", color: "#57534e", fontSize: 22, lineHeight: 1.35 }}>{input.subtitle}</div></div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 18 }}><div style={{ display: "flex", color: "#1c1917", fontSize: 28, fontWeight: 800 }}>{input.count} település</div><div style={{ height: 34, width: 1, backgroundColor: "#1c191744" }} /><div style={{ display: "flex", color: "#57534e", fontSize: 17, fontWeight: 700 }}>3 egyeztetett zóna</div></div>
      </div>
    </div>
  );
}

function SettlementCard({ input }: { input: OgCardInput }) {
  const zone = ZONE_STYLE[input.zoneId ?? "mag"];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: PAPER, color: INK, fontFamily: "sans-serif", padding: "46px 64px" }}>
      <div style={{ position: "absolute", right: -120, bottom: -240, width: 570, height: 570, borderRadius: "50%", border: `1px solid ${zone.accent}33` }} />
      <SettlementMap input={input} />        <div style={{ position: "relative", width: 700, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><BrandMark dark /><div style={{ height: 28, width: 1, backgroundColor: "#1c191744" }} /><div style={{ display: "flex", color: zone.accent, fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>{input.zoneName ?? zone.label}</div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ display: "flex", color: zone.accent, fontSize: 15, fontWeight: 800, letterSpacing: 2.6 }}>KISZÁLLÍTÁS · {input.zoneName}</div><div style={{ display: "flex", width: 650, fontSize: input.title.length > 30 ? 50 : input.title.length > 22 ? 56 : 68, lineHeight: 1.03, fontWeight: 800, letterSpacing: -2.2 }}>{input.title}</div><div style={{ display: "flex", maxWidth: 620, color: "#57534e", fontSize: 22, lineHeight: 1.35 }}>{input.subtitle ?? "Sóder és ömlesztett építőanyag szállítás Budafokról."}</div></div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22 }}><div style={{ display: "flex", flexDirection: "column", gap: 4 }}><div style={{ display: "flex", color: zone.accent, fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>{input.metricLabel ?? "FUVAR · EGY FUVARRA"}</div><div style={{ display: "flex", color: "#1c1917", fontSize: 30, fontWeight: 800 }}>{input.metricValue ?? input.highlight}</div></div><div style={{ marginBottom: 5, height: 38, width: 1, backgroundColor: "#1c191744" }} /><div style={{ display: "flex", maxWidth: 205, color: "#57534e", fontSize: 16, lineHeight: 1.25 }}>{input.leadTime}</div></div>
      </div>

    </div>
  );
}

/** Útmutató-index kártya: világos papír, baloldalon a cím, jobbra a témalista sorkártyákon. */
function GuideIndexCard({ input }: { input: OgCardInput }) {
  const titles = input.guideTitles ?? [];
  const MAX_CHIPS = 7;
  const visible = titles.slice(0, MAX_CHIPS);
  const extra = titles.length - visible.length;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: PAPER, color: INK, fontFamily: "sans-serif", padding: "46px 64px", backgroundImage: "radial-gradient(ellipse at 90% 24%, rgba(249,115,22,0.07), transparent 55%), radial-gradient(ellipse at 8% 92%, rgba(15,118,110,0.06), transparent 50%)" }}>
      <div style={{ position: "absolute", left: -130, top: -190, width: 470, height: 470, borderRadius: "50%", border: "1px solid #c2410c22" }} />
      <div style={{ position: "absolute", left: -50, bottom: -170, width: 300, height: 300, borderRadius: "50%", border: "1px solid #0f766e26" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 1030 }}>
          <BrandMark dark />
          <div style={{ display: "flex", color: "#c2410c", fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>ÉPÍTŐANYAG-KISOKOS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ width: 470, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", color: "#c2410c", fontSize: 16, fontWeight: 800, letterSpacing: 2.6 }}>{input.kicker ?? "GYAKORLATI TUDÁSTÁR"}</div>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1, letterSpacing: -2.6 }}>{input.title}</div>
            {input.subtitle ? <div style={{ display: "flex", maxWidth: 430, color: "#57534e", fontSize: 19, lineHeight: 1.35 }}>{input.subtitle}</div> : null}
          </div>
          <div style={{ width: 440, display: "flex", flexDirection: "column", gap: 9 }}>
            {visible.map((title, index) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, height: 46, padding: "0 15px", borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #c2410c26" }}>
                <div style={{ display: "flex", width: 24, color: "#0f766e", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>{String(index + 1).padStart(2, "0")}</div>
                <div style={{ display: "flex", flex: 1, color: "#1c1917", fontSize: 13, fontWeight: 650, lineHeight: 1.2 }}>{title}</div>
              </div>
            ))}
            {extra > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 46, padding: "0 15px", borderRadius: 12, border: "1px dashed #c2410c55", color: "#c2410c" }}>
                <div style={{ display: "flex", width: 24, fontSize: 14, fontWeight: 800 }}>+</div>
                <div style={{ display: "flex", flex: 1, fontSize: 13, fontWeight: 650, lineHeight: 1.2 }}>{extra} további téma a tudástárban</div>
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#57534e", fontSize: 16, fontWeight: 700 }}>
          <div style={{ width: 44, height: 2, backgroundColor: "#c2410c" }} />
          <div style={{ display: "flex" }}>{input.highlight ?? `${titles.length} útmutató · anyagválasztás · árak · szállítás`}</div>
        </div>
      </div>
    </div>
  );
}

function GuideArtwork() {
  return (
    <div style={{ position: "absolute", right: 68, top: 116, width: 360, height: 390, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", backgroundImage: "radial-gradient(ellipse at 42% 38%, rgba(249,115,22,0.28), rgba(249,115,22,0) 72%)" }} />
      <div style={{ position: "absolute", width: 300, height: 300, left: -48, bottom: -56, borderRadius: "50%", backgroundImage: "radial-gradient(ellipse at 50% 50%, rgba(15,118,110,0.22), rgba(15,118,110,0) 70%)" }} />
      <div style={{ position: "relative", width: 285, height: 326, display: "flex", borderRadius: 18, overflow: "hidden", backgroundColor: "#faf6ef", boxShadow: "0 28px 55px #00000055", transform: "rotate(4deg)" }}>
        <div style={{ width: 18, height: "100%", backgroundColor: "#0f766e" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 25, gap: 20 }}>
          <div style={{ color: "#134e4a", fontSize: 12, fontWeight: 800, letterSpacing: 3 }}>JEGYZETEK</div>
          <div style={{ width: 170, height: 3, backgroundColor: "#134e4a66" }} />
          {[220, 174, 198, 148, 208, 126].map((width, index) => <div key={index} style={{ height: index === 2 ? 7 : 4, width, borderRadius: 4, backgroundColor: index === 2 ? "#f97316" : "#29252455" }} />)}
          <div style={{ marginTop: 8, width: 78, height: 78, borderRadius: 39, border: "2px solid #f9731677", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#f97316" }} /></div>
        </div>
      </div>
    </div>
  );
}

/** Az utolsó rövid szó ne maradjon egyedül árva sorvégre: kényszereltörés az utolsó két szó elé. */
function splitOrphanTitle(title: string): [string, string] | null {
  const words = title.split(" ");
  const lastWord = words[words.length - 1] ?? "";
  if (words.length > 2 && lastWord.length <= 4 && title.length <= 38) {
    return [words.slice(0, -2).join(" "), words.slice(-2).join(" ")];
  }
  return null;
}

function GuideCard({ input }: { input: OgCardInput }) {
  const orphanLines = splitOrphanTitle(input.title);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#1a1614", color: "#faf6ef", fontFamily: "sans-serif", padding: "46px 64px", backgroundImage: "radial-gradient(ellipse at 85% 45%, rgba(249,115,22,0.20), rgba(26,22,20,0) 58%), radial-gradient(ellipse at 12% 88%, rgba(15,118,110,0.22), rgba(26,22,20,0) 55%), radial-gradient(ellipse at 55% 112%, rgba(63,98,18,0.18), rgba(26,22,20,0) 50%)" }}>
      <GuideArtwork />
      <div style={{ position: "relative", width: 760, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: 1040 }}><BrandMark /><div style={{ color: "#f97316", fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>ÉPÍTŐANYAG-KISOKOS</div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 17 }}><div style={{ color: "#f97316", fontSize: 17, fontWeight: 800, letterSpacing: 4 }}>ÚTMUTATÓ · GYAKORLATI TUDÁSTÁR</div>{orphanLines ? <div style={{ maxWidth: 740, fontSize: 66, lineHeight: 1.04, fontWeight: 800, letterSpacing: -1.9, display: "flex", flexDirection: "column" }}><div style={{ display: "flex" }}>{orphanLines[0]}</div><div style={{ display: "flex" }}>{orphanLines[1]}</div></div> : <div style={{ maxWidth: 740, fontSize: input.title.length > 38 ? 54 : 66, lineHeight: 1.04, fontWeight: 800, letterSpacing: -1.9 }}>{input.title}</div>}{input.subtitle ? <div style={{ maxWidth: 730, color: "#faf6efc9", fontSize: 22, lineHeight: 1.36 }}>{input.subtitle}</div> : null}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 15, color: "#f1e9d8cc", fontSize: 15, fontWeight: 700, letterSpacing: 1.2 }}><div style={{ width: 48, height: 2, backgroundColor: "#f97316" }} />ANYAGVÁLASZTÁS · ÁRAK · SZÁLLÍTÁS</div>
      </div>
    </div>
  );
}

function NotFoundArtwork() {
  const pebbles = [
    [46, 22, 26], [286, 40, 20], [12, 168, 18], [300, 190, 24], [70, 296, 22], [226, 300, 16],
  ] as const;
  return (
    <div style={{ position: "absolute", right: 74, top: 138, width: 356, height: 356, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 356, height: 356, borderRadius: "50%", border: "2px dashed #f9731666" }} />
      <div style={{ position: "absolute", width: 244, height: 244, borderRadius: "50%", backgroundColor: "#dcebe8", border: "1px solid #0f766e33", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ color: "#c2410c", fontSize: 88, fontWeight: 800, letterSpacing: "-4px", lineHeight: 1 }}>404</div>
        <div style={{ color: "#0f766e", fontSize: 11, fontWeight: 800, letterSpacing: "3px" }}>HIBAOLDAL</div>
      </div>
      {pebbles.map(([x, y, size], index) => (
        <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: size, height: size * 0.82, borderRadius: "50%", backgroundColor: index % 2 ? "#e6dabf" : "#f97316", border: "3px solid #faf6ef", boxShadow: "0 4px 10px #1c191722" }} />
      ))}
    </div>
  );
}

function NotFoundCard({ input }: { input: OgCardInput }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: PAPER, color: INK, fontFamily: "sans-serif", padding: "46px 64px" }}>
      <div style={{ position: "absolute", left: -140, top: -200, width: 480, height: 480, borderRadius: "50%", border: "1px solid #0f766e26" }} />
      <NotFoundArtwork />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: 1030 }}>
          <BrandMark dark />
          <div style={{ display: "flex", color: "#c2410c", fontSize: 15, fontWeight: 800, letterSpacing: "3px" }}>HIBAKÓD · 404</div>
        </div>
        <div style={{ width: 660, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", color: "#c2410c", fontSize: 15, fontWeight: 800, letterSpacing: "3px" }}>AZ OLDAL NEM TALÁLHATÓ</div>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-1.6px", width: 660 }}>{input.title}</div>
          <div style={{ maxWidth: 560, display: "flex", color: "#57534e", fontSize: 19, lineHeight: 1.4 }}>{input.subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", backgroundColor: "#1a1614", color: "#faf6ef", fontSize: 19, fontWeight: 800, borderRadius: 10, padding: "11px 18px" }}>{input.contactPhone}</div>
          <div style={{ height: 34, width: 1, backgroundColor: "#1c191744", marginLeft: 16, marginRight: 16 }} />
          <div style={{ display: "flex", color: "#57534e", fontSize: 15, fontWeight: 700 }}>{input.highlight}</div>
          <div style={{ marginLeft: "auto", display: "flex", color: "#57534e", fontSize: 14, fontWeight: 600 }}>{input.hours}</div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ input }: { input: OgCardInput }) {
  const cards = input.priceCards ?? [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#faf6ef", color: INK, fontFamily: "sans-serif", padding: "42px 60px" }}>
      <div style={{ position: "absolute", right: -138, top: -248, width: 580, height: 580, borderRadius: "50%", border: "1px solid #0f766e26" }} />
      <div style={{ position: "absolute", right: -78, top: -188, width: 460, height: 460, borderRadius: "50%", border: "1px solid #c2410c2b" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 1080, alignItems: "center", justifyContent: "space-between" }}>
          <BrandMark dark />
          <div style={{ display: "flex", color: "#c2410c", fontSize: 14, fontWeight: 800, letterSpacing: 3 }}>ÁRAK · ANYAGONKÉNT</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
          <div style={{ width: 438, display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", color: "#c2410c", fontSize: 16, fontWeight: 800, letterSpacing: 2.4 }}>TÁJÉKOZTATÓ NETTÓ ÁRAK</div>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.1 }}>{input.title}</div>
            <div style={{ display: "flex", maxWidth: 410, color: MUTED, fontSize: 19, lineHeight: 1.4 }}>{input.subtitle ?? "Anyagár köbméterenként · fuvar külön, zónánként"}</div>
          </div>
          <div style={{ width: 490, display: "flex", flexDirection: "column", gap: 13 }}>
            {cards.map((card) => {
              const palette = PRICE_TONE[card.tone];
              return (
                <div key={card.label} style={{ height: 98, display: "flex", alignItems: "center", gap: 17, padding: "13px 18px", borderRadius: 16, backgroundColor: palette.bg, border: `1px solid ${palette.accent}35` }}>
                  <div style={{ width: 7, height: 58, borderRadius: 6, backgroundColor: palette.accent }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", color: palette.accent, fontSize: 12, fontWeight: 800, letterSpacing: 1.8 }}>{card.label.toLocaleUpperCase("hu-HU")}</div>
                    <div style={{ display: "flex", color: INK, fontSize: 25, fontWeight: 800 }}>{card.value}</div>
                    <div style={{ display: "flex", color: MUTED, fontSize: 12, fontWeight: 600 }}>{card.detail}</div>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 19, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${palette.accent}18`, color: palette.accent, fontSize: 20, fontWeight: 800 }}>↗</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13, color: MUTED, fontSize: 15, fontWeight: 700 }}>
          <div style={{ width: 43, height: 2, backgroundColor: "#c2410c" }} />
          Nettó Ft/m³ · Tájékoztató ár · A fuvar díja külön
        </div>
      </div>
    </div>
  );
}

function ShippingCard({ input }: { input: OgCardInput }) {
  const cards = input.zoneCards ?? [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#1a1614", color: "#faf6ef", fontFamily: "sans-serif", padding: "42px 60px", backgroundImage: "radial-gradient(ellipse at 88% 18%, rgba(249,115,22,0.16), rgba(26,22,20,0) 55%), radial-gradient(ellipse at 10% 90%, rgba(15,118,110,0.22), rgba(26,22,20,0) 52%)" }}>
      <div style={{ position: "absolute", right: -170, bottom: -300, width: 680, height: 680, borderRadius: "50%", border: "1px solid #f9731622" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 1080, alignItems: "center", justifyContent: "space-between" }}>
          <BrandMark />
          <div style={{ display: "flex", color: "#f97316", fontSize: 14, fontWeight: 800, letterSpacing: 3 }}>SAJÁT FLOTTÁVAL · BUDAFOKRÓL</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", color: "#f97316", fontSize: 16, fontWeight: 800, letterSpacing: 3 }}>SZÁLLÍTÁSI ZÓNÁK</div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{input.title}</div>
        </div>
        <div style={{ display: "flex", gap: 15 }}>
          {cards.map((card) => {
            const palette = ZONE_STYLE[card.id];
            return (
              <div key={card.id} style={{ position: "relative", flex: 1, height: 207, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", borderRadius: 17, padding: "18px 19px", backgroundColor: "#faf6ef", color: INK, borderTop: `5px solid ${palette.accent}` }}>
                <div style={{ position: "absolute", right: -35, top: -55, width: 135, height: 135, borderRadius: "50%", backgroundColor: palette.wash }} />
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", color: palette.accent, fontSize: 12, fontWeight: 800, letterSpacing: 1.7 }}>{palette.label}</div>
                  <div style={{ display: "flex", width: 276, color: INK, fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{card.area}</div>
                </div>
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1.4 }}>FUVAR · NETTÓ</div>
                  <div style={{ display: "flex", color: INK, fontSize: 24, fontWeight: 800 }}>{card.price}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f1e9d8cc", fontSize: 15, fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 40, height: 2, backgroundColor: "#f97316" }} />A végleges fuvardíjat egyeztetés után adjuk.</div>
          <div style={{ display: "flex", color: "#f97316" }}>Sóderárak · Budafok</div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ input }: { input: OgCardInput }) {
  const steps = input.serviceSteps ?? [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#eaf3f1", color: INK, fontFamily: "sans-serif", padding: "42px 60px", backgroundImage: "radial-gradient(ellipse at 92% 12%, rgba(15,118,110,0.08), transparent 46%), radial-gradient(ellipse at 4% 96%, rgba(249,115,22,0.05), transparent 40%)" }}>
      <div style={{ position: "absolute", right: -148, top: -250, width: 590, height: 590, borderRadius: "50%", border: "1px solid #0f766e2b" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 1080, alignItems: "center", justifyContent: "space-between" }}>
          <BrandMark dark />
          <div style={{ display: "flex", color: "#0f766e", fontSize: 14, fontWeight: 800, letterSpacing: 3 }}>KAPCSOLAT · AJÁNLATKÉRÉS</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 42 }}>
          <div style={{ width: 478, display: "flex", flexDirection: "column", gap: 17 }}>
            <div style={{ display: "flex", color: "#0f766e", fontSize: 15, fontWeight: 800, letterSpacing: 2.7 }}>BESZÉLJÜNK AZ ANYAGRÓL</div>
            <div style={{ display: "flex", fontSize: 58, fontWeight: 800, lineHeight: 1.03, letterSpacing: -2.3 }}>{input.title}</div>
            <div style={{ display: "flex", color: MUTED, fontSize: 19, lineHeight: 1.35 }}>{input.subtitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 2 }}>
              <div style={{ display: "flex", color: "#0f766e", fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>NYITVATARTÁS</div>
              <div style={{ display: "flex", color: INK, fontSize: 18, fontWeight: 700 }}>{input.hours}</div>
            </div>
          </div>
          <div style={{ width: 470, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 152, overflow: "hidden", borderRadius: 22, padding: "20px 24px", backgroundColor: "#1a1614", color: "#faf6ef", backgroundImage: "radial-gradient(ellipse at 82% 20%, rgba(249,115,22,0.18), rgba(26,22,20,0) 60%)" }}>
              <div style={{ position: "absolute", right: -35, top: -80, width: 210, height: 210, borderRadius: "50%", border: "1px solid #f9731644" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", color: "#f97316", fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>HÍVJON MINKET</div><div style={{ display: "flex", width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#f97316", color: "#1a1614", fontSize: 20, fontWeight: 800 }}>↗</div></div>
              <div style={{ position: "relative", display: "flex", fontSize: input.contactPhone && input.contactPhone.length > 15 ? 28 : 35, fontWeight: 800, letterSpacing: -0.7 }}>{input.contactPhone}</div>
              <div style={{ position: "relative", display: "flex", color: "#f1e9d8cc", fontSize: 13 }}>Anyag · mennyiség · helyszín</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {steps.map((step) => (
                <div key={step.number} style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 67, padding: "10px 14px", borderRadius: 13, backgroundColor: "#faf6ef", border: "1px solid #0f766e26" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 19, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#d8ebe7", color: "#0f766e", fontSize: 15, fontWeight: 800 }}>{step.number}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><div style={{ display: "flex", color: INK, fontSize: 15, fontWeight: 800 }}>{step.title}</div><div style={{ display: "flex", color: MUTED, fontSize: 12 }}>{step.detail}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: MUTED, fontSize: 14, fontWeight: 700 }}><div style={{ width: 42, height: 2, backgroundColor: "#0f766e" }} />Hívás · egyeztetés · szállítás</div>
      </div>
    </div>
  );
}

function CompanyCard({ input }: { input: OgCardInput }) {
  const facts = input.companyFacts ?? [];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#1a1614", color: "#faf6ef", fontFamily: "sans-serif", padding: "44px 62px", backgroundImage: "radial-gradient(ellipse at 12% 92%, rgba(15,118,110,0.20), rgba(26,22,20,0) 52%), radial-gradient(ellipse at 80% 26%, rgba(63,98,18,0.16), rgba(26,22,20,0) 45%)" }}>
      <div style={{ position: "absolute", right: 75, top: 120, width: 390, height: 390, borderRadius: "50%", backgroundColor: "rgba(249,115,22,0.07)", border: "1px solid #f9731638", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 276, height: 276, borderRadius: "50%", border: "1px solid #f9731666", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 176, height: 176, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#faf6ef", boxShadow: "0 18px 40px #00000055" }}>
            <div style={{ width: 128, height: 128, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "radial-gradient(ellipse at 30% 25%, #fdba74, #c2410c 75%)", color: "#1a1614", fontSize: 48, fontWeight: 800 }}>BK</div>
          </div>
        </div>
        <div style={{ position: "absolute", right: 12, bottom: 46, width: 76, height: 76, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-8deg)", backgroundColor: "#f97316", color: "#1a1614", fontSize: 28, fontWeight: 800 }}>15+</div>
      </div>
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 1076, alignItems: "center", justifyContent: "space-between" }}>
          <BrandMark />
          <div style={{ display: "flex", color: "#f97316", fontSize: 14, fontWeight: 800, letterSpacing: 2.5 }}>CÉGÜNK · ÜZLETÁGUNK</div>
        </div>
        <div style={{ width: 590, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", color: "#f97316", fontSize: 15, fontWeight: 800, letterSpacing: 2.7 }}>SAJÁT FLOTTA · ÖMLESZTETT ANYAG</div>
          <div style={{ display: "flex", fontSize: input.title.length > 34 ? 51 : 59, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.8 }}>{input.title}</div>
          <div style={{ display: "flex", maxWidth: 590, color: "#f1e9d8cc", fontSize: 18, lineHeight: 1.35 }}>{input.subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {facts.map((fact, index) => (
            <div key={fact.label} style={{ width: 198, height: 90, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, padding: "13px 15px", borderRadius: 14, backgroundColor: "#faf6ef", color: INK, borderTop: `3px solid ${index % 2 ? "#0f766e" : "#f97316"}` }}>
              <div style={{ display: "flex", color: index % 2 ? "#0f766e" : "#c2410c", fontSize: 19, fontWeight: 800 }}>{fact.value}</div>
              <div style={{ display: "flex", color: MUTED, fontSize: 12, fontWeight: 700 }}>{fact.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#f1e9d8cc", fontSize: 14, fontWeight: 700 }}><div style={{ width: 42, height: 2, backgroundColor: "#f97316" }} />Bau-Kont Logisztik Kft. · Ömlesztett anyag üzletág</div>
      </div>
    </div>
  );
}

function StandardCard({ input }: { input: OgCardInput }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", padding: 64, backgroundColor: "#1a1614",      backgroundImage: "radial-gradient(ellipse at top right, rgba(249,115,22,0.24), transparent 55%), radial-gradient(ellipse at bottom left, rgba(194,65,12,0.28), transparent 50%), radial-gradient(ellipse at 14% 10%, rgba(15,118,110,0.30), transparent 44%)", color: "#faf6ef", fontFamily: "sans-serif", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>        <div style={{ position: "absolute", right: 40, top: 112, width: 410, height: 410, borderRadius: "50%", border: "1px solid #f9731635", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 285, height: 285, borderRadius: "50%", border: "1px solid #f9731655", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 138, height: 138, borderRadius: "50%", display: "flex", backgroundImage: "radial-gradient(ellipse at 35% 30%, #fdba74, #c2410c 72%)", boxShadow: "0 18px 45px #00000055" }} />
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandMark />
        <div style={{ display: "flex", color: "#f1e9d8", fontSize: 19, fontWeight: 600 }}>{company.phone.display}</div>
      </div>
      <div style={{ position: "relative", width: 680, display: "flex", flexDirection: "column", gap: 18 }}>
        {input.kicker ? <div style={{ display: "flex", color: "#f97316", fontSize: 19, fontWeight: 800, letterSpacing: 3.6, textTransform: "uppercase" }}>{input.kicker}</div> : null}
        <div style={{ display: "flex", fontSize: input.title.length > 42 ? 55 : 68, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.7 }}>{input.title}</div>
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 22 }}>
        {input.highlight ? <div style={{ display: "flex", fontSize: 23, fontWeight: 800, color: "#1a1614", backgroundColor: "#f97316", borderRadius: 8, padding: "12px 18px" }}>{input.highlight}</div> : null}
        <div style={{ display: "flex", color: "#f1e9d8cc", fontSize: 17, fontWeight: 500 }}>{company.businessUnit} · {company.hours.short}</div>
      </div>
    </div>
  );
}

export function ogCard(input: OgCardInput): ImageResponse {
  const card = input.variant === "materialIndex" ? <MaterialIndexCard input={input} />
    : input.variant === "material" ? <MaterialCard input={input} />
      : input.variant === "areaIndex" ? <AreaIndexCard input={input} />
        : input.variant === "settlement" ? <SettlementCard input={input} />
          : input.variant === "guide" ? <GuideCard input={input} />
            : input.variant === "pricing" ? <PricingCard input={input} />
              : input.variant === "shipping" ? <ShippingCard input={input} />
                : input.variant === "contact" ? <ContactCard input={input} />
                  : input.variant === "company" ? <CompanyCard input={input} />
                    : input.variant === "notFound" ? <NotFoundCard input={input} />
                      : input.variant === "guideIndex" ? <GuideIndexCard input={input} />
                        : <StandardCard input={input} />;
  return new ImageResponse(card, OG_SIZE);
}
