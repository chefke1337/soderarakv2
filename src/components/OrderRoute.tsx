import { RENDELES_LEPESEK } from "@/content/site";
import { IconTruck } from "@/lib/ui";

/**
 * Rendelés menete „útvonalként": négy megálló egy szaggatott úton,
 * a teherautó görgetésre halad végig (CSS scroll-timeline; támogatás
 * vagy mozgásengedély nélkül a végállomáson áll — semmi nem rejtett).
 * Mobilon függőleges idővonal.
 */
export default function OrderRoute() {
  return (
    <div className="relative">
      {/* Desktop út */}
      <div aria-hidden="true" className="relative mb-10 hidden h-12 md:block">
        <div className="absolute inset-x-[12.5%] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[repeating-linear-gradient(90deg,var(--color-border-strong)_0_14px,transparent_14px_24px)]" />
        <div className="route-fill absolute inset-x-[12.5%] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-accent" />
        <div className="absolute inset-x-[12.5%] top-0 h-full">
          <span className="route-truck absolute top-1/2 left-full flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-dark text-amber shadow-pop">
            <IconTruck size={24} />
          </span>
        </div>
      </div>

      <ol className="relative grid gap-0 md:grid-cols-4 md:gap-6">
        {/* Mobil idővonal */}
        <span aria-hidden="true" className="absolute top-3 bottom-3 left-[1.375rem] w-[3px] rounded-full bg-[repeating-linear-gradient(180deg,var(--color-border-strong)_0_10px,transparent_10px_18px)] md:hidden" />
        {RENDELES_LEPESEK.map((step, i) => (
          <li key={step.title} className="relative grid grid-cols-[2.75rem_1fr] gap-x-4 pb-8 last:pb-0 md:block md:pb-0 md:text-center">
            <span
              aria-hidden="true"
              className={`num relative z-10 flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-bold md:mx-auto ${
                i === RENDELES_LEPESEK.length - 1
                  ? "bg-accent text-on-dark"
                  : "border-2 border-text bg-surface text-text"
              }`}
            >
              {i + 1}
            </span>
            <div className="md:mt-5">
              <h3 className="font-display text-heading-sm font-bold">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-text-muted md:mx-auto md:max-w-[26ch]">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
