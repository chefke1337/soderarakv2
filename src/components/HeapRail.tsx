"use client";

/**
 * A hero anyagsávjának <ul>-je. Egyetlen feladata: billentyűzetes fókusznál
 * a kártyát teljesen a sávba görgeti. (A böngésző alapból nem görget, ha az
 * elem részben már látszik — egy félig belógó kártya így félig rejtve
 * maradna.) A tartalom szerveroldalon renderelt; JS nélkül is működik.
 */
export default function HeapRail({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <ul
      className={className}
      onFocus={(e) => {
        const li = (e.target as HTMLElement).closest("li");
        if (!li || !e.currentTarget.contains(li)) return;
        if (e.currentTarget.scrollWidth <= e.currentTarget.clientWidth) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        li.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
      }}
    >
      {children}
    </ul>
  );
}
