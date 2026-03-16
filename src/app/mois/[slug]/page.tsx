"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { nbaTeamLogoUrl } from "@/lib/nba-team-logo";
import { getMonthBySlug, getMonthDateRange } from "@/lib/season-months";

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
type GameInTooltip = {
  game_date: string;
  home_abbreviation: string;
  visitor_abbreviation: string;
  winner_abbreviation: string;
};
type TeamScore = {
  nba_team_abbreviation: string;
  prediction: string;
  points: number;
  games?: GameInTooltip[];
};
type ScoreRow = {
  player_id: string;
  player_name: string;
  slug: string;
  raw_correct: number;
  match_count: number;
  score_count: number;
  teamScores?: TeamScore[];
};

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

export default function MoisPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const monthConfig = getMonthBySlug(slug);

  const [players, setPlayers] = useState<Player[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [teams, setTeams] = useState<NBATeam[]>([]);
  const [teamsSource, setTeamsSource] = useState<"api" | "static" | null>(null);
  const [standings, setStandings] = useState<Record<number, { wins: number; losses: number }>>({});
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<{ team: NBATeam; prediction: "W" | "L" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftModeChoice, setDraftModeChoice] = useState<"regular" | "snake" | null>(null);
  const [orderChoice, setOrderChoice] = useState<number[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const year = monthConfig?.year ?? 0;
  const month = monthConfig?.month ?? 0;

  const fetchDraft = useCallback(async () => {
    if (!year || !month) return;
    setError("");
    try {
      const res = await fetch(`/api/draft?year=${year}&month=${month}`);
      const data = await res.json();
      setPlayers(data.players ?? []);
      setDraft(data.draft ?? null);
      setPicks(data.picks ?? []);
      setTeams(data.teams ?? []);
      setTeamsSource(data.teamsSource ?? null);
      setStandings(data.standings ?? {});
    } catch {
      setError("Erreur chargement draft.");
    }
  }, [year, month]);

  const fetchScores = useCallback(async () => {
    if (!year || !month) return;
    try {
      const res = await fetch(`/api/scores?year=${year}&month=${month}`);
      const data = await res.json();
      setScoreRows(data.scoreRows ?? []);
    } catch {
      // ignore
    }
  }, [year, month]);

  const loadAll = useCallback(async () => {
    if (!monthConfig) {
      setLoading(false);
      return;
    }
    setLoading(true);
    await Promise.all([fetchDraft(), fetchScores()]);
    setLoading(false);
  }, [monthConfig, fetchDraft, fetchScores]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const startDraft = async (mode: "regular" | "snake", draftOrder: number[] | null) => {
    if (!year || !month) return;
    setError("");
    setSaving(true);
    try {
      const body: { draft_mode: "regular" | "snake"; year: number; month: number; draft_order?: number[] } = {
        draft_mode: mode,
        year,
        month,
      };
      if (draftOrder != null && draftOrder.length === 4) {
        body.draft_order = draftOrder;
      }
      const res = await fetch("/api/draft/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      await loadAll();
      setDraftModeChoice(null);
      setOrderChoice(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const cancelDraft = async () => {
    if (!draft || !window.confirm("Annuler la draft en cours ? Les choix seront supprimés.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/draft/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur");
        return;
      }
      setError("");
      await loadAll();
    } catch {
      setError("Erreur réseau");
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

  const seedMonth = async () => {
    if (!slug) return;
    setSeeding(true);
    setError("");
    try {
      const res = await fetch("/api/draft/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      await loadAll();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSeeding(false);
    }
  };

  const refreshScores = async () => {
    if (!year || !month) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/games/sync-bbref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors du rafraîchissement des scores.");
        return;
      }
      await fetchScores();
    } catch {
      setError("Erreur réseau");
    } finally {
      setRefreshing(false);
    }
  };

  if (!monthConfig) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="text-neutral-500">Mois inconnu.</p>
        <Link href="/" className="text-accent underline">Retour à l’accueil</Link>
      </div>
    );
  }

  const fullName = monthConfig.fullName;
  const orderChoiceValid = orderChoice != null && orderChoice.length === 4 && orderChoice.every((i) => i >= 0 && i <= 3) && new Set(orderChoice).size === 4;
  const setOrderAt = (pos: number, playerIndex: number) => {
    setOrderChoice((prev) => {
      const next = prev ? [...prev] : [-1, -1, -1, -1];
      next[pos] = playerIndex;
      return next;
    });
  };
  /** Pour le select d’ordre : indices déjà choisis aux autres positions (pour exclure des options). */
  const chosenIndicesExcept = (pos: number) =>
    (orderChoice ?? []).filter((_, p) => p !== pos).filter((i) => i >= 0);
  // Total affiché = nombre réel de bons paris (sans plafond), pour correspondre aux points par équipe
  const scoreByPlayerId = new Map(scoreRows.map((r) => [r.player_id, r.raw_correct]));
  const teamScoresByPlayerId = new Map(
    scoreRows.map((r) => [r.player_id, r.teamScores ?? []])
  );
  const draftCompleted = draft?.status === "completed";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-neutral-500">Chargement…</p>
      </div>
    );
  }

  const draftedIds = new Set(picks.map((p) => p.nba_team_id));
  const currentTurn = draft ? getCurrentTurn(draft, players, picks.length) : null;
  const hasNoDraft = !draft;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {fullName}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Matchs du {getMonthDateRange(monthConfig).from} au {getMonthDateRange(monthConfig).to}
          </p>
        </div>
        {draftCompleted && (
          <button
            type="button"
            onClick={refreshScores}
            disabled={refreshing}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 disabled:opacity-50 active:scale-[0.98]"
          >
            {refreshing ? "Rafraîchissement…" : "Rafraîchir les scores"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {hasNoDraft && (
        <div className="space-y-4">
          {["nov", "dec", "fev"].includes(slug) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800 mb-2">
                Simulation : créer la draft de {fullName} avec les 28 picks pré-remplis.
              </p>
              <button
                type="button"
                onClick={seedMonth}
                disabled={seeding}
                className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {seeding ? "Création…" : `Simuler la draft ${fullName}`}
              </button>
            </div>
          )}
          {draftModeChoice == null ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDraftModeChoice("regular")}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 active:scale-[0.98]"
              >
                Nouvelle draft {fullName} — Classique (A→B→C→D…)
              </button>
              <button
                type="button"
                onClick={() => setDraftModeChoice("snake")}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition hover:bg-neutral-50 active:scale-[0.98]"
              >
                Nouvelle draft {fullName} — Serpent (A→B→C→D→D→C→B→A…)
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
              <p className="mb-3 text-sm text-neutral-600">
                Ordre A→B→C→D — {draftModeChoice === "snake" ? "Serpent" : "Classique"}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {["A", "B", "C", "D"].map((letter, pos) => {
                  const taken = chosenIndicesExcept(pos);
                  const currentVal = orderChoice?.[pos];
                  return (
                    <label key={letter} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-neutral-600">{letter}</span>
                      <select
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-neutral-900"
                        value={currentVal != null && currentVal >= 0 ? currentVal : ""}
                        onChange={(e) => setOrderAt(pos, parseInt(e.target.value, 10))}
                      >
                        <option value="">—</option>
                        {players.map((pl, idx) =>
                          taken.includes(idx) && currentVal !== idx ? null : (
                            <option key={pl.id} value={idx}>{pl.name}</option>
                          )
                        )}
                      </select>
                    </label>
                  );
                })}
                <button
                  type="button"
                  onClick={() => startDraft(draftModeChoice, orderChoiceValid ? orderChoice : null)}
                  disabled={saving || !orderChoiceValid}
                  className="rounded-2xl bg-accent px-5 py-2.5 font-medium text-white shadow-card transition hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? "…" : "Lancer la draft"}
                </button>
                <button
                  type="button"
                  onClick={() => { setDraftModeChoice(null); setOrderChoice(null); }}
                  className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50"
                >
                  Changer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {draft && (
        <>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-900">Tableau de draft — {picks.length}/28</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="pb-2 pr-3">Joueur</th>
                    <th className="pb-2 pr-2 w-8">Type</th>
                    <th className="pb-2">Équipes</th>
                    {draftCompleted && (
                      <th className="pb-2 pl-2 text-right">Score total</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {players.map((pl) => {
                    const playerPicks = picks.filter((p) => p.player_id === pl.id);
                    const byPrediction = {
                      W: playerPicks.filter((p) => p.prediction === "W").sort((a, b) => a.pick_order - b.pick_order),
                      L: playerPicks.filter((p) => p.prediction === "L").sort((a, b) => a.pick_order - b.pick_order),
                    };
                    const isCurrentTurn = currentTurn?.player.id === pl.id;
                    const teamScores = teamScoresByPlayerId.get(pl.id) ?? [];
                    const teamScoreFor = (abbr: string, pred: string) =>
                      teamScores.find((ts) => ts.nba_team_abbreviation === abbr && ts.prediction === pred);
                    const totalScore = scoreByPlayerId.get(pl.id);
                    const renderTeams = (predList: Pick[]) =>
                      predList.length === 0
                        ? "—"
                        : (
                            <span className="flex flex-wrap items-center gap-1">
                              {predList.map((p) => {
                                const abbr = p.nba_team_abbreviation ?? teams.find((t) => t.id === p.nba_team_id)?.abbreviation ?? String(p.nba_team_id);
                                const ts = draftCompleted ? teamScoreFor(abbr, p.prediction) : null;
                                const pts = ts?.points ?? null;
                                const games = ts?.games ?? [];
                                return (
                                  <span key={p.id} className="relative inline-flex items-center gap-0.5 group">
                                    <img src={nbaTeamLogoUrl(abbr)} alt="" className="h-5 w-5 rounded-full object-contain" />
                                    <span>{abbr}{pts != null ? ` (${pts})` : ""}</span>
                                    {games.length > 0 && (
                                      <div className="pointer-events-none absolute left-0 bottom-full z-50 mb-1 hidden min-w-[240px] rounded-lg border border-neutral-200 bg-white p-2 shadow-lg text-left text-xs group-hover:block">
                                        <div className="font-medium text-neutral-500 mb-1">Matchs</div>
                                        {games.map((gm, i) => {
                                          const d = gm.game_date ? new Date(gm.game_date) : null;
                                          const dateStr = d ? `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}` : "";
                                          return (
                                            <div key={i} className="flex items-center gap-1.5 py-0.5 border-b border-neutral-100 last:border-0">
                                              {dateStr && <span className="text-neutral-400 shrink-0 w-8">{dateStr}</span>}
                                              <img src={nbaTeamLogoUrl(gm.home_abbreviation)} alt="" className="h-4 w-4 rounded-full object-contain shrink-0" />
                                              <span>{gm.home_abbreviation}</span>
                                              <span className="text-neutral-400">–</span>
                                              <img src={nbaTeamLogoUrl(gm.visitor_abbreviation)} alt="" className="h-4 w-4 rounded-full object-contain shrink-0" />
                                              <span>{gm.visitor_abbreviation}</span>
                                              <span className="ml-1 font-bold text-neutral-900">{gm.winner_abbreviation}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </span>
                                );
                              })}
                            </span>
                          );
                    return (
                      <Fragment key={pl.id}>
                        <tr className={`border-t border-neutral-100 ${isCurrentTurn ? "bg-accent/5" : ""}`}>
                          <td className="py-1.5 pr-3 font-medium text-neutral-900">
                            {isCurrentTurn && <span className="mr-1">→ </span>}
                            <span className={isCurrentTurn ? "font-bold" : ""}>{pl.name}</span>
                          </td>
                          <td className="py-1.5 pr-2 text-neutral-500">W</td>
                          <td className="py-1.5 text-neutral-600">
                            {renderTeams(byPrediction.W)}
                          </td>
                          {draftCompleted && (
                            <td rowSpan={2} className="py-1.5 pl-2 text-right font-semibold text-accent align-top">
                              {totalScore != null ? totalScore : "—"}
                            </td>
                          )}
                        </tr>
                        <tr className={`border-t border-neutral-100 ${isCurrentTurn ? "bg-accent/5" : ""}`}>
                          <td className="py-1.5 pr-3 font-medium text-neutral-900"></td>
                          <td className="py-1.5 pr-2 text-neutral-500">L</td>
                          <td className="py-1.5 text-neutral-600">
                            {renderTeams(byPrediction.L)}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {draft.status === "draft" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={cancelDraft}
                disabled={saving}
                className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Annuler la draft
              </button>
            </div>
          )}

          {teams.length === 0 && draft.status === "draft" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Les équipes NBA n’ont pas pu être chargées.
            </div>
          )}

          {draft.status === "draft" && teams.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {teams
                .filter((team) => !draftedIds.has(team.id) || selecting?.team.id === team.id)
                .map((team) => {
                  const picked = draftedIds.has(team.id);
                  const isActive = selecting?.team.id === team.id;
                  const canPick = currentTurn && !picked;
                  const fullNameTeam = team.full_name ?? `${team.city} ${team.name}`;
                  return (
                    <div
                      key={team.id}
                      className={`flex flex-col gap-1.5 rounded-xl border p-2 text-left transition ${
                        isActive
                          ? "cursor-default border-accent bg-accent/10 ring-2 ring-accent shadow-card"
                          : picked
                            ? "cursor-default border-neutral-200 bg-neutral-100 opacity-60"
                            : canPick
                              ? "cursor-pointer border-neutral-300 bg-white shadow-card hover:border-accent hover:shadow-card-hover active:scale-[0.98]"
                              : "cursor-default border-neutral-200 bg-neutral-50"
                      }`}
                    >
                      <button
                        type="button"
                        disabled={(picked && !isActive) || !currentTurn}
                        onClick={() => {
                          if (!canPick && !isActive) return;
                          if (isActive) return;
                          setSelecting({ team, prediction: "W" });
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <img
                          src={nbaTeamLogoUrl(team.abbreviation)}
                          alt=""
                          className="h-7 w-7 shrink-0 rounded-full object-contain bg-neutral-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold leading-tight text-neutral-900">
                            {team.abbreviation ?? team.full_name}
                          </div>
                          <div className="truncate text-[10px] text-neutral-500">
                            ({fullNameTeam})
                          </div>
                        </div>
                      </button>
                      {isActive && currentTurn && (
                        <div className="flex flex-wrap gap-1 border-t border-neutral-200 pt-1.5">
                          <button
                            type="button"
                            onClick={() => makePick(currentTurn.player.id, team, "W")}
                            disabled={saving}
                            className="flex-1 rounded-lg bg-green-500 px-2 py-1 text-xs font-medium text-white transition hover:bg-green-600 disabled:opacity-50"
                          >
                            W
                          </button>
                          <button
                            type="button"
                            onClick={() => makePick(currentTurn.player.id, team, "L")}
                            disabled={saving}
                            className="flex-1 rounded-lg bg-red-500 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                          >
                            L
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelecting(null)}
                            className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
