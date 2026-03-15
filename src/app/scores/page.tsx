"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ScoreRow = {
  player_id: string;
  player_name: string;
  slug: string;
  raw_correct: number;
  match_count: number;
  score_count: number;
};

const MONTHS = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function ScoresPage() {
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [xMatchCount, setXMatchCount] = useState(0);
  const [finalized, setFinalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingBbref, setSyncingBbref] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scores?year=${year}&month=${month}`);
      const data = await res.json();
      setScoreRows(data.scoreRows ?? []);
      setXMatchCount(data.xMatchCount ?? 0);
      setFinalized(data.finalized ?? false);
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/games/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      await fetchScores();
    } finally {
      setSyncing(false);
    }
  };

  const syncBbref = async () => {
    setSyncingBbref(true);
    try {
      const res = await fetch("/api/games/sync-bbref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Erreur import");
        return;
      }
      await fetchScores();
      if (data.synced != null) {
        alert(`${data.synced} match(s) importé(s) depuis basketball-reference.`);
      }
    } finally {
      setSyncingBbref(false);
    }
  };

  const finalize = async () => {
    setFinalizing(true);
    try {
      await fetch("/api/scores/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      await fetchScores();
    } finally {
      setFinalizing(false);
    }
  };

  useEffect(() => {
    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...scoreRows].sort((a, b) => b.score_count - a.score_count);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Scores {MONTHS[month]} {year}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={sync}
            disabled={syncing || loading}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 disabled:opacity-50 active:scale-[0.98]"
          >
            {syncing ? "Sync…" : "Rafraîchir (API)"}
          </button>
          <button
            onClick={syncBbref}
            disabled={syncingBbref || loading}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 disabled:opacity-50 active:scale-[0.98]"
          >
            {syncingBbref ? "…" : "Importer (basketball-reference)"}
          </button>
          {finalized ? (
            <Link
              href="/draft"
              className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-card transition hover:opacity-90 active:scale-[0.98]"
            >
              Lancer une nouvelle draft
            </Link>
          ) : (
            <button
              onClick={finalize}
              disabled={finalizing || loading}
              className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-card transition hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
            >
              {finalizing ? "…" : "Clôturer le mois (6/3/1)"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
        <p className="text-sm text-neutral-600">
          X = nombre de matchs retenus pour l’égalisation : <strong className="text-neutral-900">{xMatchCount}</strong>
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Seuls les X premiers matchs chronologiques de chaque joueur comptent pour le classement.
        </p>
      </div>

      {loading ? (
        <p className="text-neutral-500">Chargement…</p>
      ) : sorted.length === 0 ? (
        <p className="text-neutral-500">Aucun score (draft du mois ou matchs manquants).</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="p-4 font-medium text-neutral-500">Rang</th>
                  <th className="p-4 font-medium text-neutral-500">Joueur</th>
                  <th className="p-4 text-right font-medium text-neutral-500">Matchs</th>
                  <th className="p-4 text-right font-medium text-neutral-500">Pts (sur X)</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.player_id} className="border-b border-neutral-100 last:border-0">
                    <td className="p-4 font-medium text-neutral-400">{i + 1}</td>
                    <td className="p-4 font-medium text-neutral-900">{row.player_name}</td>
                    <td className="p-4 text-right text-neutral-600">
                      {row.match_count}
                      {xMatchCount > 0 && row.match_count > xMatchCount && (
                        <span className="ml-1 text-xs text-neutral-400">
                          (max {xMatchCount})
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-semibold text-accent">
                      {row.score_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">
            En fin de mois : 1er → 6 pts saison, 2e → 3 pts, 3e → 1 pt (ex-æquo partagés).
          </p>
        </>
      )}
    </div>
  );
}
