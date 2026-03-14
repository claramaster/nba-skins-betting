"use client";

import { useEffect, useState } from "react";

type Player = { id: string; name: string; slug: string };
type MonthKey = { year: number; month: number };

const MONTHS = ["", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr"];

export default function ClassementPage() {
  const [seasonStartYear, setSeasonStartYear] = useState(0);
  const [months, setMonths] = useState<MonthKey[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pointsByPlayerMonth, setPointsByPlayerMonth] = useState<
    Record<string, Record<string, number>>
  >({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [picks, setPicks] = useState<
    { draft_id: string; player_id: string; nba_team_abbreviation: string; prediction: string; pick_order: number }[]
  >([]);
  const [drafts, setDrafts] = useState<{ id: string; year: number; month: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<MonthKey | null>(null);

  useEffect(() => {
    fetch("/api/season")
      .then((r) => r.json())
      .then((data) => {
        setSeasonStartYear(data.seasonStartYear ?? 0);
        setMonths(data.months ?? []);
        setPlayers(data.players ?? []);
        setPointsByPlayerMonth(data.pointsByPlayerMonth ?? {});
        setTotals(data.totals ?? {});
        setPicks(data.picks ?? []);
        setDrafts(data.drafts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const monthLabel = (m: MonthKey) =>
    `${MONTHS[m.month] ?? m.month} ${m.year}`;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    );
  }

  const sortedPlayers = [...players].sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl text-court-300">
        Classement de saison {seasonStartYear}-{seasonStartYear + 1}
      </h1>

      <div className="overflow-x-auto rounded-xl border border-court-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-court-700 bg-court-800 text-gray-400">
              <th className="p-3">Joueur</th>
              {months.map((m) => (
                <th key={`${m.year}-${m.month}`} className="p-2 text-center">
                  {monthLabel(m)}
                </th>
              ))}
              <th className="p-3 text-right font-medium text-court-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((pl) => (
              <tr key={pl.id} className="border-b border-court-700/50">
                <td className="p-3 font-medium text-white">{pl.name}</td>
                {months.map((m) => {
                  const key = `${m.year}-${m.month}`;
                  const pts = pointsByPlayerMonth[pl.id]?.[key] ?? 0;
                  return (
                    <td key={key} className="p-2 text-center text-gray-300">
                      {pts > 0 ? pts : "—"}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-display text-court-300">
                  {totals[pl.id] ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="font-display text-lg text-court-300 mb-2">
          Historique des drafts
        </h2>
        <div className="space-y-2">
          {drafts.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() =>
                setSelectedDraft(
                  selectedDraft?.year === d.year && selectedDraft?.month === d.month
                    ? null
                    : { year: d.year, month: d.month }
                )
              }
              className="w-full rounded-lg border border-court-700 bg-court-800/50 p-3 text-left hover:bg-court-800"
            >
              <span className="font-medium text-white">
                {monthLabel({ year: d.year, month: d.month })}
              </span>
              {selectedDraft?.year === d.year && selectedDraft?.month === d.month && (
                <div className="mt-2 text-xs text-gray-400">
                  {players.map((pl) => {
                    const playerPicks = picks
                      .filter(
                        (p) =>
                          p.draft_id === d.id &&
                          p.player_id === pl.id
                      )
                      .sort((a, b) => a.pick_order - b.pick_order);
                    return (
                      <div key={pl.id}>
                        {pl.name}:{" "}
                        {playerPicks
                          .map((p) => `${p.nba_team_abbreviation} (${p.prediction})`)
                          .join(", ") || "—"}
                      </div>
                    );
                  })}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
