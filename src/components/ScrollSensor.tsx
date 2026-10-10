"use client";

import { useEffect } from "react";

/**
 * Scroll-érzékelő a mobil UX-hez: NEM renderel, csak a <html> elemre ír
 * data-attribútumokat, amelyekre a globals.css reagál (zero-render).
 *
 * KÜSZÖBÖK (hangolva + tesztelve 360px-en, lásd mobile-auditor memória):
 *  - SCROLLED_AT = 120 px → data-scrolled="true" (kompakt sáv, olvasható tartalom).
 *  - HIDE_AT = 240 px → efelett rejthető a fejléc; alatta mindig látható.
 *  - DIR_HYSTERESIS = 8 px KUMULATÍVan, horgony-alapú: az irány ahhoz a
 *    pozícióhoz képest fordul, ahol az utolsó irányváltás történt (anchorY).
 *    Miért nem eseményenkénti ±8px? Lassú görgetésnél frame-enként 1–2px jön,
 *    így az irány sosem fordult volna — lassú felfelé görgetésnél a fejléc
 *    rejtve maradt volna. A horgony-alapú összegzés gyors flicket (egy nagy
 *    ugrás) és lassú görgetést (sok pici) egyaránt kezel.
 *
 * Állapotgép (guard nélkül):
 *  - dir=down: fejléc rejt (transform translateY(-100%), CSS-ben).
 *  - dir=up: fejléc látható.
 *  - y ≤ HIDE_AT: mindig látható, horgony követi (friss kiindulás).
 * Guardok: fókusz a fejlécben VAGY nyitott mobilmenü → nem rejt, horgony
 * követi (a guard alatti mozgás nem gyűlik össze „adósságként”).
 *
 * Passzív listener, rAF nélkül (a handler csak összehasonlít és ír).
 * SSR-ben attribútum sincs (alapállapot: minden látható).
 */

const SCROLLED_AT = 120; // px — olvasható tartalom kezdete
const HIDE_AT = 240; // px — ez alatt a fejléc sosem rejtőzik
const DIR_HYSTERESIS = 8; // px, KUMULATÍV elmozdulás két irányváltás között

export default function ScrollSensor() {
  useEffect(() => {
    const root = document.documentElement;
    let dir: "up" | "down" = "up"; // biztonságos alap: betöltéskor sosem rejt
    let anchorY = window.scrollY; // az utolsó irányváltás pozíciója

    const update = () => {
      const y = window.scrollY;
      const scrolled = y > SCROLLED_AT;

      let hidden = false;
      if (scrolled && y > HIDE_AT) {
        const bar = document.querySelector(".header-bar");
        const guarded =
          !!bar &&
          (bar.contains(document.activeElement) ||
            bar.querySelector("[aria-expanded=\"true\"]") !== null);
        if (guarded) {
          anchorY = y; // guard alatt nincs mozgás-adósság
        } else {
          if (y - anchorY >= DIR_HYSTERESIS) {
            dir = "down";
            anchorY = y;
          } else if (anchorY - y >= DIR_HYSTERESIS) {
            dir = "up";
            anchorY = y;
          }
          hidden = dir === "down";
        }
      } else {
        anchorY = y; // a rejtési zóna alatt a horgony követ
      }

      if (root.dataset.scrolled !== String(scrolled)) {
        root.dataset.scrolled = String(scrolled);
      }
      if (root.dataset.headerHidden !== String(hidden)) {
        root.dataset.headerHidden = String(hidden);
      }
    };

    const onScroll = () => update();

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete root.dataset.scrolled;
      delete root.dataset.headerHidden;
    };
  }, []);

  return null;
}
