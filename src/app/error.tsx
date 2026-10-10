"use client";

import { useEffect } from "react";
import Link from "next/link";
import { company } from "@/content/site";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Váratlan hiba:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Váratlan hiba történt</h1>
      <p className="text-ink-soft">
        Az oldal egy része nem tudott betölteni. Próbálja meg újra, vagy hívjon minket közvetlenül.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-brand-dark px-5 py-3 font-semibold text-paper shadow-card transition-colors hover:bg-brand-deep"
        >
          Próbálja újra
        </button>
        <Link
          href="/"
          className="rounded-sm border border-line bg-paper px-5 py-3 font-semibold transition-colors hover:bg-sand"
        >
          Vissza a főoldalra
        </Link>
        <a
          href={`tel:${company.phone.raw}`}
          className="rounded-sm border border-line bg-paper px-5 py-3 font-semibold transition-colors hover:bg-sand"
        >
          Hívás: {company.phone.display}
        </a>
      </div>
    </main>
  );
}
