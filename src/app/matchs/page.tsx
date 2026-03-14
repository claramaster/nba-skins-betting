"use client";

import { useEffect, useState } from "react";

type NBAGame = {
  id: number;
  date: string;
  status: string | null;
  home_team_score: number;
  visitor_team_score: number;
  home_team: { id: number; abbreviation: string; full_name: string };
  visitor_team: { id: number; abbreviation: string; full_name: string };
};
type PickInfo = { player_id: string; player_name: string; prediction: string }[];
type Player = { id: string; name: string; slug: string };

const MONTHS = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function MatchsPage() {
  const [games, setGames] = useState<NBAGame[]>([]);
  const [picksByTeam, setPicksByTeam] = useState<Record<number, PickInfo>>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games?year=${year}&month=${month}`);
      const data = await res.json();
      setGames(data.games ?? []);
      setPicksByTeam(data.picksByTeam ?? {});
      setPlayers(data.players ?? []);
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
      await fetchGames();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-court-300">
          Matchs {MONTHS[month]} {year}
        </h1>
        <button
          onClick={sync}
          disabled={syncing || loading}
          className="rounded-lg bg-court-700 px-3 py-1.5 text-sm text-white hover:bg-court-600 disabled:opacity-50"
        >
          {syncing ? "Sync…" : "Rafraîchir"}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : sortedGames.length === 0 ? (
        <p className="text-gray-400">
          Aucun match pour ce mois (ou aucune draft avec équipes draftées).
        </p>
      ) : (
        <ul className="space-y-3">
          {sortedGames.map((g) => {
            const isFinal = g.status === "Final";
            const homePicks = picksByTeam[g.home_team.id] ?? [];
            const visitorPicks = picksByTeam[g.visitor_team.id] ?? [];
            const winnerId =
              isFinal && g.home_team_score !== g.visitor_team_score
                ? g.home_team_score > g.visitor_team_score
                  ? g.home_team.id
                  : g.visitor_team.id
                : null;

            return (
              <li
                key={g.id}
                className="rounded-xl border border-court-700 bg-court-800/50 p-4"
              >
                <div className="text-xs text-gray-500">
                  {formatDate(g.date)} — {g.status ?? "À venir"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className={winnerId === g.home_team.id ? "font-semibold text-court-300" : "text-gray-300"}>
                    {g.home_team.abbreviation}
                  </span>
                  <span className="text-gray-500">
                    {isFinal ? `${g.home_team_score} - ${g.visitor_team_score}` : "–"}
                  </span>
                  <span className={winnerId === g.visitor_team.id ? "font-semibold text-court-300" : "text-gray-300"}>
                    {g.visitor_team.abbreviation}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {homePicks.map((p) => (
                    <span
                      key={p.player_id + p.prediction}
                      className="rounded bg-court-700/70 px-2 py-0.5 text-gray-300"
                    >
                      {p.player_name} ({p.prediction})
                    </span>
                  ))}
                  {visitorPicks.map((p) => (
                    <span
                      key={p.player_id + p.prediction}
                      className="rounded bg-court-700/70 px-2 py-0.5 text-gray-300"
                    >
                      {p.player_name} ({p.prediction})
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
