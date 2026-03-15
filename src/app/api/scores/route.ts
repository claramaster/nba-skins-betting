import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? new Date().getFullYear();
  const month = searchParams.get("month") ?? new Date().getMonth() + 1;

  const { data: draft } = await supabase
    .from("drafts")
    .select("id")
    .eq("year", Number(year))
    .eq("month", Number(month))
    .maybeSingle();

  if (!draft) {
    return NextResponse.json({
      monthlyScores: [],
      xMatchCount: 0,
      picks: [],
      players: [],
    });
  }

  const [{ data: picks }, { data: monthlyScores }, { data: gameResults }] = await Promise.all([
    supabase
      .from("draft_picks")
      .select("*, players(id, name, slug)")
      .eq("draft_id", draft.id),
    supabase.from("monthly_scores").select("*").eq("draft_id", draft.id),
    supabase
      .from("game_results")
      .select("*")
      .eq("draft_id", draft.id)
      .order("game_date", { ascending: true }),
  ]);

  const players = [...new Map((picks ?? []).map((p) => [p.player_id, (p as { players: { id: string; name: string; slug: string } }).players])).values()].filter(Boolean);

  type PickRow = {
    player_id: string;
    nba_team_id: number;
    prediction: string;
    players: { id: string; name: string; slug: string };
  };
  const pickList = (picks ?? []) as PickRow[];

  const matchCountByPlayer: Record<string, number> = {};
  const correctByPlayer: Record<string, number> = {};
  for (const pl of players) {
    matchCountByPlayer[pl.id] = 0;
    correctByPlayer[pl.id] = 0;
  }

  const playerTeamIds: Record<string, Set<number>> = {};
  for (const p of pickList) {
    if (!playerTeamIds[p.player_id]) playerTeamIds[p.player_id] = new Set();
    playerTeamIds[p.player_id].add(p.nba_team_id);
  }

  const gamesWithWinner = (gameResults ?? []).filter((g) => g.winner_team_id != null);

  for (const g of gamesWithWinner) {
    const winnerId = g.winner_team_id!;
    for (const pl of players) {
      const teamIds = playerTeamIds[pl.id];
      if (!teamIds) continue;
          const hasHome = teamIds.has(g.home_team_id);
      const hasVisitor = teamIds.has(g.visitor_team_id);
      if (!hasHome && !hasVisitor) continue;
      const ownedTeamId = hasHome ? g.home_team_id : g.visitor_team_id;
      const pick = pickList.find(
        (p) => p.player_id === pl.id && p.nba_team_id === ownedTeamId
      );
      if (!pick) continue;
      matchCountByPlayer[pl.id] = (matchCountByPlayer[pl.id] ?? 0) + 1;
      const won = winnerId === ownedTeamId;
      if ((pick.prediction === "W" && won) || (pick.prediction === "L" && !won)) {
        correctByPlayer[pl.id] = (correctByPlayer[pl.id] ?? 0) + 1;
      }
    }
  }

  const finalized = (monthlyScores ?? []).length > 0;

  type PickWithAbbr = PickRow & { nba_team_abbreviation?: string | null };
  const picksWithAbbr = pickList as PickWithAbbr[];

  const scoreRows = players.map((pl) => {
    const playerPicks = picksWithAbbr.filter((p) => p.player_id === pl.id);
    const pointsByPick = new Map<string, number>();
    for (const pick of playerPicks) {
      pointsByPick.set(`${pick.nba_team_id}-${pick.prediction}`, 0);
    }
    for (const g of gamesWithWinner) {
      const teamIds = playerTeamIds[pl.id];
      if (!teamIds) continue;
      const hasHome = teamIds.has(g.home_team_id);
      const hasVisitor = teamIds.has(g.visitor_team_id);
      if (!hasHome && !hasVisitor) continue;
      const ownedTeamId = hasHome ? g.home_team_id : g.visitor_team_id;
      const pick = pickList.find(
        (p) => p.player_id === pl.id && p.nba_team_id === ownedTeamId
      );
      if (!pick) continue;
      const won = g.winner_team_id === ownedTeamId;
      const isCorrect = (pick.prediction === "W" && won) || (pick.prediction === "L" && !won);
      if (isCorrect) {
        const key = `${pick.nba_team_id}-${pick.prediction}`;
        pointsByPick.set(key, (pointsByPick.get(key) ?? 0) + 1);
      }
    }

    const teamScores = playerPicks.map((p) => ({
      nba_team_abbreviation: p.nba_team_abbreviation ?? String(p.nba_team_id),
      prediction: p.prediction,
      points: pointsByPick.get(`${p.nba_team_id}-${p.prediction}`) ?? 0,
    }));

    const totalCorrect = correctByPlayer[pl.id] ?? 0;
    return {
      player_id: pl.id,
      player_name: pl.name,
      slug: pl.slug,
      raw_correct: totalCorrect,
      match_count: matchCountByPlayer[pl.id] ?? 0,
      score_count: totalCorrect,
      teamScores,
    };
  });

  return NextResponse.json({
    monthlyScores: monthlyScores ?? [],
    scoreRows,
    xMatchCount: 0,
    picks: pickList,
    players,
    draftId: draft.id,
    finalized,
  });
}
