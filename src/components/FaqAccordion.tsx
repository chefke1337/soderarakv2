import { company, FAQ } from "@/content/site";
import { IconPlus, PhoneLink } from "@/lib/ui";

export default function FaqAccordion() {
  return (
    <div>
      <div className="border-t border-ink/80">
        {FAQ.map((item) => (
          <details key={item.q} className="group border-b border-line">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 pr-1 font-medium transition-colors hover:text-brand-deep">
              <span className="text-[1.0625rem] leading-snug">{item.q}</span>
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-transform group-open:rotate-45"
              >
                <IconPlus size={14} />
              </span>
            </summary>
            <p className="details-body max-w-[68ch] pb-5 text-[0.9375rem] leading-relaxed text-ink-soft">
              {item.a}
            </p>
          </details>
        ))}
      </div>
      <p data-call-region="faq_accordion" className="mt-5 text-sm text-ink-soft">
        Nem találja a választ?{" "}
        <PhoneLink className="num font-semibold text-brand-deep underline underline-offset-2" />
        {" — "}
        {company.hours.short}.
      </p>
    </div>
  );
}
