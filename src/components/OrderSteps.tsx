import { RENDELES_LEPESEK } from "@/content/site";
import { IconTruck } from "@/lib/ui";

/**
 * Rendelés menete (V3.3): a jóváhagyott öt lépés teljes szövege, de tömör
 * kompozícióban — desktopon egy vízszintes „útvonal" öt hasábbal (a lépés-
 * számok egy vonalon), mobilon függőleges sín. Csak CSS, nincs kliens-JS;
 * a tartalom animáció nélkül is teljes.
 */
export default function OrderSteps() {
  const last = RENDELES_LEPESEK.length - 1;
  return (
    <ol className="order-steps">
      {RENDELES_LEPESEK.map((step, i) => (
        <li key={step.title} className="order-step" data-last={i === last} style={{ "--i": i } as React.CSSProperties}>
          <div className="order-step-head" aria-hidden="true">
            <span className="order-step-num num">{String(i + 1).padStart(2, "0")}</span>
            <span className="order-step-node" />
          </div>
          <div className="order-step-body">
            <h3 className="font-display text-[1.125rem] leading-snug font-bold text-balance">
              <span className="sr-only">{i + 1}. lépés: </span>
              {step.title}
            </h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-text-muted">{step.text}</p>
            {step.note && (
              <p className="order-step-note">
                <IconTruck size={18} className="mt-0.5 shrink-0 text-accent-deep" />
                <span>{step.note}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
