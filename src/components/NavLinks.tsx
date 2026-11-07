"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/content/site";

/** Fő navigáció aktív-állapottal (aria-current) — a fejléc egyetlen kliens-része. */
export default function NavLinks() {
  const pathname = (usePathname() ?? "/").replace(/\/+$/, "") || "/";

  return (
    <ul className="flex items-center">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 items-center px-2.5 text-[0.9375rem] font-medium transition-colors xl:px-3 ${
                active ? "font-semibold text-ink" : "text-ink hover:text-brand-deep"
              } after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-[2px] after:transition-colors xl:after:inset-x-3 ${
                active ? "after:bg-brand-dark" : "after:bg-transparent hover:after:bg-ink/25"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
