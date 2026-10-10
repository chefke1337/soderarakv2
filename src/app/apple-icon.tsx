import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch ikon — az új flat ipari dömper mark INVERTÁLT tile-változata,
 * ugyanaz a kompozíció, mint az icon.svg (basalt lapka + narancs sziluett,
 * fehér talp-sáv, sötét részletek). ImageResponse-ban div + clipPath rajzzal.
 */
export default function AppleIcon() {
  const orange = "#ea580c";
  const cream = "#faf6ef";
  const dark = "#1a1614";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: dark,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Rakat a billában (narancs körok, egy fehér kő) */}
        <div style={{ position: "absolute", left: 40, top: 56, width: 13, height: 13, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 54, top: 51, width: 16, height: 16, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 73, top: 54, width: 14, height: 14, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 89, top: 57, width: 13, height: 13, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 65, top: 59, width: 13, height: 13, borderRadius: "50%", backgroundColor: cream }} />

        {/* Plató: narancs test, sötét perem és bordák, fehér talp-sáv */}
        <div style={{ position: "absolute", left: 35, top: 66, width: 72, height: 36, backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 35, top: 66, width: 72, height: 5, backgroundColor: dark }} />
        <div style={{ position: "absolute", left: 58, top: 75, width: 4, height: 17, backgroundColor: dark }} />
        <div style={{ position: "absolute", left: 81, top: 75, width: 4, height: 17, backgroundColor: dark }} />
        <div style={{ position: "absolute", left: 35, top: 91, width: 72, height: 11, backgroundColor: cream }} />

        {/* Fülke: narancs test, sötét ablak */}
        <div style={{ position: "absolute", left: 110, top: 60, width: 35, height: 42, backgroundColor: orange, clipPath: "polygon(0 100%, 0 24%, 25% 0, 79% 0, 100% 24%, 100% 100%)" }} />
        <div style={{ position: "absolute", left: 115, top: 64, width: 25, height: 14, backgroundColor: dark, clipPath: "polygon(0 37%, 26% 0, 76% 0, 100% 37%, 100% 100%, 0 100%)" }} />

        {/* Váz */}
        <div style={{ position: "absolute", left: 32, top: 104, width: 122, height: 9, backgroundColor: orange }} />

        {/* Három kerék fehér agyjjel */}
        <div style={{ position: "absolute", left: 39, top: 102, width: 26, height: 26, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 44, top: 110, width: 10, height: 10, borderRadius: "50%", backgroundColor: dark }} />
        <div style={{ position: "absolute", left: 71, top: 102, width: 26, height: 26, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 79, top: 110, width: 10, height: 10, borderRadius: "50%", backgroundColor: dark }} />
        <div style={{ position: "absolute", left: 115, top: 102, width: 26, height: 26, borderRadius: "50%", backgroundColor: orange }} />
        <div style={{ position: "absolute", left: 123, top: 110, width: 10, height: 10, borderRadius: "50%", backgroundColor: dark }} />
      </div>
    ),
    size,
  );
}
