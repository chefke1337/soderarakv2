/**
 * V2.1 szekció — tudatos felületritmus (docs/v2-design-direction.md § V2.1).
 * tone:
 *  - "page"    meleg homok oldalháttér (alap)
 *  - "muted"   mélyebb homok sáv
 *  - "surface" törtfehér — csak sűrű, olvasandó tartalomhoz
 *  - "dark"    meleg sötétbarna kontrasztszekció
 *  - "accent"  égett terrakotta kiemelőpanel
 * ("paper"/"sand" a régi aloldalak kompatibilitási nevei.)
 * layout: "stack" (cím fölül) | "split" (desktopon a cím bal hasábban).
 */
type Tone = "page" | "muted" | "surface" | "dark" | "accent" | "paper" | "sand";

const TONE: Record<Tone, string> = {
  page: "bg-page text-text",
  paper: "bg-page text-text",
  muted: "bg-surface-muted text-text",
  sand: "bg-surface-muted text-text",
  surface: "bg-surface text-text",
  dark: "on-dark bg-surface-dark text-on-dark",
  accent: "on-accent bg-surface-accent text-on-dark",
};

export default function Section({
  id,
  kicker,
  title,
  lead,
  children,
  tone = "page",
  cv = false,
  headingLevel = 1,
  layout = "stack",
  reveal = false,
  className = "",
}: {
  id?: string;
  kicker?: string;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  tone?: Tone;
  /** content-visibility: auto — nehéz, görgetés alatti szekcióknál */
  cv?: boolean;
  /** Landing page blocks use h2; standalone pages start with h1. */
  headingLevel?: 1 | 2;
  layout?: "stack" | "split";
  /** Visszafogott megjelenés görgetéskor (csak támogatott motoron, reduced-motion nélkül) */
  reveal?: boolean;
  className?: string;
}) {
  const Title = headingLevel === 1 ? "h1" : "h2";
  const headingId = id ? `${id}-cim` : undefined;
  const big = headingLevel === 1;
  const dark = tone === "dark" || tone === "accent";

  const heading = (
    <div className={layout === "split" ? "lg:sticky lg:top-28" : undefined}>
      {kicker && (
        <p className={`label-strata ${dark ? "text-amber" : "text-brand-deep"} ${tone === "accent" ? "!text-on-dark" : ""}`}>
          {kicker}
        </p>
      )}
      <Title
        id={headingId}
        className={`mt-3 font-display font-bold text-balance tracking-display ${
          big
            ? "text-[2.5rem] leading-[1.02] md:text-display"
            : "text-[2rem] leading-[1.06] md:text-heading-lg"
        }`}
      >
        {title}
      </Title>
      {lead && (
        <p
          className={`mt-4 max-w-[58ch] text-[1.0625rem] leading-relaxed ${
            tone === "dark" ? "text-on-dark-muted" : tone === "accent" ? "text-on-accent-muted" : "text-text-muted"
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`relative ${TONE[tone]}${cv ? " cv-auto" : ""} ${className}`}
    >
      <div className={`mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-24 ${reveal ? "reveal-up" : ""}`}>
        {layout === "split" ? (
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">{heading}</div>
            <div className="min-w-0 lg:col-span-8">{children}</div>
          </div>
        ) : (
          <>
            {heading}
            <div className="mt-8 md:mt-12">{children}</div>
          </>
        )}
      </div>
    </section>
  );
}
