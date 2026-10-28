import type { Metadata } from "next";
import { company } from "@/content/site";
import { pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Adatvédelmi tájékoztató",
    description:
      "Adatkezelési tájékoztató: milyen adatokat kezelünk a rendelési igény beküldésekor, hogyan kerülnek hozzánk, és meddig őrizzük meg azokat.",
    path: "/adatvedelem",
  }),
  robots: { index: false },
};

export default function AdatvedelemPage() {
  return (
    <Section
      kicker="Jogi"
      title="Adatvédelmi tájékoztató"
      lead="A rendelési igény beküldéséhez csak a szükséges adatokat kérjük: név, e-mail-cím, telefonszám és a szállítási cím."
    >
      <div className="max-w-3xl space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Adatkezelő</h2>
          <p className="mt-2">
            {company.name} ({company.address.full}; {company.email};{" "}
            {company.phone.display}).
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Milyen adatot és miért?
          </h2>
          <p className="mt-2">
            Az árkalkulátorból beküldött rendelési igényhez a következő adatokat
            kezeljük: név, e-mail-cím, telefonszám, a kiválasztott anyag és
            termékváltozat, a mennyiség, a település, a kerület, az irányítószám,
            a szállítási cím, a kívánt időpont (ha megadta), a behajtási
            engedélyre adott válasz, az árösszesítő, a megjegyzés és az árazási
            verzió. Cél: a rendelési igény feldolgozása és az ajánlatadás.
            Jogalap: a szerződés előkészítése — az adatok megadása önkéntes, de
            a megjelölt mezők nélkül az igény nem küldhető be.
          </p>
          <p className="mt-2">
            A beküldés <strong className="font-semibold text-ink">rendelési igénynek</strong>{" "}
            minősül: a megrendelés a részletek egyeztetése és visszaigazolásunk
            után válik véglegessé.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Hogyan kerül hozzánk a rendelési igény?
          </h2>
          <p className="mt-2">
            A beküldött adatokat a weboldal titkosított kapcsolaton, az üzenet
            törzsében továbbítja a saját beküldés-feldolgozó szolgáltatásunknak,
            amely az igényt e-mailben juttatja el a {company.email} címre. A
            válaszcím az Ön megadott e-mail-címe. Személyes adat nem kerül
            internetcímbe (URL-be), és a feldolgozás során nem naplózzuk az
            üzenet tartalmát.
          </p>
          <p className="mt-2">
            Visszaélés elleni védelemként a beküldések számát korlátozzuk, és a
            kétszer elküldött, azonos igényt felismerjük. Ehhez a beküldés
            technikai azonosítóját és a kérés IP-címét rövid ideig kezeljük.
          </p>
          <p className="mt-2">
            A számítás piszkozata (anyag, mennyiség, település, kerület,
            irányítószám) kizárólag az Ön böngészőjében, a saját eszközén
            tárolódik (localStorage), és bármikor törölheti a böngésző
            beállításaiban. A kapcsolati adatokat (név, e-mail, telefon) a
            böngésző nem tárolja.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Meddig őrizzük meg?
          </h2>
          <p className="mt-2">
            Az ajánlatkérés tárgyában átvett e-maileket az ajánlatadás és az
            esetleges megrendelés egyeztetéséig, jogi megőrzési kötelezettség
            szerinti mértékben kezeljük.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Jogai</h2>
          <p className="mt-2">
            Kérhet tájékoztatást az adatai kezeléséről, kérheti azok
            helyesbítését vagy törlését, és panaszt nyújthat be a Nemzeti
            Adatvédelmi és Információszabadság Hatósághoz (NAIH). A
            gyakorláshoz írjon a {company.email} címre.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Sütik és mérés</h2>
          <p className="mt-2">
            A weboldal a Google Analytics 4-et csak hozzájárulás után tölti be:
            első látogatáskor banner kér engedélyt, amelyet bármikor visszavonhat a
            böngésző tárolásának törlésével. Hozzájárulás nélkül a mérés nem indul
            el, a hívás- és beküldés-gombok működése ettől független. A mérés
            során az IP-cím anonimizálva kezelődik, hirdetési célú tárolás nem
            történik. A lefedettségi térkép az OpenStreetMap csempeszolgáltatását
            használja: a térkép megjelenítésekor a böngészője kapcsolatba lép az
            OpenStreetMap szervereivel, amelyek saját szabályaik szerint
            kezelhetnek adatot.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Hívás- és beküldés-mérés</h2>
          <p className="mt-2">
            A telefonos és e-mailes megkeresések mennyiségét az oldalon belül,
            név nélkül mérjük (melyik gombot, melyik oldalról nyomták meg).
            Személyes adatot ez a mérés nem kezel, az adatkezelő pedig
            {" "}
            {company.name} ({company.email}).
          </p>
        </section>
      </div>
    </Section>
  );
}
