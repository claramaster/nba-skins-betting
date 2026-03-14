"use client";

import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
        <h1 className="font-display text-2xl text-court-300">
          Scores {MONTHS[month]} {year}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={sync}
            disabled={syncing || loading}
            className="rounded-lg bg-court-700 px-3 py-1.5 text-sm text-white hover:bg-court-600 disabled:opacity-50"
          >
            {syncing ? "Sync…" : "Rafraîchir"}
          </button>
          <button
            onClick={finalize}
            disabled={finalizing || loading}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-sm text-court-300 hover:bg-court-800 disabled:opacity-50"
          >
            {finalizing ? "…" : "Clôturer le mois (6/3/1)"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-court-700 bg-court-800/50 p-4">
        <p className="text-sm text-gray-400">
          X = nombre de matchs retenus pour l’égalisation : <strong className="text-white">{xMatchCount}</strong>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Seuls les X premiers matchs chronologiques de chaque joueur comptent pour le classement.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : sorted.length === 0 ? (
        <p className="text-gray-400">Aucun score (draft du mois ou matchs manquants).</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-court-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-court-700 bg-court-800 text-gray-400">
                  <th className="p-3">Rang</th>
                  <th className="p-3">Joueur</th>
                  <th className="p-3 text-right">Matchs</th>
                  <th className="p-3 text-right">Pts (sur X)</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.player_id} className="border-b border-court-700/50">
                    <td className="p-3 font-display text-court-400">{i + 1}</td>
                    <td className="p-3 font-medium text-white">{row.player_name}</td>
                    <td className="p-3 text-right text-gray-300">
                      {row.match_count}
                      {xMatchCount > 0 && row.match_count > xMatchCount && (
                        <span className="ml-1 text-xs text-gray-500">
                          (max {xMatchCount})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium text-court-300">
                      {row.score_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            En fin de mois : 1er → 6 pts saison, 2e → 3 pts, 3e → 1 pt (ex-æquo partagés).
          </p>
        </>
      )}
    </div>
  );
}
