import { company, materialGroups, MIN_ORDER_M3, SINGLE_TRIP_MAX_M3 } from "@/content/site";
import { withBasePath } from "@/lib/basepath";
import { formatFt, IconArrowRight, IconPhone, PhoneLink } from "@/lib/ui";

/**
 * Hero „gyors ajánlat": a fő felhasználói út első három lépése
 * (anyag → mennyiség → irányítószám) egy helyen, és a kalkulátor ezekkel
 * előtöltve nyílik (`?anyag=&m3=&irsz=`). Sima GET-űrlap: JavaScript nélkül
 * is működik, nem küld adatot sehová — csak a kalkulátor oldalát nyitja meg.
 * Az árat és a fuvardíjat mindig a kalkulátor számolja (src/lib/quote.ts).
 */
export default function HeroQuickQuote() {
  const quantities = Array.from(
    { length: SINGLE_TRIP_MAX_M3 - MIN_ORDER_M3 + 1 },
    (_, i) => MIN_ORDER_M3 + i,
  );

  return (
    <form
      action={withBasePath("/arkalkulator/")}
      method="get"
      aria-labelledby="gyors-ajanlat-cim"
      className="quick-quote"
    >
      <div className="quick-quote-head">
        <h2 id="gyors-ajanlat-cim" className="font-display text-[1.125rem] leading-tight font-bold">
          Számolja ki a szállított árat
        </h2>
        <p className="mt-1 text-sm leading-snug text-text-muted">
          Anyag, mennyiség, irányítószám — a kalkulátor ezekkel nyílik meg.
        </p>
      </div>

      <div className="quick-quote-fields">
        <div className="quick-field quick-field-wide">
          <label htmlFor="gy-anyag">Anyag</label>
          <select id="gy-anyag" name="anyag" defaultValue="soder-0-24">
            {materialGroups.map((g) => (
              <optgroup key={g.slug} label={g.name}>
                {g.items.map((i) => (
                  <option key={i.slug} value={i.slug}>
                    {i.name}
                    {i.priceGross !== null ? ` — ${formatFt(i.priceGross)}/m³` : " — egyeztetés után"}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="quick-field">
          <label htmlFor="gy-m3">Mennyiség</label>
          <select id="gy-m3" name="m3" defaultValue="8">
            {quantities.map((q) => (
              <option key={q} value={q}>
                {q} m³
              </option>
            ))}
            <option value="tobb">{SINGLE_TRIP_MAX_M3} m³ felett</option>
          </select>
        </div>

        <div className="quick-field">
          <label htmlFor="gy-irsz">Irányítószám</label>
          <input
            id="gy-irsz"
            name="irsz"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="pl. 1221"
            aria-describedby="gy-irsz-info"
            className="num"
          />
        </div>
      </div>

      <p id="gy-irsz-info" className="mt-2 text-xs leading-relaxed text-text-muted">
        Bruttó anyagárak, Ft/m³. A fuvardíjat az irányítószám és a mennyiség határozza meg.
      </p>

      <button type="submit" className="btn btn-lg btn-primary mt-4 w-full">
        Ár kiszámítása
        <IconArrowRight size={18} className="btn-icon btn-icon-move" />
      </button>

      <p className="quick-quote-call">
        <span className="text-text-muted">Inkább elmondaná?</span>{" "}
        <PhoneLink className="num inline-flex items-center gap-1.5 font-semibold text-accent-deep underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
          <IconPhone size={15} />
          {company.phone.display}
        </PhoneLink>
      </p>
    </form>
  );
}
