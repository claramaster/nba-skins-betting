"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ScoreRow = {
  player_id: string;
  player_name: string;
  score_count: number;
  match_count: number;
};

const MONTHS = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function HomePage() {
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [xMatchCount, setXMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    fetch(`/api/scores?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setScoreRows(data.scoreRows ?? []);
        setXMatchCount(data.xMatchCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  const sorted = [...scoreRows].sort((a, b) => b.score_count - a.score_count);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Score du mois — {MONTHS[month]} {year}
        </h1>
        <Link
          href="/scores"
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50"
        >
          Détail
        </Link>
      </div>

      {loading ? (
        <p className="text-neutral-500">Chargement…</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-500 shadow-card">
          Aucun score ce mois-ci (lance une draft et synchronise les matchs sur la page Scores).
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-card">
            <p className="text-sm text-neutral-600">
              X = <strong className="text-neutral-900">{xMatchCount}</strong> matchs comptés par joueur
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="p-4 font-medium text-neutral-500">Rang</th>
                  <th className="p-4 font-medium text-neutral-500">Joueur</th>
                  <th className="p-4 text-right font-medium text-neutral-500">Pts</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.player_id} className="border-b border-neutral-100 last:border-0">
                    <td className="p-4 font-medium text-neutral-400">{i + 1}</td>
                    <td className="p-4 font-medium text-neutral-900">{row.player_name}</td>
                    <td className="p-4 text-right font-semibold text-accent">{row.score_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
