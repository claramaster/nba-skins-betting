"use client";

import { getPlayerSlugs } from "@/lib/auth";
import { chooseProfile } from "./actions";

const SLUG_LABELS: Record<string, string> = {
  carlito: "Carlito",
  papa: "Papa",
  vincent: "Vincent",
  tonio: "Tonio",
};

export default function LoginPage() {
  const slugs = getPlayerSlugs();

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Qui es-tu ?
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Choisis ton profil pour continuer.
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        {slugs.map((slug) => (
          <form key={slug} action={chooseProfile.bind(null, slug)}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-neutral-200 bg-white py-4 text-base font-medium text-neutral-900 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
            >
              {SLUG_LABELS[slug] ?? slug}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
