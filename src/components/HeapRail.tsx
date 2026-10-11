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
        const ul = e.currentTarget;
        const li = (e.target as HTMLElement).closest("li");
        if (!li || !ul.contains(li)) return;
        if (ul.scrollWidth <= ul.clientWidth) return;
        const r = ul.getBoundingClientRect();
        const q = li.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(ul).scrollPaddingLeft) || 0;
        if (q.left >= r.left + pad - 1 && q.right <= r.right + 1) return;
        // A kártya saját snap-pozíciójára (bal él + scroll-padding) görgetünk:
        // ez mindig érvényes snap-pont, így a kötelező snap nem rántja vissza.
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        ul.scrollTo({ left: ul.scrollLeft + q.left - r.left - pad, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      {children}
    </ul>
  );
}
