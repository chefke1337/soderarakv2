"use client";

import { usePathname } from "next/navigation";
import { company } from "@/content/site";

/**
 * Mobilon mindig látható, kizárólag hívás-gombos alsó sáv.
 * V2: forgó fényszegély nélkül — a sáv maga a figyelemfelhívás.
 * A /kapcsolat oldalon rejtve (ott a lap saját hívás-gombja áll).
 */
export default function MobileCallBar() {
  const pathname = usePathname() ?? "/";
  if (pathname.replace(/\/+$/, "") === "/kapcsolat") return null;

  return (
    <div
      data-call-region="mobile_call_bar"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-strong bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden"
    >
      <a
        href={`tel:${company.phone.raw}`}
        aria-label={`Hívás: ${company.phone.display}`}
        className="num flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand-dark px-4 py-3 text-base font-semibold text-paper transition-colors hover:bg-brand-deep"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Hívás: {company.phone.display}
      </a>
    </div>
  );
}
