import type { Metadata } from "next";
import { company } from "@/content/site";
import { pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Adatvédelmi tájékoztató",
    description:
      "Adatkezelési tájékoztató: milyen adatokat kezelünk az ajánlatkéréskor, és hogyan kezeljük azokat.",
    path: "/adatvedelem",
  }),
  robots: { index: false },
};

export default function AdatvedelemPage() {
  return (
    <Section
      kicker="Jogi"
      title="Adatvédelmi tájékoztató"
      lead="Az ajánlatkéréshez csak a szükséges adatokat kérjük: név és telefonszám."
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
            Az árkalkulátor ajánlatkéréséhez a nevét és telefonszámát kérjük,
            valamint az általa megadott anyag-, mennyiség- és helyszín-adatokat
            az ajánlatadás céljából. Jogalap: a szerződés előkészítése
            (ajánlatkérés) — a jelentkező adatok megadása önkéntes.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Hogyan kerül hozzánk az ajánlatkérés?
          </h2>
          <p className="mt-2">
            Az űrlap az Ön eszközén állítja össze az e-mailt, amelyet az Ön
            e-mail kliense küld el a {company.email} címre. A weboldal maga nem
            tárol és nem továbbít szerveroldali adatot. A számítás piszkozata
            kizárólag az Ön böngészőjében, a saját eszközén tárolódik
            (localStorage), és bármikor törölheti a böngésző beállításaiban.
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
            el, a hívás- és ajánlatkérés-gombok működése ettől független. A mérés
            során az IP-cím anonimizálva kezelődik, hirdetési célú tárolás nem
            történik. Külső térképi beágyazás (Google Maps) töltődhet a kapcsolati
            oldalon, amelynek szolgáltatója a betöltéskor saját szabályai szerint
            kezelhet adatot.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Hívás- és ajánlatkérés-mérés</h2>
          <p className="mt-2">
            A telefonos és e-mail megkeresések mennyiségét az oldalon belül,
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
