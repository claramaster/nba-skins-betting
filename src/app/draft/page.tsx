"use client";

import { useEffect, useState, useCallback } from "react";
import { nbaTeamLogoUrl } from "@/lib/nba-team-logo";

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
  const [teamsSource, setTeamsSource] = useState<"api" | "static" | null>(null);
  const [standings, setStandings] = useState<Record<number, { wins: number; losses: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<{ team: NBATeam; prediction: "W" | "L" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftModeChoice, setDraftModeChoice] = useState<"regular" | "snake" | null>(null);

  const fetchDraft = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/draft");
      const data = await res.json();
      setPlayers(data.players ?? []);
      setDraft(data.draft);
      setPicks(data.picks ?? []);
      setTeams(data.teams ?? []);
      setTeamsSource(data.teamsSource ?? null);
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

  const startDraft = async (mode?: "regular" | "snake") => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/draft/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode ? { draft_mode: mode } : {}),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        setError(
          text.includes("<!") || text.includes("<!DOCTYPE")
            ? "Le serveur a renvoyé une page d’erreur. Vérifie sur Bolt que les variables Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) sont bien configurées."
            : "Réponse serveur invalide. Vérifie la config Supabase sur Bolt."
        );
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      await fetchDraft();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
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
        <p className="text-neutral-500">Chargement…</p>
      </div>
    );
  }

  const draftedIds = new Set(picks.map((p) => p.nba_team_id));
  const currentTurn = draft ? getCurrentTurn(draft, players, picks.length) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Draft {draft ? `${MONTHS[draft.month]} ${draft.year}` : "mensuelle"}
        </h1>
        {!draft && (
          <div className="flex flex-wrap items-center gap-2">
            {draftModeChoice == null ? (
              <>
                <button
                  type="button"
                  onClick={() => setDraftModeChoice("regular")}
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 active:scale-[0.98]"
                >
                  Classique (A→B→C→D…)
                </button>
                <button
                  type="button"
                  onClick={() => setDraftModeChoice("snake")}
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 active:scale-[0.98]"
                >
                  Serpent (A→D→C→B…)
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-neutral-500">
                  Mode : {draftModeChoice === "snake" ? "Serpent" : "Classique"}
                </span>
                <button
                  type="button"
                  onClick={() => startDraft(draftModeChoice)}
                  disabled={saving}
                  className="rounded-2xl bg-accent px-5 py-2.5 font-medium text-white shadow-card transition hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? "…" : "Lancer la draft"}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftModeChoice(null)}
                  className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
                >
                  Changer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {draft && (
        <>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-900">Récap — {picks.length}/28</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="pb-2 pr-3">Joueur</th>
                    <th className="pb-2">Équipes (W / L)</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((pl) => {
                    const playerPicks = picks.filter((p) => p.player_id === pl.id);
                    const byPrediction = {
                      W: playerPicks.filter((p) => p.prediction === "W").sort((a, b) => a.pick_order - b.pick_order),
                      L: playerPicks.filter((p) => p.prediction === "L").sort((a, b) => a.pick_order - b.pick_order),
                    };
                    return (
                      <tr key={pl.id} className="border-t border-neutral-100">
                        <td className="py-2 pr-3 font-medium text-neutral-900">{pl.name}</td>
                        <td className="py-2 text-neutral-600">
                          {playerPicks.length === 0 ? (
                            "—"
                          ) : (
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-neutral-400">W:</span>
                                {byPrediction.W.map((p) => {
                                  const abbr = p.nba_team_abbreviation ?? teams.find((t) => t.id === p.nba_team_id)?.abbreviation ?? String(p.nba_team_id);
                                  return (
                                    <span key={p.id} className="inline-flex items-center gap-1">
                                      <img
                                        src={nbaTeamLogoUrl(abbr)}
                                        alt=""
                                        className="h-5 w-5 rounded-full object-contain"
                                      />
                                      <span>{abbr}</span>
                                    </span>
                                  );
                                })}
                                {byPrediction.W.length === 0 && <span className="text-neutral-300">—</span>}
                              </span>
                              <span className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-neutral-400">L:</span>
                                {byPrediction.L.map((p) => {
                                  const abbr = p.nba_team_abbreviation ?? teams.find((t) => t.id === p.nba_team_id)?.abbreviation ?? String(p.nba_team_id);
                                  return (
                                    <span key={p.id} className="inline-flex items-center gap-1">
                                      <img
                                        src={nbaTeamLogoUrl(abbr)}
                                        alt=""
                                        className="h-5 w-5 rounded-full object-contain"
                                      />
                                      <span>{abbr}</span>
                                    </span>
                                  );
                                })}
                                {byPrediction.L.length === 0 && <span className="text-neutral-300">—</span>}
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <p className="text-sm text-neutral-500">
              Mode : {draft.draft_mode === "snake" ? "Serpent (A→D→D→A…)" : "Régulier (A→B→C→D…)"}
            </p>
            {currentTurn && draft.status === "draft" && (
              <p className="mt-2 text-lg font-medium text-neutral-900">
                À toi de choisir : <span className="text-accent">{currentTurn.label}</span>
              </p>
            )}
            {draft.status === "completed" && (
              <p className="mt-2 text-neutral-500">Draft terminée.</p>
            )}
          </div>

          {draft.status === "draft" && currentTurn && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
              {selecting ? (
                <>
                  <p className="mb-3 text-sm text-neutral-500">
                    Pari pour <strong className="text-neutral-900">{selecting.team.abbreviation}</strong> ({selecting.team.full_name ?? selecting.team.city + " " + selecting.team.name}) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        makePick(currentTurn!.player.id, selecting!.team, "W")
                      }
                      disabled={saving}
                      className="rounded-xl bg-green-500 px-4 py-2.5 font-medium text-white transition hover:bg-green-600 disabled:opacity-50 active:scale-[0.98]"
                    >
                      W (gagne)
                    </button>
                    <button
                      onClick={() =>
                        makePick(currentTurn!.player.id, selecting!.team, "L")
                      }
                      disabled={saving}
                      className="rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white transition hover:bg-red-600 disabled:opacity-50 active:scale-[0.98]"
                    >
                      L (perd)
                    </button>
                    <button
                      onClick={() => setSelecting(null)}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-neutral-600 transition hover:bg-neutral-50"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500">Choisis une équipe ci-dessous puis ton pari (W/L).</p>
              )}
            </div>
          )}

          {teams.length === 0 && draft.status === "draft" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Les équipes NBA n’ont pas pu être chargées (liste statique non disponible). Optionnel : crée un compte gratuit sur{" "}
              <a href="https://app.balldontlie.io" target="_blank" rel="noopener noreferrer" className="underline">app.balldontlie.io</a>{" "}
              et définis <code className="rounded bg-amber-100 px-1">BALLDONTLIE_API_KEY</code> pour utiliser l’API (gratuit : 30 req/min, équipes + matchs).
            </div>
          )}

          {teamsSource === "static" && (
            <p className="text-xs text-neutral-400">
              Équipes : liste statique (sans API). Les scores seront calculés plus tard (fichier ou API).
            </p>
          )}
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {teams
              .filter((team) => !draftedIds.has(team.id) || selecting?.team.id === team.id)
              .map((team) => {
                const picked = draftedIds.has(team.id);
                const isActive = selecting?.team.id === team.id;
                const canPick = currentTurn && !picked && draft.status === "draft";
                const fullName = team.full_name ?? `${team.city} ${team.name}`;

                return (
                  <button
                    key={team.id}
                    type="button"
                    disabled={(picked && !isActive) || draft.status === "completed" || !currentTurn}
                    onClick={() => {
                      if (!canPick && !isActive) return;
                      if (isActive) return;
                      setSelecting({ team, prediction: "W" });
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      isActive
                        ? "cursor-default border-accent bg-accent/10 ring-2 ring-accent shadow-card"
                        : picked
                          ? "cursor-default border-neutral-200 bg-neutral-100 opacity-60"
                          : canPick
                            ? "border-neutral-300 bg-white shadow-card hover:border-accent hover:shadow-card-hover cursor-pointer active:scale-[0.98]"
                            : "cursor-default border-neutral-200 bg-neutral-50"
                    }`}
                  >
                    <img
                      src={nbaTeamLogoUrl(team.abbreviation)}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-contain bg-neutral-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-neutral-900 text-sm leading-tight">
                        {team.abbreviation ?? team.full_name}
                      </div>
                      <div className="truncate text-[10px] text-neutral-500">
                        ({fullName})
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </>
      )}

      {!draft && (
        <p className="text-neutral-500">
          Aucune draft en cours pour ce mois. Choisis le mode (classique ou serpent) puis lance la draft.
        </p>
      )}
    </div>
  );
}
