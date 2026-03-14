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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 className="text-2xl font-semibold text-neutral-900">
          Matchs {MONTHS[month]} {year}
        </h1>
        <button
          onClick={sync}
          disabled={syncing || loading}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 disabled:opacity-50 active:scale-[0.98]"
        >
          {syncing ? "Sync…" : "Rafraîchir"}
        </button>
      </div>

      {loading ? (
        <p className="text-neutral-500">Chargement…</p>
      ) : sortedGames.length === 0 ? (
        <p className="text-neutral-500">
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
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card"
              >
                <div className="text-xs text-neutral-500">
                  {formatDate(g.date)} — {g.status ?? "À venir"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className={winnerId === g.home_team.id ? "font-semibold text-neutral-900" : "text-neutral-600"}>
                    {g.home_team.abbreviation}
                  </span>
                  <span className="text-neutral-400">
                    {isFinal ? `${g.home_team_score} - ${g.visitor_team_score}` : "–"}
                  </span>
                  <span className={winnerId === g.visitor_team.id ? "font-semibold text-neutral-900" : "text-neutral-600"}>
                    {g.visitor_team.abbreviation}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {homePicks.map((p) => (
                    <span
                      key={p.player_id + p.prediction}
                      className="rounded-xl bg-neutral-100 px-2.5 py-1 text-neutral-600"
                    >
                      {p.player_name} ({p.prediction})
                    </span>
                  ))}
                  {visitorPicks.map((p) => (
                    <span
                      key={p.player_id + p.prediction}
                      className="rounded-xl bg-neutral-100 px-2.5 py-1 text-neutral-600"
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
