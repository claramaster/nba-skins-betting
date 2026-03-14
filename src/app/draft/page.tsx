"use client";

import { useEffect, useState, useCallback } from "react";

type Player = { id: string; slug: string; name: string };
type Draft = {
  id: string;
  year: number;
  month: number;
  draft_order: number[];
  draft_mode: "snake" | "regular";
  status: "draft" | "completed";
};
type Pick = {
  id: string;
  draft_id: string;
  player_id: string;
  nba_team_id: number;
  nba_team_abbreviation: string | null;
  nba_team_name: string | null;
  prediction: "W" | "L";
  pick_order: number;
  players: { name: string; slug: string } | null;
};
type NBATeam = {
  id: number;
  abbreviation: string;
  full_name: string;
  city: string;
  name: string;
};

const MONTHS = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function getCurrentTurn(
  draft: Draft,
  players: Player[],
  pickCount: number
): { player: Player; label: string } | null {
  if (pickCount >= 28) return null;
  const order = draft.draft_order;
  let idx: number;
  if (draft.draft_mode === "snake") {
    const round = Math.floor(pickCount / 4);
    const pos = pickCount % 4;
    idx = round % 2 === 1 ? order[3 - pos]! : order[pos]!;
  } else {
    idx = order[pickCount % 4]!;
  }
  const player = players[idx];
  if (!player) return null;
  const letters = "ABCD";
  const label = `${letters[pickCount % 4]} — ${player.name}`;
  return { player, label };
}

export default function DraftPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [teams, setTeams] = useState<NBATeam[]>([]);
  const [standings, setStandings] = useState<Record<number, { wins: number; losses: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<{ team: NBATeam; prediction: "W" | "L" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [mySlug, setMySlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMySlug(d.slug ?? null))
      .catch(() => setMySlug(null));
  }, []);

  const fetchDraft = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/draft");
      const data = await res.json();
      setPlayers(data.players ?? []);
      setDraft(data.draft);
      setPicks(data.picks ?? []);
      setTeams(data.teams ?? []);
      setStandings(data.standings ?? {});
    } catch (e) {
      setError("Erreur chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const startDraft = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/draft/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      await fetchDraft();
    } catch {
      setError("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const makePick = async (playerId: string, team: NBATeam, prediction: "W" | "L") => {
    if (!draft) return;
    setSaving(true);
    setSelecting(null);
    try {
      const res = await fetch("/api/draft/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          playerId,
          nbaTeamId: team.id,
          teamAbbreviation: team.abbreviation,
          teamName: team.full_name ?? `${team.city} ${team.name}`,
          prediction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setError("");
      await fetchDraft();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    );
  }

  const draftedIds = new Set(picks.map((p) => p.nba_team_id));
  const currentTurn = draft ? getCurrentTurn(draft, players, picks.length) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-court-300">
          Draft {draft ? `${MONTHS[draft.month]} ${draft.year}` : "mensuelle"}
        </h1>
        {!draft && (
          <button
            onClick={startDraft}
            disabled={saving}
            className="rounded-lg bg-court-600 px-4 py-2 font-medium text-white hover:bg-court-500 disabled:opacity-50"
          >
            {saving ? "…" : "Lancer la draft"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {draft && (
        <>
          <div className="rounded-xl border border-court-700 bg-court-800/50 p-4">
            <p className="text-sm text-gray-400">Mode : {draft.draft_mode === "snake" ? "Serpent (A→D→D→A…)" : "Régulier (A→B→C→D…)"}</p>
            {currentTurn && draft.status === "draft" && (
              <p className="mt-2 font-display text-lg text-court-300">
                À toi de choisir : <span className="text-white">{currentTurn.label}</span>
              </p>
            )}
            {draft.status === "completed" && (
              <p className="mt-2 text-court-400">Draft terminée.</p>
            )}
          </div>

          {draft.status === "draft" && currentTurn && (
            <div className="rounded-xl border border-court-700 bg-court-800/50 p-4">
              {selecting ? (
                <>
                  <p className="mb-3 text-sm text-gray-400">
                    Pari pour <strong className="text-white">{selecting.team.abbreviation}</strong> ({selecting.team.full_name ?? selecting.team.city + " " + selecting.team.name}) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        makePick(currentTurn!.player.id, selecting!.team, "W")
                      }
                      disabled={saving}
                      className="rounded-lg bg-green-700/60 px-4 py-2 text-white hover:bg-green-600"
                    >
                      W (gagne)
                    </button>
                    <button
                      onClick={() =>
                        makePick(currentTurn!.player.id, selecting!.team, "L")
                      }
                      disabled={saving}
                      className="rounded-lg bg-red-700/60 px-4 py-2 text-white hover:bg-red-600"
                    >
                      L (perd)
                    </button>
                    <button
                      onClick={() => setSelecting(null)}
                      className="rounded-lg border border-court-600 px-4 py-2 text-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">Choisis une équipe ci-dessous puis ton pari (W/L).</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {teams.map((team) => {
              const picked = draftedIds.has(team.id);
              const pick = picks.find((p) => p.nba_team_id === team.id);
              const st = standings[team.id];
              const wl = st ? `${st.wins}-${st.losses}` : "—";

              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={
                    picked ||
                    draft.status === "completed" ||
                    !currentTurn ||
                    currentTurn.player.slug !== mySlug
                  }
                  onClick={() => {
                    if (picked || !currentTurn) return;
                    setSelecting({ team, prediction: "W" });
                  }}
                  className={`rounded-lg border p-3 text-left transition ${
                    picked
                      ? "border-court-700 bg-court-900/80 opacity-70 cursor-default"
                      : currentTurn && currentTurn.player.slug === mySlug
                        ? "border-court-600 bg-court-800 hover:bg-court-700 cursor-pointer"
                        : currentTurn
                          ? "border-court-700 bg-court-800/80 cursor-not-allowed opacity-90"
                          : "border-court-800 bg-court-900/50 cursor-default"
                  }`}
                >
                  <div className="font-semibold text-white">
                    {team.abbreviation ?? team.full_name}
                  </div>
                  <div className="text-xs text-gray-400">W-L {wl}</div>
                  {pick && (
                    <div className="mt-1 text-xs text-court-400">
                      {pick.players?.name} — {pick.prediction}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-court-700 bg-court-800/50 p-4">
            <h2 className="font-display text-lg text-court-300">Récap — {picks.length}/28</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-1 pr-2">Joueur</th>
                    <th className="pb-1">Équipes (W/L)</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((pl) => {
                    const playerPicks = picks.filter((p) => p.player_id === pl.id);
                    return (
                      <tr key={pl.id} className="border-t border-court-700/50">
                        <td className="py-1.5 pr-2 font-medium text-white">{pl.name}</td>
                        <td className="py-1.5 text-gray-300">
                          {playerPicks.length === 0
                            ? "—"
                            : playerPicks
                                .sort((a, b) => a.pick_order - b.pick_order)
                                .map((p) => `${p.nba_team_abbreviation ?? p.nba_team_id} (${p.prediction})`)
                                .join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!draft && (
        <p className="text-gray-400">
          Aucune draft en cours pour ce mois. Clique sur « Lancer la draft » pour tirer au sort
          l’ordre et le mode (serpent ou régulier).
        </p>
      )}
    </div>
  );
}
