import { RENDELES_LEPESEK } from "@/content/site";
import { IconTruck } from "@/lib/ui";

/**
 * Rendelés menete — függőleges idővonal (öt hosszabb lépés olvasható,
 * tágas elrendezésben; nem öt keskeny oszlop). Mobilon ugyanez egy
 * oszlopban. Az összekötő vonal görgetésre „telik" (CSS scroll-timeline;
 * támogatás vagy mozgásengedély nélkül teljes, a tartalom mindig látható).
 */
export default function OrderRoute() {
  const last = RENDELES_LEPESEK.length - 1;
  return (
    <ol className="relative">
      {/* összekötő vonal: szaggatott alap + kitöltés */}
      <span
        aria-hidden="true"
        className="absolute top-8 bottom-8 left-[1.6875rem] w-[3px] rounded-full bg-[repeating-linear-gradient(180deg,var(--color-border-strong)_0_10px,transparent_10px_18px)] md:left-[2.1875rem]"
      />
      <span
        aria-hidden="true"
        className="route-fill-y absolute top-8 bottom-8 left-[1.6875rem] w-[3px] rounded-full bg-accent md:left-[2.1875rem]"
      />
      {RENDELES_LEPESEK.map((step, i) => (
        <li key={step.title} className="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0 md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-x-7 md:pb-12">
          <span
            aria-hidden="true"
            className={`num relative z-10 flex h-14 w-14 items-center justify-center rounded-full font-display text-lg font-bold md:h-[4.5rem] md:w-[4.5rem] md:text-2xl ${
              i === last
                ? "bg-accent text-on-dark shadow-pop"
                : "border-2 border-text bg-surface text-text"
            }`}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pt-2.5 md:pt-4">
            <h3 className="font-display text-heading-sm font-bold text-balance md:text-heading-md">
              <span className="sr-only">{i + 1}. lépés: </span>
              {step.title}
            </h3>
            <p className="mt-2.5 max-w-[62ch] text-[1rem] leading-relaxed text-text-muted md:text-[1.0625rem]">
              {step.text}
            </p>
            {step.note && (
              <p className="mt-4 flex max-w-[62ch] gap-3 rounded-[var(--radius-md)] border-l-4 border-accent bg-surface px-4 py-3 text-[0.9375rem] leading-relaxed text-text shadow-card">
                <IconTruck size={20} className="mt-0.5 shrink-0 text-accent-deep" />
                <span>{step.note}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
