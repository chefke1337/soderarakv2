/**
 * V2 szekció — két kompozíció:
 *  - "stack": cím fölül, tartalom alatta (alapértelmezett, aloldalakon)
 *  - "split": desktopon a cím bal oldali hasábban marad, a tartalom jobbra
 *    (editoriális ritmus a főoldalon — nem minden szekció ugyanaz a minta)
 * A címke mondatkezdő, kis méretű — nem csupa nagybetűs „eyebrow".
 */
export default function Section({
  id,
  kicker,
  title,
  lead,
  children,
  tone = "paper",
  cv = false,
  headingLevel = 1,
  layout = "stack",
  className = "",
}: {
  id?: string;
  kicker?: string;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  tone?: "paper" | "sand";
  /** content-visibility: auto — nehéz, görgetés alatti szekcióknál */
  cv?: boolean;
  /** Landing page blocks use h2; standalone pages start with h1. */
  headingLevel?: 1 | 2;
  layout?: "stack" | "split";
  className?: string;
}) {
  const Title = headingLevel === 1 ? "h1" : "h2";
  const headingId = id ? `${id}-cim` : undefined;
  const big = headingLevel === 1;

  const heading = (
    <div className={layout === "split" ? "lg:sticky lg:top-28" : undefined}>
      {kicker && (
        <p className="text-sm font-medium text-brand-deep">{kicker}</p>
      )}
      <Title
        id={headingId}
        className={`mt-2 font-display font-bold text-balance tracking-display ${
          big
            ? "text-[2.375rem] leading-[1.05] md:text-display"
            : "text-[1.875rem] leading-[1.1] md:text-heading-lg"
        }`}
      >
        {title}
      </Title>
      {lead && (
        <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          {lead}
        </p>
      )}
    </div>
  );

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`border-b border-line ${tone === "sand" ? "bg-sand" : "bg-paper"}${cv ? " cv-auto" : ""} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
        {layout === "split" ? (
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">{heading}</div>
            <div className="min-w-0 lg:col-span-8">{children}</div>
          </div>
        ) : (
          <>
            {heading}
            <div className="mt-8 md:mt-10">{children}</div>
          </>
        )}
      </div>
    </section>
  );
}
