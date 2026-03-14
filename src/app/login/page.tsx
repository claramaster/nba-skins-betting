"use client";

import { useState } from "react";
import { getPlayerSlugs } from "@/lib/auth";
import { login } from "./actions";

const SLUG_LABELS: Record<string, string> = {
  carlito: "Carlito",
  papa: "Papa",
  vincent: "Vincent",
  tonio: "Tonio",
};

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const slugs = getPlayerSlugs();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Choisis ton profil.");
      return;
    }
    const result = await login(selected, password);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center gap-6 p-4">
      <h1 className="font-display text-3xl text-court-300">Connexion</h1>
      <p className="text-center text-sm text-gray-400">
        Choisis ton profil et entre le mot de passe commun.
      </p>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {slugs.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setSelected(slug)}
              className={`rounded-lg border-2 py-3 font-medium transition ${
                selected === slug
                  ? "border-court-400 bg-court-700 text-white"
                  : "border-court-700 bg-court-800/50 text-gray-300 hover:border-court-600"
              }`}
            >
              {SLUG_LABELS[slug] ?? slug}
            </button>
          ))}
        </div>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-court-700 bg-court-900 px-4 py-3 text-white placeholder-gray-500"
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-court-600 py-3 font-medium text-white hover:bg-court-500"
        >
          Entrer
        </button>
      </form>
    </div>
  );
}
